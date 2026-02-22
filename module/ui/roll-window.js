import { ARM5E } from "../config.js";
import {
  simpleDie,
  stressDie,
  noRoll,
  changeMightCallback,
  loseFatigueLevelCallback,
  useItemCharge
} from "../helpers/dice.js";
import { castSpell, castSupernaturalEffect, noFatigue } from "../helpers/magic.js";
import {
  setAgingEffects,
  agingCrisis,
  twilightControl,
  applyTwilightStrength,
  applyTwilightComplexity,
  twilightUnderstanding
} from "../seasonal-activities/long-term-activities.js";
import { damageRoll, exertSelf, soakRoll } from "../helpers/combat.js";
import { MagicalEffectSchema, SpellSchema } from "../schemas/magicSchemas.js";
import { getDataset, log } from "../tools/tools.js";
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
// below is a bitmap
const ROLL_MODES = {
  NONE: 0, // can be used with dataset to customize dynamically
  STRESS: 1,
  SIMPLE: 2,
  NO_BOTCH: 4,
  NO_CONF: 8, // No confidence use
  UNCONSCIOUS: 16, // Can roll unconscious
  NO_CHAT: 32, // No chat message
  NO_ROLL: 64, // for magic item or power use
  PRIVATE: 128, // Roll is private between the GM and player
  DEAD: 256, // can roll when dead
  // common combos
  STRESS_OR_SIMPLE: 3
};

const ROLL_MODIFIERS = {
  PHYSICAL: 1,
  ENCUMBRANCE: 2,
  AURA: 4
};

