import { ARM5E } from "../config.js";
import ArM5eActiveEffect from "./active-effects.js";
import { ArM5ePCActor } from "../actor/actor.js";
import { log } from "../tools.js";
import { getRollTypeProperties, ROLL_MODIFIERS, ROLL_PROPERTIES } from "./rollWindow.js";
import Aura from "./aura.js";
import { computeLevel, spellFormLabel, spellTechniqueLabel } from "./magic.js";

export class ArM5eRollInfo {
  constructor(actor) {
    this._actor = actor;
    this.reset();
  }

  init(dataset) {
    this.reset();
    const actorSystemData = this._actor.system;
    this.type = dataset.roll;

    if (dataset.name) {
      this.label = dataset.name;
    }

    if (dataset.chatFlavor) {
      this.flavor = dataset.chatFlavor;
    }
    this.additionalData = dataset.moredata ?? {};

    if (dataset.img) {
      this.img = dataset.img;
    }

    if (dataset.botchNumber) {
      this.botchNumber = dataset.botchNumber;
    }

    this.rollProperties = getRollTypeProperties(this.type);

    if (this.rollProperties.MODE & ROLL_MODIFIERS.PHYSICAL) {
      this.physicalCondition = true;
    } else {
      this.physicalCondition = false;
    }
    // Possible to override physicalCondition with dataset
    if (dataset.physicalcondition != undefined) {
      this.physicalCondition = dataset.physicalcondition;
    }

    this.prepareRollFields(dataset);
    if (this.rollProperties.MODIFIERS & ROLL_MODIFIERS.ENCUMBRANCE) {
      this.setGenericField(
        game.i18n.localize("arm5e.sheet.encumbrance"),
        actorSystemData.combat.overload,
        3,
        "-"
      );
    }
    this.selection = {};
    this.addSelectObjects();
    switch (this.type) {
      case ROLL_PROPERTIES.INIT.VAL:
        break;
      case ROLL_PROPERTIES.ATTACK.VAL:
      case ROLL_PROPERTIES.DEFENSE.VAL:
        if (this.img === "") this.img = actorSystemData.combat.img;
        this.itemId = actorSystemData.combat.itemId;
        this.name = actorSystemData.combat.name;

        break;
      case ROLL_PROPERTIES.CHAR.VAL:
        this.characteristic = dataset.characteristic;

        break;
      case ROLL_PROPERTIES.ABILITY.VAL:
        if (dataset.defaultcharacteristic) {
          this.characteristic = dataset.defaultcharacteristic;
        }

        const ab = this._actor.items.get(dataset.ability);
        if (this.img === "") this.img = ab.img;
        this.itemId = ab.id;
        this.name = ab.name;
        this.label = this.name;
        this.ability.id = dataset.ability;
        this.ability.active = true;
        this.ability.name = ab.name;
        this.ability.key = ab.system.key;
        this.ability.option = ab.system.option;
        this.ability.speciality = ab.system.speciality;
        this.ability.score = ab.system.finalScore;
        this.ability.realm = ab.system.realm;
        this.ability.category = ab.system.category;
        break;

      case "item": // No roll here
        if (dataset.id) {
          const item = this._actor.items.get(dataset.id);
          const effect = item.system.enchantments.effects[dataset.index];
          this.label += ` : ${effect.name}`;
          this.label += ` (${spellTechniqueLabel(effect.system, true)}`;
          this.label += `${spellFormLabel(effect.system, true)}`;
          this.label += ` ${computeLevel(effect.system, "enchantment")} )`;
          this.penetration.total = effect.system.penetration;
          this.item.frequency = effect.system.effectfrequency;
          this.item.charges = item.system.enchantments.charges;
          this.item.form = effect.system.form.value;
          this.item.charged = item.system.enchantments.charged;
          this.item.id = dataset.id;
        }
        break;

      case "power": // No roll here
        if (dataset.id) {
          let power = this._actor.items.get(dataset.id);
          this.label += ` (${ARM5E.magic.arts[power.system.form].short})`;
          if (this.img === "") this.img = power.img;
          this.itemId = power.id;
          this.power.cost = Number(power.system.cost);
          this.power.penetrationPenalty = this.power.cost * 5;
          this.power.form = power.system.form;
        }
        this.initPenetrationVariables();
        break;
      case ROLL_PROPERTIES.SUPERNATURAL.VAL:
        if (dataset.id) {
          let effect = this._actor.items.get(dataset.id);

          if (this.label === "") {
            this.label = effect.name;
          }
          this.itemId = effect.id;
          if (effect.system.characteristic) {
            this.characteristic = effect.system.characteristic;
            this.characteristicLabel =
              CONFIG.ARM5E.character.characteristics[this.characteristic].label;
            this.characteristicValue = actorSystemData.characteristics[this.characteristic].value;
          }
          this.magic.level = effect.system.level;
          this.magic.technique.active = effect.system.verb.active ?? false;
          this.magic.technique.value = effect.system.verb.option;
          this.magic.technique.label = effect.system.verb.label;
          this.magic.technique.score = effect.system.verb.score;
          this.magic.technique.specialty = effect.system.verb.specialty;
          this.magic.technique.specApply = effect.system.verb.specApply;
          this.magic.form.value = effect.system.noun.option;
          this.magic.form.active = effect.system.noun.active ?? false;
          this.magic.form.label = effect.system.noun.label;
          this.magic.form.score = effect.system.noun.score;
          this.magic.form.specialty = effect.system.noun.specialty;
          this.magic.form.specApply = effect.system.noun.specApply;
          this.magic.bonus = effect.system.modifier.value ?? 0;
          this.magic.bonusDesc = effect.system.modifier.label ?? "";

          this.ability.realm = this._actor.system.magicSystem.realm;
          this.ability.active = effect.system.bonusAbility.active;
          this.ability.label = effect.system.bonusAbility.label ?? "";
          this.ability.name = effect.system.bonusAbility.name ?? "";
          this.ability.key = effect.system.bonusAbility.key;
          this.ability.option = effect.system.bonusAbility.option;
          this.ability.speciality = effect.system.bonusAbility.specialty;
          this.ability.specApply = effect.system.bonusAbility.specApply;
          this.ability.score = effect.system.bonusAbility.score;

          const template = actorSystemData.magicSystem.templates[effect.system.template];
          this.useFatigue = template.useFatigue;
          this.dieType = template.rollType;
        }
        this.initPenetrationVariables();
        break;
      case ROLL_PROPERTIES.MAGIC.VAL:
      case ROLL_PROPERTIES.SPONT.VAL:
        this.useFatigue = true;

        this.magic.divide = this._actor.system.bonuses.arts.spontDivider;
      case ROLL_PROPERTIES.SPELL.VAL:
        this.initPenetrationVariables();
        this.characteristic = "sta";
        if (dataset.id) {
          let spell = this._actor.items.get(dataset.id);
          if (this.label === "") {
            this.label = spell.name;
          }
          this.label += ` (${spell.system.level})`;
          if (this.img === "") this.img = spell.img;
          this.itemId = spell.id;
          let techData = spell._getTechniqueData(this._actor.system);
          this.magic.technique.value = spell.system.technique.value;
          this.magic.technique.label = techData[0];
          this.magic.technique.score = techData[1];
          this.magic.technique.deficiency = techData[2];
          let formData = spell._getFormData(this._actor.system);
          this.magic.form.label = formData[0];
          this.magic.form.score = formData[1];
          this.magic.form.deficiency = formData[2];
          this.magic.form.value = spell.system.form.value;
          this.magic.bonus = spell.system.bonus ?? 0;
          this.magic.bonusDesc = spell.system.bonusDesc ?? "";
          if (dataset.applyfocus != undefined) {
            this.magic.focus = dataset.applyfocus;
          } else {
            this.magic.focus = spell.system.applyFocus;
          }
          this.magic.ritual = spell.system.ritual ?? false;
          this.magic.level = spell.system.level;
          this.magic.masteryScore = spell.system.finalScore ?? 0;
          this.bonuses = this.magic.bonus;
        } else {
          if (dataset.technique) {
            this.magic.technique.value = dataset.technique;
            this.magic.technique.label = ARM5E.magic.techniques[dataset.technique].label;
            this.magic.technique.score = parseInt(
              actorSystemData.arts.techniques[dataset.technique].finalScore
            );
            this.magic.technique.deficiency =
              actorSystemData.arts.techniques[dataset.technique].deficient;
          }

          if (dataset.form) {
            this.magic.form.value = dataset.form;
            this.magic.form.label = ARM5E.magic.forms[dataset.form].label;
            this.magic.form.score = parseInt(actorSystemData.arts.forms[dataset.form].finalScore);
            this.magic.form.deficiency = actorSystemData.arts.forms[dataset.form].deficient;
          }
          this.magic.masteryScore = 0;
        }

        break;
      case ROLL_PROPERTIES.TWILIGHT_CONTROL.VAL:
        this.characteristic = "sta";
        this.environment.year = parseInt(dataset.year);
        this.environment.season = dataset.season;
        this.environment.seasonLabel = ARM5E.seasons[dataset.season].label;
        this.label = `${game.i18n.localize("arm5e.twilight.control.roll")}`;
        this.twilight = {
          concentration: this._actor.getAbilityStats("concentration")
        };
        this.setGenericField(
          game.i18n.localize("arm5e.skill.general.concentration"),
          this.twilight.concentration.score,
          1,
          "+"
        );
        this.setGenericField(
          game.i18n.localize("arm5e.twilight.vimModifier"),
          Math.ceil(this._actor.system.arts.forms.vi.finalScore / 5),
          2,
          "+"
        );
        break;
      case ROLL_PROPERTIES.TWILIGHT_STRENGTH.VAL:
        this.environment.aura = Aura.fromActor(this._actor);
        this.environment.aura.modifier = this.environment.aura.level;
        this.label = `${game.i18n.localize("arm5e.twilight.strength")}`;
        this.twilight = {
          warpingPts: parseInt(dataset.warpingPts ?? 2),
          enigma: this._actor.getAbilityStats("enigma")
        };
        this.setGenericField(
          game.i18n.localize("arm5e.sheet.warping"),
          dataset.warpingPts ?? 2,
          1,
          "+"
        );
        this.setGenericField(
          game.i18n.localize("arm5e.skill.mystery.enigma"),
          this.twilight.enigma.score,
          2,
          "+"
        );
        // this.setGenericField(game.i18n.localize("arm5e.sheet.levelAura"), aura.level, 3, "+");

        break;
      case ROLL_PROPERTIES.TWILIGHT_COMPLEXITY.VAL:
        this.label = `${game.i18n.localize("arm5e.twilight.complexity")}`;

        this.setGenericField(
          game.i18n.localize("arm5e.twilight.warpingScore"),
          this._actor.system.warping.finalScore ?? 0,
          1,
          "+"
        );
        break;

      case ROLL_PROPERTIES.TWILIGHT_UNDERSTANDING.VAL:
        this.label = `${game.i18n.localize("arm5e.twilight.comprehension.roll")}`;
        this.twilight = {
          enigma: this._actor.getAbilityStats("enigma")
        };
        this.setGenericField(
          game.i18n.localize("arm5e.skill.mystery.enigma"),
          this.twilight.enigma.score,
          1,
          "+"
        );
        break;
      case ROLL_PROPERTIES.AGING.VAL:
        this.environment.year = parseInt(dataset.year);
        this.environment.season = dataset.season;
        this.environment.seasonLabel = ARM5E.seasons[dataset.season].label;
        this.label = `${game.i18n.localize("arm5e.aging.roll.label")} ${game.i18n.localize(
          ARM5E.seasons[dataset.season].label
        )} ${this.environment.year}`;
        this.setGenericField(
          game.i18n.localize("arm5e.sheet.ageModifier"),
          Math.round(parseInt(this.environment.year - actorSystemData.description.born.value) / 10),
          1
        );
        let livingMod = 0;
        if (actorSystemData.covenant?.linked) {
          let cov = actorSystemData.covenant.document;
          if (ArM5ePCActor.isMagus(this._actor.type, actorSystemData.charType.value)) {
            livingMod = cov.system.modifiersLife.magi ?? 0;
          } else {
            livingMod = cov.system.modifiersLife.mundane ?? 0;
          }
        }
        this.setGenericField(game.i18n.localize("arm5e.sheet.modifiersLife"), livingMod, 2, "-");

        this.setGenericField(
          game.i18n.localize("arm5e.sheet.longevityModifier"),
          actorSystemData.bonuses.traits.aging,
          3,
          "-"
        );
        if (actorSystemData.familiar && actorSystemData.familiar.cordFam.bronze > 0) {
          this.setGenericField(
            game.i18n.localize("arm5e.aging.roll.bronze"),
            actorSystemData.familiar.cordFam.bronze,
            4,
            "-"
          );
        }
        break;
      case ROLL_PROPERTIES.CRISIS.VAL:
        this.environment.year = parseInt(dataset.year);
        this.environment.season = dataset.season;
        this.environment.seasonLabel = ARM5E.seasons[dataset.season].label;
        this.label = `${game.i18n.localize("arm5e.aging.crisis.label")} ${game.i18n.localize(
          ARM5E.seasons[dataset.season].label
        )} ${this.environment.year}`;

        this.setGenericField(
          game.i18n.localize("arm5e.sheet.decrepitude"),
          actorSystemData.decrepitude.finalScore,
          1
        );
        this.setGenericField(
          game.i18n.localize("arm5e.sheet.ageModifier"),
          Math.round(parseInt(this.environment.year - actorSystemData.description.born.value) / 10),
          2
        );
        break;
      // Case "option":
      default:
        break;
    }

    if (dataset.divide != undefined) {
      this.magic.divide = dataset.divide;
    }
    if (dataset.usefatigue != undefined) {
      this.useFatigue = dataset.usefatigue;
    }
    this.activeEffects = [];
    if (["magic", "power", "spont", "spell", "supernatural"].includes(this.type)) {
      this.getSpellcastingModifiers();
    }
    this.optionalBonuses = this.getOptionalBonuses(this.type);
    this.bonusesExtended = this.bonuses;
    this.getAuraModifier();

    this.cleanBooleans();
  }

