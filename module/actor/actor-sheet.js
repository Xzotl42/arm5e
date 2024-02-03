/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */

import { resetOwnerFields } from "../item/item-converter.js";
import { ARM5E } from "../config.js";
import {
  log,
  getLastMessageByHeader,
  calculateWound,
  getDataset,
  hermeticFilter,
  putInFoldableLinkWithAnimation,
  compareLabTexts,
  topicFilter,
  hermeticTopicFilter,
  diaryEntryFilter
} from "../tools.js";
import ArM5eActiveEffect from "../helpers/active-effects.js";
import {
  HERMETIC_FILTER,
  HERMETIC_TOPIC_FILTER,
  TIME_FILTER,
  TOPIC_FILTER,
  updateUserCache
} from "../constants/userdata.js";
import {
  prepareRollVariables,
  updateCharacteristicDependingOnRoll,
  renderRollTemplate,
  chooseTemplate,
  ROLL_MODES,
  getRollTypeProperties,
  usePower
} from "../helpers/rollWindow.js";

import { spellTechniqueLabel, spellFormLabel } from "../helpers/spells.js";
import { computeCombatStats, quickCombat, quickVitals } from "../helpers/combat.js";
import { quickMagic } from "../helpers/magic.js";
import { UI, getConfirmation } from "../constants/ui.js";
import { Schedule } from "../tools/schedule.js";
import { createAgingDiaryEntry } from "../helpers/long-term-activities.js";
import { Sanatorium } from "../tools/sanatorium.js";
import { MedicalHistory } from "../tools/med-history.js";
import { ArM5eActorProfiles } from "./subsheets/actor-profiles.js";
import { stressDie } from "../dice.js";

export class ArM5eActorSheet extends ActorSheet {
  constructor(object, options) {
    super(object, options);

    this.timeHook = Hooks.on("arm5e-date-change", async (date) => {
      if (this.actor._hasDate()) {
        this.actor.updateSource({ "datetime.year": date.year });
        this.render(false);
        log(false, "Render on date change");
      }
    });
    this.actorProfiles = new ArM5eActorProfiles(object);
  }

  // /** @override */
  static get defaultOptions() {
    const res = mergeObject(super.defaultOptions, {
      dragDrop: [
        { dragSelector: ".item-list .item", dropSelector: null },
        { dragSelector: ".macro-ready" }
      ]
      /*         classes: ["arm5e", "sheet", "actor"],
         template: "systems/arm5e/templates/actor/actor-pc-sheet.html",
         width: 1100,
         height: 900,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "description"
        }
      ]*/
    });
    return res;
  }

  _canDragStart(selector) {
    return this.isEditable;
  }

  async _onDrop(event) {
    return await super._onDrop(event);
  }

  /* -------------------------------------------- */

  isItemDropAllowed(item) {
    return false;

    // template for future sheet:
    // switch (item.type) {
    //     case "weapon":
    //     case "armor":
    //     case "spell":
    //     case "vis":
    //     case "item":
    //     case "book":
    //     case "virtue":
    //     case "flaw":
    //     case "ability":
    //     case "abilityFamiliar":
    //     case "diaryEntry":
    //     case "might":
    //     case "mightFamiliar":
    //     case "speciality":
    //     case "distinctive":
    //     case "sanctumRoom":
    //     case "personality":
    //     case "reputation":
    //     case "habitantMagi":
    //     case "habitantCompanion":
    //     case "habitantSpecialists":
    //     case "habitantHabitants":
    //     case "habitantHorses":
    //     case "habitantLivestock":
    //     case "possessionsCovenant":
    //     case "visSourcesCovenant":
    //     case "visStockCovenant":
    //     case "magicalEffect":
    //     case "baseEffect":
    //     case "calendarCovenant":
    //     case "incomingSource":
    //     case "laboratoryText":
    //         return true;
    //     default:
    //         return false;
    // }
  }

  isActorDropAllowed(type) {
    return false;
    // template for future sheet:
    // switch (type) {
    //     case "player":
    //     case "npc":
    //     case "laboratory":
    //     case "covenant":
    //     case "magicCodex":
    //         return true;
    //     default:
    //         return false;
    // }
  }

  // tells whether or not a type of item needs to be converted when dropped to a specific sheet.
  needConversion(type) {
    return false;
  }

  getUserCache() {
    let usercache = JSON.parse(sessionStorage.getItem(`usercache-${game.user.id}`));
    if (usercache[this.actor.id] == undefined) {
      usercache[this.actor.id] = {
        filters: {
          hermetic: {
            spells: HERMETIC_FILTER,
            magicalEffects: HERMETIC_FILTER,
            laboratoryTexts: HERMETIC_FILTER
          },
          bookTopics: {
            abilitiesTopics: TOPIC_FILTER,
            artsTopics: TOPIC_FILTER,
            masteriesTopics: HERMETIC_TOPIC_FILTER
          },
          events: {
            diaryEvents: TIME_FILTER
          }
        },
        sections: {
          visibility: { common: {} }
        }
      };

      sessionStorage.setItem(`usercache-${game.user.id}`, JSON.stringify(usercache));
    } else if (usercache[this.actor.id].sections?.visibility == undefined) {
      usercache[this.actor.id].sections = { visibility: { common: {} } };
      sessionStorage.setItem(`usercache-${game.user.id}`, JSON.stringify(usercache));
    }
    return usercache[this.actor.id];
  }

