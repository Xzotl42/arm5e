import { getDataset, log } from "../tools.js";
import { ArM5eActor } from "../actor/actor.js";
import { InvestigationRoll } from "../tools/investigationRoll.js";
import { getAbilityFromCompendium } from "../tools/compendia.js";
import { ArsRoll } from "./stressdie.js";
import { DiaryEntrySchema } from "../schemas/diarySchema.js";
import {
  AgingActivity,
  BookActivity,
  DiaryActivity,
  ProgressActivity,
  RecoveryActivity,
  ResourceActivity,
  TwilightActivity,
  VisStudy
} from "../seasonal-activities/progressActivity.js";
import { LabActivity } from "../seasonal-activities/labActivity.js";

export function ActivityFactory(type, owner, diaryData) {
  let ownerUuid = owner ? owner.uuid : null;
  switch (type) {
    case "inventSpell":
    case "learnSpell":
    case "minorEnchantment":
    case "chargedItem":
    case "visExtraction":
    case "longevityRitual":
    case "investigateItem":
      const labUuid = diaryData.lab ? diaryData.lab.uuid : null;
      ownerUuid = diaryData.lab ? diaryData.lab.owner : null;
      return LabActivity.LabActivityFactory(labUuid, ownerUuid, type);
    case "resource":
    case "lab":
      const labUuid2 = diaryData.lab ? diaryData.lab.uuid : null;
      ownerUuid = diaryData.lab ? diaryData.lab.owner : null;
      return new ResourceActivity(labUuid2, ownerUuid, type);
    case "adventuring":
    case "exposure":
    case "practice":
    case "training":
    case "teaching":
    case "hermeticApp":
    case "childhood":
    case "laterLife":
    case "laterLifeMagi":
      return new ProgressActivity(ownerUuid, type);
    case "reading":
    case "writing":
    case "copying":
      let book = diaryData.externalIds.length > 0 ? diaryData.externalIds[0].itemId : null;
      return new BookActivity(ownerUuid, book, type);
    case "aging":
      return new AgingActivity(ownerUuid);
    case "twilight":
      return new TwilightActivity(ownerUuid);
    case "visStudy":
      return new VisStudy(ownerUuid);
    case "recovery":
      return new RecoveryActivity(ownerUuid);
    case "none":
      return new DiaryActivity(ownerUuid);
    default:
      log(false, "Unknown activity");
      return null;
  }
}

export async function setAgingEffects(actor, roll, message) {
  let rtCompendium = game.packs.get("arm5e.rolltables");
  let docs = await rtCompendium.getDocuments();
  const agingTable = docs.filter((rt) => rt.name === "Aging table")[0];
  let res = agingTable.getResultsForRoll(roll.total)[0].text;
  let dialogData = CONFIG.ARM5E.activities.aging[res];

  dialogData.year = actor.rollInfo.environment.year;
  dialogData.season = actor.rollInfo.environment.season;
  dialogData.seasonLabel = CONFIG.ARM5E.seasons[actor.rollInfo.environment.season].label;
  dialogData.choice = res === "crisis" || res === "anyAgingPt";
  if (actor.type == "beast" && !actor.system.intelligent) {
    dialogData.chars = CONFIG.ARM5E.beast.characteristics;
  } else {
    dialogData.chars = CONFIG.ARM5E.character.characteristics;
  }

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
  resultAging.year = actor.rollInfo.environment.year;

  await updateAgingDiaryEntry(actor, resultAging);
}

export async function agingRoll(item) {
  const input = {
    roll: "aging",
    year: item.system.dates[0].year,
    season: item.system.dates[0].season,
    moredata: { diaryId: item._id }
  };
  await item.actor.sheet.roll(input);
}