  initPenetrationVariables() {
    this.penetration = this._actor.getAbilityStats("penetration");
    this.penetration.multiplier = 1;
    this.penetration.specApply = false;
    this.penetration.penetrationMastery = false;
    this.penetration.multiplierBonusArcanic = 0;
    this.penetration.multiplierBonusSympathic = 0;
    this.penetration.config = ARM5E.magic.penetration;
    this.penetration.total = 0;
    this.penetration.selection = { sympathic: {}, arcanic: {} };
    this.penetration.selection.sympathic = Object.fromEntries(
      Object.entries(this.penetration.config.sympathy).map(([k, v]) => {
        return [v.bonus, `${game.i18n.localize(v.label)} (+${v.bonus})`];
      })
    );
    this.penetration.selection.arcanic = Object.fromEntries(
      Object.entries(this.penetration.config.arcaneCon).map(([k, v]) => {
        return [v.bonus, `${game.i18n.localize(v.label)} (+${v.bonus})`];
      })
    );
  }

  get isMagic() {
    return ["magic", "spont", "spell"].includes(this.type);
  }

  addSelectObjects() {
    this.selection.characteristics = Object.fromEntries(
      Object.entries(this._actor.system.characCfg).map(([k, v]) => {
        return [
          k,
          `${game.i18n.localize(v.label)} (${this._actor.system.characteristics[k].value})`
        ];
      })
    );

    this.selection.abilities = {
      None: game.i18n.localize("arm5e.sheet.activeEffect.subtypes.none"),
      ...Object.fromEntries(
        this._actor.system.abilities.map((a) => {
          return [a._id, `${a.name} (${a.system.finalScore})`];
        })
      )
    };
    if (this.isMagic) {
      this.selection.voiceStances = Object.fromEntries(
        Object.entries(this._actor.system.stances.voice).map(([k, v]) => {
          return [k, `${game.i18n.localize(CONFIG.ARM5E.magic.mod.voice[k].mnemonic)} (${v})`];
        })
      );
      this.selection.gesturesStances = Object.fromEntries(
        Object.entries(this._actor.system.stances.gestures).map(([k, v]) => {
          return [k, `${game.i18n.localize(CONFIG.ARM5E.magic.mod.gestures[k].mnemonic)} (${v})`];
        })
      );

      this.selection.techniques = Object.fromEntries(
        Object.entries(this._actor.system.arts.techniques).map(([k, v]) => {
          return [k, `${CONFIG.ARM5E.magic.arts[k].label} (${v.finalScore})`];
        })
      );
      this.selection.forms = Object.fromEntries(
        Object.entries(this._actor.system.arts.forms).map(([k, v]) => {
          return [k, `${CONFIG.ARM5E.magic.arts[k].label} (${v.finalScore})`];
        })
      );
    }
  }