// Notes:
// - CALLBACK method is usually async and allow to setup the actor after the roll
//   Pending confidence, pending damage/fatigue, fatigue loss.
const ROLL_PROPERTIES = {
  OPTION: {
    VAL: "option",
    MODE: ROLL_MODES.STRESS_OR_SIMPLE,
    MODIFIERS: 1,
    TITLE: "arm5e.dialog.title.rolldie",
    CALLBACK: applyImpact
  },
  ABILITY: {
    VAL: "ability",
    MODE: ROLL_MODES.STRESS_OR_SIMPLE,
    MODIFIERS: 1,
    TITLE: "arm5e.dialog.title.rolldie",
    CALLBACK: applyImpact
  },
  // COMBAT: {
  //   MODE: ROLL_MODES.STRESS,
  //   TITLE: "arm5e.dialog.title.rolldie",
  //   MODIFIERS: 1,
  //   // ALTER_ROLL: doubleAbility,
  //   ALT_ACTION: exertSelf,
  //   ALT_ACTION_LABEL: "arm5e.dialog.button.exertSelf"
  // },
  ATTACK: {
    VAL: "attack",
    MODE: ROLL_MODES.STRESS,
    TITLE: "arm5e.dialog.title.rolldie",
    MODIFIERS: 1,
    CALLBACK: combatAttack,
    // ALTER_ROLL: doubleAbility,
    ALT_ACTION: exertSelf,
    ALT_ACTION_LABEL: "arm5e.dialog.button.exertSelf"
  },

  DAMAGE: {
    VAL: "damage",
    MODE: ROLL_MODES.STRESS + ROLL_MODES.NO_CONF + ROLL_MODES.UNCONSCIOUS, // 25 STRESS + NO_CONF + UNCONSCIOUS
    TITLE: "arm5e.dialog.title.rolldie",
    MODIFIERS: 0,
    CALLBACK: damageRoll
    // ALTER_ROLL: doubleAbility,
  },
  SOAK: {
    VAL: "soak",
    MODE: ROLL_MODES.STRESS + ROLL_MODES.NO_CONF + ROLL_MODES.UNCONSCIOUS + ROLL_MODES.NO_CHAT, // 57, // STRESS + NO_CONF + UNCONSCIOUS + NO CHAT
    TITLE: "arm5e.dialog.title.rolldie",
    MODIFIERS: 0,
    CALLBACK: soakRoll
    // ALTER_ROLL: doubleAbility,
  },
  DEFENSE: {
    VAL: "defense",
    MODE: ROLL_MODES.STRESS,
    TITLE: "arm5e.dialog.title.rolldie",
    MODIFIERS: 1,
    CALLBACK: combatDefense,
    // ALTER_ROLL: doubleAbility,
    ALT_ACTION: exertSelf,
    ALT_ACTION_LABEL: "arm5e.dialog.button.exertSelf"
  },
  INIT: {
    VAL: "init",
    MODE: ROLL_MODES.STRESS,
    MODIFIERS: 3,
    CALLBACK: applyImpact,
    TITLE: "arm5e.dialog.title.rolldie"
  },
  MAGIC: {
    VAL: "magic",
    MODE: ROLL_MODES.STRESS,
    MODIFIERS: 7,
    TITLE: "arm5e.dialog.title.rolldie",
    SCHEMA: MagicalEffectSchema,
    CALLBACK: castSpell,
    ALTER_ROLL: noFatigue,
    ALT_ACTION: noRoll,
    ALT_ACTION_LABEL: "arm5e.dialog.button.noroll"
  },
  SPONT: {
    VAL: "spont",
    MODE: ROLL_MODES.STRESS,
    MODIFIERS: 7,
    TITLE: "arm5e.dialog.title.rolldie",
    SCHEMA: MagicalEffectSchema,
    CALLBACK: castSpell,
    ALTER_ROLL: noFatigue,
    ALT_ACTION: noRoll,
    ALT_ACTION_LABEL: "arm5e.dialog.button.noroll"
  },
  CHAR: {
    VAL: "char",
    MODE: 19, // STRESS + SIMPLE + UNCONSCIOUS
    MODIFIERS: 1,
    TITLE: "arm5e.dialog.title.rolldie",
    CALLBACK: applyImpact
  },
  SPELL: {
    VAL: "spell",
    MODE: ROLL_MODES.STRESS_OR_SIMPLE,
    SCHEMA: SpellSchema,
    MODIFIERS: 7,
    TITLE: "arm5e.dialog.title.rolldie",
    CALLBACK: castSpell
  },
  AGING: {
    VAL: "aging",
    MODE:
      ROLL_MODES.STRESS +
      ROLL_MODES.NO_BOTCH +
      ROLL_MODES.NO_CONF +
      ROLL_MODES.UNCONSCIOUS +
      ROLL_MODES.PRIVATE, // 157, // STRESS + NO_BOTCH + NO_CONF + UNCONSCIOUS + PRIVATE
    MODIFIERS: 0,
    TITLE: "arm5e.aging.roll.label",
    CALLBACK: setAgingEffects,
    ALTER_ROLL: noFatigue
  },
  TWILIGHT_CONTROL: {
    VAL: "twilight_control",
    MODE: ROLL_MODES.STRESS + ROLL_MODES.UNCONSCIOUS,
    MODIFIERS: 1,
    TITLE: "arm5e.twilight.episode",
    ACTION_LABEL: "arm5e.twilight.control.avoid",
    CALLBACK: twilightControl
  },
  TWILIGHT_STRENGTH: {
    VAL: "twilight_strength",
    MODE:
      ROLL_MODES.STRESS +
      ROLL_MODES.NO_BOTCH +
      ROLL_MODES.NO_CONF +
      ROLL_MODES.UNCONSCIOUS +
      ROLL_MODES.PRIVATE, // STRESS + NO_BOTCH + NO_CONF + UNCONSCIOUS + PRIVATE
    MODIFIERS: 0,
    TITLE: "arm5e.twilight.episode",
    CALLBACK: applyTwilightStrength
  },
  TWILIGHT_COMPLEXITY: {
    VAL: "twilight_complexity",
    MODE: ROLL_MODES.STRESS + ROLL_MODES.NO_CONF + ROLL_MODES.UNCONSCIOUS + ROLL_MODES.PRIVATE, // STRESS + NO_CONF + UNCONSCIOUS + PRIVATE
    MODIFIERS: 0,
    TITLE: "arm5e.twilight.episode",
    CALLBACK: applyTwilightComplexity
  },
  TWILIGHT_UNDERSTANDING: {
    VAL: "twilight_understanding",
    MODE: ROLL_MODES.STRESS + ROLL_MODES.UNCONSCIOUS,
    MODIFIERS: 1,
    TITLE: "arm5e.twilight.episode",
    CALLBACK: twilightUnderstanding
  },
  CRISIS: {
    VAL: "crisis",
    MODE: ROLL_MODES.SIMPLE + ROLL_MODES.NO_CONF + ROLL_MODES.UNCONSCIOUS + ROLL_MODES.PRIVATE, // SIMPLE + NO_CONF + UNCONSCIOUS + PRIVATE
    MODIFIERS: 0,
    TITLE: "arm5e.aging.crisis.label",
    CALLBACK: agingCrisis
  },
  SUPERNATURAL: {
    VAL: "supernatural",
    MODE: ROLL_MODES.NONE, // use dataset.mode
    MODIFIERS: 7,
    TITLE: "arm5e.dialog.title.rolldie",
    // ACTION_LABEL: "arm5e.dialog.powerUse",
    CALLBACK: castSupernaturalEffect
  },
  COMBATDAMAGE: {
    VAL: "combatDamage",
    MODE: ROLL_MODES.NO_ROLL, // use dataset.mode
    MODIFIERS: 0,
    TITLE: "arm5e.dialog.damageCalculator",
    ACTION_LABEL: "arm5e.dialog.woundCalculator"
    // CALLBACK: combatDamage
  },
  COMBATSOAK: {
    VAL: "combatSoak",
    MODE: ROLL_MODES.NO_ROLL, // use dataset.mode
    MODIFIERS: 0,
    TITLE: "arm5e.dialog.woundCalculator",
    ACTION_LABEL: "arm5e.dialog.woundCalculator"
    // CALLBACK: combatDamage
  },
  POWER: {
    VAL: "power",
    MODE: ROLL_MODES.NO_ROLL, // use dataset.mode
    MODIFIERS: 7,
    TITLE: "arm5e.dialog.powerUse",
    ACTION_LABEL: "arm5e.dialog.powerUse"
    // CALLBACK: castSupernaturalEffect
  },
  ITEM: {
    VAL: "item",
    MODE: ROLL_MODES.NO_ROLL + ROLL_MODES.NO_CONF, // no die roll and no confidence
    MODIFIERS: 4, // only impacted by aura
    TITLE: "arm5e.dialog.magicItemUse",
    ACTION_LABEL: "arm5e.dialog.powerUse"
    // CALLBACK: castSupernaturalEffect
  }
};

/**
 *
 * @param type
 */
