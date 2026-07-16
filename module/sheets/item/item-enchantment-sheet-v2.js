import { ArM5eItemSheetV2 } from "./item-sheet-v2.js";
import { ArM5eItemMagicSheetV2 } from "./item-magic-sheet-v2.js";
import { ArM5eActorSheetV2 } from "../actor/actor-sheet-v2.js";
import { effectToLabText } from "../../item/item-converter.js";
import { GetEnchantmentSelectOptions } from "../../helpers/magic.js";
import { getConfirmation } from "../../ui/dialogs.js";

import { ARM5E } from "../../config.js";
/**
 * AppV2 sheet for enchantment items.
 * Tabs: attributes (RDT + baseLevel), enchantment (frequency/penetration/etc.), description, effects.
 */
export class ArM5eEnchantmentItemSheetV2 extends ArM5eItemMagicSheetV2 {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["arm5e", "sheet", "item"],
    position: { width: 654, height: 800 },
    actions: {
      increaseScore: ArM5eItemMagicSheetV2.increaseScore,
      decreaseScore: ArM5eItemMagicSheetV2.decreaseScore,
      rollEffect: ArM5eItemMagicSheetV2.rollEffect,
      createLabText: ArM5eEnchantmentItemSheetV2.createLabText,
      itemDeleteConfirm: ArM5eItemSheetV2.itemDeleteConfirm
    }
  };

  /** @override */
  static TABS = {
    primary: {
      tabs: [
        { id: "attributes", label: "arm5e.sheet.attributes", cssClass: "item flexrow" },
        { id: "enchantment", label: "arm5e.lab.enchantment.label", cssClass: "item flexrow" },
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
      template: `systems/${ARM5E.SYSTEM_ID}/templates/item/parts/item-magic-attributes-v2.hbs`
    },
    enchantment: {
      template: `systems/${ARM5E.SYSTEM_ID}/templates/item/parts/item-enchantment-attributes-part-v2.hbs`
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
  getUserCache() {
    const cache = super.getUserCache();
    if (!cache.sections.visibility.enchantment) {
      cache.sections.visibility.enchantment = {};
      const storageKey = `usercache-${game.user.id}`;
      const usercache = JSON.parse(sessionStorage.getItem(storageKey)) ?? {};
      usercache[this.item.id] = cache;
      sessionStorage.setItem(storageKey, JSON.stringify(usercache));
    }
    return cache;
  }

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.tabs = this._prepareTabs("primary");

    // Populate frequency / materialBase / sizeMultiplier selection options
    GetEnchantmentSelectOptions(context);

    return context;
  }

  /** @override */
  async _preparePartContext(partId, context, options) {
    if (["attributes", "enchantment", "description", "effects"].includes(partId)) {
      context.tab = context.tabs?.[partId];
    }
    return super._preparePartContext(partId, context, options);
  }

  /**
   * Create a draft laboratoryText item from this enchantment on the owning actor.
   */
  static async createLabText(event, target) {
    event.preventDefault();
    if (!this.item.isOwned) return;
    const confirm = await getConfirmation(
      this.item.name,
      game.i18n.localize("arm5e.hints.createLabText"),
      ArM5eActorSheetV2.getFlavor(this.item.actor?.type)
    );
    if (confirm) {
      const effectData = effectToLabText(this.item.toObject());
      effectData.system.author = this.actor.name;
      effectData.system.draft = true;
      await this.actor.createEmbeddedDocuments("Item", [effectData]);
    }
  }
}
