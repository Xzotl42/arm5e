import { ARM5E } from "./config.js";

import { DEFAULT_WOUND, SIZES_AND_WOUNDS } from "./constants/wounds.js";

export function log(force, ...args) {
  try {
    const isDebugging = game.modules.get("_dev-mode")?.api?.getPackageDebugValue(ARM5E.SYSTEM_ID);

    if (force || isDebugging) {
      console.log(ARM5E.SYSTEM_ID, "|", ...args);
    }
  } catch (e) {
    console.log(e);
  }
}

export function debug(str) {
  log(false, "DEBUG: " + str);
}

export function error(force, ...args) {
  try {
    const isDebugging = game.modules.get("_dev-mode")?.api?.getPackageDebugValue(ARM5E.SYSTEM_ID);

    if (force || isDebugging) {
      console.error(ARM5E.SYSTEM_ID, "|", ...args);
    }
  } catch (e) {
    console.error(e);
  }
}

export async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getDocumentFromCompendium(pack, id) {
  let compendium = game.packs.get(pack);
  // const documents = await compendium.getDocuments();
  let doc = compendium.getDocument(id);
  return doc;
}

export function compareBaseEffects(e1, e2) {
  if (e1.system.form.value < e2.system.form.value) {
    return -1;
  } else if (e1.system.form.value > e2.system.form.value) {
    return 1;
  } else {
    if (e1.system.technique.value < e2.system.technique.value) {
      return -1;
    } else if (e1.system.technique.value > e2.system.technique.value) {
      return 1;
    } else {
      if (e1.system.baseLevel < e2.system.baseLevel) {
        return -1;
      } else if (e1.system.baseLevel > e2.system.baseLevel) {
        return 1;
      } else {
        return e1.name.localeCompare(e2.name);
      }
    }
  }
}

// export function compareAbilities(a1, a2) {
//   const keys = Object.keys(CONFIG.ARM5E.LOCALIZED_ABILITIES);
//   if (keys.indexOf(a1.system.category) < keys.indexOf(a2.system.category)) {
//     return -1;
//   } else if (keys.indexOf(a1.system.category) > keys.indexOf(a2.system.category)) {
//     return 1;
//   } else {
//     if (keys.indexOf(a1.system.key) > keys.indexOf(a2.system.key)) {
//       return -1;
//     } else if (keys.indexOf(a1.system.key) < keys.indexOf(a2.system.key)) {
//       return -1;
//     } else {
//       return a1.name.localeCompare(a2.name);
//     }
//   }
// }

const topicOrder = { art: 0, ability: 1, mastery: 2, labText: 3 };

export function compareTopics(b1, b2) {
  // Topic
  if (topicOrder[b1.category] < topicOrder[b2.category]) {
    return -1;
  } else if (topicOrder[b1.category] > topicOrder[b2.category]) {
    return 1;
  }
  // book type
  if (b1.type < b2.type) {
    return -1;
  } else if (b1.type > b2.type) {
    return 1;
  }
  if (b1.category === "art") {
    if (b1.art < b2.art) {
      return -1;
    } else if (b1.art > b2.art) {
      return 1;
    }
  } else if (b1.category === "ability") {
    if (b1.key < b2.key) {
      return -1;
    } else if (b1.key > b2.key) {
      return 1;
    }
    if (b1.option < b2.option) {
      return -1;
    } else if (b1.option > b2.option) {
      return 1;
    }
  }
  // level
  if (b1.type === "Summa") {
    if (b1.level < b2.level) {
      return 1;
    } else if (b1.level > b2.level) {
      return -1;
    }
  }
  if (b1.quality < b2.quality) {
    return 1;
  } else if (b1.quality > b2.quality) {
    return -1;
  }
  return b1.book.localeCompare(b2.book);
}
export function compareBooks(b1, b2) {
  // Topic
  if (topicOrder[b1.system.topic.category] < topicOrder[b2.system.topic.category]) {
    return -1;
  } else if (topicOrder[b1.system.topic.category] > topicOrder[b2.system.topic.category]) {
    return 1;
  }
  // book type
  if (b1.system.type < b2.system.type) {
    return -1;
  } else if (b1.system.type > b2.system.type) {
    return 1;
  }
  if (b1.system.topic.category === "art") {
    if (b1.system.topic.art < b2.system.topic.art) {
      return -1;
    } else if (b1.system.topic.art > b2.system.topic.art) {
      return 1;
    }
  } else if (b1.system.topic.category === "ability") {
    if (b1.system.topic.key < b2.system.topic.key) {
      return -1;
    } else if (b1.system.topic.key > b2.system.topic.key) {
      return 1;
    }
    if (b1.system.topic.option < b2.system.topic.option) {
      return -1;
    } else if (b1.system.topic.option > b2.system.topic.option) {
      return 1;
    }
  }
  // level
  if (b1.system.type === "Summa") {
    if (b1.system.level < b2.system.level) {
      return 1;
    } else if (b1.system.level > b2.system.level) {
      return -1;
    }
  }
  if (b1.system.quality < b2.system.quality) {
    return 1;
  } else if (b1.system.quality > b2.system.quality) {
    return -1;
  }
  return b1.name.localeCompare(b2.name);
}

