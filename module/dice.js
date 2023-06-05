import { ROLL_MODES, getRollTypeProperties } from "./helpers/rollWindow.js";
import { checkTargetAndCalculateResistance } from "./helpers/magic.js";
import { log, putInFoldableLink, putInFoldableLinkWithAnimation, sleep } from "./tools.js";
import { ARM5E } from "./config.js";
import { showRollResults } from "./helpers/chat.js";
let mult = 1;

async function simpleDie(actor, type = "OPTION", callBack) {
  mult = 1;
  // actor = getFormData(html, actor);
  actor = await getRollFormula(actor);
  const rollData = actor.rollData;

  //console.log('simple die');
  //console.log(actorData);
  let flavorTxt = `<p>${game.i18n.localize("arm5e.dialog.button.simpledie")}:</p>`;
  let details = putInFoldableLinkWithAnimation(
    "arm5e.sheet.label.details",
    flavorTxt + rollData.details
  );
  let conf = actor.system.con.score;

  if ((getRollTypeProperties(type).MODE & ROLL_MODES.NO_CONF) != 0) {
    conf = 0;
  }
  let chatTitle = '<h2 class="ars-chat-title">' + rollData.label + "</h2>";
  let formula = "1D10+" + rollData.formula;
  if (rollData.magic.divide > 1) {
    formula = "(1D10+" + rollData.formula + ")/" + rollData.magic.divide;
  }
  const dieRoll = new Roll(formula, actor.system);
  let tmp = await dieRoll.roll({
    async: true
  });

  // let rollMode = CONST.DICE_ROLL_MODES.PUBLIC;
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
      roll: { type: type, img: rollData.img, name: rollData.name, id: rollData.itemId },
      type: "confidence",
      confScore: conf,
      actorType: actor.type, // for if the actor is deleted
      secondaryScore: rollData.secondaryScore
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
  actor.rollData.reset();
  return tmp;
}

