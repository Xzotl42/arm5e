// Rule: all subtypes of a given type must have a different "key" value or it becomes impossible to edit them properly
export default {
  none: {
    category: "none",
    type: "none",
    mnemonic: "arm5e.sheet.activeEffect.types.nullEffect",
    subtypes: {
      none: {
        mnemonic: "arm5e.sheet.activeEffect.types.nullEffect",
        key: "",
        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM
      }
    }
  },
  spellcasting: {
    category: "magic",
    type: "spellcasting",
    mnemonic: "arm5e.sheet.activeEffect.type.spellcasting",
    subtypes: {
      voiceLoud: {
        mnemonic: "arm5e.sheet.magic.voiceType.loud",
        key: "system.stances.voice.loud",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        default: 1
      },
      voiceFirm: {
        mnemonic: "arm5e.sheet.magic.voiceType.firm",
        key: "system.stances.voice.firm",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        default: 0
      },
      voiceQuiet: {
        mnemonic: "arm5e.sheet.magic.voiceType.quiet",
        key: "system.stances.voice.quiet",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        default: 0
      },
      voiceSilent: {
        mnemonic: "arm5e.sheet.magic.voiceType.silent",
        key: "system.stances.voice.silent",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        default: -5
      },
      gesturesExaggerated: {
        mnemonic: "arm5e.sheet.magic.gesturesType.exaggerated",
        key: "system.stances.gestures.exaggerated",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        default: 1
      },
      gesturesBold: {
        mnemonic: "arm5e.sheet.magic.gesturesType.bold",
        key: "system.stances.gestures.bold",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        default: 0
      },
      gesturesSubtle: {
        mnemonic: "arm5e.sheet.magic.gesturesType.subtle",
        key: "system.stances.gestures.subtle",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        default: 0
      },
      gesturesMotionless: {
        mnemonic: "arm5e.sheet.magic.gesturesType.motionless",
        key: "system.stances.gestures.motionless",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        default: -2
      }
      // spontDivider: {
      //   mnemonic: "arm5e.sheet.activeEffect.subtypes.spontDivider",
      //   key: "system.bonuses.arts.spontDivider",
      //   mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      //   default: 2
      // },
      // spontDividerNoFatigue: {
      //   mnemonic: "arm5e.sheet.activeEffect.subtypes.spontDividerNoFatigue",
      //   key: "system.bonuses.arts.spontDividerNoFatigue",
      //   mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      //   default: 5
      // },
      // aura: {
      //   mnemonic: "arm5e.sheet.magic.aura",
      //   key: "system.bonuses.arts.spellcasting",
      //   mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      //   default: 0 //,
      //   // option: "mundane"
      // }
      // optional: {
      //   mnemonic: "arm5e.sheet.activeEffect.types.optional",
      //   key: "system.bonuses.arts.spellcasting",
      //   mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      //   default: 0,
      //   optional: true
      // }
    }
  },
  activities: {
    category: "progress",
    type: "activities",
    mnemonic: "arm5e.activity.label",
    subtypes: {
      adventuring: {
        mnemonic: "arm5e.activity.adventuring",
        key: "system.bonuses.activities.adventuring",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 3
      },
      practice: {
        mnemonic: "arm5e.activity.practice",
        key: "system.bonuses.activities.practice",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 3
      },
      training: {
        mnemonic: "arm5e.activity.training",
        key: "system.bonuses.activities.training",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 5
      },
      teaching: {
        mnemonic: "arm5e.activity.teaching",
        key: "system.bonuses.activities.teaching",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 5
      },
      teacher: {
        mnemonic: "arm5e.activity.teacher.label",
        key: "system.bonuses.activities.teacher",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 5
      },
      writing: {
        mnemonic: "arm5e.activity.writing",
        key: "system.bonuses.activities.writing",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 3
      },
      reading: {
        mnemonic: "arm5e.activity.reading",
        key: "system.bonuses.activities.reading",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 3
      },
      visStudy: {
        mnemonic: "arm5e.activity.visStudy",
        key: "system.bonuses.activities.visStudy",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      }
      // divider: {
      //   mnemonic: "arm5e.activity.visStudy",
      //   key: "system.system.penalties.activityDivider",
      //   mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      //   default: 2,
      //   internal: true
      // }
    }
  },
  spellmastery: {
    category: "magic",
    type: "spellmastery",
    mnemonic: "arm5e.sheet.activeEffect.types.spellmastery",
    subtypes: {
      xpCoeff: {
        mnemonic: "arm5e.sheet.activeEffect.subtypes.xpcoeff",
        key: "system.bonuses.arts.masteryXpCoeff",
        mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
        default: 2.0
      },
      xpMod: {
        mnemonic: "arm5e.sheet.activeEffect.subtypes.xpmod",
        key: "system.bonuses.arts.masteryXpMod",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 5
      }
    }
  },
  art: {
    category: "magic",
    type: "art",
    mnemonic: "arm5e.sheet.arts",
    subtypes: {
      cr: {
        mnemonic: "Creo",
        key: "system.arts.techniques.cr.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 3
      },
      in: {
        mnemonic: "Intellego",
        key: "system.arts.techniques.in.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 3
      },
      mu: {
        mnemonic: "Muto",
        key: "system.arts.techniques.mu.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 3
      },
      pe: {
        mnemonic: "Perdo",
        key: "system.arts.techniques.pe.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 3
      },
      re: {
        mnemonic: "Rego",
        key: "system.arts.techniques.re.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 3
      },
      an: {
        mnemonic: "Animal",
        key: "system.arts.forms.an.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 3
      },
      aq: {
        mnemonic: "Aquam",
        key: "system.arts.forms.aq.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 3
      },
      au: {
        mnemonic: "Auram",
        key: "system.arts.forms.au.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 3
      },
      co: {
        mnemonic: "Corpus",
        key: "system.arts.forms.co.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 3
      },
      he: {
        mnemonic: "Herbam",
        key: "system.arts.forms.he.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 3
      },
      ig: {
        mnemonic: "Ignem",
        key: "system.arts.forms.ig.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 3
      },
      im: {
        mnemonic: "Imaginem",
        key: "system.arts.forms.im.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 3
      },
      me: {
        mnemonic: "Mentem",
        key: "system.arts.forms.me.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 3
      },
      te: {
        mnemonic: "Terram",
        key: "system.arts.forms.te.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 3
      },
      vi: {
        mnemonic: "Vim",
        key: "system.arts.forms.vi.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 3
      }
    }
  },

  affinity: {
    category: "magic",
    type: "affinity",
    mnemonic: "arm5e.sheet.activeEffect.types.arts.affinity",
    subtypes: {
      cr: {
        mnemonic: "Creo",
        key: "system.arts.techniques.cr.xpCoeff",
        mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
        default: 1.5
      },
      in: {
        mnemonic: "Intellego",
        key: "system.arts.techniques.in.xpCoeff",
        mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
        default: 1.5
      },
      mu: {
        mnemonic: "Muto",
        key: "system.arts.techniques.mu.xpCoeff",
        mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
        default: 1.5
      },
      pe: {
        mnemonic: "Perdo",
        key: "system.arts.techniques.pe.xpCoeff",
        mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
        default: 1.5
      },
      re: {
        mnemonic: "Rego",
        key: "system.arts.techniques.re.xpCoeff",
        mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
        default: 1.5
      },
      an: {
        mnemonic: "Animal",
        key: "system.arts.forms.an.xpCoeff",
        mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
        default: 1.5
      },
      aq: {
        mnemonic: "Aquam",
        key: "system.arts.forms.aq.xpCoeff",
        mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
        default: 1.5
      },
      au: {
        mnemonic: "Auram",
        key: "system.arts.forms.au.xpCoeff",
        mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
        default: 1.5
      },
      co: {
        mnemonic: "Corpus",
        key: "system.arts.forms.co.xpCoeff",
        mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
        default: 1.5
      },
      he: {
        mnemonic: "Herbam",
        key: "system.arts.forms.he.xpCoeff",
        mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
        default: 1.5
      },
      ig: {
        mnemonic: "Ignem",
        key: "system.arts.forms.ig.xpCoeff",
        mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
        default: 1.5
      },
      im: {
        mnemonic: "Imaginem",
        key: "system.arts.forms.im.xpCoeff",
        mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
        default: 1.5
      },
      me: {
        mnemonic: "Mentem",
        key: "system.arts.forms.me.xpCoeff",
        mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
        default: 1.5
      },
      te: {
        mnemonic: "Terram",
        key: "system.arts.forms.te.xpCoeff",
        mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
        default: 1.5
      },
      vi: {
        mnemonic: "Vim",
        key: "system.arts.forms.vi.xpCoeff",
        mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
        default: 1.5
      }
    }
  },

  deficiency: {
    category: "magic",
    type: "artDeficiency",
    mnemonic: "arm5e.sheet.activeEffect.types.arts.deficiency",
    subtypes: {
      cr: {
        mnemonic: "Creo",
        key: "system.arts.techniques.cr.deficient",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        default: true,
        readonly: true
      },
      in: {
        mnemonic: "Intellego",
        key: "system.arts.techniques.in.deficient",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        default: true,
        readonly: true
      },
      mu: {
        mnemonic: "Muto",
        key: "system.arts.techniques.mu.deficient",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        default: true,
        readonly: true
      },
      pe: {
        mnemonic: "Perdo",
        key: "system.arts.techniques.pe.deficient",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        default: true,
        readonly: true
      },
      re: {
        mnemonic: "Rego",
        key: "system.arts.techniques.re.deficient",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        default: true,
        readonly: true
      },
      an: {
        mnemonic: "Animal",
        key: "system.arts.forms.an.deficient",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        default: true,
        readonly: true
      },
      aq: {
        mnemonic: "Aquam",
        key: "system.arts.forms.aq.deficient",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        default: true,
        readonly: true
      },
      au: {
        mnemonic: "Auram",
        key: "system.arts.forms.au.deficient",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        default: true,
        readonly: true
      },
      co: {
        mnemonic: "Corpus",
        key: "system.arts.forms.co.deficient",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        default: true,
        readonly: true
      },
      he: {
        mnemonic: "Herbam",
        key: "system.arts.forms.he.deficient",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        default: true,
        readonly: true
      },
      ig: {
        mnemonic: "Ignem",
        key: "system.arts.forms.ig.deficient",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        default: true,
        readonly: true
      },
      im: {
        mnemonic: "Imaginem",
        key: "system.arts.forms.im.deficient",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        default: true,
        readonly: true
      },
      me: {
        mnemonic: "Mentem",
        key: "system.arts.forms.me.deficient",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        default: true,
        readonly: true
      },
      te: {
        mnemonic: "Terram",
        key: "system.arts.forms.te.deficient",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        default: true,
        readonly: true
      },
      vi: {
        mnemonic: "Vim",
        key: "system.arts.forms.vi.deficient",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        default: true,
        readonly: true
      }
    }
  },
  formResistance: {
    category: "traits",
    type: "formResistance",
    mnemonic: "arm5e.sheet.activeEffect.types.formResistance",
    subtypes: {
      an: {
        mnemonic: "Animal",
        key: "system.bonuses.resistance.an",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      },
      aq: {
        mnemonic: "Aquam",
        key: "system.bonuses.resistance.aq",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      },
      au: {
        mnemonic: "Auram",
        key: "system.bonuses.resistance.au",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      },
      co: {
        mnemonic: "Corpus",
        key: "system.bonuses.resistance.co",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      },
      he: {
        mnemonic: "Herbam",
        key: "system.bonuses.resistance.he",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      },
      ig: {
        mnemonic: "Ignem",
        key: "system.bonuses.resistance.ig",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      },
      im: {
        mnemonic: "Imaginem",
        key: "system.bonuses.resistance.im",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      },
      me: {
        mnemonic: "Mentem",
        key: "system.bonuses.resistance.me",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      },
      te: {
        mnemonic: "Terram",
        key: "system.bonuses.resistance.te",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      },
      vi: {
        mnemonic: "Vim",
        key: "system.bonuses.resistance.vi",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      }
    }
  },
  vitals: {
    category: "traits",
    type: "vitals",
    mnemonic: "arm5e.sheet.activeEffect.types.vitals",
    subtypes: {
      size: {
        mnemonic: "arm5e.sheet.size",
        key: "system.vitals.siz.value",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 1
      },
      soak: {
        mnemonic: "arm5e.sheet.soak",
        key: "system.bonuses.traits.soak",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 3
      },
      age: {
        mnemonic: "arm5e.sheet.age",
        key: "system.age.value",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      },
      aging: {
        mnemonic: "arm5e.sheet.aging",
        key: "system.bonuses.traits.aging",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      },
      agingStart: {
        mnemonic: "arm5e.sheet.agingStart",
        key: "system.bonuses.traits.agingStart",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      },
      recovery: {
        mnemonic: "arm5e.activity.recovery",
        key: "system.bonuses.traits.recovery",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      },
      might: {
        mnemonic: "arm5e.sheet.might",
        key: "system.might.value",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      }
    }
  },
  characteristics: {
    category: "traits",
    type: "characteristics",
    mnemonic: "arm5e.sheet.activeEffect.types.characteristics",
    subtypes: {
      int: {
        mnemonic: "arm5e.sheet.intelligence",
        key: "system.characteristics.int.value",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      },
      per: {
        mnemonic: "arm5e.sheet.perception",
        key: "system.characteristics.per.value",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      },
      str: {
        mnemonic: "arm5e.sheet.strength",
        key: "system.characteristics.str.value",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      },
      sta: {
        mnemonic: "arm5e.sheet.stamina",
        key: "system.characteristics.sta.value",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      },
      pre: {
        mnemonic: "arm5e.sheet.presence",
        key: "system.characteristics.pre.value",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      },
      com: {
        mnemonic: "arm5e.sheet.communication",
        key: "system.characteristics.com.value",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      },
      dex: {
        mnemonic: "arm5e.sheet.dexterity",
        key: "system.characteristics.dex.value",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      },
      qik: {
        mnemonic: "arm5e.sheet.quickness",
        key: "system.characteristics.qik.value",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      }
    }
  },
  fatigue: {
    category: "traits",
    type: "fatigue",
    mnemonic: "arm5e.sheet.activeEffect.types.fatigue",
    subtypes: {
      total: {
        mnemonic: "arm5e.sheet.activeEffect.subtypes.fatigueTotal",
        key: "system.bonuses.traits.fatigue",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      },
      winded: {
        mnemonic: "arm5e.sheet.winded",
        key: "system.fatigue.winded.number",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      },
      weary: {
        mnemonic: "arm5e.sheet.weary",
        key: "system.fatigue.weary.number",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      },
      tired: {
        mnemonic: "arm5e.sheet.tired",
        key: "system.fatigue.tired.number",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      },
      dazed: {
        mnemonic: "arm5e.sheet.dazed",
        key: "system.fatigue.dazed.number",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      },
      windedLevel: {
        mnemonic: "arm5e.sheet.windedLvl",
        key: "system.fatigue.winded.amount",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      },
      wearyLevel: {
        mnemonic: "arm5e.sheet.wearyLvl",
        key: "system.fatigue.weary.amount",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      },
      tiredLevel: {
        mnemonic: "arm5e.sheet.tiredLvl",
        key: "system.fatigue.tired.amount",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      },
      dazedLevel: {
        mnemonic: "arm5e.sheet.dazedLvl",
        key: "system.fatigue.dazed.amount",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      }
    }
  },
  wounds: {
    category: "traits",
    type: "wounds",
    mnemonic: "arm5e.sheet.activeEffect.types.wounds",
    subtypes: {
      total: {
        mnemonic: "arm5e.sheet.activeEffect.subtypes.woundsTotal",
        key: "system.bonuses.traits.wounds",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      },
      light: {
        mnemonic: "arm5e.sheet.light",
        key: "system.penalties.wounds.light",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      },
      medium: {
        mnemonic: "arm5e.sheet.medium",
        key: "system.penalties.wounds.medium",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      },
      heavy: {
        mnemonic: "arm5e.sheet.heavy",
        key: "system.penalties.wounds.heavy",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      }
    }
  },
  realm: {
    category: "magic",
    type: "realm",
    mnemonic: "arm5e.sheet.activeEffect.types.realmAlignment",
    subtypes: {
      magic: {
        mnemonic: "arm5e.sheet.realm.magic",
        key: "system.realms.magic.aligned",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        default: true
      },
      faeric: {
        mnemonic: "arm5e.sheet.realm.faeric",
        key: "system.realms.faeric.aligned",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        default: true
      },
      divine: {
        mnemonic: "arm5e.sheet.realm.divine",
        key: "system.realms.divine.aligned",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        default: true
      },
      infernal: {
        mnemonic: "arm5e.sheet.realm.infernal",
        key: "system.realms.infernal.aligned",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        default: true
      }
    }
  },
  characterFeatures: {
    category: "character",
    type: "characterFeatures",
    mnemonic: "Character features",
    subtypes: {
      magicSystem: {
        mnemonic: "arm5e.feature.magicSystem",
        key: "system.features.magicSystem",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        default: true
      }
    }
  },
  bonusGeneralAbility: {
    category: "abilities",
    type: "bonusGeneralAbility",
    mnemonic: "arm5e.sheet.activeEffect.types.generalAbilitiesBonus",
    subtypes: {
      animalHandling: {
        mnemonic: "arm5e.skill.general.animalHandling",
        key: "system.bonuses.skills.animalHandling.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      areaLore: {
        mnemonic: "arm5e.skill.general.areaLore",
        key: "system.bonuses.skills.areaLore_#OPTION#.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2,
        option: "areaName"
      },
      athletics: {
        mnemonic: "arm5e.skill.general.athletics",
        key: "system.bonuses.skills.athletics.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      awareness: {
        mnemonic: "arm5e.skill.general.awareness",
        key: "system.bonuses.skills.awareness.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      bargain: {
        mnemonic: "arm5e.skill.general.bargain",
        key: "system.bonuses.skills.bargain.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      brawl: {
        mnemonic: "arm5e.skill.general.brawl",
        key: "system.bonuses.skills.brawl.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      carouse: {
        mnemonic: "arm5e.skill.general.carouse",
        key: "system.bonuses.skills.carouse.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      charm: {
        mnemonic: "arm5e.skill.general.charm",
        key: "system.bonuses.skills.charm.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      concentration: {
        mnemonic: "arm5e.skill.general.concentration",
        key: "system.bonuses.skills.concentration.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      craft: {
        mnemonic: "arm5e.skill.general.craft",
        key: "system.bonuses.skills.craft_#OPTION#.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2,
        option: "craftName"
      },
      etiquette: {
        mnemonic: "arm5e.skill.general.etiquette",
        key: "system.bonuses.skills.etiquette.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      folkKen: {
        mnemonic: "arm5e.skill.general.folkKen",
        key: "system.bonuses.skills.folkKen.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      guile: {
        mnemonic: "arm5e.skill.general.guile",
        key: "system.bonuses.skills.guile.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      hunt: {
        mnemonic: "arm5e.skill.general.hunt",
        key: "system.bonuses.skills.hunt.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      intrigue: {
        mnemonic: "arm5e.skill.general.intrigue",
        key: "system.bonuses.skills.intrigue.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      leadership: {
        mnemonic: "arm5e.skill.general.leadership",
        key: "system.bonuses.skills.leadership.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      legerdemain: {
        mnemonic: "arm5e.skill.general.legerdemain",
        key: "system.bonuses.skills.legerdemain.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      livingLanguage: {
        mnemonic: "arm5e.skill.general.livingLanguage",
        key: "system.bonuses.skills.livingLanguage_#OPTION#.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2,
        option: "languageName"
      },
      music: {
        mnemonic: "arm5e.skill.general.music",
        key: "system.bonuses.skills.music.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      organizationLore: {
        mnemonic: "arm5e.skill.general.organizationLore",
        key: "system.bonuses.skills.organizationLore_#OPTION#.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2,
        option: "organizationName"
      },
      profession: {
        mnemonic: "arm5e.skill.general.profession",
        key: "system.bonuses.skills.profession_#OPTION#.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2,
        option: "professionName"
      },
      ride: {
        mnemonic: "arm5e.skill.general.ride",
        key: "system.bonuses.skills.ride.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      stealth: {
        mnemonic: "arm5e.skill.general.stealth",
        key: "system.bonuses.skills.stealth.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      survival: {
        mnemonic: "arm5e.skill.general.survival",
        key: "system.bonuses.skills.survival.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      swim: {
        mnemonic: "arm5e.skill.general.swim",
        key: "system.bonuses.skills.swim.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      teaching: {
        mnemonic: "arm5e.skill.general.teaching",
        key: "system.bonuses.skills.teaching.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      }
    }
  },
  bonusArcaneAbility: {
    category: "abilities",
    type: "bonusArcaneAbility",
    mnemonic: "arm5e.sheet.activeEffect.types.arcaneAbilitiesBonus",
    subtypes: {
      hermeticCode: {
        mnemonic: "arm5e.skill.arcane.hermeticCode",
        key: "system.bonuses.skills.hermeticCode.bonus",
        mode: 2,
        default: 2
      },
      dominionLore: {
        mnemonic: "arm5e.skill.arcane.dominionLore",
        key: "system.bonuses.skills.dominionLore.bonus",
        mode: 2,
        default: 2
      },
      faerieLore: {
        mnemonic: "arm5e.skill.arcane.faerieLore",
        key: "system.bonuses.skills.faerieLore.bonus",
        mode: 2,
        default: 2
      },
      finesse: {
        mnemonic: "arm5e.skill.arcane.finesse",
        key: "system.bonuses.skills.finesse.bonus",
        mode: 2,
        default: 2
      },
      infernalLore: {
        mnemonic: "arm5e.skill.arcane.infernalLore",
        key: "system.bonuses.skills.infernalLore.bonus",
        mode: 2,
        default: 2
      },
      magicLore: {
        mnemonic: "arm5e.skill.arcane.magicLore",
        key: "system.bonuses.skills.magicLore.bonus",
        mode: 2,
        default: 2
      },
      magicTheory: {
        mnemonic: "arm5e.skill.arcane.magicTheory",
        key: "system.bonuses.skills.magicTheory.bonus",
        mode: 2,
        default: 2
      },
      parma: {
        mnemonic: "arm5e.skill.arcane.parma",
        key: "system.bonuses.skills.parma.bonus",
        mode: 2,
        default: 2
      },
      penetration: {
        mnemonic: "arm5e.skill.arcane.penetration",
        key: "system.bonuses.skills.penetration.bonus",
        mode: 2,
        default: 2
      }
    }
  },
  bonusAcademicAbility: {
    category: "abilities",
    type: "bonusAcademicAbility",
    mnemonic: "arm5e.sheet.activeEffect.types.academicAbilitiesBonus",
    subtypes: {
      artesLib: {
        mnemonic: "arm5e.skill.academic.artesLib",
        key: "system.bonuses.skills.artesLib.bonus",
        mode: 2,
        default: 2
      },
      // civilCanonLaw: {
      //   mnemonic: "arm5e.skill.academic.civilCanonLaw",
      //   key: "system.bonuses.skills.civilCanonLaw.bonus",
      //   mode: 2,
      //   default: 2
      // },
      // commonLaw: {
      //   mnemonic: "arm5e.skill.academic.commonLaw",
      //   key: "system.bonuses.skills.commonLaw.bonus",
      //   mode: 2,
      //   default: 2
      // },
      law: {
        abel: "arm5e.skill.academic.law",
        key: "system.bonuses.skills.law_#OPTION#.bonus",
        mode: 2,
        default: 2,
        option: "legalForum"
      },
      deadLanguage: {
        mnemonic: "arm5e.skill.academic.deadLanguage",
        key: "system.bonuses.skills.deadLanguage_#OPTION#.bonus",
        mode: 2,
        default: 2,
        option: "languageName"
      },
      medicine: {
        mnemonic: "arm5e.skill.academic.medicine",
        key: "system.bonuses.skills.medicine.bonus",
        mode: 2,
        default: 2
      },
      philosophy: {
        mnemonic: "arm5e.skill.academic.philosophy",
        key: "system.bonuses.skills.philosophy.bonus",
        mode: 2,
        default: 2
      },
      theology: {
        mnemonic: "arm5e.skill.academic.theology",
        key: "system.bonuses.skills.theology.bonus",
        mode: 2,
        default: 2
      }
    }
  },
  bonusMartialAbility: {
    category: "abilities",
    type: "bonusMartialAbility",
    mnemonic: "arm5e.sheet.activeEffect.types.martialAbilitiesBonus",
    subtypes: {
      bows: {
        mnemonic: "arm5e.skill.martial.bows",
        key: "system.bonuses.skills.bows.bonus",
        mode: 2,
        default: 2
      },
      singleWeapon: {
        mnemonic: "arm5e.skill.martial.singleWeapon",
        key: "system.bonuses.skills.singleWeapon.bonus",
        mode: 2,
        default: 2
      },
      greatWeapon: {
        mnemonic: "arm5e.skill.martial.greatWeapon",
        key: "system.bonuses.skills.greatWeapon.bonus",
        mode: 2,
        default: 2
      },
      trownWeapon: {
        mnemonic: "arm5e.skill.martial.trownWeapon",
        key: "system.bonuses.skills.trownWeapon.bonus",
        mode: 2,
        default: 2
      }
    }
  },
  bonusMysteryAbility: {
    category: "abilities",
    type: "bonusMysteryAbility",
    mnemonic: "arm5e.sheet.activeEffect.types.mysteryAbilitiesBonus",
    subtypes: {
      enigma: {
        mnemonic: "arm5e.skill.mystery.enigma",
        key: "system.bonuses.skills.enigma.bonus",
        mode: 2,
        default: 2
      },
      faerieMagic: {
        mnemonic: "arm5e.skill.mystery.faerieMagic",
        key: "system.bonuses.skills.faerieMagic.bonus",
        mode: 2,
        default: 2
      },
      heartbeast: {
        mnemonic: "arm5e.skill.mystery.heartbeast",
        key: "system.bonuses.skills.heartbeast.bonus",
        mode: 2,
        default: 2
      },
      verditiusMagic: {
        mnemonic: "arm5e.skill.mystery.verditiusMagic",
        key: "system.bonuses.skills.verditiusMagic.bonus",
        mode: 2,
        default: 2
      },
      cult: {
        mnemonic: "arm5e.skill.mystery.cult",
        key: "system.bonuses.skills.cult_#OPTION#.bonus",
        mode: 2,
        default: 2,
        option: "cultName"
      }
    }
  },
  bonusSupernaturalAbility: {
    category: "abilities",
    type: "bonusSupernaturalAbility",
    mnemonic: "arm5e.sheet.activeEffect.types.supernaturalAbilitiesBonus",
    subtypes: {
      animalKen: {
        mnemonic: "arm5e.skill.supernatural.animalKen",
        key: "system.bonuses.skills.animalKen.bonus",
        mode: 2,
        default: 2
      },
      dowsing: {
        mnemonic: "arm5e.skill.supernatural.dowsing",
        key: "system.bonuses.skills.dowsing.bonus",
        mode: 2,
        default: 2
      },
      enchantingMusic: {
        mnemonic: "arm5e.skill.supernatural.enchantingMusic",
        key: "system.bonuses.skills.enchantingMusic.bonus",
        mode: 2,
        default: 2
      },
      entrancement: {
        mnemonic: "arm5e.skill.supernatural.entrancement",
        key: "system.bonuses.skills.entrancement.bonus",
        mode: 2,
        default: 2
      },
      magicSensitivity: {
        mnemonic: "arm5e.skill.supernatural.magicSensitivity",
        key: "system.bonuses.skills.magicSensitivity.bonus",
        mode: 2,
        default: 2
      },
      premonitions: {
        mnemonic: "arm5e.skill.supernatural.premonitions",
        key: "system.bonuses.skills.premonitions.bonus",
        mode: 2,
        default: 2
      },
      secondSight: {
        mnemonic: "arm5e.skill.supernatural.secondSight",
        key: "system.bonuses.skills.secondSight.bonus",
        mode: 2,
        default: 2
      },
      senseHolyAndUnholy: {
        mnemonic: "arm5e.skill.supernatural.senseHolyAndUnholy",
        key: "system.bonuses.skills.senseHolyAndUnholy.bonus",
        mode: 2,
        default: 2
      },
      shapeshifter: {
        mnemonic: "arm5e.skill.supernatural.shapeshifter",
        key: "system.bonuses.skills.shapeshifter.bonus",
        mode: 2,
        default: 2
      },
      supernatural: {
        mnemonic: "arm5e.skill.supernatural.generic",
        key: "system.bonuses.skills.supernatural_#OPTION#.bonus",
        mode: 2,
        default: 2,
        option: "supernaturalAbilityName"
      },
      wildernessSense: {
        mnemonic: "arm5e.skill.supernatural.wildernessSense",
        key: "system.bonuses.skills.wildernessSense.bonus",
        mode: 2,
        default: 2
      }
    }
  },
  bonusAlternateArt: {
    category: "abilities",
    type: "bonusAlternateArt",
    mnemonic: "arm5e.sheet.activeEffect.types.AlternateArtBonus",
    subtypes: {
      technique: {
        mnemonic: "arm5e.skill.generic.technique",
        key: "system.bonuses.skills.technique_#OPTION#.bonus",
        mode: 2,
        default: 2,
        option: "techniqueName"
      },
      form: {
        mnemonic: "arm5e.skill.generic.form",
        key: "system.bonuses.skills.form_#OPTION#.bonus",
        mode: 2,
        default: 2,
        option: "formName"
      }
    }
  },
  xpBonusSupernaturalAbility: {
    category: "abilities",
    type: "xpBonusSupernaturalAbility",
    mnemonic: "arm5e.sheet.activeEffect.types.supernaturalAbilitiesXPBonus",
    subtypes: {
      animalKen: {
        mnemonic: "arm5e.skill.supernatural.animalKen",
        key: "system.bonuses.skills.animalKen.xpMod",
        mode: 2,
        default: 5
      },
      dowsing: {
        mnemonic: "arm5e.skill.supernatural.dowsing",
        key: "system.bonuses.skills.dowsing.xpMod",
        mode: 2,
        default: 5
      },
      enchantingMusic: {
        mnemonic: "arm5e.skill.supernatural.enchantingMusic",
        key: "system.bonuses.skills.enchantingMusic.xpMod",
        mode: 2,
        default: 5
      },
      entrancement: {
        mnemonic: "arm5e.skill.supernatural.entrancement",
        key: "system.bonuses.skills.entrancement.xpMod",
        mode: 2,
        default: 5
      },
      magicSensitivity: {
        mnemonic: "arm5e.skill.supernatural.magicSensitivity",
        key: "system.bonuses.skills.magicSensitivity.xpMod",
        mode: 2,
        default: 5
      },
      premonitions: {
        mnemonic: "arm5e.skill.supernatural.premonitions",
        key: "system.bonuses.skills.premonitions.xpMod",
        mode: 2,
        default: 5
      },
      secondSight: {
        mnemonic: "arm5e.skill.supernatural.secondSight",
        key: "system.bonuses.skills.secondSight.xpMod",
        mode: 2,
        default: 5
      },
      senseHolyAndUnholy: {
        mnemonic: "arm5e.skill.supernatural.senseHolyAndUnholy",
        key: "system.bonuses.skills.senseHolyAndUnholy.xpMod",
        mode: 2,
        default: 5
      },
      shapeshifter: {
        mnemonic: "arm5e.skill.supernatural.shapeshifter",
        key: "system.bonuses.skills.shapeshifter.xpMod",
        mode: 2,
        default: 5
      },
      supernatural: {
        mnemonic: "arm5e.skill.supernatural.generic",
        key: "system.bonuses.skills.supernatural_#OPTION#.xpMod",
        mode: 2,
        default: 5,
        option: "supernaturalAbilityName"
      },
      wildernessSense: {
        mnemonic: "arm5e.skill.supernatural.wildernessSense",
        key: "system.bonuses.skills.wildernessSense.xpMod",
        mode: 2,
        default: 5
      }
    }
  },
  affinityGeneralAbility: {
    category: "abilities",
    type: "affinityGeneralAbility",
    mnemonic: "arm5e.sheet.activeEffect.types.generalAbilitiesAffinity",
    subtypes: {
      animalHandling: {
        mnemonic: "arm5e.skill.general.animalHandling",
        key: "system.bonuses.skills.animalHandling.xpCoeff",
        mode: 1,
        default: 1.5
      },
      areaLore: {
        mnemonic: "arm5e.skill.general.areaLore",
        key: "system.bonuses.skills.areaLore_#OPTION#.xpCoeff",
        mode: 1,
        default: 1.5,
        option: "areaName"
      },
      athletics: {
        mnemonic: "arm5e.skill.general.athletics",
        key: "system.bonuses.skills.athletics.xpCoeff",
        mode: 1,
        default: 1.5
      },
      awareness: {
        mnemonic: "arm5e.skill.general.awareness",
        key: "system.bonuses.skills.awareness.xpCoeff",
        mode: 1,
        default: 1.5
      },
      bargain: {
        mnemonic: "arm5e.skill.general.bargain",
        key: "system.bonuses.skills.bargain.xpCoeff",
        mode: 1,
        default: 1.5
      },
      brawl: {
        mnemonic: "arm5e.skill.general.brawl",
        key: "system.bonuses.skills.brawl.xpCoeff",
        mode: 1,
        default: 1.5
      },
      carouse: {
        mnemonic: "arm5e.skill.general.carouse",
        key: "system.bonuses.skills.carouse.xpCoeff",
        mode: 1,
        default: 1.5
      },
      charm: {
        mnemonic: "arm5e.skill.general.charm",
        key: "system.bonuses.skills.charm.xpCoeff",
        mode: 1,
        default: 1.5
      },
      concentration: {
        mnemonic: "arm5e.skill.general.concentration",
        key: "system.bonuses.skills.concentration.xpCoeff",
        mode: 1,
        default: 1.5
      },
      craft: {
        mnemonic: "arm5e.skill.general.craft",
        key: "system.bonuses.skills.craft_#OPTION#.xpCoeff",
        mode: 1,
        default: 1.5,
        option: "craftName"
      },
      etiquette: {
        mnemonic: "arm5e.skill.general.etiquette",
        key: "system.bonuses.skills.etiquette.xpCoeff",
        mode: 1,
        default: 1.5
      },
      folkKen: {
        mnemonic: "arm5e.skill.general.folkKen",
        key: "system.bonuses.skills.folkKen.xpCoeff",
        mode: 1,
        default: 1.5
      },
      guile: {
        mnemonic: "arm5e.skill.general.guile",
        key: "system.bonuses.skills.guile.xpCoeff",
        mode: 1,
        default: 1.5
      },
      hunt: {
        mnemonic: "arm5e.skill.general.hunt",
        key: "system.bonuses.skills.hunt.xpCoeff",
        mode: 1,
        default: 1.5
      },
      intrigue: {
        mnemonic: "arm5e.skill.general.intrigue",
        key: "system.bonuses.skills.intrigue.xpCoeff",
        mode: 1,
        default: 1.5
      },
      leadership: {
        mnemonic: "arm5e.skill.general.leadership",
        key: "system.bonuses.skills.leadership.xpCoeff",
        mode: 1,
        default: 1.5
      },
      legerdemain: {
        mnemonic: "arm5e.skill.general.legerdemain",
        key: "system.bonuses.skills.legerdemain.xpCoeff",
        mode: 1,
        default: 1.5
      },
      livingLanguage: {
        mnemonic: "arm5e.skill.general.livingLanguage",
        key: "system.bonuses.skills.livingLanguage_#OPTION#.xpCoeff",
        mode: 1,
        default: 1.5,
        option: "languageName"
      },
      music: {
        mnemonic: "arm5e.skill.general.music",
        key: "system.bonuses.skills.music.xpCoeff",
        mode: 1,
        default: 1.5
      },
      organizationLore: {
        mnemonic: "arm5e.skill.general.organizationLore",
        key: "system.bonuses.skills.organizationLore_#OPTION#.xpCoeff",
        mode: 1,
        default: 1.5,
        option: "orgName"
      },
      profession: {
        mnemonic: "arm5e.skill.general.profession",
        key: "system.bonuses.skills.profession_#OPTION#.xpCoeff",
        mode: 1,
        default: 1.5,
        option: "professionName"
      },
      ride: {
        mnemonic: "arm5e.skill.general.ride",
        key: "system.bonuses.skills.ride.xpCoeff",
        mode: 1,
        default: 1.5
      },
      stealth: {
        mnemonic: "arm5e.skill.general.stealth",
        key: "system.bonuses.skills.stealth.xpCoeff",
        mode: 1,
        default: 1.5
      },
      survival: {
        mnemonic: "arm5e.skill.general.survival",
        key: "system.bonuses.skills.survival.xpCoeff",
        mode: 1,
        default: 1.5
      },
      swim: {
        mnemonic: "arm5e.skill.general.swim",
        key: "system.bonuses.skills.swim.xpCoeff",
        mode: 1,
        default: 1.5
      },
      teaching: {
        mnemonic: "arm5e.skill.general.teaching",
        key: "system.bonuses.skills.teaching.xpCoeff",
        mode: 1,
        default: 1.5
      }
    }
  },
  affinityArcaneAbility: {
    category: "abilities",
    type: "affinityArcaneAbility",
    mnemonic: "arm5e.sheet.activeEffect.types.arcaneAbilitiesAffinity",
    subtypes: {
      hermeticCode: {
        mnemonic: "arm5e.skill.arcane.hermeticCode",
        key: "system.bonuses.skills.hermeticCode.xpCoeff",
        mode: 1,
        default: 1.5
      },
      dominionLore: {
        mnemonic: "arm5e.skill.arcane.dominionLore",
        key: "system.bonuses.skills.dominionLore.xpCoeff",
        mode: 1,
        default: 1.5
      },
      faerieLore: {
        mnemonic: "arm5e.skill.arcane.faerieLore",
        key: "system.bonuses.skills.faerieLore.xpCoeff",
        mode: 1,
        default: 1.5
      },
      finesse: {
        mnemonic: "arm5e.skill.arcane.finesse",
        key: "system.bonuses.skills.finesse.xpCoeff",
        mode: 1,
        default: 1.5
      },
      infernalLore: {
        mnemonic: "arm5e.skill.arcane.infernalLore",
        key: "system.bonuses.skills.infernalLore.xpCoeff",
        mode: 1,
        default: 1.5
      },
      magicLore: {
        mnemonic: "arm5e.skill.arcane.magicLore",
        key: "system.bonuses.skills.magicLore.xpCoeff",
        mode: 1,
        default: 1.5
      },
      magicTheory: {
        mnemonic: "arm5e.skill.arcane.magicTheory",
        key: "system.bonuses.skills.magicTheory.xpCoeff",
        mode: 1,
        default: 1.5
      },
      parma: {
        mnemonic: "arm5e.skill.arcane.parma",
        key: "system.bonuses.skills.parma.xpCoeff",
        mode: 1,
        default: 1.5
      },
      penetration: {
        mnemonic: "arm5e.skill.arcane.penetration",
        key: "system.bonuses.skills.penetration.xpCoeff",
        mode: 1,
        default: 1.5
      }
    }
  },
  affinityAcademicAbility: {
    category: "abilities",
    type: "affinityAcademicAbility",
    mnemonic: "arm5e.sheet.activeEffect.types.academicAbilitiesAffinity",
    subtypes: {
      artesLib: {
        mnemonic: "arm5e.skill.academic.artesLib",
        key: "system.bonuses.skills.artesLib.xpCoeff",
        mode: 1,
        default: 1.5
      },
      civilCanonLaw: {
        mnemonic: "arm5e.skill.academic.civilCanonLaw",
        key: "system.bonuses.skills.civilCanonLaw.xpCoeff",
        mode: 1,
        default: 1.5
      },
      commonLaw: {
        mnemonic: "arm5e.skill.academic.commonLaw",
        key: "system.bonuses.skills.commonLaw.xpCoeff",
        mode: 1,
        default: 1.5
      },
      deadLanguage: {
        mnemonic: "arm5e.skill.academic.deadLanguage",
        key: "system.bonuses.skills.deadLanguage_#OPTION#.xpCoeff",
        mode: 1,
        default: 1.5,
        option: "languageName"
      },
      medicine: {
        mnemonic: "arm5e.skill.academic.medicine",
        key: "system.bonuses.skills.medicine.xpCoeff",
        mode: 1,
        default: 1.5
      },
      philosophy: {
        mnemonic: "arm5e.skill.academic.philosophy",
        key: "system.bonuses.skills.philosophy.xpCoeff",
        mode: 1,
        default: 1.5
      },
      theology: {
        mnemonic: "arm5e.skill.academic.theology",
        key: "system.bonuses.skills.theology.xpCoeff",
        mode: 1,
        default: 1.5
      }
    }
  },
  affinityMartialAbility: {
    category: "abilities",
    type: "affinityMartialAbility",
    mnemonic: "arm5e.sheet.activeEffect.types.martialAbilitiesAffinity",
    subtypes: {
      bows: {
        mnemonic: "arm5e.skill.martial.bows",
        key: "system.bonuses.skills.bows.xpCoeff",
        mode: 1,
        default: 1.5
      },
      singleWeapon: {
        mnemonic: "arm5e.skill.martial.singleWeapon",
        key: "system.bonuses.skills.singleWeapon.xpCoeff",
        mode: 1,
        default: 1.5
      },
      greatWeapon: {
        mnemonic: "arm5e.skill.martial.greatWeapon",
        key: "system.bonuses.skills.greatWeapon.xpCoeff",
        mode: 1,
        default: 1.5
      },
      trownWeapon: {
        mnemonic: "arm5e.skill.martial.trownWeapon",
        key: "system.bonuses.skills.trownWeapon.xpCoeff",
        mode: 1,
        default: 1.5
      }
    }
  },
  affinityMysteryAbility: {
    category: "abilities",
    type: "affinityMysteryAbility",
    mnemonic: "arm5e.sheet.activeEffect.types.mysteryAbilitiesAffinity",
    subtypes: {
      enigma: {
        mnemonic: "arm5e.skill.mystery.enigma",
        key: "system.bonuses.skills.enigma.xpCoeff",
        mode: 1,
        default: 1.5
      },
      faerieMagic: {
        mnemonic: "arm5e.skill.mystery.faerieMagic",
        key: "system.bonuses.skills.faerieMagic.xpCoeff",
        mode: 1,
        default: 1.5
      },
      heartbeast: {
        mnemonic: "arm5e.skill.mystery.heartbeast",
        key: "system.bonuses.skills.heartbeast.xpCoeff",
        mode: 1,
        default: 1.5
      },
      verditiusMagic: {
        mnemonic: "arm5e.skill.mystery.verditiusMagic",
        key: "system.bonuses.skills.verditiusMagic.xpCoeff",
        mode: 1,
        default: 1.5
      },
      cult: {
        mnemonic: "arm5e.skill.mystery.cult",
        key: "system.bonuses.skills.cult_#OPTION#.xpCoeff",
        mode: 1,
        default: 1.5,
        option: "cultName"
      }
    }
  },
  affinitySupernaturalAbility: {
    category: "abilities",
    type: "affinitySupernaturalAbility",
    mnemonic: "arm5e.sheet.activeEffect.types.supernaturalAbilitiesAffinity",
    subtypes: {
      animalKen: {
        mnemonic: "arm5e.skill.supernatural.animalKen",
        key: "system.bonuses.skills.animalKen.xpCoeff",
        mode: 1,
        default: 1.5
      },
      dowsing: {
        mnemonic: "arm5e.skill.supernatural.dowsing",
        key: "system.bonuses.skills.dowsing.xpCoeff",
        mode: 1,
        default: 1.5
      },
      enchantingMusic: {
        mnemonic: "arm5e.skill.supernatural.enchantingMusic",
        key: "system.bonuses.skills.enchantingMusic.xpCoeff",
        mode: 1,
        default: 1.5
      },
      entrancement: {
        mnemonic: "arm5e.skill.supernatural.entrancement",
        key: "system.bonuses.skills.entrancement.xpCoeff",
        mode: 1,
        default: 1.5
      },
      magicSensitivity: {
        mnemonic: "arm5e.skill.supernatural.magicSensitivity",
        key: "system.bonuses.skills.magicSensitivity.xpCoeff",
        mode: 1,
        default: 1.5
      },
      premonitions: {
        mnemonic: "arm5e.skill.supernatural.premonitions",
        key: "system.bonuses.skills.premonitions.xpCoeff",
        mode: 1,
        default: 1.5
      },
      secondSight: {
        mnemonic: "arm5e.skill.supernatural.secondSight",
        key: "system.bonuses.skills.secondSight.xpCoeff",
        mode: 1,
        default: 1.5
      },
      senseHolyAndUnholy: {
        mnemonic: "arm5e.skill.supernatural.senseHolyAndUnholy",
        key: "system.bonuses.skills.senseHolyAndUnholy.xpCoeff",
        mode: 1,
        default: 1.5
      },
      shapeshifter: {
        mnemonic: "arm5e.skill.supernatural.shapeshifter",
        key: "system.bonuses.skills.shapeshifter.xpCoeff",
        mode: 1,
        default: 1.5
      },
      supernatural: {
        mnemonic: "arm5e.skill.supernatural.generic",
        key: "system.bonuses.skills.supernatural_#OPTION#.xpCoeff",
        mode: 1,
        default: 1.5,
        option: "supernaturalAbilityName"
      },
      wildernessSense: {
        mnemonic: "arm5e.skill.supernatural.wildernessSense",
        key: "system.bonuses.skills.wildernessSense.xpCoeff",
        mode: 1,
        default: 1.5
      }
    }
  },
  affinityAlternateArt: {
    category: "abilities",
    type: "affinityAlternateArt",
    mnemonic: "arm5e.sheet.activeEffect.types.affinityAlternateArt",
    subtypes: {
      technique: {
        mnemonic: "arm5e.skill.technique.generic",
        key: "system.bonuses.skills.technique_#OPTION#.xpCoeff",
        mode: 1,
        default: 1.5,
        option: "techniqueName"
      },
      form: {
        mnemonic: "arm5e.skill.form.generic",
        key: "system.bonuses.skills.form_#OPTION#.xpCoeff",
        mode: 1,
        default: 1.5,
        option: "formName"
      }
    }
  },

  labActivity: {
    category: "magic",
    type: "laboratory",
    mnemonic: "arm5e.sheet.activeEffect.types.labActivity",
    subtypes: {
      learnSpell: {
        mnemonic: "arm5e.lab.activity.spellLearning",
        key: "system.bonuses.labActivities.learnSpell",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 1
      },
      inventSpell: {
        mnemonic: "arm5e.lab.activity.inventSpell",
        key: "system.bonuses.labActivities.inventSpell",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 1
      }
    }
  },
  labSpecialty: {
    category: "laboratory",
    type: "laboratorySpec",
    mnemonic: "arm5e.sheet.activeEffect.types.laboratorySpec",
    subtypes: {
      texts: {
        mnemonic: "arm5e.lab.specialty.texts",
        key: "system.specialty.texts.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 1
      },
      spells: {
        mnemonic: "arm5e.lab.specialty.spells",
        key: "system.specialty.spells.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 1
      },
      experimentation: {
        mnemonic: "arm5e.lab.specialty.experimentation",
        key: "system.specialty.experimentation.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 1
      },
      familiar: {
        mnemonic: "arm5e.lab.specialty.familiar",
        key: "system.specialty.familiar.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 1
      },
      items: {
        mnemonic: "arm5e.lab.specialty.items",
        key: "system.specialty.items.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 1
      },
      longevityRituals: {
        mnemonic: "arm5e.lab.specialty.longevityRituals",
        key: "system.specialty.longevityRituals.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 1
      },
      visExtraction: {
        mnemonic: "arm5e.lab.specialty.visExtraction",
        key: "system.specialty.visExtraction.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 1
      },
      cr: {
        mnemonic: "Creo",
        key: "system.specialty.cr.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 1
      },
      in: {
        mnemonic: "Intellego",
        key: "system.specialty.in.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 1
      },
      mu: {
        mnemonic: "Muto",
        key: "system.specialty.mu.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 1
      },
      pe: {
        mnemonic: "Perdo",
        key: "system.specialty.pe.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 1
      },
      re: {
        mnemonic: "Rego",
        key: "system.specialty.re.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 1
      },
      an: {
        mnemonic: "Animal",
        key: "system.specialty.an.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 1
      },
      aq: {
        mnemonic: "Aquam",
        key: "system.specialty.aq.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 1
      },
      au: {
        mnemonic: "Auram",
        key: "system.specialty.au.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 1
      },
      co: {
        mnemonic: "Corpus",
        key: "system.specialty.co.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 1
      },
      he: {
        mnemonic: "Herbam",
        key: "system.specialty.he.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 1
      },
      ig: {
        mnemonic: "Ignem",
        key: "system.specialty.ig.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 1
      },
      im: {
        mnemonic: "Imaginem",
        key: "system.specialty.im.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 1
      },
      me: {
        mnemonic: "Mentem",
        key: "system.specialty.me.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 1
      },
      te: {
        mnemonic: "Terram",
        key: "system.specialty.te.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 1
      },
      vi: {
        mnemonic: "Vim",
        key: "system.specialty.vi.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 1
      }
    }
  },
  laboratory: {
    category: "laboratory",
    type: "laboratory",
    mnemonic: "arm5e.sheet.activeEffect.types.laboratoryAttr",
    subtypes: {
      size: {
        mnemonic: "arm5e.sheet.size",
        key: "system.size.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 1
      },
      generalQuality: {
        mnemonic: "arm5e.sheet.generalQuality",
        key: "system.generalQuality.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 1
      },
      safety: {
        mnemonic: "arm5e.sheet.safety",
        key: "system.safety.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 1
      },
      health: {
        mnemonic: "arm5e.sheet.health",
        key: "system.health.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 1
      },
      refinement: {
        mnemonic: "arm5e.sheet.refinement",
        key: "system.refinement.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 1
      },
      upkeep: {
        mnemonic: "arm5e.sheet.upkeep",
        key: "system.upkeep.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 1
      },
      warping: {
        mnemonic: "arm5e.sheet.warping",
        key: "system.warping.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 1
      },
      aesthetics: {
        mnemonic: "arm5e.sheet.aesthetics",
        key: "system.aesthetics.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 1
      },
      aestheticsCap: {
        mnemonic: "arm5e.sheet.aestheticsMax",
        key: "system.aesthetics.max",
        mode: CONST.ACTIVE_EFFECT_MODES.DOWNGRADE,
        default: -1
      },
      auraMod: {
        mnemonic: "arm5e.sheet.auraMod",
        key: "system.auraBonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      }
    }
  },

  optionalRollBonus: {
    category: "roll",
    type: "optionalRollBonus",
    mnemonic: "arm5e.sheet.activeEffect.types.roll.optional",
    subtypes: {
      spontMagic: {
        mnemonic: "arm5e.sheet.activeEffect.subtypes.spontMagicRoll",
        key: "spontMagic",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 3
      },
      formulaicMagic: {
        mnemonic: "arm5e.sheet.activeEffect.subtypes.formMagicRoll",
        key: "formulaicMagic",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 3
      },
      init: {
        mnemonic: "arm5e.sheet.activeEffect.subtypes.initRoll",
        key: "init",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 3
      },
      attack: {
        mnemonic: "arm5e.sheet.activeEffect.subtypes.attackRoll",
        key: "attack",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 3
      },
      defense: {
        mnemonic: "arm5e.sheet.activeEffect.subtypes.defRoll",
        key: "defense",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 3
      }
    }
  },
  covenantBuildPoints: {
    category: "covenant",
    type: "buildPoints",
    mnemonic: "arm5e.sheet.activeEffect.type.covenantBuildPoint",
    subtypes: {
      library: {
        mnemonic: "arm5e.sheet.activeEffect.subtypes.library",
        key: "system.buildPoints.library.computed",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 10
      },
      labText: {
        mnemonic: "arm5e.sheet.activeEffect.subtypes.labText",
        key: "system.buildPoints.labText.computed",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 10
      },
      vis: {
        mnemonic: "arm5e.sheet.activeEffect.subtypes.vis",
        key: "system.buildPoints.vis.computed",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 10
      },
      magicItems: {
        mnemonic: "arm5e.sheet.activeEffect.subtypes.magicItems",
        key: "system.buildPoints.magicItems.computed",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 10
      },
      specialists: {
        mnemonic: "arm5e.sheet.activeEffect.subtypes.specialists",
        key: "system.buildPoints.specialists.computed",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 10
      },
      labs: {
        mnemonic: "arm5e.sheet.activeEffect.subtypes.labs",
        key: "system.buildPoints.labs.computed",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 10
      },
      money: {
        mnemonic: "arm5e.sheet.activeEffect.subtypes.money",
        key: "system.buildPoints.money.computed",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 10
      }
    }
  },
  covenantExpenses: {
    category: "covenant",
    type: "expenses",
    mnemonic: "arm5e.sheet.activeEffect.type.yearlyExpenses",
    subtypes: {
      inhabitant: {
        mnemonic: "arm5e.sheet.activeEffect.subtypes.inhabitantPoints",
        key: "system.finances.inhabitantsPoints",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      buildings: {
        mnemonic: "arm5e.sheet.activeEffect.subtypes.buildings",
        key: "system.yearlyExpenses.buildings.amount",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      consumables: {
        mnemonic: "arm5e.sheet.activeEffect.subtypes.consumables",
        key: "system.yearlyExpenses.consumables.amount",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      provisions: {
        mnemonic: "arm5e.sheet.activeEffect.subtypes.provisions",
        key: "system.yearlyExpenses.provisions.amount",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      wages: {
        mnemonic: "arm5e.sheet.activeEffect.subtypes.wages",
        key: "system.yearlyExpenses.wages.amount",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      laboratories: {
        mnemonic: "arm5e.sheet.activeEffect.subtypes.laboratories",
        key: "system.yearlyExpenses.laboratories.amount",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      books: {
        mnemonic: "arm5e.sheet.activeEffect.subtypes.writingMaterials",
        key: "system.yearlyExpenses.writingMaterials.amount",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      weapons: {
        mnemonic: "arm5e.sheet.activeEffect.subtypes.weapons",
        key: "system.yearlyExpenses.weapons.amount",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      }
    }
  },
  covenantCostSavingMundane: {
    category: "covenant",
    type: "savingsMundane",
    mnemonic: "arm5e.sheet.activeEffect.type.yearlySavings.mundane",
    subtypes: {
      buildings: {
        mnemonic: "arm5e.sheet.activeEffect.subtypes.buildings",
        key: "system.yearlyExpenses.buildings.mod",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      consumables: {
        mnemonic: "arm5e.sheet.activeEffect.subtypes.consumables",
        key: "system.yearlyExpenses.consumables.mod",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      provisions: {
        mnemonic: "arm5e.sheet.activeEffect.subtypes.provisions",
        key: "system.yearlyExpenses.provisions.mod",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      wages: {
        mnemonic: "arm5e.sheet.activeEffect.subtypes.wages",
        key: "system.yearlyExpenses.wages.mod",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      laboratories: {
        mnemonic: "arm5e.sheet.activeEffect.subtypes.laboratories",
        key: "system.yearlyExpenses.laboratories.mod",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      writingMaterials: {
        mnemonic: "arm5e.sheet.activeEffect.subtypes.writingMaterials",
        key: "system.yearlyExpenses.writingMaterials.mod",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      weapons: {
        mnemonic: "arm5e.sheet.activeEffect.subtypes.weapons",
        key: "system.yearlyExpenses.weapons.mod",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      }
    }
  },
  covenantCostSavingMagic: {
    category: "covenant",
    type: "savingsMagic",
    mnemonic: "arm5e.sheet.activeEffect.type.yearlySavings.magic",
    subtypes: {
      buildings: {
        mnemonic: "arm5e.sheet.activeEffect.subtypes.buildings",
        key: "system.yearlyExpenses.buildings.magicMod",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      consumables: {
        mnemonic: "arm5e.sheet.activeEffect.subtypes.consumables",
        key: "system.yearlyExpenses.consumables.magicMod",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      provisions: {
        mnemonic: "arm5e.sheet.activeEffect.subtypes.provisions",
        key: "system.yearlyExpenses.provisions.magicMod",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      wages: {
        mnemonic: "arm5e.sheet.activeEffect.subtypes.wages",
        key: "system.yearlyExpenses.wages.magicMod",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      laboratories: {
        mnemonic: "arm5e.sheet.activeEffect.subtypes.laboratories",
        key: "system.yearlyExpenses.laboratories.magicMod",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      writingMaterials: {
        mnemonic: "arm5e.sheet.activeEffect.subtypes.writingMaterials",
        key: "system.yearlyExpenses.writingMaterials.magicMod",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      weapons: {
        mnemonic: "arm5e.sheet.activeEffect.subtypes.weapons",
        key: "system.yearlyExpenses.weapons.magicMod",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      }
    }
  },
  covenantInhabitants: {
    category: "covenant",
    type: "covenantInhabitants",
    mnemonic: "arm5e.sheet.activeEffect.type.covenantInhabitants",
    subtypes: {
      turbula: {
        mnemonic: "arm5e.sheet.activeEffect.subtypes.turbula",
        key: "system.census.turbula",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      laborers: {
        mnemonic: "arm5e.sheet.activeEffect.subtypes.laborers",
        key: "system.census.laborers",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      teamsters: {
        mnemonic: "arm5e.sheet.activeEffect.subtypes.teamsters",
        key: "system.census.teamsters",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      servants: {
        mnemonic: "arm5e.sheet.activeEffect.subtypes.servants",
        key: "system.census.servants",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      }
    }
  }
};
