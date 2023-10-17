import { getDataset, log } from "../tools.js";
import { ArM5ePCActor } from "../actor/actor.js";

export async function setAgingEffects(actor, roll, message) {
  let rtCompendium = game.packs.get("arm5e.rolltables");
  let docs = await rtCompendium.getDocuments();
  const agingTable = docs.filter((rt) => rt.name === "Aging table")[0];
  let res = agingTable.getResultsForRoll(roll.total)[0].text;
  let dialogData = CONFIG.ARM5E.activities.aging[res];

  dialogData.year = actor.rollData.environment.year;
  dialogData.season = actor.rollData.environment.season;
  dialogData.choice = res === "crisis" || res === "anyAgingPt";
  dialogData.chars = CONFIG.ARM5E.character.characteristics;

  const renderedTemplate = await renderTemplate(
    "systems/arm5e/templates/generic/aging-dialog.html",
    dialogData
  );
  let resultAging = {};
  await new Promise((resolve) => {
    new Dialog(
      {
        title: game.i18n.localize("arm5e.aging.summary"),
        content: renderedTemplate,
        buttons: {
          yes: {
            icon: "<i class='fas fa-check'></i>",
            label: game.i18n.localize("arm5e.sheet.action.apply"),
            callback: async (html) => {
              let find = html.find(".SelectedCharacteristic");
              if (find.length > 0) {
                dialogData.char = find[0].value;
              }
              resultAging = await actor.getAgingEffects(dialogData);
              resolve();
            }
          },
          no: {
            icon: "<i class='fas fa-bomb'></i>",
            label: game.i18n.localize("arm5e.dialog.button.cancel"),
            callback: (html) => {
              resolve();
            }
          }
        }
      },
      {
        classes: ["arm5e-dialog", "dialog"],
        height: "600px",
        width: "400px"
      }
    ).render(true);
  });
  resultAging.roll = { formula: roll._formula, result: roll.result };
  resultAging.year = actor.rollData.environment.year;

  await updateAgingDiaryEntry(actor, resultAging);
}

export async function agingRoll(item) {
  const input = {
    roll: "aging",
    year: item.system.dates[0].year,
    season: item.system.dates[0].season,
    moredata: { diaryId: item._id }
  };
  await item.actor.sheet._onRoll(input);
}

export async function agingCrisis(actor, roll, message) {
  let rtCompendium = game.packs.get("arm5e.rolltables");
  let docs = await rtCompendium.getDocuments();

  const crisisTable = docs.filter((rt) => rt.name === "Aging crisis table")[0];
  let res = crisisTable.getResultsForRoll(roll.total)[0].text;

  const title =
    '<h2 class="ars-chat-title">' + game.i18n.localize("arm5e.aging.crisis.summary") + "</h2>";

  // log(false, `Crisis result expanded: ${msg}`);
  ChatMessage.create({
    content: title + "<h3>" + game.i18n.localize(`arm5e.aging.crisis.${res}`) + "</h3><br/>",
    speaker: ChatMessage.getSpeaker({
      actor: actor
    }),
    whisper: ChatMessage.getWhisperRecipients("gm")
  });

  await actor.update({ system: { pendingCrisis: false } }, {});
}

export async function updateAgingDiaryEntry(actor, input) {
  let item = actor.items.get(actor.rollData.additionalData.diaryId);
  let desc =
    item.system.description +
    game.i18n.localize("arm5e.aging.result0") +
    "<br/>" +
    game.i18n.format("arm5e.aging.result1", {
      character: actor.name,
      year: input.year
    });
  if (input.apparent == 0) {
    desc += game.i18n.localize("arm5e.aging.result2");
  } else if (input.crisis) {
    desc += game.i18n.localize("arm5e.aging.result3");
  }
  for (let [key, char] of Object.entries(input.charac)) {
    if (char.aging) {
      desc += game.i18n.format("arm5e.aging.result4", {
        num: char.aging,
        characteristic: game.i18n.localize(CONFIG.ARM5E.character.characteristics[key].label)
      });
    }
    if (char.score) {
      desc += game.i18n.format("arm5e.aging.result5", {
        characteristic: game.i18n.localize(CONFIG.ARM5E.character.characteristics[key].label)
      });
    }
  }

  if (input.decrepitude) {
    desc += game.i18n.format("arm5e.aging.result6", {
      num: input.decrepitude
    });
  }

  if (input.warping) {
    desc += game.i18n.format("arm5e.aging.result7", {
      num: input.warping.points
    });
  }

  desc += "<br/>- Roll: " + input.roll.formula + " => " + input.roll.result;
  let updateData = {
    _id: item._id,
    "system.description": desc,
    "flags.arm5e.effect": input,
    "system.done": true
  };

  await actor.updateEmbeddedDocuments("Item", [updateData], {});
}