// modes:
// 0 => standard
// 1 => force a one
// 2 => force a zero
// 4 => Aging roll
async function stressDie(actor, type = "DEFAULT", modes = 0, callBack = undefined, botchNum = 0) {
  mult = 1;
  actor = await getRollFormula(actor);
  const rollData = actor.rollData;
  let rollOptions = { minimize: false, maximize: false, async: true };
  switch (modes) {
    case 1:
      rollOptions.minimize = true;
      ui.notifications.info(`${actor.name} used DEV mode to roll a 1`);
      break;
    case 2:
      rollOptions.maximize = true;
      ui.notifications.info(`${actor.name} used DEV mode to roll a 0`);
      break;
    case 4:
      rollOptions.noBotch = true;
  }
  let formula = rollData.formula;
  let flavorTxt = `<p>${game.i18n.localize("arm5e.dialog.button.stressdie")}:</p>`;
  let details = putInFoldableLinkWithAnimation(
    "arm5e.sheet.label.details",
    flavorTxt + rollData.details
  );
  let chatTitle = `<h2 class="ars-chat-title">${rollData.label} </h2>`;
  let dieRoll = await explodingRoll(actor, rollOptions, botchNum);

  let confAllowed = actor.system.con.score;

  if ((getRollTypeProperties(type).MODE & ROLL_MODES.NO_CONF) != 0) {
    confAllowed = 0;
  }

  let botchCheck = 0;
  if (mult > 1) {
    flavorTxt = `<h2 class="dice-msg">${game.i18n.localize(
      "arm5e.messages.die.exploding"
    )}</h3><br/>`;
  } else if (mult === 0) {
    if (dieRoll.botches === 0) {
      flavorTxt = `<h2 class="dice-msg">${game.i18n.format("arm5e.messages.die.noBotch", {
        dicenum: dieRoll.botchDice
      })}</h2><br/>`;
    } else if (dieRoll._total == 1) {
      confAllowed = false;
      flavorTxt = `<h2 class="dice-msg">${game.i18n.localize("arm5e.messages.die.botch")}</h2>`;
      if (rollData.isMagic) {
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
      if (rollData.isMagic) {
        flavorTxt += `<br/>${game.i18n.format("arm5e.messages.die.warpGain", {
          num: dieRoll.botches
        })} `;
      }
      dieRoll._total = 0;
    }

    botchCheck = 1;
  }

  //
  // let rollMode = CONST.DICE_ROLL_MODES.PUBLIC;

  let rollMode = game.settings.get("core", "rollMode");
  if (
    getRollTypeProperties(type).MODE & ROLL_MODES.PRIVATE &&
    rollMode != CONST.DICE_ROLL_MODES.BLIND
  ) {
    rollMode = CONST.DICE_ROLL_MODES.PRIVATE;
  }

  const message = await dieRoll.toMessage(
    {
      flavor: chatTitle + flavorTxt + details,
      speaker: ChatMessage.getSpeaker({
        actor: actor
      }),
      whisper: ChatMessage.getWhisperRecipients("gm"),
      flags: {
        arm5e: {
          roll: { type: type, img: rollData.img, name: rollData.name, id: rollData.itemId },
          type: "confidence",
          divide: rollData.magic.divide,
          actorType: actor.type, // for if the actor is deleted
          confScore: confAllowed,
          botchCheck: botchCheck,
          secondaryScore: rollData.secondaryScore
        }
      }
    },
    { rollMode: rollMode }
  );
  if (callBack) {
    await callBack(actor, dieRoll, message, rollData);
  }
  actor.rollData.reset();
  return dieRoll;
}

export function getFormData(html, actor) {
  let find = html.find(".SelectedCharacteristic");
  if (find.length > 0) {
    actor.rollData.characteristic = find[0].value;
  }
  find = html.find(".SelectedAbility");
  if (find.length > 0) {
    if (find[0].value == "None") {
      actor.rollData.ability.score = 0;
    } else {
      actor.items.get(find[0].value);
      actor.rollData.ability.score = actor.items.get(find[0].value).system.finalScore;
    }
  }

  find = html.find(".abilitySpeciality");
  if (find.length > 0) {
    actor.rollData.ability.specApply = find[0].checked;
  }

  find = html.find(".SelectedTechnique");
  if (find.length > 0) {
    actor.rollData.magic.technique = find[0].value;
    actor.rollData.magic.techniqueLabel = ARM5E.magic.techniques[find[0].value].label;
    actor.rollData.magic.techniqueScore = parseInt(
      actor.system.arts.techniques[find[0].value].finalScore
    );

    if (actor.system.arts.techniques[find[0].value].deficient) {
      actor.rollData.magic.techDeficiency = true;
    } else {
      actor.rollData.magic.techDeficiency = false;
    }
  }

  find = html.find(".SelectedForm");
  if (find.length > 0) {
    actor.rollData.magic.form = find[0].value;
    actor.rollData.magic.formLabel = ARM5E.magic.forms[find[0].value].label;
    actor.rollData.magic.formScore = parseInt(actor.system.arts.forms[find[0].value].finalScore);
    if (actor.system.arts.forms[find[0].value].deficient) {
      actor.rollData.magic.formDeficiency = true;
    } else {
      actor.rollData.magic.formDeficiency = false;
    }
  }

  find = html.find(".SelectedAura");
  if (find.length > 0) {
    actor.rollData.environment.aura = Number(find[0].value) ?? 0;
  }

  find = html.find(".SelectedLevel");
  if (find.length > 0) {
    actor.rollData.magic.level = Number(find[0].value) ?? 0;
  }

  find = html.find(".SelectedModifier");
  if (find.length > 0) {
    actor.rollData.modifier = Number(find[0].value) ?? 0;
  }

  find = html.find(".SelectedAdvantage");
  if (find.length > 0) {
    actor.rollData.combat.advantage = Number(find[0].value) ?? 0;
  }

  find = html.find(".SelectedFocus");
  if (find.length > 0) {
    actor.rollData.magic.focus = find[0].checked;
  }

  find = html.find(".SelectedYear");
  if (find.length > 0) {
    actor.rollData.environment.year = Number(find[0].value) ?? 1220;
  }

  if (
    actor.rollData.type == "spell" ||
    actor.rollData.type == "magic" ||
    actor.rollData.type == "spont" ||
    actor.rollData.type == "power"
  ) {
    find = html.find(".penSpeciality");
    if (find.length > 0) {
      actor.rollData.penetration.specApply = find[0].checked;
    }
    find = html.find(".spellMastery");
    if (find.length > 0) {
      actor.rollData.penetration.penetrationMastery = find[0].checked;
    }
    find = html.find(".multiplierBonusArcanic");
    if (find.length > 0) {
      actor.rollData.penetration.multiplierBonusArcanic = Number(find[0].value) ?? 0;
    }

    find = html.find(".multiplierBonusSympathic");
    if (find.length > 0) {
      actor.rollData.penetration.multiplierBonusSympathic = Number(find[0].value) ?? 0;
    }
  }

  return actor;
}

async function getRollFormula(actor) {
  try {
    let total = 0;
    let value = 0;
    let msg = "";
    const rollData = actor.rollData;
    let actorSystemData = actor.system;
    if (rollData.type == "spell" || rollData.type == "magic" || rollData.type == "spont") {
      let valueTech = 0;
      let valueForm = 0;
      valueTech = parseInt(rollData.magic.techniqueScore);
      valueForm = parseInt(rollData.magic.formScore);
      if (rollData.magic.focus === true) {
        if (valueTech < valueForm) {
          total += 2 * valueTech + valueForm;
          msg += rollData.magic.techniqueLabel;
          msg += " ( 2 x " + valueTech + ") + <br />";
          msg += rollData.magic.formLabel;
          msg += " (" + valueForm + ")";
        } else {
          total += 2 * valueForm + valueTech;
          msg += rollData.magic.techniqueLabel;
          msg += " (" + valueTech + ") + <br />";
          msg += rollData.magic.formLabel;
          msg += " ( 2 x " + valueForm + ")";
        }
      } else {
        total += valueTech;
        msg += rollData.magic.techniqueLabel;
        msg += " (" + valueTech + ")";

        total += valueForm;
        msg = newLineAdd(msg);
        msg += rollData.magic.formLabel;
        msg += " (" + valueForm + ")";
      }

      if (rollData.magic.techDeficiency) {
        rollData.magic.divide *= 2;
      }

      if (rollData.magic.formDeficiency) {
        rollData.magic.divide *= 2;
      }

      // TODO NOW
      if (rollData.magic.masteryScore > 0) {
        total += rollData.magic.masteryScore;
        msg = newLineAdd(msg);
        msg += game.i18n.localize("arm5e.sheet.mastery") + ` (${rollData.magic.masteryScore})`;
      }
    }

    if (rollData.type == "power") {
      msg += game.i18n.format("arm5e.sheet.powerCost", {
        might: actorSystemData.might.value,
        cost: rollData.power.cost
      });
      total += actorSystemData.might.value - 5 * rollData.power.cost;
    }

    if (rollData.characteristic != "") {
      value = actorSystemData.characteristics[rollData.characteristic].value;
      total += parseInt(value);
      msg = newLineAdd(msg);
      let name = game.i18n.localize(ARM5E.character.characteristics[rollData.characteristic].label);
      if (rollData.type == "char") {
        rollData.label = name;
      }

      msg += name;
      msg += " (" + value + ")";
    }

    if (rollData.ability.name != "") {
      value = rollData.ability.score;
      total += parseInt(value);
      msg = newLineAdd(msg);
      msg += rollData.label;
      msg += " (" + value + ")";

      if (rollData.ability.specApply == true) {
        total += 1;
        msg += " ( + 1 " + game.i18n.localize("arm5e.sheet.speciality") + " )";
      }
    }

    if (rollData.environment.aura != 0) {
      value = rollData.environment.aura;
      total = parseInt(total) + parseInt(value);
      msg = newLineAdd(msg);
      msg += "Aura";
      msg += " (" + value + ")";
    }

    if (rollData.magic.ritual === true) {
      value = actorSystemData.laboratory.abilitiesSelected.artesLib.value;
      value += actorSystemData.laboratory.abilitiesSelected.philosophy.value;
      total = parseInt(total) + parseInt(value);
      msg = newLineAdd(msg);
      msg =
        msg +
        game.i18n.localize("arm5e.skill.academic.artesLib") +
        " + " +
        game.i18n.localize("arm5e.skill.academic.philosophy");
      msg += " (" + value + ")";
    }
    if (rollData.combat.advantage != 0) {
      value = rollData.combat.advantage;
      total = parseInt(total) + parseInt(value);
      msg = newLineAdd(msg);
      msg += game.i18n.localize("arm5e.sheet.advantage");
      msg += " (" + value + ")";
    }
    if (rollData.modifier != 0) {
      value = rollData.modifier;
      total = parseInt(total) + parseInt(value);
      msg = newLineAdd(msg);
      msg += game.i18n.localize("arm5e.sheet.modifier");
      msg += " (" + value + ")";
    }

    if (rollData.type == "spont") {
      rollData.label =
        game.i18n.localize("arm5e.sheet.spontaneousMagic") +
        " (" +
        ARM5E.magic.arts[rollData.magic.technique].short +
        ARM5E.magic.arts[rollData.magic.form].short +
        ")";
    } else if (rollData.type == "aging") {
      rollData.label =
        game.i18n.localize("arm5e.aging.roll.label") +
        " " +
        game.i18n.localize(rollData.environment.season) +
        " " +
        rollData.environment.year;
    }
    if (rollData.hasGenericField(1)) {
      total += rollData.getGenericFieldValue(1);
      msg = newLineAdd(msg);
      msg += rollData.getGenericFieldLabel(1) + " (" + rollData.getGenericFieldValue(1) + ")";
    }
    if (rollData.hasGenericField(2)) {
      msg = newLineAdd(msg);
      // combat exertion special case
      if (rollData.type == "combat" && rollData.combat.exertion) {
        total += rollData.getGenericFieldValue(2) * 2;
        msg +=
          rollData.getGenericFieldLabel(2) + " ( 2 x " + rollData.getGenericFieldValue(2) + ")";
      } else {
        total += rollData.getGenericFieldValue(2);
        msg += rollData.getGenericFieldLabel(2) + " (" + rollData.getGenericFieldValue(2) + ")";
      }
    }
    if (rollData.hasGenericField(3)) {
      total += rollData.getGenericFieldValue(3);
      msg = newLineAdd(msg);
      msg += rollData.getGenericFieldLabel(3) + " (" + rollData.getGenericFieldValue(3) + ")";
    }
    if (rollData.hasGenericField(4)) {
      total += rollData.getGenericFieldValue(4);
      msg = newLineAdd(msg);
      msg += rollData.getGenericFieldLabel(4) + " (" + rollData.getGenericFieldValue(4) + ")";
    }
    if (rollData.hasGenericField(5)) {
      total += rollData.getGenericFieldValue(5);
      msg = newLineAdd(msg);
      msg += rollData.getGenericFieldValue(5) + " (" + rollData.getGenericFieldValue(5) + ")";
    }
    if (rollData.bonuses) {
      total += rollData.bonuses;
      msg = newLineAdd(msg);
      msg += game.i18n.localize("arm5e.sheet.bonuses.label") + " (" + rollData.bonuses + ")";
    }
    // TODO
    // if (actorData.roll.bonus > 0) {
    //   total = total + actorData.roll.bonus;
    //   msg = newLine(msg);
    //   msg += game.i18n.localize("arm5e.messages.die.bonus") + " (" + actorData.roll.bonus + ")";
    // }

    if (rollData.physicalCondition == true) {
      if (actorSystemData.fatigueTotal != 0) {
        total += actorSystemData.fatigueTotal;
        msg = newLineAdd(msg);
        msg += game.i18n.localize("arm5e.sheet.fatigue");
        msg += " (" + actorSystemData.fatigueTotal + ")";
      }
      if (actorSystemData.woundsTotal != 0) {
        total += actorSystemData.woundsTotal;
        msg = newLineAdd(msg);
        msg += game.i18n.localize("arm5e.sheet.wounds");
        msg += " (" + actorSystemData.woundsTotal + ")";
      }
    }

    if (rollData.magic.divide > 1) {
      msg += "<br/>";
      msg += game.i18n.localize("arm5e.messages.die.divideBy") + rollData.magic.divide;
      if (rollData.magic.techDeficiency || rollData.magic.formDeficiency) {
        msg += ` (${game.i18n.localize("arm5e.sheet.activeEffect.types.arts.deficiency")})`;
      }
    }

    if (rollData.useFatigue) {
      await actor.loseFatigueLevel(1);
    }

    ///
    // after computing total
    ///
    if (rollData.type == "spell" || rollData.type == "magic" || rollData.type == "spont") {
      const multiplier =
        rollData.penetration.multiplierBonusArcanic +
        rollData.penetration.multiplierBonusSympathic +
        1;
      let score = rollData.penetration.score;
      if (rollData.penetration.specApply) {
        score += 1;
      }

      if (score > 0) {
        msg += " + <br /><b>Penetration: </b> <br />";
        msg += "Score (" + score + ") * Multiplier (" + multiplier + ") = " + score * multiplier;
      }
      rollData.penetration.total = score * multiplier;
      rollData.secondaryScore = score * multiplier - rollData.magic.level;
    }

    if (rollData.type == "power") {
      const multiplier =
        rollData.penetration.multiplierBonusArcanic +
        rollData.penetration.multiplierBonusSympathic +
        1;
      let score = rollData.penetration.score;
      if (rollData.penetration.specApply) {
        score += 1;
      }
      rollData.secondaryScore = score * multiplier;
      msg += `<br /> + <b>Penetration </b> (${score * multiplier}) :  <br />`;
      // msg += `Might (${actorSystemData.might.value}) - 5 times cost (${rollData.power.cost})`;
      if (score > 0) {
        msg += " ( Score (" + score + ") * Multiplier (" + multiplier + ") )";
      }
      rollData.penetration.total = rollData.secondaryScore;
    }

    rollData.formula = total;
    rollData.details = msg;

    return actor;
  } catch (err) {
    console.error(`Error: ${err}`);
  }
}

function newLineAdd(msg) {
  if (msg != "") {
    msg += " + <br />";
  }
  return msg;
}

function newLineSub(msg) {
  if (msg != "") {
    msg += " + <br />";
  }
  return msg;
}

async function CheckBotch(botchDice) {
  let rollCommand = String(botchDice).concat("d10cf=10");
  const botchRoll = new Roll(rollCommand);
  await botchRoll.roll({
    async: true
  });
  botchRoll.botches = botchRoll.total;
  return botchRoll;
  // return botchRoll.terms[0].total;
}

async function explodingRoll(actorData, rollOptions = {}, botchNum = 0) {
  let dieRoll;
  // if (modes === 0 || modes === 4) {
  dieRoll = await createRoll(
    actorData.rollData.formula,
    mult,
    actorData.rollData.magic.divide,
    rollOptions
  );
  //   await dieRoll.roll({
  //     async: true
  //   });
  // } else {
  //   if (modes === 1) {
  //     dieRoll = await createRoll(
  //       actorData.rollData.formula,
  //       mult,
  //       actorData.rollData.magic.divide,
  //       { minimize: true }
  //     );
  //     await dieRoll.roll({
  //       async: true,
  //       minimize: true
  //     });
  //   } else {
  //     dieRoll = await createRoll(
  //       actorData.rollData.formula,
  //       mult,
  //       actorData.rollData.magic.divide,
  //       { maximize: true }
  //     );
  //     await dieRoll.roll({
  //       async: true,
  //       maximize: true
  //     });
  //     ui.notifications.info(`${actorData.name} used DEV mode to roll a 0`);
  //   }
  // }

  //
  // explode mode
  const diceResult = dieRoll.dice[0].results[0].result;
  log(false, `Dice result: ${diceResult}`);
  if (diceResult === 1) {
    if (game.modules.get("dice-so-nice")?.active) {
      game.dice3d.showForRoll(dieRoll, game.user, true); //, whisper, blind, chatMessageID, speaker)
    }
    mult *= 2;
    rollOptions = { async: true, noBotch: true };
    let funRolls = game.settings.get(ARM5E.SYSTEM_ID, "funRolls");
    let withDialog =
      funRolls == "EVERYONE" || (funRolls == "PLAYERS_ONLY" && actorData.hasPlayerOwner);
    if (withDialog) {
      let dialogData = {
        msg: game.i18n.localize("arm5e.dialog.roll.exploding.multiplier") + " : " + mult
      };
      const html = await renderTemplate(
        "systems/arm5e/templates/generic/explodingRoll.html",
        dialogData
      );
      await new Promise(resolve => {
        new Dialog(
          {
            title: game.i18n.localize("arm5e.dialog.roll.explodingroll"),
            content: html,
            buttons: {
              yes: {
                icon: "<i class='fas fa-check'></i>",
                label: game.i18n.localize("arm5e.dialog.button.roll"),
                callback: async html => {
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
        let output_roll = new Roll(actorData.rollData.formula.toString(), {}, options);
        output_roll.data = {};
        return await output_roll.evaluate(options);
      }

      const html = await renderTemplate("systems/arm5e/templates/roll/roll-botch.html");
      let botchRoll;
      if (botchNum === 0) {
        // interactive mode show dialog
        await new Promise(resolve => {
          new Dialog(
            {
              title: game.i18n.localize("arm5e.dialog.botch.title"),
              content: html,
              buttons: {
                yes: {
                  icon: "<i class='fas fa-check'></i>",
                  label: game.i18n.localize("arm5e.dialog.button.rollbotch"),
                  callback: async html => {
                    botchNum = html.find("#botchDice").val();
                    botchRoll = await CheckBotch(botchNum);
                    resolve();
                  }
                },
                no: {
                  icon: "<i class='fas fa-times'></i>",
                  label: `Cancel`,
                  callback: html => {
                    ChatMessage.create({
                      content: game.i18n.localize("arm5e.dialog.button.rollnobotch"),
                      speaker: ChatMessage.getSpeaker({
                        actor: actorData
                      })
                    });
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
        botchRoll = await CheckBotch(botchNum);
      }
      if (botchRoll.botches > 0) {
        dieRoll = botchRoll;
      }
      dieRoll.botchDice = botchNum;
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
  const rollData = actor.rollData;
  //console.log('simple die');
  //console.log(actorData);
  let details = putInFoldableLinkWithAnimation("arm5e.sheet.label.details", rollData.details);

  let chatTitle = '<h2 class="ars-chat-title">' + rollData.label + "</h2>";

  const flags = {
    arm5e: {
      roll: { type: rollData.type, img: rollData.img, name: rollData.name, id: rollData.itemId },
      secondaryScore: rollData.secondaryScore,
      actorType: actor.type // for if the actor is deleted
    }
  };
  let formula = `${rollData.formula}`;
  // let rollMode = CONST.DICE_ROLL_MODES.PUBLIC;
  let rollMode = game.settings.get("core", "rollMode");
  // if (actor.type != "player") {
  rollMode = CONST.DICE_ROLL_MODES.PRIVATE;
  // }
  if (rollData.magic.divide > 1) {
    formula += ` / ${rollData.magic.divide}`;
  }
  const dieRoll = new Roll(formula, actor.system);
  dieRoll.diviser = rollData.magic.divide;
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
  actor.rollData.reset();
}
async function changeMight(actor, roll, message) {
  await actor.changeMight(-actor.rollData.power.cost);
}

export { simpleDie, stressDie, noRoll, changeMight };
