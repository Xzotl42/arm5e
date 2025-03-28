import { ARM5E } from "../config.js";
import { ABILITIES_DEFAULT_ICONS } from "../constants/ui.js";
import { log } from "../tools.js";
import { boolOption, itemBase, XpField } from "./commonSchemas.js";
const fields = foundry.data.fields;
export class ArtSchema extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      ...itemBase(),
      key: new fields.StringField({ required: false, blank: false, initial: "art" }),
      xp: XpField(),
      accelerated: boolOption(true),
      subtype: new fields.StringField({
        initial: "technique",
        blank: false,
        choices: ["technique", "form"]
      })
    };
  }

  static getDefault(itemData) {
    let res = itemData;

    return res;
  }

  static getIcon(item, newValue = null) {
    return "icons/magic/defensive/barrier-shield-dome-blue-purple.webp";
  }

  async increaseScore() {
    let xpMod = 0;
    if (this.parent.isOwned) {
      xpMod = this.parent.parent.system.bonuses.arts[this.key].xpMod;
    }
    let oldXp = this.xp;
    let newXp = Math.round(
      (((this.derivedScore + 1) * (this.derivedScore + 2) * (this.accelerated ? 1 : 5)) / 2 -
        xpMod) /
        this.xpCoeff
    );

    await this.parent.update(
      {
        system: {
          xp: newXp
        }
      },
      {}
    );
    let delta = newXp - oldXp;
    console.log(`Added ${delta} xps from ${oldXp} to ${newXp}`);
  }

  async decreaseScore() {
    let xpMod = 0;
    if (this.parent.isOwned) {
      xpMod = this.parent.parent.system.bonuses.arts[this.key].xpMod;
    }
    let futureXp = Math.round(
      ((this.derivedScore - 1) * this.derivedScore * (this.accelerated ? 1 : 5)) /
        (2 * this.xpCoeff)
    );
    let newXp = 0;
    if (futureXp >= Math.round(xpMod * this.xpCoeff)) {
      newXp = Math.round(
        (((this.derivedScore - 1) * this.derivedScore * (this.accelerated ? 1 : 5)) / 2 - xpMod) /
          this.xpCoeff
      );
    }
    if (newXp != this.xp) {
      await this.parent.update(
        {
          system: {
            xp: newXp
          }
        },
        {}
      );
      let delta = newXp - this.xp;
      console.log(`Removed ${delta} xps from ${this.xp} to ${newXp} total`);
    }
  }

  static migrate(itemData) {
    const updateData = {};

    return updateData;
  }

  static getArtXp(score) {
    return ((score * (score + 1)) / 2) * (this.accelerated ? 1 : 5);
  }

  // get the score given an amount of xp
  static getArtScoreFromXp(xpAmount) {
    let xp = Math.floor(xpAmount / (this.accelerated ? 1 : 5));
    let res = 0;
    while (xp > res) {
      res++;
      xp = xp - res;
    }
    return res;
  }
}
