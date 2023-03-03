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
  compareLabTexts
} from "../tools.js";
import ArM5eActiveEffect from "../helpers/active-effects.js";
import { VOICE_AND_GESTURES_VALUES } from "../constants/voiceAndGestures.js";
import { HERMETIC_FILTER, updateUserCache } from "../constants/userdata.js";
import {
  findVoiceAndGesturesActiveEffects,
  modifyVoiceOrGesturesActiveEvent
} from "../helpers/voiceAndGestures.js";
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

export class ArM5eActorSheet extends ActorSheet {
  // /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      dragDrop: [{ dragSelector: ".macro-ready" }]
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
  }

  _canDragStart(selector) {
    return this.isEditable;
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
    //     case "magicItem":
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

  /** @override */
  async getData() {
    const context = await super.getData();

    // Use a safe clone of the actor data for further operations.
    const actorData = context.actor;

    // Add the actor's data to context.system for easier access, as well as flags.
    context.system = actorData.system;
    context.flags = actorData.flags;

    context.config = CONFIG.ARM5E;
    context.config.constants = { VOICE_AND_GESTURES_VALUES: VOICE_AND_GESTURES_VALUES };

    // context.system.dtypes = ["String", "Number", "Boolean"];

    // Xzotl : not sure what this was used for
    // for (let attr of Object.values(context.system.attributes)) {
    //   attr.isCheckbox = attr.dtype === "Boolean";
    // }

    // Allow effect creation
    actorData.system.effectCreation = game.user.isGM;
    let usercache = JSON.parse(sessionStorage.getItem(`usercache-${game.user.id}`));
    if (usercache === null) usercache = {};
    if (usercache[this.actor.id]) {
      context.userData = usercache[this.actor.id];
    } else {
      usercache[this.actor.id] = {
        filters: {
          hermetic: {
            spells: HERMETIC_FILTER,
            magicalEffects: HERMETIC_FILTER,
            laboratoryTexts: HERMETIC_FILTER
          },
          abilities: {
            category: ""
          }
        }
      };
      context.userData = usercache[this.actor.id];
      sessionStorage.setItem(`usercache-${game.user.id}`, JSON.stringify(usercache));
    }

    if (actorData.type === "player" || actorData.type === "npc" || actorData.type === "beast") {
      for (let [key, v] of Object.entries(context.system.vitals)) {
        v.label = game.i18n.localize(CONFIG.ARM5E.character.vitals[key].label);
      }

      context.system.world = {};

      // check whether the character is linked to an existing covenant
      context.system.world.covenants = game.actors
        .filter(a => a.type == "covenant")
        .map(({ name, id }) => ({
          name,
          id
        }));
      if (context.system.covenant) {
        let cov = context.system.world.covenants.filter(
          c => c.name == context.system.covenant.value
        );
        if (cov.length > 0) {
          context.system.covenant.linked = true;
          context.system.covenant.actorId = cov[0].id;
        } else {
          context.system.covenant.linked = false;
        }
      }

      if (
        context.system?.charType?.value == "magusNPC" ||
        context.system?.charType?.value == "magus"
      ) {
        // Arts icons style
        context.artsIcons = game.settings.get("arm5e", "artsIcons");
        context.system.world.labs = game.actors
          .filter(a => a.type == "laboratory")
          .map(({ name, id }) => ({
            name,
            id
          }));

        // check whether the character is linked to an existing lab
        if (context.system.sanctum) {
          let lab = context.system.world.labs.filter(c => c.name == context.system.sanctum.value);
          if (lab.length > 0) {
            context.system.sanctum.linked = true;
            context.system.sanctum.actorId = lab[0].id;
          } else {
            context.system.sanctum.linked = false;
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
        if (context.system.labtotal === undefined) {
          context.system.labtotal = {};
        }
        if (
          context.system.labtotal.modifier === undefined ||
          context.system.labtotal.modifier == null
        ) {
          context.system.labtotal.modifier = 0;
        }
        if (context.system.sanctum.linked) {
          let lab = game.actors.get(context.system.sanctum.actorId);
          if (lab) {
            context.system.labtotal.quality = parseInt(lab.system.generalQuality.total);
            // store the specialties if the character is linked to a lab
            context.system.labtotals = { specialty: lab.system.specialty };
          }
        } else {
          if (context.system.labtotal.quality === undefined) {
            context.system.labtotal.quality = 0;
          }
        }

        if (context.system.covenant.linked) {
          let cov = game.actors.get(context.system.covenant.actorId);
          if (cov) {
            if (cov.system.levelAura == "") {
              context.system.labtotal.aura = 0;
            } else {
              context.system.labtotal.aura = cov.system.levelAura;
            }
          }
        } else {
          if (context.system.labtotal.aura === undefined) {
            context.system.labtotal.aura = 0;
          }
        }

        if (context.system.labtotal.applyFocus == undefined) {
          context.system.labtotal.applyFocus = false;
        }

        // hermetic filters
        // 1. Filter
        // Spells
        let spellsFilters = context.userData.filters.hermetic.spells;
        context.ui = {};
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
          context.ui.spellFilter = 'style="text-shadow: 0 0 5px maroon"';
        }

        // magical effects
        let magicEffectFilters = context.userData.filters.hermetic.magicalEffects;
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
          context.ui.magicEffectFilter = 'style="text-shadow: 0 0 5px maroon"';
        }
        // 2. Sort (not needed since done in prepareData?)
        // context.system.spells = context.system.spells.sort(compareSpells);
        // context.system.magicalEffects = context.system.magicalEffects.sort(compareMagicalEffects);

        // magic arts
        for (let [key, technique] of Object.entries(context.system.arts.techniques)) {
          if (technique.deficient) {
            technique.ui = {
              style: 'style="border: 0px; height: 40px; box-shadow: 0 0 10px darkslateblue"',
              title: game.i18n.localize("arm5e.sheet.activeEffect.types.arts.deficiency")
            };
          } else if (!technique.bonus && technique.xpCoeff == 1.0) {
            technique.ui = { style: 'style="border: 0px; height: 40px;"' };
          } else if (!technique.bonus && technique.xpCoeff != 1.0) {
            technique.ui = {
              style: 'style="border: 0px; height: 40px; box-shadow: 0 0 10px maroon"',
              title: game.i18n.localize("arm5e.sheet.activeEffect.types.arts.affinity")
            };
          } else if (technique.bonus && technique.xpCoeff == 1.0) {
            technique.ui = {
              style: 'style="border: 0px; height: 40px; box-shadow: 0 0 10px blue"',
              title: ""
            };
          } else {
            technique.ui = {
              style: 'style="border: 0px; height: 40px; box-shadow: 0 0 10px purple"',
              title: game.i18n.localize("arm5e.sheet.activeEffect.types.arts.affinity")
            };
          }
        }

        // castingTotals
        context.system.castingTotals = {};
        // labTotals
        context.system.labTotals = {};
        for (let [key, form] of Object.entries(context.system.arts.forms)) {
          if (form.deficient) {
            form.ui = {
              style: 'style="border: 0px; height: 40px; box-shadow: 0 0 10px darkslateblue"',
              title: game.i18n.localize("arm5e.sheet.activeEffect.types.arts.deficiency")
            };
          } else if (!form.bonus && form.xpCoeff == 1.0) {
            form.ui = { style: 'style="border: 0px; height: 40px;"' };
          } else if (!form.bonus && form.xpCoeff != 1.0) {
            form.ui = {
              style: 'style="border: 0px; height: 40px; box-shadow: 0 0 10px maroon"',
              title: game.i18n.localize("arm5e.sheet.activeEffect.types.arts.affinity")
            };
          } else if (form.bonus && form.xpCoeff == 1.0) {
            form.ui = {
              style: 'style="border: 0px; height: 40px; box-shadow: 0 0 10px blue"',
              title: ""
            };
          } else {
            form.ui = {
              style: 'style="border: 0px; height: 40px; box-shadow: 0 0 10px purple"',
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
            if (context.system.labtotal.applyFocus) {
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
                context.system.labtotals.specialty[key].bonus +
                context.system.labtotals.specialty[k2].bonus;
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
              techScoreLab += context.system.labtotals.specialty[key].bonus;
              formScoreLab += context.system.labtotals.specialty[k2].bonus;
            }
            context.system.labTotals[key][k2].total = Math.round(
              (formScoreLab +
                techScoreLab +
                context.system.laboratory.basicLabTotal.value +
                parseInt(context.system.labtotal.quality) +
                parseInt(context.system.labtotal.aura) +
                parseInt(context.system.labtotal.modifier) +
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
          ab.ui = { style: 'style="box-shadow: 0 0 10px maroon"', title: "Affinity, " };
        } else if (ab.system.derivedScore != ab.system.finalScore && ab.system.xpCoeff == 1.0) {
          ab.ui = { style: 'style="box-shadow: 0 0 10px blue"', title: "" };
        } else {
          ab.ui = { style: 'style="box-shadow: 0 0 10px purple"', title: "Affinity, " };
        }
      }
      // let flag = this.actor.getFlag("arm5e", "sorting", "abilities");
      // if (flag && flag["abilities"] == true) {
      //   context.sortedAbilities = Object.entries(context.sortedAbilities).sort((a, b) => {
      //     return a[1].label.localeCompare(b[1].label);
      //   });
      // }
      context.activities = [];
      const activitiesMap = new Map();
      for (let [key, entry] of Object.entries(context.system.diaryEntries)) {
        for (let date of entry.system.dates) {
          let activity = {};
          if (entry.system.duration == entry.system.done || entry.system.activity == "none") {
            activity.ui = { diary: 'style="font-style: normal;"' };
          } else {
            activity.ui = { diary: 'style="font-style: italic;"' };
          }
          activity.name = entry.name;
          activity.type = game.i18n.localize(
            CONFIG.ARM5E.activities.generic[entry.system.activity].label
          );
          activity.date = entry.system.date;

          activity._id = entry._id;
          if (!activitiesMap.has(date.year)) {
            activitiesMap.set(date.year, { winter: [], autumn: [], summer: [], spring: [] });
          }
          activitiesMap.get(date.year)[date.season].push(activity);
        }
      }
      context.activities = Array.from(
        new Map(
          [...activitiesMap.entries()].sort(function(a, b) {
            return b[0] - a[0];
          })
        ),
        ([key, value]) => ({
          year: key,
          seasons: value
        })
      );

      for (let [key, charac] of Object.entries(context.system.characteristics)) {
        let shadowWidth = 2 * charac.aging;
        charac.ui = {
          style: 'style="box-shadow: 0 0 ' + shadowWidth + 'px black"',
          title: `${charac.aging} ` + game.i18n.localize("arm5e.sheet.agingPts")
        };
        // log(false, `${key} has ${charac.aging} points`);
      }

      context.combat = {
        init:
          context.system.combat.init -
          context.system.combat.overload +
          context.system.characteristics.qik.value,
        attack:
          context.system.combat.atk +
          context.system.combat.ability +
          context.system.characteristics.dex.value,
        defense:
          context.system.combat.dfn +
          context.system.combat.ability +
          context.system.characteristics.qik.value,
        damage: context.system.combat.dam + context.system.characteristics.str.value,
        soak: context.system.combat.prot + context.system.characteristics.sta.value
      };
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
      let labtTextFilters = context.userData.filters.hermetic.laboratoryTexts;
      // if (!labtTextFilters) {
      //   labtTextFilters = { formFilter: "", levelFilter: "", levelOperator: 0, techniqueFilter: "" };
      // }
      context.ui = {};
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
        context.ui.labTextFilter = 'style="text-shadow: 0 0 5px maroon"';
      }
      // 2. Sort
      context.system.filteredLaboratoryTexts = context.system.filteredLaboratoryTexts.sort(
        compareLabTexts
      );
    }
    context.isGM = game.user.isGM;

    context.devMode = game.modules.get("_dev-mode")?.api?.getPackageDebugValue(ARM5E.SYSTEM_ID);
    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

    // Prepare active effects
    context.effects = ArM5eActiveEffect.prepareActiveEffectCategories(this.actor.effects);
    if (context.system?.arts?.voiceAndGestures) {
      context.system.arts.voiceAndGestures = findVoiceAndGesturesActiveEffects(this.actor.effects);
    }
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
      }

      for (let effect of actorData.system.magicalEffects) {
        effect.TechReq = spellTechniqueLabel(effect.system);
        effect.FormReq = spellFormLabel(effect.system);
      }
    }
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    html.find(".ability-category").click(async ev => {
      const category = $(ev.currentTarget).data("category");
      document.getElementById(category).classList.toggle("hide");
      // let tmp2 = tmp.toggle("hide");
    });

    html.find(".book-topic").click(async ev => {
      const category = $(ev.currentTarget).data("topic");
      document.getElementById(category).classList.toggle("hide");
    });

    // html.find(".spell-list").click(async ev => {
    //   const category = $(ev.currentTarget).data("topic");
    //   document.getElementById(category).classList.toggle("hide");
    // });

    // filters
    html.find(".toggleHidden").click(async ev => {
      const list = $(ev.target).data("list");
      const val = html
        .find(`.${list}`)
        .attr("class")
        .indexOf("hidden");
      await updateUserCache(this.actor.id, list, "expanded", val >= 0);
      html.find(`.${list}`).toggleClass("hidden");
    });

    html.find(".technique-filter").change(async ev => {
      ev.preventDefault();
      const list = $(ev.currentTarget).data("list");
      const val = ev.target.value;
      await updateUserCache(this.actor.id, list, "techniqueFilter", val);
      this.render();
    });

    html.find(".form-filter").change(async ev => {
      ev.preventDefault();
      const list = $(ev.currentTarget).data("list");
      const val = ev.target.value;
      await updateUserCache(this.actor.id, list, "formFilter", val);
      this.render();
    });

    html.find(".levelOperator-filter").change(async ev => {
      ev.preventDefault();
      const list = $(ev.currentTarget).data("list");
      const val = ev.target.value;
      await updateUserCache(this.actor.id, list, "levelOperator", val);
      this.render();
    });

    html.find(".level-filter").change(async ev => {
      ev.preventDefault();
      const list = $(ev.currentTarget).data("list");
      const val = ev.target.value;
      await updateUserCache(this.actor.id, list, "levelFilter", val);
      this.actor.update();
    });

    html.find(".sortable").click(ev => {
      const listName = ev.currentTarget.dataset.list;
      let val = this.actor.getFlag("arm5e", "sorting", listName);
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

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Render the linked actor sheet for viewing/editing prior to the editable check.
    html.find(".actor-link").click(this._onActorRender.bind(this));

    // Add Inventory Item
    html.find(".item-create").click(this._onItemCreate.bind(this));

    // Update Inventory Item
    html.find(".item-edit").click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.getEmbeddedDocument("Item", li.data("itemId"));
      // const item = this.actor.items.get(li.data("itemId"))
      item.sheet.render(true);
    });

    // Update Inventory Item
    html.find(".book-edit").click(async ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.getEmbeddedDocument("Item", li.data("itemId"));
      await item.setFlag("arm5e", "currentBookTopic", Number(li.data("index")));
      // const item = this.actor.items.get(li.data("itemId"))
      item.sheet.render(true);
      // item.sheet._tabs[0].activate("topics");
    });

    html.find(".increase-tech").click(event => {
      const element = $(event.currentTarget).parents(".art");
      this._increaseArt("techniques", element[0].dataset.attribute);
    });
    html.find(".decrease-tech").click(event => {
      const element = $(event.currentTarget).parents(".art");
      this._deccreaseArt("techniques", element[0].dataset.attribute);
    });

    html.find(".increase-form").click(event => {
      const element = $(event.currentTarget).parents(".art");
      this._increaseArt("forms", element[0].dataset.attribute);
    });
    html.find(".decrease-form").click(event => {
      const element = $(event.currentTarget).parents(".art");
      this._deccreaseArt("forms", element[0].dataset.attribute);
    });

    // Quick edit of Item from inside Actor sheet
    html.find(".quick-edit").change(event => {
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

    // Delete Inventory Item, optionally ask for confirmation
    html.find(".item-delete").click(async ev => {
      ev.preventDefault();
      const li = $(ev.currentTarget).parents(".item");
      let itemId = li.data("itemId");
      itemId = itemId instanceof Array ? itemId : [itemId];
      if (game.settings.get("arm5e", "confirmDelete")) {
        const question = game.i18n.localize("arm5e.dialog.delete-question");
        await Dialog.confirm(
          {
            title: `${li[0].dataset.name}`,
            content: `<p>${question}</p>`,
            yes: () => {
              itemId = itemId instanceof Array ? itemId : [itemId];
              this.actor.deleteEmbeddedDocuments("Item", itemId, {});
              li.slideUp(200, () => this.render(false));
            },
            no: () => null
          },
          {
            rejectClose: true
          }
        );
      } else {
        this.actor.deleteEmbeddedDocuments("Item", itemId, {});
        li.slideUp(200, () => this.render(false));
      }
    });

    // Delete Inventory Item and always ask for confirmation
    html.find(".item-delete-confirm").click(async event => {
      event.preventDefault();
      const question = game.i18n.localize("arm5e.dialog.delete-question");
      const li = $(event.currentTarget).parents(".item");
      let itemId = li.data("itemId");
      await Dialog.confirm(
        {
          title: `${li[0].dataset.name}`,
          content: `<p>${question}</p>`,
          yes: () => {
            itemId = itemId instanceof Array ? itemId : [itemId];
            this.actor.deleteEmbeddedDocuments("Item", itemId, {});
            li.slideUp(200, () => this.render(false));
          },
          no: () => null
        },
        { rejectClose: true }
      );
    });

    // Generate abilities automatically
    html.find(".abilities-generate").click(this._onGenerateAbilities.bind(this));

    html.find(".rest").click(ev => {
      if (this.actor.type === "player" || this.actor.type === "npc" || this.actor.type == "beast") {
        this.actor.rest();
      }
    });

    // Rollable abilities.
    html.find(".rollable").click(this._onRoll.bind(this));

    html.find(".rollable-aging").click(async event => {
      if (event.shiftKey) {
        this._editAging(event);
      } else this._onRoll(event);
    });

    html.find(".pick-covenant").click(this._onPickCovenant.bind(this));
    html.find(".soak-damage").click(this._onSoakDamage.bind(this));
    html.find(".damage").click(this._onCalculateDamage.bind(this));
    html.find(".power-use").click(this._onUsePower.bind(this));
    html.find(".voice-and-gestures").change(this._onSelectVoiceAndGestures.bind(this));
    html.find(".addFatigue").click(event => this.actor._changeFatigueLevel(1));
    html.find(".removeFatigue").click(event => this.actor._changeFatigueLevel(-1));

    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = ev => this._onDragStart(ev);
      html.find("li.item").each((i, li) => {
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }

    // Active Effect management
    html
      .find(".effect-control")
      .click(ev => ArM5eActiveEffect.onManageActiveEffect(ev, this.actor));

    // migrate actor
    html.find(".migrate").click(event => this.actor.migrate());
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
        buttons: {
          yes: {
            icon: "<i class='fas fa-check'></i>",
            label: game.i18n.localize("arm5e.sheet.action.apply")
          }
        },
        default: "yes",
        close: async html => {
          let input = html.find('input[name="inputField"]');
          let newVal = 0;
          if (Number.isNumeric(input.val())) {
            newVal = Number(input.val());
          }
          const updateData = [];
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
        classes: ["arm5e-dialog", "dialog"]
      }
    ).render(true);
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
    actor.sheet.render(true);
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
    const name = `New ${type.capitalize()}`;
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
    if (CONFIG.Item.systemDataModels[type]?.getDefault) {
      CONFIG.Item.systemDataModels[type].getDefault(itemData[0]);
    }

    return await this.actor.createEmbeddedDocuments("Item", itemData, {});
  }

  /* Handle covenant pick */
  async _onPickCovenant(event) {
    event.preventDefault();
    const element = event.currentTarget;
    var actor = this.actor;
    let template = "systems/arm5e/templates/generic/simpleListPicker.html";
    renderTemplate(template, this.actor).then(function(html) {
      new Dialog(
        {
          title: game.i18n.localize("arm5e.dialog.chooseCovenant"),
          content: html,
          buttons: {
            yes: {
              icon: "<i class='fas fa-check'></i>",
              label: `Yes`,
              callback: html => setCovenant(html, actor)
            },
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
          classes: ["arm5e-dialog", "dialog"]
        }
      ).render(true);
    });
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
    renderTemplate(template, data).then(function(html) {
      new Dialog(
        {
          title: game.i18n.localize("arm5e.dialog.woundCalculator"),
          content: html,
          buttons: {
            yes: {
              icon: "<i class='fas fa-check'></i>",
              label: `Yes`,
              callback: html => setWounds(html, actor)
            },
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

  async _onSelectVoiceAndGestures(event) {
    event.preventDefault();
    const name = $(event.target).attr("effect");
    await modifyVoiceOrGesturesActiveEvent(this, name, $(event.target).val());
  }

  async _onUsePower(event) {
    const dataset = getDataset(event);
    await usePower(dataset, this.actor);
  }

  async _onCalculateDamage(html, actor) {
    const lastAttackMessage = getLastMessageByHeader(game, "arm5e.sheet.attack");
    const lastDefenseMessage = getLastMessageByHeader(game, "arm5e.sheet.defense");
    const attack = parseInt(lastAttackMessage?.content || "0");
    const defense = parseInt(lastDefenseMessage?.content || "0");
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
    renderTemplate(template, data).then(function(html) {
      new Dialog(
        {
          title: game.i18n.localize("arm5e.dialog.damageCalculator"),
          content: html,
          buttons: {
            yes: {
              icon: "<i class='fas fa-check'></i>",
              label: `Yes`,
              callback: html => calculateDamage(html, actor)
            },
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

  async _onGenerateAbilities(event) {
    let charType = this.actor.system.charType.value;
    let updateData = {};
    if (charType === "magus" || charType === "magusNPC") {
      let abilities = this.actor.items.filter(i => i.type == "ability");
      let newAbilities = [];
      for (let [key, a] of Object.entries(CONFIG.ARM5E.character.magicAbilities)) {
        let localizedA = game.i18n.localize(a);
        // check if the ability already exists in the Actor
        let abs = abilities.filter(ab => ab.name == localizedA || ab.name === localizedA + "*");

        if (abs.length == 0) {
          log(false, `Did not find ${game.i18n.localize(a)}, creating it...`);
          const itemData = {
            name: localizedA,
            type: "ability"
          };
          // First, check if the Ability is found in the world
          abs = game.items.filter(
            i => i.type === "ability" && (i.name === localizedA || i.name === localizedA + "*")
          );
          if (abs.length == 0) {
            // Then, check if the Abilities compendium exists
            let abPack = game.packs.filter(
              p => p.metadata.packageName === "arm5e" && p.metadata.name === "abilities"
            );
            const documents = await abPack[0].getDocuments();
            for (let doc of documents) {
              if (doc.name === localizedA || doc.name === localizedA + "*") {
                itemData.system = foundry.utils.deepClone(doc.system);
                break;
              }
            }
          } else {
            itemData.system = foundry.utils.deepClone(abs[0].system);
          }

          newAbilities.push(itemData);
        } else {
          // found the ability, assign its Id
          updateData[`system.laboratory.abilitiesSelected.${key}.abilityID`] = abs[0].id;
        }
      }
      this.actor.update(updateData, {});
      this.actor.createEmbeddedDocuments("Item", newAbilities, {});
    }
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async _onRoll(event) {
    const dataset = getDataset(event);

    if (this.actor.system.wounds.dead.number > 0) {
      ui.notifications.info(game.i18n.localize("arm5e.notification.dead"), {
        permanent: true
      });
      return;
    }
    if ((getRollTypeProperties(dataset.roll).MODE & ROLL_MODES.UNCONSCIOUS) == 0) {
      // if (dataset.roll != "char" && dataset.roll != "aging" && dataset.roll != "crisis") {
      if (this.actor.system.pendingCrisis) {
        ui.notifications.info(game.i18n.localize("arm5e.notification.pendingCrisis"), {
          permanent: true
        });
        return;
      }

      if (this.actor.system.fatigueCurrent == this.actor.system.fatigueMaxLevel) {
        ui.notifications.info(game.i18n.localize("arm5e.notification.unconscious"), {
          permanent: true
        });
        return;
      }
    }

    prepareRollVariables(dataset, this.actor);

    // var actor = this.actor;
    this.actor.system.charmetadata = ARM5E.character.characteristics;
    updateCharacteristicDependingOnRoll(dataset, this.actor);

    const template = chooseTemplate(dataset);
    renderRollTemplate(dataset, template, this.actor);
  }

  // Overloaded core functions (TODO: review at each Foundry update)

  /**
   * Handle the final creation of dropped Item data on the Actor.
   * This method is factored out to allow downstream classes the opportunity to override item creation behavior.
   * @param {object[]|object} itemData     The item data requested for creation
   * @return {Promise<Item[]>}
   * @private
   */
  async _onDropItemCreate(itemData) {
    itemData = itemData instanceof Array ? itemData : [itemData];
    let filtered = itemData.filter(e => this.isItemDropAllowed(e));
    for (let item of filtered) {
      // log(false, "Before reset " + JSON.stringify(item.data));
      item = resetOwnerFields(item);
      // log(false, "After reset " + JSON.stringify(item.data));
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
    return false;
  }
}

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
    let actorUpdate = {
      system: {
        wounds: {
          [typeOfWound]: {
            number: {
              value: actor.system.wounds[typeOfWound].number.value + 1
            }
          }
        }
      }
    };

    await actor.update(actorUpdate);
  }
}

export async function calculateDamage(selector, actor) {
  const strenght = parseInt(selector.find('label[name$="strenght"]').attr("value") || 0);
  const weapon = parseInt(selector.find('label[name$="weapon"]').attr("value") || 0);
  const advantage = parseInt(selector.find('input[name$="advantage"]').val());
  const modifier = parseInt(selector.find('input[name$="modifier"]').val());
  const damage = strenght + weapon + advantage + modifier;
  const title = '<h2 class="ars-chat-title">' + game.i18n.localize("arm5e.sheet.damage") + " </h2>";
  const messageStrenght = `${game.i18n.localize("arm5e.sheet.strength")} (${strenght})`;
  const messageWeapon = `${game.i18n.localize("arm5e.sheet.damage")} (${weapon})`;
  const messageAdvantage = `${game.i18n.localize("arm5e.sheet.advantage")} (${advantage})`;
  const messageModifier = `${game.i18n.localize("arm5e.sheet.modifier")} (${modifier})`;

  const details = ` ${messageStrenght}<br/> ${messageWeapon}<br/> ${messageAdvantage}<br/> ${messageModifier}<br/>`;
  const messageDamage = `<h4 class="dice-total">${damage}</h4>`;
  ChatMessage.create({
    content: messageDamage,
    flavor: title + putInFoldableLinkWithAnimation("arm5e.sheet.label.details", details),
    speaker: ChatMessage.getSpeaker({
      actor
    })
  });
}
