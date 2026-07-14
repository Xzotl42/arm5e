import { ARM5E } from "../../config.js";

import { ArM5eItemSheetV2 } from "./item-sheet-v2.js";
import { ArM5eActorSheetV2 } from "../actor/actor-sheet-v2.js";

/**
 * AppV2 sheet for supernaturalEffect items.
 * Extends the base directly (no technique/form/RDT).
 * Tabs: description, effects.
 */
export class ArM5eSupernaturalEffectItemSheetV2 extends ArM5eItemSheetV2 {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["arm5e", "sheet", "item"],
    position: { width: 600, height: 650 },
    actions: {
      rollEffect: ArM5eSupernaturalEffectItemSheetV2.rollEffect,
      itemDeleteConfirm: ArM5eItemSheetV2.itemDeleteConfirm
    }
  };

  /** @override */
  static TABS = {
    primary: {
      tabs: [
        { id: "description", label: "arm5e.sheet.description", cssClass: "item flexrow" },
        { id: "effects", label: "arm5e.sheet.effects", cssClass: "item flexrow" }
      ],
      initial: "description"
    }
  };

  /** @override */
  static PARTS = {
    header: {
      template: "systems/arm5e/templates/item/parts/item-supernaturalEffect-header-v2.hbs"
    },
    tabs: {
      template: "systems/arm5e/templates/generic/parts/ars-tab-navigation.hbs",
      classes: ["marginItemPart"]
    },
    description: {
      template: "systems/arm5e/templates/item/parts/item-description-v2.hbs"
    },
    effects: {
      template: "systems/arm5e/templates/item/parts/item-effects-v2.hbs"
    },
    footer: {
      template: "systems/arm5e/templates/item/parts/item-footer-v2.hbs"
    }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.tabs = this._prepareTabs("primary");

    // Readonly lock
    const readonly = context.flags?.[CONFIG.ARM5E.SYSTEM_ID]?.readonly === "true";
    context.noEdit = readonly ? "readonly" : "";
    context.noSelect = readonly ? "disabled" : "";
    context.locked = readonly;

    context.selection.verbs = [];
    context.selection.nouns = [];

    if (!this.item.isOwned) {
      context.system.valid = false;
      context.system.invalidMsg = "Not owned by a character";
      return context;
    }

    const owner = this.item.actor;
    const template = owner.system.magicSystem?.templates?.[this.item.system.template];

    if (!template) {
      context.system.valid = false;
      if (this.item.system.verb.active) {
        context.selection.verbs = [
          {
            id: "",
            label: this.item.system.verb.label,
            key: this.item.system.verb.key,
            option: this.item.system.verb.option
          }
        ];
      }
      if (this.item.system.noun.active) {
        context.selection.nouns = [
          {
            id: "",
            label: this.item.system.noun.label,
            key: this.item.system.noun.key,
            option: this.item.system.noun.option
          }
        ];
      }
      return context;
    }

    context.rollmode = template.rollType;

    for (const c of template.components) {
      switch (c.type) {
        case "verb":
          if (c.option === "any") {
            owner.system.magicSystem.verbs.forEach((e) => {
              context.selection.verbs.push({
                id: e._id,
                label: `${e.name} (${e.system.finalScore})`,
                score: e.system.finalScore,
                key: e.system.key,
                option: e.system.option
              });
            });
          } else {
            const verb = owner.system.magicSystem.verbs.find((e) => e.system.option === c.option);
            if (verb) {
              context.selection.verbs.push({
                id: verb._id,
                label: `${verb.name} (${verb.system.finalScore})`,
                key: verb.system.key,
                option: verb.system.option,
                score: verb.system.finalScore
              });
            }
          }
          if (!this.item.system.verb.valid) {
            context.selection.verbs.unshift({
              id: "",
              label: this.item.system.verb.label,
              key: this.item.system.verb.key,
              option: this.item.system.verb.option
            });
          }
          break;

        case "noun":
          if (c.option === "any") {
            owner.system.magicSystem.nouns.forEach((e) => {
              context.selection.nouns.push({
                id: e._id,
                label: `${e.name} (${e.system.finalScore})`,
                score: e.system.finalScore,
                key: e.system.key,
                option: e.system.option
              });
            });
          } else {
            const noun = owner.system.magicSystem.nouns.find((e) => e.system.option === c.option);
            if (noun) {
              context.selection.nouns.push({
                id: noun._id,
                label: `${noun.name} (${noun.system.finalScore})`,
                key: noun.system.key,
                option: noun.system.option,
                score: noun.system.finalScore
              });
            }
          }
          if (!this.item.system.noun.valid) {
            context.selection.nouns.unshift({
              id: "",
              label: this.item.system.noun.label,
              key: this.item.system.noun.key,
              option: this.item.system.noun.option
            });
          }
          break;

        case "ability": {
          const ability = owner.getAbility(c.key, c.option);
          if (c.art === "verb") {
            if (ability) {
              context.selection.verbs.push({
                id: ability._id,
                label: `${ability.name} (${ability.system.finalScore})`,
                score: ability.system.finalScore,
                specialty: ability.system.specialty,
                key: c.key
              });
            }
            if (!this.item.system.verb.valid) {
              context.selection.verbs.unshift({
                id: "",
                label: this.item.system.verb.label,
                key: this.item.system.verb.key,
                option: this.item.system.verb.option
              });
            }
          } else if (c.art === "noun") {
            if (ability) {
              context.selection.nouns.push({
                id: ability._id,
                label: `${ability.name} (${ability.system.finalScore})`,
                score: ability.system.finalScore,
                specialty: ability.system.specialty,
                key: c.key
              });
            }
            if (!this.item.system.noun.valid) {
              context.selection.nouns.unshift({
                id: "",
                label: this.item.system.noun.label,
                key: this.item.system.noun.key,
                option: this.item.system.noun.option
              });
            }
          } else if (ability) {
            context.system.bonusAbility.label = `${ability.name} (${ability.system.finalScore})`;
            context.system.bonusAbility.score = ability.system.finalScore;
            context.system.bonusAbility.specialty = ability.system.speciality;
          }
          break;
        }

        case "mod":
          context.modifier = c.value;
          break;
        case "mult":
          context.multiplier = c.value;
          break;
      }
    }

    if (!this.item.system.valid) {
      context.system.invalidMsg = `Pick valid values or change the template definition.<br/>${context.system.invalidMsg}`;
    }

    return context;
  }

  /** @override */
  async _preparePartContext(partId, context, options) {
    if (["description", "effects"].includes(partId)) {
      context.tab = context.tabs?.[partId];
    }
    return super._preparePartContext(partId, context, options);
  }

  /** @override */
  async _onRender(context, options) {
    await super._onRender(context, options);

    this.element.querySelectorAll(".verb-change").forEach((el) => {
      el.addEventListener("change", (event) => this.verbChange(event, el));
    });

    this.element.querySelectorAll(".noun-change").forEach((el) => {
      el.addEventListener("change", (event) => this.nounChange(event, el));
    });
  }

  /**
   * Roll the supernatural effect.
   */
  static async rollEffect(event, target) {
    event.preventDefault();
    if (!this.item.isOwned || !this.item.system.valid) return;
    await this.item.actor.sheet.roll({ roll: "supernatural", id: this.item.id });
  }

  /**
   * Verb selection changed — update system.verb.{key, option, specApply}.
   */
  async verbChange(event, target) {
    event.preventDefault();
    const owner = this.item.actor;
    if (!owner) return;
    const ability = owner.items.get(target.value);
    if (!ability) return;
    await this.item.update({
      "system.verb.key": ability.system.key,
      "system.verb.option": ability.system.option,
      "system.verb.specApply": false
    });
  }

  /**
   * Noun selection changed — update system.noun.{key, option, specApply}.
   */
  async nounChange(event, target) {
    event.preventDefault();
    const owner = this.item.actor;
    if (!owner) return;
    const ability = owner.items.get(target.value);
    if (!ability) return;
    await this.item.update({
      "system.noun.key": ability.system.key,
      "system.noun.option": ability.system.option,
      "system.noun.specApply": false
    });
  }
}
