import { ARM5E } from "../config.js";
import { UI } from "../constants/ui.js";
import { ArM5eItem } from "../item/item.js";
import { log } from "../tools.js";
import {
  baseDescription,
  boolOption,
  DateField,
  itemBase,
  ModifierField,
  NullableSchemaField,
  SeasonField,
  SpellAttributes,
  TechniquesForms,
  XpField
} from "./commonSchemas.js";
import { baseLevel } from "./magicSchemas.js";
const fields = foundry.data.fields;

// Schema field added to enchanted devices

export class EnchantmentExtension extends foundry.abstract.DataModel {
  // TODO remove in V11
  static _enableV10Validation = true;
  constructor(fields, options = { nullable: true }) {
    super(fields, options);
  }

  static defineSchema() {
    return {
      author: new fields.StringField({ required: false, blank: true, initial: "Unknown" }),
      year: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        // positive: true, // for testing
        initial: 1220,
        step: 1
      }),
      season: SeasonField(),
      attunementVisible: boolOption(true),
      preparedBy: new fields.StringField({
        required: false,
        blank: true,
        nullable: true,
        initial: null
      }),
      locked: boolOption(),
      state: EnchantedItemState(),
      bonuses: new fields.ArrayField(
        new fields.SchemaField({
          value: ModifierField(),
          name: new fields.StringField({
            required: false,
            blank: true,
            initial: "Generic"
          }),
          type: new fields.StringField({
            required: false,
            blank: false,
            initial: "labTotal",
            choices: ["labTotal"]
          })
        }),
        { required: false, initial: [] }
      ),
      aspects: new fields.ArrayField(new fields.SchemaField(AspectAttribute())),
      capacities: new fields.ArrayField(new fields.SchemaField(HermeticAttributes()), {
        initial: [
          {
            id: foundry.utils.randomID(),
            sizeMultiplier: "tiny",
            materialBase: "base1",
            desc: "",
            prepared: false
          }
        ]
      }),
      compounded: boolOption(),
      capacityMode: new fields.StringField({
        required: false,
        blank: false,
        initial: "sum",
        choices: ["sum", "max"]
      }),
      effects: new fields.ArrayField(
        new fields.SchemaField({
          name: new fields.StringField({
            required: false,
            blank: true,
            initial: ""
          }),
          type: new fields.StringField({
            required: false,
            blank: false,
            initial: "enchantment"
          }),
          img: new fields.FilePathField({
            categories: ["IMAGE"],
            initial: (data) => CONFIG.ARM5E_DEFAULT_ICONS["enchantment"]
          }),
          system: new fields.EmbeddedDataField(EnchantmentSchema, {}),
          receptacleId: new fields.StringField({
            required: false,
            blank: true,
            initial: ""
          })
        }),
        {
          required: false,
          initial: []
        }
      ),
      charges: new fields.NumberField({
        required: false,
        nullable: true,
        integer: true,
        min: 0,
        initial: 1,
        step: 1
      }),
      originalCharges: new fields.NumberField({
        required: false,
        nullable: true,
        integer: true,
        min: 1,
        initial: 1,
        step: 1
      })
    };
  }
  // static getDefaultArtwork(itemData) {
  //   return { img: UI. };
  // }

  static migrate(itemData) {
    log(false, "Migrate enchant extension");
    const updateData = {};
    const capacities = itemData.system.enchantments.capacities;
    for (let c of capacities) {
      if (c.id == "" || c.id.length == 1) {
        c.id = foundry.utils.randomID();
      }
    }

    const effects = itemData.system.enchantments.effects;
    // explanation: recovering from the mess made for magic Items migration
    if (
      itemData.system.enchantments.originalCharges > 1 &&
      itemData.system.state == "enchanted" &&
      (effects.length ? effects[0].receptacleId == "" : false)
    ) {
      updateData["system.state"] = "enchanted";
      updateData["system.enchantments.state"] = "charged";
    }

    for (let e of effects) {
      if (e.name === "") {
        e.name = game.i18n.localize("arm5e.sheet.effect");
      }
      if (e.type === undefined) {
        e.type = "enchantment";
      }
      if (e.receptacleId === "") {
        e.receptacleId = capacities[0].id;
      }
    }
    updateData["system.enchantments.capacities"] = capacities;
    updateData["system.enchantments.effects"] = effects;
    return updateData;
  }

  static migrateData(data) {
    if (data.state == "charged") {
      data.state = "enchanted";
    }

    return data;
  }

  sanitize() {
    return EnchantmentExtension.sanitizeData(this.toObject());
  }

  static sanitizeData(data) {
    for (const effect of data.effects) {
      effect.system = EnchantmentSchema.sanitizeData(effect.system);
    }
    return data;
  }
}

