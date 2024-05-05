import { compareLabTexts, log, hermeticFilter, getUuidInfo, getDataset } from "../tools.js";
import { ArM5eActorSheet } from "./actor-sheet.js";
import { HERMETIC_FILTER, TIME_FILTER, TOPIC_FILTER } from "../constants/userdata.js";
import { effectToLabText, resetOwnerFields } from "../item/item-converter.js";
import { getConfirmation } from "../constants/ui.js";

/**
 * Extend the basic ArM5eActorSheet
 * @extends {ArM5eActorSheet}
 */
export class ArM5eCovenantActorSheet extends ArM5eActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
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

  get template() {
    if (this.actor.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER)) {
      return `systems/arm5e/templates/actor/actor-covenant-sheet.html`;
    }
    return `systems/arm5e/templates/actor/covenant-limited-sheet.html`;
  }

  getUserCache() {
    let usercache = JSON.parse(sessionStorage.getItem(`usercache-${game.user.id}`));
    if (usercache[this.actor.id] == undefined) {
      usercache[this.actor.id] = {
        filters: {
          hermetic: {
            laboratoryTexts: HERMETIC_FILTER
          },
          bookTopics: {
            abilitiesTopics: TOPIC_FILTER,
            artsTopics: TOPIC_FILTER,
            masteriesTopics: HERMETIC_FILTER
          },
          events: {
            diaryEvents: TIME_FILTER,
            calendarEvents: TIME_FILTER
          }
        }
      };

      sessionStorage.setItem(`usercache-${game.user.id}`, JSON.stringify(usercache));
    }
    return usercache[this.actor.id];
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
    context.ui = this.getUserCache();
    context.config = CONFIG.ARM5E;
    log(false, "Covenant-sheet getData");
    log(false, context);

    for (let person of context.system.habitants.magi) {
      if (person.system.linked) {
        this.actor.apps[person.system.document.sheet.appId] = person.system.document.sheet;
      }
    }
    for (let person of context.system.habitants.companion) {
      if (person.system.linked) {
        this.actor.apps[person.system.document.sheet.appId] = person.system.document.sheet;
      }
    }

    for (let person of context.system.habitants.turbula) {
      if (person.system.linked) {
        this.actor.apps[person.system.document.sheet.appId] = person.system.document.sheet;
      }
    }

    for (let person of context.system.habitants.habitants) {
      if (person.system.linked) {
        this.actor.apps[person.system.document.sheet.appId] = person.system.document.sheet;
      }
    }

    for (let lab of context.system.labs) {
      if (lab.system.linked) {
        this.actor.apps[lab.system.document.sheet.appId] = lab.system.document.sheet;
      }
    }

    context.scenes = game.scenes.contents.map((e) => {
      return { name: e.name, id: e._id };
    });
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
      case "reputation":
      case "inhabitant":
      // case "habitantMagi":
      // case "habitantCompanion":
      // case "habitantSpecialists":
      // case "habitantHabitants":
      // case "habitantHorses":
      // case "habitantLivestock":
      case "possessionsCovenant":
      case "visSourcesCovenant":
      case "visStockCovenant": // TODO convert and remove
      case "magicalEffect":
      case "calendarCovenant":
      case "incomingSource":
      case "laboratoryText":
      case "enchantment":
      case "armor":
      case "weapon":
      case "item":
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
    const info = getUuidInfo(data.uuid);
    const item = await fromUuid(data.uuid);
    const type = item.type;
    if (this.actor.uuid !== item.parent?.uuid) {
      if (info.ownerType === "Actor" && info.type === "Item" && item.system.hasQuantity) {
        if (!event.shiftKey) {
          if (this.isItemDropAllowed(item)) {
            return this._handleTransfer(item);
          }
        }
      }
    }
    // transform input into labText
    if (type == "spell" || type == "magicalEffect" || type == "enchantment") {
      log(false, "Valid drop");
      // create a labText data:
      return await super._onDropItemCreate(effectToLabText(foundry.utils.deepClone(item)));
    }
    // }
    const res = await super._onDropItem(event, data);
    return res;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".actor-link-delete").click(async (ev) => {
      ev.preventDefault();
      const li = $(ev.currentTarget).parents(".item");
      let itemId = li.data("itemId");
      let confirmed = true;
      if (game.settings.get("arm5e", "confirmDelete")) {
        const question = game.i18n.localize("arm5e.dialog.delete-question");
        confirmed = await getConfirmation(
          li[0].dataset.name,
          question,
          ArM5eActorSheet.getFlavor(this.actor.type)
        );
      }
      if (confirmed) {
        let actorLink = this.actor.items.get(itemId);

        if (actorLink.system.linked) {
          let update = await actorLink.system.document.sheet._unbindActor(this.actor);
          await actorLink.system.document.update(update);
        }

        itemId = itemId instanceof Array ? itemId : [itemId];

        this.actor.deleteEmbeddedDocuments("Item", itemId, {});
        li.slideUp(200, () => this.render(false));
      }
    });

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    html.find(".harvest").click(async (ev) => {
      ev.preventDefault();
      const li = $(ev.currentTarget).parents(".item");
      let itemId = li.data("itemId");
      const item = this.actor.items.get(itemId);
      await item.system.harvest();
    });
  }
  /**
   * Handle dropping of an actor reference or item data onto an Actor Sheet
   * @param {DragEvent} event     The concluding DragEvent which contains drop data
   * @param {Object} data         The data transfer extracted from the event
   * @return {Promise<Object>}    A data object which describes the result of the drop
   * @private
   * @override
   */

  async _onDropActor(event, data) {
    if (!this.actor.isOwner) {
      return false;
    }
    let droppedActor = await fromUuid(data.uuid);
    // link both ways
    let updateArray = [];
    // covenant can have a 1:N relationship with others, no need to remove existing links
    await this._bindActor(droppedActor);
    updateArray.push(await droppedActor.sheet._bindActor(this.actor));
    return await Actor.updateDocuments(updateArray);
  }

  async _bindActor(actor) {
    if (!["laboratory", "player", "npc", "beast"].includes(actor.type)) return false;
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
          type: "inhabitant",
          img: actor.img,
          system: {
            category: "magi",
            actorId: actor._id,
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
      let magi = targetActor.system.habitants.magi.filter((h) => h.name == actor.name);
      if (magi.length == 0) {
        log(false, "Added to inhabitants Magi");
        return await this.actor.createEmbeddedDocuments("Item", itemData, { render: true });
      } else {
        itemData[0]._id = magi[0]._id;
        return await this.actor.updateEmbeddedDocuments("Item", itemData, { render: true });
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
          type: "inhabitant",
          img: actor.img,
          system: {
            category: "companions",
            actorId: actor._id,
            job: actor.system.description.title.value,
            points: pts,
            yearBorn: actor.system.description.born.value
          }
        }
      ];

      // check if it is already bound
      let comp = targetActor.system.habitants.companion.filter((h) => h.name == actor.name);
      if (comp.length == 0) {
        log(false, "Added to inhabitants Companion");
        return await this.actor.createEmbeddedDocuments("Item", itemData, { render: true });
      } else {
        itemData[0]._id = comp[0]._id;
        return await this.actor.updateEmbeddedDocuments("Item", itemData, { render: true });
      }
    } else if (
      actor._isGrog() ||
      (actor.type == "npc" && actor.system.charType.value == "mundane")
    ) {
      let pts = 1;
      const itemData = [
        {
          name: actor.name,
          type: "inhabitant",
          img: actor.img,
          system: {
            category: "turbula",
            actorId: actor._id,
            job: actor.system.description.title.value,
            points: pts,
            yearBorn: actor.system.description.born.value
          }
        }
      ];

      // check if it is already bound
      let hab = targetActor.system.habitants.habitants.filter((h) => h.name == actor.name);
      if (hab.length == 0) {
        log(false, "Added to inhabitants");
        return await this.actor.createEmbeddedDocuments("Item", itemData, { render: true });
      } else {
        itemData[0]._id = hab[0]._id;
        return await this.actor.updateEmbeddedDocuments("Item", itemData, { render: true });
      }
    } else if (actor.type == "laboratory") {
      const itemData = [
        {
          name: actor.name,
          type: "labCovenant",
          img: actor.img,
          system: {
            owner: actor.system.owner.value,
            sanctumId: actor._id,
            quality: actor.system.generalQuality.total,
            upkeep: actor.system.upkeep.total
          }
        }
      ];
      // check if it is already bound
      let lab = targetActor.system.labs.filter((h) => h.name == actor.name);
      if (lab.length == 0) {
        log(false, "Added to sanctums");
        return await this.actor.createEmbeddedDocuments("Item", itemData, { render: true });
      } else {
        itemData[0]._id = lab[0]._id;
        return await this.actor.updateEmbeddedDocuments("Item", itemData, { render: true });
      }
    }
    return {};
  }

  async _unbindActor(actor) {
    if (!["laboratory", "player", "npc", "beast"].includes(actor.type)) return true;
    let targetActor = this.actor;
    if (actor._isMagus()) {
      let hab = targetActor.system.habitants.magi.filter((h) => h.system.actorId == actor._id);
      if (hab.length) {
        return await this.actor.deleteEmbeddedDocuments("Item", [hab[0]._id], { render: true });
      }
    } else if (actor._isCompanion()) {
      let hab = targetActor.system.habitants.companion.filter((h) => h.system.actorId == actor._id);
      if (hab.length) {
        return await this.actor.deleteEmbeddedDocuments("Item", [hab[0]._id], { render: true });
      }
    } else if (
      actor._isGrog() ||
      (actor.type == "npc" && actor.system.charType.value == "mundane")
    ) {
      let hab = targetActor.system.habitants.habitants.filter((h) => h.system.actorId == actor._id);
      if (hab.length) {
        return await this.actor.deleteEmbeddedDocuments("Item", [hab[0]._id], { render: true });
      }
    } else if (actor.type == "laboratory") {
      // check if it is already bound
      let lab = targetActor.system.labs.filter((l) => l.system.sanctumId == actor._id);
      if (lab.length) {
        return await this.actor.deleteEmbeddedDocuments("Item", [lab[0]._id], { render: true });
      }
    }
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
    let nonConvertibleItems = folder.contents.filter((e) => this.needConversion(e.type) === false);
    let res = await this._onDropItemCreate(nonConvertibleItems.map((e) => e.toObject()));
    let convertibleItems = folder.contents.filter((e) => this.needConversion(e.type) === true);
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