function getRollTypeProperties(type) {
  const properties = ROLL_PROPERTIES[type.toUpperCase()];
  if (properties === undefined) {
    console.error("Unknown type of roll!");
  }
  const res = foundry.utils.duplicate(properties);
  // restore callback properties lost during duplication
  res.CALLBACK = properties.CALLBACK;
  res.ALT_ACTION = properties.ALT_ACTION;
  res.ALTER_ROLL = properties.ALTER_ROLL;
  return res;
}

/**
 *
 * @param dataset
 * @param actor
 */
function prepareRollVariables(dataset, actor) {
  actor.rollInfo.init(dataset, actor);
  // Log(false, `Roll data: ${JSON.stringify(actor.rollInfo)}`);
}

export class RollWindow extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(data, buttons, options) {
    options.window = super(options);
    this.data = data;
    this.buttons = buttons;
    this.resolver = null;
  }

  data = {};
  buttons = {};

  static DEFAULT_OPTIONS = {
    id: "arm5e-roll",
    form: {
      submitOnChange: true,
      closeOnSubmit: false
    },
    // classes: ["arm5e-roll"],
    window: {
      contentClasses: ["standard-form", "arm5e-roll"]
    },
    tag: "form",
    actions: {
      stressRoll: RollWindow.stressRoll,
      simpleRoll: RollWindow.simpleRoll,
      explodingRoll: RollWindow.explodingRoll,
      botchingRoll: RollWindow.botchingRoll,
      cancel: RollWindow.onCancel,
      altAction: RollWindow.onAltAction
    }
  };

  static PARTS = {
    header: { template: "systems/arm5e/templates/roll/parts/roll-header.hbs" },
    options: { template: "systems/arm5e/templates/roll/roll-options.hbs" },
    combat: {
      template: "systems/arm5e/templates/roll/roll-combat.hbs",
      templates: [
        "systems/arm5e/templates/roll/parts/combat-attack.hbs",
        "systems/arm5e/templates/roll/parts/combat-defense.hbs",
        "systems/arm5e/templates/roll/parts/combat-init.hbs"
      ]
    },
    characteristic: { template: "systems/arm5e/templates/roll/roll-characteristic.hbs" },
    magic: {
      template: "systems/arm5e/templates/roll/roll-magic.hbs",
      templates: [
        "systems/arm5e/templates/roll/parts/penetration-options.hbs",
        "systems/arm5e/templates/actor/parts/actor-voice-and-gestures.hbs"
      ]
    },
    spell: {
      template: "systems/arm5e/templates/roll/roll-spell.hbs",
      templates: [
        "systems/arm5e/templates/roll/parts/penetration-options.hbs",
        "systems/arm5e/templates/actor/parts/actor-voice-and-gestures.hbs"
      ]
    },
    supernatural: { template: "systems/arm5e/templates/roll/roll-supernatural.hbs" },
    aging: { template: "systems/arm5e/templates/roll/roll-aging.hbs" },
    crisis: { template: "systems/arm5e/templates/roll/roll-aging-crisis.hbs" },
    twilightControl: { template: "systems/arm5e/templates/roll/roll-twilightControl.hbs" },
    twilightStrength: { template: "systems/arm5e/templates/roll/roll-twilightStrength.hbs" },
    twilightComplexity: { template: "systems/arm5e/templates/roll/roll-twilightComplexity.hbs" },
    twilightUnderstanding: {
      template: "systems/arm5e/templates/roll/roll-twilightUnderstanding.hbs"
    },
    damage: { template: "systems/arm5e/templates/roll/roll-damage.hbs" },
    soak: { template: "systems/arm5e/templates/roll/roll-soak.hbs" },
    footer: { template: "systems/arm5e/templates/roll/parts/roll-footer.hbs" },
    buttons: { template: "systems/arm5e/templates/roll/parts/roll-buttons.hbs" }
  };

  /** @override */
  _configureRenderOptions(options) {
    // This fills in `options.parts` with an array of ALL part keys by default
    // So we need to call `super` first
    super._configureRenderOptions(options);
    // Completely overriding the parts
    options.parts = ["header"];
    // Don't show the other tabs if only limited view
    // if (this.document.limited) return;
    // Keep in mind that the order of `parts` *does* matter
    // So you may need to use array manipulation
    switch (this.data.rollInfo.type) {
      case "option":
        options.parts.push("options");
        break;
      case "char":
      case "ability":
        options.parts.push("characteristic");
        break;
      case "attack":
      case "defense":
      case "init":
        options.parts.push("combat");
        break;
      case "damage":
        options.parts.push("damage");
        break;
      case "soak":
        options.parts.push("soak");
        break;
      case "magic":
      case "spell":
        options.parts.push("spell");
        break;
      case "spont":
        options.parts.push("magic");
        break;
      case "supernatural":
        options.parts.push("supernatural");
        break;
      case "aging":
        options.parts.push("aging");
        break;
      case "crisis":
        options.parts.push("crisis");
        break;
      case "twilight_control":
        options.parts.push("twilightControl");
        break;
      case "twilight_strength":
        options.parts.push("twilightStrength");
        break;
      case "twilight_complexity":
        options.parts.push("twilightComplexity");
        break;
      case "twilight_understanding":
        options.parts.push("twilightUnderstanding");
        break;
    }
    options.parts.push("footer");
    options.parts.push("buttons");
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.buttons = this.buttons;
    return context;
  }

  /**
   * Prepare context that is specific to only a single rendered part.
   **/
  async _preparePartContext(partId, context) {
    switch (partId) {
      case "header": {
        if (["damage", "soak"].includes(this.data.rollInfo.type)) {
          context.header = "Damage_Soak";
        } else if (
          [
            "twilight_control",
            "twilight_strength",
            "twilight_complexity",
            "twilight_understanding"
          ].includes(this.data.rollInfo.type)
        ) {
          context.header = "Twilight_rolls";
        } else if (["aging", "crisis"].includes(this.data.rollInfo.type)) {
          context.header = "Aging";
        } else {
          context.header = "Rolls";
        }
        break;
      }
      case "footer": {
        if (["damage", "soak"].includes(this.data.rollInfo.type)) {
          context.footer = "Damage_Soak";
        } else if (
          [
            "twilight_control",
            "twilight_strength",
            "twilight_complexity",
            "twilight_understanding"
          ].includes(this.data.rollInfo.type)
        ) {
          context.footer = "Twilight_rolls";
        } else if (["aging", "crisis"].includes(this.data.rollInfo.type)) {
          context.footer = "Aging";
        } else {
          context.footer = "Rolls";
        }
        break;
      }
      case "buttons": {
        context.buttons = this.buttons;
        break;
      }
      default: {
        context = this.data;
      }
    }

    return context;
  }

  /**
   * Handle changes to an input element within the form.
   * @protected
   */
  _onChangeForm(formConfig, event) {
    super._onChangeForm(formConfig, event);
  }

  async _onRender(context, options) {
    this.element.querySelectorAll(".expend").forEach((el) => {
      el.addEventListener("click", (ev) => {
        ev.currentTarget.nextElementSibling.classList.toggle("hide");
      });
    });

    this.element.querySelectorAll(".select-on-focus").forEach((el) => {
      el.addEventListener("focus", (ev) => {
        ev.preventDefault();
        ev.currentTarget.select();
      });
    });

    if (this.data.rollInfo.listeners) {
      this.data.rollInfo.listeners(this.data, this.element);
    }
  }

  static async stressRoll(event, target) {
    event.preventDefault();
    getFormData(this.element, this.data);
    const res = await stressDie(
      this.data,
      this.data.rollInfo.type,
      0,
      this.data.rollInfo.properties.CALLBACK,
      this.data.rollInfo.botchNumber
    );
    if (this.resolver) this.resolver(res);
    this.close();
  }
  static async simpleRoll(event, target) {
    event.preventDefault();
    getFormData(this.element, this.data);
    const res = await simpleDie(
      this.data,
      this.data.rollInfo.type,
      this.data.rollInfo.properties.CALLBACK
    );
    if (this.resolver) this.resolver(res);
    this.close();
  }

  static async onAltAction(event, target) {
    event.preventDefault();
    getFormData(this.element, this.data);
    if (this.data.rollInfo.properties.ALT_ACTION) {
      const res = await this.data.rollInfo.properties.ALT_ACTION(
        this.data,
        0,
        this.data.rollInfo.properties.CALLBACK
      );
    }
    if (this.resolver) this.resolver(res);
    this.close();
  }

  static async explodingRoll(event, target) {
    event.preventDefault();
    getFormData(this.element, this.data);
    const res = await stressDie(
      this.data,
      this.data.rollInfo.type,
      1,
      this.data.rollInfo.properties.CALLBACK,
      this.data.rollInfo.botchNumber
    );
    if (this.resolver) this.resolver(res);
    this.close();
  }

  static async botchingRoll(event, target) {
    event.preventDefault();
    getFormData(this.element, this.data);
    const res = await stressDie(
      this.data,
      this.data.rollInfo.type,
      2,
      this.data.rollInfo.properties.CALLBACK,
      this.data.rollInfo.botchNumber
    );
    if (this.resolver) this.resolver(res);
    this.close();
  }

  static async onCancel(event, target) {
    event.preventDefault();
    if (this.resolver) this.resolver(null);
    this.close();
  }
}

