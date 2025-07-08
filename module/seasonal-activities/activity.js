// Prototype WIP

import { ARM5E } from "../config.js";
import { DiaryEntrySchema } from "../schemas/diarySchema.js";

import { error, getDataset, log } from "../tools.js";

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

  async activityAchievements(input) {
    return null;
  }

  async activityCosts(input) {
    return null;
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
