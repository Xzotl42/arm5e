// Rule: all subtypes of a given type must have a different "key" value or it becomes impossible to edit them properly

import { ARM5E } from "../config.js";

export function addActiveEffectsDefinitions() {
  // Arts related effects

  ACTIVE_EFFECTS_TYPES.art.subtypes = {
    ...puissantTechniques(),
    ...puissantForms()
  };

  ACTIVE_EFFECTS_TYPES.affinity.subtypes = {
    ...affinityTechniques(),
    ...affinityForms()
  };

  ACTIVE_EFFECTS_TYPES.deficiency.subtypes = {
    ...deficientTechniques(),
    ...deficientForms()
  };

  ACTIVE_EFFECTS_TYPES.formResistance.subtypes = {
    ...resistanceForms()
  };

  // Abilities related effects

  // Puissant abilities

  ACTIVE_EFFECTS_TYPES.bonusGeneralAbility.subtypes = {
    ...Object.entries(ARM5E.GENERAL_ABILITIES).reduce((a, current) => {
      if (current[1].option) {
        a[current[0]] = {
          mnemonic: current[1].mnemonic,
          key: `system.bonuses.skills.${current[0]}_#OPTION#.bonus`,
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          default: 2,
          option: current[1].optionDefault
        };
      } else {
        a[current[0]] = {
          mnemonic: current[1].mnemonic,
          key: `system.bonuses.skills.${current[0]}.bonus`,
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          default: 2
        };
      }
      return a;
    }, {})
  };

  ACTIVE_EFFECTS_TYPES.bonusAcademicAbility.subtypes = {
    ...Object.entries(ARM5E.ACADEMIC_ABILITIES).reduce((a, current) => {
      if (current[1].option) {
        a[current[0]] = {
          mnemonic: current[1].mnemonic,
          key: `system.bonuses.skills.${current[0]}_#OPTION#.bonus`,
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          default: 2,
          option: current[1].optionDefault
        };
      } else {
        a[current[0]] = {
          mnemonic: current[1].mnemonic,
          key: `system.bonuses.skills.${current[0]}.bonus`,
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          default: 2
        };
      }
      return a;
    }, {})
  };

  ACTIVE_EFFECTS_TYPES.bonusArcaneAbility.subtypes = {
    ...Object.entries(ARM5E.ARCANE_ABILITIES).reduce((a, current) => {
      if (current[1].option) {
        a[current[0]] = {
          mnemonic: current[1].mnemonic,
          key: `system.bonuses.skills.${current[0]}_#OPTION#.bonus`,
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          default: 2,
          option: current[1].optionDefault
        };
      } else {
        a[current[0]] = {
          mnemonic: current[1].mnemonic,
          key: `system.bonuses.skills.${current[0]}.bonus`,
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          default: 2
        };
      }
      return a;
    }, {})
  };

  ACTIVE_EFFECTS_TYPES.bonusMartialAbility.subtypes = {
    ...Object.entries(ARM5E.MARTIAL_ABILITIES).reduce((a, current) => {
      if (current[1].option) {
        a[current[0]] = {
          mnemonic: current[1].mnemonic,
          key: `system.bonuses.skills.${current[0]}_#OPTION#.bonus`,
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          default: 2,
          option: current[1].optionDefault
        };
      } else {
        a[current[0]] = {
          mnemonic: current[1].mnemonic,
          key: `system.bonuses.skills.${current[0]}.bonus`,
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          default: 2
        };
      }
      return a;
    }, {})
  };

  ACTIVE_EFFECTS_TYPES.bonusSupernaturalAbility.subtypes = {
    ...Object.entries(ARM5E.SUPERNATURAL_ABILITIES).reduce((a, current) => {
      if (current[1].option) {
        a[current[0]] = {
          mnemonic: current[1].mnemonic,
          key: `system.bonuses.skills.${current[0]}_#OPTION#.bonus`,
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          default: 2,
          option: current[1].optionDefault
        };
      } else {
        a[current[0]] = {
          mnemonic: current[1].mnemonic,
          key: `system.bonuses.skills.${current[0]}.bonus`,
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          default: 2
        };
      }
      return a;
    }, {})
  };

  ACTIVE_EFFECTS_TYPES.bonusMysteryAbility.subtypes = {
    ...Object.entries(ARM5E.MYSTERY_ABILITIES).reduce((a, current) => {
      if (current[1].option) {
        a[current[0]] = {
          mnemonic: current[1].mnemonic,
          key: `system.bonuses.skills.${current[0]}_#OPTION#.bonus`,
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          default: 2,
          option: current[1].optionDefault
        };
      } else {
        a[current[0]] = {
          mnemonic: current[1].mnemonic,
          key: `system.bonuses.skills.${current[0]}.bonus`,
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          default: 2
        };
      }
      return a;
    }, {})
  };

  ACTIVE_EFFECTS_TYPES.bonusAlternateArt.subtypes = {
    ...Object.entries(ARM5E.ALT_TECHNIQUE_ABILITIES).reduce((a, current) => {
      if (current[1].option) {
        a[current[0]] = {
          mnemonic: current[1].mnemonic,
          key: `system.bonuses.skills.${current[0]}_#OPTION#.bonus`,
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          default: 2,
          option: current[1].optionDefault
        };
      } else {
        a[current[0]] = {
          mnemonic: current[1].mnemonic,
          key: `system.bonuses.skills.${current[0]}.bonus`,
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          default: 2
        };
      }
      return a;
    }, {}),
    ...Object.entries(ARM5E.ALT_FORM_ABILITIES).reduce((a, current) => {
      if (current[1].option) {
        a[current[0]] = {
          mnemonic: current[1].mnemonic,
          key: `system.bonuses.skills.${current[0]}_#OPTION#.bonus`,
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          default: 2,
          option: current[1].optionDefault
        };
      } else {
        a[current[0]] = {
          mnemonic: current[1].mnemonic,
          key: `system.bonuses.skills.${current[0]}.bonus`,
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          default: 2
        };
      }
      return a;
    }, {})
  };

  // Affinities for abilities

  ACTIVE_EFFECTS_TYPES.affinityGeneralAbility.subtypes = {
    ...Object.entries(ARM5E.GENERAL_ABILITIES).reduce((a, current) => {
      if (current[1].option) {
        a[current[0]] = {
          mnemonic: current[1].mnemonic,
          key: `system.bonuses.skills.${current[0]}_#OPTION#.xpCoeff`,
          mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
          default: 1.5,
          option: current[1].optionDefault
        };
      } else {
        a[current[0]] = {
          mnemonic: current[1].mnemonic,
          key: `system.bonuses.skills.${current[0]}.xpCoeff`,
          mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
          default: 1.5
        };
      }
      return a;
    }, {})
  };

  ACTIVE_EFFECTS_TYPES.affinityAcademicAbility.subtypes = {
    ...Object.entries(ARM5E.ACADEMIC_ABILITIES).reduce((a, current) => {
      if (current[1].option) {
        a[current[0]] = {
          mnemonic: current[1].mnemonic,
          key: `system.bonuses.skills.${current[0]}_#OPTION#.xpCoeff`,
          mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
          default: 1.5,
          option: current[1].optionDefault
        };
      } else {
        a[current[0]] = {
          mnemonic: current[1].mnemonic,
          key: `system.bonuses.skills.${current[0]}.xpCoeff`,
          mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
          default: 1.5
        };
      }
      return a;
    }, {})
  };

  ACTIVE_EFFECTS_TYPES.affinityArcaneAbility.subtypes = {
    ...Object.entries(ARM5E.ARCANE_ABILITIES).reduce((a, current) => {
      if (current[1].option) {
        a[current[0]] = {
          mnemonic: current[1].mnemonic,
          key: `system.bonuses.skills.${current[0]}_#OPTION#.xpCoeff`,
          mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
          default: 1.5,
          option: current[1].optionDefault
        };
      } else {
        a[current[0]] = {
          mnemonic: current[1].mnemonic,
          key: `system.bonuses.skills.${current[0]}.xpCoeff`,
          mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
          default: 1.5
        };
      }
      return a;
    }, {})
  };

  ACTIVE_EFFECTS_TYPES.affinityMartialAbility.subtypes = {
    ...Object.entries(ARM5E.MARTIAL_ABILITIES).reduce((a, current) => {
      if (current[1].option) {
        a[current[0]] = {
          mnemonic: current[1].mnemonic,
          key: `system.bonuses.skills.${current[0]}_#OPTION#.xpCoeff`,
          mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
          default: 1.5,
          option: current[1].optionDefault
        };
      } else {
        a[current[0]] = {
          mnemonic: current[1].mnemonic,
          key: `system.bonuses.skills.${current[0]}.xpCoeff`,
          mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
          default: 1.5
        };
      }
      return a;
    }, {})
  };
  ACTIVE_EFFECTS_TYPES.affinitySupernaturalAbility.subtypes = {
    ...Object.entries(ARM5E.SUPERNATURAL_ABILITIES).reduce((a, current) => {
      if (current[1].option) {
        a[current[0]] = {
          mnemonic: current[1].mnemonic,
          key: `system.bonuses.skills.${current[0]}_#OPTION#.xpCoeff`,
          mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
          default: 1.5,
          option: current[1].optionDefault
        };
      } else {
        a[current[0]] = {
          mnemonic: current[1].mnemonic,
          key: `system.bonuses.skills.${current[0]}.xpCoeff`,
          mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
          default: 1.5
        };
      }
      return a;
    }, {})
  };
  ACTIVE_EFFECTS_TYPES.affinityMysteryAbility.subtypes = {
    ...Object.entries(ARM5E.MYSTERY_ABILITIES).reduce((a, current) => {
      if (current[1].option) {
        a[current[0]] = {
          mnemonic: current[1].mnemonic,
          key: `system.bonuses.skills.${current[0]}_#OPTION#.xpCoeff`,
          mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
          default: 1.5,
          option: current[1].optionDefault
        };
      } else {
        a[current[0]] = {
          mnemonic: current[1].mnemonic,
          key: `system.bonuses.skills.${current[0]}.xpCoeff`,
          mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
          default: 1.5
        };
      }
      return a;
    }, {})
  };

  ACTIVE_EFFECTS_TYPES.affinityAlternateArt.subtypes = {
    ...Object.entries(ARM5E.ALT_TECHNIQUE_ABILITIES).reduce((a, current) => {
      if (current[1].option) {
        a[current[0]] = {
          mnemonic: current[1].mnemonic,
          key: `system.bonuses.skills.${current[0]}_#OPTION#.xpCoeff`,
          mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
          default: 1.5,
          option: current[1].optionDefault
        };
      } else {
        a[current[0]] = {
          mnemonic: current[1].mnemonic,
          key: `system.bonuses.skills.${current[0]}.xpCoeff`,
          mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
          default: 1.5
        };
      }
      return a;
    }, {}),
    ...Object.entries(ARM5E.ALT_FORM_ABILITIES).reduce((a, current) => {
      if (current[1].option) {
        a[current[0]] = {
          mnemonic: current[1].mnemonic,
          key: `system.bonuses.skills.${current[0]}_#OPTION#.xpCoeff`,
          mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
          default: 1.5,
          option: current[1].optionDefault
        };
      } else {
        a[current[0]] = {
          mnemonic: current[1].mnemonic,
          key: `system.bonuses.skills.${current[0]}.xpCoeff`,
          mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
          default: 1.5
        };
      }
      return a;
    }, {})
  };

  ACTIVE_EFFECTS_TYPES.xpBonusSupernaturalAbility.subtypes = {
    ...Object.entries(ARM5E.SUPERNATURAL_ABILITIES).reduce((a, current) => {
      if (current[1].option) {
        a[current[0]] = {
          mnemonic: current[1].mnemonic,
          key: `system.bonuses.skills.${current[0]}_#OPTION#.xpMod`,
          mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
          default: 1.5,
          option: current[1].optionDefault
        };
      } else {
        a[current[0]] = {
          mnemonic: current[1].mnemonic,
          key: `system.bonuses.skills.${current[0]}.xpMod`,
          mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
          default: 1.5
        };
      }
      return a;
    }, {})
  };

  // XP bonus

  ACTIVE_EFFECTS_TYPES.xpBonusGeneralAbility.subtypes = {
    ...Object.entries(ARM5E.GENERAL_ABILITIES).reduce((a, current) => {
      if (current[1].option) {
        a[current[0]] = {
          mnemonic: current[1].mnemonic,
          key: `system.bonuses.skills.${current[0]}_#OPTION#.xpMod`,
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          default: 5,
          option: current[1].optionDefault
        };
      } else {
        a[current[0]] = {
          mnemonic: current[1].mnemonic,
          key: `system.bonuses.skills.${current[0]}.xpMod`,
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          default: 5
        };
      }
      return a;
    }, {})
  };

  ACTIVE_EFFECTS_TYPES.xpBonusAcademicAbility.subtypes = {
    ...Object.entries(ARM5E.ACADEMIC_ABILITIES).reduce((a, current) => {
      if (current[1].option) {
        a[current[0]] = {
          mnemonic: current[1].mnemonic,
          key: `system.bonuses.skills.${current[0]}_#OPTION#.xpMod`,
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          default: 5,
          option: current[1].optionDefault
        };
      } else {
        a[current[0]] = {
          mnemonic: current[1].mnemonic,
          key: `system.bonuses.skills.${current[0]}.xpMod`,
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          default: 5
        };
      }
      return a;
    }, {})
  };

  ACTIVE_EFFECTS_TYPES.xpBonusArcaneAbility.subtypes = {
    ...Object.entries(ARM5E.ARCANE_ABILITIES).reduce((a, current) => {
      if (current[1].option) {
        a[current[0]] = {
          mnemonic: current[1].mnemonic,
          key: `system.bonuses.skills.${current[0]}_#OPTION#.xpMod`,
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          default: 5,
          option: current[1].optionDefault
        };
      } else {
        a[current[0]] = {
          mnemonic: current[1].mnemonic,
          key: `system.bonuses.skills.${current[0]}.xpMod`,
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          default: 5
        };
      }
      return a;
    }, {})
  };

  ACTIVE_EFFECTS_TYPES.xpBonusMartialAbility.subtypes = {
    ...Object.entries(ARM5E.MARTIAL_ABILITIES).reduce((a, current) => {
      if (current[1].option) {
        a[current[0]] = {
          mnemonic: current[1].mnemonic,
          key: `system.bonuses.skills.${current[0]}_#OPTION#.xpMod`,
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          default: 5,
          option: current[1].optionDefault
        };
      } else {
        a[current[0]] = {
          mnemonic: current[1].mnemonic,
          key: `system.bonuses.skills.${current[0]}.xpMod`,
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          default: 5
        };
      }
      return a;
    }, {})
  };

  ACTIVE_EFFECTS_TYPES.xpBonusSupernaturalAbility.subtypes = {
    ...Object.entries(ARM5E.SUPERNATURAL_ABILITIES).reduce((a, current) => {
      if (current[1].option) {
        a[current[0]] = {
          mnemonic: current[1].mnemonic,
          key: `system.bonuses.skills.${current[0]}_#OPTION#.xpMod`,
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          default: 5,
          option: current[1].optionDefault
        };
      } else {
        a[current[0]] = {
          mnemonic: current[1].mnemonic,
          key: `system.bonuses.skills.${current[0]}.xpMod`,
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          default: 5
        };
      }
      return a;
    }, {})
  };

  ACTIVE_EFFECTS_TYPES.xpBonusMysteryAbility.subtypes = {
    ...Object.entries(ARM5E.MYSTERY_ABILITIES).reduce((a, current) => {
      if (current[1].option) {
        a[current[0]] = {
          mnemonic: current[1].mnemonic,
          key: `system.bonuses.skills.${current[0]}_#OPTION#.xpMod`,
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          default: 5,
          option: current[1].optionDefault
        };
      } else {
        a[current[0]] = {
          mnemonic: current[1].mnemonic,
          key: `system.bonuses.skills.${current[0]}.xpMod`,
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          default: 5
        };
      }
      return a;
    }, {})
  };
}