  getOptionalBonuses(type) {
    if (["magic", "spont"].includes(type)) {
      type = "spontMagic";
    } else if ("spell" == type) {
      type = "formulaicMagic";
    }
    const activeEffects = CONFIG.ISV10 ? this._actor.effects : this._actor.appliedEffects;
    let activeEffectsByType = ArM5eActiveEffect.findAllActiveEffectsWithTypeAndSubtypeFiltered(
      activeEffects,
      "optionalRollBonus",
      type
    );

    let res = [];
    for (let effect of activeEffectsByType) {
      let total = 0;
      // There should be only one, but just in case
      for (let ch of effect.changes) {
        total += Number(ch.value);
      }
      const name = CONFIG.ISV10 ? effect.label : effect.name;
      res.push({ name: name, key: effect.changes[0].key, bonus: total, active: false });
    }
    return res;
  }

  setGenericField(name, value, idx, op = "+") {
    this.generic.txtOption[idx - 1] = name;
    this.generic.option[idx - 1] = value;
    this.generic.operatorOpt[idx - 1] = op;
  }

  hasGenericField(idx) {
    return this.generic.txtOption[idx - 1] != "";
  }

  getGenericFieldLabel(idx) {
    return this.generic.txtOption[idx - 1];
  }

  getGenericFieldOperator(idx) {
    return this.generic.operatorOpt[idx - 1];
  }

