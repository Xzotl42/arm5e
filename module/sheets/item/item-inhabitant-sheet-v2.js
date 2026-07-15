import { ArM5eItemSheetV2 } from "./item-sheet-v2.js";

import { ARM5E } from "../../config.js";
/**
 * AppV2 sheet for inhabitant items.
 */
export class ArM5eInhabitantItemSheetV2 extends ArM5eItemSheetV2 {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["arm5e", "sheet", "item"],
    position: { width: 500, height: 600 },
    actions: {
      itemDeleteConfirm: ArM5eItemSheetV2.itemDeleteConfirm
    }
  };

  /** @override */
  static TABS = {
    primary: {
      tabs: [
        { id: "description", label: "arm5e.sheet.description", cssClass: "item flexrow" },
        { id: "effects", label: "arm5e.sheet.effects", cssClass: "item flexrow" }
      ],
      initial: "description"
    }
  };

  /** @override */
  static PARTS = {
    header: {
      template: `systems/${ARM5E.SYSTEM_ID}/templates/item/parts/item-inhabitant-header-v2.hbs`
    },
    tabs: {
      template: `systems/${ARM5E.SYSTEM_ID}/templates/generic/parts/ars-tab-navigation.hbs`,
      classes: ["marginItemPart"]
    },
    description: {
      template: `systems/${ARM5E.SYSTEM_ID}/templates/item/parts/item-description-v2.hbs`
    },
    effects: {
      template: `systems/${ARM5E.SYSTEM_ID}/templates/item/parts/item-effects-v2.hbs`
    },
    footer: {
      template: `systems/${ARM5E.SYSTEM_ID}/templates/item/parts/item-footer-v2.hbs`
    }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.tabs = this._prepareTabs("primary");

    // Build the inhabitant category list (possibly filtered by linked state)
    const sys = this.item.system;
    context.inhabitantCategory = foundry.utils.deepClone(CONFIG.ARM5E.covenant.inhabitants);
    if (sys.linked) {
      if (["magi", "companions"].includes(sys.category)) {
        context.ui.canEdit = "readonly";
        context.ui.canSelect = "disabled";
      } else {
        delete context.inhabitantCategory.magi;
        delete context.inhabitantCategory.companions;
      }
    }

    // Specialist sub-type details
    if (sys.category === "specialists") {
      switch (sys.specialistType) {
        case "steward":
          context.specialistAbility = game.i18n.format("arm5e.skill.general.profession", {
            option: game.i18n.localize("arm5e.covenant.specialist.steward")
          });
          context.specialistChar = "arm5e.sheet.pre";
          context.ui.details = true;
          break;
        case "chamberlain":
          context.specialistAbility = game.i18n.format("arm5e.skill.general.profession", {
            option: game.i18n.localize("arm5e.covenant.specialist.chamberlain")
          });
          context.specialistChar = "arm5e.sheet.pre";
          context.ui.details = true;
          break;
        case "turbCaptain":
          context.specialistChar = "arm5e.sheet.pre";
          context.specialistAbility = "arm5e.skill.general.leadership";
          context.ui.details = true;
          break;
        case "teacher":
          context.specialistChar = "arm5e.sheet.com";
          context.specialistAbility = "arm5e.skill.general.teaching";
          context.ui.teacherDetails = true;
          context.ui.details = true;
          break;
        default:
          break;
      }
    }

    if (sys.category === "craftsmen" || (sys.category === "companions" && sys.companionRole === "craftsman")) {
      const linkedActor = game.actors.get(sys.actorId);
      context.craftSyncAbilities = {
        "": game.i18n.localize("arm5e.sheet.none")
      };
      if (linkedActor) {
        for (const ability of linkedActor.items.filter((item) => item.type === "ability")) {
          const score = ability.system?.finalScore ?? ability.system?.score ?? 0;
          const option = ability.system?.option ? ` (${ability.system.option})` : "";
          context.craftSyncAbilities[ability.id] = `${ability.name}${option} [${score}]`;
        }
      }
    }
    if (sys.category === "companions") {
      context.companionRoles = foundry.utils.deepClone(CONFIG.ARM5E.covenant.companionRoles);
      switch (sys.companionRole) {
        case "teacher":
          context.companionSpecialistChar = "arm5e.sheet.com";
          context.companionSpecialistAbility = "arm5e.skill.general.teaching";
          context.ui.companionTeacherDetails = true;
          context.ui.companionDetails = true;
          break;
        case "steward":
        case "chamberlain":
          context.companionSpecialistChar = "arm5e.sheet.pre";
          context.companionSpecialistAbility = game.i18n.format("arm5e.skill.general.profession", {
            option: game.i18n.localize(`arm5e.covenant.specialist.${sys.companionRole}`)
          });
          context.ui.companionDetails = true;
          break;
        case "turbCaptain":
          context.companionSpecialistChar = "arm5e.sheet.pre";
          context.companionSpecialistAbility = "arm5e.skill.general.leadership";
          context.ui.companionDetails = true;
          break;
        default:
          break;
      }
    }

    return context;
  }

  /** @override */
  async _preparePartContext(partId, context, options) {
    if (partId === "description" || partId === "effects") {
      context.tab = context.tabs?.[partId];
    }
    return super._preparePartContext(partId, context, options);
  }

  /** @override */
  async _onRender(context, options) {
    await super._onRender(context, options);
    // Category change: update icon + system.category, then re-render
    this.element.querySelectorAll("select[data-action='changeCategory']").forEach((el) => {
      el.addEventListener("change", async (event) => {
        event.preventDefault();
        const updateData = this.item._updateIcon(event.target.value);
        updateData["system.category"] = event.target.value;
        await this.item.update(updateData);
      });
    });
  }
}
