import { ARM5E } from "../config.js";
import { ARM5E_DEFAULT_ICONS } from "../constants/ui.js";
import { convertToNumber, log } from "../tools/tools.js";
import { Scriptorium } from "../apps/scriptorium.js";
import { boolOption, itemBase } from "./commonSchemas.js";
import { PersonalityTraitSchema } from "./minorItemsSchemas.js";
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
      companionRole: new fields.StringField({
        required: false,
        blank: false,
        initial: "other",
        choices: ["none", ...Object.keys(ARM5E.covenant.companionRoles)]
      }),
      syncAbilityId: new fields.StringField({ required: false, blank: true, initial: "" }),
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
      isRare: new fields.BooleanField({
        required: false,
        nullable: false,
        initial: false
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
      const syncData = InhabitantSchema.getLinkedSyncData(this, this.document);
      Object.assign(this, syncData);
      this.name = this.document.name;
      this.yearBorn = this.document.system.description.born.value;
      if (this.category === "companions" && this.companionRole === "none") {
        this.companionRole = "other";
      }
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

  static getLinkedSyncData(inhabitant, actor) {
    if (!actor) return {};

    const syncData = {};
    const yearBorn = convertToNumber(actor.system?.description?.born?.value, undefined);
    if (yearBorn !== undefined) syncData.yearBorn = yearBorn;

    const loyalty = InhabitantSchema.getLinkedLoyalty(actor);
    syncData.loyalty = loyalty ?? 0;

    Object.assign(syncData, InhabitantSchema.getLinkedCompanionRoleSyncData(inhabitant, actor));
    Object.assign(syncData, InhabitantSchema.getLinkedSpecialistSyncData(inhabitant, actor));
    Object.assign(syncData, InhabitantSchema.getLinkedCraftsmanSyncData(inhabitant, actor));

    return syncData;
  }

  static getLinkedLoyalty(actor) {
    const loyaltyTrait = actor?.items?.find((item) => {
      if (item.type !== "personalityTrait") return false;
      const indexKey = item.system?.indexKey ?? "";
      const name = (item.name ?? "").trim().toLowerCase();
      return indexKey === "loyalty" || name === "loyalty";
    });

    if (!loyaltyTrait) return undefined;
    if (typeof loyaltyTrait.system?.score === "number") return loyaltyTrait.system.score;
    return PersonalityTraitSchema.getScore(loyaltyTrait.system?.xp ?? 0);
  }

  static getLinkedSpecialistSyncData(inhabitant, actor) {
    if (inhabitant.category !== "specialists") return {};

    switch (inhabitant.specialistType) {
      case "teacher": {
        const specialistChar = convertToNumber(actor.system?.characteristics?.com?.value, undefined);
        const teacherScore = actor.getAbility?.("teaching")
          ? actor.getAbilityStats("teaching")?.score
          : undefined;
        const syncData = {};
        if (specialistChar !== undefined) syncData.specialistChar = specialistChar;
        syncData.teacherScore = teacherScore ?? 0;
        return syncData;
      }
      case "steward":
      case "chamberlain": {
        const specialistChar = convertToNumber(actor.system?.characteristics?.pre?.value, undefined);
        const professionLabels = [
          game.i18n.localize(`arm5e.covenant.specialist.${inhabitant.specialistType}`),
          inhabitant.job,
          inhabitant.specialistType,
          inhabitant.specialistType.replace(/([A-Z])/g, " $1").trim()
        ].filter((value) => typeof value === "string" && value !== "");
        const profession = InhabitantSchema.getLinkedAbilityStats(actor, "profession", professionLabels);
        const syncData = {};
        if (specialistChar !== undefined) syncData.specialistChar = specialistChar;
        syncData.score = profession?.score ?? 0;
        return syncData;
      }
      case "turbCaptain": {
        const specialistChar = convertToNumber(actor.system?.characteristics?.pre?.value, undefined);
        const leadership = actor.getAbility?.("leadership")
          ? actor.getAbilityStats("leadership")?.score
          : undefined;
        const syncData = {};
        if (specialistChar !== undefined) syncData.specialistChar = specialistChar;
        syncData.score = leadership ?? 0;
        return syncData;
      }
      default:
        return {};
    }
  }

  static getLinkedCompanionRoleSyncData(inhabitant, actor) {
    if (inhabitant.category !== "companions") return {};

    switch (inhabitant.companionRole) {
      case "teacher": {
        const companionChar = convertToNumber(actor.system?.characteristics?.com?.value, undefined);
        const teachingScore = actor.getAbility?.("teaching")
          ? actor.getAbilityStats("teaching")?.score
          : undefined;
        const syncData = {};
        if (companionChar !== undefined) syncData.specialistChar = companionChar;
        syncData.teacherScore = teachingScore ?? 0;
        return syncData;
      }
      case "steward":
      case "chamberlain": {
        const companionChar = convertToNumber(actor.system?.characteristics?.pre?.value, undefined);
        const professionLabels = [
          game.i18n.localize(`arm5e.covenant.specialist.${inhabitant.companionRole}`),
          inhabitant.job,
          inhabitant.companionRole,
          inhabitant.companionRole.replace(/([A-Z])/g, " $1").trim()
        ].filter((value) => typeof value === "string" && value !== "");
        const profession = InhabitantSchema.getLinkedAbilityStats(actor, "profession", professionLabels);
        const syncData = {};
        if (companionChar !== undefined) syncData.specialistChar = companionChar;
        syncData.score = profession?.score ?? 0;
        return syncData;
      }
      case "turbCaptain": {
        const companionChar = convertToNumber(actor.system?.characteristics?.pre?.value, undefined);
        const leadership = actor.getAbility?.("leadership")
          ? actor.getAbilityStats("leadership")?.score
          : undefined;
        const syncData = {};
        if (companionChar !== undefined) syncData.specialistChar = companionChar;
        syncData.score = leadership ?? 0;
        return syncData;
      }
      default:
        return {};
    }
  }

  static getLinkedCraftsmanSyncData(inhabitant, actor) {
    if (inhabitant.category !== "craftsmen" && !(inhabitant.category === "companions" && inhabitant.companionRole === "craftsman")) {
      return {};
    }
    if (!inhabitant.syncAbilityId) return {};

    const ability = actor.items?.get(inhabitant.syncAbilityId);
    if (!ability) return { score: 0 };

    return {
      score: ability.system?.finalScore ?? inhabitant.score
    };
  }

  static getLinkedAbilityStats(actor, key, options = [""]) {
    for (const option of options) {
      const ability = actor.getAbility?.(key, option);
      if (ability) return actor.getAbilityStats(key, option);
    }
    return undefined;
  }

  static getIcon(item, newValue = null) {
    if (newValue !== null) {
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
    if (this.category === "magi") {
      return CONFIG.ARM5E.covenant.gift[this.giftType ?? "normal"].loyalty;
    } else {
      return 0;
    }
  }

  get buildPoints() {
    if (this.category === "specialists") {
      if (this.specialistType === "teacher") {
        return (this.specialistChar ?? 0) + (this.score ?? 0) + (this.teacherScore ?? 0);
      }
      return this.score ?? 0;
    }
    if (this.category === "companions" && this.companionRole === "teacher") {
      return this.companionRoleChar + (this.score ?? 0) + this.companionTeacherScore;
    }
    return 0;
  }

  get loyaltyGain() {
    const role = this.category === "companions" ? this.companionRole : this.specialistType;
    if (["steward", "chamberlain", "turbCaptain"].includes(role)) {
      return this.roleChar + (this.score ?? 0);
    }
    return 0;
  }

  get roleChar() {
    if (["steward", "chamberlain", "turbCaptain"].includes(this.companionRole)) {
      if (this.linked && this.document?.system?.characteristics?.pre?.value !== undefined) {
        return this.document.system.characteristics.pre.value;
      }
    }
    return this.specialistChar ?? 0;
  }

  get companionRoleChar() {
    if (this.companionRole === "teacher") {
      if (this.linked && this.document?.system?.characteristics?.com?.value !== undefined) {
        return this.document.system.characteristics.com.value;
      }
      return this.specialistChar ?? 0;
    }
    return this.roleChar;
  }

  get companionTeacherScore() {
    if (this.companionRole === "teacher" && this.linked && this.document?.getAbilityStats) {
      return this.document.getAbilityStats("teaching")?.score ?? this.teacherScore ?? 0;
    }
    return this.teacherScore ?? 0;
  }

  get covenantRole() {
    if (this.category === "companions") return this.companionRole;
    if (this.category === "specialists") return this.specialistType;
    return "other";
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
      case "specialists":
        return 1;
      case "craftsmen":
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
        if (this.isRare) {
          return this.score;
        }
        else {
          return Math.floor(1 + this.score / 2);
        }
      case "companions":
        if (["craftsman", "craftsmen"].includes(this.companionRole)) {
          return this.isRare ? this.score : Math.floor(1 + this.score / 2);
        }
        return 0;
      case "specialists":
        if (this.specialistType === "other") {
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

    if (data.name !== "" && (data.system.actorId === null || data.system.actorId === "")) {
      let inhabitant = game.actors.filter(
        (a) => ["player", "npc", "beast"].includes(a.type) && a.name === data.name
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
            updateData.name = "Magus name";
          }
          updateData["system.extradata.giftType"] = data.giftType;
          break;
        case "habitantCompanion":
          updateData["system.category"] = "companions";
          if (data.name === "") {
            updateData.name = "Companion name";
          }
          break;
        case "habitantSpecialists":
          updateData["system.category"] = "specialists";
          if (data.name === "") {
            updateData.name = "Specialist name";
          }
          break;
        case "habitantHabitants":
          updateData["system.category"] = "servants";
          if (data.name === "") {
            updateData.name = "Grog name";
          }
          break;
        case "habitantHorses":
          updateData["system.category"] = "horses";
          if (data.name === "") {
            updateData.name = "Horse name";
          }
          break;
        case "habitantLivestock":
          updateData["system.category"] = "livestock";
          if (data.name === "") {
            updateData.name = "LivestockBreed";
          }
          break;
        default:
          updateData["system.category"] = "servants";
          if (data.name === "") {
            updateData.name = "A grog";
          }
      }
    }

    if (data.system.category === "craftmen") {
      updateData["system.category"] = "craftsmen";
    }

    if (data.system.category === "grogs") {
      updateData["system.category"] = "turbula";
    }
    if (data.system.category === "companions" && data.system.companionRole === "none") {
      updateData["system.companionRole"] = "other";
    }

    // Migrate "other" specialists to specialist craftspeople
    if (data.system.category === "specialists" && data.system.specialistType === "other" && data.system.fieldOfWork !== "none") {
      updateData["system.category"] = "craftsmen";
      updateData["system.isRare"] = true;
      // fieldOfWork is already set, so it carries over
    }
    if (typeof data.system.isSpecialist === "boolean") {
      if (typeof data.system.isRare !== "boolean" && updateData["system.isRare"] === undefined) {
        updateData["system.isRare"] = data.system.isSpecialist;
      }
      updateData["system.-=isSpecialist"] = null;
    }
    if (typeof data.system.loyalty !== "number") {
      updateData["system.loyalty"] = convertToNumber(data.system.loyalty, 0);
    }
    if (typeof data.system.score !== "number") {
      updateData["system.score"] = convertToNumber(data.system.score, 0);
    }
    if (typeof data.system.quantity !== "number") {
      updateData["system.quantity"] = convertToNumber(data.system.quantity, 0);
    }
    if (typeof data.system.yearBorn !== "number") {
      updateData["system.yearBorn"] = convertToNumber(data.system.yearBorn, 1200);
    }

    if (data.system.extradata.giftType) {
      updateData["system.giftType"] = data.system.extradata.giftType;
      updateData["system.extradata.-=giftType"] = null;
    }

    return updateData;
  }
}
