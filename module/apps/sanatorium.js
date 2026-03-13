import { stressDie } from "../helpers/dice.js";
import { log, sleep } from "../tools/tools.js";
import { getShiftedDate, seasonsDelta } from "../tools/time.js";
const TextEditor = foundry.applications.ux.TextEditor;

/**
 * Sanatorium Application
 * Manages the wound recovery interface for characters in the Ars Magica 5e system.
 * Handles tracking wounds across seasons, rolling recovery checks, and documenting healing progress.
 *
 * ## Recovery modes
 * - **Standard** (`recoveryRoll` action): one recovery period at a time; the user clicks
 *   for each period and can inspect the log between rolls.
 * - **Fast** (`fastRecovery` action): automatically loops `_recoveryRoll` until no
 *   wounds remain to treat this season, then re-renders for diary creation.
 *
 * ## Incapacitating wound handling
 * Per ArM5 rules, incapacitating wounds are checked **twice per day** — at sunrise and at
 * sunset.  All due incap wounds share one stress die per sub-roll.  A result of ≤ 0 kills the
 * patient immediately (sunset skipped); ≥ improvement threshold trends the wound toward Heavy
 * (resolved — skips sunset); a stable result decrements the wound's bonus by 1 and carries
 * that degraded bonus into the sunset roll; a worsening roll on an already-worsening wound
 * → Dead (resolved).  State between the two sub-rolls is tracked via an `incapStates` array
 * built at the start of the period and committed to `newWounds` after both sub-rolls finish.
 *
 * ## Single-wound roll
 * External callers (e.g. the wound item sheet) can invoke `_recoveryRollSingle(woundId)`
 * to roll for one specific wound while leaving all others untouched.
 *
 * ## Overstrain
 * The static `_overstrainedRoll(actor)` can be called from anywhere to apply an
 * overstrain check: finds the actor's worst wound and degrades it on a failed Stamina roll.
 *
 * ## this.object shape
 * ```
 * {
 *   curSeason, curYear,       // active recovery session date
 *   availableDays,            // days remaining in the season for treatment (derived from dayOfSeason)
 *   nextRecoveryPeriod,       // day of the next pending roll
 *   hasWounds,                // true when ≥1 wound still needs a roll this season
 *   rollMode,                 // "none" | "standard" | "fast" (set during action dispatch)
 *   dateChange,               // "" | "disabled" — locks date inputs after first roll
 *   log,                      // accumulated HTML recovery log
 *   wounds,                   // { [gravityKey]: woundDataClone[] }
 *   modifiers: { mundaneHelp, magicalHelp, activeEffect, labHealth },
 *   woundPenalty, health
 * }
 * ```
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
    this.patient.apps[this.options.uniqueId] = this; // Register with actor's app management
    this._initializeData(); // Setup initial state

    // Listen for in-game date changes so the UI stays in sync.
    // Store the bound handler so it can be unregistered precisely on close.
    this._onDateChange = (newDate) => {
      if (!this.rendered) return;
      // The displayed session date (curYear/curSeason) is intentionally kept unchanged;
      // only moreSeasons (and related availability flags) needs to be recomputed,
      // which _prepareContext does live from game.settings — a plain re-render suffices.
      this.render();
    };
    Hooks.on("arm5e-date-change", this._onDateChange);
  }

  /**
   * Close the application and deregister it from the patient actor's app map.
   * @param {Object} [options] - Options forwarded to ApplicationV2#close
   * @returns {Promise<void>}
   */
  async close(options = {}) {
    if (this.patient.apps?.[this.options.uniqueId] != undefined) {
      delete this.patient.apps[this.options.uniqueId];
    }
    if (this._onDateChange) {
      Hooks.off("arm5e-date-change", this._onDateChange);
      this._onDateChange = null;
    }
    return super.close(options);
  }

  /**
   * Factory method to create and display a Sanatorium instance for an actor.
   * @param {Actor} actor - The character to create a recovery session for
   * @returns {Promise<void>}
   */
  static async createDialog(actor) {
    const sanatorium = new Sanatorium(actor);
    const res = await sanatorium.render(true);
  }

  static DEFAULT_OPTIONS = {
    id: "sanatorium",
    classes: ["arm5e", "sanatorium-sheet"],
    window: {
      title: "Sanatorium",
      icon: "fas fa-hospital",
      resizable: false,
      contentClasses: ["standard-form"]
    },
    position: {
      width: 600,
      height: "auto"
    },
    form: {
      handler: Sanatorium.#onSubmitHandler,
      submitOnChange: true,
      closeOnSubmit: false
    },
    tag: "form",
    actions: {
      recoveryRoll: Sanatorium.recoveryRoll,
      fastRecovery: Sanatorium.fastRecovery,
      createDiaryEntry: Sanatorium.createDiaryEntry,
      overstrainRoll: Sanatorium.overstrainRoll
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
    // Convert the user-editable "day of season" input into the internal availableDays value.
    // dayOfSeason = 1 means the wound was inflicted on the first day → full season available.
    if (expanded.dayOfSeason !== undefined) {
      const maxDays = CONFIG.ARM5E.recovery.daysInSeason[this.object.curSeason] ?? 91;
      const day = Math.max(1, Math.min(maxDays, Number(expanded.dayOfSeason)));
      expanded.dayOfSeason = day; // clamp
      expanded.availableDays = maxDays - day + 1;
    }
    foundry.utils.mergeObject(this.object, expanded, { recursive: true });
    this.render();
  }

  /**
   * Initialize the recovery session data structure.
   * Sets up year/season, modifiers, roll mode, and loads wounds from the patient.
   * Called once in the constructor; re-calling it would reset an in-progress session.
   * @private
   *
   * Sets `this.object.rollMode` to `"none"`.  The static action dispatchers
   * (`recoveryRoll`, `fastRecovery`) set it to `"standard"` / `"fast"` for the
   * duration of their call so that templates and internal helpers can branch on it.
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
    this.object.hasWounds = false;
    this.object.nextRecoveryPeriod = 0;
    this.object.dateChange = "disabled"; // Locked after first roll
    this.object.rollMode = "none"; // "none" | "standard" | "fast"
    this.object.penaltyDays = {}; // { [penalty]: totalDays } — for sustained-penalty report
    this.object.individualRollDone = false; // true after ≥1 _recoveryRollSingle, enables early diary
    this.object.individualRollMaxRank = undefined; // rank of last individually rolled wound (for padlock display)
    delete this._pendingSingleWoundId; // clear any pending single-wound target
    this.prepareWounds();
    // Set available days from per-season count now that curSeason is resolved by prepareWounds().
    this.object.availableDays = CONFIG.ARM5E.recovery.daysInSeason[this.object.curSeason] ?? 91;
    this.object.dayOfSeason = 1; // default: wound inflicted on first day of season (all days available)
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
    context.canOverstrain = ""; // Enabled by default; disabled for dead/healthy, after first roll, or during individual roll
    // Overstrain must not alter wound history once rolling has started, or during individual
    // wound recovery sessions (surgeon treating a specific wound only).
    if (context.dateChange === "disabled" || context.individualRollDone) {
      context.canOverstrain = "disabled";
    }
    // Determine whether more seasons of treatment remain after this one.
    const worldDate = game.settings.get("arm5e", "currentDate");
    context.moreSeasons =
      seasonsDelta({ season: context.curSeason, year: context.curYear }, worldDate) > 0;
    context.diaryLabel = context.moreSeasons
      ? "arm5e.astrolab.nextSeason"
      : "arm5e.sanatorium.button.endSeason";
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

    // Build progress bar CSS using the true full-season denominator so it always
    // shows 0–100 % correctly regardless of the available-days display mode.
    context.progressbarStyle = `style="width:${Math.round(
      (context.nextRecoveryPeriod / context.availableDays) * 100
    )}%;"`;
    context.daysLeftLabel = game.i18n.format("arm5e.sanatorium.daysLeft", {
      days: context.daysLeft
    });

    // When the field is read-only (dateChange = "disabled") the total-season value
    // stored in availableDays is meaningless to the user; show the actual remaining
    // days instead so the displayed number matches reality.
    // This override is done AFTER the progress bar so it doesn't corrupt that formula,
    // and AFTER daysLeft is calculated so the "season just started" check (which
    // compares daysLeft to the original availableDays) still works correctly.
    if (context.dateChange === "disabled") {
      context.availableDays = context.daysLeft;
    }

    // When an individual roll was made, mark rank-excluded wounds with a padlock
    // so the user can see they were not treated in that roll.
    // This only affects the display context (deep clone) — the real wound data is unchanged.
    if (context.individualRollDone && context.individualRollMaxRank !== undefined) {
      for (const [type, woundList] of Object.entries(context.wounds)) {
        const typeRank = CONFIG.ARM5E.recovery.wounds[type]?.rank ?? 0;
        if (typeRank > context.individualRollMaxRank) {
          for (const w of woundList) {
            if (!w.locked) {
              w.locked = true; // display-only: wound was excluded from the individual roll
            }
          }
        }
      }
    }

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
      context.canOverstrain = "disabled";
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
      } else if (context.nextRecoveryPeriod == 0) {
        // No rolls made yet - log initial "all done" hint
        context.log += await TextEditor.enrichHTML(
          `<br/><p><b>${game.i18n.localize("arm5e.sanatorium.msg.logDone")}</b></p>`,
          { async: true }
        );
      }
      context.canRoll = "disabled";
    } else if (context.individualRollDone) {
      // At least one individual wound roll has been made; allow the user to stop early
      // and commit the log as-is via the diary button.
      context.diary = "";
      context.diaryLabel = "arm5e.sanatorium.button.endRecovery";
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

    // Scroll the log editor to the bottom so the latest entries are visible
    const logEditor = this.element.querySelector(".prosemirror-section .editor-content");
    if (logEditor) {
      logEditor.scrollTop = logEditor.scrollHeight;
    }
  }

  /**
   * ApplicationV2 action: roll one recovery period for all due wounds.
   * Sets `rollMode` to `"standard"` for the duration so the template can disable
   * the Fast Recovery button while a roll is in progress.
   * @param {Event}       event  - The triggering click event
   * @param {HTMLElement} target - The button element
   */
  static async recoveryRoll(event, target) {
    if (this._pendingSingleWoundId) {
      // Opened from a wound sheet: roll only the targeted wound, then clear the sentinel.
      const woundId = this._pendingSingleWoundId;
      delete this._pendingSingleWoundId;
      await this._recoveryRollSingle(woundId);
    } else if (this.object.individualRollDone && this.object.individualRollMaxRank !== undefined) {
      // Continuation of a single-wound session (user clicked "Roll" again without ending
      // the session). Re-apply the same rank ceiling so higher-rank wounds stay excluded.
      this._singleRollMaxRank = this.object.individualRollMaxRank;
      this.object.rollMode = "standard";
      await this._recoveryRoll(event);
      this.object.rollMode = "none";
      delete this._singleRollMaxRank;
      this.render();
    } else {
      this.object.rollMode = "standard";
      await this._recoveryRoll(event);
      this.object.rollMode = "none";
    }
  }

  /**
   * ApplicationV2 action: auto-roll all remaining recovery periods for this season.
   * Sets `rollMode` to `"fast"` for the duration, which disables the button in the
   * template to prevent re-entrant calls.
   * @param {Event}       event  - The triggering click event
   * @param {HTMLElement} target - The button element
   */
  static async fastRecovery(event, target) {
    this.object.rollMode = "fast";
    await this._fastRecovery(event);
    this.object.rollMode = "none";
  }

  /**
   * ApplicationV2 action: commit the session log to a diary entry.
   * @param {Event}       event  - The triggering click event
   * @param {HTMLElement} target - The button element
   */
  static async createDiaryEntry(event, target) {
    await this._createDiaryEntry(event);
  }

  /**
   * ApplicationV2 action: run an overstrain check on the patient.
   * Delegates to the static `_overstrainedRoll` which finds the worst wound
   * and degrades it on a failed Stamina roll.
   * @param {Event}       event  - The triggering click event
   * @param {HTMLElement} target - The button element
   */
  static async overstrainRoll(event, target) {
    await Sanatorium._overstrainedRoll(this.patient);
    this.render();
  }

  /**
   * Fast recovery: automatically rolls all pending recovery periods in sequence
   * until no wounds remain to treat this season, then prompts for a diary entry.
   * @async
   * @private
   * @param {Event} event - The triggering event
   */
  async _fastRecovery(event) {
    // Prevent double-clicks from queuing a second run
    if (this._fastRecoveryRunning) return;
    this._fastRecoveryRunning = true;
    try {
      // Keep rolling until the season is exhausted or no wounds are left.
      // Use <= so a wound due on the very last day (nextRoll = availableDays) is
      // not skipped: after it rolls it gets locked, hasWounds becomes false, and
      // the loop exits normally on the next iteration check.
      while (this.object.hasWounds && this.object.nextRecoveryPeriod <= this.object.availableDays) {
        // Create a synthetic event object so _recoveryRoll can call preventDefault()
        const syntheticEvent = { preventDefault: () => {} };
        await this._recoveryRoll(syntheticEvent);
        // Short yield so the UI can breathe between rolls
        await new Promise((r) => setTimeout(r, 50));
      }
    } finally {
      this._fastRecoveryRunning = false;
    }
    // Automatically commit the session: create the diary entry and, if there are
    // more seasons to catch up on, reset for the next season via _createDiaryEntry.
    await this._createDiaryEntry({ preventDefault: () => {} });
  }

  /**
   * Roll recovery for a single wound identified by its item id.
   * All other wounds are carried over unchanged for this period.
   * Used by the wound item sheet "Roll recovery" button.
   * @async
   * @param {string} woundId - The `_id` of the wound item to roll for
   * @returns {Promise<void>}
   */
  async _recoveryRollSingle(woundId) {
    // ── Guard: incap wounds must be treated first ─────────────────────────────
    // Read directly from the actor's live data so session-state staleness (locked
    // flags set by previous rolls, wrong curSeason, etc.) cannot hide an incap wound.
    const liveIncapWounds = this.patient.system.wounds["incap"] ?? [];
    const hasUntreatedIncap = liveIncapWounds.some((w) =>
      w.system.canBeTreatedThisSeason(this.object.curSeason, this.object.curYear)
    );

    // Identify the target wound's gravity type from the actor's live data.
    let targetType = null;
    for (const [type, woundList] of Object.entries(this.patient.system.wounds)) {
      if ((woundList ?? []).some((w) => w._id === woundId)) {
        targetType = type;
        break;
      }
    }

    if (hasUntreatedIncap && targetType !== "incap") {
      ui.notifications.warn(game.i18n.localize("arm5e.sanatorium.msg.incapMustBeFirst"));
      return;
    }

    // ── Reset session display state ───────────────────────────────────────────
    // Clear log and flags so the UI shows a clean "before roll" state.
    // Lock dateChange immediately so overstrain is disabled for the entire individual-roll session.
    this.object.log = "";
    this.object.dateChange = "disabled";
    this.object.individualRollDone = false;
    this.object.individualRollMaxRank = undefined;
    await this.render();

    // Find the target wound's gravity rank from the session state (needed for _singleRollMaxRank).
    let targetRank = 0;
    for (const [type, woundList] of Object.entries(this.object.wounds)) {
      if (woundList.some((w) => w._id === woundId)) {
        targetRank = CONFIG.ARM5E.recovery.wounds[type]?.rank ?? 0;
        break;
      }
    }

    // Tell _recoveryRoll to skip any wound type with rank > targetRank.
    // Using a sentinel on `this` avoids mutating wound objects, which is fragile
    // across async rendering cycles.
    this._singleRollMaxRank = targetRank;
    const syntheticEvent = { preventDefault: () => {} };
    await this._recoveryRoll(syntheticEvent);
    // Healing is handled inline: if the wound improved to "healthy" it was committed
    // immediately during the roll, so no second pass is needed.

    delete this._singleRollMaxRank;
    this.object.individualRollDone = true;
    this.object.individualRollMaxRank = targetRank; // remember for padlock display in _prepareContext

    this.render();
  }

  // ─── Shared helpers ───────────────────────────────────────────────────────

  /**
   * Rename an auto-generated wound when its gravity changes.
   * Custom names (i.e. names the user has edited) are preserved.
   * @param {Object} wound      - The mutable wound data clone
   * @param {string} oldType    - The wound type before this roll (e.g. "heavy")
   * @param {string} newType    - The wound type after this roll (e.g. "medium")
   */
  _updateWoundName(wound, oldType, newType) {
    const autoName = (type) =>
      `${game.i18n.localize(CONFIG.ARM5E.recovery.wounds[type].label)} ${game.i18n.localize(
        "arm5e.sheet.wound.label"
      )}`;
    if (wound.name === autoName(oldType)) {
      wound.name = autoName(newType);
    }
  }

  /**
   * Append a "Day N" `<h4>…<ul>` header to logState.description if not already added.
   * Sets logState.logDayAdded = true so subsequent calls are no-ops within the same roll.
   * @param {Object} logState - Shared mutable log state for the current _recoveryRoll invocation
   * @param {number} dayNumber - The 1-based day number for the header (nextRecoveryPeriod + 1)
   */
  _openLogDaySection(logState, dayNumber) {
    if (!logState.logDayAdded) {
      logState.description += `<h4 style="font-size:10pt; margin-block-start:0.25em; margin-block-end:0.5em">${game.i18n.format(
        "arm5e.sanatorium.msg.logDay",
        {
          day: dayNumber
        }
      )}</h4><ul style="margin-block-start:0.25em; margin-block-end:0.5em">`;
      logState.logDayAdded = true;
    }
  }

  /**
   * Process a single Light/Medium/Heavy wound outcome and push the result into `newWounds`.
   *
   * This is a **standalone utility** that encapsulates the canonical outcome logic for
   * non-incap wounds.  Note that `_recoveryRoll` currently processes wounds inline for
   * performance and control flow reasons; this method is intended for callers that need
   * to evaluate a wound in isolation (e.g. `_recoveryRollSingle` variants, tests, or
   * future per-wound UI hooks).
   *
   * Incapacitating wounds are **not** handled here — they use a shared group roll in
   * `_recoveryRoll` with separate death/improve/stable/worsen branching.
   *
   * Mutates `wound` in place (style, bonus, trend, img, name, timing fields) and
   * appends to `logState.description`.
   *
   * @param {Object}  wound       - Mutable wound data clone
   * @param {string}  type        - Current wound gravity key (e.g. `"heavy"`)
   * @param {string}  newType     - Effective gravity key for this roll (after applying `trend`;
   *                                may equal `type`, or be `"healthy"` for an improving wound)
   * @param {number}  rollTotal   - Resolved total of the recovery stress die
   * @param {Object}  logState    - Shared mutable log state `{ description: string, logDayAdded: boolean }`
   * @param {Object}  newWounds   - Accumulator `{ [gravityKey]: woundDataClone[] }` to push into
   * @returns {boolean} Always `true`; wound has been pushed — caller must not push again
   */
  _processWoundRoll(wound, type, newType, rollTotal, logState, newWounds) {
    const wCfg = CONFIG.ARM5E.recovery.wounds[newType];

    if (newType === "healthy") {
      // Wound is fully healed – terminal state
      wound.locked = true;
      logState.description += `${game.i18n.localize(
        "arm5e.sheet." + wound.originalGravity
      )} ${game.i18n.format("arm5e.sanatorium.msg.logHealed", { days: wound.recoveryTime })}<br/>`;
      wound.img = wCfg.icon;
      this._updateWoundName(wound, type, newType);
      wound.healedDate = { year: this.object.curYear, season: this.object.curSeason };
      wound.nextRoll = 0;
      wound.description += logState.description + "</ul>";
      newWounds[newType].push(wound);
      return true;
    }

    // Build the per-wound log line
    logState.description +=
      `<li>${game.i18n.format("arm5e.sanatorium.msg.logWound", {
        type: game.i18n.localize("arm5e.sheet." + newType)
      })}` +
      `<br/>${game.i18n.format("arm5e.sanatorium.msg.logRoll", {
        total: rollTotal,
        mod: 0 // offset stored on the roll; callers may log it separately if needed
      })} vs ${wCfg.improvement}<br/>`;

    // Determine the gravity bucket the wound will be committed to after this roll.
    // Improvement moves one rank lighter; worsening moves one rank heavier.
    // Trend deferral: a first improvement/worsening sets trend (±1) and keeps the wound in its
    // current bucket so intermediate display is consistent.  On the wound's NEXT roll the
    // effective type (= rankMapping[rank + trend]) is already resolved, so a second trigger
    // commits to the new rank immediately.
    let worsened = false;
    let commitRank;
    if (rollTotal >= wCfg.improvement) {
      // Improvement
      logState.description += `${game.i18n.format("arm5e.sanatorium.msg.logWoundBetter", {
        days: wCfg.interval
      })}`;
      log(false, "Wound improvement");
      wound.bonus = 0;
      wound.style = "improved";
      if (wound.trend === 0) {
        // First improvement: defer gravity change, stay in current bucket
        wound.trend = -1;
        commitRank = CONFIG.ARM5E.recovery.wounds[type].rank;
      } else {
        // Already trending: commit to one rank lighter than the effective type
        wound.trend = 0;
        commitRank = wCfg.rank - 1;
      }
    } else if (rollTotal >= wCfg.stability) {
      // Stability
      log(false, "Wound stable");
      logState.description += `${game.i18n.localize("arm5e.sanatorium.msg.logWoundStable")}`;
      wound.bonus = wound.bonus + 3;
      wound.trend = 0;
      commitRank = wCfg.rank;
    } else {
      // Worsening
      log(false, "Wound worsened");
      logState.description += `${game.i18n.format("arm5e.sanatorium.msg.logWoundWorse", {
        days: wCfg.interval
      })}`;
      wound.bonus = 0;
      wound.style = "worsened";
      if (wound.trend === 0) {
        // First worsening: defer gravity change, stay in current bucket
        wound.trend = 1;
        commitRank = CONFIG.ARM5E.recovery.wounds[type].rank;
      } else {
        // Already trending: commit to one rank heavier than the effective type
        wound.trend = 0;
        commitRank = wCfg.rank + 1;
        worsened = true;
      }
    }
    logState.description += "<br/></li>";

    const commitType = CONFIG.ARM5E.recovery.rankMapping[commitRank] ?? newType;
    const commitCfg = CONFIG.ARM5E.recovery.wounds[commitType] ?? wCfg;

    // Wound improved to healthy via die roll — heal it immediately.
    if (commitType === "healthy") {
      wound.locked = true;
      wound.img = commitCfg.icon;
      this._updateWoundName(wound, type, commitType);
      wound.healedDate = { year: this.object.curYear, season: this.object.curSeason };
      wound.nextRoll = 0;
      wound.description += logState.description + "</ul>";
      newWounds[commitType].push(wound);
      return true;
    }

    wound.img = commitCfg.icon;
    this._updateWoundName(wound, type, commitType);

    // Accumulate recovery time (first season tracking)
    if (wound.recoveryTime === 0) {
      wound.daysFirstSeason = this.object.availableDays - this.object.nextRecoveryPeriod;
    }
    wound.recoveryTime += wCfg.interval;
    wound.nextRoll = wound.nextRoll + wCfg.interval;
    log(false, `Next roll: ${wound.nextRoll}`);

    wound.description += logState.description + "</ul>";
    newWounds[commitType].push(wound);
    return true;
  }

  /**
   * Roll an overstrain check for an actor.
   * Finds the worst current wound, rolls a stress die, and if the result is below the
   * worsening threshold the wound degrades by one rank.
   * Called when a character performs strenuous activity while wounded.
   * @static
   * @async
   * @param {Actor} actor - The actor performing the overstrained activity
   * @returns {Promise<void>}
   */
  static async _overstrainedRoll(actor) {
    const wounds = actor.system.wounds;
    // Find the worst wound (highest rank) that is not dead/healthy
    let worstWound = null;
    let worstRank = -1;
    for (const [type, woundList] of Object.entries(wounds)) {
      const rank = CONFIG.ARM5E.recovery.wounds[type]?.rank ?? -1;
      if (rank <= 0 || rank >= CONFIG.ARM5E.recovery.wounds["dead"].rank) continue;
      for (const wound of woundList) {
        if (rank > worstRank) {
          worstRank = rank;
          worstWound = { wound, type };
        }
      }
    }
    if (!worstWound) {
      ui.notifications.info(game.i18n.localize("arm5e.sanatorium.msg.noWoundsForOverstrain"));
      return;
    }

    const dataset = {
      roll: "char",
      name: "Overstrain",
      characteristic: "sta",
      txtoption5: game.i18n.localize("arm5e.messages.die.bonus"),
      option5: 0,
      physicalcondition: false,
      mode: CONFIG.ARM5E.recovery.rollMode
    };
    actor.rollInfo.init(dataset, actor);
    const msg = await stressDie(actor, dataset.roll, 4, undefined, 1);
    const roll = msg.rolls[0];

    const wCfg = CONFIG.ARM5E.recovery.wounds[worstWound.type];
    if (roll.total < wCfg.stability) {
      // Wound worsens
      const newTypeRank = wCfg.rank + 1;
      const newType = CONFIG.ARM5E.recovery.rankMapping[newTypeRank];
      const woundItem = actor.items.get(worstWound.wound._id ?? worstWound.wound.id);
      if (woundItem) {
        const currentDate = game.settings.get("arm5e", "currentDate");
        const overstrainNote = `<p>${game.i18n.format("arm5e.sanatorium.msg.overstrainNote", {
          season: game.i18n.localize(CONFIG.ARM5E.seasons[currentDate.season].label),
          year: currentDate.year
        })}</p>`;
        const updateData = {
          "system.gravity": newType,
          "system.description": woundItem.system.description + overstrainNote,
          img: CONFIG.ARM5E.recovery.wounds[newType].icon
        };

        await woundItem.update(updateData);
        ui.notifications.warn(
          game.i18n.format("arm5e.sanatorium.msg.overstrainWorsened", {
            name: woundItem.name,
            type: game.i18n.localize(CONFIG.ARM5E.recovery.wounds[newType].label)
          })
        );
      }
    } else {
      ui.notifications.info(game.i18n.localize("arm5e.sanatorium.msg.overstrainStable"));
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

    // Single-wound session early-exit: if any targeted wound is trending better (trend === -1),
    // commit it one rank lighter automatically so the player does not need an extra roll period
    // for what is already known to be an improvement.
    if (this.object.individualRollDone) {
      const rebalanced = {};
      // Seed every existing bucket so non-moved wounds keep their bucket
      for (const type of Object.keys(this.object.wounds)) {
        rebalanced[type] = [];
      }
      for (const [type, woundList] of Object.entries(this.object.wounds)) {
        for (const wound of woundList) {
          if (wound.trend === -1) {
            const currentRank = CONFIG.ARM5E.recovery.wounds[type]?.rank ?? 0;
            const commitRank = currentRank - 1;
            const commitType = CONFIG.ARM5E.recovery.rankMapping[commitRank] ?? type;
            const commitCfg = CONFIG.ARM5E.recovery.wounds[commitType];
            wound.trend = 0;
            wound.bonus = 0;
            wound.style = "improved";
            this._updateWoundName(wound, type, commitType);
            wound.img = commitCfg?.icon ?? wound.img;
            if (commitType === "healthy") {
              wound.locked = true;
              wound.nextRoll = 0;
              wound.healedDate = { year: this.object.curYear, season: this.object.curSeason };
            }
            rebalanced[commitType] = rebalanced[commitType] ?? [];
            rebalanced[commitType].push(wound);
          } else {
            rebalanced[type].push(wound);
          }
        }
      }
      this.object.wounds = rebalanced;
    }

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

    // If the season ended before all rolls were exhausted (user clicked End Season early),
    // account for the remaining days at the current wound penalty and append the note.
    // Skip if the note was already added at the end of the last recovery roll.
    if (!this.object.penaltyNoteAdded) {
      const remainingDays = this.object.availableDays - this.object.nextRecoveryPeriod;
      if (remainingDays > 0) {
        const finalPenalty = this.patient._getWoundPenalty(this.object.wounds);
        this.object.penaltyDays[finalPenalty] =
          (this.object.penaltyDays[finalPenalty] ?? 0) + remainingDays;
      }

      // Find the worst (most negative) penalty sustained for 30+ days and append to the log.
      const worstLongPenalty = Object.entries(this.object.penaltyDays ?? {})
        .filter(([p, d]) => d >= 30 && Number(p) < 0)
        .sort(([a], [b]) => Number(a) - Number(b))[0]; // ascending: most negative first
      if (worstLongPenalty) {
        const penaltyValue = Number(worstLongPenalty[0]);
        const adviceKey =
          penaltyValue >= -2
            ? "arm5e.sanatorium.msg.penaltyAdviceLight"
            : penaltyValue >= -4
            ? "arm5e.sanatorium.msg.penaltyAdviceMedium"
            : "arm5e.sanatorium.msg.penaltyAdviceHeavy";
        this.object.log += `<p><i>${game.i18n.format("arm5e.sanatorium.msg.worstPenaltyNote", {
          penalty: worstLongPenalty[0],
          days: Math.round(Number(worstLongPenalty[1]))
        })} ${game.i18n.localize(adviceKey)}</i></p>`;
      }
    }

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

    // If this session's date is still behind the world date, reset for the next season
    // so the user can immediately continue treating wounds in subsequent seasons.
    // Otherwise close the Sanatorium — there is nothing more to do.
    const worldDate = game.settings.get("arm5e", "currentDate");
    if (seasonsDelta({ season: this.object.curSeason, year: this.object.curYear }, worldDate) > 0) {
      this._resetForNextSeason();
    } else {
      this.close();
    }
  }

  /**
   * Reset the recovery session to start fresh in the next season.
   * Called by `_createDiaryEntry` when the session date is still behind the world date.
   * Clears all rolling state, re-loads wounds from the freshly updated actor data
   * (which sets `curSeason`/`curYear` to the next pending treatment season), and re-renders.
   * @private
   */
  _resetForNextSeason() {
    this.object.log = "";
    this.object.wounds = {};
    this.object.hasWounds = false;
    this.object.nextRecoveryPeriod = 0;
    this.object.rollMode = "none";
    this.object.dateChange = "disabled";
    this.object.health = { wounded: 0, incap: 0 };
    this.object.woundPenalty = this.patient.system.penalties.wounds.total;
    this.object.penaltyDays = {};
    this.object.penaltyNoteAdded = false;
    this.object.individualRollDone = false;
    this.object.individualRollMaxRank = undefined;
    delete this._pendingSingleWoundId; // clear any pending single-wound target
    // prepareWounds() reads the freshly updated actor data and sets curSeason/curYear
    // to the earliest season where any wound still requires treatment.
    this.prepareWounds();
    // Now that curSeason is known, set days from the per-season table (full season from season 2+).
    this.object.availableDays = CONFIG.ARM5E.recovery.daysInSeason[this.object.curSeason] ?? 91;
    this.object.dayOfSeason = 1;
    ui.notifications.info(
      game.i18n.format("arm5e.sanatorium.msg.nextSeason", {
        season: game.i18n.localize(CONFIG.ARM5E.seasons[this.object.curSeason].label),
        year: this.object.curYear
      })
    );
    this.render(true);
  }

  /**
   * Execute recovery rolls for all wounds.
   * This is the core game mechanic - determines wound progression based on stamina checks.
   * Handles all wound types and generates detailed recovery log.
   *
   * Incapacitating wounds: all share a single stress die per period; the result is applied
   * to every incap wound simultaneously (group roll mechanic per the rules addendum).
   * A result of ≤ 0 kills the patient immediately; ≥ improvement threshold → trend to heavy.
   *
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
    // Snapshot the period BEFORE this roll so we can measure how many days elapsed.
    const preRollPeriod = this.object.nextRecoveryPeriod;

    // Initialize container for updated wounds (organized by type)
    let newWounds = {
      healthy: [],
      light: [],
      medium: [],
      heavy: [],
      incap: [],
      dead: []
    };

    // Build dataset for recovery roll - Stamina characteristic check
    let dataset = {
      roll: "char",
      name: "Recovery",
      characteristic: "sta",
      txtoption1: game.i18n.localize("arm5e.sanatorium.recoveryBonus"),
      option1: this.object.modifiers.activeEffect,
      txtoption2: game.i18n.localize("arm5e.sanatorium.mundaneHelp"),
      option2: this.object.modifiers.mundaneHelp,
      txtoption3: game.i18n.localize("arm5e.sanatorium.magicalHelp"),
      option3: this.object.modifiers.magicalHelp,
      txtoption4: game.i18n.localize("arm5e.sanatorium.labHealth"),
      option4: this.object.modifiers.labHealth,
      txtoption5: game.i18n.localize("arm5e.messages.die.bonus"),
      option5: 0,
      physicalcondition: false,
      mode: CONFIG.ARM5E.recovery.rollMode
    };
    let tmpPeriod = 1000; // Track next recovery roll timing (in days)
    let incapacited = false; // Flag if an incapacitating wound is being actively treated this period
    // Shared log state for this roll (passed into helpers)
    let logState = { description: "", logDayAdded: false };
    this.object.hasWounds = false; // Reset wound flag

    // ── PROCESS INCAPACITATING WOUNDS (group roll) ────────────────────────────
    // All incap wounds share ONE stress die per recovery period.
    // A roll ≤ 0 kills the patient outright; ≥ improvement threshold → all trend to heavy.
    if (this.object.wounds["incap"] && this.object.wounds["incap"].length > 0) {
      // Separate wounds that are due for a roll from those that are waiting
      const dueIncap = [];
      const waitingIncap = [];
      const incapRank = CONFIG.ARM5E.recovery.wounds["incap"]?.rank ?? 0;
      const incapExcluded =
        this._singleRollMaxRank !== undefined && incapRank > this._singleRollMaxRank;
      for (let incap of this.object.wounds["incap"]) {
        if (incap.nextRoll > this.object.nextRecoveryPeriod || incap.locked || incapExcluded) {
          log(
            false,
            `Incap: next roll ${incap.nextRoll} > ${this.object.nextRecoveryPeriod} or locked`
          );
          if (!incap.locked) {
            if (!incapExcluded) {
              tmpPeriod = tmpPeriod < incap.nextRoll ? tmpPeriod : incap.nextRoll;
            }
            this.object.hasWounds = true;
            // Wound is active but excluded because a lighter wound is being individually rolled.
            // The incap wound is still present — its schedule is left untouched;
            // other wounds must be delayed, not rolled.
            if (incapExcluded && incap.nextRoll <= this.object.nextRecoveryPeriod) {
              incapacited = true;
            }
          }
          waitingIncap.push(incap);
        } else {
          dueIncap.push(incap);
          incapacited = true;
        }
      }

      // Push waiting wounds unchanged
      for (let w of waitingIncap) newWounds["incap"].push(w);

      // ── Roll TWICE per day (sunrise and sunset) for all due incap wounds ────
      // Per ArM5 rules each day has two checks: at sunrise and at sunset.
      // A bonus decrement from a stable sunrise result carries into the sunset roll.
      // Wounds that died at sunrise skip the sunset roll; wounds that were already
      // trending better (trend = -1 from a prior improvement) are rolled once as Heavy
      // instead of undergoing the incap sunrise/sunset treatment again.
      if (dueIncap.length > 0) {
        this._openLogDaySection(logState, this.object.nextRecoveryPeriod + 1);
        const incapCfg = CONFIG.ARM5E.recovery.wounds["incap"];

        // ── Trending-better incap wounds: one Heavy-grade roll ─────────────────────
        // These wounds previously rolled above the improvement threshold while incap.
        // Their gravity now resolves: roll once against Heavy thresholds and commit to
        // heavy/medium/incap depending on the outcome.
        const trendingBetter = dueIncap.filter((w) => w.trend === -1);
        const normalDueIncap = dueIncap.filter((w) => w.trend !== -1);

        // trendingBetter wounds are treated as Heavy-grade this period — they do not
        // block Light/Medium/Heavy wounds from also rolling.  Only genuine incap wounds
        // (normalDueIncap) impose the incap delay on other wound types.
        if (normalDueIncap.length === 0) {
          incapacited = false;
        }

        for (const wound of trendingBetter) {
          const heavyCfg = CONFIG.ARM5E.recovery.wounds["heavy"];
          let newWound = foundry.utils.deepClone(wound);

          dataset.option5 = wound.bonus;
          patient.rollInfo.init(dataset, patient);
          const heavyMsg = await stressDie(patient, dataset.roll, 4, undefined, 1);
          const heavyRoll = heavyMsg.rolls[0];

          logState.description +=
            `<li>${game.i18n.format("arm5e.sanatorium.msg.logWound", {
              type: game.i18n.localize("arm5e.sheet.heavy")
            })}` +
            `<br/>${game.i18n.format("arm5e.sanatorium.msg.logRoll", {
              total: heavyRoll.total,
              mod: heavyRoll.offset
            })} vs ${heavyCfg.improvement}<br/>`;

          let commitRank;
          if (heavyRoll.total >= heavyCfg.improvement) {
            logState.description += `${game.i18n.format("arm5e.sanatorium.msg.logWoundBetter", {
              days: heavyCfg.interval
            })}`;
            newWound.bonus = 0;
            newWound.trend = 0;
            newWound.style = "improved";
            commitRank = heavyCfg.rank - 1; // medium
          } else if (heavyRoll.total >= heavyCfg.stability) {
            logState.description += `${game.i18n.localize("arm5e.sanatorium.msg.logWoundStable")}`;
            newWound.bonus = wound.bonus + 3;
            newWound.trend = 0;
            newWound.style = "";
            commitRank = heavyCfg.rank; // heavy
          } else {
            // Worsening on the Heavy-grade roll: wound regresses back to incap.
            // The roll happened on the heavy cadence so the next check is still
            // heavyCfg.interval (90 days) away, not the 1-day incap cadence.
            logState.description += `${game.i18n.format("arm5e.sanatorium.msg.logWoundWorse", {
              days: heavyCfg.interval
            })}`;
            newWound.trend = 0;
            newWound.bonus = 0;
            newWound.style = "worsened";
            commitRank = heavyCfg.rank + 1; // incap
          }
          logState.description += "<br/></li>";

          const tbCommitType = CONFIG.ARM5E.recovery.rankMapping[commitRank] ?? "heavy";
          const tbCommitCfg = CONFIG.ARM5E.recovery.wounds[tbCommitType] ?? heavyCfg;
          // The roll was heavy-grade regardless of outcome: always advance by heavyCfg.interval.
          const tbInterval = heavyCfg.interval;

          newWound.img = tbCommitCfg.icon;
          this._updateWoundName(newWound, "incap", tbCommitType);
          if (newWound.recoveryTime === 0)
            newWound.daysFirstSeason = this.object.availableDays - preRollPeriod;
          newWound.recoveryTime += tbInterval;
          newWound.nextRoll = wound.nextRoll + tbInterval;
          log(false, `Trending-better incap → ${tbCommitType}, next roll: ${newWound.nextRoll}`);

          if (!newWound.locked) {
            if (newWound.nextRoll > this.object.availableDays) {
              log(false, "Trending-better wound locked for this season");
              newWound.nextRoll -= this.object.availableDays;
              newWound.locked = true;
            } else {
              this.object.hasWounds = true;
              tmpPeriod = tmpPeriod < newWound.nextRoll ? tmpPeriod : newWound.nextRoll;
              log(false, `New Period: ${tmpPeriod}`);
            }
          }
          newWound.description += logState.description + "</ul>";
          newWounds[tbCommitType].push(newWound);
        }

        // ── Normal incap wounds: sunrise/sunset double roll ────────────────────────
        // Build per-wound mutable state to carry between the two sub-rolls
        const incapStates = normalDueIncap.map((w) => ({
          src: w,
          trend: w.trend,
          bonus: w.bonus,
          newType: "incap",
          style: "",
          resolved: false
        }));

        const rollLabels = [
          game.i18n.localize("arm5e.sanatorium.msg.sunriseRoll"),
          game.i18n.localize("arm5e.sanatorium.msg.sunsetRoll")
        ];

        for (let rollIdx = 0; rollIdx < 2; rollIdx++) {
          if (incapStates.length === 0) break;
          const active = incapStates.filter((s) => !s.resolved);
          if (active.length === 0) break;

          // Use the worst (minimum) bonus among still-active wounds for the shared roll
          const representativeBonus = active.reduce((min, s) => Math.min(min, s.bonus), Infinity);
          dataset.option5 = representativeBonus;
          patient.rollInfo.init(dataset, patient);
          const msg = await stressDie(patient, dataset.roll, 4, undefined, 1);
          const roll = msg.rolls[0];

          logState.description += `<b>${rollLabels[rollIdx]}:</b> `;

          if (roll.total <= 0) {
            // Death — all active incap wounds die; sunset roll is skipped
            logState.description += `<li><b>${game.i18n.localize(
              "arm5e.sanatorium.msg.incapDeath"
            )}</b> (${game.i18n.format("arm5e.sanatorium.msg.logRoll", {
              total: roll.total,
              mod: roll.offset
            })})</li>`;
            for (const state of active) {
              state.newType = "dead";
              state.trend = 1;
              state.bonus = 0;
              state.style = "worsened";
              state.resolved = true;
            }
          } else {
            // Apply shared roll result to every still-active incap wound
            for (const state of active) {
              logState.description +=
                `<li>${game.i18n.format("arm5e.sanatorium.msg.logWound", {
                  type: game.i18n.localize("arm5e.sheet.incap")
                })}` +
                `<br/>${game.i18n.format("arm5e.sanatorium.msg.logRoll", {
                  total: roll.total,
                  mod: roll.offset
                })} vs ${incapCfg.improvement}<br/>`;

              if (roll.total >= incapCfg.improvement) {
                // Improvement → wound stays in incap bucket but with trend = -1, meaning it
                // will be rolled as a Heavy-grade wound at its next recovery period.
                // Keeping it in the incap bucket preserves its visual state for intermediate
                // rolls on other wounds; the gravity shift to Heavy happens when it is due next.
                state.newType = "incap";
                logState.description += `${game.i18n.format("arm5e.sanatorium.msg.logWoundBetter", {
                  days: incapCfg.interval
                })}`;
                log(false, "Incap wound trending → heavy (next roll)");
                state.bonus = 0;
                state.trend = -1;
                state.style = "improved";
                state.resolved = true;
              } else if (roll.total >= incapCfg.stability) {
                // Stable — bonus decrements by 1; carries into sunset roll
                log(false, "Incap wound stable");
                logState.description += `${game.i18n.localize(
                  "arm5e.sanatorium.msg.logWoundStable"
                )}`;
                state.bonus -= 1;
                state.trend = 0;
              } else {
                // Worsening
                if (state.trend === 1) {
                  // Already worsening → dies; resolved (skip sunset roll)
                  state.newType = "dead";
                  state.resolved = true;
                }
                log(false, "Incap wound worsened");
                logState.description += `${game.i18n.format("arm5e.sanatorium.msg.logWoundWorse", {
                  days: incapCfg.interval
                })}`;
                state.trend = 1;
                state.bonus = 0;
                state.style = "worsened";
              }
              logState.description += "<br/></li>";
            }
          }
        }

        // ── Commit phase — push all wounds using their final post-rolls state ─
        for (const state of incapStates) {
          let newWound = foundry.utils.deepClone(state.src);
          newWound.trend = state.trend;
          newWound.bonus = state.bonus;
          newWound.style = state.style;
          if (state.newType === "dead") newWound.locked = true;
          newWound.img = CONFIG.ARM5E.recovery.wounds[state.newType].icon;
          this._updateWoundName(newWound, "incap", state.newType);
          newWound.nextRoll = state.src.nextRoll + incapCfg.interval;
          if (newWound.recoveryTime === 0)
            newWound.daysFirstSeason = this.object.availableDays - preRollPeriod;
          newWound.recoveryTime += incapCfg.interval;
          if (!newWound.locked) {
            if (newWound.nextRoll > this.object.availableDays) {
              log(false, "Incap wound locked for this season");
              newWound.nextRoll -= this.object.availableDays;
              newWound.locked = true;
            } else {
              this.object.hasWounds = true;
              tmpPeriod = tmpPeriod < newWound.nextRoll ? tmpPeriod : newWound.nextRoll;
              log(false, `New Period: ${tmpPeriod}`);
            }
          }
          newWound.description += logState.description + "</ul>";
          newWounds[state.newType].push(newWound);
        }
        recoverylog += logState.description;
        // Reset logState description so it isn't double-appended later;
        // logDayAdded stays true so the header is not repeated for other wound types.
        logState.description = "";
      }
    }

    // ── PROCESS OTHER WOUND TYPES (Light, Medium, Heavy) ─────────────────────
    for (let type of Object.keys(CONFIG.ARM5E.recovery.wounds)) {
      if (type === "incap") {
        continue; // Already processed above
      } else if (type === "healthy") {
        // Terminal state – carry over unchanged
        for (let wound of this.object.wounds[type] ?? []) {
          wound.locked = true;
          newWounds[type].push(wound);
        }
      } else if (type === "dead") {
        // Terminal state – carry over unchanged and log death
        for (let wound of this.object.wounds[type] ?? []) {
          wound.locked = true;
          newWounds[type].push(wound);
          recoverylog += await TextEditor.enrichHTML(
            `<br/><p><b>${game.i18n.localize("arm5e.sanatorium.msg.patientDied")}</b></p>`,
            { async: true }
          );
          break; // Only one dead wound matters
        }
      } else {
        // ── Light / Medium / Heavy ──────────────────────────────────────────
        const typeRank = CONFIG.ARM5E.recovery.wounds[type]?.rank ?? 0;
        const rankExcluded =
          this._singleRollMaxRank !== undefined && typeRank > this._singleRollMaxRank;
        for (let wound of this.object.wounds[type] ?? []) {
          if (wound.nextRoll > this.object.nextRecoveryPeriod || wound.locked || rankExcluded) {
            log(false, `Next roll ${wound.nextRoll} > ${this.object.nextRecoveryPeriod} or locked`);
            if (!wound.locked) {
              if (!rankExcluded) {
                // Genuinely waiting wound: governs the next period.
                tmpPeriod = tmpPeriod < wound.nextRoll ? tmpPeriod : wound.nextRoll;
              }
              // Rank-excluded wounds (individual roll mode) are left completely untouched —
              // no nextRoll bump, no tmpPeriod influence.  Their schedule is independent of
              // the wound being individually rolled (e.g. a surgeon treating only light wounds
              // does not affect medium/heavy recovery timing).
              // NOTE: rankExcluded and incapacited are mutually exclusive: the incap guard at
              // the top of _recoveryRollSingle blocks individual rolls while incap is active,
              // so the else-if(incapacited) bump below never competes with rank-exclusion.
              this.object.hasWounds = true;
            }
            newWounds[type].push(wound);
            continue;
          } else if (incapacited) {
            // Incap wound was treated this period → delay other wounds by the incap interval
            wound.nextRoll += CONFIG.ARM5E.recovery.wounds["incap"].interval;
            this.object.hasWounds = true; // There ARE wounds to treat; they are just delayed
            tmpPeriod = tmpPeriod < wound.nextRoll ? tmpPeriod : wound.nextRoll;
            newWounds[type].push(wound);
            continue;
          }

          // Determine effective gravity based on trend
          let newType =
            CONFIG.ARM5E.recovery.rankMapping[
              CONFIG.ARM5E.recovery.wounds[type].rank + wound.trend
            ];

          let newWound = foundry.utils.deepClone(wound);

          // Open day header if not already done this roll
          this._openLogDaySection(logState, this.object.nextRecoveryPeriod + 1);

          // For healing outcome we don't need a die roll
          if (newType === "healthy") {
            logState.description += `${game.i18n.localize(
              "arm5e.sheet." + wound.originalGravity
            )} ${game.i18n.format("arm5e.sanatorium.msg.logHealed", {
              days: newWound.recoveryTime
            })}<br/>`;
            newWound.locked = true;
            newWound.img = CONFIG.ARM5E.recovery.wounds[newType].icon;
            this._updateWoundName(newWound, type, newType);
            newWound.healedDate = { year: this.object.curYear, season: this.object.curSeason };
            newWound.nextRoll = 0;
            newWound.description += logState.description + "</ul>";
            recoverylog += logState.description;
            logState.description = "";
            newWounds[newType].push(newWound);
            continue;
          }

          // Perform recovery roll
          dataset.option5 = wound.bonus;
          patient.rollInfo.init(dataset, patient);
          const msg = await stressDie(patient, dataset.roll, 4, undefined, 1);
          const roll = msg.rolls[0];

          // Build per-wound log line header
          logState.description +=
            `<li>${game.i18n.format("arm5e.sanatorium.msg.logWound", {
              type: game.i18n.localize("arm5e.sheet." + newType)
            })}` +
            `<br/>${game.i18n.format("arm5e.sanatorium.msg.logRoll", {
              total: roll.total,
              mod: roll.offset
            })} vs ${CONFIG.ARM5E.recovery.wounds[newType].improvement}<br/>`;

          const wCfg = CONFIG.ARM5E.recovery.wounds[newType];

          // Determine the gravity bucket to commit the wound to after this roll.
          // Trend deferral: a first improvement/worsening sets trend (±1) and keeps the wound
          // in its current bucket so intermediate display stays consistent.  On the wound's NEXT
          // roll the effective type (= rankMapping[rank + trend]) is already resolved, so a
          // second trigger commits to the new rank immediately.
          let worsened = false;
          let commitRank;
          if (roll.total >= wCfg.improvement) {
            logState.description += `${game.i18n.format("arm5e.sanatorium.msg.logWoundBetter", {
              days: wCfg.interval
            })}`;
            log(false, "Wound improvement");
            newWound.bonus = 0;
            newWound.style = "improved";
            if (wound.trend === 0) {
              // First improvement: defer gravity change, stay in current bucket
              newWound.trend = -1;
              commitRank = CONFIG.ARM5E.recovery.wounds[type].rank;
            } else {
              // Already trending: commit to one rank lighter than the effective type
              newWound.trend = 0;
              commitRank = wCfg.rank - 1;
            }
          } else if (roll.total >= wCfg.stability) {
            log(false, "Wound stable");
            logState.description += `${game.i18n.localize("arm5e.sanatorium.msg.logWoundStable")}`;
            newWound.bonus = wound.bonus + 3;
            newWound.trend = 0;
            commitRank = wCfg.rank;
          } else {
            log(false, "Wound worsened");
            logState.description += `${game.i18n.format("arm5e.sanatorium.msg.logWoundWorse", {
              days: wCfg.interval
            })}`;
            newWound.bonus = 0;
            newWound.style = "worsened";
            if (wound.trend === 0) {
              // First worsening: defer gravity change, stay in current bucket
              newWound.trend = 1;
              commitRank = CONFIG.ARM5E.recovery.wounds[type].rank;
            } else {
              // Already trending: commit to one rank heavier than the effective type
              newWound.trend = 0;
              commitRank = wCfg.rank + 1;
              worsened = true;
            }
          }
          logState.description += "<br/></li>";

          const commitTypeInline = CONFIG.ARM5E.recovery.rankMapping[commitRank] ?? newType;
          const commitCfgInline = CONFIG.ARM5E.recovery.wounds[commitTypeInline] ?? wCfg;

          // Wound improved to healthy via die roll — heal it immediately.
          if (commitTypeInline === "healthy") {
            newWound.locked = true;
            newWound.img = commitCfgInline.icon;
            this._updateWoundName(newWound, type, commitTypeInline);
            newWound.healedDate = { year: this.object.curYear, season: this.object.curSeason };
            newWound.nextRoll = 0;
            if (newWound.recoveryTime === 0)
              newWound.daysFirstSeason = this.object.availableDays - preRollPeriod;
            newWound.recoveryTime += wCfg.interval;
            newWound.description += logState.description + "</ul>";
            recoverylog += logState.description;
            logState.description = "";
            newWounds[commitTypeInline].push(newWound);
            continue;
          }

          newWound.img = commitCfgInline.icon;
          this._updateWoundName(newWound, type, commitTypeInline);

          if (newWound.recoveryTime === 0)
            newWound.daysFirstSeason = this.object.availableDays - preRollPeriod;
          newWound.recoveryTime += wCfg.interval;
          newWound.nextRoll = wound.nextRoll + wCfg.interval;
          log(false, `Next roll: ${newWound.nextRoll}`);

          if (newWound.nextRoll > this.object.availableDays) {
            log(false, "Wound locked for this season");
            newWound.nextRoll -= this.object.availableDays;
            newWound.locked = true;
          } else if (
            this._singleRollMaxRank !== undefined &&
            worsened &&
            commitRank >= this._singleRollMaxRank
          ) {
            // During an individual roll: wound worsened to a rank at or above the targeted
            // wound — lock it so it is not auto-rolled again and must be explicitly retargeted.
            log(false, "Wound locked: worsened to target rank or above during individual roll");
            newWound.locked = true;
          } else {
            this.object.hasWounds = true;
            tmpPeriod = tmpPeriod < newWound.nextRoll ? tmpPeriod : newWound.nextRoll;
            log(false, `New Period: ${tmpPeriod}`);
          }
          newWound.description += logState.description + "</ul>";
          recoverylog += logState.description;
          logState.description = "";
          newWounds[commitTypeInline].push(newWound);
        }
      }
    }

    // Final log entry – show current wound penalty (fixed: was </u>, now </ul>)
    recoverylog += `</ul><i style="font-size: 7pt">${this.patient._getWoundPenalty(
      this.object.wounds
    )} ${game.i18n.localize("arm5e.sheet.penalty")}</i>`;

    // Check if all rolls completed this season
    if (tmpPeriod === 1000) {
      tmpPeriod = this.object.availableDays;
      recoverylog += `<p>${game.i18n.localize("arm5e.sanatorium.msg.logDone")}</p>`;
    }

    // Accumulate days spent at the pre-roll wound penalty for the period just processed.
    // currentPenalty is the penalty BEFORE this roll (wounds haven't been swapped yet);
    // the period spans from preRollPeriod to tmpPeriod.
    const periodDays = tmpPeriod - preRollPeriod;
    if (periodDays > 0) {
      this.object.penaltyDays[currentPenalty] =
        (this.object.penaltyDays[currentPenalty] ?? 0) + periodDays;
    }

    // Enrich HTML for proper formatting
    recoverylog = await TextEditor.enrichHTML(recoverylog, { async: true });

    this.object.wounds = newWounds;
    this.object.log = recoverylog;
    this.object.nextRecoveryPeriod = tmpPeriod;
    this.object.dateChange = dateChange;

    // If the season is now done (no more wounds due this season), append the worst-penalty
    // note immediately so it is visible in the log before the user clicks the diary button.
    if (!this.object.hasWounds && !this.object.penaltyNoteAdded) {
      const remainingDays = this.object.availableDays - this.object.nextRecoveryPeriod;
      if (remainingDays > 0) {
        const finalPenalty = this.patient._getWoundPenalty(this.object.wounds);
        this.object.penaltyDays[finalPenalty] =
          (this.object.penaltyDays[finalPenalty] ?? 0) + remainingDays;
      }
      const worstLongPenalty = Object.entries(this.object.penaltyDays ?? {})
        .filter(([p, d]) => d >= 30 && Number(p) < 0)
        .sort(([a], [b]) => Number(a) - Number(b))[0];
      if (worstLongPenalty) {
        const penaltyValue = Number(worstLongPenalty[0]);
        const adviceKey =
          penaltyValue >= -2
            ? "arm5e.sanatorium.msg.penaltyAdviceLight"
            : penaltyValue >= -4
            ? "arm5e.sanatorium.msg.penaltyAdviceMedium"
            : "arm5e.sanatorium.msg.penaltyAdviceHeavy";
        this.object.log += `<p><i>${game.i18n.format("arm5e.sanatorium.msg.worstPenaltyNote", {
          penalty: worstLongPenalty[0],
          days: Math.round(Number(worstLongPenalty[1]))
        })} ${game.i18n.localize(adviceKey)}</i></p>`;
      }
      this.object.penaltyNoteAdded = true;
    }

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
            const _dis =
              CONFIG.ARM5E.recovery.daysInSeason[wound.system.inflictedDate?.season] ?? 91;
            let offset = Math.floor(
              (wound.system.recoveryTime - wound.system.daysFirstSeason + _dis) / _dis
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