const seasonOrder = { spring: 0, summer: 1, autumn: 2, winter: 3 };

export function compareDiaryEntries(e1, e2) {
  if (e1.system.year < e2.system.year) {
    return 1;
  } else if (e1.system.year > e2.system.year) {
    return -1;
  } else {
    if (seasonOrder[e1.system.season] < seasonOrder[e2.system.season]) {
      return 1;
    } else if (seasonOrder[e1.system.season] > seasonOrder[e2.system.season]) {
      return -1;
    } else {
      return e1.name.localeCompare(e2.name);
    }
  }
}

export function compareMagicalEffects(e1, e2) {
  if (e1.system.form.value < e2.system.form.value) {
    return -1;
  } else if (e1.system.form.value > e2.system.form.value) {
    return 1;
  } else {
    if (e1.system.technique.value < e2.system.technique.value) {
      return -1;
    } else if (e1.system.technique.value > e2.system.technique.value) {
      return 1;
    } else {
      if (e1.system.level < e2.system.level) {
        return -1;
      } else if (e1.system.level > e2.system.level) {
        return 1;
      } else {
        return e1.name.localeCompare(e2.name);
      }
    }
  }
}

export function compareSpells(e1, e2) {
  if (e1.system.form.value < e2.system.form.value) {
    return -1;
  } else if (e1.system.form.value > e2.system.form.value) {
    return 1;
  } else {
    if (e1.system.technique.value < e2.system.technique.value) {
      return -1;
    } else if (e1.system.technique.value > e2.system.technique.value) {
      return 1;
    } else {
      if (e1.system.level < e2.system.level) {
        return -1;
      } else if (e1.system.level > e2.system.level) {
        return 1;
      } else {
        return e1.name.localeCompare(e2.name);
      }
    }
  }
}

export function hermeticFilter(filters, inputArray) {
  // for books with empty labtext topics
  inputArray = inputArray.filter(e => e.system !== null);
  if (filters.formFilter != "") {
    inputArray = inputArray.filter(e => e.system.form.value === filters.formFilter);
  }
  if (filters.techniqueFilter != "") {
    inputArray = inputArray.filter(e => e.system.technique.value === filters.techniqueFilter);
  }
  if (
    filters.levelFilter != 0 &&
    filters.levelFilter != null &&
    filters.levelFilter != "" &&
    filters.levelFilter != "0"
  ) {
    if (filters.levelOperator == 0) {
      inputArray = inputArray.filter(e => e.system.level === parseInt(filters.levelFilter));
    } else if (filters.levelOperator == -1) {
      inputArray = inputArray.filter(e => e.system.level <= parseInt(filters.levelFilter));
    } else {
      inputArray = inputArray.filter(e => e.system.level >= parseInt(filters.levelFilter));
    }
  }
  return inputArray;
}

export function compareLabTexts(e1, e2) {
  // for book topics without lab texts yet
  if (e1.system == null) {
    return 1;
  }
  if (e2.system == null) {
    return -1;
  }
  if (e1.system.type < e2.system.type) {
    return -1;
  } else if (e1.system.type > e2.system.type) {
    return 1;
  } else {
    return compareMagicalEffects(e1, e2);
  }
}

