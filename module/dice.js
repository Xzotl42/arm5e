import { ROLL_MODES, ROLL_PROPERTIES, getRollTypeProperties } from "./helpers/rollWindow.js";
import { checkTargetAndCalculateResistance } from "./helpers/magic.js";
import { log, putInFoldableLink, putInFoldableLinkWithAnimation, sleep } from "./tools.js";
import { ARM5E } from "./config.js";
import { showRollResults } from "./helpers/chat.js";
let mult = 1;

/**
 * Description
 * @param {any} actor
 * @param {any} type="OPTION"
 * @param {any} callBack
 * @returns {any}
 */
async function simpleDie(actor, type = "OPTION", callBack) {
  mult = 1;
  // actor = getFormData(html, actor);
  actor = await getRollFormula(actor);
  const rollInfo = actor.rollInfo;

  //console.log('simple die');
  let flavorTxt = `<p>${game.i18n.localize("arm5e.dialog.button.simpledie")}:</p>`;
  let details = putInFoldableLinkWithAnimation(
    "arm5e.sheet.label.details",
    flavorTxt + rollInfo.details
  );
  let conf = actor.system.con.score;

  if ((getRollTypeProperties(type).MODE & ROLL_MODES.NO_CONF) != 0) {
    conf = 0;
  }
  let chatTitle = '<h2 class="ars-chat-title">' + rollInfo.label + "</h2>";
  let formula = "1D10+" + rollInfo.formula;
  if (rollInfo.magic.divide > 1) {
    formula = "(1D10+" + rollInfo.formula + ")/" + rollInfo.magic.divide;
  }
  const dieRoll = new Roll(formula, actor.system);
  let tmp = await dieRoll.roll({
    async: true
  });

  let rollMode = game.settings.get("core", "rollMode");
  // let showRolls = game.settings.get("arm5e", "showRolls");
  if (
    getRollTypeProperties(type).MODE & ROLL_MODES.PRIVATE &&
    rollMode != CONST.DICE_ROLL_MODES.BLIND
  ) {
    rollMode = CONST.DICE_ROLL_MODES.PRIVATE;
  }

  const flags = {
    arm5e: {
      roll: { type: type, img: rollInfo.img, name: rollInfo.name, id: rollInfo.itemId },
      type: "confidence",
      confScore: conf,
      actorType: actor.type, // for if the actor is deleted
      secondaryScore: rollInfo.secondaryScore
    }
  };

  // TODO: HERE Do the callback for before message creation
  const message = await tmp.toMessage(
    {
      speaker: ChatMessage.getSpeaker({
        actor: actor
      }),
      flavor: chatTitle + details,
      flags: flags
    },
    { rollMode: rollMode }
  );
  if (callBack) {
    await callBack(actor, tmp, message);
  }
  actor.rollInfo.reset();
  return tmp;
}

