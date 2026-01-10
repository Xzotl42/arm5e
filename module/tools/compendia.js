import { ARM5E } from "../config.js";
import { log } from "./tools.js";

// get the corresponding collection from the reference module, based on configuration.
export async function getRefCompendium(collectionName) {
  const moduleRef = game.settings.get(ARM5E.SYSTEM_ID, "compendiaRef");
  let collection = game.packs.get(`${moduleRef}.${collectionName}`);
  if (collection) {
    return collection;
  }
  collection = game.packs.get(`${"arm5e-compendia"}.${collectionName}`);
  if (!collection) {
    console.log(`Unknown compendium ${dataset.compendium}.`);
  }
  return collection;
}

/**
 *
 * @param key
 * @param option
 */
export async function getAbilityFromCompendium(key, option = "") {
  const ref = game.settings.get(ARM5E.SYSTEM_ID, "compendiaRef");

  let res = await getAbilityInternal(ref, key, option);
  if (!res) {
    if (game.settings.get(ARM5E.SYSTEM_ID, "notifyMissingRef") == "true") {
      ui.notifications.info(`Unknown ability key (${key}) in ${ref} compendium`);
    }
    res = await getAbilityInternal(ARM5E.REF_MODULE_ID, key, option);
  }
  return res;
}

/**
 *
 * @param moduleRef
 * @param key
 * @param option
 */
async function getAbilityInternal(moduleRef, key, option = "") {
  let abilitiesPack = game.packs.get(`${moduleRef}.abilities`);

  if (abilitiesPack == undefined) return undefined;

  if (!abilitiesPack.indexFields.has("system.key")) {
    await abilitiesPack.getIndex({ fields: ["system.key", "system.option"] });
  }
  let res = abilitiesPack.index.find((i) => i.system.key == key && i.system.option == option);
  if (res) {
    let genericAb = await fromUuid(res.uuid);
    return genericAb.toObject();
  } else if (option !== "" && CONFIG.ARM5E.ALL_ABILITIES[key].option) {
    // Try to get without specified the option:
    let optionDefault = game.i18n.localize(CONFIG.ARM5E.ALL_ABILITIES[key].optionDefault);

    res = abilitiesPack.index.find((i) => i.system.key == key && i.system.option == optionDefault);
    if (res) {
      let genericAb = await fromUuid(res.uuid);
      // Update the option
      genericAb = genericAb.toObject();
      genericAb.system.option = option;
      return genericAb;
    }
  }
  return null;
}

/**
 *
 * @param compendium
 * @param indexkey
 */
export async function getItemFromCompendium(compendium, indexkey) {
  const ref = game.settings.get(ARM5E.SYSTEM_ID, "compendiaRef");

  let res = await getItemInternal(ref, compendium, indexkey);
  if (!res) {
    if (game.settings.get(ARM5E.SYSTEM_ID, "notifyMissingRef") == "true") {
      ui.notifications.info(`Unknown item key (${indexkey}) in ${ref} compendium`);
    }
    res = await getItemInternal(ARM5E.REF_MODULE_ID, indexkey);
  }
  return res;
}

/**
 *
 * @param moduleRef
 * @param compendium
 * @param indexkey
 */
async function getItemInternal(moduleRef, compendium, indexkey) {
  let pack = game.packs.get(`${moduleRef}.${compendium}`);

  if (pack == undefined) return undefined;

  if (!pack.indexFields.has("system.indexKey")) {
    await pack.getIndex({ fields: ["system.indexKey"] });
  }
  let res = pack.index.find((i) => i.system.indexKey == indexkey);
  if (res) {
    return await fromUuid(res.uuid);
  }
  return null;
}
