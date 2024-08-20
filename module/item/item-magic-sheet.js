import { ArM5eItemSheet } from "./item-sheet.js";
import { log } from "../tools.js";
import { ARM5E } from "../config.js";
import { ARM5E_DEFAULT_ICONS } from "../constants/ui.js";
import {
  GetEffectAttributesLabel,
  GetEnchantmentSelectOptions,
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
    return foundry.utils.mergeObject(super.defaultOptions, {
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

    await GetFilteredMagicalAttributes(context.selection);

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
        GetEnchantmentSelectOptions(context);
        context.canBeRead = context.isOwned && this.actor.type != "covenant";
      case "spell":
      case "enchantment":

      case "magicItem":
      case "magicalEffect":
      case "supernaturalEffect":
        if (!context.selection.ranges[context.system.range.value]) {
          const currentRange = context.system.range.value;
          context.selection.ranges[currentRange] = CONFIG.ARM5E.magic.ranges[currentRange];
          context.selection.ranges[currentRange].label = `${game.i18n.localize(
            CONFIG.ARM5E.magic.ranges[currentRange].label
          )}  (${CONFIG.ARM5E.magic.ranges[currentRange].impact})`;
        }

        if (!context.selection.targets[context.system.target.value]) {
          const currentTarget = context.system.target.value;
          context.selection.targets[currentTarget] = CONFIG.ARM5E.magic.targets[currentTarget];
          context.selection.targets[currentTarget].label = `${game.i18n.localize(
            CONFIG.ARM5E.magic.targets[currentTarget].label
          )}  (${CONFIG.ARM5E.magic.targets[currentTarget].impact})`;
        }
        if (!context.selection.durations[context.system.duration.value]) {
          const currentDuration = context.system.duration.value;
          context.selection.durations[currentDuration] =
            CONFIG.ARM5E.magic.durations[currentDuration];
          context.selection.durations[currentDuration].label = `${game.i18n.localize(
            CONFIG.ARM5E.magic.durations[currentDuration].label
          )}  (${CONFIG.ARM5E.magic.durations[currentDuration].impact})`;
        }

        break;
      default:
        break;
    }

    if (this.item.type === "enchantment") {
      context.selection.frequency = Object.fromEntries(
        Object.entries(CONFIG.ARM5E.lab.enchantment.effectUses).map(([k, v]) => {
          return [k, `${v} ${game.i18n.localize("arm5e.lab.enchantment.uses-per-day")}`];
        })
      );
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
        // If the current img is the default icon of the previous value, allow change
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