const puissantTechniques = () => {
  return Object.entries(ARM5E.magic.techniques).reduce((a, current) => {
    a[current[0]] = {
      mnemonic: current[1].label,
      key: `system.arts.techniques.${current[0]}.bonus`,
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      default: 3
    };
    return a;
  }, {});
};

const puissantForms = () => {
  return Object.entries(ARM5E.magic.forms).reduce((a, current) => {
    a[current[0]] = {
      mnemonic: current[1].label,
      key: `system.arts.forms.${current[0]}.bonus`,
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      default: 3
    };
    return a;
  }, {});
};

const affinityTechniques = () => {
  return Object.entries(ARM5E.magic.techniques).reduce((a, current) => {
    a[current[0]] = {
      mnemonic: current[1].label,
      key: `system.arts.techniques.${current[0]}.xpCoeff`,
      mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
      default: 1.5
    };
    return a;
  }, {});
};

const affinityForms = () => {
  return Object.entries(ARM5E.magic.forms).reduce((a, current) => {
    a[current[0]] = {
      mnemonic: current[1].label,
      key: `system.arts.forms.${current[0]}.xpCoeff`,
      mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
      default: 1.5
    };
    return a;
  }, {});
};

const deficientTechniques = () => {
  return Object.entries(ARM5E.magic.techniques).reduce((a, current) => {
    a[current[0]] = {
      mnemonic: current[1].label,
      key: `system.arts.techniques.${current[0]}.deficient`,
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      default: true,
      readonly: true
    };
    return a;
  }, {});
};

