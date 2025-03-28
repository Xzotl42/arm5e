import { ARM5E } from "../config.js";
import { ARM5E_DEFAULT_ICONS } from "../constants/ui.js";
import { convertToNumber, log } from "../tools.js";
import { Scriptorium } from "../tools/scriptorium.js";
import { itemBase } from "./commonSchemas.js";
const fields = foundry.data.fields;
export class InhabitantSchema extends foundry.abstract.TypeDataModel {
  //   "habitantMagi",
  //   "habitantCompanion",
  //   "habitantSpecialists",
  //   "habitantHabitants",
  //   "habitantHorses",
  //   "habitantLivestock",

  static defineSchema() {
    return {
      ...itemBase(),
      category: new fields.StringField({
        required: false,
        blank: false,
        initial: "turbula",
        choices: Object.keys(ARM5E.covenant.inhabitants)
      }),
      actorId: new fields.StringField({
        nullable: true,
        required: false,
        blank: true,
        initial: null
      }),
      loyalty: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        initial: 0,
        step: 1
      }),
      job: new fields.StringField({ required: false, blank: true, initial: "" }),
      score: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        initial: 0,
        step: 1
      }),
      fieldOfWork: new fields.StringField({
        required: false,
        blank: false,
        initial: "none",
        choices: Object.keys(ARM5E.covenant.fieldOfWork)
      }),
      quantity: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        initial: 1,
        min: 0,
        step: 1
      }),
      yearBorn: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        // positive: true, // for testing
        initial: 1200,
        step: 1
      }),
      specialistType: new fields.StringField({
        required: false,
        blank: false,
        initial: "other",
        choices: Object.keys(ARM5E.covenant.specialists)
      }),
      giftType: new fields.StringField({
        required: false,
        blank: false,
        initial: "normal",
        choices: Object.keys(ARM5E.covenant.gift)
      }),
      specialistChar: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        initial: 0,
        step: 1
      }),
      teacherScore: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        initial: 0,
        step: 1
      }),
      points: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        initial: 0,
        step: 1
      }),
      extradata: new fields.ObjectField({ required: false, nullable: true, initial: {} })
    };
  }

  static getDefault(itemData) {
    let res = itemData;
    if (res.system === undefined) {
      res.system = {
        category: "turbula"
      };
    }
    return res;
  }

  prepareDerivedData() {
    this.document = game.actors.get(this.actorId);
    if (this.document) {
      this.name = this.document.name;
      this.yearBorn = this.document.system.description.born.value;
      this.category = this.document.isMagus()
        ? "magi"
        : this.document.isCompanion()
        ? "companions"
        : this.category;
      this.linked = true;
    } else {
      this.linked = false;
    }
  }

  static getIcon(item, newValue = null) {
    if (newValue != null) {
      return CONFIG.INHABITANTS_DEFAULT_ICONS[newValue];
    } else {
      return CONFIG.INHABITANTS_DEFAULT_ICONS[item.system.category];
    }
  }

  static migrateData(data) {
    if (data.category === "grogs") {
      data.category = "turbula";
    } else if (data.category === "craftmen") {
      data.category = "craftsmen";
    }
    return data;
  }

  get baseLoyalty() {
    if (this.category == "magi") {
      return CONFIG.ARM5E.covenant.gift[this.giftType ?? "normal"].loyalty;
    } else {
      return 0;
    }
  }

  get buildPoints() {
    if (this.category == "specialists") {
      if (this.specialistType == "teacher") {
        return this.specialistChar ?? 0 + this.score ?? 0 + this.teacherScore ?? 0;
      } else {
        return this.score ?? 0;
      }
    }
    return 0;
  }

  get loyaltyGain() {
    if (this.category == "specialists") {
      switch (this.specialistType) {
        case "steward":
        case "chamberlain":
        case "turbCaptain": {
          return (this.specialistChar ?? 0) + (this.score ?? 0);
        }
        default: {
          return 0;
        }
      }
    }
    return 0;
  }

  /* -------------------------------------------- */
  livingCost(livingConditions) {
    switch (this.category) {
      case "magi":
        switch (livingConditions.magi) {
          case 1:
            return ARM5E.covenant.inhabitants[this.category].points;
          case 2:
            return ARM5E.covenant.inhabitants[this.category].advancedPts;
          case 0:
            return 2;
        }
      default:
        switch (livingConditions.mundane) {
          case 0:
            return ARM5E.covenant.inhabitants[this.category].points;
          case 1:
            return ARM5E.covenant.inhabitants[this.category].advancedPts;
          case 2:
            return ARM5E.covenant.inhabitants[this.category].advancedPts + 1;
          default:
            return ARM5E.covenant.inhabitants[this.category].advancedPts + 2;
        }
    }
  }

  // TEMPLATE CATEGORY
  // switch (this.category) {
  //   case "magi":
  //     break;
  //   case "companions":
  //     break;
  //   case "craftsmen":
  //   case "specialists":
  //     break;
  //   case "turbula":
  //     break;
  //   case "servants":
  //   case "laborers":
  //   case "teamsters":
  //   case "dependants":
  //     break;
  //   case "horses":
  //     break;
  //   case "livestock":
  //     break;
  // }

  get number() {
    switch (this.category) {
      case "magi":
      case "companions":
      case "craftsmen":
      case "specialists":
        return 1;
      case "turbula":
      case "servants":
      case "laborers":
      case "teamsters":
      case "dependants":
      case "horses":
      case "livestock":
        return this.quantity;
      default:
        return 1;
    }
  }

  get craftSavings() {
    switch (this.category) {
      case "craftsmen":
        return Math.floor(1 + this.score / 2);
      case "specialists":
        if (this.specialistType == "other") {
          return this.score;
        }
        return 0;
      case "laborers":
        return 1;
      default:
        return 0;
    }
  }

  static migrate(data) {
    const updateData = {};

    if (data.name != "" && (data.system.actorId == null || data.system.actorId === "")) {
      let inhabitant = game.actors.filter(
        (a) => ["player", "npc", "beast"].includes(a.type) && a.name == data.name
      );
      if (inhabitant.length > 0) {
        updateData["system.actorId"] = inhabitant[0]._id;
      }
    }

    if (
      [
        "habitantMagi",
        "habitantCompanion",
        "habitantSpecialists",
        "habitantHabitants",
        "habitantHorses",
        "habitantLivestock"
      ].includes(data.type)
    ) {
      switch (data.type) {
        case "habitantMagi":
          updateData["system.category"] = "magi";
          if (data.name === "") {
            updateData["name"] = "Magus name";
          }
          updateData["system.extradata.giftType"] = data.giftType;
          break;
        case "habitantCompanion":
          updateData["system.category"] = "companions";
          if (data.name === "") {
            updateData["name"] = "Companion name";
          }
          break;
        case "habitantSpecialists":
          updateData["system.category"] = "specialists";
          if (data.name === "") {
            updateData["name"] = "Specialist name";
          }
          break;
        case "habitantHabitants":
          updateData["system.category"] = "servants";
          if (data.name === "") {
            updateData["name"] = "Grog name";
          }
          break;
        case "habitantHorses":
          updateData["system.category"] = "horses";
          if (data.name === "") {
            updateData["name"] = "Horse name";
          }
          break;
        case "habitantLivestock":
          updateData["system.category"] = "livestock";
          if (data.name === "") {
            updateData["name"] = "LivestockBreed";
          }
          break;
        default:
          updateData["system.category"] = "servants";
          if (data.name === "") {
            updateData["name"] = "A grog";
          }
      }
    }

    if (data.system.category === "craftmen") {
      updateData["system.category"] = "craftsmen";
    }

    if (data.system.category === "grogs") {
      updateData["system.category"] = "turbula";
    }
    if (typeof data.system.loyalty != "number") {
      updateData["system.loyalty"] = convertToNumber(data.system.loyalty, 0);
    }
    if (typeof data.system.score != "number") {
      updateData["system.score"] = convertToNumber(data.system.score, 0);
    }
    if (typeof data.system.quantity != "number") {
      updateData["system.quantity"] = convertToNumber(data.system.quantity, 0);
    }
    if (typeof data.system.yearBorn != "number") {
      updateData["system.yearBorn"] = convertToNumber(data.system.yearBorn, 1200);
    }

    if (data.system.extradata.giftType) {
      updateData["system.giftType"] = data.system.extradata.giftType;
      updateData["system.extradata.-=giftType"] = null;
    }

    return updateData;
  }
}
