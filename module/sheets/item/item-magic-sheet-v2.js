import { ARM5E } from "../../config.js";

import { ArM5eItemSheetV2 } from "./item-sheet-v2.js";
import {
  GetEffectAttributesLabel,
  GetFilteredMagicalAttributes,
  PickRequisites
} from "../../helpers/magic.js";
import { ARM5E_DEFAULT_ICONS } from "../../constants/ui.js";
import { ArM5eActorSheetV2 } from "../actor/actor-sheet-v2.js";

/**
 * Intermediate AppV2 base class for magic item types:
 * spell, magicalEffect, baseEffect (and optionally others with technique+form+requisites).
 *
 * Shared responsibilities:
 *  - GetFilteredMagicalAttributes (populates selection.ranges/durations/targets)
 *  - RDT fallback (keeps the current selected value visible even if filtered out)
 *  - localizedDesc (GetEffectAttributesLabel)
 *  - flags.readonly → noEdit / noSelect / locked
 *  - isCharacter (show roll/mastery sections)
 *  - ui.requisites string
 *  - increaseScore / decreaseScore / rollEffect static actions
 */
export class ArM5eItemMagicSheetV2 extends ArM5eItemSheetV2 {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["arm5e", "sheet", "item"],
    position: { width: 654, height: 800 },
    window: { resizable: true },
    actions: {
      increaseScore: ArM5eItemMagicSheetV2.increaseScore,
      decreaseScore: ArM5eItemMagicSheetV2.decreaseScore,
      rollEffect: ArM5eItemMagicSheetV2.rollEffect,
      advancedReq: ArM5eItemMagicSheetV2.advancedReq,
      itemDeleteConfirm: ArM5eItemSheetV2.itemDeleteConfirm
    }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.ui ??= {};

    // Localized description summary (e.g. "CrIg 15 – R:Voice D:Diam T:Ind")
    context.system.localizedDesc = GetEffectAttributesLabel(this.item);

    // Populate filtered magic attribute lists (ranges / durations / targets)
    await GetFilteredMagicalAttributes(context.selection);

    // Ensure the currently-selected RDT values are always in the list,
    // even when sourcebook filtering would exclude them.
    if (this.item.system.range !== undefined) {
      for (const [field, listKey] of [
        ["range", "ranges"],
        ["duration", "durations"],
        ["target", "targets"]
      ]) {
        const val = context.system[field]?.value;
        if (val && !context.selection[listKey]?.[val]) {
          const cfg = CONFIG.ARM5E.magic[listKey]?.[val];
          if (cfg) {
            context.selection[listKey][val] = {
              label:
                cfg.impact !== undefined
                  ? `${game.i18n.localize(cfg.label)}  (${cfg.impact})`
                  : game.i18n.localize(cfg.label)
            };
          }
        }
      }
    }

    // Readonly flag (set on locked/readonly items such as those from compendium imports)
    if (context.flags?.[CONFIG.ARM5E.SYSTEM_ID]?.readonly === "true") {
      context.noEdit = "readonly";
      context.noSelect = "disabled";
      context.locked = true;
    } else {
      context.noEdit = "";
      context.noSelect = "";
      context.locked = false;
    }

    // True when the item is owned by a character (PC/NPC) → show roll & mastery sections
    context.isCharacter = this.item.isOwned && this.item.actor?.isCharacter?.() === true;

    // Requisites display string
    if (this.item.system["technique-req"] && this.item.system["form-req"]) {
      context.ui.requisites = this.item.system.getRequisitesStr?.() ?? "";
    }

    return context;
  }

  /** @override */
  async _onRender(context, options) {
    await super._onRender(context, options);

    // Form select → auto-update the item icon when it is still a default icon
    this.element.querySelectorAll(".select-form").forEach((el) => {
      el.addEventListener("change", async (event) => {
        event.preventDefault();
        const newForm = event.target.value;
        const getIcon = CONFIG.ARM5E.ItemDataModels[this.item.type]?.getIcon;
        if (getIcon) {
          const currentDefIcon = getIcon(this.item);
          const genericDefaults = ["icons/svg/mystery-man.svg", "icons/svg/item-bag.svg"];
          const typeDefaults = [
            ARM5E_DEFAULT_ICONS.MONO?.[this.item.type],
            ARM5E_DEFAULT_ICONS.COLOR?.[this.item.type]
          ].filter(Boolean);
          const allDefaults = [currentDefIcon, ...genericDefaults, ...typeDefaults];
          if (allDefaults.includes(this.item.img)) {
            await this.item.update({
              img: getIcon(this.item, newForm),
              "system.form.value": newForm
            });
            return;
          }
        }
        // No icon change needed — just update the form value
        await this.item.update({ "system.form.value": newForm });
      });
    });
  }

  // ─── Shared Static Actions ──────────────────────────────────────────────────

  static async increaseScore(event, target) {
    event.preventDefault();
    await this.item?.system?.increaseScore?.();
  }

  static async decreaseScore(event, target) {
    event.preventDefault();
    await this.item?.system?.decreaseScore?.();
  }

  /**
   * Roll the spell/magic effect via the owning actor sheet.
   * roll type is "spell" for spells, "magic" for magicalEffects.
   */
  static async advancedReq(event, target) {
    event.preventDefault();
    const update = await PickRequisites(
      this.item.system,
      ArM5eActorSheetV2.getFlavor(this.item.actor?.type),
      this.isEditable
    );
    if (update) await this.item.update(update);
  }

  static async rollEffect(event, target) {
    event.preventDefault();
    if (!this.item.isOwned || !this.actor?.sheet?.roll) return;
    const rollType = this.item.type === "spell" ? "spell" : "magic";
    const dataset = {
      roll: rollType,
      id: this.item._id,
      technique: this.item.system.technique?.value,
      form: this.item.system.form?.value,
      bonus: this.item.system.bonus,
      finalScore: this.item.system.finalScore,
      name: this.item.name,
      img: this.item.img
    };
    await this.actor.sheet.roll(dataset);
  }
}
