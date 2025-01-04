/* eslint-disable jsdoc/require-returns-type */
import { ArM5ePCActor } from "../actor/actor.js";
import { ARM5E } from "../config.js";
import { convertToNumber, log } from "../tools.js";
import { hermeticForm, itemBase, RealmField } from "./commonSchemas.js";

const fields = foundry.data.fields;

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
      penetration: new fields.NumberField({
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
        min: 0,
        initial: 1,
        step: 1
      }),
      realm: RealmField()
    };
  }

  static migrateData(data) {
    return data;
  }

  static migrate(itemData) {
    const updateData = {};

    if (typeof itemData.system.page !== "number") {
      updateData["system.page"] = convertToNumber(itemData.system.page, 0);
    }
    return updateData;
  }
}