export async function createAgingDiaryEntry(actor, input) {
  let diaryEntry = {
    name: game.i18n.format("arm5e.aging.resultTitle", {
      character: actor.name
    }),
    img: "systems/arm5e/assets/icons/Icon_Aging_and_Decrepitude.png",
    type: "diaryEntry",
    system: {
      dates: [{ year: input.year, season: input.season, applied: false }],
      activity: "aging",
      description: "",
      duration: 1,
      done: false,
      rollDone: false
    }
  };
  return await actor.createEmbeddedDocuments("Item", [diaryEntry], {});
}

// ********************
// Progress activities
// ********************

export function genericValidationOfActivity(context, actor, item) {
  // check if there are any previous activities not applied.
  if (context.enforceSchedule && item.system.hasUnappliedActivityInThePast(actor)) {
    context.system.applyPossible = false;
    context.system.applyError = "arm5e.activity.msg.unappliedActivities";
  }
  // check if it ends in the future
  let currentDate = game.settings.get("arm5e", "currentDate");
  if (
    context.lastSeason.year > currentDate.year ||
    (context.lastSeason.year == currentDate.year &&
      CONFIG.SEASON_ORDER[context.lastSeason.season] > CONFIG.SEASON_ORDER[currentDate.season])
  ) {
    context.system.applyPossible = false;
    context.system.applyError = "arm5e.activity.msg.activityEndsInFuture";
  }
}

function checkForDuplicates(param, context, array) {
  // look for duplicates
  let ids = array.map((e) => {
    return e.id;
  });
  if (
    ids.some((e) => {
      return ids.indexOf(e) !== ids.lastIndexOf(e);
    })
  ) {
    context.system.applyPossible = false;
    context.system.errorParam = param;
    context.system.applyError = "arm5e.activity.msg.duplicates";
  }
}

function checkArtProgressItems(context, item, max) {
  // look for duplicates arts
  let artsArr = Object.values(item.system.progress.arts);
  let artsKeys = artsArr.map((e) => {
    return e.key;
  });
  if (
    artsKeys.some((e) => {
      return artsKeys.indexOf(e) !== artsKeys.lastIndexOf(e);
    })
  ) {
    context.system.applyPossible = false;
    context.system.applyError = "arm5e.activity.msg.duplicates";
    context.system.errorParam = "arts";
  }
  let res = 0;
  for (const a of artsArr) {
    if (a.xp < 0 || a.xp > max) {
      context.system.applyPossible = false;
      context.system.applyError = "arm5e.activity.msg.wrongSingleItemXp";
      context.system.errorParam = max;
      return 0;
    }
    res += a.xp;
  }
  return res;
}

// return the total xp
function checkMaxXpPerItem(context, array, max) {
  let res = 0;
  for (const ab of array) {
    if (ab.xp < 0 || ab.xp > max) {
      context.system.applyPossible = false;
      context.system.applyError = "arm5e.activity.msg.wrongSingleItemXp";
      context.system.errorParam = max;
      return 0;
    }
    res += Number(ab.xp);
  }
  return res;
}

export function validAging(context, actor, item) {
  if (context.firstSeason.season !== "winter") {
    context.system.applyInfo = game.i18n.localize("arm5e.activity.msg.agingInWinter");
    context.unnaturalAging = true;
  }
}

