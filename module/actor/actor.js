import { ARM5E } from "../config.js";
import {
  compareBaseEffects,
  compareSpells,
  compareMagicalEffects,
  compareLabTexts,
  log,
  error,
  compareTopics,
  integerToRomanNumeral,
  slugify
} from "../tools.js";

import { ACTIVE_EFFECTS_TYPES } from "../constants/activeEffectsTypes.js";

import { migrateActorData } from "../migration.js";

import ArM5eActiveEffect from "../helpers/active-effects.js";
import { ArM5eRollInfo } from "../helpers/rollInfo.js";
import { compareDiaryEntries, isInThePast } from "../tools/time.js";
import Aura from "../helpers/aura.js";
import { canBeEnchanted } from "../helpers/magic.js";
import { ArM5eMagicSystem } from "./subsheets/magic-system.js";

/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class ArM5ePCActor extends Actor {
  /**
   * Augment the basic actor data with additional dynamic system.
   **/

  constructor(data, context) {
    super(data, context);
    this.rollInfo = new ArM5eRollInfo(this);
  }

  prepareData() {
    super.prepareData();
  }

  /** @override */
  prepareBaseData() {
    super.prepareBaseData();
    if (!this.flags.arm5e) {
      this.flags.arm5e = { filters: {} };
    }
    // Add properties used for active effects:

    if (["player", "npc", "laboratory"].includes(this.type)) {
      this.system.covenant.document = game.actors.get(this.system.covenant.actorId);
      if (this.system.covenant.document) {
        this.system.covenant.value = this.system.covenant.document.name;
        this.system.covenant.linked = true;
      } else {
        this.system.covenant.linked = false;
      }
    }

    if (this.type == "covenant") {
      this.system.buildPoints.laboratoryTexts.computed = 0;
      this.system.buildPoints.library.computed = 0;
      this.system.buildPoints.vis.computed = 0;
      this.system.buildPoints.magicItems.computed = 0;
      this.system.buildPoints.laboratories.computed = 0;
      this.system.buildPoints.money.computed = 0;
      this.system.buildPoints.specialists.computed = 0;

      this.system.yearlyExpenses.buildings.magicMod = 0;
      this.system.yearlyExpenses.consumables.magicMod = 0;
      this.system.yearlyExpenses.laboratories.magicMod = 0;
      this.system.yearlyExpenses.provisions.magicMod = 0;
      this.system.yearlyExpenses.wages.magicMod = 0;
      this.system.yearlyExpenses.weapons.magicMod = 0;
      this.system.yearlyExpenses.writingMaterials.magicMod = 0;

      this.system.yearlyExpenses.buildings.mod = 0;
      this.system.yearlyExpenses.consumables.mod = 0;
      this.system.yearlyExpenses.laboratories.mod = 0;
      this.system.yearlyExpenses.provisions.mod = 0;
      this.system.yearlyExpenses.wages.mod = 0;
      this.system.yearlyExpenses.weapons.mod = 0;
      this.system.yearlyExpenses.writingMaterials.mod = 0;

      this.system.yearlyExpenses.buildings.amount = 0;
      this.system.yearlyExpenses.consumables.amount = 0;
      this.system.yearlyExpenses.laboratories.amount = 0;
      this.system.yearlyExpenses.provisions.amount = 0;
      this.system.yearlyExpenses.wages.amount = 0;
      this.system.yearlyExpenses.weapons.amount = 0;
      this.system.yearlyExpenses.writingMaterials.amount = 0;
      this.system.yearlyExpenses.buildings.craftSavings = 0;
      this.system.yearlyExpenses.consumables.craftSavings = 0;
      this.system.yearlyExpenses.laboratories.craftSavings = 0;
      this.system.yearlyExpenses.provisions.craftSavings = 0;
      this.system.yearlyExpenses.wages.craftSavings = 0;
      this.system.yearlyExpenses.weapons.craftSavings = 0;
      this.system.yearlyExpenses.writingMaterials.craftSavings = 0;

      this.system.finances.inhabitantsPoints = 0;
      this.system.finances.laboratoriesPoints = 0;
      this.system.finances.weaponsPoints = 0;

      this.system.census = {
        magi: 0,
        companions: 0,
        specialists: 0,
        craftsmen: 0,
        turbula: 0,
        laborers: 0,
        teamsters: 0,
        servants: 0,
        dependants: 0,
        horses: 0,
        livestock: 0,
        servantsNeeded: 0,
        teamstersNeeded: 0
      };
    }

    if (this.type == "laboratory") {
      this.system.size.bonus = 0;
      this.system.generalQuality.bonus = 0;
      this.system.safety.bonus = 0;
      this.system.health.bonus = 0;
      this.system.refinement.bonus = 0;
      this.system.upkeep.bonus = 0;
      this.system.warping.bonus = 0;
      this.system.aesthetics.bonus = 0;
      this.system.aesthetics.max = 999;
      this.system.auraBonus = 0;

      // Create data keys for lab specialty
      this.system.specialty = {};
      for (let key of Object.keys(CONFIG.ARM5E.magic.arts)) {
        this.system.specialty[key] = { bonus: 0 };
      }

      this.system.specialty.experimentation = { bonus: 0 };
      this.system.specialty.familiar = { bonus: 0 };
      this.system.specialty.items = { bonus: 0 };
      this.system.specialty.longevityRituals = { bonus: 0 };
      this.system.specialty.spells = { bonus: 0 };
      this.system.specialty.texts = { bonus: 0 };
      this.system.specialty.visExtraction = { bonus: 0 };

      this.system.owner.document = game.actors.get(this.system.owner.actorId);
      if (this.system.owner.document) {
        this.system.owner.value = this.system.owner.document.name;
        this.system.owner.linked = true;
      } else {
        this.system.owner.linked = false;
      }

      // Hopefully this can be reworked to use ID instead of name
      this.system.aura = new Aura(this.system.covenant.document?.system?.scene?.id);
      return;
    }

    // NOT LAB or COVENANT from here

    if (this.type != "player" && this.type != "npc" && this.type != "beast") {
      return;
    }
    const datetime = game.settings.get("arm5e", "currentDate");
    if (this.system.creationMode) {
      this.system.description.born.value = Number(datetime.year) - this.system.age.value;
    } else {
      this.system.age.value = this.system.description?.born?.value
        ? Number(datetime.year) - this.system.description.born.value
        : 20;
    }

    for (let [k, c] of Object.entries(this.system.characteristics)) {
      this.system.characteristics[k].upgrade = -99;
    }
    this.system.wounds = {
      healthy: [],
      light: [],
      medium: [],
      heavy: [],
      incap: [],
      dead: []
    };

    this.system.combat = {
      load: 0,
      overload: 0,
      init: 0,
      atk: 0,
      dfn: 0,
      dam: 0,
      prot: 0,
      ability: 0
    };

    // // CHARACTER FEATURES
    if (this.system.features == undefined) {
      this.system.features = { magicSystem: false, powers: false };
    }

    this.system.bonuses = {};

    if (this._isMagus()) {
      // Hack, if the active effect for magus is not setup
      this.system.realms.magic.aligned = true;

      for (let key of Object.keys(this.system.arts.techniques)) {
        this.system.arts.techniques[key].bonus = 0;
        this.system.arts.techniques[key].xpCoeff = 1.0;
        this.system.arts.techniques[key].deficient = false;
      }

      for (let key of Object.keys(this.system.arts.forms)) {
        this.system.arts.forms[key].bonus = 0;
        this.system.arts.forms[key].xpCoeff = 1.0;
        this.system.arts.forms[key].deficient = false;
      }

      this.system.stances.gestures = foundry.utils.deepClone(CONFIG.ARM5E.magic.stances.gestures);
      this.system.stances.voice = foundry.utils.deepClone(CONFIG.ARM5E.magic.stances.voice);

      if (!this.system.labTotal) {
        this.system.labTotal = {
          modifier: 0,
          quality: 0,
          aura: 0,
          applyFocus: false
        };
      }
    }

    // For characters
    this.system.bonuses.labActivities = {
      learnSpell: 0,
      inventSpell: 0
    };

    this.system.bonuses.arts = {
      spellcasting: 0,
      laboratory: 0,
      magicResistance: null,
      spontDivider: 2,
      spontDividerNoFatigue: 5,
      masteryXpCoeff: 1.0,
      masteryXpMod: 0,
      warpingThreshold: 2,
      spellFatigueThreshold: 0,
      ritualFatigueCancelled: 0
    };

    this.system.bonuses.skills = {};
    for (const [key, item] of this.items.entries()) {
      if (item.type == "ability") {
        let abilityKey = item.system?.key || "";
        if (abilityKey != "") {
          // Log(false, `Ability key: ${abilityKey}`);
          if (CONFIG.ARM5E.ALL_ABILITIES[abilityKey]?.option || false) {
            abilityKey += `_${item.system.option}`;
          }
          this.system.bonuses.skills[abilityKey] = {};
          this.system.bonuses.skills[abilityKey].bonus = 0;
          this.system.bonuses.skills[abilityKey].xpMod = 0;
          this.system.bonuses.skills[abilityKey].xpCoeff = 1.0;
          this.system.bonuses.skills[abilityKey].upgrade = 0;
        }
      }
    }
    this.system.penalties = {
      activityDivider: 1,
      activityBlocker: false,
      wounds: {
        light: CONFIG.ARM5E.recovery.wounds.light.penalty,
        medium: CONFIG.ARM5E.recovery.wounds.medium.penalty,
        heavy: CONFIG.ARM5E.recovery.wounds.heavy.penalty,
        incap: CONFIG.ARM5E.recovery.wounds.incap.penalty,
        dead: 0
      }
    };

    this.system.bonuses.traits = {
      soak: 0,
      aging: 0,
      wounds: 0,
      fatigue: 0,
      agingStart: 0,
      recovery: 0
    };

    this.system.bonuses.activities = {
      practice: 0,
      training: 0,
      teaching: 0,
      teacher: 0,
      reading: 0,
      readingArts: 0,
      writing: 0,
      adventuring: 0,
      visStudy: 0
    };
    this.system.bonuses.resistance = {
      an: 0,
      aq: 0,
      au: 0,
      co: 0,
      he: 0,
      ig: 0,
      im: 0,
      me: 0,
      te: 0,
      vi: 0
    };
  }

  /** @override */
  prepareDerivedData() {
    if (this.type == "magicCodex") {
      return this._prepareMagicCodexData();
    } else if (this.type == "covenant") {
      return this._prepareCovenantData();
    } else if (this.type == "laboratory") {
      return this._prepareLabData();
    } else if (this.type == "container") {
      return this._prepareContainerData();
    } else if (this.type == "base") {
      return {};
    } else {
      return this._prepareCharacterData();
    }
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData() {
    const system = this.system;
    log(false, `Preparing Actor ${this.name} data`);
    // Initialize containers.
    let weapons = [];
    let armor = [];
    let spells = [];
    let magicalEffects = [];
    let vis = [];
    let items = [];
    let artsTopics = [];
    let mundaneTopics = [];
    let masteryTopics = [];
    let laboratoryTexts = [];
    let physicalBooks = [];
    let virtues = [];
    let flaws = [];

    system.qualities = [];
    system.inferiorities = [];
    let abilities = [];
    let abilitiesSelect = {};
    let diaryEntries = [];
    let abilitiesFamiliar = [];
    let powersFamiliar = [];
    let pendingXps = 0;

    let soak = system.characteristics.sta.value + system.bonuses.traits.soak;

    let powers = [];

    let reputations = [];
    system.personalities = [];

    let totalXPAbilities = 0;
    let totalXPArts = 0;
    let totalVirtues = 0;
    let totalFlaws = 0;
    system.totalQualities = 0;
    system.totalInferiorities = 0;
    let totalXPSpells = 0;
    let totalXPMasteries = 0;

    let combat = {
      load: 0,
      overload: 0,
      init: 0,
      atk: 0,
      dfn: 0,
      dam: 0,
      prot: 0,
      ability: 0
    };

    if (this.system.features.magicSystem) {
      try {
        ArM5eMagicSystem.prepareData(this);
      } catch (err) {
        err.message = `Failed loading alternate magic system : ${err.message}`;
        console.error(err);
      }
    }

    if (this.system.charType?.value === "entity") {
      this.system.features.powers = true;
      this.system.features.hasMight = true;
    }

    this.system.characCfg = foundry.utils.deepClone(CONFIG.ARM5E.character.characteristics);
    if ((this.system.intelligent && this.type === "beast") || this.type !== "beast") {
      delete this.system.characCfg.cun;
    } else {
      delete this.system.characCfg.int;
    }

    system.characTotal = 0;
    for (let c of Object.values(system.characteristics)) {
      if (c.value > 0) {
        system.characTotal += (c.value * (c.value + 1)) / 2;
      } else {
        system.characTotal -= (Math.abs(c.value) * (Math.abs(c.value) + 1)) / 2;
      }
      c.value = Math.max(c.upgrade ?? -99, c.value);
    }

    // Fatigue management
    if (system.fatigue) {
      system.fatigueTotal = 0;
      let lvl = 0;
      for (let [key, item] of Object.entries(system.fatigue)) {
        let fatigueArray = [];

        for (let ii = 0; ii < item.amount; ii++) {
          if (lvl < system.fatigueCurrent) {
            fatigueArray.push(true);
            system.fatigueTotal = item.number > 0 ? 0 : item.number;
          } else {
            fatigueArray.push(false);
          }
          lvl++;
        }
        item.levels = fatigueArray;
      }
      system.fatigueTotal =
        system.fatigueTotal + system.bonuses.traits.fatigue > 0
          ? 0
          : system.fatigueTotal + system.bonuses.traits.fatigue;
      system.fatigueMaxLevel = lvl;
    }

    // Resources
    system.resource = {};
    // Fatigue as resource (test)

    system.resource.fatigue = {
      value: system.fatigueMaxLevel - system.fatigueCurrent,
      max: system.fatigueMaxLevel
    };

    // Might as ressource
    if (this._hasMight()) {
      system.resource.might = {
        value: system.might.points,
        max: system.might.value
      };
    }

    // Abilities
    const temp = {
      _id: "",
      name: "N/A",
      value: 0
    };
    abilitiesSelect.a0 = temp;
    for (const [key, item] of this.items.entries()) {
      if (item.type === "ability") {
        let computedKey = item.system.getComputedKey();
        item.system.xpCoeff = this._getAbilityXpCoeff(item.system.key, item.system.option);
        item.system.xpBonus = this._getAbilityXpBonus(item.system.key, item.system.option);
        item.system.upgrade = this._getAbilityUpgrade(item.system.key, item.system.option);
        item.system.derivedScore = item.system.accelerated
          ? ArM5ePCActor.getArtScore(
              Math.round((item.system.xp + item.system.xpBonus) * item.system.xpCoeff)
            )
          : ArM5ePCActor.getAbilityScoreFromXp(
              Math.round((item.system.xp + item.system.xpBonus) * item.system.xpCoeff)
            );
        item.system.xpNextLevel = item.system.accelerated
          ? Math.round(ArM5ePCActor.getArtXp(item.system.derivedScore + 1) / item.system.xpCoeff)
          : Math.round(
              ArM5ePCActor.getAbilityXp(item.system.derivedScore + 1) / item.system.xpCoeff
            );
        item.system.remainingXp = item.system.xp + item.system.xpBonus;

        if (
          system.bonuses.skills[computedKey] != undefined &&
          system.bonuses.skills[computedKey].bonus != 0
        ) {
          item.system.finalScore = Math.max(
            item.system.upgrade,
            item.system.derivedScore + parseInt(system.bonuses.skills[computedKey].bonus)
          );
        } else {
          item.system.finalScore = Math.max(item.system.upgrade, item.system.derivedScore);
        }
        if (item.system.category == "altTechnique") {
          system.magicSystem.verbs.push(item);
        } else if (item.system.category == "altForm") {
          system.magicSystem.nouns.push(item);
        } else {
          abilities.push(item);
        }
        const temp = {
          id: item._id,
          name: item.name,
          value: item.system.finalScore
        };
        // AbilitiesSelect.push(temp);
        abilitiesSelect[`a${key}`] = temp;

        totalXPAbilities = parseInt(totalXPAbilities) + item.system.xp;

        if (this._isMagus() && system.laboratory && system.laboratory.abilitiesSelected) {
          if (item.system.key != "") {
            if (item.system.key == "finesse") {
              system.laboratory.abilitiesSelected.finesse.value = item.system.finalScore;
            } else if (item.system.key == "awareness") {
              system.laboratory.abilitiesSelected.awareness.value = item.system.finalScore;
            } else if (item.system.key == "concentration") {
              system.laboratory.abilitiesSelected.concentration.value = item.system.finalScore;
            } else if (item.system.key == "artesLib") {
              system.laboratory.abilitiesSelected.artesLib.value = item.system.finalScore;
            } else if (item.system.key == "magicTheory") {
              system.laboratory.abilitiesSelected.magicTheory.value = item.system.finalScore;
            } else if (item.system.key == "parma") {
              system.laboratory.abilitiesSelected.parma.value = item.system.finalScore;
            } else if (item.system.key == "philosophy") {
              system.laboratory.abilitiesSelected.philosophy.value = item.system.finalScore;
            } else if (item.system.key == "penetration") {
              system.laboratory.abilitiesSelected.penetration.value = item.system.finalScore;
            }
          } else {
            // Legacy code, to be removed in the future
            if (item._id == system.laboratory.abilitiesSelected.finesse.abilityID) {
              system.laboratory.abilitiesSelected.finesse.value = item.system.finalScore;
            } else if (item._id == system.laboratory.abilitiesSelected.awareness.abilityID) {
              system.laboratory.abilitiesSelected.awareness.value = item.system.finalScore;
            } else if (item._id == system.laboratory.abilitiesSelected.concentration.abilityID) {
              system.laboratory.abilitiesSelected.concentration.value = item.system.finalScore;
            } else if (item._id == system.laboratory.abilitiesSelected.artesLib.abilityID) {
              system.laboratory.abilitiesSelected.artesLib.value = item.system.finalScore;
            } else if (item._id == system.laboratory.abilitiesSelected.philosophy.abilityID) {
              system.laboratory.abilitiesSelected.philosophy.value = item.system.finalScore;
            } else if (item._id == system.laboratory.abilitiesSelected.parma.abilityID) {
              system.laboratory.abilitiesSelected.parma.value = item.system.finalScore;
            } else if (item._id == system.laboratory.abilitiesSelected.magicTheory.abilityID) {
              system.laboratory.abilitiesSelected.magicTheory.value = item.system.finalScore;
            } else if (item._id == system.laboratory.abilitiesSelected?.penetration?.abilityID) {
              system.laboratory.abilitiesSelected.penetration.value = item.system.finalScore;
            }
          }
        }
      }
    }

    if (system.abilities) {
      system.abilities = abilities.sort(function (e1, e2) {
        return e1.name.localeCompare(e2.name);
      });
    }

    if (this._isMagus()) {
      soak += this.system?.familiar?.cordFam?.bronze ?? 0;

      /*
            "fastCastingSpeed":{"value": 0, "calc": "Qik + Finesse + stress die" },
            "determiningEffect":{"value": 0, "calc": "Per + Awareness + die VS 15-magnitude" },
            "targeting":{"value": 0, "calc": "Per + Finesse + die" },
            "concentration":{"value": 0, "calc": "Sta + Concentration + die" },
            "magicResistance":{"value": 0, "calc": "Parma * 5 + Form" },
            "multipleCasting":{"value": 0, "calc": "Int + Finesse + stress die - no of spells VS 9" },
            "basicLabTotal":{"value": 0, "calc": "Int + Magic theory + Aura (+ Technique + Form)" },
            "visLimit":{"value": 0, "calc": "Magic theory * 2" }
            */

      // compute the spellcasting bonus:
      // (this.system.stances.voice[system.stances.voiceStance] || 0) +
      // (this.system.stances.gestures[system.stances.gesturesStance] || 0);
      // log(false, `Bonus spellcasting: ${this.system.bonuses.arts.spellcasting}`);
      if (system.laboratory === undefined) {
        system.laboratory = {};
      }
      // Calculate magic totals
      system.laboratory.fastCastingSpeed.value =
        system.characteristics.qik.value + system.laboratory.abilitiesSelected.finesse.value;
      system.laboratory.determiningEffect.value =
        system.characteristics.per.value + system.laboratory.abilitiesSelected.awareness.value;
      system.laboratory.targeting.value =
        system.characteristics.per.value + system.laboratory.abilitiesSelected.finesse.value;
      system.laboratory.concentration.value =
        system.characteristics.sta.value + system.laboratory.abilitiesSelected.concentration.value;
      system.laboratory.magicResistance.value = system.laboratory.abilitiesSelected.parma.value * 5;
      system.laboratory.multipleCasting.value =
        system.characteristics.int.value + system.laboratory.abilitiesSelected.finesse.value;
      system.laboratory.basicLabTotal.value =
        system.characteristics.int.value + system.laboratory.abilitiesSelected.magicTheory.value; // Aura pending

      if (system.apprentice) {
        if (system.apprentice.magicTheory > 0) {
          system.laboratory.basicLabTotal.value +=
            system.apprentice.magicTheory + system.apprentice.int;
        }
      }
      system.laboratory.visLimit.value = system.laboratory.abilitiesSelected.magicTheory.value * 2;
      if (system.laboratory.totalPenetration) {
        system.laboratory.totalPenetration.value =
          system.laboratory.abilitiesSelected?.penetration?.value || 0;
      }

      for (let [key, technique] of Object.entries(system.arts.techniques)) {
        technique.derivedScore = ArM5ePCActor.getArtScore(
          Math.round(technique.xp * technique.xpCoeff)
        );
        technique.finalScore = technique.derivedScore + technique.bonus;
        // Start from scratch to avoid rounding errors
        technique.xpNextLevel = Math.round(
          ArM5ePCActor.getArtXp(technique.derivedScore + 1) / technique.xpCoeff
        );

        // Calculate the next level experience needed
        totalXPArts = parseInt(totalXPArts) + technique.xp;
      }

      const parmaStats = this.getAbilityStats("parma");
      for (let [key, form] of Object.entries(system.arts.forms)) {
        form.derivedScore = ArM5ePCActor.getArtScore(Math.round(form.xp * form.xpCoeff));
        form.finalScore = form.derivedScore + form.bonus;

        form.xpNextLevel = Math.round(ArM5ePCActor.getArtXp(form.derivedScore + 1) / form.xpCoeff);

        form.magicResistance = parmaStats.score * 5 + form.finalScore;
        if (parmaStats.speciality.toUpperCase() === form.label.toUpperCase()) {
          form.magicResistance += 5;
        }

        totalXPArts = parseInt(totalXPArts) + form.xp;
      }
    }

    for (let [key, item] of this.items.entries()) {
      item.img = item.img || DEFAULT_TOKEN;
      item._index = key;

      // TODO move code specific to type below in their respective datamodel schema.
      if (item.system.prepareOwnerData instanceof Function) {
        item.system.prepareOwnerData();
      }

      if (item.type === "weapon") {
        if (item.system.equipped == true) {
          combat.load += item.system.load;
          combat.init += item.system.init;
          combat.atk += item.system.atk;
          combat.dfn += item.system.dfn;
          combat.dam += item.system.dam;
          combat.img = item.img;
          combat.name = item.name;
          combat.itemId = item.id;
          const ab = this.getAbility(item.system.ability.key, item.system.ability.option);
          combat.ability = 0;
          if (ab) {
            combat.ability += ab.system.finalScore;
            if (item.system.weaponExpert) {
              combat.ability++;
            }
            if (item.system.horse) {
              const ride = this.getAbilityStats("ride");
              if (ride.score > 3) {
                ride.score = 3;
              }
              combat.ability += ride.score;
            }
            item.system.ability.id = ab._id;
          }
        }
        item.system.abilities = abilitiesSelect;
        weapons.push(item);
      } else if (item.type === "armor") {
        if (item.system.equipped == true) {
          combat.load += item.system.load;
          combat.prot += item.system.prot;
        }
        armor.push(item);
      } else if (item.type === "spell") {
        item.system.castingTotal = item._computeCastingTotal(this, { char: "sta" });
        spells.push(item);
        totalXPSpells = parseInt(totalXPSpells) + parseInt(item.system.level);
        totalXPMasteries = totalXPMasteries + item.system.xp;
      } else if (item.type === "magicalEffect") {
        item.system.castingTotal = item._computeCastingTotal(this, { char: "sta" });
        magicalEffects.push(item);
      } else if (item.type === "vis") {
        vis.push(item);
      } else if (item.type === "item" || item.type == "enchantedItem") {
        items.push(item);
      } else if (item.type === "book") {
        let idx = 0;
        for (let topic of item.system.topics) {
          topic.id = item.id;
          topic.img = item.img;
          topic.index = idx++;
          topic.book = `${item.name} (${integerToRomanNumeral(idx)})`;
          switch (topic.category) {
            case "ability":
              mundaneTopics.push(topic);
              break;
            case "art":
              artsTopics.push(topic);
              break;
            case "mastery":
              masteryTopics.push(topic);
              break;
            case "labText":
              topic.system = topic.labtext;
              if (topic.labtext != null) {
                topic.name = `${topic.book}: ${topic.labtextTitle}`;
              }
              laboratoryTexts.push(topic);
              break;
            default:
              error(false, `Unknown topic category${topic.category}`);
          }
        }
        physicalBooks.push(item);
      } else if (item.type === "laboratoryText") {
        let topic = {
          id: item.id,
          img: item.img,
          index: 0,
          book: "",
          category: "labText",
          name: item.name,
          system: item.system
        };

        laboratoryTexts.push(topic);
      } else if (item.type === "virtue") {
        virtues.push(item);
        if (ARM5E.impacts[item.system.impact.value]) {
          totalVirtues =
            parseInt(totalVirtues) + parseInt(ARM5E.impacts[item.system.impact.value].cost);
        }
      } else if (item.type === "flaw") {
        flaws.push(item);
        if (ARM5E.impacts[item.system.impact.value]) {
          totalFlaws =
            parseInt(totalFlaws) + parseInt(ARM5E.impacts[item.system.impact.value].cost);
        }
      } else if (item.type === "quality") {
        system.qualities.push(item);
        if (ARM5E.impacts[item.system.impact.value]) {
          system.totalQualities += parseInt(ARM5E.impacts[item.system.impact.value].cost);
        }
      } else if (item.type === "inferiorities") {
        system.inferiorities.push(item);
        if (ARM5E.impacts[item.system.impact.value]) {
          system.totalInferiorities += parseInt(ARM5E.impacts[item.system.impact.value].cost);
        }
      } else if (item.type === "diaryEntry") {
        if (!item.system.done) {
          pendingXps += item.system.sourceQuality;
          //    +
          //   item.system.progress.abilities.reduce((previous, current, i) => {
          //     return previous + current.xp;
          //   }, 0) +
          //   item.system.progress.arts.reduce((previous, current, i) => {
          //     return previous + current.xp;
          //   }, 0);
          // item.system.progress.spells.reduce((previous, current, i) => {
          //   return previous + current.xp;
          // }, 0);
          // item.system.progress.newSpells.reduce((previous, current, i) => {
          //   return previous + current.xp;
          // }, 0);
        }
        diaryEntries.push(item);
      } else if (item.type === "abilityFamiliar") {
        abilitiesFamiliar.push(item);
      } else if (item.type === "mightFamiliar" || item.type === "powerFamiliar") {
        powersFamiliar.push(item);
      } else if (item.type === "might" || item.type === "power") {
        powers.push(item);
      } else if (item.type === "personalityTrait") {
        system.personalities.push(item);
      } else if (item.type === "reputation") {
        reputations.push(item);
      } else if (item.type === "wound") {
        system.wounds[item.system.gravity].push(item);
      } else if (item.type === "supernaturalEffect") {
        if (system.supernaturalEffectsTemplates[item.system.template]) {
          system.supernaturalEffectsTemplates[item.system.template].push(item);
        } else {
          system.supernaturalEffectsTemplates["orphans"].push(item);
        }
      }
    }

    items.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    virtues.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    flaws.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    system.qualities.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    system.inferiorities.sort((a, b) => (a.sort || 0) - (b.sort || 0));

    weapons.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    armor.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    powers.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    system.personalities.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    reputations.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    vis.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    // Combat

    combat.overload = ArM5ePCActor.getArtScore(combat.load);

    if (combat.prot) {
      soak += combat.prot;
    }

    if (system.characteristics) {
      if (system.characteristics.str.value > 0) {
        combat.overload = parseInt(combat.overload) - parseInt(system.characteristics.str.value);
      }
      if (combat.overload < 0) {
        combat.overload = 0;
      }
    }

    if (this._isGrog()) {
      system.con.score = 0;
      system.con.points = 0;
    }
    // Warping & decrepitude
    if ((this.type == "npc" && this.system.charType.value != "entity") || this.type == "player") {
      system.warping.finalScore = ArM5ePCActor.getAbilityScoreFromXp(system.warping.points);
      system.warping.experienceNextLevel =
        ((parseInt(system.warping.finalScore) + 1) *
          (parseInt(system.warping.finalScore) + 2) *
          5) /
          2 -
        system.warping.points;

      if (system.decrepitude == undefined) {
        system.decrepitude = { points: 0 };
      }
      system.decrepitude.finalScore = ArM5ePCActor.getAbilityScoreFromXp(system.decrepitude.points);
      system.decrepitude.experienceNextLevel =
        ((parseInt(system.decrepitude.finalScore) + 1) *
          (parseInt(system.decrepitude.finalScore) + 2) *
          5) /
          2 -
        system.decrepitude.points;
    }
    system.penalties.wounds.total = this.getWoundPenalty();
    // Assign and return
    system.totalXPAbilities = totalXPAbilities;
    system.totalXPArts = totalXPArts;
    system.totalVirtues = totalVirtues;
    system.totalFlaws = totalFlaws;

    system.totalXPSpells = totalXPSpells;
    system.totalXPMasteries = totalXPMasteries;
    system.pendingXps = pendingXps;

    if (system.weapons) {
      system.weapons = weapons;
      // TODO: check why putting in there?
      system.combat = combat;
    }
    if (system.armor) {
      system.armor = armor;
    }
    if (system.spells) {
      // System.spells = spells;
      system.spells = spells.sort(compareSpells);
    }
    if (system.magicalEffects) {
      system.magicalEffects = magicalEffects.sort(compareMagicalEffects);
    }

    if (system.vitals.soa) {
      system.vitals.soa.value = soak;
    }

    system.vitals.enc.value = combat.overload;

    if (system.vis) {
      system.vis = vis;
    }
    if (system.items) {
      system.items = items;
    }
    system.artsTopics = artsTopics.sort(compareTopics);
    system.mundaneTopics = mundaneTopics.sort(compareTopics);
    system.masteryTopics = masteryTopics.sort(compareTopics);
    system.laboratoryTexts = laboratoryTexts.sort(compareTopics);
    system.physicalBooks = physicalBooks.sort((a, b) => (a.sort || 0) - (b.sort || 0));

    if (system.virtues) {
      system.virtues = virtues;
    }
    if (system.flaws) {
      system.flaws = flaws;
    }

    if (system.diaryEntries) {
      system.diaryEntries = diaryEntries.sort(compareDiaryEntries);
    }
    if (system.familiar) {
      system.familiar.abilitiesFam = abilitiesFamiliar;
      system.familiar.powersFam = powersFamiliar;
    }

    system.powers = powers;

    system.reputations = reputations;

    // Links with other actors

    if (system?.charType?.value == "magusNPC" || system?.charType?.value == "magus") {
      // Check whether the character is linked to an existing lab
      this.system.sanctum.document = game.actors.get(this.system.sanctum.actorId);
      if (this.system.sanctum.document) {
        this.system.sanctum.value = this.system.sanctum.document.name;
        this.system.sanctum.linked = true;
      } else {
        this.system.sanctum.linked = false;
      }
    }
    log(false, "pc end of prepare actor data");
    log(false, system);
  }

  _prepareMagicCodexData() {
    this.img = CONFIG.ARM5E_DEFAULT_ICONS.magicCodex;
    const system = this.system;
    let baseEffects = [];
    let magicEffects = [];
    let spells = [];
    let enchantments = [];
    for (let [key, item] of this.items.entries()) {
      if (item.type == "baseEffect") {
        baseEffects.push(item);
      }
      if (item.type == "magicalEffect") {
        magicEffects.push(item);
      }
      if (item.type == "spell") {
        spells.push(item);
      }
      if (item.type == "enchantment") {
        enchantments.push(item);
      }
    }
    system.baseEffects = baseEffects.sort(compareBaseEffects);
    system.magicEffects = magicEffects.sort(compareMagicalEffects);
    system.enchantments = enchantments.sort(compareMagicalEffects);
    system.spells = spells.sort(compareSpells);
  }

  getRollData() {
    // Let rollData = super.getRollData();
    // rollData.config = {
    //   character: {},
    //   magic: {}
    // };
    // rollData.config.character.magicAbilities = CONFIG.ARM5E.character.magicAbilities;
    // rollData.config.magic.arts = ARM5E.magic.arts;
    // rollData.config.magic.penetration = ARM5E.magic.penetration;
    let rollData = { raw: this.system };
    if (this._isCharacter()) {
      rollData.char = Object.fromEntries(
        Object.entries(this.system.characteristics).map(([k, v]) => [k, v.value])
      );
      rollData.ability = {};
      for (let ab of this.system.abilities) {
        if (ab.system.option === "") {
          rollData.ability[ab.system.key] = ab.system.finalScore;
        } else {
          rollData.ability[ab.system.key] = { [ab.system.option]: ab.system.finalScore };
        }
      }
      rollData.combat = this.system.combat;

      if (this._isMagus()) {
        rollData.magic = {};

        for (let [k, v] of Object.entries(this.system.arts.techniques)) {
          rollData.magic[k] = v.finalScore;
        }

        for (let [k, v] of Object.entries(this.system.arts.forms)) {
          rollData.magic[k] = v.finalScore;
        }
      }
      rollData.physicalCondition = this.system.fatigueTotal + this.system.penalties.wounds.total;
    } else {
      rollData = super.getRollData();
    }
    return rollData;
  }

  _prepareLabData() {
    const system = this.system;
    let physicalBooks = [];
    let artsTopics = [];
    let mundaneTopics = [];
    let masteryTopics = [];
    let laboratoryTexts = [];
    let totalVirtues = 0;
    let totalFlaws = 0;
    // TODO TMP
    system.specialities_old = [];
    system.personalities_old = [];
    system.distinctive = [];
    system.rooms_old = [];
    // TODO END

    system.rawVis = [];
    system.items = [];
    system.virtues = [];
    system.flaws = [];
    system.diaryEntries = [];
    system.laboratoryTexts = [];

    for (let [key, item] of this.items.entries()) {
      // TODO TMP
      if (item.type === "speciality") {
        system.specialities_old.push(item);
      } else if (item.type === "distinctive") {
        system.distinctive.push(item);
      } else if (item.type === "sanctumRoom") {
        system.rooms_old.push(item);
      } else if (item.type === "personality") {
        system.personalities_old.push(item);
      } else if (item.type === "book") {
        let idx = 0;
        for (let topic of item.system.topics) {
          topic.id = item.id;
          topic.img = item.img;
          topic.index = idx++;
          topic.book = item.name;
          switch (topic.category) {
            case "ability":
              mundaneTopics.push(topic);
              break;
            case "art":
              artsTopics.push(topic);
              break;
            case "mastery":
              masteryTopics.push(topic);
              break;
            case "labText":
              topic.system = topic.labtext;
              if (topic.labtext != null) {
                topic.name = `${topic.book}: ${topic.labtextTitle}`;
              }
              laboratoryTexts.push(topic);
              break;
            default:
              error(false, `Unknown topic category${topic.category}`);
          }
        }
        physicalBooks.push(item);
      } else if (item.type === "laboratoryText") {
        let topic = {
          id: item.id,
          img: item.img,
          index: 0,
          book: "",
          category: "labText",
          name: item.name,
          system: item.system
        };

        laboratoryTexts.push(topic);
      } else if (item.type === "vis") {
        system.rawVis.push(item);
      } else if (item.type === "item") {
        system.items.push(item);
      } else if (item.type === "virtue") {
        system.virtues.push(item);
        if (ARM5E.impacts[item.system.impact.value]) {
          totalVirtues += parseInt(ARM5E.impacts[item.system.impact.value].cost);
        }
      } else if (item.type === "flaw") {
        system.flaws.push(item);
        if (ARM5E.impacts[item.system.impact.value]) {
          totalFlaws =
            parseInt(totalFlaws) + parseInt(ARM5E.impacts[item.system.impact.value].cost);
        }
      } else if (item.type === "diaryEntry") {
        system.diaryEntries.push(item);
      }
    }
    system.virtues.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    system.flaws.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    system.rawVis.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    system.items.sort((a, b) => (a.sort || 0) - (b.sort || 0));

    system.physicalBooks = physicalBooks.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    system.artsTopics = artsTopics.sort(compareTopics);
    system.mundaneTopics = mundaneTopics.sort(compareTopics);
    system.masteryTopics = masteryTopics.sort(compareTopics);
    system.laboratoryTexts = laboratoryTexts.sort(compareTopics);

    system.size.total = system.size.value + system.size.bonus;
    system.generalQuality.total = system.generalQuality.value + system.generalQuality.bonus;

    system.health.total = system.health.value + system.health.bonus;
    system.refinement.total = system.refinement.value + system.refinement.bonus;
    system.upkeep.total = system.upkeep.value + system.upkeep.bonus;
    system.warping.total = system.warping.value + system.warping.bonus;
    system.aesthetics.total = Math.min(
      system.aesthetics.value + system.aesthetics.bonus,
      system.aesthetics.max
    );

    system.freeVirtues = system.size.total + system.refinement.total;
    system.occupiedSize = Math.max(totalVirtues - totalFlaws, 0) - system.refinement.total;
    system.baseSafety = system.refinement.total - Math.max(system.occupiedSize, 0);
    system.safety.bonus += system.baseSafety;
    system.safety.total = system.safety.value + system.safety.bonus;

    system.totalVirtues = totalVirtues;
    system.totalFlaws = totalFlaws;

    // Var baseSafetyEffect = this.effects.find((e) => e.getFlag("arm5e", "baseSafetyEffect"));
    // if (baseSafetyEffect != null && baseSafetyEffect.changes[0].value != String(baseSafety)) {
    //   let changes = foundry.utils.duplicate(baseSafetyEffect.changes);
    //   changes[0].value = String(baseSafety);
    //   baseSafetyEffect.update({ changes });
    // }
  }

  _prepareCovenantData() {
    const system = this.system;
    let reputations = [];
    let magi = [];
    let companion = [];
    let specialists = [];
    let habitants = [];
    let turbula = [];
    let horses = [];
    let livestock = [];
    let possessions = [];
    let weapons = [];
    let armor = [];
    let visSources = [];
    let vis = [];
    let calendar = [];
    let incomingSources = [];
    let laboratoryTexts = [];
    let physicalBooks = [];
    let artsTopics = [];
    let mundaneTopics = [];
    let masteryTopics = [];
    let items = [];
    let boons = [];
    let hooks = [];
    let labs = [];
    let diaryEntries = [];
    let totalVirtues = 0;
    let totalFlaws = 0;
    system.scene.document = game.scenes.get(system.scene.id);

    system.finances.totalIncome = 0;

    let libraryPts = 0;
    let labTextPts = 0;
    let visPts = 0;
    let visStock = 0;
    let enchantmentPts = 0;
    let specialistPts = 0;
    let labPts = 0;
    let workersPts = 0;
    let servantPts = 0;
    for (let [key, item] of this.items.entries()) {
      item.img = item.img || DEFAULT_TOKEN;
      item._index = key;
      if (item.type === "virtue") {
        boons.push(item);
        if (ARM5E.impacts[item.system.impact.value]) {
          totalVirtues =
            parseInt(totalVirtues) + parseInt(ARM5E.impacts[item.system.impact.value].cost);
        }
      } else if (item.type === "flaw") {
        hooks.push(item);
        if (ARM5E.impacts[item.system.impact.value]) {
          totalFlaws =
            parseInt(totalFlaws) + parseInt(ARM5E.impacts[item.system.impact.value].cost);
        }
      } else if (item.type === "diaryEntry") {
        diaryEntries.push(item);
      } else if (item.type === "reputation") {
        reputations.push(item);
      } else if (item.type === "inhabitant") {
        item.system.points = item.system.livingCost(this.system.modifiersLife) * item.system.number;
        system.finances.inhabitantsPoints += item.system.points;
        switch (item.system.category) {
          case "magi":
            magi.push(item);
            system.census.magi++;
            break;
          case "companions":
            companion.push(item);
            system.census.companions++;
            break;
          case "specialists":
            system.census.specialists++;
            specialistPts += item.system.buildPoints;
            specialists.push(item);
            break;
          case "craftsmen":
            system.census.craftsmen++;
            specialists.push(item);
            break;
          case "turbula":
            system.census.turbula += item.system.number;
            turbula.push(item);
            break;
          case "laborers":
            system.census.laborers += item.system.number;
            habitants.push(item);
            workersPts += item.system.points;
            break;
          case "servants":
            system.census.servants += item.system.number;
            habitants.push(item);
            servantPts += item.system.points;
            workersPts += item.system.points;
            break;
          case "teamsters":
            system.census.teamsters += item.system.number;
            habitants.push(item);
            workersPts += item.system.points;
            break;
          case "dependants":
            system.census.dependants += item.system.number;
            habitants.push(item);
            break;
          case "horses":
            system.census.horses += item.system.number;
            horses.push(item);
            break;
          case "livestock":
            system.census.livestock += item.system.number;
            livestock.push(item);
            break;
        }
      } else if (item.type === "possessionsCovenant") {
        possessions.push(item);
      } else if (item.type === "visSourcesCovenant") {
        visPts += ARM5E.covenant.vis.sourceCost * item.system.pawns;
        visSources.push(item);
      } else if (item.type === "visStockCovenant" || item.type === "vis") {
        visStock += item.system.quantity;
        vis.push(item);
      } else if (item.type === "calendarCovenant") {
        calendar.push(item);
      } else if (item.type === "incomingSource") {
        system.finances.totalIncome += item.system.incoming;
        incomingSources.push(item);
      } else if (item.type === "laboratoryText") {
        let topic = {
          id: item.id,
          img: item.img,
          index: 0,
          book: "",
          category: "labText",
          name: item.name,
          system: item.system
        };
        labTextPts += item.system.buildPoints;
        laboratoryTexts.push(topic);
      } else if (item.type === "book") {
        let idx = 0;
        for (let topic of item.system.topics) {
          topic.img = item.img;
          topic.id = item.id;
          topic.index = idx++;
          topic.book = item.name;
          switch (topic.category) {
            case "ability":
              libraryPts += item.system.buildPoints(topic);
              mundaneTopics.push(topic);
              break;
            case "art":
              libraryPts += item.system.buildPoints(topic);
              artsTopics.push(topic);
              break;
            case "mastery":
              libraryPts += item.system.buildPoints(topic);
              masteryTopics.push(topic);
              break;
            case "labText":
              if (topic.labtext == null) {
                topic.system = { type: "" };
              } else {
                topic.system = topic.labtext;
                labTextPts += item.system.buildPoints(topic);
              }

              if (topic.labtext != null) {
                topic.name = `${topic.book}: ${topic.labtextTitle}`;
              }
              laboratoryTexts.push(topic);
              break;
            default:
              error(false, `Unknown topic category${topic.category}`);
          }
        }
        physicalBooks.push(item);
      } else if (item.type === "reputation") {
        reputations.push(item);
      } else if (item.type === "weapon") {
        this.system.finances.weaponsPoints += item.system.maintenance;
        weapons.push(item);
      } else if (item.type === "armor") {
        this.system.finances.weaponsPoints += item.system.maintenance;
        armor.push(item);
      } else if (item.type === "item") {
        items.push(item);
      } else if (item.type === "labCovenant") {
        system.finances.laboratoriesPoints += item.system.upkeepCost;
        labPts += item.system.buildPoints;
        labs.push(item);
      }

      if (canBeEnchanted(item)) {
        if (item.system.state === "enchanted") {
          enchantmentPts += item.system.enchantments.buildPoints * item.system.quantity;
        }
      }
    }

    // SORTING

    possessions.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    incomingSources.sort((a, b) => (a.sort || 0) - (b.sort || 0));

    weapons.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    armor.sort((a, b) => (a.sort || 0) - (b.sort || 0));

    magi.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    companion.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    specialists.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    turbula.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    habitants.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    horses.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    livestock.sort((a, b) => (a.sort || 0) - (b.sort || 0));

    // BUILD POINTS

    system.buildPoints.laboratoryTexts.computed += labTextPts;
    system.buildPoints.library.computed += libraryPts;
    system.buildPoints.vis.computed += Math.ceil(visStock / ARM5E.covenant.vis.stockCost) + visPts;
    system.buildPoints.magicItems.computed += enchantmentPts;
    system.buildPoints.laboratories.computed += labPts;
    system.buildPoints.money.computed += Math.ceil(system.finances.wealth / 10);
    system.buildPoints.specialists.computed += specialistPts;

    // YEARLY EXPENSES

    system.yearlyExpenses.buildings.amount += Math.ceil(system.finances.inhabitantsPoints / 10);
    system.yearlyExpenses.consumables.amount += Math.ceil(
      (2 * system.finances.inhabitantsPoints) / 10
    );
    system.yearlyExpenses.laboratories.amount += Math.ceil(system.finances.laboratoriesPoints / 10);
    system.yearlyExpenses.provisions.amount += Math.ceil(
      (5 * system.finances.inhabitantsPoints) / 10
    );
    system.yearlyExpenses.wages.amount += Math.ceil((2 * system.finances.inhabitantsPoints) / 10);
    system.yearlyExpenses.wages.factor =
      CONFIG.ARM5E.covenant.loyalty.wages[system.loyalty.modifiers.wages].factor;
    system.yearlyExpenses.wages.amount *= system.yearlyExpenses.wages.factor;
    system.finances.weaponsPoints +=
      system.finances.averageEquipMaintenance * system.census.turbula;
    system.yearlyExpenses.weapons.amount += Math.ceil(system.finances.weaponsPoints / 320);

    // Const bookSpecCnt = system.inhabitants.specialists.reduce((bookSpecialistCnt,current) => { if (current.system.category) })

    system.yearlyExpenses.writingMaterials.amount +=
      system.census.magi +
      specialists.filter((e) => {
        return e.system.category === "specialists" && e.system.specialistType === "books";
      }).length;

    // INHABITANTS

    system.inhabitants = {};
    system.inhabitants.magi = magi;
    system.inhabitants.companion = companion;
    system.inhabitants.specialists = specialists;
    system.inhabitants.turbula = turbula;
    system.inhabitants.habitants = habitants;
    system.inhabitants.horses = horses;
    system.inhabitants.livestock = livestock;
    system.inhabitants.npcgrogs = system.npcInhabitants;

    system.census.workers =
      system.census.laborers + system.census.teamsters + system.census.servants;

    system.census.inhabitants = system.census.workers + system.census.dependants;

    system.census.total =
      system.census.magi +
      system.census.companions +
      system.census.specialists +
      system.census.craftsmen +
      system.census.turbula +
      system.census.inhabitants +
      system.census.horses +
      system.census.livestock +
      system.npcInhabitants;

    // adjust the inhabitant points by removing the workers'
    let tempTotal = system.finances.inhabitantsPoints - workersPts;
    system.census.servantsNeeded += 2 * Math.round(tempTotal / 10);
    // Add the points for these servants to the total
    tempTotal += servantPts;
    system.census.teamstersNeeded = Math.round((tempTotal - 2 * system.census.laborers) / 10);

    // SAVINGS :

    const craftSavings = {
      buildings: {
        details: `<h4>${game.i18n.localize(CONFIG.ARM5E.covenant.fieldOfWork.buildings)}<h4/>`,
        crafts: {},
        total: 0,
        max:
          CONFIG.ARM5E.covenant.yearlyExpenses.buildings.maxSaving *
          system.yearlyExpenses.buildings.amount
      },
      consumables: {
        details: `<h4>${game.i18n.localize(CONFIG.ARM5E.covenant.fieldOfWork.consumables)}<h4/>`,
        crafts: {},
        total: 0,
        max:
          CONFIG.ARM5E.covenant.yearlyExpenses.consumables.maxSaving *
          system.yearlyExpenses.consumables.amount
      },
      laboratories: {
        details: `<h4>${game.i18n.localize(CONFIG.ARM5E.covenant.fieldOfWork.laboratories)}<h4/>`,
        crafts: {},
        total: 0,
        max:
          CONFIG.ARM5E.covenant.yearlyExpenses.laboratories.maxSaving *
          system.yearlyExpenses.laboratories.amount
      },
      provisions: {
        details: `<h4>${game.i18n.localize(CONFIG.ARM5E.covenant.fieldOfWork.provisions)}<h4/>`,
        crafts: {},
        total: 0,
        max:
          CONFIG.ARM5E.covenant.yearlyExpenses.provisions.maxSaving *
          system.yearlyExpenses.provisions.amount
      },
      weapons: {
        details: `<h4>${game.i18n.localize(CONFIG.ARM5E.covenant.fieldOfWork.weapons)}<h4/>`,
        crafts: {},
        total: 0,
        max:
          CONFIG.ARM5E.covenant.yearlyExpenses.weapons.maxSaving *
          system.yearlyExpenses.weapons.amount
      },
      writingMaterials: {
        details: `<h4>${game.i18n.localize(
          CONFIG.ARM5E.covenant.fieldOfWork.writingMaterials
        )}<h4/>`,
        crafts: {},
        total: 0,
        max:
          CONFIG.ARM5E.covenant.yearlyExpenses.writingMaterials.maxSaving *
          system.yearlyExpenses.writingMaterials.amount
      }
    };

    system.yearlySavings.laborers.amount = Math.min(
      system.census.laborers,
      system.yearlyExpenses.provisions.amount *
        CONFIG.ARM5E.covenant.yearlyExpenses.provisions.maxSaving
    );

    for (let spe of system.inhabitants.specialists) {
      if (spe.system.category === "specialists") {
        if (spe.system.specialistType == "other" && spe.system.fieldOfWork != "none") {
          let craft = slugify(spe.system.job);
          let saves = spe.system.craftSavings;
          if (!craftSavings[spe.system.fieldOfWork].crafts[craft]) {
            craftSavings[spe.system.fieldOfWork].crafts[craft] = { val: saves, type: "spec" };
          } else {
            craftSavings[spe.system.fieldOfWork].crafts[craft].val += saves;
          }
          craftSavings[spe.system.fieldOfWork].total += saves;
        }
      } else if (spe.system.category === "craftsmen" && spe.system.fieldOfWork != "none") {
        let craft = slugify(spe.system.job);
        let saves = spe.system.craftSavings;
        if (!craftSavings[spe.system.fieldOfWork].crafts[craft]) {
          craftSavings[spe.system.fieldOfWork].crafts[craft] = { val: saves, type: "craft" };
        } else {
          craftSavings[spe.system.fieldOfWork].crafts[craft].val += saves;
        }
        craftSavings[spe.system.fieldOfWork].total += saves;
      }
    }

    const activeEffects = CONFIG.ISV10 ? this.effects : this.appliedEffects;
    system.yearlySavings.magicItems.quantity =
      ArM5eActiveEffect.findAllActiveEffectsWithTypeFiltered(
        activeEffects,
        "covenantCostSavingMagic"
      ).length;
    // Savings from magic
    const magicLocalized = slugify(game.i18n.localize("arm5e.sheet.magicLabel"));
    // Savings from mundane effects
    const otherLocalized = slugify(game.i18n.localize("arm5e.generic.other"));
    // Savings from laborers
    // get slugify version of localized "laborer"
    const laborerLocalized = slugify(game.i18n.localize("arm5e.sheet.laborers"));
    craftSavings.provisions.crafts[laborerLocalized] = {
      val: system.census.laborers,
      max: system.yearlyExpenses.provisions.amount / 2
    };

    system.yearlySavings.specialists.amount = 0;
    system.yearlySavings.craftsmen.amount = 0;

    for (let [category, v] of Object.entries(craftSavings)) {
      system.yearlyExpenses[category].savingsDetails = `${craftSavings[category].details}<ul>`;
      if (system.yearlyExpenses[category].magicMod) {
        craftSavings[category].crafts[magicLocalized] = {
          val: system.yearlyExpenses[category].magicMod,
          max: system.yearlyExpenses[category].amount / 2
        };
      }

      if (system.yearlyExpenses[category].mod) {
        craftSavings[category].crafts[otherLocalized] = {
          val: system.yearlyExpenses[category].mod,
          max: system.yearlyExpenses[category].amount / 2
        };
      }

      for (let [craft, save] of Object.entries(craftSavings[category].crafts)) {
        const increment = Math.min(save.val, save.max ? save.max : craftSavings[category].max);
        system.yearlyExpenses[category].craftSavings += increment;
        if (save.type == "spec") {
          system.yearlySavings.specialists.amount += increment;
        } else if (save.type === "craft") {
          system.yearlySavings.craftsmen.amount += increment;
        }
        if (craft == magicLocalized) {
          system.yearlySavings.magicItems.amount += increment;
        }
        system.yearlyExpenses[category].savingsDetails += `<li class='label-light'>${
          craft.charAt(0).toUpperCase() + craft.slice(1)
        } : ${save.val.toFixed(1)} (max ${
          save.max ? save.max.toFixed(1) : craftSavings[category].max.toFixed(1)
        })</li>`;
      }
      system.yearlyExpenses[category].savingsDetails += "</ul>";
      system.yearlyExpenses[category].craftSavings = Math.round(
        Math.min(
          system.yearlyExpenses[category].amount,
          system.yearlyExpenses[category].craftSavings
        )
      );
    }

    system.yearlySavings.specialists.amount = Math.round(system.yearlySavings.specialists.amount);
    system.yearlySavings.craftsmen.amount = Math.round(system.yearlySavings.craftsmen.amount);
    system.yearlySavings.specialists.amount = Math.round(system.yearlySavings.specialists.amount);
    system.yearlySavings.magicItems.amount = Math.round(system.yearlySavings.magicItems.amount);

    system.yearlySavings.laborers.quantity = system.census.laborers;
    system.yearlySavings.craftsmen.quantity = system.census.craftsmen;
    system.yearlySavings.specialists.quantity = system.census.specialists;
    // SUMARY
    system.finances.costSavings =
      system.yearlyExpenses.buildings.craftSavings +
      system.yearlyExpenses.consumables.craftSavings +
      system.yearlyExpenses.laboratories.craftSavings +
      system.yearlyExpenses.provisions.craftSavings +
      system.yearlyExpenses.wages.craftSavings +
      system.yearlyExpenses.weapons.craftSavings +
      system.yearlyExpenses.writingMaterials.craftSavings;

    system.finances.baseExpenditure =
      system.yearlyExpenses.buildings.amount +
      system.yearlyExpenses.consumables.amount +
      system.yearlyExpenses.laboratories.amount +
      system.yearlyExpenses.provisions.amount +
      system.yearlyExpenses.wages.amount +
      system.yearlyExpenses.weapons.amount +
      system.yearlyExpenses.writingMaterials.amount +
      system.yearlyExpenses.tithes.amount +
      system.yearlyExpenses.sundry.amount +
      system.yearlyExpenses.inflation.amount;

    system.finances.totalExpenditure =
      system.finances.baseExpenditure - system.finances.costSavings;

    system.reputations = reputations;
    system.possessions = possessions;
    system.visSources = visSources;
    system.vis = vis;
    system.calendar = calendar;
    system.incomingSources = incomingSources;
    system.physicalBooks = physicalBooks.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    system.artsTopics = artsTopics.sort(compareTopics);
    system.mundaneTopics = mundaneTopics.sort(compareTopics);
    system.masteryTopics = masteryTopics.sort(compareTopics);
    system.diaryEntries = diaryEntries;
    system.virtues = boons;
    system.flaws = hooks;
    system.items = items;
    system.weapons = weapons;
    system.armor = armor;

    let flag = this.getFlag("arm5e", "sorting", "laboratoryTexts");
    if (flag && flag.laboratoryTexts == true) {
      system.laboratoryTexts = laboratoryTexts.sort(compareLabTexts);
    } else {
      system.laboratoryTexts = laboratoryTexts;
    }

    system.labs = labs;

    system.labs.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    system.virtues.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    system.flaws.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    system.vis.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    system.visSources.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    system.possessions.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    system.incomingSources.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    system.reputations.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    system.items.sort((a, b) => (a.sort || 0) - (b.sort || 0));
  }

  _prepareContainerData() {
    log(false, "_prepareContainerData");
  }

  // Utility functions

  // get the XP bonus of a given ability if any

  _getAbilityXpBonus(abilityKey = "", option = "") {
    if (abilityKey === "" || CONFIG.ARM5E.ALL_ABILITIES[abilityKey] == undefined) {
      return 0;
    }
    if (CONFIG.ARM5E.ALL_ABILITIES[abilityKey].selection === "disabled") {
      return 0; // Raise exception instead?
    }
    if (CONFIG.ARM5E.ALL_ABILITIES[abilityKey].option || false) {
      abilityKey += `_${option}`;
    }
    if (this.system.bonuses.skills[abilityKey] == undefined) {
      // Ability not yet added to bonuses
      return 0;
    }

    return this.system.bonuses.skills[abilityKey].xpMod || 0;
  }

  // Get the XP coefficient of a given ability if any
  _getAbilityXpCoeff(abilityKey = "", option = "") {
    if (abilityKey === "" || CONFIG.ARM5E.ALL_ABILITIES[abilityKey] == undefined) {
      return 1.0;
    }
    if (CONFIG.ARM5E.ALL_ABILITIES[abilityKey].selection === "disabled") {
      return 1.0; // Raise exception instead?
    }
    if (CONFIG.ARM5E.ALL_ABILITIES[abilityKey].option || false) {
      abilityKey += `_${option}`;
    }
    if (this.system.bonuses.skills[abilityKey] == undefined) {
      // Ability not yet added to bonuses
      return 1.0;
    }

    return this.system.bonuses.skills[abilityKey].xpCoeff || 1.0;
  }

  // Get the upgrade value of a given ability if any
  _getAbilityUpgrade(abilityKey = "", option = "") {
    if (abilityKey === "" || CONFIG.ARM5E.ALL_ABILITIES[abilityKey] == undefined) {
      return 0;
    }
    if (CONFIG.ARM5E.ALL_ABILITIES[abilityKey].selection === "disabled") {
      return 0; // Raise exception instead?
    }
    if (CONFIG.ARM5E.ALL_ABILITIES[abilityKey].option || false) {
      abilityKey += `_${option}`;
    }
    if (this.system.bonuses.skills[abilityKey] == undefined) {
      // Ability not yet added to bonuses
      return 0;
    }

    return this.system.bonuses.skills[abilityKey].upgrade || 0;
  }

  // Get the Xps needed for an ability/decrepitude/warping score
  static getAbilityXp(score) {
    return ArM5ePCActor.getArtXp(score) * 5;
  }

  // Get the score given an amount of xp
  static getAbilityScoreFromXp(xp) {
    return ArM5ePCActor.getArtScore(Math.floor(xp / 5));
  }

  // Get the Xps needed for an art score
  static getArtXp(score) {
    return (score * (score + 1)) / 2;
  }

  // Get the score given an amount of xp
  static getArtScore(xp) {
    let res = 0;
    while (xp > res) {
      res++;
      xp = xp - res;
    }
    return res;
  }

  // To identify the type of character
  _isMagus() {
    return (
      (this.type == "npc" && this.system.charType.value == "magusNPC") ||
      (this.type == "player" && this.system.charType.value == "magus")
    );
  }

  static isMagus(type, charType) {
    return (type == "npc" && charType == "magusNPC") || (type == "player" && charType == "magus");
  }

  _hasMight() {
    return this.type == "npc" && this.system.charType.value == "entity";
  }

  _isCompanion() {
    return this.type == "player" && this.system.charType.value == "companion";
  }

  _isGrog() {
    return this.type == "player" && this.system.charType.value == "grog";
  }

  _isCharacter() {
    return this.type == "player" || this.type == "npc" || this.type == "beast";
  }

  getAbilityScore(abilityKey, abilityOption = "") {
    if (!this._isCharacter()) {
      return null;
    }
    let ability = this.system.abilities.filter(
      (val) => val.system.key == abilityKey && val.system.option == abilityOption
    );

    if (ability.length) {
      return ability[0].system.derivedScore;
    }
    return 0;
  }

  getArtScore(artKey) {
    if (!this._isCharacter()) {
      return null;
    }
    let artType = "techniques";
    if (Object.keys(CONFIG.ARM5E.magic.techniques).indexOf(artKey) == -1) {
      artType = "forms";
    }
    return this.system.arts[artType][artKey];
  }

  // Vitals management

  async loseFatigueLevel(num, wound = true) {
    await this._changeFatigueLevel(num, wound);
  }

  async _changeFatigueLevel(num, wound = true) {
    if (!this._isCharacter() || (num <= 0 && this.system.fatigueCurrent == 0)) {
      return;
    }
    let updateData = {};
    let tmp = this.system.fatigueCurrent + num;
    let overflow = 0;
    if (tmp < 0) {
      res = 0;
      updateData["system.fatigueCurrent"] = 0;
    } else if (tmp > this.system.fatigueMaxLevel) {
      updateData["system.fatigueCurrent"] = this.system.fatigueMaxLevel;
      overflow = tmp - this.system.fatigueMaxLevel;
    } else {
      updateData["system.fatigueCurrent"] = tmp;
    }

    if (wound && overflow > 0) {
      // Fatigue overflow
      let woundType;
      switch (overflow) {
        case 1:
          woundType = "light";
          break;
        case 2:
          woundType = "medium";
          break;
        case 3:
          woundType = "heavy";
          break;
        case 4:
          woundType = "incap";
          break;
        default:
          woundType = "dead";
          break;
      }
      const datetime = game.settings.get("arm5e", "currentDate");
      let woundData = {
        name: `${game.i18n.localize(`arm5e.sheet.${woundType}`)} ${game.i18n.localize(
          "arm5e.sheet.wound.label"
        )}`,
        type: "wound",
        system: {
          inflictedDate: {
            year: datetime.year,
            season: datetime.season
          },
          healedDate: { year: null, season: "spring" },
          gravity: woundType,
          originalGravity: woundType,
          trend: 0,
          bonus: 0,
          nextRoll: 0,
          description: "Fatigue loss overflow"
        }
      };
      await this.createEmbeddedDocuments("Item", [woundData]);
    }
    await this.update(updateData, {});
  }

  async addActiveEffect(name, type, subtype, value, option = null, icon) {
    if (Object.keys(ACTIVE_EFFECTS_TYPES).includes(type)) {
      if (Object.keys(ACTIVE_EFFECTS_TYPES[type].subtypes).includes(subtype)) {
        const activeEffectData = {
          origin: this.uuid,
          duration: {
            rounds: undefined
          },
          flags: {
            arm5e: {
              noEdit: false,
              type: [type],
              subtype: [subtype],
              option: [null]
            }
          },
          changes: [
            {
              label: ACTIVE_EFFECTS_TYPES[type].subtypes[subtype].label,
              key: ACTIVE_EFFECTS_TYPES[type].subtypes[subtype].key,
              mode: ACTIVE_EFFECTS_TYPES[type].subtypes[subtype].mode,
              value: value ?? ACTIVE_EFFECTS_TYPES[type].subtypes[subtype].default
            }
          ],
          tint: "#000000"
        };
        if (CONFIG.ISV10) {
          activeEffectData.label = name;
          activeEffectData.icon = icon ?? "icons/svg/aura.svg";
        } else {
          activeEffectData.name = name;
          activeEffectData.img = icon ?? "icons/svg/aura.svg";
        }

        return await this.createEmbeddedDocuments("ActiveEffect", [activeEffectData]);
      } else {
        log(false, "Unknown subtype");
      }
    } else {
      log(false, "Unknown type");
    }
  }

  // Async removeActiveEffect(type, subtype) {
  //   if (Object.keys(ACTIVE_EFFECTS_TYPES).includes(type)) {
  //     if (Object.keys(ACTIVE_EFFECTS_TYPES[type].subtypes).includes(subtype)) {
  //       const toDelete = Object.values(this.effects).filter(e => )
  //       return await this.deleteEmbeddedDocuments("ActiveEffect", toDelete);
  //     } else {
  //       log(false, "Unknown subtype");
  //     }
  //   } else {
  //     log(false, "Unknown type");
  //   }
  //   return;
  // }

  async changeWound(amount, wtype) {
    if (!this._isCharacter() || (amount < 0 && this.system.wounds[type].length == 0)) {
      return [];
    }
    let wounds = [];
    const datetime = game.settings.get("arm5e", "currentDate");
    for (let ii = 0; ii < amount; ii++) {
      let woundData = {
        name: `${game.i18n.localize(`arm5e.sheet.${wtype}`)} ${game.i18n.localize(
          "arm5e.sheet.wound.label"
        )}`,
        type: "wound",
        system: {
          inflictedDate: {
            year: datetime.year,
            season: datetime.season
          },
          healedDate: { year: null, season: "spring" },
          gravity: wtype,
          originalGravity: wtype,
          trend: 0,
          bonus: 0,
          nextRoll: 0,
          description: ""
        }
      };
      wounds.push(woundData);
    }
    return await this.createEmbeddedDocuments("Item", wounds);
  }

  // Used by Quick magic dialog
  async selectVoiceAndGestures(stance, value) {
    if (this._isMagus()) {
      if (["voice", "gestures"].includes(stance)) {
        const update = {};
        update[`system.stances.${stance}Stance`] = value;
        await this.update(update);
      }
    }
  }

  async useConfidencePoint() {
    if (!this._isCharacter()) {
      return false;
    }

    if (this.system.con.points == 0) {
      ui.notifications.info(
        game.i18n.format("arm5e.notification.noConfidencePointsLeft", { name: this.name }),
        {
          permanent: false
        }
      );
      return false;
    }
    log(false, "Used confidence point");
    await this.update({ system: { con: { points: this.system.con.points - 1 } } });
    return true;
  }

  _hasDate() {
    return ["player", "beast", "covenant", "npc"].includes(this.type);
  }

  async rest() {
    if (!this._isCharacter()) {
      return;
    }
    let updateData = {};
    updateData["system.fatigueCurrent"] = 0;
    await this.update(updateData, {});
  }

  async loseMightPoints(num) {
    if (!this._isCharacter()) {
      return;
    }
    if (num > this.system.might.points) {
      ui.notifications.warn("Spending more might points than available");
      return;
    }
    let updateData = {};
    updateData["system.might.points"] = Number(this.system.might.points) - num;
    await this.update(updateData, {});
  }

  // Set the proper default icon just before creation
  async _preCreate(data, options, userId) {
    await super._preCreate(data, options, userId);
    let toUpdate = false;
    if (CONFIG.ARM5E.ActorDataModels[data.type]?.getDefault) {
      data = CONFIG.ARM5E.ActorDataModels[data.type].getDefault(data);
      toUpdate = true;
    }

    if (CONFIG.ARM5E.ActorDataModels[data.type]?.getIcon) {
      data.img = CONFIG.ARM5E.ActorDataModels[data.type].getIcon(data);
      toUpdate = true;
    } else if (data.img === undefined || data.img === "icons/svg/mystery-man.svg") {
      if (data.type in CONFIG.ARM5E_DEFAULT_ICONS) {
        data.img = CONFIG.ARM5E_DEFAULT_ICONS[data.type];
        toUpdate = true;
      }
    }

    // If (this.type == "laboratory") {
    //   let effectsData = this.effects.contents;
    //   var baseSafetyEffect = this.effects.find((e) => e.getFlag("arm5e", "baseSafetyEffect"));
    //   if (!baseSafetyEffect) {
    //     // TODO put that data structure elsewhere (during lab activities implementation)
    //     const effect = {
    //       origin: this.uuid,
    //       tint: "#000000",
    //       changes: [
    //         {
    //           label: "arm5e.sheet.safety",
    //           key: "system.safety.bonus",
    //           mode: CONST.ACTIVE_EFFECT_MODES.ADD,
    //           value: 0
    //         }
    //       ],
    //       flags: {
    //         arm5e: {
    //           baseSafetyEffect: true,
    //           noEdit: true,
    //           type: ["laboratory"],
    //           subtype: ["safety"],
    //           option: [null]
    //         }
    //       }
    //     };
    //     if (CONFIG.ISV10) {
    //       effect.label = game.i18n.localize("arm5e.sheet.baseSafety");
    //       effect.icon = "icons/svg/aura.svg";
    //     } else {
    //       effect.name = game.i18n.localize("arm5e.sheet.baseSafety");
    //       effect.img = "icons/svg/aura.svg";
    //     }
    //     effectsData.push(effect);
    //     // const res = await this.effects.update(effectsData);
    //     data.effects = effectsData;
    //   }
    // }

    if (toUpdate) {
      this.updateSource(data);
    }
  }

  async getAgingEffects(agingData) {
    if (!this._isCharacter()) {
      return;
    }
    let amount = agingData.impact;
    let char1 = agingData.char;
    let char2 = agingData.char2;
    let naturalAging = agingData.season == "winter";
    let updateData = {};
    let result = { crisis: false, apparent: 1, charac: {} };
    switch (amount) {
      case 0:
        updateData["system.apparent.value"] = this.system.apparent.value + 1;
        break;
      case undefined:
        result.apparent = 0;
        break;
      case 1:
        updateData["system.apparent.value"] = this.system.apparent.value + 1;
        updateData["system.decrepitude.points"] = this.system.decrepitude.points + 1;
        result.decrepitude = 1;
        result.charac[char1] = { aging: 1 };
        // Number of Aging Points greater than the absolute value of the Characteristic
        if (
          Math.abs(this.system.characteristics[char1].value) <
          this.system.characteristics[char1].aging + 1
        ) {
          updateData[`system.characteristics.${char1}.value`] =
            this.system.characteristics[char1].value - 1;
          updateData[`system.characteristics.${char1}.aging`] = 0;
          result.charac[char1].score = -1;
        } else {
          // Aging points still lesser or equal than absolute value of characteristic score.
          updateData[`system.characteristics.${char1}.aging`] =
            this.system.characteristics[char1].aging + 1;
        }
        if (this.system.decrepitude.experienceNextLevel == 1) result.crisis = true;
        break;
      case 2:
        updateData["system.apparent.value"] = this.system.apparent.value + 1;
        updateData["system.decrepitude.points"] = this.system.decrepitude.points + 2;
        result.decrepitude = 2;
        result.charac[char1] = { aging: 1 };
        result.charac[char2] = { aging: 1 };
        if (
          Math.abs(this.system.characteristics[char1].value) <
          this.system.characteristics[char1].aging + 1
        ) {
          updateData[`system.characteristics.${char1}.value`] =
            this.system.characteristics[char1].value - 1;
          updateData[`system.characteristics.${char1}.aging`] = 0;
          result.charac[char1].score = -1;
        } else {
          updateData[`system.characteristics.${char1}.aging`] =
            this.system.characteristics[char1].aging + 1;
        }
        if (
          Math.abs(this.system.characteristics[char2].value) <
          this.system.characteristics[char2].aging + 1
        ) {
          updateData[`system.characteristics.${char2}.value`] =
            this.system.characteristics[char2].value - 1;
          updateData[`system.characteristics.${char2}.aging`] = 0;
          result.charac[char1].score = -1;
        } else {
          updateData[`system.characteristics.${char2}.aging`] =
            this.system.characteristics[char2].aging + 1;
        }

        if (this.system.decrepitude.experienceNextLevel <= 2) result.crisis = true;

        break;
      default:
        // Crisis
        result.crisis = true;
        updateData["system.apparent.value"] = this.system.apparent.value + 1;
        updateData["system.decrepitude.points"] =
          this.system.decrepitude.points + this.system.decrepitude.experienceNextLevel;

        if (
          this.system.decrepitude.experienceNextLevel >
          Math.abs(this.system.characteristics[char1].value)
        ) {
          updateData[`system.characteristics.${char1}.value`] =
            this.system.characteristics[char1].value - 1;
          updateData[`system.characteristics.${char1}.aging`] = 0;
          result.charac[char1] = {
            aging: Math.abs(this.system.characteristics[char1].value) + 1,
            score: -1
          };
        } else {
          updateData[`system.characteristics.${char1}.aging`] =
            this.system.characteristics[char1].aging + this.system.decrepitude.experienceNextLevel;
          result.charac[char1] = {
            aging:
              Math.abs(this.system.characteristics[char1].value) +
              this.system.decrepitude.experienceNextLevel
          };
        }

        result.decrepitude = this.system.decrepitude.experienceNextLevel;
    }
    log(false, "Aging effect");
    log(false, updateData);
    if (result.crisis) {
      updateData["system.pendingCrisis"] = true;
      updateData["system.lastCrisis"] = { year: agingData.year, season: agingData.season };
    }

    if (this.system.bonuses.traits.aging && naturalAging) {
      updateData["system.warping.points"] =
        this.system.warping.points + CONFIG.ARM5E.activities.aging.warping.impact;
    }
    await this.update(updateData, {});
    return result;
  }

  // Migrate this particular actor and its items
  async migrate() {
    try {
      ui.notifications.info(`Migrating actor ${this.name}.`, {
        permanent: false
      });
      const updateData = await migrateActorData(this, this.items);

      if (!foundry.utils.isEmpty(updateData)) {
        console.log(`Migrating Actor entity ${this.name}`);
        await this.update(updateData, {
          enforceTypes: false
        });
      }
    } catch (err) {
      err.message = `Failed system migration for Actor ${this.name}: ${err.message}`;
      console.error(err);
    }
  }

  // Check if the actor has a specific skill
  // if option is undefined, it is not taken into account
  hasSkill(key, option = undefined) {
    if (key == "") return false;

    if (option) {
      return (
        this.system.abilities.find((e) => e.system.key == key && e.system.option == option) !=
        undefined
      );
    } else {
      return this.system.abilities.find((e) => e.system.key == key) != undefined;
    }
  }

  hasVirtue(key) {
    if (key == "") return false;
    return this.system.virtues.find((e) => e.system.indexKey == key) != undefined;
  }

  hasFlaw(key) {
    if (key == "") return false;
    return this.system.flaws.find((e) => e.system.indexKey == key) != undefined;
  }

  getAbility(key, option = "") {
    return this.system.abilities.find((e) => e.system.key == key && e.system.option == option);
  }

  getAbilityStats(key, option = "") {
    const ability = this.system.abilities.find(
      (e) => e.system.key == key && e.system.option == option
    );
    if (ability) {
      return { score: ability.system.finalScore, speciality: ability.system.speciality };
    }
    return { score: 0, speciality: "" };
  }

  getAbilityStatsForActivity(key, option = "") {
    const ability = this.system.abilities.find(
      (e) => e.system.key == key && e.system.option == option
    );
    if (ability) {
      return {
        score:
          ability.system.finalScore -
          this.system.bonuses.skills[ability.system.getComputedKey()].bonus,
        speciality: ability.system.speciality
      };
    }
    return { score: 0, speciality: "" };
  }

  getSimilarSpell(level, technique, form) {
    return this.system.spells.find(
      (e) =>
        e.system.level == level &&
        e.system.technique.value == technique &&
        e.system.form.value == form
    );
  }

  getSpellMasteryStats(spellId) {
    const spell = this.system.spells.find((e) => e.id == spellId);
    if (spell) {
      return {
        score: spell.system.mastery,
        xp: spell.system.xp,
        xpCoeff: spell.system.xpCoeff,
        xpBonus: spell.system.xpBonus
      };
    }
    return { score: 0, xp: 0, xpCoeff: 1, xpBonus: 0 };
  }

  getArtStats(key, forActivity = false) {
    let artType = "forms";
    if (Object.keys(CONFIG.ARM5E.magic.techniques).includes(key)) {
      artType = "techniques";
    }

    return this.system.arts[artType][key];
  }

  hasMagicResistance() {
    return this._isMagus() || this._hasMight() || this.system.bonuses.magicResistance !== null;
  }

  getLabTotalForEffect(spell, options = {}) {
    if (!spell.isAnEffect()) {
      error(false, "The item is not an effect");
      return;
    }

    let res = spell._computeCastingTotal(spell, { char: "int", focus: options.focus });
  }

  async changeHermeticArt(art, amount) {
    if (!this._isMagus()) return;

    let artType = "forms";
    if (Object.keys(CONFIG.ARM5E.magic.techniques).includes(art)) {
      artType = "techniques";
    }
    return await this.update({
      [`system.arts.${artType}.${art}.xp`]: this.system.arts[artType][art].xp + amount
    });
  }

  async changeMight(amount) {
    if (!this._hasMight()) return;

    await this.update({
      system: { might: { points: this.system.might.points + amount } }
    });
  }

  get hasWounds() {
    const res = Object.entries(this.system.wounds).filter((e) => {
      return CONFIG.ARM5E.recovery.wounds[e[0]].rank > 0 && e[1].length > 0;
    });
    return res.length > 0;
  }

  async restoreHealth(clearHistory = false) {
    let wounds = this.items.filter((e) => e.type == "wound");
    if (!clearHistory) {
      wounds = wounds.filter((w) => w.system.gravity != "healthy");
    }

    return await this.deleteEmbeddedDocuments(
      "Item",
      wounds.map((w) => w._id)
    );
  }

  // IDEA: check if the sheet is not null and filter the system activities instead.
  getSchedule(min, max, excludedActivities = [], excludedIds = [], season = undefined) {
    let res = [];
    const activitiesMap = new Map();
    for (let entry of this.system.diaryEntries) {
      if (!excludedIds.includes(entry._id) && !excludedActivities.includes(entry.system.activity)) {
        for (let date of entry.system.dates) {
          if (date.year >= min && date.year <= max) {
            if (min == max) {
              if (!activitiesMap.has(date.year)) {
                activitiesMap.set(date.year, {
                  [CONFIG.SEASON_ORDER_INV[3]]: [],
                  [CONFIG.SEASON_ORDER_INV[2]]: [],
                  [CONFIG.SEASON_ORDER_INV[1]]: [],
                  [CONFIG.SEASON_ORDER_INV[0]]: []
                });
              }
              activitiesMap.get(date.year)[date.season].push({
                id: entry._id,
                img: entry.img,
                name: entry.name,
                applied: entry.system.done || entry.system.activity === "none",
                type: entry.system.activity,
                date: date.date
              });
              if (season && date.season == season) {
                break;
              }
            } else {
              if (!activitiesMap.has(date.year)) {
                activitiesMap.set(date.year, {
                  [CONFIG.SEASON_ORDER_INV[3]]: [],
                  [CONFIG.SEASON_ORDER_INV[2]]: [],
                  [CONFIG.SEASON_ORDER_INV[1]]: [],
                  [CONFIG.SEASON_ORDER_INV[0]]: []
                });
              }
              activitiesMap.get(date.year)[date.season].push({
                id: entry._id,
                img: entry.img,
                name: entry.name,
                applied: entry.system.done || entry.system.activity === "none",
                type: entry.system.activity,
                date: date.date
              });
            }
          }
        }
      }
    }
    // Return Object.fromEntries(activitiesMap.entries());
    return Array.from(
      new Map(
        [...activitiesMap.entries()].sort(function (a, b) {
          return b[0] - a[0];
        })
      ),
      ([key, value]) => ({
        year: key,
        seasons: value
      })
    );
  }

  isBusy(year, season, excludedActivities = [], excludedIds = []) {
    for (let entry of this.system.diaryEntries) {
      if (!excludedIds.includes(entry._id) && !excludedActivities.includes(entry.system.activity)) {
        for (let date of entry.system.dates) {
          if (date.year == year && date.season == season) {
            return true;
          }
        }
      }
    }
    return false;
  }

  getWoundPenalty() {
    return this._getWoundPenalty(this.system.wounds);
  }

  // Same as above but with temporary wounds

  _getWoundPenalty(wounds) {
    let woundsTotal = 0;
    for (let [key, item] of Object.entries(wounds)) {
      if (key == "healthy") continue;
      if (item.length > 0) {
        woundsTotal = woundsTotal + item.length * this.system.penalties.wounds[key];
      }
    }
    return woundsTotal + this.system.bonuses.traits.wounds > 0
      ? 0
      : woundsTotal + this.system.bonuses.traits.wounds;
  }

  _getDiariesOfType(diaryType) {
    if (!["player", "npc", "laboratory", "covenant", "beast"].includes(this.type)) return [];
    if (!Object.keys(CONFIG.ARM5E.activities.generic).includes(diaryType)) return [];
    return this.items.filter((e) => {
      return e.type == "diaryEntry" && e.system.activity === diaryType;
    });
  }
}