export function getLabUpkeepCost(upkeep) {
  if (upkeep < -5) return 0;
  switch (upkeep) {
    case -5:
      return 1;
    case -4:
      return 2;
    case -3:
      return 3;
    case -2:
      return 5;
    case -1:
      return 7;
    case 0:
      return 10;
    case 1:
      return 15;
    default:
      return upkeep * (upkeep + 1) * 5;
  }
}

export function getLastMessageByHeader(game, key) {
  const searchString = game.i18n.localize(key).toLowerCase() + " </h2>";
  const messages = game.messages.filter(msg => {
    const flavor = (msg?.flavor || "").toLowerCase();
    return flavor.indexOf(searchString) > -1;
  });
  if (messages.length) return messages.pop();
  return false;
}

export function calculateWound(damage, size) {
  if (damage <= 0) {
    return "";
  }
  const typeOfWoundsBySize = getWoundType(size);
  //SIZES_AND_WOUNDS[size.toString()];
  if (typeOfWoundsBySize === undefined) return false;
  const wounds = Object.keys(typeOfWoundsBySize);

  let typeOfWound = DEFAULT_WOUND;
  wounds.forEach(wound => {
    if (Number(wound) <= damage) {
      typeOfWound = typeOfWoundsBySize[wound];
    }
  });
  return typeOfWound;
}

export function getDataset(obj) {
  if (obj.preventDefault) {
    obj.preventDefault();
    const element = obj.currentTarget;
    return element.dataset;
  }
  return obj;
}

// No limitation to size
function getWoundType(size) {
  if (size <= -4) {
    return {
      1: "light",
      2: "medium",
      3: "heavy",
      4: "incap",
      5: "dead"
    };
  }
  let increment = size + 5;
  const result = { 1: "light" };

  result[1 + increment] = "medium";
  result[1 + 2 * increment] = "heavy";
  result[1 + 3 * increment] = "incap";
  result[1 + 4 * increment] = "dead";

  //console.log(result);
  return result;
}

