import { log } from "../tools.js";

// WIP
export class ArsRoll extends Roll {
  constructor(formula, data = {}, options = {}) {
    super(formula, data, options);
    this.botches = 0;
    this.diviser = 1;
    this.multiplier = 1;
    this.offset = 0;
  }

  modifier() {
    if (!this.result) {
      return 0;
    }
    if (this.botches > 0) {
      return 0;
    }
    if (this.dice.length != 1) {
      log(false, "ERROR: wrong number of dice");
      return 0;
    }

    log(
      false,
      `DBG: Roll total ${this.total} * ${this.diviser} - (${this.dice[0].total} * ${this.multiplier}) `
    );
    return this.total * this.diviser - this.dice[0].total * this.multiplier;
  }

  /**
   * Transform a Roll instance into a ChatMessage, displaying the roll result.
   * This function can either create the ChatMessage directly, or return the data object that will be used to create.
   *
   * @param {object} messageData          The data object to use when creating the message
   * @param {options} [options]           Additional options which modify the created message.
   * @param {string} [options.rollMode]   The template roll mode to use for the message from CONFIG.Dice.rollModes
   * @param {boolean} [options.create=true]   Whether to automatically create the chat message, or only return the
   *                                          prepared chatData object.
   * @returns {Promise<ChatMessage|object>} A promise which resolves to the created ChatMessage document if create is
   *                                        true, or the Object of prepared chatData otherwise.
   */
  // async toMessage(messageData = {}, { rollMode, create = true } = {}) {
  //   log(false, "TO_MESSAGE");
  //   super.toMessage(messageData, options);
  // if ( rollMode === "roll" ) rollMode = undefined;
  // rollMode ||= game.settings.get("core", "rollMode");

  // // Perform the roll, if it has not yet been rolled
  // if ( !this._evaluated ) await this.evaluate({allowInteractive: rollMode !== CONST.DICE_ROLL_MODES.BLIND});

  // // Prepare chat data
  // messageData = foundry.utils.mergeObject({
  //   user: game.user.id,
  //   content: String(this.total),
  //   sound: CONFIG.sounds.dice
  // }, messageData);
  // messageData.rolls = [this];

  // // Either create the message or just return the chat data
  // const cls = getDocumentClass("ChatMessage");
  // const msg = new cls(messageData);

  // // Either create or return the data
  // if ( create ) return cls.create(msg.toObject(), { rollMode });
  // else {
  //   msg.applyRollMode(rollMode);
  //   return msg.toObject();
  // }
  // }
}

export class StressDie extends Die {
  constructor(termData = {}) {
    termData.faces = 10;
    super(termData);
    if (typeof this.faces !== "number") {
      throw new Error("A StressDie term must have a numeric number of faces.");
    }

    // this.faces = 10;
  }

  /** @inheritdoc */
  static DENOMINATION = "s";

  async evaluate() {
    this.options.ddd = this.number;
    this.number = 1;
    await super.evaluate();
    if (this.results[0].result === 10) {
      this.number = this.options.ddd;
      this._evaluated = false;
      this.modifiers = ["cs=10"];
      await super.evaluate();
      return this;
    }
    this.explode("x=1");
    return this;
  }

  get total() {
    if (!this._evaluated) return null;
    if (this.modifiers.length > 0) return 1 - super.total;
    const res = this.results.reduce((t, r, i, a) => {
      log(false, `DBG: total.reduce res=${r.result}, i=${i} * t=${t} ; ${r.active}) `);
      if (!r.active) return t;
      if (i === 0 && r.result === 10) {
        return 0;
      }
      if (i === 0 && r.result === 1) return 2;
      if (i === 0 && r.result !== 10 && r.result !== 1) return r.result;
      if (r.result === 1) return t * 2;
      return t * r.result;
    }, 0);
    log(false, `DBG: total=${res}`);
    return res;
  }

  /** @inheritdoc */
  //   static MODIFIERS = {};

  /** @inheritdoc */
  //   static REGEXP = new RegExp(
  //     `^([0-9]+)?sd([A-z]|[0-9]+)${DiceTerm.MODIFIERS_REGEXP_STRING}?${DiceTerm.FLAVOR_REGEXP_STRING}?$`
  //   );

  /** @inheritdoc */
  //   get total() {
  //     return super.total();
  //   }

  //   roll({ minimize = false, maximize = false } = {}) {
  //     const roll = { result: 1, active: true };
  //     let res = 0;
  //     if (minimize) res = 1;
  //     else if (maximize) res = this.faces;
  //     else res = Math.ceil(CONFIG.Dice.randomUniform() * this.faces);

  //     if (res == 0) {
  //       roll.result = 0;
  //     } else {
  //       while (res === 1) {
  //         roll.result *= 2;
  //         res = Math.ceil(CONFIG.Dice.randomUniform() * this.faces);
  //       }
  //       roll.result *= res;
  //     }

  //     return roll;
  //   }
}
export class StressDieInternal extends Die {
  constructor(termData = {}) {
    termData.faces = 10;
    super(termData);
    if (typeof this.faces !== "number") {
      throw new Error("A StressDie term must have a numeric number of faces.");
    }
  }

  /** @inheritdoc */
  static DENOMINATION = "i";

  async evaluate({ minimize = false, maximize = false } = {}) {
    this.number = 1; // only ever one dice
    await super.evaluate({ minimize: minimize, maximize: maximize });
    if (this.results[0].result === 10) {
      this.results[0].result = 0;
      return this;
    }
    return this;
  }

  get total() {
    if (!this._evaluated) return undefined;
    if (this.modifiers.length > 0) return 1 - super.total;
    return this.results.reduce((t, r, i, a) => {
      if (!r.active) return t;
      if (i === 0 && r.result === 10) {
        return 0;
      }
      return r.result;
    }, 0);
  }
}
