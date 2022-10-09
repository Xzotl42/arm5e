import { ROLL_MODES, getRollTypeProperties } from "./helpers/rollWindow.js";
import { checkTargetAndCalculateResistance } from "./helpers/magic.js";
import { log, putInFoldableLink } from "./tools.js";
import { ARM5E } from "./config.js";
let mult = 1;

async function simpleDie(html, actor, type = "DEFAULT", callBack) {
  actor = getFormData(html, actor);
  actor = getRollFormula(actor);
  const rollData = actor.rollData;

  //console.log('simple die');
  //console.log(actorData);
  let flavorTxt = `<p>${game.i18n.localize("arm5e.dialog.button.simpledie")}:</p>`;
  let details = putInFoldableLink("arm5e.sheet.label.details", flavorTxt + rollData.details);
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
  if (getRollTypeProperties(type).MODE & ROLL_MODES.PRIVATE || actor.type != "player") {
    rollMode = CONST.DICE_ROLL_MODES.PRIVATE;
  }
  const flags = {
    arm5e: {
      roll: { type: type, img: rollData.img, name: rollData.name },
      type: "confidence",
      confScore: conf,
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
    await callBack(html, actor, tmp, message);
  }
  actor.rollData.reset();
}

// modes:
// 0 => standard
// 1 => force a one
// 2 => force a zero
// 4 => Aging roll
async function stressDie(html, actor, modes = 0, callBack, type = "DEFAULT") {
  mult = 1;
  actor = getFormData(html, actor);
  actor = getRollFormula(actor);
  const rollData = actor.rollData;
  let formula = rollData.formula;
  let flavorTxt = `<p>${game.i18n.localize("arm5e.dialog.button.stressdie")}:</p>`;
  let details = putInFoldableLink("arm5e.sheet.label.details", flavorTxt + rollData.details);
  let chatTitle = `<h2 class="ars-chat-title">${rollData.label} </h2>`;
  let dieRoll = await explodingRoll(actor, modes);

  let lastRoll;
  let confAllowed = actor.system.con.score;

  if ((getRollTypeProperties(type).MODE & ROLL_MODES.NO_CONF) != 0) {
    confAllowed = 0;
  }

  let botchCheck = 0;
  if (mult > 1) {
    flavorTxt = `<h3>${game.i18n.localize("arm5e.messages.die.exploding")}</h3><br/>`;
  } else if (mult === 0) {
    if (dieRoll._total == 1) {
      confAllowed = false;
      flavorTxt = `<h2>${game.i18n.localize("arm5e.messages.die.botch")}</h2><br/>`;
    } else if (dieRoll._total > 1) {
      confAllowed = false;
      flavorTxt = `<h2>${game.i18n.format("arm5e.messages.die.botches", {
        num: dieRoll._total
      })}</h2><br/>`; // TODO: mention what is botched
    }
    botchCheck = 1;
  }
  lastRoll = multiplyRoll(mult, dieRoll, formula, rollData.magic.divide);

  let rollOptions = {};

  //
  // let rollMode = CONST.DICE_ROLL_MODES.PUBLIC;

  let rollMode = game.settings.get("core", "rollMode");
  if (getRollTypeProperties(type).MODE & ROLL_MODES.PRIVATE || actor.type != "player") {
    rollMode = CONST.DICE_ROLL_MODES.PRIVATE;
  }

  const message = await lastRoll.toMessage(
    {
      flavor: chatTitle + details,
      speaker: ChatMessage.getSpeaker({
        actor: actor
      }),
      whisper: ChatMessage.getWhisperRecipients("gm"),
      flags: {
        arm5e: {
          roll: { type: type, img: rollData.img, name: rollData.name },
          type: "confidence",
          divide: rollData.magic.divide,
          confScore: confAllowed,
          botchCheck: botchCheck,
          secondaryScore: rollData.secondaryScore
        }
      }
    },
    { rollMode: rollMode }
  );
  if (callBack) {
    await callBack(html, actor, lastRoll, message);
  }
  actor.rollData.reset();
}

function getFormData(html, actor) {
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
  }

  find = html.find(".SelectedForm");
  if (find.length > 0) {
    actor.rollData.magic.form = find[0].value;
    actor.rollData.magic.formLabel = ARM5E.magic.forms[find[0].value].label;
    actor.rollData.magic.formScore = parseInt(actor.system.arts.forms[find[0].value].finalScore);
  }

  find = html.find(".SelectedAura");
  if (find.length > 0) {
    actor.rollData.environment.aura = find[0].value;
  }

  find = html.find(".SelectedModifier");
  if (find.length > 0) {
    actor.rollData.modifier = find[0].value;
  }

  find = html.find(".SelectedAdvantage");
  if (find.length > 0) {
    actor.rollData.combat.advantage = find[0].value;
  }

  find = html.find(".SelectedFocus");
  if (find.length > 0) {
    actor.rollData.magic.focus = find[0].checked;
  }

  find = html.find(".SelectedYear");
  if (find.length > 0) {
    actor.rollData.environment.year = find[0].value;
  }

  if (
    actor.rollData.type == "spell" ||
    actor.rollData.type == "magic" ||
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
      actor.rollData.penetration.multiplierBonusArcanic = Number(find[0].value);
    }

    find = html.find(".multiplierBonusSympathic");
    if (find.length > 0) {
      actor.rollData.penetration.multiplierBonusSympathic = Number(find[0].value);
    }
  }

  return actor;
}

