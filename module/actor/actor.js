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
} from "../tools/tools.js";

import { ACTIVE_EFFECTS_TYPES } from "../constants/activeEffectsTypes.js";

import { migrateActorData } from "../migration.js";

import ArM5eActiveEffect from "../helpers/active-effects.js";
import { ArM5eRollInfo } from "../helpers/rollInfo.js";
import { compareDiaryEntries, isInThePast } from "../tools/time.js";
import Aura from "../helpers/aura.js";
import { canBeEnchanted } from "../helpers/magic.js";
import { ArM5eMagicSystem } from "./subsheets/magic-system.js";
import { ArM5eItem } from "../item/item.js";

/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class ArM5eActor extends Actor {
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

    if (["player", "npc"].includes(this.type)) {
      this.system.covenant.document = game.actors.get(this.system.covenant.actorId);
      if (this.system.covenant.document) {
        this.system.covenant.value = this.system.covenant.document.name;
        this.system.covenant.linked = true;
      } else {
        this.system.covenant.linked = false;
      }
    }

    if (this.type != "player" && this.type != "npc" && this.type != "beast") {
      return;
    }
    const datetime = game.settings.get("arm5e", "currentDate");

    if (this.system.states.creationMode) {
      this.system.description.born.value =
        Number(datetime.year) - (this.system.age.value ? this.system.age.value : 0);
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

    if (this.system.realms) {
      this.system.realms["magic"].susceptible = false;
      this.system.realms["faeric"].susceptible = false;
      this.system.realms["divine"].susceptible = false;
      this.system.realms["infernal"].susceptible = false;
      // } else {
      //   this.system.realms = {
      //     magic: { susceptible: false },
      //     faeric: { susceptible: false },
      //     divine: { susceptible: false },
      //     infernal: { susceptible: false }
      //   };
    }

    // // CHARACTER FEATURES
    if (this.system.features == undefined) {
      this.system.features = { magicSystem: false, powers: false };
    }

    this.system.bonuses = {};

    if (this.isMagus()) {
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

    this.system.bonuses.rolls = {
      fatigue: 0
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

    this.system.bonuses.magicResistance = {
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
    switch (this.type) {
      case "magicCodex":
      case "covenant":
      case "laboratory":
        return;

      case "container":
        return this._prepareContainerData();
      case "base":
        return {};
      default:
        return this._prepareCharacterData();
    }
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData() {
    const system = this.system;
    // log(false, `Preparing Actor ${this.name} data`);
    // Initialize collections.
    system.weapons = [];
    system.armor = [];
    system.vis = [];
    system.items = [];
    system.artsTopics = [];
    system.mundaneTopics = [];
    system.masteryTopics = [];
    system.laboratoryTexts = [];
    system.physicalBooks = [];
    system.virtues = [];
    system.flaws = [];
    system.reputations = [];
    system.personalities = [];
    system.abilities = [];
    system.diaryEntries = [];

    if (system.familiar) {
      system.familiar.abilities = [];
      system.familiar.powers = [];
    }
    system.spells = [];
    system.magicalEffects = [];

    system.qualities = [];
    system.inferiorities = [];

    system.powers = [];

    system.totalXPAbilities = 0;
    system.totalXPArts = 0;
    system.totalVirtues = 0;
    system.totalFlaws = 0;
    system.pendingXps = 0;

    system.totalQualities = 0;
    system.totalInferiorities = 0;
    system.totalXPSpells = 0;
    system.totalXPMasteries = 0;

    let soak = system.characteristics.sta.value + system.bonuses.traits.soak;
    this.system.combat = {
      img: "",
      name: "",
      itemId: "",
      itemUuid: "",
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
      c.value = Math.max(c.upgrade, c.value);
    }

    // Fatigue management
    if (system.fatigue) {
      system.fatigueTotal = 0;
      system.fatigueTime = 0;
      system.fatigueLongTerm = system.fatigueLongTerm ?? 0;

      let lvl = 0;
      let longTerm = "crossed";
      for (let [key, item] of Object.entries(system.fatigue)) {
        let fatigueArray = [];

        for (let ii = 0; ii < item.amount; ii++) {
          if (lvl < system.fatigueCurrent) {
            if (lvl >= system.fatigueLongTerm) {
              longTerm = "";
              system.fatigueTime += CONFIG.ARM5E.character.fatigueLevels[key].time;
            }
            fatigueArray.push({ state: true, lt: longTerm });

            system.fatigueTotal = item.number > 0 ? 0 : item.number;
          } else {
            fatigueArray.push({ state: false, lt: "" });
          }
          lvl++;
        }
        item.levels = fatigueArray;
      }
      if (system.fatigueCurrent > 0 && system.fatigueCurrent == system.fatigueLongTerm) {
        system.fatigueTime = 8;
        system.fatigueRestUnit = game.i18n.localize("arm5e.generic.hoursShort");
      } else {
        system.fatigueRestUnit = game.i18n.localize("arm5e.generic.minutesShort");
      }
      system.fatigueTotal =
        system.fatigueTotal + system.bonuses.traits.fatigue > 0
          ? 0
          : system.fatigueTotal + system.bonuses.traits.fatigue;
      system.fatigueMaxLevel = lvl;
    }

    ////////////////////
    // Resources
    ////////////////////
    system.resource = {};
    // Fatigue as resource for token bar

    system.resource.fatigue = {
      value: system.fatigueMaxLevel - system.fatigueCurrent,
      max: system.fatigueMaxLevel
    };

    // Might as ressource
    if (this.hasMight()) {
      system.resource.might = {
        value: system.might.points,
        max: system.might.value
      };
    }

    for (const [key, item] of this.items.entries()) {
      // move code specific to type below in their respective datamodel schema.
      if (item.system.prepareOwnerData instanceof Function) {
        item.system.prepareOwnerData();
      }
      item.img = item.img || DEFAULT_TOKEN;
      // distribute items in their respective collection
      switch (item.type) {
        case "ability":
          if (item.system.category == "altTechnique") {
            system.magicSystem.verbs.push(item);
          } else if (item.system.category == "altForm") {
            system.magicSystem.nouns.push(item);
          } else {
            if (this.isMagus()) {
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
                system.laboratory.abilitiesSelected.penetration = item.system.finalScore;
              }
            }

            system.totalXPAbilities += item.system.xp;
            system.abilities.push(item);
          }
          break;
        case "abilityFamiliar":
          system.familiar.abilities.push(item);
          break;
        case "armor":
          system.armor.push(item);
          break;
        case "book":
          let idx = 0;
          for (let topic of item.system.topics) {
            topic.id = item.id;
            topic.img = item.img;
            topic.index = idx++;
            topic.book = `${item.name} (${integerToRomanNumeral(idx)})`;
            switch (topic.category) {
              case "ability":
                system.mundaneTopics.push(topic);
                break;
              case "art":
                system.artsTopics.push(topic);
                break;
              case "mastery":
                system.masteryTopics.push(topic);
                break;
              case "labText":
                topic.system = topic.labtext;
                if (topic.labtext != null) {
                  topic.name = `${topic.book}: ${topic.labtextTitle}`;
                }
                system.laboratoryTexts.push(topic);
                break;
              default:
                error(false, `Unknown topic category${topic.category}`);
            }
          }
          system.physicalBooks.push(item);
          break;
        case "diaryEntry":
          if (!item.system.done) {
            system.pendingXps += item.system.sourceQuality;
          }
          system.diaryEntries.push(item);
          break;
        case "flaw":
          if (ARM5E.impacts[item.system.impact.value]) {
            system.totalFlaws += ARM5E.impacts[item.system.impact.value].cost;
          }
          system.flaws.push(item);
          break;
        case "inferiority":
          if (ARM5E.impacts[item.system.impact.value]) {
            system.totalInferiorities += ARM5E.impacts[item.system.impact.value].cost;
          }
          system.inferiorities.push(item);
          break;
        case "item":
          system.items.push(item);
          break;
        case "laboratoryText":
          let topic = {
            id: item.id,
            img: item.img,
            index: 0,
            book: "",
            category: "labText",
            name: item.name,
            system: item.system
          };
          system.laboratoryTexts.push(topic);
          break;
        case "magicalEffect":
          system.magicalEffects.push(item);
          break;
        case "personalityTrait":
          system.personalities.push(item);
          break;
        case "power":
          system.powers.push(item);
          break;
        case "powerFamiliar":
          system.familiar.powers.push(item);
          break;
        case "quality":
          if (ARM5E.impacts[item.system.impact.value]) {
            system.totalQualities += ARM5E.impacts[item.system.impact.value].cost;
          }
          system.qualities.push(item);
          break;
        case "reputation":
          system.reputations.push(item);
          break;
        case "spell":
          system.totalXPSpells += item.system.level;
          system.totalXPMasteries += item.system.xp;
          system.spells.push(item);
          break;
        case "supernaturalEffect":
          if (system.supernaturalEffectsTemplates[item.system.template]) {
            system.supernaturalEffectsTemplates[item.system.template].push(item);
          } else {
            system.supernaturalEffectsTemplates["orphans"].push(item);
          }
          break;
        case "virtue":
          if (ARM5E.impacts[item.system.impact.value]) {
            system.totalVirtues += ARM5E.impacts[item.system.impact.value].cost;
          }
          system.virtues.push(item);
          break;
        case "vis":
          system.vis.push(item);
          break;
        case "weapon":
          system.weapons.push(item);
          break;
        case "wound":
          system.wounds[item.system.gravity].push(item);
          break;
      }
    }

    // SORTING

    system.abilities.sort(function (e1, e2) {
      return e1.name.localeCompare(e2.name);
    });
    system.armor.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    system.artsTopics.sort(compareTopics);
    system.diaryEntries.sort(compareDiaryEntries);
    system.flaws.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    system.inferiorities.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    system.items.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    system.laboratoryTexts.sort(compareTopics);
    system.magicalEffects.sort(compareMagicalEffects);
    system.masteryTopics.sort(compareTopics);
    system.mundaneTopics.sort(compareTopics);
    system.personalities.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    system.physicalBooks.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    system.powers.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    system.qualities.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    system.reputations.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    system.spells.sort(compareSpells);
    system.virtues.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    system.vis.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    system.weapons.sort((a, b) => (a.sort || 0) - (b.sort || 0));

    if (this.isMagus()) {
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
        technique.derivedScore = ArM5eActor.getArtScore(
          Math.round(technique.xp * technique.xpCoeff)
        );
        technique.finalScore = technique.derivedScore + technique.bonus;
        // Start from scratch to avoid rounding errors
        technique.xpNextLevel = Math.round(
          ArM5eActor.getArtXp(technique.derivedScore + 1) / technique.xpCoeff
        );

        // Calculate the next level experience needed
        system.totalXPArts += technique.xp;
      }

      const parmaStats = this.getAbilityStats("parma");
      for (let [key, form] of Object.entries(system.arts.forms)) {
        form.derivedScore = ArM5eActor.getArtScore(Math.round(form.xp * form.xpCoeff));
        form.finalScore = form.derivedScore + form.bonus;

        form.xpNextLevel = Math.round(ArM5eActor.getArtXp(form.derivedScore + 1) / form.xpCoeff);

        form.magicResistance = parmaStats.score * 5 + form.finalScore;
        if (parmaStats.speciality.toUpperCase() === form.label.toUpperCase()) {
          form.magicResistance += 5;
        }

        system.totalXPArts += form.xp;
      }
      // post preparation treatment, taking into account active effects
      for (const spell of this.system.spells) {
        spell.system.computeCastingTotal();
      }

      for (const effect of this.system.magicalEffects) {
        effect.system.computeCastingTotal();
      }
    }

    if (system.supernaturalEffectsTemplates) {
      for (const template of Object.values(system.supernaturalEffectsTemplates)) {
        for (const effect of template) {
          effect.system.computeCastingTotal();
        }
      }
    }
    ///////////////////////
    // Combat
    ///////////////////////

    for (let weapon of system.weapons) {
      if (weapon.system.naturalWeapon) {
        const key = slugify(weapon.name, true);
        system.combatPreps.list[key] = { name: weapon.name, ids: [weapon._id] };
      }
    }
    // console.log(`Combat preps of ${this.name}`, system.combatPreps);
    for (let [name, prep] of Object.entries(system.combatPreps.list)) {
      prep.valid = true;
      if (name === system.combatPreps.current) {
        prep.load = 0;
        prep.init = 0;
        prep.atk = 0;
        prep.dfn = 0;
        prep.dam = 0;
        prep.prot = 0;
        prep.ability = 0;
        let ab = null;
        const items = [];
        for (let id of prep.ids) {
          const item = this.items.get(id);
          if (!item) {
            prep.valid = false;
            continue;
          }
          items.push(item.name);
          if (item.type === "weapon") {
            prep.load += item.system.load;
            prep.init += item.system.init;
            prep.atk += item.system.atk;
            prep.dfn += item.system.dfn;
            prep.dam += item.system.dam;

            // prep.itemId = item._id;
            prep.img = prep.img ? prep.img : item.img;
            // prep.name = prep.img ? prep.img : item.name;
            prep.ability = 0;
            if (!ab) ab = this.getAbility(item.system.ability.key, item.system.ability.option);

            if (ab) {
              prep.ability += ab.system.finalScore;
              if (item.system.weaponExpert) {
                prep.ability++;
              }
              if (item.system.horse) {
                const ride = this.getAbilityStats("ride");
                if (ride.score > 3) {
                  ride.score = 3;
                }
                prep.ability += ride.score;
              }
              // item.system.ability.id = ab._id;
            }
          } else if (item.type === "armor") {
            prep.prot += item.system.prot;
            prep.load += item.system.load;
          }
          item.system.equipped = true;
        }
        prep.itemList = items.join(", ");
        prep.overload = ArM5eActor.getArtScore(prep.load);
        system.combat = prep;
      }
    }

    if (system.combat.prot) {
      soak += system.combat.prot;
    }

    if (system.characteristics) {
      if (system.characteristics.str.value > 0) {
        system.combat.overload = system.combat.overload - system.characteristics.str.value;
      }
      if (system.combat.overload < 0) {
        system.combat.overload = 0;
      }
    }

    if (this.isGrog()) {
      system.con.score = 0;
      system.con.points = 0;
    }
    // Warping & decrepitude
    if ((this.type == "npc" && this.system.charType.value != "entity") || this.type == "player") {
      system.warping.finalScore = ArM5eActor.getAbilityScoreFromXp(system.warping.points);
      system.warping.experienceNextLevel =
        ((parseInt(system.warping.finalScore) + 1) *
          (parseInt(system.warping.finalScore) + 2) *
          5) /
          2 -
        system.warping.points;

      if (system.decrepitude == undefined) {
        system.decrepitude = { points: 0 };
      }
      system.decrepitude.finalScore = ArM5eActor.getAbilityScoreFromXp(system.decrepitude.points);
      system.decrepitude.experienceNextLevel =
        ((parseInt(system.decrepitude.finalScore) + 1) *
          (parseInt(system.decrepitude.finalScore) + 2) *
          5) /
          2 -
        system.decrepitude.points;
    }
    system.penalties.wounds.total = this.getWoundPenalty();

    if (system.vitals.soa) {
      system.vitals.soa.value = soak;
    }

    system.vitals.enc.value = system.combat.overload;

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

    //log(false, "PC end of prepare actor data", system);
  }

  /**
   * Determine default artwork based on the provided actor data.
   * @param {ActorData} actorData                      The source actor data.
   * @returns {{img: string, texture: {src: string}}}  Candidate actor image and prototype token artwork.
   */
  static getDefaultArtwork(actorData) {
    // a default icon exists for this type
    if (actorData.type in CONFIG.ARM5E_DEFAULT_ICONS) {
      let icon;
      // getIcon method exists
      if (actorData.system && CONFIG.ARM5E.ActorDataModels[actorData.type]?.getIcon) {
        icon = CONFIG.ARM5E.ActorDataModels[actorData.type].getIcon(actorData);
        return {
          img: icon,
          texture: {
            src: icon
          }
        };
      } else if (actorData.img === undefined || actorData.img === this.DEFAULT_ICON) {
        icon = CONFIG.ARM5E_DEFAULT_ICONS[actorData.type];
        return {
          img: icon,
          texture: {
            src: icon
          }
        };
      }
    }
    return super.getDefaultArtwork(actorData);
  }

  get tokenName() {
    return this.isToken ? this.token.name : this.prototypeToken.name;
  }

  get tokenImage() {
    return this.isToken ? this.token.texture.src : this.prototypeToken.texture.src;
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
    if (this.isCharacter()) {
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

      if (this.isMagus()) {
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
    return ArM5eActor.getArtXp(score) * 5;
  }

  // Get the score given an amount of xp
  static getAbilityScoreFromXp(xp) {
    return ArM5eActor.getArtScore(Math.floor(xp / 5));
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
  isMagus() {
    return (
      (this.type == "npc" && this.system.charType.value == "magusNPC") ||
      (this.type == "player" && this.system.charType.value == "magus")
    );
  }

  static IsMagus(type, charType) {
    return (type == "npc" && charType == "magusNPC") || (type == "player" && charType == "magus");
  }

  hasMight() {
    return this.type == "npc" && this.system.charType.value == "entity";
  }

  isCompanion() {
    return this.type == "player" && this.system.charType.value == "companion";
  }

  isGrog() {
    return this.type == "player" && this.system.charType.value == "grog";
  }

  isCharacter() {
    return this.type == "player" || this.type == "npc" || this.type == "beast";
  }

  getAbilityScore(abilityKey, abilityOption = "") {
    if (!this.isCharacter()) {
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
    if (!this.isCharacter()) {
      return null;
    }
    let artType = "techniques";
    if (Object.keys(CONFIG.ARM5E.magic.techniques).indexOf(artKey) == -1) {
      artType = "forms";
    }
    return this.system.arts[artType][artKey];
  }

  // Vitals management

  async recoverFatigueLevel(num, longTerm = false) {
    const updateData = {};
    const res = this._changeFatigueLevel(updateData, -num, false, longTerm);
    if (res.fatigueLevels) await this.update(updateData, {});
    return res;
  }

  async loseFatigueLevel(num, wound = true, longTerm = false) {
    const updateData = {};
    const res = this._changeFatigueLevel(updateData, num, wound, longTerm);
    if (res.fatigueLevels) await this.update(updateData, {});
    if (res.woundGravity) {
      await this.changeWound(
        1,
        CONFIG.ARM5E.recovery.rankMapping[res.woundGravity],
        game.i18n.localize("arm5e.sheet.fatigue.overflow")
      );
    }
    return res;
  }

  _changeFatigueLevel(updateData, num, wound = true, longTerm = false) {
    const res = {
      fatigueLevels: 0,
      woundGravity: 0
    };
    if (!this.isCharacter() || (num <= 0 && this.system.fatigueCurrent == 0)) {
      return res;
    }
    let futureLvl = this.system.fatigueCurrent + num;
    let overflow = 0;
    if (futureLvl < 0) {
      // character cannot restore more fatigue levels than he/she has
      if (longTerm) {
        res.fatigueLevels = -this.system.fatigueCurrent;
        updateData["system.fatigueLongTerm"] = 0;
        updateData["system.fatigueCurrent"] = 0;
      } else {
        res.fatigueLevels = futureLvl + this.system.fatigueLongTerm;
        updateData["system.fatigueCurrent"] = this.system.fatigueLongTerm;
      }
    } else if (futureLvl > this.system.fatigueMaxLevel) {
      // overflow to a wound
      if (longTerm) {
        res.fatigueLevels = this.system.fatigueMaxLevel - this.system.fatigueCurrent;
        updateData["system.fatigueCurrent"] = this.system.fatigueMaxLevel;
        updateData["system.fatigueLongTerm"] = this.system.fatigueLongTerm + res.fatigueLevels;
      } else {
        res.fatigueLevels = this.system.fatigueMaxLevel - this.system.fatigueCurrent;
        updateData["system.fatigueCurrent"] = this.system.fatigueMaxLevel;
      }
      overflow = futureLvl - this.system.fatigueMaxLevel;
    } else {
      res.fatigueLevels = num;

      if (longTerm) {
        const newLongTerm = this.system.fatigueLongTerm + num;
        if (newLongTerm > 0) {
          updateData["system.fatigueLongTerm"] = newLongTerm;
          updateData["system.fatigueCurrent"] = futureLvl;
        } else {
          updateData["system.fatigueLongTerm"] = 0;
          updateData["system.fatigueCurrent"] =
            this.system.fatigueCurrent - this.system.fatigueLongTerm;
        }
      } else {
        updateData["system.fatigueCurrent"] = Math.max(futureLvl, this.system.fatigueLongTerm);
      }
    }

    if (wound && overflow > 0) {
      res.woundGravity = overflow <= 5 ? overflow : 5;
    }
    return res;
  }

  _clearConfidencePrompt(updateData) {
    updateData["system.states.confidencePrompt"] = false;
  }

  async clearConfidencePrompt() {
    const updateData = {};
    this._clearConfidencePrompt(updateData);
    await this.update(updateData);
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
        activeEffectData.name = name;
        activeEffectData.img = icon ?? "icons/svg/aura.svg";

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

  async changeWound(amount, wtype, description = "") {
    if (
      !this.isCharacter() ||
      wtype === "none" ||
      (amount <= 0 && this.system.wounds[wtype].length == 0)
    ) {
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
          description: description
        }
      };
      wounds.push(woundData);
    }
    return await this.createEmbeddedDocuments("Item", wounds);
  }

  // Used by Quick magic dialog
  async selectVoiceAndGestures(stance, value) {
    const updateData = {};
    if (this._selectVoiceAndGestures(updateData, stance, value)) await this.update(updateData);
  }

  _selectVoiceAndGestures(updateData, stance, value) {
    if (this.isMagus()) {
      if (["voice", "gestures"].includes(stance)) {
        const update = {};
        updateData[`system.stances.${stance}Stance`] = value;
        return true;
      }
    }
    return false;
  }

  canUseConfidencePoint() {
    if (!this.isCharacter() || this.isGrog()) {
      return false;
    }

    if (this.system.con.points == 0) {
      // ui.notifications.info(
      //   game.i18n.format("arm5e.notification.noConfidencePointsLeft", { name: this.name }),
      //   {
      //     permanent: false
      //   }
      // );
      return false;
    }
    return true;
  }

  async useConfidencePoint() {
    const updateData = {};
    if (this._useConfidencePoint(updateData)) await this.update(updateData);
  }

  _useConfidencePoint(updateData) {
    if (!this.canUseConfidencePoint()) return false;

    updateData["system.con.points"] = this.system.con.points - 1;
    return true;
  }

  _hasDate() {
    return ["player", "beast", "covenant", "npc"].includes(this.type);
  }

  async rest(longTerm = false) {
    const updateData = {};
    if (this._rest(updateData, longTerm)) await this.update(updateData, {});
  }

  _rest(updateData, longTerm = false) {
    if (!this.isCharacter()) {
      return false;
    }
    if (longTerm) {
      updateData["system.fatigueLongTerm"] = 0;
      updateData["system.fatigueCurrent"] = 0;
    } else {
      // first reduce short-term fatigue
      if (this.system.fatigueCurrent > this.system.fatigueLongTerm) {
        updateData["system.fatigueCurrent"] = this.system.fatigueLongTerm;
      } else {
        // then reduce long-term fatigue by 1
        let fatigueLongTerm =
          this.system.fatigueLongTerm - 1 >= 0 ? this.system.fatigueLongTerm - 1 : 0;
        updateData["system.fatigueCurrent"] = fatigueLongTerm;
        updateData["system.fatigueLongTerm"] = fatigueLongTerm;
      }
    }

    return true;
  }

  async loseMightPoints(num) {
    const updateData = {};
    if (this._loseMightPoints(updateData, num)) await this.update(updateData, {});
  }

  _loseMightPoints(updateData, num) {
    if (!this.isCharacter()) {
      return false;
    }
    if (num > this.system.might.points) {
      ui.notifications.warn("Spending more might points than available");
      return false;
    }

    updateData["system.might.points"] = Number(this.system.might.points) - num;
    return true;
  }

  magicResistance(form, realm) {
    if (!this.isCharacter()) return null;

    let magicResistance =
      Number(this.system.laboratory?.magicResistance?.value) ||
      Number(this.system?.might?.value) ||
      0; //  No magicResistance != magicResistance of 0

    // TODO support magic resistance for hedge magic forms

    const formLabel = CONFIG.ARM5E.magic.arts[form]?.label || "NONE";

    let specialityIncluded = "";
    let parma = null;
    if (this.hasSkill("parma")) {
      parma = this.getAbilityStats("parma");
      magicResistance += parma.score * 5;
      if (parma.speciality && parma.speciality.toUpperCase() === formLabel.toUpperCase()) {
        specialityIncluded = formLabel;
        magicResistance += 5;
      }
    }

    const arts = this.system?.arts;
    let auraMod = 0;
    // TODO, do a better job for player aligned to a realm
    if (this.hasMight()) {
      let aura = Aura.fromActor(this);
      auraMod = aura.computeMaxAuraModifier(this.system.realms);
      magicResistance += parseInt(auraMod);
    }

    let formScore = 0;
    if (arts) {
      formScore = arts.forms[form]?.finalScore || 0;
      magicResistance += formScore;
    }

    let otherResistance = Math.max(
      this.system.bonuses.magicResistance[form], // form specific
      this.system.bonuses.arts.magicResistance // global
    );
    // not cumulative with Parma
    if (otherResistance > 0 && otherResistance > magicResistance) {
      magicResistance = otherResistance;
      specialityIncluded = false;
      parma = null;
    }

    let susceptible = this.system.realms[realm].susceptible;

    if (susceptible) {
      magicResistance = Math.round(magicResistance / 2);
    }

    return {
      might: this.system?.might?.value,
      specialityIncluded,
      otherResistance: otherResistance,
      total: magicResistance,
      form: formLabel,
      formScore,
      susceptible,
      parma,
      aura: auraMod
    };
  }

  // Set the proper default icon just before creation
  async _preCreate(data, options, userId) {
    await super._preCreate(data, options, userId);
    let toUpdate = false;
    if (CONFIG.ARM5E.ActorDataModels[data.type]?.getDefault) {
      data = CONFIG.ARM5E.ActorDataModels[data.type].getDefault(data);
      toUpdate = true;
    }

    // Temporary until Character datamodel
    if (["player", "npc", "beast"].includes(data.type)) {
      data.system = {
        combatPreps: {
          current: "custom",
          list: { custom: { name: game.i18n.localize("arm5e.generic.custom"), ids: [] } }
        }
      };
      toUpdate = true;
    }

    if (toUpdate) {
      this.updateSource(data);
    }
  }

  async getAgingEffects(agingData) {
    const updateData = {};
    const res = this._getAgingEffects(updateData, agingData);

    if (res) await this.update(updateData, {});
    return res;
  }

  _getAgingEffects(updateData, agingData) {
    if (!this.isCharacter()) {
      return;
    }
    let amount = agingData.impact;
    let char1 = agingData.char;
    let char2 = agingData.char2;
    let naturalAging = agingData.season == "winter";

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
          this.system.characteristics[char1].aging + this.system.decrepitude.experienceNextLevel >
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
      updateData["system.states.pendingCrisis"] = true;
      updateData["system.lastCrisis"] = { year: agingData.year, season: agingData.season };
    }

    if (this.system.bonuses.traits.aging && naturalAging) {
      updateData["system.warping.points"] =
        this.system.warping.points + CONFIG.ARM5E.activities.aging.warping.impact;
    }
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
    return this.isMagus() || this.hasMight() || this.system.bonuses.arts.magicResistance !== null;
  }

  // getLabTotalForEffect(spell, options = {}) {
  //   if (!spell.isAnEffect()) {
  //     error(false, "The item is not an effect");
  //     return;
  //   }

  //   let res = spell.system._computeCastingTotal(this, { char: "int", focus: options.focus });
  // }

  async changeHermeticArt(art, amount) {
    if (!this.isMagus()) return;

    let artType = "forms";
    if (Object.keys(CONFIG.ARM5E.magic.techniques).includes(art)) {
      artType = "techniques";
    }
    return await this.update({
      [`system.arts.${artType}.${art}.xp`]: this.system.arts[artType][art].xp + amount
    });
  }

  _changeMight(updateData, amount) {
    if (!this.hasMight()) return false;
    updateData["system.might.points"] = this.system.might.points + amount;
    return true;
  }
  async changeMight(amount) {
    let updateData = {};
    if (this._changeMight(updateData, amount)) await this.update(updateData);
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
