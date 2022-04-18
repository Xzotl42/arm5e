let mult = 1;

async function simpleDie(html, actorData, callBack) {
  actorData = getFormData(html, actorData);
  actorData = getRollFormula(actorData);

  //console.log('simple die');
  //console.log(actorData);
  let name = '<h2 class="ars-chat-title">' + actorData.data.data.roll.label + "</h2>";
  let formula = "1D10+" + actorData.data.data.roll.rollFormula;
  if (actorData.data.data.roll.divide > 1) {
    formula = "(1D10+" + actorData.data.data.roll.rollFormula + ")/" + actorData.data.data.roll.divide;
  }
  const dieRoll = new Roll(formula, actorData.data.data);
  let tmp = await dieRoll.roll({
    async: true
  });
  const message = await tmp.toMessage({
    speaker: ChatMessage.getSpeaker({
      actor: actorData
    }),
    flavor:
      name + game.i18n.localize("arm5e.dialog.button.simpledie") + ": <br />" + actorData.data.data.roll.rollLabel,
    flags: {
      arm5e: {
        confScore: actorData.data.data.con.score
      }
    }
  });

  if (callBack) {
    callBack(html, actorData, tmp, message);
  }
}

async function stressDie(html, actor, modes = 0, callBack) {
  mult = 1;
  actor = getFormData(html, actor);
  actor = getRollFormula(actor);
  let formula = actor.data.data.roll.rollFormula;
  let rollLabel = actor.data.data.roll.rollLabel;

  let name = '<h2 class="ars-chat-title">' + actor.data.data.roll.label + "</h2>";
  let dieRoll = await explodingRoll(actor, modes);
  let flavorTxt = name + game.i18n.localize("arm5e.dialog.button.stressdie") + ": <br />";
  let lastRoll;
  let confAllowed = actor.data.data.con.score;
  let botchCheck = 0;
  if (isNaN(dieRoll)) {
    if (mult > 1) {
      flavorTxt = name + "<h3>" + game.i18n.localize("arm5e.messages.die.exploding") + "</h3><br/>";
    }
    lastRoll = multiplyRoll(mult, dieRoll, formula, actor.data.data.roll.divide);
  } else {
    if (dieRoll == 1) {
      flavorTxt = name + "<h2>" + game.i18n.localize("arm5e.messages.die.botch") + "</h2><br/>";
    } else {
      flavorTxt = name + "<h2>" + game.i18n.format("arm5e.messages.die.botches", { num: dieRoll }) + "</h2><br/>";
    }

    botchCheck = 1;
    if (dieRoll > 0) {
      confAllowed = 0;
    }
    lastRoll = new Roll("0");
    await lastRoll.evaluate({ async: true });
  }

  const message = await lastRoll.toMessage({
    flavor: flavorTxt + rollLabel,
    speaker: ChatMessage.getSpeaker({
      actor: actor
    }),
    flags: {
      arm5e: {
        divide: actor.data.data.roll.divide,
        confScore: confAllowed,
        botchCheck: botchCheck
      }
    }
  });

  if (callBack) {
    callBack(html, actor, lastRoll, message);
  }
}

function getFormData(html, actorData) {
  let find = html.find(".SelectedCharacteristic");
  if (find.length > 0) {
    actorData.data.data.roll.characteristic = find[0].value;
  }

  find = html.find(".SelectedAbility");
  if (find.length > 0) {
    actorData.data.data.roll.ability = find[0].value;
  }

  find = html.find(".abilitySpeciality");
  if (find.length > 0) {
    actorData.data.data.roll.abilitySpeciality = find[0].checked;
  }

  find = html.find(".SelectedTechnique");
  if (find.length > 0) {
    actorData.data.data.roll.technique = find[0].value;
  }

  find = html.find(".SelectedForm");
  if (find.length > 0) {
    actorData.data.data.roll.form = find[0].value;
  }

  find = html.find(".SelectedAura");
  if (find.length > 0) {
    actorData.data.data.roll.aura = find[0].value;
  }

  find = html.find(".SelectedModifier");
  if (find.length > 0) {
    actorData.data.data.roll.modifier = find[0].value;
  }

  find = html.find(".SelectedAdvantage");
  if (find.length > 0) {
    actorData.data.data.roll.advantage = find[0].value;
  }

  find = html.find(".SelectedFocus");
  if (find.length > 0) {
    actorData.data.data.roll.focus = find[0].checked;
  }

  return actorData;
}

/*
    "roll":{
        "characteristic": "",
        "ability": "",
        "technique": "",
        "form": "",
        "total": "",
        "rollLabel": "",
        "rollFormula": ""
    }
*/

