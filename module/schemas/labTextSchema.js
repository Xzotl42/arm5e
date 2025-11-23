import {
  authorship,
  baseDescription,
  boolOption,
  CostField,
  SpellAttributes,
  TechniquesForms
} from "./commonSchemas.js";
import { AbstractMagicEntity, baseLevel, migrateMagicalItem } from "./magicSchemas.js";
import { ARM5E } from "../config.js";
import { EnchantmentAttributes } from "./enchantmentSchema.js";
const fields = foundry.data.fields;
export class LabTextTopicSchema extends foundry.abstract.DataModel {
  static defineSchema() {
    return LabTextSchema.defineSchema();
  }

  static migrate(itemData) {
    return LabTextSchema.migrate(itemData);
  }
}

export class LabTextSchema extends AbstractMagicEntity {
  static defineSchema() {
    return {
      ...super.defineSchema(),
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
