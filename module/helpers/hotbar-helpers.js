import { ROLL_PROPERTIES } from "./rollWindow.js";

const TYPE_OF_DATASET = {
  ABILITY: "ability",
  SPELL: "spell",
  MAGIC: "magic",
  POWER: "power",
  SPONT: "spont",
  WEAPON: "weapon",
  SUPERNATURAL: "supernaturalEffect"
};

//TODO
function getDatasetForAbility(item) {
  if (item?.type !== TYPE_OF_DATASET.ABILITY) return {};

  return {
    roll: TYPE_OF_DATASET.ABILITY,
    ability: item._id,
    defaultCharacteristic: item.system.defaultChaAb,
    name: name
  };
}

//TODO
function getDatasetForWeapon(item) {
  if (item?.type !== TYPE_OF_DATASET.WEAPON) return {};
  if (!item.system.equipped) {
    ui.notifications.info(game.i18n.localize("arm5e.sheet.notEquippedWeapon"));
    return {};
  }
  return {
    roll: ROLL_PROPERTIES.ATTACK.VAL,
    name: game.i18n.localize("arm5e.sheet.attack")
    // option1: item.actor.system.characteristics.dex.value,
    // txtoption1: game.i18n.localize("arm5e.sheet.dexterity"),
    // option2: item.actor.system.combat.ability,
    // txtoption2: game.i18n.localize("arm5e.sheet.ability"),
    // option3: item.actor.system.combat.atk,
    // txtoption3: game.i18n.localize("arm5e.sheet.attack")
  };
}

//TODO
function getDatasetForSpell(item, noCheck) {
  if (!noCheck && item?.type !== TYPE_OF_DATASET.SPELL) return {};

  return {
    roll: ROLL_PROPERTIES.SPELL.VAL,
    id: item._id,
    technique: item.system.technique.value,
    form: item.system.form.value,
    bonus: item.system.bonus,
    finalScore: item.system.finalScore,
    name: item.name,
    img: item.img
  };
}

function getDatasetForMagic(item) {
  if (item?.type !== "magicalEffect") return {};
  return {
    roll: TYPE_OF_DATASET.MAGIC,
    id: item._id,
    technique: item.system.technique.value,
    form: item.system.form.value,
    bonus: item.system.bonus,
    name: item.name,
    img: item.img,
    divide: 2
  };
}

function getDatasetForPower(item) {
  if (item?.type !== TYPE_OF_DATASET.POWER) return {};
  return {
    roll: TYPE_OF_DATASET.POWER,
    id: item._id,
    form: item.system.form,
    cost: item.system.cost,
    name: item.name,
    img: item.img
  };
}

function getDatasetForSupernatural(item) {
  if (item?.type !== TYPE_OF_DATASET.SUPERNATURAL) return {};
  return {
    roll: "supernatural",
    id: item._id,
    name: item.name,
    img: item.img
  };
}

function prepareDatasetByTypeOfItem(item) {
  return {
    ...getDatasetForAbility(item),
    ...getDatasetForWeapon(item),
    ...getDatasetForSpell(item),
    ...getDatasetForMagic(item),
    ...getDatasetForPower(item),
    ...getDatasetForSupernatural(item)
  };
}

export { prepareDatasetByTypeOfItem };
