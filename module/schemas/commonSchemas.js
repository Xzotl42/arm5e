import { ARM5E } from "../config.js";
import { convertToNumber } from "../tools.js";

const fields = foundry.data.fields;

const validators = foundry.data.validators;

export class NullableEmbeddedDataField extends fields.EmbeddedDataField {
  /**
   * @param {typeof DataModel} model          The class of DataModel which should be embedded in this field
   * @param {DataFieldOptions} options        Options which configure the behavior of the field
   */
  constructor(model, options) {
    super(model, options);
  }

  toObject(value) {
    if (!value) return value;
    return value.toObject(false);
  }
}

export class NullableSchemaField extends fields.SchemaField {
  /**
   * @param {DataFieldOptions} options        Options which configure the behavior of the field
   */
  constructor(fields, options = { nullable: true }) {
    super(fields, options);
  }

  /** @inheritdoc */
  static get _defaults() {
    return foundry.utils.mergeObject(super._defaults, {
      required: false,
      nullable: true,
      initial: null
    });
  }

  toObject(value) {
    if (value === undefined || value === null) return value;
    const data = {};
    for (const [name, field] of this.entries()) {
      data[name] = field.toObject(value[name]);
    }
    return data;
  }
}

// Use ForeignDocumentField once V10 is no longer supported
export class NullableDocumentIdField extends fields.DocumentIdField {
  /** @inheritdoc */
  static get _defaults() {
    return foundry.utils.mergeObject(super._defaults, {
      required: false,
      blank: false,
      nullable: true,
      initial: null,
      readonly: false,
      validationError: "is not a valid Document ID string"
    });
  }

  /** @override */
  _cast(value) {
    if (value instanceof foundry.abstract.Document) return value._id;
    else return String(value);
  }

  /** @override */
  _validateType(value) {
    if (!validators.isValidId(value) && value !== null)
      throw new Error("must be a valid 16-character alphanumeric ID or null");
  }
}

export const convertToInteger = function (value, fallback = 0) {
  return Math.round(convertToNumber(value, fallback));
};

export const newComputedField = function (fieldName, originalValue) {
  return `<li>${fieldName} (${originalValue})</li>`;
};

export const itemBase = () => {
  return {
    description: new fields.StringField({ required: false, blank: true, initial: "" }),
    source: new fields.StringField({ required: false, initial: "custom" }),
    page: new fields.NumberField({
      required: false,
      nullable: false,
      integer: true,
      initial: 0,
      min: 0,
      step: 1
    }),
    indexKey: new fields.StringField({ required: false, blank: true, initial: "" }),
    review_status: new fields.StringField({
      required: false,
      blank: true,
      initial: "toReview",
      choices: Object.keys(CONFIG.ARM5E.generic.reviewStatus)
    }),
    reviewer: new fields.StringField({ required: false, blank: true, initial: "" }),
    credits: new fields.StringField({ required: false, blank: true, initial: "" })
  };
};

export const actorLink = () => {
  return new fields.SchemaField({
    value: new fields.StringField({ required: false, blank: true, initial: "" }),
    actorId: new fields.StringField({
      nullable: true,
      required: false,
      blank: true,
      initial: null
    }),
    linked: new fields.BooleanField({ required: false, initial: false })
  });
};

export const DateField = (year = 1220, season = "spring") =>
  new fields.SchemaField({
    season: SeasonField(season),
    year: new fields.NumberField({
      required: true,
      nullable: false,
      integer: true,
      initial: year,
      step: 1
    }),
    date: new fields.StringField({
      required: false,
      blank: true,
      initial: ""
    })
  });

export const basicTextField = () =>
  new fields.StringField({ required: false, blank: true, initial: "" });

export const basicIntegerField = (initial = 0, min = -99999) =>
  new fields.NumberField({
    required: false,
    nullable: false,
    integer: true,
    initial: initial,
    step: 1,
    min: min
  });

export const CostField = (value = "n-a", amount = 0) =>
  new fields.SchemaField(
    {
      value: new fields.StringField({
        required: false,
        blank: false,
        initial: value,
        choices: Object.keys(CONFIG.ARM5E.item.costs)
      }),
      amount: new fields.NumberField({
        required: false,
        initial: 0
      })
      // mythicPounds: new fields.NumberField({
      //   required: false,
      //   initial: (value, pounds) => {
      //     if (pounds) return pounds;
      //     else {
      //       switch (value) {
      //         case "n-a":
      //         case "priceless":
      //           return 9999999;
      //         case "none":
      //           return 0;
      //         case "inexp":
      //           return 1 * coeff;
      //         case "std":
      //           return 4 * coeff;
      //         case "exp":
      //           return 16 * coeff;
      //       }
      //     }
      //   }
      // })
    },
    { required: false, initial: { value: "n-a", amount: amount } }
  );

// export const possibleRanges = Object.keys(CONFIG.ARM5E.magic.ranges).filter((r) => !r.disabled);
// export const possibleTargets = Object.keys(CONFIG.ARM5E.magic.targets).filter((r) => !r.disabled);
// export const possibleDurations = Object.keys(CONFIG.ARM5E.magic.durations).filter(
//   (r) => !r.disabled
// );
export const boolOption = (val = false, nullable = false) =>
  new fields.BooleanField({ required: false, initial: val, nullable: nullable });
