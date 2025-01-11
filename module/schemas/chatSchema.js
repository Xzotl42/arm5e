import { ArM5eActor } from "../actor/actor.js";
import { ARM5E } from "../config.js";
import { ABILITIES_DEFAULT_ICONS } from "../constants/ui.js";
import { ROLL_PROPERTIES } from "../helpers/rollWindow.js";
import { log } from "../tools.js";
import { boolOption, itemBase, ModifierField, RealmField, XpField } from "./commonSchemas.js";
const fields = foundry.data.fields;
export class BasicChatSchema extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      img: new fields.FilePathField({
        categories: ["IMAGE"],
        initial: null
      })
      // type: new fields.StringField({
      //   required: true,
      //   blank: false,
      //   nullable: true,
      //   initial: "standard",
      //   choices: ["standard", "id", "character", "roll", "combat", "spell"]
      // })
      // style/mode : for announcement, OOC, NPC speech.
    };
  }

  static migrateData(data) {}

  static getDefault(itemData) {}

  static migrate(itemData) {
    const updateData = {};

    return updateData;
  }
}

export class RollChatSchema extends BasicChatSchema {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      confidence: new fields.SchemaField({
        allowed: boolOption(true),
        score: ModifierField()
      }),
      roll: new fields.SchemaField({
        img: new fields.FilePathField({
          categories: ["IMAGE"],
          initial: null
        }),
        itemUuid: new fields.DocumentUUIDField(),
        type: new fields.StringField({
          required: false,
          blank: false,
          choices: Object.keys(ROLL_PROPERTIES),
          initial: "OPTION"
        })
      })
    };
  }

  static migrateData(data) {}

  static getDefault(itemData) {}

  static migrate(itemData) {
    const updateData = {};

    return updateData;
  }
}

export class CombatChatSchema extends RollChatSchema {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      combat: new fields.SchemaField({
        attacker: new fields.DocumentUUIDField(),
        defenders: new fields.ArrayField(new fields.DocumentUUIDField())
      })
    };
  }

  static migrateData(data) {}

  static getDefault(itemData) {}

  static migrate(itemData) {
    const updateData = {};

    return updateData;
  }
}
export class SpellChatSchema extends RollChatSchema {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      spell: new fields.SchemaField({
        caster: new fields.DocumentUUIDField(),
        targets: new fields.ArrayField(new fields.DocumentUUIDField())
      })
    };
  }

  static migrateData(data) {}

  static getDefault(itemData) {}

  static migrate(itemData) {
    const updateData = {};

    return updateData;
  }
}
