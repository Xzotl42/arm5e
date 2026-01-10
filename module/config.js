import {
  validAdventuring,
  validExposure,
  validPractice,
  validTraining,
  validTeaching,
  validChildhood,
  validTotalXp,
  validReading,
  validVisStudy,
  agingRoll,
  validAging,
  visStudy,
  investigate,
  validWriting,
  twilightUnderstandingRoll
} from "./seasonal-activities/long-term-activities.js";

export const ARM5E = {};

/**
 * The set of metadata used within the sytem that will
 * probably not change during play
 * @type {Object}
 */
ARM5E.SYSTEM_ID = "arm5e";
ARM5E.REF_MODULE_ID = "arm5e-compendia";
ARM5E.character = {};

ARM5E.lang = {
  fr: { aspects: true }
};

ARM5E.genericOptions = {
  filterOperator: [
    { key: "0", label: "=" },
    { key: "-1", label: "<=" },
    { key: "1", label: ">=" }
  ]
};

ARM5E.fontfaces = {
  almendra: "Almendra",
  blackmoor: "Blackmoor (original)",
  bokor: "Bokor",
  eagleLake: "Eagle Lake",
  germaniaOne: "Germania One",
  grenzeGotisch: "Grenze Gotisch",
  medievalSharp: "Medieval Sharp",
  metamorphous: "Metamorphous"
};

ARM5E.character.charTypes = {
  magus: {
    label: "arm5e.sheet.magus",
    dtype: "String"
  },
  companion: {
    label: "arm5e.sheet.companion",
    dtype: "String"
  },
  grog: {
    label: "arm5e.sheet.grog",
    dtype: "String"
  }
};

ARM5E.character.characteristics = {
  int: {
    label: "arm5e.sheet.intelligence",
    short: "arm5e.sheet.int"
  },
  cun: {
    label: "arm5e.sheet.cunning",
    short: "arm5e.sheet.cun"
  },
  per: {
    label: "arm5e.sheet.perception",
    short: "arm5e.sheet.per"
  },
  str: {
    label: "arm5e.sheet.strength",
    short: "arm5e.sheet.str"
  },
  sta: {
    label: "arm5e.sheet.stamina",
    short: "arm5e.sheet.sta"
  },
  pre: {
    label: "arm5e.sheet.presence",
    short: "arm5e.sheet.pre"
  },
  com: {
    label: "arm5e.sheet.communication",
    short: "arm5e.sheet.com"
  },
  dex: {
    label: "arm5e.sheet.dexterity",
    short: "arm5e.sheet.dex"
  },
  qik: {
    label: "arm5e.sheet.quickness",
    short: "arm5e.sheet.qik"
  }
};
// ARM5E.beast = {};
// ARM5E.beast.characteristics = {
//   cun: {
//     label: "arm5e.sheet.cunning",
//     short: "arm5e.sheet.cun"
//   },
//   int: {
//     label: "arm5e.sheet.intelligence",
//     short: "arm5e.sheet.int"
//   },
//   per: {
//     label: "arm5e.sheet.perception",
//     short: "arm5e.sheet.per"
//   },
//   str: {
//     label: "arm5e.sheet.strength",
//     short: "arm5e.sheet.str"
//   },
//   sta: {
//     label: "arm5e.sheet.stamina",
//     short: "arm5e.sheet.sta"
//   },
//   pre: {
//     label: "arm5e.sheet.presence",
//     short: "arm5e.sheet.pre"
//   },
//   com: {
//     label: "arm5e.sheet.communication",
//     short: "arm5e.sheet.com"
//   },
//   dex: {
//     label: "arm5e.sheet.dexterity",
//     short: "arm5e.sheet.dex"
//   },
//   qik: {
//     label: "arm5e.sheet.quickness",
//     short: "arm5e.sheet.qik"
//   }
// };

// Adding/Changing/removing houses

ARM5E.character.houses = {
  "n-a": {
    label: "N/A"
  },
  bjo: {
    label: "Bjornaer"
  },
  bon: {
    label: "Bonisagus"
  },
  cri: {
    label: "Criamon"
  },
  exm: {
    label: "Ex Miscellanea"
  },
  fla: {
    label: "Flambeau"
  },
  gen: {
    label: "Generic Magus"
  },
  gue: {
    label: "Guernicus"
  },
  jer: {
    label: "Jerbiton"
  },
  mer: {
    label: "Mercere"
  },
  mta: {
    label: "Merinita"
  },
  tre: {
    label: "Tremere"
  },
  tyt: {
    label: "Tytalus"
  },
  ver: {
    label: "Verditius"
  },
  die: {
    label: "Diedne"
  }
};

ARM5E.character.description = {
  apprentice: {
    label: "arm5e.sheet.apprenticeshipYears",
    number: true
  },
  birthname: {
    label: "arm5e.sheet.birthName",
    number: false
  },
  birthplace: {
    label: "arm5e.sheet.birthplace",
    number: false
  },
  nationality: {
    label: "arm5e.sheet.nationality",
    number: false
  },
  religion: {
    label: "arm5e.sheet.religion",
    number: false
  },
  height: {
    label: "arm5e.sheet.height",
    number: false
  },
  weight: {
    label: "arm5e.sheet.weight",
    number: false
  },
  gender: {
    label: "arm5e.sheet.gender",
    number: false
  },
  hair: {
    label: "arm5e.sheet.hair",
    number: false
  },
  eyes: {
    label: "arm5e.sheet.eyes",
    number: false
  },
  title: {
    label: "arm5e.sheet.profession",
    number: false
  },
  handed: {
    label: "arm5e.sheet.handedness",
    number: false
  }
};

ARM5E.virtueFlawTypes = {};

ARM5E.virtueFlawTypes.all = {
  other: {
    label: "arm5e.sheet.other"
  }
};

ARM5E.virtueFlawTypes.character = {
  hermetic: {
    label: "arm5e.sheet.hermetic"
  },
  supernatural: {
    label: "arm5e.sheet.supernatural"
  },
  general: {
    label: "arm5e.sheet.general"
  },
  personality: {
    label: "arm5e.sheet.personalityFlaw"
  },
  story: {
    label: "arm5e.sheet.story"
  },
  child: {
    label: "arm5e.sheet.child"
  },
  heroic: {
    label: "arm5e.sheet.heroic"
  },
  social: {
    label: "arm5e.sheet.socialStatus"
  },
  socialWestern: {
    label: "arm5e.sheet.socialStatusWestern"
  },
  socialEastern: {
    label: "arm5e.sheet.socialStatusEastern"
  },
  socialJewish: {
    label: "arm5e.sheet.socialStatusJewish"
  },
  socialIslamic: {
    label: "arm5e.sheet.socialStatusIslamic"
  },
  socialHibernia: {
    label: "arm5e.sheet.socialStatusHibernia"
  },
  socialIberia: {
    label: "arm5e.sheet.socialStatusIberia"
  },
  socialNorthAfrica: {
    label: "arm5e.sheet.socialStatusNorthAfrica"
  },
  socialPersia: {
    label: "arm5e.sheet.socialStatusPersia"
  },
  socialProvencal: {
    label: "arm5e.sheet.socialStatusProvencal"
  }
};

ARM5E.virtueFlawTypes.laboratory = {
  laboratoryStructure: {
    label: "arm5e.sheet.laboratoryStructure"
  },
  laboratoryOutfitting: {
    label: "arm5e.sheet.laboratoryOutfitting"
  },
  laboratorySupernatural: {
    label: "arm5e.sheet.laboratorySupernatural"
  }
};

ARM5E.virtueFlawTypes.covenant = {
  general: {
    label: "arm5e.sheet.general"
  },
  covenantSite: {
    label: "arm5e.sheet.covenantSite"
  },
  covenantResources: {
    label: "arm5e.sheet.covenantResources"
  },
  covenantResidents: {
    label: "arm5e.sheet.covenantResidents"
  },
  covenantExternalRelations: {
    label: "arm5e.sheet.covenantExternalRelations"
  },
  covenantSurroundings: {
    label: "arm5e.sheet.covenantSurroundings"
  }
};

ARM5E.qualityTypes = {
  mundane: {
    label: "arm5e.realm.mundane"
  },
  magic: {
    label: "arm5e.realm.magic"
  }
};

ARM5E.character.fatigueLevels = {
  fresh: {
    label: "arm5e.sheet.fresh",
    time: 0,
    timeLabel: ""
  },
  winded: {
    label: "arm5e.sheet.winded",
    time: 2,
    timeLabel: "2",
    timeUnits: "arm5e.generic.minutesShort"
  },
  weary: {
    label: "arm5e.sheet.weary",
    time: 10,
    timeLabel: "10",
    timeUnits: "arm5e.generic.minutesShort"
  },
  tired: {
    label: "arm5e.sheet.tired",
    time: 30,
    timeLabel: "30",
    timeUnits: "arm5e.generic.minutesShort"
  },
  dazed: {
    label: "arm5e.sheet.dazed",
    time: 60,
    timeLabel: "1",
    timeUnits: "arm5e.generic.hoursShort"
  },
  unconscious: {
    label: "arm5e.sheet.unconscious",
    time: 120,
    timeLabel: "2",
    timeUnits: "arm5e.generic.hoursShort"
  }
};

ARM5E.character.wounds = {
  labels: {
    number: "arm5e.sheet.number",
    penalty: "arm5e.sheet.penalty",
    notes: "arm5e.sheet.notes"
  },
  light: {
    label: "arm5e.sheet.light"
  },
  medium: {
    label: "arm5e.sheet.medium"
  },
  heavy: {
    label: "arm5e.sheet.heavy"
  },
  incap: {
    label: "arm5e.sheet.incap"
  },
  dead: {
    label: "arm5e.sheet.dead"
  }
};

ARM5E.character.vitals = {
  siz: {
    label: "arm5e.sheet.size"
  },
  soa: {
    label: "arm5e.sheet.soak"
  },
  enc: {
    label: "arm5e.sheet.encumbrance"
  }
};

ARM5E.character.magicAbilities = {
  artesLib: "arm5e.skill.academic.artesLib",
  awareness: "arm5e.skill.general.awareness",
  concentration: "arm5e.skill.general.concentration",
  finesse: "arm5e.skill.arcane.finesse",
  magicTheory: "arm5e.skill.arcane.magicTheory",
  parma: "arm5e.skill.arcane.parma",
  philosophy: "arm5e.skill.academic.philosophy",
  penetration: "arm5e.skill.arcane.penetration"
};

ARM5E.character.magicRolls = {
  fastCastingSpeed: { label: "arm5e.sheet.fastCastingSpeed.label" },
  determiningEffect: { label: "arm5e.sheet.determiningEffect.label" },
  concentration: { label: "arm5e.sheet.concentration.label" },
  targeting: { label: "arm5e.sheet.targeting.label" },
  magicResistance: { label: "arm5e.sheet.magicResistance.label" },
  multipleCasting: { label: "arm5e.sheet.multipleCasting.label" },
  basicLabTotal: { label: "arm5e.sheet.basicLabTotal.label" },
  visLimit: { label: "arm5e.sheet.visLimit.label" }
};

ARM5E.reputations = {
  local: { label: "arm5e.sheet.reputationType.local" },
  ecclesiastic: { label: "arm5e.sheet.reputationType.ecclesiastic" },
  hermetic: { label: "arm5e.sheet.reputationType.hermetic" },
  persona: { label: "arm5e.sheet.reputationType.persona" },
  academic: { label: "arm5e.sheet.reputationType.academic" },
  infernal: { label: "arm5e.sheet.reputationType.infernal" }
};

