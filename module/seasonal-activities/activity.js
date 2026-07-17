// Prototype WIP

import { ARM5E } from "../config.js";
import { DiaryEntrySchema } from "../schemas/diarySchema.js";
import { getActivityDefinition } from "./activity-config.js";

import { error, getDataset, log } from "../tools/tools.js";

export class Activity {
  constructor(actorUuid, type) {
    this.actorUuid = actorUuid;
    this.type = type;
  }

  async prepareData(context) {
    return context;
  }

  get title() {
    return game.i18n.localize("arm5e.activity.activity");
  }

  get definition() {
    return getActivityDefinition(this.type);
  }

  get label() {
    return this.definition.label;
  }

  get display() {
    return this.definition.display ?? {};
  }

  get source() {
    return this.definition.source ?? {};
  }

  get maxXp() {
    return this.definition.maxXp ?? 0;
  }

  get roll() {
    return this.definition.roll ?? null;
  }

  get scheduling() {
    return this.definition.scheduling ?? {};
  }

  validateDiarySchedule(context, actor, item) {
    context.partialDates = [];
    // check if there are any previous activities not applied.
    if (context.enforceSchedule && item.system.hasUnappliedActivityInThePast(actor)) {
      context.system.applyPossible = false;
      context.system.applyError = "arm5e.activity.msg.unappliedActivities";
      return;
    }

    const currentDate = game.settings.get(ARM5E.SYSTEM_ID, "currentDate");
    // check if it starts in the future
    if (
      context.firstSeason.year > currentDate.year ||
      (context.firstSeason.year === currentDate.year &&
        CONFIG.SEASON_ORDER[context.firstSeason.season] > CONFIG.SEASON_ORDER[currentDate.season])
    ) {
      context.system.applyPossible = false;
      context.system.applyError = "arm5e.activity.msg.activityStartsInFuture";
      return;
    }

    if (this.scheduling.partial && context.system.duration > 1) {
      // get how many unapplied seasons are in the past
      context.partialDates = context.system.dates.filter(
        (e) =>
          e.applied === false &&
          (e.year <= currentDate.year ||
            (e.year === currentDate.year &&
              CONFIG.SEASON_ORDER[e.season] <= CONFIG.SEASON_ORDER[currentDate.season]))
      );
      if (context.partialDates.length === 0) {
        context.system.applyPossible = false;
        context.partialApply = false;
        context.system.applyError = "arm5e.activity.msg.noProgressPossible";
      } else {
        context.partialApply = true;
      }

      if (
        context.lastSeason.year > currentDate.year ||
        (context.lastSeason.year === currentDate.year &&
          CONFIG.SEASON_ORDER[context.lastSeason.season] > CONFIG.SEASON_ORDER[currentDate.season])
      ) {
        context.system.applyPossible = false;
        context.endsInTheFuture = true;
      }
    } else if (
      context.lastSeason.year > currentDate.year ||
      (context.lastSeason.year === currentDate.year &&
        CONFIG.SEASON_ORDER[context.lastSeason.season] > CONFIG.SEASON_ORDER[currentDate.season])
    ) {
      // check if it ends in the future
      context.endsInTheFuture = true;
      context.partialApply = false;
      context.system.applyPossible = false;
      context.system.applyError = "arm5e.activity.msg.activityEndsInFuture";
    }
  }

  validateDiary(context, actor, item) {
    this.validateDiarySchedule(context, actor, item);
    if (!context.system.applyPossible) {
      return;
    }

    if (typeof this.definition.validation === "function") {
      this.definition.validation(context, actor, item);
    }
  }

  _checkForDuplicates(param, context, array) {
    // look for duplicates
    const ids = array.map((e) => e.id);
    if (
      ids.some((e) => {
        return ids.indexOf(e) !== ids.lastIndexOf(e);
      })
    ) {
      context.system.applyPossible = false;
      context.system.errorParam = param;
      context.system.applyError = "arm5e.activity.msg.duplicates";
    }
  }

  _checkArtProgressItems(context, item, max) {
    // look for duplicates arts
    const artsArr = Object.values(item.system.progress.arts);
    const artsKeys = artsArr.map((e) => e.key);
    if (
      artsKeys.some((e) => {
        return artsKeys.indexOf(e) !== artsKeys.lastIndexOf(e);
      })
    ) {
      context.system.applyPossible = false;
      context.system.applyError = "arm5e.activity.msg.duplicates";
      context.system.errorParam = "arts";
    }
    let res = 0;
    for (const a of artsArr) {
      if (a.xp < 0 || a.xp > max) {
        context.system.applyPossible = false;
        context.system.applyError = "arm5e.activity.msg.wrongSingleItemXp";
        context.system.errorParam = max;
        return 0;
      }
      res += a.xp;
    }
    return res;
  }

  _checkMaxXpPerItem(context, array, max) {
    // return the total xp
    let res = 0;
    for (const ab of array) {
      if (ab.xp < 0 || ab.xp > max) {
        context.system.applyPossible = false;
        context.system.applyError = "arm5e.activity.msg.wrongSingleItemXp";
        context.system.errorParam = max;
        return 0;
      }
      res += Number(ab.xp);
    }
    return res;
  }

