import { ROLL_MODES, ROLL_PROPERTIES, getRollTypeProperties } from "./helpers/rollWindow.js";
import { log, putInFoldableLink, putInFoldableLinkWithAnimation, sleep } from "./tools.js";
import { ARM5E } from "./config.js";
import { ArsRoll } from "./helpers/stressdie.js";
import { Arm5eChatMessage } from "./helpers/chat-message.js";
import { handleTargetsOfMagic } from "./helpers/magic.js";
let iterations = 1;

/**
 * Description
 * @param {any} actor
 * @param {any} type="OPTION"
 * @param {any} callBack
 * @returns {any}
 */
async function simpleDie(actor, type = "OPTION", callback, modes = 0) {
  iterations = 1;
  // actor = getFormData(html, actor);
  actor = await getRollFormula(actor);
  const rollInfo = actor.rollInfo;
  const rollProperties = rollInfo.properties;
  //console.log('simple die');
  let flavorTxt = `<p>${game.i18n.localize("arm5e.dialog.button.simpledie")}:</p>`;
  let formula = "1D10+" + rollInfo.formula;
  if (rollInfo.magic.divide > 1) {
    formula = "(1D10+" + rollInfo.formula + ")/" + rollInfo.magic.divide;
  }
  const roll = new ArsRoll(formula, actor.system);
  let dieRoll = await roll.roll();

  let rollMode = game.settings.get("core", "rollMode");
  // let showRolls = game.settings.get("arm5e", "showRolls");
  if (rollProperties.MODE & ROLL_MODES.PRIVATE && rollMode != CONST.DICE_ROLL_MODES.BLIND) {
    rollMode = CONST.DICE_ROLL_MODES.PRIVATE;
  }

  let confAllowed = actor.system.con.score > 0 && (rollProperties.MODE & ROLL_MODES.NO_CONF) == 0;
  if (modes & 16) {
    confAllowed = false;
  }

  let message;
  if (!(modes & 32)) {
    const system = {
      img: actor.img,
      label: rollInfo.label,
      confidence: {
        allowed: confAllowed,
        score: actor.system.con.score
      },
      roll: {
        type: rollInfo.type,
        img: rollInfo.img,
        // name: rollInfo.name,
        itemUuid: rollInfo.itemUuid,
        secondaryScore: rollInfo.secondaryScore,
        botchCheck: false,
        details: rollInfo.details,
        divider: rollInfo.magic.divide,
        difficulty: rollInfo.difficulty,
        actorType: actor.type // for if the actor is deleted
      },
      impact: {
        fatigueLevelsLost: 0,
        fatigueLevelsPending: 0,
        fatigueLevelsFail: 0,
        woundGravity: 0,
        applied: false
      }
    };

    const messageData = await dieRoll.toMessage(
      {
        flavor: flavorTxt,
        // flavor: chatTitle + flavorTxt + details,
        speaker: ChatMessage.getSpeaker({
          actor: actor
        }),
        system: system,
        type: "roll"
      },
      { rollMode: rollMode, create: false }
    );

    message = new Arm5eChatMessage(messageData);

    message.system.enrichMessageData(actor);
  } else {
    if (game.modules.get("dice-so-nice")?.active) {
      await game.dice3d.showForRoll(dieRoll); //, user, synchronize, whisper, blind, chatMessageID, speaker)
    }
  }

  if (callback) {
    await callback(actor, dieRoll, message, rollInfo);
  }
  if (!(modes & 32)) return await Arm5eChatMessage.create(message.toObject());
  // actor.rollInfo.reset();
  return message;
}

// modes bitmask:
// 0 => standard
// 1 => force a one/explosion
// 2 => force a zero/botch check
// 4 => Aging roll
// 8 => non-interactive
// 16 => no confidence
// 32 => no chat message
/**
 * Description
 * @param {any} actor
 * @param {any} type="OPTION"
 * @param {any} modes=0
 * @param {any} callBack=undefined
 * @param {any} botchNum=-1
 * @returns {any}
 */
