import { debug, log } from "../tools/tools.js";
import { ArM5eItemSheet, ArM5eItemSheetNoDesc } from "./item-sheet.js";

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class ArM5eItemVisSheet extends ArM5eItemSheetNoDesc {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["arm5e", "sheet", "item"],
      width: 654,
      height: 800
    });
  }

  /** @override */
  async getData() {
    const context = await super.getData();

    context.displayStudyIcon = this.item.isOwned && this.item.actor.isMagus();
    return context;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".vis-study").click(async () => {
      await this.studyVis();
    });
  }

  async studyVis() {
    const item = this.item;
    if (!this.item.isOwned) return;
    const actor = item.actor;
    if (!actor.isMagus()) return;

    const entry = await item.system.createDiaryEntryToStudyVis(actor);
    entry.sheet.render(true);
  }
}
