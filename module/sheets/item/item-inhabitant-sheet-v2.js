import { ArM5eItemSheetV2 } from "./item-sheet-v2.js";

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
      template: "systems/arm5e/templates/item/parts/item-inhabitant-header-v2.hbs"
    },
    tabs: {
      template: "systems/arm5e/templates/generic/parts/ars-tab-navigation.hbs",
      classes: ["marginItemPart"]
    },
    description: {
      template: "systems/arm5e/templates/item/parts/item-description-v2.hbs"
    },
    effects: {
      template: "systems/arm5e/templates/item/parts/item-effects-v2.hbs"
    },
    footer: {
      template: "systems/arm5e/templates/item/parts/item-footer-v2.hbs"
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
  _onRender(context, options) {
    super._onRender(context, options);
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
