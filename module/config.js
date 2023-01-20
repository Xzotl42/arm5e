import {
  validAdventuring,
  validExposure,
  validPractice,
  validTraining,
  validTeaching,
  validChildhood,
  validTotalXp,
  validReading
} from "./helpers/long-term-activities.js";

export const ARM5E = {};
export const ARM5E_DEFAULT_ICONS = {};
/**
 * The set of metadata used within the sytem that will
 * probably not change
 * @type {Object}
 */
ARM5E.SYSTEM_ID = "arm5e";

// default icons

ARM5E_DEFAULT_ICONS.MONO = {
  weapon: "icons/svg/sword.svg",
  armor: "icons/svg/statue.svg",
  spell: "icons/svg/explosion.svg",
  vis: "icons/svg/daze.svg",
  book: "icons/svg/book.svg",
  virtue: "systems/arm5e/assets/icons/upgraded-magic.svg",
  flaw: "systems/arm5e/assets/icons/base-magic.svg",
  ability: "icons/svg/aura.svg",
  abilityFamiliar: "icons/svg/aura.svg",
  diaryEntry: "icons/svg/sun.svg",
  power: "icons/svg/tower.svg",
  powerFamiliar: "icons/svg/tower.svg",
  speciality: "icons/svg/obelisk.svg",
  distinctive: "icons/svg/target.svg",
  sanctumRoom: "icons/svg/temple.svg",
  magicItem: "icons/svg/mage-shield.svg",
  personality: "icons/svg/personality.svg",
  reputation: "icons/svg/angel.svg",
  habitantMagi: "icons/svg/mountain.svg",
  habitantCompanion: "icons/svg/castle.svg",
  habitantSpecialists: "icons/svg/city.svg",
  habitantHabitants: "icons/svg/village.svg",
  habitantHorses: "icons/svg/bridge.svg",
  habitantLivestock: "icons/svg/windmill.svg",
  possessionsCovenant: "icons/svg/barrel.svg",
  visSourcesCovenant: "icons/svg/ruins.svg",
  visStockCovenant: "icons/svg/chest.svg",
  magicalEffect: "icons/svg/up.svg",
  baseEffect: "icons/svg/down.svg",
  calendarCovenant: "icons/svg/clockwork.svg",
  incomingSource: "icons/svg/regen.svg",
  laboratoryText: "systems/arm5e/assets/icons/journal-book.svg",
  magicCodex: "icons/commodities/materials/parchment-secrets.webp",
  covenant: "icons/svg/castle.svg",
  crucible: "icons/tools/laboratory/bowl-liquid-orange.webp",
  npc: "icons/svg/mystery-man-black.svg",
  laboratory: "icons/svg/tower.svg",
  enchantment: "icons/svg/daze.svg",
  labCovenant: "icons/svg/tower.svg"
};
ARM5E_DEFAULT_ICONS.COLOR = {
  weapon: "icons/weapons/swords/greatsword-crossguard-silver.webp",
  armor: "icons/equipment/chest/breastplate-scale-grey.webp",
  spell: "icons/magic/light/explosion-star-glow-blue-purple.webp",
  vis: "icons/magic/light/orbs-firefly-hand-yellow.webp",
  item: "icons/sundries/survival/rope-coiled-tan.webp",
  book: "icons/sundries/books/book-tooled-eye-gold-red.webp",
  virtue: "icons/magic/light/explosion-star-glow-silhouette.webp",
  flaw: "icons/magic/control/silhouette-hold-change-blue.webp",
  //"flaw": "icons/magic/unholy/silhouette-evil-horned-giant.webp",
  ability: "icons/skills/trades/woodcutting-logging-axe-stump.webp",
  abilityFamiliar: "icons/creatures/mammals/deer-antlers-glowing-blue.webp",
  diaryEntry: "icons/sundries/documents/document-sealed-signatures-red.webp",
  power: "icons/creatures/abilities/dragon-fire-breath-orange.webp",
  powerFamiliar: "icons/creatures/abilities/wolf-howl-moon-purple.webp",
  speciality: "icons/skills/trades/construction-carpentry-hammer.webp",
  distinctive: "icons/sundries/flags/banner-symbol-sun-gold-red.webp",
  magicItem: "icons/weapons/staves/staff-ornate-red.webp",
  personality: "icons/skills/social/intimidation-impressing.webp",
  reputation: "icons/skills/social/diplomacy-handshake.webp",
  habitantCompanion: "icons/environment/people/cleric-grey.webp",
  habitantSpecialists: "icons/environment/people/commoner.webp",
  habitantHabitants: "icons/environment/people/group.webp",
  habitantHorses: "icons/environment/creatures/horse-brown.webp",
  habitantLivestock: "icons/environment/creatures/horses.webp",
  possessionsCovenant: "icons/commodities/currency/coins-plain-pouch-gold.webp",
  visSourcesCovenant: "icons/environment/wilderness/arch-stone.webp",
  visStockCovenant: "icons/commodities/currency/coin-oval-rune-copper.webp",
  laboratoryText: "icons/sundries/documents/blueprint-recipe-alchemical.webp",
  magicalEffect: "icons/sundries/documents/document-symbol-lightning-brown.webp",
  baseEffect: "icons/sundries/scrolls/scroll-symbol-eye-brown.webp",
  enchantment: "icons/magic/symbols/runes-etched-steel-blade.webp",
  labCovenant: "icons/tools/laboratory/vials-blue-pink.webp",
  // Actors
  covenant: "icons/environment/settlement/wizard-castle.webp",
  magicCodex: "icons/commodities/materials/parchment-secrets.webp",
  npc: "icons/svg/mystery-man-black.svg",
  laboratory: "icons/tools/laboratory/vials-blue-pink.webp",
  crucible: "icons/tools/laboratory/bowl-liquid-orange.webp"
};

