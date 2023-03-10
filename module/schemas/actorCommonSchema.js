import { ARM5E } from "../config.js";

import { SeasonField } from "./commonSchemas.js";

const fields = foundry.data.fields;

export const actorBase = () => {
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
    date: new fields.SchemaField({
      season: SeasonField(),
      year: new fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        initial: 1200,
        step: 1
      })
    })
  };
};

