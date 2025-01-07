import { ARM5E } from "../config.js";
import { ABILITIES_DEFAULT_ICONS } from "../constants/ui.js";
import { log } from "../tools.js";
import { boolOption, itemBase, RealmField, XpField } from "./commonSchemas.js";
const fields = foundry.data.fields;
export class AbilitySchema extends foundry.abstract.DataModel {
  // TODO remove in V11
  static _enableV10Validation = true;

  static defineSchema() {
    return {
      ...itemBase(),
      defaultChaAb: new fields.StringField({ required: false, blank: false, initial: "int" }),
      speciality: new fields.StringField({ required: false, blank: true, initial: "" }),
      xp: XpField(),
      accelerated: boolOption(false),
      key: new fields.StringField({ required: false, blank: false, initial: "awareness" }),
      // category: new fields.StringField({
      //   required: false,
      //   blank: false,
      //   initial: "general",
      //   choices: Object.keys(ARM5E.ABILITIES_CATEGORIES)
      // }),
      option: new fields.StringField({ required: false, blank: true, initial: "" }),
      optionLinked: boolOption(true),
      realm: RealmField()
    };
  }

  static getIcon(item, newValue = null) {
    if (["altTechnique", "altForm"].includes(item.system.category)) {
      return "icons/magic/defensive/barrier-shield-dome-blue-purple.webp";
    } else {
      if (newValue != null) {
        return ABILITIES_DEFAULT_ICONS.MONO[newValue] ?? CONFIG.ARM5E_DEFAULT_ICONS["ability"];
      } else {
        return (
          ABILITIES_DEFAULT_ICONS.MONO[item.system.key] ?? CONFIG.ARM5E_DEFAULT_ICONS["ability"]
        );
      }
    }
  }

  static migrateData(data) {
    if (data.optionLinked === undefined) data.optionLinked = false;

    return data;
  }

  static getDefault(itemData) {
    let res = itemData;
    if (itemData.system) {
      if (itemData.system.key == undefined) {
        res.system.key = "awareness";
      }
    } else {
      res = { system: { key: "awareness" } };
    }
    return res;
  }

  getComputedKey() {
    return this.option != "" ? `${this.key}_${this.option}` : this.key;
  }

  isAlternateArt() {
    return ["altTechnique", "altForm"].includes(this.category);
  }

  async increaseScore() {
    let xpMod = 0;
    if (
      ["supernaturalCat", "altTechnique", "altForm"].includes(this.category) &&
      this.parent.isOwned
    ) {
      let key = this.option == "" ? this.key : this.key + "_" + this.option;
      xpMod = this.parent.parent.system.bonuses.skills[key].xpMod;
    }
    let oldXp = this.xp;
    let newXp = Math.round(
      (((this.derivedScore + 1) * (this.derivedScore + 2) * (this.accelerated ? 1 : 5)) / 2 -
        xpMod) /
        this.xpCoeff
    );

    await this.parent.update(
      {
        system: {
          xp: newXp
        }
      },
      {}
    );
    let delta = newXp - oldXp;
    console.log(`Added ${delta} xps from ${oldXp} to ${newXp}`);
  }

  async decreaseScore() {
    let xpMod = 0;
    if (
      ["supernaturalCat", "altTechnique", "altForm"].includes(this.category) &&
      this.parent.isOwned
    ) {
      let key = this.option == "" ? this.key : this.key + "_" + this.option;
      xpMod = this.parent.parent.system.bonuses.skills[key].xpMod;
    }
    let futureXp = Math.round(
      ((this.derivedScore - 1) * this.derivedScore * (this.accelerated ? 1 : 5)) /
        (2 * this.xpCoeff)
    );
    let newXp = 0;
    if (futureXp >= Math.round(xpMod * this.xpCoeff)) {
      newXp = Math.round(
        (((this.derivedScore - 1) * this.derivedScore * (this.accelerated ? 1 : 5)) / 2 - xpMod) /
          this.xpCoeff
      );
    }
    if (newXp != this.xp) {
      await this.parent.update(
        {
          system: {
            xp: newXp
          }
        },
        {}
      );
      let delta = newXp - this.xp;
      console.log(`Removed ${delta} xps from ${this.xp} to ${newXp} total`);
    }
  }

  static migrate(itemData) {
    // log(false, "Migrate ability " + itemData.name);
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
      updateData["system.-=experience"] = null;
      updateData["system.-=score"] = null;
      updateData["system.-=experienceNextLevel"] = null;
    }

    if (itemData.system.xp === null) {
      updateData["system.xp"] = 0;
    }

    // clean-up TODO: remove
    if (itemData.system.puissant) updateData["system.-=puissant"] = null;
    if (itemData.system.affinity) updateData["system.-=affinity"] = null;

    // no key assigned to the ability, try to find one
    if (CONFIG.ARM5E.ALL_ABILITIES[itemData.system.key] == undefined || itemData.system.key == "") {
      // log(true, `Trying to find key for ability ${itemData.name}`);
      let name = itemData.name.toLowerCase();
      // handle those pesky '*' at the end of restricted abilities
      if (name.endsWith("*")) {
        name = name.substring(0, name.length - 1);
      }

      if (itemData.system.key === "civilCanonLaw") {
        updateData["system.key"] = "law";
        updateData["system.option"] = "CivilAndCanon";
      } else if (itemData.system.key == "commonLaw") {
        updateData["system.key"] = "law";
        updateData["system.option"] = "Common";
      }
      // if there is not already a key, try to guess it
      else if (itemData.system.key === "" || itemData.system.key === undefined) {
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
        log(true, `Unable to find a key for ability  ${itemData.name} defaulting to awareness`);
        updateData["system.key"] = "awareness";
      }
    }
    if (itemData.system.option != undefined && itemData.system.option != "") {
      // keep only alphanum chars
      let regex = /[^a-zA-Z0-9-]/gi;
      if (itemData.system.option.match(regex) != null)
        updateData["system.option"] = itemData.system.option.replace(regex, "");
    } else {
      // generic ability without any ability option
      if (
        CONFIG.ARM5E.ALL_ABILITIES[itemData.system.key] &&
        CONFIG.ARM5E.ALL_ABILITIES[itemData.system.key].option
      ) {
        updateData["system.option"] = foundry.utils.randomID();
      }
    }

    if (itemData.system.description == null) {
      updateData["system.description"] = "";
    }

    return updateData;
  }

  static getAbilityXp(score) {
    return ((score * (score + 1)) / 2) * 5;
  }

  // get the score given an amount of xp
  static getAbilityScoreFromXp(xpAmount) {
    let xp = Math.floor(xpAmount / 5);
    let res = 0;
    while (xp > res) {
      res++;
      xp = xp - res;
    }
    return res;
  }
}
