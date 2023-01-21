import { compareLabTexts, log, hermeticFilter } from "../tools.js";
import { ArM5eActorSheet } from "./actor-sheet.js";
import { HERMETIC_FILTER } from "../constants/userdata.js";
import { effectToLabText, resetOwnerFields } from "../item/item-converter.js";

/**
 * Extend the basic ArM5eActorSheet
 * @extends {ArM5eActorSheet}
 */
export class ArM5eCovenantActorSheet extends ArM5eActorSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["arm5e", "sheet", "actor"],
      template: "systems/arm5e/templates/actor/actor-covenant-sheet.html",
      width: 790,
      height: 800,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "attributes"
        }
      ]
    });
  }

  /* -------------------------------------------- */
  /**
   *     @override
   */

  async getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = await super.getData();

    let usercache = JSON.parse(sessionStorage.getItem(`usercache-${game.user.id}`));
    if (usercache[this.actor.id]) {
      context.userData = usercache[this.actor.id];
    } else {
      usercache[this.actor.id] = {
        filters: {
          hermetic: {
            laboratoryTexts: HERMETIC_FILTER
          },
          books: {
            hermetic: { art: "", score: 0, quality: 0 },
            mundane: { art: "", score: 0, quality: 0 }
          }
        }
      };
      context.userData = usercache[this.actor.id];
      sessionStorage.setItem(`usercache-${game.user.id}`, JSON.stringify(usercache));
    }
    context.config = CONFIG.ARM5E;
    log(false, "Covenant-sheet getData");
    log(false, context);
    context.system.world = {};
    context.system.world.people = game.actors
      .filter(a => a.type == "player" || a.type == "npc")
      .map(({ name, id }) => ({
        name,
        id
      }));

    if (context.system.world.people.length > 1) {
      for (let person of context.system.habitants.magi) {
        let per = context.system.world.people.filter(p => p.name == person.name);
        if (per.length > 0) {
          person.system.linked = true;
          person.system.actorId = per[0].id;
        } else {
          person.system.linked = false;
        }
      }
      for (let person of context.system.habitants.companion) {
        let per = context.system.world.people.filter(p => p.name == person.name);
        if (per.length > 0) {
          person.system.linked = true;
          person.system.actorId = per[0].id;
        } else {
          person.system.linked = false;
        }
      }
      for (let person of context.system.habitants.habitants) {
        let per = context.system.world.people.filter(p => p.name == person.name);
        if (per.length > 0) {
          person.system.linked = true;
          person.system.actorId = per[0].id;
        } else {
          person.system.linked = false;
        }
      }
    }
    context.system.world.labs = game.actors
      .filter(a => a.type == "laboratory")
      .map(({ name, id }) => ({
        name,
        id
      }));

    if (context.system.labs) {
      for (let sanctum of context.system.labs) {
        let lab = context.system.world.labs.filter(p => p.name == sanctum.name);
        if (lab.length > 0) {
          sanctum.system.linked = true;
          sanctum.system.actorId = lab[0].id;
        } else {
          sanctum.system.linked = false;
        }
      }
    }

    return context;
  }

  isItemDropAllowed(itemData) {
    switch (itemData.type) {
      case "virtue":
      case "flaw":
        switch (itemData.system.type) {
          case "covenantSite":
          case "covenantResources":
          case "covenantResidents":
          case "covenantExternalRelations":
          case "covenantSurroundings":
          case "generic": // base covenant hooks/boons
          case "other":
            return true;
          default:
            return false;
        }
      case "spell":
      case "vis":
      case "book":
      case "magicItem":
      case "reputation":
      case "habitantMagi":
      case "habitantCompanion":
      case "habitantSpecialists":
      case "habitantHabitants":
      case "habitantHorses":
      case "habitantLivestock":
      case "possessionsCovenant":
      case "visSourcesCovenant":
      case "visStockCovenant":
      case "magicalEffect":
      case "calendarCovenant":
      case "incomingSource":
      case "laboratoryText":
      case "enchantment":
        return true;
      default:
        return false;
    }
  }

  isActorDropAllowed(type) {
    switch (type) {
      case "player":
      case "npc":
      case "laboratory":
        return true;
      default:
        return false;
    }
  }

  // tells whether or not a type of item needs to be converted when dropped to a specific sheet.
  needConversion(type) {
    switch (type) {
      case "spell":
      case "magicalEffect":
      case "enchantment":
        return true;
      default:
        return false;
    }
  }

  // Overloaded core functions (TODO: review at each Foundry update)

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
    if (type == "spell" || type == "magicalEffect" || type == "enchantment") {
      log(false, "Valid drop");
      // create a labText data:
      return await super._onDropItemCreate(effectToLabText(foundry.utils.deepClone(itemData)));
    }
    // }
    const res = await super._onDropItem(event, data);
    return res;
  }

  /**
   * Handle dropping of an actor reference or item data onto an Actor Sheet
   * @param {DragEvent} event     The concluding DragEvent which contains drop data
   * @param {Object} data         The data transfer extracted from the event
   * @return {Promise<Object>}    A data object which describes the result of the drop
   * @private
   * @override
   */
  async _bindActor(actor) {
    // add person to covenant inhabitants
    let targetActor = this.actor;
    if (actor._isMagus()) {
      let pts = 5;
      if (targetActor.system.season == "summer" || targetActor.system.season == "autumn") {
        pts = 10;
      }
      // TODO: fill other fields?
      const itemData = [
        {
          name: actor.name,
          type: "habitantMagi",
          system: {
            job:
              actor.system.description.title.value +
              " " +
              game.i18n.localize("arm5e.sheet.house") +
              " " +
              CONFIG.ARM5E.character.houses[actor.system.house.value].label,
            points: pts,
            yearBorn: actor.system.description.born.value
          }
        }
      ];
      // check if it is already bound
      let magi = targetActor.system.habitants.magi.filter(h => h.name == actor.name);
      if (magi.length == 0) {
        log(false, "Added to inhabitants Magi");
        return await this.actor.createEmbeddedDocuments("Item", itemData, {});
      } else {
        itemData[0]._id = magi[0]._id;
        return await this.actor.updateEmbeddedDocuments("Item", itemData, {});
      }
    } else if (actor._isCompanion()) {
      let pts = 3;
      if (targetActor.system.season == "summer" || targetActor.system.season == "autumn") {
        pts = 5;
      }
      // TODO: fill other fields?
      const itemData = [
        {
          name: actor.name,
          type: "habitantCompanion",
          system: {
            job: actor.system.description.title.value,
            points: pts,
            yearBorn: actor.system.description.born.value
          }
        }
      ];

      // check if it is already bound
      let comp = targetActor.system.habitants.companion.filter(h => h.name == actor.name);
      if (comp.length == 0) {
        log(false, "Added to inhabitants Companion");
        return await this.actor.createEmbeddedDocuments("Item", itemData, {});
      } else {
        itemData[0]._id = comp[0]._id;
        return await this.actor.updateEmbeddedDocuments("Item", itemData, {});
      }
    } else if (
      actor._isGrog() ||
      (actor.type == "npc" && actor.system.charType.value == "mundane")
    ) {
      let pts = 1;
      // if (targetActor.system.season == "summer" || targetActor.system.season == "autumn") {
      //     pts = 5;
      // }
      // TODO: fill other fields?
      const itemData = [
        {
          name: actor.name,
          type: "habitantHabitants",
          system: {
            job: actor.system.description.title.value,
            points: pts,
            yearBorn: actor.system.description.born.value
          }
        }
      ];

      // check if it is already bound
      let hab = targetActor.system.habitants.habitants.filter(h => h.name == actor.name);
      if (hab.length == 0) {
        log(false, "Added to inhabitants");
        return await this.actor.createEmbeddedDocuments("Item", itemData, {});
      } else {
        itemData[0]._id = hab[0]._id;
        return await this.actor.updateEmbeddedDocuments("Item", itemData, {});
      }
    } else if (actor.type == "laboratory") {
      const itemData = [
        {
          name: actor.name,
          type: "labCovenant",
          system: {
            owner: actor.system.owner.value,
            quality: actor.system.generalQuality.total,
            upkeep: actor.system.upkeep.total
          }
        }
      ];
      // check if it is already bound
      let lab = targetActor.system.labs.filter(h => h.name == actor.name);
      if (lab.length == 0) {
        log(false, "Added to sanctums");
        return await this.actor.createEmbeddedDocuments("Item", itemData, {});
      } else {
        itemData[0]._id = lab[0]._id;
        return await this.actor.updateEmbeddedDocuments("Item", itemData, {});
      }
    }
    return {};
  }

  /**
   * TODO: Review in case of Foundry update
   * Handle dropping of a Folder on an Actor Sheet.
   * Currently supports dropping a Folder of Items to create all items as owned items.
   * @param {DragEvent} event     The concluding DragEvent which contains drop data
   * @param {Object} data         The data transfer extracted from the event
   * @return {Promise<Item[]>}
   * @private
   */

  async _onDropFolder(event, data) {
    // log(false, "_onDropFolder");

    if (!this.actor.isOwner) return [];
    if (data.documentName !== "Item") return [];
    const folder = game.folders.get(data.id);
    if (!folder) return [];
    let nonConvertibleItems = folder.contents.filter(e => this.needConversion(e.type) === false);
    let res = await this._onDropItemCreate(nonConvertibleItems.map(e => e.toObject()));
    let convertibleItems = folder.contents.filter(e => this.needConversion(e.type) === true);
    for (let item of convertibleItems) {
      // let actorID = this.actor.id;
      let itemData = {
        // actorId: actorID,
        system: item.system,
        type: "Item"
      };
      res.push(await this._onDropItem(event, itemData));
    }
    return res;
  }
}