export function validAdventuring(context, actor, item) {
  context.system.totalXp = { abilities: 0, arts: 0, masteries: 0, spellLevels: 0 };

  let abilitiesArr = Object.values(item.system.progress.abilities);
  checkForDuplicates("abilities", context, abilitiesArr);
  context.system.totalXp.abilities = checkMaxXpPerItem(context, abilitiesArr, 5);

  context.system.totalXp.arts += checkArtProgressItems(context, item, 5);

  let spellsArr = Object.values(item.system.progress.spells);
  checkForDuplicates("spells", context, spellsArr);
  context.system.totalXp.masteries = checkMaxXpPerItem(context, spellsArr, 5);

  if (
    context.system.totalXp.abilities +
      context.system.totalXp.arts +
      context.system.totalXp.masteries !=
    context.system.sourceQuality + context.system.sourceModifier
  ) {
    context.system.applyPossible = false;
    if (context.system.applyError === "") {
      context.system.errorParam =
        context.system.totalXp.abilities +
        context.system.totalXp.arts +
        context.system.totalXp.masteries;
      context.system.applyError = "arm5e.activity.msg.wrongTotalXp";
    }
  }
}

export function validChildhood(context, actor, item) {
  context.system.totalXp = { abilities: 0, arts: 0, masteries: 0 };

  let abilitiesArr = Object.values(item.system.progress.abilities);
  checkForDuplicates("abilities", context, abilitiesArr);
  context.system.totalXp.abilities = checkMaxXpPerItem(context, abilitiesArr, 1000);
  const filteredArray = actor.system.abilities.filter((e) => {
    return abilitiesArr.some((filter) => {
      return filter.id === e._id && e.system.key == "livingLanguage" && filter.xp >= 50;
    });
  });

  if (filteredArray.length != 1) {
    context.system.applyPossible = true;
    if (context.system.applyError === "")
      context.system.applyError = "arm5e.activity.msg.missingMotherTongue";
  }

  if (
    context.system.totalXp.abilities +
      context.system.totalXp.arts +
      context.system.totalXp.masteries !=
    context.system.sourceQuality + context.system.sourceModifier
  ) {
    context.system.applyPossible = false;
    if (context.system.applyError === "") {
      context.system.errorParam =
        context.system.totalXp.abilities +
        context.system.totalXp.arts +
        context.system.totalXp.masteries;
      context.system.applyError = "arm5e.activity.msg.wrongTotalXp";
    }
  }
}

export function validTotalXp(context, actor, item) {
  context.system.totalXp = { abilities: 0, arts: 0, masteries: 0, spellLevels: 0 };

  let abilitiesArr = Object.values(item.system.progress.abilities);
  checkForDuplicates("abilities", context, abilitiesArr);
  context.system.totalXp.abilities = checkMaxXpPerItem(context, abilitiesArr, 1000);

  context.system.totalXp.arts += checkArtProgressItems(context, item, 1000);

  let spellsArr = Object.values(item.system.progress.spells);
  checkForDuplicates("spells", context, spellsArr);
  context.system.totalXp.masteries = checkMaxXpPerItem(context, spellsArr, 1000);

  let newSpellsArr = Object.values(item.system.progress.newSpells);
  context.system.totalXp.spellLevels = newSpellsArr.reduce((sum, e) => {
    return sum + e.level;
  }, 0);

  const totalXp =
    context.system.totalXp.abilities +
    context.system.totalXp.arts +
    context.system.totalXp.masteries +
    context.system.totalXp.spellLevels;
  if (totalXp != context.system.sourceQuality + context.system.sourceModifier) {
    context.system.applyPossible = false;
    if (context.system.applyError === "") {
      context.system.errorParam = totalXp;
      context.system.applyError = "arm5e.activity.msg.wrongTotalXp";
    }
  }
}

export function validExposure(context, actor, item) {
  context.system.totalXp = { abilities: 0, arts: 0, masteries: 0 };

  let abilitiesArr = Object.values(item.system.progress.abilities);
  checkForDuplicates("abilities", context, abilitiesArr);
  context.system.totalXp.abilities = checkMaxXpPerItem(
    context,
    abilitiesArr,
    context.system.sourceQuality + context.system.sourceModifier
  );

  context.system.totalXp.arts += checkArtProgressItems(
    context,
    item,
    context.system.sourceQuality + context.system.sourceModifier
  );

  let spellsArr = Object.values(item.system.progress.spells);
  checkForDuplicates("spells", context, spellsArr);
  context.system.totalXp.masteries = checkMaxXpPerItem(
    context,
    spellsArr,
    context.system.sourceQuality + context.system.sourceModifier
  );

  if (
    context.system.totalXp.abilities +
      context.system.totalXp.arts +
      context.system.totalXp.masteries !=
    context.system.sourceQuality + context.system.sourceModifier
  ) {
    context.system.applyPossible = false;
    if (context.system.applyError === "") {
      context.system.errorParam =
        context.system.totalXp.abilities +
        context.system.totalXp.arts +
        context.system.totalXp.masteries;
      context.system.applyError = "arm5e.activity.msg.wrongTotalXp";
    }
  }
}

