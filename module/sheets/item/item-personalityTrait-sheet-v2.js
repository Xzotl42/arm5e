import { ArM5eItemSheetV2 } from "./item-sheet-v2.js";

/**
 * AppV2 sheet for personalityTrait items.
 */
export class ArM5ePersonalityTraitItemSheetV2 extends ArM5eItemSheetV2 {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["arm5e", "sheet", "item"],
    position: { width: 500, height: 600 },
    actions: {
      increaseScore: ArM5ePersonalityTraitItemSheetV2.increaseScore,
      decreaseScore: ArM5ePersonalityTraitItemSheetV2.decreaseScore,
      itemDeleteConfirm: ArM5eItemSheetV2.itemDeleteConfirm
    }
  };

  /** @override */
  static TABS = {
    primary: {
      tabs: [{ id: "description", label: "arm5e.sheet.description", cssClass: "item flexrow" }],
      initial: "description"
    }
  };

  /** @override */
  static PARTS = {
    header: {
      template: "systems/arm5e/templates/item/parts/item-personalityTrait-header-v2.hbs"
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

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.tabs = this._prepareTabs("primary");
    return context;
  }

  /** @override */
  async _preparePartContext(partId, context, options) {
    if (partId === "description") {
      context.tab = context.tabs?.description;
    }
    return super._preparePartContext(partId, context, options);
  }

  /**
   * Increase personality trait score.
   * @param {Event} event
   * @param {HTMLElement} target
   */
  static async increaseScore(event, target) {
    event.preventDefault();
    await this.item?.system?.increaseScore?.();
  }

  /**
   * Decrease personality trait score.
   * @param {Event} event
   * @param {HTMLElement} target
   */
  static async decreaseScore(event, target) {
    event.preventDefault();
    await this.item?.system?.decreaseScore?.();
  }
}