export class SpellRollWindow extends RollWindow {
  constructor(data, options) {
    const buttons = [];
  }
}
//////////////////////
// NO ROLL WINDOW CLASS
//////////////////////

export class NoRollWindow extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(data, buttons, options) {
    for (const button of buttons) {
      button.cssClass = "dialog-button";
    }

    super(options);
    this.data = data;
    this.buttons = buttons;
  }

  data = {};
  buttons = {};

  static DEFAULT_OPTIONS = {
    id: "arm5e-roll",
    form: {
      submitOnChange: true,
      closeOnSubmit: false
    },
    classes: ["arm5e-roll"],
    window: {
      contentClasses: ["standard-form"]
    },
    tag: "form"
  };

  static PARTS = {
    header: { template: "systems/arm5e/templates/roll/parts/roll-header.hbs" },
    footer: { template: "systems/arm5e/templates/roll/parts/roll-footer.hbs" },
    buttons: { template: "systems/arm5e/templates/roll/parts/roll-buttons.hbs" }
  };

  async _onRender(context, options) {
    this.element.querySelectorAll(".clickable").forEach((el) => {
      el.addEventListener("click", (ev) => {
        ev.currentTarget.nextElementSibling.classList.toggle("hide");
      });
    });

    this.element.querySelectorAll(".select-on-focus").forEach((el) => {
      el.addEventListener("focus", (ev) => {
        ev.preventDefault();
        ev.currentTarget.select();
      });
    });
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.buttons = this.buttons;
    return context;
  }

  /**
   * Prepare context that is specific to only a single rendered part.
   **/
  async _preparePartContext(partId, context) {
    switch (partId) {
      case "body": {
        context = this.data;
        break;
      }
      case "header": {
        context.header = "Confirmation";
        break;
      }
      case "footer": {
        context.footer = "Confirmation";
        break;
      }
      case "buttons": {
        context.buttons = this.buttons;
        break;
      }
    }

    return context;
  }

  /**
   * Handle changes to an input element within the form.
   * @protected
   */
  _onChangeForm(formConfig, event) {
    event.preventDefault();

    super._onChangeForm(formConfig, event);
  }

  static async onCancel(event, target) {
    this.close();
  }
}