ARM5E.character = {};

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
  cun: {
    label: "arm5e.sheet.cunning",
    short: "arm5e.sheet.cun"
  },
  int: {
    label: "arm5e.sheet.intelligence",
    short: "arm5e.sheet.int"
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
ARM5E.character.houses = {
  "n-a": {
    label: "N/A",
    dtype: "String"
  },
  bjo: {
    label: "Bjornaer",
    dtype: "String"
  },
  bon: {
    label: "Bonisagus",
    dtype: "String"
  },
  cri: {
    label: "Criamon",
    dtype: "String"
  },
  exm: {
    label: "Ex Miscellanea",
    dtype: "String"
  },
  fla: {
    label: "Flambeau",
    dtype: "String"
  },
  gen: {
    label: "Generic Magus",
    dtype: "String"
  },
  gue: {
    label: "Guernicus",
    dtype: "String"
  },
  jer: {
    label: "Jerbiton",
    dtype: "String"
  },
  mer: {
    label: "Mercere",
    dtype: "String"
  },
  mta: {
    label: "Merinita",
    dtype: "String"
  },
  tre: {
    label: "Tremere",
    dtype: "String"
  },
  tyt: {
    label: "Tytalus",
    dtype: "String"
  },
  ver: {
    label: "Verditius",
    dtype: "String"
  }
};
ARM5E.character.description = {
  born: {
    label: "arm5e.sheet.yearBorn"
  },
  apprentice: {
    label: "arm5e.sheet.apprenticeshipYears"
  },
  birthname: {
    label: "arm5e.sheet.birthName"
  },
  birthplace: {
    label: "arm5e.sheet.birthplace"
  },
  nationality: {
    label: "arm5e.sheet.nationality"
  },
  religion: {
    label: "arm5e.sheet.religion"
  },
  height: {
    label: "arm5e.sheet.height"
  },
  weight: {
    label: "arm5e.sheet.weight"
  },
  gender: {
    label: "arm5e.sheet.gender"
  },
  hair: {
    label: "arm5e.sheet.hair"
  },
  eyes: {
    label: "arm5e.sheet.eyes"
  },
  title: {
    label: "arm5e.sheet.profession"
  },
  handed: {
    label: "arm5e.sheet.handedness"
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
  social: {
    label: "arm5e.sheet.socialStatus"
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
  tainted: {
    label: "arm5e.sheet.tainted"
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

ARM5E.character.fatigueLevels = {
  fresh: {
    label: "arm5e.sheet.fresh",
    time: null
  },
  winded: {
    label: "arm5e.sheet.winded",
    time: "2 min."
  },
  weary: {
    label: "arm5e.sheet.weary",
    time: "10 min."
  },
  tired: {
    label: "arm5e.sheet.tired",
    time: "30 min."
  },
  dazed: {
    label: "arm5e.sheet.dazed",
    time: "1 hr."
  },
  unconscious: {
    label: "arm5e.sheet.unconscious",
    time: "2 hr."
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

ARM5E.ABILITIES_CATEGORIES = {
  general: { mnemonic: "arm5e.skill.category.general" },
  academic: { mnemonic: "arm5e.skill.category.academic" },
  arcane: { mnemonic: "arm5e.skill.category.arcane" },
  martial: { mnemonic: "arm5e.skill.category.martial" },
  mystery: { mnemonic: "arm5e.skill.category.mystery" },
  supernaturalCat: { mnemonic: "arm5e.skill.category.supernatural" }
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
    selection: "",
    optionPlaceholder: "arm5e.skill.options.area"
  },
  athletics: {
    mnemonic: "arm5e.skill.general.athletics",
    option: false,
    category: "general",
    selection: ""
  },
  awareness: {
    mnemonic: "arm5e.skill.general.awareness",
    option: false,
    category: "general",
    selection: ""
  },
  bargain: {
    mnemonic: "arm5e.skill.general.bargain",
    option: false,
    category: "general",
    selection: ""
  },
  brawl: {
    mnemonic: "arm5e.skill.general.brawl",
    option: false,
    category: "general",
    selection: ""
  },
  carouse: {
    mnemonic: "arm5e.skill.general.carouse",
    option: false,
    category: "general",
    selection: ""
  },
  charm: {
    mnemonic: "arm5e.skill.general.charm",
    option: false,
    category: "general",
    selection: ""
  },
  chirurgy: {
    mnemonic: "arm5e.skill.general.chirurgy",
    option: false,
    category: "general",
    selection: ""
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
    selection: "",
    optionPlaceholder: "arm5e.skill.options.craft"
  },
  etiquette: {
    mnemonic: "arm5e.skill.general.etiquette",
    option: false,
    category: "general",
    selection: ""
  },
  folkKen: {
    mnemonic: "arm5e.skill.general.folkKen",
    option: false,
    category: "general",
    selection: ""
  },
  guile: {
    mnemonic: "arm5e.skill.general.guile",
    option: false,
    category: "general",
    selection: ""
  },
  hunt: { mnemonic: "arm5e.skill.general.hunt", option: false, category: "general", selection: "" },
  intrigue: {
    mnemonic: "arm5e.skill.general.intrigue",
    option: false,
    category: "general",
    selection: ""
  },
  leadership: {
    mnemonic: "arm5e.skill.general.leadership",
    option: false,
    category: "general",
    selection: ""
  },
  legerdemain: {
    mnemonic: "arm5e.skill.general.legerdemain",
    option: false,
    category: "general",
    selection: ""
  },
  livingLanguage: {
    mnemonic: "arm5e.skill.general.livingLanguage",
    option: true,
    category: "general",
    selection: "",
    optionPlaceholder: "arm5e.skill.options.language"
  },
  music: { mnemonic: "arm5e.skill.general.music", option: false, category: "general" },
  organizationLore: {
    mnemonic: "arm5e.skill.general.organizationLore",
    option: true,
    category: "general",
    selection: "",
    optionPlaceholder: "arm5e.skill.options.organization"
  },
  profession: {
    mnemonic: "arm5e.skill.general.profession",
    option: true,
    category: "general",
    selection: "",
    optionPlaceholder: "arm5e.skill.options.profession"
  },
  ride: { mnemonic: "arm5e.skill.general.ride", option: false, category: "general", selection: "" },
  stealth: {
    mnemonic: "arm5e.skill.general.stealth",
    option: false,
    category: "general",
    selection: ""
  },
  survival: {
    mnemonic: "arm5e.skill.general.survival",
    option: false,
    category: "general",
    selection: ""
  },
  swim: { mnemonic: "arm5e.skill.general.swim", option: false, category: "general", selection: "" },
  teaching: {
    mnemonic: "arm5e.skill.general.teaching",
    option: false,
    category: "general",
    selection: ""
  }
};

ARM5E.ACADEMIC_ABILITIES = {
  artesLib: {
    mnemonic: "arm5e.skill.academic.artesLib",
    option: false,
    category: "academic",
    selection: ""
  },
  civilCanonLaw: {
    mnemonic: "arm5e.skill.academic.civilCanonLaw",
    option: false,
    category: "academic",
    selection: ""
  },
  commonLaw: {
    mnemonic: "arm5e.skill.academic.commonLaw",
    option: false,
    category: "academic",
    selection: ""
  },
  deadLanguage: {
    mnemonic: "arm5e.skill.academic.deadLanguage",
    option: true,
    category: "academic",
    selection: "",
    optionPlaceholder: "arm5e.skill.options.language"
  },
  medicine: {
    mnemonic: "arm5e.skill.academic.medicine",
    option: false,
    category: "academic",
    selection: ""
  },
  philosophy: {
    mnemonic: "arm5e.skill.academic.philosophy",
    option: false,
    category: "academic",
    selection: ""
  },
  theology: {
    mnemonic: "arm5e.skill.academic.theology",
    option: false,
    category: "academic",
    selection: ""
  }
};

ARM5E.ARCANE_ABILITIES = {
  hermeticCode: {
    mnemonic: "arm5e.skill.arcane.hermeticCode",
    option: false,
    category: "arcane",
    selection: ""
  },
  dominionLore: {
    mnemonic: "arm5e.skill.arcane.dominionLore",
    option: false,
    category: "arcane",
    selection: ""
  },
  faerieLore: {
    mnemonic: "arm5e.skill.arcane.faerieLore",
    option: false,
    category: "arcane",
    selection: ""
  },
  finesse: {
    mnemonic: "arm5e.skill.arcane.finesse",
    option: false,
    category: "arcane",
    selection: ""
  },
  infernalLore: {
    mnemonic: "arm5e.skill.arcane.infernalLore",
    option: false,
    category: "arcane",
    selection: ""
  },
  magicLore: {
    mnemonic: "arm5e.skill.arcane.magicLore",
    option: false,
    category: "arcane",
    selection: ""
  },
  magicTheory: {
    mnemonic: "arm5e.skill.arcane.magicTheory",
    option: false,
    category: "arcane",
    selection: ""
  },
  parma: { mnemonic: "arm5e.skill.arcane.parma", option: false, category: "arcane", selection: "" },
  penetration: {
    mnemonic: "arm5e.skill.arcane.penetration",
    option: false,
    category: "arcane",
    selection: ""
  }
};

ARM5E.MARTIAL_ABILITIES = {
  bows: { mnemonic: "arm5e.skill.martial.bows", option: false, category: "martial", selection: "" },
  singleWeapon: {
    mnemonic: "arm5e.skill.martial.singleWeapon",
    option: false,
    category: "martial",
    selection: ""
  },
  greatWeapon: {
    mnemonic: "arm5e.skill.martial.greatWeapon",
    option: false,
    category: "martial",
    selection: ""
  },
  trownWeapon: {
    mnemonic: "arm5e.skill.martial.trownWeapon",
    option: false,
    category: "martial",
    selection: ""
  }
};

ARM5E.SUPERNATURAL_ABILITIES = {
  animalKen: {
    mnemonic: "arm5e.skill.supernatural.animalKen",
    option: false,
    category: "supernaturalCat",
    selection: ""
  },
  dowsing: {
    mnemonic: "arm5e.skill.supernatural.dowsing",
    option: false,
    category: "supernaturalCat",
    selection: ""
  },
  enchantingMusic: {
    mnemonic: "arm5e.skill.supernatural.enchantingMusic",
    option: false,
    category: "supernaturalCat",
    selection: ""
  },
  entrancement: {
    mnemonic: "arm5e.skill.supernatural.entrancement",
    option: false,
    category: "supernaturalCat",
    selection: ""
  },
  magicSensitivity: {
    mnemonic: "arm5e.skill.supernatural.magicSensitivity",
    option: false,
    category: "supernaturalCat",
    selection: ""
  },
  premonitions: {
    mnemonic: "arm5e.skill.supernatural.premonitions",
    option: false,
    category: "supernaturalCat",
    selection: ""
  },
  secondSight: {
    mnemonic: "arm5e.skill.supernatural.secondSight",
    option: false,
    category: "supernaturalCat",
    selection: ""
  },
  senseHolyAndUnholy: {
    mnemonic: "arm5e.skill.supernatural.senseHolyAndUnholy",
    option: false,
    category: "supernaturalCat",
    selection: ""
  },
  shapeshifter: {
    mnemonic: "arm5e.skill.supernatural.shapeshifter",
    option: false,
    category: "supernaturalCat",
    selection: ""
  },
  supernatural: {
    mnemonic: "arm5e.skill.supernatural.generic",
    option: true,
    category: "supernaturalCat",
    selection: "",
    optionPlaceholder: "arm5e.skill.options.supernatural"
  },
  wildernessSense: {
    mnemonic: "arm5e.skill.supernatural.wildernessSense",
    option: false,
    category: "supernaturalCat",
    selection: ""
  }
};
ARM5E.MYSTERY_ABILITIES = {
  enigma: {
    mnemonic: "arm5e.skill.mystery.enigma",
    option: false,
    category: "mystery",
    selection: ""
  },
  faerieMagic: {
    mnemonic: "arm5e.skill.mystery.faerieMagic",
    option: false,
    category: "mystery",
    selection: ""
  },
  heartbeast: {
    mnemonic: "arm5e.skill.mystery.heartbeast",
    option: false,
    category: "mystery",
    selection: ""
  },
  verditiusMagic: {
    mnemonic: "arm5e.skill.mystery.verditiusMagic",
    option: false,
    category: "mystery",
    selection: ""
  },
  cult: {
    mnemonic: "arm5e.skill.mystery.cult",
    option: true,
    category: "mystery",
    selection: "",
    optionPlaceholder: "arm5e.skill.options.mysteryCult"
  }
};

ARM5E.ALL_ABILITIES = {
  general: {
    mnemonic: ARM5E.ABILITIES_CATEGORIES.general.mnemonic,
    option: false,
    selection: "disabled"
  },
  ...ARM5E.GENERAL_ABILITIES,
  academic: {
    mnemonic: ARM5E.ABILITIES_CATEGORIES.academic.mnemonic,
    option: false,
    selection: "disabled"
  },
  ...ARM5E.ACADEMIC_ABILITIES,
  arcane: {
    mnemonic: ARM5E.ABILITIES_CATEGORIES.arcane.mnemonic,
    option: false,
    selection: "disabled"
  },
  ...ARM5E.ARCANE_ABILITIES,
  martial: {
    mnemonic: ARM5E.ABILITIES_CATEGORIES.martial.mnemonic,
    option: false,
    selection: "disabled"
  },
  ...ARM5E.MARTIAL_ABILITIES,
  supernaturalCat: {
    mnemonic: ARM5E.ABILITIES_CATEGORIES.supernaturalCat.mnemonic,
    option: false,
    selection: "disabled"
  },
  ...ARM5E.SUPERNATURAL_ABILITIES,
  mystery: {
    mnemonic: ARM5E.ABILITIES_CATEGORIES.mystery.mnemonic,
    option: false,
    selection: "disabled"
  },
  ...ARM5E.MYSTERY_ABILITIES
};

export function localizeAbilities() {
  const res = {
    general: {
      name: game.i18n.localize(ARM5E.ABILITIES_CATEGORIES.general.mnemonic),
      mnemonic: ARM5E.ABILITIES_CATEGORIES.general.mnemonic,
      option: false,
      selection: "disabled"
    },
    ...translateAndSort(ARM5E.GENERAL_ABILITIES),
    academic: {
      name: game.i18n.localize(ARM5E.ABILITIES_CATEGORIES.academic.mnemonic),
      mnemonic: ARM5E.ABILITIES_CATEGORIES.academic.mnemonic,
      option: false,
      selection: "disabled"
    },
    ...translateAndSort(ARM5E.ACADEMIC_ABILITIES),
    arcane: {
      name: game.i18n.localize(ARM5E.ABILITIES_CATEGORIES.arcane.mnemonic),
      mnemonic: ARM5E.ABILITIES_CATEGORIES.arcane.mnemonic,
      option: false,
      selection: "disabled"
    },
    ...translateAndSort(ARM5E.ARCANE_ABILITIES),
    martial: {
      name: game.i18n.localize(ARM5E.ABILITIES_CATEGORIES.martial.mnemonic),
      mnemonic: ARM5E.ABILITIES_CATEGORIES.martial.mnemonic,
      option: false,
      selection: "disabled"
    },
    ...translateAndSort(ARM5E.MARTIAL_ABILITIES),
    supernaturalCat: {
      name: game.i18n.localize(ARM5E.ABILITIES_CATEGORIES.supernaturalCat.mnemonic),
      mnemonic: ARM5E.ABILITIES_CATEGORIES.supernaturalCat.mnemonic,
      option: false,
      selection: "disabled"
    },
    ...translateAndSort(ARM5E.SUPERNATURAL_ABILITIES),
    mystery: {
      name: game.i18n.localize(ARM5E.ABILITIES_CATEGORIES.mystery.mnemonic),
      mnemonic: ARM5E.ABILITIES_CATEGORIES.mystery.mnemonic,
      option: false,
      selection: "disabled"
    },
    ...translateAndSort(ARM5E.MYSTERY_ABILITIES)
  };
  return res;
}

function translateAndSort(abilityList) {
  for (let [key, value] of Object.entries(abilityList)) {
    let translation;
    if (value.option)
      translation = game.i18n.format(value.mnemonic, {
        option: game.i18n.localize(value.optionPlaceholder)
      });
    else translation = game.i18n.localize(value.mnemonic);
    abilityList[key].name = translation;
  }
  let tmp = Object.entries(abilityList).sort((a, b) => {
    return a[1].name.localeCompare(b[1].name);
  });
  return Object.fromEntries(tmp);
  // let tmp = abilityList.map(a => {
  //   let translation;
  //   if (a.option)
  //     translation = game.i18n.format(a[1].mnemonic, {
  //       option: game.i18n.localize(a[1].optionPlaceholder)
  //     });
  //   else translation = game.i18n.localize(a[1].mnemonic);
  //   return { [a[0]]: { name: translation, ...a[1] } };
  // });
  // let tmp2 = Object.values(tmp);
  // return tmp2.sort((a, b) => a.name.localeCompare(b.name));
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
    label: "arm5e.sheet.fatigue"
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
    label: "arm5e.sheet.damage"
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
// influence is the impact the aura has on powers of mundane (ie: none), magic, faery, divine and infernal respectively
ARM5E.realms = {
  magic: {
    label: "arm5e.sheet.realm.magical",
    value: 1,
    influence: [0, 1, 0.5, 0, -1]
  },
  faeric: {
    label: "arm5e.sheet.realm.faeric",
    value: 2,
    influence: [0, 0.5, 1, 0, -1]
  },
  divine: {
    label: "arm5e.sheet.realm.divine",
    value: 3,
    influence: [0, -3, -4, 1, -5]
  },
  infernal: {
    label: "arm5e.sheet.realm.infernal",
    value: 4,
    influence: [0, -1, -2, 0, 1]
  }
};

ARM5E.lookupRealm = ["mundane", "magic", "faeric", "divine", "infernal"];

ARM5E.realmsExt = {
  mundane: {
    label: "arm5e.sheet.realm.mundane",
    value: 0,
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
  }
};

ARM5E.seasons = {
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
};

ARM5E.magic = {};
ARM5E.magic.arts = {
  cr: {
    label: "Creo",
    short: "Cr",
    dtype: "String"
  },
  in: {
    label: "Intellego",
    short: "In",
    dtype: "String"
  },
  mu: {
    label: "Muto",
    short: "Mu",
    dtype: "String"
  },
  pe: {
    label: "Perdo",
    short: "Pe",
    dtype: "String"
  },
  re: {
    label: "Rego",
    short: "Re",
    dtype: "String"
  },
  an: {
    label: "Animal",
    short: "An",
    dtype: "String"
  },
  aq: {
    label: "Aquam",
    short: "Aq",
    dtype: "String"
  },
  au: {
    label: "Auram",
    short: "Au",
    dtype: "String"
  },
  co: {
    label: "Corpus",
    short: "Co",
    dtype: "String"
  },
  he: {
    label: "Herbam",
    short: "He",
    dtype: "String"
  },
  ig: {
    label: "Ignem",
    short: "Ig",
    dtype: "String"
  },
  im: {
    label: "Imaginem",
    short: "Im",
    dtype: "String"
  },
  me: {
    label: "Mentem",
    short: "Me",
    dtype: "String"
  },
  te: {
    label: "Terram",
    short: "Te",
    dtype: "String"
  },
  vi: {
    label: "Vim",
    short: "Vi",
    dtype: "String"
  }
};

ARM5E.magic.techniques = {
  cr: {
    label: "Creo",
    dtype: "String"
  },
  in: {
    label: "Intellego",
    dtype: "String"
  },
  mu: {
    label: "Muto",
    dtype: "String"
  },
  pe: {
    label: "Perdo",
    dtype: "String"
  },
  re: {
    label: "Rego",
    dtype: "String"
  }
};

ARM5E.magic.forms = {
  an: {
    label: "Animal",
    dtype: "String",
    baseSize: "arm5e.spell.targets.baseSize.an"
  },
  aq: {
    label: "Aquam",
    dtype: "String",
    baseSize: "arm5e.spell.targets.baseSize.aq"
  },
  au: {
    label: "Auram",
    dtype: "String",
    baseSize: "arm5e.spell.targets.baseSize.au"
  },
  co: {
    label: "Corpus",
    dtype: "String",
    baseSize: "arm5e.spell.targets.baseSize.co"
  },
  he: {
    label: "Herbam",
    dtype: "String",
    baseSize: "arm5e.spell.targets.baseSize.he"
  },
  ig: {
    label: "Ignem",
    dtype: "String",
    baseSize: "arm5e.spell.targets.baseSize.ig"
  },
  im: {
    label: "Imaginem",
    dtype: "String",
    baseSize: "arm5e.spell.targets.baseSize.im"
  },
  me: {
    label: "Mentem",
    dtype: "String",
    baseSize: "arm5e.spell.targets.baseSize.me"
  },
  te: {
    label: "Terram",
    dtype: "String",
    baseSize: "arm5e.spell.targets.baseSize.te"
  },
  vi: {
    label: "Vim",
    dtype: "String",
    baseSize: "arm5e.spell.targets.baseSize.vi"
  }
};

ARM5E.magic.gift = {
  normal: "arm5e.sheet.gift.normal",
  blatant: "arm5e.sheet.gift.blatant",
  gentle: "arm5e.sheet.gift.gentle"
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

  mm: {
    label: "arm5e.spell.durations.mm",
    dtype: "String",
    source: "RoP:F",
    impact: 2
  },

  not: {
    label: "arm5e.spell.durations.not",
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
  hidden: {
    label: "arm5e.spell.durations.hidden",
    dtype: "String",
    source: "RoP:F",
    impact: 4
  },

  aura: {
    label: "arm5e.spell.durations.aura",
    dtype: "String",
    source: "RoP:F",
    impact: 4
  },
  symbol: {
    label: "arm5e.spell.durations.symbol",
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
    label: "arm5e.sheet.source.AM",
    source: "AM",
    disabled: true
  },
  event: {
    label: "arm5e.spell.durations.event",
    dtype: "String",
    source: "AM",
    impact: 0
  },
  rune: {
    label: "arm5e.spell.durations.rune",
    dtype: "String",
    source: "AM",
    impact: 3
  },
  "19year": {
    label: "arm5e.spell.durations.19year",
    dtype: "String",
    source: "AM",
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
  symbol: {
    label: "arm5e.spell.ranges.symbol",
    dtype: "String",
    source: "RoP:F",
    impact: 4
  },
  "RoP:I": {
    label: "arm5e.sheet.source.RoP:I",
    source: "RoP:I",
    disabled: true
  },
  cross: {
    label: "arm5e.spell.ranges.cross",
    dtype: "String",
    source: "RoP:I",
    impact: 2
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
  AM: {
    label: "arm5e.sheet.source.AM",
    source: "AM",
    disabled: true
  },
  veil: {
    label: "arm5e.spell.ranges.veil",
    dtype: "String",
    source: "AM",
    impact: 3
  },
  unlimited: {
    label: "arm5e.spell.ranges.unlimited",
    dtype: "String",
    source: "AM",
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
  passion: {
    label: "arm5e.spell.targets.passion",
    dtype: "String",
    source: "RoP:F",
    impact: 2
  },
  symbol: {
    label: "arm5e.spell.targets.symbol",
    dtype: "String",
    source: "RoP:F",
    impact: 4
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
  AM: {
    label: "arm5e.sheet.source.AM",
    source: "AM",
    disabled: true
  },
  unborn: {
    label: "arm5e.spell.targets.unborn",
    dtype: "String",
    source: "AM",
    impact: 0
  },

  inscription: {
    label: "arm5e.spell.targets.inscription",
    dtype: "String",
    source: "AM",
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
    days: { label: "arm5e.magic.arcaneConnection.days", bonus: 1 },
    months: { label: "arm5e.magic.arcaneConnection.months", bonus: 2 },
    decades: { label: "arm5e.magic.arcaneConnection.decades", bonus: 3 },
    indef: { label: "arm5e.magic.arcaneConnection.indefinitly", bonus: 4 }
  },
  sympathy: {
    low: { label: "arm5e.magic.sympathy.weak", bonus: 1 },
    high: { label: "arm5e.magic.sympathy.strong", bonus: 2 }
  }
};

ARM5E.item = {};

ARM5E.item.costs = {
  "n-a": {
    label: "arm5e.sheet.n-a"
  },
  inexp: {
    label: "arm5e.sheet.inexpensive"
  },
  std: {
    label: "arm5e.sheet.standard"
  },
  exp: {
    label: "arm5e.sheet.expensive"
  }
};

ARM5E.activities = {};

ARM5E.activities.generic = {
  none: {
    label: "arm5e.activity.diary",
    display: { tab: false, progress: false },
    source: { default: 0, readonly: true },
    maxXp: 0,
    bonusOptions: null,
    validation: null,
    secondaryFilter: null
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
    secondaryFilter: null
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
    secondaryFilter: null
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
    source: { default: 4, readonly: true },
    maxXp: 0,
    bonusOptions: {
      standard: { label: "arm5e.generic.standard", modifier: 0 },
      language: { label: "arm5e.activity.options.language", modifier: 4 },
      area: { label: "arm5e.activity.options.area", modifier: 3 },
      forced: { label: "arm5e.activity.options.forced", modifier: 1 },
      mastery: { label: "arm5e.activity.options.mastery", modifier: 1 }
    },
    validation: validPractice,
    secondaryFilter: null
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
    secondaryFilter: null
  },
  teaching: {
    label: "arm5e.activity.teaching",
    display: {
      tab: false,
      progress: true,
      abilities: true,
      arts: true,
      masteries: true,
      spells: true
    },
    source: { default: null, readonly: true },
    maxXp: 0,
    bonusOptions: {
      standard: { label: "arm5e.generic.standard", modifier: 0 },
      singleStudent: { label: "arm5e.activity.options.singleStudent", modifier: 6 },
      twoStudents: { label: "arm5e.activity.options.twoStudents", modifier: 3 }
    },
    validation: validTeaching,
    secondaryFilter: null
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
    secondaryFilter: null
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
    secondaryFilter: null
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
    secondaryFilter: null
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
    secondaryFilter: null
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
      choosable: "disabled"
    },
    source: { default: 0, readonly: true },
    maxXp: 0,
    bonusOptions: null,
    validation: validReading,
    secondaryFilter: null
  },
  learnSpell: {
    label: "arm5e.activity.spellLearning",
    display: {
      tab: true,
      progress: true,
      abilities: false,
      arts: true,
      masteries: true,
      spells: true,
      choosable: "disabled"
    },
    source: { default: 0, readonly: true },
    maxXp: 0,
    bonusOptions: null,
    validation: validReading,
    secondaryFilter: null
  },
  aging: {
    label: "arm5e.activity.aging",
    display: {
      tab: false,
      progress: false,
      abilities: true,
      arts: false,
      masteries: false,
      spells: false,
      choosable: "disabled"
    },
    source: { default: 0, readonly: true },
    maxXp: 0,
    bonusOptions: null,
    validation: null,
    secondaryFilter: null
  }
};

ARM5E.books = {};
ARM5E.books.types = ["Summa", "Tractatus"];
ARM5E.books.categories = {
  art: "arm5e.sheet.art",
  ability: "arm5e.sheet.ability",
  mastery: "arm5e.activity.options.mastery",
  labText: "ITEM.TypeLaboratorytext"
};

ARM5E.activities.lab = {
  art: "arm5e.lab.art",
  magicTheory: "arm5e.lab.magicTheory",
  inventSpell: "arm5e.lab.InventSpell",
  openEnchantment: "arm5e.lab.openEnchantment",
  longevityPotion: "arm5e.lab.longevityPotion",
  minorEnchantment: "arm5e.lab.minorEnchantment",
  majorEnchantment: "arm5e.lab.majorEnchantment"
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
  crisis: { desc: "arm5e.aging.roll.crisis", impact: 42 }
};

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
  1: "arm5e.lab.enchantment.item.expiry.never",
  10: "arm5e.lab.enchantment.item.expiry.1y",
  5: "arm5e.lab.enchantment.item.expiry.7y",
  2: "arm5e.lab.enchantment.item.expiry.70y"
};

ARM5E.lab.enchantment.status = {
  0: "arm5e.lab.enchantment.item.inert",
  1: "arm5e.lab.enchantment.item.prepared",
  2: "arm5e.lab.enchantment.item.enchanted",
  3: "arm5e.lab.enchantment.item.opened"
};

ARM5E.lab.enchantment.materialBase = {
  1: {
    value: 1,
    eg: "arm5e.lab.enchantment.item.material.base1"
  },
  2: {
    value: 2,
    eg: "arm5e.lab.enchantment.item.material.base2"
  },
  3: {
    value: 3,
    eg: "arm5e.lab.enchantment.item.material.base3"
  },
  4: {
    value: 4,
    eg: "arm5e.lab.enchantment.item.material.base4"
  },
  5: {
    value: 5,
    eg: "arm5e.lab.enchantment.item.material.base5"
  },
  6: {
    value: 6,
    eg: "arm5e.lab.enchantment.item.material.base6"
  },
  10: {
    value: 10,
    eg: "arm5e.lab.enchantment.item.material.base10"
  },
  12: {
    value: 12,
    eg: "arm5e.lab.enchantment.item.material.base12"
  },
  15: {
    value: 15,
    eg: "arm5e.lab.enchantment.item.material.base15"
  },
  20: {
    value: 20,
    eg: "arm5e.lab.enchantment.item.material.base20"
  }
};

ARM5E.lab.enchantment.sizeMultiplier = {
  1: {
    eg: "arm5e.lab.enchantment.item.size.tiny-eg",
    value: "arm5e.lab.enchantment.item.size.tiny"
  },
  2: {
    eg: "arm5e.lab.enchantment.item.size.small-eg",
    value: "arm5e.lab.enchantment.item.size.small"
  },
  3: {
    eg: "arm5e.lab.enchantment.item.size.medium-eg",
    value: "arm5e.lab.enchantment.item.size.medium"
  },
  4: {
    eg: "arm5e.lab.enchantment.item.size.large-eg",
    value: "arm5e.lab.enchantment.item.size.large"
  },
  5: {
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
ARM5E.lab.enchantment.status = {
  0: "To be enchanted",
  1: "Opened for enchantment",
  2: "Enchanted"
};

ARM5E.generic = {};
ARM5E.generic.sourcesTypes = {
  custom: {
    label: "arm5e.sheet.source.custom",
    value: true,
    edit: "disabled"
  },
  ArM5: {
    label: "arm5e.sheet.source.ArM5",
    value: true,
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
  Hook: {
    label: "arm5e.sheet.source.Hooks"
  }
};
