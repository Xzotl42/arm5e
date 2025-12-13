import { getDataset } from "../tools.js";
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
      context.system.valid = false;
      context.system.invalidMsg = "Not owned by a character";
      if (context.system.verb.option) {
        context.system.verb.label = `Unknown (${context.system.verb.option})`;
      }
      if (context.system.noun.option) {
        context.system.noun.label = `Unknown (${context.system.noun.option})`;
      }

      return context;
    }
    // if (!this.item.system.valid) {
    //   context.selection.templates = Object.entries(
    //     this.item.actor.system.magicSystem.templates
    //   ).map(([k, v]) => {
    //     return { id: k, name: v.name };
    //   });
    //   context.selection.templates.unshift({ id: "NONE", name: "Pick one" });
    //   return context;
    // }

    const owner = this.item.actor;
    const template = owner.system.magicSystem.templates[this.item.system.template];

    context.modifier = 0;
    context.multiplier = 1;
    const verbs = owner.system.magicSystem.verbs;
    context.selection.verbs = [];
    context.selection.nouns = [];
    if (template === undefined) {
      this.item.system.valid = false;
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
      // if (this.item.system.bonusAbility.active) {
      //   context.selection.verbs = [
      //     {
      //       id: "",
      //       label: this.item.system.verb.label,
      //       key: this.item.system.verb.key,
      //       option: this.item.system.verb.option
      //     }
      //   ];
      // }
      return context;
    }
    context.rollmode = template.rollType;
    for (let c of template.components) {
      switch (c.type) {
        case "verb":
          if (c.option === "any") {
            owner.system.magicSystem.verbs.reduce((res, e) => {
              res.push({
                id: e._id,
                label: `${e.name} (${e.system.finalScore})`,
                score: e.system.finalScore,
                key: e.system.key,
                option: e.system.option
              });
              return res;
            }, context.selection.verbs);
          } else {
            const verb = owner.system.magicSystem.verbs.find((e) => {
              return e.system.option === c.option;
            });
            context.selection.verbs.push({
              id: verb._id,
              label: `${verb.name} (${verb.system.finalScore})`,
              key: verb.system.key,
              option: verb.system.option,
              score: verb.system.finalScore
            });
          }
          if (!this.item.system.verb.valid) {
            context.selection.verbs.unshift({
              id: "",
              label: this.item.system.verb.label,
              key: this.item.system.verb.key,
              option: this.item.system.verb.option
              // score: noun.system.finalScore
            });
          }
          break;
        case "noun":
          if (c.option === "any") {
            owner.system.magicSystem.nouns.reduce((res, e) => {
              res.push({
                id: e._id,
                label: `${e.name} (${e.system.finalScore})`,
                score: e.system.finalScore,
                key: e.system.key,
                option: e.system.option
              });
              return res;
            }, context.selection.nouns);
          } else {
            const noun = owner.system.magicSystem.nouns.find((e) => {
              return e.system.option === c.option;
            });
            context.selection.nouns.push({
              id: noun._id,
              label: `${noun.name} (${noun.system.finalScore})`,
              key: noun.system.key,
              option: noun.system.option,
              score: noun.system.finalScore
            });
          }
          if (!this.item.system.noun.valid) {
            context.selection.nouns.unshift({
              id: "",
              label: this.item.system.noun.label,
              key: this.item.system.noun.key,
              option: this.item.system.noun.option
              // score: noun.system.finalScore
            });
          }
          break;
        case "ability":
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
                // score: noun.system.finalScore
              });
            }
          } // Noun
          else if (c.art === "noun") {
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
                // score: noun.system.finalScore
              });
            }
          } else {
            if (ability) {
              context.ui.bonusAb = true;
              context.system.bonusAbility.label = `${ability.name} (${ability.system.finalScore})`;
              context.system.bonusAbility.score = ability.system.finalScore;
              context.system.bonusAbility.specialty = ability.system.speciality;
            }
            // else if (!this.item.system.bonusAbility.valid) {
            //   context.selection.bonusAbility.unshift({
            //     id: "",
            //     label: this.item.system.bonusAbility.label,
            //     key: this.item.system.bonusAbility.key,
            //     option: this.item.system.bonusAbility.option
            //     // score: noun.system.finalScore
            //   });
            // }
          }

          break;
        case "mod":
          context.modifier = c.value;
          break;
        case "mult":
          context.multiplier = c.value;
      }
    }
    if (!this.item.system.valid) {
      context.system.invalidMsg =
        "Pick valid values or change the template definition.<br/>" + context.system.invalidMsg;
    }
    // if (context.system.characteristic) {
    //   context.ui.char = true;
    // }
    // if (Object.keys(context.selection.verbs).length > 0) {
    //   context.ui.verb = true;
    // }
    // if (Object.keys(context.selection.nouns).length > 0) {
    //   context.ui.noun = true;
    // }

    return context;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    if (!this.options.editable) return;

    html.find(".verb-change").change(this.onVerbChange.bind(this));
    html.find(".noun-change").change(this.onNounChange.bind(this));
  }

  async onVerbChange(event) {
    const dataset = getDataset(event);
    const owner = this.item.actor;
    const id = event.target.value;

    let ability = owner.items.get(id);

    const updateData = {};
    updateData["system.verb.key"] = ability.system.key;
    updateData["system.verb.option"] = ability.system.option;
    updateData["system.verb.specApply"] = false;

    await this.submit({
      preventClose: true,
      updateData: updateData
    });
    this.render();
  }

  // TODO
  async onNounChange(event) {
    const dataset = getDataset(event);
    const owner = this.item.actor;

    const id = event.target.value;

    let ability = owner.items.get(id);

    const updateData = {};
    updateData["system.noun.key"] = ability.system.key;
    updateData["system.noun.option"] = ability.system.option;
    updateData["system.noun.specApply"] = false;

    await this.submit({
      preventClose: true,
      updateData: updateData
    });
    this.render();
  }
}