  /** @override */
  async getData() {
    const context = await super.getData();

    const actorData = context.actor;
    context.ui = this.getUserCache();

    // Add the actor's data to context.system for easier access, as well as flags.
    context.system = actorData.system;
    context.flags = actorData.flags;

    context.config = CONFIG.ARM5E;
    context.abilityKeys = CONFIG.ARM5E.ALL_ABILITIES;
    context.abilityKeys[""] = {
      mnemonic: "arm5e.sheet.skill.abilityNoKey",
      option: false,
      selection: "disabled"
    };

    // context.system.dtypes = ["String", "Number", "Boolean"];

    // Xzotl : not sure what this was used for
    // for (let attr of Object.values(context.system.attributes)) {
    //   attr.isCheckbox = attr.dtype === "Boolean";
    // }

    // Allow effect creation
    context.datetime = context.datetime = game.settings.get("arm5e", "currentDate");
    context.datetime.seasonLabel = game.i18n.localize(
      CONFIG.ARM5E.seasons[context.datetime.season].label
    );

    actorData.system.effectCreation = game.user.isTrusted;

    if (this.actor.type != "magicCodex") {
      // topic filters
      // 1. Filter
      // Arts
      let artsFilters = context.ui.filters.bookTopics.artsTopics;
      // log(false, "Filter: " + JSON.stringify(artsFilters));
      context.system.filteredArtsTopics = topicFilter(
        artsFilters,
        context.system.artsTopics,
        "art"
      );
      // context.system.filteredArtsTopics = context.system.artsTopics;
      if (artsFilters.expanded) {
        context.ui.artsFilterVisibility = "";
      } else {
        context.ui.artsFilterVisibility = "hidden";
      }
      if (
        artsFilters.topic != "" ||
        artsFilters.typeFilter != "" ||
        (artsFilters.levelFilter != 0 && artsFilters.levelFilter != null) ||
        (artsFilters.qualityFilter != 0 && artsFilters.qualityFilter != null)
      ) {
        context.ui.artsTopicsFilter = UI.STYLES.FILTER_ACTIVE;
      }

      // 1. Filter
      // abilities
      let abilitiesFilters = context.ui.filters.bookTopics.abilitiesTopics;
      // log(false, "Filter: " + JSON.stringify(abilitiesFilters));
      context.system.filteredMundaneTopics = topicFilter(
        abilitiesFilters,
        context.system.mundaneTopics,
        "key"
      );
      if (abilitiesFilters.expanded) {
        context.ui.abilitiesFilterVisibility = "";
      } else {
        context.ui.abilitiesFilterVisibility = "hidden";
      }
      if (
        abilitiesFilters.topic != "" ||
        abilitiesFilters.typeFilter != "" ||
        (abilitiesFilters.levelFilter != 0 && abilitiesFilters.levelFilter != null) ||
        (abilitiesFilters.qualityFilter != 0 && abilitiesFilters.qualityFilter != null)
      ) {
        context.ui.abilitiesTopicsFilter = UI.STYLES.FILTER_ACTIVE;
      }

      //  Filter
      // masteries
      let masteriesFilters = context.ui.filters.bookTopics.masteriesTopics;
      log(false, "Masteries filter: " + JSON.stringify(masteriesFilters));
      context.system.filteredMasteriesTopics = hermeticTopicFilter(
        masteriesFilters,
        context.system.masteryTopics
      );
      if (masteriesFilters.expanded) {
        context.ui.masteriesFilterVisibility = "";
      } else {
        context.ui.masteriesFilterVisibility = "hidden";
      }
      if (
        masteriesFilters.formFilter != "" ||
        masteriesFilters.techniqueFilter != "" ||
        (masteriesFilters.levelFilter != 0 && masteriesFilters.levelFilter != null)
      ) {
        context.ui.masteriesTopicsFilter = UI.STYLES.FILTER_ACTIVE;
      }
    }

    context.system.isCharacter = this.actor._isCharacter();
    if (context.system.isCharacter) {
      if (context.system.charType?.value === "entity") {
        let value = Object.entries(context.system.realms).find((e) => e[1].aligned == true);
        context.system.realm = value ? value[0] : "mundane";
      }
      for (let [key, v] of Object.entries(context.system.vitals)) {
        v.label = game.i18n.localize(CONFIG.ARM5E.character.vitals[key].label);
      }
      if (context.system.wounds) {
        context.health = {
          light: context.system.wounds.light,
          medium: context.system.wounds.medium,
          heavy: context.system.wounds.heavy,
          incap: context.system.wounds.incap,
          dead: context.system.wounds.dead
        };
      }
      context.isDead = this.actor.system.wounds.dead.length > 0;
      context.system.isMagus = this.actor._isMagus();
      if (context.system.covenant) {
        if (context.system.covenant.linked) {
          this.actor.apps[context.system.covenant.document.sheet.appId] =
            context.system.covenant.document.sheet;
        }
      }

      if (
        context.system?.charType?.value == "magusNPC" ||
        context.system?.charType?.value == "magus"
      ) {
        // Arts icons style
        context.artsIcons = game.settings.get("arm5e", "artsIcons");

        // check whether the character is linked to an existing lab
        if (context.system.sanctum) {
          if (context.system.sanctum.linked) {
            this.actor.apps[context.system.sanctum.document.sheet.appId] =
              context.system.sanctum.document.sheet;
          }
        }

        // casting total modifiers

        if (context.system.castingtotal === undefined) {
          context.system.castingtotal = {};
        }
        if (context.system.castingtotal.modifier === undefined) {
          context.system.castingtotal.modifier = 0;
        }

        if (context.system.castingtotal.aura === undefined) {
          context.system.castingtotal.aura = 0;
        }
        if (context.system.castingtotal.applyFocus == undefined) {
          context.system.castingtotal.applyFocus = false;
        }

        if (context.system.castingtotal.divider == undefined) {
          context.system.castingtotal.divider = 1;
        }

        // lab total modifiers

        if (context.system.sanctum.linked) {
          const lab = context.system.sanctum.document;
          context.system.labTotal.quality = parseInt(lab.system.generalQuality.total);
          // store the specialties if the character is linked to a lab
          context.system.labTotal.specialty = lab.system.specialty;
          context.system.labTotal.aura = lab.system.aura.computeMaxAuraModifier(
            this.actor.system.realms
          );
        } else {
          context.system.labTotal.quality = 0;
          context.system.labTotal.aura = 0;
        }

        // hermetic filters
        // 1. Filter
        // Spells
        let spellsFilters = context.ui.filters.hermetic.spells;
        context.system.filteredSpells = hermeticFilter(spellsFilters, context.system.spells);
        if (spellsFilters.expanded) {
          context.ui.spellsFilterVisibility = "";
        } else {
          context.ui.spellsFilterVisibility = "hidden";
        }
        if (
          spellsFilters.formFilter != "" ||
          spellsFilters.techniqueFilter != "" ||
          (spellsFilters.levelFilter != 0 && spellsFilters.levelFilter != null)
        ) {
          context.ui.spellFilter = UI.STYLES.FILTER_ACTIVE;
        }

        // magical effects
        let magicEffectFilters = context.ui.filters.hermetic.magicalEffects;
        context.system.filteredMagicalEffects = hermeticFilter(
          magicEffectFilters,
          context.system.magicalEffects
        );
        if (magicEffectFilters.expanded) {
          context.ui.magicEffectFilterVisibility = "";
        } else {
          context.ui.magicEffectFilterVisibility = "hidden";
        }
        if (
          magicEffectFilters.formFilter != "" ||
          magicEffectFilters.techniqueFilter != "" ||
          (magicEffectFilters.levelFilter != 0 && magicEffectFilters.levelFilter != null)
        ) {
          context.ui.magicEffectFilter = UI.STYLES.FILTER_ACTIVE;
        }
        // 2. Sort (not needed since done in prepareData?)
        // context.system.spells = context.system.spells.sort(compareSpells);
        // context.system.magicalEffects = context.system.magicalEffects.sort(compareMagicalEffects);

        // magic arts
        for (let [key, technique] of Object.entries(context.system.arts.techniques)) {
          if (technique.deficient) {
            technique.ui = {
              style: UI.STYLES.DEFICIENT_ART,
              title: game.i18n.localize("arm5e.sheet.activeEffect.types.arts.deficiency")
            };
          } else if (!technique.bonus && technique.xpCoeff == 1.0) {
            technique.ui = { style: UI.STYLES.STANDARD_ART };
          } else if (!technique.bonus && technique.xpCoeff != 1.0) {
            technique.ui = {
              style: UI.STYLES.AFINITY_ART,
              title: game.i18n.localize("arm5e.sheet.activeEffect.types.arts.affinity")
            };
          } else if (technique.bonus && technique.xpCoeff == 1.0) {
            technique.ui = {
              style: UI.STYLES.PUISSANT_ART,
              title: ""
            };
          } else {
            technique.ui = {
              style: UI.STYLES.COMBO_ART,
              title: game.i18n.localize("arm5e.sheet.activeEffect.types.arts.affinity")
            };
          }
        }

        // castingTotals
        context.system.castingTotals = {};
        // labTotals
        context.system.labTotals = {};
        context.system.labTotal = context.system.labTotal ?? {};
        for (let [key, form] of Object.entries(context.system.arts.forms)) {
          if (form.deficient) {
            form.ui = {
              style: UI.STYLES.DEFICIENT_ART,
              title: game.i18n.localize("arm5e.sheet.activeEffect.types.arts.deficiency")
            };
          } else if (!form.bonus && form.xpCoeff == 1.0) {
            form.ui = { style: UI.STYLES.STANDARD_ART };
          } else if (!form.bonus && form.xpCoeff != 1.0) {
            form.ui = {
              style: UI.STYLES.AFINITY_ART,
              title: game.i18n.localize("arm5e.sheet.activeEffect.types.arts.affinity")
            };
          } else if (form.bonus && form.xpCoeff == 1.0) {
            form.ui = {
              style: UI.STYLES.PUISSANT_ART,
              title: ""
            };
          } else {
            form.ui = {
              style: UI.STYLES.COMBO_ART,
              title: game.i18n.localize("arm5e.sheet.activeEffect.types.arts.affinity")
            };
          }

          // compute casting totals:
          context.system.castingTotals[key] = {};
          // compute lab totals:
          context.system.labTotals[key] = {};

          for (let [k2, technique] of Object.entries(context.system.arts.techniques)) {
            let techScoreLab = technique.finalScore;
            let formScoreLab = form.finalScore;
            if (context.system.labTotal?.applyFocus) {
              if (techScoreLab > formScoreLab) {
                formScoreLab *= 2;
              } else {
                techScoreLab *= 2;
              }
            }

            let deficiencyDivider = 1;
            if (technique.deficient && form.deficient) {
              deficiencyDivider = 4;
            } else if (technique.deficient || form.deficient) {
              deficiencyDivider = 2;
            }

            context.system.labTotals[key][k2] = { ui: "" };

            if (context.system.sanctum.linked) {
              // set a ui effect if the value is modified
              let specialtyMod =
                context.system.labTotal.specialty[key].bonus +
                context.system.labTotal.specialty[k2].bonus;
              if (specialtyMod > 0) {
                context.system.labTotals[key][
                  k2
                ].ui = `style="box-shadow: 0 0 5px blue" title="${game.i18n.localize(
                  "arm5e.sheet.activeEffect.types.laboratorySpec"
                )}: ${specialtyMod}"`;
              } else if (specialtyMod < 0) {
                context.system.labTotals[key][
                  k2
                ].ui = `style="box-shadow: 0 0 5px red" title="${game.i18n.localize(
                  "arm5e.sheet.activeEffect.types.laboratorySpec"
                )}: ${specialtyMod}"`;
              }

              // add technique and form specialty bonuses
              techScoreLab += context.system.labTotal.specialty[key].bonus;
              formScoreLab += context.system.labTotal.specialty[k2].bonus;
            }
            context.system.labTotals[key][k2].total = Math.round(
              (formScoreLab +
                techScoreLab +
                context.system.laboratory.basicLabTotal.value +
                parseInt(context.system.labTotal.quality ?? 0) +
                parseInt(context.system.labTotal.aura ?? 0) +
                parseInt(context.system.labTotal.modifier ?? 0) +
                context.system.bonuses.arts.laboratory) /
                deficiencyDivider
            );

            let techScoreCast = technique.finalScore;
            let formScoreCast = form.finalScore;
            if (context.system.castingtotal.applyFocus) {
              if (techScoreCast > formScoreCast) {
                formScoreCast *= 2;
              } else {
                techScoreCast *= 2;
              }
            }
            context.system.castingTotals[key][k2] = Math.round(
              (formScoreCast +
                techScoreCast +
                context.system.characteristics.sta.value +
                context.system.castingtotal.aura +
                context.system.castingtotal.modifier) /
                Number(context.system.castingtotal.divider) /
                deficiencyDivider
            );
          }
        }
      }
      context.sortedAbilities = foundry.utils.deepClone(CONFIG.ARM5E.LOCALIZED_ABILITIESCAT);

      for (let [key, ab] of Object.entries(context.system.abilities)) {
        if (!context.sortedAbilities[ab.system.category].abilities) {
          context.sortedAbilities[ab.system.category].abilities = [];
        }
        context.sortedAbilities[ab.system.category].abilities.push(ab);

        if (ab.system.derivedScore == ab.system.finalScore && ab.system.xpCoeff == 1.0) {
          // ui related stuff
          ab.ui = { style: "" };
        } else if (ab.system.derivedScore == ab.system.finalScore && ab.system.xpCoeff != 1.0) {
          ab.ui = { style: UI.STYLES.AFFINITY_ABILITY, title: "Affinity, " };
        } else if (ab.system.derivedScore != ab.system.finalScore && ab.system.xpCoeff == 1.0) {
          ab.ui = { style: UI.STYLES.PUISSANT_ABILITY, title: "" };
        } else {
          ab.ui = { style: UI.STYLES.COMBO_ABILITY, title: "Affinity, " };
        }
      }
      // let flag = this.actor.getFlag("arm5e", "sorting", "abilities");
      // if (flag && flag["abilities"] == true) {
      //   context.sortedAbilities = Object.entries(context.sortedAbilities).sort((a, b) => {
      //     return a[1].label.localeCompare(b[1].label);
      //   });
      // }

      for (let [key, charac] of Object.entries(context.system.characteristics)) {
        let shadowWidth = 2 * charac.aging;
        charac.ui = {
          style: 'style="box-shadow: 0 0 ' + shadowWidth + 'px black"',
          title: `${charac.aging} ` + game.i18n.localize("arm5e.sheet.agingPts")
        };
        // log(false, `${key} has ${charac.aging} points`);
      }

      context.combat = computeCombatStats(this.actor);

      for (let [key, charac] of Object.entries(context.system.characteristics)) {
        let shadowWidth = 2 * charac.aging;
        charac.ui = {
          style: 'style="box-shadow: 0 0 ' + shadowWidth + 'px black"',
          title: `${charac.aging} ` + game.i18n.localize("arm5e.sheet.agingPts")
        };
        // log(false, `${key} has ${charac.aging} points`);
      }
    }

    if (context.system.diaryEntries) {
      //  Filter
      // activities
      let diaryFilters = context.ui.filters.events.diaryEvents;
      log(false, "Events filter: " + JSON.stringify(diaryFilters));
      let diaryCopy = context.system.diaryEntries.map((e) => {
        return e.toObject();
      });
      let filteredActivities = diaryEntryFilter(diaryFilters, diaryCopy);
      if (diaryFilters.expanded) {
        context.ui.diaryFilterVisibility = "";
      } else {
        context.ui.diaryFilterVisibility = "hidden";
      }
      if (
        diaryFilters.typeFilter != "" ||
        (diaryFilters.minYearFilter != 0 && diaryFilters.minYearFilter != null) ||
        (diaryFilters.maxYearFilter != 0 && diaryFilters.maxYearFilter != null)
      ) {
        context.ui.diaryFilter = UI.STYLES.FILTER_ACTIVE;
      }

      const activitiesMap = new Map();
      for (let entry of filteredActivities) {
        let step = 1;
        for (let date of entry.system.dates) {
          let activity = {};
          if (entry.system.done || entry.system.activity == "none") {
            activity.ui = { diary: 'style="font-style: normal;"' };
          } else {
            activity.ui = { diary: 'style="font-style: italic;"' };
          }

          if (entry.system.dates.length > 1) {
            // TODO localize
            activity.name = `${entry.name} (${step} of ${entry.system.dates.length})`;
          } else {
            activity.name = entry.name;
          }
          step++;
          activity.img = entry.img;
          activity.type = game.i18n.localize(
            CONFIG.ARM5E.activities.generic[entry.system.activity].label
          );
          activity.date = date.date;

          activity._id = entry._id;
          if (!activitiesMap.has(date.year)) {
            activitiesMap.set(date.year, {
              [CONFIG.SEASON_ORDER_INV[3]]: [],
              [CONFIG.SEASON_ORDER_INV[2]]: [],
              [CONFIG.SEASON_ORDER_INV[1]]: [],
              [CONFIG.SEASON_ORDER_INV[0]]: []
            });
          }
          activitiesMap.get(date.year)[date.season].push(activity);
        }
      }
      context.system.activities = Array.from(
        new Map(
          [...activitiesMap.entries()].sort(function (a, b) {
            return b[0] - a[0];
          })
        ),
        ([key, value]) => ({
          year: key,
          seasons: value
        })
      );
    }

    if (
      actorData.type == "player" ||
      actorData.type == "npc" ||
      actorData.type == "laboratory" ||
      actorData.type == "covenant"
    ) {
      // hermetic filters
      // 1. Filter
      //
      let labtTextFilters = context.ui.filters.hermetic.laboratoryTexts;
      // if (!labtTextFilters) {
      //   labtTextFilters = { formFilter: "", levelFilter: "", levelOperator: 0, techniqueFilter: "" };
      // }
      context.system.filteredLaboratoryTexts = hermeticFilter(
        labtTextFilters,
        context.system.laboratoryTexts
      );
      if (labtTextFilters.expanded) {
        context.ui.labtTextFilterVisibility = "";
      } else {
        context.ui.labtTextFilterVisibility = "hidden";
      }
      if (
        labtTextFilters.formFilter != "" ||
        labtTextFilters.techniqueFilter != "" ||
        (labtTextFilters.levelFilter != 0 && labtTextFilters.levelFilter != null)
      ) {
        context.ui.labTextFilter = UI.STYLES.FILTER_ACTIVE;
      }
      // 2. Sort
      context.system.filteredLaboratoryTexts =
        context.system.filteredLaboratoryTexts.sort(compareLabTexts);
    }
    context.isGM = game.user.isGM;

    context.devMode = game.modules.get("_dev-mode")?.api?.getPackageDebugValue(ARM5E.SYSTEM_ID);
    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

    // Prepare active effects
    context.effects = ArM5eActiveEffect.prepareActiveEffectCategories(
      CONFIG.ISV10 ? this.actor.effects : Array.from(this.actor.allApplicableEffects())
    );
    this._prepareCharacterItems(context);

    return context;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterItems(actorData) {
    if (
      actorData.actor.type == "player" ||
      actorData.actor.type == "npc" ||
      actorData.actor.type == "laboratory" ||
      actorData.actor.type == "covenant"
    ) {
      for (let virtue of actorData.system.virtues) {
        if (virtue.effects.size > 0) {
          virtue.system.ui = { style: 'style="font-style:italic"' };
        }
      }

      for (let flaw of actorData.system.flaws) {
        if (flaw.effects.size > 0) {
          flaw.system.ui = { style: 'style="font-style:italic"' };
        }
      }

      for (let mastery of actorData.system.masteryTopics) {
        mastery.spellLabel = `${mastery.spellName} (${
          CONFIG.ARM5E.magic.arts[mastery.spellTech].short
        }${CONFIG.ARM5E.magic.arts[mastery.spellForm].short})`;
      }
    }

    if (actorData.actor.type == "player" || actorData.actor.type == "npc") {
      for (let spell of actorData.system.spells) {
        spell.TechReq = spellTechniqueLabel(spell.system);
        spell.FormReq = spellFormLabel(spell.system);
        spell.masteryHint =
          spell.system.finalScore > 0
            ? `<i title="${game.i18n.localize("arm5e.spell.masteryHint")} ${
                spell.system.finalScore
              }" class="icon-Icon_Effects-small"></i>`
            : "";
      }

      for (let effect of actorData.system.magicalEffects) {
        effect.TechReq = spellTechniqueLabel(effect.system);
        effect.FormReq = spellFormLabel(effect.system);
      }
    }
    if (actorData.system.items) {
      for (let item of actorData.system.items) {
        item.magicHint =
          item.system.state === "inert"
            ? ""
            : `<i title="${game.i18n.localize(
                ARM5E.lab.enchantment.receptacle.state[item.system.state]
              )}" class="icon-Icon_Effects-small"></i>`;
      }
    }
    if (actorData.system.weapons) {
      for (let item of actorData.system.weapons) {
        item.magicHint =
          item.system.state === "inert"
            ? ""
            : `<i title="${game.i18n.localize(
                ARM5E.lab.enchantment.receptacle.state[item.system.state]
              )}" class="icon-Icon_Effects-small"></i>`;
      }
    }
    if (actorData.system.armor) {
      for (let item of actorData.system.armor) {
        item.magicHint =
          item.system.state === "inert"
            ? ""
            : `<i title="${game.i18n.localize(
                ARM5E.lab.enchantment.receptacle.state[item.system.state]
              )}" class="icon-Icon_Effects-small"></i>`;
      }
    }
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    html.find(".recovery-start").click(async (ev) => {
      let input = getDataset(ev);
      await Sanatorium.createDialog(this.actor);
    });

    html.find(".schedule-aging").click(async (ev) => {
      let input = getDataset(ev);
      let diary = await createAgingDiaryEntry(this.actor, input);
      diary[0].sheet.render(true);
    });

    html.find(".character-schedule").click(this.displaySchedule.bind(this));

    html.find(".ability-category").click(async (ev) => {
      const category = $(ev.currentTarget).data("category");
      document.getElementById(category).classList.toggle("hide");
      // let tmp2 = tmp.toggle("hide");
    });

    html.find(".book-topic").click(async (ev) => {
      const category = $(ev.currentTarget).data("topic");
      document.getElementById(category).classList.toggle("hide");
    });

    html.find(".view-med-history").click(async (ev) => {
      await MedicalHistory.createDialog(this.actor);
    });

    html.find(".section-handle").click(async (ev) => {
      const dataset = getDataset(ev);
      log(false, `DEBUG section: ${dataset.section}, category: ${dataset.category}`);
      let index = dataset.index ?? "";
      let usercache = JSON.parse(sessionStorage.getItem(`usercache-${game.user.id}`));
      let scope = usercache[this.actor._id].sections.visibility[dataset.category];
      let classes = document.getElementById(
        `${dataset.category}-${dataset.section}${index}-${this.actor._id}`
      ).classList;
      if (scope) {
        if (classes.contains("hide")) {
          if (index !== "") {
            log(false, `DEBUG reveal ${dataset.section} at index ${index}`);
            scope[index][dataset.section] = "";
          } else {
            log(false, `DEBUG reveal ${dataset.section}`);
            scope[dataset.section] = "";
          }
        } else {
          if (index !== "") {
            log(false, `DEBUG hide ${dataset.section} at index ${index}`);
            scope[index][dataset.section] = "hide";
          } else {
            log(false, `DEBUG hide ${dataset.section}`);
            scope[dataset.section] = "hide";
          }
        }
        sessionStorage.setItem(`usercache-${game.user.id}`, JSON.stringify(usercache));
      }
      classes.toggle("hide");
    });

    html.find(".covenant-link").change(async (ev) => {
      ev.preventDefault();
      const val = ev.target.value;
      const cov = game.actors.getName(val);
      // if the actor was linked, remove listener
      if (this.actor.system.covenant.linked) {
        delete this.actor.apps[this.actor.system.covenant.document.sheet.appId];
        await this.actor.system.covenant.document.sheet._unbindActor(this.actor);
      }
      let updateData = { "system.covenant.value": val };
      if (cov) {
        updateData["system.covenant.actorId"] = cov._id;

        await cov.sheet._bindActor(this.actor);
      } else {
        updateData["system.covenant.actorId"] = null;
      }
      await this.actor.update(updateData);
    });

    html.find(".owner-link").change(async (ev) => {
      ev.preventDefault();
      const val = ev.target.value;
      const owner = game.actors.getName(val);
      // if the actor was linked, remove listener
      if (this.actor.system.owner.linked) {
        delete this.actor.apps[this.actor.system.owner.document.sheet.appId];
        await this.actor.system.owner.document.sheet._unbindActor(this.actor);
      }
      let updateData = { "system.owner.value": val };
      if (owner) {
        updateData["system.owner.actorId"] = owner._id;
        await owner.sheet._bindActor(this.actor);
      } else {
        updateData["system.owner.actorId"] = null;
      }
      await this.actor.update(updateData);
    });

    html.find(".sanctum-link").change(async (ev) => {
      ev.preventDefault();
      const val = ev.target.value;
      const sanctum = game.actors.getName(val);
      // if the actor was linked, remove listener
      if (this.actor.system.sanctum.linked) {
        delete this.actor.apps[this.actor.system.sanctum.document.sheet.appId];
        await this.actor.system.sanctum.document.sheet._unbindActor(this.actor);
      }
      let updateData = { "system.sanctum.value": val };
      if (sanctum) {
        updateData["system.sanctum.actorId"] = sanctum._id;
        await sanctum.sheet._bindActor(this.actor);
      } else {
        updateData["system.sanctum.actorId"] = null;
      }
      await this.actor.update(updateData);
    });

    html.find(".actor-profile").click(this.actorProfiles.addProfile.bind(this));

    // filters
    html.find(".toggleHidden").click(async (ev) => {
      const dataset = getDataset(ev);
      const tmp = html.find(`.${dataset.list}`).attr("class");
      const val = tmp.indexOf("hidden");
      updateUserCache(this.actor.id, dataset.category, dataset.list, "expanded", val >= 0);
      html.find(`.${dataset.list}`).toggleClass("hidden");
    });

    html.find(".topic-filter").change(async (ev) => {
      ev.preventDefault();
      const dataset = getDataset(ev);
      const val = ev.target.value;
      updateUserCache(this.actor.id, dataset.category, dataset.list, "topicFilter", val);
      this.render();
    });

    html.find(".type-filter").change(async (ev) => {
      ev.preventDefault();
      const dataset = getDataset(ev);
      const val = ev.target.value;
      updateUserCache(this.actor.id, dataset.category, dataset.list, "typeFilter", val);
      this.render();
    });

    html.find(".technique-filter").change(async (ev) => {
      ev.preventDefault();
      const dataset = getDataset(ev);
      const val = ev.target.value;
      updateUserCache(this.actor.id, dataset.category, dataset.list, "techniqueFilter", val);
      this.render();
    });

    html.find(".form-filter").change(async (ev) => {
      ev.preventDefault();
      const dataset = getDataset(ev);
      const val = ev.target.value;
      updateUserCache(this.actor.id, dataset.category, dataset.list, "formFilter", val);
      this.render();
    });

    html.find(".levelOperator-filter").change(async (ev) => {
      ev.preventDefault();
      const dataset = getDataset(ev);
      const val = ev.target.value;
      updateUserCache(this.actor.id, dataset.category, dataset.list, "levelOperator", val);
      this.render();
    });

    html.find(".level-filter").change(async (ev) => {
      ev.preventDefault();
      const dataset = getDataset(ev);
      const val = ev.target.value;
      updateUserCache(this.actor.id, dataset.category, dataset.list, "levelFilter", val);
      this.render();
    });

    html.find(".qualityOperator-filter").change(async (ev) => {
      ev.preventDefault();
      const dataset = getDataset(ev);
      const val = ev.target.value;
      updateUserCache(this.actor.id, dataset.category, dataset.list, "qualityOperator", val);
      this.render();
    });

    html.find(".quality-filter").change(async (ev) => {
      ev.preventDefault();
      const dataset = getDataset(ev);
      const val = ev.target.value;
      updateUserCache(this.actor.id, dataset.category, dataset.list, "qualityFilter", val);
      this.render();
    });
    html.find(".minyear-filter").change(async (ev) => {
      ev.preventDefault();
      const dataset = getDataset(ev);
      const val = ev.target.value;
      updateUserCache(this.actor.id, dataset.category, dataset.list, "minYearFilter", val);
      this.submit({ preventClose: true });
      this.render();
    });

    html.find(".maxyear-filter").change(async (ev) => {
      ev.preventDefault();
      const dataset = getDataset(ev);
      const val = ev.target.value;
      updateUserCache(this.actor.id, dataset.category, dataset.list, "maxYearFilter", val);
      this.submit({ preventClose: true });
      this.render();
    });

    html.find(".sortable").click((ev) => {
      const listName = ev.currentTarget.dataset.list;
      let val = this.actor.getFlag("arm5e", "sorting");
      if (val === undefined) {
        this.actor.setFlag("arm5e", "sorting", {
          [listName]: true
        });
      } else {
        this.actor.setFlag("arm5e", "sorting", {
          [listName]: !val[listName]
        });
      }
    });

    html.find(".vis-study").click(async (ev) => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.getEmbeddedDocument("Item", li.data("itemId"));
      if (!this.actor._isMagus()) return;
      const entry = await item.system.createDiaryEntry(this.actor);
      entry.sheet.render(true);
    });

    html.find(".study-labtext").click(async (ev) => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.getEmbeddedDocument("Item", li.data("itemId"));
      if (!this.actor._isMagus()) return;
      await item._studyLabText(item, ev);
    });

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Render the linked actor sheet for viewing/editing prior to the editable check.
    html.find(".actor-link").click(this._onActorRender.bind(this));

