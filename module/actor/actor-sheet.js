/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */

import { resetOwnerFields } from "../item/item-converter.js";
import { ARM5E } from "../config.js";
import {
  log,
  getDataset,
  hermeticFilter,
  putInFoldableLinkWithAnimation,
  compareLabTexts,
  topicFilter,
  hermeticTopicFilter,
  diaryEntryFilter,
  getUuidInfo,
  getLastCombatMessageOfType,
  slugify,
  getWoundRanges
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
  renderRollTemplate,
  chooseTemplate,
  ROLL_MODES,
  getRollTypeProperties
} from "../helpers/rollWindow.js";

import {
  buildSoakDataset,
  combatDamage,
  computeCombatStats,
  quickCombat,
  quickVitals,
  setWounds
} from "../helpers/combat.js";
import {
  quickMagic,
  spellFormLabel,
  spellTechniqueLabel,
  useMagicItem,
  usePower
} from "../helpers/magic.js";
import { UI } from "../constants/ui.js";
import { Schedule } from "../tools/schedule.js";
import {
  createAgingDiaryEntry,
  createTwilightDiaryEntry,
  resetTwilight,
  TWILIGHT_STAGES,
  TwilightEpisode,
  twilightRoll
} from "../helpers/long-term-activities.js";
import { Sanatorium } from "../tools/sanatorium.js";
import { MedicalHistory } from "../tools/med-history.js";
import { ArM5eActorProfiles } from "./subsheets/actor-profiles.js";
import { ArM5eMagicSystem } from "./subsheets/magic-system.js";
import { getRefCompendium } from "../tools/compendia.js";
import { getConfirmation, textInput } from "../ui/dialogs.js";
import { Arm5eChatMessage } from "../helpers/chat-message.js";

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
    const res = foundry.utils.mergeObject(super.defaultOptions, {
      dragDrop: [
        // { dragSelector: ".item-list .item", dropSelector: ".droppable" },
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

  //@overloaded : added await to _onDropX calls AppV2 to remove
  async _onDrop(event) {
    const data = TextEditor.getDragEventData(event);
    const actor = this.actor;
    const allowed = Hooks.call("dropActorSheetData", actor, this, data);
    if (allowed === false) return;

    // Handle different data types
    switch (data.type) {
      case "ActiveEffect":
        return await this._onDropActiveEffect(event, data);
      case "Actor":
        return await this._onDropActor(event, data);
      case "Item":
        return await this._onDropItem(event, data);
      case "Folder":
        return await this._onDropFolder(event, data);
    }
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
        },
        lists: {
          visibility: { abilities: {} }
        }
      };

      sessionStorage.setItem(`usercache-${game.user.id}`, JSON.stringify(usercache));
    } else if (usercache[this.actor.id].sections?.visibility == undefined) {
      usercache[this.actor.id].sections = { visibility: { common: {} } };
      sessionStorage.setItem(`usercache-${game.user.id}`, JSON.stringify(usercache));
    }
    if (usercache[this.actor.id].lists?.visibility == undefined) {
      usercache[this.actor.id].lists = { visibility: { abilities: {} } };
      sessionStorage.setItem(`usercache-${game.user.id}`, JSON.stringify(usercache));
    }
    return usercache[this.actor.id];
  }

  /** @override */
  async getData() {
    const context = await super.getData();

    const actorData = context.actor;
    context.ui = this.getUserCache();

    if (context.actor.system.states?.creationMode) {
      context.ui.creationMode = { edit: "" };
      context.ui.storyMode = { edit: "readonly" };
    } else {
      context.ui.creationMode = { edit: "readonly" };
      context.ui.storyMode = { edit: "" };
    }
    context.rollData = this.actor.getRollData();
    // Add the actor's data to context.system for easier access, as well as flags.
    context.system = actorData.system;
    context.flags = actorData.flags;
    context.selection = {};

    context.config = CONFIG.ARM5E;
    context.abilityKeys = CONFIG.ARM5E.ALL_ABILITIES;
    context.abilityKeys[""] = {
      mnemonic: "arm5e.sheet.skill.abilityNoKey",
      option: false,
      selection: "disabled"
    };
    context.isGM = game.user.isGM;
    context.isOwner = this.document.isOwner;
    context.metagame = {
      view: game.settings.get("arm5e", "metagame"),
      edit: context.isGM ? "" : "readonly"
    };

    if (this.actor.isCharacter()) {
      context.characList = Object.keys(context.system.characCfg);
    }

    if (this.actor.system.description) {
      context.enrichedDescription = await TextEditor.enrichHTML(this.actor.system.description, {
        // Whether to show secret blocks in the finished html
        secrets: this.document.isOwner,
        // Data to fill in for inline rolls
        rollData: context.rollData,
        // Relative UUID resolution
        relativeTo: this.actor
      });
    }

    // context.system.dtypes = ["String", "Number", "Boolean"];

    // Xzotl : not sure what this was used for
    // for (let attr of Object.values(context.system.attributes)) {
    //   attr.isCheckbox = attr.dtype === "Boolean";
    // }

    // Allow effect creation
    context.datetime = game.settings.get("arm5e", "currentDate");
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

    context.system.isCharacter = this.actor.isCharacter();
    if (context.system.isCharacter) {
      if (context.system.charType?.value === "entity") {
        let cnt = Object.entries(context.system.realms).filter((e) => e[1].aligned == true);
        let value = Object.entries(context.system.realms).find((e) => e[1].aligned == true);
        if (cnt.length > 1) {
          ui.notifications.warn(
            game.i18n.localize("arm5e.notification.entityWithMultipleRealmAlignments")
          );
        }
        context.system.realm = value ? value[0] : "mundane";
      }
      for (let [key, v] of Object.entries(context.system.vitals)) {
        v.label = game.i18n.localize(CONFIG.ARM5E.character.vitals[key].label);
      }

      if (context.system.wounds) {
        const ranges = getWoundRanges(this.actor.system.vitals?.siz?.value || 0);
        context.health = {
          light: { wounds: context.system.wounds.light, range: ranges[0] },
          medium: { wounds: context.system.wounds.medium, range: ranges[1] },
          heavy: { wounds: context.system.wounds.heavy, range: ranges[2] },
          incap: { wounds: context.system.wounds.incap, range: ranges[3] },
          dead: { wounds: context.system.wounds.dead, range: ranges[4] }
        };
      }
      context.isDead = this.actor.system.wounds.dead.length > 0;
      context.system.isMagus = this.actor.isMagus();
      // if (context.system.covenant) {
      //   if (context.system.covenant.linked) {
      //     this.actor.apps[context.system.covenant.document.sheet.appId] =
      //       context.system.covenant.document.sheet;
      //   }
      // }

      if (
        context.system?.charType?.value == "magusNPC" ||
        context.system?.charType?.value == "magus"
      ) {
        context.selection.voiceStances = Object.fromEntries(
          Object.entries(context.system.stances.voice).map(([k, v]) => {
            return [k, `${game.i18n.localize(CONFIG.ARM5E.magic.mod.voice[k].mnemonic)} (${v})`];
          })
        );
        context.selection.gesturesStances = Object.fromEntries(
          Object.entries(context.system.stances.gestures).map(([k, v]) => {
            return [k, `${game.i18n.localize(CONFIG.ARM5E.magic.mod.gestures[k].mnemonic)} (${v})`];
          })
        );

        // Arts icons style
        context.artsIcons = game.settings.get("arm5e", "artsIcons");

        // check whether the character is linked to an existing lab
        // if (context.system.sanctum) {
        //   if (context.system.sanctum.linked) {
        //     this.actor.apps[context.system.sanctum.document.sheet.appId] =
        //       context.system.sanctum.document.sheet;
        //   }
        // }

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
          context.system.labTotal.aura =
            lab.system.aura.computeMaxAuraModifier(this.actor.system.realms) + lab.system.auraBonus;
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
              title: game.i18n.localize("arm5e.activeEffect.types.arts.deficiency")
            };
          } else if (!technique.bonus && technique.xpCoeff == 1.0) {
            technique.ui = { style: UI.STYLES.STANDARD_ART };
          } else if (!technique.bonus && technique.xpCoeff != 1.0) {
            technique.ui = {
              style: UI.STYLES.AFINITY_ART,
              title: game.i18n.localize("arm5e.activeEffect.types.arts.affinity")
            };
          } else if (technique.bonus && technique.xpCoeff == 1.0) {
            technique.ui = {
              style: UI.STYLES.PUISSANT_ART,
              title: ""
            };
          } else {
            technique.ui = {
              style: UI.STYLES.COMBO_ART,
              title: game.i18n.localize("arm5e.activeEffect.types.arts.affinity")
            };
          }
        }

        // castingTotals
        context.system.castingTotals = {};
        // dividing options

        context.spellCastingDividers = [
          {
            key: "1",
            label: game.i18n.localize("arm5e.messages.die.divideBy") + "1"
          },
          {
            key: "2",
            label: game.i18n.localize("arm5e.messages.die.divideBy") + "2"
          },
          {
            key: "5",
            label: game.i18n.localize("arm5e.messages.die.divideBy") + "5"
          }
        ];
        // labTotals
        context.system.labTotals = {};
        context.system.labTotal = context.system.labTotal ?? {};
        for (let [key, form] of Object.entries(context.system.arts.forms)) {
          if (form.deficient) {
            form.ui = {
              style: UI.STYLES.DEFICIENT_ART,
              title: game.i18n.localize("arm5e.activeEffect.types.arts.deficiency")
            };
          } else if (!form.bonus && form.xpCoeff == 1.0) {
            form.ui = { style: UI.STYLES.STANDARD_ART };
          } else if (!form.bonus && form.xpCoeff != 1.0) {
            form.ui = {
              style: UI.STYLES.AFINITY_ART,
              title: game.i18n.localize("arm5e.activeEffect.types.arts.affinity")
            };
          } else if (form.bonus && form.xpCoeff == 1.0) {
            form.ui = {
              style: UI.STYLES.PUISSANT_ART,
              title: ""
            };
          } else {
            form.ui = {
              style: UI.STYLES.COMBO_ART,
              title: game.i18n.localize("arm5e.activeEffect.types.arts.affinity")
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
                  "arm5e.activeEffect.types.laboratorySpec"
                )}: ${specialtyMod}"`;
              } else if (specialtyMod < 0) {
                context.system.labTotals[key][
                  k2
                ].ui = `style="box-shadow: 0 0 5px red" title="${game.i18n.localize(
                  "arm5e.activeEffect.types.laboratorySpec"
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

      if (this.actor.isMagus()) {
        if (!this.twilight) {
          this.twilight = new TwilightEpisode(this.actor);
        }
        context.system.twilight.tooltip = TwilightEpisode.getTooltip(
          this.actor.system.twilight.stage
        );
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
            activity.ui = { diary: 'style="font-style: italic; color: grey"' };
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

    context.devMode = game.modules.get("_dev-mode")?.api?.getPackageDebugValue(ARM5E.SYSTEM_ID);
    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

    // Prepare active effects
    context.effects = ArM5eActiveEffect.prepareActiveEffectCategories(
      Array.from(this.actor.allApplicableEffects())
    );
    this._prepareCharacterItems(context);

    if (context.system.features?.magicSystem) {
      if (!this.magicSystem) {
        this.magicSystem = new ArM5eMagicSystem(this.actor);
      }
      this.magicSystem.getData(context);
    }

    return context;
  }

  async _render(force, options = {}) {
    // Parent class rendering workflow
    await super._render(force, options);

    // Register the active Application with the referenced Documents

    if (this.actor.system.covenant) {
      if (this.actor.system.covenant.linked) {
        this.actor.system.covenant.document.apps[this.appId] = this;
      }
    }

    if (this.actor.system.sanctum) {
      if (this.actor.system.sanctum.linked) {
        this.actor.system.sanctum.document.apps[this.appId] = this;
      }
    }

    if (this.actor.system.owner) {
      if (this.actor.system.owner.linked) {
        this.actor.system.owner.document.apps[this.appId] = this;
      }
    }
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
      actorData.actor.type == "covenant" ||
      actorData.actor.type == "beast"
    ) {
      for (let virtue of actorData.system.virtues) {
        if (virtue.effects.size > 0) {
          virtue.system.ui = { style: 'style="font-style:italic"' };
        }
        if (!virtue.system.hidden || actorData.isGM) {
          virtue.system.visible = true;
        }
      }

      for (let flaw of actorData.system.flaws) {
        if (flaw.effects.size > 0) {
          flaw.system.ui = { style: 'style="font-style:italic"' };
        }
        if (!flaw.system.hidden || actorData.isGM) {
          flaw.system.visible = true;
        }
      }

      for (let q of actorData.system.qualities ?? []) {
        if (q.effects.size > 0) {
          q.system.ui = { style: 'style="font-style:italic"' };
        }
        if (!q.system.hidden || actorData.isGM) {
          q.system.visible = true;
        }
      }

      for (let inf of actorData.system.inferiorities ?? []) {
        if (inf.effects.size > 0) {
          inf.system.ui = { style: 'style="font-style:italic"' };
        }
        if (!inf.system.hidden || actorData.isGM) {
          inf.system.visible = true;
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
            ? `<i title="${game.i18n.localize("arm5e.spell.masteryHint")}  ${
                spell.system.finalScore
              } - ${spell.system.masteryAbilities}" class="icon-Icon_Effects-small"></i>`
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

    html.find(".twilight-episode").click(async (ev) => {
      let input = getDataset(ev);
      if (ev.shiftKey && game.user.isGM) {
        const question = game.i18n.localize("arm5e.twilight.reset");
        let confirm = await getConfirmation(
          game.i18n.localize("arm5e.twilight.episode"),
          question,
          ArM5eActorSheet.getFlavor(this.actor.type)
        );

        if (confirm) {
          await resetTwilight(this.actor);
        }
        return;
      }
      switch (this.actor.system.twilight.stage) {
        case TWILIGHT_STAGES.NONE:
        case TWILIGHT_STAGES.PENDING_STRENGTH:
          if (game.user.isGM) {
            input.roll = "twilight_strength";
            await twilightRoll(this.actor, input);
          } else {
            ui.notifications.info(game.i18n.localize("arm5e.twilight.notification.GMOnly"));
            return;
          }
          break;
        case TWILIGHT_STAGES.PENDING_CONTROL:
          if (!this.actor.system.twilight.control) {
            const question = game.i18n.localize("arm5e.twilight.embraceTwilight");
            let confirm = await getConfirmation(
              game.i18n.localize("arm5e.twilight.episode"),
              question,
              ArM5eActorSheet.getFlavor(this.actor.type),
              " ",
              null,
              "arm5e.twilight.embrace",
              "arm5e.twilight.avoid"
            );
            if (confirm) {
              await this.actor.update({
                "system.twilight.stage": TWILIGHT_STAGES.PENDING_COMPLEXITY,
                "system.twilight.control": true
              });
              return;
            }
          }
          input.roll = "twilight_control";
          input.botchNumber = this.actor.system.twilight.pointsGained + 1;
          await twilightRoll(this.actor, input);
          break;
        case TWILIGHT_STAGES.PENDING_COMPLEXITY:
          if (game.user.isGM) {
            input.roll = "twilight_complexity";
            input.botchNumber = this.actor.system.twilight.pointsGained + 1;
            await twilightRoll(this.actor, input);
          } else {
            ui.notifications.info(game.i18n.localize("arm5e.twilight.notification.GMOnly"), {
              permanent: false
            });
            return;
          }
          break;
        case TWILIGHT_STAGES.PENDING_UNDERSTANDING:
          input.applied = false;
          input.done = false;
          input.rollDone = false;
          const [diary] = await createTwilightDiaryEntry(this.actor, input);
          diary.sheet.render(true);
          await this.actor.update({
            "system.twilight.stage": TWILIGHT_STAGES.PENDING_UNDERSTANDING2
          });
          break;
        case TWILIGHT_STAGES.PENDING_UNDERSTANDING2: // diary already created
          ui.notifications.info(
            game.i18n.localize("arm5e.twilight.notification.continueWithDiary"),
            {
              permanent: false
            }
          );
          // input.roll = "twilight_understanding";
          // await twilightRoll(this.actor, input);
          break;
      }
    });

    html.find(".schedule-aging").click(async (ev) => {
      let input = getDataset(ev);
      let diary = await createAgingDiaryEntry(this.actor, input);
      diary[0].sheet.render(true);
    });

    html.find(".character-schedule").click(this.displaySchedule.bind(this));

    html.find(".ability-category").click(async (ev) => {
      const category = $(ev.currentTarget).data("category");

      let usercache = JSON.parse(sessionStorage.getItem(`usercache-${game.user.id}`));
      let scope = usercache[this.actor._id].lists.visibility.abilities;
      const classes = document.getElementById(category).classList;
      if (scope) {
        if (classes.contains("hide")) {
          scope[category] = "";
        } else {
          scope[category] = "hide";
        }
        sessionStorage.setItem(`usercache-${game.user.id}`, JSON.stringify(usercache));
      }
      classes.toggle("hide");
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
      let updateArray = [];
      // if the actor was linked, remove listener
      if (this.actor.system.covenant.linked) {
        delete this.actor.apps[this.actor.system.covenant.document.sheet?.appId];
        delete this.actor.system.covenant.document.apps[this.appId];
        await this.actor.system.covenant.document.sheet._unbindActor(this.actor);
      }

      let updateData = { "system.covenant.value": val };
      if (cov) {
        updateData["system.covenant.actorId"] = cov._id;

        await cov.sheet._bindActor(this.actor);
      } else {
        updateData["system.covenant.actorId"] = null;
      }
      updateData["_id"] = this.actor._id;
      updateArray.push(updateData);
      await Actor.updateDocuments(updateArray);
    });

    html.find(".sanctum-link").change(async (ev) => {
      ev.preventDefault();
      const val = ev.target.value;
      const sanctum = game.actors.getName(val);
      let updateArray = [];
      // if the actor was linked, remove listener
      if (this.actor.system.sanctum.linked) {
        delete this.actor.apps[this.actor.system.sanctum.document.sheet?.appId];
        delete this.actor.system.sanctum.document.apps[this.appId];
        updateArray.push(await this.actor.system.sanctum.document.sheet._unbindActor(this.actor));
      }
      let updateData = { "system.sanctum.value": val };
      if (sanctum) {
        updateData["system.sanctum.actorId"] = sanctum._id;
        updateArray.push(await sanctum.sheet._bindActor(this.actor));
      } else {
        updateData["system.sanctum.actorId"] = null;
      }
      updateData["_id"] = this.actor._id;
      updateArray.push(updateData);
      await Actor.updateDocuments(updateArray);
    });

    if (this.magicSystem) {
      this.magicSystem.activateListeners(html);
    }

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
      await this.submit({ preventClose: true });
      this.render();
    });

    html.find(".maxyear-filter").change(async (ev) => {
      ev.preventDefault();
      const dataset = getDataset(ev);
      const val = ev.target.value;
      updateUserCache(this.actor.id, dataset.category, dataset.list, "maxYearFilter", val);
      await this.submit({ preventClose: true });
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
      if (!this.actor.isMagus()) return;
      const entry = await item.system.createDiaryEntryToStudyVis(this.actor);
      entry.sheet.render(true);
    });

    html.find(".study-labtext").click(async (ev) => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.getEmbeddedDocument("Item", li.data("itemId"));
      if (!this.actor.isMagus()) return;
      await item._studyLabText(item, ev);
    });

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Render the linked actor sheet for viewing/editing prior to the editable check.
    html.find(".actor-link").click(this._onActorRender.bind(this));

    // create Inventory Item
    html.find(".item-create").click(this._onItemCreate.bind(this));

    // Add Inventory Item
    html.find(".item-add").click(this._onItemAdd.bind(this));

    // Update Inventory Item
    html.find(".item-edit").click(async (ev) => {
      const li = $(ev.currentTarget).parents(".item");
      const dataset = li[0].dataset;
      const item = this.actor.getEmbeddedDocument("Item", dataset.itemId);
      // const item = this.actor.items.get(li.data("itemId"))
      item.sheet.render(true, { focus: true });
    });

    // View compendium Item
    html.find(".item-view").click(async (ev) => {
      const li = $(ev.currentTarget).parents(".item");
      const dataset = li[0].dataset;
      const item = await fromUuid(dataset.uuid);
      item.sheet.render(true, { focus: true });
    });

    html.find(".item-clone").click(async (ev) => {
      const li = $(ev.currentTarget).parents(".item");
      const dataset = li[0].dataset;
      const item = await fromUuid(dataset.uuid);
      const [newItem] = await this.actor.createEmbeddedDocuments("Item", [
        { name: item.name, type: item.type, system: foundry.utils.duplicate(item.system) }
      ]);
      newItem.sheet.render(true, { focus: true });
    });

    html.find(".effect-edit").click(async (ev) => {
      const li = $(ev.currentTarget).parents(".item");
      let effect = await fromUuid(li.data("effectId"));
      // const item = this.actor.items.get(li.data("itemId"))
      effect.sheet.render(true, { focus: true });
    });

    html.find(".wound-edit").click((ev) => {
      const item = this.actor.getEmbeddedDocument("Item", $(ev.currentTarget).data("id"));
      item.sheet.render(true, { focus: true });
    });

    html.find(".prep-create").click(async (ev) => {
      const ids = [];
      const prep = { ids: [] };
      const itemList = [];
      for (let weapon of this.actor.system.weapons) {
        if (weapon.system.equipped == true) {
          prep.name = prep.name ? prep.name : weapon.name;
          itemList.push(weapon.name);
          prep.ids.push(weapon._id);
        }
      }

      for (let armor of this.actor.system.armor) {
        if (armor.system.equipped == true) {
          itemList.push(armor.name);
          prep.name = prep.name ? prep.name : armor.name;
          prep.ids.push(armor._id);
        }
      }
      prep.itemList = itemList.join(", ");
      const name = await textInput(
        "arm5e.sheet.combat.preparation",
        "arm5e.sheet.name",
        "",
        prep.name,
        prep.itemList
      );
      if (!name) return;
      const key = slugify(name, true);
      if (key === "custom") {
        console.error("Invalid name:", prep.name);
        return;
      }
      prep.name = name;
      const updateData = {};
      updateData[`system.combatPreps.list.${key}`] = prep;

      updateData["system.combatPreps.current"] = key;

      await this.actor.update(updateData);
    });

    html.find(".prep-delete").click(async (ev) => {
      const current = this.actor.system.combatPreps.current;
      if (current === "custom") {
        return;
      }
      const name = this.actor.system.combatPreps.list[current].name;
      const question = game.i18n.localize("arm5e.dialog.delete-question");
      const confirmed = await getConfirmation(
        name,
        question,
        ArM5eActorSheet.getFlavor(this.actor.type)
      );

      if (confirmed) {
        const updateData = {};
        updateData[`system.combatPreps.list.-=${current}`] = null;

        updateData["system.combatPreps.current"] = "custom";

        await this.actor.update(updateData);
      }
    });

    html.find(".item").contextmenu(async (ev) => {
      let li = ev.currentTarget;
      let item = this.document.items.get(li.dataset.itemId);
      if (!item) {
        // item is in a compendium
        item = await fromUuid(li.dataset.uuid);
      }
      if (item && (item.system.description || item.system.state === "enchanted")) {
        this._onDropdown($(ev.currentTarget), item.getSummary());
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

    html.find(".select-on-focus").focus((ev) => {
      ev.preventDefault();
      ev.currentTarget.select();
    });

    html.find(".enchant-trigger").click(async (ev) => {
      ev.preventDefault();
      const li = $(ev.currentTarget).parents(".item");
      let itemId = li.data("itemId");

      const item = this.actor.items.get(itemId);
      // const enchantIdx = dataset.index;
      if (item.isOwned) {
        dataset.name = item.name;
        dataset.roll = "item";
        dataset.id = itemId;
        dataset.physicalcondition = false;
        await useMagicItem(dataset, item);
      }
    });

    // Quick edit of Item from inside Actor sheet
    html.find(".equipment").change(async (event) => {
      const li = $(event.currentTarget).parents(".item");
      let itemId = li.data("itemId");
      await this.toggleEquip(itemId);
    });

    html.find(".item-delete").click(async (ev) => {
      this._itemDelete(ev);
    });

    html.find(".increase-score").click(async (ev) => {
      const li = $(event.currentTarget).parents(".item");
      let itemId = li.data("itemId");
      const item = this.actor.items.get(itemId);
      await item.system.increaseScore();
    });

    html.find(".decrease-score").click(async (ev) => {
      const li = $(event.currentTarget).parents(".item");
      let itemId = li.data("itemId");
      const item = this.actor.items.get(itemId);
      await item.system.decreaseScore();
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
        let longTerm = false;
        if (ev.shiftKey) {
          longTerm = true;
        }
        this.actor.rest(longTerm);
      }
    });

    // Rollable abilities.
    html.find(".rollable").click(this.roll.bind(this));

    html.find(".rollable-aging").click(async (event) => {
      if (event.shiftKey) {
        this._editAging(event);
      } else this.roll(event);
    });

    html.find(".soak-damage").click(async (event) => {
      const msg = await this._onSoakDamage(getDataset(event));
      if (msg == null) return;
      if (msg.system.impact.woundGravity) {
        await this.actor.changeWound(
          1,
          CONFIG.ARM5E.recovery.rankMapping[msg.system.impact.woundGravity]
        );
      }
      Arm5eChatMessage.create(msg.toObject());
    });
    html.find(".damage").click(async (event) => {
      const lastAttackMessage = getLastCombatMessageOfType("combatAttack");
      const lastDefenseMessage = getLastCombatMessageOfType("combatDefense");
      let attackScore = 0;
      if (lastAttackMessage) {
        attackScore = lastAttackMessage.rollTotal() > 0 ? lastAttackMessage.rollTotal() : 0;
        attackScore += lastAttackMessage?.system.confidenceModifier;
      }

      let defenseScore = 0;
      if (lastDefenseMessage) {
        defenseScore = lastDefenseMessage.rollTotal() > 0 ? lastDefenseMessage.rollTotal() : 0;
        defenseScore += lastDefenseMessage?.system.confidenceModifier;
      }

      const advantage = attackScore - defenseScore;
      await this._onCalculateDamage({ advantage, roll: event.target.dataset.roll });
    });
    html.find(".power-use").click(this._onUsePower.bind(this));
    html.find(".addFatigue").click(async (event) => {
      let longTerm = false;
      if (event.shiftKey) {
        longTerm = true;
      }
      this.actor.loseFatigueLevel(1, false, longTerm);
    });

    html.find(".removeFatigue").click(async (event) => {
      let longTerm = false;
      if (event.shiftKey) {
        longTerm = true;
      }
      this.actor.recoverFatigueLevel(1, longTerm);
    });
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

    html.find(".indexkey-edit").change((event) => this._slugifyIndexKey(event));

    html.find(".clear-confidencePrompt").click(async (event) => {
      await this.actor.clearConfidencePrompt();
    });
  }

  async toggleEquip(itemId) {
    const updateData = {};
    let current = this.actor.system.combatPreps.current;
    const prep = this.actor.system.combatPreps.list[current];
    if (current !== "custom") {
      updateData["system.combatPreps.current"] = "custom";
      current = "custom";
    }

    const newIds = prep.ids.filter((e) => {
      return this.actor.items.get(e);
    });

    const idx = newIds.indexOf(itemId);
    if (idx >= 0) {
      newIds.splice(idx, 1);
    } else {
      newIds.push(itemId);
    }
    // filter

    updateData[`system.combatPreps.list.${current}.ids`] = newIds;
    await this.actor.update(updateData);
  }

  async _slugifyIndexKey(event) {
    event.preventDefault();
    const newValue = slugify(event.currentTarget.value);
    event.currentTarget.value = newValue;
    await this.actor.update(
      {
        system: {
          indexKey: newValue
        }
      },
      {}
    );
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
    html.find(".select-on-focus").focus((ev) => {
      ev.preventDefault();
      ev.currentTarget.select();
    });

    html.find(".combatDamage").change((ev) => {
      ev.preventDefault();
      this.render(true);
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

  async _onItemAdd(event) {
    const dataset = getDataset(event);
    if (event.stopPropagation) event.stopPropagation();
    const collection = await getRefCompendium(dataset.compendium);
    if (!collection) {
      return await _onItemCreate(event);
    }
    new Compendium({ collection }).render(true);
    return;
  }

  convertIfNeeded(data) {
    if (this.needConversion(data.type)) {
      return this.convert(data);
    } else {
      return data;
    }
  }

  convert(data) {
    return data;
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    const dataset = getDataset(event);
    if (event.stopPropagation) event.stopPropagation();

    let newItem = await this._itemCreate(dataset);
    newItem[0].sheet.render(true);
    return newItem;
  }

  async _itemCreate(dataset) {
    // Get the type of item to create.
    let data = this.convertIfNeeded(dataset);
    const type = data.type;
    // Initialize a default name.
    let name;
    if (data.name) {
      name = data.name;
    } else {
      name = `New ${type.capitalize()}`;
    }

    // Prepare the item object.
    const itemData = [
      {
        name: name,
        type: type,
        system: foundry.utils.duplicate(data)
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
      // WIP
      // summary.on("click", async (ev) => {
      //   ev.preventDefault();
      //   const li = $(ev.currentTarget).parents(".item");
      //   let itemId = li.data("itemId");

      //   const item = this.actor.items.get(itemId);
      //   // const enchantIdx = dataset.index;
      //   if (item.isOwned) {
      //     dataset.name = item.name;
      //     dataset.roll = "item";
      //     dataset.id = itemId;
      //     dataset.physicalcondition = false;
      //     await useMagicItem(dataset, item);
      //   }
      // });
    }
  }

  async _onSoakDamage(dataset) {
    let damage = 0;
    let form = "te";
    if (dataset.rootMessage) {
      const msg = fromUuidSync(dataset.rootMessage);
      damage = msg.system.combat.damageTotal > 0 ? msg.system.combat.damageTotal : 0;
      form = msg.system.combat.damageForm;
    } else {
      const lastMessageDamage = getLastCombatMessageOfType("combatDamage");

      if (lastMessageDamage) {
        damage =
          lastMessageDamage.system.combat.damageTotal > 0
            ? lastMessageDamage.system.combat.damageTotal
            : 0;
        form = lastMessageDamage.system.combat.damageForm;
      }
    }
    const dialogData = {
      actor: this.actor,
      damage,
      modifier: 0,
      natRes: form,
      formRes: form,
      selection: { natRes: {}, formRes: {} }
    };

    for (let [key, resist] of Object.entries(this.actor.system.bonuses.resistance)) {
      if (resist !== 0) {
        dialogData.hasResistance = true;
        dialogData.selection.natRes[key] = {
          res: resist,
          label: `${CONFIG.ARM5E.magic.arts[key].label} (${resist})`
        };
      }
    }

    if (this.actor.isMagus()) {
      dialogData.isMagus = true;
      dialogData.selection.formRes = {};
      for (let [key, form] of Object.entries(this.actor.system.arts.forms)) {
        dialogData.selection.formRes[key] = {
          res: Math.ceil(form.finalScore / 5),
          label: `${form.label} (${Math.ceil(form.finalScore / 5)})`
        };
      }
      // dialogData.formRes = dialogData.selection.formRes[form].res;
    }

    let template = "systems/arm5e/templates/actor/parts/actor-soak.html";
    const html = await renderTemplate(template, dialogData);

    return await new Promise((resolve) => {
      let settled = false;
      let pending = null;
      const finish = (value) => {
        if (!settled) {
          settled = true;
          resolve(value);
        }
      };
      new Dialog(
        {
          title: game.i18n.localize("arm5e.dialog.woundCalculator"),
          content: html,
          render: (html) => this.addListenersDialog(html),
          buttons: {
            yes: {
              icon: "<i class='fas fa-check'></i>",
              label: game.i18n.localize("arm5e.messages.applyDamage"),
              callback: async (html) => {
                // Start the async work and capture the promise immediately so the close
                // handler can await it if the dialog is closed while it's running.
                pending = (async () => {
                  const soakData = buildSoakDataset(html, this.actor);
                  const msg = await setWounds(soakData, this.actor);
                  return msg;
                })();

                // When it finishes, resolve (unless already resolved).
                pending
                  .then((msg) => finish(msg))
                  .catch(() => {
                    console.log("Error in dialog confirm");
                    finish(null);
                  });

                return true;
              }
            },
            no: {
              icon: "<i class='fas fa-ban'></i>",
              label: game.i18n.localize("arm5e.dialog.button.cancel"),
              callback: () => finish(null)
            }
          },
          default: "yes",
          close: () => {
            // If a button triggered async work and the dialog is closed while it's running,
            // wait for it and then resolve with its result; otherwise resolve null.
            if (pending) {
              pending.then((msg) => finish(msg)).catch(() => finish(null));
            } else {
              finish(null);
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

  async _onCalculateDamage(dataset) {
    // var actor = this.actor;

    const data = {
      ...dataset,
      modifier: 0,
      formDamage: "te",
      selection: { forms: CONFIG.ARM5E.magic.forms }
    };
    this.actor.rollInfo.init(data, this.actor);
    let template = "systems/arm5e/templates/generic/combat-damage.html";
    data.actor = this.actor;
    const dialog = await renderTemplate(template, data);

    return await new Promise((resolve) => {
      let settled = false;
      let pending = null;
      const finish = (value) => {
        if (!settled) {
          settled = true;
          resolve(value);
        }
      };
      new Dialog(
        {
          title: game.i18n.localize("arm5e.dialog.damageCalculator"),
          content: dialog,
          render: (html) => this.addListenersDialog(html),
          buttons: {
            apply: {
              icon: "<i class='fas fa-check'></i>",
              label: game.i18n.localize("arm5e.generic.yes"),
              callback: async (html) => {
                // Start the async work and capture the promise immediately so the close
                // handler can await it if the dialog is closed while it's running.
                pending = (async () => {
                  const msg = await combatDamage(html, this.actor);
                  return msg;
                })();

                // When it finishes, resolve (unless already resolved).
                pending.then((msg) => finish(msg)).catch(() => finish(null));

                return true;
              }
            },
            no: {
              icon: "<i class='fas fa-ban'></i>",
              label: game.i18n.localize("arm5e.dialog.button.cancel"),
              callback: () => finish(null)
            }
          },
          default: "yes",
          close: () => {
            // If a button triggered async work and the dialog is closed while it's running,
            // wait for it and then resolve with its result; otherwise resolve null.
            if (pending) {
              pending.then((msg) => finish(msg)).catch(() => finish(null));
            } else {
              finish(null);
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

  async roll(event) {
    const dataset = getDataset(event);
    if (this.isRollPossible(dataset)) {
      return await this._roll(dataset);
    }
  }

  async isRollPossible(dataset) {
    if (game.settings.get("arm5e", "passConfidencePromptOnRoll")) {
      // find if there is indeed a message with a prompt with this actor.
      let pendingConfMsg = game.messages.contents.filter((m) => {
        return m.speaker?.actor === this.actor._id && m.system.confPrompt;
      });
      if (pendingConfMsg.length) {
        const promises = pendingConfMsg.map((e) => {
          return e.system.skipConfidenceUse();
        });
        await Promise.all(promises);
      } else if (this.actor.system.states.confidencePrompt) {
        await this.actor.update({ "system.states.confidencePrompt": false });
      }
    } else {
      if (this.actor.system.states.confidencePrompt) {
        ui.notifications.info(game.i18n.localize("arm5e.notification.confidencePromptPending"), {
          permanent: true
        });
        return false;
      }
    }

    if (this.actor.system.wounds.dead.length > 0) {
      ui.notifications.info(game.i18n.localize("arm5e.notification.dead"), {
        permanent: true
      });
      return false;
    }

    if (this.actor.system.states.pendingDamage && dataset.roll != "soak") {
      ui.notifications.warn(game.i18n.localize("arm5e.notification.damagePending"), {
        permanent: true
      });
    }

    const rollProperties = getRollTypeProperties(dataset.roll);
    if (dataset.mode) {
      rollProperties.MODE = parseInt(dataset.mode);
    }

    if ((rollProperties.MODE & ROLL_MODES.UNCONSCIOUS) == 0) {
      // if (dataset.roll != "char" && dataset.roll != "aging" && dataset.roll != "crisis") {
      if (this.actor.system.states.pendingCrisis) {
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
      if (
        ![
          "twilight_control",
          "twilight_strength",
          "twilight_complexity",
          "twilight_understanding"
        ].includes(dataset.roll)
      ) {
        if (this.actor.system.twilight?.stage > 1) {
          ui.notifications.info(game.i18n.localize("arm5e.notification.pendingTwilight"), {
            permanent: true
          });
          return false;
        }
      }
    }

    return true;
  }
  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async _roll(event) {
    const dataset = getDataset(event);

    prepareRollVariables(dataset, this.actor);
    this.actor.system.charmetadata = ARM5E.character.characteristics;
    const template = chooseTemplate(dataset);

    const res = await renderRollTemplate(dataset, template, this.actor);
    return res;
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

  // adding the correct topic index to the drag data for topics
  _onDragStart(event) {
    if (event.target.classList.contains("codex")) {
      const li = event.currentTarget;
      // const dataset = getDataset(event);
      // Create drag data
      let dragData;
      // Owned Items
      if (li.dataset.uuid) {
        // const item = await fromUuid(dataset.uuid);
        dragData = { uuid: li.dataset.uuid, type: "Item" };
      }
      if (!dragData) return;
      // Set data transfer

      event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
    } else if (!event.target.classList.contains("topic")) {
      super._onDragStart(event);
      return;
    } else {
      let dragData;
      const li = event.currentTarget;
      // Owned Items
      if (li.dataset.itemId) {
        const item = this.actor.items.get(li.dataset.itemId);
        log(false, "Added index to topic");
        dragData = item.toDragData();
        dragData.topicIdx = li.dataset.index;
      }
      if (!dragData) return;

      // Set data transfer
      event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
    }
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
    let quantity = item.system.getQuantity();

    let confirmed = false;
    var chosenAmount = 1;
    if (quantity == 0) return false;
    if (quantity == 1) {
      confirmed = await getConfirmation(
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
          max: quantity
        }),
        help: game.i18n.localize("arm5e.dialog.confirmTransfer-info"),
        value: 1,
        min: 1,
        max: quantity,
        cssClass: "pickAmount"
      };
      const template = await renderTemplate(
        "systems/arm5e/templates/generic/numberInput.html",
        dialogData
      );
      confirmed = await new Promise((resolve) => {
        new Dialog(
          {
            title: item.name,
            content: template,
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
      if (chosenAmount == quantity) {
        res = await this.actor.createEmbeddedDocuments("Item", [newItemData]);
        let deleted = await originActor.deleteEmbeddedDocuments("Item", [item._id]);
      } else {
        newItemData.system["quantity"] = chosenAmount;
        res = await this.actor.createEmbeddedDocuments("Item", [newItemData]);
        let itemUpdate = {
          _id: item._id,
          system: { ["quantity"]: quantity - chosenAmount }
        };
        // item.system[quantity.name] = quantity.qty - chosenAmount;
        modified = await originActor.updateEmbeddedDocuments("Item", [itemUpdate]);
      }
      originActor.sheet.render(false);
      await item.createResourceTrackingDiaryEntry(originActor, this.actor, chosenAmount);
      return res;
    } else {
      return false;
    }
  }

  //  Overloaded core functions (TODO: review at each Foundry update)

  async _onDropItem(event, data) {
    const info = getUuidInfo(data.uuid);
    const item = await fromUuid(data.uuid);
    const type = item.type;
    if (this.actor.uuid !== item.parent?.uuid) {
      if (info.ownerType === "Actor") {
        if (info.type === "Item" && item.system.getQuantity) {
          if (!event.shiftKey) {
            if (this.isItemDropAllowed(item)) {
              return await this._handleTransfer(item);
            }
          }
        }
      } else {
        if (info.type === "Item" && item.system.getQuantity) {
          if (this.isItemDropAllowed(item)) {
            let quantity = item.system.getQuantity();
            if (quantity != 0) {
              await item.createResourceTrackingDiaryEntry(null, this.actor, quantity);
            }
          }
        }
      }
    }
    // // transform input into labText
    // if (type == "spell" || type == "magicalEffect" || type == "enchantment") {
    //   log(false, "Valid drop");
    //   // create a labText data:
    //   return await super._onDropItemCreate(effectToLabText(foundry.utils.deepClone(item)));
    // }
    // // }
    const res = await super._onDropItem(event, data);
    return res;
  }

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

    return await super._onDropItemCreate(filtered);
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
    const promiseArray = [];
    let updateArray = [];
    if (droppedActor.type === "covenant") {
      if (this.actor.system.covenant.linked) {
        // unlink old cov if present
        delete this.actor.apps[this.actor.system.covenant.document.sheet?.appId];
        delete this.actor.system.covenant.document.apps[this.appId];
        promiseArray.push(this.actor.system.covenant.document.sheet._unbindActor(this.actor));
      }
      promiseArray.push(droppedActor.sheet._bindActor(this.actor));
    } else if (droppedActor.type === "laboratory") {
      if (this.actor.system.sanctum.linked) {
        // unlink old lab if present
        delete this.actor.apps[this.actor.system.sanctum.document.sheet?.appId];
        delete this.actor.system.sanctum.document.apps[this.appId];
        updateArray.push(this.actor.system.sanctum.document.sheet._unbindActor(this.actor));
      }
      updateArray.push(droppedActor.sheet._bindActor(this.actor));
    }
    updateArray.push(this._bindActor(droppedActor));
    await Promise.all(promiseArray.flat());
    const res = await Promise.all(updateArray);
    return await Actor.updateDocuments(res);
  }

  _bindActor(actor) {
    if (!["covenant", "laboratory"].includes(actor.type)) return [];
    let updateData = { _id: this.actor._id };
    if (actor.type == "covenant") {
      updateData["system.covenant.value"] = actor.name;
      updateData["system.covenant.actorId"] = actor._id;
    } else if (actor.type == "laboratory") {
      updateData["system.sanctum.value"] = actor.name;
      updateData["system.sanctum.actorId"] = actor._id;
    }
    return updateData;
  }

  _unbindActor(actor) {
    if (!["covenant", "laboratory"].includes(actor.type)) return [];
    let updateData = { _id: this.actor._id };
    if (actor.type == "covenant") {
      updateData["system.covenant.value"] = "";
      updateData["system.covenant.actorId"] = null;
    } else if (actor.type == "laboratory") {
      updateData["system.sanctum.value"] = "";
      updateData["system.sanctum.actorId"] = null;
    }
    return updateData;
  }

  async enrichCharacterEditors(context) {
    if (this.actor.system.biography) {
      context.enrichedBiography = await TextEditor.enrichHTML(this.actor.system.biography, {
        // Whether to show secret blocks in the finished html
        secrets: this.document.isOwner,
        // Data to fill in for inline rolls
        rollData: context.rollData,
        // Relative UUID resolution
        relativeTo: this.actor
      });
    }
    if (this.actor.system.secrets) {
      context.enrichedSecrets = await TextEditor.enrichHTML(this.actor.system.secrets, {
        // Whether to show secret blocks in the finished html
        secrets: this.document.isOwner,
        // Data to fill in for inline rolls
        rollData: context.rollData,
        // Relative UUID resolution
        relativeTo: this.actor
      });
    }

    if (this.actor.system.sigil?.value) {
      context.enrichedSigil = await TextEditor.enrichHTML(this.actor.system.sigil.value, {
        // Whether to show secret blocks in the finished html
        secrets: this.document.isOwner,
        // Data to fill in for inline rolls
        rollData: context.rollData,
        // Relative UUID resolution
        relativeTo: this.actor
      });
    }

    if (this.actor.system.warping?.effects) {
      context.enrichedWarping = await TextEditor.enrichHTML(this.actor.system.warping.effects, {
        // Whether to show secret blocks in the finished html
        secrets: this.document.isOwner,
        // Data to fill in for inline rolls
        rollData: context.rollData,
        // Relative UUID resolution
        relativeTo: this.actor
      });
    }

    if (this.actor.system.decrepitude?.effects) {
      context.enrichedDecrepitude = await TextEditor.enrichHTML(
        this.actor.system.decrepitude.effects,
        {
          // Whether to show secret blocks in the finished html
          secrets: this.document.isOwner,
          // Data to fill in for inline rolls
          rollData: context.rollData,
          // Relative UUID resolution
          relativeTo: this.actor
        }
      );
    }
    if (this.actor.system.laboratory?.longevityRitual?.twilightScars) {
      context.enrichedTwilightScars = await TextEditor.enrichHTML(
        this.actor.system.laboratory.longevityRitual.twilightScars,
        {
          // Whether to show secret blocks in the finished html
          secrets: this.document.isOwner,
          // Data to fill in for inline rolls
          rollData: context.rollData,
          // Relative UUID resolution
          relativeTo: this.actor
        }
      );
    }
  }

  async _updateObject(event, formData) {
    if (this.magicSystem) {
      formData = await this.magicSystem._updateObject(event, formData);
    }
    if (this.twilight) {
      formData = await this.twilight._updateObject(event, formData);
    }
    return await super._updateObject(event, formData);
  }
}
