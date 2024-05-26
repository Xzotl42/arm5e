import { getDataset, getUuidInfo, log } from "../tools.js";
import { ArM5eActorSheet } from "./actor-sheet.js";

/**
 * Extend the basic ArM5eActorSheet
 * @extends {ArM5eActorSheet}
 */

export class ArM5eNPCActorSheet extends ArM5eActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["arm5e", "sheet", "actor"],
      template: "systems/arm5e/templates/actor/actor-npc-sheet.html",
      width: 790,
      height: 800,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "description"
        },
        {
          navSelector: ".abilities-tabs",
          contentSelector: ".abilities-body",
          initial: "abilities"
        },
        {
          navSelector: ".desc-tabs",
          contentSelector: ".desc-body",
          initial: "desc"
        },
        {
          navSelector: ".lab-tabs",
          contentSelector: ".lab-body",
          initial: "lab"
        },
        {
          navSelector: ".inventory-tabs",
          contentSelector: ".inventory-body",
          initial: "inventory"
        },
        {
          navSelector: ".config-tabs",
          contentSelector: ".config-body",
          initial: "config"
        }
      ]
    });
  }

  /** @override */
  get template() {
    if (this.actor.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER)) {
      return `systems/arm5e/templates/actor/actor-npc-sheet.html`;
    }
    return `systems/arm5e/templates/actor/actor-limited-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  async getData() {
    const context = await super.getData();

    context.config = CONFIG.ARM5E;
    await this.enrichCharacterEditors(context);

    // Prepare items.
    this._prepareCharacterItems(context);
    log(false, "Npc-sheet getData");
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
    //let actorData = sheetData.actor.data;
  }

  isItemDropAllowed(itemData) {
    switch (itemData.type) {
      case "virtue":
      case "flaw":
        switch (itemData.system.type) {
          case "laboratoryOutfitting":
          case "laboratoryStructure":
          case "laboratorySupernatural":
          case "covenantSite":
          case "covenantResources":
          case "covenantResidents":
          case "covenantExternalRelations":
          case "covenantSurroundings":
            return false;
          default:
            return true;
        }

      case "power":
        if (this.actor.system.charType.value === "entity") return true;
        else return false;
      case "weapon":
      case "armor":
      case "spell":
      case "vis":
      case "item":
      case "book":
      case "ability":
      case "diaryEntry":
      case "powerFamiliar":
      case "personalityTrait":
      case "reputation":
      case "magicalEffect":
        return true;
      default:
        return false;
    }
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".change-realm").change(async (event) => {
      event.preventDefault();
      let chosenRealm = $(".change-realm").find("option:selected")[0].value;
      let currentRealm = getDataset(event).realm;
      let updateData = {};
      if (chosenRealm != "mundane") {
        updateData[`system.realms.${chosenRealm}.aligned`] = true;
      }
      if (currentRealm != "mundane") {
        updateData[`system.realms.${currentRealm}.aligned`] = false;
      }

      this.submit({ preventClose: true, updateData: updateData });
    });
  }

  async _onDropItem(event, data) {
    const info = getUuidInfo(data.uuid);
    const item = await fromUuid(data.uuid);
    if (this.actor.uuid !== item.parent?.uuid) {
      if (info.ownerType === "Actor" && info.type === "Item" && item.system.hasQuantity) {
        if (!event.shiftKey) {
          if (this.isItemDropAllowed(item)) {
            return this._handleTransfer(item);
          }
        }
      }
    }
    if (item.type == "ability") {
      if (this.actor.hasSkill(item.system.key)) {
        ui.notifications.warn(
          `${game.i18n.localize("arm5e.notification.doubleAbility")} : ${item.name}`
        );
      }
    }
    // }
    const res = await super._onDropItem(event, data);

    // not dropped in the same actor
    if (this.actor.uuid !== item.parent?.uuid) {
      if (res && res.length == 1) {
        res[0].sheet.render(true);
      }
    }
    return res;
  }
}