async function stressDie(actor, type = "OPTION", modes = 0, callback = undefined, botchNum = -1) {
  iterations = 1;
  actor = await getRollFormula(actor);
  const rollInfo = actor.rollInfo;
  const rollProperties = rollInfo.properties;
  let rollOptions = {
    minimize: false,
    maximize: false,
    prompt: true,
    alternateStressDie: game.settings.get(CONFIG.ARM5E.SYSTEM_ID, "alternateStressDie")
  };
  if (modes & 1) {
    if (rollOptions.alternateStressDie) {
      rollOptions.maximize = true;
    } else {
      rollOptions.minimize = true;
    }
    ui.notifications.info(`${actor.name} used DEV mode to explode the roll`);
  } else if (modes & 2) {
    if (rollOptions.alternateStressDie) {
      rollOptions.minimize = true;
    } else {
      rollOptions.maximize = true;
    }
    ui.notifications.info(`${actor.name} used DEV mode to check for botch`);
  }
  if (modes & 4) {
    botchNum = 0;
  }
  if (modes & 8) {
    rollOptions.prompt = false;
  }

  let confAllowed = actor.system.con.score > 0 && (rollProperties.MODE & ROLL_MODES.NO_CONF) == 0;
  if (modes & 16) {
    confAllowed = false;
  }

  let flavorTxt = rollInfo.flavor.length ? `<p>${rollInfo.flavor}</p>` : "";
  flavorTxt += `<p>${game.i18n.localize("arm5e.dialog.button.stressdie")}:</p>`;
  let dieRoll = await explodingRoll(actor, rollOptions, botchNum);

  let botchCheck = false;
  if (iterations > 1) {
    flavorTxt = `<h2 class="dice-msg">${game.i18n.localize(
      "arm5e.messages.die.exploding"
    )}</h3><br/>`;
  } else if (iterations === 0) {
    if (dieRoll.botches === 0) {
      if (modes && 4) {
        flavorTxt = `<p>${game.i18n.localize("arm5e.dialog.button.stressdieNoBotch")}:</p>`;
      } else {
        flavorTxt = `<h2 class="dice-msg">${game.i18n.format("arm5e.messages.die.noBotch", {
          dicenum: dieRoll.botchDice
        })}</h2><br/>`;
      }
    } else if (dieRoll._total == 1) {
      confAllowed = false;
      flavorTxt = `<h2 class="dice-msg">${game.i18n.localize("arm5e.messages.die.botch")}</h2>`;
      if (rollInfo.isMagic) {
        flavorTxt += `<br/>${game.i18n.format("arm5e.messages.die.warpGain", {
          num: dieRoll.botches
        })} `;
      }
      dieRoll._total = 0;
    } else if (dieRoll._total > 1) {
      confAllowed = false;
      flavorTxt = `<h2 class="dice-msg">${game.i18n.format("arm5e.messages.die.botches", {
        num: dieRoll._total
      })}</h2>`;
      if (rollInfo.isMagic) {
        flavorTxt += `<br/>${game.i18n.format("arm5e.messages.die.warpGain", {
          num: dieRoll.botches
        })} `;
      }
      dieRoll._total = 0;
    }

    botchCheck = true;
  }

  let rollMode = game.settings.get("core", "rollMode");
  if (rollProperties.MODE & ROLL_MODES.PRIVATE && rollMode != CONST.DICE_ROLL_MODES.BLIND) {
    rollMode = CONST.DICE_ROLL_MODES.PRIVATE;
  }
  let message;
  if (!(modes & 32)) {
    const system = {
      img: actor.img,
      label: rollInfo.label,
      confidence: {
        allowed: confAllowed && dieRoll.botches === 0,
        score: actor.system.con.score
      },
      roll: {
        type: rollInfo.type,
        img: rollInfo.img,
        // name: rollInfo.name,
        itemUuid: rollInfo.itemUuid,
        secondaryScore: rollInfo.secondaryScore,
        botchCheck: botchCheck,
        botches: dieRoll.botches,
        details: rollInfo.details,
        divider: rollInfo.magic.divide,
        difficulty: rollInfo.difficulty,
        actorType: actor.type // for if the actor is deleted
      },
      impact: {
        fatigueLevelsLost: 0,
        fatigueLevelsPending: 0,
        fatigueLevelsFail: 0,
        woundGravity: 0,
        applied: false
      }
    };

    //   system.combat = { attacker: actor.uuid, defenders: [] };
    //   system.magic = { caster: actor.uuid, targets: [], ritual: rollInfo.magic.ritual };
    const messageData = await dieRoll.toMessage(
      {
        flavor: flavorTxt,
        // flavor: chatTitle + flavorTxt + details,
        speaker: ChatMessage.getSpeaker({
          actor: actor
        }),
        system: system,
        type: "roll"
      },
      { rollMode: rollMode, create: false }
    );

    message = new Arm5eChatMessage(messageData);

    let testRoll = message.rolls[0];
    log(
      false,
      `DBG: Stress die Roll total ${testRoll.total} * ${testRoll.divider} (divider) - (${testRoll.dice[0].total} (diceTotal) * ${testRoll.multiplier} (multiplier)) `
    );
    message.system.enrichMessageData(actor);
  } else {
    if (game.modules.get("dice-so-nice")?.active) {
      await game.dice3d.showForRoll(dieRoll); //, user, synchronize, whisper, blind, chatMessageID, speaker)
    }
  }

  if (callback) {
    await callback(actor, dieRoll, message, rollInfo);
  }
  if (!(modes & 32)) return await Arm5eChatMessage.create(message.toObject());
  // actor.rollInfo.reset();
  return message;
}

