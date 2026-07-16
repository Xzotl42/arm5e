import { EnchantExtensionV2 } from "./enchant-extension-v2.js";
import { log } from "../../tools/tools.js";
import { ArM5ePhysicalItemSheetV2 } from "./item-physical-v2.js";
import { ArM5eItemSheetV2 } from "./item-sheet-v2.js";

import { ARM5E } from "../../config.js";
/**
 * AppV2 sheet for weapon items.
 */
export class ArM5eWeaponItemSheetV2 extends ArM5ePhysicalItemSheetV2 {
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
      template: `systems/${ARM5E.SYSTEM_ID}/templates/item/parts/item-weapon-header-v2.hbs`
    },
    tabs: {
      template: `systems/${ARM5E.SYSTEM_ID}/templates/generic/parts/ars-tab-navigation.hbs`,
      classes: ["marginItemPart"]
    },
    description: {
      template: `systems/${ARM5E.SYSTEM_ID}/templates/item/parts/item-description-v2.hbs`
    },
    enchantments: {
      template: `systems/${ARM5E.SYSTEM_ID}/templates/item/parts/item-enchant-extension-v2.hbs`
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
    if (this.item.system.enchantments) {
      EnchantExtensionV2.getUserCacheEnchantments(cache, this.item);
    }
    return cache;
  }

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.tabs = this._prepareTabs("primary");

    if (this.item.isOwnedByCharacter) {
      context.system.abilities = this.actor.system.abilities.map((v) => {
        return { id: v._id, name: `${v.name} (${v.system.speciality}) - ${v.system.finalScore}` };
      });
      context.system.abilities.unshift({
        id: "",
        name: "N/A"
      });
    }

    if (!this.item.system.enchantments) {
      delete context.tabs.enchantments;
    } else {
      await EnchantExtensionV2.prepareEnchantmentContext(context, this.isEditable);
    }
    log(false, "Weapon sheet context", context);
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
  async _onRender(context, options) {
    await super._onRender(context, options);

    // Weapon ability select change: update ability.{id, key, option}
    this.element.querySelectorAll(".weapon-ability").forEach((el) => {
      el.addEventListener("change", async (event) => {
        event.preventDefault();
        const ab = this.item.actor?.items?.get(event.target.value);
        if (!ab) return;
        await this.item.update({
          system: {
            ability: {
              id: event.target.value,
              key: ab.system.key,
              option: ab.system.option
            }
          }
        });
      });
    });

    // Equipped checkbox: update actor combatPreps
    this.element.querySelectorAll("input[data-action='toggleEquipped']").forEach((el) => {
      el.addEventListener("change", async (event) => {
        event.preventDefault();
        const itemId = this.item.id;
        if (this.item.isOwned && this.actor?.sheet?._toggleEquip) {
          await this.actor.sheet._toggleEquip(itemId);
        }
      });
    });

    EnchantExtensionV2.wireListeners.call(this);
  }
}
