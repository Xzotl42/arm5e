import {
  baseDescription,
  boolOption,
  itemBase,
  ModifierField,
  SpellAttributes
} from "./commonSchemas.js";
import { baseLevel } from "./magicSchemas.js";

const fields = foundry.data.fields;

// WORK IN PROGRESS (for when characters are migrated to datamodel)
export class MagicSystemSchema extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      ...itemBase(),
      techniques: new fields.ArrayField(
        new fields.SchemaField({
          value: new fields.StringField({
            required: true,
            blank: false
          })
        })
      ),
      forms: new fields.ArrayField(
        new fields.SchemaField({
          value: new fields.StringField({
            required: true,
            blank: false
          })
        })
      ),
      template: new fields.StringField({
        required: true,
        blank: false
      }),
      ...SpellAttributes(),
      baseLevel: baseLevel(),
      baseEffectDescription: baseDescription(),
      applyFocus: boolOption(false, true),
      ritual: boolOption(),
      bonus: ModifierField(),
      bonusDesc: baseDescription(),
      general: boolOption(),
      levelOffset: ModifierField()
    };
  }

  static getIcon(item, newValue = null) {
    if (newValue != null) {
      return `systems/arm5e/assets/magic/${newValue}.png`;
    } else {
      let init = "an";
      if (item.system?.form?.value !== undefined) {
        init = item.system.form.value;
      }
      return `systems/arm5e/assets/magic/${init}.png`;
    }
  }

  static migrateData(data) {
    return data;
  }

  static migrate(itemData) {
    const updateData = {};
    return updateData;
  }
}
