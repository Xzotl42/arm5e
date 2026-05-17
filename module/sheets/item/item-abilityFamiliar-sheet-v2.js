import { ArM5eItemSheetV2 } from "./item-sheet-v2.js";

/**
 * AppV2 sheet for abilityFamiliar items.
 */
export class ArM5eAbilityFamiliarItemSheetV2 extends ArM5eItemSheetV2 {
  static DEFAULT_OPTIONS = {
    classes: ["arm5e", "sheet", "item"],
    position: { width: 500, height: 600 },
    actions: {
      increaseScore: ArM5eAbilityFamiliarItemSheetV2.increaseScore,
      decreaseScore: ArM5eAbilityFamiliarItemSheetV2.decreaseScore,
      itemDeleteConfirm: ArM5eItemSheetV2.itemDeleteConfirm
    }
  };

  static TABS = {
    primary: {
      tabs: [{ id: "description", label: "arm5e.sheet.description", cssClass: "item flexrow" }],
      initial: "description"
    }
  };

  static PARTS = {
    header: {
      template: "systems/arm5e/templates/item/parts/item-abilityFamiliar-header-v2.hbs"
    },
    tabs: {
      template: "systems/arm5e/templates/generic/parts/ars-tab-navigation.hbs",
      classes: ["marginItemPart"]
    },
    description: {
      template: "systems/arm5e/templates/item/parts/item-description-v2.hbs"
    },
    footer: {
      template: "systems/arm5e/templates/item/parts/item-footer-v2.hbs"
    }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.tabs = this._prepareTabs("primary");
    return context;
  }

  async _preparePartContext(partId, context, options) {
    if (partId === "description") {
      context.tab = context.tabs?.description;
    }
    return super._preparePartContext(partId, context, options);
  }

  static async increaseScore(event, target) {
    event.preventDefault();
    await this.item?.system?.increaseScore?.();
  }

  static async decreaseScore(event, target) {
    event.preventDefault();
    await this.item?.system?.decreaseScore?.();
  }
}