ARM5E.ABILITIES_CATEGORIES = {
  general: { mnemonic: "arm5e.skill.category.general" },
  academic: { mnemonic: "arm5e.skill.category.academic" },
  arcane: { mnemonic: "arm5e.skill.category.arcane" },
  martial: { mnemonic: "arm5e.skill.category.martial" },
  mystery: { mnemonic: "arm5e.skill.category.mystery" },
  supernaturalCat: { mnemonic: "arm5e.skill.category.supernatural" },
  altTechnique: { mnemonic: "arm5e.skill.category.technique" },
  altForm: { mnemonic: "arm5e.skill.category.form" }
};
ARM5E.GENERAL_ABILITIES = {
  animalHandling: {
    mnemonic: "arm5e.skill.general.animalHandling",
    option: false,
    category: "general"
  },
  areaLore: {
    mnemonic: "arm5e.skill.general.areaLore",
    option: true,
    category: "general",
    optionPlaceholder: "arm5e.skill.options.area",
    optionDefault: "area-name"
  },
  athletics: {
    mnemonic: "arm5e.skill.general.athletics",
    option: false,
    category: "general"
  },
  awareness: {
    mnemonic: "arm5e.skill.general.awareness",
    option: false,
    category: "general"
  },
  bargain: {
    mnemonic: "arm5e.skill.general.bargain",
    option: false,
    category: "general"
  },
  brawl: {
    mnemonic: "arm5e.skill.general.brawl",
    option: false,
    category: "general"
  },
  carouse: {
    mnemonic: "arm5e.skill.general.carouse",
    option: false,
    category: "general"
  },
  charm: {
    mnemonic: "arm5e.skill.general.charm",
    option: false,
    category: "general"
  },
  chirurgy: {
    mnemonic: "arm5e.skill.general.chirurgy",
    option: false,
    category: "general"
  },
  concentration: {
    mnemonic: "arm5e.skill.general.concentration",
    option: false,
    category: "general"
  },
  craft: {
    mnemonic: "arm5e.skill.general.craft",
    option: true,
    category: "general",
    optionPlaceholder: "arm5e.skill.options.craft",
    optionDefault: "craft"
  },
  etiquette: {
    mnemonic: "arm5e.skill.general.etiquette",
    option: false,
    category: "general"
  },
  folkKen: {
    mnemonic: "arm5e.skill.general.folkKen",
    option: false,
    category: "general"
  },
  guile: {
    mnemonic: "arm5e.skill.general.guile",
    option: false,
    category: "general"
  },
  hunt: { mnemonic: "arm5e.skill.general.hunt", option: false, category: "general" },
  intrigue: {
    mnemonic: "arm5e.skill.general.intrigue",
    option: false,
    category: "general"
  },
  knowledge: {
    mnemonic: "arm5e.skill.general.knowledge",
    option: true,
    category: "general",

    optionPlaceholder: "arm5e.skill.options.knowledge",
    optionDefault: "topic-name"
  },
  leadership: {
    mnemonic: "arm5e.skill.general.leadership",
    option: false,
    category: "general"
  },
  legerdemain: {
    mnemonic: "arm5e.skill.general.legerdemain",
    option: false,
    category: "general"
  },
  livingLanguage: {
    mnemonic: "arm5e.skill.general.livingLanguage",
    option: true,
    category: "general",

    optionPlaceholder: "arm5e.skill.options.language",
    optionDefault: "language-name"
  },
  music: {
    mnemonic: "arm5e.skill.general.music",
    option: false,
    category: "general"
  },
  organizationLore: {
    mnemonic: "arm5e.skill.general.organizationLore",
    option: true,
    category: "general",
    optionPlaceholder: "arm5e.skill.options.organization",
    optionDefault: "org-name"
  },
  profession: {
    mnemonic: "arm5e.skill.general.profession",
    option: true,
    category: "general",
    optionPlaceholder: "arm5e.skill.options.profession",
    optionDefault: "profession-name"
  },
  ride: { mnemonic: "arm5e.skill.general.ride", option: false, category: "general" },
  stealth: {
    mnemonic: "arm5e.skill.general.stealth",
    option: false,
    category: "general"
  },
  survival: {
    mnemonic: "arm5e.skill.general.survival",
    option: false,
    category: "general"
  },
  swim: { mnemonic: "arm5e.skill.general.swim", option: false, category: "general" },
  teaching: {
    mnemonic: "arm5e.skill.general.teaching",
    option: false,
    category: "general"
  }
};

ARM5E.ACADEMIC_ABILITIES = {
  artesLib: {
    mnemonic: "arm5e.skill.academic.artesLib",
    option: false,
    category: "academic"
  },
  law: {
    mnemonic: "arm5e.skill.academic.law",
    option: true,
    category: "academic",

    optionPlaceholder: "arm5e.skill.options.law",
    optionDefault: "legalForum"
  },
  deadLanguage: {
    mnemonic: "arm5e.skill.academic.deadLanguage",
    option: true,
    category: "academic",

    optionPlaceholder: "arm5e.skill.options.language",
    optionDefault: "language-name"
  },
  medicine: {
    mnemonic: "arm5e.skill.academic.medicine",
    option: false,
    category: "academic"
  },
  philosophy: {
    mnemonic: "arm5e.skill.academic.philosophy",
    option: false,
    category: "academic"
  },
  theology: {
    mnemonic: "arm5e.skill.academic.theology",
    option: true,
    category: "academic",
    optionPlaceholder: "arm5e.skill.options.theology",
    optionDefault: "religion"
  },
  academicAbility: {
    mnemonic: "arm5e.skill.academic.generic",
    option: true,
    category: "academic",

    optionPlaceholder: "arm5e.skill.options.academic",
    optionDefault: "topic-name"
  }
};

ARM5E.ARCANE_ABILITIES = {
  hermeticCode: {
    mnemonic: "arm5e.skill.arcane.hermeticCode",
    option: false,
    category: "arcane"
  },
  dominionLore: {
    mnemonic: "arm5e.skill.arcane.dominionLore",
    option: false,
    category: "arcane"
  },
  faerieLore: {
    mnemonic: "arm5e.skill.arcane.faerieLore",
    option: false,
    category: "arcane"
  },
  finesse: {
    mnemonic: "arm5e.skill.arcane.finesse",
    option: false,
    category: "arcane"
  },
  infernalLore: {
    mnemonic: "arm5e.skill.arcane.infernalLore",
    option: false,
    category: "arcane"
  },
  magicLore: {
    mnemonic: "arm5e.skill.arcane.magicLore",
    option: false,
    category: "arcane"
  },
  magicTheory: {
    mnemonic: "arm5e.skill.arcane.magicTheory",
    option: false,
    category: "arcane"
  },
  parma: { mnemonic: "arm5e.skill.arcane.parma", option: false, category: "arcane" },
  penetration: {
    mnemonic: "arm5e.skill.arcane.penetration",
    option: false,
    category: "arcane"
  },
  arcaneAbility: {
    mnemonic: "arm5e.skill.arcane.generic",
    option: true,
    category: "arcane",
    optionPlaceholder: "arm5e.skill.options.arcane",
    optionDefault: "arcane-name"
  }
};

ARM5E.MARTIAL_ABILITIES = {
  bows: { mnemonic: "arm5e.skill.martial.bows", option: false, category: "martial" },
  singleWeapon: {
    mnemonic: "arm5e.skill.martial.singleWeapon",
    option: false,
    category: "martial"
  },
  greatWeapon: {
    mnemonic: "arm5e.skill.martial.greatWeapon",
    option: false,
    category: "martial"
  },
  trownWeapon: {
    // I know, typo, thrown weapon
    mnemonic: "arm5e.skill.martial.trownWeapon",
    option: false,
    category: "martial"
  },
  martialAbility: {
    mnemonic: "arm5e.skill.martial.generic",
    option: true,
    category: "martial",
    optionPlaceholder: "arm5e.skill.options.martial",
    optionDefault: "weapon-type"
  }
};

ARM5E.SUPERNATURAL_ABILITIES = {
  animalKen: {
    mnemonic: "arm5e.skill.supernatural.animalKen",
    option: false,
    category: "supernaturalCat"
  },
  dowsing: {
    mnemonic: "arm5e.skill.supernatural.dowsing",
    option: false,
    category: "supernaturalCat"
  },
  enchantingMusic: {
    mnemonic: "arm5e.skill.supernatural.enchantingMusic", // enchanting ability now
    option: false,
    category: "supernaturalCat"
  },
  entrancement: {
    mnemonic: "arm5e.skill.supernatural.entrancement",
    option: false,
    category: "supernaturalCat"
  },
  magicSensitivity: {
    mnemonic: "arm5e.skill.supernatural.magicSensitivity",
    option: false,
    category: "supernaturalCat"
  },
  premonitions: {
    mnemonic: "arm5e.skill.supernatural.premonitions",
    option: false,
    category: "supernaturalCat"
  },
  secondSight: {
    mnemonic: "arm5e.skill.supernatural.secondSight",
    option: false,
    category: "supernaturalCat"
  },
  senseHolyAndUnholy: {
    mnemonic: "arm5e.skill.supernatural.senseHolyAndUnholy",
    option: false,
    category: "supernaturalCat"
  },
  shapeshifter: {
    mnemonic: "arm5e.skill.supernatural.shapeshifter",
    option: false,
    category: "supernaturalCat"
  },
  supernatural: {
    mnemonic: "arm5e.skill.supernatural.generic",
    option: true,
    category: "supernaturalCat",
    optionPlaceholder: "arm5e.skill.options.supernatural",
    optionDefault: "power-name"
  },
  wildernessSense: {
    mnemonic: "arm5e.skill.supernatural.wildernessSense",
    option: false,
    category: "supernaturalCat"
  }
};
ARM5E.MYSTERY_ABILITIES = {
  enigma: {
    mnemonic: "arm5e.skill.mystery.enigma",
    option: false,
    category: "mystery"
  },
  faerieMagic: {
    mnemonic: "arm5e.skill.mystery.faerieMagic",
    option: false,
    category: "mystery"
  },
  heartbeast: {
    mnemonic: "arm5e.skill.mystery.heartbeast",
    option: false,
    category: "mystery"
  },
  verditiusMagic: {
    mnemonic: "arm5e.skill.mystery.verditiusMagic",
    option: false,
    category: "mystery"
  },
  cult: {
    mnemonic: "arm5e.skill.mystery.cult",
    option: true,
    category: "mystery",
    optionPlaceholder: "arm5e.skill.options.mysteryCult",
    optionDefault: "cult-name"
  }
};

ARM5E.ALT_TECHNIQUE_ABILITIES = {
  technique: {
    mnemonic: "arm5e.skill.technique.generic",
    option: true,
    category: "altTechnique",
    optionPlaceholder: "arm5e.skill.options.technique",
    optionDefault: "altTech"
  }
};

ARM5E.ALT_FORM_ABILITIES = {
  form: {
    mnemonic: "arm5e.skill.form.generic",
    option: true,
    category: "altForm",
    optionPlaceholder: "arm5e.skill.options.form",
    optionDefault: "altForm"
  }
};

