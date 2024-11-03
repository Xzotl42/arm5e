// import DataModel from "common/abstract/data.mjs";
import { ARM5E } from "../config.js";
import { VIRTUESFLAWS_DEFAULT_ICONS } from "../constants/ui.js";
import { convertToNumber, log } from "../tools.js";
import {
  boolOption,
  convertToInteger,
  CostField,
  itemBase,
  NullableEmbeddedDataField,
  XpField
} from "./commonSchemas.js";
import { EnchantmentExtension, ItemState } from "./enchantmentSchema.js";
const fields = foundry.data.fields;

// export const possibleReputationTypes = Object.keys(ARM5E.reputations);

// const virtueFlawTypes = Object.keys(ARM5E.virtueFlawTypes.character)
//   .concat(Object.keys(ARM5E.virtueFlawTypes.laboratory))
//   .concat(Object.keys(ARM5E.virtueFlawTypes.covenant))
//   .concat("Special")
//   .concat("other");
export class VirtueFlawSchema extends foundry.abstract.DataModel {
  // TODO remove in V11
  static _enableV10Validation = true;

  static defineSchema() {
    return {
      ...itemBase(),
      type: new fields.StringField({
        required: false,
        blank: false,
        initial: "general",
        choices: Object.keys(ARM5E.virtueFlawTypes.character)
          .concat(Object.keys(ARM5E.virtueFlawTypes.laboratory))
          .concat(Object.keys(ARM5E.virtueFlawTypes.covenant))
          .concat("Special")
          .concat("other")
          .concat("tainted")
      }),
      impact: new fields.SchemaField(
        {
          value: new fields.StringField({
            required: false,
            blank: false,
            initial: "free",
            choices: Object.keys(ARM5E.impacts).concat("Special")
          })
        },
        { required: false, blank: false, initial: { value: "free" } }
      ),
      hidden: boolOption(false),
      tainted: boolOption(false)
    };
  }

  get cost() {
    if (this.impact == "Special") {
      return 0;
    }
    return CONFIG.ARM5E.impacts[this.impact].cost;
  }

  static getIcon(item, newValue = null) {
    // if (item.system.tainted) {
    //   return "systems/arm5e/assets/icons/VF/tainted.svg";
    // }
    if (newValue != null) {
      if (item.type == "virtue") {
        let type = newValue == "general" ? "generalVirtue" : newValue;
        return VIRTUESFLAWS_DEFAULT_ICONS.MONO[type] ?? CONFIG.ARM5E_DEFAULT_ICONS["virtue"];
      } else {
        let type = newValue == "general" ? "generalFlaw" : newValue;
        return VIRTUESFLAWS_DEFAULT_ICONS.MONO[type] ?? CONFIG.ARM5E_DEFAULT_ICONS["flaw"];
      }
    } else {
      if (item.type == "virtue") {
        let type = item.system.type == "general" ? "generalVirtue" : item.system.type;
        return VIRTUESFLAWS_DEFAULT_ICONS.MONO[type] ?? CONFIG.ARM5E_DEFAULT_ICONS["virtue"];
      } else {
        let type = item.system.type == "general" ? "generalFlaw" : item.system.type;
        return VIRTUESFLAWS_DEFAULT_ICONS.MONO[type] ?? CONFIG.ARM5E_DEFAULT_ICONS["flaw"];
      }
    }
  }

  static getDefault(itemData) {
    let res = itemData;
    if (itemData.system) {
      if (itemData.system.type == undefined) {
        res.system.type = "general";
      }
    } else {
      res = { system: { type: "general" } };
    }
    return res;
  }

  static migrateData(data) {
    // if (data.description == null) {
    //   data.description = "";
    // }
    if (data.type?.value) {
      data.type = data.type.value;
    }
    return data;
  }

