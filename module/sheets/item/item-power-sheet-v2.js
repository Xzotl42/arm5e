import { ARM5E } from "../../config.js";

import { ArM5eItemSheetV2 } from "./item-sheet-v2.js";

/**
 * AppV2 sheet for power items.
 * Power is structurally different from spell/magicalEffect/baseEffect:
 * it has no technique/form.value, no requisites, no RDT.
 * Extends the base class directly.
 */
export class ArM5ePowerItemSheetV2 extends ArM5eItemSheetV2 {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["arm5e", "sheet", "item"],
    position: { width: 550, height: 600 },
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
      template: "systems/arm5e/templates/item/parts/item-power-header-v2.hbs"
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
    context.ui ??= {};

    // Readonly lock
    if (context.flags?.[CONFIG.ARM5E.SYSTEM_ID]?.readonly === "true") {
      context.noEdit = "readonly";
      context.noSelect = "disabled";
      context.locked = true;
    } else {
      context.noEdit = "";
      context.noSelect = "";
      context.locked = false;
    }

    // If the owner has a might pool, add an "inherit" form option and suppress realm/penetration
    if (this.item.isOwned && this.item.actor?.hasMight?.()) {
      context.ui.ownerHasMight = true;
      context.selection.forms = {
        inherit: { label: game.i18n.localize("arm5e.generic.inherit") },
        ...CONFIG.ARM5E.magic.forms
      };
    } else {
      context.ui.ownerHasMight = false;
      context.selection.forms = CONFIG.ARM5E.magic.forms;
    }

    return context;
  }

  /** @override */
  async _preparePartContext(partId, context, options) {
    if (["description", "effects"].includes(partId)) {
      context.tab = context.tabs?.[partId];
    }
    return super._preparePartContext(partId, context, options);
  }
}
