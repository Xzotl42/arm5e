import { calculateWound, log } from "../tools.js";
import { stressDie } from "../dice.js";
import { Arm5eChatMessage } from "./chat-message.js";

// export function doubleAbility(actor) {
//   actor.rollInfo.ability.score *= 2;
// }

export async function exertSelf(actor, mode, callback) {
  log(false, "Exert self in combat");

  actor.rollInfo.combat.exertion = true;

  await stressDie(actor, actor.rollInfo.type, callback, mode, -1);

  await actor.loseFatigueLevel(1);
}

export function computeCombatStats(actor) {
  return {
    init:
      actor.system.combat.init -
      actor.system.combat.overload +
      actor.system.characteristics.qik.value,
    attack:
      actor.system.combat.atk +
      actor.system.combat.ability +
      actor.system.characteristics.dex.value,
    defense:
      actor.system.combat.dfn +
      actor.system.combat.ability +
      actor.system.characteristics.qik.value,
    damage: actor.system.combat.dam + actor.system.characteristics.str.value,
    soak:
      actor.system.combat.prot +
      actor.system.characteristics.sta.value +
      actor.system.bonuses.traits.soak
  };
}

export class QuickCombat extends FormApplication {
  constructor(data, options) {
    super(data, options);

    Hooks.on("closeApplication", (app, html) => this.onClose(app));
  }
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["arm5e-dialog", "dialog"],
      title: game.i18n.localize("arm5e.sheet.combat.label"),
      template: "systems/arm5e/templates/generic/quick-combat.html",
      width: "auto",
      height: "auto",
      submitOnChange: true,
      closeOnSubmit: false
    });
  }

  async _render(force, options = {}) {
    // Parent class rendering workflow
    await super._render(force, options);

    // Register the active Application with the referenced Documents
    this.object.actor.apps[this.appId] = this;
  }

  onClose(app) {
    if (this.object?.actor?.apps[app.appId]) {
      delete this.object.actor.apps[app.appId];
    }
  }

  async getData(options = {}) {
    let sys = {
      combat: this.object.actor.system.combat,
      characteristics: this.object.actor.system.characteristics
    };
    const context = {
      name: this.object.name,
      system: sys,
      combat: computeCombatStats(this.object.actor)
    };
    log(false, `QuickCombat: ${JSON.stringify(context)}`);
    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find(".rollable").click(async (event) => await this.object.actor.sheet._onRoll(event));
    html
      .find(".soak-damage")
      .click(async (event) => await this.object.actor.sheet._onSoakDamage(event));
    html
      .find(".damage")
      .click(async (event) => await this.object.actor.sheet._onCalculateDamage(event));
  }
}
export async function quickCombat(tokenName, actor) {
  if (!actor.isCharacter()) return;

  const combat = new QuickCombat(
    {
      name: tokenName,
      actor: actor
    },
    {}
  );
  const res = await combat.render(true);
}

export class QuickVitals extends FormApplication {
  constructor(data, options) {
    super(data, options);

    Hooks.on("closeApplication", (app, html) => this.onClose(app));
  }
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["arm5e-dialog", "dialog"],
      title: game.i18n.localize("arm5e.sheet.vitals"),
      template: "systems/arm5e/templates/generic/quick-vitals.html",
      width: 200,
      height: "auto",
      submitOnChange: true,
      closeOnSubmit: false
    });
  }

  async _render(force, options = {}) {
    // Parent class rendering workflow
    await super._render(force, options);

    // Register the active Application with the referenced Documents
    this.object.actor.apps[this.appId] = this;
  }

  onClose(app) {
    if (this.object?.actor?.apps[app.appId] != undefined) {
      delete this.object.actor.apps[app.appId];
    }
  }

  async getData(options = {}) {
    const context = {
      name: this.object.name,
      actor: this.object.actor,
      woundCfg: CONFIG.ARM5E.character.wounds,
      conscious: this.object.actor.system.fatigueCurrent < this.object.actor.system.fatigueMaxLevel
    };
    log(false, `Vitals: ${context}, Fatigue: ${context.actor.system.fatigueCurrent}`);
    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find(".rest").click(async () => {
      await this.object.actor.rest();
      this.render();
    });
    html.find(".addFatigue").click(async () => {
      await this.object.actor.loseFatigueLevel(1, false);
      this.render();
    });
    html.find(".removeFatigue").click(async () => {
      await this.object.actor.recoverFatigueLevel(1);
      this.render();
    });
    html.find(".addWound").click(async (event) => {
      event.preventDefault();
      const dataset = event.currentTarget.dataset;
      await this.object.actor.changeWound(1, dataset.type);
      this.render();
    });
    html.find(".recovery").click(async (event) => {
      event.preventDefault();
      const dataset = event.currentTarget.dataset;
      await this.object.actor.sheet.render(true);
      this.render();
    });
  }
}

