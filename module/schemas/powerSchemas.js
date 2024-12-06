/* eslint-disable jsdoc/require-returns-type */
import { ArM5ePCActor } from "../actor/actor.js";
import { ARM5E } from "../config.js";
import { convertToNumber, log } from "../tools.js";
import {
  authorship,
  baseDescription,
  boolOption,
  CostField,
  itemBase,
  ModifierField,
  SpellAttributes,
  TechniquesForms,
  XpField
} from "./commonSchemas.js";

const fields = foundry.data.fields;

// Number field for spell level
export const baseLevel = () =>
  new fields.NumberField({
    required: false,
    nullable: false,
    integer: true,
    positive: true,
    min: 1,
    initial: 1,
    step: 1
  });

export class PowerSchema extends foundry.abstract.DataModel {
  // TODO remove in V11
  static _enableV10Validation = true;

  static defineSchema() {
    return {
      ...itemBase(),
      form: hermeticForm(),
      init: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        initial: 0,
        step: 1
      }),
      cost: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        positive: true,
        min: 0,
        initial: 1,
        step: 1
      })
    };
  }

  static migrateData(data) {
    return data;
  }

  static migrate(itemData) {
    const updateData = migrateMagicalItem(itemData);

    if (typeof itemData.system.page !== "number") {
      updateData["system.page"] = convertToNumber(itemData.system.page, 0);
    }
    return updateData;
  }
}

export class MagicalEffectSchema extends foundry.abstract.DataModel {
  // TODO remove in V11
  static _enableV10Validation = true;

  static defineSchema() {
    return {
      ...itemBase(),
      ...TechniquesForms(),
      ...SpellAttributes(),
      baseLevel: baseLevel(),
      baseEffectDescription: baseDescription(),
      applyFocus: boolOption(false, true)
    };
  }

  static migrate(itemData) {
    const updateData = migrateMagicalItem(itemData);

    if (typeof itemData.system.page !== "number") {
      updateData["system.page"] = convertToNumber(itemData.system.page, 0);
    }
    if (typeof itemData.system.complexity !== "number") {
      updateData["system.complexity"] = convertToNumber(itemData.system.complexity, 0);
    }

    return updateData;
  }
}

export class SpellSchema extends foundry.abstract.DataModel {
  // TODO remove in V11
  static _enableV10Validation = true;

  static defineSchema() {
    return {
      ...itemBase(),
      ...TechniquesForms(),
      ...SpellAttributes(),
      baseLevel: baseLevel(),
      baseEffectDescription: baseDescription(),
      applyFocus: boolOption(false, true),
      ritual: boolOption(),
      bonus: ModifierField(),
      bonusDesc: baseDescription(),
      xp: XpField(),
      masteryAbilities: baseDescription(),
      general: boolOption(),
      levelOffset: ModifierField()
    };
  }

  /**
   * @description update Item fields with data from the owner
   * @returns void
   */
  prepareOwnerData() {
    if (!this.parent.isOwned) return;

    const owner = this.parent.actor;

    this.xpCoeff = owner.system.bonuses.arts.masteryXpCoeff;
    this.xpBonus = owner.system.bonuses.arts.masteryXpMod;
    this.derivedScore = ArM5ePCActor.getAbilityScoreFromXp(
      Math.round((this.xp + this.xpBonus) * this.xpCoeff)
    );

    this.xpNextLevel = Math.round(ArM5ePCActor.getAbilityXp(this.derivedScore + 1) / this.xpCoeff);
    this.remainingXp = this.xp + this.xpBonus;

    this.finalScore = this.derivedScore;
  }

  static getIcon(item, newValue = null) {
    if (newValue !== null) {
      return `systems/arm5e/assets/magic/${newValue}.png`;
    } else {
      let init = "an";
      if (item.system?.form?.value !== undefined) {
        init = item.system.form.value;
      }
      return `systems/arm5e/assets/magic/${init}.png`;
    }
  }