ARM5E.ALL_ABILITIES = {
  general: {
    mnemonic: ARM5E.ABILITIES_CATEGORIES.general.mnemonic,
    option: false,
    disabled: true
  },
  ...ARM5E.GENERAL_ABILITIES,
  academic: {
    mnemonic: ARM5E.ABILITIES_CATEGORIES.academic.mnemonic,
    option: false,
    disabled: true
  },
  ...ARM5E.ACADEMIC_ABILITIES,
  arcane: {
    mnemonic: ARM5E.ABILITIES_CATEGORIES.arcane.mnemonic,
    option: false,
    disabled: true
  },
  ...ARM5E.ARCANE_ABILITIES,
  martial: {
    mnemonic: ARM5E.ABILITIES_CATEGORIES.martial.mnemonic,
    option: false,
    disabled: true
  },
  ...ARM5E.MARTIAL_ABILITIES,
  supernaturalCat: {
    mnemonic: ARM5E.ABILITIES_CATEGORIES.supernaturalCat.mnemonic,
    option: false,
    disabled: true
  },
  ...ARM5E.SUPERNATURAL_ABILITIES,
  mystery: {
    mnemonic: ARM5E.ABILITIES_CATEGORIES.mystery.mnemonic,
    option: false,
    disabled: true
  },
  ...ARM5E.MYSTERY_ABILITIES,
  technique: {
    mnemonic: ARM5E.ABILITIES_CATEGORIES.altTechnique.mnemonic,
    option: false,
    disabled: true
  },
  ...ARM5E.ALT_TECHNIQUE_ABILITIES,
  form: {
    mnemonic: ARM5E.ABILITIES_CATEGORIES.altForm.mnemonic,
    option: false,
    disabled: true
  },
  ...ARM5E.ALT_FORM_ABILITIES
};

export function localizeAbilities() {
  const res = {
    general: {
      extendedKey: "general",
      label: game.i18n.localize(ARM5E.ABILITIES_CATEGORIES.general.mnemonic),
      mnemonic: ARM5E.ABILITIES_CATEGORIES.general.mnemonic,
      option: false,
      disabled: true
    },
    ...translateAndSort(ARM5E.GENERAL_ABILITIES),
    academic: {
      extendedKey: "academic",
      label: game.i18n.localize(ARM5E.ABILITIES_CATEGORIES.academic.mnemonic),
      mnemonic: ARM5E.ABILITIES_CATEGORIES.academic.mnemonic,
      option: false,
      disabled: true
    },
    ...translateAndSort(ARM5E.ACADEMIC_ABILITIES),
    arcane: {
      extendedKey: "arcane",
      label: game.i18n.localize(ARM5E.ABILITIES_CATEGORIES.arcane.mnemonic),
      mnemonic: ARM5E.ABILITIES_CATEGORIES.arcane.mnemonic,
      option: false,
      disabled: true
    },
    ...translateAndSort(ARM5E.ARCANE_ABILITIES),
    martial: {
      extendedKey: "martial",
      label: game.i18n.localize(ARM5E.ABILITIES_CATEGORIES.martial.mnemonic),
      mnemonic: ARM5E.ABILITIES_CATEGORIES.martial.mnemonic,
      option: false,
      disabled: true
    },
    ...translateAndSort(ARM5E.MARTIAL_ABILITIES),
    supernaturalCat: {
      extendedKey: "supernaturalCat",
      label: game.i18n.localize(ARM5E.ABILITIES_CATEGORIES.supernaturalCat.mnemonic),
      mnemonic: ARM5E.ABILITIES_CATEGORIES.supernaturalCat.mnemonic,
      option: false,
      disabled: true
    },
    ...translateAndSort(ARM5E.SUPERNATURAL_ABILITIES),
    mystery: {
      extendedKey: "mystery",
      label: game.i18n.localize(ARM5E.ABILITIES_CATEGORIES.mystery.mnemonic),
      mnemonic: ARM5E.ABILITIES_CATEGORIES.mystery.mnemonic,
      option: false,
      disabled: true
    },
    ...translateAndSort(ARM5E.MYSTERY_ABILITIES),
    altTechnique: {
      extendedKey: "altTechnique",
      label: game.i18n.localize(ARM5E.ABILITIES_CATEGORIES.altTechnique.mnemonic),
      mnemonic: ARM5E.ABILITIES_CATEGORIES.altTechnique.mnemonic,
      option: false,
      disabled: true
    },
    ...translateAndSort(ARM5E.ALT_TECHNIQUE_ABILITIES),
    altForm: {
      extendedKey: "altForm",
      label: game.i18n.localize(ARM5E.ABILITIES_CATEGORIES.altForm.mnemonic),
      mnemonic: ARM5E.ABILITIES_CATEGORIES.altForm.mnemonic,
      option: false,
      disabled: true
    },
    ...translateAndSort(ARM5E.ALT_FORM_ABILITIES)
  };
  return res;
}

/**
 * Enrich the translated abilities for the diary entries
 * @param {any} translatedList
 * @returns {any}
 */
export function enrichAbilities(translatedList) {
  let res = Object.entries(translatedList).filter((e) => !e[1].disabled);
  let id = 0;
  res = res.map(([key, val]) => {
    return {
      _id: String(id++),
      secondaryId: true,
      name: val.label,
      system: {
        key: key,
        xp: 0,
        score: 0,
        option: val.option ? val.optionDefault : "",
        category: val.category
      }
    };
  }, id);
  return res;
}

function translateAndSort(abilityList) {
  for (let [key, value] of Object.entries(abilityList)) {
    let translation;
    if (value.option) {
      abilityList[key].extendedKey = `${key}_${value.optionDefault}`;
      translation = game.i18n.format(value.mnemonic, {
        option: game.i18n.localize(value.optionPlaceholder)
      });
    } else {
      abilityList[key].extendedKey = key;
      translation = game.i18n.localize(value.mnemonic);
    }
    abilityList[key].label = translation;
  }
  let tmp = Object.entries(abilityList).sort((a, b) => {
    return a[1].label.localeCompare(b[1].label);
  });
  return Object.fromEntries(tmp);
}
export function localizeCategories() {
  let result = {};
  for (let [key, value] of Object.entries(ARM5E.ABILITIES_CATEGORIES)) {
    result[key] = { mnemonic: value.mnemonic, label: game.i18n.localize(value.mnemonic) };
  }
  return result;
}
ARM5E.character.combat = {};

ARM5E.npc = {};
ARM5E.npc.types = {
  magusNPC: {
    label: "arm5e.sheet.magus",
    dtype: "String"
  },
  mundane: {
    label: "arm5e.sheet.mundane",
    dtype: "String"
  },
  entity: {
    label: "arm5e.sheet.entity",
    dtype: "String"
  }
};

ARM5E.familiar = {};
ARM5E.familiar.labels = {
  size: {
    label: "arm5e.sheet.size"
  },
  might: {
    label: "arm5e.sheet.might"
  },
  soak: {
    label: "arm5e.sheet.soak"
  },
  fatigue: {
    label: "arm5e.sheet.fatigue.label"
  },
  initiative: {
    label: "arm5e.sheet.initiative"
  },
  attack: {
    label: "arm5e.sheet.attack"
  },
  defense: {
    label: "arm5e.sheet.defense"
  },
  damage: {
    label: "arm5e.damage.label"
  }
};

ARM5E.covenant = {};
ARM5E.covenant.labels = {
  library: {
    label: "arm5e.sheet.library"
  },
  laboratoryTexts: {
    label: "arm5e.sheet.laboratoryTexts"
  },
  vis: {
    label: "arm5e.sheet.vis"
  },
  magicItems: {
    label: "arm5e.sheet.magicItems"
  },
  specialists: {
    label: "arm5e.sheet.specialists"
  },
  laboratories: {
    label: "arm5e.sheet.laboratories"
  },
  money: {
    label: "arm5e.sheet.money"
  }
};
ARM5E.covenant.inhabitants = {
  magi: {
    label: "arm5e.sheet.maguss",
    points: 5,
    advancedPts: 10
  },
  companions: { label: "arm5e.sheet.companion", points: 3, advancedPts: 5 },
  turbula: { label: "arm5e.sheet.turbula", points: 1, advancedPts: 2 },
  craftsmen: { label: "arm5e.sheet.craftsmen", points: 2, advancedPts: 3 },
  specialists: { label: "arm5e.sheet.specialists", points: 2, advancedPts: 3 },
  dependants: { label: "arm5e.sheet.dependants", points: 1, advancedPts: 2 },
  laborers: { label: "arm5e.sheet.laborers", points: 1, advancedPts: 2 },
  servants: { label: "arm5e.sheet.servants", points: 1, advancedPts: 2 },
  teamsters: { label: "arm5e.sheet.teamsters", points: 1, advancedPts: 2 },
  horses: { label: "arm5e.sheet.horses", points: 1, advancedPts: 1 },
  livestock: { label: "arm5e.sheet.livestock", points: 0, advancedPts: 0 }
};
ARM5E.covenant.vis = {
  stockCost: 0.2,
  sourceCost: 5
};

ARM5E.covenant.enchantments = {
  slice: 5,
  points: 2
};
ARM5E.covenant.fieldOfWork = {
  none: "arm5e.generic.none",
  buildings: "arm5e.sheet.buildings",
  consumables: "arm5e.sheet.consumables",
  laboratories: "arm5e.sheet.laboratories",
  provisions: "arm5e.sheet.provisions",
  weapons: "arm5e.sheet.weapons",
  writingMaterials: "arm5e.sheet.writingMaterials"
};

ARM5E.covenant.yearlyExpenses = {
  buildings: {
    sumary: "arm5e.sheet.buildingsSumary",
    label: "arm5e.sheet.buildings",
    maxSaving: 0.5
  },
  consumables: {
    sumary: "arm5e.sheet.consumablesSumary",
    label: "arm5e.sheet.consumables",
    maxSaving: 0.2
  },
  inflation: {
    sumary: "arm5e.sheet.inflationSumary",
    label: "arm5e.sheet.inflation",
    maxSaving: 0
  },
  laboratories: {
    sumary: "arm5e.sheet.laboratoriesSumary",
    label: "arm5e.sheet.laboratories",
    maxSaving: 0.2
  },
  provisions: {
    sumary: "arm5e.sheet.provisionsSumary",
    label: "arm5e.sheet.provisions",
    maxSaving: 0.2
  },
  tithes: {
    sumary: "arm5e.sheet.tithesSumary",
    label: "arm5e.sheet.tithes",
    maxSaving: 0
  },
  wages: {
    sumary: "arm5e.sheet.wagesSumary",
    label: "arm5e.sheet.wages",
    maxSaving: 0
  },
  weapons: {
    sumary: "arm5e.sheet.weaponsSumary",
    label: "arm5e.sheet.weapons",
    maxSaving: 0.5
  },
  writingMaterials: {
    sumary: "arm5e.sheet.writingMaterialsSumary",
    label: "arm5e.sheet.writingMaterials",
    maxSaving: 0.5
  },
  sundry: {
    sumary: "arm5e.sheet.sundrySumary",
    label: "arm5e.sheet.sundry",
    maxSaving: 0
  }
};

ARM5E.covenant.yearlySavings = {
  laborers: {
    sumary: "arm5e.sheet.laborersSumary",
    label: "arm5e.sheet.laborers"
  },
  craftsmen: {
    sumary: "arm5e.sheet.craftsmenSumary",
    label: "arm5e.sheet.craftsmen"
  },
  specialists: {
    sumary: "arm5e.sheet.specialistsSumary",
    label: "arm5e.sheet.specialists"
  },
  magicItems: {
    sumary: "arm5e.sheet.magicItemsSumary",
    label: "arm5e.sheet.magicItems"
  }
};

ARM5E.covenant.gift = {
  normal: { label: "arm5e.sheet.gift.normal", loyalty: -30 },
  blatant: { label: "arm5e.sheet.gift.blatant", loyalty: -105 },
  gentle: { label: "arm5e.sheet.gift.gentle", loyalty: 0 }
};

