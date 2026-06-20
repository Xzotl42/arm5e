import { resetOwnerFields } from "../../item/item-converter.js";
import { ArM5eItemSheetV2 } from "./item-sheet-v2.js";

// Class for physical items (armor, weapons, books, etc.)
// Mostly used now for enchantment extension support, but could be used for other shared physical item behavior in the future.

export class ArM5ePhysicalItemSheetV2 extends ArM5eItemSheetV2 {
  static DEFAULT_OPTIONS = {
    dragDrop: [{ dragSelector: null, dropSelector: ".drop-enchant" }]
  };

  /** @override */
  async _onDrop(event) {
    const dropTarget = event.target?.closest?.("[data-drop]")?.dataset?.drop;
    const dropData = foundry.applications.ux.TextEditor.getDragEventData(event);
    const item = await fromUuid(dropData?.uuid);
    if (!item) return;

    const effects = this.item.system.enchantments.effects;

    if (dropTarget === "enchant") {
      event.stopPropagation();
      switch (item.type) {
        case "laboratoryText": {
          if (!["enchantment", "spell"].includes(item.system.type)) return;
        }
        case "magicalEffect":
        case "spell":
        case "enchantment": {
          const effect = item.toObject();

          effect.type = "enchantment";
          resetOwnerFields(effect);
          effects.push(effect);
        }
      }

      await this.item.update({
        "system.state": "enchanted",
        "system.enchantments.effects": effects
      });
      return;
    }

    return super._onDrop(event);
  }
}