  static migrate(itemData) {
    const updateData = {};
    if (typeof itemData.system.page !== "number") {
      updateData["system.page"] = convertToNumber(itemData.system.page, 0);
    }

    if (itemData.system.type === "tainted") {
      updateData["system.type"] = "general";
      updateData["system.tainted"] = true;
    } else if (itemData.system.type === "") {
      updateData["system.type"] = "general";
    } else if (itemData.system.type.value !== undefined) {
      updateData["system.type"] = itemData.system.type.value;
    }

    if (itemData.system.description == null) {
      updateData["system.description"] = "";
    }

    if (itemData.system.impact.value === "") {
      updateData["system.impact.value"] = "free";
    }

    // special cases
    const virtueFlawTypes = Object.keys(ARM5E.virtueFlawTypes.character)
      .concat(Object.keys(ARM5E.virtueFlawTypes.laboratory))
      .concat(Object.keys(ARM5E.virtueFlawTypes.covenant))
      .concat("Special")
      .concat("other");
    if (itemData.system.type === "Social Status") {
      updateData["system.type"] = "social";
    } else if (!virtueFlawTypes.includes(itemData.system.type)) {
      updateData["system.type"] = "general";
    }

    return updateData;
  }
}

export class ItemSchema extends foundry.abstract.DataModel {
  // TODO remove in V11
  static _enableV10Validation = true;
  static defineSchema() {
    return {
      ...itemBase(),
      quantity: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        min: 0, // allow quantity of 0 to keep an eye on what is missing
        initial: 1,
        step: 1
      }),
      weight: new fields.NumberField({
        required: false,
        nullable: false,
        min: 0,
        initial: 0
      }),
      cost: CostField("standard"),
      carried: boolOption(false, true),
      state: ItemState(),
      enchantments: new NullableEmbeddedDataField(EnchantmentExtension, {
        nullable: true,
        initial: CONFIG.ISV10 ? new EnchantmentExtension() : null
      })
    };
  }
  static migrate(itemData) {
    const updateData = {};
    if (itemData.system.quantity === null || !Number.isInteger(itemData.system.quantity)) {
      updateData["system.quantity"] = convertToInteger(itemData.system.quantity, 1);
    }
    if (itemData.system.weight === null) {
      updateData["system.weight"] = 0;
    }

    if (CONFIG.ISV10) {
      if (itemData.system.state != "inert") {
        const updateExt = EnchantmentExtension.migrate(itemData);
        foundry.utils.mergeObject(updateData, updateExt);
      } else {
        updateData["system.enchantments"] = new EnchantmentExtension();
      }
    } else {
      if (itemData.system.enchantments != null) {
        const updateExt = EnchantmentExtension.migrate(itemData);
        foundry.utils.mergeObject(updateData, updateExt);
      }
    }

    return updateData;
  }

  getQuantity() {
    return this.quantity;
  }

  sanitize() {
    return ItemSchema.sanitizeData(this.toObject());
  }

  static sanitizeData(data) {
    if (data.enchantments) {
      data.enchantments = EnchantmentExtension.sanitizeData(data.enchantments);
    }
    return data;
  }
}
export class ReputationSchema extends foundry.abstract.DataModel {
  // TODO remove in V11
  static _enableV10Validation = true;

  static defineSchema() {
    return {
      ...itemBase(),
      xp: XpField(),
      type: new fields.StringField({
        required: false,
        blank: false,
        initial: "local",
        choices: Object.keys(ARM5E.reputations)
      })
    };
  }

  async increaseScore() {
    let oldXp = this.xp;
    let newXp = Math.round(((this.score + 1) * (this.score + 2) * 5) / 2);

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
    if (this.score != 0) {
      let oldXp = this.xp;
      let newXp = Math.round(((this.score - 1) * this.score * 5) / 2);
      await this.parent.update(
        {
          system: {
            xp: newXp
          }
        },
        {}
      );
      let delta = newXp - oldXp;
      console.log(`Removed ${delta} xps from ${oldXp} to ${newXp} total`);
    }
  }

  static migrateData(data) {
    // console.log(`MigrateData Reputation: ${JSON.stringify(data)}`);
    if (data.points != undefined) {
      data.xp = (5 * (data.points * (data.points + 1))) / 2;
      delete data.points;
    }
    return data;
  }

