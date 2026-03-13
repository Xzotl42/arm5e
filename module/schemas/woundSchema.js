import { ARM5E } from "../config.js";
import { log } from "../tools/tools.js";
import { getShiftedDate, seasonOrder, seasonsDelta } from "../tools/time.js";
import { baseDescription, itemBase, NullableSchemaField, SeasonField } from "./commonSchemas.js";
const fields = foundry.data.fields;

/**
 * Data model for wound items in the Ars Magica 5e system.
 *
 * A wound tracks the gravity of an injury, its treatment history, and the next recovery
 * roll date.  Gravity can only move along the rank ladder (healthy → light → medium →
 * heavy → incap → dead); the `trend` field biases the next roll toward improvement or
 * worsening.
 *
 * Key fields
 * ----------
 * - `gravity`          Current wound severity key (see CONFIG.ARM5E.recovery.wounds).
 * - `originalGravity`  Severity at time of infliction (for healing log messages).
 * - `trend`            Direction bias: -1 improving, 0 stable, +1 worsening.
 * - `bonus`            Cumulative recovery roll modifier (resets on improvement/worsening).
 * - `nextRoll`         Days-into-season when the next recovery check is due (non-integer ok).
 * - `recoveryTime`     Total days spent in recovery so far (non-integer ok).
 * - `daysFirstSeason`  Days available in the season of first treatment (for offset math).
 * - `inflictedDate`    Season/year the wound was received.
 * - `healedDate`       Season/year the wound reached "healthy" (nullable).
 * - `lastTreatedDate`  Season/year of the most recent treatment (nullable).
 *                      When set, `canBeTreatedThisSeason` uses it directly instead of
 *                      the legacy offset formula, giving cleaner season gating.
 *
 * @extends foundry.abstract.TypeDataModel
 */