  getGenericFieldValue(idx) {
    if (this.generic.operatorOpt[idx - 1] === "+") return Number(this.generic.option[idx - 1]);
    else {
      return -Number(this.generic.option[idx - 1]);
    }
  }

  getGenericFieldDetails(idx) {
    return `${this.generic.operatorOpt[idx - 1]} ${this.getGenericFieldLabel(idx)} (${
      this.generic.option[idx - 1]
    }) <br/>`;
  }

  prepareRollFields(dataset) {
    if (dataset.modifier) {
      this.modifier = parseInt(this.modifier) + parseInt(dataset.modifier);
    }
    if (dataset.txtoption1) {
      this.setGenericField(dataset.txtoption1, dataset.option1, 1, dataset.operator1 ?? "+");
    }
    if (dataset.txtoption2) {
      this.setGenericField(dataset.txtoption2, dataset.option2, 2, dataset.operator2 ?? "+");
    }
    if (dataset.txtoption3) {
      this.setGenericField(dataset.txtoption3, dataset.option3, 3, dataset.operator3 ?? "+");
    }
    if (dataset.txtoption4) {
      this.setGenericField(dataset.txtoption4, dataset.option4, 4, dataset.operator4 ?? "+");
    }
    if (dataset.txtoption5) {
      this.setGenericField(dataset.txtoption5, dataset.option5, 5, dataset.operator5 ?? "+");
    }
    if (dataset.txtoption6) {
      this.setGenericField(dataset.txtoption6, dataset.option6, 6, dataset.operator6 ?? "+");
    }
  }

