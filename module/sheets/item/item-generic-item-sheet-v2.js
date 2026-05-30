import { ArM5eItemSheetV2 } from "./item-sheet-v2.js";
import { EnchantExtensionV2 } from "./enchant-extension-v2.js";
import { log } from "../../tools/tools.js";

/**
 * AppV2 sheet for generic item type items.
 */
export class ArM5eGenericItemSheetV2 extends ArM5eItemSheetV2 {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["arm5e", "sheet", "item"],
    position: { width: 500, height: 600 },
    actions: {
      itemDeleteConfirm: ArM5eItemSheetV2.itemDeleteConfirm,
      ...EnchantExtensionV2.actions
    }
  };

  /** @override */
  static TABS = {
    primary: {
      tabs: [
        { id: "description", label: "arm5e.sheet.description", cssClass: "item flexrow" },
        { id: "enchantments", label: "arm5e.sheet.item.enchantments", cssClass: "item" },
        { id: "effects", label: "arm5e.sheet.effects", cssClass: "item flexrow" }
      ],
      initial: "description"
    }
  };

  /** @override */
  static PARTS = {
    header: {
      template: "systems/arm5e/templates/item/parts/item-item-header-v2.hbs"
    },
    tabs: {
      template: "systems/arm5e/templates/generic/parts/ars-tab-navigation.hbs",
      classes: ["marginItemPart"]
    },
    description: {
      template: "systems/arm5e/templates/item/parts/item-description-v2.hbs"
    },
    enchantments: {
      template: "systems/arm5e/templates/item/parts/item-enchant-extension-v2.hbs"
    },
    effects: {
      template: "systems/arm5e/templates/item/parts/item-effects-v2.hbs"
    },
    footer: {
      template: "systems/arm5e/templates/item/parts/item-footer-v2.hbs"
    }
  };

  /** @override */
  getUserCache() {
    const cache = super.getUserCache();
    if (this.item.system.enchantments) {
      EnchantExtensionV2.getUserCacheEnchantments(cache, this.item);
    }
    return cache;
  }

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.tabs = this._prepareTabs("primary");
    if (!this.item.system.enchantments) {
      delete context.tabs.enchantments;
    } else {
      await EnchantExtensionV2.prepareEnchantmentContext(context, this.isEditable);
    }
    log(false, "Generic item sheet context", context);
    return context;
  }

  /** @override */
  async _preparePartContext(partId, context, options) {
    if (["description", "enchantments", "effects"].includes(partId)) {
      context.tab = context.tabs?.[partId];
    }
    return super._preparePartContext(partId, context, options);
  }

  /** @override */
  _processFormData(event, form, formData) {
    const prepared = super._processFormData(event, form, formData);
    return EnchantExtensionV2.processFormData(prepared, this.item);
  }

  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);
    EnchantExtensionV2.wireListeners.call(this);
  }
}
