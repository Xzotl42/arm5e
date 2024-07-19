import { getDataset, getLabUpkeepCost, log } from "../tools.js";
import { ArM5ePCActor } from "../actor/actor.js";
import { migrateItemData } from "../migration.js";
import { IsMagicalEffect, computeLevel } from "../helpers/magic.js";
import { resetOwnerFields } from "./item-converter.js";
import { PersonalityTraitSchema } from "../schemas/minorItemsSchemas.js";
import { ARM5E } from "../config.js";
import { ARM5E_DEFAULT_ICONS } from "../constants/ui.js";
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
      log(false, `Owned Item : ${this.id} : ${this.name}, actor.data= ${this.actor.system}`);
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
        if (this.actor._isCharacter()) {
          this.system.canEquip = true;
        }
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
      } else if (this.type == "armor" && this.actor != null) {
        if (this.actor._isCharacter()) {
          this.system.canEquip = true;
        }
      }

      if (this.type == "diaryEntry") {
        if (!system.done) {
          for (let a of system.progress.abilities) {
            if (a.key == "") {
              let ability = this.actor.items.get(a.id);
              if (ability) {
                a.key = ability.system.key;
                a.option = ability.system.option;
              } else {
                log(false, `${this.actor.name} ability doesn't exist : ${a.name} for ${this.name}`);
              }
            }
          }
        }
      }
    }
    // compute reputation score
    if (this.type == "reputation") {
      this.system.score = ArM5ePCActor.getAbilityScoreFromXp(this.system.xp);
    }
    if (this.type == "personalityTrait") {
      this.system.score = PersonalityTraitSchema.getScore(this.system.xp);
    }
    if (this._needLevelComputation()) {
      if (this._isNotMigrated()) {
        return;
      }
      this.system.level = computeLevel(this.system, this.type);

      system.castingTotal = 0;
    }

    if (this.type == "labCovenant") {
      let pts = getLabUpkeepCost(system.upkeep);
      this.system.points = pts * CONFIG.ARM5E.lab.usage[system.usage].coeff;
    } else if (this.type == "magicItem") {
      this.system.maxLevel = 10 * this.system.materialBase * this.system.sizeMultiplier;
    }

    if (this.type == "inhabitant") {
      this.system.points = ARM5E.covenant.inhabitants[this.system.category].points;
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
    } else if (this.type == "wound") {
      this.system.title = `${this.name}`;
      if (this.system.recoveryTime == 0) {
        this.system.title += ` (${game.i18n.localize("arm5e.sheet.wound.fresh")})`;
        this.system.ui = { style: 'style="box-shadow: 3px 3px 3px rgb(135 38 22 / 100%);"' };
      }
    } else if (this.type == "inhabitant") {
      this.system.document = game.actors.get(this.system.actorId);
      if (this.system.document) {
        this.name = this.system.document.name;
        this.system.yearBorn = this.system.document.system.description.born.value;
        this.system.category = this.system.document._isMagus()
          ? "magi"
          : this.system.document._isCompanion()
          ? "companions"
          : this.system.category;
        this.system.linked = true;
      } else {
        this.system.linked = false;
      }
    } else if (this.type == "labCovenant") {
      this.system.document = game.actors.get(this.system.sanctumId);

      if (this.system.document) {
        this.name = this.system.document.name;
        this.system.owner = this.system.document.system.owner.value;
        this.system.quality = this.system.document.system.generalQuality.total;
        this.system.buildPoints = this.system.document.system.buildPoints;
        this.system.linked = true;
      } else {
        this.system.linked = false;
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

  _getTechniqueData(actorSystemData) {
    if (!IsMagicalEffect(this)) return ["", 0, false];

    let label = CONFIG.ARM5E.magic.techniques[this.system.technique.value].label;
    let tech = 1000;
    let techReq = Object.entries(this.system["technique-req"]).filter((r) => r[1] === true);
    let techDeficient = false;
    if (techReq.length > 0) {
      label += " (";
      techReq.forEach((key) => {
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
    if (!IsMagicalEffect(this)) return ["", 0, false];

    let label = CONFIG.ARM5E.magic.forms[this.system.form.value].label;
    let form = 1000;
    let formDeficient = false;
    let formReq = Object.entries(this.system["form-req"]).filter((r) => r[1] === true);
    if (formReq.length > 0) {
      label += " (";
      formReq.forEach((key) => {
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

  _computeCastingTotal(owner, options = {}) {
    if (owner.type != "player" && owner.type != "npc") {
      return 0;
    }
    let itemData = this.system;
    let res = owner.system.characteristics[options.char].value;
    let tech = 1000;
    let form = 1000;
    let deficiencyDivider = 1;
    let deficientTech = false;
    let deficientForm = false;
    let techReq = Object.entries(itemData["technique-req"]).filter((r) => r[1] === true);
    let formReq = Object.entries(itemData["form-req"]).filter((r) => r[1] === true);
    if (owner.system.arts.techniques[this.system.technique.value].deficient) {
      deficientTech = true;
    }
    if (owner.system.arts.forms[this.system.form.value].deficient) {
      deficientForm = true;
    }
    if (techReq.length > 0) {
      techReq.forEach((key) => {
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
      formReq.forEach((key) => {
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
    if (this.system.finalScore) {
      res += this.system.finalScore;
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
    if (CONFIG.ARM5E.ItemDataModels[this.type]?.getDefault) {
      data = CONFIG.ARM5E.ItemDataModels[this.type].getDefault(data);
      toUpdate = true;
    }

    if (this.needIconUpdate()) {
      data.img = CONFIG.ARM5E.ItemDataModels[this.type].getIcon(data);
      toUpdate = true;
    } else if (data.img === undefined || data.img === "icons/svg/item-bag.svg") {
      if (this.type in CONFIG.ARM5E_DEFAULT_ICONS) {
        data.img = CONFIG.ARM5E_DEFAULT_ICONS[this.type];
        toUpdate = true;
      }
    }
    if (toUpdate) this.updateSource(data);
    return true;
  }

  async _updateIcon(key, value) {
    if (this.needIconUpdate()) {
      await this.update({
        img: CONFIG.ARM5E.ItemDataModels[this.type].getIcon(this, value),
        [key]: value
      });
    }
  }

  needIconUpdate(value) {
    if (CONFIG.ARM5E.ItemDataModels[this.type]?.getIcon) {
      let currentDefIcon = CONFIG.ARM5E.ItemDataModels[this.type].getIcon(this);
      // if the current img is the default icon of the previous value, allow change
      if (
        this.img === currentDefIcon ||
        this.img === ARM5E_DEFAULT_ICONS.MONO[this.type] ||
        this.img === ARM5E_DEFAULT_ICONS.COLOR[this.type] ||
        this.img === "icons/svg/mystery-man.svg" ||
        this.img === "icons/svg/item-bag.svg"
      ) {
        return true;
      }
    }
    return false;
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

      if (!foundry.utils.isEmpty(updateData)) {
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

  async _studyLabText(item, event) {
    event.preventDefault();
    const dataset = getDataset(event);
    if (item.type !== "laboratoryText" && item.type !== "book") {
      return;
    }
    if (item.type === "laboratoryText" && item.system.type !== "spell") {
      return;
    }

    if (!item.actor) {
      return;
    }
    if (item.actor.type === "laboratory" && !item.actor.system.owner.linked) {
      ui.notifications.info(game.i18n.localize("arm5e.notification.noOwner"));
      return;
    } else if (["player", "npc"].includes(item.actor.type)) {
      if (
        item.actor.system?.charType?.value !== "magusNPC" &&
        item.actor.system?.charType?.value !== "magus"
      ) {
        ui.notifications.info(game.i18n.localize("arm5e.notification.notMagus"));
        return;
      }

      if (!item.actor.system.sanctum.linked) {
        ui.notifications.info(game.i18n.localize("arm5e.notification.noLab"));
        return;
      }
    }
    let spellEffectData;
    if (item.type === "book") {
      let topic = item.system.topics[dataset.index];
      // empty topic
      if (topic.category !== "labText" || topic.labtext === null) {
        return;
      }
      spellEffectData = {
        name: topic.labtextTitle,
        type: "spell",
        system: topic.labtext.toObject()
      };
    } else {
      spellEffectData = {
        name: item.name,
        type: "spell",
        system: item.system.toObject()
      };
    }

    let lab;
    if (item.actor.type === "laboratory") {
      lab = item.actor;
    } else {
      lab = item.actor.system.sanctum.document;
    }
    let planning = lab.getFlag(CONFIG.ARM5E.SYSTEM_ID, "planning") || {};
    let newSpell = new ArM5eItem(spellEffectData, { temporary: true });
    planning.type = "learnSpell";
    let data = newSpell.toObject();
    planning.data = resetOwnerFields(data);

    await lab.setFlag(CONFIG.ARM5E.SYSTEM_ID, "planning", planning);
    this.sheet.close();
    lab.sheet.render(true);
    lab.sheet._tabs[0].activate("planning");
  }

  get canBeEnchanted() {
    return Object.keys(ARM5E.lab.enchantment.enchantableTypes).includes(this.type);
  }

  async useItemCharge() {
    if (this.canBeEnchanted) {
      const chargesLeft = this.system.enchantments.charges;
      if (this.system.enchantments.charged && chargesLeft) {
        await this.update({ "system.enchantments.charges": chargesLeft - 1 });
      }
    }
  }

  /**
   * Prepare a data object which defines the data schema used by dice roll commands against this Item
   * @returns {object}
   */
  getRollData() {
    const rollData = super.getRollData();
    if (this.owned) {
      rollData.owner = this.actor.getRollData();
    }
    return rollData;
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
