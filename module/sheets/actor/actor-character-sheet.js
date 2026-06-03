import { log } from "../../tools/tools.js";
import { Arm5eCommonCharacterActorSheetV2 } from "./actor-common-character-sheet.js";

/**
 * AppV2 sheet for the unified "character" actor type.
 *
 * Replaces the split player / NPC / beast sheets for newly created actors.
 * Deprecated types (player, npc, beast) continue to use their own sheets.
 *
 * Visible tabs and sheet sections are driven entirely by the character's
 * feature flags (system.features.*), which are editable only in creation mode.
 * Switching role (player ↔ npc) is seamless — the same template handles both.
 */
export class Arm5eCharacterActorSheetV2 extends Arm5eCommonCharacterActorSheetV2 {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["arm5e", "sheet", "actor", "actor-character"],
    position: { width: 790, height: 800 }
  };

  // ── Tabs ──────────────────────────────────────────────────────────────────

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

  // ── Parts ──────────────────────────────────────────────────────────────────

  /** @override */
  static PARTS = {
    header: {
      template: "systems/arm5e/templates/actor/parts/actor-character-header-v2.hbs"
    },
    tabs: {
      template: "systems/arm5e/templates/generic/parts/ars-tab-navigation.hbs",
      classes: ["arm5eTabsCharacter", "marginsides32"]
    },
    description: {
      template: "systems/arm5e/templates/actor/parts/actor-character-description-tab-v2.hbs"
    },
    abilities: {
      // Shared with PC/NPC sheets — identical content
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
      template: "systems/arm5e/templates/actor/parts/actor-character-config-tab-v2.hbs"
    },
    footer: {
      template: "systems/arm5e/templates/actor/parts/actor-character-footer-v2.hbs"
    }
  };

  /** @override */
  static LIMITED_PARTS = {
    content: {
      template: "systems/arm5e/templates/actor/actor-limited-sheet.html",
      classes: ["limited-sheet", "flexcol"]
    },
    footer: {
      template: "systems/arm5e/templates/actor/parts/actor-character-footer-v2.hbs"
    }
  };

  // ── Render options ─────────────────────────────────────────────────────────

  /** @override */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    if (this.document.limited) {
      options.parts = Object.keys(Arm5eCharacterActorSheetV2.LIMITED_PARTS);
      options.position = { width: 600, height: 700 };
    }
  }

  /**
   * Inject a role-based CSS class so the existing PC/NPC CSS rules for
   * background image, scrollbar colours, and header/footer decoration apply.
   * @override
   */
  async _onRender(context, options) {
    await super._onRender(context, options);
    const roleClass = this.actor.system.role === "npc" ? "actor-npc" : "actor-pc";
    this.element.classList.add(roleClass);
  }

  /** @override */
  _configureRenderParts(options) {
    const parts = super._configureRenderParts(options);
    const f = this.actor.system.features;

    if (!f?.powers) delete parts.powers;

    // Arts + laboratory require hermetic magic
    if (!f?.magicSystem || !this.actor.isMagus()) {
      delete parts.arts;
      delete parts.laboratory;
    }

    // Tradition tab: only for alternate magic system
    if (!f?.magicSystem || f?.magicSystemType !== "alternate") delete parts.tradition;

    if (!game.user?.isGM) delete parts.config;

    return parts;
  }

  // ── Context preparation ────────────────────────────────────────────────────

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const f = this.actor.system.features;
    const isEntity = this.actor.system.subtype === "entity";

    await this._prepareCharacterContext(context, { showQualitiesForEntity: isEntity });

    context.tabs = this._prepareTabs("primary");

    if (!f?.powers) delete context.tabs.powers;

    if (!f?.magicSystem || !this.actor.isMagus()) {
      delete context.tabs.arts;
      delete context.tabs.laboratory;
    }

    if (!f?.magicSystem || f?.magicSystemType !== "alternate") {
      delete context.tabs.tradition;
    } else if (context.tabs.tradition) {
      context.tabs.tradition.label = context.system.magicSystem?.name ?? "";
    }

    if (!game.user?.isGM) delete context.tabs.config;

    // Expose feature flags and role to templates
    context.features = f;
    context.role = this.actor.system.role;
    context.subtype = this.actor.system.subtype;
    context.isPlayerRole = this.actor.system.role === "player";
    context.isNpcRole = this.actor.system.role === "npc";
    context.navClass = context.isNpcRole ? "brownBar" : "blueBar";

    log(false, "Prepared character sheet context", context);
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

  // ── Drop handling ─────────────────────────────────────────────────────────

  /** @override */
  isItemDropAllowed(itemData) {
    const f = this.actor.system.features;
    switch (itemData?.type) {
      case "virtue":
      case "flaw": {
        const covenantTypes = [
          "laboratoryOutfitting",
          "laboratoryStructure",
          "laboratorySupernatural",
          "covenantSite",
          "covenantResources",
          "covenantResidents",
          "covenantExternalRelations",
          "covenantSurroundings"
        ];
        return !covenantTypes.includes(itemData?.system?.type);
      }
      case "spell":
      case "magicalEffect":
      case "abilityFamiliar":
      case "powerFamiliar":
        return this.actor.isMagus();
      case "supernaturalEffect":
        return f?.magicSystem && !this.actor.isMagus();
      case "power":
        return f?.powers ?? false;
      case "quality":
      case "inferiority":
        return this.actor.system.subtype === "entity";
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
    return type === "laboratory" || type === "covenant";
  }

  /** @override */
  async _onDropItem(event, item) {
    this._warnDuplicateAbilityDrop(item);
    const result = await super._onDropItem(event, item);
    return this._renderExternalDroppedItem(result, item);
  }
}
