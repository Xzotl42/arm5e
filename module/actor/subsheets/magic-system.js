import { getConfirmation } from "../../constants/ui.js";
import { getAbilityStats, getDataset, slugify } from "../../tools.js";
import { ArM5eActorSheet } from "../actor-sheet.js";

export class ArM5eMagicSystem {
  constructor(actor) {
    this.actor = actor;
  }

  //
  static prepareData(actor) {
    // Not needed after character datamodel migration
    if (!actor.system.magicSystem) {
      actor.system.magicSystem = {
        name: game.i18n.localize("arm5e.sheet.magicSystem"),
        verbs: [],
        nouns: [],
        templates: {}
      };
    } else {
      if (!actor.system.magicSystem.verbs) {
        actor.system.magicSystem.verbs = [];
      }
      if (!actor.system.magicSystem.nouns) {
        actor.system.magicSystem.nouns = [];
      }
      if (!actor.system.magicSystem.templates) {
        actor.system.magicSystem.templates = {};
      }
      if (!actor.system.magicSystem.name) {
        actor.system.magicSystem.name = game.i18n.localize("arm5e.sheet.magicSystem");
      }
    }
    actor.system.supernaturalEffectsTemplates = {
      ["orphans"]: []
    };
    for (let [key, template] of Object.entries(actor.system.magicSystem.templates)) {
      actor.system.supernaturalEffectsTemplates[key] = [];
      template.char = [];
      template.verbs = [];
      template.nouns = [];
      template.bonusAbility = {};
      template.others = [];
      for (let item of template.components) {
        switch (item.type) {
          case "char":
            template.char.push(item);
            break;
          case "ability":
            let ability = actor.items.find(
              (e) =>
                e.type === "ability" && e.system.key === item.key && e.system.option === item.option
            );
            if (ability) {
              item.abilityId = ability._id;
              item.specialty = ability.system.speciality;
              item.label = ability.name;
              item.extendedKey = item.option ? `${item.key}_${item.option}` : `${item.key}`;
            } else {
              template.valid = false;
              let abilityStat = getAbilityStats(item.key, item.option);
              item.key = abilityStat.key;
              item.extendedKey = abilityStat.extendedKey;
              item.option = abilityStat.option;
              item.label = item.label === "" ? abilityStat.label : item.label;
            }
            if (item.art === "verb") {
              template.verbs.push(item);
            } // Noun
            else if (item.art === "noun") {
              template.nouns.push(item);
            } else {
              item.active = true;
              template.bonusAbility = item;
            }

            break;
          case "verb":
            if (item.option !== "any") {
              let ability = ArM5eMagicSystem.getAltTechnique(actor, item.option);
              if (ability) {
                item.key = ability.system.key;
                item.option = ability.system.option;
                item.extendedKey = item.option ? `${item.key}_${item.option}` : `${item.key}`;
              } else {
                template.valid = false;
                let abilityStat = getAbilityStats(item.key, item.option);
                item.key = abilityStat.key;
                item.option = abilityStat.option;
                item.label = abilityStat.label;
              }
            } else {
            }
            template.verbs.push(item);
            break;
          case "noun":
            if (item.option !== "any") {
              let ability = ArM5eMagicSystem.getAltForm(actor, item.option);
              if (ability) {
                item.key = ability.system.key;
                item.option = ability.system.option;
                item.extendedKey = item.option ? `${item.key}_${item.option}` : `${item.key}`;
              } else {
                template.valid = false;
                let abilityStat = getAbilityStats(item.key, item.option);
                item.key = abilityStat.key;
                item.option = abilityStat.option;
                item.label = abilityStat.label;
              }
            }
            template.nouns.push(item);
            break;
          case "mod":
          case "mult":
            template.others.push(item);
            break;
          default:
            break;
        }
      }
    }
  }

  static getAltTechnique(actor, option) {
    return actor.items.find(
      (e) => e.type === "ability" && e.system.key === "technique" && e.system.option === option
    );
  }

