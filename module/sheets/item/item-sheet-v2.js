import { ARM5E } from "../../config.js";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;
const { DragDrop } = foundry.applications.ux;
import { getConfirmation } from "../../ui/dialogs.js";
import { ArM5eActorSheetV2 } from "../actor/actor-sheet-v2.js";
import ArM5eActiveEffect from "../../helpers/active-effects.js";
import { UI } from "../../constants/ui.js";

/**
 * Shared AppV2 item sheet base.
 *
 * Keep this class lean for the first migration slice; add shared behavior only
 * when at least two item sheet implementations need it.
 */

export class ArM5eItemSheetV2 extends HandlebarsApplicationMixin(ItemSheetV2) {
  /** @protected */
  _dragDropHandlers = [];

  constructor(options = {}) {
    super(options);
    this._dragDropHandlers = this.#createDragDropHandlers();
  }

  static #FLAVOR_CLASSES = [
    "item-flavor-pc",
    "item-flavor-npc",
    "item-flavor-covenant",
    "item-flavor-lab",
    "item-flavor-codex",
    "item-flavor-neutral"
  ];

  static #TAB_NAV_CLASSES = {
    PC: "blueBar",
    NPC: "brownBar",
    covenant: "redBar",
    Lab: "greenBar",
    codex: "purpleBar",
    Neutral: "blackBar"
  };

  #flavorClass;

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["arm5e", "sheet", "item"],
    position: { width: 650, height: 752 },
    form: {
      submitOnChange: true,
      closeOnSubmit: false
    },
    window: {
      resizable: true
    },
    actions: {
      toggleSectionCollapse: ArM5eItemSheetV2.toggleSectionCollapse,
      effectCreate: ArM5eItemSheetV2.effectCreate,
      effectEdit: ArM5eItemSheetV2.effectEdit,
      effectDelete: ArM5eItemSheetV2.effectDelete,
      effectToggle: ArM5eItemSheetV2.effectToggle,
      itemDeleteConfirm: ArM5eItemSheetV2.itemDeleteConfirm,
      showOwner: ArM5eItemSheetV2.showOwner
    }
  };

  /** @override */
  static PARTS = {};

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    context.item = this.item;
    context.system = this.item?.system;
    context.flags = this.item?.flags;
    context.config = CONFIG.ARM5E;
    context.rollData = this.item?.getRollData?.() ?? {};
    context.selection = {};
    context.ui = this.getUserCache();
    context.isGM = game.user.isGM;
    context.isOwned = this.item?.isOwned ?? false;
    context.flavor = ArM5eActorSheetV2.getFlavor(this.item?.actor?.type);
    this.#flavorClass ??= ArM5eItemSheetV2.#getFlavorClass(context.flavor);
    context.navClass = ArM5eItemSheetV2.#getTabNavClass(context.flavor);
    context.subtabNavClass = context.navClass;
    context.metagame = {
      view: game.settings.get(ARM5E.SYSTEM_ID, "metagame") && UI.METAGAME.includes(this.item.type),
      edit: context.isGM ? "" : "readonly"
    };
    context.effects = ArM5eActiveEffect.prepareActiveEffectCategories(this.item.effects);
    context.system.effectCreation = game.user.isTrusted;

    if (this.item?.system?.cost?.amount !== undefined) {
      const quantity = Number(this.item?.system?.quantity ?? 0);
      const amount = Number(this.item?.system?.cost?.amount ?? 0);
      const currency = game.settings.get(ARM5E.SYSTEM_ID, "currency");
      context.cost = {
        detail: game.settings.get(ARM5E.SYSTEM_ID, "moneyManagementLevel"),
        currency,
        coeff: game.settings.get(ARM5E.SYSTEM_ID, "currencyCoeff"),
        hint: `${quantity * amount} ${currency} total`
      };
    }

    const description = this.item?.system?.description ?? "";
    context.enrichedDescription = await foundry.applications.ux.TextEditor.enrichHTML(description, {
      secrets: this.document.isOwner,
      rollData: context.rollData,
      relativeTo: this.item
    });

    return context;
  }

  /**
   * Read (and initialise if needed) the per-item section-visibility cache from sessionStorage.
   * Subclasses can override to ensure additional visibility categories exist.
   */
  getUserCache() {
    const key = `usercache-${game.user.id}`;
    let usercache = JSON.parse(sessionStorage.getItem(key)) ?? {};
    if (usercache[this.item.id] === undefined) {
      usercache[this.item.id] = { sections: { visibility: { common: {}, book: {} } } };
      sessionStorage.setItem(key, JSON.stringify(usercache));
    } else if (usercache[this.item.id].sections === undefined) {
      usercache[this.item.id].sections = { visibility: { common: {}, book: {} } };
      sessionStorage.setItem(key, JSON.stringify(usercache));
    }
    return usercache[this.item.id];
  }

  static #getFlavorClass(flavor) {
    switch (flavor) {
      case "PC":
        return "item-flavor-pc";
      case "NPC":
        return "item-flavor-npc";
      case "covenant":
        return "item-flavor-covenant";
      case "Lab":
        return "item-flavor-lab";
      case "codex":
        return "item-flavor-codex";
      default:
        return "item-flavor-neutral";
    }
  }

  static #getTabNavClass(flavor) {
    return ArM5eItemSheetV2.#TAB_NAV_CLASSES[flavor] ?? "blackBar";
  }

  /** @override */
  async _onRender(context, options) {
    await super._onRender(context, options);

    for (const handler of this._dragDropHandlers) {
      handler.bind(this.element);
    }

    if (this.#flavorClass) {
      this.element.classList.remove(...ArM5eItemSheetV2.#FLAVOR_CLASSES);
      this.element.classList.add(this.#flavorClass);
    }

    this.element.querySelectorAll(".select-on-focus").forEach((el) => {
      el.addEventListener("focus", (event) => event.currentTarget.select());
    });
  }

  /**
   * Toggle the visibility of a collapsible section and persist the state in sessionStorage.
   * Bound via data-action="toggleSectionCollapse" on .section-handle elements.
   * @param {Event} event
   * @param {HTMLElement} target
   */
  static toggleSectionCollapse(event, target) {
    const ds = target.dataset;
    const index = ds.index ?? "";
    const storageKey = `usercache-${game.user.id}`;
    const usercache = JSON.parse(sessionStorage.getItem(storageKey)) ?? {};
    const scope = usercache[this.item.id]?.sections?.visibility?.[ds.category];
    const targetEl = document.getElementById(
      `${ds.category}-${ds.section}${index}-${this.item.id}`
    );
    if (!targetEl) return;
    if (scope !== undefined) {
      const hidden = targetEl.classList.contains("hide");
      if (index !== "") {
        if (!scope[index]) scope[index] = {};
        scope[index][ds.section] = hidden ? "" : "hide";
      } else {
        scope[ds.section] = hidden ? "" : "hide";
      }
      sessionStorage.setItem(storageKey, JSON.stringify(usercache));
    }
    targetEl.classList.toggle("hide");
  }

  static async effectCreate(event, target) {
    event.preventDefault();
    const li = target.closest("li");
    const effectType = li?.dataset?.effectType;
    const data = {
      origin: this.item.uuid,
      "duration.turns": effectType === "temporary" ? 999 : undefined,
      disabled: effectType === "inactive",
      tint: "#000000",
      changes: [],
      flags: {
        arm5e: {
          type: [],
          subtype: [],
          option: []
        }
      },
      name: game.i18n.localize("arm5e.activeEffect.new"),
      img: "icons/svg/aura.svg"
    };
    return await this.item.createEmbeddedDocuments("ActiveEffect", [data]);
  }

  static async effectEdit(event, target) {
    event.preventDefault();
    const li = target.closest("li");
    const effect = await fromUuid(li?.dataset?.effectId);
    if (!effect) return;
    effect.sheet.setFilter(li.dataset.filter);
    return effect.sheet.render(true);
  }

  static async effectDelete(event, target) {
    event.preventDefault();
    const li = target.closest("li");
    const effect = await fromUuid(li?.dataset?.effectId);
    if (!effect) return;
    return effect.delete();
  }

  static async effectToggle(event, target) {
    event.preventDefault();
    const li = target.closest("li");
    const effect = await fromUuid(li?.dataset?.effectId);
    if (!effect) return;
    return effect.update({ disabled: !effect.disabled });
  }

  /**
   * Confirm and delete the currently opened embedded item.
   * @param {Event} event
   * @param {HTMLElement} target
   */
  static async itemDeleteConfirm(event, target) {
    event.preventDefault();
    if (!this.item?.isOwned || !this.actor) return;

    const question = game.i18n.localize("arm5e.dialog.delete-question");
    const confirm = await getConfirmation(
      this.item.name,
      question,
      ArM5eActorSheetV2.getFlavor(this.item.actor?.type)
    );

    if (confirm) {
      await this.actor.deleteEmbeddedDocuments("Item", [this.item.id], {});
    }
  }

  static showOwner(event, target) {
    event.preventDefault();
    if (this.item?.actor) {
      this.item.actor.sheet.render(true);
    }
  }

  // DRAG and DROP

  #createDragDropHandlers() {
    const dragDropOptions = Array.isArray(this.options.dragDrop) ? this.options.dragDrop : [];
    return dragDropOptions.map((d) => {
      const config = {
        ...d,
        permissions: {
          dragstart: this._canDragStart.bind(this),
          drop: this._canDragDrop.bind(this)
        },
        callbacks: {
          dragstart: this._onDragStart.bind(this),
          dragover: this._onDragOver.bind(this),
          drop: this._onDrop.bind(this)
        }
      };
      return new DragDrop.implementation(config);
    });
  }

  _canDragStart(selector) {
    return this.item?.isOwner && this.isEditable;
  }

  _canDragDrop(selector) {
    return this.item?.isOwner && this.isEditable;
  }

  _onDragStart(event) {}

  _onDragOver(event) {}
}

Hooks.on("getHeaderControlsItemSheetV2", (app, controls) => {
  controls.unshift({
    action: "showOwner",
    label: game.i18n.localize("arm5e.sheet.owner"),
    class: "show-owner",
    icon: "fas fa-user"
  });
});