export function validPractice(context, actor, item) {
  const activityConfig = CONFIG.ARM5E.activities.generic[context.system.activity];
  context.system.totalXp = { abilities: 0, arts: 0, masteries: 0 };

  let abilitiesArr = Object.values(item.system.progress.abilities);
  checkForDuplicates("abilities", context, abilitiesArr);
  context.system.totalXp.abilities = checkMaxXpPerItem(
    context,
    abilitiesArr,
    context.system.sourceQuality + context.system.sourceModifier + context.system.sourceBonus
  );

  let spellsArr = Object.values(item.system.progress.spells);
  checkForDuplicates("spells", context, spellsArr);
  context.system.totalXp.masteries = checkMaxXpPerItem(
    context,
    spellsArr,
    context.system.sourceQuality + context.system.sourceModifier + context.system.sourceBonus
  );
  let optionError = false;
  if (item.system.optionKey == "language") {
    if (spellsArr.length > 0) {
      optionError = true;
    } else {
      const filteredArray = actor.system.abilities.filter((e) => {
        return abilitiesArr.some((filter) => {
          return (
            filter.id === e._id &&
            e.system.key != "livingLanguage" &&
            e.system.key != "deadLanguage"
          );
        });
      });
      if (filteredArray.length > 0) {
        optionError = true;
      }
    }
  } else if (item.system.optionKey == "area") {
    if (spellsArr.length > 0) {
      optionError = true;
    } else {
      const filteredArray = actor.system.abilities.filter((e) => {
        return abilitiesArr.some((filter) => {
          return filter.id === e._id && e.system.key != "areaLore";
        });
      });
      if (filteredArray.length > 0) {
        optionError = true;
      }
    }
  } else if (item.system.optionKey == "mastery") {
    if (abilitiesArr.length > 0) {
      optionError = true;
    }
  }
  if (optionError === true) {
    context.system.applyPossible = true;
    // context.system.applyPossible = false;
    context.system.errorParam = game.i18n.localize(
      activityConfig.bonusOptions[item.system.optionKey].label
    );
    context.system.applyError = "arm5e.activity.msg.wrongOption";
  }

  if (
    context.system.totalXp.abilities +
      context.system.totalXp.arts +
      context.system.totalXp.masteries !=
    context.system.sourceQuality + context.system.sourceModifier + context.system.sourceBonus
  ) {
    context.system.applyPossible = false;
    if (context.system.applyError === "") {
      context.system.errorParam =
        context.system.totalXp.abilities +
        context.system.totalXp.arts +
        context.system.totalXp.masteries;
      context.system.applyError = "arm5e.activity.msg.wrongTotalXp";
    }
  }
}

function checkIfCapped(context, teacherScore, coeff, progressItem) {
  let newXp =
    (context.system.sourceQuality +
      context.system.sourceModifier +
      context.system.sourceBonus +
      progressItem.system.xp) *
    coeff;
  let teacherXp = ArM5ePCActor.getAbilityXp(teacherScore);
  // TODO check/review
  if (newXp > teacherXp) {
    let newSource = teacherXp / coeff - progressItem.system.xp; //- context.system.sourceModifier;
    context.system.theoriticalSource =
      context.system.sourceQuality + context.system.sourceModifier + context.system.sourceBonus;
    context.system.sourceQuality = newSource > 0 ? newSource : 0;
    context.system.errorParam = context.system.sourceQuality;
    context.system.applyError = "arm5e.activity.msg.gainCapped";
    context.system.cappedGain = true;
  }
}