  static getAltForm(actor, option) {
    return actor.items.find(
      (e) => e.type === "ability" && e.system.key === "form" && e.system.option === option
    );
  }

  async getData(context) {
    const templates = context.system.magicSystem.templates;

    context.isMagus = this.actor._isMagus();

    for (let [name, template] of Object.entries(templates)) {
      template.selection = {};
      template.selection.targetType = { simple: "Simple", complex: "Complex" };
      // see rollWindow.js for value significance
      template.selection.rollType = [
        { value: "STRESS", label: game.i18n.localize("arm5e.dialog.button.stressdie") },
        { value: "SIMPLE", label: game.i18n.localize("arm5e.dialog.button.simpledie") },
        { value: "STRESS_OR_SIMPLE", label: "Both" },
        { value: "NONE", label: "No roll" }
      ];
      let idx = 0;
      template.buttons = { mult: "disabled" };

      let hasModifier = false;
      let hasBonusAbility = false;
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
            break;
          case "ability":
            item.partial = "systems/arm5e/templates/actor/parts/template-item-ability.hbs";
            if (!item.art) {
              hasBonusAbility = true;
            }
            item.selection = [];

            // current item
            if (CONFIG.ARM5E.LOCALIZED_ABILITIES[item.key].option) {
              item.selection.push({
                ...CONFIG.ARM5E.LOCALIZED_ABILITIES[item.key],
                key: item.key,
                extendedKey: `${item.key}_${item.option}`,
                label: item.label
              });
            }
            // custom abilities of the actor
            this.actor.system.abilities.reduce((t, v) => {
              if (CONFIG.ARM5E.LOCALIZED_ABILITIES[v.system.key].option) {
                if (item.key != v.system.key || item.option != v.system.option) {
                  t.push({
                    ...CONFIG.ARM5E.LOCALIZED_ABILITIES[v.system.key],
                    key: v.system.key,
                    extendedKey: `${v.system.key}_${v.system.option}`,
                    label: v.name
                  });
                }
              }
              return t;
            }, item.selection);
            item.selection = item.selection.concat(
              Object.entries(CONFIG.ARM5E.LOCALIZED_ABILITIES)
                .filter(([k, v]) => {
                  return (
                    k !== "altTechnique" &&
                    k !== "altForm" &&
                    v.category !== "altForm" &&
                    v.category !== "altTechnique"
                  );
                })
                .map(([k, v]) => {
                  return {
                    key: k,
                    ...v
                  };
                })
            );

            break;
          case "verb":
            item.selection = { any: "Any" };
            this.actor.system.magicSystem.verbs.reduce((res, e) => {
              res[e.system.option] = `${e.name} (${e.system.finalScore})`;
              return res;
            }, item.selection);
            item.partial = "systems/arm5e/templates/actor/parts/template-item-tech.hbs";
            break;
          case "noun":
            item.selection = { any: "Any" };
            this.actor.system.magicSystem.nouns.reduce((res, e) => {
              res[e.system.option] = `${e.name} (${e.system.finalScore})`;
              return res;
            }, item.selection);
            item.partial = "systems/arm5e/templates/actor/parts/template-item-form.hbs";
            break;
          case "mod":
            hasModifier = true;
            item.partial = "systems/arm5e/templates/actor/parts/template-item-mod.hbs";
            break;
          case "mult":
            item.partial = "systems/arm5e/templates/actor/parts/template-item-mult.hbs";
            break;
        }

        idx++;
      }
      if (template.char.length) {
        template.buttons.char = "disabled";
      }

      if (hasModifier) {
        template.buttons.mod = "disabled";
      }

      if (hasBonusAbility) {
        template.buttons.bonusAb = "disabled";
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
    html.find(".template-option").change(this._onOptionChange.bind(this));
    html.find(".item-ability-key").change(this.onAbilityChange.bind(this));
    html.find(".supernatural-create").click(this._onItemCreate.bind(this));
  }

