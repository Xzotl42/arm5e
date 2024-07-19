import { getDataset, log } from "../tools.js";
import { ArM5eItemSheet } from "./item-sheet.js";
import { getConfirmation } from "../constants/ui.js";
import { ArM5eActorSheet } from "../actor/actor-sheet.js";
import { spellFormLabel, spellTechniqueLabel } from "../helpers/magic.js";
import { BookSchema } from "../schemas/bookSchema.js";
/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class ArM5eCovenantInhabitantSheet extends ArM5eItemSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      dragDrop: [{ dragSelector: null, dropSelector: ".drop-labtext" }]
    });
  }

  constructor(data, options) {
    super(data, options);
  }

  /** @override */
  get template() {
    return super.template;
  }

  /* -------------------------------------------- */

  /** @override */
  async getData() {
    const context = await super.getData();

    // Use a safe clone of the item data for further operations.
    const itemData = context.item;

    context.inhabitantCategory = foundry.utils.deepClone(CONFIG.ARM5E.covenant.inhabitants);
    if (itemData.system.linked) {
      if (["magi", "companions"].includes(itemData.system.category)) {
        context.canEdit = "readonly";
        context.canSelect = "disabled";
      } else {
        delete context.inhabitantCategory.magi;
        delete context.inhabitantCategory.companions;
      }
    }

    if (itemData.system.category === "specialists") {
      switch (itemData.system.specialistType) {
        case "steward":
          context.specialistAbility = game.i18n.format("arm5e.skill.general.profession", {
            option: game.i18n.localize("arm5e.covenant.specialist.steward")
          });
          context.specialistChar = "arm5e.sheet.pre";
          context.details = true;
          break;
        case "chamberlain":
          context.specialistAbility = game.i18n.format("arm5e.skill.general.profession", {
            option: game.i18n.localize("arm5e.covenant.specialist.chamberlain")
          });
          context.specialistChar = "arm5e.sheet.pre";
          context.details = true;
          break;
        case "turbCaptain":
          context.specialistChar = "arm5e.sheet.pre";
          context.specialistAbility = "arm5e.skill.general.leadership";
          context.details = true;
          break;
        case "teacher":
          context.specialistChar = "arm5e.sheet.com";
          context.specialistAbility = "arm5e.skill.general.teaching";
          context.teacherDetails = true;
        default:
      }
    }

    return context;
  }

  /* -------------------------------------------- */

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
  }

  getInhabitantSheet(path, category) {
    switch (category) {
      case "magi":
        return `${path}/item-habitantMagi-sheet.html`;
      case "companions":
        return `${path}/item-habitantCompanion-sheet.html`;
      case "specialists":
        return `${path}/item-habitantSpecialists-sheet.html`;
      case "craftmen":
        return `${path}/item-habitantCraftsmen-sheet.html`;
      case "turbula":
      case "servants":
      case "laborers":
      case "teamsters":
      case "dependants":
        return `${path}/item-habitantHabitants-sheet.html`;
        break;
      case "horses":
        return `${path}/item-habitantHorses-sheet.html`;
        break;
      case "livestock":
        return `${path}/item-habitantLivestock-sheet.html`;
    }
  }
  // /** @inheritdoc */
  // async _updateObject(event, formData) {
  //   if (!this.object.id) return;
  //   const expanded = foundry.utils.expandObject(formData);
  //   const source = this.object.toObject();

  //   return await super._updateObject(event, expanded);

  // }
}