    // Add Inventory Item
    html.find(".item-create").click(this._onItemCreate.bind(this));

    // Update Inventory Item
    html.find(".item-edit").click((ev) => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.getEmbeddedDocument("Item", li.data("itemId"));
      // const item = this.actor.items.get(li.data("itemId"))
      item.sheet.render(true, { focus: true });
    });

    html.find(".wound-edit").click((ev) => {
      const item = this.actor.getEmbeddedDocument("Item", $(ev.currentTarget).data("id"));
      item.sheet.render(true, { focus: true });
    });

    html.find(".item").contextmenu((ev) => {
      let li = ev.currentTarget;
      let item = this.document.items.get(li.dataset.itemId);
      if (item && item.system.description) {
        this._onDropdown($(ev.currentTarget), item.system.description);
      }
    });

    // Update Inventory Item
    html.find(".book-edit").click(async (ev) => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.getEmbeddedDocument("Item", li.data("itemId"));
      await item.setFlag("arm5e", "currentBookTopic", Number(li.data("index")));
      // const item = this.actor.items.get(li.data("itemId"))
      item.sheet.render(true);
      // item.sheet._tabs[0].activate("topics");
    });

    html.find(".increase-tech").click((event) => {
      const element = $(event.currentTarget).parents(".art");
      this._increaseArt("techniques", element[0].dataset.attribute);
    });
    html.find(".decrease-tech").click((event) => {
      const element = $(event.currentTarget).parents(".art");
      this._deccreaseArt("techniques", element[0].dataset.attribute);
    });

    html.find(".increase-form").click((event) => {
      const element = $(event.currentTarget).parents(".art");
      this._increaseArt("forms", element[0].dataset.attribute);
    });
    html.find(".decrease-form").click((event) => {
      const element = $(event.currentTarget).parents(".art");
      this._deccreaseArt("forms", element[0].dataset.attribute);
    });

    html.find(".resource-focus").focus((ev) => {
      ev.preventDefault();
      ev.currentTarget.select();
    });

    // Quick edit of Item from inside Actor sheet
    html.find(".quick-edit").change((event) => {
      const li = $(event.currentTarget).parents(".item");
      let field = $(event.currentTarget).attr("name");
      let itemId = li.data("itemId");
      const item = this.actor.getEmbeddedDocument("Item", itemId);
      let value = event.target.value;
      if ($(event.currentTarget).attr("data-dtype") === "Number") {
        value = Number(event.target.value);
      } else if ($(event.currentTarget).attr("data-dtype") === "Boolean") {
        let oldValue = item.system[[field]];
        value = !oldValue;
      }

      this.actor.updateEmbeddedDocuments("Item", [
        {
          _id: itemId,
          system: {
            [field]: value
          }
        }
      ]);
    });

    html.find(".item-delete").click(async (ev) => {
      this._itemDelete(ev);
    });

    // Delete Inventory Item and always ask for confirmation
    html.find(".item-delete-confirm").click(async (event) => {
      event.preventDefault();
      const question = game.i18n.localize("arm5e.dialog.delete-question");
      const li = $(event.currentTarget).parents(".item");
      let itemId = li.data("itemId");
      let confirm = await getConfirmation(
        li[0].dataset.name,
        question,
        ArM5eActorSheet.getFlavor(this.actor.type)
      );

      if (confirm) {
        itemId = itemId instanceof Array ? itemId : [itemId];
        await this.actor.deleteEmbeddedDocuments("Item", itemId, {});
        li.slideUp(200, () => this.render(false));
      }
    });

    html.find(".rest").click((ev) => {
      if (this.actor.type === "player" || this.actor.type === "npc" || this.actor.type == "beast") {
        this.actor.rest();
      }
    });

    // Rollable abilities.
    html.find(".rollable").click(this._onRoll.bind(this));

    html.find(".rollable-aging").click(async (event) => {
      if (event.shiftKey) {
        this._editAging(event);
      } else this._onRoll(event);
    });

    html.find(".soak-damage").click(this._onSoakDamage.bind(this));
    html.find(".damage").click(this._onCalculateDamage.bind(this));
    html.find(".power-use").click(this._onUsePower.bind(this));
    html.find(".addFatigue").click(async (event) => this.actor._changeFatigueLevel(1));
    html.find(".removeFatigue").click(async (event) => this.actor._changeFatigueLevel(-1));
    html.find(".add-wound").click(async (event) => {
      const dataset = getDataset(event);
      await this.actor.changeWound(1, dataset.type);
    });

    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = (ev) => this._onDragStart(ev);
      html.find("li.item").each((i, li) => {
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }

    // Active Effect management
    html
      .find(".effect-control")
      .click((ev) => ArM5eActiveEffect.onManageActiveEffect(ev, this.actor));

    // migrate actor
    html.find(".migrate").click((event) => this.actor.migrate());

    html.find(".plan-reading").click(async (ev) => this._readBook(ev));
  }

  async _readBook(ev) {
    ev.preventDefault();
    const li = $(ev.currentTarget).parents(".item");
    const item = this.actor.getEmbeddedDocument("Item", li.data("itemId"));
    const dataset = getDataset(ev);
    await item.system.readBook(item, dataset);
  }

  // Delete Inventory Item, optionally ask for confirmation
  async _itemDelete(ev) {
    ev.preventDefault();
    const li = $(ev.currentTarget).parents(".item");
    let itemId = li.data("itemId");
    itemId = itemId instanceof Array ? itemId : [itemId];
    let confirmed = true;
    if (game.settings.get("arm5e", "confirmDelete")) {
      const question = game.i18n.localize("arm5e.dialog.delete-question");
      confirmed = await getConfirmation(
        li[0].dataset.name,
        question,
        ArM5eActorSheet.getFlavor(this.actor.type)
      );
    }
    if (confirmed) {
      itemId = itemId instanceof Array ? itemId : [itemId];
      this.actor.deleteEmbeddedDocuments("Item", itemId, {});
      li.slideUp(200, () => this.render(false));
    }
  }

  async _editAging(event) {
    log(false, "Edit aging");
    const dataset = getDataset(event);
    const score = this.actor.system.characteristics[dataset.characteristic].value;
    let dialogData = {
      label: game.i18n.localize(
        CONFIG.ARM5E.character.characteristics[dataset.characteristic].label
      ),
      value: score,
      aging: this.actor.system.characteristics[dataset.characteristic].aging,
      fieldName: "arm5e.sheet.agingPts"
    };

    const html = await renderTemplate(
      "systems/arm5e/templates/generic/agingPointsEdit.html",
      dialogData
    );

    new Dialog(
      {
        title: game.i18n.format("arm5e.hints.edit", {
          item: game.i18n.localize("arm5e.sheet.agingPts")
        }),
        content: html,
        render: this.addListenersDialog,
        buttons: {
          yes: {
            icon: "<i class='fas fa-check'></i>",
            label: game.i18n.localize("arm5e.sheet.action.apply")
          }
        },
        default: "yes",
        close: async (html) => {
          let input = html.find('input[name="inputField"]');
          let newVal = 0;
          if (Number.isNumeric(input.val())) {
            newVal = Number(input.val());
          }
          const updateData = {};
          if (newVal > Math.abs(score)) {
            newVal = 0;
            updateData[`system.characteristics.${dataset.characteristic}.value`] =
              this.actor.system.characteristics[dataset.characteristic].value - 1;
            ui.notifications.info(
              game.i18n.format("arm5e.aging.manualEdit", {
                name: this.actor.name,
                char: dialogData.label
              }),
              {
                permanent: false
              }
            );
          }
          updateData[`system.characteristics.${dataset.characteristic}.aging`] = newVal;
          await this.actor.update(updateData, {});
        }
      },
      {
        jQuery: true,
        height: "110px",
        classes: ["arm5e-dialog", "dialog", "aging-points"]
      }
    ).render(true);
  }
  addListenersDialog(html) {
    html.find(".resource-focus").focus((ev) => {
      ev.preventDefault();
      ev.currentTarget.select();
    });
  }

  async _increaseArt(type, art) {
    let oldXp = this.actor.system.arts[type][art].xp;
    let newXp = Math.round(
      ((this.actor.system.arts[type][art].derivedScore + 1) *
        (this.actor.system.arts[type][art].derivedScore + 2)) /
        (2 * this.actor.system.arts[type][art].xpCoeff)
    );
    let updateData = {};
    updateData[`system.arts.${type}.${art}.xp`] = newXp;
    await this.actor.update(updateData, {});

    let delta = newXp - oldXp;
    console.log(`Added ${delta} xps from ${oldXp} to ${newXp}`);
  }

  async _deccreaseArt(type, art) {
    if (this.actor.system.arts[type][art].derivedScore != 0) {
      let oldXp = this.actor.system.arts[type][art].xp;
      let newXp = Math.round(
        ((this.actor.system.arts[type][art].derivedScore - 1) *
          this.actor.system.arts[type][art].derivedScore) /
          (2 * this.actor.system.arts[type][art].xpCoeff)
      );
      let updateData = {};
      updateData[`system.arts.${type}.${art}.xp`] = newXp;

      await this.actor.update(updateData, {});
      let delta = newXp - oldXp;
      console.log(`Removed ${delta} xps from ${oldXp} to ${newXp} total`);
    }
  }

  async _onActorRender(event) {
    event.preventDefault();
    const header = event.currentTarget;
    const id = header.dataset.actorid;
    const actor = game.actors.get(id);
    actor.sheet.render(true, { focus: true });
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const dataset = getDataset(event);
    let newItem = await this._itemCreate(dataset);
    newItem[0].sheet.render(true);
    return newItem;
  }

  async _itemCreate(dataset) {
    // Get the type of item to create.
    const type = dataset.type;
    // Initialize a default name.
    let name;
    if (dataset.name) {
      name = dataset.name;
    } else {
      name = `New ${type.capitalize()}`;
    }
    // Prepare the item object.
    const itemData = [
      {
        name: name,
        type: type,
        system: duplicate(dataset)
      }
    ];
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData[0].system["type"];

    // default fields for some Item types
    // if (CONFIG.ARM5E.ItemDataModels[type]?.getDefault) {
    //   itemDate = CONFIG.ARM5E.ItemDataModels[type].getDefault(itemData[0]);
    // }

    return await this.actor.createEmbeddedDocuments("Item", itemData, {});
  }

  /**
   * Adds dropdown text for a specified element.
   *
   * @param {HTMLElement} element Parent element for dropdown
   * @param {string} text Text in the dropdown
   */
  _onDropdown(element, text) {
    let summary = element.next();

    if (summary.hasClass("item-summary")) {
      // If summary is present, remove
      summary.slideUp(200, () => summary.remove());
    } else {
      summary = $(`<div class="item-summary">${text}</div>`);
      summary.hide();
      summary.insertAfter(element);
      summary.slideDown(200);
    }
  }

  async _onSoakDamage(html, actor) {
    const lastMessageDamage = getLastMessageByHeader(game, "arm5e.sheet.damage");
    const damage = parseInt($(lastMessageDamage?.content).text()) || 0;
    const extraData = {
      damage,
      modifier: 0
    };

    var actor = this.actor;

    extraData.natRes = {};
    for (let [key, resist] of Object.entries(actor.system.bonuses.resistance)) {
      if (resist !== 0) {
        extraData.hasResistance = true;
        extraData.natRes[key] = {
          res: resist,
          label: `${CONFIG.ARM5E.magic.arts[key].label} (${resist})`
        };
      }
    }

    if (actor._isMagus()) {
      extraData.isMagus = true;
      extraData.formRes = {};
      for (let [key, form] of Object.entries(actor.system.arts.forms)) {
        extraData.formRes[key] = {
          res: Math.floor(form.finalScore / 5),
          label: `${form.label} (${Math.floor(form.finalScore / 5)})`
        };
      }
    }

    const data = {
      actor,
      extraData
    };
    let template = "systems/arm5e/templates/actor/parts/actor-soak.html";
    renderTemplate(template, data).then(function (html) {
      new Dialog(
        {
          title: game.i18n.localize("arm5e.dialog.woundCalculator"),
          content: html,
          buttons: {
            yes: {
              icon: "<i class='fas fa-check'></i>",
              label: game.i18n.localize("arm5e.generic.yes"),
              callback: (html) => setWounds(html, actor)
            },
            // roll: {
            //   label: game.i18n.localize("arm5e.dialog.button.stressdie"),
            //   callback: (html) => setWounds(html, actor)
            // },
            no: {
              icon: "<i class='fas fa-ban'></i>",
              label: game.i18n.localize("arm5e.dialog.button.cancel"),
              callback: null
            }
          }
        },
        {
          jQuery: true,
          height: "140px",
          width: "400px",
          classes: ["arm5e-dialog", "dialog"]
        }
      ).render(true);
    });
  }

  async _onUsePower(event) {
    const dataset = getDataset(event);
    await usePower(dataset, this.actor);
  }

  async _onCalculateDamage(html, actor) {
    const lastAttackMessage = getLastMessageByHeader(game, "arm5e.sheet.attack");
    const lastDefenceMessage = getLastMessageByHeader(game, "arm5e.sheet.defense");
    const attack = parseInt(lastAttackMessage?.content || "0");
    const defense = parseInt(lastDefenceMessage?.content || "0");
    const advantage = attack - defense;

    const extraData = {
      advantage,
      modifier: 0
    };

    var actor = this.actor;

    const data = {
      actor,
      extraData
    };
    let template = "systems/arm5e/templates/actor/parts/actor-calculateDamage.html";
    renderTemplate(template, data).then(function (html) {
      new Dialog(
        {
          title: game.i18n.localize("arm5e.dialog.damageCalculator"),
          content: html,
          buttons: {
            yes: {
              icon: "<i class='fas fa-check'></i>",
              label: `Yes`,
              callback: (html) => calculateDamage(html, actor)
            },
            // TODO: later
            // roll: {
            //   label: `Roll`,
            //   callback: async (html) => {
            //     actor.rollData.init(
            //       { roll: "option", name: "Damage roll", physicalcondition: false },
            //       actor
            //     );
            //     let roll = await stressDie(actor, "option", 16, null, 1);
            //     // calculateDamage(html, actor, roll);
            //   }
            // },
            no: {
              icon: "<i class='fas fa-ban'></i>",
              label: `Cancel`,
              callback: null
            }
          }
        },
        {
          jQuery: true,
          height: "140px",
          width: "400px",
          classes: ["arm5e-dialog", "dialog"]
        }
      ).render(true);
    });
  }

  async roll(parameters) {
    await this._onRoll(parameters);
  }
  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async _onRoll(event) {
    const dataset = getDataset(event);
    if (this.actor.system.wounds.dead.length > 0) {
      ui.notifications.info(game.i18n.localize("arm5e.notification.dead"), {
        permanent: true
      });
      return false;
    }
    if ((getRollTypeProperties(dataset.roll).MODE & ROLL_MODES.UNCONSCIOUS) == 0) {
      // if (dataset.roll != "char" && dataset.roll != "aging" && dataset.roll != "crisis") {
      if (this.actor.system.pendingCrisis) {
        ui.notifications.info(game.i18n.localize("arm5e.notification.pendingCrisis"), {
          permanent: true
        });
        return false;
      }

      if (this.actor.system.wounds.incap.length > 0) {
        ui.notifications.info(game.i18n.localize("arm5e.notification.incapacited"), {
          permanent: true
        });
        return false;
      }

      if (this.actor.system.fatigueCurrent == this.actor.system.fatigueMaxLevel) {
        ui.notifications.info(game.i18n.localize("arm5e.notification.unconscious"), {
          permanent: true
        });
        return false;
      }
    }

    prepareRollVariables(dataset, this.actor);

    // var actor = this.actor;
    this.actor.system.charmetadata = ARM5E.character.characteristics;
    updateCharacteristicDependingOnRoll(dataset, this.actor);

    const template = chooseTemplate(dataset);
    await renderRollTemplate(dataset, template, this.actor);
    return true;
  }

  async quickCombat(name) {
    await quickCombat(name, this.actor);
  }

  async quickVitals(name) {
    await quickVitals(name, this.actor);
  }

  async quickMagic(name) {
    await quickMagic(name, this.actor);
  }

  async displaySchedule(event) {
    event.preventDefault();
    const schedule = new Schedule({
      actor: this.actor,
      type: "character"
    });
    this.actor.apps[schedule.appId] = schedule;
    const res = await schedule.render(true);
  }

  static getFlavor(actorType) {
    switch (actorType) {
      case "player":
        return "PC";
      case "npc":
      case "beast":
        return "NPC";
      case "covenant":
        return "covenant";
      case "laboratory":
        return "Lab";
      default:
        return "Neutral";
    }
  }
  async _handleTransfer(item) {
    const html = await TextEditor.enrichHTML(
      `<div class="flex-center"><p>${game.i18n.format("arm5e.dialog.confirmTransfer-question", {
        name: item.name
      })}</p>
      <p>${game.i18n.localize("arm5e.dialog.confirmTransfer-info")}</p></div`,
      { async: true }
    );
    let quantity = item.system.hasQuantity();

    let confirmed = false;
    var chosenAmount = 1;
    if (quantity.qty == 0) return false;
    if (quantity.qty == 1) {
      confirmed = await this.getConfirmation(
        item.name,
        game.i18n.format("arm5e.dialog.confirmTransfer-question", {
          name: item.name
        }),
        ArM5eActorSheet.getFlavor(this.actor.type),
        game.i18n.localize("arm5e.dialog.confirmTransfer-info")
      );
    } else {
      let dialogData = {
        fieldname: item.name,
        prompt: game.i18n.format("arm5e.dialog.confirmTransfer-amount", {
          max: quantity.qty
        }),
        help: game.i18n.localize("arm5e.dialog.confirmTransfer-info"),
        value: 1,
        min: 1,
        max: quantity.qty
      };
      const html = await renderTemplate(
        "systems/arm5e/templates/generic/numberInput.html",
        dialogData
      );
      confirmed = await new Promise((resolve) => {
        new Dialog(
          {
            title: item.name,
            content: html,
            render: this.addListenersDialog,
            buttons: {
              yes: {
                icon: "<i class='fas fa-check'></i>",
                label: `Yes`,
                callback: async (html) => {
                  let result = html.find('input[name="inputField"]');
                  if (result.val() !== "") {
                    chosenAmount = Number(result.val());
                  }
                  resolve(true);
                }
              },
              no: {
                icon: "<i class='fas fa-ban'></i>",
                label: `Cancel`,
                callback: () => {
                  resolve(false);
                }
              }
            },
            close: () => resolve(false)
          },
          {
            jQuery: true,
            height: "140px",
            classes: ["arm5e-dialog", "dialog"]
          }
        ).render(true);
      });
    }
    if (confirmed) {
      const originActor = game.actors.get(item.actor._id);
      if (!originActor) return false;

      let res = [];
      let modified = [];
      let newItemData = item.toObject();
      if (chosenAmount == quantity.qty) {
        res = await this.actor.createEmbeddedDocuments("Item", [newItemData]);
        let deleted = await originActor.deleteEmbeddedDocuments("Item", [item._id]);
      } else {
        newItemData.system[quantity.name] = chosenAmount;
        res = await this.actor.createEmbeddedDocuments("Item", [newItemData]);
        let itemUpdate = {
          _id: item._id,
          system: { [quantity.name]: quantity.qty - chosenAmount }
        };
        // item.system[quantity.name] = quantity.qty - chosenAmount;
        modified = await originActor.updateEmbeddedDocuments("Item", [itemUpdate]);
      }
      originActor.sheet.render(false);

      return res;
    } else {
      return false;
    }
  }

  //  Overloaded core functions (TODO: review at each Foundry update)

  /**
   * Handle the final creation of dropped Item data on the Actor.
   * This method is factored out to allow downstream classes the opportunity to override item creation behavior.
   * @param {object[]|object} itemData     The item data requested for creation
   * @return {Promise<Item[]>}
   * @private
   */
  async _onDropItemCreate(itemData) {
    itemData = itemData instanceof Array ? itemData : [itemData];
    let filtered = itemData.filter((e) => this.isItemDropAllowed(e));
    for (let item of filtered) {
      item = resetOwnerFields(item);
    }

    return super._onDropItemCreate(filtered);
  }

  /**
   * Handle dropping of an actor reference or item data onto an Actor Sheet
   * @param {DragEvent} event     The concluding DragEvent which contains drop data
   * @param {Object} data         The data transfer extracted from the event
   * @return {Promise<Object>}    A data object which describes the result of the drop
   * @private
   * @override
   */
  async _onDropActor(event, data) {
    if (!super._onDropActor(event, data)) {
      return false;
    }
    let droppedActor = await fromUuid(data.uuid);
    // link both ways
    let res = await this._bindActor(droppedActor);
    let res2 = await droppedActor.sheet._bindActor(this.actor);
    return res && res2;
  }

  async _bindActor(actor) {
    if (!["covenant", "laboratory"].includes(actor.type)) return false;
    let updateData = {};
    if (actor.type == "covenant") {
      updateData["system.covenant.value"] = actor.name;
      updateData["system.covenant.actorId"] = actor._id;
    } else if (actor.type == "laboratory") {
      updateData["system.sanctum.value"] = actor.name;
      updateData["system.sanctum.actorId"] = actor._id;
    }
    return await this.actor.update(updateData, {});
  }

  async _unbindActor(actor) {
    if (!["covenant", "laboratory"].includes(actor.type)) return false;
    let updateData = {};
    if (actor.type == "covenant") {
      updateData["system.covenant.value"] = "";
      updateData["system.covenant.actorId"] = null;
    } else if (actor.type == "laboratory") {
      updateData["system.sanctum.value"] = "";
      updateData["system.sanctum.actorId"] = null;
    }
    return await this.actor.update(updateData, {});
  }
}