//////////////////////////////////////
// NO ROLL WINDOW FOR POWER USE
//////////////////////////////////////

export class UsePowerRollWindow extends NoRollWindow {
  constructor(data, options) {
    const buttons = [
      { action: "use", icon: "fas fa-check", label: "arm5e.dialog.powerUse" },
      { action: "cancel", icon: "fas fa-ban", label: "arm5e.dialog.button.cancel" }
    ];
    super(data, buttons, options);
  }
  static PARTS = {
    header: super.PARTS.header,
    body: {
      template: "systems/arm5e/templates/roll/powerUse.hbs",
      templates: ["systems/arm5e/templates/roll/parts/penetration-options.hbs"]
    },
    footer: super.PARTS.footer,
    buttons: super.PARTS.buttons
  };

  async _onRender(context, options) {
    await super._onRender(context, options);

    this.element.querySelector(".power-cost")?.addEventListener("change", async (event) => {
      const dataset = getDataset(event);
      const val = Number(event.target.value);
      const e = this.element.getElementsByClassName("power-level")[0];
      e.innerHTML = game.i18n.format("arm5e.sheet.powerLevel", { res: 5 * val });
    });

    this.element.querySelector(".power-form")?.addEventListener("change", async (event) => {
      const dataset = getDataset(event);
      const val = event.target.value;
      const e = this.element.getElementsByClassName("power-label")[0];
      e.value = e.value.replace(/\((.+)\)/i, `(${CONFIG.ARM5E.magic.arts[val].short})`);
    });
  }

  static DEFAULT_OPTIONS = {
    id: "arm5e-use-power",
    actions: {
      use: UsePowerRollWindow.onUse,
      cancel: NoRollWindow.onCancel
    }
  };

  static async onUse(event, target) {
    event.preventDefault();
    getFormData(this.element, this.data);
    if (this.data.system.features.hasMight) {
      await noRoll(this.data, 1, changeMightCallback);
    } else {
      await noRoll(this.data, 1, loseFatigueLevelCallback);
    }
  }
}

//////////////////////////////////////
// NO ROLL WINDOW FOR MAGIC ITEM USE
//////////////////////////////////////

export class UseMagicItemWindow extends NoRollWindow {
  constructor(data, options) {
    const buttons = [
      { action: "use", icon: "fas fa-check", label: "arm5e.generic.confirm" },
      { action: "cancel", icon: "fas fa-ban", label: "arm5e.dialog.button.cancel" }
    ];
    super(data, buttons, options);
  }
  static PARTS = {
    header: super.PARTS.header,
    body: { template: "systems/arm5e/templates/roll/magic-itemUse.hbs" },
    footer: super.PARTS.footer,
    buttons: super.PARTS.buttons
  };

  static DEFAULT_OPTIONS = {
    id: "arm5e-use-magic-item",
    actions: {
      use: UseMagicItemWindow.onUse,
      cancel: NoRollWindow.onCancel
    }
  };

  async _onRender(context, options) {
    await super._onRender(context, options);

    this.element.querySelector(".power-cost")?.addEventListener("change", async (event) => {
      const dataset = getDataset(event);
      const val = Number(event.target.value);
      const e = this.element.getElementsByClassName("power-level")[0];
      e.innerHTML = game.i18n.format("arm5e.sheet.powerLevel", { res: 5 * val });
    });

    this.element.querySelector(".power-form")?.addEventListener("change", async (event) => {
      const dataset = getDataset(event);
      const val = event.target.value;
      const e = this.element.getElementsByClassName("power-label")[0];
      e.value = e.value.replace(/\((.+)\)/i, `(${CONFIG.ARM5E.magic.arts[val].short})`);
    });
  }

  static async onUse(event, target) {
    event.preventDefault();
    getFormData(this.element, this.data);
    await noRoll(this.data, 1, useItemCharge);
  }
}

/**
 *
 * @param actor
 */
export async function getRollDialog(actor) {
  const buttons = getDialogButtons(actor);
  let options = {
    window: { title: actor.rollInfo.title ? actor.rollInfo.title : actor.rollInfo.properties.TITLE }
  };
  return await new Promise((resolve) => {
    const dialog = new RollWindow(actor, buttons, options);
    dialog.resolver = resolve; // Store resolver
    dialog.render(true);
  });
}

//////////////////////////////
// DIALOG BUTTONS
//////////////////////////////

