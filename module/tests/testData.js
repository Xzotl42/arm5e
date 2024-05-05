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

export const readingSkill = {
  description: "",
  source: "ArM5",
  page: 66,
  defaultChaAb: "int",
  speciality: "latin",
  xp: 75,
  key: "artesLib"
};

export const teachingSkill = {
  description: "",
  source: "ArM5",
  page: 66,
  defaultChaAb: "com",
  speciality: "creo",
  xp: 75,
  key: "teaching"
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
export const heavyCombatSkill = {
  description: "",
  source: "ArM5",
  page: 66,
  defaultChaAb: "dex",
  speciality: "sword",
  xp: 55,
  key: "greatWeapon",
  option: ""
};
export const penetrationSkill = {
  description: "",
  source: "ArM5",
  page: 62,
  defaultChaAb: "sta",
  speciality: "Creo",
  xp: 55,
  key: "penetration",
  option: ""
};

export const magicTheorySkill = {
  description: "",
  source: "ArM5",
  page: 62,
  defaultChaAb: "int",
  speciality: "Creo",
  xp: 75,
  key: "magicTheory",
  option: ""
};

export const athleticsSkill = {
  description: "",
  source: "ArM5",
  page: 62,
  defaultChaAb: "dex",
  speciality: "",
  xp: 32,
  key: "athletics",
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
  load: 6,
  prot: 2,
  full: false,
  equipped: true
};

export const magicalEffect1 = {
  description: "",
  source: "custom",
  page: 0,
  technique: {
    value: "cr"
  },
  "technique-req": {
    cr: false,
    in: false,
    mu: false,
    pe: false,
    re: false
  },
  form: {
    value: "ig"
  },
  "form-req": {
    an: false,
    aq: false,
    au: false,
    co: false,
    he: false,
    ig: false,
    im: false,
    me: false,
    te: false,
    vi: false
  },
  range: {
    value: "voice"
  },
  duration: {
    value: "sun"
  },
  target: {
    value: "ind"
  },
  targetSize: 0,
  complexity: 0,
  enhancingRequisite: 0,
  general: false,
  levelOffset: 0,
  baseLevel: 2,
  baseEffectDescription: "Blabla",
  applyFocus: false
};

export const magicalEffect2 = {
  description: "All req",
  source: "custom",
  page: 0,
  technique: {
    value: "mu"
  },
  "technique-req": {
    cr: true,
    in: true,
    mu: false,
    pe: true,
    re: true
  },
  form: {
    value: "vi"
  },
  "form-req": {
    an: true,
    aq: true,
    au: true,
    co: true,
    he: true,
    ig: true,
    im: true,
    me: true,
    te: true,
    vi: false
  },
  range: {
    value: "voice"
  },
  duration: {
    value: "sun"
  },
  target: {
    value: "ind"
  },
  targetSize: 0,
  complexity: 0,
  enhancingRequisite: 0,
  general: false,
  levelOffset: 0,
  baseLevel: 1,
  baseEffectDescription: "Blabla",
  applyFocus: false
};

export const magicalEffect3 = {
  description: "",
  source: "custom",
  page: 0,
  technique: {
    value: "mu"
  },
  "technique-req": {
    cr: false,
    in: false,
    mu: false,
    pe: false,
    re: false
  },
  form: {
    value: "co"
  },
  "form-req": {
    an: true,
    aq: false,
    au: false,
    co: false,
    he: false,
    ig: false,
    im: false,
    me: false,
    te: false,
    vi: false
  },
  range: {
    value: "voice"
  },
  duration: {
    value: "sun"
  },
  target: {
    value: "ind"
  },
  targetSize: 1,
  complexity: 1,
  enhancingRequisite: 1,
  general: false,
  levelOffset: 0,
  baseLevel: 2,
  baseEffectDescription: "Blabla",
  applyFocus: true
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
  equipped: true,
  ability: "singleWeapon"
};
export const spellData1 = {
  description: "",
  source: "custom",
  page: 0,
  technique: {
    value: "mu"
  },
  "technique-req": {
    cr: false,
    in: false,
    mu: false,
    pe: false,
    re: false
  },
  form: {
    value: "im"
  },
  "form-req": {
    an: false,
    aq: false,
    au: false,
    co: false,
    he: false,
    ig: false,
    im: false,
    me: false,
    te: false,
    vi: false
  },
  range: {
    value: "personal"
  },
  duration: {
    value: "sun"
  },
  target: {
    value: "ind"
  },
  targetSize: 0,
  complexity: 0,
  enhancingRequisite: 0,
  general: false,
  levelOffset: 0,
  baseLevel: 4,
  baseEffectDescription: "",
  applyFocus: false,
  ritual: false,
  bonus: 4,
  bonusDesc: "Talisman",
  xp: 0,
  masteryAbilities: ""
};

export const spellData2 = {
  description: "",
  source: "custom",
  page: 0,
  technique: {
    value: "mu"
  },
  "technique-req": {
    cr: false,
    in: false,
    mu: false,
    pe: false,
    re: false
  },
  form: {
    value: "co"
  },
  "form-req": {
    an: false,
    aq: false,
    au: false,
    co: false,
    he: false,
    ig: false,
    im: false,
    me: false,
    te: false,
    vi: false
  },
  range: {
    value: "personal"
  },
  duration: {
    value: "sun"
  },
  target: {
    value: "ind"
  },
  targetSize: 0,
  complexity: 0,
  enhancingRequisite: 2,
  general: false,
  levelOffset: 0,
  baseLevel: 10,
  baseEffectDescription: "",
  applyFocus: true,
  ritual: false,
  bonus: 3,
  bonusDesc: "Talisman",
  xp: 30,
  masteryAbilities: ""
};
export const spellData3 = {
  description: "",
  source: "custom",
  page: 0,
  technique: {
    value: "mu"
  },
  "technique-req": {
    cr: false,
    in: false,
    mu: false,
    pe: false,
    re: false
  },
  form: {
    value: "vi"
  },
  "form-req": {
    an: false,
    aq: false,
    au: false,
    co: false,
    he: false,
    ig: false,
    im: false,
    me: false,
    te: false,
    vi: false
  },
  range: {
    value: "personal"
  },
  duration: {
    value: "sun"
  },
  target: {
    value: "ind"
  },
  targetSize: 3,
  complexity: 4,
  enhancingRequisite: 0,
  general: true,
  levelOffset: 3,
  baseLevel: 4,
  baseEffectDescription: "",
  applyFocus: false,
  ritual: false,
  bonus: 3,
  bonusDesc: "Talisman",
  xp: 30,
  masteryAbilities: ""
};

export const newSpell1 = {
  description: "",
  source: "custom",
  page: 0,
  technique: {
    value: "cr"
  },
  "technique-req": {
    cr: false,
    in: false,
    mu: false,
    pe: false,
    re: false
  },
  form: {
    value: "co"
  },
  "form-req": {
    an: false,
    aq: false,
    au: false,
    co: false,
    he: false,
    ig: false,
    im: false,
    me: false,
    te: false,
    vi: false
  },
  range: {
    value: "touch"
  },
  duration: {
    value: "sun"
  },
  target: {
    value: "ind"
  },
  targetSize: 0,
  complexity: 0,
  enhancingRequisite: 0,
  general: true,
  levelOffset: 3,
  baseLevel: 4,
  baseEffectDescription: "",
  applyFocus: false,
  ritual: false,
  bonus: 3,
  bonusDesc: "Talisman",
  xp: 30,
  masteryAbilities: ""
};

export const magusData = {
  biography: "Character biography, notes, &c.",
  characteristics: {
    int: { value: 4, aging: 1 },
    per: { value: 2, aging: 0 },
    str: { value: 0, aging: 0 },
    sta: { value: 3, aging: 0 },
    pre: { value: 1, aging: 0 },
    com: { value: -1, aging: 0 },
    dex: { value: -2, aging: 0 },
    qik: { value: -3, aging: 2 }
  },
  description: {
    born: { value: "1200" },
    apprentice: { value: "10" },
    birthname: { value: "" },
    birthplace: { value: "Aix" },
    nationality: { value: "Roman" },
    religion: { value: "Christian" },
    height: { value: "175" },
    weight: { value: "" },
    gender: { value: "male" },
    hair: { value: "black" },
    eyes: { value: "grey" },
    title: { value: "Magus" },
    handed: { value: "right" }
  },
  arts: {
    techniques: {
      cr: {
        xp: 15
      },
      in: {
        xp: 6
      },
      mu: {
        xp: 187
      },
      pe: {
        xp: 0
      },
      re: {
        xp: 23
      }
    },
    forms: {
      an: {
        xp: 21
      },
      aq: {
        xp: 20
      },
      au: {
        xp: 10
      },
      co: {
        xp: 120
      },
      he: {
        xp: 0
      },
      ig: {
        xp: 30
      },
      im: {
        xp: 30
      },
      me: {
        xp: 30
      },
      te: {
        xp: 30
      },
      vi: {
        xp: 6
      }
    }
  },
  stances: {
    voiceStance: "firm",
    voice: {
      loud: 1,
      firm: 0,
      quiet: -5,
      silent: -10
    },
    gesturesStance: "bold",
    gestures: {
      exaggerated: 1,
      bold: 0,
      subtle: -2,
      motionless: -5
    }
  }
};
export const magusData2 = {
  biography: "Character biography, notes, &c.",
  characteristics: {
    int: { value: 4, aging: 1 },
    per: { value: 0, aging: 0 },
    str: { value: 0, aging: 0 },
    sta: { value: 1, aging: 0 },
    pre: { value: -1, aging: 0 },
    com: { value: 3, aging: 0 },
    dex: { value: -2, aging: 0 },
    qik: { value: -3, aging: 2 }
  },
  description: {
    born: { value: "1150" },
    apprentice: { value: "10" },
    birthname: { value: "" },
    birthplace: { value: "Aix" },
    nationality: { value: "Roman" },
    religion: { value: "Christian" },
    height: { value: "175" },
    weight: { value: "" },
    gender: { value: "male" },
    hair: { value: "black" },
    eyes: { value: "grey" },
    title: { value: "Magus" },
    handed: { value: "right" }
  },
  arts: {
    techniques: {
      cr: {
        xp: 115
      },
      in: {
        xp: 6
      },
      mu: {
        xp: 87
      },
      pe: {
        xp: 0
      },
      re: {
        xp: 23
      }
    },
    forms: {
      an: {
        xp: 21
      },
      aq: {
        xp: 20
      },
      au: {
        xp: 10
      },
      co: {
        xp: 220
      },
      he: {
        xp: 0
      },
      ig: {
        xp: 30
      },
      im: {
        xp: 30
      },
      me: {
        xp: 30
      },
      te: {
        xp: 130
      },
      vi: {
        xp: 6
      }
    }
  }
};

export const spell1 = {
  description: "",
  source: "custom",
  page: 0,
  technique: {
    value: "cr"
  },
  "technique-req": {
    cr: false,
    in: false,
    mu: false,
    pe: false,
    re: false
  },
  form: {
    value: "ig"
  },
  "form-req": {
    an: false,
    aq: false,
    au: false,
    co: false,
    he: false,
    ig: false,
    im: false,
    me: false,
    te: false,
    vi: false
  },
  range: {
    value: "personal"
  },
  duration: {
    value: "moment"
  },
  target: {
    value: "room"
  },
  targetSize: 3,
  complexity: 1,
  enhancingRequisite: 0,
  general: false,
  levelOffset: 0,
  baseLevel: 10,
  baseEffectDescription: "",
  applyFocus: false,
  ritual: false,
  bonus: 0,
  bonusDesc: "",
  xp: 0,
  masteryAbilities: ""
};

export const labData = {
  size: {
    description: "",
    value: 1
  },
  generalQuality: {
    description: "",
    value: 1
  },
  safety: {
    description: "",
    value: 2
  },
  health: {
    description: "",
    value: 1
  },
  refinement: {
    description: "",
    value: 1
  },
  upkeep: {
    description: "",
    value: 0
  },
  warping: {
    description: "",
    value: 1
  },
  aesthetics: {
    description: "",
    value: 0
  }
};

export async function getLab(name = "the lab") {
  let lab = await Actor.create({
    name: name,
    type: "laboratory",
    system: labData
  });

  return lab;
}

export async function getCompanion(name = "Bob") {
  let character = await Actor.create({
    name: name,
    type: "player",
    system: companionData
  });
  let items = [
    { name: "sword", type: "ability", system: combatSkill },
    { name: "poleaxe", type: "ability", system: heavyCombatSkill },
    { name: "sword", type: "weapon", system: weaponItem },
    { name: "haubert", type: "armor", system: armorItem }
  ];
  await character.createEmbeddedDocuments("Item", items, {});
  return character;
}

export async function getMagus(magusName = "MerlinTheMagus", items = [], override = {}) {
  let character = await Actor.create({
    name: magusName,
    type: "player",
    system: magusData
  });

  items.push({
    name: "Penetration",
    type: "ability",
    system: penetrationSkill
  });
  items.push({
    name: "Artes liberales",
    type: "ability",
    system: readingSkill
  });
  let skillData = foundry.utils.duplicate(magicTheorySkill);
  skillData.xp = 30;
  items.push({ name: "Magic theory", type: "ability", system: skillData });
  items.push({ name: "Gaelic", type: "ability", system: languageSkill });

  items.push({
    name: "Standard effect",
    type: "magicalEffect",
    system: magicalEffect1
  });
  items.push({
    name: "All req effect",
    type: "magicalEffect",
    system: magicalEffect2
  });
  items.push({
    name: "Effect with focus",
    type: "magicalEffect",
    system: magicalEffect3
  });
  items.push({
    name: "Standard spell",
    type: "spell",
    system: spellData1
  });
  items.push({
    name: "Spell with focus",
    type: "spell",
    system: spellData2
  });
  items.push({
    name: "Ritual spell",
    type: "spell",
    system: spellData3
  });

  await character.createEmbeddedDocuments("Item", items, {});

  return character;
}

export async function getTeacher(magusName = "Master", items = [], override = {}) {
  let newData = foundry.utils.duplicate(magusData);
  foundry.utils.mergeObject(newData, foundry.utils.expandObject(override));
  let character = await Actor.create({
    name: magusName,
    type: "player",
    system: newData
  });

  items.push({
    name: "Penetration",
    type: "ability",
    system: penetrationSkill
  });
  items.push({
    name: "Artes liberales",
    type: "ability",
    system: readingSkill
  });
  items.push({ name: "Gaelic", type: "ability", system: languageSkill });
  items.push({ name: "Teaching", type: "ability", system: teachingSkill });
  items.push({ name: "Magic theory", type: "ability", system: magicTheorySkill });

  items.push({
    name: "Standard effect",
    type: "magicalEffect",
    system: magicalEffect1
  });
  items.push({
    name: "All req effect",
    type: "magicalEffect",
    system: magicalEffect2
  });
  items.push({
    name: "Effect with focus",
    type: "magicalEffect",
    system: magicalEffect3
  });
  let spellData = foundry.utils.duplicate(spellData1);
  spellData.xp = 75;
  items.push({
    name: "Standard spell",
    type: "spell",
    system: spellData
  });
  items.push({
    name: "Spell with focus",
    type: "spell",
    system: spellData2
  });
  items.push({
    name: "Ritual spell",
    type: "spell",
    system: spellData3
  });
  items.push({
    name: "Teached spell",
    type: "spell",
    system: newSpell1
  });

  await character.createEmbeddedDocuments("Item", items, {});

  return character;
}
