import { ArM5eItemSheetV2 } from "./item-sheet-v2.js";

/**
 * AppV2 sheet for virtue items.
 */
export class ArM5eVirtueItemSheetV2 extends ArM5eItemSheetV2 {
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
      template: "systems/arm5e/templates/item/parts/item-virtue-header-v2.hbs"
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

    // Compute available virtue/flaw types based on owning actor type
    const vft = context.config.virtueFlawTypes;
    if (context.isOwned) {
      switch (this.item.parent?.type) {
        case "laboratory":
          vft.available = { ...vft.laboratory, ...vft.all };
          break;
        case "covenant":
          vft.available = { ...vft.covenant, ...vft.all };
          break;
        default:
          vft.available = { ...vft.character, ...vft.all };
      }
    } else {
      vft.available = { ...vft.character, ...vft.laboratory, ...vft.covenant, ...vft.all };
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
}