export async function agingCrisis(actor, roll, message) {
  let rtCompendium = game.packs.get("arm5e.rolltables");
  let docs = await rtCompendium.getDocuments();

  const crisisTable = docs.filter((rt) => rt.name === "Aging crisis table")[0];
  let res = crisisTable.getResultsForRoll(roll.total)[0].text;

  // log(false, `Crisis result expanded: ${msg}`);
  ChatMessage.create({
    content: "<h3>" + game.i18n.localize(`arm5e.aging.crisis.${res}`) + "</h3><br/>",
    speaker: ChatMessage.getSpeaker({
      actor: actor
    }),
    whisper: ChatMessage.getWhisperRecipients("gm"),
    system: { label: game.i18n.localize("arm5e.aging.crisis.summary") }
  });

  await actor.update({ "system.states.pendingCrisis": false }, {});
}

export async function updateAgingDiaryEntry(actor, input) {
  let item = actor.items.get(actor.rollInfo.additionalData.diaryId);
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
////////////
// TWILIGHT
///////////

export const TWILIGHT_STAGES = {
  NONE: 0,
  PENDING_STRENGTH: 1,
  PENDING_CONTROL: 2,
  PENDING_COMPLEXITY: 3,
  PENDING_UNDERSTANDING: 4,
  PENDING_UNDERSTANDING2: 5 // diary created
};
export class TwilightEpisode {
  constructor(actor) {
    this.actor = actor;
    this.strength = actor.system.twilight.strength;
    this.complexity = actor.system.twilight.complexity;
    this.warpingPts = actor.system.twilight.warpingPts;
    this.stage = actor.system.twilight.stage;
  }
  static getTechnicalDescription(pts, duration) {
    let desc = `<ul><li>${game.i18n.localize("arm5e.twilight.warpingPoints")} : ${pts}</li>`;
    desc += `<li>${game.i18n.format("arm5e.twilight.diary.duration", {
      duration: duration
    })}</li></ul>`;
    // desc += `<li></li>`;

    return desc;
  }
  static async getDuration(score) {
    const durations = [
      "arm5e.twilight.durations.moments",
      "arm5e.twilight.durations.diameter",
      "arm5e.twilight.durations.hours",
      "arm5e.twilight.durations.sun",
      "arm5e.twilight.durations.day",
      "arm5e.twilight.durations.moon",
      "arm5e.twilight.durations.season",
      "arm5e.twilight.durations.year",
      "arm5e.twilight.durations.sevenYears",
      "arm5e.twilight.durations.decades",
      "arm5e.twilight.durations.eternal"
    ];
    if (score < 0) {
      return game.i18n.localize(durations[0]);
    }
    if (score === 9) {
      let roll = new ArsRoll("0di", {}, { actor: this.actor.uuid });
      await roll.evaluate();
      return game.i18n.format("arm5e.twilight.durations.decades", { num: 7 + roll.total });
    }

    return game.i18n.localize(durations[score]);
  }

  static getTooltip(stage) {
    const tooltips = [
      "arm5e.twilight.episode",
      "arm5e.twilight.tooltips.pendingStrength",
      "arm5e.twilight.tooltips.pendingControl",
      "arm5e.twilight.tooltips.pendingComplexity",
      "arm5e.twilight.tooltips.pendingUnderstanding",
      "arm5e.twilight.tooltips.pendingUnderstanding2"
    ];
    return game.i18n.localize(tooltips[stage]);
  }

  async _updateObject(event, formData) {
    return formData;
  }
}

export async function createTwilightDiaryEntry(actor, input) {
  return actor.createEmbeddedDocuments("Item", [_createTwilightDiaryEntry(input)], {});
}

function _createTwilightDiaryEntry(input) {
  return {
    name: game.i18n.localize("arm5e.twilight.episode"),
    img: "systems/arm5e/assets/icons/Icon_Warping.png",
    type: "diaryEntry",
    system: {
      dates: [{ year: input.year, season: input.season, applied: input.applied ?? false }],
      activity: "twilight",
      description: input.description ?? "",
      duration: 1,
      done: input.done ?? false,
      rollDone: input.rollDone ?? false
    }
  };
}

export async function twilightUnderstandingRoll(item) {
  const input = {
    roll: "twilight_understanding",
    moredata: { diaryId: item._id },
    botchNumber: item.actor.system.twilight.pointsGained + 1
  };
  await item.actor.sheet.roll(input);
}

export async function twilightRoll(actor, data) {
  await actor.sheet.roll(data);
}

export async function applyTwilightStrength(actor, roll, message) {
  const updateData = {};
  updateData["system.twilight.year"] = actor.rollInfo.environment.year;
  updateData["system.twilight.season"] = actor.rollInfo.environment.season;
  updateData["system.twilight.strength"] = roll.total;
  updateData["system.twilight.enigmaSpec"] = actor.rollInfo.twilight.enigma.specApply;
  updateData["system.twilight.pointsGained"] = actor.rollInfo.twilight.warpingPts;
  updateData["system.twilight.stage"] = TWILIGHT_STAGES.PENDING_CONTROL;
  await actor.update(updateData, {});
}

export async function applyTwilightComplexity(actor, roll, message) {
  const updateData = {};
  let complexity = roll.total;
  if (roll.botches) {
    complexity = 0;
  }
  updateData["system.twilight.complexity"] = complexity;
  updateData["system.twilight.stage"] = TWILIGHT_STAGES.PENDING_UNDERSTANDING;
  await actor.update(updateData, {});
}

export async function twilightControl(actor, roll, message) {
  const updateData = {};

  const msgUpdate = {};
  const promises = [];
  if (roll.botches) {
    // botch => impossible to understand, direct diary entry:
    const dur = await TwilightEpisode.getDuration(actor.system.warping.finalScore);
    const input = {
      year: actor.rollInfo.environment.year,
      season: actor.rollInfo.environment.season,
      applied: true,
      done: true,
      rollDone: true,
      description:
        game.i18n.format("arm5e.twilight.diary.botchedControl", {
          name: actor.name,
          str: actor.system.twilight.strength
        }) +
        "<br/>" +
        TwilightEpisode.getTechnicalDescription(actor.system.twilight.pointsGained, dur)
    };
    promises.push(createTwilightDiaryEntry(actor, input));

    msgUpdate["flavor"] = message.flavor + game.i18n.localize("arm5e.twilight.chat.botchedControl");
    message.updateSource(msgUpdate);
    promises.push(actor.update(_resetTwilight(), {}));
  } else if (roll.total >= actor.system.twilight.strength) {
    const input = {
      year: actor.rollInfo.environment.year,
      season: actor.rollInfo.environment.season,
      applied: true,
      done: true,
      rollDone: true,
      description: game.i18n.format("arm5e.twilight.diary.successControl", {
        name: actor.name,
        str: actor.system.twilight.strength
      })
    };
    msgUpdate["flavor"] =
      message.flavor + `<h2>${game.i18n.localize("arm5e.twilight.chat.successControl")}</h2>`;

    promises.push(createTwilightDiaryEntry(actor, input));

    message.updateSource(msgUpdate);

    promises.push(actor.update(_resetTwilight(), {}));
  } else {
    updateData["system.twilight.year"] = actor.rollInfo.environment.year;
    updateData["system.twilight.season"] = actor.rollInfo.environment.season;
    updateData["system.twilight.strength"] = roll.total;
    updateData["system.twilight.control"] = false;
    updateData["system.twilight.pointsGained"] = actor.rollInfo.twilight.warpingPts;
    updateData["system.twilight.stage"] = TWILIGHT_STAGES.PENDING_COMPLEXITY;
    msgUpdate["flavor"] =
      message.flavor + `<h2>${game.i18n.localize("arm5e.twilight.chat.failedControl")}</h2>`;

    message.updateSource(msgUpdate);
    promises.push(actor.update(updateData, {}));
  }
  const results = (await Promise.all(promises)).flat();
  if (results[0].type === "diaryEntry") results[0].sheet.render(true);
}

export async function twilightUnderstanding(actor, roll, message) {
  const msgUpdate = {};
  const diaryUpdate = {};
  diaryUpdate["system.applied"] = true;
  diaryUpdate["system.done"] = true;
  diaryUpdate["system.rollDone"] = true;
  let diary = actor.items.get(actor.rollInfo.additionalData.diaryId);

  const controlDesc = actor.system.twilight.control
    ? game.i18n.format("arm5e.twilight.diary.embraced", {
        name: actor.name
      })
    : game.i18n.format("arm5e.twilight.diary.failedControl", {
        name: actor.name,
        str: actor.system.twilight.strength
      });
  if (roll.botches) {
    // botch => impossible to understand
    const duration = await TwilightEpisode.getDuration(
      actor.system.warping.finalScore + roll.botches
    );
    diaryUpdate["system.duration"] = 1;

    diaryUpdate["system.description"] = `${diary.system.description}`;

    msgUpdate["flavor"] =
      message.flavor + game.i18n.localize("arm5e.twilight.chat.botchedUnderstanding");
  } else if (roll.total >= actor.system.twilight.complexity) {
    let delta =
      roll.total - actor.rollInfo.twilight.enigma.score - actor.system.twilight.complexity;
    if (actor.system.twilight.enigmaSpec) delta++;
    let warpingScoreMod = delta < 0 ? 0 : delta;
    const dur = await TwilightEpisode.getDuration(
      actor.system.warping.finalScore - warpingScoreMod
    );
    diaryUpdate["system.description"] = `${diary.system.description} <br/>${controlDesc}. 
      ${game.i18n.format("arm5e.twilight.diary.successUnderstanding", {
        name: actor.name,
        complexity: actor.system.twilight.complexity
      })} <br/>
      ${TwilightEpisode.getTechnicalDescription(actor.system.twilight.pointsGained, dur)}`;
    msgUpdate["flavor"] =
      message.flavor + `<h2>${game.i18n.localize("arm5e.twilight.chat.successUnderstanding")}</h2>`;
  } else {
    const dur = await TwilightEpisode.getDuration(actor.system.warping.finalScore);
    diaryUpdate["system.description"] = `${diary.system.description} <br/>${controlDesc}. 
      ${game.i18n.format("arm5e.twilight.diary.failedUnderstanding", {
        name: actor.name,
        complexity: actor.system.twilight.complexity
      })} 
      <br/>
      ${TwilightEpisode.getTechnicalDescription(actor.system.twilight.pointsGained, dur)}`;

    msgUpdate["flavor"] =
      message.flavor + `<h2>${game.i18n.localize("arm5e.twilight.chat.failedUnderstanding")}</h2>`;
  }
  message.updateSource(msgUpdate);
  const promises = [];
  promises.push(diary.update(diaryUpdate));
  promises.push(actor.update(_resetTwilight(), {}));
  await Promise.all(promises);
  diary.sheet.render(true);
}

export async function resetTwilight(actor) {
  await actor.update(_resetTwilight(), {});
}

export function _resetTwilight() {
  const updateData = {};
  updateData["system.twilight.year"] = null;
  updateData["system.twilight.season"] = null;
  updateData["system.twilight.control"] = null;
  updateData["system.twilight.strength"] = 0;
  updateData["system.twilight.complexity"] = 0;
  updateData["system.twilight.pointsGained"] = 0;
  updateData["system.twilight.enigmaSpec"] = false;
  updateData["system.twilight.concentrationSpec"] = false;
  updateData["system.twilight.stage"] = TWILIGHT_STAGES.NONE;
  return updateData;
}

// ********************
// Progress activities
// ********************

export function listOfPartialDates(actor, item) {
  const partialDates = [];
}

export function genericValidationOfActivity(context, actor, item) {
  context.partialDates = [];
  // check if there are any previous activities not applied.
  if (context.enforceSchedule && item.system.hasUnappliedActivityInThePast(actor)) {
    context.system.applyPossible = false;
    context.system.applyError = "arm5e.activity.msg.unappliedActivities";
    return;
  }

  const currentDate = game.settings.get("arm5e", "currentDate");
  // check if it starts in the future
  if (
    context.firstSeason.year > currentDate.year ||
    (context.firstSeason.year == currentDate.year &&
      CONFIG.SEASON_ORDER[context.firstSeason.season] > CONFIG.SEASON_ORDER[currentDate.season])
  ) {
    context.system.applyPossible = false;
    context.system.applyError = "arm5e.activity.msg.activityStartsInFuture";
    return;
  }
  const activityConfig = CONFIG.ARM5E.activities.generic[context.system.activity];
  if (activityConfig.scheduling.partial && context.system.duration > 1) {
    // get how many unapplied seasons are in the past
    context.partialDates = context.system.dates.filter(
      (e) =>
        e.applied == false &&
        (e.year <= currentDate.year ||
          (e.year == currentDate.year &&
            CONFIG.SEASON_ORDER[e.season] <= CONFIG.SEASON_ORDER[currentDate.season]))
    );
    if (context.partialDates.length == 0) {
      context.system.applyPossible = false;
      context.partialApply = false;
      context.system.applyError = "arm5e.activity.msg.noProgressPossible";
    } else {
      context.partialApply = true;
    }

    if (
      context.lastSeason.year > currentDate.year ||
      (context.lastSeason.year == currentDate.year &&
        CONFIG.SEASON_ORDER[context.lastSeason.season] > CONFIG.SEASON_ORDER[currentDate.season])
    ) {
      context.system.applyPossible = false;
      context.endsInTheFuture = true;
    }
  } else {
    // check if it ends in the future
    if (
      context.lastSeason.year > currentDate.year ||
      (context.lastSeason.year == currentDate.year &&
        CONFIG.SEASON_ORDER[context.lastSeason.season] > CONFIG.SEASON_ORDER[currentDate.season])
    ) {
      context.endsInTheFuture = true;
      context.partialApply = false;
      context.system.applyPossible = false;
      context.system.applyError = "arm5e.activity.msg.activityEndsInFuture";
    }
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
  if (actor.system.description.born.value == null) {
    context.system.applyError = game.i18n.localize("arm5e.activity.msg.noYearOfBirth");
  }
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
  let teacherXp = ArM5eActor.getAbilityXp(teacherScore);
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

    const taughtAb = item.system.progress.abilities[0];

    let ability = Object.values(actor.system.abilities).find((e) => {
      return e._id === taughtAb.id;
    });
    if (ability === undefined) {
      ability = { system: { key: taughtAb.key, option: taughtAb.option, xp: 0 } };
    }

    const coeff = actor._getAbilityXpCoeff(ability.system.key, ability.system.option);
    checkIfCapped(context, teacherScore, coeff, ability);

    context.system.progress.abilities[0].xp = context.system.cappedGain
      ? context.system.sourceQuality
      : context.system.sourceQuality + context.system.sourceModifier;
    item._source.system.progress.abilities[0].xp = context.system.progress.abilities[0].xp;
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
    item._source.system.progress.spells[0].xp = context.system.progress.spells[0].xp;
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
    const taughtAb = item.system.progress.abilities[0];

    let ability = Object.values(actor.system.abilities).find((e) => {
      return e._id === taughtAb.id;
    });
    if (ability === undefined) {
      ability = { system: { key: taughtAb.key, option: taughtAb.option, xp: 0 } };
    }
    const coeff = actor._getAbilityXpCoeff(ability.system.key, ability.system.option);
    checkIfCapped(context, teacherScore, coeff, ability);

    context.system.progress.abilities[0].xp = context.system.cappedGain
      ? context.system.sourceQuality
      : context.system.sourceQuality + context.system.sourceModifier + context.system.sourceBonus;
    item._source.system.progress.abilities[0].xp = context.system.progress.abilities[0].xp;
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
    item._source.system.progress.spells[0].xp = context.system.progress.spells[0].xp;
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
    let teacherXp = ArM5eActor.getArtXp(teacherScore);
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
    item._source.system.progress.arts[0].xp = context.system.progress.arts[0].xp;
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
  let artsArr = Object.values(item.system.progress.arts);
  let spellsArr = Object.values(item.system.progress.spells);

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
    // Reading take all modifiers into account in the scriptorium already

    context.system.totalXp.abilities += context.system.progress.abilities[0].xp;
  } else if (spellsArr.length > 0) {
    const maxLevel =
      Number(item.system.progress.spells[0].maxLevel) == 0
        ? 100
        : Number(item.system.progress.spells[0].maxLevel);

    const spell = Object.values(actor.system.spells).find((e) => {
      return e._id === item.system.progress.spells[0].id;
    });
    context.system.totalXp.masteries += context.system.progress.spells[0].xp;
  } else if (artsArr.length > 0) {
    const progressArt = item.system.progress.arts[0];
    const maxLevel = Number(progressArt.maxLevel) == 0 ? 100 : Number(progressArt.maxLevel);
    let artType = "techniques";
    if (Object.keys(CONFIG.ARM5E.magic.techniques).indexOf(progressArt.key) == -1) {
      artType = "forms";
    }
    const art = actor.system.arts[artType][progressArt.key];
    context.system.totalXp.arts += context.system.progress.arts[0].xp;
  }

  if (context.system.cappedGain && context.system.sourceQuality == 0) {
    context.system.applyError = "arm5e.scriptorium.msg.tooSkilled";
    context.system.applyPossible = false;
  }
}

// TODO
export function validWriting(context, actor, item) {
  return;
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

export async function setVisStudyResults(actor, roll, message, rollInfo) {
  if (roll.botches > 0) {
    if (roll.botches >= actor.system.bonuses.arts.warpingThreshold) {
      // twilight pending
      updateData["system.twilight.pointsGained"] = roll.botches;
      updateData["system.twilight.stage"] = TWILIGHT_STAGES.PENDING_STRENGTH;
      updateData["system.twilight.year"] = actor.rollInfo.environment.year;
      updateData["system.twilight.season"] = actor.rollInfo.environment.season;
    }
    updateData["system.warping.points"] = actor.system.warping.points + roll.botches;
    await actor.update(updateData);
    //ui.notifications.info()
  } else {
    let diaryitem = actor.items.get(actor.rollInfo.additionalData.diaryId);
    const xpGain = roll.total + actor.system.bonuses.activities.visStudy;

    const updateData = { "system.sourceQuality": xpGain };
    const progressArts = diaryitem.system.progress.arts;

    progressArts.push({ key: rollInfo.additionalData.art, maxLevel: 0, xp: xpGain });
    updateData["system.progress.arts"] = progressArts;
    const externalIds = diaryitem.system.externalIds;
    externalIds[0].data = {
      amount: rollInfo.additionalData.amount
    };
    updateData["system.externalIds"] = externalIds;
    // updateData["system.rollDone"] = true;
    updateData._id = diaryitem._id;

    //  TODO
    // "system.description": desc,

    await actor.updateEmbeddedDocuments("Item", [updateData], {});
    await diaryitem.sheet._onProgressApply({});
  }
}

export async function investigate(item) {
  const idx = item.system.externalIds.findIndex((e) => e.flags == 16);
  const magicItem = await fromUuid(item.system.externalIds[idx].uuid);
  const itemName = item.system.externalIds[idx].data.name;
  if (!magicItem) {
    ui.notifications.info(game.i18n.format("arm5e.notification.itemMoved", { name: itemName }));
    return;
  }

  let formData = magicItem.toObject();
  formData.uuid = magicItem.uuid;
  formData.labTotal = item.system.externalIds[idx].data.labTotal;
  // // const html = await renderTemplate("systems/arm5e/templates/generic/astrolab.html", dialogData);
  const investigateItem = new InvestigationRoll(item, formData, {}); // data, options
  const res = await investigateItem.render(true);
}

// get a new title for a diary entry if it is still the default : "New DiaryEntry"
export async function getNewTitleForActivity(actor, item) {
  const DEFAULT_TITLE = "New DiaryEntry";
  if (item.name !== DEFAULT_TITLE) {
    return item.name;
  }
  const systemData = item.system;
  let teacher = systemData.teacher.name;
  let skills = "";
  for (const ability of Object.values(systemData.progress.abilities)) {
    let tmp;
    if (
      ability.id.length < 16 ||
      (["training", "teaching"].includes(item.system.activity) && ability.secondaryId)
    ) {
      // get the ability template from the shared compendia
      tmp = await getAbilityFromCompendium(ability.key, ability.option);
    } else {
      tmp = actor.items.get(ability.id);
    }
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

  // remove last comma
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