ARM5E.covenant.specialists = {
  teacher: { label: "arm5e.covenant.specialist.teacher" },
  steward: { label: "arm5e.covenant.specialist.steward" },
  chamberlain: { label: "arm5e.covenant.specialist.chamberlain" },
  turbCaptain: { label: "arm5e.covenant.specialist.turbCaptain" },
  books: { label: "arm5e.covenant.specialist.books" },
  other: { label: "arm5e.covenant.specialist.other" }
};

ARM5E.covenant.loyalty = {
  wages: {
    none: { factor: 0, label: "arm5e.covenant.wages.none", mod: -20 },
    low: { factor: 0.5, label: "arm5e.covenant.wages.low", mod: -10 },
    normal: { factor: 1, label: "arm5e.covenant.wages.normal", mod: 0 },
    generous: { factor: 1.5, label: "arm5e.covenant.wages.generous", mod: 10 },
    lavish: { factor: 2, label: "arm5e.covenant.wages.lavish", mod: 20 }
  },
  pension: { label: "arm5e.covenant.wages.pension", mod: 10 },
  livingConditions: {
    factor: 10
  },
  equipment: {
    inexpensive: { label: "arm5e.covenant.equipment.low", mod: -10 },
    standard: { label: "arm5e.covenant.equipment.standard", mod: 0 },
    standardPlus: { label: "arm5e.covenant.equipment.standardPlus", mod: 10 },
    any: { label: "arm5e.covenant.equipment.any", mod: 20 }
  }
};

ARM5E.REALM_TYPES = {
  MUNDANE: 0,
  MAGIC: 1,
  FAERIC: 2,
  DIVINE: 3,
  INFERNAL: 4
};
// influence is the impact the aura has on powers of mundane (ie: none), magic, faery, divine and infernal respectively
ARM5E.realms = {
  magic: {
    label: "arm5e.realm.magic",
    index: ARM5E.REALM_TYPES.MAGIC,
    influence: [0, 1, 0.5, 0, -1]
  },
  faeric: {
    label: "arm5e.realm.faeric",
    index: ARM5E.REALM_TYPES.FAERIC,
    influence: [0, 0.5, 1, 0, -1]
  },
  divine: {
    label: "arm5e.realm.divine",
    index: ARM5E.REALM_TYPES.DIVINE,
    influence: [0, -3, -4, 1, -5]
  },
  infernal: {
    label: "arm5e.realm.infernal",
    index: ARM5E.REALM_TYPES.INFERNAL,
    influence: [0, -1, -2, 0, 1]
  }
};

ARM5E.lookupRealm = ["mundane", "magic", "faeric", "divine", "infernal"];

ARM5E.realmsExt = {
  mundane: {
    label: "arm5e.realm.mundane",
    index: 0,
    influence: [0, 0, 0, 0, 0]
  },
  ...ARM5E.realms
};
1;

ARM5E.impacts = {
  free: {
    label: "arm5e.sheet.free",
    dtype: "String",
    cost: 0
  },
  major: {
    label: "arm5e.sheet.major",
    dtype: "String",
    cost: 3
  },
  minor: {
    label: "arm5e.sheet.minor",
    dtype: "String",
    cost: 1
  },
  Special: {
    label: "arm5e.generic.special",
    dtype: "String",
    cost: 0
  }
};

ARM5E.seasonsLabels = {
  standard: {
    spring: {
      label: "arm5e.sheet.spring"
    },
    summer: {
      label: "arm5e.sheet.summer"
    },
    autumn: {
      label: "arm5e.sheet.autumn"
    },
    winter: {
      label: "arm5e.sheet.winter"
    }
  },
  winterFirst: {
    winter: {
      label: "arm5e.sheet.winter"
    },
    spring: {
      label: "arm5e.sheet.spring"
    },
    summer: {
      label: "arm5e.sheet.summer"
    },
    autumn: {
      label: "arm5e.sheet.autumn"
    }
  }
};

ARM5E.magic = {};
ARM5E.magic.mod = {
  voice: {
    loud: { value: 1, mnemonic: "arm5e.sheet.magic.voiceType.loud" },
    firm: { value: 0, mnemonic: "arm5e.sheet.magic.voiceType.firm" },
    quiet: { value: -5, mnemonic: "arm5e.sheet.magic.voiceType.quiet" },
    silent: { value: -10, mnemonic: "arm5e.sheet.magic.voiceType.silent" }
  },
  gestures: {
    exaggerated: { value: 1, mnemonic: "arm5e.sheet.magic.gesturesType.exaggerated" },
    bold: { value: 0, mnemonic: "arm5e.sheet.magic.gesturesType.bold" },
    subtle: { value: -2, mnemonic: "arm5e.sheet.magic.gesturesType.subtle" },
    motionless: { value: -5, mnemonic: "arm5e.sheet.magic.gesturesType.motionless" }
  }
};

ARM5E.magic.techniques = {
  cr: {
    label: "Creo",
    short: "Cr"
  },
  in: {
    label: "Intellego",
    short: "In"
  },
  mu: {
    label: "Muto",
    short: "Mu"
  },
  pe: {
    label: "Perdo",
    short: "Pe"
  },
  re: {
    label: "Rego",
    short: "Re"
  }
};

ARM5E.magic.forms = {
  an: {
    label: "Animal",
    short: "An",
    baseSize: "arm5e.spell.targets.baseSize.an"
  },
  aq: {
    label: "Aquam",
    short: "Aq",
    baseSize: "arm5e.spell.targets.baseSize.aq"
  },
  au: {
    label: "Auram",
    short: "Au",
    baseSize: "arm5e.spell.targets.baseSize.au"
  },
  co: {
    label: "Corpus",
    short: "Co",
    baseSize: "arm5e.spell.targets.baseSize.co"
  },
  he: {
    label: "Herbam",
    short: "He",
    baseSize: "arm5e.spell.targets.baseSize.he"
  },
  ig: {
    label: "Ignem",
    short: "Ig",
    baseSize: "arm5e.spell.targets.baseSize.ig"
  },
  im: {
    label: "Imaginem",
    short: "Im",
    baseSize: "arm5e.spell.targets.baseSize.im"
  },
  me: {
    label: "Mentem",
    short: "Me",
    baseSize: "arm5e.spell.targets.baseSize.me"
  },
  te: {
    label: "Terram",
    short: "Te",
    baseSize: "arm5e.spell.targets.baseSize.te"
  },
  vi: {
    label: "Vim",
    short: "Vi",
    baseSize: "arm5e.spell.targets.baseSize.vi"
  }
};
ARM5E.magic.arts = {
  ...ARM5E.magic.techniques,
  ...ARM5E.magic.forms
};

ARM5E.magic.shorts = {
  duration: "arm5e.spell.duration.short",
  target: "arm5e.spell.target.short",
  range: "arm5e.spell.range.short"
};
ARM5E.magic.durations = {
  ArM5: {
    label: "arm5e.sheet.source.ArM5",
    source: "ArM5",
    disabled: true
  },
  moment: {
    label: "arm5e.spell.durations.moment",
    dtype: "String",
    source: "ArM5",
    impact: 0
  },
  conc: {
    label: "arm5e.spell.durations.conc",
    dtype: "String",
    source: "ArM5",
    impact: 1
  },
  diam: {
    label: "arm5e.spell.durations.diam",
    dtype: "String",
    source: "ArM5",
    impact: 1
  },
  sun: {
    label: "arm5e.spell.durations.sun",
    dtype: "String",
    source: "ArM5",
    impact: 2
  },
  ring: {
    label: "arm5e.spell.durations.ring",
    dtype: "String",
    source: "ArM5",
    impact: 2
  },
  moon: {
    label: "arm5e.spell.durations.moon",
    dtype: "String",
    source: "ArM5",
    impact: 3
  },
  year: {
    label: "arm5e.spell.durations.year",
    dtype: "String",
    source: "ArM5",
    impact: 4
  },
  special: {
    label: "arm5e.spell.special",
    dtype: "String",
    source: "ArM5",
    impact: 0
  },
  faeMagic: {
    label: "arm5e.skill.mystery.faerieMagic",
    source: "ArM5",
    disabled: true
  },
  fire: {
    label: "arm5e.spell.durations.fire",
    dtype: "String",
    source: "ArM5",
    impact: 3
  },
  bargain: {
    label: "arm5e.spell.durations.bargain",
    dtype: "String",
    source: "ArM5",
    impact: 3
  },
  condition: {
    label: "arm5e.spell.durations.condition",
    dtype: "String",
    impact: 4
  },
  "year+1": {
    label: "arm5e.spell.durations.year+1",
    dtype: "String",
    source: "ArM5",
    impact: 4
  },
  "HoH:MC": {
    label: "arm5e.sheet.source.HoH:MC",
    source: "HoH:MC",
    disabled: true
  },
  held: {
    label: "arm5e.spell.durations.held",
    dtype: "String",
    source: "HoH:MC",
    impact: 1
  },
  while: {
    label: "arm5e.spell.durations.while",
    dtype: "String",
    source: "HoH:MC",
    impact: 1
  },
  mm: {
    label: "arm5e.spell.durations.mm",
    dtype: "String",
    source: "HoH:MC",
    impact: 2
  },
  not: {
    label: "arm5e.spell.durations.not",
    dtype: "String",
    source: "HoH:MC",
    impact: 2
  },
  symbol: {
    label: "arm5e.spell.durations.symbol",
    dtype: "String",
    source: "HoH:MC",
    impact: 4
  },
  hidden: {
    label: "arm5e.spell.durations.hidden",
    dtype: "String",
    source: "HoH:MC",
    impact: 4
  },
  aura: {
    label: "arm5e.spell.durations.aura",
    dtype: "String",
    source: "HoH:MC",
    impact: 4
  },
  "RoP:D": {
    label: "arm5e.sheet.source.RoP:D",
    source: "RoP:D",
    disabled: true
  },
  recitation: {
    label: "arm5e.spell.durations.recitation",
    dtype: "String",
    source: "RoP:D",
    impact: 1
  },
  office: {
    label: "arm5e.spell.durations.office",
    dtype: "String",
    source: "RoP:D",
    impact: 1
  },
  devotion: {
    label: "arm5e.spell.durations.devotion",
    dtype: "String",
    source: "RoP:D",
    impact: 2
  },
  sabbath: {
    label: "arm5e.spell.durations.sabbath",
    dtype: "String",
    source: "RoP:D",
    impact: 2
  },
  holy40: {
    label: "arm5e.spell.durations.40",
    dtype: "String",
    source: "RoP:D",
    impact: 3
  },
  fast: {
    label: "arm5e.spell.durations.fast",
    dtype: "String",
    source: "RoP:D",
    impact: 3
  },
  grace: {
    label: "arm5e.spell.durations.grace",
    dtype: "String",
    source: "RoP:D",
    impact: 4
  },
  "RoP:F": {
    label: "arm5e.sheet.source.RoP:F",
    source: "RoP:F",
    disabled: true
  },
  if: {
    label: "arm5e.spell.durations.if",
    dtype: "String",
    source: "RoP:F",
    impact: 0
  },

  focus: {
    label: "arm5e.spell.durations.focus",
    dtype: "String",
    source: "RoP:F",
    impact: 1
  },
  geas: {
    label: "arm5e.spell.durations.geas",
    dtype: "String",
    source: "RoP:F",
    impact: 2
  },
  "hour+1": {
    label: "arm5e.spell.durations.hour+1",
    dtype: "String",
    source: "RoP:F",
    impact: 2
  },
  faerie: {
    label: "arm5e.spell.durations.faerie",
    dtype: "String",
    source: "RoP:F",
    impact: 4
  },
  "RoP:I": {
    label: "arm5e.sheet.source.RoP:I",
    source: "RoP:I",
    disabled: true
  },
  cursed: {
    label: "arm5e.spell.durations.cursed",
    dtype: "String",
    source: "RoP:I",
    impact: 2
  },
  forsaken: {
    label: "arm5e.spell.durations.forsaken",
    dtype: "String",
    source: "RoP:I",
    impact: 4
  },
  "RoP:M": {
    label: "arm5e.sheet.source.RoP:M",
    source: "RoP:M",
    disabled: true
  },
  storm: {
    label: "arm5e.spell.durations.storm",
    dtype: "String",
    source: "RoP:M",
    impact: 1
  },

  TMRE: {
    label: "arm5e.sheet.source.TMRE",
    source: "TMRE",
    disabled: true
  },
  perf: {
    label: "arm5e.spell.durations.perf",
    dtype: "String",
    source: "TMRE",
    impact: 1
  },
  dream: {
    label: "arm5e.spell.durations.dream",
    dtype: "String",
    source: "TMRE",
    impact: 1
  },
  minutes: {
    label: "arm5e.spell.durations.minutes",
    dtype: "String",
    source: "TMRE",
    impact: 1
  },
  hours: {
    label: "arm5e.spell.durations.hours",
    dtype: "String",
    source: "TMRE",
    impact: 2
  },
  arcr: {
    label: "arm5e.spell.durations.arcr",
    dtype: "String",
    source: "TMRE",
    impact: 3
  },
  days: {
    label: "arm5e.spell.durations.days",
    dtype: "String",
    source: "TMRE",
    impact: 3
  },
  sign: {
    label: "arm5e.spell.durations.sign",
    dtype: "String",
    source: "TMRE",
    impact: 4
  },
  AM: {
    label: "arm5e.sheet.source.AnM",
    source: "AnM",
    disabled: true
  },
  event: {
    label: "arm5e.spell.durations.event",
    dtype: "String",
    source: "AnM",
    impact: 0
  },
  rune: {
    label: "arm5e.spell.durations.rune",
    dtype: "String",
    source: "AnM",
    impact: 3
  },
  "19year": {
    label: "arm5e.spell.durations.19year",
    dtype: "String",
    source: "AnM",
    impact: 5
  },

  custom: {
    label: "arm5e.sheet.source.custom",
    value: true,
    edit: "disabled"
  },
  other: {
    label: "arm5e.sheet.other",
    dtype: "String",
    impact: 0
  },
  season: {
    label: "arm5e.spell.durations.season",
    dtype: "String",
    impact: 2
  }
};