  cleanBooleans() {
    // Clean booleans
    if (this.useFatigue === "false") {
      this.useFatigue = false;
    } else if (this.useFatigue === "true") {
      this.useFatigue = true;
    }

    if (this.physicalCondition === "false") {
      this.physicalCondition = false;
    } else if (this.physicalCondition === "true") {
      this.physicalCondition = true;
    }
  }

  reset() {
    this.magic = {
      technique: {
        active: true,
        value: "",
        score: 0,
        label: "",
        deficiency: false,
        specialty: "",
        specApply: false
      },
      form: {
        active: true,
        value: "",
        score: 0,
        label: "",
        deficiency: false,
        specialty: "",
        specApply: false
      },

      // technique.active: true,
      // technique: "",
      // technique.score: 0,
      // technique.label: "",
      // techniqueSpec: false,
      // form.active: true,
      // form: "",
      // form.score: 0,
      // form.label: "",
      // formSpec: false,
      bonus: 0,
      bonusDesc: "",
      masteryScore: 0,
      ritual: false,
      focus: false,
      masteryScore: 0,
      divide: 1,
      level: 0
    };
    this.rollProperties = {};
    this.power = {
      cost: 0,
      penetrationPenalty: 0,
      form: ""
    };

    this.twilight = {
      warpingPts: 0,
      concentration: { score: 0, spec: "" },
      enigma: { score: 0, spec: "" },
      strength: 0,
      complexity: 0
    };

    this.item = {};
    this.spell = null;

    this.penetration = {
      multiplier: 1,
      score: 0,
      speciality: "",
      specApply: false,
      penetrationMastery: false,
      multiplierBonusArcanic: 0,
      multiplierBonusSympathic: 0,
      total: 0
    };

    this.characteristic = "";

    this.ability = { id: "None", name: "", score: 0, speciality: "", specApply: false };

    this.combat = { exertion: false, advantage: 0 };

    this.generic = {
      option: [0, 0, 0, 0, 0, 0],
      txtOption: ["", "", "", "", "", ""],
      operatorOpt: ["+", "+", "+", "+", "+", "+"]
    };

    this.environment = { aura: 0, year: "", season: "", seasonLabel: "" };
    this.activeEffects = [];

    this.bonuses = 0;
    this.bonusesExtended = 0;
    this.optionalBonuses = [];
    this.type = "";
    this.label = "";
    this.details = "";
    // Roll formula
    this.formula = "";
    // Added to chat message as an icon for the roll
    this.img = "";
    this.itemId = "";
    // Roll window title
    this.name = "";
    this.flavor = "";

    // Arbitrary bonus
    this.modifier = 0;
    this.useFatigue = false;
    // Whether physical condition impact the roll
    this.physicalCondition = true;
    this.secondaryScore = 0;
    // Optional data used in the callback
    this.additionalData = {};

    this.botchNumber = -1;
  }