  static migrate(data) {
    // console.log(`Migrate Reputation: ${JSON.stringify(data)}`);
    let update = {};
    update["system.-=points"] = null;
    update["system.-=notes"] = null;
    update["system.xp"] = data.system.xp;
    return update;
  }
}

export class PersonalityTraitSchema extends foundry.abstract.DataModel {
  // TODO remove in V11
  static _enableV10Validation = true;

  static defineSchema() {
    return {
      ...itemBase(),
      xp: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        initial: 0,
        step: 1
      })
    };
  }

  async increaseScore() {
    let oldXp = this.xp;
    let newXp = 5;
    if (this.score > 0) {
      newXp = Math.round(((this.score + 1) * (this.score + 2) * 5) / 2);
    } else if (this.score < 0) {
      newXp = -Math.round(((this.score + 1) * this.score * 5) / 2);
    }
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
    let oldXp = this.xp;
    let newXp = -5;
    if (this.score > 0) {
      newXp = Math.round(((this.score - 1) * this.score * 5) / 2);
    } else if (this.score < 0) {
      newXp = -Math.round(((this.score - 2) * (this.score - 1) * 5) / 2);
    }
    await this.parent.update(
      {
        system: {
          xp: newXp
        }
      },
      {}
    );
    let delta = newXp - oldXp;
    console.log(`Removed ${delta} xps from ${oldXp} to ${newXp} total`);
  }

  static getScore(xp) {
    let res = 0;
    let xps;
    if (xp >= 0) {
      xps = Math.floor(xp / 5);
      while (xps > res) {
        res++;
        xps = xps - res;
      }
      return res;
    } else {
      return -this.getScore(-xp);
    }
  }

  static migrate(data) {
    let update = {};
    update["system.-=points"] = null;
    update["system.-=notes"] = null;
    update["system.xp"] = data.system.xp;
    return {};
  }

  static migrateData(data) {
    if (data.points != undefined) {
      if (data.points < 0) {
        data.xp = -(5 * (data.points * (data.points + 1))) / 2;
      } else {
        data.xp = (5 * (data.points * (data.points + 1))) / 2;
      }
      delete data.points;
    }
    return data;
  }
}

export class SanctumSchema extends foundry.abstract.DataModel {
  // TODO remove in V11
  static _enableV10Validation = true;

  static defineSchema() {
    return {
      ...itemBase(),
      sanctumId: new fields.StringField({
        nullable: true,
        required: false,
        blank: true,
        initial: null
      }),
      owner: new fields.StringField({ required: false, blank: true, initial: "" }),
      upkeep: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        initial: 0,
        step: 1
      }),
      buildPoints: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        initial: 0,
        step: 1
      }),
      quality: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        initial: 0,
        step: 1
      }),
      usage: new fields.StringField({
        required: false,
        blank: false,
        initial: "standard",
        choices: Object.keys(ARM5E.lab.usage)
      })
    };
  }

  // static migrateData(data) {
  //   super.migrateData(data);
  //   return data;
  // }

  get upkeepCost() {
    if (this.upkeep < -5) return 0;
    switch (this.upkeep) {
      case -5:
        return 1;
      case -4:
        return 2;
      case -3:
        return 3;
      case -2:
        return 5;
      case -1:
        return 7;
      case 0:
        return 10;
      case 1:
        return 15;
      default:
        return this.upkeep * (this.upkeep + 1) * 5;
    }
  }

  static migrate(data) {
    const updateData = {};
    if (data.name != "" && (data.system.sanctumId == null || data.system.sanctumId === "")) {
      let sanctum = game.actors.filter(
        (a) => ["laboratory"].includes(a.type) && a.name == data.name
      );
      if (sanctum.length > 0) {
        updateData["system.sanctumId"] = sanctum[0]._id;
      }
    }
    return updateData;
  }
}

// TEMPLATE
export class MySchema extends foundry.abstract.DataModel {
  // TODO remove in V11
  static _enableV10Validation = true;

  static defineSchema() {
    return { ...itemBase() };
  }

  static migrateData(data) {
    super.migrateData(data);
    return data;
  }

  static migrate(data) {
    return {};
  }
}