async function getRollFormula(actor) {
  try {
    let total = 0;
    let value = 0;
    let msg = "";
    const rollInfo = actor.rollInfo;
    let actorSystemData = actor.system;
    if (rollInfo.type == "spell" || rollInfo.type == "magic" || rollInfo.type == "spont") {
      let valueTech = 0;
      let valueForm = 0;
      valueTech = parseInt(rollInfo.magic.technique.score);
      valueForm = parseInt(rollInfo.magic.form.score);
      if (rollInfo.magic.focus === true) {
        if (valueTech < valueForm) {
          total += 2 * valueTech + valueForm;
          msg += rollInfo.magic.technique.label;
          msg += " ( 2 x " + valueTech + ") <br />";
          msg += rollInfo.magic.form.label;
          msg += " (" + valueForm + ")";
        } else {
          total += 2 * valueForm + valueTech;
          msg += rollInfo.magic.technique.label;
          msg += " (" + valueTech + ") + <br />";
          msg += rollInfo.magic.form.label;
          msg += " ( 2 x " + valueForm + ")";
        }
      } else {
        total += valueTech;
        msg += rollInfo.magic.technique.label;
        msg += " (" + valueTech + ")";

        total += valueForm;
        msg = newLine(msg);
        msg += rollInfo.magic.form.label;
        msg += " (" + valueForm + ")";
      }

      if (rollInfo.magic.technique.deficiency) {
        rollInfo.magic.divide *= 2;
      }

      if (rollInfo.magic.form.deficiency) {
        rollInfo.magic.divide *= 2;
      }

      const voiceMod = actorSystemData.stances.voice[actorSystemData.stances.voiceStance];
      if (voiceMod) {
        total += voiceMod;
        msg = newLine(msg);
        msg +=
          game.i18n.localize(ARM5E.magic.mod.voice[actorSystemData.stances.voiceStance].mnemonic) +
          ` (${voiceMod})`;
      }
      const gestureMod = actorSystemData.stances.gestures[actorSystemData.stances.gesturesStance];
      if (gestureMod) {
        total += gestureMod;
        msg = newLine(msg);
        msg +=
          game.i18n.localize(
            ARM5E.magic.mod.gestures[actorSystemData.stances.gesturesStance].mnemonic
          ) + ` (${gestureMod})`;
      }

      if (rollInfo.magic.masteryScore > 0) {
        total += rollInfo.magic.masteryScore;
        msg = newLine(msg);
        msg += game.i18n.localize("arm5e.sheet.mastery") + ` (${rollInfo.magic.masteryScore})`;
      }
    } else if (rollInfo.type == "supernatural") {
      let valueTech = 0;
      let valueForm = 0;
      valueTech = parseInt(rollInfo.magic.technique.score);
      valueForm = parseInt(rollInfo.magic.form.score);
      if (
        rollInfo.magic.focus === true &&
        rollInfo.magic.technique.active &&
        rollInfo.magic.form.active
      ) {
        if (valueTech < valueForm) {
          total += 2 * valueTech;
          msg += rollInfo.magic.technique.label;
          msg += " ( 2 x " + valueTech + ") ";
          if (rollInfo.magic.technique.specApply) {
            msg += ` + 1 ${rollInfo.magic.technique.specialty}`;
            total++;
          }
          msg += "<br />";

          total += valueForm;
          msg += rollInfo.magic.form.label;
          msg += " (" + valueForm + ")";
          if (rollInfo.magic.form.specApply) {
            msg += ` + 1 ${rollInfo.magic.form.specialty}`;
            total++;
          }
        } else {
          total += valueTech;
          msg += rollInfo.magic.technique.label;
          msg += " (" + valueTech + ") ";
          if (rollInfo.magic.technique.specApply) {
            msg += ` + 1 ${rollInfo.magic.technique.specialty}`;
            total++;
          }
          msg = newLine(msg);
          total += 2 * valueForm;
          msg += rollInfo.magic.form.label;
          msg += " ( 2 x " + valueForm + ")";
          if (rollInfo.magic.form.specApply) {
            msg += ` + 1 ${rollInfo.magic.form.specialty}`;
            total++;
          }
        }
      } else {
        if (rollInfo.magic.technique.active) {
          total += valueTech;
          msg += rollInfo.magic.technique.label;
          msg += " (" + valueTech + ")";
          if (rollInfo.magic.technique.specApply) {
            msg += ` + 1 ${rollInfo.magic.technique.specialty}`;
            total++;
          }
        }

        if (rollInfo.magic.form.active) {
          total += valueForm;
          msg = newLine(msg);
          msg += rollInfo.magic.form.label;
          msg += " (" + valueForm + ")";
          if (rollInfo.magic.form.specApply) {
            msg += ` + 1 ${rollInfo.magic.form.specialty}`;
            total++;
          }
        }
      }

      if (rollInfo.magic.bonus) {
        total += rollInfo.magic.bonus;
        msg = newLine(msg);
        msg += rollInfo.magic.bonusDesc;
        msg += " (" + rollInfo.magic.bonus + ")";
      }

      if (rollInfo.magic.technique.deficiency) {
        rollInfo.magic.divide *= 2;
      }

      if (rollInfo.magic.form.deficiency) {
        rollInfo.magic.divide *= 2;
      }

      // const voiceMod = actorSystemData.stances.voice[actorSystemData.stances.voiceStance];
      // if (voiceMod) {
      //   total += voiceMod;
      //   msg = newLine(msg);
      //   msg +=
      //     game.i18n.localize(ARM5E.magic.mod.voice[actorSystemData.stances.voiceStance].mnemonic) +
      //     ` (${voiceMod})`;
      // }
      // const gestureMod = actorSystemData.stances.gestures[actorSystemData.stances.gesturesStance];
      // if (gestureMod) {
      //   total += gestureMod;
      //   msg = newLine(msg);
      //   msg +=
      //     game.i18n.localize(
      //       ARM5E.magic.mod.gestures[actorSystemData.stances.gesturesStance].mnemonic
      //     ) + ` (${gestureMod})`;
      // }

      // if (rollInfo.magic.masteryScore > 0) {
      //   total += rollInfo.magic.masteryScore;
      //   msg = newLine(msg);
      //   msg += game.i18n.localize("arm5e.sheet.mastery") + ` (${rollInfo.magic.masteryScore})`;
      // }
    } else if (rollInfo.type == "power") {
      msg += game.i18n.format("arm5e.sheet.powerCost", {
        might: actorSystemData.might.value,
        cost: rollInfo.power.cost
      });
      total += actorSystemData.might.value - 5 * rollInfo.power.cost;
    } else if (rollInfo.type == "twilight_strength") {
      msg += `${game.i18n.localize("arm5e.twilight.warpingPoints")} (${
        rollInfo.twilight.warpingPts
      })`;
      total += rollInfo.twilight.warpingPts;
    }

    if (rollInfo.characteristic != "") {
      value = actorSystemData.characteristics[rollInfo.characteristic].value;
      total += parseInt(value);
      msg = newLine(msg);
      let name = game.i18n.localize(ARM5E.character.characteristics[rollInfo.characteristic].label);
      if (rollInfo.type == "char") {
        rollInfo.label = name;
      }

      msg += name;
      msg += " (" + value + ")";
    }

    if (rollInfo.ability.active) {
      value = rollInfo.ability.score;
      total += parseInt(value);
      msg = newLine(msg);
      msg += rollInfo.ability.name;
      msg += " (" + value + ")";

      if (rollInfo.ability.specApply == true) {
        total += 1;
        msg += ` ( + 1 ${rollInfo.ability.speciality} )`;
      }
    }

    if (rollInfo.environment.aura) {
      value = rollInfo.environment.aura.modifier;
      total = parseInt(total) + parseInt(value);
      msg = newLine(msg);
      msg += "Aura";
      msg += " (" + value + ")"; // Remove if not visible? Players can still do math...
    }

    if (rollInfo.magic.ritual === true) {
      value = actorSystemData.laboratory.abilitiesSelected.artesLib.value;
      value += actorSystemData.laboratory.abilitiesSelected.philosophy.value;
      total += value;
      msg = newLine(msg);
      msg =
        msg +
        game.i18n.localize("arm5e.skill.academic.artesLib") +
        " + " +
        game.i18n.localize("arm5e.skill.academic.philosophy");
      msg += " (" + value + ")";
    }
    if (rollInfo.combat.advantage != 0) {
      value = rollInfo.combat.advantage;
      total = parseInt(total) + parseInt(value);
      msg = newLine(msg);
      msg += game.i18n.localize("arm5e.sheet.advantage");
      msg += " (" + value + ")";
    }
    if (rollInfo.modifier != 0) {
      value = rollInfo.modifier;
      total += value;
      msg = newLine(msg);
      msg += game.i18n.localize("arm5e.sheet.modifier");
      msg += " (" + value + ")";
    }

    if (rollInfo.type == "spont") {
      rollInfo.label =
        game.i18n.localize("arm5e.sheet.spontaneousMagic") +
        " (" +
        ARM5E.magic.arts[rollInfo.magic.technique.value].short +
        ARM5E.magic.arts[rollInfo.magic.form.value].short +
        ")";
    } else if (rollInfo.type == "aging") {
      rollInfo.label =
        game.i18n.localize("arm5e.aging.roll.label") +
        " " +
        game.i18n.localize(rollInfo.environment.seasonLabel) +
        " " +
        rollInfo.environment.year;
    }
    if (rollInfo.hasGenericField(1)) {
      total += rollInfo.getGenericFieldValue(1);
      msg += rollInfo.getGenericFieldDetails(1);
      if (rollInfo.type == ROLL_PROPERTIES.TWILIGHT_UNDERSTANDING.VAL) {
        if (actorSystemData.twilight.enigmaSpec) {
          total++;
          msg += ` (+1 ${rollInfo.twilight.enigma.speciality}) <br/>`;
        }
      }
    }
    if (rollInfo.hasGenericField(2)) {
      // msg = newLine(msg);
      // combat exertion special case
      if (
        [ROLL_PROPERTIES.ATTACK.VAL, ROLL_PROPERTIES.DEFENSE.VAL].includes(rollInfo.type) &&
        rollInfo.combat.exertion
      ) {
        total += rollInfo.getGenericFieldValue(2) * 2;
        msg +=
          rollInfo.getGenericFieldLabel(2) +
          " ( 2 x " +
          rollInfo.getGenericFieldValue(2) +
          ") <br/>";
      } else {
        total += rollInfo.getGenericFieldValue(2);
        msg += rollInfo.getGenericFieldDetails(2);
      }
    }
    if (rollInfo.hasGenericField(3)) {
      total += rollInfo.getGenericFieldValue(3);
      msg += rollInfo.getGenericFieldDetails(3);
      if (rollInfo.type == ROLL_PROPERTIES.TWILIGHT_STRENGTH.VAL) {
        if (rollInfo.twilight.enigma.specApply) {
          total++;
          msg += ` (+1 ${rollInfo.twilight.enigma.speciality}) <br/>`;
        }
      }
    }
    if (rollInfo.hasGenericField(4)) {
      total += rollInfo.getGenericFieldValue(4);
      // msg = newLine(msg);
      msg += rollInfo.getGenericFieldDetails(4);
    }
    if (rollInfo.hasGenericField(5)) {
      total += rollInfo.getGenericFieldValue(5);
      // msg = newLine(msg);
      msg += rollInfo.getGenericFieldDetails(5);
    }

    if (rollInfo.hasGenericField(6)) {
      total += rollInfo.getGenericFieldValue(6);
      // msg = newLine(msg);
      msg += rollInfo.getGenericFieldDetails(6);
    }

    if (rollInfo.bonuses) {
      total += rollInfo.bonuses;
      // msg = newLine(msg);
      msg +=
        "+" + game.i18n.localize("arm5e.sheet.bonuses.label") + " (" + rollInfo.bonuses + ")<br/>";
    }
    // TODO
    // if (actorData.roll.bonus > 0) {
    //   total = total + actorData.roll.bonus;
    //   msg = newLine(msg);
    //   msg += game.i18n.localize("arm5e.messages.die.bonus") + " (" + actorData.roll.bonus + ")";
    // }

    if (rollInfo.physicalCondition == true) {
      if (actorSystemData.fatigueTotal != 0) {
        total += actorSystemData.fatigueTotal;
        msg += "+" + game.i18n.localize("arm5e.sheet.fatigue");
        msg += " (" + actorSystemData.fatigueTotal + ")<br/>";
      }
      if (actorSystemData.penalties.wounds.total != 0) {
        total += actorSystemData.penalties.wounds.total;
        msg += "+" + game.i18n.localize("arm5e.sheet.wounds");
        msg += " (" + actorSystemData.penalties.wounds.total + ")<br/>";
      }
    }

    for (let optBonus of rollInfo.optionalBonuses) {
      if (optBonus.active == true) {
        total += optBonus.bonus;
        msg = newLine(msg);
        msg += `${optBonus.name} (${optBonus.bonus})`;
      }
    }

    if (rollInfo.magic.divide > 1) {
      msg += "<br/>";
      msg += game.i18n.localize("arm5e.messages.die.divideBy") + rollInfo.magic.divide;
      if (rollInfo.magic.technique.deficiency || rollInfo.magic.form.deficiency) {
        msg += ` (${game.i18n.localize("arm5e.sheet.activeEffect.types.arts.deficiency")})`;
      }
    }

    // if (rollInfo.useFatigue) {
    //   await actor.loseFatigueLevel(1);
    // }

    ///
    // after computing total
    ///
    if (["spell", "magic", "spont"].includes(rollInfo.type)) {
      const multiplier =
        rollInfo.penetration.multiplierBonusArcanic +
        rollInfo.penetration.multiplierBonusSympathic +
        1;
      let score = rollInfo.penetration.score;
      if (rollInfo.penetration.specApply) {
        score += 1;
      }

      // if the mastery skill is penetration, add it to the score
      if (rollInfo.penetration.penetrationMastery) {
        score += rollInfo.magic.masteryScore;
      }

      msg += ` + <br /><b>${game.i18n.localize("arm5e.sheet.penetration")} </b> (${
        score * multiplier
      }) <br />`;
      if (score > 0) {
        msg += `${game.i18n.localize("arm5e.sheet.score")} (${score}) * ${game.i18n.localize(
          "arm5e.generic.multiplier"
        )} (${multiplier}) =  ${score * multiplier}`;
      }
      rollInfo.penetration.total = score * multiplier;
      rollInfo.secondaryScore = rollInfo.penetration.total;
    } else if (rollInfo.type == "power") {
      const multiplier =
        rollInfo.penetration.multiplierBonusArcanic +
        rollInfo.penetration.multiplierBonusSympathic +
        1;
      let score = rollInfo.penetration.score;
      if (rollInfo.penetration.specApply) {
        score += 1;
      }
      rollInfo.secondaryScore = score * multiplier;
      msg += ` + <br /><b>${game.i18n.localize("arm5e.sheet.penetration")} </b> (${
        score * multiplier
      }) <br />`;
      if (score > 0) {
        msg += `${game.i18n.localize("arm5e.sheet.score")} (${score}) * ${game.i18n.localize(
          "arm5e.generic.multiplier"
        )} (${multiplier}) =  ${score * multiplier}`;
      }
      rollInfo.penetration.total = rollInfo.secondaryScore;
    } else if (rollInfo.type == "item") {
      msg += `<br /> + <b>${game.i18n.localize("arm5e.sheet.penetration")} </b> (${
        rollInfo.penetration.total
      }) :  <br />`;
      rollInfo.secondaryScore = rollInfo.penetration.total;
    }

    rollInfo.formula = total;
    rollInfo.details = msg;

    return actor;
  } catch (err) {
    console.error(`Error: ${err}`);
  }
}

