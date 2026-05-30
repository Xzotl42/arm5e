import { Activity } from "./activity.js";

function validVisStudy(context, actor, item) {
  context.system.totalXp = { abilities: 0, arts: 0, masteries: 0, spellLevels: 0 };
  context.system.totalXp.arts +=
    Number(context.system.sourceQuality) + context.system.sourceModifier;
}

export class VisStudy extends Activity {
  constructor(actorUuid) {
    super(actorUuid, "visStudy");
  }

  validateDiary(context, actor, item) {
    this.validateDiarySchedule(context, actor, item);
    if (!context.system.applyPossible) {
      return;
    }
    validVisStudy(context, actor, item);
  }

  async apply(sheet, context, progressData, options) {
    return await super.apply(sheet, context, progressData, options);
  }

  async rollback(sheet, state) {
    await this.rollbackExternalDependencies(sheet, state.promises);
    this.queueProgressRollback(sheet, state);
    return await this.deleteDiary(sheet, state.promises);
  }
}
