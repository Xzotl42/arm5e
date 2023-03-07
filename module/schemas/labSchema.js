import { log } from "../tools.js";
import { itemBase, RealmField, XpField } from "./commonSchemas.js";
const fields = foundry.data.fields;

export class LabSchema extends foundry.abstract.DataModel {
  // TODO remove in V11
  static _enableV10Validation = true;

  static defineSchema() {
    return { ...itemBase() };
  }

  static migrate(data) {
    return data;
  }
}
