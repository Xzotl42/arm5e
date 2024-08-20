import { getDataset, slugify } from "../../tools.js";

export class ArM5eMagicSystem {
  constructor(actor) {
    this.actor = actor;
  }
  async getData(context) {
    const templates = context.system.magicSystem.templates;

    context.isMagus = this.actor._isMagus();

    for (let [name, template] of Object.entries(templates)) {
      template.selection = {};
      template.selection.targetType = { simple: "Simple", complex: "Complex" };

      let idx = 0;
      template.buttons = { mult: "disabled" };
      template.char = [];
      template.verb = [];
      template.noun = [];
      let hasModifier = false;
      for (let item of template.components) {
        item.compIdx = idx;
        switch (item.type) {
          case "char":
            item.partial = "systems/arm5e/templates/actor/parts/template-item-char.hbs";
            item.selection = Object.fromEntries(
              Object.entries(this.actor.system.characteristics).map(([k, v]) => {
                return [
                  k,
                  `${game.i18n.localize(CONFIG.ARM5E.character.characteristics[k].label)} (${
                    v.value
                  })`
                ];
              })
            );

            item.compIdx = idx;
            template.char.push(item);
            break;
          case "ability":
            item.partial = "systems/arm5e/templates/actor/parts/template-item-ability.hbs";
            if (item.art == "verb") {
              template.verb.push(item);
            } // noun
            else if (item.art == "noun") {
              template.noun.push(item);
            } else {
              template.other.push(item);
            }
            item.ability = this.actor.getAbility(item.key, item.option) ?? {};

            item.selection = this.actor.system.abilities;
            break;
          case "verb":
            item.selection = { any: "Any" };
            this.actor.system.magicSystem.verbs.reduce((res, e) => {
              res[e.system.option] = `${e.name} (${e.system.finalScore})`;
              return res;
            }, item.selection);
            item.partial = "systems/arm5e/templates/actor/parts/template-item-tech.hbs";
            template.verb.push(item);
            break;
          case "noun":
            item.selection = { any: "Any" };
            this.actor.system.magicSystem.nouns.reduce((res, e) => {
              res[e.system.option] = `${e.name} (${e.system.finalScore})`;
              return res;
            }, item.selection);
            item.partial = "systems/arm5e/templates/actor/parts/template-item-form.hbs";
            template.noun.push(item);
            break;
          case "mod":
            hasModifier = true;
            item.partial = "systems/arm5e/templates/actor/parts/template-item-mod.hbs";
            break;
          case "mult":
            item.partial = "systems/arm5e/templates/actor/parts/template-item-mult.hbs";
            break;
        }
        if (template.char.length) {
          template.buttons.char = "disabled";
        }
        // if (template.verb.length) {
        //   template.buttons.verb = "disabled";
        // }
        // if (template.noun.length) {
        //   template.buttons.noun = "disabled";
        // }
        if (hasModifier) {
          template.buttons.mod = "disabled";
        }

        idx++;
      }

      template.isValid = this.isTemplateValid(context);
    }
    return context;
  }

  isTemplateValid(context) {
    return true;
  }

  activateListeners(html) {
    html.find(".template-control").click(this.onManageTemplate.bind(this));
    html.find(".template-item").click(this.onManageTemplateComponents.bind(this));
    html.find(".item-ability-key").change(this.onAbilityChange.bind(this));
  }

  async onAbilityChange(event) {
    const dataset = getDataset(event);
    const id = event.target.value;

    const ability = this.actor.items.get(id);

    const components = this.actor.system.magicSystem.templates[dataset.id].components;

    components[dataset.index].key = ability.system.key;
    components[dataset.index].option = ability.system.option;
    components[dataset.index].score = ability.system.finalScore;

    await this.actor.update({
      [`system.magicSystem.templates.${dataset.id}.components`]: components
    });
  }

  async onManageTemplate(event) {
    const dataset = getDataset(event);
    const magicSystem = this.actor.system.magicSystem;
    switch (dataset.action) {
      case "create":
        const template = { name: "Template name", components: [{ type: "char" }] };
        if (magicSystem.templates == undefined) {
          magicSystem.templates = {};
        }

        await this.actor.update({
          [`system.magicSystem.templates.${foundry.utils.randomID()}`]: template
        });
        break;
      case "delete":
        await this.actor.update({
          [`system.magicSystem.templates.-=${dataset.id}`]: null
        });
        break;
    }
  }

  async onManageTemplateComponents(event) {
    const dataset = getDataset(event);
    let templates = this.actor.system.magicSystem.templates;
    let components = templates[dataset.id].components;
    switch (dataset.action) {
      case "create":
        switch (dataset.type) {
          case "char":
            components.push({ type: "char" });
            break;
          case "ability":
            components.push({ type: "ability", art: dataset.art });
            break;
          case "verb":
            if (context.system.magicSystem.verbs.length === 0) {
              ui.notifications.info("Define a verb first");
              return;
            }
            components.push({ type: "verb" });
            break;
          case "noun":
            components.push({ type: "noun" });
            break;
          case "mod":
            components.push({ type: "mod" });
            break;
          case "mult":
            components.push({ type: "mult" });
            break;
          default:
            break;
        }
        await this.actor.update({
          [`system.magicSystem.templates.${dataset.id}.components`]: components
        });
        break;
      case "delete":
        let clone = foundry.utils.deepClone(components);
        clone.splice(dataset.index, 1);
        components = clone;
        await this.actor.update({
          [`system.magicSystem.templates.${dataset.id}.components`]: components
        });
        break;
    }
  }

  async _updateObject(event, formData) {
    const expanded = foundry.utils.expandObject(formData);
    const source = this.actor.toObject();

    const templates = expanded.system.magicSystem.templates;

    if (templates) {
      for (let [id, t] of Object.entries(templates)) {
        foundry.utils.mergeObject(
          source.system.magicSystem.templates[id].components,
          t.components,
          {
            recursive: true
          }
        );
        source.system.magicSystem.templates[id].name = t.name;
      }

      expanded.system.magicSystem.templates = source.system.magicSystem.templates;
    }

    return expanded;
  }
}
