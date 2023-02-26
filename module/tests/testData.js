export const companionData = {
  biography: "Character biography, notes, &c.",
  characteristics: {
    int: { value: -2, aging: 1 },
    per: { value: -1, aging: 0 },
    str: { value: 2, aging: 0 },
    sta: { value: 3, aging: 0 },
    pre: { value: 0, aging: 0 },
    com: { value: 1, aging: 0 },
    dex: { value: 5, aging: 0 },
    qik: { value: 4, aging: 2 }
  },
  description: {
    born: { value: "1200" },
    apprentice: { value: "10" },
    birthname: { value: "" },
    birthplace: { value: "Aix" },
    nationality: { value: "Roman" },
    religion: { value: "Roman pantheon" },
    height: { value: "175" },
    weight: { value: "" },
    gender: { value: "male" },
    hair: { value: "blond" },
    eyes: { value: "grey" },
    title: { value: "Knight" },
    handed: { value: "left" }
  },
  reputation: {
    rep1: { label: "Dead", type: "awda", score: 1 }
  }
};

export const languageSkill = {
  description: "",
  source: "ArM5",
  page: 66,
  defaultChaAb: "com",
  speciality: "slang",
  xp: 75,
  key: "livingLanguage",
  option: "Gaelic"
};

export const combatSkill = {
  description: "",
  source: "ArM5",
  page: 66,
  defaultChaAb: "dex",
  speciality: "sword",
  xp: 55,
  key: "singleWeapon",
  option: ""
};

export const armorItem = {
  description:
    '<p>&nbsp;</p>\n<div class="page" title="Page 176">\n<div class="section">\n<div class="layoutArea">\n<div class="column">\n<p>Using very thick leather, or hardening leather by wax impregnation or baking, makes a better material for deflecting crushing damage.<span style="font-size: 9.000000pt; font-family: \'Weiss\'; color: rgb(6.313300%, 8.863500%, 10.356300%);">&nbsp;</span></p>\n</div>\n</div>\n</div>\n</div>\n<p>Partial armor covers the vital areas only, and generally consists of a hauberk (a short- sleeved armored coat that extends down to the knee), perhaps a coif to protect the head and neck, and often an open-faced helmet.</p>',
  source: "custom",
  page: 0,
  cost: {
    value: "inexp",
    label: "Cost"
  },
  quantity: 1,
  weight: 6,
  prot: 2,
  full: false,
  equiped: true
};

export const weaponItem = {
  description: "A weapon",
  source: "custom",
  page: 0,
  cost: {
    value: "inexp",
    label: "Cost"
  },
  weaponExpert: true,
  horse: false,
  init: 2,
  atk: 3,
  dfn: 3,
  dam: 2,
  str: -1,
  range: 0,
  load: 2,
  equiped: true
};