export class WoundSchema extends foundry.abstract.TypeDataModel {
  /**
   * Define the Foundry schema for wound item data.
   * All numeric recovery fields use `integer: false` so fractional day values
   * (e.g. incapacitating wounds on a 1-day interval) are stored without rounding.
   * @returns {Object} Schema field definitions
   */
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
      // Date the wound was last treated by a medic (used instead of offset formula for canBeTreatedThisSeason)
      lastTreatedDate: new NullableSchemaField(
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
        { required: false, nullable: true, initial: null }
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
        integer: false,
        initial: 0,
        step: 0.5
      }),
      recoveryTime: new fields.NumberField({
        required: false,
        nullable: false,
        integer: false,
        initial: 0,
        step: 0.5
      }),
      daysFirstSeason: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        initial: 91, // approximate season average (365/4); overwritten at roll time
        step: 1
      }),
      location: baseDescription()
    };
  }

  /**
   * Foundry hook: transform raw stored data before the schema applies defaults.
   * Currently a pass-through; kept for future backwards-compatibility shims.
   * @param {Object} data - Raw item data from the database
   * @returns {Object} The (possibly transformed) data
   */
  static migrateData(data) {
    return data;
  }

  /**
   * System migration hook called by `migrateItemData` for every wound item.
   * Returns a flat update object (dot-notation keys) with any fields that need
   * to be back-filled on older data.
   *
   * Currently handles:
   * - `daysFirstSeason` — back-filled to the season default when absent.
   * - `lastTreatedDate` — derived from the legacy offset formula for wounds
   *   that pre-date the field; set to null for untreated wounds.
   *
   * @param {Object} data - Full item data (including `data.system`)
   * @returns {Object} Flat update object; empty object means no migration needed
   */
  static migrate(data) {
    const updateData = {};
    if (data.system.daysFirstSeason === undefined) {
      // Use the inflicted season's length if known, otherwise fall back to average.
      updateData["system.daysFirstSeason"] =
        ARM5E.recovery.daysInSeason[data.system.inflictedDate?.season] ?? 91;
    }
    // Backfill lastTreatedDate for existing wounds that pre-date the field.
    // If recoveryTime == 0 the wound has never been treated — leave null.
    // Otherwise derive the last treatment season from the offset formula that
    // canBeTreatedThisSeason previously used so existing wounds keep working.
    if (data.system.lastTreatedDate === undefined) {
      const sys = data.system;
      if (!sys.recoveryTime || sys.recoveryTime === 0) {
        updateData["system.lastTreatedDate"] = null;
      } else {
        const daysInSeason = ARM5E.recovery.daysInSeason[sys.inflictedDate?.season] ?? 91;
        const offset = Math.floor(
          (sys.recoveryTime - (sys.daysFirstSeason ?? daysInSeason) + daysInSeason) / daysInSeason
        );
        // offset - 1 because that is the season when the *last* treatment happened
        const lastOffset = Math.max(0, offset - 1);
        const inflicted = sys.inflictedDate ?? { season: "spring", year: 1220 };
        updateData["system.lastTreatedDate"] = getShiftedDate(inflicted, lastOffset);
      }
    }
    return updateData;
  }

  /**
   * Return itemData with sensible defaults applied for a freshly-created wound.
   * Sets `gravity` to "light" and `inflictedDate` to the current in-game date
   * when those fields are absent.
   * @param {Object} itemData - Partial item data to populate
   * @returns {Object} itemData with defaults merged in
   */
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

  /**
   * Return the icon path for a wound's current (or prospective) gravity.
   * @param {Item}   item      - The wound item
   * @param {string} [newValue] - If provided, return the icon for this gravity key
   *                              instead of the item's current gravity.
   * @returns {string} Icon path string
   */
  static getIcon(item, newValue = null) {
    if (newValue != null) {
      return ARM5E.recovery.wounds[newValue].icon;
    } else {
      return ARM5E.recovery.wounds[item.system.gravity].icon;
    }
  }

  /**
   * Determine whether this wound is eligible for a recovery roll in the given season/year.
   *
   * Logic (in priority order):
   * 1. If the wound was inflicted in the future → false.
   * 2. If `recoveryTime === 0` (fresh, never treated) → true.
   * 3. If `lastTreatedDate` is set, compute the next eligible season by shifting
   *    `lastTreatedDate` forward by `ceil(interval / daysInSeason)` seasons and
   *    compare; returns true only when that season matches exactly.
   * 4. Legacy fallback: derive the next roll season from the offset formula
   *    (inflictedDate + accumulated recoveryTime days) and compare.
   *
   * @param {string} season - Season key of the proposed treatment (e.g. "spring")
   * @param {number} year   - Year of the proposed treatment
   * @returns {boolean} True if the wound can be rolled for this season
   */
  canBeTreatedThisSeason(season, year) {
    let currentDate = game.settings.get("arm5e", "currentDate");
    // Wound was inflicted in the future — cannot treat yet
    if (seasonsDelta(currentDate, this.inflictedDate) > 0) return false;
    // Fresh wound: never treated and no recovery time accumulated yet
    if (this.recoveryTime == 0) {
      return true;
    }

    if (year < this.inflictedDate.year) return false;

    // If lastTreatedDate is recorded, use it directly for a clean season comparison
    if (this.lastTreatedDate != null) {
      const delta = seasonsDelta(this.lastTreatedDate, { season: season, year: year });
      // delta == 0  → same season as last treatment → allowed
      // delta  < 0  → would treat again before the next eligible season → not allowed
      // delta  > 0  → future season relative to last treatment → not yet eligible
      // Only allow if next eligible season matches the given season/year:
      // next eligible = season after lastTreatedDate shifted by interval seasons
      let woundConfig =
        CONFIG.ARM5E.recovery.wounds[this.gravity] ?? CONFIG.ARM5E.recovery.wounds["light"];
      // Use the longest season (maxDaysInSeason) so an interval that fits in the
      // shortest season is never over-counted into two seasons.
      let intervalSeasons = Math.ceil(woundConfig.interval / CONFIG.ARM5E.recovery.maxDaysInSeason);
      let nextEligible = getShiftedDate(this.lastTreatedDate, intervalSeasons);
      const eligibleDelta = seasonsDelta(nextEligible, { season: season, year: year });
      return eligibleDelta == 0;
    }

    // Legacy fallback: compute next roll season from inflictedDate + accumulated recoveryTime
    // if recovery time is not 0, wound has already been treated or started mid-season
    if (
      season == this.inflictedDate.season &&
      year == this.inflictedDate.year &&
      this.nextRoll > (CONFIG.ARM5E.recovery.daysInSeason[this.inflictedDate?.season] ?? 91)
    ) {
      return false;
    }
    const _dis = CONFIG.ARM5E.recovery.daysInSeason[this.inflictedDate?.season] ?? 91;
    let offset = Math.floor((this.recoveryTime - this.daysFirstSeason + _dis) / _dis);
    let nextRollDate = getShiftedDate(this.inflictedDate, offset);

    const delta = seasonsDelta(nextRollDate, { season: season, year: year });
    if (delta == 0) return true;

    return false;
  }
}
