import { ARM5E } from "../config.js";
import { log } from "../tools.js";
import {
  characteristicField,
  convertToNumber,
  hermeticForm,
  SeasonField,
  XpField
} from "./commonSchemas.js";
import { SpellSchema, baseLevel } from "./magicSchemas.js";
const fields = foundry.data.fields;

export class DiaryEntrySchema extends foundry.abstract.DataModel {
  // TODO remove in V11
  static _enableV10Validation = true;

  static defineSchema() {
    return {
      description: new fields.StringField({ required: false, blank: true, initial: "" }),
      dates: new fields.ArrayField(
        new fields.SchemaField({
          season: SeasonField(),
          year: new fields.NumberField({
            required: true,
            nullable: false,
            integer: true,
            initial: 1200,
            step: 1
          })
        }),
        { required: false, initial: [] }
      ),
      date: new fields.StringField({
        required: false,
        blank: true,
        initial: ""
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
        initial: 0
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
      optionKey: new fields.StringField({
        required: false,
        blank: false,
        initial: "standard"
      }),
      teacher: new fields.SchemaField({
        id: new fields.StringField({
          required: false,
          nullable: true,
          initial: null
        }),
        name: new fields.StringField({ required: false, blank: true, initial: "Teacher's name" }),
        com: characteristicField(),
        teaching: new fields.NumberField({
          required: false,
          nullable: false,
          integer: true,
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
          new fields.SchemaField({
            id: new fields.StringField({
              required: true,
              blank: false,
              nullable: true,
              initial: null
            }),
            category: new fields.StringField({ required: true, blank: false }),
            teacherScore: new fields.NumberField({
              required: false,
              nullable: false,
              integer: true,
              min: 0,
              initial: 2,
              step: 1
            }),
            xp: XpField()
          })
        ),
        arts: new fields.ArrayField(
          new fields.SchemaField({
            key: new fields.StringField({ required: true, blank: false, initial: "cr" }),
            teacherScore: new fields.NumberField({
              required: false,
              nullable: false,
              integer: true,
              min: 0,
              initial: 5,
              step: 1
            }),
            xp: XpField()
          })
        ),
        spells: new fields.ArrayField(
          new fields.SchemaField({
            id: new fields.StringField({
              required: true,
              blank: false,
              nullable: true,
              initial: null
            }),
            form: hermeticForm(),
            teacherScore: new fields.NumberField({
              required: false,
              nullable: false,
              integer: true,
              min: 0,
              initial: 2,
              step: 1
            }),
            xp: XpField()
          })
        ),
        newSpells: new fields.ArrayField(
          new fields.SchemaField({
            name: new fields.StringField({ required: true, blank: false }),
            label: new fields.StringField({ required: true, blank: false }),
            id: new fields.StringField({
              required: true,
              blank: false,
              nullable: true,
              initial: null
            }),
            img: new fields.StringField({
              required: false,
              blank: true,
              initial: ""
            }),
            level: baseLevel(),
            spellData: new fields.EmbeddedDataField(SpellSchema)
          })
        )
      })
    };
  }

  static getDefault(itemData) {
    let currentDate = game.settings.get("arm5e", "currentDate");
    if (itemData.system) {
      if (itemData.system.dates == undefined) {
        itemData.system.dates = [{ year: currentDate.year, season: currentDate.season }];
      }
    } else {
      itemData.system = { dates: [{ year: currentDate.year, season: currentDate.season }] };
    }
  }

  static migrate(itemData) {
    const updateData = {};

    if (itemData.system.description === null || itemData.system.description === undefined) {
      updateData["system.description"] = "";
    }
    if (itemData.system.sourceQuality == undefined || Number.isNaN(itemData.system.sourceQuality)) {
      updateData["system.sourceQuality"] = 0;
    }
    if (itemData.system.activity === "") {
      updateData["system.activity"] = "none";
    }

    if (itemData.system.optionKey == undefined) {
      updateData["system.optionKey"] = "standard";
    }
    if (itemData.system.teacher === undefined) {
      updateData["system.teacher"] = {
        id: null,
        name: "",
        com: 0,
        teaching: 0,
        speciality: "",
        applySpec: false,
        score: 0
      };
    }

    let currentDate = game.settings.get("arm5e", "currentDate");
    if (itemData.system.year && itemData.system.season) {
      let theYear;
      if (itemData.system.year === "" || itemData.system.year === null) {
        theYear = Number(currentDate.year);
      } else if (typeof itemData.system.year === "string") {
        if (Number.isNaN(itemData.system.year)) {
          theYear = Number(currentDate.year);
        } else {
          theYear = Number(itemData.system.year);
        }
      } else {
        theYear = itemData.system.year;
      }

      let theSeason;
      if (itemData.system.season === "" || itemData.system.season === null) {
        theSeason = currentDate.season;
      } else if (!Object.keys(CONFIG.ARM5E.seasons).includes(itemData.system.season)) {
        if (Object.keys(CONFIG.ARM5E.seasons).includes(itemData.system.season.toLowerCase())) {
          theSeason = itemData.system.season.toLowerCase();
        } else {
          theSeason = "spring";
        }
      } else {
        theSeason = itemData.system.season;
      }
      if (itemData.system.duration === undefined) {
        updateData["system.duration"] = 1;
        if (itemData.system.applied) {
          updateData["system.done"] = 1;
        } else {
          updateData["system.done"] = 0;
        }
      }

      updateData["system.-=applied"] = null;
      updateData["system.-=year"] = null;
      updateData["system.-=season"] = null;
      updateData["system.dates"] = [{ year: theYear, season: theSeason }];
    } else {
      log(false, `DEBUG: Year and season undefined for ${itemData.name}`);
      updateData["system.dates"] = [{ year: Number(currentDate.year), season: currentDate.season }];
    }

    // Fixing Array problems
    if (itemData.system.progress == undefined || isEmpty(itemData.system.progress)) {
      updateData["system.progress"] = { abilities: [], spells: [], arts: [], newSpells: [] };
    } else {
      const prog = duplicate(itemData.system.progress);
      let updateNeeded = false;
      if (!(prog.abilities instanceof Array)) {
        prog.abilities = Object.values(prog.abilities);
        updateNeeded = true;
      }
      for (let a of prog.abilities) {
        if (!a.id) {
          a.id = "dummyid";
          updateNeeded = true;
        }
        if (!a.category) {
          a.category = "general";
          updateNeeded = true;
        }
        if (Number.isNaN(a.teacherScore) || a.teacherScore === "" || a.teacherScore === undefined) {
          a.teacherScore = convertToNumber(a.teacherScore, 2);
          updateNeeded = true;
        }
      }
      if (updateNeeded === true) {
        updateData["system.progress.abilities"] = prog.abilities;
        updateNeeded = false;
      }
      if (!(prog.arts instanceof Array)) {
        prog.arts = Object.values(prog.arts);
        updateNeeded = true;
      }
      for (let a of prog.arts) {
        if (a.key === "") {
          a.key = "cr";
          updateNeeded = true;
        }
        if (Number.isNaN(a.teacherScore) || a.teacherScore === "" || a.teacherScore === undefined) {
          a.teacherScore = convertToNumber(a.teacherScore, 5);
          updateNeeded = true;
        }
      }
      if (updateNeeded === true) {
        updateData["system.progress.arts"] = prog.arts;
        updateNeeded = false;
      }

      if (!(prog.spells instanceof Array)) {
        prog.spells = Object.values(prog.spells);
        updateNeeded = true;
      }

      if (updateNeeded === true) {
        updateData["system.progress.spells"] = prog.spells;
        updateNeeded = false;
      }
      // else {
      //   for (let spell of prog.spells) {
      //     if (!spell.form) {

      //     }
      //   }
      // }
      if (prog.newSpells === undefined) {
        prog.newSpells = [];
        updateNeeded = true;
      } else if (!(prog.newSpells instanceof Array)) {
        prog.newSpells = Object.values(prog.newSpells);
        updateNeeded = true;
      }

      if (updateNeeded === true) {
        updateData["system.progress.newSpells"] = prog.newSpells;
        updateNeeded = false;
      }
    }

    return updateData;
  }
}