function newLine(msg, operator = "+") {
  if (msg != "") {
    msg += `<br />${operator} `;
  }
  return msg;
}

function newLineSub(msg) {
  if (msg != "") {
    msg += " - <br />";
  }
  return msg;
}

async function CheckBotch(botchDice, roll) {
  let opt = roll.options;
  let rollCommand = String(botchDice);
  if (opt.alternateStressDie) {
    rollCommand += "d10cf=1";
  } else {
    rollCommand += "d10cf=10";
  }
  const botchRoll = new ArsRoll(rollCommand);
  await botchRoll.roll();
  botchRoll.offset = roll.offset;
  botchRoll.options.botches = botchRoll.total;
  botchRoll.botchDice = botchDice;
  botchRoll.options.divider = roll.divider; // to keep the modifier getter consistent
  botchRoll.options.multiplier = roll.multiplier;
  return botchRoll;
  // return botchRoll.terms[0].total;
}

async function explodingRoll(actorData, rollOptions = {}, botchNum = -1) {
  let dieRoll;
  dieRoll = await createRoll(
    actorData.rollInfo.formula,
    iterations,
    actorData.rollInfo.magic.divide,
    rollOptions
  );

  //
  // explode mode
  const explodingScore = rollOptions.alternateStressDie ? 10 : 1;
  const botchCheckScore = rollOptions.alternateStressDie ? 1 : 0;
  let diceResult = dieRoll.dice[0].results[0].result;
  log(false, `Dice result: ${diceResult}`);
  if (diceResult === explodingScore) {
    if (game.modules.get("dice-so-nice")?.active) {
      await game.dice3d.showForRoll(dieRoll, game.user, true); //, whisper, blind, chatMessageID, speaker)
    }
    if (rollOptions.alternateStressDie) {
      iterations++;
    } else {
      iterations *= 2;
    }
    rollOptions.noBotch = true;
    rollOptions.minimize = false;
    rollOptions.maximize = false;
    let funRolls = game.settings.get(ARM5E.SYSTEM_ID, "funRolls");
    let withDialog =
      rollOptions.prompt &&
      (funRolls == "EVERYONE" || (funRolls == "PLAYERS_ONLY" && actorData.hasPlayerOwner));
    if (withDialog) {
      let dialogData;
      if (rollOptions.alternateStressDie) {
        dialogData = {
          msg:
            game.i18n.localize("arm5e.dialog.roll.exploding.modifier") +
            " : " +
            (iterations - 1) * 10
        };
      } else {
        dialogData = {
          msg: game.i18n.localize("arm5e.dialog.roll.exploding.multiplier") + " : " + iterations
        };
      }
      const html = await renderTemplate(
        "systems/arm5e/templates/generic/explodingRoll.html",
        dialogData
      );
      await new Promise((resolve) => {
        new Dialog(
          {
            title: game.i18n.localize("arm5e.dialog.roll.explodingroll"),
            content: html,
            buttons: {
              yes: {
                icon: "<i class='fas fa-check'></i>",
                label: game.i18n.localize("arm5e.dialog.button.roll"),
                callback: async (html) => {
                  dieRoll = await explodingRoll(actorData, rollOptions);
                  resolve();
                }
              }
            }
          },
          {
            classes: ["arm5e-dialog", "dialog"],
            height: "400px"
          }
        ).render(true);
      });
    } else {
      if (game.modules.get("dice-so-nice")?.active) {
        log(false, `Dramatic pause of ${game.settings.get(ARM5E.SYSTEM_ID, "dramaticPause")} ms`);
        await sleep(game.settings.get(ARM5E.SYSTEM_ID, "dramaticPause"));
      }
      dieRoll = await explodingRoll(actorData, rollOptions);
    }
  } else {
    if (iterations === 1 && diceResult === botchCheckScore) {
      iterations = 0;
      if (game.modules.get("dice-so-nice")?.active) {
        await game.dice3d.showForRoll(dieRoll); //, user, synchronize, whisper, blind, chatMessageID, speaker)
      }
      if (rollOptions.noBotch) {
        let output_roll = new ArsRoll(actorData.rollInfo.formula.toString(), {}, options);
        output_roll.data = {};
        return await output_roll.evaluate(options);
      }

      const html = await renderTemplate("systems/arm5e/templates/roll/roll-botch.html");
      let botchRoll;
      if (botchNum === -1 && rollOptions.prompt) {
        // interactive mode show dialog
        await new Promise((resolve) => {
          new Dialog(
            {
              title: game.i18n.localize("arm5e.dialog.botch.title"),
              content: html,
              buttons: {
                yes: {
                  icon: "<i class='fas fa-check'></i>",
                  label: game.i18n.localize("arm5e.dialog.button.rollbotch"),
                  callback: async (html) => {
                    botchNum = html.find("#botchDice").val();
                    botchRoll = await CheckBotch(botchNum, dieRoll);
                    resolve();
                  }
                },
                no: {
                  icon: "<i class='fas fa-times'></i>",
                  label: `Cancel`,
                  callback: (html) => {
                    ChatMessage.create({
                      content: game.i18n.localize("arm5e.dialog.button.rollnobotch"),
                      speaker: ChatMessage.getSpeaker({
                        actor: actorData
                      })
                    });
                    botchRoll = 0;
                    resolve();
                  }
                }
              },
              default: "yes"
            },
            {
              classes: ["arm5e-dialog", "dialog"],
              height: "400px"
            }
          ).render(true);
        });
      } else {
        botchRoll = await CheckBotch(botchNum, dieRoll);
      }
      if (botchRoll) {
        if (botchRoll.botches == 0) {
          botchRoll._total = dieRoll.total;
          botchRoll._formula = dieRoll._formula;
        }
        dieRoll = botchRoll;
      } else {
        dieRoll.botchDice = 0;
      }
    }
  }

  return dieRoll;
}

