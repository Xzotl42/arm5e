import { compareLabTexts, log, hermeticFilter, getUuidInfo, getDataset } from "../tools.js";
import { ArM5eActorSheet } from "./actor-sheet.js";
import { HERMETIC_FILTER, TIME_FILTER, TOPIC_FILTER } from "../constants/userdata.js";
import { effectToLabText, resetOwnerFields } from "../item/item-converter.js";
import { getConfirmation } from "../constants/ui.js";
import { ArM5eActor } from "./actor.js";

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
        },
        lists: {
          visibility: { inhabitants: {} }
        }
      };

      sessionStorage.setItem(`usercache-${game.user.id}`, JSON.stringify(usercache));
    } else if (usercache[this.actor.id].lists?.visibility == undefined) {
      usercache[this.actor.id].lists = { visibility: { inhabitants: {} } };
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
    context.config = CONFIG.ARM5E;
    context.system.loyalty.points.base = 0;

    context.system.loyalty.modifiers.livingConditions =
      context.system.modifiersLife.mundane * CONFIG.ARM5E.covenant.loyalty.livingConditions.factor;
    context.system.loyalty.modifiers.specialists = 0;

    for (let person of context.system.inhabitants.magi) {
      if (person.system.linked) {
        // this.actor.apps[person.system.document.sheet.appId] = person.system.document.sheet;
        person.system.yearBorn = person.system.document.system.description.born.value;
      }

      context.system.loyalty.points.base += person.system.baseLoyalty;
    }
    context.system.loyalty.points.base /= context.system.inhabitants.magi.length
      ? context.system.inhabitants.magi.length
      : 1;

    context.system.loyalty.points.base = Math.round(context.system.loyalty.points.base);

    for (let person of context.system.inhabitants.companion) {
      if (person.system.linked) {
        // this.actor.apps[person.system.document.sheet.appId] = person.system.document.sheet;
        person.system.yearBorn = person.system.document.system.description.born.value;
      }
    }

    for (let person of context.system.inhabitants.turbula) {
      if (person.system.linked) {
        // this.actor.apps[person.system.document.sheet.appId] = person.system.document.sheet;
        person.system.yearBorn = person.system.document.system.description.born.value;
      }
    }

    for (let person of context.system.inhabitants.specialists) {
      if (person.system.linked) {
        // this.actor.apps[person.system.document.sheet.appId] = person.system.document.sheet;
        person.system.yearBorn = person.system.document.system.description.born.value;
      }
      context.system.loyalty.modifiers.specialists += person.system.loyaltyGain;
    }

    for (let person of context.system.inhabitants.habitants) {
      if (person.system.linked) {
        // this.actor.apps[person.system.document.sheet.appId] = person.system.document.sheet;
        person.system.yearBorn = person.system.document.system.description.born.value;
      }
      person.system.categoryLabel = CONFIG.ARM5E.covenant.inhabitants[person.system.category].label;
    }

    // for (let lab of context.system.labs) {
    //   if (lab.system.linked) {
    //     this.actor.apps[lab.system.document.sheet.appId] = lab.system.document.sheet;
    //   }
    // }

    context.system.loyalty.points.modifiersTotal =
      context.system.loyalty.modifiers.livingConditions +
      context.system.loyalty.modifiers.specialists +
      (context.system.loyalty.modifiers.familiarity ?? 0) +
      (context.system.loyalty.modifiers.events ?? 0) +
      CONFIG.ARM5E.covenant.loyalty.wages[context.system.loyalty.modifiers.wages ?? "normal"].mod +
      (CONFIG.ARM5E.covenant.loyalty.equipment[
        context.system.loyalty.modifiers.equipment ?? "standard"
      ]?.mod ?? 0);

    context.system.loyalty.points.actuals =
      context.system.loyalty.points.base + context.system.loyalty.points.modifiersTotal;

    context.system.loyalty.points.prevailing = ArM5eActor.getAbilityScoreFromXp(
      Math.abs(context.system.loyalty.points.actuals)
    );
    if (context.system.loyalty.points.actuals < 0) {
      context.system.loyalty.points.prevailing = -context.system.loyalty.points.prevailing;
    }

    context.scenes = game.scenes.contents.map((e) => {
      return { name: e.name, id: e._id };
    });

    for (const exp of Object.keys(context.system.yearlyExpenses)) {
      context.system.yearlyExpenses[exp].label = context.config.covenant.yearlyExpenses[exp].label;
      context.system.yearlyExpenses[exp].sumary =
        context.config.covenant.yearlyExpenses[exp].sumary;
      if (["tithes", "sundry", "inflation"].includes(exp)) {
        context.system.yearlyExpenses[exp].classes = "editable";
      } else {
        context.system.yearlyExpenses[exp].canEdit = "readonly";
      }
    }

    for (const save of Object.keys(context.system.yearlySavings)) {
      context.system.yearlySavings[save].label = context.config.covenant.yearlySavings[save].label;
      context.system.yearlySavings[save].sumary =
        context.config.covenant.yearlySavings[save].sumary;
      // if (["tithes", "other", "inflation"].includes(save)) {
      //   context.system.yearlySavings[save].classes = "editable";
      // } else {
      //   context.system.yearlySavings[save].canEdit = "readonly";
      // }
    }
    log(false, "Covenant-sheet getData");
    log(false, context);
    return context;
  }

  async _render(force, options = {}) {
    // Parent class rendering workflow
    await super._render(force, options);

    // Register the active Application with the referenced Documents

    for (let person of this.actor.system.inhabitants.magi) {
      if (person.system.linked) {
        person.system.document.apps[this.appId] = this;
      }
    }

    for (let person of this.actor.system.inhabitants.companion) {
      if (person.system.linked) {
        person.system.document.apps[this.appId] = this;
      }
    }

    for (let person of this.actor.system.inhabitants.turbula) {
      if (person.system.linked) {
        person.system.document.apps[this.appId] = this;
      }
    }

    for (let person of this.actor.system.inhabitants.specialists) {
      if (person.system.linked) {
        person.system.document.apps[this.appId] = this;
      }
    }

    for (let person of this.actor.system.inhabitants.habitants) {
      if (person.system.linked) {
        person.system.document.apps[this.appId] = this;
      }
    }

    for (let lab of this.actor.system.labs) {
      if (lab.system.linked) {
        lab.system.document.apps[this.appId] = this;
      }
    }
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

  convert(data) {
    return effectToLabText(data);
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
    // transform input into labText
    if (this.needConversion(item.type)) {
      log(false, "Valid drop");
      // create a labText data:
      return await super._onDropItemCreate(effectToLabText(item.toObject()));
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

    html.find(".inhabitants").click(async (ev) => {
      const category = $(ev.currentTarget).data("category");
      let usercache = JSON.parse(sessionStorage.getItem(`usercache-${game.user.id}`));
      let scope = usercache[this.actor._id].lists.visibility.inhabitants;
      const classes = document.getElementById(category).classList;
      if (scope) {
        if (classes.contains("hide")) {
          scope[category] = "";
        } else {
          scope[category] = "hide";
        }
        sessionStorage.setItem(`usercache-${game.user.id}`, JSON.stringify(usercache));
      }
      classes.toggle("hide");
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
    if (!["laboratory", "player", "npc", "beast"].includes(actor.type)) return [];
    // add person to covenant inhabitants
    let targetActor = this.actor;
    if (actor.isMagus()) {
      let pts = 5;
      if (targetActor.system.season == "summer" || targetActor.system.season == "autumn") {
        pts = 10;
      }
      // check if it has gentle or blatant gift
      let giftType = "normal";
      if (actor.hasVirtue("gentle-gift")) {
        giftType = "gentle";
      } else if (actor.hasFlaw("blatant-gift")) {
        giftType = "blatant";
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
            giftType: giftType,
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
      let magi = targetActor.system.inhabitants.magi.filter((h) => h.name == actor.name);
      if (magi.length == 0) {
        log(false, "Added to inhabitants Magi");
        return await this.actor.createEmbeddedDocuments("Item", itemData, { render: true });
      } else {
        itemData[0]._id = magi[0]._id;
        return await this.actor.updateEmbeddedDocuments("Item", itemData, { render: true });
      }
    } else if (actor.isCompanion()) {
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
      let comp = targetActor.system.inhabitants.companion.filter((h) => h.name == actor.name);
      if (comp.length == 0) {
        log(false, "Added to inhabitants Companion");
        return await this.actor.createEmbeddedDocuments("Item", itemData, { render: true });
      } else {
        itemData[0]._id = comp[0]._id;
        return await this.actor.updateEmbeddedDocuments("Item", itemData, { render: true });
      }
    } else if (
      actor.isGrog() ||
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
      let hab = targetActor.system.inhabitants.habitants.filter((h) => h.name == actor.name);
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
    return [];
  }

  async _unbindActor(actor) {
    if (!["laboratory", "player", "npc", "beast"].includes(actor.type)) return [];
    let targetActor = this.actor;
    if (actor.isMagus()) {
      let hab = targetActor.system.inhabitants.magi.filter((h) => h.system.actorId == actor._id);
      if (hab.length) {
        return await this.actor.deleteEmbeddedDocuments("Item", [hab[0]._id], { render: true });
      }
    } else if (actor.isCompanion()) {
      let hab = targetActor.system.inhabitants.companion.filter(
        (h) => h.system.actorId == actor._id
      );
      if (hab.length) {
        return await this.actor.deleteEmbeddedDocuments("Item", [hab[0]._id], { render: true });
      }
    } else if (
      actor.isGrog() ||
      (actor.type == "npc" && actor.system.charType.value == "mundane")
    ) {
      let hab = targetActor.system.inhabitants.habitants.filter(
        (h) => h.system.actorId == actor._id
      );
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
