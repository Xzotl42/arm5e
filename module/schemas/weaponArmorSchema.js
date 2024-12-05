import { ARM5E } from "../config.js";
import { convertToNumber, log } from "../tools.js";
import {
  boolOption,
  CostField,
  itemBase,
  NullableDocumentIdField,
  NullableEmbeddedDataField,
  XpField
} from "./commonSchemas.js";
import { EnchantmentExtension, ItemState } from "./enchantmentSchema.js";
const fields = foundry.data.fields;
export class ArmorSchema extends foundry.abstract.DataModel {
  // TODO remove in V11
  static _enableV10Validation = true;

  static defineSchema() {
    return {
      ...itemBase(),
      cost: CostField("standard", 2),
      quantity: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        min: 0, // allow quantity of 0 to keep an eye on what is missing
        initial: 1,
        step: 1
      }),
      load: new fields.NumberField({
        required: false,
        nullable: false,
        min: 0,
        initial: 0
      }),
      prot: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        min: 0,
        initial: 0,
        step: 1
      }),
      full: boolOption(false, true),
      equipped: boolOption(false, true),
      state: ItemState(),
      enchantments: new NullableEmbeddedDataField(EnchantmentExtension, {
        nullable: true,
        initial: CONFIG.ISV10 ? new EnchantmentExtension() : null
      })
    };
  }

  getQuantity() {
    return this.quantity;
  }

  static migrateData(data) {
    if (data.weight != undefined) {
      if (data.weight > 0 && data.load == 0) {
        data.load = data.weight;
      }
      delete data.weight;
    }

    return data;
  }

  get maintenance() {
    let coeff = 1;
    if (this.full) {
      coeff = 2;
    }
    switch (this.cost.value) {
      case "n-a":
      case "priceless":
      case "none":
        return 0;
      case "inexp":
        return 2 * coeff;
      case "std":
        return 8 * coeff;
      case "exp":
        return 32 * coeff;
    }
  }

  static migrate(itemData) {
    let update = {};

    update["system.-=weight"] = null;
    update["system.load"] = itemData.system.load;
    if (CONFIG.ISV10) {
      if (itemData.system.state != "inert") {
        const updateData = EnchantmentExtension.migrate(itemData);
        foundry.utils.mergeObject(update, updateData);
      } else {
        update["system.enchantments"] = new EnchantmentExtension();
      }
    } else {
      if (itemData.system.enchantments != null) {
        const updateData = EnchantmentExtension.migrate(itemData);
        foundry.utils.mergeObject(update, updateData);
      }
    }

    return update;
  }

  sanitize() {
    return ArmorSchema.sanitizeData(this.toObject());
  }

  static sanitizeData(data) {
    if (data.enchantments) {
      data.enchantments = EnchantmentExtension.sanitizeData(data.enchantments);
    }
    return data;
  }
}
export class WeaponSchema extends foundry.abstract.DataModel {
  // TODO remove in V11
  static _enableV10Validation = true;

  static defineSchema() {
    return {
      ...itemBase(),
      cost: CostField("standard"),
      quantity: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        min: 0, // allow quantity of 0 to keep an eye on what is missing
        initial: 1,
        step: 1
      }),
      load: new fields.NumberField({
        required: false,
        nullable: false,
        min: 0,
        initial: 0
      }),
      init: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        initial: 0,
        step: 1
      }),
      atk: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        initial: 0,
        step: 1
      }),
      dfn: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        initial: 0,
        step: 1
      }),
      dam: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        initial: 0,
        step: 1
      }),
      str: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        initial: 0,
        step: 1
      }),
      range: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        min: 0,
        initial: 0,
        step: 1
      }),
      weaponExpert: boolOption(false, true),
      equipped: boolOption(false, true),
      horse: boolOption(false, true),
      ability: new fields.SchemaField(
        {
          key: new fields.StringField({ required: false, blank: true, initial: "brawl" }),
          option: new fields.StringField({
            required: false,
            nullable: true,
            blank: true,
            initial: ""
          }),
          id: new NullableDocumentIdField()
        },
        { required: false, initial: { key: "brawl", option: "", id: null } }
      ),
      state: ItemState(),
      enchantments: new NullableEmbeddedDataField(EnchantmentExtension, {
        nullable: true,
        initial: CONFIG.ISV10 ? new EnchantmentExtension() : null
      })
    };
  }

  static migrateData(data) {
    // if (typeof data.cost != "string") {
    //   log(false, `Weapon cost: ${JSON.stringify(data.cost)}`);
    //   data.cost = data.cost.value;
    // }
    if (data.ability instanceof String) {
      data.ability = { key: "", option: null, id: data.ability };
    }
    return data;
  }

  get maintenance() {
    switch (this.cost.value) {
      case "n-a":
      case "priceless":
      case "none":
        return 0;
      case "inexp":
        return 1;
      case "std":
        return 4;
      case "exp":
        return 16;
    }
  }

  getQuantity() {
    return this.quantity;
  }
  static migrate(itemData) {
    let update = {};

    if (typeof itemData.system.init != "number") {
      update["system.init"] = convertToNumber(itemData.system.init, 0);
    }
    if (typeof itemData.system.atk != "number") {
      update["system.atk"] = convertToNumber(itemData.system.atk, 0);
    }
    if (typeof itemData.system.dfn != "number") {
      update["system.dfn"] = convertToNumber(itemData.system.dfn, 0);
    }
    if (typeof itemData.system.dam != "number") {
      update["system.dam"] = convertToNumber(itemData.system.dam, 0);
    }
    if (typeof itemData.system.str != "number") {
      update["system.str"] = convertToNumber(itemData.system.str, 0);
    }
    if (typeof itemData.system.range != "number") {
      update["system.range"] = convertToNumber(itemData.system.range, 0);
    }
    if (typeof itemData.system.load != "number") {
      update["system.load"] = convertToNumber(itemData.system.load, 0);
    }

    if (CONFIG.ISV10) {
      if (itemData.system.state != "inert") {
        const updateData = EnchantmentExtension.migrate(itemData);
        foundry.utils.mergeObject(update, updateData);
      } else {
        update["system.enchantments"] = new EnchantmentExtension();
      }
    } else {
      if (itemData.system.enchantments != null) {
        const updateData = EnchantmentExtension.migrate(itemData);
        foundry.utils.mergeObject(update, updateData);
      }
    }

    return update;
  }

  sanitize() {
    return WeaponSchema.sanitizeData(this.toObject());
  }

  static sanitizeData(data) {
    if (data.enchantments) {
      data.enchantments = EnchantmentExtension.sanitizeData(data.enchantments);
    }
    return data;
  }
}
