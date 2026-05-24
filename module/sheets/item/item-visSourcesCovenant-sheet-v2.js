import { ArM5eItemSheetV2 } from "./item-sheet-v2.js";

/**
 * AppV2 sheet for visSourcesCovenant items.
 */
export class ArM5eVisSourcesCovenantItemSheetV2 extends ArM5eItemSheetV2 {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["arm5e", "sheet", "item"],
    position: { width: 500, height: 600 },
    actions: {
      harvestVis: ArM5eVisSourcesCovenantItemSheetV2.harvestVis,
      itemDeleteConfirm: ArM5eItemSheetV2.itemDeleteConfirm
    }
  };

  /** @override */
  static TABS = {
    primary: {
      tabs: [
        { id: "description", label: "arm5e.sheet.description", cssClass: "item flexrow" },
        { id: "attributes", label: "arm5e.sheet.attributes", cssClass: "item flexrow" }
      ],
      initial: "description"
    }
  };

  /** @override */
  static PARTS = {
    header: {
      template: "systems/arm5e/templates/item/parts/item-visSourcesCovenant-header-v2.hbs"
    },
    tabs: {
      template: "systems/arm5e/templates/generic/parts/ars-tab-navigation.hbs",
      classes: ["marginItemPart"]
    },
    description: {
      template: "systems/arm5e/templates/item/parts/item-description-v2.hbs"
    },
    attributes: {
      template: "systems/arm5e/templates/item/parts/item-visSourcesCovenant-attributes-v2.hbs"
    },
    footer: {
      template: "systems/arm5e/templates/item/parts/item-footer-v2.hbs"
    }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.tabs = this._prepareTabs("primary");

    const form = this.item?.system?.form ?? "";
    context.enrichedForm = await foundry.applications.ux.TextEditor.enrichHTML(form, {
      secrets: this.document.isOwner,
      rollData: context.rollData,
      relativeTo: this.item
    });

    return context;
  }

  /** @override */
  async _preparePartContext(partId, context, options) {
    if (partId === "description" || partId === "attributes") {
      context.tab = context.tabs?.[partId];
    }
    return super._preparePartContext(partId, context, options);
  }

  static async harvestVis(event, target) {
    event.preventDefault();
    await this.item?.system?.harvest?.();
  }
}
