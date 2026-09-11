import { ARM5E } from "../../config.js";

import { ArM5eActorSheetV2 } from "./actor-sheet-v2.js";
import { ArM5eActorProfiles } from "../../actor/subsheets/actor-profiles.js";
import { Schedule } from "../../apps/schedule.js";
import {
  createAgingDiaryEntry,
  createTwilightDiaryEntry,
  resetTwilight,
  TWILIGHT_STAGES,
  twilightRoll,
  TwilightEpisode
} from "../../seasonal-activities/long-term-activities.js";
import { Sanatorium } from "../../apps/sanatorium.js";
import { MedicalHistory } from "../../apps/med-history.js";
import { customDialogAsync, getConfirmation, numberInput, textInput } from "../../ui/dialogs.js";
import { getRefCompendium } from "../../tools/compendia.js";
import { getDataset, getWoundRanges, hermeticFilter, slugify } from "../../tools/tools.js";
import { combatDamage, computeCombatStats } from "../../helpers/combat.js";
import { UI } from "../../constants/ui.js";
import { ArM5eMagicSystem } from "../../actor/subsheets/magic-system.js";

/**
 * Intermediate AppV2 class for character-like actor sheets.
 *
 * This class owns logic shared by PC, NPC, and Beast sheets and is the
 * intended home for future consolidation into a single character sheet.
 */
export class Arm5eCharacterActorSheetV2 extends ArM5eActorSheetV2 {
  constructor(...args) {
    super(...args);
    this.actorProfiles = new ArM5eActorProfiles(this.actor);
  }

  /** @override */
  static DEFAULT_OPTIONS = {
    actions: {
      actorProfile: Arm5eCharacterActorSheetV2.actorProfile,
      characterSchedule: Arm5eCharacterActorSheetV2.characterSchedule,
      rollOrAgingPts: Arm5eCharacterActorSheetV2.rollOrAgingPts,
      recoveryStart: Arm5eCharacterActorSheetV2.recoveryStart,
      twilightEpisode: Arm5eCharacterActorSheetV2.twilightEpisode,
      scheduleAging: Arm5eCharacterActorSheetV2.scheduleAging,
      actorRest: Arm5eCharacterActorSheetV2.actorRest,
      addFatigue: Arm5eCharacterActorSheetV2.addFatigue,
      removeFatigue: Arm5eCharacterActorSheetV2.removeFatigue,
      addWound: Arm5eCharacterActorSheetV2.addWound,
      woundEdit: Arm5eCharacterActorSheetV2.woundEdit,
      planReading: Arm5eCharacterActorSheetV2.planReading,
      visStudy: Arm5eCharacterActorSheetV2.visStudy,
      studyLabtext: Arm5eCharacterActorSheetV2.studyLabtext,
      increaseTech: Arm5eCharacterActorSheetV2.increaseTech,
      decreaseTech: Arm5eCharacterActorSheetV2.decreaseTech,
      increaseForm: Arm5eCharacterActorSheetV2.increaseForm,
      decreaseForm: Arm5eCharacterActorSheetV2.decreaseForm,
      increaseScore: Arm5eCharacterActorSheetV2.increaseScore,
      decreaseScore: Arm5eCharacterActorSheetV2.decreaseScore,
      prepCreate: Arm5eCharacterActorSheetV2.prepCreate,
      prepDelete: Arm5eCharacterActorSheetV2.prepDelete,
      viewMedicalHistory: Arm5eCharacterActorSheetV2.viewMedicalHistory,
      migrateActor: Arm5eCharacterActorSheetV2.migrateActor,
      removeCreationMode: Arm5eCharacterActorSheetV2.removeCreationMode,
      clearConfidencePrompt: Arm5eCharacterActorSheetV2.clearConfidencePrompt,
      itemAdd: Arm5eCharacterActorSheetV2.itemAdd
    }
  };