// Hooks.on("renderActorSheet", (app, html, data) => {
//   if (app.actor.hasPlayerOwner) {
//     let owners = game.users.players.filter((user) =>
//       app.actor.testUserPermission(user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)
//     );
//     log(false, `Owner name: ${owners[0].name}`);
//   }
//   log(false, "TEST");
// });

export async function setCovenant(selector, actor) {
  let actorUpdate = {};
  let found = selector.find(".SelectedItem");
  if (found.length > 0) {
    actorUpdate["system.covenant.value"] = found[0].value;
  }

  await this.actor.update(actorUpdate);
}

export async function setWounds(selector, actor) {
  const damage = parseInt(selector.find('input[name$="damage"]').val());
  const modifier = parseInt(selector.find('input[name$="modifier"]').val());
  const natRes = parseInt(selector.find('select[name$="natRes"]').val() || 0);
  const formRes = parseInt(selector.find('select[name$="formRes"]').val() || 0);
  const prot = parseInt(selector.find('label[name$="prot"]').attr("value") || 0);
  const bonus = parseInt(selector.find('label[name$="soak"]').attr("value") || 0);
  const stamina = parseInt(selector.find('label[name$="stamina"]').attr("value") || 0);
  const damageToApply = damage - modifier - prot - natRes - formRes - stamina - bonus;
  const size = actor?.system?.vitals?.siz?.value || 0;
  const typeOfWound = calculateWound(damageToApply, size);
  if (typeOfWound === false) {
    ui.notifications.info(game.i18n.localize("arm5e.notification.notPossibleToCalculateWound"), {
      permanent: true
    });
    return false;
  }
  // here toggle dead status if applicabel

  const title = '<h2 class="ars-chat-title">' + game.i18n.localize("arm5e.sheet.soak") + "</h2>";
  const messageDamage = `${game.i18n.localize("arm5e.sheet.damage")} (${damage})`;
  const messageStamina = `${game.i18n.localize("arm5e.sheet.stamina")} (${stamina})`;
  let messageBonus = "";
  if (bonus) {
    messageBonus = `${game.i18n.localize("arm5e.sheet.soakBonus")} (${bonus})<br/> `;
  }
  const messageProt = `${game.i18n.localize("arm5e.sheet.protection")} (${prot})`;
  let messageModifier = "";
  if (modifier) {
    messageModifier += `${game.i18n.localize("arm5e.sheet.modifier")} (${modifier})<br/>`;
  }
  if (natRes) {
    messageModifier += `${game.i18n.localize("arm5e.sheet.natRes")} (${natRes})<br/>`;
  }
  if (formRes) {
    messageModifier += `${game.i18n.localize("arm5e.sheet.formRes")} (${formRes})<br/>`;
  }
  const messageTotal = `${game.i18n.localize("arm5e.sheet.totalDamage")} = ${damageToApply}`;
  const messageWound = typeOfWound
    ? game.i18n.format("arm5e.messages.woundResult", {
        typeWound: game.i18n.localize("arm5e.messages.wound." + typeOfWound.toLowerCase())
      })
    : game.i18n.localize("arm5e.messages.noWound");

  const details = ` ${messageDamage}<br/> ${messageStamina}<br/> ${messageProt}<br/> ${messageBonus}${messageModifier}<b>${messageTotal}</b>`;
  ChatMessage.create({
    content: `<h4 class="dice-total">${messageWound}</h4>`,
    flavor: title + putInFoldableLinkWithAnimation("arm5e.sheet.label.details", details),
    speaker: ChatMessage.getSpeaker({
      actor
    })
  });

  if (typeOfWound) {
    await actor.changeWound(1, typeOfWound);
  }
}

