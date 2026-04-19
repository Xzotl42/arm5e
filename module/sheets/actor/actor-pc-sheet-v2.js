import { log } from "../../tools/tools.js";
import { Arm5eCharacterActorSheetV2 } from "./character-actor-sheet-v2.js";

/**
 * AppV2 Player Character actor sheet.
 */
export class ArM5ePCActorSheetV2 extends Arm5eCharacterActorSheetV2 {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["arm5e", "sheet", "actor", "actor-pc"],
    position: { width: 790, height: 800 }
  };

  /** @override */
  static TABS = {
    primary: {
      tabs: [
        { id: "description", label: "arm5e.sheet.description", cssClass: "item flexcol" },
        { id: "abilities", label: "arm5e.sheet.abilities", cssClass: "item flexcol" },
        { id: "powers", label: "arm5e.sheet.powers", cssClass: "item flexcol" },
        { id: "arts", label: "arm5e.sheet.arts", cssClass: "item flexcol" },
        { id: "laboratory", label: "arm5e.sheet.laboratory", cssClass: "item flexcol" },
        { id: "tradition", label: "", cssClass: "item flexcol" },
        { id: "inventory", label: "arm5e.sheet.inventory", cssClass: "item flexcol" },
        { id: "diary", label: "arm5e.sheet.diary", cssClass: "item flexcol" },
        { id: "effects", label: "arm5e.sheet.effects", cssClass: "item flexcol" },
        { id: "config", icon: "fas fa-cog", cssClass: "item flexcol" }
      ],
      initial: "description"
    },
    "desc-secondary": {
      tabs: [
        { id: "desc", label: "arm5e.sheet.description", cssClass: "item flexrow" },
        { id: "wounds", label: "arm5e.sheet.vitals", cssClass: "item flexrow" }
      ],
      initial: "desc"
    },
    "abilities-secondary": {
      tabs: [
        { id: "abilities", label: "arm5e.sheet.abilities", cssClass: "item flexrow" },
        { id: "vandf", label: "arm5e.sheet.virtuesFlaws", cssClass: "item flexrow" }
      ],
      initial: "abilities"
    },
    "arts-secondary": {
      tabs: [
        { id: "arts-subtab", label: "arm5e.sheet.arts", cssClass: "item flexrow" },
        { id: "casting-total", label: "arm5e.sheet.castingTotals", cssClass: "item flexrow" }
      ],
      initial: "arts-subtab"
    },
    "lab-secondary": {
      tabs: [
        { id: "lab", label: "arm5e.sheet.laboratory", cssClass: "item flexrow" },
        { id: "lab-total", label: "arm5e.sheet.labTotal", cssClass: "item flexrow" }
      ],
      initial: "lab"
    },
    "tradition-secondary": {
      tabs: [
        { id: "tradition-subtab", label: "", cssClass: "item flexrow" },
        { id: "tradition-config", label: "arm5e.generic.config", cssClass: "item flexrow" }
      ],
      initial: "tradition-subtab"
    },
    "inventory-secondary": {
      tabs: [
        { id: "inventory", label: "arm5e.sheet.inventory", cssClass: "item flexrow" },
        { id: "library", label: "arm5e.sheet.library", cssClass: "item flexrow" }
      ],
      initial: "inventory"
    }
  };

  /** @override */
  static PARTS = {
    header: {
      template: "systems/arm5e/templates/actor/parts/actor-pc-header-v2.hbs"
    },
    tabs: {
      template: "systems/arm5e/templates/generic/parts/ars-tab-navigation.hbs",
      classes: ["arm5eTabsPC", "marginsides32"]
    },
    description: {
      template: "systems/arm5e/templates/actor/parts/actor-pc-description-tab-v2.hbs"
    },
    abilities: {
      template: "systems/arm5e/templates/actor/parts/actor-pc-abilities-tab-v2.hbs"
    },
    powers: {
      template: "systems/arm5e/templates/actor/parts/actor-powers-tab-v2.hbs"
    },
    arts: {
      template: "systems/arm5e/templates/actor/parts/actor-pc-arts-tab-v2.hbs"
    },
    laboratory: {
      template: "systems/arm5e/templates/actor/parts/actor-laboratory-tab-v2.hbs"
    },
    tradition: {
      template: "systems/arm5e/templates/actor/parts/actor-pc-tradition-tab-v2.hbs"
    },
    inventory: {
      template: "systems/arm5e/templates/actor/parts/actor-pc-inventory-tab-v2.hbs"
    },
    diary: {
      template: "systems/arm5e/templates/actor/parts/actor-diary-tab-v2.hbs"
    },
    effects: {
      template: "systems/arm5e/templates/actor/parts/actor-pc-effects-tab-v2.hbs"
    },
    config: {
      template: "systems/arm5e/templates/actor/parts/actor-pc-config-tab-v2.hbs"
    },
    footer: {
      template: "systems/arm5e/templates/actor/parts/actor-pc-footer-v2.hbs"
    }
  };

  /** @override */
  static LIMITED_PARTS = {
    content: {
      template: "systems/arm5e/templates/actor/actor-limited-sheet.html"
    }
  };

  /** @override */
  _configureRenderParts(options) {
    const parts = super._configureRenderParts(options);
    if (!this.actor.system.features?.powers) delete parts.powers;
    if (this.actor.system.charType?.value !== "magus") {
      delete parts.arts;
      delete parts.laboratory;
    }
    if (!this.actor.system.features?.magicSystem) delete parts.tradition;
    if (!game.user?.isGM) delete parts.config;
    return parts;
  }

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    await this._prepareCharacterContext(context);
    context.tabs = this._prepareTabs("primary");
    if (!this.actor.system.features?.powers) delete context.tabs.powers;
    if (this.actor.system.charType?.value !== "magus") {
      delete context.tabs.arts;
      delete context.tabs.laboratory;
    }
    if (!this.actor.system.features?.magicSystem) delete context.tabs.tradition;
    else if (context.tabs.tradition) {
      context.tabs.tradition.label = context.system.magicSystem?.name ?? "";
    }
    if (!game.user?.isGM) delete context.tabs.config;
    log(false, "Prepared PC sheet context", context);
    return context;
  }

  /** @override */
  async _preparePartContext(partId, context, options) {
    const tabIds = [
      "description",
      "abilities",
      "powers",
      "arts",
      "laboratory",
      "tradition",
      "inventory",
      "diary",
      "effects",
      "config"
    ];
    if (tabIds.includes(partId)) {
      context.tab = context.tabs?.[partId];
      if (partId === "effects" && !context.isGM && context.tab) {
        context.tab.cssClass = `${context.tab.cssClass} hidden`;
      } else if (partId === "description") {
        context.subtabs = this._prepareTabs("desc-secondary");
      } else if (partId === "abilities") {
        context.subtabs = this._prepareTabs("abilities-secondary");
      } else if (partId === "arts") {
        context.subtabs = this._prepareTabs("arts-secondary");
      } else if (partId === "laboratory") {
        context.subtabs = this._prepareTabs("lab-secondary");
      } else if (partId === "tradition") {
        context.subtabs = this._prepareTabs("tradition-secondary");
        if (context.subtabs["tradition-subtab"]) {
          context.subtabs["tradition-subtab"].label = context.system?.magicSystem?.effects ?? "";
        }
      } else if (partId === "inventory") {
        context.subtabs = this._prepareTabs("inventory-secondary");
      }
    }
    return super._preparePartContext(partId, context, options);
  }

  /** @override */
  isItemDropAllowed(itemData) {
    switch (itemData?.type) {
      case "virtue":
      case "flaw":
        switch (itemData?.system?.type) {
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
      case "spell":
      case "magicalEffect":
      case "abilityFamiliar":
      case "powerFamiliar":
        return this.actor.isMagus();
      case "supernaturalEffect":
        return this.actor.system.features.magicSystem;
      case "weapon":
      case "armor":
      case "vis":
      case "item":
      case "book":
      case "ability":
      case "diaryEntry":
      case "laboratoryText":
      case "personalityTrait":
      case "reputation":
        return true;
      default:
        return false;
    }
  }

  /** @override */
  isActorDropAllowed(type) {
    switch (type) {
      case "laboratory":
      case "covenant":
        return true;
      default:
        return false;
    }
  }

  /** @override */
  async _onDropItem(event, item) {
    this._warnDuplicateAbilityDrop(item);
    const result = await super._onDropItem(event, item);
    return this._renderExternalDroppedItem(result, item);
  }
}