export function validTraining(context, actor, item) {
  const activityConfig = CONFIG.ARM5E.activities.generic[context.system.activity];
  context.system.totalXp = { abilities: 0, arts: 0, masteries: 0, spellLevels: 0 };
  let abilitiesArr = Object.values(item.system.progress.abilities);
  let spellsArr = Object.values(item.system.progress.spells);
  if (abilitiesArr.length + spellsArr.length > 1) {
    context.system.applyPossible = true;
    context.system.applyError = "arm5e.activity.msg.tooManyItems";
    context.system.errorParam = 1;
    return;
  } else if (abilitiesArr.length + spellsArr.length == 0) {
    context.system.applyPossible = false;
    context.system.applyError = "arm5e.activity.msg.noProgressItems";
  }
  context.system.sourceQuality = 3;
  if (item.system.teacher.id === null) {
    context.system.sourceQuality += item.system.teacher.score;
  }

  if (abilitiesArr.length > 0) {
    const teacherScore = Number(item.system.progress.abilities[0].teacherScore);
    context.system.sourceQuality = teacherScore + 3;
    let ability = Object.values(actor.system.abilities).find((e) => {
      return e._id === item.system.progress.abilities[0].id;
    });
    if (ability === undefined) {
      // either the ability is no longer teachable or it has been deleted
      ability = actor.items.get(item.system.progress.abilities[0].id);

      if (ability === undefined) {
        // ability deleted
        // what should be done here?
        return;
      }
    }
    const coeff = actor._getAbilityXpCoeff(ability.system.key, ability.system.option);
    checkIfCapped(context, teacherScore, coeff, ability);

    context.system.progress.abilities[0].xp = context.system.cappedGain
      ? context.system.sourceQuality
      : context.system.sourceQuality + context.system.sourceModifier;
    context.system.totalXp.abilities += context.system.progress.abilities[0].xp;
  } else if (spellsArr.length > 0) {
    const teacherScore = Number(item.system.progress.spells[0].teacherScore);
    context.system.sourceQuality = teacherScore + 3;
    const spell = Object.values(actor.system.spells).find((e) => {
      return e._id === item.system.progress.spells[0].id;
    });

    if (spell === undefined) {
      // either the spell is no longer teachable or it has been deleted
      spell = actor.items.get(item.system.progress.spells[0].id);

      if (spell === undefined) {
        // ability deleted
        // what should be done here?
        return;
      }
    }
    checkIfCapped(context, teacherScore, spell.system.xpCoeff, spell);

    context.system.progress.spells[0].xp = context.system.cappedGain
      ? context.system.sourceQuality
      : context.system.sourceQuality + context.system.sourceModifier;
    context.system.totalXp.masteries += context.system.progress.spells[0].xp;
  }

  if (context.system.cappedGain && context.system.sourceQuality == 0) {
    context.system.applyError = "arm5e.activity.msg.uselessTeacher";
    context.system.errorParam = context.system.teacher.name;
    context.system.applyPossible = false;
  }
}