export class EnchantmentSchema extends foundry.abstract.DataModel {
  static _enableV10Validation = true;
  constructor(fields, options = { nullable: true }) {
    super(fields, options);
  }
  static defineSchema() {
    return {
      ...itemBase(),
      ...TechniquesForms(),
      ...SpellAttributes(),
      baseLevel: baseLevel(),
      baseEffectDescription: baseDescription(),
      bonus: ModifierField(),
      bonusDesc: baseDescription(),
      ...EnchantmentAttributes(),
      hidden: boolOption()
    };
  }
  static migrate(itemData) {
    return {};
  }

  sanitize() {
    return EnchantmentSchema.sanitizeData(this.toObject());
  }

  static sanitizeData(data) {
    data.description = "";
    return data;
  }
}

export const EnchantmentAttributes = () => {
  return {
    effectfrequency: new fields.StringField({
      required: false,
      nullable: false,
      blank: false,
      initial: "0",
      choices: Object.keys(ARM5E.lab.enchantment.effectUses)
    }),
    penetration: new fields.NumberField({
      required: false,
      nullable: false,
      integer: true,
      min: 0,
      initial: 0,
      step: 1
    }),
    maintainConc: boolOption(),
    environmentalTrigger: baseDescription(),
    restrictedUse: baseDescription(),
    linkedTrigger: baseDescription(),
    charges: new fields.NumberField({
      required: false,
      nullable: true,
      integer: true,
      min: 0,
      initial: 0,
      step: 1
    }),
    expiryStartDate: DateField(),
    expiry: new fields.StringField({
      required: false,
      nullable: false,
      blank: false,
      initial: "0",
      choices: Object.keys(ARM5E.lab.enchantment.expiry)
    })
  };
};

export const EnchantedItemState = () => {
  return new fields.StringField({
    required: false,
    nullable: false,
    initial: "lesser",
    choices: Object.keys(ARM5E.lab.enchantment.state)
  });
};

export const ItemState = () => {
  return new fields.StringField({
    required: false,
    nullable: false,
    initial: "inert",
    choices: Object.keys(ARM5E.lab.enchantment.receptacle.state)
  });
};

export const HermeticAttributes = () => {
  return {
    id: new fields.StringField({
      required: true,
      nullable: false,
      blank: false,
      initial: foundry.utils.randomID()
    }),
    sizeMultiplier: new fields.StringField({
      required: false,
      nullable: false,
      blank: false,
      initial: "tiny",
      choices: Object.keys(ARM5E.lab.enchantment.sizeMultiplier)
    }),
    materialBase: new fields.StringField({
      required: false,
      nullable: false,
      blank: false,
      initial: "base1",
      choices: Object.keys(ARM5E.lab.enchantment.materialBase)
    }),
    desc: baseDescription(),
    prepared: boolOption()
  };
};

export const AspectAttribute = () => {
  return {
    aspect: baseDescription("agate"),
    effect: baseDescription("air"),
    bonus: new fields.NumberField({
      required: false,
      nullable: false,
      integer: true,
      min: 0,
      initial: 0,
      step: 1
    }),
    attuned: boolOption()
  };
};
