import { Activity } from "./activity.js";

export class DiaryActivity extends Activity {
  constructor(actorUuid) {
    super(actorUuid, "none");
  }
}

export class AgingActivity extends Activity {
  constructor(actorUuid) {
    super(actorUuid, "aging");
  }
}

export class TwilightActivity extends Activity {
  constructor(actorUuid) {
    super(actorUuid, "twilight");
  }
}

export class RecoveryActivity extends Activity {
  constructor(actorUuid) {
    super(actorUuid, "twilight");
  }
}

export class VisStudy extends Activity {
  constructor(actorUuid) {
    super(actorUuid, "visStudy");
  }
}

export class ProgressActivity extends Activity {
  application(diary) {
    return diary.progressApply();
  }
}

export class BookActivity extends ProgressActivity {
  constructor(actorUuid, book, type) {
    super(actorUuid, type);
    this.book = book;
  }
}

export class ResourceActivity extends Activity {
  constructor(actorUuid, type) {
    super(actorUuid, type);
  }
  application(diary) {
    return diary.progressApply();
  }
}