  async increaseScore() {
    let xpMod = this.parent.parent.system.bonuses.arts.masteryXpMod;
    let oldXp = this.xp;
    let newXp = Math.round(
      (((this.derivedScore + 1) * (this.derivedScore + 2) * 5) / 2 - xpMod) / this.xpCoeff
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

  async decreaseScore(item) {
    let xpMod = this.parent.parent.system.bonuses.arts.masteryXpMod;
    let futureXp = Math.round(
      ((this.derivedScore - 1) * this.derivedScore * 5) / (2 * this.xpCoeff)
    );
    let newXp = 0;
    if (futureXp >= Math.round(xpMod * this.xpCoeff)) {
      newXp = Math.round(
        (((this.derivedScore - 1) * this.derivedScore * 5) / 2 - xpMod) / this.xpCoeff
      );
    }
    if (newXp !== this.xp) {
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

  static migrateData(data) {
    return data;
  }

  static migrate(itemData) {
    const updateData = migrateMagicalItem(itemData);
    if (typeof itemData.system.page !== "number") {
      updateData["system.page"] = convertToNumber(itemData.system.page, 0);
    }

    if (typeof itemData.system.xp !== "number") {
      updateData["system.xp"] = convertToNumber(itemData.system.xp, 0);
    }

    if (typeof itemData.system.complexity !== "number") {
      updateData["system.complexity"] = convertToNumber(itemData.system.complexity, 0);
    }
    // Else if (itemData.system.complexity < 0) {
    //   updateData["system.complexity"] = 0;
    //   ChatMessage.create({
    //     content:
    //       "<b>Migration notice</b><br/>" +
    //       `The Item of type: ${itemData.type} named ${itemData.name}` +
    //       ` had a negative complexity of ${itemData.system.complexity}, ` +
    //       `please review its new level (original: ${itemData.system.level}) and ` +
    //       ` use rather the levelOffset field for general spells<br/>`
    //   });
    // }

    if (typeof itemData.system.bonus !== "number") {
      updateData["system.bonus"] = convertToNumber(itemData.system.bonus, 0);
    }

    return updateData;
  }
}

export class LabTextSchema extends foundry.abstract.DataModel {
  // TODO remove in V11
  static _enableV10Validation = true;

  static defineSchema() {
    return {
      ...itemBase(),
      ...authorship(),
      type: new fields.StringField({
        required: false,
        blank: false,
        initial: "spell",
        choices: Object.keys(ARM5E.lab.labTextType)
      }),
      ...TechniquesForms(),
      ...SpellAttributes(),
      ...EnchantmentAttributes(),
      baseLevel: baseLevel(),
      level: baseLevel(),
      baseEffectDescription: baseDescription(),
      ritual: boolOption(),
      cost: CostField("priceless"),
      quantity: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        min: 0, // Allow quantity of 0 to keep an eye on what is missing
        initial: 1,
        step: 1
      }),
      img: new fields.StringField({
        required: false,
        blank: true,
        initial: ""
      }),
      draft: boolOption(false)
    };
  }

  sanitize() {
    return LabTextSchema.sanitizeData(this.toObject());
  }

  get buildPoints() {
    return Math.ceil(this.level / 5) * this.quantity;
  }

  static sanitizeData(data) {
    if (data.type !== "raw") {
      data.description = "";
    }
    return data;
  }

  static migrate(itemData) {
    // Console.log(`Migrate book: ${JSON.stringify(itemData)}`);
    const updateData = migrateMagicalItem(itemData);

    if (itemData.system.year == null) {
      updateData["system.year"] = 1220;
    }
    if (typeof itemData.system.complexity !== "number") {
      updateData["system.complexity"] = convertToNumber(itemData.system.complexity, 0);
    }
    return updateData;
  }
}

// Unfortunately, since the duration was a free input field, it has to be guessed
/**
 *
 * @param name
 * @param value
 */
function _guessDuration(name, value) {
  if (value && value !== "") {
    switch (value.toLowerCase().trim()) {
      case "moment":
      case "momentary":
      case "mom":
      case game.i18n.localize("arm5e.spell.durations.moment"):
        return "moment";
      case "diameter":
      case "dia":
      case "diam":
        return "diam";
      case "concentration":
      case game.i18n.localize("arm5e.spell.durations.conc"):
        return "conc";
      case "sun":
      case game.i18n.localize("arm5e.spell.durations.sun"):
        return "sun";
      case "ring":
      case game.i18n.localize("arm5e.spell.durations.ring"):
        return "ring";
      case "moon":
      case game.i18n.localize("arm5e.spell.durations.moon"):
        return "moon";
      case "fire":
      case game.i18n.localize("arm5e.spell.durations.fire"):
        return "fire";
      case "bargain":
      case "barg":
      case game.i18n.localize("arm5e.spell.durations.barg"):
        return "bargain";
      case "year":
      case game.i18n.localize("arm5e.spell.durations.year"):
        return "year";
      case "condition":
      case "cond":
      case game.i18n.localize("arm5e.spell.durations.condition"):
        return "condition";
      case "year+1":
      case game.i18n.localize("arm5e.spell.durations.year+1"):
        return "year+1";
      case "special":
      case "spe":
      case "spec":
      case game.i18n.localize("arm5e.spell.special"):
        return "special";
      default:
        break;
    }
  }
  ChatMessage.create({
    content:
      "<b>MIGRATION NOTIFICATION</b><br/>" +
      `Warning: Unable to guess duration \"${value}\" of ${name}, you will have to set it back manually. ` +
      `It has been reset to ${game.i18n.localize("arm5e.spell.durations.moment")}</b>`
  });
  console.warn(`Duration \"${value}\" of spell ${name} could not be guessed`);
  return "moment";
}

// Unfortunately, since the range was a free input field, it has to be guessed
/**
 *
 * @param name
 * @param value
 */
function _guessRange(name, value) {
  if (value && value !== "") {
    switch (value.toLowerCase()) {
      case "personnal":
      case "pers":
      case "per":
      case game.i18n.localize("arm5e.spell.ranges.personal"):
        return "personal";
      case "touch":
      case game.i18n.localize("arm5e.spell.ranges.touch"):
        return "touch";
      case "eye":
      case game.i18n.localize("arm5e.spell.ranges.eye"):
        return "eye";
      case "voice":
      case game.i18n.localize("arm5e.spell.ranges.voice"):
        return "voice";
      case "road":
      case game.i18n.localize("arm5e.spell.ranges.road"):
        return "road";
      case "sight":
      case game.i18n.localize("arm5e.spell.ranges.sight"):
        return "sight";
      case "arc":
      case "arcane connection":
      case game.i18n.localize("arm5e.spell.ranges.arc"):
        return "arc";
      case "special":
      case "spe":
      case "spec":
      case game.i18n.localize("arm5e.spell.special"):
        return "special";
      default:
        break;
    }
  }
  ChatMessage.create({
    content:
      "<b>MIGRATION NOTIFICATION</b><br/>" +
      `Warning: Unable to guess range \"${value}\" of ${name}, you will have to set it back manually. ` +
      `It has been reset to ${game.i18n.localize("arm5e.spell.ranges.personal")}</b>`
  });
  console.warn(`Range \"${value}\" of spell ${name} could not be guessed`);
  return "personal";
}

// Unfortunately, since the target was a free input field, it has to be guessed
/**
 *
 * @param name
 * @param value
 */
function _guessTarget(name, value) {
  if (value && value !== "") {
    switch (value.toLowerCase().trim()) {
      case "individual":
      case "ind":
      case "indiv":
      case game.i18n.localize("arm5e.spell.targets.ind"):
        return "ind";
      case "circle":
      case "cir":
      case game.i18n.localize("arm5e.spell.targets.circle"):
        return "circle";
      case "part":
      case "par":
      case game.i18n.localize("arm5e.spell.targets.part"):
        return "part";
      case "group":
      case "gro":
      case "grp":
      case game.i18n.localize("arm5e.spell.targets.group"):
        return "group";
      case "room":
      case game.i18n.localize("arm5e.spell.targets.room"):
        return "room";
      case "struct":
      case "str":
      case game.i18n.localize("arm5e.spell.targets.struct"):
        return "struct";
      case "boundary":
      case "bound":
      case "bou":
      case game.i18n.localize("arm5e.spell.targets.bound"):
        return "bound";
      case "taste":
      case "tas":
      case game.i18n.localize("arm5e.spell.targets.taste"):
        return "taste";
      case "hearing":
      case "hea":
      case game.i18n.localize("arm5e.spell.targets.hearing"):
        return "hearing";
      case "touch":
      case "tou":
      case game.i18n.localize("arm5e.spell.targets.touch"):
        return "touch";
      case "smell":
      case "sme":
      case game.i18n.localize("arm5e.spell.targets.smell"):
        return "smell";
      case "sight":
      case "sig":
      case game.i18n.localize("arm5e.spell.targets.sight"):
        return "sight";
      case "special":
      case "spe":
      case "spec":
      case game.i18n.localize("arm5e.spell.special"):
        return "special";
      default:
        break;
    }
  }
  ChatMessage.create({
    content:
      "<b>MIGRATION NOTIFICATION</b><br/>" +
      `Warning: Unable to guess target \"${value}\" of ${name}, you will have to set it back manually. ` +
      `It has been reset to ${game.i18n.localize("arm5e.spell.targets.ind")}</b>`
  });
  console.warn(`Target \"${value}\" of spell ${name} could not be guessed`);
  return "ind";
}