ARM5E.magic.ranges = {
  ArM5: {
    label: "arm5e.sheet.source.ArM5",
    source: "ArM5",
    disabled: true
  },
  personal: {
    label: "arm5e.spell.ranges.personal",
    dtype: "String",
    source: "ArM5",
    impact: 0
  },
  touch: {
    label: "arm5e.spell.ranges.touch",
    dtype: "String",
    source: "ArM5",
    impact: 1
  },
  eye: {
    label: "arm5e.spell.ranges.eye",
    dtype: "String",
    source: "ArM5",
    impact: 1
  },
  voice: {
    label: "arm5e.spell.ranges.voice",
    dtype: "String",
    source: "ArM5",
    impact: 2
  },
  sight: {
    label: "arm5e.spell.ranges.sight",
    dtype: "String",
    source: "ArM5",
    impact: 3
  },
  arc: {
    label: "arm5e.spell.ranges.arc",
    dtype: "String",
    source: "ArM5",
    impact: 4
  },
  special: {
    label: "arm5e.spell.special",
    dtype: "String",
    source: "ArM5",
    impact: 0
  },
  faeMagic: {
    label: "arm5e.skill.mystery.faerieMagic",
    source: "ArM5",
    disabled: true
  },
  road: {
    label: "arm5e.spell.ranges.road",
    dtype: "String",
    source: "ArM5",
    impact: 2
  },
  "HoH:MC": {
    label: "arm5e.sheet.source.HoH:MC",
    source: "HoH:MC",
    disabled: true
  },
  symbol: {
    label: "arm5e.spell.ranges.symbol",
    dtype: "String",
    source: "HoH:MC",
    impact: 4
  },
  "RoP:D": {
    label: "arm5e.sheet.source.RoP:D",
    source: "RoP:D",
    disabled: true
  },
  presence: {
    label: "arm5e.spell.ranges.presence",
    dtype: "String",
    source: "RoP:D",
    impact: 2
  },
  communion: {
    label: "arm5e.spell.ranges.communion",
    dtype: "String",
    source: "RoP:D",
    impact: 4
  },

  prop: {
    label: "arm5e.spell.ranges.prop",
    dtype: "String",
    source: "RoP:F",
    impact: 1
  },
  cross: {
    label: "arm5e.spell.ranges.cross",
    dtype: "String",
    source: "RoP:F",
    impact: 2
  },
  "RoP:I": {
    label: "arm5e.sheet.source.RoP:I",
    source: "RoP:I",
    disabled: true
  },
  ww: {
    label: "arm5e.spell.ranges.ww",
    dtype: "String",
    source: "RoP:M",
    impact: 3
  },
  TMRE: {
    label: "arm5e.sheet.source.TMRE",
    source: "TMRE",
    disabled: true
  },
  line: {
    label: "arm5e.spell.ranges.line",
    dtype: "String",
    source: "TMRE",
    impact: 3
  },
  network: {
    label: "arm5e.spell.ranges.network",
    dtype: "String",
    source: "TMRE",
    impact: 4
  },
  AnM: {
    label: "arm5e.sheet.source.AnM",
    source: "AnM",
    disabled: true
  },
  veil: {
    label: "arm5e.spell.ranges.veil",
    dtype: "String",
    source: "AnM",
    impact: 3
  },
  unlimited: {
    label: "arm5e.spell.ranges.unlimited",
    dtype: "String",
    source: "AnM",
    impact: 6
  },
  custom: {
    label: "arm5e.sheet.source.custom",
    value: true,
    edit: "disabled"
  },
  ground: {
    label: "arm5e.spell.ranges.ground",
    dtype: "String",
    source: "custom",
    impact: 4
  },
  other: {
    label: "arm5e.sheet.other",
    dtype: "String",
    source: "custom",
    impact: 0
  }
};

ARM5E.magic.targets = {
  ArM5: {
    label: "arm5e.sheet.source.ArM5",
    source: "ArM5",
    disabled: true
  },
  ind: {
    label: "arm5e.spell.targets.ind",
    dtype: "String",
    source: "ArM5",
    impact: 0
  },
  circle: {
    label: "arm5e.spell.targets.circle",
    dtype: "String",
    source: "ArM5",
    impact: 0
  },
  part: {
    label: "arm5e.spell.targets.part",
    dtype: "String",
    source: "ArM5",
    impact: 1
  },

  group: {
    label: "arm5e.spell.targets.group",
    dtype: "String",
    source: "ArM5",
    impact: 2
  },
  room: {
    label: "arm5e.spell.targets.room",
    dtype: "String",
    source: "ArM5",
    impact: 2
  },
  struct: {
    label: "arm5e.spell.targets.struct",
    dtype: "String",
    source: "ArM5",
    impact: 3
  },
  bound: {
    label: "arm5e.spell.targets.bound",
    dtype: "String",
    source: "ArM5",
    impact: 4
  },
  special: {
    label: "arm5e.spell.special",
    dtype: "String",
    source: "ArM5",
    impact: 0
  },
  intMagic: {
    label: "arm5e.spell.targets.subcats.intMagic",
    source: "ArM5",
    disabled: true
  },
  taste: {
    label: "arm5e.spell.targets.taste",
    dtype: "String",
    source: "ArM5",
    impact: 0
  },
  touch: {
    label: "arm5e.spell.targets.touch",
    dtype: "String",
    source: "ArM5",
    impact: 1
  },
  smell: {
    label: "arm5e.spell.targets.smell",
    dtype: "String",
    source: "ArM5",
    impact: 2
  },
  hearing: {
    label: "arm5e.spell.targets.hearing",
    dtype: "String",
    source: "ArM5",
    impact: 3
  },
  sight: {
    label: "arm5e.spell.targets.sight",
    dtype: "String",
    source: "ArM5",
    impact: 4
  },
  faeMagic: {
    label: "arm5e.skill.mystery.faerieMagic",
    source: "ArM5",
    disabled: true
  },
  bloodline: {
    label: "arm5e.spell.targets.bloodline",
    dtype: "String",
    source: "ArM5",
    impact: 3
  },
  "HoH:MC": {
    label: "arm5e.sheet.source.HoH:MC",
    source: "HoH:MC",
    disabled: true
  },
  flavor: {
    label: "arm5e.spell.targets.flavor",
    dtype: "String",
    source: "HoH:MC",
    impact: 0
  },
  texture: {
    label: "arm5e.spell.targets.texture",
    dtype: "String",
    source: "HoH:MC",
    impact: 1
  },
  scent: {
    label: "arm5e.spell.targets.scent",
    dtype: "String",
    source: "HoH:MC",
    impact: 2
  },
  sound: {
    label: "arm5e.spell.targets.sound",
    dtype: "String",
    source: "HoH:MC",
    impact: 3
  },
  spectacle: {
    label: "arm5e.spell.targets.spectacle",
    dtype: "String",
    source: "HoH:MC",
    impact: 4
  },
  symbol: {
    label: "arm5e.spell.targets.symbol",
    dtype: "String",
    source: "HoH:MC",
    impact: 4
  },
  "RoP:D": {
    label: "arm5e.sheet.source.RoP:D",
    source: "RoP:D",
    disabled: true
  },
  sin: {
    label: "arm5e.spell.targets.sin",
    dtype: "String",
    source: "RoP:D",
    impact: 0
  },
  faith: {
    label: "arm5e.spell.targets.faith",
    dtype: "String",
    source: "RoP:D",
    impact: 2
  },
  dominion: {
    label: "arm5e.spell.targets.dominion",
    dtype: "String",
    source: "RoP:D",
    impact: 4
  },
  community: {
    label: "arm5e.spell.targets.community",
    dtype: "String",
    source: "??",
    impact: 4
  },
  "RoP:F": {
    label: "arm5e.sheet.source.RoP:F",
    source: "RoP:F",
    disabled: true
  },
  medium: {
    label: "arm5e.spell.targets.medium",
    dtype: "String",
    source: "RoP:F",
    impact: 1
  },
  "RoP:I": {
    label: "arm5e.sheet.source.RoP:I",
    source: "RoP:I",
    disabled: true
  },
  passion: {
    label: "arm5e.spell.targets.passion",
    dtype: "String",
    source: "RoP:I",
    impact: 2
  },
  "RoP:M": {
    label: "arm5e.sheet.source.RoP:M",
    source: "RoP:M",
    disabled: true
  },
  bw: {
    label: "arm5e.spell.targets.bw",
    dtype: "String",
    source: "RoP:M",
    impact: 3
  },
  TMRE: {
    label: "arm5e.sheet.source.TMRE",
    source: "TMRE",
    disabled: true
  },
  dream: {
    label: "arm5e.spell.targets.dream",
    dtype: "String",
    source: "TMRE",
    impact: 0
  },
  carc: {
    label: "arm5e.spell.targets.carc",
    dtype: "String",
    source: "TMRE",
    impact: 1
  },
  road: {
    label: "arm5e.spell.targets.road",
    dtype: "String",
    source: "TMRE",
    impact: 2
  },
  network: {
    label: "arm5e.spell.targets.network",
    dtype: "String",
    source: "TMRE",
    impact: 4
  },
  AnM: {
    label: "arm5e.sheet.source.AnM",
    source: "AnM",
    disabled: true
  },
  unborn: {
    label: "arm5e.spell.targets.unborn",
    dtype: "String",
    source: "AnM",
    impact: 0
  },

  inscription: {
    label: "arm5e.spell.targets.inscription",
    dtype: "String",
    source: "AnM",
    impact: 0
  },
  custom: {
    label: "arm5e.sheet.source.custom",
    value: true,
    edit: "disabled"
  },
  other: {
    label: "arm5e.sheet.other",
    dtype: "String",
    source: "custom",
    impact: 0
  }
};

