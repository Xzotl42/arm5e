import { ArM5eItemSheetV2 } from "./item-sheet-v2.js";
import { Sanatorium } from "../../apps/sanatorium.js";

/**
 * AppV2 sheet for wound items.
 */
export class ArM5eWoundItemSheetV2 extends ArM5eItemSheetV2 {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["arm5e", "sheet", "item"],
    position: { width: 405, height: 602 },
    actions: {
      sanatoriumRoll: ArM5eWoundItemSheetV2.sanatoriumRoll,
      itemDeleteConfirm: ArM5eItemSheetV2.itemDeleteConfirm
    }
  };

  /** @override */
  static PARTS = {
    header: {
      template: "systems/arm5e/templates/item/parts/item-wound-header-v2.hbs"
    },
    description: {
      template: "systems/arm5e/templates/item/parts/item-description-v2.hbs"
    },
    footer: {
      template: "systems/arm5e/templates/item/parts/item-footer-v2.hbs"
    }
  };

  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);
    // Gravity select: update icon + system.gravity
    this.element.querySelectorAll("select[data-action='changeGravity']").forEach((el) => {
      el.addEventListener("change", async (event) => {
        event.preventDefault();
        const updateData = this.item._updateIcon(event.target.value);
        updateData["system.gravity"] = event.target.value;
        await this.item.update(updateData);
      });
    });
  }

  static async sanatoriumRoll(event, target) {
    event.preventDefault();
    if (!this.item.isOwned || !this.item.actor) return;
    const actor = this.item.actor;
    let sanatorium = Object.values(actor.apps ?? {}).find((app) => app instanceof Sanatorium);
    if (!sanatorium) {
      sanatorium = new Sanatorium(actor);
    }
    sanatorium._pendingSingleWoundId = this.item.id;
    await sanatorium.render(true);
  }
}