function getRollFormula(actor) {
  let total = 0;
  let value = 0;
  let msg = "";
  const rollData = actor.rollData;
  let actorSystemData = actor.system;
  if (rollData.type == "spell" || rollData.type == "magic" || rollData.type == "spont") {
    let valueTech = 0;
    let valueForm = 0;
    valueTech = rollData.magic.techniqueScore;
    valueForm = rollData.magic.formScore;
    if (rollData.magic.focus === true) {
      if (valueTech < valueForm) {
        total = parseInt(total) + 2 * valueTech + valueForm;
        msg += rollData.magic.techniqueLabel;
        msg += " ( 2 x " + valueTech + ") + <br />";
        msg += rollData.magic.formLabel;
        msg += " (" + valueForm + ")";
      } else {
        total = parseInt(total) + 2 * valueForm + valueTech;
        msg += rollData.magic.techniqueLabel;
        msg += " (" + valueTech + ") + <br />";
        msg += rollData.magic.formLabel;
        msg += " ( 2 x " + valueForm + ")";
      }
    } else {
      total = parseInt(total) + valueTech;
      msg += rollData.magic.techniqueLabel;
      msg += " (" + valueTech + ")";

      total = parseInt(total) + valueForm;
      msg = newLineAdd(msg);
      msg += rollData.magic.formLabel;
      msg += " (" + valueForm + ")";
    }
    if (rollData.type == "magic" || rollData.type == "spont") {
      actor.loseFatigueLevel(1);
    }
  }

  if (rollData.type == "power") {
    msg += `Might (${actorSystemData.might.value}) - 5 times cost (${rollData.power.cost})`;
    total += actorSystemData.might.value - 5 * rollData.power.cost;
  }

  if (rollData.characteristic != "") {
    value = actorSystemData.characteristics[rollData.characteristic].value;
    total = parseInt(total) + parseInt(value);
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
    total = parseInt(total) + parseInt(value);
    msg = newLineAdd(msg);
    msg += rollData.label;
    msg += " (" + value + ")";

    if (rollData.ability.specApply == true) {
      total = parseInt(total) + 1;
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

    if (rollData.hasGenericField(1)) {
      total += rollData.getGenericFieldValue(1);
      msg = newLineAdd(msg);
      msg += rollData.getGenericFieldLabel(1) + " (" + rollData.getGenericFieldValue(1) + ")";
    }
    if (rollData.hasGenericField(2)) {
      total -= rollData.getGenericFieldValue(2);
      msg = newLineSub(msg);
      msg += rollData.getGenericFieldLabel(2) + " (" + rollData.getGenericFieldValue(2) + ")";
    }
    if (rollData.hasGenericField(3)) {
      total -= rollData.getGenericFieldValue(3);
      msg = newLineSub(msg);
      msg += rollData.getGenericFieldLabel(3) + " (" + rollData.getGenericFieldValue(3) + ")";
    }

    if (rollData.hasGenericField(4)) {
      total -= rollData.getGenericFieldValue(4);
      msg = newLineSub(msg);
      msg += rollData.getGenericFieldLabel(4) + " (" + rollData.getGenericFieldValue(4) + ")";
    }
  } else {
    if (rollData.hasGenericField(1)) {
      total += rollData.getGenericFieldValue(1);
      msg = newLineAdd(msg);
      msg += rollData.getGenericFieldLabel(1) + " (" + rollData.getGenericFieldValue(1) + ")";
    }
    if (rollData.hasGenericField(2)) {
      msg = newLineAdd(msg);
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
  }

  ///
  // after computing total
  ///
  if (rollData.type == "spell" || rollData.type == "magic") {
    const multiplier =
      rollData.penetration.multiplierBonusArcanic +
      rollData.penetration.multiplierBonusSympathic +
      1;
    let score = rollData.penetration.score;
    if (rollData.penetration.specApply) {
      score += 1;
    }
    if (rollData.penetration.penetrationMastery) {
      score += rollData.penetration.masteryScore;
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

async function CheckBotch(html, actorData) {
  let resultMessage = "";

  let botchDice = html.find("#botchDice").val();
  if (!botchDice) {
    return ui.notifications.info(game.i18n.localize("arm5e.notification.roll.botchNum"));
  }
  let rollCommand = botchDice;
  rollCommand = rollCommand.concat("d10cf=10");
  const botchRoll = new Roll(rollCommand);
  await botchRoll.roll({
    async: true
  });
  return botchRoll;
  // return botchRoll.terms[0].total;
}

async function explodingRoll(actorData, modes = 0) {
  let dieRoll;
  if (modes === 0 || modes === 4) {
    dieRoll = new Roll(`1d10`);
  } else if (modes === 1) {
    dieRoll = new Roll("1");
    ui.notifications.info(`${actorData.name} used DEV mode to roll a 1`);
  } else {
    dieRoll = new Roll("10");
    ui.notifications.info(`${actorData.name} used DEV mode to roll a 0`);
  }

  await dieRoll.roll({
    async: true
  });
  // explode mode
  if (dieRoll.total === 1) {
    mult *= 2;
    let funRolls = game.settings.get("arm5e", "funRolls");
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
                  dieRoll = await explodingRoll(actorData);
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
      dieRoll = await explodingRoll(actorData);
    }
  } else {
    if (modes != 4 && mult === 1 && dieRoll.total === 10) {
      mult *= 0;
      const html = await renderTemplate("systems/arm5e/templates/roll/roll-botch.html");

      // show dialog

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
                  dieRoll = await CheckBotch(html, actorData);
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
    }
  }

  return dieRoll;
}

function multiplyRoll(mult, roll, rollFormula, divide) {
  if (!roll._evaluated) return;
  let rollInit = `${roll._formula} + ${rollFormula}`;
  if (Number.parseInt(mult) > 1) {
    rollInit = `${mult} * ${rollInit}`;
  }
  if (Number.parseInt(divide) > 1) {
    rollInit = `( ${rollInit} ) / ${divide}`;
  }
  let output_roll = new Roll(rollInit);
  output_roll.data = {};
  //console.log(roll._total);
  //if(parseInt(divide) > 1){
  //    output_roll.terms.push("/"+ divide);
  //}
  output_roll._evaluated = true;
  output_roll._total = (mult * roll._total + parseInt(rollFormula)) / parseInt(divide);

  return output_roll;
}

async function noRoll(html, actor, callBack) {
  actor = getFormData(html, actor);
  actor = getRollFormula(actor);
  const rollData = actor.rollData;
  //console.log('simple die');
  //console.log(actorData);
  let details = putInFoldableLink("arm5e.sheet.label.details", rollData.details);

  let chatTitle = '<h2 class="ars-chat-title">' + rollData.label + "</h2>";

  const flags = {
    arm5e: {
      roll: { type: "power", img: rollData.img, name: rollData.name },
      secondaryScore: rollData.secondaryScore
    }
  };
  let formula = `${rollData.formula}`;
  // let rollMode = CONST.DICE_ROLL_MODES.PUBLIC;
  let rollMode = game.settings.get("core", "rollMode");
  if (actor.type != "player") {
    rollMode = CONST.DICE_ROLL_MODES.PRIVATE;
  }

  const dieRoll = new Roll(formula, actor.system);
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
  await actor.update({
    system: { might: { points: actor.system.might.points - rollData.power.cost } }
  });
  actor.rollData.reset();
}

export { simpleDie, stressDie, noRoll };
