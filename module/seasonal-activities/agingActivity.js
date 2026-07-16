import { ARM5E } from "../config.js";

import { Activity } from "./activity.js";
import { getConfirmation } from "../ui/dialogs.js";
import { ArM5eActorSheetV2 } from "../sheets/actor/actor-sheet-v2.js";

function validAging(context, actor, item) {
  if (actor.system.description.born.value === null) {
    context.system.applyError = game.i18n.localize("arm5e.activity.msg.noYearOfBirth");
  }
  if (context.firstSeason.season !== "winter") {
    context.system.applyInfo = game.i18n.localize("arm5e.activity.msg.agingInWinter");
    context.unnaturalAging = true;
  }
}

export class AgingActivity extends Activity {
  constructor(actorUuid) {
    super(actorUuid, "aging");
  }

  validateDiary(context, actor, item) {
    this.validateDiarySchedule(context, actor, item);
    if (!context.system.applyPossible) {
      return;
    }
    validAging(context, actor, item);
  }

  async apply(sheet, context, progressData, options) {
    return await super.apply(sheet, context, progressData, options);
  }

  async rollback(sheet, state) {
    const confirmed = await getConfirmation(
      game.i18n.localize("arm5e.aging.rollback.title"),
      game.i18n.localize("arm5e.aging.rollback.confirm"),
      ArM5eActorSheetV2.getFlavor(sheet.item.actor?.type)
    );
    if (!confirmed) {
      await Promise.all(state.promises);
      return true;
    }

    const sysActorUpdate = { "states.pendingCrisis": false };
    const effects = sheet.item.getFlag(ARM5E.SYSTEM_ID, "effect");

    if (effects?.apparent) {
      sysActorUpdate.apparent = { value: sheet.actor.system.apparent.value - 1 };
    }
    if (effects?.charac) {
      sysActorUpdate.characteristics = {};
    }
    for (const [char, stats] of Object.entries(effects?.charac ?? {})) {
      const currentCharValue = sheet.actor.system.characteristics[char].value;
      if (stats.score) {
        sysActorUpdate.characteristics[char] = {
          value: currentCharValue + 1,
          aging: Math.max(0, Math.abs(currentCharValue + 1) - stats.aging)
        };
      } else {
        const newAgingPts = sheet.actor.system.characteristics[char].aging - stats.aging;
        sysActorUpdate.characteristics[char] = {
          value: currentCharValue,
          aging: newAgingPts < 0 ? 0 : newAgingPts
        };
      }
    }

    const newDecrepitude = sheet.actor.system.decrepitude.points - (effects?.decrepitude ?? 0);
    sysActorUpdate.decrepitude = { points: newDecrepitude < 0 ? 0 : newDecrepitude };

    if (sheet.item.system.dates[0]?.season === "winter") {
      const newWarping =
        sheet.actor.system.warping.points - CONFIG.ARM5E.activities.aging.warping.impact;
      sysActorUpdate.warping = { points: newWarping < 0 ? 0 : newWarping };
    }

    state.promises.push(sheet.actor.update({ system: sysActorUpdate }, {}));
    return await this.deleteDiary(sheet, state.promises);
  }
}
