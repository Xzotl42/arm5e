/* eslint-disable jsdoc/require-returns-type */
import { ArM5eActor } from "../actor/actor.js";
import { ARM5E } from "../config.js";
import { convertToNumber, log } from "../tools/tools.js";
import { hermeticForm, itemBase, RealmField } from "./commonSchemas.js";

const fields = foundry.data.fields;

export class PowerSchema extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      ...itemBase(),
      form: new fields.StringField({
        required: false,
        blank: false,
        initial: "inherit",
        choices: ["inherit"].concat(Object.keys(CONFIG.ARM5E.magic.forms))
      }),
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
    if (data.cost !== undefined && isNaN(data.cost)) {
      data.description += `<h3>Migration note:</h3><p>Cost is now strictly a number, previous value:"${data.cost}", new value: 1</p>`;
      data.cost = 1;
    }
    if (data.init !== undefined && isNaN(data.init)) {
      data.description += `<h3>Migration note:</h3><p>Init is now strictly a number, previous value:"${data.init}", new value: 0`;
      data.init = 0;
    }

    if (data.penetration !== undefined && isNaN(data.penetration)) {
      data.description += `<h3>Migration note:</h3><p>penetration is now strictly a number, previous value:"${data.penetration}", new value: 0`;
      data.penetration = 0;
    }
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