function getDialogButtons(actor) {
  const rollInfo = actor.rollInfo;
  const rollProperties = rollInfo.properties;
  const callback = rollProperties.CALLBACK;
  let btns = [];
  let mode = 0;

  const rollMode = rollProperties.MODE;

  if (rollMode & ROLL_MODES.STRESS) {
    btns.push({
      label: game.i18n.localize(
        rollProperties.ACTION_LABEL ? rollProperties.ACTION_LABEL : "arm5e.dialog.button.stressdie"
      ),
      action: "stressRoll",
      icon: "fas fa-check",
      cssClass: "dialog-button"
    });
  }
  if (rollMode & ROLL_MODES.SIMPLE) {
    btns.push({
      label: game.i18n.localize(
        rollProperties.ACTION_LABEL ? rollProperties.ACTION_LABEL : "arm5e.dialog.button.simpledie"
      ),
      icon: "fas fa-check",
      action: "simpleRoll",
      cssClass: "dialog-button"
    });
  }

  if (rollProperties.ALT_ACTION) {
    btns.push({
      label: game.i18n.localize(rollProperties.ALT_ACTION_LABEL),
      action: "altAction",
      icon: "fas fa-check",
      cssClass: "dialog-button"
    });
    // const btnLabel = rollProperties.ALT_ACTION_LABEL;
    // const rollAlteration = rollProperties.ALTER_ROLL;
    // altBtn = {
    //   icon: "fas fa-check",
    //   label: game.i18n.localize(btnLabel),
    //   callback: async (html) => {
    //     getFormData(html[0], actor);
    //     if (rollAlteration) {
    //       rollAlteration(actor);
    //     }
    //     resolve(await altAction(actor, mode, callback));
    //   }
    // };
  }

  if (true) {
    // if (game.modules.get("_dev-mode")?.api?.getPackageDebugValue(ARM5E.SYSTEM_ID)) {
    btns.push({
      label: "DEV Explode",
      action: "explodingRoll",
      cssClass: "dialog-button"
    });
    btns.push({
      label: "DEV Botch",
      action: "botchingRoll",
      cssClass: "dialog-button"
    });
  }

  btns.push({
    label: game.i18n.localize("arm5e.dialog.button.cancel"),
    icon: "fas fa-ban",
    action: "cancel",
    cssClass: "dialog-button"
  });

  return btns;
}

// btns.yes = {
//   icon: "<i class='fas fa-check'></i>",
//   label: game.i18n.localize(
//     rollProperties.ACTION_LABEL ? rollProperties.ACTION_LABEL : "arm5e.dialog.button.stressdie"
//   ),
//   callback: async (html) => {
//     getFormData(html[0], actor);
//     resolve(await stressDie(actor, rollProperties.type, mode, callback, rollInfo.botchNumber));
//   }
// };
//   if (altAction) {
//     btns.alt = altBtn;
//   }
//   if (rollMode & ROLL_MODES.SIMPLE) {
//     btns.no = {
//       icon: "<i class='fas fa-check'></i>",
//       label: game.i18n.localize(
//         rollProperties.ACTION_LABEL
//           ? rollProperties.ACTION_LABEL
//           : "arm5e.dialog.button.simpledie"
//       ),
//       callback: async (html) => {
//         getFormData(html, actor);
//         resolve(await simpleDie(actor, rollProperties.type, callback));
//       }
//     };
//   } else {
//     btns.no = {
//       icon: "<i class='fas fa-ban'></i>",
//       label: game.i18n.localize("arm5e.dialog.button.cancel"),
//       callback: async (html) => {
//         await rollInfo.reset();
//       }
//     };
//   }
// } else if (rollMode & ROLL_MODES.SIMPLE) {
//   // Simple die only
//   btns.yes = {
//     icon: "<i class='fas fa-check'></i>",
//     label: game.i18n.localize(
//       rollProperties.ACTION_LABEL ? rollProperties.ACTION_LABEL : "arm5e.dialog.button.simpledie"
//     ),
//     callback: async (html) => {
//       getFormData(html[0], actor);
//       resolve(await simpleDie(actor, rollProperties.type, callback));
//     }
//   };
//   if (altAction) {
//     btns.alt = altBtn;
//   }
// btns.no = {
//   icon: "<i class='fas fa-ban'></i>",
//   label: game.i18n.localize("arm5e.dialog.button.cancel"),
//   callback: async (html) => {
//     rollInfo.reset();
//   }
// };
// } else {
//   //no roll
//   btns.yes = {
//     icon: "<i class='fas fa-check'></i>",
//     label: game.i18n.localize(
//       rollProperties.ACTION_LABEL ? rollProperties.ACTION_LABEL : "arm5e.dialog.powerUse"
//     ),
//     callback: async (html) => {
//       getFormData(html[0], actor);
//       resolve(await noRoll(actor, 1, null));
//     }
//   };
//   btns.no = {
//     icon: "<i class='fas fa-ban'></i>",
//     label: game.i18n.localize("arm5e.dialog.button.cancel"),
//     callback: null
//   };
// }

// new Dialog(
//   {
//     title: game.i18n.localize(title),
//     content: html,
//     buttons: {
//       ...btns,
//       ...getDebugButtonsIfNeeded(actor, callback)
//     },
//     render: actor.rollInfo.listeners
//   },
//   {
//     classes: ["arm5e-dialog", "dialog"],
//     height: "780px",
//     width: "400px"
//   }
// ).render(true);
// }

// /**
//  *
//  * @param dataset
//  * @param template
//  * @param actor
//  */
// async function renderRollTemplate(dataset, actor) {
//   if (!template) {
//     return false;
//   }
//   actor.system.roll = actor.rollInfo;
//   actor.config = CONFIG.ARM5E;
//   actor.selection = actor.rollInfo.selection;
//   actor.part = actor.rollInfo.part;
//   // const renderedTemplate = await renderTemplate(template, actor);
//   return message;
// }

