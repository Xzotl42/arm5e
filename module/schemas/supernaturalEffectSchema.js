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
      if (this.verb.active) {
        if (CONFIG.ARM5E.LOCALIZED_ABILITIES[this.verb.key].option) {
          this.verb.label = game.i18n.format(
            CONFIG.ARM5E.LOCALIZED_ABILITIES[this.verb.key].mnemonic,
            { option: this.verb.option }
          );
        } else {
          this.verb.label = CONFIG.ARM5E.LOCALIZED_ABILITIES[this.verb.key].label;
        }
      }
      if (this.noun.active) {
        if (CONFIG.ARM5E.LOCALIZED_ABILITIES[this.noun.key].option) {
          this.noun.label = game.i18n.format(
            CONFIG.ARM5E.LOCALIZED_ABILITIES[this.noun.key].mnemonic,
            { option: this.noun.option }
          );
        } else {
          this.noun.label = CONFIG.ARM5E.LOCALIZED_ABILITIES[this.noun.key].label;
        }
      }

      if (this.bonusAbility.active) {
        if (CONFIG.ARM5E.LOCALIZED_ABILITIES[this.bonusAbility.key].option) {
          this.bonusAbility.label = game.i18n.format(
            CONFIG.ARM5E.LOCALIZED_ABILITIES[this.bonusAbility.key].mnemonic,
            { option: this.bonusAbility.option }
          );
        } else {
          this.bonusAbility.label = CONFIG.ARM5E.LOCALIZED_ABILITIES[this.bonusAbility.key].label;
        }
      }
      return;
    }
    if (template?.char.length) {
      this.characteristic = template.char[0].characteristic;
    }
    this.realm = owner.system.magicSystem.realm;
    this.verb.active = false;
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
          this.verb.valid = true;
          break;
        } else if (this.verb.key === undefined) {
          // there was no verb previously in the template
          this.verb.key = item.key;
          this.verb.option = item.option;
          this.verb.label = item.label;
        }
      }
      if (!found) {
        this.invalidMsg += "Verb attribute not found<br/>";
        this.verb.label = game.i18n.format(
          CONFIG.ARM5E.LOCALIZED_ABILITIES[this.verb.key].mnemonic,
          {
            option: this.verb.option
          }
        );
        this.verb.score = 0;
        this.verb.valid = false;
        this.valid = false;
      }
    }
    this.realm = template.realm;
    this.noun.active = false;
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
          this.noun.valid = true;
          break;
        } else if (this.noun.key === undefined) {
          // there was no noun previously in the template
          this.noun.key = item.key;
          this.noun.option = item.option;
          this.noun.label = item.label;
          this.noun.valid = false;
        }
      }
      if (!found) {
        this.valid = false;
        this.invalidMsg += "Noun attribute not found<br/>";
        this.noun.label = game.i18n.format(
          CONFIG.ARM5E.LOCALIZED_ABILITIES[this.noun.key].mnemonic,
          {
            option: this.noun.option
          }
        );
        this.noun.score = 0;
        this.valid = false;
      }
    }
    this.other = { total: 0 };

    this.other.active = false;
    if (template.others.length) {
      this.other.active = true;
      let found = false;
      for (let item of template.others) {
        if (item.type === "mod") {
          this.modifier.active = true;
          this.modifier.label = item.label;
          this.modifier.value = item.value;
          this.other.total += item.value;
        }
      }
    }
    this.bonusAbility.active = false;
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
        this.bonusAbility.valid = true;
      } else if (this.bonusAbility.key == undefined) {
        this.bonusAbility.key = template.bonusAbility.key;
        this.bonusAbility.option = template.bonusAbility.option;
        this.bonusAbility.label = template.bonusAbility.label;
        this.bonusAbility.valid = true;
      }
      if (!found) {
        this.valid = false;
        this.invalidMsg = "Bonus ability attribute not found<br/>";
        this.bonusAbility.label = game.i18n.format(
          CONFIG.ARM5E.LOCALIZED_ABILITIES[this.bonusAbility.key].mnemonic,
          {
            option: this.bonusAbility.option
          }
        );
        this.bonusAbility.score = 0;
        this.bonusAbility.valid = false;
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