  getAuraModifier() {
    const superNatAbility =
      this.type == "ability" &&
      this.ability.category == "supernaturalCat" &&
      this.ability.realm != "mundane";
    const noRollWithAura = ["power", "item"].includes(this.type);
    const auraApply =
      superNatAbility || noRollWithAura || this.rollProperties.MODIFIERS & ROLL_MODIFIERS.AURA;
    if (auraApply) {
      this.environment.aura = Aura.fromActor(this._actor);
      if (this.type === "supernatural") {
        this.environment.aura.computeAuraModifierFor(
          CONFIG.ARM5E.realmsExt[this.ability.realm].index
        );
      } else {
        if (superNatAbility) {
          this.environment.aura.computeAuraModifierFor(
            CONFIG.ARM5E.realmsExt[this.ability.realm].index
          );
        } else {
          this.environment.aura.computeMaxAuraModifier(this._actor.system.realms);
        }
      }
    }
  }

  getSpellcastingModifiers() {
    this.bonuses += this._actor.system.bonuses.arts.spellcasting;
    // Log(false, `Bonus spellcasting: ${this._actor.system.bonuses.arts.spellcasting}`);
    const activeEffects = CONFIG.ISV10 ? this._actor.effects : this._actor.appliedEffects;
    let activeEffectsByType = ArM5eActiveEffect.findAllActiveEffectsWithType(
      activeEffects,
      "spellcasting"
    );
    this.activeEffects.concat(
      activeEffectsByType.map((activeEffect) => {
        const label = CONFIG.ISV10 ? activeEffect.label : activeEffect.name;
        let value = 0;

        activeEffect.changes
          .filter((c, idx) => {
            return (
              c.mode == CONST.ACTIVE_EFFECT_MODES.ADD &&
              activeEffect.getFlag("arm5e", "type")[idx] == "spellcasting"
            );
          })
          .forEach((item) => {
            value += Number(item.value);
          });
        return {
          label,
          value
        };
      })
    );
  }
}
