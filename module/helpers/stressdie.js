import { log } from "../tools.js";

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
    super.evaluate();
    if (this.results[0].result === 10) {
      this.number = this.options.ddd;
      this._evaluated = false;
      this.modifiers = ["cs=10"];
      super.evaluate();
      return this;
    }
    this.explode("x=1");
    return this;
  }

  get total() {
    if (!this._evaluated) return null;
    if (this.modifiers.length > 0) return 1 - super.total;
    return this.results.reduce((t, r, i, a) => {
      if (!r.active) return t;
      if (i === 0 && r.result === 10) {
        return 0;
      }
      if (i === 0 && r.result === 1) return 2;
      if (i === 0 && r.result !== 10 && r.result !== 1) return r.result;
      if (r.result === 1) return t * 2;
      return t * r.result;
    }, 0);
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

  async evaluate({ minimize = false, maximize = false, async = true } = {}) {
    this.number = 1; // only ever one dice
    super.evaluate({ minimize: minimize, maximize: maximize, async: async });
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
      // if (r.result === 1) return t * 2;
      // return t * r.result;
    }, 0);
  }
}
