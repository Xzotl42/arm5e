import { debug, getDataset, log } from "../tools.js";
import { ArM5eItemSheet } from "./item-sheet.js";
import {
  agingRoll,
  genericValidationOfActivity,
  getNewTitleForActivity
} from "../helpers/long-term-activities.js";
import { ArM5eItem } from "./item.js";
import { ActivitySchedule } from "../tools/activity-schedule.js";
import { UI, getConfirmation } from "../constants/ui.js";
import { DiaryEntrySchema } from "../schemas/diarySchema.js";
import { ArM5eActorSheet } from "../actor/actor-sheet.js";
import { getAbilityFromCompendium } from "../tools/compendia.js";
import { spellFormLabel, spellTechniqueLabel } from "../helpers/magic.js";

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class ArM5eItemDiarySheet extends ArM5eItemSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["arm5e", "sheet", "item"],
      width: 654,
      height: 800,
      dragDrop: [
        { dragSelector: null, dropSelector: ".progress-teacher" },
        { dragSelector: null, dropSelector: ".progress-abilities" },
        { dragSelector: null, dropSelector: ".progress-newspell" }
      ],
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "description"
        },
        {
          navSelector: ".diary-tabs",
          contentSelector: ".diary-body",
          initial: "abilities"
        }
      ]
    });
  }

  async _onDrop(event) {
    const data = TextEditor.getDragEventData(event);
    if (data.type == "Actor" && event.currentTarget.dataset.tab === "teacher") {
      if (this.item.system.activity === "teaching" || this.item.system.activity === "training") {
        if (data.id == this.actor.id) {
          ui.notifications.info(game.i18n.localize("arm5e.activity.msg.selfTeaching"));
          return;
        }
        const actor = await Actor.implementation.fromDropData(data);
        if (actor.isCharacter()) await this._setTeacher(actor);
      }
    } else if (data.type == "Item") {
      if (event.currentTarget.dataset.tab === "abilities") {
        const item = await Item.implementation.fromDropData(data);
        if (item.type === "ability") {
          if (this.item.system.activity === "teaching" || this.item.system.activity === "training")
            return;

          log(false, `Ability ${item.name} added`);
          this._addAbility(item);
        }
      } else {
        if (event.currentTarget.dataset.drop === "newspell") {
          const item = await Item.implementation.fromDropData(data);
          if (item.type === "laboratoryText") {
            if (item.system.type !== "spell") return;
          } else if (item.type !== "spell") {
            return;
          }
          await this._addNewSpell(item);
        }
      }
    }
    await super._onDrop(event);
  }
  /* -------------------------------------------- */

  /** @override */
  async getData() {
    const context = await super.getData();
    const actType = context.system.activity;
    context.firstSeason = context.system.dates[0];
    context.lastSeason = context.system.dates[context.system.dates.length - 1];
    // if (context.system.duration > 1) {
    //   // context.ui.editDate = "disabled";
    // }

    context.ui.editDuration = "readonly";
    context.selection.activities = {};
    for (const [k, v] of Object.entries(CONFIG.ARM5E.activities.generic)) {
      if (v.display.attribute === undefined) {
        context.selection.activities[k] = v.label;
      }
    }
    context.nbApplied = context.system.dates.filter((d) => d.applied == true).length;
    context.progress = `${context.nbApplied} / ${context.system.duration}`;
    // if not possible to create it from the sheet disable the selector
    if (!Object.keys(context.selection.activities).includes(actType)) {
      context.activityState = "disabled";
    }

    // add the current activity
    context.selection.activities[actType] = CONFIG.ARM5E.activities.generic[actType].label;

    if (this.actor == null || this.actor.type == "covenant" || this.actor.type == "laboratory") {
      context.ui.showTab = false;
      context.system.disabled = "disabled";
      context.activityState = "disabled";
      return context;
    }

    const activityConfig = CONFIG.ARM5E.activities.generic[actType];

    if (activityConfig.durationEdit == true) {
      context.ui.editDuration = "";
    }

    // legacy diary or just a simple recounting of events
    if (actType == "none" || actType == "recovery" || actType == "resource") {
      context.ui.showTab = false;
      return context;
    }
    context.rollNeeded = false;
    if (activityConfig.roll && !context.system.done) {
      context.rollNeeded = true;
      context.rollLabel = activityConfig.roll.label;
    }

    // configuration
    context.enforceSchedule = game.settings.get("arm5e", "enforceSchedule");
    let hasTeacher = ["training", "teaching"].includes(actType);
    context.system.sourceBonus = 0;
    context.ui.showTab = activityConfig.display.tab;
    context.ui.showProgress = activityConfig.display.progress;
    context.ui.showAbilities = activityConfig.display.abilities && !context.rollNeeded;
    context.ui.showArts = activityConfig.display.arts && !context.rollNeeded;
    context.ui.showMasteries = activityConfig.display.masteries && !context.rollNeeded;
    context.ui.showNewSpells = activityConfig.display.spells && !context.rollNeeded;

    context.ui.showTeacher = hasTeacher;
    context.ui.showBaseQuality = hasTeacher;
    context.ui.editSource = true;
    context.ui.bonusOptions = false;
    context.ui.schedule = true;

    context.system.applyPossible = true;
    context.system.applyError = "";
    context.system.applyInfo = "";
    context.system.errorParam = "";
    context.system.infoParam = "";

    // create the actor abilities tree
    context.system.ownedAbilities = {};
    context.system.defaultAbility = "";
    context.system.teacherScore = context.system.teacher.score ?? 0;
    context.system.ownedSpells = {};
    context.system.defaultArt = "";
    context.system.ownedArts = [];
    context.system.defaultSpellMastery = "";

    context.system.canEdit = "";
    context.system.disabled = "";

    context.system.canEditTeacher = "";
    context.system.disabledTeacher = "";

    context.system.teacherLinked = this.item.system.teacher.id !== null;
    let teacher;
    if (hasTeacher) {
      // do some checks on the teacher/trainer
      if (context.system.teacherLinked) {
        context.system.canEditTeacher = "readonly";
        context.system.disabledTeacher = "disabled";
        // check trainer/teacher exists
        teacher = game.actors.get(this.item.system.teacher.id);
        if (teacher === undefined && !context.system.done) {
          context.system.canEdit = "readonly";
          context.system.applyPossible = false;
          if (actType === "training") {
            context.system.applyError = "arm5e.activity.msg.noTrainer";
          } else {
            context.system.applyError = "arm5e.activity.msg.noTeacher";
          }
          context.system.errorParam = "";
        }
        // if teacher is not a Magus, he/she cannot teach spell masteries and arts
        if (teacher !== undefined && !teacher.isMagus()) {
          context.ui.showMagicProgress = false;
        }
        context.system.sourceModifier += teacher.system.bonuses.activities.teacher;
      } else {
        if (context.system.teacher.score < 2 && !context.system.done) {
          context.system.canEdit = "readonly";
          context.system.applyPossible = false;
          context.system.applyError = "arm5e.activity.msg.uselessTeacher";
          context.system.errorParam =
            context.system.teacher.name === ""
              ? game.i18n.localize("arm5e.activity.teacher.label")
              : context.system.teacher.name;
        }
      }
    }
    if (this.actor.isMagus()) {
      context.ui.showMagicProgress = true;
    }
    context.system.canProgress = { abilities: true, arts: true, spells: true };
    if (context.ui.showAbilities) {
      this.retrieveAbilities(context, teacher);
      // if (foundry.utils.isEmpty(context.system.ownedAbilities)) {
      if (context.system.defaultAbility === "") {
        context.system.canProgress.abilities = false;
      }
    }
    if (context.ui.showMagicProgress) {
      if (context.ui.showArts) {
        this.retrieveArts(context, teacher);
        // if (foundry.utils.isEmpty(context.system.ownedArts)) {
        if (context.system.defaultArt === "") {
          context.system.canProgress.arts = false;
        }
      }
      if (context.ui.showMasteries) {
        this.retrieveSpellMasteries(context, teacher);
        //if (foundry.utils.isEmpty(context.system.ownedSpells)) {
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
      // if it is done already we don't care about errors messages
      context.system.applyError = "";
    }

    if (!context.system.applyPossible) {
      return context;
    }

    if (this.actor.system.states.pendingCrisis) {
      context.system.applyError = "arm5e.notification.pendingCrisis";
      context.system.disabled = "disabled";
      context.activityState = "disabled";
      context.system.applyPossible = false;
      return context;
    }

    genericValidationOfActivity(context, this.actor, this.item);

    let hasScheduleConflict =
      this.item.isOwned && this.item.system.hasScheduleConflict(this.item.actor);

    if (hasScheduleConflict && context.enforceSchedule && !context.system.done) {
      context.system.applyError = "arm5e.activity.msg.scheduleConflict";
      context.astrolabIconStyle = 'style="text-shadow: 0 0 10px red"';
      context.system.applyPossible = false;
    }

    context.system.sourceModifier = this.item.actor.system.bonuses?.activities[actType] ?? 0;
    if (activityConfig.source.readonly && !context.system.done) {
      context.ui.editSource = false;
      context.system.sourceDefault = activityConfig.source.default;
    }

    if (activityConfig.bonusOptions != null) {
      context.ui.bonusOptions = true;
      context.bonusOptions = Object.fromEntries(
        Object.entries(activityConfig.bonusOptions).map(([k, v]) => {
          return [k, { selectLabel: `${game.i18n.localize(v.label)} (${v.modifier})`, ...v }];
        })
      );
      context.system.sourceBonus = activityConfig.bonusOptions[context.system.optionKey].modifier;
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

    if (this.actor.system.penalties.activityDivider != 1) {
      context.system.sourceQuality /= this.actor.system.penalties.activityDivider;
      context.system.applyError = "arm5e.activity.msg.sourceQualityHalved";
      context.system.errorParam = "";
    }
    if (activityConfig.validation != null) {
      activityConfig.validation(context, this.actor, this.item);
    }
    context.totalQuality =
      context.system.sourceQuality + context.system.sourceModifier + context.system.sourceBonus;

    if (context.system.disabled === "disabled") {
      context.activityState = "disabled";
    }

    // TODO enable
    // if (!context.system.applyPossible && context.partialDates.length) {
    //   context.partialButton = true;
    // }
    log(false, "ITEM-DIARY-sheet get data");
    log(true, context);
    return context;
  }

  retrieveAbilities(context, teacher) {
    // let availableAbilities = this.actor.system.abilities;
    let availableAbilities;

    const actType = context.system.activity;
    const hasTeacher = context.ui.showTeacher;
    // additionnal filtering based on the teacher skills
    if (hasTeacher && context.system.teacherLinked) {
      availableAbilities = [];
      context.teacherAbilities = teacher.system.abilities.filter((e) => {
        return e.system.derivedScore >= 2;
      });
      // filter on abilities which have a score higher than the student
      let idx = 0;
      for (let ta of context.teacherAbilities) {
        const sa = this.actor.system.abilities.find(
          (e) => ta.system.key === e.system.key && ta.system.option === e.system.option
        );

        if (sa != undefined) {
          if (sa.system.derivedScore < ta.system.derivedScore) {
            availableAbilities.push({
              _id: sa._id,
              secondaryId: false,
              name: sa.name,
              system: {
                key: sa.system.key,
                xp: sa.system.xp,
                score: sa.system.derivedScore,
                bonus: this.actor.system.bonuses.skills[sa.system.getComputedKey()].bonus,
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
      // add alternate arts if relevant
      if (teacher.system.features.magicSystem && this.actor.system.features.magicSystem) {
        const teacherAlternateVerbs = teacher.system.magicSystem.verbs.filter((e) => {
          return e.system.derivedScore >= 2;
        });
        for (let ta of teacherAlternateVerbs) {
          let sa = this.actor.system.magicSystem.verbs.find(
            (e) => e.system.key == ta.system.key && e.system.option == ta.system.option
          );
          if (sa != undefined) {
            if (sa.system.derivedScore < ta.system.derivedScore) {
              availableAbilities.push({
                _id: sa._id,
                secondaryId: false,
                name: sa.name,
                system: {
                  key: sa.system.key,
                  xp: sa.system.xp,
                  score: sa.system.derivedScore,
                  bonus: this.actor.system.bonuses.skills[sa.system.getComputedKey()].bonus,
                  option: sa.system.option,
                  category: sa.system.category
                }
              });
            }
          } else {
            let secondaryId = true;
            if (ta.option != "" && availableAbilities.find((e) => e.system.key == ta.system.key)) {
              secondaryId = false;
            }

            availableAbilities.push({
              _id: ta._id,
              secondaryId: secondaryId,
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
        context.teacherAbilities.push(...teacherAlternateVerbs);
        const teacherAlternateNouns = teacher.system.magicSystem.nouns.filter((e) => {
          return e.system.derivedScore >= 2;
        });
        for (let ta of teacherAlternateNouns) {
          let sa = this.actor.system.magicSystem.nouns.find(
            (e) => e.system.key == ta.system.key && e.system.option == ta.system.option
          );
          if (sa != undefined) {
            if (sa.system.derivedScore < ta.system.derivedScore) {
              availableAbilities.push({
                _id: sa._id,
                secondaryId: false,
                name: sa.name,
                system: {
                  key: sa.system.key,
                  xp: sa.system.xp,
                  score: sa.system.derivedScore,
                  bonus: this.actor.system.bonuses.skills[sa.system.getComputedKey()].bonus,
                  option: sa.system.option,
                  category: sa.system.category
                }
              });
            }
          } else {
            let secondaryId = true;
            if (ta.option != "" && availableAbilities.find((e) => e.system.key == ta.system.key)) {
              secondaryId = false;
            }

            availableAbilities.push({
              _id: ta._id,
              secondaryId: secondaryId,
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
        context.teacherAbilities.push(...teacherAlternateNouns);
      }
    } else {
      availableAbilities = foundry.utils.duplicate(CONFIG.ARM5E.LOCALIZED_ABILITIES_ENRICHED);
      // merge all abilities with the character ones
      for (let a of this.actor.system.abilities) {
        let found = availableAbilities.findIndex(
          (e) => e.system.key == a.system.key && e.system.option == a.system.option
        );
        const bonus = this.actor.system.bonuses.skills[a.system.getComputedKey()].bonus;
        if (found >= 0) {
          availableAbilities[found]._id = a._id;
          availableAbilities[found].system.xp = a.system.xp;
          availableAbilities[found].system.bonus = bonus;
          availableAbilities[found].system.score = a.system.derivedScore;
          availableAbilities[found].secondaryId = false;
        } else {
          let secondaryId = true;
          if (a.option != "" && availableAbilities.find((e) => e.system.key == a.system.key)) {
            secondaryId = false;
          }
          availableAbilities.push({
            _id: a._id,
            secondaryId: secondaryId,
            name: a.name,
            system: {
              key: a.system.key,
              xp: a.system.xp,
              score: a.system.derivedScore,
              bonus: bonus,
              option: a.system.option,
              category: a.system.category
            }
          });
        }
      }

      // add alternate arts if relevant
      if (this.actor.system.features.magicSystem) {
        for (let a of this.actor.system.magicSystem.verbs) {
          let found = availableAbilities.findIndex(
            (e) => e.system.key == a.system.key && e.system.option == a.system.option
          );
          const bonus = this.actor.system.bonuses.skills[a.system.getComputedKey()].bonus;
          if (found >= 0) {
            availableAbilities[found]._id = a._id;
            availableAbilities[found].system.xp = a.system.xp;
            availableAbilities[found].system.bonus = bonus;
            availableAbilities[found].system.score = a.system.derivedScore;
            availableAbilities[found].secondaryId = false;
          } else {
            let secondaryId = true;
            if (a.option != "" && availableAbilities.find((e) => e.system.key == a.system.key)) {
              secondaryId = false;
            }
            availableAbilities.push({
              _id: a._id,
              secondaryId: secondaryId,
              name: a.name,
              system: {
                key: a.system.key,
                xp: a.system.xp,
                score: a.system.derivedScore,
                bonus: bonus,
                option: a.system.option,
                category: a.system.category
              }
            });
          }
        }
        for (let a of this.actor.system.magicSystem.nouns) {
          let found = availableAbilities.findIndex(
            (e) => e.system.key == a.system.key && e.system.option == a.system.option
          );
          const bonus = this.actor.system.bonuses.skills[a.system.getComputedKey()].bonus;
          if (found >= 0) {
            availableAbilities[found]._id = a._id;
            availableAbilities[found].system.xp = a.system.xp;
            availableAbilities[found].secondaryId = false;
            availableAbilities[found].system.bonus = bonus;
            availableAbilities[found].system.score = a.system.derivedScore;
            availableAbilities[found].secondaryId = false;
          } else {
            let secondaryId = true;
            if (a.option != "" && availableAbilities.find((e) => e.system.key == a.system.key)) {
              secondaryId = false;
            }
            availableAbilities.push({
              _id: a._id,
              secondaryId: secondaryId,
              name: a.name,
              system: {
                key: a.system.key,
                xp: a.system.xp,
                score: a.system.derivedScore,
                bonus: bonus,
                option: a.system.option,
                category: a.system.category
              }
            });
          }
        }
      }
      // filter on unlinked teacher score
      if (hasTeacher) {
        availableAbilities = availableAbilities.filter((e) => {
          return e.system.score < context.system.teacher.score;
        });
      }
    }

    let firstAb = true;
    context.selection.abilityCategories = {};
    // for each progressed ability, list the category and abilities available
    for (const ability of availableAbilities) {
      let teacherScore = 0;
      if (hasTeacher) {
        if (context.system.teacher.id === null) {
          teacherScore = context.system.teacher.score ?? 0;
        } else {
          let teacherAbility = context.teacherAbilities.find((e) => {
            return e.system.key === ability.system.key && e.system.option === ability.system.option;
          });
          if (teacherAbility) {
            teacherScore = teacherAbility.system.derivedScore;
          } else {
            teacherScore = 10;
          }
        }
      }
      // add category if it was not created yet
      if (context.system.ownedAbilities[ability.system.category] == undefined) {
        context.system.ownedAbilities[ability.system.category] = [];
        context.selection.abilityCategories[ability.system.category] =
          CONFIG.ARM5E.LOCALIZED_ABILITIES[ability.system.category].label;
      }
      const abilityScoreLabel = ability.system.bonus
        ? `${ability.system.score} + ${ability.system.bonus}`
        : `${ability.system.score}`;
      let tmp = {
        id: ability._id,
        secondaryId: ability.secondaryId,
        category: ability.system.category,
        name: ability.name,
        key: ability.system.key,
        currentXp: ability.system.xp,
        score: ability.secondaryId ? 0 : ability.system.score,
        option: game.i18n.localize(ability.system.option),
        teacherScore: teacherScore,
        label: `${ability.name} (${ability.secondaryId ? 0 : abilityScoreLabel})`
      };
      if (firstAb) {
        let filteredList = Object.values(context.system.progress.abilities).filter((e) => {
          return e.id === ability._id;
        });
        if (
          // if ability doesn't exist in current items, set it as next default
          filteredList.length === 0
        ) {
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

    // Fill missing abilities and update teacher score
    for (let a of context.system.progress.abilities) {
      if (context.hasTeacher) {
        if (context.system.teacher.id === null) {
          a.teacherScore = context.system.teacher.score ?? 0;
        } else {
          let teacherAbility = context.teacherAbilities.find((e) => {
            return e.system.key === a.key && e.system.option === a.option;
          });
          if (teacherAbility) {
            a.teacherScore = teacherAbility.system.derivedScore;
          } else a.teacherscore = 100;
        }
      }
      const computedKey = a.option != "" ? `${a.key}_${a.option}` : a.key;
      const abilityBonus = this.actor.system.bonuses.skills[computedKey]?.bonus ?? 0;
      const abilityScoreLabel = abilityBonus ? `${a.score} + ${abilityBonus}` : `${a.score}`;
      if (context.system.ownedAbilities[a.category] == undefined) {
        context.system.ownedAbilities[a.category] = [];
        context.selection.abilityCategories[a.category] =
          CONFIG.ARM5E.LOCALIZED_ABILITIES[a.category].label;

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
        let idx = context.system.ownedAbilities[a.category].findIndex((e) => {
          return e.id == a.id;
        });
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

  retrieveArts(context, teacher) {
    const hasTeacher = context.ui.showTeacher;
    if (context.ui.showArts) {
      // Arts
      let availableArts = [];
      if (hasTeacher) {
        // get the arts the teacher is skilled enough in to teach
        if (context.system.teacherLinked) {
          let teacherTechniques = Object.entries(teacher.system.arts.techniques)
            .filter((e) => {
              if (context.system.done) {
                return e[1].derivedScore >= 5;
              } else {
                return (
                  e[1].derivedScore >= 5 &&
                  e[1].derivedScore > this.actor.system.arts.techniques[e[0]].derivedScore
                );
              }
            })
            .map((e) => {
              return {
                key: e[0],
                label: CONFIG.ARM5E.magic.arts[e[0]].label,
                score: this.actor.system.arts.techniques[e[0]].derivedScore,
                teacherScore: e[1].derivedScore
              };
            });

          let teacherForms = Object.entries(teacher.system.arts.forms)
            .filter((e) => {
              if (context.system.done) {
                return e[1].derivedScore >= 5;
              } else {
                return (
                  e[1].derivedScore >= 5 &&
                  e[1].derivedScore > this.actor.system.arts.forms[e[0]].derivedScore
                );
              }
            })
            .map((e) => {
              return {
                key: e[0],
                label: CONFIG.ARM5E.magic.arts[e[0]].label,
                score: this.actor.system.arts.forms[e[0]].derivedScore,
                teacherScore: e[1].derivedScore
              };
            });

          availableArts = teacherTechniques.concat(teacherForms);
        } else {
          let teacherScore = 0;
          if (hasTeacher && context.system.teacher.id === null) {
            teacherScore = context.system.teacher.score ?? 0;
          }
          if (teacherScore < 5) {
            // must have a score of 5 to teach an Art
            availableArts = [];
          } else {
            let actorTechniques = Object.entries(this.actor.system.arts.techniques).map((e) => {
              return {
                key: e[0],
                label: CONFIG.ARM5E.magic.arts[e[0]].label,
                score: this.actor.system.arts.techniques[e[0]].derivedScore,
                teacherScore: teacherScore
              };
            });

            let actorForms = Object.entries(this.actor.system.arts.forms).map((e) => {
              return {
                key: e[0],
                label: CONFIG.ARM5E.magic.arts[e[0]].label,
                score: this.actor.system.arts.forms[e[0]].derivedScore,
                teacherScore: teacherScore
              };
            });

            availableArts = actorTechniques.concat(actorForms);
            availableArts = availableArts.filter((e) => {
              return e.score < context.system.teacher.score;
            });
          }
        }
      } else {
        availableArts = [
          ...Object.entries(this.actor.system.arts.techniques).map((e) => {
            return {
              key: e[0],
              score: e[1].derivedScore,
              label: CONFIG.ARM5E.magic.arts[e[0]].label,
              teacherScore: 0
            };
          }),
          ...Object.entries(this.actor.system.arts.forms).map((e) => {
            return {
              key: e[0],
              score: e[1].derivedScore,
              label: CONFIG.ARM5E.magic.arts[e[0]].label,
              teacherScore: 0
            };
          })
        ];
      }

      let firstArt = true;
      for (const art of Object.values(availableArts)) {
        if (firstArt) {
          let filteredList = Object.values(context.system.progress.arts).filter((e) => {
            return e.key === art.key;
          });
          if (
            // if art doesn't exist in current items, set it as next default
            filteredList.length === 0
          ) {
            context.system.defaultArt = art.key;
            context.system.teacherScore = art.teacherScore;
            firstArt = false;
          }
        }
        art.label = `${art.label} (${art.score})`;
        context.system.ownedArts.push(art);
      }

      // Fill missing arts and update teacher score
      for (let a of context.system.progress.arts) {
        if (context.system.teacher.id === null) {
          a.teacherScore = context.system.teacher.score ?? 0;
        } else {
          let teacherArt = teacher.getArtStats(a.key);
          a.teacherScore = teacherArt.derivedScore;
        }
      }
    }
  }

  retrieveSpellMasteries(context, teacher) {
    const hasTeacher = context.ui.showTeacher;
    let availableSpells = this.actor.system.spells;
    if (hasTeacher) {
      if (context.system.teacherLinked) {
        context.teacherMasteries = teacher.system.spells.filter((e) => {
          return e.system.finalScore >= 2;
        });
        availableSpells = this.actor.system.spells.filter((e) => {
          return context.teacherMasteries.some((filter) => {
            if (context.system.done) {
              return (
                // for rollback, the item must still be there
                filter.name === e.name &&
                filter.system.technique.value === e.system.technique.value &&
                filter.system.form.value === e.system.form.value
              );
            } else {
              return (
                filter.name === e.name &&
                filter.system.technique.value === e.system.technique.value &&
                filter.system.form.value === e.system.form.value &&
                filter.system.finalScore > e.system.finalScore
              );
            }
          });
        });
      } else {
        // if unlinked teacher any available spell with a mastery below the teacher score is valid.
        availableSpells = this.actor.system.spells.filter((e) => {
          return e.system.finalScore < context.system.teacher.score;
        });
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
          let teacherSpell = context.teacherMasteries.find((e) => {
            return (
              e.system.technique.value === spell.system.technique.value &&
              e.system.form.value === spell.system.form.value &&
              e.name === spell.name
            );
          });
          teacherScore = teacherSpell.system.finalScore;
        }
      }
      if (context.system.ownedSpells[spell.system.form.value] == undefined) {
        context.system.ownedSpells[spell.system.form.value] = [];
        context.system.ownedSpellForms[spell.system.form.value] =
          CONFIG.ARM5E.magic.forms[spell.system.form.value].label;
      }
      let tmp = {
        id: spell._id,
        form: spell.system.form.value,
        // technique: spell.system.technique.value,
        name: spell.name,
        currentXp: spell.system.xp,
        score: spell.system.finalScore,
        teacherScore: teacherScore,
        label: `${spell.name} (${spell.system.finalScore})`
      };
      if (firstSpell) {
        let filteredList = Object.values(context.system.progress.spells).filter((e) => {
          return e.id === spell._id;
        });
        if (
          // if spell doesn't exist in current items, set it as next default
          filteredList.length === 0
        ) {
          context.system.defaultSpellMastery = spell._id;
          context.system.teacherScore = teacherScore;
          firstSpell = false;
        }
      }
      log(false, `DEBUG: teacher score: ${tmp.teacherScore}`);
      context.system.ownedSpells[spell.system.form.value].push(tmp);
    }

    for (let s of context.system.progress.spells) {
      if (context.system.teacher.id === null) {
        s.teacherScore = context.system.teacher.score ?? 0;
      } else {
        let spell = this.actor.items.get(s.id);
        let teacherSpell = context.teacherMasteries.find((e) => {
          return (
            e.system.technique.value === spell.system.technique.value &&
            e.system.form.value === spell.system.form.value &&
            e.name === spell.name
          );
        });
        s.teacherScore = teacherSpell.system.finalScore;
      }
    }
  }

  updateProgress(context) {}

  /* -------------------------------------------- */

  /** @override */
  setPosition(options = {}) {
    const position = super.setPosition(options);
    const sheetBody = this.element.find(".sheet-body");
    const bodyHeight = position.height - 500;
    sheetBody.css("height", bodyHeight);
    return position;
  }

  _canDragDrop(selector) {
    return this.isEditable;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    html.find(".progress-control").click(this._onProgressControl.bind(this));
    html.find(".progress-category").change(this._setCategory.bind(this));
    html.find(".progress-ability").change(this._setAbility.bind(this));
    html.find(".progress-art").change(this._setArt.bind(this));
    html.find(".progress-apply").click(this._onProgressApply.bind(this));
    html.find(".progress-partial").click(this._onPartialProgress.bind(this));
    html.find(".progress-rollback").click(this._onProgressRollback.bind(this));
    html.find(".progress-activity").change(this._setActivity.bind(this));
    html.find(".progress-refresh").click(this._refresh.bind(this));
    html.find(".duration").change(this._setDuration.bind(this));
    html.find(".progress-xp").change(this._setXp.bind(this));
    html.find(".break-link").click(this._resetTeacher.bind(this));
    html.find(".score-teacher").change(this._changeTeacherScore.bind(this));
    html.find(".show-details").click(async (event) => this._showSpell(this.item, event));
    html.find(".select-dates").click(this.displayCalendar.bind(this));
    html.find(".roll-activity").click(async (event) => await this.rollActivity());

    html.find(".change-year").change(this._setStartYear.bind(this));
    html.find(".change-season").change(this._setStartSeason.bind(this));
    // html.find(".select-year").click(this._selectYear.bind(this));
  }
  async _setStartYear(event) {
    event.preventDefault();
    const target = event.currentTarget;
    const newYear = Number($(target).val());
    let updateData = {};
    updateData["system.dates"] = DiaryEntrySchema.buildSchedule(
      this.item.system.duration,
      newYear,
      this.item.system.dates[0].season
    );
    this.submit({ preventClose: true, updateData: updateData }).then(() => this.render());
  }

  async _setStartSeason(event) {
    event.preventDefault();
    const target = event.currentTarget;
    const newSeason = $(target).val();
    let updateData = {};
    updateData["system.dates"] = DiaryEntrySchema.buildSchedule(
      this.item.system.duration,
      this.item.system.dates[0].year,
      newSeason
    );
    this.submit({ preventClose: true, updateData: updateData }).then(() => this.render());
  }

  async _setDuration(event) {
    event.preventDefault();
    const target = event.currentTarget;
    const newDuration = Number($(target).val());
    if (!Number.isNumeric(newDuration) || newDuration < 1) newDuration = 1;
    let updateData = {};
    updateData["system.duration"] = newDuration;
    updateData["system.dates"] = DiaryEntrySchema.buildSchedule(
      newDuration,
      this.item.system.dates[0].year,
      this.item.system.dates[0].season
    );
    this.submit({ preventClose: true, updateData: updateData }).then(() => this.render());
  }

  async _refresh(event) {
    event.preventDefault();
    this.render(true);
  }
  async rollActivity() {
    const activityConfig = CONFIG.ARM5E.activities.generic[this.item.system.activity];
    if (activityConfig.roll) {
      await activityConfig.roll.action(this.item);
    }
  }

  async _resetTeacher(event) {
    const target = event?.currentTarget;
    if (this.item.system.done) {
      return;
    }
    let updateData = {};
    updateData["system.teacher.id"] = null;
    updateData[`system.progress.abilities`] = [];
    updateData[`system.progress.arts`] = [];
    updateData[`system.progress.spells`] = [];
    await this.item.update(updateData);
  }

  async _changeTeacherScore(event) {
    if (this.item.system.done) {
      return;
    }
    const target = event.currentTarget;
    const newScore = Number($(target).val());
    let updateData = {};
    updateData["system.teacher.score"] = newScore;

    for (let a of this.item.system.progress.abilities) {
      a.teacherScore = newScore;
    }
    for (let a of this.item.system.progress.arts) {
      a.teacherScore = newScore;
    }
    for (let a of this.item.system.progress.spells) {
      a.teacherScore = newScore;
    }

    updateData[`system.progress.abilities`] = this.item.system.progress.abilities;
    updateData[`system.progress.arts`] = this.item.system.progress.arts;
    updateData[`system.progress.spells`] = this.item.system.progress.spells;
    await this.item.update(updateData);
  }

  async _setXp(event) {
    event.preventDefault();
    const target = event.currentTarget;
  }

  async _setActivity(event) {
    event.preventDefault();
    const target = event.currentTarget;
    const actType = $(target).val();
    // just reset some fields so the new default can be set
    let updateData = {};
    updateData["system.sourceQuality"] = 0;
    if (CONFIG.ARM5E.activities.generic[actType].display.abilities === false) {
      updateData["system.progress.abilities"] = [];
    }
    if (CONFIG.ARM5E.activities.generic[actType].display.arts === false) {
      updateData["system.progress.arts"] = [];
    }
    if (CONFIG.ARM5E.activities.generic[actType].display.masteries === false) {
      updateData["system.progress.spells"] = [];
    }
    if (CONFIG.ARM5E.activities.generic[actType].display.spells === false) {
      updateData["system.progress.newSpells"] = [];
    }

    updateData["system.sourceQuality"] = CONFIG.ARM5E.activities.generic[actType].source.default;
    if (CONFIG.ARM5E.activities.generic[actType].duration) {
      updateData["system.duration"] = CONFIG.ARM5E.activities.generic[actType].duration;
      updateData["system.dates"] = DiaryEntrySchema.buildSchedule(
        CONFIG.ARM5E.activities.generic[actType].duration,
        this.item.system.dates[0].year,
        this.item.system.dates[0].season
      );
    } else {
      updateData["system.duration"] = 1;
      updateData["system.dates"] = DiaryEntrySchema.buildSchedule(
        1,
        this.item.system.dates[0].year,
        this.item.system.dates[0].season
      );
    }
    updateData["img"] =
      CONFIG.ACTIVITIES_DEFAULT_ICONS[actType] ?? CONFIG.ARM5E_DEFAULT_ICONS[diaryEntry];
    switch (actType) {
      case "none":
        this._tabs[0].activate("description");
        break;
      default:
        this._tabs[0].activate("advanced");
        break;
    }
    this.submit({ preventClose: true, updateData: updateData }).then(() => this.render());
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

  async _onPartialProgress(event, notif = true) {
    let dataset = getDataset(event);
    // First double check if the situation has changed
    let context = await this.getData();
    if (!context.partialApply) {
      if (notif) {
        ui.notifications.warn(game.i18n.localize("arm5e.notification.situationHasChanged"));
        this.render(true);
      }
      return context;
    }

    // if the first date is not applied and in the past, remove any activity costs (vis, ...)

    if (!context.firstSeason.applied) {
    }

    // if the first non-applied date of the schedule is in the past
  }

  async progressApply(context) {
    const updateItems = [];
    const newItems = [];
    // ABILITIES
    let idx = 0;
    for (const ab of Object.values(this.item.system.progress.abilities)) {
      // ignore 0 xp gain
      if (ab.xp == 0) {
        idx++;
        continue;
      }
      let ability;
      if (
        ab.id.length < 16 ||
        (["training", "teaching"].includes(this.item.system.activity) && ab.secondaryId)
      ) {
        // get the ability template from the shared compendia
        ability = await getAbilityFromCompendium(ab.key, ab.option);
        ability.name = ab.name;
        ability.system.xp = ab.xp;
        newItems.push(ability);
      } else {
        // check that ability still exists
        ability = this.actor.items.get(ab.id);
        if (ability == undefined) {
          ui.notifications.warn(game.i18n.localize("arm5e.activity.msg.abilityMissing"), {
            permanent: false
          });
          context.system.applyError = "arm5e.activity.msg.abilityMissing";
          return false;
        }
        updateItems.push({
          _id: ab.id,
          system: {
            xp: ability.system.xp + Math.round(ab.xp)
          }
        });
      }

      context.description += `<li>${game.i18n.format("arm5e.activity.descItem", {
        item: ability.name,
        xp: ab.xp
      })}</li>`;
      log(false, `Added ${ab.xp} to ${ability.name}`);
      context.sourceQuality += ab.xp;
      idx++;
    }

    if (newItems.length > 0) {
      context.promises.abilities.push(
        this.actor.createEmbeddedDocuments("Item", newItems, {
          render: false
        })
      );
    }

    if (updateItems.length > 0) {
      context.promises.abilities.push(
        this.actor.updateEmbeddedDocuments("Item", updateItems, {
          render: false
        })
      );
    }

    // SPELL MASTERIES
    const updateSpells = [];
    for (const s of Object.values(this.item.system.progress.spells)) {
      // ignore 0 xp gain
      if (s.xp == 0) {
        continue;
      }
      // check that spell still exists
      let spell = this.actor.items.get(s.id);
      if (spell == undefined) {
        ui.notifications.warn(game.i18n.localize("arm5e.activity.msg.spellMissing"), {
          permanent: false
        });
        context.system.applyError = "arm5e.activity.msg.spellMissing";
        return false;
      }
      let data = {
        _id: s.id,
        system: {
          xp: spell.system.xp + s.xp
        }
      };
      context.description += `<li>${game.i18n.format("arm5e.activity.descItem", {
        item: spell.name,
        xp: s.xp
      })}</li>`;
      log(false, `Added ${Math.round(s.xp)} to ${spell.name}`);
      context.sourceQuality += s.xp;
      updateSpells.push(data);
    }
    if (updateSpells.length > 0) {
      context.promises.masteries.push(
        this.actor.updateEmbeddedDocuments("Item", updateSpells, {
          render: false
        })
      );
    }

    // ARTS

    context.actorUpdate = { system: { arts: { forms: {}, techniques: {} } } };
    for (const a of Object.values(this.item.system.progress.arts)) {
      // ignore 0 xp gain
      if (a.xp == 0) {
        continue;
      }
      let artType = "techniques";
      if (Object.keys(CONFIG.ARM5E.magic.techniques).indexOf(a.key) == -1) {
        artType = "forms";
      }
      context.actorUpdate.system.arts[artType][a.key] = {};
      context.actorUpdate.system.arts[artType][a.key].xp =
        this.actor.system.arts[artType][a.key].xp + a.xp;
      context.description += `<li>${game.i18n.format("arm5e.activity.descItem", {
        item: game.i18n.localize(CONFIG.ARM5E.magic.arts[a.key].label),
        xp: a.xp
      })}</li>`;
      log(false, `Added ${a.xp} to ${a.key}`);
      context.sourceQuality += a.xp;
    }

    // NEW SPELLS

    const newSpells = [];
    for (const a of Object.values(this.item.system.progress.newSpells)) {
      let spell = {
        name: a.name,
        type: "spell",
        img: a.img,
        system: a.spellData
      };

      context.description += `<li>${game.i18n.localize("arm5e.activity.newSpell")} : ${
        spell.name
      }</li>`;

      newSpells.push(spell);
    }
    if (newSpells.length > 0) {
      context.promises.spells.push(
        this.actor.createEmbeddedDocuments("Item", newSpells, {
          render: false
        })
      );
    }

    // ACHIEVEMENTS

    for (const achievement of this.item.system.achievements) {
      // if an id exists update it
      if (achievement._id) {
        context.promises.achievements.push(
          this.actor.updateEmbeddedDocuments("Item", [achievement], {})
        );
      } else {
        context.promises.achievements.push(
          this.actor.createEmbeddedDocuments("Item", [achievement], {})
        );
      }
    }

    let results = await Promise.all(
      Object.values(context.promises).map(function (item) {
        return Promise.all(item);
      })
    );

    // flatten the result for better iteration
    results = results.map((e) => {
      return e.flat();
    });

    // abilities: [0],
    // spells: [1],
    // masteries: [2],
    // achievements: [3],
    // dependencies: [4]

    context.indexes = { abilities: [], spells: [], achievements: [] };

    for (const a of results[0]) {
      // fill the id of the item created for rollback
      context.indexes.abilities.push(a._id);
    }

    for (const a of results[1]) {
      // fill the id of the item created for rollback
      context.indexes.spells.push(a._id);
      context.sourceQuality += a.system.level;
    }
    for (const a of results[3]) {
      // fill the id of the item created for rollback
      context.indexes.achievements.push(a._id);
    }

    return true;
  }

  async _onProgressApply(event, notif = true) {
    let dataset = getDataset(event);

    if (this.item.system.done) {
      // no idea how it got there:
      log(false, "WARNING: something weird is happening");
      return false;
    }

    // First double check if the situation has changed
    let context = await this.getData();
    if (!context.system.applyPossible) {
      if (notif) {
        ui.notifications.warn(game.i18n.localize("arm5e.notification.situationHasChanged"));
        this.render(true);
      }
      return context;
    }

    context.description = this.item.system.description + "<h4>Technical part:<h4><ol>";

    context.sourceQuality = 0;

    context.sourceModifier = Number(dataset.qualitymod ?? 0);

    context.promises = {
      abilities: [],
      spells: [],
      masteries: [],
      achievements: [],
      dependencies: [],
      resources: []
    };

    // if the first date is not applied and in the past, remove any activity costs (vis, ...)
    if (this.item.system.dates[0].applied === false) {
      await this.item.system.activityHandler.activityCosts(context);

      const newDependencies = [];
      for (let dependency of this.item.system.externalIds) {
        if (game.actors.has(dependency.actorId)) {
          let actor = game.actors.get(dependency.actorId);
          if (actor.items.has(dependency.itemId)) {
            if (dependency.flags == 1) {
              // resource update
              let item = actor.items.get(dependency.itemId);
              let label = `system.${dependency.data.quantity}`;
              context.promises.dependencies.push(
                item.update(
                  { "system.quantity": item.system.quantity - dependency.data.amount },
                  { parent: actor }
                )
              );
              if (item.isAResource()) {
                context.promises.resources.push(
                  item._createResourceTrackingDiaryEntry(
                    actor,
                    this.item.name,
                    dependency.data.amount,
                    this.item.system.dates[0]
                  )
                );
              }
            } else if (dependency.flags == 2) {
              let item = actor.items.get(dependency.itemId);
              if (item.type === "diaryEntry") {
                if (item.system.activity === "lab") {
                  context.promises.dependencies.push(item.update(item.system._applySchedule(), {}));
                }
              }
            }
          }
        }
      }
    }
    // if the first non-applied date of the schedule is in the past

    await this.progressApply(context);

    context.description += "</ol>";
    // }

    // Final update on the diary

    let newTitle = await getNewTitleForActivity(this.actor, this.item);

    await this.actor.update(context.actorUpdate, { render: true });

    // IDs reconciliation

    let abIdx = 0;
    for (let ab of this.item.system.progress.abilities) {
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
    for (let ach of this.item.system.achievements) {
      ach._id = context.indexes.achievements[idx];
      idx++;
    }
    idx = 0;
    for (let spell of this.item.system.progress.newSpells) {
      spell.id = context.indexes.spells[idx];
      idx++;
    }

    // is it needed to track resources from achievements?
    // if (CONFIG.ARM5E.item.resources.includes(achievement.type)) {
    //     context.promises.resources.push(
    //       achievement._createResourceTrackingDiaryEntry(
    //         this.item.name,
    //         this.actor,
    //         achievement.system.quantity,
    //         this.item.system.dates[0]
    //       )
    //     );
    //   }

    const dates = this.item.system.dates;
    for (let d of dates) {
      d.applied = true;
    }

    await this.item.update(
      {
        name: newTitle,
        system: {
          done: true,
          dates: dates,
          description: context.description,
          progress: this.item.system.progress,
          sourceQuality: this.item.system.cappedGain
            ? context.sourceQuality
            : context.sourceQuality - context.sourceModifier - context.system.sourceBonus,
          achievements: this.item.system.achievements
        }
      },
      { render: true, recursive: true }
    );

    return context;
  }

  async _onProgressRollback(event, toConfirm = true) {
    event?.preventDefault();
    // this.render();
    if (!this.item.system.done) {
      // no idea how it got there:
      log(false, "WARNING: something weird is happening");
      return;
    }
    if (toConfirm) {
      const question = game.i18n.localize("arm5e.dialog.rollback-question");
      let itemId = this.item._id;
      let confirm = await getConfirmation(
        this.item.name,
        question,
        ArM5eActorSheet.getFlavor(this.item.actor?.type)
      );
      if (!confirm) {
        return;
      }
    }

    const actor = this.actor;
    let updateData = [];
    let promises = [];
    if (this.item.system.achievements.length != 0) {
      let items = this.item.system.achievements.filter((e) => !e.updateExisting).map((e) => e._id);
      if (items.length > 0) {
        promises.push(this.actor.deleteEmbeddedDocuments("Item", items, {}));
      }
    }
    switch (this.item.system.activity) {
      case "writing": {
        const dependency = this.item.system.externalIds[0];
        const book = actor.items.get(dependency.itemId);
        if (book) {
          if (dependency.data.topic) {
            let topicToDelete = dependency.data.topic;
            // find the last index that match the writen topic
            const indexToDelete = this.item.system.achievements[0].system.topics.findLastIndex(
              (e) => {
                return (
                  e.category === topicToDelete.category &&
                  e.level === topicToDelete.level &&
                  e.quality === topicToDelete.quality &&
                  e.type === topicToDelete.type &&
                  e.key === topicToDelete.key &&
                  e.option === topicToDelete.option &&
                  e.art === topicToDelete.art &&
                  e.author === topicToDelete.author
                );
              }
            );
            if (indexToDelete >= 0) {
              log(false, `Deleted topic : ${topicToDelete}`);
              let topics = foundry.utils.duplicate(book.system.topics);
              topics.splice(indexToDelete, 1);
              promises.push(
                this.actor.updateEmbeddedDocuments(
                  "Item",
                  [
                    { _id: book._id, system: { topics: topics }, "flags.arm5e.currentBookTopic": 0 }
                  ],
                  {}
                )
              );
            } else {
              await Promise.all(promises);
              ui.notifications.warn(game.i18n.localize("arm5e.scriptorium.msg.topicNoFound"));
              return;
            }
          } else if (dependency.data.topicNumber) {
            //lab texts
            let topics = foundry.utils.duplicate(book.system.topics);
            topics.splice(dependency.data.topicIndex, dependency.data.topicNumber);
            promises.push(
              this.actor.updateEmbeddedDocuments(
                "Item",
                [{ _id: book._id, system: { topics: topics }, "flags.arm5e.currentBookTopic": 0 }],
                {}
              )
            );
          }
        } else {
          await Promise.all(promises);
          ui.notifications.warn(game.i18n.localize("arm5e.scriptorium.msg.topicNoFound"));
          return;
        }
      }
      // for (let toUpdate of this.item.system.achievements.filter((e) => e.updateExisting)) {
      // }
      case "recovery":
      case "itemInvestigation":
      case "twilight":
        // delete the diary entry
        promises.push(this.actor.deleteEmbeddedDocuments("Item", [this.item.id], {}));
        await Promise.all(promises);
        return;

      case "learnSpell":
      case "inventSpell":
      case "visExtraction":
      case "visStudy":
      case "minorEnchantment":
      case "chargedItem":
        for (let dependency of this.item.system.externalIds) {
          if (game.actors.has(dependency.actorId)) {
            let actor = game.actors.get(dependency.actorId);
            if (actor.items.has(dependency.itemId)) {
              if (dependency.flags == 0) {
                let item = new ArM5eItem(r, { temporary: true });
                // delete
                promises.push(actor.deleteEmbeddedDocuments("Item", [dependency.itemId], {}));
              } else if (dependency.flags == 1) {
                // resource update
                let item = actor.items.get(dependency.itemId);
                promises.push(
                  item.update(
                    { "system.quantity": item.system.quantity + dependency.data.amount },
                    { parent: actor }
                  )
                );
              } else if (dependency.flags == 2) {
                let item = actor.items.get(dependency.itemId);
                if (item.type === "diaryEntry") {
                  if (item.system.activity === "lab") {
                    promises.push(item.update(item.system._rollbackSchedule(), {}));
                  }
                }
              }
            }
          }
        }

      case "adventuring":
      case "exposure":
      case "practice":
      case "training":
      case "teaching":
      case "reading":
      case "copying":
      case "hermeticApp":
      case "childhood":
      case "laterLife":
      case "laterLifeMagi": {
        for (const ab of Object.values(this.item.system.progress.abilities)) {
          // check that ability still exists
          let ability = this.actor.items.get(ab.id);
          if (ability == undefined) {
            ui.notifications.warn(game.i18n.localize("arm5e.activity.msg.abilityMissing"), {
              permanent: false
            });
            continue;
          }
          let xps = ability.system.xp - ab.xp;
          let data = {
            _id: ab.id,
            system: {
              xp: xps < 0 ? 0 : xps
            }
          };
          log(false, `Removed ${ab.xp} from ${ability.name}`);
          updateData.push(data);
        }
        for (const s of Object.values(this.item.system.progress.spells)) {
          let spell = this.actor.items.get(s.id);
          if (spell == undefined) {
            ui.notifications.warn(game.i18n.localize("arm5e.activity.msg.spellMissing"), {
              permanent: false
            });
            continue;
          }
          let xps = spell.system.xp - s.xp;
          let data = {
            _id: s.id,
            system: {
              xp: xps < 0 ? 0 : xps
            }
          };
          log(false, `Removed ${s.xp} from ${spell.name}`);
          updateData.push(data);
        }
        let actorUpdate = { system: { arts: { forms: {}, techniques: {} } } };
        for (const a of Object.values(this.item.system.progress.arts)) {
          let artType = "techniques";
          if (Object.keys(CONFIG.ARM5E.magic.techniques).indexOf(a.key) == -1) {
            artType = "forms";
          }
          let xps = actor.system.arts[artType][a.key].xp - a.xp;
          log(false, `Removed ${a.xp} from ${a.key}`);
          actorUpdate.system.arts[artType][a.key] = {};
          actorUpdate.system.arts[artType][a.key].xp = xps < 0 ? 0 : xps;
        }

        promises.push(
          this.actor.deleteEmbeddedDocuments(
            "Item",
            this.item.system.progress.newSpells.map((e) => e.id)
          )
        );

        promises.push(this.actor.update(actorUpdate, { render: true }));
        promises.push(this.actor.updateEmbeddedDocuments("Item", updateData, { render: true }));

        if (["visExtraction", "visStudy", "minorEnchantment"].includes(this.item.system.activity)) {
          // delete the diary entry
          promises.push(this.actor.deleteEmbeddedDocuments("Item", [this.item.id], {}));
          await Promise.all(promises);
          return;
        }
        break;
      }
      case "aging": {
        let confirmed = await getConfirmation(
          game.i18n.localize("arm5e.aging.rollback.title"),
          game.i18n.localize("arm5e.aging.rollback.confirm"),
          ArM5eActorSheet.getFlavor(this.item.actor?.type)
        );
        if (!confirmed) {
          await Promise.all(promises);
          return;
        }
        let actorUpdate = {
          "system.states.pendingCrisis": false
        };

        let effects = this.item.getFlag("arm5e", "effect");
        if (effects.apparent) {
          actorUpdate.system.apparent = { value: actor.system.apparent.value - 1 };
        }
        if (effects.charac) {
          actorUpdate.system.characteristics = {};
        }
        for (let [char, stats] of Object.entries(effects.charac)) {
          let newAgingPts = actor.system.characteristics[char].aging - stats.aging;
          let currentCharValue = actor.system.characteristics[char].value;
          if (stats.score) {
            // characteristic was reduced
            actorUpdate.system.characteristics[char] = {
              value: currentCharValue + 1,
              aging: Math.max(0, Math.abs(currentCharValue + 1) - stats.aging)
            };
          } else {
            actorUpdate.system.characteristics[char] = {
              value: currentCharValue,
              aging: newAgingPts < 0 ? 0 : newAgingPts
            };
          }
        }
        let newDecrepitude = actor.system.decrepitude.points - effects.decrepitude;
        actorUpdate.system.decrepitude = { points: newDecrepitude < 0 ? 0 : newDecrepitude };
        if (this.item.system.dates[0].season == "winter") {
          let newWarping =
            actor.system.warping.points - CONFIG.ARM5E.activities.aging.warping.impact;
          actorUpdate.system.warping = { points: newWarping < 0 ? 0 : newWarping };
        }
        promises.push(this.actor.update(actorUpdate, {}));
        promises.push(this.actor.deleteEmbeddedDocuments("Item", [this.item.id], {}));
        await Promise.all(promises);
        return;
        break;
      }
    }
    let description = this.item.system.description + "<h4>Rollbacked<h4>";
    promises.push(
      this.item.update({
        system: { done: false, description: description }
      })
    );

    await Promise.all(promises);
  }

  async addNewSpell(spell) {
    let newSpells = this.item.system.progress.newSpells;
    newSpells.push(ArM5eItemDiarySheet._addNewSpell(spell));
    const updateData = {};
    updateData["system.progress.newSpells"] = newSpells;
    await this.item.update(updateData);
  }

  static _addNewSpell(spell) {
    let system = foundry.utils.duplicate(spell.system);
    spell.type = "spell";
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

  async addAbility(ability) {
    await this.item.update(this._addAbility(ability), {});
  }

  _addAbility(ability) {
    let currentData = this.item.system.progress["abilities"];
    let updateData = {};
    let ID = "DROPPED";
    let secondaryId = false;
    if (ability.isOwned && ability.actor._id == this.item.actor._id) {
      // check if it is owned by the character
      log(false, "Owned by the character");
      ID = ability._id;
    } else {
      // check if the character already has that skill and use it instead
      let actorAbility = this.item.actor.system.abilities.find(
        (e) => e.system.key == ability.system.key && e.system.option == ability.system.option
      );
      if (actorAbility) {
        ability = actorAbility;
        ID = actorAbility._id;
      } else {
        secondaryId = true;
        // remove any original actor related stuff
        if (ability instanceof CONFIG.Item.documentClass) {
          ability.updateSource({ system: { xp: 0, speciality: "" } });
        }
      }
    }

    const data = {
      id: ID,
      secondaryId: secondaryId,
      category: CONFIG.ARM5E.LOCALIZED_ABILITIES[ability.system.key]?.category ?? "general",
      name: ability.name,
      currentXp: ability.system.xp,
      key: ability.system.key,
      option: ability.system.option,
      xpNextLevel: ability.system.xpNextLevel,
      teacherScore: this.item.system.teacher.score,
      xp: 0
    };
    currentData.push(data);
    updateData[`system.progress.abilities`] = currentData;
    return updateData;
  }

  async _onProgressControl(event) {
    event.preventDefault();
    const button = event.currentTarget;
    // no edit possible if applied
    if (this.item.system.done || this.item.system.activity === "reading") {
      return;
    }
    // let currentData = Object.values(this.item.system.progress[button.dataset.type]) ?? [];
    let currentData = this.item.system.progress[button.dataset.type];
    let updateData = {};
    // debug("ADD progress item");
    switch (button.dataset.type) {
      case "abilities": {
        switch (button.dataset.action) {
          case "add":
            // get first ability of the tree
            let newAb;

            const hasTeacher = ["training", "teaching"].includes(this.item.system.activity);
            // check if the
            if (button.dataset.default.length == 16 && button.dataset.secondary === "false") {
              newAb = this.actor.items.get(button.dataset.default);
              newAb.secondaryId = false;
            } else {
              if (this.item.system.teacher.id !== null) {
                let teacher = game.actors.get(this.item.system.teacher.id);
                newAb = teacher.system.abilities.find(
                  (e) =>
                    e.system.key == button.dataset.defaultkey &&
                    e.system.option == button.dataset.defaultoption
                );
                newAb.secondaryId = true;
              } else {
                newAb = CONFIG.ARM5E.LOCALIZED_ABILITIES_ENRICHED.find(
                  (e) => e._id === button.dataset.default
                );
              }
            }

            let tScore = 0;
            if (hasTeacher) {
              if (this.item.system.teacher.id === null) {
                tScore = button.dataset.teacherscore;
              } else {
                let teacher = game.actors.get(this.item.system.teacher.id);
                tScore = teacher.getAbilityStatsForActivity(
                  newAb.system.key,
                  newAb.system.option
                ).score;
              }
            }

            const data = {
              id: newAb._id,
              key: newAb.system.key,
              option: newAb.system.option,
              category: newAb.system.category,
              name: newAb.name,
              currentXp: newAb.system.xp,
              secondaryId: newAb.secondaryId,
              teacherScore: tScore,
              xp: 0
            };

            currentData.push(data);
            updateData[`system.progress.abilities`] = currentData;
            await this.item.update(updateData, {});
            break;
          case "delete":
            const idx = Number(button.dataset.idx);
            currentData.splice(idx, 1);
            button.closest(".diary-progress").remove();
            updateData[`system.progress.abilities`] = currentData;
            await this.item.update(updateData, {});
            break;
          default:
        }
        break;
      }
      case "arts": {
        switch (button.dataset.action) {
          case "add":
            const data = {
              key: button.dataset.default,
              teacherScore: button.dataset.teacherscore,
              xp: 0
            };
            currentData.push(data);
            updateData[`system.progress.arts`] = currentData;
            await this.item.update(updateData, {});
            break;
          case "delete":
            const idx = Number(button.dataset.idx);
            currentData.splice(idx, 1);
            button.closest(".diary-progress").remove();
            updateData[`system.progress.arts`] = currentData;
            await this.item.update(updateData, {});
            break;
          default:
        }
        break;
      }
      case "spells": {
        switch (button.dataset.action) {
          case "add":
            // get first spell of the tree
            const newSpell = this.actor.items.get(button.dataset.default);

            let tScore = 0;
            if (["training", "teaching"].includes(this.item.system.activity)) {
              if (this.item.system.teacher.id === null) {
                tScore = Number(button.dataset.teacherscore);
              } else {
                let teacher = game.actors.get(this.item.system.teacher.id);
                let similarSpells = teacher.getSimilarSpell(
                  newSpell.system.level,
                  newSpell.system.technique.value,
                  newSpell.system.form.value
                );
                tScore =
                  similarSpells instanceof Array
                    ? similarSpells.system.finalScore[0]
                    : similarSpells.system.finalScore;
              }
            }

            const data = {
              id: newSpell.id,
              form: newSpell.system.form.value,
              name: newSpell.name,
              currentXp: newSpell.system.xp,
              teacherScore: tScore,
              // xpNextLevel: newSpell.system.xpNextLevel,
              xp: 0
            };

            currentData.push(data);
            updateData[`system.progress.spells`] = currentData;
            await this.item.update(updateData, {});
            break;
          case "delete":
            const idx = Number(button.dataset.idx);
            currentData.splice(idx, 1);
            button.closest(".diary-progress").remove();
            updateData[`system.progress.spells`] = currentData;
            await this.item.update(updateData, {});
            break;
          default:
        }
        break;
      }
      case "newSpells": {
        switch (button.dataset.action) {
          case "delete":
            const idx = Number(button.dataset.idx);
            currentData.splice(idx, 1);
            button.closest(".diary-progress").remove();
            updateData[`system.progress.newSpells`] = currentData;
            await this.item.update(updateData, {});
            break;
          default:
        }
        break;
      }
    }
    return currentData;
  }

  async _setTeacher(actor) {
    log(false, "Dropped actor as teacher: " + actor);
    let teaching = actor.getAbilityStats("teaching");
    let updateData = {};
    updateData["system.teacher"] = {
      id: actor.id,
      name: actor.name,
      com: actor.system.characteristics.com.value,
      teaching: teaching.score,
      speciality: teaching.speciality,
      score: 0
    };
    updateData[`system.progress.abilities`] = [];
    updateData[`system.progress.arts`] = [];
    updateData[`system.progress.spells`] = [];
    updateData[`system.progress.newSpells`] = [];
    await this.item.update(updateData);
    // return this.submit({ preventClose: true, updateData: updateData }).then(() => this.render());
  }

  async _setCategory(event) {
    event.preventDefault();
    let updateData = {};
    const target = event.currentTarget;
    const idx = target.dataset.index;
    const value = $(target).val();
    const progressType = target.dataset.type;
    let currentData = this.item.system.progress[progressType];
    switch (progressType) {
      case "abilities":
        currentData[idx] = this.item.system.ownedAbilities[value][0];
        currentData[idx].xp = 0;
        updateData[`system.progress.abilities`] = currentData;
        break;
      case "spells":
        currentData[idx] = this.item.system.ownedSpells[value][0];
        currentData[idx].xp = 0;
        updateData[`system.progress.spells`] = currentData;
        break;
    }

    return this.submit({ preventClose: true, updateData: updateData }).then(() => this.render());
  }

  async _setAbility(event) {
    event.preventDefault();
    let updateData = {};
    const target = event.currentTarget;
    const idx = target.dataset.index;
    const abilityId = $(target).val();

    let currentData = this.item.system.progress[target.dataset.type];
    let selectedAbility;
    if (abilityId.length == 16) {
      selectedAbility = this.actor.items.get(abilityId);
      if (selectedAbility === undefined) {
        let teacher = game.actors.get(this.item.system.teacher.id);
        selectedAbility = teacher.items.get(abilityId);
        selectedAbility.secondaryId = true;
      } else {
        selectedAbility.secondaryId = false;
      }
    } else {
      selectedAbility = CONFIG.ARM5E.LOCALIZED_ABILITIES_ENRICHED.find((e) => e._id === abilityId);
    }
    let teacherScore = Object.values(
      this.item.system.ownedAbilities[selectedAbility.system.category]
    ).find((e) => {
      return e.key === selectedAbility.system.key && e.option === selectedAbility.system.option;
    }).teacherScore;
    const data = {
      id: selectedAbility._id,
      name: selectedAbility.name,
      category: selectedAbility.system.category,
      currentXp: selectedAbility.system.xp,
      key: selectedAbility.system.key,
      option: selectedAbility.system.option,
      secondaryId: selectedAbility.secondaryId,
      // xpNextLevel: selectedAbility.system.xpNextLevel,
      xp: 0,
      teacherScore: teacherScore
    };
    currentData[idx] = data;
    updateData[`system.progress.abilities`] = currentData;
    return this.submit({ preventClose: true, updateData: updateData }).then(() => this.render());
  }

  async _setArt(event) {
    event.preventDefault();
    let updateData = {};
    const target = event.currentTarget;
    const idx = target.dataset.index;
    const value = $(target).val();
    let currentData = this.item.system.progress[target.dataset.type];
    const data = {
      key: value,
      xp: 0,
      teacherScore: this.item.system.ownedArts.find((e) => {
        return e.key === value;
      }).teacherScore
    };
    currentData[idx] = data;
    updateData[`system.progress.arts`] = currentData;
    return this.submit({ preventClose: true, updateData: updateData }).then(() => this.render());
  }

  async _showSpell(item, event) {
    let index = Number(event.currentTarget.dataset.index);
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

  async displayCalendar() {
    if (this.item.isOwned) {
      const calendar = new ActivitySchedule({
        actor: this.item.actor,
        activity: {
          id: this.item.id,
          name: this.item.name,
          img: this.item.img,
          system: foundry.utils.deepClone(this.item.system)
        }
      });
      const res = await calendar.render(true);
    }
  }

  async _updateObject(event, formData) {
    const expanded = foundry.utils.expandObject(formData);
    const source = this.object.toObject();
    const abilities = expanded?.system?.progress?.abilities;
    let options = { diff: false, recursive: true };
    if (abilities) {
      foundry.utils.mergeObject(source.system.progress.abilities, abilities);
      expanded.system.progress.abilities = source.system.progress.abilities;
    }

    const spells = expanded?.system?.progress?.spells;
    if (spells) {
      foundry.utils.mergeObject(source.system.progress.spells, spells);
      expanded.system.progress.spells = source.system.progress.spells;
    }

    const arts = expanded?.system?.progress?.arts;
    if (arts) {
      foundry.utils.mergeObject(source.system.progress.arts, arts);
      expanded.system.progress.arts = source.system.progress.arts;
    }

    const newSpells = expanded?.system?.progress?.newSpells;
    if (newSpells) {
      foundry.utils.mergeObject(source.system.progress.newSpells, newSpells);
      expanded.system.progress.newSpells = source.system.progress.newSpells;
    }

    const dates = expanded?.system?.dates;
    if (dates) {
      foundry.utils.mergeObject(source.system.dates, dates);
      expanded.system.dates = source.system.dates;
      if (expanded.system.duration) {
        expanded.system.dates.splice(expanded.system.duration);
      }
    }
    // log(false, `Update object: ${JSON.stringify(expanded)}`);
    await this.object.update(expanded, options);
  }
}
