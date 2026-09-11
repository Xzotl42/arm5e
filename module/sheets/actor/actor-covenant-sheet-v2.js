import { ArM5eActorSheetV2 } from "./actor-sheet-v2.js";
import { HERMETIC_FILTER, TIME_FILTER, TOPIC_FILTER } from "../../constants/userdata.js";
import { ArM5eActor } from "../../actor/actor.js";
import Aura from "../../helpers/aura.js";
import { effectToLabText } from "../../item/item-converter.js";

import { ARM5E } from "../../config.js";
import { getConfirmation } from "../../ui/dialogs.js";
/**
 * AppV2 Covenant actor sheet.
 */
export class ArM5eCovenantActorSheetV2 extends ArM5eActorSheetV2 {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["arm5e", "sheet", "actor", "actor-covenant"],
    position: { width: 790, height: 800 },
    actions: {
      openLinkedActor: ArM5eCovenantActorSheetV2.openLinkedActor,
      removeLinkedItem: ArM5eCovenantActorSheetV2.removeLinkedItem,
      harvestItem: ArM5eCovenantActorSheetV2.harvestItem,
      toggleInhabitants: ArM5eCovenantActorSheetV2.toggleInhabitants
    }
  };

  /** @override */
  static TABS = {
    primary: {
      tabs: [
        { id: "attributes", label: "arm5e.sheet.attributes", cssClass: "item flexcol" },
        { id: "habitants", label: "arm5e.sheet.habitants", cssClass: "item flexcol" },
        { id: "posessions", label: "arm5e.sheet.possessions", cssClass: "item flexcol" },
        { id: "economics", label: "arm5e.sheet.economics", cssClass: "item flexcol" },
        { id: "library", label: "arm5e.sheet.library", cssClass: "item flexcol" },
        { id: "diary", label: "arm5e.sheet.diary", cssClass: "item flexcol" },
        { id: "effects", label: "arm5e.sheet.effects", cssClass: "item flexrow" }
      ],
      initial: "attributes"
    }
  };

  /** @override */
  static PARTS = {
    header: {
      template: `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/actor-covenant-header-v2.hbs`
    },
    tabs: {
      template: `systems/${ARM5E.SYSTEM_ID}/templates/generic/parts/ars-tab-navigation.hbs`,
      classes: ["arm5eTabsCOV", "marginsides32"]
    },
    attributes: {
      template: `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/actor-covenant-attributes-tab-v2.hbs`
    },
    habitants: {
      template: `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/actor-covenant-inhabitants-tab-v2.hbs`
    },
    posessions: {
      template: `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/actor-covenant-posessions-tab-v2.hbs`
    },
    economics: {
      template: `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/actor-covenant-economics-tab-v2.hbs`
    },
    library: {
      template: `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/actor-covenant-library-tab-v2.hbs`
    },
    diary: {
      template: `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/actor-covenant-diary-tab-v2.hbs`
    },
    effects: {
      template: `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/actor-covenant-effects-tab-v2.hbs`
    },
    footer: {
      template: `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/actor-covenant-footer-v2.hbs`
    }
  };

  /** @override */
  static LIMITED_PARTS = {
    content: {
      template: `systems/${ARM5E.SYSTEM_ID}/templates/actor/covenant-limited-sheet.html`,
      classes: ["limited-sheet", "flexcol"]
    },
    footer: {
      template: `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/actor-covenant-footer-v2.hbs`
    }
  };

  _configureRenderOptions(options) {
    // This fills in `options.parts` with an array of ALL part keys by default
    // So we need to call `super` first
    super._configureRenderOptions(options);

    if (this.document.limited) {
      options.parts = Object.keys(ArM5eCovenantActorSheetV2.LIMITED_PARTS);
      options.position = { width: 600, height: 700 };
    }
  }

  getUserCache() {
    let usercache = JSON.parse(sessionStorage.getItem(`usercache-${game.user.id}`));
    if (usercache === null) usercache = {};
    if (usercache[this.actor.id] === undefined) {
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
    } else if (usercache[this.actor.id].lists?.visibility === undefined) {
      usercache[this.actor.id].lists = { visibility: { inhabitants: {} } };
      sessionStorage.setItem(`usercache-${game.user.id}`, JSON.stringify(usercache));
    }

    return usercache[this.actor.id];
  }

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    context.system.loyalty.points.base = 0;

    context.system.loyalty.modifiers.livingConditions =
      context.system.modifiersLife.mundane * CONFIG.ARM5E.covenant.loyalty.livingConditions.factor;
    context.system.loyalty.modifiers.specialists = 0;

    for (let person of context.system.inhabitants.magi) {
      if (person.system.linked) {
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
        person.system.yearBorn = person.system.document.system.description.born.value;
      }
    }

    for (let person of context.system.inhabitants.turbula) {
      if (person.system.linked) {
        person.system.yearBorn = person.system.document.system.description.born.value;
      }
    }

    for (let person of context.system.inhabitants.specialists) {
      if (person.system.linked) {
        person.system.yearBorn = person.system.document.system.description.born.value;
      }
      context.system.loyalty.modifiers.specialists += person.system.loyaltyGain;
    }

    for (let person of context.system.inhabitants.companion) {
      if (person.system.linked) {
        person.system.yearBorn = person.system.document.system.description.born.value;
      }
      context.system.loyalty.modifiers.specialists += person.system.loyaltyGain;
    }

    for (let person of context.system.inhabitants.craftsmen) {
      if (person.system.linked) {
        person.system.yearBorn = person.system.document.system.description.born.value;
      }
    }

    for (let person of context.system.inhabitants.habitants) {
      if (person.system.linked) {
        person.system.yearBorn = person.system.document.system.description.born.value;
      }
      person.system.categoryLabel = CONFIG.ARM5E.covenant.inhabitants[person.system.category].label;
    }

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
      const aura = Aura.fromScene(e);
      let label = e.name;
      if (aura.visible) {
        label += ` (${aura.label})`;
      }
      return { name: label, id: e._id };
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
    }

    context.tabs = this._prepareTabs("primary");
    if (!context.isGM) delete context.tabs.effects;

    return context;
  }

  /** @override */
  async _preparePartContext(partId, context, options) {
    const tabIds = [
      "attributes",
      "habitants",
      "posessions",
      "economics",
      "library",
      "diary",
      "effects"
    ];
    if (tabIds.includes(partId)) {
      context.tab = context.tabs?.[partId];
    }
    return super._preparePartContext(partId, context, options);
  }

  /** @override */
  isItemDropAllowed(itemData) {
    switch (itemData?.type) {
      case "virtue":
      case "flaw":
        switch (itemData?.system?.type) {
          case "covenantSite":
          case "covenantResources":
          case "covenantResidents":
          case "covenantExternalRelations":
          case "covenantSurroundings":
          case "generic":
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
      case "possessionsCovenant":
      case "visSourcesCovenant":
      case "visStockCovenant":
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

  /** @override */
  isActorDropAllowed(type) {
    switch (type) {
      case "player":
      case "npc":
      case "beast":
      case "laboratory":
        return true;
      default:
        return false;
    }
  }

  /**
   * Returns true if this item type must be converted to a laboratoryText when dropped on a covenant.
   * @param {string} type
   * @returns {boolean}
   */
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

  /**
   * Convert spell/magicalEffect/enchantment to laboratoryText for covenant storage.
   * @param {object} data The item data to convert
   * @returns {object} The converted item data
   * @override
   */
  convert(data) {
    return effectToLabText(data);
  }

  /** @override */
  async _onDropItem(event, item) {
    const itemData = item?.toObject?.() ?? item;
    if (this.needConversion(itemData.type)) {
      return await this.actor.createEmbeddedDocuments("Item", [this.convert(itemData)]);
    }
    return super._onDropItem(event, item);
  }

  /** @override */
  async _onDropFolder(event, data) {
    if (!this.actor.isOwner) return [];
    if (data.documentName !== "Item") return [];
    const folder = game.folders.get(data.id);
    if (!folder) return [];
    const nonConvertible = folder.contents.filter((e) => !this.needConversion(e.type));
    const res = await this.actor.createEmbeddedDocuments(
      "Item",
      nonConvertible.map((e) => e.toObject())
    );
    for (const item of folder.contents.filter((e) => this.needConversion(e.type))) {
      res.push(await this.actor.createEmbeddedDocuments("Item", [this.convert(item.toObject())]));
    }
    return res;
  }

  /** @override */
  async _onDropActor(event, actor) {
    if (!this.actor.isOwner) return false;
    if (!this.isActorDropAllowed(actor?.type)) return false;
    if (actor.isCharacter()) {
      if (actor.system.covenant?.linked && actor.system.covenant.actorId === this.actor.id) {
        ui.notifications.warn("These actors are already linked.");
        return false;
      }

      // TODO translate this confirmation message
      const confirmed = await getConfirmation(
        "",
        "Are you sure you want to link this character to the covenant?",
        "Covenant",
        "Any lab linked to this character will be reset."
      );
      if (!confirmed) return false;
      await this.addNewInhabitant(actor);
    } else if (actor.type === "laboratory") {
      if (actor.system.covenant?.linked && actor.system.covenant.actorId === this.actor.id) {
        ui.notifications.warn("These actors are already linked.");
        return false;
      }
      // TODO translate this confirmation message
      const confirmed = await getConfirmation(
        "",
        "Are you sure you want to link this laboratory to the covenant?",
        "Covenant",
        "Its owner and previous covenant will be reset."
      );
      if (!confirmed) return false;
      await this.addNewLaboratory(actor);
    }

    return true;
  }

  async addNewInhabitant(actor) {
    if (!["player", "npc", "beast"].includes(actor.type)) return [];
    const updateArray = [];
    const promiseArray = [];
    // If the actor already belongs to another covenant, detach it first.
    let characterUpdate = {};
    if (actor.system.covenant?.linked) {
      const oldCov = actor.system.covenant.document;
      delete actor.apps[oldCov.sheet?.options?.uniqueId];
      delete oldCov.apps[actor.sheet?.options?.uniqueId];
      promiseArray.push(oldCov.sheet?._unbindCharacter(actor));

      // if the character is linked to a lab, we need to unbind it too
      if (actor.system.sanctum?.linked) {
        const linkedSanctum = actor.system.sanctum.document;
        updateArray.push(linkedSanctum.sheet._unbindOwnerData());
        characterUpdate = actor.sheet._unbindLaboratoryData();
      }
    }

    updateArray.push(
      foundry.utils.mergeObject(characterUpdate, actor.sheet._bindCovenantData(this.actor))
    );
    promiseArray.push(this._bindCharacter(actor));

    if (updateArray.length > 0) {
      promiseArray.push(Actor.updateDocuments(updateArray));
    }
    if (promiseArray.length > 0) {
      await Promise.all(promiseArray);
    }
  }

  async addNewLaboratory(actor) {
    if (actor.type !== "laboratory") return;
    const updateArray = [];
    const promiseArray = [];
    let sanctumUpdate = {};
    if (actor.system.covenant?.linked) {
      const oldCov = actor.system.covenant.document;
      delete actor.apps[oldCov.sheet?.options?.uniqueId];
      delete oldCov.apps[actor.sheet?.options?.uniqueId];
      promiseArray.push(oldCov.sheet?._unbindLaboratory(actor));

      // if the lab is linked to a character, we need to unbind it too
      if (actor.system.owner?.linked) {
        const owner = actor.system.owner.document;
        sanctumUpdate = actor.sheet._unbindOwnerData();
        updateArray.push(owner.sheet?._unbindLaboratoryData());
      }
    }
    updateArray.push(
      foundry.utils.mergeObject(sanctumUpdate, actor.sheet._bindCovenantData(this.actor))
    );
    promiseArray.push(this._bindLaboratory(actor));

    if (updateArray.length > 0) {
      promiseArray.push(Actor.updateDocuments(updateArray));
    }
    if (promiseArray.length > 0) {
      await Promise.all(promiseArray);
    }
  }

  // @returns {Promise<Actor>} The updated actor
  async _bindCharacter(actor) {
    if (!["player", "npc", "beast"].includes(actor.type)) return [];
    const targetActor = this.actor;
    if (actor.isMagus?.()) {
      let pts = 5;
      if (targetActor.system.season === "summer" || targetActor.system.season === "autumn") {
        pts = 10;
      }
      let giftType = "normal";
      if (actor.hasVirtue?.("gentle-gift")) giftType = "gentle";
      else if (actor.hasFlaw?.("blatant-gift")) giftType = "blatant";
      const itemData = [
        {
          name: actor.name,
          type: "inhabitant",
          img: actor.img,
          system: {
            category: "magi",
            actorId: actor._id,
            giftType,
            job: `${actor.system.description.title.value} ${game.i18n.localize(
              "arm5e.sheet.house"
            )} ${CONFIG.ARM5E.character.houses[actor.system.house.value].label}`,
            points: pts,
            yearBorn: actor.system.description.born.value
          }
        }
      ];
      const existing = targetActor.system.inhabitants.magi.filter((h) => h.name === actor.name);
      if (existing.length === 0) {
        return this.actor.createEmbeddedDocuments("Item", itemData, { render: true });
      } else {
        itemData[0]._id = existing[0]._id;
        return this.actor.updateEmbeddedDocuments("Item", itemData, { render: true });
      }
    } else if (actor.isCompanion?.()) {
      let pts = 3;
      if (targetActor.system.season === "summer" || targetActor.system.season === "autumn") {
        pts = 5;
      }
      const itemData = [
        {
          name: actor.name,
          type: "inhabitant",
          img: actor.img,
          system: {
            category: "companions",
            actorId: actor._id,
            companionRole: "other",
            job: actor.system.description.title.value,
            points: pts,
            yearBorn: actor.system.description.born.value
          }
        }
      ];
      const existing = targetActor.system.inhabitants.companion.filter(
        (h) => h.name === actor.name
      );
      if (existing.length === 0) {
        return this.actor.createEmbeddedDocuments("Item", itemData, { render: true });
      } else {
        itemData[0]._id = existing[0]._id;
        return this.actor.updateEmbeddedDocuments("Item", itemData, { render: true });
      }
    } else if (actor.type === "beast") {
      const itemData = [
        {
          name: actor.name,
          type: "inhabitant",
          img: actor.img,
          system: {
            category: "livestock",
            actorId: actor._id,
            job: "",
            points: CONFIG.ARM5E.covenant.inhabitants.livestock.points,
            quantity: 1,
            yearBorn: actor.system.description.born.value
          }
        }
      ];
      const existing = [
        ...targetActor.system.inhabitants.horses,
        ...targetActor.system.inhabitants.livestock
      ].filter((inhabitant) => inhabitant.system.actorId === actor._id);
      if (existing.length === 0) {
        return this.actor.createEmbeddedDocuments("Item", itemData, { render: true });
      } else {
        itemData[0]._id = existing[0]._id;
        itemData[0].system.category = existing[0].system.category;
        itemData[0].system.points = existing[0].system.points;
        return this.actor.updateEmbeddedDocuments("Item", itemData, { render: true });
      }
    } else if (
      actor.isGrog?.() ||
      (actor.type === "npc" && actor.system.charType?.value === "mundane")
    ) {
      const itemData = [
        {
          name: actor.name,
          type: "inhabitant",
          img: actor.img,
          system: {
            category: "turbula",
            actorId: actor._id,
            job: actor.system.description.title.value,
            points: 1,
            yearBorn: actor.system.description.born.value
          }
        }
      ];
      const existing = targetActor.system.inhabitants.habitants.filter(
        (h) => h.name === actor.name
      );
      if (existing.length === 0) {
        return this.actor.createEmbeddedDocuments("Item", itemData, { render: true });
      } else {
        itemData[0]._id = existing[0]._id;
        return this.actor.updateEmbeddedDocuments("Item", itemData, { render: true });
      }
    }
  }

  // TODO review after Character sheet
  async _unbindCharacter(actor) {
    if (!["player", "npc", "beast"].includes(actor.type)) return [];
    const targetActor = this.actor;
    if (actor.isMagus?.()) {
      const hab = targetActor.system.inhabitants.magi.filter((h) => h.system.actorId === actor._id);
      if (hab.length) {
        return this.actor.deleteEmbeddedDocuments("Item", [hab[0]._id], { render: true });
      }
    } else if (actor.isCompanion?.()) {
      const hab = targetActor.system.inhabitants.companion.filter(
        (h) => h.system.actorId === actor._id
      );
      if (hab.length) {
        return this.actor.deleteEmbeddedDocuments("Item", [hab[0]._id], { render: true });
      }
    } else if (actor.type === "beast") {
      const inhabitants = [
        ...targetActor.system.inhabitants.horses,
        ...targetActor.system.inhabitants.livestock
      ].filter((inhabitant) => inhabitant.system.actorId === actor._id);
      if (inhabitants.length) {
        return this.actor.deleteEmbeddedDocuments("Item", [inhabitants[0]._id], { render: true });
      }
    } else if (
      actor.isGrog?.() ||
      (actor.type === "npc" && actor.system.charType?.value === "mundane")
    ) {
      const hab = targetActor.system.inhabitants.habitants.filter(
        (h) => h.system.actorId === actor._id
      );
      if (hab.length) {
        return this.actor.deleteEmbeddedDocuments("Item", [hab[0]._id], { render: true });
      }
    }
  }

  async _bindLaboratory(actor) {
    if (actor.type !== "laboratory") return [];
    const targetActor = this.actor;
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
    const existing = targetActor.system.labs.filter((h) => h.name === actor.name);
    if (existing.length === 0) {
      actor.sheet?.render(false);
      return this.actor.createEmbeddedDocuments("Item", itemData, { render: true });
    } else {
      actor.sheet?.render(false);
      itemData[0]._id = existing[0]._id;
      return this.actor.updateEmbeddedDocuments("Item", itemData, { render: true });
    }
  }

  async _unbindLaboratory(actor) {
    if (actor.type !== "laboratory") return [];
    const targetActor = this.actor;
    const lab = targetActor.system.labs.filter((l) => l.system.sanctumId === actor._id);
    if (lab.length) {
      return this.actor.deleteEmbeddedDocuments("Item", [lab[0]._id], { render: true });
    }
  }

  static async removeLinkedItem(event, target) {
    event.preventDefault();
    const itemEl = target.closest(".item");
    const itemId = itemEl?.dataset?.itemId;
    if (!itemId) return;

    const item = this.actor.items.get(itemId);
    if (!item) return;
    const promiseArray = [];
    const updateArray = [];
    // If the item is linked to an actor, we need to unbind it first
    if (item.system?.linked) {
      if (item.type === "inhabitant") {
        const confirmation = await getConfirmation(
          game.i18n.localize("arm5e.dialog.sure"),
          game.i18n.localize("arm5e.dialog.link.unlinkInhabitant"),
          "covenant"
        );
        if (!confirmation) return;

        const inhabitant = item.system.document;
        promiseArray.push(this._unbindCharacter(inhabitant));
        let inhabitantUpdate = inhabitant.sheet?._unbindCovenantData();

        // if the inhabitant is linked to a lab, we need to unbind it too
        if (inhabitant.system?.sanctum?.linked) {
          const linkedSanctum = inhabitant.system.sanctum.document;
          inhabitantUpdate = foundry.utils.mergeObject(
            inhabitantUpdate,
            inhabitant.sheet?._unbindLaboratoryData(linkedSanctum)
          );
          updateArray.push(inhabitantUpdate);
          // also unbind the inhabitant from the sanctum
          updateArray.push(linkedSanctum.sheet?._unbindInhabitantData(inhabitant));
        }

        promiseArray.push(Actor.updateDocuments(updateArray));
      } else if (item.type === "labCovenant") {
        const confirmation = await getConfirmation(
          game.i18n.localize("arm5e.dialog.sure"),
          game.i18n.localize("arm5e.dialog.link.unlinkSanctum"),
          "covenant"
        );
        if (!confirmation) return;
        const sanctum = item.system.document;
        promiseArray.push(this._unbindLaboratory(sanctum));
        let sanctumUpdate = sanctum.sheet?._unbindCovenantData();
        // if the sanctum is linked to a character, we need to unbind it too
        if (sanctum.system?.linked) {
          const owner = sanctum.system.document;
          const ownerUpdate = owner.sheet?._unbindLaboratoryData(sanctum);
          updateArray.push(
            foundry.utils.mergeObject(sanctumUpdate, sanctum.sheet?._unbindOwnerData())
          );
          updateArray.push(ownerUpdate);
        }
        promiseArray.push(Actor.updateDocuments(updateArray));
      }
    }
    promiseArray.push(this.actor.deleteEmbeddedDocuments("Item", [itemId], {}));
    await Promise.all(promiseArray);
    this.render(false);
  }

  static async harvestItem(event, target) {
    event.preventDefault();
    const itemId = target.closest(".item")?.dataset?.itemId;
    if (!itemId) return;
    const item = this.actor.items.get(itemId);
    await item?.system?.harvest?.();
  }

  static async toggleInhabitants(event, target) {
    event.preventDefault();
    const category = target.dataset.category;
    if (!category) return;

    const cacheKey = `usercache-${game.user.id}`;
    const usercache = JSON.parse(sessionStorage.getItem(cacheKey) ?? "{}");
    usercache[this.actor.id] ??= this.getUserCache();

    const scope = usercache[this.actor.id].lists?.visibility?.inhabitants;
    const classes = this.element.querySelector(`#${category}`)?.classList;
    if (!classes) return;

    if (scope) {
      scope[category] = classes.contains("hide") ? "" : "hide";
      sessionStorage.setItem(cacheKey, JSON.stringify(usercache));
    }

    classes.toggle("hide");
  }
}
