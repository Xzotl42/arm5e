import { stressDie } from "../dice.js";
import { log, sleep } from "../tools.js";
import { getShiftedDate, seasonsDelta } from "./time.js";

export class Sanatorium extends FormApplication {
  constructor(patient, data, options) {
    super(data, options);
    const datetime = game.settings.get("arm5e", "currentDate");
    this.patient = patient;
    // this.object.daysLeft = CONFIG.ARM5E.recovery.daysInSeason;
    this.object.seasons = CONFIG.ARM5E.seasons;
    this.object.curYear = datetime.year;
    this.object.curSeason = datetime.season;
    this.object.modifiers = {
      mundaneHelp: 0,
      magicalHelp: 0,
      activeEffect: 0,
      labHealth: 0
    };
    this.object.log = "";
    this.object.wounds = {};
    this.object.woundPenalty = patient.system.penalties.wounds.total;
    this.object.health = {
      wounded: 0,
      incap: 0
    };
    this.object.availableDays = CONFIG.ARM5E.recovery.daysInSeason;
    this.object.hasWounds = false;
    this.object.nextRecoveryPeriod = 0;
    this.object.dateChange = "disabled";
    this.prepareWounds();
    Hooks.on("closeApplication", (app, html) => this.onClose(app));
  }

  static async createDialog(actor) {
    // const dialogData = { patient: actor };
    const sanatorium = new Sanatorium(actor, {}, {}); // data, options
    const res = await sanatorium.render(true);
    actor.apps[sanatorium.appId] = sanatorium;
  }
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["arm5e", "sheet", "sanatorium-sheet"],
      title: "Sanatorium",
      template: "systems/arm5e/templates/generic/sanatorium.html",
      scrollY: [".editor"],
      width: "600",
      height: "800",
      submitOnChange: true,
      closeOnSubmit: false
    });
  }

  onClose(app) {
    if (app.patient) {
      delete app.patient.apps[app.appId];
    }
  }
  async getData(options = {}) {
    const context = await super.getData().object;
    const patient = this.patient;
    context.patient = patient;
    context.canRoll = "";
    context.diary = "disabled";
    context.modifiers.activeEffect = patient.system.bonuses.traits.recovery;
    context.config = CONFIG;
    if (patient.system.isMagus && patient.system.sanctum.linked) {
      const lab = patient.system.sanctum.document;
      context.modifiers.labHealth = lab.system.health.total;
    }

    context.curSeasonLabel = game.i18n.localize(CONFIG.ARM5E.seasons[context.curSeason].label);
    context.daysLeft = context.availableDays - context.nextRecoveryPeriod;

    context.progressbarStyle = `style="width:${Math.round(
      (context.nextRecoveryPeriod / context.availableDays) * 100
    )}%;"`;
    context.daysLeftLabel = game.i18n.format("arm5e.sanatorium.daysLeft", {
      days: context.daysLeft
    });
    if (this.object.wounds["dead"] && this.object.wounds["dead"].length > 0) {
      context.log += await TextEditor.enrichHTML(
        `<br/><p><b>${game.i18n.localize("arm5e.sanatorium.msg.patientDead")}</b></p>`,
        { async: true }
      );
      context.canRoll = "disabled";
      context.diary = "";
    } else if (
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
    if (!context.hasWounds) {
      if (context.daysLeft == 0) {
        // season finished
        context.diary = "";
      } else if (context.daysLeft == context.availableDays) {
        // season started
        context.log += await TextEditor.enrichHTML(
          `<br/><p><b>${game.i18n.localize("arm5e.sanatorium.msg.logDone")}</b></p>`,
          { async: true }
        );
      }
      context.canRoll = "disabled";
    }
    // log(false, `Sanatorium: ${JSON.stringify(context.wounds)}`);
    // log(false, `Sanatorium: ${context.daysLeft}`);
    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find(".resource-focus").focus((ev) => {
      ev.preventDefault();
      ev.currentTarget.select();
    });

    html.find(".recovery-roll").click(this._recoveryRoll.bind(this));
    html.find(".diary-entry").click(this._createDiaryEntry.bind(this));
  }

  async _createDiaryEntry(event) {
    event.preventDefault();

    let updatePatientWounds = [];
    const dateHeasder = `<h3>${game.i18n.localize(
      CONFIG.ARM5E.seasons[this.object.curSeason].label
    )} ${this.object.curYear}</h3><br/>`;
    // Update the patient wounds
    for (let [type, wounds] of Object.entries(this.object.wounds)) {
      for (let wound of wounds) {
        let currentWound = this.object.patient.items.get(wound._id);
        let data = {};
        data.system = wound;
        data.system.gravity = type;
        data.system.description = currentWound.system.description + dateHeasder + wound.description;
        data.name = wound.name;
        data.img = wound.img;
        data._id = wound._id;
        updatePatientWounds.push(data);
      }
    }
    let updatedWounds = await this.patient.updateEmbeddedDocuments("Item", updatePatientWounds, {
      recursive: true
    });

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
        done: true,
        progress: {
          abilities: [],
          arts: [],
          spells: [],
          newSpells: []
        },
        duration: 1,
        description: this.object.log
      }
    };

    let entry = await this.patient.createEmbeddedDocuments("Item", [entryData], {});
    entry[0].sheet.render(true);
    delete this.patient.apps[this.appId];
    await sleep(100);
    await this.close();
  }

  async _recoveryRoll(event) {
    event.preventDefault();
    const patient = this.patient;
    let recoverylog = this.object.log;
    // it is no longer possible to change date or days available
    let dateChange = "disabled";
    let currentPenalty = patient._getWoundPenalty(this.object.wounds);
    let newWounds = {
      healthy: [],
      light: [],
      medium: [],
      heavy: [],
      incap: [],
      dead: []
    };
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
    let tmpPeriod = 1000;
    let incapacited = false;
    let logDayAdded = false;
    this.object.hasWounds = false;
    // Incapacitating wound special treatment
    if (this.object.wounds["incap"] && this.object.wounds["incap"].length > 0) {
      for (let incap of this.object.wounds["incap"]) {
        if (incap.nextRoll > this.object.nextRecoveryPeriod || incap.locked) {
          log(false, `Next roll ${incap.nextRoll} > ${this.object.nextRecoveryPeriod} or locked`);
          if (!incap.locked) {
            tmpPeriod = tmpPeriod < incap.nextRoll ? tmpPeriod : incap.nextRoll;
            this.object.hasWounds = true;
          }
          newWounds["incap"].push(incap);
          continue;
        }
        let woundPeriodDescription = "";
        let newWound = foundry.utils.deepClone(incap);
        dataset.option5 = incap.bonus;
        let newType = "incap";
        if (incap.trend == -1) {
          newType = "heavy";
        } else if (incap.trend == 1) {
          newType = "dead";
        } else {
          incapacited = true;
        }

        patient.rollInfo.init(dataset, patient);

        const msg = await stressDie(
          patient,
          dataset.roll,
          4, // Non interactive
          undefined,
          1 // one botch
        );
        const roll = msg.rolls[0];
        if (!logDayAdded) {
          woundPeriodDescription += `<h4>${game.i18n.format("arm5e.sanatorium.msg.logDay", {
            day: this.object.nextRecoveryPeriod + 1
          })}</h4><ul>`;
          logDayAdded = true;
        }
        woundPeriodDescription +=
          `<li>${game.i18n.format("arm5e.sanatorium.msg.logWound", {
            type: game.i18n.localize("arm5e.sheet." + newType)
          })}` +
          `<br/>${game.i18n.format("arm5e.sanatorium.msg.logRoll", {
            total: roll.total,
            mod: roll.offset
          })} vs ${CONFIG.ARM5E.recovery.wounds[newType].improvement}<br/>`;

        if (roll.total >= CONFIG.ARM5E.recovery.wounds[newType].improvement) {
          woundPeriodDescription += `${game.i18n.format("arm5e.sanatorium.msg.logWoundBetter", {
            days: 0.5
          })}<br/>`;
          log(false, "Wound improvement");
          newWound.bonus = 0;
          newWound.style = "improved";
          newWound.trend = -1;
        } else if (roll.total >= CONFIG.ARM5E.recovery.wounds[newType].stability) {
          log(false, "Wound stable");
          woundPeriodDescription += `${game.i18n.localize(
            "arm5e.sanatorium.msg.logWoundStable"
          )}<br/>`;
          newWound.bonus = incap.bonus - 1;
          newWound.trend = 0;
        } else {
          newWound.trend = +1;
          log(false, "Wound worsened");
          woundPeriodDescription += `${game.i18n.format("arm5e.sanatorium.msg.logWoundWorse", {
            days: CONFIG.ARM5E.recovery.wounds[newType].interval
          })}`;
          newWound.trend = 1;
          newWound.bonus = 0;
          newWound.style = "worsened";
        }
        woundPeriodDescription += "<br/></li>";
        newWound.img = CONFIG.ARM5E.recovery.wounds[newType].icon;

        // keep the old name if it was custom
        let oldName = `${game.i18n.localize(
          CONFIG.ARM5E.recovery.wounds["incap"].label
        )} ${game.i18n.localize("arm5e.sheet.wound.label")}`;

        if (newWound.name == oldName) {
          newWound.name = `${game.i18n.localize(
            CONFIG.ARM5E.recovery.wounds[newType].label
          )} ${game.i18n.localize("arm5e.sheet.wound.label")}`;
        }

        newWound.nextRoll = incap.nextRoll + CONFIG.ARM5E.recovery.wounds[newType].interval;
        // if it is the first time the wound is treated, store the number of availble days the first season.
        if (newWound.recoveryTime == 0) {
          newWound.daysFirstSeason = this.object.availableDays;
        }
        newWound.recoveryTime += CONFIG.ARM5E.recovery.wounds[newType].interval;
        recoverylog += woundPeriodDescription;
        log(false, `Next roll: ${newWound.nextRoll}`);
        if (newWound.nextRoll > this.object.availableDays) {
          log(false, `Locked for this season`);
          newWound.nextRoll -= this.object.availableDays;
          newWound.locked = true;
        } else {
          this.object.hasWounds = true;
          tmpPeriod = tmpPeriod < newWound.nextRoll ? tmpPeriod : newWound.nextRoll;
          log(false, `New Period: ${tmpPeriod}`);
        }
        newWound.description += woundPeriodDescription + "</ul>";
        newWounds[newType].push(newWound);
      }
    }
    for (let type of Object.keys(CONFIG.ARM5E.recovery.wounds)) {
      if (type == "incap") {
        // taken care above
        continue;
      } else if (type == "healthy") {
        for (let wound of this.object.wounds[type] ?? []) {
          wound.locked = true;
          newWounds[type].push(wound);
        }
      } else if (type == "dead") {
        for (let wound of this.object.wounds[type] ?? []) {
          wound.locked = true;
          newWounds[type].push(wound);
          recoverylog += await TextEditor.enrichHTML(
            `<br/><p><b>${game.i18n.localize("arm5e.sanatorium.msg.patientDied")}</b></p>`,
            { async: true }
          );
          break;
        }
      } else {
        for (let wound of this.object.wounds[type] ?? []) {
          if (wound.nextRoll > this.object.nextRecoveryPeriod || wound.locked) {
            log(false, `Next roll ${wound.nextRoll} > ${this.object.nextRecoveryPeriod} or locked`);
            if (!wound.locked) {
              tmpPeriod = tmpPeriod < wound.nextRoll ? tmpPeriod : wound.nextRoll;
              this.object.hasWounds = true;
            }
            newWounds[type].push(wound);
            continue;
          } else if (incapacited) {
            wound.nextRoll += 0.5;
            // wound.recoveryTime += 0.5;
            tmpPeriod = tmpPeriod < wound.nextRoll ? tmpPeriod : wound.nextRoll;
            newWounds[type].push(wound);
          } else {
            let woundPeriodDescription = "";
            let newType =
              CONFIG.ARM5E.recovery.rankMapping[
                CONFIG.ARM5E.recovery.wounds[type].rank + wound.trend
              ];

            let newWound = foundry.utils.deepClone(wound);
            if (!logDayAdded) {
              woundPeriodDescription += `<h4>${game.i18n.format("arm5e.sanatorium.msg.logDay", {
                day: this.object.nextRecoveryPeriod + 1
              })}</h4><ul>`;
              logDayAdded = true;
            }
            if (newType == "healthy") {
              newWound.locked = true;

              woundPeriodDescription += `${game.i18n.localize(
                "arm5e.sheet." + wound.originalGravity
              )} ${game.i18n.format("arm5e.sanatorium.msg.logHealed", {
                days: newWound.recoveryTime
              })}<br/>`;

              recoverylog += woundPeriodDescription;
              // woundPeriodDescription =
              //   `<h3>${game.i18n.localize(CONFIG.ARM5E.seasons[this.object.curSeason].label)} ${
              //     this.object.curYear
              //   }</h3><br/>` +
              //   woundPeriodDescription +
              //   "</ul>";
              // newWound.description += woundPeriodDescription;
              newWound.description += woundPeriodDescription + "</ul>";

              newWound.img = CONFIG.ARM5E.recovery.wounds[newType].icon;

              let oldName = `${game.i18n.localize(
                CONFIG.ARM5E.recovery.wounds[type].label
              )} ${game.i18n.localize("arm5e.sheet.wound.label")}`;

              if (newWound.name == oldName) {
                newWound.name = `${game.i18n.localize(
                  CONFIG.ARM5E.recovery.wounds[newType].label
                )} ${game.i18n.localize("arm5e.sheet.wound.label")}`;
              }

              newWound.healedDate = { year: this.object.curYear, season: this.object.curSeason };
              wound.nextRoll = 0;
              newWounds[newType].push(newWound);
              continue;
            }

            dataset.option5 = wound.bonus;
            patient.rollInfo.init(dataset, patient);
            const msg = await stressDie(
              patient,
              dataset.roll,
              4 /* Non interactive*/,
              undefined,
              1
            );
            const roll = msg.rolls[0];
            woundPeriodDescription +=
              `<li>${game.i18n.format("arm5e.sanatorium.msg.logWound", {
                type: game.i18n.localize("arm5e.sheet." + newType)
              })}` +
              `<br/>${game.i18n.format("arm5e.sanatorium.msg.logRoll", {
                total: roll.total,
                mod: roll.offset
              })} vs ${CONFIG.ARM5E.recovery.wounds[newType].improvement}<br/>`;
            if (roll.total >= CONFIG.ARM5E.recovery.wounds[newType].improvement) {
              woundPeriodDescription += `${game.i18n.format("arm5e.sanatorium.msg.logWoundBetter", {
                days: CONFIG.ARM5E.recovery.wounds[newType].interval
              })}`;
              log(false, "Wound improvement");
              newWound.bonus = 0;
              newWound.trend = -1;
              newWound.style = "improved";
            } else if (roll.total >= CONFIG.ARM5E.recovery.wounds[newType].stability) {
              log(false, "Wound stable");
              woundPeriodDescription += `${game.i18n.localize(
                "arm5e.sanatorium.msg.logWoundStable"
              )}`;
              newWound.bonus = wound.bonus + 3;
              newWound.trend = 0;
            } else {
              log(false, "Wound worsened");
              woundPeriodDescription += `${game.i18n.format("arm5e.sanatorium.msg.logWoundWorse", {
                days: CONFIG.ARM5E.recovery.wounds[newType].interval
              })}`;
              newWound.trend = 1;
              newWound.bonus = 0;
              newWound.style = "worsened";
            }
            woundPeriodDescription += "<br/></li>";
            newWound.img = CONFIG.ARM5E.recovery.wounds[newType].icon;

            let oldName = `${game.i18n.localize(
              CONFIG.ARM5E.recovery.wounds[type].label
            )} ${game.i18n.localize("arm5e.sheet.wound.label")}`;

            if (newWound.name == oldName) {
              newWound.name = `${game.i18n.localize(
                CONFIG.ARM5E.recovery.wounds[newType].label
              )} ${game.i18n.localize("arm5e.sheet.wound.label")}`;
            }

            recoverylog += woundPeriodDescription;

            newWound.nextRoll = wound.nextRoll + CONFIG.ARM5E.recovery.wounds[newType].interval;
            // if it is the first time the wound is treated, store the number of availble days the first season.
            if (newWound.recoveryTime == 0) {
              newWound.daysFirstSeason = this.object.availableDays;
            }
            newWound.recoveryTime += CONFIG.ARM5E.recovery.wounds[newType].interval;
            log(false, `Next roll: ${newWound.nextRoll}`);
            if (newWound.nextRoll > this.object.availableDays) {
              log(false, `Locked for this season`);
              newWound.nextRoll -= this.object.availableDays;
              newWound.locked = true;
            } else {
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
    recoverylog += `</u><br/><i>${this.patient._getWoundPenalty(
      this.object.wounds
    )} ${game.i18n.localize("arm5e.sheet.penalty")}</i>`;
    if (tmpPeriod == 1000) {
      tmpPeriod = this.object.availableDays;
      recoverylog += `<p>${game.i18n.localize("arm5e.sanatorium.msg.logDone")}</p>`;
    }
    recoverylog = await TextEditor.enrichHTML(recoverylog, { async: true });
    await this.submit({
      preventClose: true,
      updateData: {
        wounds: newWounds,
        log: recoverylog,
        nextRecoveryPeriod: tmpPeriod,
        dateChange: dateChange
      }
    });
  }

  prepareWounds() {
    // first find the appropriate date
    let currentTime = game.settings.get("arm5e", "currentDate");
    for (let [type, wounds] of Object.entries(this.patient.system.wounds)) {
      if (type == "healthy") continue;
      if (wounds.length > 0) {
        for (let wound of wounds) {
          let woundInflicted = wound.system.inflictedDate;
          if (wound.system.recoveryTime > 0) {
            let offset = Math.floor(
              (wound.system.recoveryTime -
                wound.system.daysFirstSeason +
                CONFIG.ARM5E.recovery.daysInSeason) /
                CONFIG.ARM5E.recovery.daysInSeason
            );
            woundInflicted = getShiftedDate(woundInflicted, offset);
          } else {
            this.object.dateChange = "";
          }

          if (seasonsDelta(woundInflicted, currentTime) > 0) {
            currentTime = woundInflicted;
          }
        }
      }
    }
    this.object.curSeason = currentTime.season;
    this.object.curYear = currentTime.year;

    let minNextRoll = 1000;
    for (let [type, wounds] of Object.entries(this.patient.system.wounds)) {
      if (type == "healthy") continue;
      if (wounds.length > 0) {
        this.object.wounds[type] = [];
        for (let wound of wounds) {
          let w = wound.system.toObject();
          w._id = wound._id;
          w.name = wound.name;
          w.img = wound.img;
          w.description = "";
          // if the wound has already been treated this season, lock it
          if (!wound.system.canBeTreatedThisSeason(this.object.curSeason, this.object.curYear)) {
            w.locked = true;
          } else {
            w.locked = false;
            if (wound.system.nextRoll < minNextRoll) {
              minNextRoll = wound.system.nextRoll;
            }
            this.object.hasWounds = true;
          }
          this.object.wounds[type].push(w);
        }
      }
    }
    if (minNextRoll != 1000) {
      this.object.nextRecoveryPeriod = minNextRoll;
    }
  }

  async _updateObject(event, formData) {
    const expanded = foundry.utils.expandObject(formData);
    foundry.utils.mergeObject(this.object, expanded, { recursive: true });
    this.render();
  }
}
