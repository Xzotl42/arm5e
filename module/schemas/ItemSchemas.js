// import DataModel from "common/abstract/data.mjs";
import { ARM5E } from "../config.js";
import { log } from "../tools.js";
import {
  authorship,
  characteristicField,
  hermeticForm,
  hermeticTechnique,
  itemBase,
  RealmField,
  SeasonField,
  XpField
} from "./commonSchemas.js";
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
    updateData["system.-=puissant"] = null;
    updateData["system.-=affinity"] = null;

    // no key assigned to the ability, try to find one
    if (CONFIG.ARM5E.ALL_ABILITIES[itemData.system.key] == undefined || itemData.system.key == "") {
      log(true, `Trying to find key for ability ${itemData.name}`);
      let name = itemData.name.toLowerCase();
      // handle those pesky '*' at the end of restricted abilities
      if (name.endsWith("*")) {
        name = name.substring(0, name.length - 1);
      }

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
      if (updateData["system.key"] == undefined) {
        log(true, `Unable to find a key for ability  ${itemData.name}`);
      }
    }
    if (itemData.system.option != undefined) {
      // keep only alphanum chars
      updateData["system.option"] = itemData.system.option.replace(/[^a-zA-Z0-9]/gi, "");
    }
  }
}

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
      if (data.type !== undefined && data.type != "") {
        data.topic.type = data.type;
        data.type != "";
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

    return super.migrateData(data);
  }

  static migrate(itemData) {
    // console.log(`Migrate book: ${JSON.stringify(itemData)}`);
    const updateData = {};

    if (itemData.system.topic !== null) {
      // console.log("really Migrate book:" + itemData.name);
      let topics = [];

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
        topic.type = itemData.system.type;
      }

      topics.push(topic);
      if (!Object.keys(CONFIG.ARM5E.seasons).includes(itemData.system.season)) {
        if (Object.keys(CONFIG.ARM5E.seasons).includes(itemData.system.season.toLowerCase())) {
          itemData.system.season = itemData.system.season.toLowerCase();
        } else {
          itemData.system.season = "spring";
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
    }
    if (itemData.system.year == null) {
      updateData["system.year"] = "1220";
    }

    return updateData;
  }
}

export class VirtueFlawSchema extends foundry.abstract.DataModel {
  // TODO remove in V11
  static _enableV10Validation = true;

  static defineSchema() {
    return {
      ...itemBase(),
      type: new fields.StringField({
        required: false,
        blank: false,
        initial: "general",
        choices: Object.keys(ARM5E.virtueFlawTypes.character)
          .concat(Object.keys(ARM5E.virtueFlawTypes.laboratory))
          .concat(Object.keys(ARM5E.virtueFlawTypes.covenant))
          .concat("Special")
          .concat("other")
      }),
      impact: new fields.SchemaField(
        {
          value: new fields.StringField({
            required: false,
            blank: false,
            initial: "free",
            choices: Object.keys(ARM5E.impacts).concat("Special")
          })
        },
        { required: true }
      )
    };
  }

  static migrateData(data) {
    // if (data.description == null) {
    //   data.description = "";
    // }
    if (data.type?.value) {
      data.type = data.type.value;
    }
  }

  static migrate(itemData) {
    const updateData = {};
    if (itemData.system.type.value !== undefined) {
      updateData["system.type"] = itemData.system.type.value;
    }
    if (itemData.system.description == null) {
      updateData["system.description"] = "";
    }
    return updateData;
  }
}

export class DiaryEntrySchema extends foundry.abstract.DataModel {
  // TODO remove in V11
  static _enableV10Validation = true;

  static defineSchema() {
    return {
      ...itemBase(),
      season: SeasonField(),
      year: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        initial: 1200,
        step: 1
      }),
      duration: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        positive: true,
        initial: 1
      }),
      done: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        positive: true,
        initial: 1
      }),
      endSeason: new fields.StringField({
        required: false,
        nullable: true,
        initial: null,
        choices: Object.keys(ARM5E.seasons)
      }),
      endYear: new fields.NumberField({
        required: false,
        nullable: true,
        integer: true,
        initial: null,
        step: 1
      }),
      sourceQuality: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        min: 0,
        initial: 0,
        step: 1
      }),
      activity: new fields.StringField({
        required: false,
        blank: false,
        initial: "none",
        choices: Object.keys(ARM5E.activities.generic)
      }),
      teacher: new fields.SchemaField({
        id: new fields.ForeignDocumentField({
          nullable: true,
          initial: null
        }),
        name: new fields.StringField({ required: true, blank: false }),
        com: characteristicField(),
        teaching: new fields.NumberField({
          required: false,
          nullable: false,
          integer: true,
          positive: true,
          initial: 1,
          step: 1
        }),
        applySpec: new fields.BooleanField({ required: false, initial: false }),
        score: new fields.NumberField({
          required: false,
          nullable: false,
          integer: true,
          min: 0,
          initial: 2,
          step: 1
        })
      }),
      progress: new fields.SchemaField({
        abilities: new fields.ArrayField(
          new SchemaField({
            id: new fields.DocumentIdField(),
            category: new fields.StringField({ required: true, blank: false }),
            xp: XpField()
          })
        ),
        arts: new fields.ArrayField(
          new SchemaField({
            key: new fields.StringField({ required: true, blank: false }),
            xp: XpField()
          })
        ),
        spells: new fields.ArrayField(
          new SchemaField({
            id: new fields.DocumentIdField(),
            form: new fields.StringField({ required: true, blank: false }),
            xp: XpField()
          })
        )
      })
    };
  }
}

export class ItemSchema extends foundry.abstract.DataModel {
  // TODO remove in V11
  static _enableV10Validation = true;

  static defineSchema() {
    return {
      ...itemBase(),
      quantity: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        min: 0, // allow quantity of 0 to keep an eye on what is missing
        initial: 1,
        step: 1
      }),
      weight: new fields.NumberField({
        required: false,
        nullable: false,
        min: 0,
        initial: 0
      })
    };
  }

  static migrate(itemData) {
    return {};
  }
}

export class VisSchema extends foundry.abstract.DataModel {
  // TODO remove in V11
  static _enableV10Validation = true;

  static defineSchema() {
    return {
      ...itemBase(),
      art: new fields.StringField({
        required: false,
        blank: false,
        initial: "cr",
        choices: Object.keys(ARM5E.magic.arts)
      }),
      pawns: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        min: 0, // allow quantity of 0 to keep an eye on what is missing
        initial: 1,
        step: 1
      })
    };
  }

  static migrateData(data) {
    // if (data.art == "") {
    //   data.art = "cr";
    // } else
    if (data.art?.value) {
      data.art = data.art.value;
    }
  }

  static migrate(itemData) {
    const updateData = {};
    if (itemData.system.art.value !== undefined) {
      updateData["system.art"] = itemData.system.art.value;
    } else if (itemData.system.art == "") {
      updateData["system.art"] = "cr";
    }
    // get ride of form of vis field
    if (
      itemData.system.form != undefined &&
      itemData.system.form !== "Physical form of the raw vis." &&
      itemData.system.form !== ""
    ) {
      updateData["system.description"] = itemData.system.description + itemData.system.form;
      updateData["system.-=form"] = null;
    }

    return updateData;
  }
}

export class MySchema extends foundry.abstract.DataModel {
  // TODO remove in V11
  static _enableV10Validation = true;

  static defineSchema() {
    return { ...itemBase() };
  }
}
