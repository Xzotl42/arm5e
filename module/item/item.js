import { getLabUpkeepCost, log } from "../tools.js";
import { ArM5ePCActor } from "../actor/actor.js";
import { migrateItemData } from "../migration.js";
/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class ArM5eItem extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    super.prepareData();

    // Get the Item's data
    const system = this.system;
    if (this.isOwned && this.actor.system == undefined) {
      // this is a call from constructor, it will be called again with actor data initialied
      log(false, `Owned Item : ${this.id} : ${this.name}, actor.data= ${this.actor.data}`);
      return;
    }
    const owner = this.actor ? this.actor : {};
    if (this.isOwned) {
      if (this.type == "weapon" && this.actor != null) {
        let abilitiesSelect = {};

        const temp = {
          id: "",
          name: "N/A"
        };
        abilitiesSelect["a0"] = temp;

        // find the actor abilities and create the select
        for (let [key, i] of Object.entries(owner.items)) {
          if (i.type === "ability") {
            const temp = {
              id: i.id,
              name: i.name
            };
            //abilitiesSelect.push(temp);
            abilitiesSelect["a" + key] = temp;
          }
        }

        system.abilities = abilitiesSelect;
      }

      // compute mastery score
      if (this.type == "spell") {
        this.system.mastery = ArM5ePCActor.getAbilityScoreFromXp(this.system.xp);
        this.system.experienceNextLevel =
          ((parseInt(this.system.mastery) + 1) * (parseInt(this.system.mastery) + 2) * 5) / 2;
      }
    }

    if (this._needLevelComputation()) {
      if (this._isNotMigrated()) {
        return;
      }

      let effectLevel = this.system.baseLevel;

      if (system.range.value) {
        effectLevel = this._addSpellMagnitude(
          effectLevel,
          CONFIG.ARM5E.magic.ranges[system.range.value].impact
        );
      }
      if (system.duration.value) {
        effectLevel = this._addSpellMagnitude(
          effectLevel,
          CONFIG.ARM5E.magic.durations[system.duration.value].impact
        );
      }
      if (system.target.value) {
        effectLevel = this._addSpellMagnitude(
          effectLevel,
          CONFIG.ARM5E.magic.targets[system.target.value].impact
        );
      }
      if (system.complexity) {
        effectLevel = this._addSpellMagnitude(effectLevel, system.complexity);
      }
      if (system.targetSize) {
        effectLevel = this._addSpellMagnitude(effectLevel, system.targetSize);
      }
      if (system.enhancingRequisite) {
        effectLevel = this._addSpellMagnitude(effectLevel, system.enhancingRequisite);
      }

      if (
        this.type == "enchantment" ||
        (this.type == "laboratoryText" && this.system.type == "enchantment")
      ) {
        effectLevel += parseInt(system.effectfrequency);
        if (system.penetration % 2 == 1) {
          this.system.penetration += 1;
        }
        effectLevel += this.system.penetration / 2;

        if (system.maintainConc) {
          effectLevel += 5;
        }

        if (system.environmentalTrigger) {
          effectLevel += 3;
        }

        if (system.restrictedUse) {
          effectLevel += 3;
        }

        if (system.linkedTrigger) {
          effectLevel += 3;
        }
      } else {
        let shouldBeRitual = system.ritual;
        // Duration above moon are rituals and rituals are minimum level 20
        if (
          CONFIG.ARM5E.magic.durations[system.duration.value].impact > 3 ||
          system.target.value == "bound" ||
          effectLevel > 50
        ) {
          shouldBeRitual = true;
        }

        if (shouldBeRitual && effectLevel < 20) {
          effectLevel = 20;
        }
        this.system.ritual = shouldBeRitual;
      }
      if (this.system.general) {
        effectLevel += this.system.levelOffset ?? 0;
      }
      this.system.level = effectLevel;
      system.castingTotal = 0;
    }

    if (this.type == "labCovenant") {
      let pts = getLabUpkeepCost(system.upkeep);
      this.system.points = pts * CONFIG.ARM5E.lab.usage[system.usage].coeff;
    } else if (this.type == "magicItem") {
      this.system.maxLevel = 10 * this.system.materialBase * this.system.sizeMultiplier;
    }
    // log(false,"prepare-item");
    // log(false,itemData);
  }

  prepareDerivedData() {
    if (this.isOwned && this.actor == undefined) {
      // this is a call from constructor, it will be called again with actor data initialied
      log(false, `Owned Item : ${this.id} : ${this.name}, actor.data= ${this.actor.system}`);
      return;
    }
    // add category to ability

    if (this.type == "ability") {
      this.system.category = CONFIG.ARM5E.ALL_ABILITIES[this.system.key]?.category ?? "general";
    } else if (this.type == "diaryEntry") {
      const systemData = this.system;
      if (systemData.optionKey == undefined) {
        systemData.optionKey = "standard";
      }
      if (this.actor !== null && this.actor._isCharacter()) {
        const activityConfig = CONFIG.ARM5E.activities.generic[systemData.activity];

        this.system.done = systemData.dates.filter(d => d.applied == true).length;

        if (this.system.done > 0) {
          // keep the existing quality at the time of applying
          // log(false, `Use source quality (${systemData.sourceQuality}) as base for ${this.name}`);
          this.system.baseQuality = systemData.sourceQuality;
        } else {
          // only recompute source quality if the entry is not applied yet
          switch (systemData.activity) {
            case "training": {
              if (systemData.teacher.id === null) {
                this.system.baseQuality = Number(systemData.teacher.score) + 3;
              } else {
                this.system.baseQuality = 0;
                if (
                  Object.values(systemData.progress.abilities).length +
                    Object.values(systemData.progress.spells).length ===
                  1
                ) {
                  if (Object.values(systemData.progress.abilities).length > 0) {
                    this.system.baseQuality =
                      Number(systemData.progress.abilities[0].teacherScore) + 3;
                  } else {
                    this.system.baseQuality =
                      Number(systemData.progress.spells[0].teacherScore) + 3;
                  }
                }
              }
              break;
            }
            case "teaching": {
              this.system.baseQuality = systemData.teacher.teaching + systemData.teacher.com + 3;
              if (systemData.teacher.applySpec) {
                this.system.baseQuality++;
              }
              break;
            }
            case "practice":
            case "exposure": {
              this.system.baseQuality = activityConfig.source.default;
              break;
            }
            case "adventuring": {
              this.system.baseQuality = systemData.sourceQuality;
              break;
            }
            case "reading": {
              this.system.baseQuality = systemData.sourceQuality;
              break;
            }
            case "hermeticApp":
            case "childhood":
            case "laterLife":
            case "laterLifeMagi":
              {
                this.system.baseQuality = activityConfig.source.default; //systemData.sourceQuality;
              }
              break;
            default:
              break;
          }
        }
      }
    }
  }

  _needLevelComputation() {
    let enforceEnchantmentLevel =
      this.type == "laboratoryText" &&
      (this.system.type == "spell" || this.system.type == "enchantment");
    return (
      this.type == "magicalEffect" ||
      this.type == "enchantment" ||
      this.type == "spell" ||
      enforceEnchantmentLevel
    );
  }

  _isMagicalEffect() {
    return (
      this.type == "magicalEffect" ||
      this.type == "enchantment" ||
      this.type == "spell" ||
      (this.type === "laboratoryText" && this.system.type === "spell")
    );
  }

  // to tell whether a spell needs to be migrated
  _isNotMigrated() {
    if (
      this.system.range.value === undefined ||
      this.system.duration.value === undefined ||
      this.system.target.value === undefined
    ) {
      console.warn(
        `The spell ${this.name} has not been migrated, please trigger a manual migration!`
      );
      return true;
    }
    if (
      CONFIG.ARM5E.magic.ranges[this.system.range.value] === undefined ||
      CONFIG.ARM5E.magic.durations[this.system.duration.value] === undefined ||
      CONFIG.ARM5E.magic.targets[this.system.target.value] === undefined
    ) {
      // if those values are not defined, this spell hasn't been migrated, no need to attempt to compute anything

      console.warn(
        `The spell ${this.name} has not been migrated, please trigger a manual migration!`
      );
      return true;
    }
    return false;
  }

  // return a localize string of a magic effect attributes
  _getEffectAttributesLabel() {
    if (!this._isMagicalEffect()) return "";
    let label =
      ArM5eItem.getTechLabel(this.system) +
      " " +
      ArM5eItem.getFormLabel(this.system) +
      " " +
      this.system.level +
      " - " +
      game.i18n.localize("arm5e.spell.range.short") +
      ": " +
      game.i18n.localize(CONFIG.ARM5E.magic.ranges[this.system.range.value].label) +
      " " +
      game.i18n.localize("arm5e.spell.duration.short") +
      ": " +
      game.i18n.localize(CONFIG.ARM5E.magic.durations[this.system.duration.value].label) +
      " " +
      game.i18n.localize("arm5e.spell.target.short") +
      ": " +
      game.i18n.localize(CONFIG.ARM5E.magic.targets[this.system.target.value].label);
    return label;
  }

  static getTechLabel(systemData) {
    let label = CONFIG.ARM5E.magic.arts[systemData.technique.value].short;
    let techReq = Object.entries(systemData["technique-req"]).filter(r => r[1] === true);
    if (techReq.length > 0) {
      label += " (";
      techReq.forEach(key => {
        label += CONFIG.ARM5E.magic.arts[key[0]].short + " ";
      });
      // remove last whitespace
      label = label.substring(0, label.length - 1);
      label += ")";
    }
    return label;
  }

  static getFormLabel(systemData) {
    let label = CONFIG.ARM5E.magic.arts[systemData.form.value].short;
    let formReq = Object.entries(systemData["form-req"]).filter(r => r[1] === true);
    if (formReq.length > 0) {
      label += " (";
      formReq.forEach(key => {
        label += CONFIG.ARM5E.magic.arts[key[0]].short + " ";
      });
      // remove last whitespace
      label = label.substring(0, label.length - 1);
      label += ")";
    }

    return label;
  }

  _getTechniqueData(actorSystemData) {
    if (!this._isMagicalEffect()) return ["", 0, false];

    let label = CONFIG.ARM5E.magic.techniques[this.system.technique.value].label;
    let tech = 1000;
    let techReq = Object.entries(this.system["technique-req"]).filter(r => r[1] === true);
    let techDeficient = false;
    if (techReq.length > 0) {
      label += " (";
      techReq.forEach(key => {
        if (actorSystemData.arts.techniques[key[0]].deficient) {
          techDeficient = true;
        }
        tech = Math.min(tech, actorSystemData.arts.techniques[key[0]].finalScore);
        label += CONFIG.ARM5E.magic.arts[key[0]].short + " ";
      });
      // remove last whitespace
      label = label.substring(0, label.length - 1);
      label += ")";
      tech = Math.min(
        actorSystemData.arts.techniques[this.system.technique.value].finalScore,
        tech
      );
    } else {
      tech = actorSystemData.arts.techniques[this.system.technique.value].finalScore;
    }
    techDeficient =
      techDeficient || actorSystemData.arts.techniques[this.system.technique.value].deficient;
    return [label, tech, techDeficient];
  }
  _getFormData(actorSystemData) {
    if (!this._isMagicalEffect()) return ["", 0, false];

    let label = CONFIG.ARM5E.magic.forms[this.system.form.value].label;
    let form = 1000;
    let formDeficient = false;
    let formReq = Object.entries(this.system["form-req"]).filter(r => r[1] === true);
    if (formReq.length > 0) {
      label += " (";
      formReq.forEach(key => {
        if (actorSystemData.arts.forms[key[0]].deficient) {
          formDeficient = true;
        }
        form = Math.min(form, actorSystemData.arts.forms[key[0]].finalScore);
        label += CONFIG.ARM5E.magic.arts[key[0]].short + " ";
      });
      // remove last comma
      label = label.substring(0, label.length - 1);
      label += ")";
      form = Math.min(actorSystemData.arts.forms[this.system.form.value].finalScore, form);
    } else {
      form = actorSystemData.arts.forms[this.system.form.value].finalScore;
    }
    formDeficient = formDeficient || actorSystemData.arts.forms[this.system.form.value].deficient;
    return [label, form, formDeficient];
  }

  _addSpellMagnitude(base, num) {
    if (num == 0) {
      return base;
    }
    // in case base is a string
    base = parseInt(base);
    if (num > 0) {
      // log(false, `Adding ${num} magnitudes from ${base}`);
      if (base + num <= 5) {
        return base + num;
      }
      let loop = num;
      let res = base;
      while (loop > 0) {
        if (res < 5) {
          res++;
        } else {
          res = res + 5;
        }
        loop--;
      }
      return res;
    } else {
      log(false, `Adding ${num} magnitudes from ${base}`);
      if (base + num <= 1) {
        return base + num;
      }
      let loop = num;
      let res = base;
      while (loop < 0) {
        if (res <= 5) {
          res--;
        } else {
          res = res - 5;
        }
        loop++;
      }
      log(false, `returns ${res}`);
      return res;
    }
  }

  _computeCastingTotal(owner, options = {}) {
    if (owner.type != "player" && owner.type != "npc") {
      return 0;
    }
    let itemData = this.system;
    let res = owner.system.characteristics[options.char].value;
    let tech = 1000;
    let form = 1000;
    let focusBonus = 0;
    let deficiencyDivider = 1;
    let deficientTech = false;
    let deficientForm = false;
    let techReq = Object.entries(itemData["technique-req"]).filter(r => r[1] === true);
    let formReq = Object.entries(itemData["form-req"]).filter(r => r[1] === true);
    if (owner.system.arts.techniques[this.system.technique.value].deficient) {
      deficientTech = true;
    }
    if (owner.system.arts.forms[this.system.form.value].deficient) {
      deficientForm = true;
    }
    if (techReq.length > 0) {
      techReq.forEach(key => {
        if (owner.system.arts.techniques[key[0]].deficient) {
          deficientTech = true;
        }
        tech = Math.min(tech, owner.system.arts.techniques[key[0]].finalScore);
      });

      tech = Math.min(owner.system.arts.techniques[this.system.technique.value].finalScore, tech);
    } else {
      tech = owner.system.arts.techniques[this.system.technique.value].finalScore;
    }
    if (formReq.length > 0) {
      formReq.forEach(key => {
        if (owner.system.arts.forms[key[0]].deficient) {
          deficientForm = true;
        }
        form = Math.min(tech, owner.system.arts.forms[key[0]].finalScore);
      });
      form = Math.min(owner.system.arts.forms[this.system.form.value].finalScore, form);
    } else {
      form = owner.system.arts.forms[this.system.form.value].finalScore;
    }
    if (this.system.applyFocus || options.focus) {
      res += tech + form + Math.min(tech, form);
    } else {
      res += tech + form;
    }
    if (this.system.mastery) {
      res += this.system.mastery;
    }
    if (deficientTech && deficientForm) {
      deficiencyDivider = 4;
    } else if (deficientTech || deficientForm) {
      deficiencyDivider = 2;
    }

    // log(false, `Casting total: ${res}`)
    return Math.round(res / deficiencyDivider);
  }
  async _preCreate(data, options, userId) {
    await super._preCreate(data, options, userId);
    // weird it did work in 284
    // if (data.img === undefined) {
    let toUpdate = false;
    if (CONFIG.Item.systemDataModels[data.type]?.getDefault) {
      CONFIG.Item.systemDataModels[data.type].getDefault(data);
      toUpdate = true;
    }

    if (data.img === undefined || data.img === "icons/svg/item-bag.svg") {
      if (data.type in CONFIG.ARM5E_DEFAULT_ICONS) {
        data.img = CONFIG.ARM5E_DEFAULT_ICONS[data.type];
        toUpdate = true;
      }
    }
    if (toUpdate) await this.updateSource(data);
  }

  isAnEffect() {
    return (
      this.type == "spell" ||
      this.type == "magicalEffect" ||
      this.type == "enchantment" ||
      this.type == "labText"
    );
  }

  // migrate this particular item
  async migrate() {
    try {
      ui.notifications.info(`Migrating item ${this.name}.`, {
        permanent: false
      });
      const updateData = migrateItemData(this);

      if (!isEmpty(updateData)) {
        console.log(`Migrating Item document ${this.name}`);
        await this.update(updateData, {
          diff: false
        });
      }
    } catch (err) {
      err.message = `Failed system migration for Item ${this.name}: ${err.message}`;
      console.error(err);
    }
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  // TODOV10 needed?
  async roll() {
    // Basic template rendering data
    const token = this.actor.token;
    const item = this;
    const actorData = this.actor ? this.actor.system : {};
    const itemData = item.system;

    let roll = new Roll("d20+@abilities.str.mod", actorData);
    let label = `Rolling ${item.name}`;
    roll.roll().toMessage({
      speaker: ChatMessage.getSpeaker({
        actor: this.actor
      }),
      flavor: label
    });
  }
}
