import { ARM5E } from "../config.js";
import { log } from "../tools.js";
import { itemBase, RealmField, XpField } from "./commonSchemas.js";
const fields = foundry.data.fields;
export class AbilitySchema extends foundry.abstract.DataModel {
  // TODO remove in V11
  static _enableV10Validation = true;

  static defineSchema() {
    const base = itemBase();
    return {
      ...itemBase(),
      defaultChaAb: new fields.StringField({ required: false, blank: false, initial: "int" }),
      speciality: new fields.StringField({ required: false, blank: true, initial: "" }),
      xp: XpField(),
      key: new fields.StringField({ required: false, blank: true, initial: "" }),
      option: new fields.StringField({ required: false, blank: true, initial: "" }),
      realm: RealmField()
    };
  }

  static migrate(itemData) {
    log(false, "Migrate ability " + itemData.name);
    const updateData = {};
    if (itemData.system.experienceNextLevel != undefined) {
      // if the experience is equal or bigger than the xp for this score, use it as total xp
      let exp = ((itemData.system.score * (itemData.system.score + 1)) / 2) * 5;
      if (itemData.system.experience >= exp) {
        updateData["system.xp"] = itemData.system.experience;
      } else if (itemData.system.experience >= (itemData.system.score + 1) * 5) {
        // if the experience is bigger than the neeeded for next level, ignore it
        updateData["system.xp"] = exp;
      } else {
        // compute normally
        updateData["system.xp"] = exp + itemData.system.experience;
      }
      // TODO: to be uncommentedm when we are sure the new system works
      // updateData["system.-=experience"] = null;
      // updateData["system.-=score"] = null;
      updateData["system.-=experienceNextLevel"] = null;
    }
    // clean-up TODO: remove
    if (itemData.system.puissant) updateData["system.-=puissant"] = null;
    if (itemData.system.affinity) updateData["system.-=affinity"] = null;

    // no key assigned to the ability, try to find one
    if (CONFIG.ARM5E.ALL_ABILITIES[itemData.system.key] == undefined || itemData.system.key == "") {
      log(true, `Trying to find key for ability ${itemData.name}`);
      let name = itemData.name.toLowerCase();
      // handle those pesky '*' at the end of restricted abilities
      if (name.endsWith("*")) {
        name = name.substring(0, name.length - 1);
      }

      // if there is not already a key, try to guess it
      if (itemData.system.key === "" || itemData.system.key === undefined) {
        // Special common cases
        if (game.i18n.localize("arm5e.skill.commonCases.native").toLowerCase() == name) {
          updateData["system.key"] = "livingLanguage";
          updateData["system.option"] = "nativeTongue";
          log(false, `Found key livingLanguage for ability  ${itemData.name}`);
        } else if (game.i18n.localize("arm5e.skill.commonCases.areaLore").toLowerCase() == name) {
          updateData["system.key"] = "areaLore";
          log(false, `Found key areaLore for ability  ${itemData.name}`);
        } else if (game.i18n.localize("arm5e.skill.commonCases.latin").toLowerCase() == name) {
          updateData["system.key"] = "deadLanguage";
          updateData["system.option"] = "Latin";
          log(false, `Found key latin for ability  ${itemData.name}`);
        } else if (game.i18n.localize("arm5e.skill.commonCases.hermesLore").toLowerCase() == name) {
          updateData["system.key"] = "organizationLore";
          updateData["system.option"] = "OrderOfHermes";
          log(false, `Found key hermesLore for ability  ${itemData.name}`);
        } else {
          for (const [key, value] of Object.entries(CONFIG.ARM5E.ALL_ABILITIES)) {
            if (game.i18n.localize(value.mnemonic).toLowerCase() == name) {
              updateData["system.key"] = key;
              log(false, `Found key ${key} for ability  ${itemData.name}`);
              break;
            }
          }
        }
      }
      if (updateData["system.key"] == undefined) {
        log(true, `Unable to find a key for ability  ${itemData.name}`);
      }
    }
    if (itemData.system.option != undefined && itemData.system.option != "") {
      // keep only alphanum chars
      let regex = /[^a-zA-Z0-9]/gi;
      if (itemData.system.option.match(regex) != null)
        updateData["system.option"] = itemData.system.option.replace(regex, "");
    }

    if (itemData.system.description == null) {
      updateData["system.description"] = "";
    }

    return updateData;
  }
}
