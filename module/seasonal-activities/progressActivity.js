import { Activity } from "./activity.js";
import { AgingActivity } from "./agingActivity.js";
import {
  validAdventuring,
  validExposure,
  validPractice,
  validTraining,
  validTeaching,
  validTotalXp,
  validChildhood,
  validReading,
  validWriting,
  validCopying,
  validVisStudy
} from "./long-term-activities.js";

export class DiaryActivity extends Activity {
  constructor(actorUuid) {
    super(actorUuid, "none");
  }

  async apply(sheet, context, progressData, options) {
    return await super.apply(sheet, context, progressData, options);
  }

  async rollback(sheet, state) {
    return await super.rollback(sheet, state);
  }
}

export class TwilightActivity extends Activity {
  constructor(actorUuid) {
    super(actorUuid, "twilight");
  }

  async apply(sheet, context, progressData, options) {
    return await super.apply(sheet, context, progressData, options);
  }

  async rollback(sheet, state) {
    return await this.deleteDiary(sheet, state.promises);
  }
}

export class RecoveryActivity extends Activity {
  constructor(actorUuid) {
    super(actorUuid, "recovery");
  }

  validateDiary(context, actor, item) {
    this.validateDiarySchedule(context, actor, item);
  }

  async apply(sheet, context, progressData, options) {
    return await super.apply(sheet, context, progressData, options);
  }

  async rollback(sheet, state) {
    return await this.deleteDiary(sheet, state.promises);
  }
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

export class ProgressActivity extends Activity {
  application(diary) {
    return diary.progressApply();
  }

  validateDiary(context, actor, item) {
    this.validateDiarySchedule(context, actor, item);
    if (!context.system.applyPossible) {
      return;
    }

    const validationMap = {
      adventuring: validAdventuring,
      exposure: validExposure,
      practice: validPractice,
      training: validTraining,
      teaching: validTeaching,
      hermeticApp: validTotalXp,
      laterLife: validTotalXp,
      laterLifeMagi: validTotalXp,
      childhood: validChildhood
    };

    const validationFn = validationMap[this.type];
    if (validationFn) {
      validationFn(context, actor, item);
    }
  }

  async apply(sheet, context, progressData, options) {
    return await super.apply(sheet, context, progressData, options);
  }

  async rollback(sheet, state) {
    return await this.rollbackProgress(sheet, state);
  }
}

export class BookActivity extends ProgressActivity {
  constructor(actorUuid, book, type) {
    super(actorUuid, type);
    this.book = book;
  }

  validateDiary(context, actor, item) {
    this.validateDiarySchedule(context, actor, item);
    if (!context.system.applyPossible) {
      return;
    }

    const validationMap = {
      reading: validReading,
      writing: validWriting,
      copying: validCopying
    };

    const validationFn = validationMap[this.type];
    if (validationFn) {
      validationFn(context, actor, item);
    }
  }

  async apply(sheet, context, progressData, options) {
    return await super.apply(sheet, context, progressData, options);
  }

  async rollback(sheet, state) {
    if (this.type !== "writing") {
      return await super.rollback(sheet, state);
    }

    const dependency = sheet.item.system.externalIds?.[0];
    if (dependency) {
      const book = sheet.actor.items.get(dependency.itemId);
      if (!book) {
        await Promise.all(state.promises);
        ui.notifications.warn(game.i18n.localize("arm5e.scriptorium.msg.topicNoFound"));
        return true;
      }

      if (dependency.data.topic) {
        const topicToDelete = dependency.data.topic;
        const indexToDelete = sheet.item.system.achievements[0]?.system.topics.findLastIndex(
          (entry) =>
            entry.category === topicToDelete.category &&
            entry.level === topicToDelete.level &&
            entry.quality === topicToDelete.quality &&
            entry.type === topicToDelete.type &&
            entry.key === topicToDelete.key &&
            entry.option === topicToDelete.option &&
            entry.art === topicToDelete.art &&
            entry.author === topicToDelete.author
        );
        if (indexToDelete < 0) {
          await Promise.all(state.promises);
          ui.notifications.warn(game.i18n.localize("arm5e.scriptorium.msg.topicNoFound"));
          return true;
        }

        const topics = foundry.utils.duplicate(book.system.topics);
        topics.splice(indexToDelete, 1);
        state.promises.push(
          sheet.actor.updateEmbeddedDocuments(
            "Item",
            [{ _id: book._id, system: { topics }, "flags.arm5e.currentBookTopic": 0 }],
            {}
          )
        );
      } else if (dependency.data.topicNumber) {
        const topics = foundry.utils.duplicate(book.system.topics);
        topics.splice(dependency.data.topicIndex, dependency.data.topicNumber);
        state.promises.push(
          sheet.actor.updateEmbeddedDocuments(
            "Item",
            [{ _id: book._id, system: { topics }, "flags.arm5e.currentBookTopic": 0 }],
            {}
          )
        );
      }
    }

    return await this.deleteDiary(sheet, state.promises);
  }
}

export class ResourceActivity extends Activity {
  validateDiary(context, actor, item) {
    this.validateDiarySchedule(context, actor, item);
  }

  async apply(sheet, context, progressData, options) {
    return await super.apply(sheet, context, progressData, options);
  }

  async rollback(sheet, state) {
    return await super.rollback(sheet, state);
  }

  application(diary) {
    return diary.progressApply();
  }
}
