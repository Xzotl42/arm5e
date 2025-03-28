import { ARM5E } from "../config.js";
import { log } from "../tools.js";
import { getShiftedDate, seasonOrder, seasonsDelta } from "../tools/time.js";
import { baseDescription, itemBase, NullableSchemaField, SeasonField } from "./commonSchemas.js";
const fields = foundry.data.fields;

export class WoundSchema extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      ...itemBase(),
      inflictedDate: new fields.SchemaField({
        season: SeasonField(),
        year: new fields.NumberField({
          required: false,
          nullable: false,
          integer: true,
          initial: 1220,
          step: 1
        })
      }),
      healedDate: new NullableSchemaField(
        {
          season: SeasonField(),
          year: new fields.NumberField({
            required: false,
            nullable: true,
            integer: true,
            initial: null,
            step: 1
          })
        },
        { required: false, nullable: true, initial: {} }
      ),
      originalGravity: new fields.StringField({
        required: false,
        blank: false,
        initial: "light",
        choices: Object.keys(ARM5E.recovery.wounds)
      }),
      gravity: new fields.StringField({
        required: true,
        blank: false,
        initial: "light",
        choices: Object.keys(ARM5E.recovery.wounds)
      }),
      trend: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        initial: 0,
        step: 1,
        min: -1,
        max: 1
      }),
      bonus: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        initial: 0,
        step: 1
      }),
      nextRoll: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        initial: 0,
        step: 0.5
      }),
      recoveryTime: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        initial: 0,
        step: 0.5
      }),
      daysFirstSeason: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        initial: ARM5E.recovery.daysInSeason,
        step: 1
      }),
      location: baseDescription()
    };
  }

  static migrateData(data) {
    return data;
  }

  static migrate(data) {
    const updateData = {};
    if (data.system.daysFirstSeason === undefined) {
      updateData["system.daysFirstSeason"] = ARM5E.recovery.daysInSeason;
    }
    return updateData;
  }

  static getDefault(itemData) {
    let currentDate = game.settings.get("arm5e", "currentDate");
    let res = itemData;
    if (itemData.system) {
      if (itemData.system.gravity == undefined) {
        res.system.gravity = "light";
        res.system.inflictedDate = { year: Number(currentDate.year), season: currentDate.season };
      }
    } else {
      res = {
        system: {
          gravity: "light",
          inflictedDate: { year: Number(currentDate.year), season: currentDate.season }
        }
      };
    }
    return res;
  }

  static getIcon(item, newValue = null) {
    if (newValue != null) {
      return ARM5E.recovery.wounds[newValue].icon;
    } else {
      return ARM5E.recovery.wounds[item.system.gravity].icon;
    }
  }

  canBeTreatedThisSeason(season, year) {
    let currentDate = game.settings.get("arm5e", "currentDate");
    if (seasonsDelta(currentDate, this.inflictedDate) > 0) return false;
    if (this.recoveryTime == 0) {
      return true;
    }

    if (year < this.inflictedDate.year) return false;

    // if recovery time is not 0, wound has already been treated or started mid-season
    if (
      season == this.inflictedDate.season &&
      year == this.inflictedDate.year &&
      this.nextRoll > CONFIG.ARM5E.recovery.daysInSeason
    ) {
      return false;
    }
    let offset = Math.floor(
      (this.recoveryTime - this.daysFirstSeason + CONFIG.ARM5E.recovery.daysInSeason) /
        CONFIG.ARM5E.recovery.daysInSeason
    );
    let nextRollDate = getShiftedDate(this.inflictedDate, offset);

    const delta = seasonsDelta(nextRollDate, { season: season, year: year });
    if (delta == 0) return true;

    return false;
  }
}