  _checkIfCapped(context, teacherScore, coeff, progressItem) {
    const newXp =
      (context.system.sourceQuality +
        context.system.sourceModifier +
        context.system.sourceBonus +
        progressItem.system.xp) *
      coeff;
    const teacherXp = ArM5eActor.getAbilityXp(teacherScore);
    // TODO check/review
    if (newXp > teacherXp) {
      const newSource = teacherXp / coeff - progressItem.system.xp; // - context.system.sourceModifier;
      context.system.theoriticalSource =
        context.system.sourceQuality + context.system.sourceModifier + context.system.sourceBonus;
      context.system.sourceQuality = newSource > 0 ? newSource : 0;
      context.system.errorParam = context.system.sourceQuality;
      context.system.applyError = "arm5e.activity.msg.gainCapped";
      context.system.cappedGain = true;
    }
  }

  async activityAchievements(input) {
    return null;
  }

  async activityCosts(input) {
    return null;
  }

  async apply(sheet, context, progressData = sheet.item.system.progress, options = {}) {
    return await sheet._applyProgress(context, progressData, options);
  }

  async rollback(sheet, state) {
    return false;
  }

  queueProgressRollback(sheet, state) {
    const { actor, promises, updateData } = state;

    for (const ab of Object.values(sheet.item.system.progress.abilities ?? [])) {
      const ability = actor.items.get(ab.id);
      if (!ability) {
        continue;
      }
      const xps = Math.max(0, ability.system.xp - ab.xp);
      updateData.push({ _id: ab.id, system: { xp: xps } });
    }

    for (const s of Object.values(sheet.item.system.progress.spells ?? [])) {
      const spell = actor.items.get(s.id);
      if (!spell) {
        continue;
      }
      const xps = Math.max(0, spell.system.xp - s.xp);
      updateData.push({ _id: s.id, system: { xp: xps } });
    }

    const actorUpdate = { system: { arts: { forms: {}, techniques: {} } } };
    for (const a of Object.values(sheet.item.system.progress.arts ?? [])) {
      const artType = Object.keys(CONFIG.ARM5E.magic.techniques).includes(a.key)
        ? "techniques"
        : "forms";
      const xps = Math.max(0, actor.system.arts[artType][a.key].xp - a.xp);
      actorUpdate.system.arts[artType][a.key] = { xp: xps };
    }

    promises.push(
      actor.deleteEmbeddedDocuments(
        "Item",
        (sheet.item.system.progress.newSpells ?? []).map((entry) => entry.id)
      )
    );
    promises.push(actor.update(actorUpdate, { render: true }));
    if (updateData.length > 0) {
      promises.push(actor.updateEmbeddedDocuments("Item", updateData, { render: true }));
    }
  }

  async rollbackProgress(sheet, state) {
    this.queueProgressRollback(sheet, state);
    return await this.restoreDiary(sheet, state.promises);
  }

  async rollbackExternalDependencies(sheet, promises = []) {
    for (const dependency of sheet.item.system.externalIds ?? []) {
      if (!game.actors.has(dependency.actorId)) {
        continue;
      }
      const depActor = game.actors.get(dependency.actorId);
      if (!depActor.items.has(dependency.itemId)) {
        continue;
      }
      if (dependency.flags === 0) {
        promises.push(depActor.deleteEmbeddedDocuments("Item", [dependency.itemId], {}));
      } else if (dependency.flags === 1) {
        const depItem = depActor.items.get(dependency.itemId);
        promises.push(
          depItem.update(
            { "system.quantity": depItem.system.quantity + dependency.data.amount },
            { parent: depActor }
          )
        );
      } else if (dependency.flags === 2) {
        const depItem = depActor.items.get(dependency.itemId);
        if (depItem.type === "diaryEntry" && depItem.system.activity === "lab") {
          promises.push(depItem.update(depItem.system._rollbackSchedule(), {}));
        }
      }
    }
  }

  async restoreDiary(sheet, promises = []) {
    promises.push(
      sheet.item.update({
        system: { done: false, description: `${sheet.item.system.description}<h4>Rollbacked</h4>` }
      })
    );
    await Promise.all(promises);
    return true;
  }

  async deleteDiary(sheet, promises = []) {
    promises.push(sheet.actor.deleteEmbeddedDocuments("Item", [sheet.item.id], {}));
    await Promise.all(promises);
    return true;
  }

  getDiaryEntryData(planning) {
    let dates = DiaryEntrySchema.buildSchedule(
      planning.duration,
      planning.date.year,
      planning.date.season
    );

    return {
      name: this.getDiaryName(planning),
      type: "diaryEntry",
      system: {
        done: false,
        cappedGain: false,
        dates: dates,
        sourceQuality: this.getTargetLevel(planning),
        activity: this.type,
        progress: {
          abilities: [],
          arts: [],
          spells: [],
          newSpells: []
        },
        optionKey: "standard",
        duration: planning.duration,
        description: this.getDiaryDescription(planning),
        achievements: [],
        lab: null
      }
    };
  }

  validation(input) {
    log("false", "NO EXISTING VALIDATION ");
    return { valid: true, duration: 1, message: "No validation", waste: 0 };
  }

  async application(context, item) {}

  get template() {
    return "";
  }
}
