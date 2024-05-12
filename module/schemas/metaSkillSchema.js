import { ARM5E } from "../config.js";
import { ABILITIES_DEFAULT_ICONS } from "../constants/ui.js";
import { log } from "../tools.js";
import { itemBase, RealmField, XpField } from "./commonSchemas.js";
const fields = foundry.data.fields;
export class MetaSkillSchema extends foundry.abstract.DataModel {
  // TODO remove in V11
  static _enableV10Validation = true;

  static defineSchema() {
    return {
      ...itemBase(),
      defaultChaAb: new fields.StringField({ required: false, blank: false, initial: "int" }),
      xp: XpField()
    };
  }

  static migrate(itemData) {
    // log(false, "Migrate ability " + itemData.name);
    const updateData = {};

    if (itemData.system.xp === null) {
      updateData["system.xp"] = 0;
    }

    if (itemData.system.description == null) {
      updateData["system.description"] = "";
    }

    return updateData;
  }
}
