import { ARM5E, ARM5E_DEFAULT_ICONS } from "../config.js";
import {
  compareBaseEffects,
  compareSpells,
  compareMagicalEffects,
  compareLabTexts,
  compareDiaryEntries,
  log,
  error,
  compareTopics
} from "../tools.js";

import { migrateActorData } from "../migration.js";

import ArM5eActiveEffect from "../helpers/active-effects.js";
import { ArM5eRollData } from "../helpers/rollData.js";

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
    this.rollData = new ArM5eRollData(this);
  }

  prepareData() {
    super.prepareData();
  }

  /** @override */
  prepareBaseData() {
    super.prepareBaseData();
    // log(false, `${this.name}'s system ${JSON.stringify(this.system)}`);
    if (!this.flags.arm5e) {
      this.flags.arm5e = { filters: {} };
    }
    // add properties used for active effects:

    if (this.type == "laboratory") {
      this.system.size.bonus = 0;
      this.system.generalQuality.bonus = 0;
      this.system.safety.bonus = 0;
      this.system.health.bonus = 0;
      this.system.refinement.bonus = 0;
      this.system.upkeep.bonus = 0;
      this.system.warping.bonus = 0;
      this.system.aesthetics.bonus = 0;

      // create data keys for lab specialty
      this.system.specialty = {};
      for (let key of Object.keys(CONFIG.ARM5E.magic.arts)) {
        this.system.specialty[key] = { bonus: 0 };
      }

      return;
    }
    let datetime = game.settings.get("arm5e", "currentDate");
    if (this.type == "covenant") {
      if (this.system.datetime === null) {
        this.system.datetime = {
          year: datetime.year,
          season: datetime.season,
          month: "mar",
          day: 21
        };
      }
    }

    if (this.type != "player" && this.type != "npc" && this.type != "beast") {
      return;
    }

    if (this.system.datetime === null) {
      this.system.datetime = {
        year: datetime.year,
        season: datetime.season,
        month: "mar",
        day: 21
      };
    }

    this.system.bonuses = {};

    if (this._isMagus()) {
      // hack, if the active effect for magus is not setup
      if (this.system.realmAlignment == 0) {
        this.system.realmAlignment = 1;
      }
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
    }

    this.system.bonuses.arts = {
      voice: 0,
      gestures: 0,
      spellcasting: 0,
      laboratory: 0,
      penetration: 0,
      magicResistance: null
    };

    this.system.bonuses.skills = {};
    for (const [key, item] of this.items.entries()) {
      if (item.type == "ability") {
        let abilityKey = item.system?.key || "";
        if (abilityKey != "") {
          // log(false, `Ability key: ${abilityKey}`);
          if (CONFIG.ARM5E.ALL_ABILITIES[abilityKey].option || false) {
            abilityKey += "_" + item.system.option;
          }
          this.system.bonuses.skills[abilityKey] = {};
          this.system.bonuses.skills[abilityKey].bonus = 0;
          this.system.bonuses.skills[abilityKey].xpCoeff = 1.0;
        }
      }
    }

    this.system.bonuses.traits = { soak: 0, aging: 0, wounds: 0, fatigue: 0 };

    this.system.bonuses.activities = {
      practice: 0,
      training: 0,
      teaching: 0,
      teacher: 0,
      reading: 0,
      writing: 0,
      adventuring: 0
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

  // DEV: to be deleted, the code below is done in the preCreate hook
  // /** @override */
  // prepareEmbeddedDocuments() {
  //   // if (this.type == "laboratory") {
  //   //   this._prepareLaboratoryEmbeddedDocuments();
  //   // }

  //   super.prepareEmbeddedDocuments();
  // }

  // _prepareLaboratoryEmbeddedDocuments() {
  //   var baseSafetyEffect = this.effects.find(e => e.getFlag("arm5e", "baseSafetyEffect"));
  //   if (!baseSafetyEffect) {
  //     this.createEmbeddedDocuments("ActiveEffect", [
  //       {
  //         label: game.i18n.localize("arm5e.sheet.baseSafety"),
  //         icon: "icons/svg/aura.svg",
  //         origin: this.uuid,
  //         tint: "#000000",
  //         changes: [
  //           {
  //             label: "arm5e.sheet.safety",
  //             key: "system.safety.bonus",
  //             mode: CONST.ACTIVE_EFFECT_MODES.ADD,
  //             value: 0
  //           }
  //         ],
  //         flags: {
  //           arm5e: {
  //             baseSafetyEffect: true,
  //             noEdit: true,
  //             type: ["laboratory"],
  //             subtype: ["safety"],
  //             option: [null]
  //           }
  //         }
  //       }
  //     ]);
  //   }
  // }

  /** @override */
  prepareDerivedData() {
    if (this.type == "magicCodex") {
      return this._prepareMagicCodexData();
    } else if (this.type == "covenant") {
      return this._prepareCovenantData();
    } else if (this.type == "laboratory") {
      return this._prepareLabData();
    } else if (this.type == "crucible") {
      return this._prepareCrucibleData();
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
    let overload = [0, 1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 9999];
    // Initialize containers.
    let weapons = [];
    let armor = [];
    let spells = [];
    let magicalEffects = [];
    let vis = [];
    let items = [];
    let magicItems = [];
    let artsTopics = [];
    let mundaneTopics = [];
    let masteryTopics = [];
    let laboratoryTexts = [];
    let virtues = [];
    let flaws = [];
    let abilities = [];
    let abilitiesSelect = {};
    let diaryEntries = [];
    let abilitiesFamiliar = [];
    let powersFamiliar = [];
    let pendingXps = 0;

    let soak = system.characteristics.sta.value + system.bonuses.traits.soak;

    let powers = [];

    let reputations = [];

    let totalXPAbilities = 0;
    let totalXPArts = 0;
    let totalVirtues = 0;
    let totalFlaws = 0;
    let totalXPSpells = 0;

    let combat = {
      weight: 0,
      overload: -1,
      init: 0,
      atk: 0,
      dfn: 0,
      dam: 0,
      prot: 0,
      ability: 0
    };

    system.characTotal = 0;
    for (let c of Object.values(system.characteristics)) {
      if (c.value > 0) {
        system.characTotal += (c.value * (c.value + 1)) / 2;
      } else {
        system.characTotal -= (Math.abs(c.value) * (Math.abs(c.value) + 1)) / 2;
      }
    }

    // fatigue management
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

    if (system.wounds) {
      system.woundsTotal = 0;
      for (let [key, item] of Object.entries(system.wounds)) {
        system.woundsTotal = system.woundsTotal + item.number.value * item.penalty.value;
      }
      system.woundsTotal =
        system.woundsTotal + system.bonuses.traits.wounds > 0
          ? 0
          : system.woundsTotal + system.bonuses.traits.wounds;
    }

    //abilities
    const temp = {
      _id: "",
      name: "N/A",
      value: 0
    };
    abilitiesSelect["a0"] = temp;
    for (const [key, item] of this.items.entries()) {
      if (item.type === "ability") {
        let computedKey = item.system.key;
        if (item.system.option != "") {
          computedKey += "_" + item.system.option;
        }
        item.system.xpCoeff = this._getAbilityXpCoeff(item.system.key, item.system.option);
        item.system.derivedScore = ArM5ePCActor.getAbilityScoreFromXp(
          Math.round(item.system.xp * item.system.xpCoeff)
        );
        item.system.xpNextLevel = Math.round(
          5 * item.system.derivedScore + 5 / item.system.xpCoeff
        );
        item.system.remainingXp =
          item.system.xp -
          Math.round(ArM5ePCActor.getAbilityXp(item.system.derivedScore) / item.system.xpCoeff);

        // for DEBUG purposes
        // if (item.system.xpCoeff != 1.0) {
        //   let coeff = item.system.xpCoeff;
        //   log(false, `xpCoeff: ${coeff}`);
        //   let newxp = item.system.xp * coeff;
        //   log(false, `Xp: ${item.system.xp} and after afinity: ${newxp}`);
        //   let score = ArM5ePCActor.getAbilityScoreFromXp(item.system.xp);
        //   let affinityscore = ArM5ePCActor.getAbilityScoreFromXp(Math.round(item.system.xp * coeff));
        //   log(false, `score : ${score} and after afinity: ${affinityscore}`);
        //   let nextLvl = ArM5ePCActor.getAbilityXp(affinityscore + 1) - item.system.xp;
        //   let afterAffinity = nextLvl / coeff;
        //   log(false, `xpNextLvl: ${nextLvl} and after afinity: ${afterAffinity}`);
        // }

        if (
          system.bonuses.skills[computedKey] != undefined &&
          system.bonuses.skills[computedKey].bonus != 0
        ) {
          item.system.finalScore =
            item.system.derivedScore + parseInt(system.bonuses.skills[computedKey].bonus);
        } else {
          item.system.finalScore = item.system.derivedScore;
        }

        abilities.push(item);

        const temp = {
          id: item._id,
          name: item.name,
          value: item.system.finalScore
        };
        //abilitiesSelect.push(temp);
        abilitiesSelect["a" + key] = temp;

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
            // legacy code, to be removed in the future
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
      system.abilities = abilities.sort(function(e1, e2) {
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
      this.system.bonuses.arts.spellcasting +=
        parseInt(this.system.bonuses.arts.voice) + parseInt(this.system.bonuses.arts.gestures);

      if (system.laboratory === undefined) {
        system.laboratory = {};
      }
      // calculate magic totals
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
        system.characteristics.int.value + system.laboratory.abilitiesSelected.magicTheory.value; // aura pending

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
        // TODO remove once confirmed there is no bug
        // if (technique.xpCoeff != 1.0) {
        //   log(false, `xpCoeff: ${technique.xpCoeff}`);
        //   let newxp = technique.xp * technique.xpCoeff;
        //   log(false, `Xp: ${technique.xp} and after afinity: ${newxp}`);
        //   let score = ArM5ePCActor.getArtScore(technique.xp);
        //   let affinityscore = ArM5ePCActor.getArtScore(Math.round(technique.xp * technique.xpCoeff));
        //   log(false, `score : ${score} and after afinity: ${affinityscore}`);
        //   let nextLvl = ArM5ePCActor.getArtXp(affinityscore + 1) / technique.xpCoeff - technique.xp;
        //   let afterAffinity = nextLvl / technique.xpCoeff;
        //   log(false, `xpNextLvl: ${nextLvl} and after afinity: ${afterAffinity}`);
        // }
        // end TODO

        technique.derivedScore = ArM5ePCActor.getArtScore(
          Math.round(technique.xp * technique.xpCoeff)
        );
        technique.finalScore = technique.derivedScore + technique.bonus;
        // start from scratch to avoid rounding errors
        technique.xpNextLevel = Math.round(
          ArM5ePCActor.getArtXp(technique.derivedScore + 1) / technique.xpCoeff
        );

        // TODO remove once confirmed there is no bug
        // if (technique.score != technique.derivedScore && technique.xp != 0) {
        //   error(
        //     false,
        //     "Wrong computation of score: Original: " +
        //       technique.score +
        //       " vs Computed: " +
        //       technique.derivedScore +
        //       " XPs:" +
        //       technique.xp
        //   );
        //   ArM5ePCActor.getArtScore(technique.xp);
        // }
        // Calculate the next level experience needed
        totalXPArts = parseInt(totalXPArts) + technique.xp;
      }

      const parmaStats = this.getAbilityStats("parma");
      for (let [key, form] of Object.entries(system.arts.forms)) {
        // TODO remove once confirmed there is no bug
        // if (form.xpCoeff != 1.0) {
        //   log(false, `xpCoeff: ${form.xpCoeff}`);
        //   let newxp = form.xp * form.xpCoeff;
        //   log(false, `Xp: ${form.xp} and after afinity: ${newxp}`);
        //   let score = ArM5ePCActor.getArtScore(form.xp);
        //   let affinityscore = ArM5ePCActor.getArtScore(Math.round(form.xp * form.xpCoeff));
        //   log(false, `score : ${score} and after afinity: ${affinityscore}`);
        //   let nextLvl = ArM5ePCActor.getArtXp(affinityscore + 1) / form.xpCoeff - form.xp;
        //   let afterAffinity = nextLvl / form.xpCoeff;
        //   log(false, `xpNextLvl: ${nextLvl} and after afinity: ${afterAffinity}`);
        // }
        // // end TODO

        form.derivedScore = ArM5ePCActor.getArtScore(Math.round(form.xp * form.xpCoeff));
        form.finalScore = form.derivedScore + form.bonus;

        form.xpNextLevel = Math.round(ArM5ePCActor.getArtXp(form.derivedScore + 1) / form.xpCoeff);
        // TODO remove once confirmed there is no bug
        // if (form.score != form.derivedScore && form.xp != 0) {
        //   error(
        //     false,
        //     "Wrong computation of score: Original: " +
        //       form.score +
        //       " vs Computed: " +
        //       form.derivedScore +
        //       " XPs:" +
        //       form.xp
        //   );
        //   ArM5ePCActor.getArtScore(form.xp);
        // }

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

      if (item.type === "weapon" || item.type === "enchantedWeapon") {
        if (item.system.equiped == true) {
          combat.weight = parseInt(combat.weight) + parseInt(item.system.weight);
          combat.init = parseInt(combat.init) + parseInt(item.system.init);
          combat.atk = parseInt(combat.atk) + parseInt(item.system.atk);
          combat.dfn = parseInt(combat.dfn) + parseInt(item.system.dfn);
          combat.dam = parseInt(combat.dam) + parseInt(item.system.dam);
          combat.img = item.img;
          combat.name = item.name;
          combat.itemId = item.id;

          if (item.system.ability == "") {
            if (item.system.weaponExpert) {
              combat.ability = parseInt(combat.ability) + 1;
            }
          } else {
            for (var a = 0; a < abilities.length; a++) {
              if (abilities[a]._id == item.system.ability) {
                let hab = abilities[a].system.finalScore;
                if (item.system.weaponExpert) {
                  hab = parseInt(hab) + 1;
                }
                if (item.system.horse) {
                  if (hab > 3) {
                    hab = 3;
                  }
                }
                combat.ability = parseInt(combat.ability) + parseInt(hab);
              }
            }
          }
        }

        item.system.abilities = abilitiesSelect;
        weapons.push(item);
      } else if (item.type === "armor" || item.type === "enchantedArmor") {
        if (item.system.equiped == true) {
          combat.weight = parseInt(combat.weight) + parseInt(item.system.weight);
          combat.prot = parseInt(combat.prot) + parseInt(item.system.prot);
        }
        armor.push(item);
      } else if (item.type === "spell") {
        item.system.castingTotal = item._computeCastingTotal(this, { char: "sta" });
        spells.push(item);
        totalXPSpells = parseInt(totalXPSpells) + parseInt(item.system.level);
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
              error(false, "Unknown topic category" + topic.category);
          }
        }
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
      } else if (item.type === "diaryEntry") {
        if (item.system.duration != item.system.done) {
          pendingXps += item.system.sourceQuality;
        }
        diaryEntries.push(item);
      } else if (item.type === "abilityFamiliar") {
        abilitiesFamiliar.push(item);
      } else if (item.type === "mightFamiliar" || item.type === "powerFamiliar") {
        powersFamiliar.push(item);
      } else if (item.type === "might" || item.type === "power") {
        powers.push(item);
      } else if (item.type === "magicItem") {
        magicItems.push(item);
      } else if (item.type === "personality") {
        personalities.push(item);
      } else if (item.type === "reputation") {
        reputations.push(item);
      }
    }

    // combat
    for (var a = 0; a < overload.length; a++) {
      if (combat.overload == -1) {
        if (overload[a] > combat.weight) {
          combat.overload = parseInt(a) - 1;
        }
      }
    }

    if (combat.prot) {
      soak += combat.prot;
    }

    if (combat.overload < 0) {
      combat.overload = 0;
    }
    if (system.characteristics) {
      if (system.characteristics.str.value > 0) {
        combat.overload = parseInt(combat.overload) - parseInt(system.characteristics.str.value);
      }
      if (combat.overload < 0) {
        combat.overload = 0;
      }
    }
    combat.overload = parseInt(combat.overload) * -1;

    if (this._isGrog()) {
      system.con.score = 0;
      system.con.points = 0;
    }
    //warping & decrepitude
    if ((this.type == "npc" && this.system.charType.value != "entity") || this.type == "player") {
      if (system.warping == undefined) {
        system.warping = { points: 0 };
      }
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

    // Assign and return
    system.totalXPAbilities = totalXPAbilities;
    system.totalXPArts = totalXPArts;
    system.totalVirtues = totalVirtues;
    system.totalFlaws = totalFlaws;
    system.totalXPSpells = totalXPSpells;
    system.pendingXps = pendingXps;
    if (system.weapons) {
      system.weapons = weapons;
      system.combat = combat;
    }
    if (system.armor) {
      system.armor = armor;
    }
    if (system.spells) {
      // system.spells = spells;
      system.spells = spells.sort(compareSpells);
    }
    if (system.magicalEffects) {
      system.magicalEffects = magicalEffects.sort(compareMagicalEffects);
    }

    if (system.vitals.soa) {
      system.vitals.soa.value = soak;
    }

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

    if (system.powers) {
      system.powers = powers;
    }

    if (system.reputations) {
      system.reputations = reputations;
    }

    log(false, "pc end of prepare actor data");
    log(false, system);
  }

  _prepareMagicCodexData() {
    this.img = CONFIG.ARM5E_DEFAULT_ICONS["magicCodex"];
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
    if (system.formFilter != "") {
      baseEffects = baseEffects.filter(e => e.system.form.value === system.formFilter);
      magicEffects = magicEffects.filter(e => e.system.form.value === system.formFilter);
      spells = spells.filter(e => e.system.form.value === system.formFilter);
      enchantments = enchantments.filter(e => e.system.form.value === system.formFilter);
    }
    if (system.techniqueFilter != "") {
      baseEffects = baseEffects.filter(e => e.system.technique.value === system.techniqueFilter);
      magicEffects = magicEffects.filter(e => e.system.technique.value === system.techniqueFilter);
      spells = spells.filter(e => e.system.technique.value === system.techniqueFilter);
      enchantments = enchantments.filter(e => e.system.technique.value === system.techniqueFilter);
    }
    if (system.levelFilter != 0 && system.levelFilter != null) {
      if (system.levelOperator == 0) {
        magicEffects = magicEffects.filter(e => e.system.level === system.levelFilter);
        spells = spells.filter(e => e.system.level === system.levelFilter);
        enchantments = enchantments.filter(e => e.system.level === system.levelFilter);
      } else if (system.levelOperator == -1) {
        magicEffects = magicEffects.filter(e => e.system.level <= system.levelFilter);
        spells = spells.filter(e => e.system.level <= system.levelFilter);
        enchantments = enchantments.filter(e => e.system.level <= system.levelFilter);
      } else {
        magicEffects = magicEffects.filter(e => e.system.level >= system.levelFilter);
        spells = spells.filter(e => e.system.level >= system.levelFilter);
        enchantments = enchantments.filter(e => e.system.level >= system.levelFilter);
      }
    }
    system.baseEffects = baseEffects.sort(compareBaseEffects);
    system.baseEffectCount = baseEffects.length;
    system.magicEffects = magicEffects.sort(compareMagicalEffects);
    system.magicEffectsCount = magicEffects.length;
    system.enchantments = enchantments.sort(compareMagicalEffects);
    system.enchantmentsCount = enchantments.length;
    system.spells = spells.sort(compareSpells);
    system.spellsCount = spells.length;
  }

  getRollData() {
    let rollData = super.getRollData();
    rollData.config = {
      character: {},
      magic: {}
    };
    rollData.config.character.magicAbilities = CONFIG.ARM5E.character.magicAbilities;
    rollData.config.magic.arts = ARM5E.magic.arts;
    rollData.config.magic.penetration = ARM5E.magic.penetration;
    return rollData;
  }

  _prepareLabData() {
    const system = this.system;
    let virtues = [];
    let flaws = [];
    let specialities = [];
    let distinctive = [];
    let rooms = [];
    let magicItems = [];
    let personalities = [];
    let vis = [];
    let items = [];
    let artsTopics = [];
    let mundaneTopics = [];
    let masteryTopics = [];
    let laboratoryTexts = [];
    let diaryEntries = [];
    let totalVirtues = 0;
    let totalFlaws = 0;

    for (let [key, item] of this.items.entries()) {
      if (item.type === "speciality") {
        specialities.push(item);
      } else if (item.type === "distinctive") {
        distinctive.push(item);
      } else if (item.type === "sanctumRoom") {
        rooms.push(item);
      } else if (item.type === "magicItem") {
        magicItems.push(item);
      } else if (item.type === "personality") {
        personalities.push(item);
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
              error(false, "Unknown topic category" + topic.category);
          }
        }
      } else if (item.type === "vis") {
        vis.push(item);
      } else if (item.type === "item") {
        items.push(item);
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
      } else if (item.type === "diaryEntry") {
        diaryEntries.push(item);
      }
    }

    if (system.specialities) {
      system.specialities = specialities;
    }
    if (system.distinctive) {
      system.distinctive = distinctive;
    }
    if (system.rooms) {
      system.rooms = rooms;
    }

    if (system.personalities) {
      system.personalities = personalities;
    }

    if (system.items) {
      system.items = items;
    }
    system.artsTopics = artsTopics.sort(compareTopics);
    system.mundaneTopics = mundaneTopics.sort(compareTopics);
    system.masteryTopics = masteryTopics.sort(compareTopics);
    system.laboratoryTexts = laboratoryTexts.sort(compareTopics);
    if (system.rawVis) {
      system.rawVis = vis;
    }

    if (system.magicItems) {
      system.magicItems = magicItems;
    }

    if (system.virtues) {
      system.virtues = virtues;
    }
    if (system.flaws) {
      system.flaws = flaws;
    }
    if (system.diaryEntries) {
      system.diaryEntries = diaryEntries;
    }

    system.size.total = system.size.value + system.size.bonus;
    system.generalQuality.total = system.generalQuality.value + system.generalQuality.bonus;
    system.safety.total = system.safety.value + system.safety.bonus;
    system.health.total = system.health.value + system.health.bonus;
    system.refinement.total = system.refinement.value + system.refinement.bonus;
    system.upkeep.total = system.upkeep.value + system.upkeep.bonus;
    system.warping.total = system.warping.value + system.warping.bonus;
    system.aesthetics.total = system.aesthetics.value + system.aesthetics.bonus;

    let freeVirtues = system.size.total + system.refinement.total;
    let occupiedSize = Math.max(totalVirtues - totalFlaws, 0) - system.refinement.total;
    let baseSafety = system.refinement.total - Math.max(occupiedSize, 0);

    system.baseSafety = baseSafety;
    system.occupiedSize = occupiedSize;
    system.freeVirtues = freeVirtues;

    system.totalVirtues = totalVirtues;
    system.totalFlaws = totalFlaws;

    var baseSafetyEffect = this.effects.find(e => e.getFlag("arm5e", "baseSafetyEffect"));
    if (baseSafetyEffect != null && baseSafetyEffect.changes[0].value != String(baseSafety)) {
      let changes = duplicate(baseSafetyEffect.changes);
      changes[0].value = String(baseSafety);
      baseSafetyEffect.update({ changes });
    }
  }

  _prepareCovenantData() {
    const system = this.system;
    let reputations = [];
    let magi = [];
    let companion = [];
    let specialists = [];
    let habitants = [];
    let horses = [];
    let livestock = [];
    let possessions = [];
    let visSources = [];
    let visStock = [];
    let calendar = [];
    let incomingSources = [];
    let laboratoryTexts = [];
    let artsTopics = [];
    let mundaneTopics = [];
    let masteryTopics = [];
    let magicItems = [];
    let items = [];
    let boons = [];
    let hooks = [];
    let labs = [];
    let diaryEntries = [];
    let totalVirtues = 0;
    let totalFlaws = 0;

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
      } else if (item.type === "habitantMagi") {
        magi.push(item);
      } else if (item.type === "habitantCompanion") {
        companion.push(item);
      } else if (item.type === "habitantSpecialists") {
        specialists.push(item);
      } else if (item.type === "habitantHabitants") {
        habitants.push(item);
      } else if (item.type === "habitantHorses") {
        horses.push(item);
      } else if (item.type === "habitantLivestock") {
        livestock.push(item);
      } else if (item.type === "possessionsCovenant") {
        possessions.push(item);
      } else if (item.type === "visSourcesCovenant") {
        visSources.push(item);
      } else if (item.type === "visStockCovenant") {
        visStock.push(item);
      } else if (item.type === "calendarCovenant") {
        calendar.push(item);
      } else if (item.type === "incomingSource") {
        incomingSources.push(item);
      } else if (item.type === "laboratoryText") {
        laboratoryTexts.push(item);
      } else if (item.type === "book") {
        let idx = 0;
        for (let topic of item.system.topics) {
          topic.img = item.img;
          topic.id = item.id;
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
              if (topic.labtext == null) {
                topic.system = { type: "" };
              } else {
                topic.system = topic.labtext;
              }

              if (topic.labtext != null) {
                topic.name = `${topic.book}: ${topic.labtextTitle}`;
              }
              laboratoryTexts.push(topic);
              break;
            default:
              error(false, "Unknown topic category" + topic.category);
          }
        }
      } else if (item.type === "magicItem") {
        magicItems.push(item);
      } else if (item.type === "reputation") {
        reputations.push(item);
      } else if (item.type === "item") {
        items.push(item);
      } else if (item.type === "labCovenant") labs.push(item);
    }
    if (system.reputations) {
      system.reputations = reputations;
    }
    if (system.habitants) {
      system.habitants.magi = magi;
      system.habitants.companion = companion;
      system.habitants.specialists = specialists;
      system.habitants.habitants = habitants;
      system.habitants.horses = horses;
      system.habitants.livestock = livestock;
    }
    if (system.possessions) {
      system.possessions = possessions;
    }
    if (system.visSources) {
      system.visSources = visSources;
    }
    if (system.visStock) {
      system.visStock = visStock;
    }
    if (system.calendar) {
      system.calendar = calendar;
    }
    if (system.incomingSources) {
      system.incomingSources = incomingSources;
    }
    system.artsTopics = artsTopics.sort(compareTopics);
    system.mundaneTopics = mundaneTopics.sort(compareTopics);
    system.masteryTopics = masteryTopics.sort(compareTopics);
    // system.laboratoryTexts = laboratoryTexts.sort(compareTopics);
    if (system.magicItems) {
      system.magicItems = magicItems;
    }
    if (system.diaryEntries) {
      system.diaryEntries = diaryEntries;
    }

    if (system.virtues) {
      system.virtues = boons;
    }
    if (system.flaws) {
      system.flaws = hooks;
    }

    if (system.items) {
      system.items = items;
    }

    if (system.laboratoryTexts) {
      let flag = this.getFlag("arm5e", "sorting", "laboratoryTexts");
      if (flag && flag["laboratoryTexts"] == true) {
        system.laboratoryTexts = laboratoryTexts.sort(compareLabTexts);
      } else {
        system.laboratoryTexts = laboratoryTexts;
      }
    }

    if (system.labs) {
      system.labs = labs;
    }
  }

  _prepareCrucibleData() {
    log(false, "_prepareCrucibleData");

    for (let [key, item] of this.items.entries()) {
      if (item.type == "magicItem") {
        this.system.receptacle = item;
      } else if (item.type == "enchantment") {
        this.system.enchantments.push(item);
      }
    }
  }

  // Utility functions

  // get the XP coefficient of a given ability if any

  _getAbilityXpCoeff(abilityKey = "", option = "") {
    if (abilityKey === "" || CONFIG.ARM5E.ALL_ABILITIES[abilityKey] == undefined) {
      return 1.0;
    }
    if (CONFIG.ARM5E.ALL_ABILITIES[abilityKey].selection === "disabled") {
      return 1.0; // raise exception instead?
    }
    if (CONFIG.ARM5E.ALL_ABILITIES[abilityKey].option || false) {
      abilityKey += "_" + option;
    }
    if (this.system.bonuses.skills[abilityKey] == undefined) {
      // ability not yet added to bonuses
      return 1.0;
    }

    return this.system.bonuses.skills[abilityKey].xpCoeff || 1.0;
  }
  // get the Xps needed for an ability/decrepitude/warping score
  static getAbilityXp(score) {
    return ArM5ePCActor.getArtXp(score) * 5;
  }

  // get the score given an amount of xp
  static getAbilityScoreFromXp(xp) {
    return ArM5ePCActor.getArtScore(Math.floor(xp / 5));
  }

  // get the Xps needed for an art score
  static getArtXp(score) {
    return (score * (score + 1)) / 2;
  }

  // get the score given an amount of xp
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
      val => val.system.key == abilityKey && val.system.option == abilityOption
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

  loseFatigueLevel(num) {
    this._changeFatigueLevel(num);
  }

  async _changeFatigueLevel(num) {
    if (!this._isCharacter() || (num < 0 && this.system.fatigueCurrent == 0)) {
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

    // fatigue overflow
    switch (overflow) {
      case 0:
        break;
      case 1:
        updateData["system.wound.light.number.value"] = system.wound.light.number.value + 1;
        break;
      case 2:
        updateData["system.wound.medium.number.value"] = system.wound.medium.number.value + 1;
        break;
      case 3:
        updateData["system.wound.heavy.number.value"] = system.wound.heavy.number.value + 1;
        break;
      case 4:
        updateData["system.wound.incap.number.value"] = system.wound.incap.number.value + 1;
        break;
      default:
        updateData["system.wound.dead.number.value"] = system.wound.dead.number.value + 1;
        break;
    }

    await this.update(updateData, {});
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

  // set the proper default icon just before creation
  async _preCreate(data, options, userId) {
    await super._preCreate(data, options, userId);
    log(false, `_preCreate: _id = ${this._id}`);
    if (data.img === undefined) {
      if (data.type in CONFIG.ARM5E_DEFAULT_ICONS) {
        const img = CONFIG.ARM5E_DEFAULT_ICONS[data.type];
        if (img)
          await this.updateSource({
            img
          });
      }
    }
    if (this.type == "laboratory") {
      let effectsData = this.effects.contents;
      var baseSafetyEffect = this.effects.find(e => e.getFlag("arm5e", "baseSafetyEffect"));
      if (!baseSafetyEffect) {
        // TODO put that data structure elsewhere (during lab activities implementation)
        effectsData.push({
          label: game.i18n.localize("arm5e.sheet.baseSafety"),
          icon: "icons/svg/aura.svg",
          origin: this.uuid,
          tint: "#000000",
          changes: [
            {
              label: "arm5e.sheet.safety",
              key: "system.safety.bonus",
              mode: CONST.ACTIVE_EFFECT_MODES.ADD,
              value: 0
            }
          ],
          flags: {
            arm5e: {
              baseSafetyEffect: true,
              noEdit: true,
              type: ["laboratory"],
              subtype: ["safety"],
              option: [null]
            }
          }
        });
        const res = await this.effects.update(effectsData);
        log(false, res);
      }
    }
  }

  async addAgingPoints(amount, char1, char2) {
    if (!this._isCharacter()) {
      return;
    }
    let updateData = {};
    let result = { crisis: false, apparent: 1, charac: {} };
    updateData["system.age.value"] = this.system.age.value + 1;
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
        // number of Aging Points greater than the absolute value of the Characteristic
        if (
          Math.abs(this.system.characteristics[char1].value) <
          this.system.characteristics[char1].aging + 1
        ) {
          updateData[`system.characteristics.${char1}.value`] =
            this.system.characteristics[char1].value - 1;
          updateData[`system.characteristics.${char1}.aging`] = 0;
          result.charac[char1].score = -1;
        } else {
          // aging points still lesser or equal than absolute value of characteristic score.
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
        //crisis
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
    }
    await this.update(updateData, {});
    return result;
  }

  // migrate this particular actor and its items
  async migrate() {
    try {
      ui.notifications.info(`Migrating actor ${this.name}.`, {
        permanent: false
      });
      const updateData = migrateActorData(this);

      if (!isEmpty(updateData)) {
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

  // TODO improve: what should happen if more that one effect is returned?
  getActiveEffectValue(type, subtype) {
    const ae = ArM5eActiveEffect.findAllActiveEffectsWithSubtype(this.effects, subtype);
    if (ae.length) {
      log(false, ae);
      return ae[0].changes[0].value;
    }
    return 0;
  }

  hasSkill(key) {
    if (key == "") return false;

    return (
      this.system.abilities.find(e => e.system.key == key && e.system.option == "") != undefined
    );
  }

  getAbilityStats(key, option = "") {
    const ability = this.system.abilities.find(
      e => e.system.key == key && e.system.option == option
    );
    if (ability) {
      return { score: ability.system.finalScore, speciality: ability.system.speciality };
    }
    return { score: 0, speciality: "" };
  }

  getSpellMasteryStats(spellId) {
    const spell = this.system.spell.find(e => e.id == spellId);
    if (spell) {
      return {
        score: spell.system.mastery,
        xp: spell.system.xp,
        xpCoeff: spell.system.xpCoeff
      };
    }
    return { score: 0, xp: 0, xpCoeff };
  }

  getArtStats(key) {
    let artType = "techniques";
    if (Object.keys(CONFIG.ARM5E.magic.techniques).indexOf(key) == -1) {
      artType = "forms";
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
}