export async function calculateDamage(selector, actor, roll) {
  const title = '<h2 class="ars-chat-title">' + game.i18n.localize("arm5e.sheet.damage") + " </h2>";
  let damage = parseInt(selector.find('input[name$="modifier"]').val());
  const messageModifier = `${game.i18n.localize("arm5e.sheet.modifier")} (${damage})`;
  let details = "";
  if (roll) {
    damage += roll.total;
    details = `  ${messageModifier}<br/>`;
  } else {
    const strenght = parseInt(selector.find('label[name$="strenght"]').attr("value") || 0);
    const weapon = parseInt(selector.find('label[name$="weapon"]').attr("value") || 0);
    const advantage = parseInt(selector.find('input[name$="advantage"]').val());
    const messageStrenght = `${game.i18n.localize("arm5e.sheet.strength")} (${strenght})`;
    const messageWeapon = `${game.i18n.localize("arm5e.sheet.damage")} (${weapon})`;
    const messageAdvantage = `${game.i18n.localize("arm5e.sheet.advantage")} (${advantage})`;
    damage += strenght + weapon + advantage;
    details = ` ${messageStrenght}<br/> ${messageWeapon}<br/> ${messageAdvantage}<br/> ${messageModifier}<br/>`;
  }

  const messageDamage = `<h4 class="dice-total">${damage}</h4>`;
  ChatMessage.create({
    content: messageDamage,
    flavor: title + putInFoldableLinkWithAnimation("arm5e.sheet.label.details", details),
    speaker: ChatMessage.getSpeaker({
      actor
    })
  });
}
