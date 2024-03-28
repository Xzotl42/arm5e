import { ArM5eItemSheet } from "./item-sheet.js";
import { log } from "../tools.js";
import { ARM5E } from "../config.js";
import { ARM5E_DEFAULT_ICONS } from "../constants/ui.js";
import {
  GetEffectAttributesLabel,
  GetFilteredMagicalAttributes,
  PickRequisites
} from "../helpers/magic.js";
/**
 * Extend the basic ArM5eItemSheet with some very simple modifications
 * @extends {ArM5eItemSheet}
 */
export class ArM5eItemMagicSheet extends ArM5eItemSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["arm5e", "sheet", "item"],
      width: 654,
      height: 800,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "spell-design"
        }
      ],
      submitOnClose: true
    });
  }

  /* -------------------------------------------- */

  /** @override */
  async getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the item object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    let context = await super.getData();
    context.system.localizedDesc = GetEffectAttributesLabel(this.item);
    context = await GetFilteredMagicalAttributes(context);

    if (context.flags && context.flags[CONFIG.ARM5E.SYSTEM_ID]?.readonly === "true") {
      context.noEdit = "readonly";
      context.noSelect = "disabled";
      context.locked = true;
    }

    // If settings were too restrictive, allow existing Items to keep their value.
    switch (this.item.type) {
      case "laboratoryText":
        if (this.item.system.type === "raw") {
          break;
        }
      case "spell":
      case "enchantment":
      case "magicItem":
      case "magicalEffect":
        context.ranges[context.system.range.value] =
          CONFIG.ARM5E.magic.ranges[context.system.range.value];
        context.targets[context.system.target.value] =
          CONFIG.ARM5E.magic.targets[context.system.target.value];
        context.durations[context.system.duration.value] =
          CONFIG.ARM5E.magic.durations[context.system.duration.value];
        break;
      default:
        break;
    }

    return context;
  }

  /* -------------------------------------------- */

  // /** @override */
  // setPosition(options = {}) {
  //     const position = super.setPosition(options);
  //     const sheetBody = this.element.find(".sheet-body");
  //     const bodyHeight = position.height - 380;
  //     sheetBody.css("height", bodyHeight);
  //     return position;
  // }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;
    html.find(".advanced-req").click(async (evt) => {
      let update = await PickRequisites(this.item.system, evt.currentTarget.dataset.flavor);
      if (update) await this.item.update(update);
    });

    html.find(".select-form").change(async (evt) => {
      evt.preventDefault();

      if (CONFIG.ARM5E.ItemDataModels[this.item.type]?.getIcon) {
        let currentDefIcon = CONFIG.ARM5E.ItemDataModels[this.item.type].getIcon(this.item);
        // if the current img is the default icon of the previous value, allow change
        if (
          this.item.img === currentDefIcon ||
          this.item.img === ARM5E_DEFAULT_ICONS.MONO[this.item.type] ||
          this.item.img === ARM5E_DEFAULT_ICONS.COLOR[this.item.type] ||
          this.item.img === "icons/svg/mystery-man.svg" ||
          this.item.img === "icons/svg/item-bag.svg"
        ) {
          await this.item.update({
            img: CONFIG.ARM5E.ItemDataModels[this.item.type].getIcon(this.item, evt.target.value),
            "system.form.value": evt.target.value
          });
        }
      }
      // }
    });
  }
}
