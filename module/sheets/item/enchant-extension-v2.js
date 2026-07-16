/**
 * Shared AppV2 controller for EnchantmentExtension UI.
 *
 * - `EnchantExtensionV2.actions` – spread into DEFAULT_OPTIONS.actions of each host sheet.
 * - `EnchantExtensionV2.getUserCacheEnchantments(cache, item)` – call from getUserCache() overrides.
 * - `EnchantExtensionV2.prepareEnchantmentContext(context, isEditable)` – call from _prepareContext.
 * - `EnchantExtensionV2.processFormData(prepared, item)` – call from _processFormData to merge arrays.
 * - `EnchantExtensionV2.wireListeners.call(sheet)` – call from _onRender for change-event wiring.
 */

import { getConfirmation } from "../../ui/dialogs.js";
import { ArM5eActorSheetV2 } from "../actor/actor-sheet-v2.js";
import { EnchantmentExtension, EnchantmentSchema } from "../../schemas/enchantmentSchema.js";
import {
  GetEffectAttributesLabel,
  GetEnchantmentSelectOptions,
  GetFilteredAspects,
  GetFilteredMagicalAttributes,
  PickRequisites,
  computeLevel,
  useMagicItem
} from "../../helpers/magic.js";
import { ARM5E } from "../../config.js";
import { ArM5eItem } from "../../item/item.js";
import { effectToLabText } from "../../item/item-converter.js";