// Internal function to generate Active Effects types from the ability list
export function generateActiveEffectFromAbilities() {
  let activeEffects = {
    bonusGeneralAbility: {
      category: "abilities",
      type: "bonusGeneralAbility",
      label: "bonusGeneralAbility",
      subtypes: {}
    },
    bonusArcaneAbility: {
      category: "abilities",
      type: "bonusArcaneAbility",
      label: "arm5e.sheet.activeEffect.types.arcaneAbilitiesBonus",
      subtypes: {}
    },
    bonusAcademicAbility: {
      category: "abilities",
      type: "bonusAcademicAbility",
      label: "arm5e.sheet.activeEffect.types.academicAbilitiesBonus",
      subtypes: {}
    },
    bonusMartialAbility: {
      category: "abilities",
      type: "bonusMartialAbility",
      label: "arm5e.sheet.activeEffect.types.martialAbilitiesBonus",
      subtypes: {}
    },
    bonusMysteryAbility: {
      category: "abilities",
      type: "bonusMysteryAbility",
      label: "arm5e.sheet.activeEffect.types.mysteryAbilitiesBonus",
      subtypes: {}
    },
    bonusSupernaturalAbility: {
      category: "abilities",
      type: "bonusSupernaturalAbility",
      label: "arm5e.sheet.activeEffect.types.supernaturalAbilitiesBonus",
      subtypes: {}
    },
    affinityGeneralAbility: {
      category: "abilities",
      type: "affinityGeneralAbility",
      label: "arm5e.sheet.activeEffect.types.generalAbilitiesAffinity",
      subtypes: {}
    },
    affinityArcaneAbility: {
      category: "abilities",
      type: "affinityArcaneAbility",
      label: "arm5e.sheet.activeEffect.types.arcaneAbilitiesAffinity",
      subtypes: {}
    },
    affinityAcademicAbility: {
      category: "abilities",
      type: "affinityAcademicAbility",
      label: "arm5e.sheet.activeEffect.types.academicAbilitiesAffinity",
      subtypes: {}
    },
    affinityMartialAbility: {
      category: "abilities",
      type: "affinityMartialAbility",
      label: "arm5e.sheet.activeEffect.types.martialAbilitiesAffinity",
      subtypes: {}
    },
    affinityMysteryAbility: {
      category: "abilities",
      type: "affinityMysteryAbility",
      label: "arm5e.sheet.activeEffect.types.mysteryAbilitiesAffinity",
      subtypes: {}
    },
    affinitySupernaturalAbility: {
      category: "abilities",
      type: "affinitySupernaturalAbility",
      label: "arm5e.sheet.activeEffect.types.supernaturalAbilitiesAffinity",
      subtypes: {}
    }
  };
  // debugger;
  for (const [aKey, ability] of Object.entries(CONFIG.ARM5E.ALL_ABILITIES)) {
    // console.log(ability);
    if (ability.selection === "disabled") continue;
    let computedKey;
    let afinityComputedKey;
    if (ability.option) {
      computedKey = `system.bonuses.skills.${aKey}_#OPTION#.bonus`;
      afinityComputedKey = `system.bonuses.skills.${aKey}_#OPTION#.xpCoeff`;
    } else {
      computedKey = `system.bonuses.skills.${aKey}.bonus`;
      afinityComputedKey = `system.bonuses.skills.${aKey}.xpCoeff`;
    }
    switch (ability.category) {
      case "general": {
        activeEffects.bonusGeneralAbility.subtypes[aKey] = {
          label: ability.mnemonic,
          key: computedKey,
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          default: 2
        };
        activeEffects.affinityGeneralAbility.subtypes[aKey] = {
          label: ability.mnemonic,
          key: afinityComputedKey,
          mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
          default: 1.5
        };
        break;
      }
      case "academic": {
        activeEffects.bonusAcademicAbility.subtypes[aKey] = {
          label: ability.mnemonic,
          key: computedKey,
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          default: 2
        };
        activeEffects.affinityAcademicAbility.subtypes[aKey] = {
          label: ability.mnemonic,
          key: afinityComputedKey,
          mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
          default: 1.5
        };
        break;
      }
      case "arcane": {
        activeEffects.bonusArcaneAbility.subtypes[aKey] = {
          label: ability.mnemonic,
          key: computedKey,
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          default: 2
        };
        activeEffects.affinityArcaneAbility.subtypes[aKey] = {
          label: ability.mnemonic,
          key: afinityComputedKey,
          mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
          default: 1.5
        };
        break;
      }
      case "martial": {
        activeEffects.bonusMartialAbility.subtypes[aKey] = {
          label: ability.mnemonic,
          key: computedKey,
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          default: 2
        };
        activeEffects.affinityMartialAbility.subtypes[aKey] = {
          label: ability.mnemonic,
          key: afinityComputedKey,
          mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
          default: 1.5
        };
        break;
      }
      case "mystery": {
        activeEffects.bonusMysteryAbility.subtypes[aKey] = {
          label: ability.mnemonic,
          key: computedKey,
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          default: 2
        };
        activeEffects.affinityMysteryAbility.subtypes[aKey] = {
          label: ability.mnemonic,
          key: afinityComputedKey,
          mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
          default: 1.5
        };
        break;
      }
      case "supernaturalCat": {
        activeEffects.bonusSupernaturalAbility.subtypes[aKey] = {
          label: ability.mnemonic,
          key: computedKey,
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          default: 2
        };
        activeEffects.affinitySupernaturalAbility.subtypes[aKey] = {
          label: ability.mnemonic,
          key: afinityComputedKey,
          mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
          default: 1.5
        };
        break;
      }
    }
  }
  console.log(activeEffects);
  debugger;
}

export function getSystemCompendium(compendiumName) {
  let pack = game.packs.filter(
    p => p.metadata.packageName === "arm5e" && p.metadata.name === compendiumName
  );
  if (pack.length) return pack[0];
  return undefined;
}

export function putInFoldableLink(label, content, startHidden = true) {
  let hidden = "";
  if (startHidden) {
    hidden = "hidden";
  }
  return `<div class="arm5e clickable toggleHidden"><p style="text-align:center">${game.i18n.localize(
    label
  )}</p></div><div class="${hidden} details">${content}</div>`;
}

export function putInFoldableLinkWithAnimation(label, content, startHidden = true) {
  let hidden = "";
  if (startHidden) {
    hidden = "hide";
  }
  return `<div class="arm5e clickable toggleCollapse"><p style="text-align:center">${game.i18n.localize(
    label
  )}</p></div><div class="${hidden} details">${content}</div>`;
}