  async _onOptionChange(event) {
    const dataset = getDataset(event);
    let newOption = event.target.value;
    if (newOption === "") {
      return;
    }
    // remove any non alphanumeric character
    newOption = slugify(newOption); //.replace(/[^a-zA-Z0-9]/gi, "");

    const components = this.actor.system.magicSystem.templates[dataset.id].components;
    components[dataset.index].key = dataset.key;
    components[dataset.index].option = newOption;
    await this.actor.sheet.submit({
      preventClose: true,
      updateData: {
        [`system.magicSystem.templates.${dataset.id}.components`]: components
      }
    });
    this.render();
  }

  // Supernatural effect creation
  async _onItemCreate(event) {
    const dataset = getDataset(event);

    const template = this.actor.system.magicSystem.templates[dataset.template];
    dataset.char = template.char[0]?.characteristic ?? "sta";
    const templateVerbs = template.verbs[0];
    dataset.verb = { key: null, option: null };
    if (templateVerbs) {
      if (templateVerbs.type === "verb") {
        if (templateVerbs.option === "any") {
          dataset.verb = this.actor.system.magicSystem.verbs[0].system;
        } else {
          dataset.verb = template.verbs[0];
        }
      } else {
        dataset.verb = this.actor.getAbility(templateVerbs.key, templateVerbs.option)?.system;
        if (dataset.verb === undefined) {
          dataset.verb = {
            key: templateVerbs.key,
            option: templateVerbs.option,
            label: game.i18n.format(CONFIG.ARM5E.LOCALIZED_ABILITIES[templateVerbs.key].mnemonic, {
              option: templateVerbs.option
            })
          };
        }
      }
      let extKey = CONFIG.ARM5E.LOCALIZED_ABILITIES[dataset.verb.key].option
        ? `${dataset.verb.key}_${dataset.verb.option}`
        : dataset.verb.key;
      dataset.verb.active = true;
      dataset.verb.extendedKey = extKey;
    } else {
      dataset.verb = {
        active: false
      };
    }

    const templateNouns = template.nouns[0];
    dataset.noun = { key: null, option: null };
    if (templateNouns) {
      if (templateNouns.type === "noun") {
        if (templateNouns.option === "any") {
          dataset.noun = this.actor.system.magicSystem.nouns[0].system;
        } else {
          dataset.noun = templateNouns;
        }
      } else {
        dataset.noun = this.actor.getAbility(templateNouns.key, templateNouns.option)?.system;
        if (dataset.noun === undefined) {
          dataset.noun = {
            key: templateNouns.key,
            option: templateNouns.option,
            label: game.i18n.format(CONFIG.ARM5E.LOCALIZED_ABILITIES[templateNouns.key].mnemonic, {
              option: templateNouns.option
            })
          };
        }
      }
      let extKey = CONFIG.ARM5E.LOCALIZED_ABILITIES[dataset.noun.key].option
        ? `${dataset.noun.key}_${dataset.noun.option}`
        : dataset.noun.key;
      dataset.noun.active = true;
      dataset.extendedKey = extKey;
    } else {
      dataset.noun = {
        active: false
      };
    }

    // Dataset.other = template.other[0].key ?? {};

    await this.actor.sheet._onItemCreate(dataset);
  }