export async function quickVitals(tokenName, actor) {
  if (!actor.isCharacter()) return;

  const vitals = new QuickVitals(
    {
      name: tokenName,
      actor: actor
    },
    {}
  ); // data, options
  const res = await vitals.render(true);
}

export async function combatDamage(selector, actor) {
  let damage = parseInt(selector.find('input[name$="modifier"]').val());
  const messageModifier = `${game.i18n.localize("arm5e.sheet.modifier")} (${damage})`;
  let details = "";
  const strength = parseInt(selector.find('label[name$="strength"]').attr("value") || 0);
  const weapon = parseInt(selector.find('label[name$="weapon"]').attr("value") || 0);
  const advantage = parseInt(selector.find('input[name$="advantage"]').val());
  const formDam = selector.find('select[name$="formDamage"]').val() || "";

  const messageStrength = `${game.i18n.localize("arm5e.sheet.strength")} (${strength})`;
  const messageWeapon = `${game.i18n.localize("arm5e.sheet.damage")} (${weapon})`;
  const messageAdvantage = `${game.i18n.localize("arm5e.sheet.advantage")} (${advantage})`;
  damage += strength + weapon + advantage;
  details = ` ${messageStrength}<br/> ${messageWeapon}<br/> ${messageAdvantage}<br/> ${messageModifier}<br/>`;
  let title = "";
  const messageDamage = `<h4 class="dice-total">${damage}</h4>`;
  const messageData = {
    type: "combat",
    content: messageDamage,
    flavor: "",

    speaker: ChatMessage.getSpeaker({
      actor
    }),
    system: {
      label: game.i18n.localize("arm5e.sheet.damage"),
      roll: { details: details, type: "damage" },
      confidence: {
        allowed: false
      },
      combat: { formDamage: formDam }
    }
  };
  const message = new Arm5eChatMessage(messageData);
  message.system.enrichMessageData(actor);

  Arm5eChatMessage.create(message.toObject());
}

// WIP
export async function nonCombatDamage(selector, actor) {
  let damage = parseInt(selector.find('input[name$="modifier"]').val());
  const messageModifier = `${game.i18n.localize("arm5e.sheet.modifier")} (${damage})`;
  let details = "";
  const strength = parseInt(selector.find('label[name$="strength"]').attr("value") || 0);
  const weapon = parseInt(selector.find('label[name$="weapon"]').attr("value") || 0);
  const advantage = parseInt(selector.find('input[name$="advantage"]').val());
  const messageStrength = `${game.i18n.localize("arm5e.sheet.strength")} (${strength})`;
  const messageWeapon = `${game.i18n.localize("arm5e.sheet.damage")} (${weapon})`;
  const messageAdvantage = `${game.i18n.localize("arm5e.sheet.advantage")} (${advantage})`;
  damage += strength + weapon + advantage;
  details = ` ${messageStrength}<br/> ${messageWeapon}<br/> ${messageAdvantage}<br/> ${messageModifier}<br/>`;
  let title = "";
  const messageDamage = `<h4 class="dice-total">${damage}</h4>`;
  ChatMessage.create({
    type: "combat",
    content: messageDamage,
    flavor: "",
    speaker: ChatMessage.getSpeaker({
      actor
    }),
    system: {
      label: game.i18n.localize("arm5e.sheet.damage"),
      roll: { details: details },
      confidence: {
        allowed: false
      }
    }
  });
}

