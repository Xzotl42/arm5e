import { ArM5eItemSheetV2 } from "./item-sheet-v2.js";
import { ArM5eItemMagicSheetV2 } from "./item-magic-sheet-v2.js";

import { ARM5E } from "../../config.js";
/**
 * AppV2 sheet for magicalEffect items.
 * Uses the same shared header and attributes template as spell,
 * but opens on the attributes tab by default and has no mastery section.
 */
export class ArM5eMagicalEffectItemSheetV2 extends ArM5eItemMagicSheetV2 {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["arm5e", "sheet", "item"],
    position: { width: 500, height: 650 },
    actions: {
      increaseScore: ArM5eItemMagicSheetV2.increaseScore,
      decreaseScore: ArM5eItemMagicSheetV2.decreaseScore,
      rollEffect: ArM5eItemMagicSheetV2.rollEffect,
      itemDeleteConfirm: ArM5eItemSheetV2.itemDeleteConfirm
    }
  };

  /** @override */
  static TABS = {
    primary: {
      tabs: [
        { id: "attributes", label: "arm5e.sheet.attributes", cssClass: "item flexrow" },
        { id: "description", label: "arm5e.sheet.description", cssClass: "item flexrow" },
        { id: "effects", label: "arm5e.sheet.effects", cssClass: "item flexrow" }
      ],
      initial: "attributes"
    }
  };

  /** @override */
  static PARTS = {
    header: {
      template: `systems/${ARM5E.SYSTEM_ID}/templates/item/parts/item-magic-common-header-v2.hbs`
    },
    tabs: {
      template: `systems/${ARM5E.SYSTEM_ID}/templates/generic/parts/ars-tab-navigation.hbs`,
      classes: ["marginItemPart"]
    },
    attributes: {
      template: `systems/${ARM5E.SYSTEM_ID}/templates/item/parts/item-effect-design-v2.hbs`
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
    if (["attributes", "description", "effects"].includes(partId)) {
      context.tab = context.tabs?.[partId];
    }
    return super._preparePartContext(partId, context, options);
  }
}
