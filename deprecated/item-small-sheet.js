import { debug, log } from "../tools/tools.js";
import { ArM5eItemSheetNoDesc } from "./item-sheet.js";
import { Sanatorium } from "../apps/sanatorium.js";

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class ArM5eSmallSheet extends ArM5eItemSheetNoDesc {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["arm5e", "sheet", "item"],
      width: 405,
      height: 602
    });
  }

  /** @override */
  async getData() {
    const context = await super.getData();

    context;
    return context;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".change-gravity").change(async (event) => this._changeGravity(this.item, event));

    // Single-wound recovery roll: find the open Sanatorium for this item's actor and roll only this wound
    html.find(".sanatorium-single-roll").click(async (event) => {
      event.preventDefault();
      if (!this.item.isOwned || !this.item.actor) return;
      const actor = this.item.actor;
      // Find an open Sanatorium application registered on this actor, or create one
      let sanatorium = Object.values(actor.apps ?? {}).find((app) => app instanceof Sanatorium);
      if (!sanatorium) {
        sanatorium = new Sanatorium(actor);
      }
      // Store the target wound so the user can review the UI before clicking Roll.
      // The actual roll fires when the user clicks the "Roll for Recovery" button.
      sanatorium._pendingSingleWoundId = this.item._id;
      await sanatorium.render(true);
    });
  }

  async _changeGravity(item, event) {
    event.preventDefault();
    const updateData = this.item._updateIcon(event.target.value);
    updateData["system.gravity"] = event.target.value;
    await this.item.update(updateData);
  }
}