  /**
   * Prepare common context used by character-like actor sheets.
   * @param {object} context
   * @param {object} [options]
   * @param {boolean} [options.showQualities]
   * @param {boolean} [options.showQualitiesForEntity]
   * @returns {Promise<object>}
   * @protected
   */
  async _prepareCharacterContext(
    context,
    { showQualities = false, showQualitiesForEntity = false } = {}
  ) {
    context.config = CONFIG.ARM5E;
    context.selection ??= {};
    context.abilityKeys = foundry.utils.deepClone(CONFIG.ARM5E.ALL_ABILITIES ?? {});
    context.abilityKeys[""] = {
      mnemonic: "arm5e.sheet.skill.abilityNoKey",
      option: false,
      selection: "disabled"
    };

    context.ui ??= {};
    if (context.actor?.system?.states?.creationMode) {
      context.ui.creationMode = { edit: "" };
      context.ui.storyMode = { edit: "readonly" };
    } else {
      context.ui.creationMode = { edit: "readonly" };
      context.ui.storyMode = { edit: "" };
    }

    if (this.actor.isCharacter()) {
      context.characList = Object.keys(context.system?.characCfg ?? {});
    }

    if (showQualities || (showQualitiesForEntity && context.system?.charType?.value === "entity")) {
      context.ui.qualities = { display: true };
    }

    context.sanctums = [];
    if (context.system.covenant?.linked) {
      const cov = context.system.covenant.document;
      // All real sanctums linked to this covenant which have no owner or are owned by this character
      context.sanctums = cov.system.labs
        .filter(
          (lab) =>
            lab.system.sanctumId &&
            (lab.system.linked || lab.system.owner.actorId === this.actor.id)
        )
        .map((e) => ({ id: e.system.sanctumId, name: e.name }));
    }

    context.system.isCharacter = this.actor.isCharacter();
    if (context.system.isCharacter) {
      if (context.system.charType?.value === "entity") {
        const cnt = Object.entries(context.system.realms).filter((e) => e[1].aligned === true);
        const value = Object.entries(context.system.realms).find((e) => e[1].aligned === true);
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

      if (
        context.system?.charType?.value === "magusNPC" ||
        context.system?.charType?.value === "magus"
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

        context.artsIcons = game.settings.get(ARM5E.SYSTEM_ID, "artsIcons");

        // Casting total modifiers
        if (context.system.castingtotal === undefined) {
          context.system.castingtotal = {};
        }
        if (context.system.castingtotal.modifier === undefined) {
          context.system.castingtotal.modifier = 0;
        }
        if (context.system.castingtotal.aura === undefined) {
          context.system.castingtotal.aura = 0;
        }
        if (context.system.castingtotal.applyFocus === undefined) {
          context.system.castingtotal.applyFocus = false;
        }
        if (context.system.castingtotal.divider === undefined) {
          context.system.castingtotal.divider = 1;
        }

        // Lab total modifiers
        if (context.system.sanctum.linked) {
          const lab = context.system.sanctum.document;
          context.system.labTotal.quality = parseInt(lab.system.generalQuality.total);
          context.system.labTotal.specialty = lab.system.specialty;
          context.system.labTotal.aura =
            lab.system.aura.computeMaxAuraModifier(this.actor.system.realms) + lab.system.auraBonus;
        }

        // Hermetic filters
        let spellsFilters = context.ui.filters.hermetic.spells;
        context.system.filteredSpells = hermeticFilter(spellsFilters, context.system.spells);
        if (spellsFilters.expanded) {
          context.ui.spellsFilterVisibility = "";
        } else {
          context.ui.spellsFilterVisibility = "hidden";
        }
        if (
          spellsFilters.formFilter !== "" ||
          spellsFilters.techniqueFilter !== "" ||
          (spellsFilters.levelFilter !== 0 && spellsFilters.levelFilter !== null)
        ) {
          context.ui.spellFilter = UI.STYLES.FILTER_ACTIVE;
        }

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
          magicEffectFilters.formFilter !== "" ||
          magicEffectFilters.techniqueFilter !== "" ||
          (magicEffectFilters.levelFilter !== 0 && magicEffectFilters.levelFilter !== null)
        ) {
          context.ui.magicEffectFilter = UI.STYLES.FILTER_ACTIVE;
        }

        // Magic arts
        for (let [key, technique] of Object.entries(context.system.arts.techniques)) {
          technique.ui = {
            style: "",
            title: "",
            xpStyle: "",
            xpTitle: ""
          };
          if (technique.deficient) {
            technique.ui = {
              style: UI.STYLES.DEFICIENT_ART,
              title: game.i18n.localize("arm5e.activeEffect.types.arts.deficiency")
            };
          } else if (!technique.bonus && technique.xpCoeff === 1.0) {
            technique.ui.style = UI.STYLES.STANDARD_ART;
          } else if (!technique.bonus && technique.xpCoeff !== 1.0) {
            technique.ui.style = UI.STYLES.AFINITY_ART;
            technique.ui.title = `${game.i18n.localize(
              "arm5e.activeEffect.types.arts.affinity"
            )} : x ${technique.xpCoeff} ${game.i18n.localize("arm5e.sheet.experienceShort")}`;
          } else if (technique.bonus && technique.xpCoeff === 1.0) {
            technique.ui.style = UI.STYLES.PUISSANT_ART;
            technique.ui.title = `${game.i18n.localize(
              "arm5e.activeEffect.types.arts.puissant"
            )} : + ${technique.bonus}`;
          } else {
            technique.ui.style = UI.STYLES.COMBO_ART;
            technique.ui.title = `${game.i18n.localize(
              "arm5e.activeEffect.types.arts.affinity"
            )} : x ${technique.xpCoeff} ${game.i18n.localize(
              "arm5e.sheet.experienceShort"
            )}, ${game.i18n.localize("arm5e.activeEffect.types.arts.puissant")} : + ${
              technique.bonus
            }`;
          }
          technique.finalXp = technique.xp + technique.xpBonus;

          if (technique.xpBonus !== 0) {
            technique.ui.xpTitle = `${technique.xpBonus > 0 ? "+" : "-"}${
              technique.xpBonus
            } ${game.i18n.localize("arm5e.sheet.experienceShort")}`;
            technique.ui.xpStyle = "font-style: italic;";
          }
        }

        // castingTotals
        context.system.castingTotals = {};
        context.spellCastingDividers = [
          { key: "1", label: `${game.i18n.localize("arm5e.messages.die.divideBy")}1` },
          { key: "2", label: `${game.i18n.localize("arm5e.messages.die.divideBy")}2` },
          { key: "5", label: `${game.i18n.localize("arm5e.messages.die.divideBy")}5` }
        ];
        // LabTotals
        context.system.labTotals = {};
        context.system.labTotal = context.system.labTotal ?? {};
        for (let [key, form] of Object.entries(context.system.arts.forms)) {
          form.ui = { style: "", title: "", xpStyle: "", xpTitle: "" };
          if (form.deficient) {
            form.ui.style = UI.STYLES.DEFICIENT_ART;
            form.ui.title = game.i18n.localize("arm5e.activeEffect.types.arts.deficiency");
          } else if (!form.bonus && form.xpCoeff === 1.0) {
            form.ui.style = UI.STYLES.STANDARD_ART;
          } else if (!form.bonus && form.xpCoeff !== 1.0) {
            form.ui.style = UI.STYLES.AFINITY_ART;
            form.ui.title = `${game.i18n.localize("arm5e.activeEffect.types.arts.affinity")} : x ${
              form.xpCoeff
            } ${game.i18n.localize("arm5e.sheet.experienceShort")}`;
          } else if (form.bonus && form.xpCoeff === 1.0) {
            form.ui.style = UI.STYLES.PUISSANT_ART;
            form.ui.title = `${game.i18n.localize("arm5e.activeEffect.types.arts.puissant")} : + ${
              form.bonus
            }`;
          } else {
            form.ui.style = UI.STYLES.COMBO_ART;
            form.ui.title = `${game.i18n.localize("arm5e.activeEffect.types.arts.affinity")} : x ${
              form.xpCoeff
            } ${game.i18n.localize("arm5e.sheet.experienceShort")}
              }, ${game.i18n.localize("arm5e.activeEffect.types.arts.puissant")} : + ${
              form.bonus
            } `;
          }
          form.finalXp = form.xp + form.xpBonus;
          if (form.xpBonus !== 0) {
            form.ui.xpTitle = `${form.xpBonus > 0 ? "+" : "-"}${form.xpBonus} ${game.i18n.localize(
              "arm5e.sheet.experienceShort"
            )}`;
            form.ui.xpStyle = "font-style: italic;";
          }
          context.system.castingTotals[key] = {};
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

        if (ab.system.derivedScore === ab.system.finalScore && ab.system.xpCoeff === 1.0) {
          ab.ui = { style: "" };
        } else if (ab.system.derivedScore === ab.system.finalScore && ab.system.xpCoeff !== 1.0) {
          ab.ui = { style: UI.STYLES.AFFINITY_ABILITY, title: "Affinity, " };
        } else if (ab.system.derivedScore !== ab.system.finalScore && ab.system.xpCoeff === 1.0) {
          ab.ui = { style: UI.STYLES.PUISSANT_ABILITY, title: "" };
        } else {
          ab.ui = { style: UI.STYLES.COMBO_ABILITY, title: "Affinity, " };
        }
      }

      for (let [key, charac] of Object.entries(context.system.characteristics)) {
        const shadowWidth = 2 * charac.aging;
        charac.ui = {
          style: `style="box-shadow: 0 0 ${shadowWidth}px black"`,
          title: `${charac.aging} ${game.i18n.localize("arm5e.sheet.agingPts")}`
        };
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

    // --- custom magic system hook ---
    if (context.system.features?.magicSystem) {
      if (!this.magicSystem) {
        this.magicSystem = new ArM5eMagicSystem(this);
      }
      await this.magicSystem._prepareContext(context);
    }

    await this.enrichCharacterEditors(context);

    return context;
  }

  async enrichCharacterEditors(context) {
    const enrichOptions = {
      secrets: this.document.isOwner,
      rollData: context.rollData,
      relativeTo: this.actor
    };

    context.enrichedBiography = await foundry.applications.ux.TextEditor.enrichHTML(
      this.actor.system.biography ?? "",
      enrichOptions
    );
    context.enrichedSecrets = await foundry.applications.ux.TextEditor.enrichHTML(
      this.actor.system.secrets ?? "",
      enrichOptions
    );
    context.enrichedSigil = await foundry.applications.ux.TextEditor.enrichHTML(
      this.actor.system.sigil?.value ?? "",
      enrichOptions
    );
    context.enrichedWarping = await foundry.applications.ux.TextEditor.enrichHTML(
      this.actor.system.warping?.effects ?? "",
      enrichOptions
    );
    context.enrichedDecrepitude = await foundry.applications.ux.TextEditor.enrichHTML(
      this.actor.system.decrepitude?.effects ?? "",
      enrichOptions
    );
    context.enrichedTwilightScars = await foundry.applications.ux.TextEditor.enrichHTML(
      this.actor.system.laboratory?.longevityRitual?.twilightScars ?? "",
      enrichOptions
    );
  }

  /**
   * Build and resolve the combat damage dialog.
   * Kept for compatibility with computeDamage(), which calls actor.sheet._onCalculateDamage().
   * @param {object} dataset
   * @returns {Promise<object|null>}
   */
  async _onCalculateDamage(dataset) {
    const data = {
      ...dataset,
      modifier: 0,
      formDamage: "te",
      selection: { forms: CONFIG.ARM5E.magic.forms }
    };

    this.actor.rollInfo.init(data, this.actor);
    data.actor = this.actor;

    const dialog = await foundry.applications.handlebars.renderTemplate(
      `systems/${ARM5E.SYSTEM_ID}/templates/generic/combat-damage.html`,
      data
    );

    return customDialogAsync({
      owner: this,
      window: { title: game.i18n.localize("arm5e.dialog.damageCalculator") },
      content: dialog,
      buttons: [
        {
          action: "apply",
          label: game.i18n.localize("arm5e.generic.yes"),
          icon: "<i class='fas fa-check'></i>",
          callback: async (_event, _button, dlg) => {
            return combatDamage(dlg.element, this.actor);
          }
        },
        {
          action: "no",
          label: game.i18n.localize("arm5e.dialog.button.cancel"),
          icon: "<i class='fas fa-ban'></i>",
          callback: () => null
        }
      ]
    });
  }

  // ── Drag & Drop ────────────────────────────────────────────────────────────

  /**
   * Handle an actor being dropped on this character sheet.
   * Supports dropping a covenant (links the character to the covenant) or a
   * laboratory (links the character to the sanctum), with bi-directional
   * binding on both sides.
   * @override
   */
  async _onDropActor(event, actor) {
    if (!this.actor.isOwner) return false;
    if (!this.isActorDropAllowed(actor?.type)) return false;
    const updateArray = [];
    const promiseArray = [];
    if (actor.type === "covenant") {
      return await this.linkToCovenant(actor.name, actor);
    } else if (actor.type === "laboratory") {
      ui.notifications.info(game.i18n.localize("arm5e.notification.linking.sanctumToCharacter"));
      return true;

      // WIP TODO
      if (!this.actor.system.covenant?.linked) {
        ui.notifications.warn(
          game.i18n.localize("arm5e.notification.linking.sanctumWithoutCovenant")
        );
        return false;
      }
      if (actor.system.owner.linked && actor.system.owner.actorId !== this.actor.id) {
        ui.notifications.warn(
          game.i18n.localize("arm5e.notification.linking.sanctumAlreadyLinked")
        );
        return false;
      }
      if (this.actor.system.sanctum.linked && this.actor.system.sanctum.actorId === actor.id) {
        ui.notifications.warn(
          game.i18n.localize("arm5e.notification.linking.sanctumAlreadyLinked")
        );
        return false;
      }
      if (this.actor.system.covenant.linked) {
        const cov = this.actor.system.covenant.document;
        //

        // if (cov.system.labs.find((lab) => lab.id === actor.id &&)) {
        //   ui.notifications.warn(game.i18n.localize("arm5e.notification.linking.sanctumAlreadyLinked"));
        //   return false;
        // }
      }

      // TODO: restrict to free sanctums that are linked to the same covenant as this character, if any.
      // Detach from the previous sanctum if present.
      if (this.actor.system.sanctum?.linked) {
        const oldLab = this.actor.system.sanctum.document;
        delete this.actor.apps[oldLab.sheet?.options?.uniqueId];
        delete oldLab.apps[this.options.uniqueId];
        updateArray.push(oldLab.sheet?._unbindLaboratoryData());
      }
      // Bind on the lab side.
      updateArray.push(this.sheet._bindLaboratoryData(this.actor));
      updateArray.push(actor.sheet._bindOwnerData(this.actor));
    }

    if (updateArray.length > 0) {
      promiseArray.push(Actor.updateDocuments(updateArray));
    }
    if (promiseArray.length > 0) {
      await Promise.all(promiseArray);
    }
    return true;
  }

  /**
   * Build the update payload that records this actor's link to a dropped
   * covenant or laboratory.  Returns a plain update object (not a Promise)
   * so callers can batch it with other updates.
   * @param {Actor} actor  The dropped actor (covenant or laboratory).
   * @returns {object}  Foundry update data object, or empty object if not applicable.
   */
  _bindCovenantData(actor) {
    if (actor?.type !== "covenant") return {};
    const updateData = { _id: this.actor._id };

    updateData["system.covenant.value"] = actor.name;
    updateData["system.covenant.actorId"] = actor._id;
    return updateData;
  }
  /**
   * Build the update payload that clears this actor's link to the given
   * covenant or laboratory.  Returns a plain update object (not a Promise).
   * @param {Actor} actor  The actor being unlinked (covenant or laboratory).
   * @returns {object}  Foundry update data object, or empty object if not applicable.
   */

  _unbindCovenantData() {
    const updateData = { _id: this.actor._id };
    updateData["system.covenant.value"] = "";
    updateData["system.covenant.actorId"] = null;
    return updateData;
  }

  _bindLaboratoryData(actor) {
    if (actor?.type !== "laboratory") return {};
    const updateData = { _id: this.actor._id };
    updateData["system.sanctum.value"] = actor.name;
    updateData["system.sanctum.actorId"] = actor._id;
    return updateData;
  }

  _unbindLaboratoryData() {
    const updateData = { _id: this.actor._id };
    updateData["system.sanctum.value"] = "";
    updateData["system.sanctum.actorId"] = null;
    return updateData;
  }

  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Warn if an ability drop would duplicate an existing ability key on the actor.
   * @param {Item} item
   * @protected
   */
  _warnDuplicateAbilityDrop(item) {
    if (item?.type !== "ability") return;
    if (!this.actor?.hasSkill?.(item.system?.key)) return;
    ui.notifications.warn(
      `${game.i18n.localize("arm5e.notification.doubleAbility")} : ${item.name}`
    );
  }

  /**
   * Open the dropped item sheet when the source item is external to this actor.
   * @param {Item|null} result
   * @param {Item} sourceItem
   * @returns {Item|null}
   * @protected
   */
  _renderExternalDroppedItem(result, sourceItem) {
    if (result && this.actor.uuid !== sourceItem?.parent?.uuid) {
      result.sheet?.render(true);
    }
    return result;
  }

  /** @override */
  async _onRender(context, options) {
    await super._onRender(context, options);

    // Non-click interaction stays in _onRender for AppV2 parity.
    this.element.querySelectorAll(".equipment").forEach((el) => {
      el.addEventListener("change", (event) => this._onEquipmentChange(event));
    });
    this.element.querySelectorAll(".covenant-link").forEach((el) => {
      el.addEventListener("change", (event) => this._onCovenantLinkChange(event));
    });
    this.element.querySelectorAll(".sanctum-link").forEach((el) => {
      el.addEventListener("change", (event) => this._onSanctumLinkChange(event));
    });
    this.element.querySelectorAll(".xp-technique").forEach((el) => {
      el.addEventListener("change", (event) => this._onXpTechniqueChange(event));
    });
    this.element.querySelectorAll(".xp-form").forEach((el) => {
      el.addEventListener("change", (event) => this._onXpFormChange(event));
    });
  }

  async _onXpTechniqueChange(event) {
    event.preventDefault();
    let value = parseInt(event.currentTarget.value);
    const techniqueKey = event.currentTarget.dataset.technique;
    value = value - this.actor.system.arts.techniques[techniqueKey].xpBonus;
    if (value < 0) value = 0;
    await this.actor.update({
      [`system.arts.techniques.${techniqueKey}.xp`]: value
    });
  }

  async _onXpFormChange(event) {
    event.preventDefault();
    let value = parseInt(event.currentTarget.value);
    const formKey = event.currentTarget.dataset.form;
    value = value - this.actor.system.arts.forms[formKey].xpBonus;
    if (value < 0) value = 0;
    await this.actor.update({
      [`system.arts.forms.${formKey}.xp`]: value
    });
  }

  async _onCovenantLinkChange(event) {
    event.preventDefault();
    const value = event.currentTarget.value;
    const covenant = game.actors.getName(value);

    await this.linkToCovenant(value, covenant);
  }

  async linkToCovenant(covenantName, covenant) {
    if (
      covenant &&
      this.actor.system.covenant?.linked &&
      this.actor.system.covenant.actorId === covenant.id
    ) {
      ui.notifications.warn("These actors are already linked.");
      return false;
    }
    const confirmed = await getConfirmation(
      "",
      "Are you sure you want to link this covenant to the character?",
      "PC",
      "Any lab linked to this character will be reset."
    );
    if (!confirmed) return false;

    const promiseArray = [];
    const updateArray = [];
    let characterUpdate = {};
    // remove previous covenant binding if present
    if (this.actor.system.covenant?.linked) {
      const previousCovenant = this.actor.system.covenant.document;
      delete this.actor.apps[previousCovenant?.sheet?.appId];
      if (previousCovenant?.apps) delete previousCovenant.apps[this.options.uniqueId];
      promiseArray.push(previousCovenant?.sheet?._unbindCharacter?.(this.actor));
      // remove lab ownership
      if (this.actor.system.sanctum?.linked) {
        const sanctum = this.actor.system.sanctum.document;
        delete this.actor.apps[sanctum?.sheet?.appId];
        if (sanctum?.apps) delete sanctum.apps[this.options.uniqueId];
        updateArray.push(sanctum.sheet._unbindOwnerData());
        foundry.utils.mergeObject(characterUpdate, this.actor.sheet._unbindLaboratoryData());
      }
    }

    if (covenant) {
      foundry.utils.mergeObject(characterUpdate, this._bindCovenantData(covenant));
      // Bind on the covenant side (add this character to its inhabitants).
      promiseArray.push(covenant.sheet._bindCharacter(this.actor));
    } else {
      characterUpdate._id = this.actor.id;
      characterUpdate["system.covenant.value"] = covenantName;
      characterUpdate["system.covenant.actorId"] = null;
    }
    updateArray.push(characterUpdate);
    promiseArray.push(Actor.updateDocuments(updateArray));

    await Promise.all(promiseArray);
    return true;
  }

  async _onSanctumLinkChange(event) {
    event.preventDefault();
    event.stopPropagation();
    const value = event.currentTarget.value;
    const sanctum = game.actors.get(value);
    await this._changeSanctum(sanctum);
  }

  async _changeSanctum(sanctum) {
    if (
      sanctum &&
      this.actor.system.sanctum?.linked &&
      this.actor.system.sanctum.actorId === sanctum.id
    ) {
      ui.notifications.warn("These actors are already linked.");
      return false;
    }

    const updateArray = [];

    if (this.actor.system.sanctum?.linked) {
      const previousSanctum = this.actor.system.sanctum.document;
      delete this.actor.apps[previousSanctum?.sheet?.appId];
      if (previousSanctum?.apps) delete previousSanctum.apps[this.options.uniqueId];

      const unbind = previousSanctum.sheet._unbindOwnerData();
      if (unbind) updateArray.push(unbind);
    }

    if (sanctum) {
      updateArray.push({
        _id: this.actor.id,
        "system.sanctum.value": sanctum.name,
        "system.sanctum.actorId": sanctum._id
      });
      const bind = sanctum.sheet._bindOwnerData(this.actor);
      if (bind) updateArray.push(bind);
    } else {
      updateArray.push({
        _id: this.actor.id,
        "system.sanctum.value": "",
        "system.sanctum.actorId": null
      });
    }

    await Actor.updateDocuments(updateArray);
    return true;
  }

  async _onEquipmentChange(event) {
    const itemEl = event.currentTarget.closest(".item");
    const itemId = itemEl?.dataset?.itemId;
    if (!itemId) return;
    await this._toggleEquip(itemId);
  }

  async _toggleEquip(itemId) {
    const updateData = {};
    let current = this.actor.system.combatPreps.current;
    const prep = this.actor.system.combatPreps.list[current];
    const item = this.actor.items.get(itemId);
    if (current !== "custom") {
      updateData["system.combatPreps.current"] = "custom";
      current = "custom";
    }

    const newIds = prep.ids.filter((e) => this.actor.items.get(e));
    const idx = newIds.indexOf(itemId);
    if (idx >= 0) newIds.splice(idx, 1);
    else {
      newIds.push(itemId);

      // Natural and non-natural weapons cannot be equipped together.
      if (item?.type === "weapon") {
        const targetIsNatural = !!item.system.naturalWeapon;
        for (let i = newIds.length - 1; i >= 0; i--) {
          const id = newIds[i];
          if (id === itemId) continue;
          const other = this.actor.items.get(id);
          if (other?.type !== "weapon") continue;
          if (!!other.system.naturalWeapon !== targetIsNatural) {
            newIds.splice(i, 1);
          }
        }
      }
    }

    updateData[`system.combatPreps.list.${current}.ids`] = newIds;
    await this.actor.update(updateData);
  }

  static async actorProfile(event, target) {
    event.preventDefault();
    await this.actorProfiles.addProfile(target, event.shiftKey);
    this.render();
  }

  static async characterSchedule(event, target) {
    event.preventDefault();
    const schedule = new Schedule({
      document: this.actor,
      type: "character"
    });
    this.actor.apps[schedule.appId] = schedule;
    await schedule.render(true);
  }

  static async rollOrAgingPts(event, target) {
    event.preventDefault();
    if (event.shiftKey) {
      await this._editAging(target);
      return;
    }
    // Set roll type if not already specified
    if (!target.dataset.roll) {
      target.dataset.roll = "char";
    }
    return await this.roll(target.dataset);

    // const rollHandler = this?.roll ?? this?.constructor?.roll;
    // if (typeof rollHandler !== "function") {
    //   throw new TypeError("roll handler is not available");
    // }
    // return rollHandler.call(this, event, target);
  }

  static async recoveryStart(event, target) {
    event.preventDefault();
    await Sanatorium.createDialog(this.actor);
  }

  static async twilightEpisode(event, target) {
    event.preventDefault();
    const input = { ...target.dataset };

    if (event.shiftKey && game.user.isGM) {
      const question = game.i18n.localize("arm5e.twilight.reset");
      const confirm = await getConfirmation(
        game.i18n.localize("arm5e.twilight.episode"),
        question,
        ArM5eActorSheetV2.getFlavor(this.actor.type)
      );
      if (confirm) await resetTwilight(this.actor);
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
        }
        break;
      case TWILIGHT_STAGES.PENDING_CONTROL:
        if (!this.actor.system.twilight.control) {
          const question = game.i18n.localize("arm5e.twilight.embraceTwilight");
          const confirm = await getConfirmation(
            game.i18n.localize("arm5e.twilight.episode"),
            question,
            ArM5eActorSheetV2.getFlavor(this.actor.type),
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
        }
        break;
      case TWILIGHT_STAGES.PENDING_UNDERSTANDING: {
        input.applied = false;
        input.done = false;
        input.rollDone = false;
        const [diary] = await createTwilightDiaryEntry(this.actor, input);
        diary.sheet.render(true);
        await this.actor.update({
          "system.twilight.stage": TWILIGHT_STAGES.PENDING_UNDERSTANDING2
        });
        break;
      }
      case TWILIGHT_STAGES.PENDING_UNDERSTANDING2:
        ui.notifications.info(game.i18n.localize("arm5e.twilight.notification.continueWithDiary"), {
          permanent: false
        });
        break;
    }
  }

  static async scheduleAging(event, target) {
    event.preventDefault();
    const input = { ...target.dataset };
    const diary = await createAgingDiaryEntry(this.actor, input);
    diary[0]?.sheet?.render(true);
  }

  static async actorRest(event, target) {
    event.preventDefault();
    if (!["player", "npc", "beast"].includes(this.actor.type)) return;
    const longTerm = !!event.shiftKey;
    this.actor.rest(longTerm);
  }

  static async addFatigue(event, target) {
    event.preventDefault();
    const longTerm = !!event.shiftKey;
    this.actor.loseFatigueLevel(1, false, longTerm);
  }

  static async removeFatigue(event, target) {
    event.preventDefault();
    const longTerm = !!event.shiftKey;
    this.actor.recoverFatigueLevel(1, longTerm);
  }

  static async addWound(event, target) {
    event.preventDefault();
    const woundType = target.dataset.type;
    if (!woundType) return;
    await this.actor.changeWound(1, woundType);
  }

  static async woundEdit(event, target) {
    event.preventDefault();
    const itemId = target.dataset.id;
    if (!itemId) return;
    this.actor.getEmbeddedDocument("Item", itemId)?.sheet?.render(true, { focus: true });
  }

  static async planReading(event, target) {
    event.preventDefault();
    const itemEl = target.closest(".item");
    const itemId = itemEl?.dataset?.itemId;
    if (!itemId) return;
    const item = this.actor.getEmbeddedDocument("Item", itemId);
    if (!item) return;
    await item.system.readBook(item, target.dataset);
  }

  static async visStudy(event, target) {
    event.preventDefault();
    const itemEl = target.closest(".item");
    const itemId = itemEl?.dataset?.itemId;
    if (!itemId || !this.actor.isMagus()) return;
    const item = this.actor.getEmbeddedDocument("Item", itemId);
    if (!item) return;
    const entry = await item.system.createDiaryEntryToStudyVis(this.actor);
    entry.sheet?.render(true);
  }

  static async studyLabtext(event, target) {
    event.preventDefault();
    const itemEl = target.closest(".item");
    const itemId = itemEl?.dataset?.itemId;
    if (!itemId || !this.actor.isMagus()) return;
    const item = this.actor.getEmbeddedDocument("Item", itemId);
    if (!item) return;
    await item._studyLabText(item, event);
  }

  static async increaseTech(event, target) {
    event.preventDefault();
    const art = target.closest(".art")?.dataset?.attribute;
    if (!art) return;
    const data = this.actor.system.arts.techniques[art];
    data.key = art;
    data.type = "techniques";
    await this._increaseArt(data);
  }

  static async decreaseTech(event, target) {
    event.preventDefault();
    const art = target.closest(".art")?.dataset?.attribute;
    if (!art) return;
    const data = this.actor.system.arts.techniques[art];
    data.key = art;
    data.type = "techniques";
    await this._decreaseArt(data);
  }

  static async increaseForm(event, target) {
    event.preventDefault();
    const art = target.closest(".art")?.dataset?.attribute;
    if (!art) return;
    const data = this.actor.system.arts.forms[art];
    data.key = art;
    data.type = "forms";
    await this._increaseArt(data);
  }

  static async decreaseForm(event, target) {
    event.preventDefault();
    const art = target.closest(".art")?.dataset?.attribute;
    if (!art) return;
    const data = this.actor.system.arts.forms[art];
    data.key = art;
    data.type = "forms";
    await this._decreaseArt(data);
  }

  async _increaseArt(data) {
    const oldXp = data.xp;
    const xpMod = data.xpBonus;
    const score = data.derivedScore;
    const xpCoeff = data.xpCoeff;
    const newXp = Math.max(0, Math.round((((score + 1) * (score + 2)) / 2 - xpMod) / xpCoeff));
    await this.actor.update({ [`system.arts.${data.type}.${data.key}.xp`]: newXp });
    console.log(`Added ${newXp - oldXp} xps from ${oldXp} to ${newXp}`);
  }

  async _decreaseArt(data) {
    const oldXp = data.xp;
    const xpMod = data.xpBonus;
    const score = data.derivedScore;
    const xpCoeff = data.xpCoeff;
    // floor score achievable at xp=0 when xpMod is positive (e.g. xpMod=6 → floor score 3)
    const minScore = Math.floor((Math.sqrt(1 + 8 * Math.max(0, xpMod)) - 1) / 2);
    if (score <= minScore) return;
    const newXp = Math.max(0, Math.round((((score - 1) * score) / 2 - xpMod) / xpCoeff));
    await this.actor.update({ [`system.arts.${data.type}.${data.key}.xp`]: newXp });
    console.log(`Removed ${newXp - oldXp} xps from ${oldXp} to ${newXp} total`);
  }

  static async increaseScore(event, target) {
    event.preventDefault();
    const itemId = target.closest(".item")?.dataset?.itemId;
    if (!itemId) return;
    const item = this.actor.items.get(itemId);
    if (!item?.system?.increaseScore) return;
    await item.system.increaseScore();
  }

  static async decreaseScore(event, target) {
    event.preventDefault();
    const itemId = target.closest(".item")?.dataset?.itemId;
    if (!itemId) return;
    const item = this.actor.items.get(itemId);
    if (!item?.system?.decreaseScore) return;
    await item.system.decreaseScore();
  }

  static async prepCreate(event, target) {
    event.preventDefault();
    const prep = { ids: [] };
    const itemList = [];

    for (const weapon of this.actor.system.weapons) {
      if (weapon.system.equipped !== true) continue;
      prep.name = prep.name ?? weapon.name;
      itemList.push(weapon.name);
      prep.ids.push(weapon._id);
    }
    for (const armor of this.actor.system.armor) {
      if (armor.system.equipped !== true) continue;
      prep.name = prep.name ?? armor.name;
      itemList.push(armor.name);
      prep.ids.push(armor._id);
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
    if (key === "custom") return;
    prep.name = name;

    await this.actor.update({
      [`system.combatPreps.list.${key}`]: prep,
      "system.combatPreps.current": key
    });
  }

  static async prepDelete(event, target) {
    event.preventDefault();
    const current = this.actor.system.combatPreps.current;
    if (current === "custom") return;

    const name = this.actor.system.combatPreps.list[current].name;
    let confirmed = !!event.shiftKey;
    if (!confirmed) {
      confirmed = await getConfirmation(
        name,
        game.i18n.localize("arm5e.dialog.delete-question"),
        ArM5eActorSheetV2.getFlavor(this.actor.type)
      );
    }
    if (!confirmed) return;

    await this.actor.update({
      [`system.combatPreps.list.-=${current}`]: null,
      "system.combatPreps.current": "custom"
    });
  }

  static async viewMedicalHistory(event, target) {
    event.preventDefault();
    await MedicalHistory.createDialog(this.actor);
  }

  static async migrateActor(event, target) {
    event.preventDefault();
    await this.actor.migrate();
  }

  static async removeCreationMode(event, target) {
    event.preventDefault();
    const confirmed = await getConfirmation(
      "",
      game.i18n.localize("arm5e.sheet.msg.creationModeRemoval"),
      ArM5eActorSheetV2.getFlavor(this.actor.type)
    );
    if (!confirmed) return;
    await this.actor.update({ "system.states.creationMode": false });
  }

  static async clearConfidencePrompt(event, target) {
    event.preventDefault();
    await this.actor.clearConfidencePrompt();
  }

  static async itemAdd(event, target) {
    event.preventDefault();
    if (
      this.actor.system.codex?.linked &&
      ["spells", "effects"].includes(target.dataset.compendium)
    ) {
      this.actor.system.codex.document.sheet?.render(true);
      return;
    }

    super.itemAdd(event, target);
  }

  async _editAging(target) {
    const dataset = target.dataset;
    const score = this.actor.system.characteristics[dataset.characteristic].value;
    const prompt = `${game.i18n.localize(
      CONFIG.ARM5E.character.characteristics[dataset.characteristic].label
    )} (${score})`;

    let newValue = await numberInput(
      game.i18n.format("arm5e.hints.edit", {
        item: game.i18n.localize("arm5e.sheet.agingPts")
      }),
      prompt,
      0,
      this.actor.system.characteristics[dataset.characteristic].aging,
      ""
    );

    const updateData = {};
    if (newValue > Math.abs(score)) {
      newValue = 0;
      updateData[`system.characteristics.${dataset.characteristic}.value`] =
        this.actor.system.characteristics[dataset.characteristic].value - 1;
      ui.notifications.info(
        game.i18n.format("arm5e.aging.manualEdit", {
          name: this.actor.name,
          char: prompt
        }),
        { permanent: false }
      );
    }

    updateData[`system.characteristics.${dataset.characteristic}.aging`] = newValue;
    await this.actor.update(updateData);
  }
}
