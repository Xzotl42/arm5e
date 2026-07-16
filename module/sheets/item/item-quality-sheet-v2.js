import { ArM5eItemSheetV2 } from "./item-sheet-v2.js";

import { ARM5E } from "../../config.js";
/**
 * AppV2 sheet for quality items.
 */
export class ArM5eQualityItemSheetV2 extends ArM5eItemSheetV2 {
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
      template: `systems/${ARM5E.SYSTEM_ID}/templates/item/parts/item-quality-header-v2.hbs`
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
