import {
  baseDescription,
  boolOption,
  itemBase,
  ModifierField,
  SpellAttributes,
  XpField
} from "./commonSchemas.js";
import { baseLevel, SpellSchema } from "./magicSchemas.js";

const fields = foundry.data.fields;

export class SupernaturalEffectSchema extends SpellSchema {
  // TODO remove in V11
  static _enableV10Validation = true;

  static defineSchema() {
    return {
      ...itemBase(),
      verb: new fields.SchemaField({
        value: new fields.StringField({
          required: false,
          blank: true
        })
      }),
      noun: new fields.SchemaField({
        value: new fields.StringField({
          required: false,
          blank: true
        })
      }),
      template: new fields.StringField({
        required: true,
        blank: false
      }),
      ...SpellAttributes(),
      level: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        min: 0,
        initial: 1,
        step: 1
      }),
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

  prepareData() {
    if (!this.parent.isOwned) return;

    this.castingTotal = this.computeCastingTotal();
  }

  computeCastingTotal() {
    const owner = this.parent.actor;
    const template = owner.system.magicSystem.templates[this.template];

    // Const verbScore = owner.getAbility(template.);
    // Let total = this.system.;
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