ARM5E.magic.penetration = {
  arcaneCon: {
    none: { label: "arm5e.generic.none", bonus: 0 },
    days: { label: "arm5e.magic.arcaneConnection.days", bonus: 1 },
    months: { label: "arm5e.magic.arcaneConnection.months", bonus: 2 },
    decades: { label: "arm5e.magic.arcaneConnection.decades", bonus: 3 },
    indef: { label: "arm5e.magic.arcaneConnection.indefinitly", bonus: 4 }
  },
  sympathy: {
    none: { label: "arm5e.generic.none", bonus: 0 },
    low: { label: "arm5e.magic.sympathy.weak", bonus: 1 },
    high: { label: "arm5e.magic.sympathy.strong", bonus: 2 },
    high2: { label: "arm5e.magic.sympathy.strong1", bonus: 3 },
    high3: { label: "arm5e.magic.sympathy.strong2", bonus: 4 },
    high4: { label: "arm5e.magic.sympathy.strong3", bonus: 5 },
    high5: { label: "arm5e.magic.sympathy.strong4", bonus: 6 },
    high6: { label: "arm5e.magic.sympathy.strong5", bonus: 7 },
    high7: { label: "arm5e.magic.sympathy.strong6", bonus: 8 },
    high8: { label: "arm5e.magic.sympathy.strong8", bonus: 9 },
    high9: { label: "arm5e.magic.sympathy.strong9", bonus: 10 },
    high10: { label: "arm5e.magic.sympathy.strong10", bonus: 11 },
    high11: { label: "arm5e.magic.sympathy.strong11", bonus: 12 },
    high12: { label: "arm5e.magic.sympathy.strong12", bonus: 13 },
    high13: { label: "arm5e.magic.sympathy.strong13", bonus: 14 }
  }
};

ARM5E.magic.stances = {
  gestures: {
    exaggerated: 1,
    bold: 0,
    subtle: -2,
    motionless: -5
  },
  voice: {
    loud: 1,
    firm: 0,
    quiet: -5,
    silent: -10
  }
};
ARM5E.item = {};

ARM5E.item.costs = {
  "n-a": {
    label: "arm5e.sheet.n-a"
  },
  none: {
    label: "arm5e.sheet.none"
  },
  inexp: {
    label: "arm5e.sheet.inexpensive"
  },
  std: {
    label: "arm5e.sheet.standard"
  },
  exp: {
    label: "arm5e.sheet.expensive"
  },
  priceless: {
    label: "arm5e.sheet.priceless"
  }
};

ARM5E.item.resources = ["vis"];

ARM5E.activities = {};

ARM5E.activities.generic = {
  none: {
    label: "arm5e.activity.diary",
    display: { tab: false, progress: false },
    source: { default: 0, readonly: true },
    maxXp: 0,
    bonusOptions: null,
    validation: null,
    secondaryFilter: null,
    scheduling: {
      duplicate: true,
      conflict: false,
      partial: false
    }
  },
  resource: {
    label: "arm5e.activity.resource",
    display: { tab: false, progress: false, attribute: "hidden" },
    source: { default: 0, readonly: true },
    maxXp: 0,
    bonusOptions: null,
    validation: null,
    secondaryFilter: null,
    scheduling: {
      duplicate: true,
      conflict: false,
      partial: false
    }
  },
  adventuring: {
    label: "arm5e.activity.adventuring",
    display: {
      tab: true,
      progress: true,
      abilities: true,
      arts: true,
      masteries: true,
      spells: false
    },
    source: { default: 5, readonly: false },
    maxXp: 5,
    bonusOptions: null,
    validation: validAdventuring,
    secondaryFilter: null,
    scheduling: {
      duplicate: true,
      conflict: false,
      partial: false
    }
  },
  exposure: {
    label: "arm5e.activity.exposure",
    display: {
      tab: true,
      progress: true,
      abilities: true,
      arts: true,
      masteries: true,
      spells: false
    },
    source: { default: 2, readonly: false },
    maxXp: 2,
    bonusOptions: null,
    validation: validExposure,
    secondaryFilter: null,
    scheduling: {
      duplicate: false,
      conflict: false,
      partial: false
    }
  },
  practice: {
    label: "arm5e.activity.practice",
    display: {
      tab: true,
      progress: true,
      abilities: true,
      arts: false,
      masteries: true,
      spells: false
    },
    source: { default: 4, readonly: false },
    maxXp: 0,
    bonusOptions: {
      standard: { label: "arm5e.generic.standard", modifier: 0 },
      language: { label: "arm5e.activity.options.language", modifier: 4 },
      area: { label: "arm5e.activity.options.area", modifier: 3 },
      forced: { label: "arm5e.activity.options.forced", modifier: 1 },
      mastery: { label: "arm5e.activity.options.mastery", modifier: 1 }
    },
    validation: validPractice,
    secondaryFilter: null,
    scheduling: {
      duplicate: false,
      conflict: true,
      partial: false
    }
  },
  training: {
    label: "arm5e.activity.training",
    display: {
      tab: true,
      progress: true,
      abilities: true,
      arts: false,
      masteries: true,
      spells: false
    },
    source: { default: null, readonly: true },
    maxXp: 0,
    bonusOptions: null,
    validation: validTraining,
    secondaryFilter: null,
    scheduling: {
      duplicate: false,
      conflict: true,
      partial: false
    }
  },
  teaching: {
    label: "arm5e.activity.teaching",
    display: {
      tab: true,
      progress: true,
      abilities: true,
      arts: true,
      masteries: true,
      spells: false
    },
    source: { default: null, readonly: true },
    maxXp: 0,
    bonusOptions: {
      standard: { label: "arm5e.generic.standard", modifier: 0 },
      singleStudent: { label: "arm5e.activity.options.singleStudent", modifier: 6 },
      twoStudents: { label: "arm5e.activity.options.twoStudents", modifier: 3 }
    },
    validation: validTeaching,
    secondaryFilter: null,
    scheduling: {
      duplicate: false,
      conflict: true,
      partial: false
    }
  },

  hermeticApp: {
    label: "arm5e.activity.apprenticeship",
    display: {
      tab: true,
      progress: true,
      abilities: true,
      arts: true,
      masteries: true,
      spells: true
    },
    source: { default: 240, readonly: false },
    maxXp: 1000,
    bonusOptions: null,
    validation: validTotalXp,
    secondaryFilter: null,
    duration: 60,
    durationEdit: true,
    scheduling: {
      duplicate: false,
      conflict: true,
      partial: false
    }
  },
  childhood: {
    label: "arm5e.activity.childhood",
    display: {
      tab: true,
      progress: true,
      abilities: true,
      arts: false,
      masteries: false,
      spells: false
    },
    source: { default: 120, readonly: false },
    maxXp: 1000,
    bonusOptions: null,
    validation: validChildhood,
    secondaryFilter: null,
    duration: 20,
    durationEdit: true,
    scheduling: {
      duplicate: false,
      conflict: true,
      partial: false
    }
  },
  laterLife: {
    label: "arm5e.activity.laterLife",
    display: {
      tab: true,
      progress: true,
      abilities: true,
      arts: false,
      masteries: false,
      spells: false
    },
    source: { default: 15, readonly: false },
    maxXp: 1000,
    bonusOptions: null,
    validation: validTotalXp,
    secondaryFilter: null,
    duration: 4,
    durationEdit: true,
    scheduling: {
      duplicate: false,
      conflict: true,
      partial: false
    }
  },
  laterLifeMagi: {
    label: "arm5e.activity.laterLifeMagi",
    display: {
      tab: true,
      progress: true,
      abilities: true,
      arts: true,
      masteries: true,
      spells: false
    },
    source: { default: 30, readonly: false },
    maxXp: 1000,
    bonusOptions: null,
    validation: validTotalXp,
    secondaryFilter: null,
    duration: 4,
    durationEdit: true,
    scheduling: {
      duplicate: false,
      conflict: true,
      partial: false
    }
  },
  reading: {
    label: "arm5e.activity.reading",
    display: {
      tab: true,
      progress: true,
      abilities: true,
      arts: true,
      masteries: true,
      spells: false,
      attribute: "hidden"
    },
    source: { default: 0, readonly: true },
    maxXp: 0,
    bonusOptions: null,
    validation: validReading,
    secondaryFilter: null,
    scheduling: {
      duplicate: false,
      conflict: true,
      partial: false
    }
  },
  writing: {
    label: "arm5e.activity.writing",
    display: {
      tab: true,
      progress: false,
      abilities: false,
      arts: false,
      masteries: false,
      spells: false,
      attribute: "hidden"
    },
    source: { default: 0, readonly: true },
    maxXp: 0,
    bonusOptions: null,
    // validation: validWriting,
    secondaryFilter: null,
    scheduling: {
      duplicate: false,
      conflict: true,
      partial: true
    }
  },
  copying: {
    label: "arm5e.activity.copying",
    display: {
      tab: true,
      progress: false,
      abilities: false,
      arts: false,
      masteries: false,
      spells: false,
      attribute: "hidden"
    },
    source: { default: 0, readonly: true },
    maxXp: 0,
    bonusOptions: null,
    // validation: validWriting,
    secondaryFilter: null,
    scheduling: {
      duplicate: false,
      conflict: true,
      partial: true
    }
  },
  learnSpell: {
    label: "arm5e.lab.activity.spellLearning",
    display: {
      tab: true,
      progress: true,
      abilities: false,
      arts: false,
      masteries: false,
      spells: true,
      attribute: "hidden"
    },
    source: { default: 0, readonly: true },
    maxXp: 0,
    bonusOptions: null,
    validation: null,
    secondaryFilter: null,
    scheduling: {
      duplicate: false,
      conflict: true,
      partial: false
    }
  },
  inventSpell: {
    label: "arm5e.lab.activity.inventSpell",
    display: {
      tab: true,
      progress: true,
      abilities: false,
      arts: false,
      masteries: false,
      spells: true,
      attribute: "hidden"
    },
    source: { default: 0, readonly: true },
    maxXp: 0,
    bonusOptions: null,
    validation: null,
    secondaryFilter: null,
    scheduling: {
      duplicate: true,
      conflict: true,
      partial: true
    }
  },
  visExtraction: {
    label: "arm5e.lab.activity.visExtraction",
    display: {
      tab: true,
      progress: true,
      abilities: false,
      arts: false,
      masteries: false,
      spells: false,
      attribute: "hidden"
    },
    source: { default: 0, readonly: true },
    maxXp: 0,
    bonusOptions: null,
    validation: null,
    secondaryFilter: null,
    scheduling: {
      duplicate: false,
      conflict: true,
      partial: false
    }
  },
  lab: {
    label: "arm5e.sheet.laboratory",
    display: { tab: false, progress: false },
    source: { default: 0, readonly: true },
    maxXp: 0,
    bonusOptions: null,
    validation: null,
    secondaryFilter: null,
    scheduling: {
      duplicate: false,
      conflict: false,
      partial: true
    }
  },
  aging: {
    label: "arm5e.activity.aging",
    display: {
      tab: true,
      progress: false,
      abilities: false,
      arts: false,
      masteries: false,
      spells: false,
      attribute: "hidden"
    },
    source: { default: 0, readonly: true },
    maxXp: 0,
    bonusOptions: null,
    validation: validAging,
    secondaryFilter: null,
    roll: { label: "arm5e.activity.roll.aging", action: agingRoll },
    scheduling: {
      duplicate: true,
      conflict: false,
      partial: false
    }
  },
  twilight: {
    label: "arm5e.sheet.twilight",
    display: {
      tab: true,
      progress: false,
      abilities: false,
      arts: false,
      masteries: false,
      spells: false,
      attribute: "hidden"
    },
    source: { default: 0, readonly: true },
    maxXp: 0,
    bonusOptions: null,
    secondaryFilter: null,
    roll: { label: "arm5e.twilight.episode", action: twilightUnderstandingRoll },
    scheduling: {
      duplicate: true,
      conflict: false,
      partial: false
    }
  },
  visStudy: {
    label: "arm5e.activity.visStudy",
    display: {
      tab: true,
      progress: true,
      abilities: false,
      arts: true,
      masteries: false,
      spells: false,
      attribute: "hidden"
    },
    source: { default: 0, readonly: true },
    maxXp: 0,
    bonusOptions: null,
    validation: validVisStudy,
    secondaryFilter: null,
    roll: { label: "arm5e.activity.roll.visStudy", action: visStudy },
    scheduling: {
      duplicate: false,
      conflict: true,
      partial: false
    }
  },
  recovery: {
    label: "arm5e.activity.recovery",
    display: {
      tab: false,
      progress: false,
      abilities: false,
      arts: false,
      masteries: false,
      spells: false,
      attribute: "hidden"
    },
    source: { default: 0, readonly: true },
    maxXp: 0,
    bonusOptions: null,
    validation: null,
    secondaryFilter: null,
    scheduling: {
      duplicate: true,
      conflict: false,
      partial: true
    }
  },
  longevityRitual: {
    label: "arm5e.activity.longevityRitual",
    display: {
      tab: true,
      progress: false,
      abilities: false,
      arts: false,
      masteries: false,
      spells: false,
      attribute: "hidden"
    },
    source: { default: 0, readonly: true },
    maxXp: 0,
    bonusOptions: null,
    validation: null,
    secondaryFilter: null,
    scheduling: {
      duplicate: false,
      conflict: true,
      partial: false
    }
    // application: longevityRitual
  },
  minorEnchantment: {
    label: "arm5e.activity.minorEnchantment",
    display: {
      tab: true,
      progress: false,
      abilities: false,
      arts: false,
      masteries: false,
      spells: false,
      attribute: "hidden"
    },
    source: { default: 0, readonly: true },
    maxXp: 0,
    bonusOptions: null,
    validation: null,
    secondaryFilter: null,
    scheduling: {
      duplicate: false,
      conflict: true,
      partial: false
    }
  },
  chargedItem: {
    label: "arm5e.activity.chargedItem",
    display: {
      tab: true,
      progress: false,
      abilities: false,
      arts: false,
      masteries: false,
      spells: false,
      attribute: "hidden"
    },
    source: { default: 0, readonly: true },
    maxXp: 0,
    bonusOptions: null,
    validation: null,
    secondaryFilter: null,
    scheduling: {
      duplicate: false,
      conflict: true,
      partial: false
    }
  },
  investigateItem: {
    label: "arm5e.activity.investigateItem",
    display: {
      tab: true,
      progress: false,
      abilities: false,
      arts: false,
      masteries: false,
      spells: false,
      attribute: "hidden"
    },
    source: { default: 0, readonly: true },
    maxXp: 0,
    bonusOptions: null,
    validation: null,
    secondaryFilter: null,
    roll: { label: "arm5e.activity.roll.investigate", action: investigate },
    scheduling: {
      duplicate: false,
      conflict: true,
      partial: false
    }
  }
};

