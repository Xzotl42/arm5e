import { ArM5eActorSheet } from "./actor-sheet.js";

import { hermeticFilter, log } from "../tools.js";

import { labTextToEffect } from "../item/item-converter.js";
import { ArM5eItem } from "../item/item.js";
import { HERMETIC_FILTER } from "../constants/userdata.js";
import { getConfirmation } from "../constants/ui.js";
import { GetEffectAttributesLabel, GetFilteredAspects } from "../helpers/magic.js";
/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class ArM5eMagicCodexSheet extends ArM5eActorSheet {
  /** @override */
  static get defaultOptions() {
    const options = super.defaultOptions;
    return foundry.utils.mergeObject(options, {
      classes: [...options.classes, "arm5e", "sheet", "actor"],
      template: "systems/arm5e/templates/actor/actor-magic-codex-sheet.html",
      width: 790,
      height: 800,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "base-effects"
        }
      ]
    });
  }

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
  /* -------------------------------------------- */

  /** @override */
  async getData() {
    const context = await super.getData();
    context.ui = this.getUserCache();
    // no need to import everything

    context.metagame = {
      view: game.settings.get("arm5e", "metagame"),
      edit: context.isGM ? "" : "readonly"
    };
    context.config = CONFIG.ARM5E;
    this._prepareCodexItems(context);

    let filters = context.ui.filters.hermetic.filter;
    context.system.filteredBaseEffects = hermeticFilter(filters, context.system.baseEffects);
    context.system.baseEffectCount = context.system.filteredBaseEffects.length;
    context.system.filteredMagicEffects = hermeticFilter(filters, context.system.magicEffects);
    context.system.magicEffectsCount = context.system.filteredMagicEffects.length;
    context.system.filteredEnchantments = hermeticFilter(filters, context.system.enchantments);
    context.system.enchantmentsCount = context.system.filteredEnchantments.length;
    context.system.filteredSpells = hermeticFilter(filters, context.system.spells);
    context.system.spellsCount = context.system.filteredSpells.length;

    const filterBySettingAspects = await GetFilteredAspects();
    const searchStr = context.ui.filters.aspects.searchString;
    if (searchStr && searchStr.length < 3) {
      context.system.filteredAspects = Object.values(filterBySettingAspects).map((e) => {
        return { ...e, source: game.i18n.localize(CONFIG.ARM5E.generic.sourcesTypes[e.src].label) };
      });
    } else {
      context.system.filteredAspects = {};
      context.system.aspectsCount = 0;
      if (CONFIG.ARM5E.lang[game.i18n.lang] && CONFIG.ARM5E.lang[game.i18n.lang].aspects) {
        let tmp = {};
        let subset = filterBySettingAspects;
        for (let keyword of searchStr.split(" ")) {
          for (let [a, params] of Object.entries(subset)) {
            if (params.index.includes(keyword)) {
              // context.system.filteredAspects[a] = params;
              tmp[a] = params;
              continue;
            } else {
              for (let e of Object.values(params.effects)) {
                if (e.index.includes(keyword)) {
                  tmp[a] = params;
                  // context.system.filteredAspects[a] = params;
                  context.system.aspectsCount++;
                  break;
                }
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
        for (let keyword of searchStr.split(" ")) {
          for (let [a, params] of Object.entries(subset)) {
            if (a.includes(keyword)) {
              tmp[a] = params;
              // context.system.filteredAspects[a] = params;
              continue;
            } else {
              for (let e of Object.keys(params.effects)) {
                if (e.includes(keyword)) {
                  tmp[a] = params;
                  // context.system.filteredAspects[a] = params;
                  break;
                }
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

  /**
   * Organize and classify Items for Codex sheets.
   *
   * @param {Object} sheetData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCodexItems(codexData) {
    //let actorData = sheetData.actor.data;
    // log(false, "_prepareCodexItems");
    for (const item of codexData.system.enchantments) {
      item.system.localizedDesc = GetEffectAttributesLabel(item);
    }
    for (const item of codexData.system.spells) {
      item.system.localizedDesc = GetEffectAttributesLabel(item);
    }

    for (const item of codexData.system.magicEffects) {
      item.system.localizedDesc = GetEffectAttributesLabel(item);
    }
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    html.find(".search-aspects").change(async (event) => {
      let usercache = JSON.parse(sessionStorage.getItem(`usercache-${game.user.id}`));
      usercache[this.actor.id].filters.aspects.searchString = event.target.value
        .toLowerCase()
        .trim();
      sessionStorage.setItem(`usercache-${game.user.id}`, JSON.stringify(usercache));
      this.render(true);
    });
    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Add Inventory Item
    // html.find('.item-create').click(this._onItemCreate.bind(this));

    // // Update Inventory Item
    // html.find('.item-edit').click(ev => {
    //     const li = $(ev.currentTarget).parents(".item");
    //     const itid = li.data("itemId");
    //     const item = this.actor.items.get(itid)
    //     item.sheet.render(true);
    // });

    // html.find('.GMonly').click(this._restrict.bind(this));

    // Add Inventory Item
    html.find(".base-effect-create").click(this._onBaseEffectCreate.bind(this));

    // Delete Inventory Item
    html.find(".effect-delete").click(this._onDeleteEffect.bind(this));

    // Design spell.
    html.find(".design").click(this._onClickEffect.bind(this));

    // Design spell.
    html.find(".alt-design").click(this._onClickAlternateDesign.bind(this));

    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = (ev) => this._onDragStart(ev);
      html.find("li.item").each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }
  }

  /**
   * Handle clickable base effect.
   * @param {Event} event   The originating click event
   * @private
   */
  async _onDeleteEffect(event) {
    event.preventDefault();
    const question = game.i18n.localize("arm5e.dialog.delete-question");
    const li = $(event.currentTarget).parents(".item");
    let itemId = li.data("itemId");
    const confirm = await getConfirmation(li[0].dataset.name, question, "Codex");
    if (confirm) {
      this._deleteEffect(itemId, li);
    }
  }

  _deleteEffect(itemId, li) {
    itemId = itemId instanceof Array ? itemId : [itemId];
    this.actor.deleteEmbeddedDocuments("Item", itemId, {});
    li.slideUp(200, () => this.render(false));
  }

  async _onBaseEffectCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const tech = header.dataset.technique == "" ? "cr" : header.dataset.technique;
    const form = header.dataset.form == "" ? "an" : header.dataset.form;
    // Initialize a default name.
    const name = `New Base Effect`;
    // Prepare the item object.
    const itemData = [
      {
        name: name,
        type: "baseEffect",
        system: {
          technique: {
            value: tech
          },
          form: {
            value: form
          }
        }
      }
    ];
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData[0].system["type"];

    // Finally, create the item!
    // console.log("Add item");
    // console.log(itemData);

    let newItem = await this.actor.createEmbeddedDocuments("Item", itemData, {});

    newItem[0].sheet.render(true);
    return newItem;
  }

  /**
   * Handle clickable base effect.
   * @param {Event} event   The originating click event
   * @private
   */
  _onClickAlternateDesign(event) {
    event.preventDefault();
    const li = $(event.currentTarget).parents(".item");
    let itemId = li.data("itemId");
    let type = li.data("itemType");
    this._onDesignEffect(itemId, true);
  }

  /**
   * Handle clickable base effect.
   * @param {Event} event   The originating click event
   * @private
   */
  async _onClickEffect(event) {
    event.preventDefault();
    const li = $(event.currentTarget).parents(".item");
    const itemDataset = li[0].dataset;
    let itemId = itemDataset.itemId;
    let type = itemDataset.itemType;
    let mnemo;
    switch (type) {
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
    const element = event.currentTarget;
    const dataset = element.dataset;
    const question = game.i18n.localize(mnemo);
    const confirm = await getConfirmation(dataset.name, question, "Codex");
    if (confirm) {
      this._onDesignEffect(itemId, false);
    }
  }

  async _onDesignEffect(id, alt) {
    const item = this.actor.items.get(id);
    // const itemdata = item.data;
    const dataset = item.system;
    let newItemData;
    if (item.type == "baseEffect") {
      // Initialize a default name.
      let name = `_New "${item.name}" effect`;
      let type = "magicalEffect";
      if (alt === true) {
        // alternate design
        let name = `_New "${item.name}" spell`;
        type = "spell";
      }
      newItemData = [
        {
          name: name,
          type: type,
          system: {
            baseEffectDescription: item.name,
            baseLevel: dataset.baseLevel,
            technique: {
              value: dataset.technique.value
            },
            form: {
              value: dataset.form.value
            }
          }
        }
      ];
    } else if (item.type == "magicalEffect") {
      //
      let itemType = "spell";
      if (alt === true) {
        // alternate design
        itemType = "enchantment";
      }
      newItemData = [
        {
          name: item.name,
          type: itemType,
          system: foundry.utils.deepClone(item.system)
        }
      ];
      // Remove the type from the dataset since it's in the itemData.type prop.
      // delete newItemData[0]["type"];
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
      // Remove the type from the dataset since it's in the itemData.type prop.

      // delete newItemData[0]["type"];
      // remove spell attributes linked to actor
      delete newItemData[0].system.ritual;
      delete newItemData[0].system.mastery;
      delete newItemData[0].system.exp;
      delete newItemData[0].system.bonus;
    }
    let newItem = await this.actor.createEmbeddedDocuments("Item", newItemData, {});

    newItem[0].sheet.render(true);

    return newItem;
  }

  isItemDropAllowed(item) {
    switch (item.type) {
      case "baseEffect":
      case "magicalEffect":
      case "enchantment":
      case "spell":
      case "laboratoryText":
        return item.system.type !== "raw";
      case "book":
        if (item.topicIdx) {
          let topic = item.system.topics[item.topicIdx];
          if (topic.category == "labText") {
            return topic.labtext.type != "raw";
          }
        }
      default:
        return false;
    }
  }

  /**
   * Handle dropping of an item reference or item data onto an Actor Sheet
   * @param {DragEvent} event     The concluding DragEvent which contains drop data
   * @param {Object} data         The data transfer extracted from the event
   * @return {Promise<Object>}    A data object which describes the result of the drop
   * @private
   * @override
   */

  async _onDropItem(event, data) {
    const item = await fromUuid(data.uuid);
    const type = item.type;
    // transform input into labText
    if (type == "laboratoryText") {
      log(false, "Valid drop");
      // create a spell or enchantment data:
      if (item.system.type != "raw") {
        return await super._onDropItemCreate(labTextToEffect(item.toObject()));
      }
    } else if (type == "book") {
      if (data.topicIdx) {
        const topic = item.system.topics[data.topicIdx];
        if (topic.category == "labText") {
          return await super._onDropItemCreate(
            labTextToEffect({
              name: topic.labtextTitle,
              type: "laboratoryText",
              system: foundry.utils.deepClone(topic.labtext)
            })
          );
        }
      }
    }
    const res = await super._onDropItem(event, data);
    if (res.length == 1) {
      res[0].sheet.render(true);
    }
    return res;
  }
}
