import { ArM5eItemSheetV2 } from "./item-sheet-v2.js";

/**
 * AppV2 sheet for vis items.
 */
export class ArM5eVisItemSheetV2 extends ArM5eItemSheetV2 {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["arm5e", "sheet", "item"],
    position: { width: 500, height: 650 },
    actions: {
      studyVis: ArM5eVisItemSheetV2.studyVis,
      itemDeleteConfirm: ArM5eItemSheetV2.itemDeleteConfirm
    }
  };

  /** @override */
  static PARTS = {
    header: {
      template: "systems/arm5e/templates/item/parts/item-vis-header-v2.hbs"
    },
    description: {
      template: "systems/arm5e/templates/item/parts/item-description-v2.hbs"
    },
    footer: {
      template: "systems/arm5e/templates/item/parts/item-footer-v2.hbs"
    }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.displayStudyIcon = this.item.isOwned && this.item.actor?.isMagus?.();
    return context;
  }

  static async studyVis(event, target) {
    event.preventDefault();
    const item = this.item;
    if (!item.isOwned) return;
    const actor = item.actor;
    if (!actor?.isMagus?.()) return;
    const entry = await item.system.createDiaryEntryToStudyVis(actor);
    entry.sheet.render(true);
  }
}
