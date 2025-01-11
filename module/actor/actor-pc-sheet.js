import { getUuidInfo, log } from "../tools.js";
import { ArM5eActorSheet } from "./actor-sheet.js";

/**
 * Extend the basic ArM5eActorSheet
 * @extends {ArM5eActorSheet}
 */
export class ArM5ePCActorSheet extends ArM5eActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["arm5e", "sheet", "actor"],
      template: "systems/arm5e/templates/actor/actor-pc-sheet.html",
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
          navSelector: ".powers-tabs",
          contentSelector: ".powers-body",
          initial: "powers"
        },
        {
          navSelector: ".arts-tabs",
          contentSelector: ".arts-body",
          initial: "arts-subtab"
        },
        {
          navSelector: ".tradition-tabs",
          contentSelector: ".tradition-body",
          initial: "tradition-subtab"
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

  /* -------------------------------------------- */
  /** @override */
  get template() {
    if (this.actor.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER)) {
      return `systems/arm5e/templates/actor/actor-pc-sheet.html`;
    }
    return `systems/arm5e/templates/actor/actor-limited-sheet.html`;
  }

  /** @override */
  async getData() {
    const context = await super.getData();

    context.config = CONFIG.ARM5E;
    await this.enrichCharacterEditors(context);

    // Prepare items.
    this._prepareCharacterItems(context);

    // log(false, "Player-sheet getData");
    // log(false, context);
    return context;
  }

  _prepareCharacterItems(actorData) {
    super._prepareCharacterItems(actorData);
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
      case "weapon":
      case "armor":
      case "spell":
      case "vis":
      case "item":
      case "book":
      case "ability":
      case "abilityFamiliar":
      case "diaryEntry":
      case "powerFamiliar":
      case "magicalEffect":
      case "laboratoryText":
      case "personalityTrait":
      case "reputation":
        return true;
      default:
        return false;
    }
  }

  isActorDropAllowed(type) {
    switch (type) {
      case "laboratory":
      case "covenant":
        return true;
      default:
        return false;
    }
  }

  async _onDropItem(event, data) {
    const info = getUuidInfo(data.uuid);
    const item = await fromUuid(data.uuid);
    // transform input into labText
    if (item.type == "ability") {
      if (this.actor.hasSkill(item.system.key)) {
        ui.notifications.warn(
          `${game.i18n.localize("arm5e.notification.doubleAbility")} : ${item.name}`
        );
      }
    }
    const res = await super._onDropItem(event, data);
    // not dropped in the same actor
    if (this.actor.uuid !== item.parent?.uuid) {
      if (res && res.length == 1) {
        res[0].sheet.render(true);
      }
    }
    return res;
  }

  addListenersDialog(html) {
    html.find('input[name="inputField"]').change((ev) => {
      let v = parseInt(ev.currentTarget.value);
      if (v < 1) ev.currentTarget.value = 1;
      if (v > parseInt(ev.currentTarget.max))
        ev.currentTarget.value = parseInt(ev.currentTarget.max);
    });

    html.find(".resource-focus").focus((ev) => {
      ev.preventDefault();
      ev.currentTarget.select();
    });
  }
}
