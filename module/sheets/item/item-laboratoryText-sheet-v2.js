import { ArM5eItemSheetV2 } from "./item-sheet-v2.js";
import { ArM5eItemMagicSheetV2 } from "./item-magic-sheet-v2.js";
import { GetEnchantmentSelectOptions } from "../../helpers/magic.js";

import { ARM5E } from "../../config.js";
/**
 * AppV2 sheet for laboratoryText items.
 * Supports raw text entries plus spell/enchantment-derived lab texts.
 */
export class ArM5eLaboratoryTextItemSheetV2 extends ArM5eItemMagicSheetV2 {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["arm5e", "sheet", "item"],
    position: { width: 654, height: 800 },
    actions: {
      advancedReq: ArM5eItemMagicSheetV2.advancedReq,
      studyLabtext: ArM5eLaboratoryTextItemSheetV2.studyLabtext,
      itemDeleteConfirm: ArM5eItemSheetV2.itemDeleteConfirm
    }
  };

  /** @override */
  static TABS = {
    primary: {
      tabs: [{ id: "description", label: "arm5e.sheet.description", cssClass: "item flexcol" }],
      initial: "description"
    }
  };

  /** @override */
  static PARTS = {
    header: {
      template: `systems/${ARM5E.SYSTEM_ID}/templates/item/parts/item-laboratoryText-header-v2.hbs`
    },
    tabs: {
      template: `systems/${ARM5E.SYSTEM_ID}/templates/generic/parts/ars-tab-navigation.hbs`,
      classes: ["marginItemPart"]
    },
    description: {
      template: `systems/${ARM5E.SYSTEM_ID}/templates/item/parts/item-laboratoryText-description-v2.hbs`
    },
    footer: {
      template: `systems/${ARM5E.SYSTEM_ID}/templates/item/parts/item-footer-v2.hbs`
    }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.tabs = this._prepareTabs("primary");

    context.canBeRead =
      this.item.isOwned &&
      this.item.actor?.type !== "covenant" &&
      this.item.system.type === "spell";

    if (this.item.system.type !== "raw") {
      GetEnchantmentSelectOptions(context);
    }

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
   * Schedule study of this lab text in the owner's laboratory planning panel.
   */
  static async studyLabtext(event, target) {
    event.preventDefault();
    await this.item._studyLabText(this.item, event);
  }
}
