import { ArM5eMagicSystem } from "../actor/subsheets/magic-system.js";
import { log } from "../tools.js";
import {
  baseDescription,
  boolOption,
  itemBase,
  ModifierField,
  SpellAttributes,
  XpField
} from "./commonSchemas.js";
import { baseLevel, SpellSchema } from "./magicSchemas.js";

const fields = foundry.data.fields;

export class SupernaturalEffectSchema extends SpellSchema {
  // TODO remove in V11
  static _enableV10Validation = true;

  static defineSchema() {
    return {
      ...itemBase(),
      verb: new fields.SchemaField({
        active: boolOption(false),
        key: new fields.StringField({
          required: false,
          blank: true
        }),
        option: new fields.StringField({
          required: false,
          blank: true
        }),
        specApply: boolOption(false)
      }),
      noun: new fields.SchemaField({
        active: boolOption(false),
        key: new fields.StringField({
          required: false,
          blank: true
        }),
        option: new fields.StringField({
          required: false,
          blank: true
        }),
        specApply: boolOption(false)
      }),
      bonusAbility: new fields.SchemaField({
        active: boolOption(false),
        key: new fields.StringField({
          required: false,
          blank: true
        }),
        option: new fields.StringField({
          required: false,
          blank: true
        }),
        specApply: boolOption(false)
      }),
      modifier: new fields.SchemaField({
        value: ModifierField(),
        label: new fields.StringField({
          required: false,
          blank: true
        })
      }),
      template: new fields.StringField({
        required: true,
        blank: true,
        initial: ""
      }),
      ...SpellAttributes(),
      level: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        min: 0,
        initial: 1,
        step: 1
      }),
      characteristic: new fields.StringField({
        required: false,
        blank: true
      }),
      baseLevel: baseLevel(),
      baseEffectDescription: baseDescription(),
      applyFocus: boolOption(false, true),
      ritual: boolOption(),
      bonus: ModifierField(),
      bonusDesc: baseDescription(),
      xp: XpField(),
      masteryAbilities: baseDescription(),
      general: boolOption(),
      levelOffset: ModifierField(),
      valid: boolOption(true)
    };
  }

  /**
   * @description update Item fields with data from the owner
   * @returns
   */
  prepareOwnerData() {
    this.valid = true;
    this.invalidMsg = "";
    if (!this.parent.isOwned) {
      this.valid = false;
      this.invalidMsg += "Not owned by a character &#10";

      return;
    }
    const owner = this.parent.actor;
    const template = owner.system.magicSystem.templates[this.template];

    if (!template) {
      this.invalidMsg += "Template not found &#10";
      this.orphan = true;
      this.valid = false;
      this.castingTotal = { value: 0, hint: "" };
      return;
    }
    if (template?.char.length) {
      this.characteristic = template.char[0].characteristic;
    }
    this.realm = owner.system.magicSystem.realm;

    if (template.verbs.length) {
      this.verb.active = true;
      let found = false;

      for (let item of template.verbs) {
        let ability;
        if (item.option === "any") {
          if (item.type === "ability") {
            ability = owner.getAbility(this.verb.key, this.verb.option);
          } else {
            ability = ArM5eMagicSystem.getAltTechnique(owner, this.verb.option);
          }
        } else {
          if (item.type === "ability") {
            ability = owner.getAbility(item.key, item.option);
          } else {
            ability = ArM5eMagicSystem.getAltTechnique(owner, item.option);
            this.verb.specApply = false;
          }
        }
        if (
          ability &&
          this.verb.key === ability.system.key &&
          this.verb.option === ability.system.option
        ) {
          found = true;
          this.verb.id = ability._id;
          this.verb.label = ability.name;
          this.verb.specialty = ability.system.speciality;
          this.verb.score = ability.system.finalScore;
          break;
        }
      }
      if (!found) {
        this.invalidMsg += "Verb attribute not found &#10";
        this.verb.label = `Unknown (${this.verb.key} ${this.verb.option})`;
        this.verb.score = 0;
      }
    }
    this.realm = template.realm;
    if (template.nouns.length) {
      this.noun.active = true;
      let found = false;
      for (let item of template.nouns) {
        let ability;
        if (item.option === "any") {
          if (item.type === "ability") {
            ability = owner.getAbility(this.noun.key, this.noun.option);
          } else {
            ability = ArM5eMagicSystem.getAltForm(owner, this.noun.option);
          }
        } else {
          if (item.type === "ability") {
            ability = owner.getAbility(item.key, item.option);
          } else {
            ability = ArM5eMagicSystem.getAltForm(owner, item.option);
            this.noun.specApply = false;
          }
        }
        if (
          ability &&
          this.noun.key === ability.system.key &&
          this.noun.option === ability.system.option
        ) {
          found = true;
          this.noun.id = ability._id;
          this.noun.label = ability.name;
          this.noun.specialty = ability.system.speciality;
          this.noun.score = ability.system.finalScore;
          break;
        }
      }
      if (!found) {
        this.valid = false;
        this.invalidMsg += "Noun attribute not found &#10";
        this.noun.label = `Unknown (${this.noun.key} ${this.noun.option})`;
        this.noun.score = 0;
      }
    }
    this.other = { total: 0 };

    if (template.others.length) {
      this.other.active = true;
      let found = false;
      for (let item of template.others) {
        if (item.type === "mod") {
          this.modifier.active = true;
          this.modifier.label = item.label;
          this.modifier.value = item.value;
          this.other.total += item.value;
        } else if (item.type === "ability") {
        }
      }
    }
    if (template.bonusAbility.active) {
      let found = false;
      this.bonusAbility.active = true;
      let ability = owner.getAbility(template.bonusAbility.key, template.bonusAbility.option);
      if (ability) {
        // TODO specApply
        found = true;

        this.bonusAbility.name = ability.name;
        this.bonusAbility.id = ability._id;
        this.bonusAbility.label = `${ability.name} (${ability.system.finalScore})`;
        this.bonusAbility.specialty = ability.system.speciality;
        this.bonusAbility.score = ability.system.finalScore;
        this.other.total += ability.system.finalScore;
      }
      if (!found) {
        this.valid = false;
        this.invalidMsg = "Bonus ability attribute not found";
        this.bonusAbility.label = `Unknown (${this.bonusAbility.key} ${this.bonusAbility.option})`;
        this.bonusAbility.score = 0;
      }
    }

    this.castingTotal = this.valid ? this.computeCastingTotal() : { value: 0, hint: "" };
  }

  computeCastingTotal() {
    const owner = this.parent.actor;
    const template = owner.system.magicSystem.templates[this.template];
    const res = { value: 0, hint: "" };

    let charValue = 0;
    if (template.char.length) {
      const char = template.char[0].characteristic;
      charValue += owner.system.characteristics[char].value;
      res.hint += `${game.i18n.localize("arm5e.sheet." + char)} (${charValue}) &#10`;
    }
    if (this.verb.score != undefined) {
      this.verb.finalScore = this.verb.specApply ? this.verb.score + 1 : this.verb.score;
      res.hint += `${this.verb.label} (${this.verb.finalScore})&#10`;
    }

    if (this.noun.score != undefined) {
      this.noun.finalScore = this.noun.specApply ? this.noun.score + 1 : this.noun.score;
      res.hint += `${this.noun.label} (${this.noun.finalScore})&#10`;
    }

    if (this.other.total) {
      res.hint += `${this.other.label} (${this.other.total})`;
    }
    res.value =
      charValue +
      (this.verb.active ? this.verb.finalScore : 0) +
      (this.noun.active ? this.noun.finalScore : 0) +
      this.other.total;
    return res;
  }

  static getIcon(item, newValue = null) {
    if (newValue != null) {
      return `systems/arm5e/assets/magic/${newValue}.png`;
    } else {
      let init = "an";
      if (item.system?.form?.value !== undefined) {
        init = item.system.form.value;
      }
      return `systems/arm5e/assets/magic/${init}.png`;
    }
  }

  static migrateData(data) {
    return data;
  }

  static migrate(itemData) {
    const updateData = {};
    return updateData;
  }
}