  async onAbilityChange(event) {
    const dataset = getDataset(event);
    const extendedKey = event.target.value;
    const components = this.actor.system.magicSystem.templates[dataset.id].components;
    event.stopPropagation();
    if (CONFIG.ARM5E.LOCALIZED_ABILITIES[extendedKey]) {
      // // check if it is a category
      if (CONFIG.ARM5E.LOCALIZED_ABILITIES[extendedKey].disabled) return;
      components[dataset.index].key = extendedKey;
      components[dataset.index].option = "";
      let ability = this.actor.items.find((e) => (e.system.key = extendedKey));
      if (ability) {
        components[dataset.index].abilityId = ability._id;
        components[dataset.index].score = ability.system.finalScore;
      } else {
        components[dataset.index].abilityId = "";
      }
    } else {
      //
      const regex = /^(?<key>\w+)_(?<option>\w+)/;
      if (regex.test(extendedKey)) {
        let matched = extendedKey.match(regex);
        // // check if it is a category
        if (CONFIG.ARM5E.LOCALIZED_ABILITIES[matched.groups.key].disabled) return;
        let ability = this.actor.getAbility(matched.groups.key, matched.groups.option);
        components[dataset.index].key = matched.groups.key;
        components[dataset.index].option = matched.groups.option;
        if (ability) {
          components[dataset.index].abilityId = ability._id;
          components[dataset.index].score = ability.system.finalScore;
        } else {
          components[dataset.index].abilityId = "";
        }
      }
    }

    // await this.actor.update({
    //   [`system.magicSystem.templates.${dataset.id}.components`]: components
    // });
    await this.actor.sheet.submit({
      preventClose: true,
      updateData: {
        [`system.magicSystem.templates.${dataset.id}.components`]: components
      }
    });
    this.render();
  }

  async onManageTemplate(event) {
    const dataset = getDataset(event);
    const magicSystem = this.actor.system.magicSystem;
    switch (dataset.action) {
      case "create":
        const template = {
          name: "Template name",
          useFatigue: false,
          components: [{ type: "char" }]
        };
        if (magicSystem.templates === undefined) {
          magicSystem.templates = {};
        }

        await this.actor.update({
          [`system.magicSystem.templates.${foundry.utils.randomID()}`]: template
        });
        break;
      case "delete":
        let confirmed = true;
        // if (game.settings.get("arm5e", "confirmDelete")) {
        const question = game.i18n.localize("arm5e.dialog.delete-question");
        confirmed = await getConfirmation(
          dataset.name,
          question,
          ArM5eActorSheet.getFlavor(this.actor.type)
        );
        // }
        if (confirmed) {
          await this.actor.update({
            [`system.magicSystem.templates.-=${dataset.id}`]: null
          });
          break;
        }
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
            components.push({ type: "char", characteristic: "sta" });
            break;
          case "ability":
            const ab = CONFIG.ARM5E.LOCALIZED_ABILITIES["animalHandling"];
            components.push({
              type: "ability",
              art: dataset.art,
              option: ab.option,
              key: "animalHandling"
            });
            break;
          case "verb":
            if (this.actor.system.magicSystem.verbs.length === 0) {
              ui.notifications.info("Define a verb first");
              return;
            }
            const verb = this.actor.system.magicSystem.verbs.find((v, idx) => idx === 0);
            components.push({ type: "verb", option: verb.system.option, key: verb.system.key });
            break;
          case "noun":
            if (this.actor.system.magicSystem.nouns.length === 0) {
              ui.notifications.info("Define a noun first");
              return;
            }
            const noun = this.actor.system.magicSystem.nouns.find((v, idx) => idx === 0);
            components.push({ type: "noun", option: noun.system.option, key: noun.system.key });
            break;
          case "mod":
            components.push({ type: "mod", value: 0, label: "My modifier" });
            break;
          case "mult":
            components.push({ type: "mult", mult: 1 });
            break;
          default:
            break;
        }
        await this.actor.update({
          [`system.magicSystem.templates.${dataset.id}.components`]: components
        });
        break;
      case "delete":
        let confirmed = true;
        if (game.settings.get("arm5e", "confirmDelete")) {
          const question = game.i18n.localize("arm5e.dialog.delete-question");
          confirmed = await getConfirmation(
            "Component",
            question,
            ArM5eActorSheet.getFlavor(this.actor.type)
          );
        }
        if (confirmed) {
          let clone = foundry.utils.deepClone(components);
          clone.splice(dataset.index, 1);
          components = clone;
          await this.actor.update({
            [`system.magicSystem.templates.${dataset.id}.components`]: components
          });
        }
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
        source.system.magicSystem.templates[id].useFatigue = t.useFatigue;
        source.system.magicSystem.templates[id].rollType = t.rollType;
      }

      expanded.system.magicSystem.templates = source.system.magicSystem.templates;
    }

    return expanded;
  }
}
