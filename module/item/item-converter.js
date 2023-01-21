import { log } from "../tools.js";

/*
 *   functions to convert a type to another
 */

// _moveField(fieldName, source, target) {
//     target[fieldName] = source[fieldName];
//     delete source[fieldName];
//     return target;
// }

/*
 * Convert effect into a lab text
 * @param {object} data   The data object to be converted
 * @return {Promise<Object|null>}
 */
export function effectToLabText(spellData) {
  if (
    spellData.type != "spell" &&
    spellData.type != "magicalEffect" &&
    spellData.type != "enchantment"
  ) {
    return null;
  }
  log(false, "effectToLabText");
  log(false, spellData.name);
  spellData.img = CONFIG.ARM5E_DEFAULT_ICONS["laboratoryText"];
  if (spellData.type == "spell") {
    spellData.system.type = "spell";
    delete spellData.system.mastery;
    delete spellData.system.exp;
    delete spellData.system.bonus;
    delete spellData.system.applyFocus;
  } else if (spellData.type == "magicalEffect") {
    spellData.system.type = "spell";
  } else if (spellData.type == "enchantment") {
    spellData.system.type = "enchantment";
  }
  spellData.type = "laboratoryText";
  return spellData;
}

/*
 * Convert effect into a lab text
 * @param {object} data   The data object to be converted
 * @return {Promise<Object|null>}
 */
export function labTextToEffect(labTextData) {
  if (labTextData.type != "laboratoryText") {
    return null;
  }
  log(false, "labTextToEffect");
  log(false, labTextData.name);
  if (labTextData.system.type === "spell") {
    delete labTextData.system.type;
    delete labTextData.system.effectfrequency;
    delete labTextData.system.penetration;
    delete labTextData.system.maintainConc;
    delete labTextData.system.environmentalTrigger;
    delete labTextData.system.restrictedUse;
    delete labTextData.system.linkedTrigger;
    delete labTextData.system.author;
    delete labTextData.system.year;
    delete labTextData.system.season;
    delete labTextData.system.language;
    return {
      name: labTextData.name,
      type: "spell",
      img: CONFIG.ARM5E_DEFAULT_ICONS["spell"],
      system: labTextData.system
    };
  } else if (labTextData.system.type === "enchantment") {
    labTextData.img = CONFIG.ARM5E_DEFAULT_ICONS["enchantment"];
    labTextData.type = "enchantment";
    delete labTextData.system.type;
    delete labTextData.system.author;
    delete labTextData.system.year;
    delete labTextData.system.season;
    delete labTextData.system.language;
  } else {
    // unknown labText type
    return null;
  }
  return labTextData;
}

export function resetOwnerFields(itemData) {
  switch (itemData.type) {
    case "spell":
      delete itemData.system.mastery;
      delete itemData.system.masteryAbilities;
      delete itemData.system.exp;
      delete itemData.system.bonus;
      delete itemData.system.xp;
    case "magicalEffect":
      delete itemData.system.applyFocus;
      return itemData;
    case "ability":
      delete itemData.system.xp;
      delete itemData.system.experience;
      delete itemData.system.experienceNextLevel;
      delete itemData.system.score;
      return itemData;
    default:
      return itemData;
  }
}

/* -------------------------------------------- */
