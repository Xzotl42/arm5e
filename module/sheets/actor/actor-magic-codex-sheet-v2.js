import { ArM5eActorSheetV2 } from "./actor-sheet-v2.js";
import { compareBaseEffects, compareSpells, hermeticFilter } from "../../tools/tools.js";
import { labTextToEffect } from "../../item/item-converter.js";
import { HERMETIC_FILTER, updateUserCache } from "../../constants/userdata.js";
import { getConfirmation } from "../../ui/dialogs.js";
import {
  GetEffectAttributesLabel,
  GetFilteredAspects,
  spellFormLabel,
  spellTechniqueLabel
} from "../../helpers/magic.js";

/**
 * AppV2 Magic Codex actor sheet.
 */
export class ArM5eMagicCodexSheetV2 extends ArM5eActorSheetV2 {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["arm5e", "sheet", "actor", "actor-magic-codex"],
    position: { width: 790, height: 800 },
    dragDrop: [{ dragSelector: null, dropSelector: ".mainCodex" }],
    window: { contentClasses: ["standard-form"] },
    actions: {
      createBaseEffect: ArM5eMagicCodexSheetV2.createBaseEffect,
      deleteEffect: ArM5eMagicCodexSheetV2.deleteEffect,
      designEffect: ArM5eMagicCodexSheetV2.designEffect,
      alternateDesign: ArM5eMagicCodexSheetV2.alternateDesign,
      itemEdit: ArM5eMagicCodexSheetV2.itemEdit,
      itemView: ArM5eMagicCodexSheetV2.itemView,
      itemClone: ArM5eMagicCodexSheetV2.itemClone,
      itemDelete: ArM5eMagicCodexSheetV2.itemDelete
    }
  };

  /** @override */
  static TABS = {
    primary: {
      tabs: [
        {
          id: "base-effects",
          label: "arm5e.sheet.base-effects",
          cssClass: "marginsides32 item flexrow"
        },
        {
          id: "magical-effect",
          label: "arm5e.sheet.magical-effects",
          cssClass: "marginsides32 item flexrow"
        },
        { id: "spells", label: "arm5e.sheet.spells", cssClass: "marginsides32 item flexrow" },
        {
          id: "enchantments",
          label: "arm5e.sheet.enchantments",
          cssClass: "marginsides32 item flexrow"
        },
        {
          id: "aspects",
          label: "arm5e.enchantment.aspects",
          cssClass: "marginsides32 item flexrow"
        }
      ],
      initial: "base-effects"
    }
  };

  /** @override */
  static PARTS = {
    header: {
      template: "systems/arm5e/templates/actor/parts/codex-header-v2.hbs"
    },
    tabs: {
      template: "systems/arm5e/templates/generic/parts/ars-tab-navigation.hbs",
      classes: ["arm5eTabsCOD", "marginsides32"]
    },
    "base-effects": {
      template: "systems/arm5e/templates/actor/parts/codex-base-effects-tab-v2.hbs"
    },
    "magical-effect": {
      template: "systems/arm5e/templates/actor/parts/codex-magical-effects-tab-v2.hbs"
    },
    spells: {
      template: "systems/arm5e/templates/actor/parts/codex-spells-tab-v2.hbs"
    },
    enchantments: {
      template: "systems/arm5e/templates/actor/parts/codex-enchantments-tab-v2.hbs"
    },
    aspects: {
      template: "systems/arm5e/templates/actor/parts/codex-aspects-tab-v2.hbs"
    },
    footer: {
      template: "systems/arm5e/templates/actor/parts/codex-footer-v2.hbs"
    }
  };

  /** @override */
  static LIMITED_PARTS = {
    content: {
      template: "systems/arm5e/templates/actor/actor-limited-sheet.html"
    }
  };

  getUserCache() {
    let usercache = JSON.parse(sessionStorage.getItem(`usercache-${game.user.id}`));
    if (usercache[this.actor.id] == undefined) {
      usercache[this.actor.id] = {
        filters: {
          hermetic: {
            filter: HERMETIC_FILTER
          },
          aspects: {
            searchString: ""
          }
        }
      };
      sessionStorage.setItem(`usercache-${game.user.id}`, JSON.stringify(usercache));
    } else if (usercache[this.actor.id].filters.aspects === undefined) {
      usercache[this.actor.id].filters.aspects = { searchString: "" };
      sessionStorage.setItem(`usercache-${game.user.id}`, JSON.stringify(usercache));
    }
    return usercache[this.actor.id];
  }

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.tabs = this._prepareTabs("primary");
    // context.ui = this.getUserCache();
    context.config = CONFIG.ARM5E;

    this._prepareCodexItems(context);

    const filters = context.ui.filters.hermetic.filter;
    context.system.filteredBaseEffects = hermeticFilter(filters, context.system.baseEffects ?? []);
    context.system.baseEffectCount = context.system.filteredBaseEffects.length;
    context.system.filteredBaseEffects.sort(compareBaseEffects);

    context.system.filteredMagicEffects = hermeticFilter(
      filters,
      context.system.magicEffects ?? []
    );
    context.system.magicEffectsCount = context.system.filteredMagicEffects.length;

    context.system.filteredEnchantments = hermeticFilter(
      filters,
      context.system.enchantments ?? []
    );
    context.system.enchantmentsCount = context.system.filteredEnchantments.length;

    context.system.filteredSpells = hermeticFilter(filters, context.system.spells ?? []);
    context.system.spellsCount = context.system.filteredSpells.length;
    context.system.filteredSpells = context.system.filteredSpells.sort(compareSpells);

    const filterBySettingAspects = await GetFilteredAspects();
    const searchStr = context.ui.filters.aspects.searchString ?? "";
    if (searchStr.length < 3) {
      context.system.filteredAspects = Object.values(filterBySettingAspects).map((e) => {
        return { ...e, source: game.i18n.localize(CONFIG.ARM5E.generic.sourcesTypes[e.src].label) };
      });
      context.system.aspectsCount = context.system.filteredAspects.length;
    } else {
      context.system.filteredAspects = {};
      context.system.aspectsCount = 0;
      if (CONFIG.ARM5E.lang[game.i18n.lang] && CONFIG.ARM5E.lang[game.i18n.lang].aspects) {
        let tmp = {};
        let subset = filterBySettingAspects;
        for (const keyword of searchStr.split(" ")) {
          for (const [a, params] of Object.entries(subset)) {
            if (params.index.includes(keyword)) {
              tmp[a] = params;
              continue;
            }
            for (const e of Object.values(params.effects)) {
              if (e.index.includes(keyword)) {
                tmp[a] = params;
                context.system.aspectsCount++;
                break;
              }
            }
          }
          subset = foundry.utils.duplicate(tmp);
          tmp = {};
        }
        context.system.filteredAspects = subset;
        context.system.aspectsCount = Object.keys(subset).length;
      } else {
        let tmp = {};
        let subset = filterBySettingAspects;
        for (const keyword of searchStr.split(" ")) {
          for (const [a, params] of Object.entries(subset)) {
            if (a.includes(keyword)) {
              tmp[a] = params;
              continue;
            }
            for (const e of Object.keys(params.effects)) {
              if (e.includes(keyword)) {
                tmp[a] = params;
                break;
              }
            }
          }
          subset = foundry.utils.duplicate(tmp);
          tmp = {};
        }
        context.system.filteredAspects = subset;
        context.system.aspectsCount = Object.keys(subset).length;
      }
    }

    return context;
  }

  /** @override */
  async _preparePartContext(partId, context, options) {
    if (["base-effects", "magical-effect", "spells", "enchantments", "aspects"].includes(partId)) {
      context.tab = context.tabs[partId];
    }
    return super._preparePartContext(partId, context, options);
  }

  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);

    this.element.querySelectorAll(".search-aspects").forEach((el) => {
      el.addEventListener("change", (event) => {
        const usercache = JSON.parse(sessionStorage.getItem(`usercache-${game.user.id}`));
        usercache[this.actor.id].filters.aspects.searchString = event.currentTarget.value
          .toLowerCase()
          .trim();
        sessionStorage.setItem(`usercache-${game.user.id}`, JSON.stringify(usercache));
        this.render();
      });
    });
  }

  _prepareCodexItems(codexData) {
    for (const item of codexData.system.baseEffects ?? []) {
      item.system.artsLabel = `${spellTechniqueLabel(item.system, true)} ${spellFormLabel(
        item.system,
        true
      )}`;
    }

    for (const item of codexData.system.enchantments ?? []) {
      item.system.localizedDesc = GetEffectAttributesLabel(item);
    }
    for (const item of codexData.system.spells ?? []) {
      item.system.localizedDesc = GetEffectAttributesLabel(item);
    }

    for (const item of codexData.system.magicEffects ?? []) {
      item.system.localizedDesc = GetEffectAttributesLabel(item);
    }
  }

  static async createBaseEffect(event, target) {
    try {
      await this._onBaseEffectCreate(target.dataset);
    } catch (err) {
      console.error("MagicCodexV2 | createBaseEffect failed:", err);
      this.render();
    }
  }

  static async deleteEffect(event, target) {
    try {
      const itemEl = target.closest(".item");
      if (!itemEl) return;
      await this._onDeleteEffect(event, itemEl.dataset);
    } catch (err) {
      console.error("MagicCodexV2 | deleteEffect failed:", err);
      this.render();
    }
  }

  static async designEffect(event, target) {
    try {
      const itemEl = target.closest(".item");
      if (!itemEl) return;
      await this._onClickEffect(event, itemEl.dataset);
    } catch (err) {
      console.error("MagicCodexV2 | designEffect failed:", err);
      this.render();
    }
  }

  static async alternateDesign(event, target) {
    try {
      const itemEl = target.closest(".item");
      if (!itemEl) return;
      await this._onClickAlternateDesign(itemEl.dataset);
    } catch (err) {
      console.error("MagicCodexV2 | alternateDesign failed:", err);
      this.render();
    }
  }

  async _onBaseEffectCreate(dataset) {
    const tech = dataset.technique === "" ? "cr" : dataset.technique;
    const form = dataset.form === "" ? "an" : dataset.form;
    const itemData = [
      {
        name: "New Base Effect",
        type: "baseEffect",
        system: {
          technique: { value: tech },
          form: { value: form }
        }
      }
    ];
    const [newItem] = await this.actor.createEmbeddedDocuments("Item", itemData, {});
    newItem?.sheet?.render(true);
    return newItem;
  }

  async _onDeleteEffect(event, itemDataset) {
    const question = game.i18n.localize("arm5e.dialog.delete-question");
    const itemId = itemDataset.itemId;
    if (!itemId) return;

    let confirmed = false;
    if (event.shiftKey) {
      confirmed = true;
    } else {
      confirmed = await getConfirmation(itemDataset.name, question, "codex");
    }
    if (!confirmed) return;

    await this.actor.deleteEmbeddedDocuments("Item", [itemId], {});
    this.render(false);
  }

  async _onClickAlternateDesign(itemDataset) {
    const itemUuid = itemDataset.uuid;
    if (!itemUuid) return;
    await this._onDesignEffect(itemUuid, true);
  }

  async _onClickEffect(event, itemDataset) {
    const itemUuid = itemDataset.uuid;
    const itemType = itemDataset.itemType;
    if (!itemUuid || !itemType) return;

    let mnemo;
    switch (itemType) {
      case "baseEffect":
        mnemo = "arm5e.dialog.design-effect-question";
        break;
      case "magicalEffect":
        mnemo = "arm5e.dialog.design-spell-question";
        break;
      case "spell":
        mnemo = "arm5e.dialog.design-enchantment-question";
        break;
      default:
        return;
    }

    const question = game.i18n.localize(mnemo);
    let confirmed = false;
    if (event.shiftKey) {
      confirmed = true;
    } else {
      confirmed = await getConfirmation(itemDataset.name, question, "codex");
    }
    if (!confirmed) return;

    await this._onDesignEffect(itemUuid, false);
  }

  async _onDesignEffect(uuid, alt) {
    const item = await fromUuid(uuid);
    if (!item) return [];

    const dataset = item.system;
    let newItemData;
    if (item.type === "baseEffect") {
      let name = `_New "${item.name}" effect`;
      let type = "magicalEffect";
      if (alt === true) {
        name = `_New "${item.name}" spell`;
        type = "spell";
      }
      newItemData = [
        {
          name,
          type,
          system: {
            baseEffectDescription: item.name,
            baseLevel: dataset.baseLevel,
            technique: { value: dataset.technique.value },
            form: { value: dataset.form.value }
          }
        }
      ];
    } else if (item.type === "magicalEffect") {
      const itemType = alt === true ? "enchantment" : "spell";
      newItemData = [
        {
          name: item.name,
          type: itemType,
          system: foundry.utils.deepClone(item.system)
        }
      ];
    } else {
      if (dataset.ritual) {
        ui.notifications.info("Impossible to make an enchantment with a ritual effect.");
        return [];
      }
      newItemData = [
        {
          name: item.name,
          type: "enchantment",
          system: foundry.utils.deepClone(dataset)
        }
      ];
      delete newItemData[0].system.ritual;
      delete newItemData[0].system.mastery;
      delete newItemData[0].system.exp;
      delete newItemData[0].system.bonus;
    }

    const [newItem] = await this.actor.createEmbeddedDocuments("Item", newItemData, {});
    newItem?.sheet?.render(true);
    return newItem;
  }

  /** @override */
  isItemDropAllowed(itemData) {
    switch (itemData?.type) {
      case "baseEffect":
      case "magicalEffect":
      case "spell":
      case "enchantment":
      case "laboratoryText":
        return true;
      default:
        return false;
    }
  }

  /** @override */
  async _onDropItem(event, item) {
    if (item?.type === "laboratoryText" && item.system?.type !== "raw") {
      const data = labTextToEffect(foundry.utils.deepClone(item.toObject()));
      const created = await Item.implementation.create(data, {
        parent: this.actor,
        keepId: false
      });
      created?.sheet?.render?.(true);
      return created ?? null;
    }

    if (item?.type === "book") {
      const dragData = foundry.applications.ux.TextEditor.getDragEventData(event);
      if (Number.isInteger(Number(dragData?.topicIdx))) {
        const topic = item.system?.topics?.[Number(dragData.topicIdx)];
        if (topic?.category === "labText" && topic?.labtext?.type !== "raw") {
          const syntheticLabText = {
            name: topic.labtextTitle,
            type: "laboratoryText",
            system: foundry.utils.deepClone(topic.labtext)
          };
          const data = labTextToEffect(syntheticLabText);
          const created = await Item.implementation.create(data, {
            parent: this.actor,
            keepId: false
          });
          created?.sheet?.render?.(true);
          return created ?? null;
        }
      }
    }

    const res = await super._onDropItem(event, item);
    if (Array.isArray(res) && res.length === 1) {
      res[0]?.sheet?.render?.(true);
    } else {
      res?.sheet?.render?.(true);
    }
    return res;
  }
}
