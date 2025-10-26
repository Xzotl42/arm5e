import { ARM5E } from "../config.js";
import { compareBaseEffects, compareMagicalEffects, compareSpells } from "../tools.js";

import { boolOption, SeasonField } from "./commonSchemas.js";

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
    indexKey: new fields.StringField({ required: false, blank: true, initial: "" }),
    review_status: new fields.StringField({
      required: false,
      blank: true,
      initial: "toReview",
      choices: Object.keys(CONFIG.ARM5E.generic.reviewStatus)
    }),
    reviewer: new fields.StringField({ required: false, blank: true, initial: "" })
  };
};

export class CodexSchema extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      withCompendia: boolOption(true)
    };
  }

  // static migrateData(data) {
  //   return data;
  // }

  static migrate(data) {
    return {};
  }

  prepareDerivedData() {
    this.parent.img = CONFIG.ARM5E_DEFAULT_ICONS.magicCodex;
    this.baseEffects = [];
    this.magicEffects = [];
    this.spells = [];
    this.enchantments = [];
    for (let [key, item] of this.parent.items.entries()) {
      if (item.type == "baseEffect") {
        this.baseEffects.push(item);
      }
      if (item.type == "magicalEffect") {
        this.magicEffects.push(item);
      }
      if (item.type == "spell") {
        this.spells.push(item);
      }
      if (item.type == "enchantment") {
        this.enchantments.push(item);
      }
    }

    if (this.withCompendia) {
      let spellsCompendium = game.packs.get("arm5e-compendia.spells");
      for (let s of spellsCompendium.index) {
        if (s.type == "spell") this.spells.push(s);
        else if (s.type == "magicalEffect") {
          this.magicalEffects.push(s);
        } else if (s.type == "baseEffect") {
          this.baseEffects.push(s);
        } else if (s.type == "enchantment") {
          this.enchantments.push(s);
        } else if (s.type == "power") {
          // Ignore powers for codex
          continue;
        } else {
          console.warn(
            `CodexSchema: Unexpected item type ${s.type} in spells compendium : ${s.name}`
          );
        }
      }
    }

    this.magicEffects.sort(compareMagicalEffects);
    this.enchantments.sort(compareMagicalEffects);
  }
}
