import { ARM5E } from "../config.js";
import { log } from "../tools.js";
import { Scriptorium, ScriptoriumObject } from "../tools/scriptorium.js";
import {
  CostField,
  hermeticForm,
  hermeticTechnique,
  itemBase,
  authorship
} from "./commonSchemas.js";
import { EnchantmentExtension, ItemState } from "./enchantmentSchema.js";
import { LabTextTopicSchema } from "./magicSchemas.js";
const fields = foundry.data.fields;
export class BookSchema extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      ...itemBase(),
      author: new fields.StringField({
        // deprecated
        required: false,
        blank: true,
        nullable: true,
        initial: null
      }),
      year: new fields.NumberField({
        // deprecated
        required: false,
        nullable: true,
        initial: null
      }),
      season: new fields.StringField({
        // deprecated
        required: false,
        nullable: true,
        initial: null
      }),
      language: new fields.StringField({
        // deprecated
        required: false,
        nullable: true,
        initial: null
      }),
      topic: new fields.ObjectField({ required: false, nullable: true, initial: null }), // TODO: remove when a way is found
      topics: new fields.ArrayField(
        new fields.SchemaField({
          ...authorship(),
          category: new fields.StringField({
            required: false,
            nullable: false,
            initial: "art",
            choices: ["art", "ability", "labText", "mastery"]
          }),
          art: new fields.StringField({ required: false, nullable: true, initial: "cr" }),
          key: new fields.StringField({ required: false, nullable: true, initial: null }),
          option: new fields.StringField({ required: false, nullable: true, initial: null }),
          name: new fields.StringField({ required: false, nullable: true, initial: null }),
          spellName: new fields.StringField({ required: false, nullable: true, initial: null }), // TODO merge in "name"
          spellTech: hermeticTechnique(),
          spellForm: hermeticForm(),
          labtext: new fields.EmbeddedDataField(LabTextTopicSchema, {
            required: false,
            nullable: true,
            initial: null
          }),
          labtextTitle: new fields.StringField({ required: false, blank: true, initial: "" }), // TODO merge in "name"
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
            initial: 0,
            step: 1
          }),
          type: new fields.StringField({
            required: false,
            blank: false,
            nullable: true,
            initial: "Summa",
            choices: Object.values(ARM5E.books.types)
          })
        }),
        {
          required: false,
          initial: [] //{ category: "art", art: "cr", type: "Summa", quality: 1, level: 1 }]
        }
      ),
      state: ItemState(),
      enchantments: new fields.EmbeddedDataField(EnchantmentExtension, {
        nullable: true,
        initial: null
      }),
      cost: CostField("priceless"),
      quantity: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        min: 0, // allow quantity of 0 to keep an eye on what is missing
        initial: 1,
        step: 1
      })
    };
  }

  sanitize() {
    return BookSchema.sanitizeData(this.toObject());
  }

  buildPoints(topic) {
    switch (topic.category) {
      case "mastery":
        return topic.quality;
      case "ability":
        if (topic.type == "Summa") {
          return 3 * topic.level + topic.quality;
        } else if (topic.type == "Tractatus") {
          return topic.quality;
        }
        break;
      case "art":
        if (topic.type == "Summa") {
          return topic.level + topic.quality;
        } else if (topic.type == "Tractatus") {
          return topic.quality;
        }
        break;
      case "labText":
        return topic.labtext.buildPoints;
      default:
        break;
    }
    return 0;
  }

  static sanitizeData(data) {
    data.topics = data.topics instanceof Array ? data.topics : Object.values(data.topics);
    for (const topic of data.topics) {
      if (topic.category === "labText") {
        topic.labtext = LabTextTopicSchema.sanitizeData(topic.labtext);
      }
    }
    if (data.enchantments) {
      data.enchantments = EnchantmentExtension.sanitizeData(data.enchantments);
    }
    return data;
  }

  static getDefault(itemData) {
    let res = itemData;
    let currentDate = game.settings.get("arm5e", "currentDate");
    if (itemData.system) {
      // res.system.year = Number(currentDate.year);
      if (itemData.system.topics == undefined) {
        res.system.topics = [
          // {
          //   category: "art",
          //   art: "cr",
          //   type: "Summa",
          //   quality: 1,
          //   level: 1,
          //   season: currentDate.season,
          //   year: Number(currentDate.year)
          // }
        ];
      }
    } else {
      res.system = {
        topics: [
          // {
          //   category: "art",
          //   art: "cr",
          //   type: "Summa",
          //   quality: 1,
          //   level: 1,
          //   season: currentDate.season,
          //   year: Number(currentDate.year)
          // }
        ]
      };
    }
    return res;
  }

  getTableOfContents() {
    return "TODO";
  }

  static getTableOfContentsSynthetic(systemData) {
    let res = `<h3>${game.i18n.localize("arm5e.book.tableContents")}</h3><ol>`;
    for (const topic of systemData.topics) {
      let about;
      switch (topic.category) {
        case "mastery":
          about = `"${topic.spellName}" (${CONFIG.ARM5E.magic.arts[topic.spellTech].short} ${
            CONFIG.ARM5E.magic.arts[topic.spellForm].short
          }) `;
          break;
        case "ability":
          const ab = CONFIG.ARM5E.ALL_ABILITIES[topic.key];
          if (ab) {
            about = `"${game.i18n.format(ab.mnemonic, { option: topic.option })}"`;
          } else {
            about = `"${game.i18.localize("arm5e.generic.unknown")} ${game.i18nlocalize(
              "arm5e.sheet.bookTopic"
            )}"`;
          }
          break;
        case "art":
          about = CONFIG.ARM5E.magic.arts[topic.art].label;
          break;
        case "labText":
          about = topic.labtextTitle;
          break;
      }

      if (topic.category == "labText") {
        let type = "other";
        switch (topic.labtext.type) {
          case "spell":
            type = game.i18n.localize("ITEM.TypeSpell");

            break;
          case "enchantment":
            type = game.i18n.localize("ITEM.TypeEnchantment");
            break;
        }
        res += `<li>${game.i18n.localize("ITEM.TypeLaboratorytext")} (${type}) "${about}"`;
      } else {
        switch (topic.type) {
          case "Summa":
            res += `<li>${game.i18n.format("arm5e.book.summaShort", {
              quality: topic.quality,
              level: topic.level
            })} ${about}`;
            break;
          case "Tractatus":
            res += `<li>${game.i18n.format("arm5e.book.tractShort", {
              quality: topic.quality
            })} ${about}`;
            break;
        }
      }
      //
    }
    res += "</ol>";
    return res;
  }

  async readBook(item, dataset) {
    const topic = this.topics[dataset.index];
    if (topic.category == "labText") {
      return;
    }

    let formData = new ScriptoriumObject();
    formData.reading.book = {
      uuid: item.uuid,
      id: item._id,
      name: item.name,
      system: this.toObject()
    };
    formData.reading.book.system.topicIndex = Number(dataset.index);
    if (item.isOwned && item.actor.isCharacter()) {
      formData.reading.reader.id = item.actor.id;
    }

    const scriptorium = new Scriptorium(formData, {}); // data, options
    const res = await scriptorium.render(true);
    if (formData.reading.reader.id) {
      item.actor.apps[scriptorium.appId] = scriptorium;
    }
  }
  async copyBook(item, dataset) {
    const topic = this.topics[dataset.index];
    if (topic.category == "labText") {
      return;
    }

    let formData = new ScriptoriumObject();
    if (item.isOwned && item.actor.isCharacter()) {
      formData.copying.scribe.id = item.actor.id;
      formData.copying.scribe.name = item.actor.name;
    }
    const scriptorium = new Scriptorium(formData, {}); // data, options

    await scriptorium._addBookToCopy(item);
    const res = await scriptorium.render(true);
  }

  static migrate(itemData) {
    // console.log(`Migrate book: ${JSON.stringify(itemData)}`);
    const updateData = {};

    if (itemData.system.topic !== null && itemData.system.topics.length === 0) {
      console.log(`DEBUG Migrate monotopic book 2: ${JSON.stringify(itemData)}`);
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

      if (itemData.system.topic.type == "summa") {
        topic.type = "Summa";
      } else if (itemData.system.topic.type == "tract") {
        topic.type = "Tractatus";
      }

      const topics = [];
      topics.push(topic);
      // if (!Object.keys(CONFIG.ARM5E.seasons).includes(itemData.system.season)) {
      //   if (Object.keys(CONFIG.ARM5E.seasons).includes(itemData.system.season.toLowerCase())) {
      //     updateData["system.season"] = itemData.system.season.toLowerCase();
      //   } else {
      //     updateData["system.season"] = "spring";
      //   }
      // }

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

        if (t.type === "Tractatus" && t.level > 0) {
          topics[idx].level = 0;
        }

        if (t.category === "labText") {
          if (t.labtext === undefined || t.labtext === null) {
            topics[idx].labtext = { type: "spell" };
          } else if (t.labtext.type === undefined) {
            topics[idx].labtext.type = "spell";
          }
        }

        if (itemData.system.year) {
          topics[idx].year = itemData.system.year;
          updateData["system.year"] = null;
        }
        if (itemData.system.season) {
          topics[idx].season = itemData.system.season;
          updateData["system.season"] = null;
        }
        if (itemData.system.language) {
          topics[idx].language = itemData.system.language;
          updateData["system.language"] = null;
        }
        if (itemData.system.author) {
          topics[idx].author = itemData.system.author;
          updateData["system.author"] = null;
        }
        idx++;
      }
      if (topics.length > 0) {
        updateData["system.topics"] = topics;
      }
    }

    // if (itemData.system.year == null || itemData.system.year == undefined) {
    //   updateData["system.year"] = 1220;
    // } else if (typeof itemData.system.year === "string") {
    //   if (!Number.isNumeric(itemData.system.year)) {
    //     updateData["system.year"] = 1220;
    //   } else {
    //     updateData["system.year"] = Number(itemData.system.year);
    //   }
    // }

    // if (!Object.keys(CONFIG.ARM5E.seasons).includes(itemData.system.season)) {
    //   if (Object.keys(CONFIG.ARM5E.seasons).includes(itemData.system.season.toLowerCase())) {
    //     updateData["system.season"] = itemData.system.season.toLowerCase();
    //   } else {
    //     updateData["system.season"] = "spring";
    //   }
    // }

    if (itemData.system.description == null) {
      updateData["system.description"] = "";
    }
    updateData["system.topic"] = null;
    return updateData;
  }
}