function getRollFormula(actor) {
  let total = 0;
  let value = 0;
  let msg = "";
  let actorData = actor.data.data;
  if (actorData.roll.type == "spell" || actorData.roll.type == "magic" || actorData.roll.type == "spont") {
    let valueTech = 0;
    let valueForm = 0;
    if (actorData.roll.type == "spell") {
      valueTech = actorData.roll.techniqueScore;
      valueForm = actorData.roll.formScore;
      actorData.roll.technique = actorData.roll.spell.technique;
      actorData.roll.form = actorData.roll.spell.form;
    } else {
      actorData.roll.techniqueText = actorData.arts.techniques[actorData.roll.technique].label;
      actorData.roll.formText = actorData.arts.forms[actorData.roll.form].label;
      valueTech = parseInt(actorData.arts.techniques[actorData.roll.technique].finalScore);
      valueForm = parseInt(actorData.arts.forms[actorData.roll.form].finalScore);
    }
    if (actorData.roll.focus === true) {
      if (valueTech < valueForm) {
        total = parseInt(total) + 2 * valueTech + valueForm;
        msg = msg + actorData.roll.techniqueText;
        msg = msg + " ( 2 x " + valueTech + ") + <br />";
        msg = msg + actorData.roll.formText;
        msg = msg + " (" + valueForm + ")";
      } else {
        total = parseInt(total) + 2 * valueForm + valueTech;
        msg = msg + actorData.roll.techniqueText;
        msg = msg + " (" + valueTech + ") + <br />";
        msg = msg + actorData.roll.formText;
        msg = msg + " ( 2 x " + valueForm + ")";
      }
    } else {
      total = parseInt(total) + valueTech;
      msg = msg + actorData.roll.techniqueText;
      msg = msg + " (" + valueTech + ")";

      total = parseInt(total) + valueForm;
      if (msg != "") {
        msg = msg + " + <br />";
      }
      msg = msg + actorData.roll.formText;
      msg = msg + " (" + valueForm + ")";
    }
    if (actorData.roll.type == "magic" || actorData.roll.type == "spont") {
      actor.loseFatigueLevel(1);
    }
  }

  if (actorData.roll.characteristic != "") {
    value = actorData.characteristics[actorData.roll.characteristic].value;
    total = parseInt(total) + parseInt(value);
    if (msg != "") {
      msg = msg + " + <br />";
    }
    let name = game.i18n.localize(actorData.charmetadata[actorData.roll.characteristic].label);
    if (actorData.roll.type == "char") {
      actorData.roll.label = name;
    }

    msg = msg + name;
    msg = msg + " (" + value + ")";
  }

  if (actorData.roll.ability != "") {
    for (var i = 0; i < actorData.abilities.length; i++) {
      if (actorData.abilities[i]._id == actorData.roll.ability) {
        value = actorData.abilities[i].data.finalScore;
        total = parseInt(total) + parseInt(value);
        if (msg != "") {
          msg = msg + " + <br />";
        }
        actorData.roll.label = actorData.abilities[i].name;
        msg = msg + actorData.roll.label;
        msg = msg + " (" + value + ")";
        break;
      }
    }

    if (actorData.roll.abilitySpeciality == true) {
      total = parseInt(total) + 1;
      msg = msg + " ( + 1 " + game.i18n.localize("arm5e.sheet.speciality") + " )";
    }
  }

  if (actorData.roll.aura != "" && actorData.roll.aura != 0) {
    value = actorData.roll.aura;
    total = parseInt(total) + parseInt(value);
    if (msg != "") {
      msg = msg + " + <br />";
    }
    msg = msg + "Aura";
    msg = msg + " (" + value + ")";
  }

  if (actorData.roll.ritual === true) {
    value = actorData.laboratory.abilitiesSelected.artesLib.value;
    value += actorData.laboratory.abilitiesSelected.philosophy.value;
    total = parseInt(total) + parseInt(value);
    if (msg != "") {
      msg = msg + " + <br />";
    }
    msg =
      msg +
      game.i18n.localize("arm5e.skill.academic.artesLib") +
      " + " +
      game.i18n.localize("arm5e.skill.academic.philosophy");
    msg = msg + " (" + value + ")";
  }
  if (actorData.roll.advantage != 0) {
    value = actorData.roll.advantage;
    total = parseInt(total) + parseInt(value);
    if (msg != "") {
      msg = msg + " + <br />";
    }
    msg = msg + game.i18n.localize("arm5e.sheet.advantage");
    msg = msg + " (" + value + ")";
  }
  if (actorData.roll.modifier != 0) {
    value = actorData.roll.modifier;
    total = parseInt(total) + parseInt(value);
    if (msg != "") {
      msg = msg + " + <br />";
    }
    msg = msg + game.i18n.localize("arm5e.sheet.modifier");
    msg = msg + " (" + value + ")";
  }

  if (actorData.roll.type == "spont") {
    actorData.roll.label =
      game.i18n.localize("arm5e.sheet.spontaneousMagic") +
      " (" +
      actorData.config.magic.arts[actorData.roll.technique].short +
      actorData.config.magic.arts[actorData.roll.form].short +
      ")";
  }

  if (actorData.roll.txtOption1 != "") {
    total = total + parseInt(actorData.roll.option1);
    if (msg != "") {
      msg = msg + " + <br />";
    }
    msg = msg + actorData.roll.txtOption1 + " (" + actorData.roll.option1 + ")";
  }
  if (actorData.roll.txtOption2 != "") {
    total = total + parseInt(actorData.roll.option2);
    if (msg != "") {
      msg = msg + " + <br />";
    }
    msg = msg + actorData.roll.txtOption2 + " (" + actorData.roll.option2 + ")";
  }
  if (actorData.roll.txtOption3 != "") {
    total = total + parseInt(actorData.roll.option3);
    if (msg != "") {
      msg = msg + " + <br />";
    }
    msg = msg + actorData.roll.txtOption3 + " (" + actorData.roll.option3 + ")";
  }
  if (actorData.roll.txtOption4 != "") {
    total = total + parseInt(actorData.roll.option4);
    if (msg != "") {
      msg = msg + " + <br />";
    }
    msg = msg + actorData.roll.txtOption4 + " (" + actorData.roll.option4 + ")";
  }
  if (actorData.roll.txtOption5 != "") {
    total = total + parseInt(actorData.roll.option5);
    if (msg != "") {
      msg = msg + " + <br />";
    }
    msg = msg + actorData.roll.txtOption5 + " (" + actorData.roll.option5 + ")";
  }

  if (actorData.roll.bonusActiveEffects) {
    total = total + actorData.roll.bonusActiveEffects;
    if (msg != "") {
      msg = msg + " + <br />";
    }
    msg = msg + game.i18n.localize("arm5.sheet.bonus.activeEffects") + " (" + actorData.roll.bonusActiveEffects + ")";
  }
  if (actorData.roll.bonus > 0) {
    total = total + actorData.roll.bonus;
    if (msg != "") {
      msg = msg + " + <br />";
    }
    msg = msg + game.i18n.localize("arm5e.messages.die.bonus") + " (" + actorData.roll.bonus + ")";
  }

  if (actorData.roll.useFatigue == true) {
    if (actorData.fatigueTotal != 0) {
      total = total + actorData.fatigueTotal;
      if (msg != "") {
        msg = msg + " + <br />";
      }
      msg = msg + game.i18n.localize("arm5e.sheet.fatigue");
      msg = msg + " (" + actorData.fatigueTotal + ")";
    }
    if (actorData.woundsTotal != 0) {
      total = total + actorData.woundsTotal;
      if (msg != "") {
        msg = msg + " + <br />";
      }
      msg = msg + game.i18n.localize("arm5e.sheet.wounds");
      msg = msg + " (" + actorData.woundsTotal + ")";
    }
  }

  if (actorData.roll.divide > 1) {
    if (msg != "") {
      msg = msg + " + <br />";
    }
    msg = msg + game.i18n.localize("arm5e.messages.die.divideBy") + actorData.roll.divide;
  }
  actorData.roll.rollFormula = total;
  actorData.roll.rollLabel = msg;

  return actor;
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

  return botchRoll.terms[0].total;
}

