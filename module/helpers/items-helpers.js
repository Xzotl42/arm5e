const TYPE_OF_ROLL = {
  ABILITY: "ability",
  SPELL: "spell",
  MAGIC: "magic",
  POWER: "power",
  SPONT: "spont",
  WEAPON: "weapon"
};

//TODO
function getDatasetForAbility(item) {
  if (item?.type !== TYPE_OF_ROLL.ABILITY) return {};

  return {
    roll: TYPE_OF_ROLL.ABILITY,
    ability: item._id,
    defaultCharacteristic: item.system.defaultChaAb,
    name: name
  };
}

//TODO
function getDatasetForWeapon(item) {
  if (item?.type !== TYPE_OF_ROLL.WEAPON) return {};
  if (!item.system.equiped) {
    ui.notifications.info(game.i18n.localize("arm5e.sheet.notEquipedWeapon"));
    return {};
  }
  return {
    roll: "combat",
    name: game.i18n.localize("arm5e.sheet.attack"),
    option1: item.actor.system.characteristics.dex.value,
    txtoption1: game.i18n.localize("arm5e.sheet.dexterity"),
    option2: item.actor.system.combat.ability,
    txtoption2: game.i18n.localize("arm5e.sheet.ability"),
    option3: item.actor.system.combat.atk,
    txtoption3: game.i18n.localize("arm5e.sheet.attack")
  };
}

//TODO
function getDatasetForSpell(item, noCheck) {
  if (!noCheck && item?.type !== TYPE_OF_ROLL.SPELL) return {};

  return {
    roll: TYPE_OF_ROLL.SPELL,
    id: item._id,
    technique: item.system.technique.value,
    form: item.system.form.value,
    bonus: item.system.bonus,
    mastery: item.system.mastery,
    bonusActiveEffects: item.actor.system.bonuses.arts.spellcasting,
    name: item.name,
    img: item.img
  };
}

function getDatasetForMagic(item) {
  if (item?.type !== "magicalEffect") return {};
  return {
    roll: TYPE_OF_ROLL.MAGIC,
    id: item._id,
    technique: item.system.technique.value,
    form: item.system.form.value,
    bonus: item.system.bonus,
    bonusActiveEffects: item.actor.system.bonuses.arts.spellcasting,
    name: item.name,
    img: item.img,
    divide: 2
  };
}

function getDatasetForPower(item) {
  if (item?.type !== TYPE_OF_ROLL.POWER) return {};
  return {
    roll: TYPE_OF_ROLL.POWER,
    id: item._id,
    form: item.system.form,
    cost: item.system.cost,
    bonusActiveEffects: item.actor.system.bonuses.arts.spellcasting,
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
    ...getDatasetForPower(item)
  };
}

export { prepareDatasetByTypeOfItem };