export async function rolledDamage(soakData, actor) {
  const dataset = {
    roll: "option",
    name: game.i18n.localize("arm5e.sheet.soakRoll"),
    physicalcondition: false,
    modifier: -soakData.modifier,
    option1: soakData.damage,
    txtoption1: game.i18n.localize("arm5e.sheet.damage"),
    option4: soakData.prot,
    txtoption4: game.i18n.localize("arm5e.sheet.protection"),
    operator4: "-",
    option5: soakData.stamina,
    txtoption5: game.i18n.localize("arm5e.sheet.stamina"),
    operator5: "-"
  };

  if (soakData.natRes) {
    dataset.option2 = soakData.natRes;
    dataset.txtoption2 = game.i18n.localize("arm5e.sheet.natRes");
    dataset.operator2 = "-";
  }
  if (soakData.formRes) {
    dataset.option3 = soakData.formRes;
    dataset.txtoption3 = game.i18n.localize("arm5e.sheet.formRes");
    dataset.operator3 = "-";
  }

  if (soakData.bonus) {
    dataset.option6 = soakData.bonus;
    dataset.txtoption6 = game.i18n.localize("arm5e.sheet.soakBonus");
    dataset.operator6 = "-";
  }

  actor.rollInfo.init(dataset, actor);
  let roll = await stressDie(actor, "option", 16, null, 1);
  soakData.roll = roll.total - roll.offset;
  soakData.damageToApply -= soakData.roll;
}
export function buildDamageDataset(selector) {
  const dataset = {};

  // dataset.modifier = parseInt(selector.find('input[name$="modifier"]').val());
  // dataset.damage = parseInt(selector.find('input[name$="damage"]').val());
  // dataset.natRes = parseInt(selector.find('select[name$="natRes"]').val() || 0);
  // dataset.formRes = parseInt(selector.find('select[name$="formRes"]').val() || 0);
  // dataset.prot = parseInt(selector.find('label[name$="prot"]').attr("value") || 0);
  // dataset.bonus = parseInt(selector.find('label[name$="soak"]').attr("value") || 0);
  // dataset.stamina = parseInt(selector.find('label[name$="stamina"]').attr("value") || 0);
  // dataset.damageToApply =
  //   dataset.damage -
  //   dataset.modifier -
  //   dataset.prot -
  //   dataset.natRes -
  //   dataset.formRes -
  //   dataset.stamina -
  //   dataset.bonus;
  return dataset;
}

rolledSoak;
export async function rolledSoak(soakData, actor) {
  const dataset = {
    // roll: "option",
    // name: game.i18n.localize("arm5e.sheet.soakRoll"),
    // physicalcondition: false,
    // modifier: -soakData.modifier,
    // option1: soakData.damage,
    // txtoption1: game.i18n.localize("arm5e.sheet.damage"),
    // option4: soakData.prot,
    // txtoption4: game.i18n.localize("arm5e.sheet.protection"),
    // operator4: "-",
    // option5: soakData.stamina,
    // txtoption5: game.i18n.localize("arm5e.sheet.stamina"),
    // operator5: "-"
  };

  // if (soakData.natRes) {
  //   dataset.option2 = soakData.natRes;
  //   dataset.txtoption2 = game.i18n.localize("arm5e.sheet.natRes");
  //   dataset.operator2 = "-";
  // }
  // if (soakData.formRes) {
  //   dataset.option3 = soakData.formRes;
  //   dataset.txtoption3 = game.i18n.localize("arm5e.sheet.formRes");
  //   dataset.operator3 = "-";
  // }

  // if (soakData.bonus) {
  //   dataset.option6 = soakData.bonus;
  //   dataset.txtoption6 = game.i18n.localize("arm5e.sheet.soakBonus");
  //   dataset.operator6 = "-";
  // }

  // actor.rollInfo.init(dataset, actor);
  // let roll = await stressDie(actor, "option", 16, null, 1);
  // soakData.roll = roll.total - roll.offset;
  // soakData.damageToApply -= soakData.roll;
}
export function buildSoakDataset(selector) {
  const dataset = {};

  dataset.modifier = parseInt(selector.find('input[name$="modifier"]').val());
  dataset.damage = parseInt(selector.find('input[name$="damage"]').val());
  dataset.natRes = parseInt(selector.find('select[name$="natRes"]').val() || 0);
  dataset.formRes = parseInt(selector.find('select[name$="formRes"]').val() || 0);
  dataset.prot = parseInt(selector.find('label[name$="prot"]').attr("value") || 0);
  dataset.bonus = parseInt(selector.find('label[name$="soak"]').attr("value") || 0);
  dataset.stamina = parseInt(selector.find('label[name$="stamina"]').attr("value") || 0);
  dataset.damageToApply =
    dataset.damage -
    dataset.modifier -
    dataset.prot -
    dataset.natRes -
    dataset.formRes -
    dataset.stamina -
    dataset.bonus;
  return dataset;
}

