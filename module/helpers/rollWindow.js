import { ARM5E } from "../config.js";
import { simpleDie, stressDie, noRoll } from "../dice.js";
import { castSpell, castSupernaturalEffect, noFatigue } from "./magic.js";
import {
  setAgingEffects,
  agingCrisis,
  twilightControl,
  applyTwilightStrength,
  applyTwilightComplexity,
  twilightUnderstanding
} from "./long-term-activities.js";
import { damageRoll, exertSelf, soakRoll } from "./combat.js";
import { MagicalEffectSchema, SpellSchema } from "../schemas/magicSchemas.js";
import { log } from "../tools.js";

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
    MODE: 25, // STRESS + NO_CONF + UNCONSCIOUS
    TITLE: "arm5e.dialog.title.rolldie",
    MODIFIERS: 0,
    CALLBACK: damageRoll
    // ALTER_ROLL: doubleAbility,
  },
  SOAK: {
    VAL: "soak",
    MODE: 57, // STRESS + NO_CONF + UNCONSCIOUS + NO CHAT
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
    MODE: 157, // STRESS + NO_BOTCH + NO_CONF + UNCONSCIOUS + PRIVATE
    MODIFIERS: 0,
    TITLE: "arm5e.aging.roll.label",
    CALLBACK: setAgingEffects,
    ALTER_ROLL: noFatigue
  },
  TWILIGHT_CONTROL: {
    VAL: "twilight_control",
    MODE: 17, // STRESS + UNCONSCIOUS
    MODIFIERS: 1,
    TITLE: "arm5e.twilight.episode",
    ACTION_LABEL: "arm5e.twilight.control.avoid",
    CALLBACK: twilightControl
  },
  TWILIGHT_STRENGTH: {
    VAL: "twilight_strength",
    MODE: 157, // STRESS + NO_BOTCH + NO_CONF + UNCONSCIOUS + PRIVATE
    MODIFIERS: 0,
    TITLE: "arm5e.twilight.episode",
    CALLBACK: applyTwilightStrength
  },
  TWILIGHT_COMPLEXITY: {
    VAL: "twilight_complexity",
    MODE: 153, // STRESS + NO_CONF + UNCONSCIOUS + PRIVATE
    MODIFIERS: 0,
    TITLE: "arm5e.twilight.episode",
    CALLBACK: applyTwilightComplexity
  },
  TWILIGHT_UNDERSTANDING: {
    VAL: "twilight_understanding",
    MODE: 17, // STRESS  + UNCONSCIOUS
    MODIFIERS: 1,
    TITLE: "arm5e.twilight.episode",
    CALLBACK: twilightUnderstanding
  },
  CRISIS: {
    VAL: "crisis",
    MODE: 154, // SIMPLE + NO_CONF + UNCONSCIOUS + PRIVATE
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
  COMBAT_DAMAGE: {
    VAL: "combatDamage",
    MODE: 64, // use dataset.mode
    MODIFIERS: 0,
    TITLE: "arm5e.dialog.damageCalculator",
    ACTION_LABEL: "arm5e.dialog.woundCalculator"
    // CALLBACK: combatDamage
  },
  COMBAT_SOAK: {
    VAL: "combatSoak",
    MODE: 64, // use dataset.mode
    MODIFIERS: 0,
    TITLE: "arm5e.dialog.woundCalculator",
    ACTION_LABEL: "arm5e.dialog.woundCalculator"
    // CALLBACK: combatDamage
  },
  POWER: {
    VAL: "power",
    MODE: 64, // use dataset.mode
    MODIFIERS: 7,
    TITLE: "arm5e.dialog.powerUse",
    ACTION_LABEL: "arm5e.dialog.powerUse"
    // CALLBACK: castSupernaturalEffect
  },
  ITEM: {
    VAL: "item",
    MODE: 72, // no die roll and no confidence
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

/**
 *
 * @param dataset
 */
function chooseTemplate(dataset) {
  if (
    [
      ROLL_PROPERTIES.ATTACK.VAL,
      ROLL_PROPERTIES.DEFENSE.VAL,
      ROLL_PROPERTIES.INIT.VAL,
      ROLL_PROPERTIES.OPTION.VAL
    ].includes(dataset.roll)
  ) {
    return "systems/arm5e/templates/roll/roll-options.html";
  }
  if ([ROLL_PROPERTIES.CHAR.VAL, ROLL_PROPERTIES.ABILITY.VAL].includes(dataset.roll)) {
    return "systems/arm5e/templates/roll/roll-characteristic.html";
  }
  if (dataset.roll == ROLL_PROPERTIES.SPONT.VAL) {
    // Spontaneous magic
    return "systems/arm5e/templates/roll/roll-magic.html";
  }
  if ([ROLL_PROPERTIES.MAGIC.VAL, ROLL_PROPERTIES.SPELL.VAL].includes(dataset.roll)) {
    return "systems/arm5e/templates/roll/roll-spell.html";
  }
  if (dataset.roll == ROLL_PROPERTIES.SUPERNATURAL.VAL) {
    return "systems/arm5e/templates/roll/roll-supernatural.html";
  }
  if (dataset.roll == ROLL_PROPERTIES.AGING.VAL) {
    // Aging roll
    return "systems/arm5e/templates/roll/roll-aging.html";
  }
  if (dataset.roll == ROLL_PROPERTIES.CRISIS.VAL) {
    // Aging crisis roll
    return "systems/arm5e/templates/roll/roll-aging-crisis.html";
  }

  if (dataset.roll == ROLL_PROPERTIES.TWILIGHT_CONTROL.VAL) {
    return "systems/arm5e/templates/roll/roll-twilightControl.html";
  }
  if (dataset.roll == ROLL_PROPERTIES.TWILIGHT_STRENGTH.VAL) {
    return "systems/arm5e/templates/roll/roll-twilightStrength.html";
  }
  if (dataset.roll == ROLL_PROPERTIES.TWILIGHT_COMPLEXITY.VAL) {
    return "systems/arm5e/templates/roll/roll-twilightComplexity.html";
  }
  if (dataset.roll == ROLL_PROPERTIES.TWILIGHT_UNDERSTANDING.VAL) {
    return "systems/arm5e/templates/roll/roll-twilightUnderstanding.html";
  }

  if (dataset.roll == ROLL_PROPERTIES.DAMAGE.VAL) {
    return "systems/arm5e/templates/roll/roll-damage.html";
  }
  if (dataset.roll == ROLL_PROPERTIES.SOAK.VAL) {
    return "systems/arm5e/templates/roll/roll-soak.html";
  }
  return "";
}

/**
 *
 * @param dataset
 * @param actor
 */
function updateCharacteristicDependingOnRoll(dataset, actor) {
  if (
    [ROLL_PROPERTIES.SPONT.VAL, ROLL_PROPERTIES.MAGIC.VAL, ROLL_PROPERTIES.SPELL.VAL].includes(
      dataset.roll
    )
  ) {
    actor.rollInfo.characteristic = "sta";
  }
}

/**
 *
 * @param actor
 * @param callback
 */
function getDebugButtonsIfNeeded(actor, callback) {
  if (!game.modules.get("_dev-mode")?.api?.getPackageDebugValue(ARM5E.SYSTEM_ID)) return {};
  return {
    explode: {
      label: "DEV Roll 1",
      callback: async (html) => {
        actor = getFormData(html, actor);
        await stressDie(actor, actor.rollInfo.type, 1, callback, actor.rollInfo.botchNumber);
      }
    },
    zero: {
      label: "DEV Roll 0",
      callback: async (html) => {
        actor = getFormData(html, actor);
        await stressDie(actor, actor.rollInfo.type, 2, callback, actor.rollInfo.botchNumber);
      }
    }
  };
}

/**
 *
 * @param dataset
 * @param html
 * @param actor
 */
async function getDialog(dataset, html, actor) {
  const rollInfo = actor.rollInfo;
  const rollProperties = rollInfo.properties;
  const callback = rollProperties.CALLBACK;
  return await new Promise((resolve) => {
    let btns = {};
    let mode = 0;
    const altAction = rollProperties.ALT_ACTION;
    let altBtn;
    if (altAction) {
      const btnLabel = rollProperties.ALT_ACTION_LABEL;
      const rollAlteration = rollProperties.ALTER_ROLL;
      altBtn = {
        icon: "<i class='fas fa-check'></i>",
        label: game.i18n.localize(btnLabel),
        callback: async (html) => {
          getFormData(html, actor);
          if (rollAlteration) {
            rollAlteration(actor);
          }
          resolve(await altAction(actor, mode, callback));
        }
      };
    }
    const title = rollInfo.title ? rollInfo.title : rollProperties.TITLE;
    const rollMode = rollProperties.MODE;
    if (rollMode & ROLL_MODES.STRESS) {
      btns.yes = {
        icon: "<i class='fas fa-check'></i>",
        label: game.i18n.localize(
          rollProperties.ACTION_LABEL
            ? rollProperties.ACTION_LABEL
            : "arm5e.dialog.button.stressdie"
        ),
        callback: async (html) => {
          getFormData(html, actor);
          resolve(
            await stressDie(actor, rollProperties.type, mode, callback, rollInfo.botchNumber)
          );
        }
      };
      if (altAction) {
        btns.alt = altBtn;
      }
      if (rollMode & ROLL_MODES.SIMPLE) {
        btns.no = {
          icon: "<i class='fas fa-check'></i>",
          label: game.i18n.localize(
            rollProperties.ACTION_LABEL
              ? rollProperties.ACTION_LABEL
              : "arm5e.dialog.button.simpledie"
          ),
          callback: async (html) => {
            getFormData(html, actor);
            resolve(await simpleDie(actor, rollProperties.type, callback));
          }
        };
      } else {
        btns.no = {
          icon: "<i class='fas fa-ban'></i>",
          label: game.i18n.localize("arm5e.dialog.button.cancel"),
          callback: async (html) => {
            await rollInfo.reset();
          }
        };
      }
    } else if (rollMode & ROLL_MODES.SIMPLE) {
      // Simple die only
      btns.yes = {
        icon: "<i class='fas fa-check'></i>",
        label: game.i18n.localize(
          rollProperties.ACTION_LABEL
            ? rollProperties.ACTION_LABEL
            : "arm5e.dialog.button.simpledie"
        ),
        callback: async (html) => {
          getFormData(html, actor);
          resolve(await simpleDie(actor, rollProperties.type, callback));
        }
      };
      if (altAction) {
        btns.alt = altBtn;
      }
      btns.no = {
        icon: "<i class='fas fa-ban'></i>",
        label: game.i18n.localize("arm5e.dialog.button.cancel"),
        callback: async (html) => {
          rollInfo.reset();
        }
      };
    } else {
      //no roll
      btns.yes = {
        icon: "<i class='fas fa-check'></i>",
        label: game.i18n.localize(
          rollProperties.ACTION_LABEL ? rollProperties.ACTION_LABEL : "arm5e.dialog.powerUse"
        ),
        callback: async (html) => {
          getFormData(html, actor);
          resolve(await noRoll(actor, 1, null));
        }
      };
      btns.no = {
        icon: "<i class='fas fa-ban'></i>",
        label: game.i18n.localize("arm5e.dialog.button.cancel"),
        callback: null
      };
    }

    new Dialog(
      {
        title: game.i18n.localize(title),
        content: html,
        render: actor.rollInfo.listeners,
        buttons: {
          ...btns
          // ...getDebugButtonsIfNeeded(actor, callback)
        },
        render: actor.rollInfo.listeners
      },
      {
        classes: ["arm5e-dialog", "dialog"],
        height: "780px",
        width: "400px"
      }
    ).render(true);
  });
}

/**
 *
 * @param dataset
 * @param template
 * @param actor
 */
async function renderRollTemplate(dataset, template, actor) {
  if (!template) {
    return false;
  }
  actor.system.roll = actor.rollInfo;
  actor.config = CONFIG.ARM5E;
  actor.selection = actor.rollInfo.selection;
  const renderedTemplate = await renderTemplate(template, actor);
  const message = await getDialog(dataset, renderedTemplate, actor);
  return message;
}

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
  let find = html.find(".SelectedCharacteristic");
  if (find.length > 0) {
    actor.rollInfo.characteristic = find[0].value;
  }
  find = html.find(".SelectedAbility");
  if (find.length > 0) {
    if (find[0].value == "None") {
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
        ability: find[0].value,
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

  find = html.find(".abilitySpeciality");
  if (find.length > 0) {
    actor.rollInfo.ability.specApply = find[0].checked;
  }

  find = html.find(".enigmaSpeciality");
  if (find.length > 0) {
    actor.rollInfo.twilight.enigma.specApply = find[0].checked;
  }

  find = html.find(".SelectedTechnique");
  if (find.length > 0) {
    actor.rollInfo.magic.technique.value = find[0].value;
    actor.rollInfo.magic.technique.label = ARM5E.magic.techniques[find[0].value].label;
    actor.rollInfo.magic.technique.score = parseInt(
      actor.system.arts.techniques[find[0].value].finalScore
    );

    if (actor.system.arts.techniques[find[0].value].deficient) {
      actor.rollInfo.magic.technique.deficiency = true;
    } else {
      actor.rollInfo.magic.technique.deficiency = false;
    }
  }

  find = html.find(".SelectedForm");
  if (find.length > 0) {
    actor.rollInfo.magic.form.value = find[0].value;
    actor.rollInfo.magic.form.label = ARM5E.magic.forms[find[0].value].label;
    actor.rollInfo.magic.form.score = parseInt(actor.system.arts.forms[find[0].value].finalScore);
    if (actor.system.arts.forms[find[0].value].deficient) {
      actor.rollInfo.magic.form.deficiency = true;
    } else {
      actor.rollInfo.magic.form.deficiency = false;
    }
  }

  find = html.find(".SelectedAura");
  if (find.length > 0) {
    actor.rollInfo.environment.aura.modifier = Number(find[0].value) ?? 0;
  }

  find = html.find(".SelectedLevel");
  if (find.length > 0) {
    actor.rollInfo.magic.level = Number(find[0].value) ?? 0;
  }

  find = html.find(".SelectedModifier");
  if (find.length > 0) {
    actor.rollInfo.modifier = Number(find[0].value) ?? 0;
    // Negative modifier
    if ([ROLL_PROPERTIES.CRISIS.VAL].includes(actor.rollInfo.type)) {
      actor.rollInfo.modifier = -actor.rollInfo.modifier;
    }
  }

  find = html.find(".SelectedAdvantage");
  if (find.length > 0) {
    actor.rollInfo.combat.advantage = Number(find[0].value) ?? 0;
  }

  find = html.find(".SelectedWarpingPoints");
  if (find.length > 0) {
    actor.rollInfo.twilight.warpingPts = Number(find[0].value) ?? 2;
  }

  find = html.find(".SelectedFocus");
  if (find.length > 0) {
    actor.rollInfo.magic.focus = find[0].checked;
  }

  find = html.find(".SelectedYear");
  if (find.length > 0) {
    actor.rollInfo.environment.year = Number(find[0].value) ?? 1220;
  }

  find = html.find(".SelectedDifficulty");
  if (find.length > 0) {
    actor.rollInfo.difficulty = parseInt(find[0].value ?? 0);
  }

  if (
    [ROLL_PROPERTIES.SPONT.VAL, ROLL_PROPERTIES.MAGIC.VAL, ROLL_PROPERTIES.SPELL.VAL].includes(
      actor.rollInfo.type
    ) ||
    actor.rollInfo.type == "power"
  ) {
    find = html.find(".penSpeciality");
    if (find.length > 0) {
      actor.rollInfo.penetration.specApply = find[0].checked;
    }
    find = html.find(".spellMastery");
    if (find.length > 0) {
      actor.rollInfo.penetration.penetrationMastery = find[0].checked;
    }
    find = html.find(".multiplierBonusArcanic");
    if (find.length > 0) {
      actor.rollInfo.penetration.multiplierBonusArcanic = Number(find[0].value) ?? 0;
    }

    find = html.find(".multiplierBonusSympathic");
    if (find.length > 0) {
      actor.rollInfo.penetration.multiplierBonusSympathic = Number(find[0].value) ?? 0;
    }

    find = html.find(".power-cost");
    if (find.length > 0) {
      actor.rollInfo.power.cost = Number(find[0].value) ?? 0;
      actor.rollInfo.power.penetrationPenalty = actor.rollInfo.power.cost * 5;
    }

    find = html.find(".power-label");
    if (find.length > 0) {
      actor.rollInfo.label = find[0].value ?? actor.rollInfo.label;
    }

    find = html.find(".power-form");
    if (find.length > 0) {
      actor.rollInfo.power.form = find[0].value ?? actor.rollInfo.power.form;
    }
  } else if ([ROLL_PROPERTIES.DAMAGE.VAL, ROLL_PROPERTIES.SOAK.VAL].includes(actor.rollInfo.type)) {
    find = html.find(".SelectedDamage");
    if (find.length > 0) {
      actor.rollInfo.difficulty = find[0].value;
    }

    find = html.find(".SelectedSource");
    if (find.length > 0) {
      actor.rollInfo.damage.source = find[0].value;
    }
    find = html.find(".SelectedFormDamage");
    if (find.length > 0) {
      actor.rollInfo.damage.form = find[0].value;
    }

    find = html.find(".ignoreArmor");
    if (find.length > 0) {
      actor.rollInfo.damage.ignoreArmor = find[0].checked;
    }

    find = html.find(".formRes");
    if (find.length > 0) {
      actor.rollInfo.damage.formRes = find[0].value;
    }

    find = html.find(".natRes");
    if (find.length > 0) {
      actor.rollInfo.damage.natRes = find[0].value;
    }
  }
  let idx = 0;
  for (let optEffect of actor.rollInfo.optionalBonuses) {
    find = html.find(`.SelectedOptional${idx}`);
    if (find.length > 0) {
      actor.rollInfo.optionalBonuses[idx].active = find[0].checked;
    }
    idx++;
  }

  return actor;
}

export {
  chooseTemplate,
  updateCharacteristicDependingOnRoll,
  renderRollTemplate,
  prepareRollVariables,
  ROLL_MODES,
  ROLL_MODIFIERS,
  ROLL_PROPERTIES,
  getRollTypeProperties
};
