import { Arm5eCharacterActorSheetV2 } from "./character-actor-sheet-v2.js";

/**
 * AppV2 Beast actor sheet.
 */
export class ArM5eBeastActorSheetV2 extends Arm5eCharacterActorSheetV2 {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["arm5e", "sheet", "actor", "actor-beast"],
    position: { width: 790, height: 800 }
  };

  /** @override */
  static TABS = {
    primary: {
      tabs: [
        { id: "description", label: "arm5e.sheet.description", cssClass: "item flexcol" },
        { id: "abilities", label: "arm5e.sheet.abilities", cssClass: "item flexcol" },
        { id: "whereabouts", label: "arm5e.sheet.whereabouts", cssClass: "item flexcol" },
        { id: "effects", label: "arm5e.sheet.effects", cssClass: "item flexcol" }
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
        { id: "vandf", label: "arm5e.sheet.qualities", cssClass: "item flexrow" }
      ],
      initial: "abilities"
    }
  };

  /** @override */
  static PARTS = {
    header: {
      template: "systems/arm5e/templates/actor/parts/actor-beast-header-v2.hbs"
    },
    tabs: {
      template: "systems/arm5e/templates/generic/parts/ars-tab-navigation.hbs",
      classes: ["arm5eTabsNPC", "marginsides32"]
    },
    description: {
      template: "systems/arm5e/templates/actor/parts/actor-beast-description-tab-v2.hbs"
    },
    abilities: {
      template: "systems/arm5e/templates/actor/parts/actor-beast-abilities-tab-v2.hbs"
    },
    whereabouts: {
      template: "systems/arm5e/templates/actor/parts/actor-beast-whereabouts-tab-v2.hbs"
    },
    effects: {
      template: "systems/arm5e/templates/actor/parts/actor-beast-effects-tab-v2.hbs"
    },
    footer: {
      template: "systems/arm5e/templates/actor/parts/actor-beast-footer-v2.hbs"
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
    if (!game.user?.isGM) delete parts.effects;
    return parts;
  }

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    await this._prepareCharacterContext(context, { showQualities: true });
    context.tabs = this._prepareTabs("primary");
    if (!game.user?.isGM) delete context.tabs.effects;
    return context;
  }

  /** @override */
  async _preparePartContext(partId, context, options) {
    const tabIds = ["description", "abilities", "whereabouts", "effects"];
    if (tabIds.includes(partId)) {
      context.tab = context.tabs?.[partId];
      if (partId === "description") {
        context.subtabs = this._prepareTabs("desc-secondary");
      } else if (partId === "abilities") {
        context.subtabs = this._prepareTabs("abilities-secondary");
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
      case "quality":
      case "inferiority":
      case "weapon":
      case "armor":
      case "vis":
      case "item":
      case "book":
      case "ability":
      case "diaryEntry":
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