async function explodingRoll(actorData, modes = 0) {
  let dieRoll;
  if (modes === 0) {
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
    let withDialog = funRolls == "EVERYONE" || (funRolls == "PLAYER_ONLY" && actorData.hasPlayerOwner);
    if (withDialog) {
      let data = {
        msg: game.i18n.localize("arm5e.dialog.roll.exploding.multiplier") + " : " + mult
      };
      const html = await renderTemplate("systems/arm5e/templates/generic/explodingRoll.html", data);
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
                  dieRoll = await explodingRoll();
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
      dieRoll = await explodingRoll();
    }
  } else {
    if (mult === 1 && dieRoll.total === 10) {
      mult *= 0;
      var botchNum = 0;
      const html = await renderTemplate("systems/arm5e/templates/roll/roll-botch.html");

      // show dialog

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
                  botchNum = await CheckBotch(html, actorData);
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

      // hack , JS doesn't care about type
      if (botchNum > 0) {
        return botchNum;
      }
    }
  }

  return dieRoll;
}

function multiplyRoll(mult, roll, rollFormula, divide) {
  if (!roll._evaluated) return;
  let output_roll = new Roll(`${mult} * (${roll._formula}) + ${rollFormula}`);
  output_roll.data = {};
  // output_roll._total = [ mult, `*`, ...roll.result];
  output_roll.terms = [mult, `*`, ...roll.terms];
  //console.log(output_roll)
  //if(parseInt(divide) > 1){
  //    output_roll.terms.push("/"+ divide);
  //}
  output_roll._evaluated = true;
  output_roll._total = (mult * roll._total + parseInt(rollFormula)) / parseInt(divide);

  return output_roll;
}

export { simpleDie, stressDie };