// modes bitmask:
// 0 => standard
// 1 => force a one
// 2 => force a zero
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
async function stressDie(actor, type = "OPTION", modes = 0, callBack = undefined, botchNum = -1) {
  mult = 1;
  actor = await getRollFormula(actor);
  const rollInfo = actor.rollInfo;
  let rollOptions = {
    minimize: false,
    maximize: false,
    async: true,
    prompt: true
  };
  if (modes & 1) {
    rollOptions.minimize = true;
    ui.notifications.info(`${actor.name} used DEV mode to roll a 1`);
  } else if (modes & 2) {
    rollOptions.maximize = true;
    ui.notifications.info(`${actor.name} used DEV mode to roll a 0`);
  }
  if (modes & 4) {
    botchNum = 0;
  }
  if (modes & 8) {
    rollOptions.prompt = false;
  }

  let confAllowed = actor.system.con.score;
  if (modes & 16) {
    confAllowed = false;
  }

  if ((getRollTypeProperties(type).MODE & ROLL_MODES.NO_CONF) != 0) {
    confAllowed = 0;
  }

  let formula = rollInfo.formula;
  let flavorTxt = rollInfo.flavor.length ? `<p>${rollInfo.flavor}</p>` : "";
  flavorTxt += `<p>${game.i18n.localize("arm5e.dialog.button.stressdie")}:</p>`;
  let details = putInFoldableLinkWithAnimation(
    "arm5e.sheet.label.details",
    flavorTxt + rollInfo.details
  );
  let chatTitle = `<h2 class="ars-chat-title">${rollInfo.label} </h2>`;
  let dieRoll = await explodingRoll(actor, rollOptions, botchNum);

  let botchCheck = 0;
  if (mult > 1) {
    flavorTxt = `<h2 class="dice-msg">${game.i18n.localize(
      "arm5e.messages.die.exploding"
    )}</h3><br/>`;
  } else if (mult === 0) {
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

    botchCheck = 1;
  }

  let rollMode = game.settings.get("core", "rollMode");
  if (
    getRollTypeProperties(type).MODE & ROLL_MODES.PRIVATE &&
    rollMode != CONST.DICE_ROLL_MODES.BLIND
  ) {
    rollMode = CONST.DICE_ROLL_MODES.PRIVATE;
  }
  let message;
  if (!(modes & 32)) {
    message = await dieRoll.toMessage(
      {
        flavor: chatTitle + flavorTxt + details,
        speaker: ChatMessage.getSpeaker({
          actor: actor
        }),
        whisper: ChatMessage.getWhisperRecipients("gm"),
        flags: {
          arm5e: {
            roll: { type: type, img: rollInfo.img, name: rollInfo.name, id: rollInfo.itemId },
            type: "confidence",
            divide: rollInfo.magic.divide,
            actorType: actor.type, // for if the actor is deleted
            confScore: confAllowed,
            botchCheck: botchCheck,
            secondaryScore: rollInfo.secondaryScore
          }
        }
      },
      { rollMode: rollMode }
    );
  } else {
    if (game.modules.get("dice-so-nice")?.active) {
      game.dice3d.showForRoll(dieRoll); //, user, synchronize, whisper, blind, chatMessageID, speaker)
    }
  }

  if (callBack) {
    await callBack(actor, dieRoll, message, rollInfo);
  }
  actor.rollInfo.reset();
  return dieRoll;
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
      valueTech = parseInt(rollInfo.magic.techniqueScore);
      valueForm = parseInt(rollInfo.magic.formScore);
      if (rollInfo.magic.focus === true) {
        if (valueTech < valueForm) {
          total += 2 * valueTech + valueForm;
          msg += rollInfo.magic.techniqueLabel;
          msg += " ( 2 x " + valueTech + ") <br />";
          msg += rollInfo.magic.formLabel;
          msg += " (" + valueForm + ")";
        } else {
          total += 2 * valueForm + valueTech;
          msg += rollInfo.magic.techniqueLabel;
          msg += " (" + valueTech + ") + <br />";
          msg += rollInfo.magic.formLabel;
          msg += " ( 2 x " + valueForm + ")";
        }
      } else {
        total += valueTech;
        msg += rollInfo.magic.techniqueLabel;
        msg += " (" + valueTech + ")";

        total += valueForm;
        msg = newLine(msg);
        msg += rollInfo.magic.formLabel;
        msg += " (" + valueForm + ")";
      }

      if (rollInfo.magic.techDeficiency) {
        rollInfo.magic.divide *= 2;
      }

      if (rollInfo.magic.formDeficiency) {
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
    }

    if (rollInfo.type == "power") {
      msg += game.i18n.format("arm5e.sheet.powerCost", {
        might: actorSystemData.might.value,
        cost: rollInfo.power.cost
      });
      total += actorSystemData.might.value - 5 * rollInfo.power.cost;
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

    if (rollInfo.ability.name != "") {
      value = rollInfo.ability.score;
      total += parseInt(value);
      msg = newLine(msg);
      msg += rollInfo.label;
      msg += " (" + value + ")";

      if (rollInfo.ability.specApply == true) {
        total += 1;
        msg += " ( + 1 " + game.i18n.localize("arm5e.sheet.speciality") + " )";
      }
    }

    if (rollInfo.environment.aura) {
      value = rollInfo.environment.aura.modifier;
      total = parseInt(total) + parseInt(value);
      msg = newLine(msg);
      msg += "Aura";
      msg += " (" + value + ")<br/>"; // Remove if not visible? Players can still do math...
    }

    if (rollInfo.magic.ritual === true) {
      value = actorSystemData.laboratory.abilitiesSelected.artesLib.value;
      value += actorSystemData.laboratory.abilitiesSelected.philosophy.value;
      total = parseInt(total) + parseInt(value);
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
      total = parseInt(total) + parseInt(value);
      msg = newLine(msg);
      msg += game.i18n.localize("arm5e.sheet.modifier");
      msg += " (" + value + ")";
    }

    if (rollInfo.type == "spont") {
      rollInfo.label =
        game.i18n.localize("arm5e.sheet.spontaneousMagic") +
        " (" +
        ARM5E.magic.arts[rollInfo.magic.technique].short +
        ARM5E.magic.arts[rollInfo.magic.form].short +
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
      // msg = newLine(msg);
      msg += rollInfo.getGenericFieldDetails(1);
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
      // msg = newLine(msg);
      msg += rollInfo.getGenericFieldDetails(3);
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
      if (rollInfo.magic.techDeficiency || rollInfo.magic.formDeficiency) {
        msg += ` (${game.i18n.localize("arm5e.sheet.activeEffect.types.arts.deficiency")})`;
      }
    }

    if (rollInfo.useFatigue) {
      await actor.loseFatigueLevel(1);
    }

    ///
    // after computing total
    ///
    if (rollInfo.type == "spell" || rollInfo.type == "magic" || rollInfo.type == "spont") {
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

      if (score > 0) {
        msg += " + <br /><b>Penetration: </b> <br />";
        msg += "Score (" + score + ") * Multiplier (" + multiplier + ") = " + score * multiplier;
      }
      rollInfo.penetration.total = score * multiplier;
      rollInfo.secondaryScore = score * multiplier - rollInfo.magic.level;
    }

    if (rollInfo.type == "power") {
      const multiplier =
        rollInfo.penetration.multiplierBonusArcanic +
        rollInfo.penetration.multiplierBonusSympathic +
        1;
      let score = rollInfo.penetration.score;
      if (rollInfo.penetration.specApply) {
        score += 1;
      }
      rollInfo.secondaryScore = score * multiplier;
      msg += `<br /> + <b>Penetration </b> (${score * multiplier}) :  <br />`;
      // msg += `Might (${actorSystemData.might.value}) - 5 times cost (${rollInfo.power.cost})`;
      if (score > 0) {
        msg += " ( Score (" + score + ") * Multiplier (" + multiplier + ") )";
      }
      rollInfo.penetration.total = rollInfo.secondaryScore;
    }

    if (rollInfo.type == "item") {
      msg += `<br /> + <b>Penetration </b> (${rollInfo.penetration.total}) :  <br />`;
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

async function CheckBotch(botchDice, offset) {
  let rollCommand = String(botchDice).concat("d10cf=10");
  const botchRoll = new Roll(rollCommand);
  await botchRoll.roll({
    async: true
  });
  botchRoll.offset = offset;
  botchRoll.botches = botchRoll.total;
  botchRoll.botchDice = botchDice;
  return botchRoll;
  // return botchRoll.terms[0].total;
}

async function explodingRoll(actorData, rollOptions = {}, botchNum = -1) {
  let dieRoll;
  dieRoll = await createRoll(
    actorData.rollInfo.formula,
    mult,
    actorData.rollInfo.magic.divide,
    rollOptions
  );

  //
  // explode mode

  let diceResult = dieRoll.dice[0].results[0].result;
  log(false, `Dice result: ${diceResult}`);
  if (diceResult === 1) {
    if (game.modules.get("dice-so-nice")?.active) {
      game.dice3d.showForRoll(dieRoll, game.user, true); //, whisper, blind, chatMessageID, speaker)
    }
    mult *= 2;
    rollOptions.noBotch = true;
    rollOptions.minimize = false;
    rollOptions.maximize = false;
    let funRolls = game.settings.get(ARM5E.SYSTEM_ID, "funRolls");
    let withDialog =
      rollOptions.prompt &&
      (funRolls == "EVERYONE" || (funRolls == "PLAYERS_ONLY" && actorData.hasPlayerOwner));
    if (withDialog) {
      let dialogData = {
        msg: game.i18n.localize("arm5e.dialog.roll.exploding.multiplier") + " : " + mult
      };
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
    if (mult === 1 && diceResult === 0) {
      mult *= 0;
      if (game.modules.get("dice-so-nice")?.active) {
        game.dice3d.showForRoll(dieRoll); //, user, synchronize, whisper, blind, chatMessageID, speaker)
      }
      if (rollOptions.noBotch) {
        let output_roll = new Roll(actorData.rollInfo.formula.toString(), {}, options);
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
                    botchRoll = await CheckBotch(botchNum, dieRoll.offset);
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
        botchRoll = await CheckBotch(botchNum, dieRoll.offset);
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

export async function createRoll(rollFormula, mult, divide, options = {}) {
  let rollInit;
  if (options.noBotch) {
    rollInit = `1d10 + ${rollFormula}`;
  } else {
    rollInit = `1di10 + ${rollFormula}`;
  }
  if (Number.parseInt(mult) > 1) {
    rollInit = `${mult} * ${rollInit}`;
  }
  if (Number.parseInt(divide) > 1) {
    rollInit = `( ${rollInit} ) / ${divide}`;
  }
  options.async = true;
  let output_roll = new Roll(rollInit, {}, options);
  output_roll.offset = rollFormula;
  output_roll.multiplier = mult;
  output_roll.diviser = divide;
  output_roll.data = {};
  //output_roll.roll({ options });
  await output_roll.evaluate(options);

  return output_roll;
}

async function noRoll(actor, mode, callback, roll) {
  actor = await getRollFormula(actor);
  const rollInfo = actor.rollInfo;
  //console.log('simple die');
  //console.log(actorData);
  let details = putInFoldableLinkWithAnimation("arm5e.sheet.label.details", rollInfo.details);

  let chatTitle = '<h2 class="ars-chat-title">' + rollInfo.label + "</h2>";

  const flags = {
    arm5e: {
      roll: { type: rollInfo.type, img: rollInfo.img, name: rollInfo.name, id: rollInfo.itemId },
      secondaryScore: rollInfo.secondaryScore,
      actorType: actor.type // for if the actor is deleted
    }
  };
  let formula = `${rollInfo.formula}`;

  let rollMode = game.settings.get("core", "rollMode");
  if (
    getRollTypeProperties(rollInfo.type).MODE & ROLL_MODES.PRIVATE &&
    rollMode != CONST.DICE_ROLL_MODES.BLIND
  ) {
    rollMode = CONST.DICE_ROLL_MODES.PRIVATE;
  }

  if (rollInfo.magic.divide > 1) {
    formula += ` / ${rollInfo.magic.divide}`;
  }
  const dieRoll = new Roll(formula, actor.system);
  dieRoll.diviser = rollInfo.magic.divide;
  let tmp = await dieRoll.roll({
    async: true
  });
  const message = await tmp.toMessage(
    {
      content: "",
      flavor: chatTitle + details,
      flags: flags,
      speaker: ChatMessage.getSpeaker({
        actor
      })
    },
    { rollMode: rollMode }
  );
  await checkTargetAndCalculateResistance(actor, dieRoll, message);
  if (callback) {
    await callback(actor, dieRoll, message);
  }
  actor.rollInfo.reset();
}
async function changeMight(actor, roll, message) {
  await actor.changeMight(-actor.rollInfo.power.cost);
}

async function useItemCharge(actor, roll, message) {
  const item = actor.items.get(actor.rollInfo.item.id);
  await item.useItemCharge();
}
export { simpleDie, stressDie, noRoll, changeMight, useItemCharge };