ARM5E.books = {};
ARM5E.books.types = { Summa: "Summa", Tractatus: "Tractatus" };
ARM5E.books.categories = {
  art: "arm5e.sheet.art",
  ability: "arm5e.sheet.ability",
  mastery: "arm5e.activity.options.mastery",
  labText: "TYPES.Item.laboratoryText"
};

ARM5E.activities.lab = {
  none: {
    label: "arm5e.generic.none",
    enabled: "",
    edition: {
      aura: "",
      spellField: "",
      spellCombobox: ""
    }
  },
  inventSpell: {
    label: "arm5e.lab.activity.inventSpell",
    enabled: "",
    edition: {
      aura: "",
      spellField: "",
      spellCombobox: ""
    }
  },
  learnSpell: {
    label: "arm5e.lab.activity.spellLearning",
    enabled: "",
    edition: {
      aura: "",
      spellField: "readonly",
      spellCombobox: "disabled"
    }
  },
  visExtraction: {
    label: "arm5e.lab.activity.visExtraction",
    enabled: "",
    edition: {
      aura: "",
      spellField: "readonly",
      spellCombobox: "disabled"
    }
  },
  // openEnchantment: {
  //   label: "arm5e.lab.activity.openEnchantment",
  //   enabled: "disabled",
  //   edition: {
  //     aura: "",
  //     spellField: "readonly",
  //     spellCombobox: "disabled"
  //   }
  // },
  longevityRitual: {
    label: "arm5e.lab.activity.longevityRitual",
    enabled: "",
    edition: {
      aura: "",
      spellField: "readonly",
      spellCombobox: "disabled"
    }
  },
  chargedItem: {
    label: "arm5e.lab.activity.chargedEnchantment",
    enabled: "",
    edition: {
      aura: "",
      spellField: "",
      spellCombobox: ""
    }
  },
  minorEnchantment: {
    label: "arm5e.lab.activity.minorEnchantment",
    enabled: "",
    edition: {
      aura: "",
      spellField: "",
      spellCombobox: ""
    }
  },
  // majorEnchantment: {
  //   label: "arm5e.lab.activity.majorEnchantment",
  //   enabled: "disabled",
  //   edition: {
  //     aura: "",
  //     spellField: "",
  //     spellCombobox: ""
  //   }
  // },
  investigateItem: {
    label: "arm5e.lab.activity.itemInvestigation",
    enabled: "",
    edition: {
      aura: "",
      spellField: "",
      spellCombobox: "disabled"
    }
  }
};

ARM5E.activities.troupeFilters = {
  players: "arm5e.sheet.players",
  magi: "arm5e.sheet.maguss",
  companions: "arm5e.sheet.companions",
  grogs: "arm5e.sheet.grogs",
  all: "arm5e.generic.all",
  npcs: "arm5e.sheet.npcs"
};

ARM5E.activities.distractions = {
  none: { label: "arm5e.lab.distraction.none", coeff: 1 },
  oneMonth: { label: "arm5e.lab.distraction.oneMonth", coeff: 2 / 3 },
  twoMonths: { label: "arm5e.lab.distraction.twoMonths", coeff: 1 / 3 },
  threeMonths: { label: "arm5e.lab.distraction.threeMonths", coeff: 0 }
};

ARM5E.activities.books = {
  learnSpell: "arm5e.book.learnSpell",
  read: "arm5e.book.learnSkill",
  write: "arm5e.book.write",
  copy: "arm5e.book.copy"
};

ARM5E.activities.aging = {
  noaging: { desc: "arm5e.aging.roll.noaging" },
  normal: { desc: "arm5e.aging.roll.normal", impact: 0 },
  anyAgingPt: { desc: "arm5e.aging.roll.anyAgingPt", impact: 1 },
  QikPt: { desc: "arm5e.aging.roll.QikPt", impact: 1, char: "qik" },
  PrsPt: { desc: "arm5e.aging.roll.PrsPt", impact: 1, char: "pre" },
  StaPt: { desc: "arm5e.aging.roll.StaPt", impact: 1, char: "sta" },
  PerPt: { desc: "arm5e.aging.roll.PerPt", impact: 1, char: "per" },
  StrStaPts: { desc: "arm5e.aging.roll.StrStaPts", impact: 2, char: "str", char2: "sta" },
  DexQikPts: { desc: "arm5e.aging.roll.DexQikPts", impact: 2, char: "dex", char2: "qik" },
  ComPrsPts: { desc: "arm5e.aging.roll.ComPrsPts", impact: 2, char: "com", char2: "pre" },
  IntPerPts: { desc: "arm5e.aging.roll.IntPerPts", impact: 2, char: "int", char2: "per" },
  crisis: { desc: "arm5e.aging.roll.crisis", impact: 42 },
  warping: { impact: 1 }
};