export const baseDescription = (initial = "") =>
  new fields.StringField({ required: false, blank: true, initial: initial });
export const TechniquesForms = () => {
  return {
    technique: new fields.SchemaField(
      { value: hermeticTechnique() },
      { required: false, blank: false, initial: { value: "cr" } }
    ),
    "technique-req": new fields.SchemaField(
      {
        cr: boolOption(),
        in: boolOption(),
        mu: boolOption(),
        pe: boolOption(),
        re: boolOption()
      },
      {
        required: false,
        blank: false,
        initial: {
          cr: false,
          in: false,
          mu: false,
          pe: false,
          re: false
        }
      }
    ),

    form: new fields.SchemaField(
      { value: hermeticForm() },
      { required: false, blank: false, initial: { value: "an" } }
    ),
    "form-req": new fields.SchemaField(
      {
        an: boolOption(),
        aq: boolOption(),
        au: boolOption(),
        co: boolOption(),
        he: boolOption(),
        ig: boolOption(),
        im: boolOption(),
        me: boolOption(),
        te: boolOption(),
        vi: boolOption()
      },
      {
        required: false,
        blank: false,
        initial: {
          an: false,
          aq: false,
          au: false,
          co: false,
          he: false,
          ig: false,
          im: false,
          me: false,
          te: false,
          vi: false
        }
      }
    )
  };
};

export const RealmField = (initial = "mundane") => {
  return new fields.StringField({
    required: false,
    blank: false,
    initial: initial,
    choices: Object.keys(CONFIG.ARM5E.realmsExt)
  });
};

export const SpellAttributes = () => {
  return {
    range: new fields.SchemaField(
      {
        value: new fields.StringField({
          required: true,
          blank: false,
          initial: "personal",
          choices: Object.keys(CONFIG.ARM5E.magic.ranges).filter((r) => !r.disabled)
        })
      },
      { required: false, blank: false, initial: { value: "personal" } }
    ),
    duration: new fields.SchemaField(
      {
        value: new fields.StringField({
          required: true,
          blank: false,
          initial: "moment",
          choices: Object.keys(CONFIG.ARM5E.magic.durations).filter((r) => !r.disabled)
        })
      },
      { required: false, blank: false, initial: { value: "moment" } }
    ),
    target: new fields.SchemaField(
      {
        value: new fields.StringField({
          required: true,
          blank: false,
          initial: "ind",
          choices: Object.keys(CONFIG.ARM5E.magic.targets).filter((r) => !r.disabled)
        })
      },
      { required: false, blank: false, initial: { value: "ind" } }
    ),
    targetSize: new fields.NumberField({
      required: false,
      nullable: false,
      integer: true,
      min: 0,
      initial: 0,
      step: 1
    }),
    complexity: new fields.NumberField({
      required: false,
      nullable: false,
      integer: true,
      initial: 0,
      step: 1
    }),
    enhancingRequisite: new fields.NumberField({
      required: false,
      nullable: false,
      integer: true,
      min: 0,
      initial: 0,
      step: 1
    }),
    general: boolOption(),
    levelOffset: ModifierField()
  };
};

// Choices:

export const ModifierField = () =>
  new fields.NumberField({
    required: false,
    nullable: false,
    integer: true,
    initial: 0,
    step: 1
  });

export const SeasonField = (season = "spring") =>
  new fields.StringField({
    required: false,
    blank: false,
    initial: season,
    choices: Object.keys(CONFIG.ARM5E.seasons)
  });

export const XpField = () =>
  new fields.NumberField({
    required: false,
    nullable: false,
    integer: true,
    min: 0,
    initial: 0,
    step: 1
  });

export const characteristicField = () =>
  new fields.NumberField({
    required: false,
    nullable: false,
    integer: true,
    min: -10,
    max: 10,
    initial: 0,
    step: 1
  });

export const hermeticArtScore = () =>
  new fields.NumberField({
    required: true,
    nullable: true,
    integer: true,
    min: 0,
    max: 100,
    initial: 0,
    step: 1
  });

export const hermeticForm = (init = "an") =>
  new fields.StringField({
    required: false,
    blank: false,
    initial: init,
    choices: Object.keys(CONFIG.ARM5E.magic.forms)
  });

export const hermeticTechnique = () =>
  new fields.StringField({
    required: false,
    blank: false,
    initial: "cr",
    choices: Object.keys(CONFIG.ARM5E.magic.techniques)
  });

export const authorship = () => {
  return {
    author: new fields.StringField({
      required: false,
      blank: true,
      initial: game.i18n.localize("arm5e.generic.unknown")
    }),
    year: new fields.NumberField({
      required: false,
      nullable: false,
      integer: true,
      // positive: true, // for testing
      initial: 1220,
      step: 1
    }),
    season: SeasonField(),
    language: new fields.StringField({
      required: false,
      blank: true,
      initial: game.i18n.localize("arm5e.skill.commonCases.latin")
    })
  };
};
