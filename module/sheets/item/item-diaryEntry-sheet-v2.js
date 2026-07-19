import { ArM5eItemSheetV2 } from "./item-sheet-v2.js";
import { ArM5eActorSheetV2 } from "../actor/actor-sheet-v2.js";
import { getConfirmation } from "../../ui/dialogs.js";
import { DiaryEntrySchema } from "../../schemas/diarySchema.js";
import { ArM5eItem } from "../../item/item.js";
import { ActivitySchedule } from "../../apps/activity-schedule.js";
import {
  genericValidationOfActivity,
  getNewTitleForActivity
} from "../../seasonal-activities/long-term-activities.js";
import {
  getActivityDefinition,
  getSelectableActivityDefinitions
} from "../../seasonal-activities/activity-config.js";
import { getAbilityFromCompendium } from "../../tools/compendia.js";
import { spellFormLabel, spellTechniqueLabel } from "../../helpers/magic.js";
import { log } from "../../tools/tools.js";

/**
 * AppV2 sheet for diaryEntry items.
 */
export class ArM5eDiaryEntryItemSheetV2 extends ArM5eItemSheetV2 {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["arm5e", "sheet", "item"],
    position: { width: 654, height: 800 },
    dragDrop: [
      { dragSelector: null, dropSelector: ".progress-teacher" },
      { dragSelector: null, dropSelector: ".progress-abilities" },
      { dragSelector: null, dropSelector: ".drop-newspell" }
    ],
    actions: {
      progressApply: ArM5eDiaryEntryItemSheetV2.progressApply,
      progressPartial: ArM5eDiaryEntryItemSheetV2.progressPartial,
      progressRollback: ArM5eDiaryEntryItemSheetV2.progressRollback,
      progressRefresh: ArM5eDiaryEntryItemSheetV2.progressRefresh,
      progressControl: ArM5eDiaryEntryItemSheetV2.progressControl,
      resetTeacher: ArM5eDiaryEntryItemSheetV2.resetTeacher,
      showSpell: ArM5eDiaryEntryItemSheetV2.showSpell,
      selectDates: ArM5eDiaryEntryItemSheetV2.selectDates,
      rollActivity: ArM5eDiaryEntryItemSheetV2.rollActivity,
      itemDeleteConfirm: ArM5eItemSheetV2.itemDeleteConfirm
    }
  };

  /** @override */
  static TABS = {
    primary: {
      tabs: [
        { id: "description", label: "arm5e.sheet.description", cssClass: "item flexrow" },
        { id: "advanced", label: "arm5e.sheet.advanced", cssClass: "item flexrow" }
      ],
      initial: "description"
    },
    "advanced-secondary": {
      tabs: [
        { id: "teacher", label: "arm5e.activity.teacher.label", cssClass: "item flexrow" },
        { id: "abilities", label: "arm5e.sheet.abilities", cssClass: "item flexrow" },
        { id: "arts", label: "arm5e.sheet.arts", cssClass: "item flexrow" },
        { id: "masteries", label: "arm5e.activity.progress.masteries", cssClass: "item flexrow" },
        { id: "spells", label: "arm5e.activity.spellLearning", cssClass: "item flexrow" }
      ],
      initial: "abilities"
    }
  };

  /** @override */
  static PARTS = {
    header: {
      template: "systems/arm5e/templates/item/parts/item-diaryEntry-header-v2.hbs"
    },
    tabs: {
      template: "systems/arm5e/templates/generic/parts/ars-tab-navigation.hbs",
      classes: ["marginItemPart"]
    },
    description: {
      template: "systems/arm5e/templates/item/parts/item-description-v2.hbs"
    },
    advanced: {
      template: "systems/arm5e/templates/item/parts/item-diaryEntry-advanced-v2.hbs"
    },
    footer: {
      template: "systems/arm5e/templates/item/parts/item-footer-v2.hbs"
    }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.tabs = this._prepareTabs("primary");

    context.noEdit = this.isEditable ? "" : "readonly";
    context.noSelect = this.isEditable ? "" : "disabled";

    const actType = context.system.activity;
    context.firstSeason = context.system.dates[0];
    context.lastSeason = context.system.dates[context.system.dates.length - 1];

    context.ui.editDuration = "readonly";
    context.ui.editDate = "";
    context.ui.showTab = false;

    context.selection.activities = {};
    for (const [k, v] of getSelectableActivityDefinitions()) {
      if (v.display.attribute === undefined) {
        context.selection.activities[k] = v.label;
      }
    }
    context.nbApplied = context.system.dates.filter((d) => d.applied === true).length;
    context.progress = `${context.nbApplied} / ${context.system.duration}`;

    if (!Object.keys(context.selection.activities).includes(actType)) {
      context.activityState = "disabled";
    }

    const activityConfig = getActivityDefinition(actType);
    // if the activity type is not usually available for selection,
    // we need to add it to the list so it can be displayed in the sheet (but still disabled for selection)
    context.selection.activities[actType] = activityConfig.label;

    // Initialize string fields used in the advanced template's action buttons section.
    // These must be set before any early return so the template never receives undefined
    // values in {{localize ... param=...}} calls (which would crash in i18n.format).
    context.system.applyError = "";
    context.system.applyInfo = "";
    context.system.errorParam = "";
    context.system.infoParam = "";

    if (this.actor === null || this.actor.type === "covenant" || this.actor.type === "laboratory") {
      context.system.disabled = "disabled";
      context.activityState = "disabled";
      delete context.tabs.advanced;
      return context;
    }

    if (activityConfig.durationEdit === true) {
      context.ui.editDuration = "";
    }

    if (actType === "none" || actType === "recovery" || actType === "resource") {
      delete context.tabs.advanced;
      return context;
    }

    context.ui.showTab = true;

    context.rollNeeded = false;
    if (this.item.system.activityHandler?.roll && !context.system.done) {
      context.rollNeeded = true;
      context.rollLabel = this.item.system.activityHandler.roll.label;
    }

    context.enforceSchedule = game.settings.get("arm5e", "enforceSchedule");
    const hasTeacher = ["training", "teaching"].includes(actType);
    context.system.sourceBonus = 0;
    context.ui.showProgress = activityConfig.display.progress;
    context.ui.showAbilities = activityConfig.display.abilities && !context.rollNeeded;
    context.ui.showArts = activityConfig.display.arts && !context.rollNeeded;
    context.ui.showMasteries = activityConfig.display.masteries && !context.rollNeeded;
    context.ui.showNewSpells = activityConfig.display.spells && !context.rollNeeded;
    context.ui.showMagicProgress = false;
    context.ui.showTeacher = hasTeacher;
    context.ui.showBaseQuality = hasTeacher;
    context.ui.editSource = true;
    context.ui.bonusOptions = false;
    context.ui.schedule = true;

    context.system.applyPossible = true;

    context.system.ownedAbilities = {};
    context.system.defaultAbility = "";
    context.system.teacherScore = context.system.teacher.score ?? 0;
    context.system.ownedSpells = {};
    context.system.ownedSpellForms = {};
    context.system.defaultArt = "";
    context.system.ownedArts = [];
    context.system.defaultSpellMastery = "";
    context.system.sourceModifier = 0;

    context.system.canEdit = "";
    context.system.disabled = "";
    context.system.canEditTeacher = "";
    context.system.disabledTeacher = "";
    context.system.teacherLinked = this.item.system.teacher.id !== null;

    let teacher;
    if (hasTeacher) {
      if (context.system.teacherLinked) {
        context.system.canEditTeacher = "readonly";
        context.system.disabledTeacher = "disabled";
        teacher = game.actors.get(this.item.system.teacher.id);
        if (teacher === undefined && !context.system.done) {
          context.system.canEdit = "readonly";
          context.system.applyPossible = false;
          context.system.applyError =
            actType === "training"
              ? "arm5e.activity.msg.noTrainer"
              : "arm5e.activity.msg.noTeacher";
        }
        if (teacher !== undefined && !teacher.isMagus()) {
          context.ui.showMagicProgress = false;
        }
        if (teacher !== undefined && "teaching" === actType) {
          context.system.sourceModifier += teacher.system.bonuses.activities.teacher;
        }
      } else if (context.system.teacher.score < 2 && !context.system.done) {
        context.system.canEdit = "readonly";
        context.system.applyPossible = false;
        context.system.applyError = "arm5e.activity.msg.uselessTeacher";
        context.system.errorParam =
          context.system.teacher.name === ""
            ? game.i18n.localize("arm5e.activity.teacher.label")
            : context.system.teacher.name;
      }
    }

    if (this.actor.isMagus()) {
      context.ui.showMagicProgress = true;
    }

    context.system.canProgress = { abilities: true, arts: true, spells: true };
    if (context.ui.showAbilities) {
      this._retrieveAbilities(context, teacher);
      if (context.system.defaultAbility === "") {
        context.system.canProgress.abilities = false;
      }
    }
    if (context.ui.showMagicProgress) {
      if (context.ui.showArts) {
        this._retrieveArts(context, teacher);
        if (context.system.defaultArt === "") {
          context.system.canProgress.arts = false;
        }
      }
      if (context.ui.showMasteries) {
        this._retrieveSpellMasteries(context, teacher);
        if (context.system.defaultSpellMastery === "") {
          context.system.canProgress.spells = false;
        }
      }
    }

    if (context.system.done) {
      context.system.canEdit = "readonly";
      context.system.canEditTeacher = "readonly";
      context.system.disabledTeacher = "disabled";
      context.system.disabled = "disabled";
      if (!game.user.isGM) {
        context.ui.editDate = "disabled";
        context.ui.schedule = false;
      }
      context.system.applyPossible = false;
      context.system.applyError = "";
    }

    if (!context.system.applyPossible) {
      return context;
    }

    if (this.actor.system.states?.pendingCrisis) {
      context.system.applyError = "arm5e.notification.pendingCrisis";
      context.system.disabled = "disabled";
      context.activityState = "disabled";
      context.system.applyPossible = false;
      return context;
    }

    const hasScheduleConflict =
      this.item.isOwned && this.item.system.hasScheduleConflict(this.item.actor);
    if (hasScheduleConflict && context.enforceSchedule && !context.system.done) {
      context.system.applyError = "arm5e.activity.msg.scheduleConflict";
      context.astrolabIconStyle = 'style="text-shadow: 0 0 10px red"';
      context.system.applyPossible = false;
    }

    context.system.sourceModifier += this.item.actor.system.bonuses.activities[actType];
    if (activityConfig.source.readonly && !context.system.done) {
      context.ui.editSource = false;
      context.system.sourceDefault = activityConfig.source.default;
    }

    if (activityConfig.bonusOptions !== null) {
      context.ui.bonusOptions = true;
      context.bonusOptions = Object.fromEntries(
        Object.entries(activityConfig.bonusOptions).map(([k, v]) => {
          return [k, { selectLabel: `${game.i18n.localize(v.label)} (${v.modifier})`, ...v }];
        })
      );
      context.system.sourceBonus =
        activityConfig.bonusOptions[context.system.optionKey]?.modifier ?? 0;
    }

    if (!context.system.progress) {
      context.system.progress = {};
    }

    if (actType === "reading") {
      context.system.disabled = "disabled";
      context.system.canEdit = "readonly";
      context.ui.showBaseQuality = true;
    }

    if (!context.system.cappedGain) {
      context.system.cappedGain = false;
    }
    if (
      context.system.theoriticalSource !== undefined &&
      context.system.theoriticalSource !== context.system.sourceQuality
    ) {
      context.system.cappedGain = true;
      context.system.applyError = "arm5e.activity.msg.gainCapped";
    }

    if (hasTeacher) {
      if (
        foundry.utils.isEmpty(context.system.ownedAbilities) &&
        foundry.utils.isEmpty(context.system.ownedArts) &&
        foundry.utils.isEmpty(context.system.ownedSpells)
      ) {
        context.system.applyError = "arm5e.activity.msg.uselessTeacher";
        context.system.errorParam =
          context.system.teacher.name === ""
            ? game.i18n.localize("arm5e.activity.teacher.label")
            : context.system.teacher.name;
        context.system.applyPossible = false;
      }
    }

    if (this.actor.system.penalties?.activityDivider !== 1) {
      context.system.sourceQuality /= this.actor.system.penalties.activityDivider;
      context.system.applyError = "arm5e.activity.msg.sourceQualityHalved";
    }

    genericValidationOfActivity(context, this.actor, this.item);

    context.totalQuality =
      context.system.sourceQuality + context.system.sourceModifier + context.system.sourceBonus;

    if (context.system.disabled === "disabled") {
      context.activityState = "disabled";
    }

    const allDates = context.system.dates;
    if (context.partialApply === undefined) {
      context.partialApply = allDates.some((d) => !d.applied) && !context.system.done;
    }
    context.partialDates ??= [];
    context.partialButton = context.partialApply && !context.system.applyPossible;

    log("Prepared context for diary entry sheet:", context);
    return context;
  }

  /** @override */
  async _preparePartContext(partId, context, options) {
    const tabIds = ["description", "advanced"];
    if (tabIds.includes(partId)) {
      context.tab = context.tabs?.[partId];
      const secondaryKey = `${partId}-secondary`;
      if (this.constructor.TABS[secondaryKey]) {
        context.subtabs = this._prepareTabs(secondaryKey);
        if (partId === "advanced") {
          // Filter tabs — replaces {{#if ui.show*}} in the template
          if (!context.ui?.showTeacher) delete context.subtabs.teacher;
          if (!context.ui?.showAbilities) delete context.subtabs.abilities;
          if (!context.ui?.showMagicProgress || !context.ui?.showArts) delete context.subtabs.arts;
          if (!context.ui?.showMagicProgress || !context.ui?.showMasteries)
            delete context.subtabs.masteries;
          if (!context.ui?.showMagicProgress || !context.ui?.showNewSpells)
            delete context.subtabs.spells;
          // Dynamic suffixes (counts / teacher name)
          if (context.subtabs.teacher)
            context.subtabs.teacher.suffix = ` (${context.system?.teacher?.name ?? ""})`;
          if (context.subtabs.abilities)
            context.subtabs.abilities.suffix = ` (${context.system?.totalXp?.abilities ?? 0})`;
          if (context.subtabs.arts)
            context.subtabs.arts.suffix = ` (${context.system?.totalXp?.arts ?? 0})`;
          if (context.subtabs.masteries)
            context.subtabs.masteries.suffix = ` (${context.system?.totalXp?.masteries ?? 0})`;
          if (context.subtabs.spells)
            context.subtabs.spells.suffix = ` (${context.system?.totalXp?.spellLevels ?? 0})`;
          context.subtabNavClass ??= context.navClass;
          context.subtabNavStyle = "margin-bottom: 5px";
        }
      }
    }
    return super._preparePartContext(partId, context, options);
  }

  // ─── Ability / Art / Spell retrieval helpers (ported from V1) ─────────────

  _retrieveAbilities(context, teacher) {
    const actType = context.system.activity;
    const hasTeacher = context.ui.showTeacher;
    let availableAbilities;

    if (hasTeacher && context.system.teacherLinked) {
      availableAbilities = [];
      context.teacherAbilities = teacher.system.abilities.filter((e) => e.system.derivedScore >= 2);
      for (const ta of context.teacherAbilities) {
        const sa = this.actor.system.abilities.find(
          (e) => ta.system.key === e.system.key && ta.system.option === e.system.option
        );
        if (sa !== undefined) {
          if (sa.system.derivedScore < ta.system.derivedScore) {
            availableAbilities.push({
              _id: sa._id,
              secondaryId: false,
              name: sa.name,
              system: {
                key: sa.system.key,
                xp: sa.system.xp,
                score: sa.system.derivedScore,
                bonus: this.actor.system.bonuses.skills[sa.system.getComputedKey()]?.bonus ?? 0,
                option: sa.system.option,
                category: sa.system.category
              }
            });
          }
        } else {
          availableAbilities.push({
            _id: ta._id,
            secondaryId: true,
            name: ta.name,
            system: {
              key: ta.system.key,
              xp: 0,
              score: 0,
              bonus: 0,
              option: ta.system.option,
              category: ta.system.category
            }
          });
        }
      }
      if (teacher.system.features?.magicSystem && this.actor.system.features?.magicSystem) {
        const teacherVerbs = teacher.system.magicSystem.verbs.filter(
          (e) => e.system.derivedScore >= 2
        );
        for (const ta of teacherVerbs) {
          const sa = this.actor.system.magicSystem.verbs.find(
            (e) => e.system.key === ta.system.key && e.system.option === ta.system.option
          );
          if (sa !== undefined) {
            if (sa.system.derivedScore < ta.system.derivedScore) {
              availableAbilities.push({
                _id: sa._id,
                secondaryId: false,
                name: sa.name,
                system: {
                  key: sa.system.key,
                  xp: sa.system.xp,
                  score: sa.system.derivedScore,
                  bonus: this.actor.system.bonuses.skills[sa.system.getComputedKey()]?.bonus ?? 0,
                  option: sa.system.option,
                  category: sa.system.category
                }
              });
            }
          } else {
            const secondaryId = !(
              ta.option !== "" && availableAbilities.find((e) => e.system.key === ta.system.key)
            );
            availableAbilities.push({
              _id: ta._id,
              secondaryId,
              name: ta.name,
              system: {
                key: ta.system.key,
                xp: 0,
                score: 0,
                bonus: 0,
                option: ta.system.option,
                category: ta.system.category
              }
            });
          }
        }
        context.teacherAbilities.push(...teacherVerbs);
        const teacherNouns = teacher.system.magicSystem.nouns.filter(
          (e) => e.system.derivedScore >= 2
        );
        for (const ta of teacherNouns) {
          const sa = this.actor.system.magicSystem.nouns.find(
            (e) => e.system.key === ta.system.key && e.system.option === ta.system.option
          );
          if (sa !== undefined) {
            if (sa.system.derivedScore < ta.system.derivedScore) {
              availableAbilities.push({
                _id: sa._id,
                secondaryId: false,
                name: sa.name,
                system: {
                  key: sa.system.key,
                  xp: sa.system.xp,
                  score: sa.system.derivedScore,
                  bonus: this.actor.system.bonuses.skills[sa.system.getComputedKey()]?.bonus ?? 0,
                  option: sa.system.option,
                  category: sa.system.category
                }
              });
            }
          } else {
            const secondaryId = !(
              ta.option !== "" && availableAbilities.find((e) => e.system.key === ta.system.key)
            );
            availableAbilities.push({
              _id: ta._id,
              secondaryId,
              name: ta.name,
              system: {
                key: ta.system.key,
                xp: 0,
                score: 0,
                bonus: 0,
                option: ta.system.option,
                category: ta.system.category
              }
            });
          }
        }
        context.teacherAbilities.push(...teacherNouns);
      }
    } else {
      availableAbilities = foundry.utils.duplicate(CONFIG.ARM5E.LOCALIZED_ABILITIES_ENRICHED);
      for (const a of this.actor.system.abilities) {
        const found = availableAbilities.findIndex(
          (e) => e.system.key === a.system.key && e.system.option === a.system.option
        );
        const bonus = this.actor.system.bonuses.skills[a.system.getComputedKey()]?.bonus ?? 0;
        if (found >= 0) {
          availableAbilities[found]._id = a._id;
          availableAbilities[found].system.xp = a.system.xp;
          availableAbilities[found].system.bonus = bonus;
          availableAbilities[found].system.score = a.system.derivedScore;
          availableAbilities[found].secondaryId = false;
        } else {
          const secondaryId = !(
            a.option !== "" && availableAbilities.find((e) => e.system.key === a.system.key)
          );
          availableAbilities.push({
            _id: a._id,
            secondaryId,
            name: a.name,
            system: {
              key: a.system.key,
              xp: a.system.xp,
              score: a.system.derivedScore,
              bonus,
              option: a.system.option,
              category: a.system.category
            }
          });
        }
      }
      if (this.actor.system.features?.magicSystem) {
        for (const a of [
          ...this.actor.system.magicSystem.verbs,
          ...this.actor.system.magicSystem.nouns
        ]) {
          const found = availableAbilities.findIndex(
            (e) => e.system.key === a.system.key && e.system.option === a.system.option
          );
          const bonus = this.actor.system.bonuses.skills[a.system.getComputedKey()]?.bonus ?? 0;
          if (found >= 0) {
            availableAbilities[found]._id = a._id;
            availableAbilities[found].system.xp = a.system.xp;
            availableAbilities[found].system.bonus = bonus;
            availableAbilities[found].system.score = a.system.derivedScore;
            availableAbilities[found].secondaryId = false;
          } else {
            const secondaryId = !(
              a.option !== "" && availableAbilities.find((e) => e.system.key === a.system.key)
            );
            availableAbilities.push({
              _id: a._id,
              secondaryId,
              name: a.name,
              system: {
                key: a.system.key,
                xp: a.system.xp,
                score: a.system.derivedScore,
                bonus,
                option: a.system.option,
                category: a.system.category
              }
            });
          }
        }
      }
      if (hasTeacher) {
        availableAbilities = availableAbilities.filter(
          (e) => e.system.score < context.system.teacher.score
        );
      }
    }

    let firstAb = true;
    context.selection.abilityCategories = {};
    for (const ability of availableAbilities) {
      let teacherScore = 0;
      if (hasTeacher) {
        if (context.system.teacher.id === null) {
          teacherScore = context.system.teacher.score ?? 0;
        } else {
          const teacherAbility = context.teacherAbilities.find(
            (e) => e.system.key === ability.system.key && e.system.option === ability.system.option
          );
          teacherScore = teacherAbility ? teacherAbility.system.derivedScore : 10;
        }
      }
      if (context.system.ownedAbilities[ability.system.category] === undefined) {
        context.system.ownedAbilities[ability.system.category] = [];
        context.selection.abilityCategories[ability.system.category] =
          CONFIG.ARM5E.LOCALIZED_ABILITIES[ability.system.category].label;
      }
      const abilityScoreLabel = ability.system.bonus
        ? `${ability.system.score} + ${ability.system.bonus}`
        : `${ability.system.score}`;
      const tmp = {
        id: ability._id,
        secondaryId: ability.secondaryId,
        category: ability.system.category,
        name: ability.name,
        key: ability.system.key,
        currentXp: ability.system.xp,
        score: ability.secondaryId ? 0 : ability.system.score,
        option: game.i18n.localize(ability.system.option),
        teacherScore,
        label: `${ability.name} (${ability.secondaryId ? 0 : abilityScoreLabel})`
      };
      if (firstAb) {
        const filteredList = Object.values(context.system.progress.abilities).filter(
          (e) => e.id === ability._id
        );
        if (filteredList.length === 0) {
          context.system.defaultAbility = ability._id;
          context.system.isDefaultSecondary = ability.secondaryId;
          context.system.defaultAbilityKey = ability.system.key;
          context.system.defaultAbilityOption = game.i18n.localize(ability.system.option);
          context.teacherScore = teacherScore;
          firstAb = false;
        }
      }
      context.system.ownedAbilities[ability.system.category].push(tmp);
    }

    for (const a of context.system.progress.abilities) {
      if (hasTeacher) {
        if (context.system.teacher.id === null) {
          a.teacherScore = context.system.teacher.score ?? 0;
        } else {
          const teacherAbility = context.teacherAbilities?.find(
            (e) => e.system.key === a.key && e.system.option === a.option
          );
          a.teacherScore = teacherAbility ? teacherAbility.system.derivedScore : 0;
        }
      }
      const computedKey = a.option !== "" ? `${a.key}_${a.option}` : a.key;
      const abilityBonus = this.actor.system.bonuses.skills[computedKey]?.bonus ?? 0;
      const abilityScoreLabel = abilityBonus ? `${a.score} + ${abilityBonus}` : `${a.score}`;
      if (context.system.ownedAbilities[a.category] === undefined) {
        context.system.ownedAbilities[a.category] = [];
        context.selection.abilityCategories[a.category] =
          CONFIG.ARM5E.LOCALIZED_ABILITIES[a.category]?.label ?? a.category;
        context.system.ownedAbilities[a.category].push({
          id: a.id,
          category: a.category,
          secondaryId: a.secondaryId,
          name: a.name,
          key: a.key,
          currentXp: a.xp,
          option: a.option,
          teacherScore: a.teacherScore ?? 0,
          label: `${a.name} (${abilityScoreLabel})`
        });
      } else {
        const idx = context.system.ownedAbilities[a.category].findIndex((e) => e.id === a.id);
        if (idx < 0) {
          context.system.ownedAbilities[a.category].push({
            id: a.id,
            category: a.category,
            secondaryId: a.secondaryId,
            name: a.name,
            key: a.key,
            currentXp: a.xp,
            option: a.option,
            teacherScore: a.teacherScore ?? 0,
            label: `${a.name} (${abilityScoreLabel})`
          });
        } else {
          context.system.ownedAbilities[a.category][idx].secondaryId = a.secondaryId;
          context.system.ownedAbilities[a.category][idx].name = a.name;
          context.system.ownedAbilities[a.category][idx].currentXp = a.xp;
          context.system.ownedAbilities[a.category][idx].option = a.option;
        }
      }
    }
  }

  _retrieveArts(context, teacher) {
    const hasTeacher = context.ui.showTeacher;
    let availableArts = [];

    if (hasTeacher) {
      if (context.system.teacherLinked) {
        const techEntries = Object.entries(teacher.system.arts.techniques).filter((e) =>
          context.system.done
            ? e[1].derivedScore >= 5
            : e[1].derivedScore >= 5 &&
              e[1].derivedScore > this.actor.system.arts.techniques[e[0]].derivedScore
        );
        const formEntries = Object.entries(teacher.system.arts.forms).filter((e) =>
          context.system.done
            ? e[1].derivedScore >= 5
            : e[1].derivedScore >= 5 &&
              e[1].derivedScore > this.actor.system.arts.forms[e[0]].derivedScore
        );
        availableArts = [
          ...techEntries.map((e) => ({
            key: e[0],
            label: CONFIG.ARM5E.magic.arts[e[0]].label,
            score: this.actor.system.arts.techniques[e[0]].derivedScore,
            teacherScore: e[1].derivedScore
          })),
          ...formEntries.map((e) => ({
            key: e[0],
            label: CONFIG.ARM5E.magic.arts[e[0]].label,
            score: this.actor.system.arts.forms[e[0]].derivedScore,
            teacherScore: e[1].derivedScore
          }))
        ];
      } else {
        const teacherScore = context.system.teacher.score ?? 0;
        if (teacherScore >= 5) {
          availableArts = [
            ...Object.entries(this.actor.system.arts.techniques).map((e) => ({
              key: e[0],
              label: CONFIG.ARM5E.magic.arts[e[0]].label,
              score: e[1].derivedScore,
              teacherScore
            })),
            ...Object.entries(this.actor.system.arts.forms).map((e) => ({
              key: e[0],
              label: CONFIG.ARM5E.magic.arts[e[0]].label,
              score: e[1].derivedScore,
              teacherScore
            }))
          ].filter((e) => e.score < teacherScore);
        }
      }
    } else {
      availableArts = [
        ...Object.entries(this.actor.system.arts.techniques).map((e) => ({
          key: e[0],
          score: e[1].derivedScore,
          label: CONFIG.ARM5E.magic.arts[e[0]].label,
          teacherScore: 0
        })),
        ...Object.entries(this.actor.system.arts.forms).map((e) => ({
          key: e[0],
          score: e[1].derivedScore,
          label: CONFIG.ARM5E.magic.arts[e[0]].label,
          teacherScore: 0
        }))
      ];
    }

    let firstArt = true;
    for (const art of availableArts) {
      if (firstArt) {
        const filteredList = Object.values(context.system.progress.arts).filter(
          (e) => e.key === art.key
        );
        if (filteredList.length === 0) {
          context.system.defaultArt = art.key;
          context.system.teacherScore = art.teacherScore;
          firstArt = false;
        }
      }
      art.label = `${art.label} (${art.score})`;
      context.system.ownedArts.push(art);
    }

    for (const a of context.system.progress.arts) {
      if (context.system.teacher.id === null) {
        a.teacherScore = context.system.teacher.score ?? 0;
      } else if (teacher) {
        const teacherArt = teacher.getArtStats(a.key);
        a.teacherScore = teacherArt?.derivedScore ?? 0;
      }
    }
  }

  _retrieveSpellMasteries(context, teacher) {
    const hasTeacher = context.ui.showTeacher;
    let availableSpells = this.actor.system.spells;

    if (hasTeacher) {
      if (context.system.teacherLinked) {
        context.teacherMasteries = teacher.system.spells.filter((e) => e.system.finalScore >= 2);
        availableSpells = this.actor.system.spells.filter((e) =>
          context.teacherMasteries.some((filter) =>
            context.system.done
              ? filter.name === e.name &&
                filter.system.technique.value === e.system.technique.value &&
                filter.system.form.value === e.system.form.value
              : filter.name === e.name &&
                filter.system.technique.value === e.system.technique.value &&
                filter.system.form.value === e.system.form.value &&
                filter.system.finalScore > e.system.finalScore
          )
        );
      } else {
        availableSpells = this.actor.system.spells.filter(
          (e) => e.system.finalScore < context.system.teacher.score
        );
      }
    }

    let firstSpell = true;
    context.system.ownedSpellForms = {};
    for (const spell of availableSpells) {
      let teacherScore = 0;
      if (hasTeacher) {
        if (context.system.teacher.id === null) {
          teacherScore = context.system.teacher.score ?? 0;
        } else {
          const teacherSpell = context.teacherMasteries?.find(
            (e) =>
              e.system.technique.value === spell.system.technique.value &&
              e.system.form.value === spell.system.form.value &&
              e.name === spell.name
          );
          teacherScore = teacherSpell?.system.finalScore ?? 0;
        }
      }
      if (context.system.ownedSpells[spell.system.form.value] === undefined) {
        context.system.ownedSpells[spell.system.form.value] = [];
        context.system.ownedSpellForms[spell.system.form.value] =
          CONFIG.ARM5E.magic.forms[spell.system.form.value].label;
      }
      const tmp = {
        id: spell._id,
        form: spell.system.form.value,
        name: spell.name,
        currentXp: spell.system.xp,
        score: spell.system.finalScore,
        teacherScore,
        label: `${spell.name} (${spell.system.finalScore})`
      };
      if (firstSpell) {
        const filteredList = Object.values(context.system.progress.spells).filter(
          (e) => e.id === spell._id
        );
        if (filteredList.length === 0) {
          context.system.defaultSpellMastery = spell._id;
          context.system.teacherScore = teacherScore;
          firstSpell = false;
        }
      }
      context.system.ownedSpells[spell.system.form.value].push(tmp);
    }

    for (const s of context.system.progress.spells) {
      if (s.form && context.system.ownedSpellForms[s.form] === undefined) {
        context.system.ownedSpellForms[s.form] = CONFIG.ARM5E.magic.forms[s.form]?.label ?? s.form;
      }
      if (s.form && context.system.ownedSpells[s.form] === undefined) {
        context.system.ownedSpells[s.form] = [];
      }

      if (context.system.teacher.id === null) {
        s.teacherScore = context.system.teacher.score ?? 0;
      } else if (teacher) {
        const spell = this.actor.items.get(s.id);
        const teacherSpell = context.teacherMasteries?.find(
          (e) =>
            e.system.technique.value === spell?.system.technique.value &&
            e.system.form.value === spell?.system.form.value &&
            e.name === spell?.name
        );
        s.teacherScore = teacherSpell?.system.finalScore ?? 0;
      }
    }
  }

  // ─── _onRender: change event listeners ────────────────────────────────────

  /** @override */
  async _onRender(context, options) {
    await super._onRender(context, options);
    if (!this.isEditable) return;

    this.element
      .querySelectorAll(".progress-category")
      .forEach((el) => el.addEventListener("change", this._setCategory.bind(this)));
    this.element
      .querySelectorAll(".progress-ability")
      .forEach((el) => el.addEventListener("change", this._setAbility.bind(this)));
    this.element
      .querySelectorAll(".progress-art")
      .forEach((el) => el.addEventListener("change", this._setArt.bind(this)));
    this.element
      .querySelectorAll(".score-teacher")
      .forEach((el) => el.addEventListener("change", this._changeTeacherScore.bind(this)));
    this.element
      .querySelectorAll(".change-year")
      .forEach((el) => el.addEventListener("change", this._setStartYear.bind(this)));
    this.element
      .querySelectorAll(".change-season")
      .forEach((el) => el.addEventListener("change", this._setStartSeason.bind(this)));
    this.element
      .querySelectorAll(".duration")
      .forEach((el) => el.addEventListener("change", this._setDuration.bind(this)));
    this.element
      .querySelectorAll(".progress-activity")
      .forEach((el) => el.addEventListener("change", this._setActivity.bind(this)));
  }

  // ─── _onDrop ──────────────────────────────────────────────────────────────

  /** @override */
  async _onDrop(event) {
    event.preventDefault();
    const data = foundry.applications.ux.TextEditor.getDragEventData(event);
    const dropTarget = event.currentTarget;

    if (data.type === "Actor" && dropTarget.classList.contains("progress-teacher")) {
      if (this.item.system.activity === "teaching" || this.item.system.activity === "training") {
        if (data.id === this.actor?.id) {
          ui.notifications.info(game.i18n.localize("arm5e.activity.msg.selfTeaching"));
          return;
        }
        const actor = await Actor.implementation.fromDropData(data);
        if (actor.isCharacter()) {
          await this._setTeacher(actor);
          event.stopPropagation();
        }
      }
    } else if (data.type === "Item") {
      if (dropTarget.classList.contains("progress-abilities")) {
        const item = await Item.implementation.fromDropData(data);
        if (
          item.type === "ability" &&
          this.item.system.activity !== "teaching" &&
          this.item.system.activity !== "training"
        ) {
          await this.item.update(this._addAbility(item), {});
          event.stopPropagation();
        }
      } else if (
        dropTarget.classList.contains("drop-newspell") ||
        dropTarget.dataset.drop === "newspell"
      ) {
        const item = await Item.implementation.fromDropData(data);
        if (item.type === "laboratoryText" && item.system.type !== "spell") return;
        if (item.type !== "spell" && item.type !== "laboratoryText") return;
        const newSpells = this.item.system.progress.newSpells;
        newSpells.push(ArM5eDiaryEntryItemSheetV2._buildNewSpellEntry(item));
        await this.item.update({ "system.progress.newSpells": newSpells });
        event.stopPropagation();
      }
    }

    await super._onDrop(event);
  }

  // ─── Change event instance methods ────────────────────────────────────────

  /**
   * Preserve non-input progress fields when AppV2 submits the form.
   * @override
   */
  _processFormData(event, form, formData) {
    const data = super._processFormData(event, form, formData);
    const source = this.item.toObject();

    if (data.system?.progress?.abilities) {
      // Category and ability selects call stopPropagation so they never reach here.
      // This path only fires for XP / teacherScore edits — simple row-by-row merge.
      const existing = foundry.utils.deepClone(this.item.system.progress.abilities ?? []);
      const abilityEntries = Object.entries(data.system.progress.abilities)
        .filter(([key]) => Number.isInteger(Number(key)))
        .sort(([a], [b]) => Number(a) - Number(b));

      for (const [key, value] of abilityEntries) {
        const index = Number(key);
        const sourceRow = foundry.utils.deepClone(existing[index]);
        if (!sourceRow) continue;
        existing[index] = foundry.utils.mergeObject(sourceRow, value, {
          inplace: false,
          insertKeys: true,
          insertValues: true,
          overwrite: true
        });
      }

      data.system.progress.abilities = existing;
    }
    if (data.system?.progress?.spells) {
      foundry.utils.mergeObject(source.system.progress.spells, data.system.progress.spells);
      data.system.progress.spells = source.system.progress.spells;
    }
    if (data.system?.progress?.arts) {
      foundry.utils.mergeObject(source.system.progress.arts, data.system.progress.arts);
      data.system.progress.arts = source.system.progress.arts;
    }
    if (data.system?.progress?.newSpells) {
      foundry.utils.mergeObject(source.system.progress.newSpells, data.system.progress.newSpells);
      data.system.progress.newSpells = source.system.progress.newSpells;
    }
    if (data.system?.dates) {
      foundry.utils.mergeObject(source.system.dates, data.system.dates);

      const startYear = Number(source.system.dates?.[0]?.year);
      const startSeason = source.system.dates?.[0]?.season;
      const duration = Number(data.system?.duration ?? source.system.duration ?? 1);

      // Keep AppV1 behavior: any start date or duration edit regenerates the whole schedule.
      if (Number.isFinite(startYear) && startSeason) {
        data.system.dates = DiaryEntrySchema.buildSchedule(duration, startYear, startSeason);
      } else {
        data.system.dates = source.system.dates;
        data.system.dates.splice(duration);
      }
    }

    return data;
  }

  async _setStartYear(event) {
    event.preventDefault();
    event.stopPropagation();
    const newYear = Number(event.currentTarget.value);
    await this.item.update({
      "system.dates": DiaryEntrySchema.buildSchedule(
        this.item.system.duration,
        newYear,
        this.item.system.dates[0].season
      )
    });
    this.render();
  }

  async _setStartSeason(event) {
    event.preventDefault();
    event.stopPropagation();
    const newSeason = event.currentTarget.value;
    await this.item.update({
      "system.dates": DiaryEntrySchema.buildSchedule(
        this.item.system.duration,
        this.item.system.dates[0].year,
        newSeason
      )
    });
    this.render();
  }

  async _setDuration(event) {
    event.preventDefault();
    event.stopPropagation();
    let newDuration = Number(event.currentTarget.value);
    if (!Number.isNumeric(newDuration) || newDuration < 1) newDuration = 1;
    await this.item.update({
      "system.duration": newDuration,
      "system.dates": DiaryEntrySchema.buildSchedule(
        newDuration,
        this.item.system.dates[0].year,
        this.item.system.dates[0].season
      )
    });
    this.render();
  }

  async _setActivity(event) {
    event.preventDefault();
    event.stopPropagation();
    const actType = event.currentTarget.value;
    const updateData = { "system.sourceQuality": 0 };

    const config = getActivityDefinition(actType);
    updateData["system.activity"] = actType;
    updateData["system.progress.abilities"] = [];
    updateData["system.progress.arts"] = [];
    updateData["system.progress.spells"] = [];
    updateData["system.progress.newSpells"] = [];

    updateData["system.sourceQuality"] = config.source.default;
    const duration = config.duration ?? 1;
    updateData["system.duration"] = duration;
    updateData["system.dates"] = DiaryEntrySchema.buildSchedule(
      duration,
      this.item.system.dates[0].year,
      this.item.system.dates[0].season
    );
    updateData.img =
      CONFIG.ACTIVITIES_DEFAULT_ICONS[actType] ?? CONFIG.ARM5E_DEFAULT_ICONS.diaryEntry;

    await this.item.update(updateData);
    this.tabGroups.primary = actType === "none" ? "description" : "advanced";
    this.render();
  }

  async _setCategory(event) {
    event.preventDefault();
    // Stop bubbling so submitOnChange does not race against this direct update.
    event.stopPropagation();
    const target = event.currentTarget;
    const idx = Number(target.dataset.index);
    const value = target.value;
    const progressType = target.dataset.type;
    const currentData = this.item.system.progress[progressType];
    const updateData = {};

    if (progressType === "abilities") {
      // ownedAbilities is populated during _prepareContext (via _retrieveAbilities) and
      // already contains fully-hydrated entries with id, key, option, name, teacherScore,
      // secondaryId, etc. Use the first ability in the chosen category directly — same
      // approach as the V1 sheet.
      const first = this.item.system.ownedAbilities?.[value]?.[0];
      if (!first) return;
      currentData[idx] = { ...first, xp: 0, xpNextLevel: 0, maxLevel: 0 };
      updateData["system.progress.abilities"] = currentData;
    } else if (progressType === "spells") {
      currentData[idx] = { ...this.item.system.ownedSpells[value][0], xp: 0 };
      updateData["system.progress.spells"] = currentData;
    }
    await this.item.update(updateData);
  }

  async _setAbility(event) {
    // Stop bubbling so submitOnChange does not race against this direct update.
    event.stopPropagation();
    const target = event.currentTarget;
    const idx = Number(target.dataset.index);
    const abilityId = target.value;
    const currentData = this.item.system.progress[target.dataset.type];

    // ownedAbilities is already populated by _retrieveAbilities during the last render.
    // Search across all categories for the entry matching this id.
    let selected;
    for (const abilities of Object.values(this.item.system.ownedAbilities ?? {})) {
      selected = abilities.find((e) => e.id === abilityId);
      if (selected) break;
    }
    if (!selected) return;

    currentData[idx] = { ...selected, xp: 0, xpNextLevel: 0, maxLevel: 0 };
    await this.item.update({ "system.progress.abilities": currentData });
  }

  async _setArt(event) {
    const target = event.currentTarget;
    const idx = Number(target.dataset.index);
    const value = target.value;
    const currentData = this.item.system.progress[target.dataset.type];
    currentData[idx] = {
      key: value,
      xp: 0,
      teacherScore: this.item.system.ownedArts.find((e) => e.key === value)?.teacherScore ?? 0
    };
    await this.item.update({ "system.progress.arts": currentData });
    this.render();
  }

  async _changeTeacherScore(event) {
    if (this.item.system.done) return;
    const newScore = Number(event.currentTarget.value);
    const updateData = { "system.teacher.score": newScore };
    for (const a of this.item.system.progress.abilities) a.teacherScore = newScore;
    for (const a of this.item.system.progress.arts) a.teacherScore = newScore;
    for (const a of this.item.system.progress.spells) a.teacherScore = newScore;
    updateData["system.progress.abilities"] = this.item.system.progress.abilities;
    updateData["system.progress.arts"] = this.item.system.progress.arts;
    updateData["system.progress.spells"] = this.item.system.progress.spells;
    await this.item.update(updateData);
  }

  static async progressApply(event, target) {
    const sourceModifier = Number(target.dataset.sourcemodifier ?? 0);
    return await this._progressApply({ sourceModifier, notif: true });
  }

  // ─── Static action methods ─────────────────────────────────────────────────

  async _progressApply(data) {
    if (this.item.system.done) {
      // no idea how it got there:
      log(false, "WARNING: something weird is happening");
      return false;
    }
    const context = await this._prepareContext({});

    // Tests and some callers pass an explicit sourceModifier; re-validate with that
    // override so per-activity XP (set during validation) matches the supplied value.
    if (data?.sourceModifier !== undefined && data?.sourceModifier !== null) {
      context.system.sourceModifier = Number(data.sourceModifier);
      context.system.cappedGain = false;
      this.item.system.activityHandler?.validateDiary(context, this.actor, this.item);
      context.totalQuality =
        context.system.sourceQuality +
        context.system.sourceModifier +
        (context.system.sourceBonus ?? 0);
    }

    if (!context.system.applyPossible) {
      const notify = data?.notif ?? data?.notify ?? true;
      if (notify) {
        ui.notifications.warn(game.i18n.localize("arm5e.notification.situationHasChanged"));
        this.render(true);
      }
      return context;
    }

    const progress = foundry.utils.deepClone(context.system.progress ?? this.item.system.progress);
    const sourceModifier = Number(context.system.sourceModifier ?? 0);

    context.description = `${this.item.system.description}<h4>Technical part:</h4><ol>`;
    context.sourceQuality = 0;
    context.sourceModifier = sourceModifier;
    context.actorUpdate = { system: { arts: { forms: {}, techniques: {} } } };
    context.promises = {
      abilities: [],
      spells: [],
      masteries: [],
      achievements: [],
      dependencies: [],
      resources: []
    };
    // ─── Form data processing ──────────────────────────────────────────────────

    if (this.item.system.dates[0].applied === false) {
      await this.item.system.activityHandler?.activityCosts(context);
      for (const dependency of this.item.system.externalIds ?? []) {
        if (!game.actors.has(dependency.actorId)) continue;
        const actor = game.actors.get(dependency.actorId);
        if (!actor.items.has(dependency.itemId)) continue;
        if (dependency.flags === 1) {
          const depItem = actor.items.get(dependency.itemId);
          context.promises.dependencies.push(
            depItem.update(
              { "system.quantity": depItem.system.quantity - dependency.data.amount },
              { parent: actor }
            )
          );
          if (depItem.isAResource?.()) {
            context.promises.resources.push(
              depItem._createResourceTrackingDiaryEntry?.(
                actor,
                this.item.name,
                dependency.data.amount,
                this.item.system.dates[0]
              )
            );
          }
        } else if (dependency.flags === 2) {
          const depItem = actor.items.get(dependency.itemId);
          if (depItem.type === "diaryEntry" && depItem.system.activity === "lab") {
            context.promises.dependencies.push(depItem.update(depItem.system._applySchedule(), {}));
          }
        }
      }
    }

    const success = this.item.system.activityHandler
      ? await this.item.system.activityHandler.apply(this, context, progress, {
          includeAchievements: true,
          includeNewSpells: true
        })
      : await this._applyProgress(context, progress, {
          includeAchievements: true,
          includeNewSpells: true
        });
    if (!success) return context;

    context.description += "</ol>";
    const newTitle = await getNewTitleForActivity(this.actor, this.item);
    await this.actor.update(context.actorUpdate, { render: true });

    // ID reconciliation
    let abIdx = 0;
    for (const ab of progress.abilities) {
      if (
        ab.id.length < 8 ||
        (["training", "teaching"].includes(this.item.system.activity) && ab.secondaryId)
      ) {
        ab.id = context.indexes.abilities[abIdx];
        ab.secondaryId = false;
        abIdx++;
      }
    }
    let idx = 0;
    for (const ach of this.item.system.achievements ?? []) {
      ach._id = context.indexes.achievements[idx++];
    }
    idx = 0;
    for (const spell of progress.newSpells) {
      spell.id = context.indexes.spells[idx++];
    }

    const dates = this.item.system.dates;
    for (const d of dates) d.applied = true;

    await this.item.update(
      {
        name: newTitle,
        system: {
          done: true,
          dates,
          description: context.description,
          progress,
          sourceQuality: this.item.system.cappedGain
            ? context.sourceQuality
            : context.sourceQuality - sourceModifier - (context.system.sourceBonus ?? 0),
          achievements: this.item.system.achievements
        }
      },
      { render: true, recursive: true }
    );
    return context;
  }

  /** Called by progressApply; updates items/arts and returns success boolean. */
  async _applyProgress(
    context,
    progressData = this.item.system.progress,
    { includeAchievements = true, includeNewSpells = true } = {}
  ) {
    progressData = foundry.utils.deepClone(progressData);

    // ABILITIES
    const updateItems = [];
    const newItems = [];
    for (const ab of Object.values(progressData.abilities ?? [])) {
      if (ab.xp === 0) continue;
      let ability;
      if (
        ab.id.length < 16 ||
        (["training", "teaching"].includes(this.item.system.activity) && ab.secondaryId)
      ) {
        ability = await getAbilityFromCompendium(ab.key, ab.option);
        ability.name = ab.name;
        ability.system.xp = ab.xp;
        newItems.push(ability);
      } else {
        ability = this.actor.items.get(ab.id);
        if (!ability) {
          ui.notifications.warn(game.i18n.localize("arm5e.activity.msg.abilityMissing"));
          context.system.applyError = "arm5e.activity.msg.abilityMissing";
          return false;
        }
        updateItems.push({ _id: ab.id, system: { xp: ability.system.xp + Math.round(ab.xp) } });
      }
      context.description += `<li>${game.i18n.format("arm5e.activity.descItem", {
        item: ability.name,
        xp: ab.xp
      })}</li>`;
      context.sourceQuality += ab.xp;
    }
    if (newItems.length > 0)
      context.promises.abilities.push(
        this.actor.createEmbeddedDocuments("Item", newItems, { render: false })
      );
    if (updateItems.length > 0)
      context.promises.abilities.push(
        this.actor.updateEmbeddedDocuments("Item", updateItems, { render: false })
      );

    // SPELL MASTERIES
    const updateSpells = [];
    for (const s of Object.values(progressData.spells ?? [])) {
      if (s.xp === 0) continue;
      const spell = this.actor.items.get(s.id);
      if (!spell) {
        ui.notifications.warn(game.i18n.localize("arm5e.activity.msg.spellMissing"));
        context.system.applyError = "arm5e.activity.msg.spellMissing";
        return false;
      }
      updateSpells.push({ _id: s.id, system: { xp: spell.system.xp + s.xp } });
      context.description += `<li>${game.i18n.format("arm5e.activity.descItem", {
        item: spell.name,
        xp: s.xp
      })}</li>`;
      context.sourceQuality += s.xp;
    }
    if (updateSpells.length > 0)
      context.promises.masteries.push(
        this.actor.updateEmbeddedDocuments("Item", updateSpells, { render: false })
      );

    // ARTS
    for (const a of Object.values(progressData.arts ?? [])) {
      if (a.xp === 0) continue;
      const artType = Object.keys(CONFIG.ARM5E.magic.techniques).includes(a.key)
        ? "techniques"
        : "forms";
      context.actorUpdate.system.arts[artType][a.key] = {
        xp: this.actor.system.arts[artType][a.key].xp + a.xp
      };
      context.description += `<li>${game.i18n.format("arm5e.activity.descItem", {
        item: game.i18n.localize(CONFIG.ARM5E.magic.arts[a.key].label),
        xp: a.xp
      })}</li>`;
      context.sourceQuality += a.xp;
    }

    // NEW SPELLS
    if (includeNewSpells) {
      const newSpells = (progressData.newSpells ?? []).map((a) => ({
        name: a.name,
        type: "spell",
        img: a.img,
        system: a.spellData
      }));
      if (newSpells.length > 0)
        context.promises.spells.push(
          this.actor.createEmbeddedDocuments("Item", newSpells, { render: false })
        );
    }

    // ACHIEVEMENTS
    if (includeAchievements) {
      for (const achievement of this.item.system.achievements ?? []) {
        if (achievement._id)
          context.promises.achievements.push(
            this.actor.updateEmbeddedDocuments("Item", [achievement], {})
          );
        else
          context.promises.achievements.push(
            this.actor.createEmbeddedDocuments("Item", [achievement], {})
          );
      }
    }

    let results = await Promise.all(Object.values(context.promises).map((arr) => Promise.all(arr)));
    results = results.map((e) => e.flat());

    context.indexes = { abilities: [], spells: [], achievements: [] };
    for (const a of results[0]) context.indexes.abilities.push(a._id);
    for (const a of results[1]) {
      context.indexes.spells.push(a._id);
      context.sourceQuality += a.system.level;
    }
    for (const a of results[3]) context.indexes.achievements.push(a._id);

    return true;
  }

  static _buildPartialDeltaProgress(
    progress,
    totalDuration,
    alreadyAppliedCount,
    targetAppliedCount
  ) {
    const source = foundry.utils.deepClone(progress ?? {});
    const safeDuration = Math.max(1, Number(totalDuration) || 1);

    const computeDelta = (totalXp) => {
      const xp = Number(totalXp) || 0;
      const xpAtAlreadyApplied = Math.round((xp * alreadyAppliedCount) / safeDuration);
      const xpAtTargetApplied = Math.round((xp * targetAppliedCount) / safeDuration);
      return Math.max(0, xpAtTargetApplied - xpAtAlreadyApplied);
    };

    for (const ab of source.abilities ?? []) {
      ab.xp = computeDelta(ab.xp);
    }
    for (const art of source.arts ?? []) {
      art.xp = computeDelta(art.xp);
    }
    for (const spell of source.spells ?? []) {
      spell.xp = computeDelta(spell.xp);
    }

    return source;
  }

  static _applyPartialReconciliations(progress, scaledProgress, indexes, activity) {
    let abIdx = 0;
    for (let i = 0; i < (progress.abilities ?? []).length; i++) {
      const original = progress.abilities[i];
      const scaled = scaledProgress.abilities?.[i];
      if (!scaled || !scaled.xp) continue;
      if (
        original.id.length < 8 ||
        (["training", "teaching"].includes(activity) && original.secondaryId)
      ) {
        original.id = indexes.abilities[abIdx];
        original.secondaryId = false;
      }
      abIdx++;
    }
  }

  static async progressPartial(event, target) {
    const context = await this._prepareContext({});
    if (
      !context.partialApply ||
      !Array.isArray(context.partialDates) ||
      context.partialDates.length === 0
    ) {
      ui.notifications.warn(game.i18n.localize("arm5e.notification.situationHasChanged"));
      this.render(true);
      return;
    }

    const totalDuration = Math.max(1, Number(this.item.system.duration) || 1);
    const alreadyAppliedCount = (this.item.system.dates ?? []).filter((d) => d.applied).length;
    const targetAppliedCount = Math.min(
      totalDuration,
      alreadyAppliedCount + context.partialDates.length
    );
    const scaledProgress = ArM5eDiaryEntryItemSheetV2._buildPartialDeltaProgress(
      this.item.system.progress,
      totalDuration,
      alreadyAppliedCount,
      targetAppliedCount
    );

    context.description = `${this.item.system.description}<h4>Partial technical part:</h4><ol>`;
    context.sourceQuality = 0;
    context.sourceModifier = Number(target.dataset.sourceModifier ?? 0);
    context.promises = {
      abilities: [],
      spells: [],
      masteries: [],
      achievements: [],
      dependencies: [],
      resources: []
    };
    context.actorUpdate = { system: { arts: { forms: {}, techniques: {} } } };

    if (this.item.system.dates[0].applied === false) {
      await this.item.system.activityHandler?.activityCosts(context);
      for (const dependency of this.item.system.externalIds ?? []) {
        if (!game.actors.has(dependency.actorId)) continue;
        const actor = game.actors.get(dependency.actorId);
        if (!actor.items.has(dependency.itemId)) continue;
        if (dependency.flags === 1) {
          const depItem = actor.items.get(dependency.itemId);
          context.promises.dependencies.push(
            depItem.update(
              { "system.quantity": depItem.system.quantity - dependency.data.amount },
              { parent: actor }
            )
          );
          if (depItem.isAResource?.()) {
            context.promises.resources.push(
              depItem._createResourceTrackingDiaryEntry?.(
                actor,
                this.item.name,
                dependency.data.amount,
                this.item.system.dates[0]
              )
            );
          }
        } else if (dependency.flags === 2) {
          const depItem = actor.items.get(dependency.itemId);
          if (depItem.type === "diaryEntry" && depItem.system.activity === "lab") {
            context.promises.dependencies.push(depItem.update(depItem.system._applySchedule(), {}));
          }
        }
      }
    }

    const success = this.item.system.activityHandler
      ? await this.item.system.activityHandler.apply(this, context, scaledProgress, {
          includeAchievements: false,
          includeNewSpells: false
        })
      : await this._applyProgress(context, scaledProgress, {
          includeAchievements: false,
          includeNewSpells: false
        });
    if (!success) return;

    context.description += "</ol>";
    await this.actor.update(context.actorUpdate, { render: true });

    ArM5eDiaryEntryItemSheetV2._applyPartialReconciliations(
      this.item.system.progress,
      scaledProgress,
      context.indexes,
      this.item.system.activity
    );

    const dates = foundry.utils.deepClone(this.item.system.dates);
    for (const date of dates) {
      if (date.applied) continue;
      if (context.partialDates.some((d) => d.year === date.year && d.season === date.season)) {
        date.applied = true;
      }
    }

    await this.item.update(
      {
        system: {
          dates,
          description: context.description,
          progress: this.item.system.progress,
          sourceQuality: (this.item.system.sourceQuality ?? 0) + context.sourceQuality
        }
      },
      { render: true, recursive: true }
    );
  }

  static async progressRollback(event, target) {
    event?.preventDefault();
    return await this._progressRollback(!event.shiftKey);
  }

  async _progressRollback(toConfirm) {
    if (!this.item.system.done) return;

    if (toConfirm) {
      const confirm = await getConfirmation(
        this.item.name,
        game.i18n.localize("arm5e.dialog.rollback-question"),
        ArM5eActorSheetV2.getFlavor(this.item.actor?.type)
      );
      if (!confirm) return;
    }

    const actor = this.actor;
    const updateData = [];
    const promises = [];

    if (this.item.system.achievements?.length) {
      const items = this.item.system.achievements
        .filter((e) => !e.updateExisting)
        .map((e) => e._id);
      if (items.length > 0) promises.push(actor.deleteEmbeddedDocuments("Item", items, {}));
    }

    const rollbackState = { actor, promises, updateData, toConfirm };
    if (await this.item.system.activityHandler?.rollback(this, rollbackState)) {
      return;
    }

    // Undo XP gains
    for (const ab of Object.values(this.item.system.progress.abilities)) {
      const ability = actor.items.get(ab.id);
      if (!ability) continue;
      const xps = Math.max(0, ability.system.xp - ab.xp);
      updateData.push({ _id: ab.id, system: { xp: xps } });
    }
    for (const s of Object.values(this.item.system.progress.spells)) {
      const spell = actor.items.get(s.id);
      if (!spell) continue;
      const xps = Math.max(0, spell.system.xp - s.xp);
      updateData.push({ _id: s.id, system: { xp: xps } });
    }
    const actorUpdate = { system: { arts: { forms: {}, techniques: {} } } };
    for (const a of Object.values(this.item.system.progress.arts)) {
      const artType = Object.keys(CONFIG.ARM5E.magic.techniques).includes(a.key)
        ? "techniques"
        : "forms";
      const xps = Math.max(0, actor.system.arts[artType][a.key].xp - a.xp);
      actorUpdate.system.arts[artType][a.key] = { xp: xps };
    }
    promises.push(
      actor.deleteEmbeddedDocuments(
        "Item",
        this.item.system.progress.newSpells.map((e) => e.id)
      )
    );
    promises.push(actor.update(actorUpdate, { render: true }));
    if (updateData.length > 0)
      promises.push(actor.updateEmbeddedDocuments("Item", updateData, { render: true }));

    promises.push(
      this.item.update({
        system: { done: false, description: `${this.item.system.description}<h4>Rollbacked</h4>` }
      })
    );
    await Promise.all(promises);
  }

  static async progressRefresh(event, target) {
    this.render(true);
  }

  static async progressControl(event, target) {
    if (this.item.system.done || this.item.system.activity === "reading") return;

    const subaction = target.dataset.subaction;
    const type = target.dataset.type;
    let currentData = this.item.system.progress[type];
    const updateData = {};

    if (type === "abilities") {
      if (subaction === "add") {
        const hasTeacher = ["training", "teaching"].includes(this.item.system.activity);
        let newAb;
        const defaultId = target.dataset.default;
        const isSecondary = target.dataset.secondary === "true";

        if (defaultId.length === 16 && !isSecondary) {
          newAb = this.actor.items.get(defaultId);
          newAb.secondaryId = false;
        } else if (this.item.system.teacher.id !== null) {
          const teacher = game.actors.get(this.item.system.teacher.id);
          newAb = teacher.system.abilities.find(
            (e) =>
              e.system.key === target.dataset.defaultkey &&
              e.system.option === target.dataset.defaultoption
          );
          newAb.secondaryId = true;
        } else {
          newAb = CONFIG.ARM5E.LOCALIZED_ABILITIES_ENRICHED.find((e) => e._id === defaultId);
        }

        let tScore = 0;
        if (hasTeacher) {
          if (this.item.system.teacher.id === null) {
            tScore = Number(target.dataset.teacherscore);
          } else {
            const teacher = game.actors.get(this.item.system.teacher.id);
            tScore =
              teacher.getAbilityStatsForActivity(newAb.system.key, newAb.system.option)?.score ?? 0;
          }
        }
        currentData.push(
          this._buildAbilityProgressEntry(newAb, {
            id: newAb._id,
            secondaryId: newAb.secondaryId,
            teacherScore: tScore,
            xp: 0
          })
        );
        updateData["system.progress.abilities"] = currentData;
        await this.item.update(updateData, {});
      } else if (subaction === "delete") {
        const idx = Number(target.dataset.idx);
        currentData.splice(idx, 1);
        target.closest(".diary-progress")?.remove();
        updateData["system.progress.abilities"] = currentData;
        await this.item.update(updateData, {});
      }
    } else if (type === "arts") {
      if (subaction === "add") {
        currentData.push({
          key: target.dataset.default,
          teacherScore: Number(target.dataset.teacherscore),
          xp: 0
        });
        updateData["system.progress.arts"] = currentData;
        await this.item.update(updateData, {});
      } else if (subaction === "delete") {
        const idx = Number(target.dataset.idx);
        currentData.splice(idx, 1);
        target.closest(".diary-progress")?.remove();
        updateData["system.progress.arts"] = currentData;
        await this.item.update(updateData, {});
      }
    } else if (type === "spells") {
      if (subaction === "add") {
        const newSpell = this.actor.items.get(target.dataset.default);
        let tScore = 0;
        if (["training", "teaching"].includes(this.item.system.activity)) {
          if (this.item.system.teacher.id === null) {
            tScore = Number(target.dataset.teacherscore);
          } else {
            const teacher = game.actors.get(this.item.system.teacher.id);
            const similarSpells = teacher.getSimilarSpell?.(
              newSpell.system.level,
              newSpell.system.technique.value,
              newSpell.system.form.value
            );
            tScore = Array.isArray(similarSpells)
              ? similarSpells[0]?.system.finalScore ?? 0
              : similarSpells?.system.finalScore ?? 0;
          }
        }
        currentData.push({
          id: newSpell.id,
          form: newSpell.system.form.value,
          name: newSpell.name,
          currentXp: newSpell.system.xp,
          teacherScore: tScore,
          xp: 0
        });
        updateData["system.progress.spells"] = currentData;
        await this.item.update(updateData, {});
      } else if (subaction === "delete") {
        const idx = Number(target.dataset.idx);
        currentData.splice(idx, 1);
        target.closest(".diary-progress")?.remove();
        updateData["system.progress.spells"] = currentData;
        await this.item.update(updateData, {});
      }
    } else if (type === "newSpells" && subaction === "delete") {
      const idx = Number(target.dataset.idx);
      currentData.splice(idx, 1);
      target.closest(".diary-progress")?.remove();
      updateData["system.progress.newSpells"] = currentData;
      await this.item.update(updateData, {});
    }
  }

  static async resetTeacher(event, target) {
    if (this.item.system.done) return;
    await this._resetTeacher();
  }

  async _resetTeacher() {
    await this.item.update({
      "system.teacher.id": null,
      "system.progress.abilities": [],
      "system.progress.arts": [],
      "system.progress.spells": [],
      "system.progress.newSpells": []
    });
  }

  static async showSpell(event, target) {
    const index = Number(target.dataset.index);
    const spell = this.item.system.progress.newSpells[index];
    const tmp = new ArM5eItem(
      {
        name: spell.name,
        type: "spell",
        ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER },
        system: spell.spellData,
        [`flags.${CONFIG.ARM5E.SYSTEM_ID}.readonly`]: "true"
      },
      { temporary: true, editable: false }
    );
    tmp.sheet.render(true);
  }

  static async selectDates(event, target) {
    if (!this.item.isOwned) return;
    const calendar = new ActivitySchedule({
      document: {
        actor: this.item.actor,
        activity: {
          id: this.item.id,
          name: this.item.name,
          img: this.item.img,
          system: foundry.utils.deepClone(this.item.system)
        }
      }
    });
    await calendar.render(true);
  }

  static async rollActivity(event, target) {
    const activityHandler = this.item.system.activityHandler;
    if (activityHandler?.roll) {
      await activityHandler.roll.action(this.item);
    }
  }

  // ─── Internal helpers ──────────────────────────────────────────────────────

  async _setTeacher(actor) {
    const teaching = actor.getAbilityStats("teaching");
    await this.item.update({
      "system.teacher": {
        id: actor.id,
        name: actor.name,
        com: actor.system.characteristics.com.value,
        teaching: teaching.score,
        speciality: teaching.speciality,
        score: 0
      },
      "system.progress.abilities": [],
      "system.progress.arts": [],
      "system.progress.spells": [],
      "system.progress.newSpells": []
    });
  }

  _buildAbilityProgressEntry(
    ability,
    { id = ability?._id ?? "DROPPED", secondaryId = false, teacherScore = 0, xp = 0 } = {}
  ) {
    // Primary/root fix: all current add/edit paths should construct the same
    // complete ability-progress payload from this helper.
    const abilitySystem = ability?.system ?? {};
    const key = abilitySystem.key ?? "";
    return {
      id,
      secondaryId: Boolean(secondaryId),
      category:
        abilitySystem.category ?? CONFIG.ARM5E.LOCALIZED_ABILITIES[key]?.category ?? "general",
      name: ability?.name ?? "",
      currentXp: Number(abilitySystem.xp) || 0,
      key,
      option: abilitySystem.option ?? "",
      xpNextLevel: Number(abilitySystem.xpNextLevel) || 0,
      teacherScore: Number(teacherScore) || 0,
      maxLevel: 0,
      xp: Number(xp) || 0
    };
  }

  _normalizeProgressAbilities(abilities = []) {
    // Minimal sanitizer for AppV2 sparse form rows.
    // Keep this intentionally simple: preserve posted/merged values and only
    // fill missing primitives with safe defaults.
    const normalized = [];

    for (const original of abilities ?? []) {
      const entry = foundry.utils.deepClone(original ?? {});
      const key = entry.key ?? "";
      const option = entry.option ?? "";
      const currentXp = Number(entry.currentXp ?? 0);
      const xpNextLevel = Number(entry.xpNextLevel ?? 0);
      const teacherScore = Number(entry.teacherScore ?? this.item.system.teacher.score ?? 0);
      const xp = Number(entry.xp ?? 0);
      const maxLevel = Number(entry.maxLevel ?? 0);

      normalized.push({
        id: typeof entry.id === "string" ? entry.id : "DROPPED",
        secondaryId: Boolean(entry.secondaryId),
        category: entry.category ?? CONFIG.ARM5E.LOCALIZED_ABILITIES[key]?.category ?? "general",
        name: entry.name ?? "",
        currentXp: Number.isFinite(currentXp) ? currentXp : 0,
        key,
        option,
        xpNextLevel: Number.isFinite(xpNextLevel) ? xpNextLevel : 0,
        teacherScore: Number.isFinite(teacherScore) ? teacherScore : 0,
        maxLevel: Number.isFinite(maxLevel) ? maxLevel : 0,
        xp: Number.isFinite(xp) ? xp : 0
      });
    }

    return normalized;
  }

  _addAbility(ability) {
    const currentData = this.item.system.progress.abilities;
    let ID = "DROPPED";
    let secondaryId = false;

    if (ability.isOwned && ability.actor._id === this.item.actor._id) {
      ID = ability._id;
    } else {
      const actorAbility = this.item.actor.system.abilities.find(
        (e) => e.system.key === ability.system.key && e.system.option === ability.system.option
      );
      if (actorAbility) {
        ability = actorAbility;
        ID = actorAbility._id;
      } else {
        secondaryId = true;
        if (ability instanceof CONFIG.Item.documentClass) {
          ability.updateSource({ system: { xp: 0, speciality: "" } });
        }
      }
    }

    currentData.push(
      this._buildAbilityProgressEntry(ability, {
        id: ID,
        secondaryId,
        teacherScore: this.item.system.teacher.score,
        xp: 0
      })
    );
    return { "system.progress.abilities": currentData };
  }

  static _buildNewSpellEntry(spell) {
    const system = foundry.utils.duplicate(spell.system);
    system.applyFocus = false;
    system.bonus = 0;
    system.bonusDesc = "";
    system.xp = 0;
    system.masteries = "";
    return {
      label: `${spell.name} : ${spellTechniqueLabel(spell.system, true)} ${spellFormLabel(
        spell.system,
        true
      )} ${spell.system.level}`,
      name: spell.name,
      img: spell.img,
      level: spell.system.level,
      spellData: system,
      id: "DROPPED"
    };
  }

  async addNewSpell(spell) {
    let newSpells = this.item.system.progress.newSpells;
    newSpells.push(ArM5eDiaryEntryItemSheetV2._buildNewSpellEntry(spell));
    const updateData = {};
    updateData["system.progress.newSpells"] = newSpells;
    await this.item.update(updateData);
  }

  async resetProgress(sourceQuality = 0) {
    await this.item.update({
      "system.sourceQuality": sourceQuality,
      "system.progress.abilities": [],
      "system.progress.spells": [],
      "system.progress.arts": [],
      "system.progress.newSpells": []
    });
  }
}
