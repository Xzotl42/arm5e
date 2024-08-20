import { updateCharacteristicDependingOnRoll } from "../helpers/rollWindow.js";
import { ArM5eItemMagicSheet } from "./item-magic-sheet.js";

/**
 * Extend the basic ArM5eItemSheet with some very simple modifications
 * @extends {ArM5eItemMagicSheet}
 */
export class ArM5eSupernaturalEffectSheet extends ArM5eItemMagicSheet {
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.tabs[0].initial = "description";
    return options;
  }

  /** @override */
  async getData() {
    let context = await super.getData();
    if (!this.item.isOwned) {
      return context;
    }
    const owner = this.item.actor;
    const template = owner.system.magicSystem.templates[this.item.system.template];
    context.modifier = 0;
    context.multiplier = 1;
    const verbs = owner.system.magicSystem.verbs;
    context.selection.verbs = {};
    context.selection.nouns = {};
    for (let c of template.components) {
      switch (c.type) {
        case "verb":
          if (c.option === "any") {
            owner.system.magicSystem.verbs.reduce((res, e) => {
              res[e.system.option] = {
                label: `${e.name} (${e.system.finalScore})`,
                score: e.system.finalScore
              };
              return res;
            }, context.selection.verbs);
          } else {
            const verb = owner.system.magicSystem.verbs.find((e) => {
              return e.system.option === c.option;
            });
            context.selection.verbs[c.option] = {
              label: `${verb.name} (${verb.system.finalScore})`,
              score: verb.system.finalScore
            };
          }
          break;
        case "noun":
          if (c.option === "any") {
            owner.system.magicSystem.nouns.reduce((res, e) => {
              res[e.system.option] = {
                label: `${e.name} (${e.system.finalScore})`,
                score: e.system.finalScore
              };
              return res;
            }, context.selection.nouns);
          } else {
            const noun = owner.system.magicSystem.nouns.find((e) => {
              return e.system.option === c.option;
            });
            context.selection.nouns[c.option] = {
              label: `${noun.name} (${noun.system.finalScore})`,
              score: noun.system.finalScore
            };
          }
          break;
        case "ability":
          const ability = owner.getAbility(c.key, c.option);
          if (c.art === "verb") {
            context.selection.verbs[c.option] = {
              label: `${ability.name} (${ability.system.finalScore})`,
              score: ability.system.finalScore,
              specialty: ability.system.specialty,
              key: c.key
            };
          } // Noun
          else if (c.art === "noun") {
            context.selection.nouns[c.option] = {
              label: `${ability.name} (${ability.system.finalScore})`,
              score: ability.system.finalScore,
              specialty: ability.system.specialty,
              key: c.key
            };
          } else {
            context.bonusAbility = { label: ability.name, value: c.value };
          }
          break;
        case "mod":
          context.modifier = c.value;
        case "mult":
          context.multiplier = c.value;
      }
    }

    if (context.selection.verbs.length === 0) {
      context.ui.noVerb = true;
    }
    if (context.selection.nouns.length === 0) {
      context.ui.noun = true;
    }

    return context;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    if (!this.options.editable) return;
  }

  computeCastingTotal(actor) {
    if (!this.item.isOwned) {
      return 0;
    }
  }
}