const deficientForms = () => {
  return Object.entries(ARM5E.magic.forms).reduce((a, current) => {
    a[current[0]] = {
      mnemonic: current[1].label,
      key: `system.arts.forms.${current[0]}.deficient`,
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      default: true,
      readonly: true
    };
    return a;
  }, {});
};

const resistanceForms = () => {
  return Object.entries(ARM5E.magic.forms).reduce((a, current) => {
    a[current[0]] = {
      mnemonic: current[1].label,
      key: `system.bonuses.resistance.${current[0]}`,
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      default: 0
    };
    return a;
  }, {});
};

export const ACTIVE_EFFECTS_TYPES = {
  none: {
    category: "none",
    type: "none",
    tags: ["character", "covenant", "sanctum"],
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
    tags: ["character"],
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
      },
      warpingThreshold: {
        mnemonic: "arm5e.twilight.warpingThreshold",
        key: "system.bonuses.arts.warpingThreshold",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        default: 2
      },
      spellFatigueThreshold: {
        mnemonic: "arm5e.sheet.activeEffect.subtypes.spellFatigueThreshold",
        key: "system.bonuses.arts.spellFatigueThreshold",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        default: 10
      },
      ritualFatigueCancelled: {
        mnemonic: "arm5e.sheet.activeEffect.subtypes.ritualFatigueCancelled",
        key: "system.bonuses.arts.ritualFatigueCancelled",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        default: 0
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
    tags: ["character"],
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
      readingArts: {
        mnemonic: "arm5e.activity.readingArts",
        key: "system.bonuses.activities.readingArts",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
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
    tags: ["character"],
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
    tags: ["character"],
    mnemonic: "arm5e.sheet.arts",
    subtypes: {
      // added dynamically
    }
  },
  affinity: {
    category: "magic",
    type: "affinity",
    tags: ["character"],
    mnemonic: "arm5e.sheet.activeEffect.types.arts.affinity",
    subtypes: {
      // added dynamically
    }
  },
  deficiency: {
    category: "magic",
    type: "artDeficiency",
    tags: ["character"],
    mnemonic: "arm5e.sheet.activeEffect.types.arts.deficiency",
    subtypes: {
      // added dynamically
    }
  },
  formResistance: {
    category: "traits",
    type: "formResistance",
    tags: ["character"],
    mnemonic: "arm5e.sheet.activeEffect.types.formResistance",
    subtypes: {
      // added dynamically
    }
  },
  vitals: {
    category: "traits",
    type: "vitals",
    tags: ["character"],
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
    tags: ["character"],
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
      },
      cun: {
        mnemonic: "arm5e.sheet.cunning",
        key: "system.characteristics.cun.value",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      }
    }
  },
  characteristicBoost: {
    category: "traits",
    type: "characteristics",
    tags: ["character"],
    mnemonic: "arm5e.sheet.activeEffect.types.characteristicBoost",
    subtypes: {
      int: {
        mnemonic: "arm5e.sheet.intelligence",
        key: "system.characteristics.int.upgrade",
        mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
        default: 0
      },
      per: {
        mnemonic: "arm5e.sheet.perception",
        key: "system.characteristics.per.upgrade",
        mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
        default: 0
      },
      str: {
        mnemonic: "arm5e.sheet.strength",
        key: "system.characteristics.str.upgrade",
        mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
        default: 0
      },
      sta: {
        mnemonic: "arm5e.sheet.stamina",
        key: "system.characteristics.sta.upgrade",
        mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
        default: 0
      },
      pre: {
        mnemonic: "arm5e.sheet.presence",
        key: "system.characteristics.pre.upgrade",
        mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
        default: 0
      },
      com: {
        mnemonic: "arm5e.sheet.communication",
        key: "system.characteristics.com.upgrade",
        mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
        default: 0
      },
      dex: {
        mnemonic: "arm5e.sheet.dexterity",
        key: "system.characteristics.dex.upgrade",
        mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
        default: 0
      },
      qik: {
        mnemonic: "arm5e.sheet.quickness",
        key: "system.characteristics.qik.upgrade",
        mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
        default: 0
      },
      cun: {
        mnemonic: "arm5e.sheet.cunning",
        key: "system.characteristics.cun.upgrade",
        mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
        default: 0
      }
    }
  },
  fatigue: {
    category: "traits",
    type: "fatigue",
    tags: ["character"],
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
    tags: ["character"],
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
    tags: ["character"],
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
  realmSusceptibility: {
    category: "magic",
    type: "realmSusceptibility",
    tags: ["character"],
    mnemonic: "arm5e.sheet.activeEffect.types.realmSusceptibility",
    subtypes: {
      magic: {
        mnemonic: "arm5e.sheet.realm.magic",
        key: "system.realms.magic.susceptible",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        default: true
      },
      faeric: {
        mnemonic: "arm5e.sheet.realm.faeric",
        key: "system.realms.faeric.susceptible",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        default: true
      },
      divine: {
        mnemonic: "arm5e.sheet.realm.divine",
        key: "system.realms.divine.susceptible",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        default: true
      },
      infernal: {
        mnemonic: "arm5e.sheet.realm.infernal",
        key: "system.realms.infernal.susceptible",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        default: true
      }
    }
  },
  characterFeatures: {
    category: "character",
    type: "characterFeatures",
    tags: ["character"],
    mnemonic: "Character features",
    subtypes: {
      magicSystem: {
        mnemonic: "arm5e.feature.magicSystem",
        key: "system.features.magicSystem",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        default: true
      },
      // },
      // powers: {
      //   mnemonic: "arm5e.feature.powers",
      //   key: "system.features.powers",
      //   mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      //   default: true

      inteligentBeast: {
        mnemonic: "arm5e.feature.inteligentBeast",
        key: "system.intelligent",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        default: true
      }
    }
  },
  bonusGeneralAbility: {
    category: "abilities",
    type: "bonusGeneralAbility",
    tags: ["character"],
    mnemonic: "arm5e.sheet.activeEffect.types.generalAbilitiesBonus",
    subtypes: {
      // add dynamically
    }
  },
  bonusAcademicAbility: {
    category: "abilities",
    type: "bonusAcademicAbility",
    tags: ["character"],
    mnemonic: "arm5e.sheet.activeEffect.types.academicAbilitiesBonus",
    subtypes: {
      // add dynamically
    }
  },
  bonusArcaneAbility: {
    category: "abilities",
    type: "bonusArcaneAbility",
    tags: ["character"],
    mnemonic: "arm5e.sheet.activeEffect.types.arcaneAbilitiesBonus",
    subtypes: {
      // add dynamically
    }
  },

  bonusMartialAbility: {
    category: "abilities",
    type: "bonusMartialAbility",
    tags: ["character"],
    mnemonic: "arm5e.sheet.activeEffect.types.martialAbilitiesBonus",
    subtypes: {
      // add dynamically
    }
  },
  bonusMysteryAbility: {
    category: "abilities",
    type: "bonusMysteryAbility",
    tags: ["character"],
    mnemonic: "arm5e.sheet.activeEffect.types.mysteryAbilitiesBonus",
    subtypes: {
      // add dynamically
    }
  },
  bonusSupernaturalAbility: {
    category: "abilities",
    type: "bonusSupernaturalAbility",
    tags: ["character"],
    mnemonic: "arm5e.sheet.activeEffect.types.supernaturalAbilitiesBonus",
    subtypes: {
      // add dynamically
    }
  },
  bonusAlternateArt: {
    category: "abilities",
    type: "bonusAlternateArt",
    tags: ["character"],
    mnemonic: "arm5e.sheet.activeEffect.types.AlternateArtBonus",
    subtypes: {
      // add dynamically
    }
  },

  xpBonusGeneralAbility: {
    category: "abilities",
    type: "xpBonusGeneralAbility",
    tags: ["character"],
    mnemonic: "arm5e.sheet.activeEffect.types.generalAbilitiesXPBonus",
    subtypes: {
      // add dynamically
    }
  },

  xpBonusAcademicAbility: {
    category: "abilities",
    type: "xpBonusAcademicAbility",
    tags: ["character"],
    mnemonic: "arm5e.sheet.activeEffect.types.academicAbilitiesXPBonus",
    subtypes: {
      // add dynamically
    }
  },

  xpBonusArcaneAbility: {
    category: "abilities",
    type: "xpBonusArcaneAbility",
    tags: ["character"],
    mnemonic: "arm5e.sheet.activeEffect.types.arcaneAbilitiesXPBonus",
    subtypes: {
      // add dynamically
    }
  },

  xpBonusMartialAbility: {
    category: "abilities",
    type: "xpBonusMartialAbility",
    tags: ["character"],
    mnemonic: "arm5e.sheet.activeEffect.types.martialAbilitiesXPBonus",
    subtypes: {
      // add dynamically
    }
  },

  xpBonusSupernaturalAbility: {
    category: "abilities",
    type: "xpBonusSupernaturalAbility",
    tags: ["character"],
    mnemonic: "arm5e.sheet.activeEffect.types.supernaturalAbilitiesXPBonus",
    subtypes: {
      // add dynamically
    }
  },
  xpBonusMysteryAbility: {
    category: "abilities",
    type: "xpBonusMysteryAbility",
    tags: ["character"],
    mnemonic: "arm5e.sheet.activeEffect.types.mysteryAbilitiesXPBonus",
    subtypes: {
      // add dynamically
    }
  },

  // xpBonusMysticalAbility: {
  //   category: "abilities",
  //   type: "xpBonusMysticalAbility",
  //   mnemonic: "arm5e.sheet.activeEffect.types.supernaturalAbilitiesXPBonus",
  //   subtypes: {
  //     heartbeast: {
  //       mnemonic: "arm5e.skill.mystical.heartbeast",
  //       key: "system.bonuses.skills.heartbeast.xpMod",
  //       mode: 2,
  //       default: 5
  //     },

  //   }
  // },

  qualityAbilityBoost: {
    category: "abilities",
    type: "qualityAbilityBoost",
    tags: ["character"],
    mnemonic: "arm5e.sheet.activeEffect.types.qualityAbilityBoost",
    subtypes: {
      athletics: {
        mnemonic: "arm5e.skill.general.athletics",
        key: "system.bonuses.skills.athletics.upgrade",
        mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
        default: 5
      },
      awareness: {
        mnemonic: "arm5e.skill.general.awareness",
        key: "system.bonuses.skills.awareness.upgrade",
        mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
        default: 5
      },
      brawl: {
        mnemonic: "arm5e.skill.general.brawl",
        key: "system.bonuses.skills.brawl.upgrade",
        mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
        default: 5
      },
      hunt: {
        mnemonic: "arm5e.skill.general.hunt",
        key: "system.bonuses.skills.hunt.upgrade",
        mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
        default: 5
      },
      leadership: {
        mnemonic: "arm5e.skill.general.leadership",
        key: "system.bonuses.skills.leadership.upgrade",
        mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
        default: 5
      },
      music: {
        mnemonic: "arm5e.skill.general.music",
        key: "system.bonuses.skills.music.upgrade",
        mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
        default: 3
      },
      stealth: {
        mnemonic: "arm5e.skill.general.stealth",
        key: "system.bonuses.skills.stealth.upgrade",
        mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
        default: 5
      },
      survival: {
        mnemonic: "arm5e.skill.general.survival",
        key: "system.bonuses.skills.survival.upgrade",
        mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
        default: 5
      },
      swim: {
        mnemonic: "arm5e.skill.general.swim",
        key: "system.bonuses.skills.swim.upgrade",
        mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
        default: 5
      }
    }
  },
  affinityGeneralAbility: {
    category: "abilities",
    type: "affinityGeneralAbility",
    tags: ["character"],
    mnemonic: "arm5e.sheet.activeEffect.types.generalAbilitiesAffinity",
    subtypes: {
      // add dynamically
    }
  },
  affinityArcaneAbility: {
    category: "abilities",
    type: "affinityArcaneAbility",
    tags: ["character"],
    mnemonic: "arm5e.sheet.activeEffect.types.arcaneAbilitiesAffinity",
    subtypes: {
      // add dynamically
    }
  },
  affinityAcademicAbility: {
    category: "abilities",
    type: "affinityAcademicAbility",
    tags: ["character"],
    mnemonic: "arm5e.sheet.activeEffect.types.academicAbilitiesAffinity",
    subtypes: {
      // add dynamically
    }
  },
  affinityMartialAbility: {
    category: "abilities",
    type: "affinityMartialAbility",
    tags: ["character"],
    mnemonic: "arm5e.sheet.activeEffect.types.martialAbilitiesAffinity",
    subtypes: {
      // add dynamically
    }
  },
  affinityMysteryAbility: {
    category: "abilities",
    type: "affinityMysteryAbility",
    tags: ["character"],
    mnemonic: "arm5e.sheet.activeEffect.types.mysteryAbilitiesAffinity",
    subtypes: {
      // add dynamically
    }
  },
  affinitySupernaturalAbility: {
    category: "abilities",
    type: "affinitySupernaturalAbility",
    tags: ["character"],
    mnemonic: "arm5e.sheet.activeEffect.types.supernaturalAbilitiesAffinity",
    subtypes: {
      // add dynamicallyv
    }
  },
  affinityAlternateArt: {
    category: "abilities",
    type: "affinityAlternateArt",
    tags: ["character"],
    mnemonic: "arm5e.sheet.activeEffect.types.affinityAlternateArt",
    subtypes: {
      // add dynamically
    }
  },

  labActivity: {
    category: "magic",
    type: "laboratory",
    tags: ["character"],
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
    tags: ["sanctum"],
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
    tags: ["sanctum"],
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
    tags: ["character"],
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
    tags: ["covenant"],
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
    tags: ["covenant"],
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
    tags: ["covenant"],
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
    tags: ["covenant"],
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
    tags: ["covenant"],
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