export async function setWounds(soakData, actor) {
  const size = actor?.system?.vitals?.siz?.value || 0;
  const typeOfWound = calculateWound(soakData.damageToApply, size);
  if (typeOfWound === false) {
    ui.notifications.info(game.i18n.localize("arm5e.notification.notPossibleToCalculateWound"), {
      permanent: true
    });
    return false;
  }
  // if (typeOfWound === "none") {

  // }
  // here toggle dead status if applicable

  const messageDamage = `${game.i18n.localize("arm5e.sheet.damage")} (${soakData.damage})`;
  const messageStamina = `${game.i18n.localize("arm5e.sheet.stamina")} (${soakData.stamina})`;
  let messageBonus = "";
  if (soakData.bonus) {
    messageBonus = `${game.i18n.localize("arm5e.sheet.soakBonus")} (${soakData.bonus})<br/> `;
  }
  const messageProt = `${game.i18n.localize("arm5e.sheet.protection")} (${soakData.prot})`;
  let messageModifier = "";
  if (soakData.modifier) {
    messageModifier += `${game.i18n.localize("arm5e.sheet.modifier")} (${soakData.modifier})<br/>`;
  }
  if (soakData.natRes) {
    messageModifier += `${game.i18n.localize("arm5e.sheet.natRes")} (${soakData.natRes})<br/>`;
  }
  if (soakData.formRes) {
    messageModifier += `${game.i18n.localize("arm5e.sheet.formRes")} (${soakData.formRes})<br/>`;
  }
  if (soakData.roll) {
    messageModifier += `${game.i18n.localize("arm5e.dialog.button.roll")} (${soakData.roll})<br/>`;
  }
  const messageTotal = `${game.i18n.localize("arm5e.sheet.totalDamage")} = ${
    soakData.damageToApply
  }`;
  const messageWound =
    typeOfWound !== "none"
      ? game.i18n.format("arm5e.messages.woundResult", {
          typeWound: game.i18n.localize("arm5e.messages.wound." + typeOfWound.toLowerCase())
        })
      : game.i18n.localize("arm5e.messages.noWound");

  const details = ` ${messageDamage}<br/> ${messageStamina}<br/> ${messageProt}<br/> ${messageBonus}${messageModifier}<b>${messageTotal}</b>`;

  const messageData = {
    type: "combat",
    content: `<h4 class="dice-total">${messageWound}</h4>`,
    flavor: game.i18n.format("arm5e.sheet.combat.flavor.soak", {
      target: actor.name,
      amount: soakData.damageToApply
    }),
    speaker: ChatMessage.getSpeaker({
      actor
    }),
    system: {
      label: game.i18n.localize("arm5e.sheet.soak"),
      roll: { details: details, type: "soak" },
      confidence: {
        allowed: false
      }
    }
  };
  const message = new Arm5eChatMessage(messageData);
  message.system.enrichMessageData(actor);

  Arm5eChatMessage.create(message.toObject());

  if (typeOfWound) {
    await actor.changeWound(1, typeOfWound);
  }
}
