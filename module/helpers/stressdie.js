import { log } from "../tools.js";

// WIP
export class ArsRoll extends Roll {
  constructor(formula, data = {}, options = {}) {
    super(formula, data, options);
    this.originalFormula = formula;
  }
  // number of botches
  // botches = 0;
  // for calculating modifier
  // divider = 1;
  // multiplier = 1;
  //
  offset = 0;

  get botchDice() {
    if (!this._evaluated) return 0;
    if (this.dice.length > 1) {
      return 0;
    }
    const theDie = this.dice[0];
    // if (
    //   theDie instanceof StressDie ||
    //   theDie instanceof StressDieInternal ||
    //   theDie instanceof AlternateStressDie
    // ) {
    return theDie.options.botchDice;
    // }
    // return 0;
  }

  set botchDice(val) {
    if (!this._evaluated || this.dice.length > 1) {
      return;
    }
    const theDie = this.dice[0];
    if (
      !(theDie instanceof StressDie) &&
      !(theDie instanceof StressDieInternal) &&
      !(theDie instanceof AlternateStressDie)
    ) {
      theDie.options.botchDice = val;
    }
  }

  get total() {
    if (!this._evaluated) return null;
    if (this.dice.length > 1) {
      return super.total;
    }
    const theDie = this.dice[0];
    if (
      !(theDie instanceof StressDie) &&
      !(theDie instanceof StressDieInternal) &&
      !(theDie instanceof AlternateStressDie)
    ) {
      return super.total;
    }
    if (theDie.botchCheck) {
      this.options.botchCheck = true;
      this.options.botches = -theDie.total;
      if (this.botches) {
        return 0;
      } else {
        return super.total + this.botches;
      }
    }
    return super.total;
  }

  get desc() {
    if (!this._evaluated) return "";

    if (this.botchCheck) {
      if (this.botches == 0) {
        return `${super.total}`;
      } else if (this.botches == 1) {
        return game.i18n.localize("arm5e.messages.die.botch");
      } else {
        return game.i18n.format("arm5e.messages.die.botches", { num: this.botches });
      }
    } else {
      return `${super.total}`;
    }
  }

  get divider() {
    return this.options.divider || 1;
  }

  get multiplier() {
    return this.options.multiplier || 1;
  }

  get offset() {
    return this.options.offset || 0;
  }

  get botches() {
    return this.options.botches || 0;
  }

  get botchCheck() {
    return this.options.botchCheck || false;
  }

  get modifier() {
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
    log(false, `DBG: modifier - options: ${JSON.stringify(this.options)}`);

    log(
      false,
      `DBG: modifier - Roll total ${this.total} * ${this.divider} - (${this.dice[0].total} * ${this.multiplier}) `
    );
    return this.total * this.divider - this.dice[0].total * this.multiplier;
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
  async toMessage(messageData = {}, { rollMode, create = true } = {}) {
    log(
      false,
      `DBG: Roll total ${this.total} * ${this.divider} (divider) - (${this.dice[0].total} (diceTotal) * ${this.multiplier} (multiplier)) `
    );
    let msg = await super.toMessage(messageData, { rollMode, create: false });
    // add type and system data
    msg.type = this.getMessageType(messageData);
    // create the message:
    const cls = getDocumentClass("ChatMessage");
    if (create) {
      return cls.create(msg, { rollMode, create });
    } else {
      return msg;
    }
  }

  getMessageType(messageData) {
    let rollType;
    if (messageData.system) {
      rollType = messageData.system.roll.type;
    } else {
      // from combat tracker
      if (messageData.flags) {
        if (messageData.flags["core.initiativeRoll"]) {
          return "combat";
        }
      }
    }
    if (["magic", "spont", "spell", "supernatural", "item", "power"].includes(rollType)) {
      return "magic";
    } else if (["init", "attack", "defense"].includes(rollType)) {
      return "combat";
    } else {
      return "roll";
    }
  }
}

export class StressDie extends foundry.dice.terms.Die {
  constructor(termData = {}) {
    termData.faces = 10;
    super(termData);
    if (typeof this.faces !== "number") {
      throw new Error("A StressDie term must have a numeric number of faces.");
    }
  }

  // whether we are botch checking
  get botchCheck() {
    return this._evaluated && this.results[0].result === 10;
  }

  /** @inheritdoc */
  static DENOMINATION = "s";

  async evaluate() {
    this.options.botchDice = this.number;
    this.number = 1;
    this.modifiers = ["x=1"];

    await super.evaluate();
    if (this.results[0].result === 10) {
      this.number = this.options.botchDice + 1;
      this._evaluated = false;
      this.modifiers = ["cf=10"];
      await super.evaluate();
      return this;
    }

    return this;
  }

  get total() {
    if (!this._evaluated) return null;
    if (this.botchCheck) {
      this.botches = super.total - 1;
      return -this.botches;
    }
    const res = this.results.reduce((t, r, i, a) => {
      // log(false, `DBG: total.reduce res=${r.result}, i=${i} * t=${t} ; ${r.active}) `);
      if (!r.active) {
        return t;
      }
      if (i === 0 && r.result === 10) {
        return 0;
      }
      if (i === 0 && r.result === 1) {
        return 2;
      }
      if (i === 0 && r.result !== 10 && r.result !== 1) return r.result;
      if (r.result === 1) return t * 2;
      return t * r.result;
    }, 0);
    // log(false, `DBG: total=${res}`);
    return res;
  }

  /* -------------------------------------------- */

  /**
   * Render the tooltip HTML for a Roll instance
   * @returns {object}      The data object used to render the default tooltip template for this DiceTerm
   */
  getTooltipData() {
    log(false, "GetTooltipdata");
    return super.getTooltipData();
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
export class StressDieInternal extends foundry.dice.terms.Die {
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

export class AlternateStressDie extends foundry.dice.terms.Die {
  constructor(termData = {}) {
    termData.faces = 10;
    super(termData);
    if (typeof this.faces !== "number") {
      throw new Error("A StressDie term must have a numeric number of faces.");
    }
  }

  // whether we are botch checking
  get botchCheck() {
    return this._evaluated && this.results[0].result === 1;
  }

  /** @inheritdoc */
  static DENOMINATION = "a";

  async evaluate() {
    this.options.botchDice = this.number;
    this.number = 1;
    this.modifiers = ["x=10"];

    await super.evaluate();
    if (this.results[0].result === 1) {
      // this.results[0].result = 0;
      this.number = this.options.botchDice + 1;
      this._evaluated = false;
      this.modifiers = ["cf=1"];
      this.botchCheck = true;
      await super.evaluate();
      return this;
    }

    return this;
  }

  get total() {
    if (!this._evaluated) return null;
    if (this.botchCheck) return super.total - 1;
    const res = this.results.reduce((t, r, i, a) => {
      // log(false, `DBG: total.reduce res=${r.result}, i=${i} * t=${t} ; ${r.active}) `);
      if (!r.active) {
        return t;
      }
      if (i === 0 && r.result === 1) {
        return 0;
      }
      if (i === 0 && r.result === 10) {
        return 10;
      }
      if (i === 0 && r.result !== 10 && r.result !== 1) return r.result;
      if (r.result === 10) return t + 10;
      return t + r.result;
    }, 0);
    log(false, `DBG: total=${res}`);
    return res;
  }

  /* -------------------------------------------- */

  /**
   * Render the tooltip HTML for a Roll instance
   * @returns {object}      The data object used to render the default tooltip template for this DiceTerm
   */
  getTooltipData() {
    log(false, "GetTooltipdata");
    return super.getTooltipData();
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
