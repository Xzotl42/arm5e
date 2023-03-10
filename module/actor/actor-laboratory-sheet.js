import { log } from "../tools.js";
import { ArM5eActorSheet } from "./actor-sheet.js";
/**
 * Extend the basic ArM5eActorSheet with some very simple modifications
 * @extends {ArM5eActorSheet}
 */
export class ArM5eLaboratoryActorSheet extends ArM5eActorSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["arm5e", "sheet", "actor"],
      template: "systems/arm5e/templates/actor/actor-laboratory-sheet.html",
      width: 790,
      height: 800,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "virtues"
        },
        {
          navSelector: ".inventory-tabs",
          contentSelector: ".inventory-body",
          initial: "inventory"
        }
      ]
    });
  }

  /* -------------------------------------------- */

  /** @override */
  async getData() {
    const context = await super.getData();

    context.config = CONFIG.ARM5E;

    context.system.world = {};
    context.system.world.covenants = game.actors
      .filter(a => a.type == "covenant")
      .map(({ name, id }) => ({
        name,
        id
      }));
    if (context.system.covenant) {
      let cov = context.system.world.covenants.filter(c => c.name == context.system.covenant.value);
      if (cov.length > 0) {
        context.system.covenant.linked = true;
        context.system.covenant.actorId = cov[0].id;
      } else {
        context.system.covenant.linked = false;
      }
    }

    context.system.world.magi = game.actors
      .filter(a => a._isMagus() === true)
      .map(({ name, id }) => ({
        name,
        id
      }));
    if (context.system.world.magi.length > 0) {
      let per = context.system.world.magi.filter(p => p.name == context.system.owner.value);
      if (per.length > 0) {
        context.system.owner.linked = true;
        context.system.owner.actorId = per[0].id;
      } else {
        context.system.owner.linked = false;
      }
    }

    // Prepare items.
    this._prepareCharacterItems(context);

    log(false, "lab-sheet getData");
    log(false, context);

    return context;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterItems(sheetData) {
    super._prepareCharacterItems(sheetData);
  }

  isItemDropAllowed(itemData) {
    switch (itemData.type) {
      case "virtue":
      case "flaw":
        switch (itemData.system.type) {
          case "laboratoryOutfitting":
          case "laboratoryStructure":
          case "laboratorySupernatural":
          case "other":
            return true;
          default:
            return false;
        }
      case "spell":
      case "vis":
      case "item":
      case "book":
      // case "speciality":
      // case "distinctive":
      // case "sanctumRoom":
      case "magicItem":
      // case "personality":
      case "magicalEffect":
      case "laboratoryText":
        return true;
      default:
        return false;
    }
  }

  isActorDropAllowed(type) {
    switch (type) {
      case "player":
      case "npc":
      case "covenant":
        return true;
      default:
        return false;
    }
  }

  async _bindActor(actor) {
    let updateData = {};
    if (actor.type == "covenant") {
      updateData["system.covenant.value"] = actor.name;
    } else if (actor.type == "player" || actor.type == "npc") {
      updateData["system.owner.value"] = actor.name;
    }
    return await this.actor.update(updateData, {});
  }
}
