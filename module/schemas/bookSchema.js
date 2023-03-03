import { ARM5E } from "../config.js";
import { log } from "../tools.js";
import {
  authorship,
  hermeticForm,
  hermeticTechnique,
  itemBase,
  NullableEmbeddedDataField
} from "./commonSchemas.js";
import { LabTextSchema } from "./magicSchemas.js";
const fields = foundry.data.fields;
export class BookSchema extends foundry.abstract.DataModel {
  // TODO remove in V11
  static _enableV10Validation = true;

  static defineSchema() {
    return {
      ...itemBase(),
      ...authorship(),
      topic: new fields.ObjectField({ required: false, nullable: true, initial: null }), // TODO: remove when a way is found
      topics: new fields.ArrayField(
        new fields.SchemaField({
          category: new fields.StringField({
            required: false,
            nullable: false,
            initial: "art",
            choices: ["art", "ability", "labText", "mastery"]
          }),
          art: new fields.StringField({ required: false, nullable: true, initial: "cr" }),
          key: new fields.StringField({ required: false, nullable: true, initial: null }),
          option: new fields.StringField({ required: false, nullable: true, initial: null }),
          spellName: new fields.StringField({ required: false, nullable: true, initial: null }),
          spellTech: hermeticTechnique(),
          spellForm: hermeticForm(),
          labtext: new NullableEmbeddedDataField(LabTextSchema, {
            required: false,
            nullable: true,
            initial: null
          }),
          labtextTitle: new fields.StringField({ required: false, blank: true, initial: "" }),
          quality: new fields.NumberField({
            required: false,
            nullable: false,
            integer: true,
            min: 0,
            initial: 1,
            step: 1
          }),
          level: new fields.NumberField({
            required: false,
            nullable: true,
            integer: true,
            min: 0,
            initial: 1,
            step: 1
          }),
          type: new fields.StringField({
            required: false,
            blank: false,
            nullable: true,
            initial: "Summa",
            choices: ARM5E.books.types
          })
        }),
        {
          required: false,
          initial: [{ category: "art", art: "cr", type: "Summa", quality: 1, level: 1 }]
        }
      )
    };
  }

  static getDefault(itemData) {
    let currentDate = game.settings.get("arm5e", "currentDate");
    if (itemData.system) {
      itemData.system.season = currentDate.season;
      itemData.system.year = Number(currentDate.year);
    } else {
      itemData.system = { season: currentDate.season, year: Number(currentDate.year) };
    }
  }

  static migrateData(data) {
    // console.log(`MigrateData book: ${JSON.stringify(data)}`);
    if (data.topic) {
      if (data.quality > 0) {
        data.topic.quality = data.quality;
        data.quality = 0;
      }
      if (data.level > 0) {
        data.topic.level = data.level;
        data.level = 0;
      }
      if (data.type?.value !== undefined) {
        if (data.type.value == "summa") {
          data.topic.type = "Summa";
        } else if (data.type.value == "tract") {
          data.topic.type = "Tractatus";
        } else {
          data.topic.type = data.type.value;
        }
      } else if (data.type !== undefined && data.type != "") {
        data.topic.type = data.type;
        data.type = "";
      }

      if (data.ability != undefined && data.ability != "") {
        data.topic.category = "ability";
        data.ability = "";
      }
    } else if (data.topic === undefined) {
      // V9 books

      data.topic = {
        quality: data.quality,
        level: data.level,
        // type: data.type,
        art: data.art?.value ?? "an",
        category: "art"
      };

      if (data.ability != undefined && data.ability != "") {
        data.topic.category = "ability";
      }

      if (data.type?.value !== undefined) {
        if (data.type.value == "summa") {
          data.topic.type = "Summa";
        } else if (data.type.value == "tract") {
          data.topic.type = "Tractatus";
        } else {
          data.topic.type = data.type.value;
        }
      } else {
        data.topic.type = data.type;
      }
    }
    // log(false, `TYPE: ${data.topics}`);
    return super.migrateData(data);
  }

  static migrate(itemData) {
    // console.log(`Migrate book: ${JSON.stringify(itemData)}`);
    const updateData = {};

    if (itemData.system.topic !== null) {
      const topic = itemData.system.topic;
      // topic.quality = itemData.system.quality;
      // topic.level = itemData.system.level;
      if (itemData.system.topic.category === "spell") {
        topic.category = "mastery";
      } else {
        topic.category = itemData.system.topic.category;
      }
      // topic.key = t.key;
      // topic.option = t.option;
      // topic.spellName = t.spellName;
      // topic.art = t.art;
      // topic.spellTech = t.spellTech
      // topic.spellForm = t.spellForm

      if (itemData.system.type == "summa") {
        topic.type = "Summa";
      } else if (itemData.system.type == "tract") {
        topic.type = "Tractatus";
      } else {
        if (itemData.system.type === "") {
          topic.type = "Summa";
        } else {
          topic.type = itemData.system.type;
        }
      }
      const topics = [];
      topics.push(topic);
      if (!Object.keys(CONFIG.ARM5E.seasons).includes(itemData.system.season)) {
        if (Object.keys(CONFIG.ARM5E.seasons).includes(itemData.system.season.toLowerCase())) {
          updateData["system.season"] = itemData.system.season.toLowerCase();
        } else {
          updateData["system.season"] = "spring";
        }
      }

      updateData["system.topics"] = topics;
      updateData["system.-=quality"] = null;
      updateData["system.-=level"] = null;
      updateData["system.-=type"] = null;
      updateData["system.-=category"] = null;
      updateData["system.-=types"] = null;
      updateData["system.topic"] = null;
      updateData["system.-=ability"] = null;
    } else {
      let topics = itemData.system.topics;
      let idx = 0;
      for (let t of itemData.system.topics) {
        if (t.type === undefined || t.type === "") {
          if (t.category == "labText") {
            topics[idx].type = null;
          } else {
            topics[idx].type = "Summa";
          }
        } else if (t.type?.value !== undefined) {
          if (t.type.value == "summa") {
            topics[idx].type = "Summa";
          } else if (t.type.value == "tract") {
            topics[idx].type = "Tractatus";
          } else {
            topics[idx].type = data.type.value;
          }
        }
        idx++;
      }
      if (topics.length > 0) {
        updateData["system.topics"] = topics;
      }
    }

    if (itemData.system.year == null || itemData.system.year == undefined) {
      updateData["system.year"] = 1220;
    } else if (typeof itemData.system.year === "string") {
      if (Number.isNaN(itemData.system.year)) {
        updateData["system.year"] = 1220;
      } else {
        updateData["system.year"] = Number(itemData.system.year);
      }
    }
    if (itemData.system.description == null) {
      updateData["system.description"] = "";
    }

    return updateData;
  }
}
