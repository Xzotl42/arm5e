import { calculateWound, getDataset, getLastCombatMessageOfType, log } from "../tools.js";
import { createRoll, stressDie } from "../dice.js";
import { Arm5eChatMessage } from "./chat-message.js";
import { _applyImpact, ROLL_PROPERTIES } from "./rollWindow.js";
import { getWoundStr } from "../config.js";

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
    html
      .querySelector(".rollable")
      .addEventListener("click", async (event) => await this.object.actor.sheet.roll(event));
    html.querySelector(".soak-damage").addEventListener("click", async (event) => {
      const msg = await this.object.actor.sheet._onSoakDamage(getDataset(event));
      if (msg == null) return;
      if (msg.system.impact.woundGravity) {
        await this.object.actor.changeWound(
          1,
          CONFIG.ARM5E.recovery.rankMapping[msg.system.impact.woundGravity]
        );
      }
      Arm5eChatMessage.create(msg.toObject());
    });
    html.querySelector(".damage").addEventListener("click", async (event) => {
      await computeDamage(this.object.actor);
    });
  }
}

export async function computeDamage(actor) {
  const lastAttackMessage = getLastCombatMessageOfType("combatAttack");
  const lastDefenseMessage = getLastCombatMessageOfType("combatDefense");
  let attackScore = 0;
  if (lastAttackMessage) {
    attackScore = lastAttackMessage.rollTotal() > 0 ? lastAttackMessage.rollTotal() : 0;
    attackScore += lastAttackMessage?.system.confidenceModifier;
  }

  let defenseScore = 0;
  if (lastDefenseMessage) {
    defenseScore = lastDefenseMessage.rollTotal() > 0 ? lastDefenseMessage.rollTotal() : 0;
    defenseScore += lastDefenseMessage?.system.confidenceModifier;
  }

  const advantage = attackScore - defenseScore;
  await actor.sheet._onCalculateDamage({ advantage, roll: "combatDamage" });
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
    html.querySelector(".rest").addEventListener("click", async () => {
      await this.object.actor.rest();
      this.render();
    });
    html.querySelector(".addFatigue").addEventListener("click", async () => {
      await this.object.actor.loseFatigueLevel(1, false);
      this.render();
    });
    html.querySelector(".removeFatigue").addEventListener("click", async () => {
      await this.object.actor.recoverFatigueLevel(1);
      this.render();
    });
    html.querySelector(".addWound").addEventListener("click", async (event) => {
      event.preventDefault();
      const dataset = event.currentTarget.dataset;
      await this.object.actor.changeWound(1, dataset.type);
      this.render();
    });
    html.querySelector(".recovery").addEventListener("click", async (event) => {
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
  // TODO use javascript instead of JQuery
  // const modifier = parseInt(selector.querySelector())
  const modifier = parseInt(selector.find('input[name$="modifier"]').val());
  let damage = modifier;
  actor.rollInfo.modifier = modifier;
  const messageModifier = `${game.i18n.localize("arm5e.sheet.modifier")} (${damage})`;
  let details = "";
  const strength = parseInt(selector.find('label[name$="strength"]').attr("value") || 0);
  const weapon = parseInt(selector.find('label[name$="weapon"]').attr("value") || 0);
  const advantage = parseInt(selector.find('input[name$="advantage"]').val());
  const formDam = selector.find('select[name$="formDamage"]').val() || "";

  const messageStrength = `${game.i18n.localize("arm5e.sheet.strength")} (${strength})`;
  const messageWeapon = `${game.i18n.localize("arm5e.damage.label")} (${weapon})`;
  const messageAdvantage = `${game.i18n.localize("arm5e.sheet.advantage")} (${advantage})`;
  damage += strength + weapon + advantage;
  details = ` ${messageStrength}<br/> ${messageWeapon}<br/> ${messageAdvantage}<br/> ${messageModifier}<br/>`;
  let title = "";
  const messageDamage = `<h4 class="dice-roll dice-total">${damage}</h4>`;
  const messageData = {
    type: "combatDamage",
    content: messageDamage,
    flavor: "",

    speaker: ChatMessage.getSpeaker({
      actor
    }),
    system: {
      label: game.i18n.localize("arm5e.damage.label"),
      roll: { details: details, type: actor.rollInfo.type },
      confidence: {
        allowed: false
      },
      rootMessage: actor.rollInfo.rootMessageUuid,
      combat: { damageForm: formDam, damageTotal: damage }
    }
  };
  const message = new Arm5eChatMessage(messageData);
  message.system.enrichMessageData(actor);

  return Arm5eChatMessage.create(message.toObject());
}

export function buildSoakDataset(selector, actor) {
  const dataset = {};

  dataset.modifier = parseInt(selector.find('input[name$="modifier"]').val());
  dataset.damage = parseInt(selector.find('input[name$="damage"]').val());
  let natRes = selector[0].querySelector('select[name$="natRes"]')?.value;
  let formRes = selector[0].querySelector('select[name$="formRes"]')?.value;

  dataset.natRes = actor.system.bonuses.resistance[natRes] || 0;
  dataset.formRes = Math.ceil(actor.system.arts?.forms[formRes]?.finalScore / 5 || 0);
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
  const woundInfo = getMessageDamageDetails(soakData, actor);
  const roll = await createRoll(`${soakData.damageToApply}`, 1, 1, {
    actor: actor,
    deterministic: true
  });

  const messageData = await roll.toMessage(
    {
      type: "combatSoak",
      // content: `<h4 class="dice-total">${woundInfo.messageWound}</h4>`,
      flavor: game.i18n.format("arm5e.sheet.combat.flavor.soak", {
        target: actor.name,
        amount: soakData.damageToApply
      }),
      speaker: ChatMessage.getSpeaker({
        actor
      }),
      system: {
        label: game.i18n.localize("arm5e.sheet.soak"),
        roll: { details: woundInfo.details, type: ROLL_PROPERTIES.COMBATSOAK.VAL },
        confidence: {
          allowed: false
        },
        impact: { woundGravity: woundInfo.typeOfWound, applied: true }
      }
    },
    { create: false }
  );

  // if (woundInfo.typeOfWound) {
  //   await actor.changeWound(1, CONFIG.ARM5E.recovery.rankMapping[woundInfo.typeOfWound]);
  // }
  const message = new Arm5eChatMessage(messageData);
  message.system.enrichMessageData(actor);
  return message;

  // Arm5eChatMessage.create(message.toObject());
}

function getMessageDamageDetails(soakData, actor) {
  const size = actor?.system?.vitals?.siz?.value || 0;
  const typeOfWound = calculateWound(soakData.damageToApply, size);
  // if (typeOfWound === 0) {
  //   ui.notifications.info(game.i18n.localize("arm5e.notification.notPossibleToCalculateWound"), {
  //     permanent: true
  //   });
  //   return false;
  // }
  // if (typeOfWound === "none") {

  // }
  // here toggle dead status if applicable

  const messageDamage = `${game.i18n.localize("arm5e.damage.label")} (${soakData.damage})`;
  const messageStamina = `- ${game.i18n.localize("arm5e.sheet.stamina")} (${soakData.stamina})`;
  let messageBonus = "";
  if (soakData.bonus) {
    messageBonus = `- ${game.i18n.localize("arm5e.sheet.soakBonus")} (${soakData.bonus})<br/> `;
  }
  const messageProt = `- ${game.i18n.localize("arm5e.sheet.protection")} (${soakData.prot})`;
  let messageModifier = "";
  if (soakData.modifier) {
    messageModifier += `- ${game.i18n.localize("arm5e.sheet.modifier")} (${
      soakData.modifier
    })<br/>`;
  }
  if (soakData.natRes) {
    messageModifier += `- ${game.i18n.localize("arm5e.sheet.natRes")} (${soakData.natRes})<br/>`;
  }
  if (soakData.formRes) {
    messageModifier += `- ${game.i18n.localize("arm5e.sheet.formRes")} (${soakData.formRes})<br/>`;
  }
  if (soakData.roll) {
    messageModifier += `- ${game.i18n.localize("arm5e.dialog.button.roll")} (${
      soakData.roll
    })<br/>`;
  }
  const messageTotal = `${game.i18n.localize("arm5e.sheet.totalDamage")} = ${
    soakData.damageToApply
  }`;
  return {
    typeOfWound: typeOfWound,
    messageWound:
      typeOfWound !== 0
        ? game.i18n.format("arm5e.messages.woundResult", {
            typeWound: game.i18n.localize(
              "arm5e.messages.wound." + CONFIG.ARM5E.recovery.rankMapping[typeOfWound]
            )
          })
        : game.i18n.localize("arm5e.messages.noWound"),
    details: ` ${messageDamage}<br/> ${messageStamina}<br/> ${messageProt}<br/> ${messageBonus}${messageModifier}<b>${messageTotal}</b>`
  };
}

export async function damageRoll(actor, roll, message) {
  const targetedTokens = game.user.targets; //getActorsFromTargetedTokens(actorCaster);
  if (!targetedTokens) {
    return;
  }

  const targets = [];
  for (let tokenTarget of targetedTokens) {
    targets.push(tokenTarget.actor.uuid);
  }

  message.updateSource({
    "system..target": targets
  });
  await actor.update({ "system.states.pendingDamage": true });
}

export async function soakRoll(actor, roll, message) {
  const rollInfo = actor.rollInfo;

  const damage = rollInfo.difficulty;
  const details = `${game.i18n.localize("arm5e.damage.label")} (${damage}) -<br/>(${
    message.system.roll.details
  }  <br/>+ ${game.i18n.localize("arm5e.dialog.button.roll")} (${roll.total - roll.modifier}))
  <br/><b>${game.i18n.localize("arm5e.sheet.totalDamage")} = ${damage - roll.total}</b>`;

  const target = {
    uuid: actor.uuid,
    name: actor.name,
    flavor: message.flavor,
    details: details,
    natRes: rollInfo.damage.natRes,
    formRes: rollInfo.damage.formRes,
    ignoreArmor: rollInfo.damage.ignoreArmor
  };

  const size = actor?.system?.vitals?.siz?.value || 0;
  const typeOfWound = calculateWound(damage - roll.total, size);
  message.updateSource({
    "system.damage.target": target,
    "system.impact": { applied: true, woundGravity: typeOfWound }
  });
}
