import { Activity } from "./activity.js";

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
