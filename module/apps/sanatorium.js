import { stressDie } from "../helpers/dice.js";
import { log, sleep } from "../tools/tools.js";
import { getShiftedDate, seasonsDelta } from "../tools/time.js";
const TextEditor = foundry.applications.ux.TextEditor;

/**
 * Sanatorium Application
 * Manages the wound recovery interface for characters in the Ars Magica 5e system.
 * Handles tracking wounds across seasons, rolling recovery checks, and documenting healing progress.
 *
 * @extends foundry.applications.api.ApplicationV2
 */
export class Sanatorium extends foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.api.ApplicationV2
) {
  /**
   * Initialize the Sanatorium application.
   * @param {Actor} patient - The actor recovering from wounds
   * @param {Object} options - Optional configuration for the application
   */
  constructor(patient, options = {}) {
    super(options);
    this.patient = patient; // Actor document being treated
    this.object = {}; // Container for wound and recovery data
    this._initializeData(); // Setup initial state
  }

  /**
   * Factory method to create and display a Sanatorium instance for an actor.
   * @param {Actor} actor - The character to create a recovery session for
   * @returns {Promise<void>}
   */
  static async createDialog(actor) {
    const sanatorium = new Sanatorium(actor);
    const res = await sanatorium.render(true);
    actor.apps[sanatorium.appId] = sanatorium; // Register with actor's app management
  }

  static DEFAULT_OPTIONS = {
    id: "sanatorium",
    classes: ["arm5e", "sanatorium-sheet"],
    window: {
      title: "Sanatorium",
      icon: "fas fa-hospital",
      resizable: true
    },
    position: {
      width: 600,
      height: 800
    },
    form: {
      handler: Sanatorium.#onSubmitHandler,
      submitOnChange: true,
      closeOnSubmit: false
    }
  };

  static PARTS = {
    header: {
      template: "systems/arm5e/templates/generic/parts/sanatorium-header.hbs"
    },
    form: {
      template: "systems/arm5e/templates/generic/sanatorium.hbs",
      scrollable: [".prosemirror-section"]
    },
    footer: {
      template: "systems/arm5e/templates/generic/parts/sanatorium-footer.hbs"
    }
  };

  /**
   * Handle form submissions - updates the internal state when form data changes.
   * @private
   * @param {Event} event - The submission event
   * @param {HTMLFormElement} form - The form element
   * @param {FormData} formData - The form data
   */
  static async #onSubmitHandler(event, form, formData) {
    const expanded = foundry.utils.expandObject(formData.object);
    foundry.utils.mergeObject(this.object, expanded, { recursive: true });
    this.render();
  }

  /**
   * Initialize the recovery session data structure.
   * Sets up year/season, modifiers, and loads wounds from the patient.
   * @private
   */
  _initializeData() {
    const datetime = game.settings.get("arm5e", "currentDate");
    this.object.seasons = CONFIG.ARM5E.seasons;
    this.object.curYear = datetime.year;
    this.object.curSeason = datetime.season;

    // Recovery modifiers that can be applied to rolls
    this.object.modifiers = {
      mundaneHelp: 0, // Mundane assistance bonus
      magicalHelp: 0, // Magical assistance bonus
      activeEffect: 0, // Active effect bonuses (e.g., spells)
      labHealth: 0 // Linked sanctum/lab bonus
    };

    this.object.log = ""; // HTML log of recovery events
    this.object.wounds = {}; // Wounds organized by type
    this.object.woundPenalty = this.patient.system.penalties.wounds.total;
    this.object.health = {
      wounded: 0,
      incap: 0
    };
    this.object.availableDays = CONFIG.ARM5E.recovery.daysInSeason;
    this.object.hasWounds = false;
    this.object.nextRecoveryPeriod = 0;
    this.object.dateChange = "disabled"; // Locked after first roll
    this.prepareWounds();
  }

  /**
   * Prepare the rendering context with calculated display values and state flags.
   * Determines which UI elements should be enabled/disabled based on current state.
   * @private
   * @returns {Promise<Object>} Context object for template rendering
   */
  async _prepareContext() {
    const context = foundry.utils.deepClone(this.object);
    const patient = this.patient;
    context.patient = patient;
    context.canRoll = ""; // Enabled by default, disabled in terminal states
    context.diary = "disabled"; // Diary button disabled by default
    context.modifiers.activeEffect = patient.system.bonuses.traits.recovery;
    context.config = CONFIG;

    // Add sanctum/lab bonuses if patient has linked facility
    if (patient.system.isMagus && patient.system.sanctum.linked) {
      const lab = patient.system.sanctum.document;
      context.modifiers.labHealth = lab.system.health.total;
    }

    // Calculate display values for progress tracking
    context.curSeasonLabel = game.i18n.localize(CONFIG.ARM5E.seasons[context.curSeason].label);
    context.daysLeft = context.availableDays - context.nextRecoveryPeriod;

    // Build progress bar CSS
    context.progressbarStyle = `style="width:${Math.round(
      (context.nextRecoveryPeriod / context.availableDays) * 100
    )}%;"`;
    context.daysLeftLabel = game.i18n.format("arm5e.sanatorium.daysLeft", {
      days: context.daysLeft
    });

    // Check terminal states and update UI accordingly
    if (context.wounds["dead"] && context.wounds["dead"].length > 0) {
      // Patient is dead - no recovery, diary only
      context.log += await TextEditor.enrichHTML(
        `<br/><p><b>${game.i18n.localize("arm5e.sanatorium.msg.patientDead")}</b></p>`,
        { async: true }
      );
      context.canRoll = "disabled";
      context.diary = ""; // Enable diary to document death
    } else if (
      // Patient is fully healthy - no active wounds
      Object.entries(context.wounds).filter(
        (e) => CONFIG.ARM5E.recovery.wounds[e[0]].rank > 0 && e[1] != []
      ).length == 0
    ) {
      context.canRoll = "disabled";
      context.diary = "disabled";
      context.log += await TextEditor.enrichHTML(
        `<br/><p><b>${game.i18n.localize("arm5e.sanatorium.msg.patientHealthy")}</b></p>`,
        { async: true }
      );
    }

    // Handle states where there are no wounds to treat this season
    if (!context.hasWounds) {
      if (context.daysLeft == 0) {
        // Season finished - enable diary
        context.diary = "";
      } else if (context.daysLeft == context.availableDays) {
        // Season just started - log initial message
        context.log += await TextEditor.enrichHTML(
          `<br/><p><b>${game.i18n.localize("arm5e.sanatorium.msg.logDone")}</b></p>`,
          { async: true }
        );
      }
      context.canRoll = "disabled";
    }
    return context;
  }

  /**
   * Attach event listeners after DOM rendering.
   * @private
   * @param {Object} context - Rendering context
   * @param {Object} options - Render options
   */
  _onRender(context, options) {
    // Auto-select text in input fields when focused (for easy modification)
    const selectElements = this.element.querySelectorAll(".select-on-focus");
    selectElements.forEach((el) => {
      el.addEventListener("focus", (ev) => {
        ev.preventDefault();
        ev.currentTarget.select();
      });
    });

    // Bind recovery roll button to main game mechanic
    const recoveryBtn = this.element.querySelector(".recovery-roll");
    if (recoveryBtn) {
      recoveryBtn.addEventListener("click", (ev) => this._recoveryRoll(ev));
    }

    // Bind diary entry button to finalization method
    const diaryBtn = this.element.querySelector(".diary-entry");
    if (diaryBtn) {
      diaryBtn.addEventListener("click", (ev) => this._createDiaryEntry(ev));
    }
  }

  /**
   * Create a diary entry documenting the recovery session.
   * Updates wounds with recovery notes and creates an activity log entry.
   * @async
   * @private
   * @param {Event} event - The click event from diary button
   */
  async _createDiaryEntry(event) {
    event.preventDefault();

    let updatePatientWounds = [];
    // Create header showing the season/year for this recovery session
    const dateHeasder = `<h3>${game.i18n.localize(
      CONFIG.ARM5E.seasons[this.object.curSeason].label
    )} ${this.object.curYear}</h3><br/>`;

    // Update all wounds with recovery notes and date header
    for (let [type, wounds] of Object.entries(this.object.wounds)) {
      for (let wound of wounds) {
        let currentWound = this.patient.items.get(wound._id);
        let data = {};
        data.system = wound;
        data.system.gravity = type; // Update wound type based on recovery
        // Append recovery notes to wound description
        data.system.description = currentWound.system.description + dateHeasder + wound.description;
        data.name = wound.name;
        data.img = wound.img;
        data._id = wound._id;
        updatePatientWounds.push(data);
      }
    }
    // Update wounds in patient document
    let updatedWounds = await this.patient.updateEmbeddedDocuments("Item", updatePatientWounds, {
      recursive: true
    });

    // Create a diary entry to document the recovery session
    const entryData = {
      name: game.i18n.localize("arm5e.activity.title.recovery"),
      type: "diaryEntry",
      system: {
        cappedGain: false,
        dates: [
          { season: this.object.curSeason, year: Number(this.object.curYear), applied: false }
        ],
        sourceQuality: 0,
        activity: "recovery",
        done: true, // Mark recovery as complete
        progress: {
          abilities: [],
          arts: [],
          spells: [],
          newSpells: []
        },
        duration: 1,
        description: this.object.log // Store full recovery log
      }
    };

    // Create the diary entry and open it for review
    let entry = await this.patient.createEmbeddedDocuments("Item", [entryData], {});
    entry[0].sheet.render(true);

    // Clean up and close the Sanatorium window
    delete this.patient.apps[this.appId];
    await sleep(100);
    await this.close();
  }

  /**
   * Execute recovery rolls for all wounds.
   * This is the core game mechanic - determines wound progression based on stamina checks.
   * Handles all wound types and generates detailed recovery log.
   * @async
   * @private
   * @param {Event} event - The click event from recovery roll button
   */
  async _recoveryRoll(event) {
    event.preventDefault();
    const patient = this.patient;
    let recoverylog = this.object.log;
    // Lock UI after first roll to prevent date changes mid-session
    let dateChange = "disabled";
    let currentPenalty = patient._getWoundPenalty(this.object.wounds);

    // Initialize container for updated wounds (organized by type)
    let newWounds = {
      healthy: [], // Fully healed
      light: [], // Light wounds
      medium: [], // Medium wounds
      heavy: [], // Heavy wounds
      incap: [], // Incapacitating wounds (special handling)
      dead: [] // Fatal/mortal wounds
    };

    // Build dataset for recovery roll - Stamina characteristic check
    let dataset = {
      roll: "char",
      name: "Recovery",
      characteristic: "sta", // Uses Stamina for recovery
      txtoption1: game.i18n.localize("arm5e.sanatorium.recoveryBonus"),
      option1: this.object.modifiers.activeEffect, // Active effect bonuses
      txtoption2: game.i18n.localize("arm5e.sanatorium.mundaneHelp"),
      option2: this.object.modifiers.mundaneHelp, // Mundane care assistance
      txtoption3: game.i18n.localize("arm5e.sanatorium.magicalHelp"),
      option3: this.object.modifiers.magicalHelp, // Magical assistance
      txtoption4: game.i18n.localize("arm5e.sanatorium.labHealth"),
      option4: this.object.modifiers.labHealth, // Sanctum/Lab bonus
      txtoption5: game.i18n.localize("arm5e.messages.die.bonus"),
      option5: 0, // Wound-specific bonus (varies by wound)
      physicalcondition: false,
      mode: CONFIG.ARM5E.recovery.rollMode
    };
    let tmpPeriod = 1000; // Track next recovery roll timing (in days)
    let incapacited = false; // Flag if an incapacitating wound was treated
    let logDayAdded = false; // Flag to avoid duplicate day headers in log
    this.object.hasWounds = false; // Reset wound flag

    // PROCESS INCAPACITATING WOUNDS FIRST
    // Incapacitating wounds have special mechanics and affect other wound treatment
    if (this.object.wounds["incap"] && this.object.wounds["incap"].length > 0) {
      for (let incap of this.object.wounds["incap"]) {
        // Skip wounds that aren't ready to be rolled yet or are locked for the season
        if (incap.nextRoll > this.object.nextRecoveryPeriod || incap.locked) {
          log(false, `Next roll ${incap.nextRoll} > ${this.object.nextRecoveryPeriod} or locked`);
          if (!incap.locked) {
            // Track the next available roll time across all wounds
            tmpPeriod = tmpPeriod < incap.nextRoll ? tmpPeriod : incap.nextRoll;
            this.object.hasWounds = true; // Mark that more rolls are available
          }
          newWounds["incap"].push(incap);
          continue;
        }
        let woundPeriodDescription = "";
        let newWound = foundry.utils.deepClone(incap);
        dataset.option5 = incap.bonus; // Wound-specific bonus to roll

        // Determine which type of check this incap wound needs
        // Based on trend: improving (-1), stable (0), or worsening (1)
        let newType = "incap";
        if (incap.trend == -1) {
          // Wound was improving - check for improvement to Heavy
          newType = "heavy";
        } else if (incap.trend == 1) {
          // Wound was worsening - check for worsening to Dead
          newType = "dead";
        } else {
          // Wound was stable - remains Incapacitating but checked for stability
          incapacited = true; // Mark that an incap was treated
        }

        patient.rollInfo.init(dataset, patient);

        // Perform the recovery roll (Stamina characteristic check)
        const msg = await stressDie(
          patient,
          dataset.roll,
          4, // Non-interactive roll (no player choice)
          undefined,
          1 // One botch die
        );
        const roll = msg.rolls[0];
        // Add day header to log if not already added (prevents duplicate headers)
        if (!logDayAdded) {
          woundPeriodDescription += `<h4>${game.i18n.format("arm5e.sanatorium.msg.logDay", {
            day: this.object.nextRecoveryPeriod + 1
          })}</h4><ul>`;
          logDayAdded = true;
        }
        // Build log entry showing wound and roll results
        woundPeriodDescription +=
          `<li>${game.i18n.format("arm5e.sanatorium.msg.logWound", {
            type: game.i18n.localize("arm5e.sheet." + newType)
          })}` +
          `<br/>${game.i18n.format("arm5e.sanatorium.msg.logRoll", {
            total: roll.total,
            mod: roll.offset
          })} vs ${CONFIG.ARM5E.recovery.wounds[newType].improvement}<br/>`;

        // WOUND OUTCOME DETERMINATION
        // Compare roll against improvement threshold
        if (roll.total >= CONFIG.ARM5E.recovery.wounds[newType].improvement) {
          // SUCCESS: Wound improves
          woundPeriodDescription += `${game.i18n.format("arm5e.sanatorium.msg.logWoundBetter", {
            days: 0.5
          })}<br/>`;
          log(false, "Wound improvement");
          newWound.bonus = 0; // Bonus resets
          newWound.style = "improved"; // Visual indicator
          newWound.trend = -1; // Now improving
        } else if (roll.total >= CONFIG.ARM5E.recovery.wounds[newType].stability) {
          // PARTIAL SUCCESS: Wound stabilizes
          log(false, "Wound stable");
          woundPeriodDescription += `${game.i18n.localize(
            "arm5e.sanatorium.msg.logWoundStable"
          )}<br/>`;
          newWound.bonus = incap.bonus - 1; // Bonus decreases
          newWound.trend = 0; // Now stable
        } else {
          // FAILURE: Wound worsens
          newWound.trend = +1;
          log(false, "Wound worsened");
          woundPeriodDescription += `${game.i18n.format("arm5e.sanatorium.msg.logWoundWorse", {
            days: CONFIG.ARM5E.recovery.wounds[newType].interval
          })}`;
          newWound.trend = 1; // Now worsening
          newWound.bonus = 0; // Bonus resets
          newWound.style = "worsened"; // Visual indicator
        }
        woundPeriodDescription += "<br/></li>";
        newWound.img = CONFIG.ARM5E.recovery.wounds[newType].icon; // Update icon for new type

        // Update wound name if it was auto-generated (preserve custom names)
        let oldName = `${game.i18n.localize(
          CONFIG.ARM5E.recovery.wounds["incap"].label
        )} ${game.i18n.localize("arm5e.sheet.wound.label")}`;

        if (newWound.name == oldName) {
          // Auto-generated name - update to new type
          newWound.name = `${game.i18n.localize(
            CONFIG.ARM5E.recovery.wounds[newType].label
          )} ${game.i18n.localize("arm5e.sheet.wound.label")}`;
        }

        // Calculate next roll timing
        newWound.nextRoll = incap.nextRoll + CONFIG.ARM5E.recovery.wounds[newType].interval;
        // Track recovery time and first season data for statistics
        if (newWound.recoveryTime == 0) {
          newWound.daysFirstSeason = this.object.availableDays; // First treatment
        }
        newWound.recoveryTime += CONFIG.ARM5E.recovery.wounds[newType].interval;
        recoverylog += woundPeriodDescription;
        log(false, `Next roll: ${newWound.nextRoll}`);

        // Check if next roll is beyond current season
        if (newWound.nextRoll > this.object.availableDays) {
          log(false, `Locked for this season`);
          newWound.nextRoll -= this.object.availableDays; // Carry over to next season
          newWound.locked = true; // Cannot be treated this season
        } else {
          // More rolls available this season
          this.object.hasWounds = true;
          tmpPeriod = tmpPeriod < newWound.nextRoll ? tmpPeriod : newWound.nextRoll;
          log(false, `New Period: ${tmpPeriod}`);
        }
        newWound.description += woundPeriodDescription + "</ul>";
        newWounds[newType].push(newWound);
      }
    }
    // PROCESS OTHER WOUND TYPES (Light, Medium, Heavy)
    // These follow similar mechanics to incap but use different thresholds
    for (let type of Object.keys(CONFIG.ARM5E.recovery.wounds)) {
      if (type == "incap") {
        // Already processed above
        continue;
      } else if (type == "healthy") {
        // Healthy wounds are terminal state - just track them
        // Healthy wounds cannot be treated further
        for (let wound of this.object.wounds[type] ?? []) {
          wound.locked = true;
          newWounds[type].push(wound);
        }
      } else if (type == "dead") {
        // Dead wounds are terminal - patient is deceased
        for (let wound of this.object.wounds[type] ?? []) {
          wound.locked = true;
          newWounds[type].push(wound);
          // Log patient death and stop processing
          recoverylog += await TextEditor.enrichHTML(
            `<br/><p><b>${game.i18n.localize("arm5e.sanatorium.msg.patientDied")}</b></p>`,
            { async: true }
          );
          break; // Only one dead wound per patient
        }
      } else {
        // PROCESS LIGHT, MEDIUM, HEAVY WOUNDS
        for (let wound of this.object.wounds[type] ?? []) {
          // Check if this wound is ready for treatment this roll
          if (wound.nextRoll > this.object.nextRecoveryPeriod || wound.locked) {
            // Not ready yet - carry over to next roll
            log(false, `Next roll ${wound.nextRoll} > ${this.object.nextRecoveryPeriod} or locked`);
            if (!wound.locked) {
              tmpPeriod = tmpPeriod < wound.nextRoll ? tmpPeriod : wound.nextRoll;
              this.object.hasWounds = true;
            }
            newWounds[type].push(wound);
            continue;
          } else if (incapacited) {
            // If incap was treated, other wounds get delayed recovery time
            wound.nextRoll += 0.5; // Add half day delay
            tmpPeriod = tmpPeriod < wound.nextRoll ? tmpPeriod : wound.nextRoll;
            newWounds[type].push(wound);
          } else {
            // NORMAL WOUND TREATMENT
            // NORMAL WOUND TREATMENT
            let woundPeriodDescription = "";
            // Determine new wound type based on rank mapping and trend
            // Rank increases with treatment results: light->medium->heavy->incap->dead
            let newType =
              CONFIG.ARM5E.recovery.rankMapping[
                CONFIG.ARM5E.recovery.wounds[type].rank + wound.trend
              ];

            let newWound = foundry.utils.deepClone(wound);
            // Add day header once per recovery roll (prevents duplicates)
            if (!logDayAdded) {
              woundPeriodDescription += `<h4>${game.i18n.format("arm5e.sanatorium.msg.logDay", {
                day: this.object.nextRecoveryPeriod + 1
              })}</h4><ul>`;
              logDayAdded = true;
            }

            // Check if wound has healed
            if (newType == "healthy") {
              // HEALING: Wound is fully healed
              newWound.locked = true; // Terminal state

              // Log healing with total recovery time
              woundPeriodDescription += `${game.i18n.localize(
                "arm5e.sheet." + wound.originalGravity
              )} ${game.i18n.format("arm5e.sanatorium.msg.logHealed", {
                days: newWound.recoveryTime
              })}<br/>`;

              recoverylog += woundPeriodDescription;
              newWound.description += woundPeriodDescription + "</ul>";

              // Update to healthy state
              newWound.img = CONFIG.ARM5E.recovery.wounds[newType].icon;

              // Update name if auto-generated
              let oldName = `${game.i18n.localize(
                CONFIG.ARM5E.recovery.wounds[type].label
              )} ${game.i18n.localize("arm5e.sheet.wound.label")}`;

              if (newWound.name == oldName) {
                newWound.name = `${game.i18n.localize(
                  CONFIG.ARM5E.recovery.wounds[newType].label
                )} ${game.i18n.localize("arm5e.sheet.wound.label")}`;
              }

              // Record healing date for statistics
              newWound.healedDate = { year: this.object.curYear, season: this.object.curSeason };
              wound.nextRoll = 0;
              newWounds[newType].push(newWound);
              continue; // Move to next wound
            }

            // Setup and perform recovery roll for non-healed wound
            dataset.option5 = wound.bonus; // Use wound's current bonus
            patient.rollInfo.init(dataset, patient);

            // Perform Stamina check
            const msg = await stressDie(
              patient,
              dataset.roll,
              4, // Non-interactive roll
              undefined,
              1 // One botch die
            );
            const roll = msg.rolls[0];
            // Build log entry
            woundPeriodDescription +=
              `<li>${game.i18n.format("arm5e.sanatorium.msg.logWound", {
                type: game.i18n.localize("arm5e.sheet." + newType)
              })}` +
              `<br/>${game.i18n.format("arm5e.sanatorium.msg.logRoll", {
                total: roll.total,
                mod: roll.offset
              })} vs ${CONFIG.ARM5E.recovery.wounds[newType].improvement}<br/>`;

            // OUTCOME DETERMINATION FOR NON-INCAP WOUNDS
            if (roll.total >= CONFIG.ARM5E.recovery.wounds[newType].improvement) {
              // SUCCESS: Wound improves
              woundPeriodDescription += `${game.i18n.format("arm5e.sanatorium.msg.logWoundBetter", {
                days: CONFIG.ARM5E.recovery.wounds[newType].interval
              })}`;
              log(false, "Wound improvement");
              newWound.bonus = 0; // Reset bonus
              newWound.trend = -1; // Now improving
              newWound.style = "improved"; // Visual indicator
            } else if (roll.total >= CONFIG.ARM5E.recovery.wounds[newType].stability) {
              // PARTIAL SUCCESS: Wound stabilizes
              log(false, "Wound stable");
              woundPeriodDescription += `${game.i18n.localize(
                "arm5e.sanatorium.msg.logWoundStable"
              )}`;
              newWound.bonus = wound.bonus + 3; // Bonus increases
              newWound.trend = 0; // Now stable
            } else {
              // FAILURE: Wound worsens
              log(false, "Wound worsened");
              woundPeriodDescription += `${game.i18n.format("arm5e.sanatorium.msg.logWoundWorse", {
                days: CONFIG.ARM5E.recovery.wounds[newType].interval
              })}`;
              newWound.trend = 1; // Now worsening
              newWound.bonus = 0; // Reset bonus
              newWound.style = "worsened"; // Visual indicator
            }
            woundPeriodDescription += "<br/></li>";
            newWound.img = CONFIG.ARM5E.recovery.wounds[newType].icon;

            // Update name if auto-generated
            let oldName = `${game.i18n.localize(
              CONFIG.ARM5E.recovery.wounds[type].label
            )} ${game.i18n.localize("arm5e.sheet.wound.label")}`;

            if (newWound.name == oldName) {
              newWound.name = `${game.i18n.localize(
                CONFIG.ARM5E.recovery.wounds[newType].label
              )} ${game.i18n.localize("arm5e.sheet.wound.label")}`;
            }

            recoverylog += woundPeriodDescription;

            // Calculate next roll timing and accumulate recovery time
            newWound.nextRoll = wound.nextRoll + CONFIG.ARM5E.recovery.wounds[newType].interval;
            // Track first season recovery time for statistics
            if (newWound.recoveryTime == 0) {
              newWound.daysFirstSeason = this.object.availableDays;
            }
            newWound.recoveryTime += CONFIG.ARM5E.recovery.wounds[newType].interval;
            log(false, `Next roll: ${newWound.nextRoll}`);

            // Check if beyond current season
            if (newWound.nextRoll > this.object.availableDays) {
              log(false, `Locked for this season`);
              newWound.nextRoll -= this.object.availableDays; // Carry over to next season
              newWound.locked = true;
            } else {
              // More rolls available
              this.object.hasWounds = true;
              tmpPeriod = tmpPeriod < newWound.nextRoll ? tmpPeriod : newWound.nextRoll;
              log(false, `New Period: ${tmpPeriod}`);
            }
            newWound.description += woundPeriodDescription + "</ul>";
            newWounds[newType].push(newWound);
          }
        }
      }
    }
    // Final log entry - show current wound penalty
    recoverylog += `</u><br/><i>${this.patient._getWoundPenalty(
      this.object.wounds
    )} ${game.i18n.localize("arm5e.sheet.penalty")}</i>`;

    // Check if all rolls completed this season
    if (tmpPeriod == 1000) {
      // No more wounds to treat
      tmpPeriod = this.object.availableDays;
      recoverylog += `<p>${game.i18n.localize("arm5e.sanatorium.msg.logDone")}</p>`;
    }

    // Enrich HTML in log for proper formatting
    recoverylog = await TextEditor.enrichHTML(recoverylog, { async: true });

    // Update the object state directly
    this.object.wounds = newWounds;
    this.object.log = recoverylog;
    this.object.nextRecoveryPeriod = tmpPeriod;
    this.object.dateChange = dateChange;

    // Re-render to update UI
    this.render();
  }

  /**
   * Load and organize wounds from the patient actor.
   * Calculates treatment dates and determines which wounds can be treated this season.
   * @private
   */
  prepareWounds() {
    // Determine the appropriate starting date for this recovery session
    // Based on existing wounds and their recovery progress
    let currentTime = game.settings.get("arm5e", "currentDate");

    // Find the latest season affected by existing wounds
    for (let [type, wounds] of Object.entries(this.patient.system.wounds)) {
      if (type == "healthy") continue; // Skip healed wounds
      if (wounds.length > 0) {
        for (let wound of wounds) {
          let woundInflicted = wound.system.inflictedDate;

          // If wound has been treated before, shift the date forward
          if (wound.system.recoveryTime > 0) {
            let offset = Math.floor(
              (wound.system.recoveryTime -
                wound.system.daysFirstSeason +
                CONFIG.ARM5E.recovery.daysInSeason) /
                CONFIG.ARM5E.recovery.daysInSeason
            );
            woundInflicted = getShiftedDate(woundInflicted, offset);
          } else {
            // First time treating this wound - allow date changes
            this.object.dateChange = "";
          }

          // Track the latest season for treatment
          if (seasonsDelta(woundInflicted, currentTime) > 0) {
            currentTime = woundInflicted;
          }
        }
      }
    }
    // Set recovery session to the appropriate season
    this.object.curSeason = currentTime.season;
    this.object.curYear = currentTime.year;

    // Extract and organize wounds for UI display
    let minNextRoll = 1000; // Track earliest next roll opportunity
    for (let [type, wounds] of Object.entries(this.patient.system.wounds)) {
      if (type == "healthy") continue; // Skip healed wounds
      if (wounds.length > 0) {
        this.object.wounds[type] = [];
        for (let wound of wounds) {
          // Create local copy of wound data
          let w = wound.system.toObject();
          w._id = wound._id;
          w.name = wound.name;
          w.img = wound.img;
          w.description = ""; // Clear for new recovery session

          // Check if wound has already been treated this season
          if (!wound.system.canBeTreatedThisSeason(this.object.curSeason, this.object.curYear)) {
            // Cannot treat again this season
            w.locked = true;
          } else {
            // Can be treated
            w.locked = false;
            // Track the earliest next roll opportunity
            if (wound.system.nextRoll < minNextRoll) {
              minNextRoll = wound.system.nextRoll;
            }
            this.object.hasWounds = true; // Mark that wounds exist to treat
          }
          this.object.wounds[type].push(w);
        }
      }
    }

    // Set next recovery period based on wound data
    if (minNextRoll != 1000) {
      this.object.nextRecoveryPeriod = minNextRoll;
    }
  }
}