/**
 *
 * @param attacker
 * @param roll
 * @param message
 */
async function combatAttack(attacker, roll, message) {
  await applyImpact(attacker, roll, message);
}

/**
 *
 * @param defender
 * @param roll
 * @param message
 */
async function combatDefense(defender, roll, message) {
  await applyImpact(defender, roll, message);
}

export async function _applyImpact(actor, roll, message) {
  const updateData = {};
  const messageUpdate = {};

  let fatigueUse = actor.rollInfo.impact.fatigue.use;
  let fatigueFail = actor.rollInfo.impact.fatigue.fail;
  let fatiguePartial = actor.rollInfo.impact.fatigue.partial;
  let defaultImpact = {
    fatigueLevelsLost: 0,
    fatigueLevelsPending: 0,
    fatigueLevelsFail: 0,
    woundGravity: 0,
    applied: false
  };
  if (!fatigueUse && !fatigueFail && !fatiguePartial) {
    defaultImpact.applied = roll.botches > 0;
    messageUpdate["system.impact"] = defaultImpact;
  } else {
    // remove fatigue on use
    if (fatigueUse) {
      let res = await actor.loseFatigueLevel(fatigueUse);
      defaultImpact.fatigueLevelsLost = fatigueUse;
    }

    // check if the roll failed

    // if (actor.rollInfo.rollFailed(roll)) {
    if (fatigueFail || fatiguePartial) {
      let res;
      if (message.system.failedRoll()) {
        res = actor._changeFatigueLevel(updateData, fatiguePartial + fatigueFail);
        if (res.woundGravity) {
          if (res.fatigueLevels <= fatiguePartial) {
            // overflow absorbed by partial fatigue
            defaultImpact.fatigueLevelsPending = fatiguePartial - res.fatigueLevels;
            defaultImpact.fatigueLevelsFail = 0;
          } else {
            defaultImpact.fatigueLevelsPending = fatiguePartial;
            if (res.fatigueLevels - fatiguePartial <= fatigueFail) {
              defaultImpact.fatigueLevelsFail = fatigueFail - (res.fatigueLevels - fatiguePartial);
            } else {
              defaultImpact.fatigueLevelsFail = fatigueFail;
            }
          }
        } else {
          defaultImpact.fatigueLevelsFail = fatigueFail;
          defaultImpact.fatigueLevelsPending = fatiguePartial;
        }
      } else {
        res = actor._changeFatigueLevel(updateData, fatiguePartial);
        defaultImpact.fatigueLevelsFail = 0;
        defaultImpact.fatigueLevelsPending = res.fatigueLevels;
      }

      defaultImpact.woundGravity = res.woundGravity;
    }
  }
  // the actor can still change the situation by spending confidence.
  if (actor.canUseConfidencePoint() && message.system.confidence.allowed && !roll.botches) {
    // do not update fatigue yet.
    delete updateData["system.fatigueCurrent"];
    updateData["system.states.confidencePrompt"] = true;
  } else {
    if (defaultImpact.woundGravity) {
      await actor.changeWound(
        1,
        CONFIG.ARM5E.recovery.rankMapping[defaultImpact.woundGravity],
        game.i18n.localize("arm5e.sheet.fatigue.overflow")
      );
    }
    defaultImpact.fatigueLevelsLost +=
      defaultImpact.fatigueLevelsPending + defaultImpact.fatigueLevelsFail;
    defaultImpact.fatigueLevelsPending = 0;
    defaultImpact.fatigueLevelsFail = 0;
    defaultImpact.applied = true;
  }
  messageUpdate["system.impact"] = defaultImpact;

  message.updateSource(messageUpdate);
  log(false, "_applyImpact impact", message.system.impact);
  return updateData;
}

// TODO
async function applyImpact(actor, roll, message) {
  const updateData = await _applyImpact(actor, roll, message);
  await actor.update(updateData);
}

/**
 *
 * @param html
 * @param actor
 */