ARM5E.activities.twilight = {};
ARM5E.activities.twilight.durations = [
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

ARM5E.lab = {};

ARM5E.lab.labTextType = {
  raw: "arm5e.sheet.labText.raw",
  spell: "arm5e.sheet.spell",
  enchantment: "arm5e.lab.enchantment.label"
};

ARM5E.lab.usage = {
  light: {
    label: "arm5e.lab.usage.light",
    coeff: 0.5
  },
  standard: {
    label: "arm5e.lab.usage.standard",
    coeff: 1
  },
  heavy: {
    label: "arm5e.lab.usage.heavy",
    coeff: 1.5
  }
};

ARM5E.lab.enchantment = {};
ARM5E.lab.enchantment.expiry = {
  0: "arm5e.lab.enchantment.item.expiry.never",
  1: "arm5e.lab.enchantment.item.expiry.1y",
  7: "arm5e.lab.enchantment.item.expiry.7y",
  70: "arm5e.lab.enchantment.item.expiry.70y"
};

ARM5E.lab.enchantment.receptacle = {};
ARM5E.lab.enchantment.receptacle.state = {
  inert: "arm5e.lab.enchantment.item.state.inert",
  appraised: "arm5e.lab.enchantment.item.state.appraised",
  enchanted: "arm5e.lab.enchantment.item.state.enchanted"
};

ARM5E.lab.enchantment.state = {
  prepared: { label: "arm5e.lab.enchantment.item.state.prepared" },
  lesser: { label: "arm5e.lab.enchantment.item.state.lesser" },
  major: { label: "arm5e.lab.enchantment.item.state.major" },
  charged: { label: "arm5e.lab.enchantment.item.state.charged" },
  talisman: { label: "arm5e.lab.enchantment.item.talisman" }
};

// TODO OPHI mnemonics
ARM5E.lab.enchantment.bonus = {};
ARM5E.lab.enchantment.bonus.templates = {
  verditiusRunes: { type: "labTotal", label: "Verditius' runes", value: 3 }
};

ARM5E.lab.enchantment.materialBase = {
  base1: {
    base: 1,
    eg: "arm5e.lab.enchantment.item.material.base1"
  },
  base2: {
    base: 2,
    eg: "arm5e.lab.enchantment.item.material.base2"
  },
  base3: {
    base: 3,
    eg: "arm5e.lab.enchantment.item.material.base3"
  },
  base4: {
    base: 4,
    eg: "arm5e.lab.enchantment.item.material.base4"
  },
  base5: {
    base: 5,
    eg: "arm5e.lab.enchantment.item.material.base5"
  },
  base6: {
    base: 6,
    eg: "arm5e.lab.enchantment.item.material.base6"
  },
  base10: {
    base: 10,
    eg: "arm5e.lab.enchantment.item.material.base10"
  },
  base12: {
    base: 12,
    eg: "arm5e.lab.enchantment.item.material.base12"
  },
  base15: {
    base: 15,
    eg: "arm5e.lab.enchantment.item.material.base15"
  },
  base20: {
    base: 20,
    eg: "arm5e.lab.enchantment.item.material.base20"
  }
};

ARM5E.lab.enchantment.sizeMultiplier = {
  tiny: {
    mult: 1,
    eg: "arm5e.lab.enchantment.item.size.tiny-eg",
    value: "arm5e.lab.enchantment.item.size.tiny"
  },
  small: {
    mult: 2,
    eg: "arm5e.lab.enchantment.item.size.small-eg",
    value: "arm5e.lab.enchantment.item.size.small"
  },
  medium: {
    mult: 3,
    eg: "arm5e.lab.enchantment.item.size.medium-eg",
    value: "arm5e.lab.enchantment.item.size.medium"
  },
  large: {
    mult: 4,
    eg: "arm5e.lab.enchantment.item.size.large-eg",
    value: "arm5e.lab.enchantment.item.size.large"
  },
  huge: {
    mult: 5,
    eg: "arm5e.lab.enchantment.item.size.huge-eg",
    value: "arm5e.lab.enchantment.item.size.huge"
  }
};

ARM5E.lab.enchantment.effectUses = {
  0: "1",
  1: "2",
  2: "3",
  3: "6",
  4: "12",
  5: "24",
  6: "50",
  10: "Unlimited"
};

ARM5E.lab.enchantment.enchantableTypes = {
  item: "TYPES.Item.item",
  weapon: "TYPES.Item.weapon",
  armor: "TYPES.Item.armor",
  book: "TYPES.Item.book"
};

ARM5E.generic = {};

// temporary
ARM5E.generic.reviewStatus = {
  none: {
    label: "None/To do"
  },
  toReview: {
    label: "To review"
  },
  reviewed: {
    label: "Reviewed"
  },
  needAE: {
    label: "Need active effect"
  },
  definitiveReady: {
    label: "Ready for 5th Definitive edition"
  }
};

ARM5E.generic.sourcesTypes = {
  custom: {
    label: "arm5e.sheet.source.custom",
    display: true,
    edit: "disabled"
  },
  ArM5Def: {
    label: "arm5e.sheet.source.ArM5Def",
    display: true,
    edit: "disabled"
  },
  ArM5: {
    label: "arm5e.sheet.source.ArM5",
    display: true,
    edit: "disabled"
  },
  Cov: {
    label: "arm5e.sheet.source.Cov"
  },
  "HoH:MC": {
    label: "arm5e.sheet.source.HoH:MC"
  },
  "HoH:S": {
    label: "arm5e.sheet.source.HoH:S"
  },
  "HoH:TL": {
    label: "arm5e.sheet.source.HoH:TL"
  },
  "RoP:D": {
    label: "arm5e.sheet.source.RoP:D"
  },
  "RoP:I": {
    label: "arm5e.sheet.source.RoP:I"
  },
  "RoP:M": {
    label: "arm5e.sheet.source.RoP:M"
  },
  "RoP:F": {
    label: "arm5e.sheet.source.RoP:F"
  },
  AnM: {
    label: "arm5e.sheet.source.AnM"
  },
  Ant: {
    label: "arm5e.sheet.source.Ant"
  },
  App: {
    label: "arm5e.sheet.source.App"
  },
  "A&A": {
    label: "arm5e.sheet.source.A&A"
  },
  AtD: {
    label: "arm5e.sheet.source.AtD"
  },
  BCoC: {
    label: "arm5e.sheet.source.BCoC"
  },
  Ch: {
    label: "arm5e.sheet.source.Ch"
  },
  "C&G": {
    label: "arm5e.sheet.source.C&G"
  },
  "C&C": {
    label: "arm5e.sheet.source.C&C"
  },
  GotF: {
    label: "arm5e.sheet.source.GotF"
  },
  HMRE: {
    label: "arm5e.sheet.source.HMRE"
  },
  HP: {
    label: "arm5e.sheet.source.HP"
  },
  LoM: {
    label: "arm5e.sheet.source.LoM"
  },
  LH: {
    label: "arm5e.sheet.source.LH"
  },
  "L&L": {
    label: "arm5e.sheet.source.L&L"
  },
  MoH: {
    label: "arm5e.sheet.source.MoH"
  },
  RM: {
    label: "arm5e.sheet.source.RM"
  },
  ToME: {
    label: "arm5e.sheet.source.ToME"
  },
  TMRE: {
    label: "arm5e.sheet.source.TMRE"
  },
  TSE: {
    label: "arm5e.sheet.source.TSE"
  },
  Gr: {
    label: "arm5e.sheet.source.Gr"
  },
  ToP: {
    label: "arm5e.sheet.source.ToP"
  },
  TME: {
    label: "arm5e.sheet.source.TME"
  },
  CI: {
    label: "arm5e.sheet.source.CI"
  },
  SemE: {
    label: "arm5e.sheet.source.SemE"
  },
  Dies: {
    label: "arm5e.sheet.source.Dies"
  },
  TtA: {
    label: "arm5e.sheet.source.TtA"
  },
  ML: {
    label: "arm5e.sheet.source.ML"
  },
  TTT: {
    label: "arm5e.sheet.source.TTT"
  },
  Hook: {
    label: "arm5e.sheet.source.Hooks"
  },
  "F&F": {
    label: "arm5e.sheet.source.F&F"
  },
  LotN: {
    label: "arm5e.sheet.source.LotN"
  },
  others: {
    label: "arm5e.sheet.source.others"
  }
};

ARM5E.recovery = {
  rankMapping: ["healthy", "light", "medium", "heavy", "incap", "dead"],
  wounds: {
    healthy: {
      rank: 0,
      penalty: 0,
      stability: 0,
      improvement: 0,
      interval: 7,
      icon: "systems/arm5e/assets/icons/recovery/healed.png",
      label: "arm5e.sheet.healthy"
    },
    light: {
      rank: 1,
      penalty: -1,
      stability: 4,
      improvement: 10,
      interval: 7,
      icon: "systems/arm5e/assets/icons/recovery/light.svg",
      label: "arm5e.sheet.light"
    },
    medium: {
      rank: 2,
      penalty: -3,
      stability: 6,
      improvement: 12,
      interval: 30,
      icon: "systems/arm5e/assets/icons/recovery/medium.svg",
      label: "arm5e.sheet.medium"
    },
    heavy: {
      rank: 3,
      penalty: -5,
      stability: 9,
      improvement: 15,
      interval: 90,
      icon: "systems/arm5e/assets/icons/recovery/heavy.svg",
      label: "arm5e.sheet.heavy"
    },
    incap: {
      rank: 4,
      penalty: -99,
      stability: 1,
      improvement: 9,
      interval: 0.5,
      icon: "systems/arm5e/assets/icons/recovery/incap.svg",
      label: "arm5e.sheet.incap"
    },
    dead: {
      rank: 5,
      penalty: -999,
      stability: 999,
      improvement: 999,
      interval: 0,
      icon: "systems/arm5e/assets/icons/skull.svg",
      label: "arm5e.sheet.dead"
    }
  },
  daysInSeason: 92,
  rollMode: 40 // no chat message, no confidence
};

export function getWoundStr(gravity = 0) {
  if (gravity > 5 && gravity < 0) return "";
  return game.i18n.localize(ARM5E.recovery.wounds[ARM5E.recovery.rankMapping[gravity]].label);
}

ARM5E.ActorProfiles = {
  basic: {
    label: "Add basic abilities",
    abilities: [
      { key: "livingLanguage", option: "languageName", xp: 75 },
      { key: "areaLore", option: "AreaName", xp: 5 }
    ]
  },
  martial: {
    label: "Martial",
    abilities: [
      { key: "awareness", option: "", inc: 5 },
      { key: "brawl", option: "", inc: 5 },
      { key: "bows", option: "", inc: 5 },
      { key: "trownWeapon", option: "", inc: 5 },
      { key: "greatWeapon", option: "", inc: 5 },
      { key: "singleWeapon", option: "", inc: 5 }
    ]
  },
  social: {
    label: "Social",
    abilities: [
      { key: "carouse", option: "", inc: 5 },
      { key: "charm", option: "", inc: 5 },
      { key: "bows", option: "", inc: 5 },
      { key: "etiquette", option: "", inc: 5 },
      { key: "folkKen", option: "", inc: 5 },
      { key: "leadership", option: "", inc: 5 }
    ]
  },
  rogue: {
    label: "Rogue",
    abilities: [
      { key: "awareness", option: "", inc: 5 },
      { key: "charm", option: "", inc: 5 },
      { key: "guile", option: "", inc: 5 },
      { key: "intrigue", option: "", inc: 5 },
      { key: "folkKen", option: "", inc: 5 },
      { key: "legerdemain", option: "", inc: 5 }
    ]
  },
  scholarMundane: {
    label: "Mundane scholar",
    abilities: [
      { key: "profession", option: "Scribe", inc: 5 },
      { key: "artesLib", option: "", inc: 5 },
      { key: "philosophy", option: "", inc: 5 },
      { key: "theology", option: "Christian", inc: 5 },
      { key: "law", option: "canonLaw", inc: 5 },
      { key: "deadLanguage", option: "Latin", inc: 5 }
    ]
  },
  scholarArcane: {
    label: "Arcane scholar",
    abilities: [
      { key: "profession", option: "Scribe", inc: 5 },
      { key: "artesLib", option: "", inc: 5 },
      { key: "philosophy", option: "", inc: 5 },
      { key: "dominionLore", option: "", inc: 5 },
      { key: "faerieLore", option: "", inc: 5 },
      { key: "infernalLore", option: "", inc: 5 },
      { key: "magicLore", option: "", inc: 5 },
      { key: "deadLanguage", option: "Latin", inc: 5 }
    ]
  },
  magus: {
    label: "Magus",
    abilities: [
      { key: "deadLanguage", option: "Latin", xp: 50 },
      { key: "magicTheory", option: "", xp: 30, inc: 5 },
      { key: "parma", option: "", xp: 5, inc: 5 },
      { key: "artesLib", option: "", xp: 5, inc: 5 },
      { key: "penetration", option: "", inc: 5 },
      { key: "finesse", option: "", inc: 5 },
      { key: "awareness", option: "", inc: 5 },
      { key: "concentration", option: "", inc: 5 },
      { key: "philosophy", option: "", inc: 5 },
      { key: "hermeticCode", option: "", inc: 5 }
    ],
    virtues: [{ index: "the-gift" }]
  },
  masterMagic: {
    label: "Arts mastery",
    arts: [
      { key: "cr", inc: 5 },
      { key: "in", inc: 5 },
      { key: "mu", inc: 5 },
      { key: "pe", inc: 5 },
      { key: "re", inc: 5 },
      { key: "an", inc: 5 },
      { key: "aq", inc: 5 },
      { key: "au", inc: 5 },
      { key: "co", inc: 5 },
      { key: "he", inc: 5 },
      { key: "ig", inc: 5 },
      { key: "im", inc: 5 },
      { key: "me", inc: 5 },
      { key: "te", inc: 5 },
      { key: "vi", inc: 5 }
    ]
  }
};