export class EnchantExtensionV2 {
  // ──────────────────────────────────────────────────────────────────────────
  //  User-cache helpers
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Ensure the given per-item cache object has all enchantment-extension visibility keys.
   * Mutates the cache in-place and saves it back to sessionStorage.
   * @param {object} cache  The cache object for this item (from getUserCache base)
   * @param {Item}   item   The item whose enchantments drive the effects count
   * @returns {object} The mutated cache
   */
  static getUserCacheEnchantments(cache, item) {
    const storageKey = `usercache-${game.user.id}`;

    // Ensure enchantExt section visibility defaults
    cache.sections.visibility.enchantExt ??= {
      capacity: "hide",
      aspect: "hide",
      info: "",
      enchant: ""
    };

    // Sync per-effect collapse entries with actual effects array length
    const count = item.system.enchantments?.effects?.length ?? 0;
    const existing = cache.sections.visibility.enchantments ?? [];
    const enchantments = [];
    for (let i = 0; i < count; i++) {
      enchantments[i] = existing[i] ?? { desc: "", attributes: "", whole: "" };
    }
    cache.sections.visibility.enchantments = enchantments;

    // Persist immediately so _prepareContext reads the updated cache
    const usercache = JSON.parse(sessionStorage.getItem(storageKey)) ?? {};
    usercache[item.id] = cache;
    sessionStorage.setItem(storageKey, JSON.stringify(usercache));
    return cache;
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  Context preparation
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Enrich `context` with all derived enchantment data.
   * Must be called after GetFilteredMagicalAttributes/GetEnchantmentSelectOptions are available.
   * @param {object}  context      AppV2 context object (mutated in place)
   * @param {boolean} isEditable   Whether the sheet is currently editable
   */
  static async prepareEnchantmentContext(context, isEditable) {
    const enchants = context.system.enchantments;
    enchants.ui = {};
    enchants.invalidMsg = [];
    enchants.totalCapa = 0;
    enchants.states = foundry.utils.duplicate(ARM5E.lab.enchantment.state);

    // Edit attributes for sub-templates that use V1-style noEdit/noSelect/edition
    context.noEdit = isEditable ? "" : "readonly";
    context.noSelect = isEditable ? "" : "disabled";
    context.edition = {
      spellCombobox: isEditable ? "" : "disabled",
      spellField: isEditable ? "" : "readonly"
    };
    // ui.flavor is used by spell-design-alt.html partial via data-flavor
    context.ui.flavor = context.flavor ?? "Neutral";

    if (!context.selection) context.selection = {};
    await GetFilteredMagicalAttributes(context.selection);

    // ── Capacities ──────────────────────────────────────────────────────────
    if (enchants.capacities.length > 1) {
      enchants.states.charged.selection = "disabled";
      enchants.states.lesser.selection = "disabled";
      enchants.charged = false;
    } else if (enchants.capacities.length === 1) {
      enchants.noDelete = true;
    }

    enchants.prepared = false;
    let capaIdx = 0;
    context.selection.capacityMode = {
      sum: "arm5e.enchantment.capacity.sumMode",
      max: "arm5e.enchantment.capacity.maxMode"
    };
    context.selection.capacities = {};
    for (const capa of enchants.capacities) {
      capa.used = 0;
      capa.total =
        ARM5E.lab.enchantment.materialBase[capa.materialBase].base *
        ARM5E.lab.enchantment.sizeMultiplier[capa.sizeMultiplier].mult;
      capa.visiblePreparation =
        enchants.state !== "lesser" &&
        (enchants.attunementVisible || (enchants.visibleEnchant ?? 0) > 1 || context.isGM);
      if (capa.prepared || enchants.state === "lesser") {
        enchants.prepared = true;
        if (enchants.capacityMode === "sum") {
          enchants.totalCapa += capa.total;
        } else if (capa.total > enchants.totalCapa) {
          enchants.totalCapa = capa.total;
        }
      }
      capa.visible = true;
      context.selection.capacities[capa.id] = `${capa.desc} (${capaIdx++})`;
    }

    // ── Aspects ─────────────────────────────────────────────────────────────
    enchants.ASPECTS = await GetFilteredAspects();

    if (enchants.aspects.length > 1) {
      enchants.states.charged.selection = "disabled";
      enchants.states.lesser.selection = "disabled";
    }

    enchants.attuned = false;
    for (const a of enchants.aspects) {
      enchants.ASPECTS[a.aspect] = CONFIG.ARM5E.ASPECTS[a.aspect];
      a.effects = enchants.ASPECTS[a.aspect].effects;
      if (!enchants.attuned && a.attuned) {
        enchants.attuned = true;
        enchants.charged = false;
        enchants.minor = false;
        enchants.states.charged.selection = "disabled";
        enchants.states.lesser.selection = "disabled";
        enchants.states.prepared.selection = "disabled";
        enchants.states.major.selection = "disabled";
      }
    }

    // ── Effects ─────────────────────────────────────────────────────────────
    enchants.usedCapa = 0;

    if (enchants.effects.length > 1) {
      enchants.states.charged.selection = "disabled";
      enchants.states.lesser.selection = "disabled";
      enchants.states.prepared.selection = "disabled";
      enchants.expiryAllowed = false;
    }

    context.selection.states = Object.fromEntries(
      Object.entries(enchants.states).filter(([, v]) => v.selection !== "disabled")
    );

    GetEnchantmentSelectOptions(context);

    let idx = 0;
    enchants.visibleEnchant = 0;
    enchants.visibleCapacities = 0;
    for (const e of enchants.effects) {
      e.system.level = computeLevel(e.system, "enchantment");
      e.details = GetEffectAttributesLabel(e);
      if (e.system.hidden && !context.isGM) {
        enchants.usedCapa = "??";
        enchants.hasHiddenEnchants = true;
      } else {
        e.visible = true;
        enchants.visibleEnchant++;
        const ci = enchants.capacities.findIndex((c) => e.receptacleId === c.id);
        if (ci >= 0) {
          enchants.capacities[ci].used += Math.ceil(e.system.level / 10);
          enchants.capacities[ci].visible = true;
        }
        if (typeof enchants.usedCapa === "number") {
          enchants.usedCapa += Math.ceil(e.system.level / 10);
        }
      }
      e.enrichedDescription = await foundry.applications.ux.TextEditor.enrichHTML(
        e.system.description ?? "",
        { secrets: context.document.isOwner, rollData: context.rollData, relativeTo: context.item }
      );
      e.prefix = `system.enchantments.effects.${idx}.`;
      e.visibility = context.ui.sections.visibility.enchantments?.[idx] ?? {
        desc: "",
        attributes: "",
        whole: ""
      };
      idx++;
    }

    if (
      enchants.state !== "talisman" &&
      typeof enchants.usedCapa === "number" &&
      enchants.usedCapa > enchants.totalCapa
    ) {
      enchants.invalidItem = true;
      enchants.invalidMsg.push("arm5e.enchantment.msg.capacityOverflow");
    }

    // ── Visibility flags ────────────────────────────────────────────────────
    enchants.visibleType = context.isGM;
    if (enchants.visibleEnchant === 1 && enchants.charged) {
      enchants.visibleType = true;
    } else if (enchants.visibleEnchant > 1 && enchants.state !== "talisman") {
      enchants.visibleType = true;
    } else if (enchants.attunementVisible && enchants.state !== "talisman") {
      enchants.visibleType = true;
    }

    enchants.visibleCapacities = enchants.capacities.reduce(
      (acc, c) => (c.visible ? acc + 1 : acc),
      0
    );

    // ── Can-add and UI-lock flags per state ─────────────────────────────────
    enchants.addEffect = true;
    enchants.addCapa = true;
    enchants.addAspect = true;
    enchants.ui.attuned = "disabled";

    switch (enchants.state) {
      case "lesser":
        enchants.lesser = true;
        enchants.ui.prepared = "disabled";
        enchants.expiryAllowed = false;
        break;
      case "major":
        enchants.expiryAllowed = true;
        break;
      case "charged":
        enchants.prepared = false;
        enchants.minor = false;
        enchants.charged = true;
        enchants.ui.prepared = "disabled";
        enchants.talisman = false;
        enchants.ui.talisman = "disabled";
        enchants.expiryAllowed = false;
        break;
      case "prepared":
        enchants.expiryAllowed = true;
        enchants.charged = false;
        enchants.ui.charged = "disabled";
        enchants.minor = false;
        enchants.ui.minor = "disabled";
        enchants.addEffect = false;
        enchants.talisman = false;
        break;
      case "talisman":
        if (!enchants.attuned) {
          enchants.invalidItem = true;
          enchants.invalidMsg.push("arm5e.enchantment.msg.noAttunment");
        }
        enchants.expiryAllowed = true;
        enchants.charged = false;
        enchants.talisman = true;
        enchants.ui.charged = "disabled";
        enchants.minor = false;
        enchants.ui.minor = "disabled";
        enchants.ui.attuned = "";
        break;
      default:
        break;
    }

    if (["charged", "lesser"].includes(enchants.state)) {
      if (enchants.effects.length >= 1) {
        if (enchants.effects.length > 1) {
          enchants.invalidItem = true;
          enchants.invalidMsg.push("arm5e.enchantment.msg.tooManyEffects");
        }
        enchants.addEffect = false;
      }
      if (enchants.capacities.length >= 1) enchants.addCapa = false;
      if (enchants.aspects.length >= 1) enchants.addAspect = false;
    } else if (!enchants.prepared) {
      enchants.invalidItem = true;
      enchants.invalidMsg.push("arm5e.enchantment.msg.noCapacityPrepared");
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  Form data processing
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Merge sparse form-submitted enchantment arrays back into the full source arrays.
   * Call from the sheet's _processFormData() before returning the prepared data object.
   * @param {object} prepared  The processed form data object (mutated in place)
   * @param {Item}   item      The item document (source of truth for existing array values)
   * @returns {object} The mutated prepared data
   */
  static processFormData(prepared, item) {
    if (!prepared.system?.enchantments) return prepared;
    const source = item.toObject();
    const enc = prepared.system.enchantments;
    const srcEnc = source.system?.enchantments ?? {};

    for (const key of ["aspects", "capacities", "bonuses", "effects"]) {
      if (enc[key] !== undefined && srcEnc[key] !== undefined) {
        foundry.utils.mergeObject(srcEnc[key], enc[key], { recursive: true });
        enc[key] = srcEnc[key];
      }
    }
    return prepared;
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  Static action handlers (AppV2 pattern – bound to sheet `this`)
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Toggle enchantments on/off (appraise icon click).
   * Enable: inert/null → appraised + new EnchantmentExtension instance.
   * Disable: show confirmation dialog, on confirm → inert + null.
   */
  static async enchantmentToggle(event, target) {
    event.preventDefault();
    const item = this.item;
    if (item.system.enchantments === null || item.system.state === "inert") {
      await item.update({
        "system.state": "appraised",
        "system.enchantments": new EnchantmentExtension()
      });
    } else {
      const confirm = await getConfirmation(
        game.i18n.localize("arm5e.sheet.enchantment"),
        game.i18n.localize("arm5e.dialog.enchant-deletion-confirm"),
        ArM5eActorSheetV2.getFlavor(item.actor?.type)
      );
      if (confirm) {
        await item.update({ "system.state": "inert", "system.enchantments": null });
      }
    }
  }

  /** Add a new enchantment effect to the effects array. */
  static async enchantmentCreate(event, target) {
    event.preventDefault();
    const item = this.item;
    const effects = [
      ...item.system.enchantments.effects,
      {
        name: game.i18n.localize("arm5e.sheet.effect"),
        system: new EnchantmentSchema(),
        receptacleId: item.system.enchantments.capacities[0].id
      }
    ];
    // Extend the per-effect collapse cache entry
    const storageKey = `usercache-${game.user.id}`;
    const usercache = JSON.parse(sessionStorage.getItem(storageKey)) ?? {};
    const itemCache = usercache[item.id] ?? {};
    itemCache.sections ??= { visibility: {} };
    itemCache.sections.visibility ??= {};
    itemCache.sections.visibility.enchantments ??= [];
    itemCache.sections.visibility.enchantments.push({ desc: "", attributes: "", whole: "" });
    usercache[item.id] = itemCache;
    sessionStorage.setItem(storageKey, JSON.stringify(usercache));

    await item.update({
      "system.state": "enchanted",
      "system.enchantments.effects": effects
    });
  }

  /** Delete a single enchantment effect (with confirmation). */
  static async enchantmentEffectDelete(event, target) {
    event.preventDefault();
    const index = Number(target.dataset.index);
    const item = this.item;
    const confirm = await getConfirmation(
      item.name,
      game.i18n.localize("arm5e.dialog.delete-question"),
      ArM5eActorSheetV2.getFlavor(item.actor?.type)
    );
    if (!confirm) return;
    const effects = [...item.system.enchantments.effects];
    effects.splice(index, 1);
    const updateData = { "system.enchantments.effects": effects };
    if (effects.length === 0) updateData["system.state"] = "appraised";
    await item.update(updateData);
  }

  /** Open an enchantment effect in a temporary read-only item sheet. */
  static async enchantmentEffectShow(event, target) {
    event.preventDefault();
    const index = Number(target.dataset.index);
    const effect = this.item.system.enchantments.effects[index];
    const item = new ArM5eItem(
      {
        name: effect.name,
        type: "enchantment",
        img: effect.img,
        ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER },
        editable: false,
        system: effect.system,
        [`flags.${CONFIG.ARM5E.SYSTEM_ID}.readonly`]: "true"
      },
      { temporary: true }
    );
    item.sheet.render(true);
  }

  /** Trigger a magic-item-use roll for an effect. */
  static async triggerEnchant(event, target) {
    event.preventDefault();
    const item = this.item;
    if (!item.isOwned) return;
    const dataset = { ...target.dataset, roll: "item", id: item._id, physicalcondition: false };
    await useMagicItem(dataset, item);
  }

  /** Create a draft lab text on the owning actor from an enchantment effect. */
  static async createEnchanLabText(event, target) {
    event.preventDefault();
    const index = Number(target.dataset.index);
    if (!this.item.isOwned) return;
    const effect = this.item.system.enchantments.effects[index];
    const labTextData = effectToLabText(effect);
    labTextData.system.author = this.actor.name;
    labTextData.system.draft = true;
    await this.actor.createEmbeddedDocuments("Item", [labTextData]);
  }

  /** Open the advanced requisite picker for an enchantment effect. */
  static async advancedReqEnchant(event, target) {
    event.preventDefault();
    const index = Number(target.dataset.index);
    const effect = this.item.system.enchantments.effects[index];
    const update = await PickRequisites(effect.system, target.dataset.flavor);
    if (update) {
      await this.item.update({ [`system.enchantments.effects.${index}`]: update });
    }
  }

  /** Add a new capacity to the enchanted item. */
  static async capacityCreate(event, target) {
    event.preventDefault();
    const capacities = [
      ...this.item.system.enchantments.capacities,
      {
        id: foundry.utils.randomID(),
        sizeMultiplier: "tiny",
        materialBase: "base1",
        desc: "",
        prepared: false
      }
    ];
    await this.item.update({ "system.enchantments.capacities": capacities });
  }

  /** Delete a capacity (blocked if any effect references it). */
  static async capacityDelete(event, target) {
    event.preventDefault();
    const index = Number(target.dataset.index);
    const id = target.dataset.id;
    if (this.item.system.enchantments.effects.find((e) => e.receptacleId === id)) {
      ui.notifications.info(game.i18n.localize("arm5e.notification.effectLinked"));
      return;
    }
    const confirm = await getConfirmation(
      this.item.name,
      game.i18n.localize("arm5e.dialog.delete-question"),
      ArM5eActorSheetV2.getFlavor(this.item.actor?.type)
    );
    if (!confirm) return;
    const capacities = [...this.item.system.enchantments.capacities];
    capacities.splice(index, 1);
    await this.item.update({ "system.enchantments.capacities": capacities });
  }

  /** Add the first available aspect to the aspects array. */
  static async aspectCreate(event, target) {
    event.preventDefault();
    const ASPECTS = await GetFilteredAspects();
    const first = Object.keys(ASPECTS)[0];
    const firstEffect = Object.keys(ASPECTS[first].effects)[0];
    const aspects = [
      ...this.item.system.enchantments.aspects,
      {
        aspect: first,
        effect: firstEffect,
        bonus: ASPECTS[first].effects[firstEffect].bonus,
        attuned: false
      }
    ];
    await this.item.update({ "system.enchantments.aspects": aspects });
  }

  /** Delete an aspect (with confirmation). */
  static async aspectDelete(event, target) {
    event.preventDefault();
    const confirm = await getConfirmation(
      this.item.name,
      game.i18n.localize("arm5e.dialog.delete-question"),
      ArM5eActorSheetV2.getFlavor(this.item.actor?.type)
    );
    if (!confirm) return;
    const index = Number(target.dataset.index);
    const aspects = [...this.item.system.enchantments.aspects];
    aspects.splice(index, 1);
    await this.item.update({ "system.enchantments.aspects": aspects });
  }

  /** Add a new lab-total bonus entry. */
  static async bonusCreate(event, target) {
    event.preventDefault();
    const bonuses = [
      ...this.item.system.enchantments.bonuses,
      { name: "Generic", type: "labTotal", value: 1 }
    ];
    await this.item.update({ "system.enchantments.bonuses": bonuses });
  }

  /** Delete a bonus entry (with confirmation). */
  static async bonusDelete(event, target) {
    event.preventDefault();
    const confirm = await getConfirmation(
      this.item.name,
      game.i18n.localize("arm5e.dialog.delete-question"),
      ArM5eActorSheetV2.getFlavor(this.item.actor?.type)
    );
    if (!confirm) return;
    const index = Number(target.dataset.index);
    const bonuses = [...this.item.system.enchantments.bonuses];
    bonuses.splice(index, 1);
    await this.item.update({ "system.enchantments.bonuses": bonuses });
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  Change-event wiring (_onRender hook)
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Wire DOM change-event listeners that cannot be expressed as data-action clicks.
   * Call with the sheet as `this` from _onRender:
   *   EnchantExtensionV2.wireListeners.call(this);
   */
  static wireListeners() {
    if (!this.item.system.enchantments) return;
    const item = this.item;
    const el = this.element;

    // ── Enchantment state select ────────────────────────────────────────────
    el.querySelectorAll(".enchantment-state").forEach((select) => {
      select.addEventListener("change", async (e) => {
        e.preventDefault();
        const currentState = e.currentTarget.dataset.state;
        const newState = e.currentTarget.selectedOptions[0].value;
        const updateData = {};
        const enchant = item.system.enchantments;
        const flavor = ArM5eActorSheetV2.getFlavor(item.actor?.type);

        switch (currentState) {
          case "charged": {
            const confirm = await getConfirmation(
              game.i18n.localize("arm5e.sheet.enchantment"),
              game.i18n.localize("arm5e.enchantment.msg.deleteChargesConfirm"),
              flavor
            );
            if (confirm) {
              updateData["system.enchantments.charges"] = 1;
              updateData["system.enchantments.originalCharges"] = 1;
            } else {
              e.currentTarget.value = currentState;
              return;
            }
            if (newState === "major" || newState === "talisman") {
              enchant.capacities[0].prepared = true;
              updateData["system.enchantments.capacities"] = enchant.capacities;
            }
            break;
          }
          case "lesser":
            if (newState === "major" || newState === "talisman") {
              enchant.capacities[0].prepared = true;
              updateData["system.enchantments.capacities"] = enchant.capacities;
            }
            break;
          case "prepared":
            if (newState === "major" || newState === "talisman") {
              enchant.capacities[0].prepared = true;
              updateData["system.enchantments.capacities"] = enchant.capacities;
            }
            break;
          case "major": {
            if (newState === "prepared") {
              const confirm = await getConfirmation(
                game.i18n.localize("arm5e.sheet.enchantment"),
                game.i18n.localize("arm5e.enchantment.msg.deleteEffectsConfirm"),
                flavor
              );
              if (confirm) {
                for (let i = 0; i < enchant.effects.length; i++) {
                  updateData[`system.enchantments.effects.-=${i}`] = null;
                }
              } else {
                e.currentTarget.value = currentState;
                return;
              }
            } else if (newState === "charged" || newState === "lesser") {
              enchant.capacities[0].prepared = false;
              updateData["system.enchantments.capacities"] = enchant.capacities;
            }
            break;
          }
          case "talisman":
            if (newState !== "major") {
              enchant.capacities[0].prepared = false;
              updateData["system.enchantments.capacities"] = enchant.capacities;
            }
            break;
          default:
            return;
        }
        updateData["system.enchantments.state"] = newState;
        await item.update(updateData);
      });
    });

    // ── Receptacle (capacity) select per effect ─────────────────────────────
    el.querySelectorAll(".receptacle-idx-change").forEach((select) => {
      select.addEventListener("change", async (e) => {
        e.preventDefault();
        const index = Number(e.currentTarget.dataset.index);
        const receptacleId = e.currentTarget.selectedOptions[0].value;
        const effects = item.system.enchantments.effects.map((ef, i) =>
          i === index ? { ...ef, receptacleId } : ef
        );
        await item.update({ "system.enchantments.effects": effects });
      });
    });

    // ── Aspect shape/material select ────────────────────────────────────────
    el.querySelectorAll(".aspect-change").forEach((select) => {
      select.addEventListener("change", async (e) => {
        e.preventDefault();
        const index = Number(e.currentTarget.dataset.index);
        const aspectKey = e.currentTarget.selectedOptions[0].value;
        const ASPECTS = await GetFilteredAspects();
        const effectKey = Object.keys(ASPECTS[aspectKey]?.effects ?? {})[0] ?? "";
        const aspects = [...item.system.enchantments.aspects];
        aspects[index] = {
          ...aspects[index],
          aspect: aspectKey,
          effect: effectKey,
          bonus: ASPECTS[aspectKey]?.effects?.[effectKey]?.bonus ?? 0
        };
        await item.update({ "system.enchantments.aspects": aspects });
      });
    });

    // ── Aspect effect (bonus sub-type) select ───────────────────────────────
    el.querySelectorAll(".effect-change").forEach((select) => {
      select.addEventListener("change", async (e) => {
        e.preventDefault();
        const index = Number(e.currentTarget.dataset.index);
        const effectKey = e.currentTarget.selectedOptions[0].value;
        const aspects = [...item.system.enchantments.aspects];
        const ASPECTS = await GetFilteredAspects();
        const aspectKey = aspects[index].aspect;
        aspects[index] = {
          ...aspects[index],
          effect: effectKey,
          bonus: ASPECTS[aspectKey]?.effects?.[effectKey]?.bonus ?? 0
        };
        await item.update({ "system.enchantments.aspects": aspects });
      });
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  actions map
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Spread into DEFAULT_OPTIONS.actions for any host sheet:
   *   actions: { ...EnchantExtensionV2.actions, ...ownActions }
   */
  static get actions() {
    return {
      enchantmentToggle: EnchantExtensionV2.enchantmentToggle,
      enchantmentCreate: EnchantExtensionV2.enchantmentCreate,
      enchantmentEffectDelete: EnchantExtensionV2.enchantmentEffectDelete,
      enchantmentEffectShow: EnchantExtensionV2.enchantmentEffectShow,
      triggerEnchant: EnchantExtensionV2.triggerEnchant,
      createEnchanLabText: EnchantExtensionV2.createEnchanLabText,
      advancedReqEnchant: EnchantExtensionV2.advancedReqEnchant,
      capacityCreate: EnchantExtensionV2.capacityCreate,
      capacityDelete: EnchantExtensionV2.capacityDelete,
      aspectCreate: EnchantExtensionV2.aspectCreate,
      aspectDelete: EnchantExtensionV2.aspectDelete,
      bonusCreate: EnchantExtensionV2.bonusCreate,
      bonusDelete: EnchantExtensionV2.bonusDelete
    };
  }
}
