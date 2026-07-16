import { ArM5eItemSheetV2 } from "./item-sheet-v2.js";

import { ARM5E } from "../../config.js";
/**
 * AppV2 sheet for powerFamiliar items.
 */
export class ArM5ePowerFamiliarItemSheetV2 extends ArM5eItemSheetV2 {
  static DEFAULT_OPTIONS = {
    classes: ["arm5e", "sheet", "item"],
    position: { width: 500, height: 600 },
    actions: {
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
      template: `systems/${ARM5E.SYSTEM_ID}/templates/item/parts/item-powerFamiliar-header-v2.hbs`
    },
    tabs: {
      template: `systems/${ARM5E.SYSTEM_ID}/templates/generic/parts/ars-tab-navigation.hbs`,
      classes: ["marginItemPart"]
    },
    description: {
      template: `systems/${ARM5E.SYSTEM_ID}/templates/item/parts/item-description-v2.hbs`
    },
    footer: {
      template: `systems/${ARM5E.SYSTEM_ID}/templates/item/parts/item-footer-v2.hbs`
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
}
