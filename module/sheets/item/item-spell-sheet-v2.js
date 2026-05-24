import { ArM5eItemSheetV2 } from "./item-sheet-v2.js";
import { ArM5eItemMagicSheetV2 } from "./item-magic-sheet-v2.js";
import { ArM5eActorSheetV2 } from "../actor/actor-sheet-v2.js";
import { effectToLabText } from "../../item/item-converter.js";
import { getConfirmation } from "../../ui/dialogs.js";

/**
 * AppV2 sheet for spell items.
 * Adds: createLabText action, mastery context (via shared template).
 */
export class ArM5eSpellItemSheetV2 extends ArM5eItemMagicSheetV2 {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["arm5e", "sheet", "item"],
    // position: { width: 654, height: 800 },
    position: { width: 500, height: 650 },
    actions: {
      increaseScore: ArM5eItemMagicSheetV2.increaseScore,
      decreaseScore: ArM5eItemMagicSheetV2.decreaseScore,
      rollEffect: ArM5eItemMagicSheetV2.rollEffect,
      createLabText: ArM5eSpellItemSheetV2.createLabText,
      itemDeleteConfirm: ArM5eItemSheetV2.itemDeleteConfirm
    }
  };

  /** @override */
  static TABS = {
    primary: {
      tabs: [
        { id: "description", label: "arm5e.sheet.description", cssClass: "item" },
        { id: "attributes", label: "arm5e.sheet.attributes", cssClass: "item" },
        { id: "effects", label: "arm5e.sheet.effects", cssClass: "item" }
      ],
      initial: "description"
    }
  };

  /** @override */
  static PARTS = {
    header: {
      template: "systems/arm5e/templates/item/parts/item-magic-common-header-v2.hbs"
    },
    tabs: {
      template: "systems/arm5e/templates/generic/parts/ars-tab-navigation.hbs",
      classes: ["marginItemPart"]
    },
    description: {
      template: "systems/arm5e/templates/item/parts/item-description-v2.hbs"
    },
    attributes: {
      template: "systems/arm5e/templates/item/parts/item-magic-attributes-v2.hbs"
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
    return context;
  }

  /** @override */
  async _preparePartContext(partId, context, options) {
    if (["description", "attributes", "effects"].includes(partId)) {
      context.tab = context.tabs?.[partId];
    }
    return super._preparePartContext(partId, context, options);
  }

  /**
   * Create a draft laboratoryText item from this spell on the owning actor.
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