export async function createRoll(rollFormula, multiplier, divide, options = {}) {
  let rollInit;
  if (options.noBotch || options.alternateStressDie) {
    rollInit = `1d10 + ${rollFormula}`;
  } else {
    rollInit = `1di10 + ${rollFormula}`;
  }
  if (Number.parseInt(multiplier) > 1) {
    if (options.alternateStressDie) {
      rollInit = `${rollInit} + ${(multiplier - 1) * 10}`;
    } else {
      rollInit = `${multiplier} * ${rollInit}`;
    }
  }
  if (Number.parseInt(divide) > 1) {
    rollInit = `( ${rollInit} ) / ${divide}`;
  }
  options.multiplier = multiplier;
  options.divider = divide;
  options.botches = 0;
  options.offset = rollFormula;
  let output_roll = new ArsRoll(rollInit, {}, options);
  // output_roll.offset = rollFormula;
  // output_roll.multiplier = multiplier;
  // output_roll.divider = divide;
  // output_roll.data = {};
  //output_roll.roll({ options });
  await output_roll.evaluate(options);

  return output_roll;
}

async function noRoll(actor, modes, callback) {
  actor = await getRollFormula(actor);
  const rollInfo = actor.rollInfo;
  const rollProperties = rollInfo.properties;
  let formula = `${rollInfo.formula}`;

  let rollMode = game.settings.get("core", "rollMode");
  if (rollProperties.MODE & ROLL_MODES.PRIVATE && rollMode != CONST.DICE_ROLL_MODES.BLIND) {
    rollMode = CONST.DICE_ROLL_MODES.PRIVATE;
  }

  if (rollInfo.magic.divide > 1) {
    formula += ` / ${rollInfo.magic.divide}`;
  }
  const dieRoll = new ArsRoll(formula, actor.system, { divider: rollInfo.magic.divide });
  let tmp = await dieRoll.roll();
  const system = {
    img: actor.img,
    label: rollInfo.label,
    confidence: {
      allowed: false,
      score: actor.system.con.score
    },
    roll: {
      type: rollInfo.type,
      img: rollInfo.img,
      // name: rollInfo.name,
      itemUuid: rollInfo.itemUuid,
      secondaryScore: rollInfo.secondaryScore,
      botchCheck: false,
      details: rollInfo.details,
      divider: rollInfo.magic.divide,
      actorType: actor.type, // for if the actor is deleted
      difficulty: rollInfo.difficulty
    },
    impact: {
      fatigueLevelsLost: 0,
      fatigueLevelsPending: 0,
      fatigueLevelsFail: 0,
      woundGravity: 0,
      applied: false
    }
  };

  const messageData = await tmp.toMessage(
    {
      // flavor: flavorTxt,
      // flavor: chatTitle + flavorTxt + details,
      speaker: ChatMessage.getSpeaker({
        actor: actor
      }),
      system: system,
      type: "roll"
    },
    { rollMode: rollMode, create: false }
  );

  let message = new Arm5eChatMessage(messageData);

  message.system.enrichMessageData(actor);

  if (callback) {
    await callback(actor, dieRoll, message, rollInfo);
  }
  return await Arm5eChatMessage.create(message.toObject());
  // actor.rollInfo.reset();
}

async function changeMight(actor, roll, message) {
  const form = CONFIG.ARM5E.magic.arts[actor.rollInfo.power.form]?.label ?? "NONE";
  await handleTargetsOfMagic(actor, form, message);
  await actor.changeMight(-actor.rollInfo.power.cost);
}

async function useItemCharge(actor, roll, message) {
  const form = CONFIG.ARM5E.magic.arts[actor.rollInfo.item.form]?.label ?? "NONE";
  const item = actor.items.get(actor.rollInfo.item.id);
  await handleTargetsOfMagic(actor, form, message);
  await item.useItemCharge();
}
export { simpleDie, stressDie, noRoll, changeMight, useItemCharge };