export function getFormData(html, actor) {
  let find = html.querySelector(".SelectedCharacteristic");
  if (find) {
    actor.rollInfo.characteristic = find.value;
  }
  find = html.querySelector(".SelectedAbility");
  if (find) {
    if (find.value == "None") {
      const dataset = {
        name: actor.rollInfo.name,
        roll: "char",
        characteristic: actor.rollInfo.characteristic,
        modifier: actor.rollInfo.modifier
      };
      actor.rollInfo.init(dataset, actor);
      // Actor.rollInfo.ability.score = 0;
      // actor.rollInfo.ability.name = "";
      // actor.rollInfo.type = "char";
    } else {
      const dataset = {
        name: actor.rollInfo.name,
        roll: "ability",
        ability: find.value,
        defaultcharacteristic: actor.rollInfo.characteristic,
        modifier: actor.rollInfo.modifier
      };
      actor.rollInfo.init(dataset, actor);

      // Const ability = actor.items.get(find[0].value);
      // actor.rollInfo.ability.score = ability.system.finalScore;
      // actor.rollInfo.ability.name = ability.name;
      // actor.rollInfo.type = "ability";
    }
  }

  find = html.querySelector(".abilitySpeciality");
  if (find) {
    actor.rollInfo.ability.specApply = find.checked;
  }

  find = html.querySelector(".enigmaSpeciality");
  if (find) {
    actor.rollInfo.twilight.enigma.specApply = find.checked;
  }

  find = html.querySelector(".SelectedTechnique");
  if (find) {
    actor.rollInfo.magic.technique.value = find.value;
    actor.rollInfo.magic.technique.label = ARM5E.magic.techniques[find.value].label;
    actor.rollInfo.magic.technique.score = parseInt(
      actor.system.arts.techniques[find.value].finalScore
    );

    if (actor.system.arts.techniques[find.value].deficient) {
      actor.rollInfo.magic.technique.deficiency = true;
    } else {
      actor.rollInfo.magic.technique.deficiency = false;
    }
  }

  find = html.querySelector(".SelectedForm");
  if (find) {
    actor.rollInfo.magic.form.value = find.value;
    actor.rollInfo.magic.form.label = ARM5E.magic.forms[find.value].label;
    actor.rollInfo.magic.form.score = parseInt(actor.system.arts.forms[find.value].finalScore);
    if (actor.system.arts.forms[find.value].deficient) {
      actor.rollInfo.magic.form.deficiency = true;
    } else {
      actor.rollInfo.magic.form.deficiency = false;
    }
  }

  find = html.querySelector(".SelectedAura");
  if (find) {
    actor.rollInfo.environment.aura.modifier = Number(find.value) ?? 0;
  }

  find = html.querySelector(".SelectedLevel");
  if (find) {
    actor.rollInfo.magic.level = Number(find.value) ?? 0;
  }

  find = html.querySelector(".SelectedModifier");
  if (find) {
    actor.rollInfo.modifier = Number(find.value) ?? 0;
    // Negative modifier
    if ([ROLL_PROPERTIES.CRISIS.VAL].includes(actor.rollInfo.type)) {
      actor.rollInfo.modifier = -actor.rollInfo.modifier;
    }
  }

  find = html.querySelector(".SelectedAdvantage");
  if (find) {
    actor.rollInfo.combat.advantage = Number(find.value) ?? 0;
  }

  find = html.querySelector(".SelectedWarpingPoints");
  if (find) {
    actor.rollInfo.twilight.warpingPts = Number(find.value) ?? 2;
  }

  find = html.querySelector(".SelectedFocus");
  if (find) {
    actor.rollInfo.magic.focus = find.checked;
  }

  find = html.querySelector(".SelectedYear");
  if (find) {
    actor.rollInfo.environment.year = Number(find.value) ?? 1220;
  }

  find = html.querySelector(".SelectedDifficulty");
  if (find) {
    actor.rollInfo.difficulty = parseInt(find.value ?? 0);
  }

  if (
    [ROLL_PROPERTIES.SPONT.VAL, ROLL_PROPERTIES.MAGIC.VAL, ROLL_PROPERTIES.SPELL.VAL].includes(
      actor.rollInfo.type
    ) ||
    actor.rollInfo.type == "power"
  ) {
    find = html.querySelector(".penSpeciality");
    if (find) {
      actor.rollInfo.penetration.specApply = find.checked;
    }
    find = html.querySelector(".spellMastery");
    if (find) {
      actor.rollInfo.penetration.penetrationMastery = find.checked;
    }
    find = html.querySelector(".multiplierBonusArcanic");
    if (find) {
      actor.rollInfo.penetration.multiplierBonusArcanic = Number(find.value) ?? 0;
    }

    find = html.querySelector(".multiplierBonusSympathic");
    if (find) {
      actor.rollInfo.penetration.multiplierBonusSympathic = Number(find.value) ?? 0;
    }

    find = html.querySelector(".power-cost");
    if (find) {
      actor.rollInfo.power.cost = Number(find.value) ?? 0;
      actor.rollInfo.power.penetrationPenalty = actor.rollInfo.power.cost * 5;
    }

    find = html.querySelector(".power-label");
    if (find) {
      actor.rollInfo.label = find.value ?? actor.rollInfo.label;
    }

    find = html.querySelector(".power-form");
    if (find) {
      actor.rollInfo.power.form = find.value ?? actor.rollInfo.power.form;
    }
  } else if ([ROLL_PROPERTIES.DAMAGE.VAL, ROLL_PROPERTIES.SOAK.VAL].includes(actor.rollInfo.type)) {
    find = html.querySelector(".SelectedDamage");
    if (find) {
      actor.rollInfo.difficulty = parseInt(find.value);
    }

    find = html.querySelector(".SelectedSource");
    if (find) {
      actor.rollInfo.damage.source = find.value;
    }
    find = html.querySelector(".SelectedFormDamage");
    if (find) {
      actor.rollInfo.damage.form = find.value;
    }

    find = html.querySelector(".ignoreArmor");
    if (find) {
      actor.rollInfo.damage.ignoreArmor = find.checked;
    }

    find = html.querySelector(".formRes");
    if (find) {
      actor.rollInfo.damage.formRes = parseInt(find.value);
    }

    find = html.querySelector(".natRes");
    if (find) {
      actor.rollInfo.damage.natRes = parseInt(find.value);
    }
  }
  let idx = 0;
  for (let optEffect of actor.rollInfo.optionalBonuses) {
    find = html.querySelector(`.SelectedOptional${idx}`);
    if (find) {
      actor.rollInfo.optionalBonuses[idx].active = find.checked;
    }
    idx++;
  }

  return actor;
}

export { prepareRollVariables, ROLL_MODES, ROLL_MODIFIERS, ROLL_PROPERTIES, getRollTypeProperties };