export function validTeaching(context, actor, item) {
  const activityConfig = CONFIG.ARM5E.activities.generic[context.system.activity];
  context.system.totalXp = { abilities: 0, arts: 0, masteries: 0 };
  let abilitiesArr = Object.values(item.system.progress.abilities);
  let artsArr = Object.values(item.system.progress.arts);
  let spellsArr = Object.values(item.system.progress.spells);
  if (abilitiesArr.length + spellsArr.length + artsArr.length > 1) {
    context.system.applyPossible = false;
    context.system.applyError = "arm5e.activity.msg.tooManyItems";
    context.system.errorParam = 1;
    return;
  } else if (abilitiesArr.length + artsArr.length + spellsArr.length == 0) {
    context.system.applyError = "arm5e.activity.msg.noProgressItems";
    context.system.applyPossible = false;
  }
  context.system.sourceQuality = 3 + item.system.teacher.teaching + item.system.teacher.com;
  if (item.system.teacher.applySpec) {
    context.system.sourceQuality++;
  }

  if (abilitiesArr.length > 0) {
    const teacherScore = Number(item.system.progress.abilities[0].teacherScore);
    // if for some reason the teacher score was reduced...
    if (teacherScore < 2) {
      context.system.canEdit = "readonly";
      context.system.applyPossible = false;
      context.system.applyError = "arm5e.activity.msg.uselessTeacher";
      context.system.errorParam =
        context.system.teacher.name === ""
          ? game.i18n.localize("arm5e.activity.teacher.label")
          : context.system.teacher.name;
      return;
    }

    let ability = Object.values(actor.system.abilities).find((e) => {
      return e._id === item.system.progress.abilities[0].id;
    });
    if (ability === undefined) {
      // either the ability is no longer teachable or it has been deleted
      ability = actor.items.get(item.system.progress.abilities[0].id);

      if (ability === undefined) {
        // ability deleted
        // what should be done here?
        return;
      }
    }
    const coeff = actor._getAbilityXpCoeff(ability.system.key, ability.system.option);
    checkIfCapped(context, teacherScore, coeff, ability);

    context.system.progress.abilities[0].xp = context.system.cappedGain
      ? context.system.sourceQuality
      : context.system.sourceQuality + context.system.sourceModifier + context.system.sourceBonus;
    context.system.totalXp.abilities += context.system.progress.abilities[0].xp;
  } else if (spellsArr.length > 0) {
    const teacherScore = Number(item.system.progress.spells[0].teacherScore);

    // if for some reason the teacher score was reduced...
    if (teacherScore < 2) {
      context.system.canEdit = "readonly";
      context.system.applyPossible = false;
      context.system.applyError = "arm5e.activity.msg.uselessTeacher";
      context.system.errorParam =
        context.system.teacher.name === ""
          ? game.i18n.localize("arm5e.activity.teacher.label")
          : context.system.teacher.name;
      return;
    }

    const spell = Object.values(actor.system.spells).find((e) => {
      return e._id === item.system.progress.spells[0].id;
    });
    checkIfCapped(context, teacherScore, 1, spell);

    context.system.progress.spells[0].xp = context.system.cappedGain
      ? context.system.sourceQuality
      : context.system.sourceQuality + context.system.sourceModifier + context.system.sourceBonus;
    context.system.totalXp.masteries += context.system.progress.spells[0].xp;
  } else if (artsArr.length > 0) {
    const progressArt = item.system.progress.arts[0];
    const teacherScore = Number(progressArt.teacherScore);
    // if for some reason the teacher score was reduced...
    if (teacherScore < 5) {
      context.system.canEdit = "readonly";
      context.system.applyPossible = false;
      context.system.applyError = "arm5e.activity.msg.uselessTeacher";
      context.system.errorParam =
        context.system.teacher.name === ""
          ? game.i18n.localize("arm5e.activity.teacher.label")
          : context.system.teacher.name;
      return;
    }

    let artType = "techniques";
    if (Object.keys(CONFIG.ARM5E.magic.techniques).indexOf(progressArt.key) == -1) {
      artType = "forms";
    }
    const art = actor.system.arts[artType][progressArt.key];
    // checkIfCapped(context, teacherScore, 1, spell);
    let newXp = context.system.sourceQuality + art.xp;
    let teacherXp = ArM5ePCActor.getArtXp(teacherScore);
    if (newXp > teacherXp) {
      let newSource = teacherXp - art.xp;
      context.system.theoriticalSource = context.system.sourceQuality;
      context.system.sourceQuality = newSource > 0 ? newSource : 0;
      context.system.errorParam = context.system.sourceQuality;
      context.system.applyError = "arm5e.activity.msg.gainCapped";
      context.system.cappedGain = true;
    }
    context.system.progress.arts[0].xp = context.system.cappedGain
      ? context.system.sourceQuality
      : context.system.sourceQuality + context.system.sourceModifier + context.system.sourceBonus;
    context.system.totalXp.arts += context.system.progress.arts[0].xp;
  }
  if (context.system.cappedGain && context.system.sourceQuality == 0) {
    context.system.applyError = "arm5e.activity.msg.uselessTeacher";
    context.system.errorParam = context.system.teacher.name;
    context.system.applyPossible = false;
  }
}

