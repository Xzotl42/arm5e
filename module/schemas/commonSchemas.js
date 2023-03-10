import { ARM5E } from "../config.js";

const fields = foundry.data.fields;

export class NullableEmbeddedDataField extends fields.EmbeddedDataField {
  /**
   * @param {typeof DataModel} model          The class of DataModel which should be embedded in this field
   * @param {DataFieldOptions} options        Options which configure the behavior of the field
   */
  constructor(model, options) {
    super(model, options);
  }

  toObject(value) {
    if (value != null) {
      return super.toObject(value);
    }
    return null;
  }
}

// convert a field value into a number
export const convertToNumber = function(value, fallback = 0) {
  if (value === undefined || value === "" || value === null) {
    return fallback;
  } else if (typeof value === "string") {
    if (Number.isNaN(value)) {
      return fallback;
    } else {
      return Number(value);
    }
  } else {
    return value;
  }
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
    })
  };
};

export const basicTextField = () =>
  new fields.StringField({ required: false, blank: true, initial: "" });

export const possibleRanges = Object.keys(ARM5E.magic.ranges).filter(r => !r.disabled);
export const possibleTargets = Object.keys(ARM5E.magic.targets).filter(r => !r.disabled);
export const possibleDurations = Object.keys(ARM5E.magic.durations).filter(r => !r.disabled);
export const boolOption = (val = false, nullable = false) =>
  new fields.BooleanField({ required: false, initial: val, nullable: nullable });
export const baseDescription = () =>
  new fields.StringField({ required: false, blank: true, initial: "" });
export const TechniquesForms = () => {
  return {
    technique: new fields.SchemaField({ value: hermeticTechnique() }, { required: true }),
    "technique-req": new fields.SchemaField({
      cr: boolOption(),
      in: boolOption(),
      mu: boolOption(),
      pe: boolOption(),
      re: boolOption()
    }),

    form: new fields.SchemaField({ value: hermeticForm() }, { required: true }),
    "form-req": new fields.SchemaField({
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
    })
  };
};

export const RealmField = (initial = "mundane") => {
  return new fields.StringField({
    required: false,
    blank: false,
    initial: initial,
    choices: Object.keys(ARM5E.realmsExt)
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
          choices: possibleRanges
        })
      },
      { required: true }
    ),
    duration: new fields.SchemaField(
      {
        value: new fields.StringField({
          required: true,
          blank: false,
          initial: "moment",
          choices: possibleDurations
        })
      },
      { required: true }
    ),
    target: new fields.SchemaField(
      {
        value: new fields.StringField({
          required: true,
          blank: false,
          initial: "ind",
          choices: possibleTargets
        })
      },
      { required: true }
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
      min: 0,
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

export const EnchantmentAttributes = () => {
  return {
    effectfrequency: new fields.NumberField({
      required: false,
      nullable: false,
      integer: true,
      min: 0,
      initial: 0,
      step: 1
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
    linkedTrigger: baseDescription()
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

export const SeasonField = () =>
  new fields.StringField({
    required: false,
    blank: false,
    initial: "spring",
    choices: Object.keys(ARM5E.seasons)
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
    max: 40,
    initial: 0,
    step: 1
  });

export const hermeticForm = () =>
  new fields.StringField({
    required: false,
    blank: false,
    initial: "an",
    choices: Object.keys(ARM5E.magic.forms)
  });

export const hermeticTechnique = () =>
  new fields.StringField({
    required: false,
    blank: false,
    initial: "cr",
    choices: Object.keys(ARM5E.magic.techniques)
  });

export const authorship = () => {
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
    language: new fields.StringField({ required: false, blank: true, initial: "Latin" })
  };
};