export function validReading(context, actor, item) {
  context.system.totalXp = { abilities: 0, arts: 0, masteries: 0, spellLevels: 0 };
  let abilitiesArr = Object.values(item.system.progress.abilities);
  // context.system.totalXp.abilities = checkMaxXpPerItem(context, abilitiesArr, 1000);
  let artsArr = Object.values(item.system.progress.arts);
  // context.system.totalXp.arts += checkArtProgressItems(context, item, 1000);

  let spellsArr = Object.values(item.system.progress.spells);
  // context.system.totalXp.masteries = checkMaxXpPerItem(context, spellsArr, 1000);

  if (abilitiesArr.length > 0) {
    const maxLevel =
      Number(item.system.progress.abilities[0].maxLevel) == 0
        ? 100
        : Number(item.system.progress.abilities[0].maxLevel);
    let ability = Object.values(actor.system.abilities).find((e) => {
      return e._id === item.system.progress.abilities[0].id;
    });
    if (ability === undefined) {
      // either the ability is no longer teachable or it has been deleted
      ability = actor.items.get(item.system.progress.abilities[0].id);

      if (ability === undefined) {
        // ability deleted
        // what should be done here?
        return;
      }
    }
    const coeff = actor._getAbilityXpCoeff(ability.system.key, ability.system.option);
    checkIfCapped(context, maxLevel, coeff, ability);
    // let newXp = (context.system.sourceQuality + ability.system.xp) * coeff;
    // let maxXp = ArM5ePCActor.getAbilityXp(maxLevel);
    // if (newXp > maxXp && !context.system.applied) {
    //   let newSource = maxXp / coeff - ability.system.xp;
    //   context.system.theoriticalSource = context.system.sourceQuality;
    //   context.system.sourceQuality = newSource > 0 ? newSource : 0;
    //   context.system.errorParam = context.system.sourceQuality;
    //   context.system.applyError = "arm5e.activity.msg.gainCapped";
    //   context.system.cappedGain = true;
    // }
    context.system.progress.abilities[0].xp = context.system.cappedGain
      ? context.system.sourceQuality
      : context.system.sourceQuality + context.system.sourceModifier;
    context.system.totalXp.abilities += context.system.progress.abilities[0].xp;
  } else if (spellsArr.length > 0) {
    const maxLevel =
      Number(item.system.progress.spells[0].maxLevel) == 0
        ? 100
        : Number(item.system.progress.spells[0].maxLevel);

    const spell = Object.values(actor.system.spells).find((e) => {
      return e._id === item.system.progress.spells[0].id;
    });
    checkIfCapped(context, maxLevel, coeff, spell);
    // let newXp = context.system.sourceQuality + spell.system.xp;
    // let maxXp = ArM5ePCActor.getAbilityXp(maxLevel);
    // if (newXp > maxXp) {
    //   let newSource = maxXp - spell.system.xp;
    //   context.system.theoriticalSource = context.system.sourceQuality;
    //   context.system.sourceQuality = newSource > 0 ? newSource : 0;
    //   context.system.errorParam = context.system.sourceQuality;
    //   context.system.applyError = "arm5e.activity.msg.gainCapped";
    //   context.system.cappedGain = true;
    // }
    context.system.progress.spells[0].xp = context.system.cappedGain
      ? context.system.sourceQuality
      : context.system.sourceQuality + context.system.sourceModifier;
    context.system.totalXp.masteries += context.system.progress.spells[0].xp;
  } else if (artsArr.length > 0) {
    const progressArt = item.system.progress.arts[0];
    const maxLevel = Number(progressArt.maxLevel) == 0 ? 100 : Number(progressArt.maxLevel);
    let artType = "techniques";
    if (Object.keys(CONFIG.ARM5E.magic.techniques).indexOf(progressArt.key) == -1) {
      artType = "forms";
    }
    const art = actor.system.arts[artType][progressArt.key];
    let newXp = context.system.sourceQuality + art.xp;
    let maxXp = ArM5ePCActor.getArtXp(maxLevel);
    if (newXp > maxXp) {
      let newSource = maxXp - art.xp;
      context.system.theoriticalSource = context.system.sourceQuality;
      context.system.sourceQuality = newSource > 0 ? newSource : 0;
      context.system.errorParam = context.system.sourceQuality;
      context.system.applyError = "arm5e.activity.msg.gainCapped";
      context.system.cappedGain = true;
    }
    context.system.progress.arts[0].xp = context.system.cappedGain
      ? context.system.sourceQuality
      : context.system.sourceQuality + context.system.sourceModifier;
    context.system.totalXp.arts += context.system.progress.arts[0].xp;
  }

  if (context.system.cappedGain && context.system.sourceQuality == 0) {
    context.system.applyError = "arm5e.activity.msg.uselessTeacher";
    context.system.errorParam = context.system.teacher.name;
    context.system.applyPossible = false;
  }
}

export function validVisStudy(context, actor, item) {
  context.system.totalXp = { abilities: 0, arts: 0, masteries: 0, spellLevels: 0 };
  // const progressArt = item.system.progress.arts[0];

  context.system.totalXp.arts +=
    Number(context.system.sourceQuality) + context.system.sourceModifier;
}

export async function visStudy(item) {
  const visEntry = item.actor.items.get(item.system.externalIds[0].itemId);
  if (!visEntry) {
    ui.notifications.info(
      game.i18n.format("arm5e.notification.noEnoughVis", { name: item.actor.name })
    );
    return;
  }
  await visEntry.system.studyVis(item);
}

export function computeTotals(context) {
  context.system.totalXp = { abilities: 0, arts: 0, masteries: 0 };
}

export async function setVisStudyResults(actor, roll, message, rollData) {
  if (roll.botches > 0) {
    await actor.update({
      "system.warping.points": actorCaster.system.warping.points + roll.botches
    });
    //ui.notifications.info()
  } else {
    let diaryitem = actor.items.get(actor.rollData.additionalData.diaryId);
    const xpGain = roll.total + actor.system.bonuses.activities.visStudy;

    const updateData = { "system.sourceQuality": xpGain };
    const progressArts = diaryitem.system.progress.arts;

    progressArts.push({ key: rollData.additionalData.art, maxLevel: 0, xp: xpGain });
    updateData["system.progress.arts"] = progressArts;
    const externalIds = diaryitem.system.externalIds;
    externalIds[0].data = { amountLabel: "pawns", amount: rollData.additionalData.amount };
    updateData["system.externalIds"] = externalIds;
    // updateData["system.rollDone"] = true;
    updateData._id = diaryitem._id;

    //  TODO
    // "system.description": desc,

    await actor.updateEmbeddedDocuments("Item", [updateData], {});
    await diaryitem.sheet._onProgressApply({});
  }
}

// get a new title for a diary entry if it is still the default : "New DiaryEntry"
export function getNewTitleForActivity(actor, item) {
  const DEFAULT_TITLE = "New DiaryEntry";
  if (item.name !== DEFAULT_TITLE) {
    return item.name;
  }
  const systemData = item.system;
  let teacher = systemData.teacher.name;
  let skills = "";
  for (const ability of Object.values(systemData.progress.abilities)) {
    let tmp = actor.items.get(ability.id);
    if (tmp != null && ability.xp > 0) {
      skills += `${tmp.name}, `;
    }
  }
  for (const art of Object.values(systemData.progress.arts)) {
    let tmp = CONFIG.ARM5E.magic.arts[art.key].label;
    if (art.xp > 0) {
      skills += `${tmp}, `;
    }
  }
  for (const spell of Object.values(systemData.progress.spells)) {
    let tmp = actor.items.get(spell.id);
    if (tmp != null && spell.xp > 0) {
      skills += `${tmp.name} ${game.i18n.localize("arm5e.sheet.mastery")}, `;
    }
  }

  skills = skills.slice(0, -2);
  switch (item.system.activity) {
    case "adventuring":
      return game.i18n.format("arm5e.activity.title.adventuring", {
        season: game.i18n.localize(CONFIG.ARM5E.seasons[systemData.dates[0].season].label),
        year: systemData.dates[0].year
      });
    case "practice":
      return game.i18n.format("arm5e.activity.title.practice", { skills: skills });
    case "exposure":
      return game.i18n.format("arm5e.activity.title.exposure", { skills: skills });
    case "training":
      return game.i18n.format("arm5e.activity.title.training", {
        skills: skills,
        teacher: teacher
      });
    case "teaching":
      return game.i18n.format("arm5e.activity.title.teaching", {
        skills: skills,
        teacher: teacher
      });
    case "apprenticeship":
      return game.i18n.localize("arm5e.activity.title.apprenticeship");
    case "childhood":
      return game.i18n.localize("arm5e.activity.title.childhood");
    case "laterLife":
      return game.i18n.localize("arm5e.activity.title.laterLife");
    case "laterLifeMagi":
      return game.i18n.localize("arm5e.activity.title.laterLifeMagi");
    // case "extractVis":

    // case "studyVis":

    default:
      return DEFAULT_TITLE;
  }
}
