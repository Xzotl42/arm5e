import { getDataset, log } from "../../tools.js";
import { ARM5E } from "../../config.js";
import { getConfirmation } from "../../constants/ui.js";
import { ArM5eActorSheet } from "../../actor/actor-sheet.js";
import { EnchantmentExtension, EnchantmentSchema } from "../../schemas/enchantmentSchema.js";
import {
  GetEffectAttributesLabel,
  GetFilteredAspects,
  GetFilteredMagicalAttributes,
  PickRequisites,
  computeLevel
} from "../../helpers/magic.js";
import { useMagicItem } from "../../helpers/rollWindow.js";
// import { ArM5eItemMagicSheet } from "../item-magic-sheet.js";
/**
 */
export class ArM5eItemEnchantmentSheet {
  constructor(sheet) {
    this.sheet = sheet;
    this.item = sheet.item;
  }

  getUserCache() {
    let usercache = JSON.parse(sessionStorage.getItem(`usercache-${game.user.id}`));
    if (usercache[this.item.id] == undefined) {
      usercache[this.item.id] = {
        sections: {
          visibility: {
            common: {},
            enchantExt: {
              capacity: "hide",
              aspect: "hide",
              info: "",
              enchant: ""
            }
          }
        }
      };
      let enchantments = [];
      for (let idx = 0; idx < this.item.system.enchantments.effects.length; idx++) {
        enchantments.push({ desc: "", attributes: "", whole: "" });
      }
      usercache[this.item.id].sections.visibility.enchantments = enchantments;
    } else {
      let enchantments = new Array(this.item.system.enchantments.effects.length);
      for (let idx = 0; idx < this.item.system.enchantments.effects.length; idx++) {
        const ench = usercache[this.item.id].sections.visibility.enchantments
          ? usercache[this.item.id].sections.visibility.enchantments[idx]
          : undefined;
        if (ench) {
          enchantments[idx] = ench;
        } else {
          enchantments[idx] = { desc: "", attributes: "", whole: "" };
        }
      }
      let sections = {
        visibility: {
          common: {},
          enchantExt: {
            capacity: "hide",
            aspect: "hide",
            info: "",
            enchant: ""
          }
        }
      };

      foundry.utils.mergeObject(sections, usercache[this.item.id].sections);
      sections.visibility.enchantments = enchantments;
      usercache[this.item.id].sections = sections;
    }

    sessionStorage.setItem(`usercache-${game.user.id}`, JSON.stringify(usercache));
    return usercache[this.item.id];
  }

  async getData(context) {
    const enchants = context.system.enchantments;
    enchants.ui = {};
    enchants.invalidMsg = [];
    context.ui = this.getUserCache();
    context.ui.flavor = "Neutral";
    enchants.totalCapa = 0;
    enchants.states = foundry.utils.duplicate(ARM5E.lab.enchantment.state);

    context = await GetFilteredMagicalAttributes(context);

    if (enchants.capacities.length > 1) {
      enchants.states["charged"].selection = "disabled";
      enchants.states["lesser"].selection = "disabled";
      enchants.charged = false;
    } else if (enchants.capacities.length == 1) {
      // prevent deleting the last capacity
      enchants.noDelete = true;
    }

    enchants.prepared = false;
    for (let capa of enchants.capacities) {
      capa.used = 0;
      capa.total =
        ARM5E.lab.enchantment.materialBase[capa.materialBase].base *
        ARM5E.lab.enchantment.sizeMultiplier[capa.sizeMultiplier].mult;

      if (capa.prepared) {
        enchants.prepared = true;
      }
    }
    enchants.ASPECTS = await GetFilteredAspects();

    if (enchants.aspects.length > 1) {
      enchants.states["charged"].selection = "disabled";
      enchants.states["lesser"].selection = "disabled";
    }

    enchants.attuned = false;
    for (let a of enchants.aspects) {
      // If settings were too restrictive, allow existing Items to keep their value.
      enchants.ASPECTS[a.aspect] = CONFIG.ARM5E.ASPECTS[a.aspect];
      a.effects = enchants.ASPECTS[a.aspect].effects;
      if (!enchants.attuned && a.attuned) {
        enchants.attuned = true;
        enchants.charged = false;
        enchants.minor = false;
        enchants.states["charged"].selection = "disabled";
        enchants.states["lesser"].selection = "disabled";
        enchants.states["prepared"].selection = "disabled";
        enchants.states["major"].selection = "disabled";
      }
    }
    enchants.usedCapa = 0;

    if (enchants.effects.length > 1) {
      enchants.states["charged"].selection = "disabled";
      enchants.states["lesser"].selection = "disabled";
      enchants.states["prepared"].selection = "disabled";
      enchants.expiryAllowed = false;
      // enchants.prepared = true;
    }
    let idx = 0;
    let overcap = false;
    enchants.visibleEnchant = 0;
    enchants.visibleCapacities = 0;
    for (let e of enchants.effects) {
      e.system.level = computeLevel(e.system, "enchantment");
      e.details = GetEffectAttributesLabel(e);
      if (e.system.hidden && !context.isGM) {
        enchants.usedCapa = "??";
        enchants.hasHiddenEnchants = true;
      } else {
        e.visible = true;
        enchants.visibleEnchant++;
        const capaIdx = enchants.capacities.findIndex((c) => {
          return e.receptacleId == c.id;
        });
        if (capaIdx >= 0) {
          if (enchants.capacityMode == "sum") {
            enchants.totalCapa += enchants.capacities[capaIdx].total;
          } else if (enchants.capacities[capaIdx].total > enchants.totalCapa) {
            // Max mode
            enchants.totalCapa = enchants.capacities[capaIdx].total;
          }
          enchants.capacities[capaIdx].used += Math.ceil(e.system.level / 10);
          enchants.capacities[capaIdx].visible = true;
          enchants.usedCapa += Math.ceil(e.system.level / 10);
          if (!overcap && enchants.capacities[capaIdx].used > enchants.capacities[capaIdx].total) {
            enchants.invalidItem = true;
            enchants.invalidMsg.push("arm5e.enchantment.msg.capacityOverflow");
            overcap = true;
          }
        }
      }
      e.prefix = `system.enchantments.effects.${idx}.`;

      e.visibility = context.ui.sections.visibility.enchantments[idx];
      idx++;
    }
    enchants.visibleType = context.isGM;
    if (enchants.visibleEnchant == 1 && enchants.charged) {
      enchants.visibleType = true;
    } else if (enchants.visibleEnchant > 1 && enchants.state !== "talisman") {
      enchants.visibleType = true;
    } else if (enchants.attunementVisible && enchants.state !== "talisman") {
      enchants.visibleType = true;
    }

    enchants.visibleCapacities = enchants.capacities.reduce((previous, current) => {
      if (current.visible) previous++;
      return previous;
    }, 0);

    enchants.addEffect = true;
    enchants.addCapa = true;
    enchants.addAspect = true;
    enchants.ui.attuned = "disabled";
    switch (context.system.enchantments.state) {
      case "lesser":
        enchants.lesser = true;
        enchants.ui.prepared = "disabled";
        enchants.expiryAllowed = false;
        break;
      case "major":
        enchants.expiryAllowed = true;
        break;
      case "charged":
        enchants.prepared = false;
        enchants.minor = false;
        enchants.charged = true;
        enchants.ui.prepared = "disabled";
        enchants.talisman = false;
        enchants.ui.talisman = "disabled";
        enchants.expiryAllowed = false;
        break;
      case "prepared":
        enchants.expiryAllowed = true;
        enchants.charged = false;
        enchants.ui.charged = "disabled";
        enchants.minor = false;
        enchants.ui.minor = "disabled";
        enchants.addEffect = false;
        enchants.talisman = false;
        break;
      case "talisman":
        if (!enchants.attuned) {
          enchants.invalidItem = true;
          enchants.invalidMsg.push("arm5e.enchantment.msg.noAttunment");
        }
        enchants.expiryAllowed = true;
        enchants.charged = false;
        enchants.talisman = true;
        enchants.ui.charged = "disabled";
        enchants.minor = false;
        enchants.ui.minor = "disabled";
        enchants.ui.attuned = "";
      default:
    }

    if (["charged", "lesser"].includes(context.system.enchantments.state)) {
      if (enchants.effects.length >= 1) {
        if (enchants.effects.length > 1) {
          enchants.invalidItem = true;
          enchants.invalidMsg.push("arm5e.enchantment.msg.tooManyEffects");
        }
        enchants.addEffect = false;
      }
      if (enchants.capacities.length >= 1) {
        enchants.addCapa = false;
      }
      if (enchants.aspects.length >= 1) {
        enchants.addAspect = false;
      }
    } else {
      if (!enchants.prepared) {
        enchants.invalidItem = true;
        enchants.invalidMsg.push("arm5e.enchantment.msg.noCapacityPrepared");
      }
    }
  }

  async _updateObject(event, formData) {
    const expanded = foundry.utils.expandObject(formData);
    const source = this.sheet.object.toObject();

    const aspects = expanded?.system?.enchantments?.aspects;
    let options = {};
    if (aspects) {
      foundry.utils.mergeObject(source.system.enchantments.aspects, aspects, { recursive: true });
      expanded.system.enchantments.aspects = source.system.enchantments.aspects;
    }
    const capacities = expanded?.system?.enchantments?.capacities;
    if (capacities) {
      foundry.utils.mergeObject(source.system.enchantments.capacities, capacities, {
        recursive: true
      });
      expanded.system.enchantments.capacities = source.system.enchantments.capacities;
    }
    const bonuses = expanded?.system?.enchantments?.bonuses;
    if (bonuses) {
      foundry.utils.mergeObject(source.system.enchantments.bonuses, bonuses, { recursive: true });
      expanded.system.enchantments.bonuses = source.system.enchantments.bonuses;
    }

    const effects = expanded?.system?.enchantments?.effects;
    if (effects) {
      foundry.utils.mergeObject(source.system.enchantments.effects, effects, { recursive: true });
      expanded.system.enchantments.effects = source.system.enchantments.effects;
    }

    return expanded;
  }

  addListeners(html) {
    // Everything below here is only needed if the sheet is editable
    if (!this.sheet.options.editable) return;

    html.find(".enchantment-state").change(async (e) => {
      const dataset = getDataset(e);
      let currentState = dataset.state;
      let newState = e.currentTarget.selectedOptions[0].value;
      const updateData = {};
      const enchant = this.item.system.enchantments;
      switch (currentState) {
        case "charged":
          const question = game.i18n.localize("arm5e.enchantment.msg.deleteChargesConfirm");
          let confirm = await getConfirmation(
            game.i18n.localize("arm5e.sheet.enchantment"),
            question,
            ArM5eActorSheet.getFlavor(this.item.actor?.type)
          );
          if (confirm) {
            updateData[`system.enchantments.charges`] = 1;
            updateData[`system.enchantments.originalCharges`] = 1;
          } else {
            e.currentTarget.value = currentState;
            return;
          }
          switch (newState) {
            case "major":
            case "talisman": {
              enchant.capacities[0].prepared = true;
              updateData["system.enchantments.capacities"] = enchant.capacities;
              break;
              break;
            }
            case "prepared":
            case "lesser":
          }
          break;
        case "lesser":
          switch (newState) {
            case "talisman":
            case "major": {
              enchant.capacities[0].prepared = true;
              updateData["system.enchantments.capacities"] = enchant.capacities;
              break;
            }
            case "charged":
            case "prepared":
              break;
          }
          break;
        case "prepared":
          switch (newState) {
            case "talisman":
            case "major": {
              enchant.capacities[0].prepared = true;
              updateData["system.enchantments.capacities"] = enchant.capacities;
              break;
            }
            case "charged":
            case "lesser":
              break;
          }
          break;
        case "major":
          switch (newState) {
            case "talisman":
              break;
            case "prepared":
              const question = game.i18n.localize("arm5e.enchantment.msg.deleteEffectsConfirm");
              let confirm = await getConfirmation(
                game.i18n.localize("arm5e.sheet.enchantment"),
                question,
                ArM5eActorSheet.getFlavor(this.item.actor?.type)
              );
              if (confirm) {
                for (let idx = 0; idx < enchant.effects.length; idx++) {
                  updateData[`system.enchantments.effects.-=${idx}`] = null;
                }
                // updateData["system.enchantments.effects"] = [];
              } else {
                e.currentTarget.value = currentState;
                return;
              }

              break;
            case "charged":
            case "lesser": {
              enchant.capacities[0].prepared = false;
              updateData["system.enchantments.capacities"] = enchant.capacities;
              break;
            }
          }
          break;
        case "talisman":
          switch (newState) {
            case "major":
            case "prepared":

            case "charged":
            case "lesser": {
              enchant.capacities[0].prepared = false;
              updateData["system.enchantments.capacities"] = enchant.capacities;

              break;
            }
          }
          break;
        default:
          return;
      }

      updateData["system.enchantments.state"] = newState;
      await this.item.update(updateData);
    });

    html.find(".appraise").click(async () => {
      if (
        this.item.system.enchantments == null ||
        (this.item.system.state === "inert" && CONFIG.ISV10)
      ) {
        const updateData = {};
        updateData["system.state"] = "appraised";
        updateData["system.enchantments"] = new EnchantmentExtension();
        await this.item.update(updateData);
      } else {
        const question = game.i18n.localize("arm5e.dialog.delete-question");
        let confirm = await getConfirmation(
          game.i18n.localize("arm5e.sheet.enchantment"),
          question,
          ArM5eActorSheet.getFlavor(this.item.actor?.type)
        );
        if (confirm) {
          const updateData = {};
          updateData["system.state"] = "inert";
          if (CONFIG.ISV10) {
            updateData["system.enchantments"] = new EnchantmentExtension();
          } else {
            updateData["system.enchantments"] = null;
          }
          await this.item.update(updateData);
        }
      }
    });

    html.find(".advanced-req").click(async (evt) => {
      let effect = this.item.system.enchantments.effects[evt.currentTarget.dataset.index];
      let update = await PickRequisites(effect.system, evt.currentTarget.dataset.flavor);

      if (update)
        this.sheet.submit({
          preventClose: true,
          updateData: { [`system.enchantments.effects.${evt.currentTarget.dataset.index}`]: update }
        });
    });

    html.find(".aspect-change").change(async (e) => {
      const dataset = getDataset(e);
      let aspects = this.item.system.enchantments.aspects;
      let aspect = e.currentTarget.selectedOptions[0].value;
      const effect = Object.keys(this.item.system.enchantments.ASPECTS[aspect].effects)[0];
      aspects[Number(dataset.index)].aspect = aspect;
      aspects[Number(dataset.index)].effect = effect;
      aspects[Number(dataset.index)].bonus =
        this.item.system.enchantments.ASPECTS[aspect].effects[effect].bonus;
      aspects[Number(dataset.index)].effects =
        this.item.system.enchantments.ASPECTS[aspect].effects;
      this.sheet.submit({
        preventClose: true,
        updateData: { "system.enchantments.aspects": aspects }
      });
    });
    html.find(".effect-change").change(async (e) => {
      const dataset = getDataset(e);
      let aspects = this.item.system.enchantments.aspects;
      const effect = e.currentTarget.selectedOptions[0].value;
      const aspect = aspects[Number(dataset.index)].aspect;
      aspects[Number(dataset.index)].effect = effect;
      aspects[Number(dataset.index)].bonus =
        this.item.system.enchantments.ASPECTS[aspect].effects[effect].bonus;
      aspects[Number(dataset.index)].effects =
        this.item.system.enchantments.ASPECTS[aspect].effects;
      this.sheet.submit({
        preventClose: true,
        updateData: { "system.enchantments.aspects": aspects }
      });
    });

    html.find(".attribute-create").click(async (e) => {
      let capacities = this.sheet.item.system.enchantments.capacities;
      capacities.push({
        id: foundry.utils.randomID(),
        sizeMultiplier: "tiny",
        materialBase: "base1",
        desc: ""
      });
      await this.item.update({ "system.enchantments.capacities": capacities });
    });

    html.find(".attribute-delete").click(async (e) => {
      const dataset = getDataset(e);
      const index = Number(dataset.index);

      if (
        this.sheet.item.system.enchantments.effects.find((e) => {
          return e.receptacleId == dataset.id;
        })
      ) {
        ui.notifications.info(game.i18n.localize("arm5e.notification.effectLinked"));
        return;
      }
      const question = game.i18n.localize("arm5e.dialog.delete-question");
      let confirm = await getConfirmation(
        this.item.name,
        question,
        ArM5eActorSheet.getFlavor(this.item.actor?.type)
      );
      if (confirm) {
        let capacities = this.sheet.item.system.enchantments.capacities;
        capacities.splice(index, 1);
        await this.sheet.item.update({ "system.enchantments.capacities": capacities });
      }
    });

    html.find(".aspect-create").click(async (e) => {
      let aspects = this.item.system.enchantments.aspects;
      const first = Object.keys(this.item.system.enchantments.ASPECTS)[0];
      const firstEffect = Object.keys(this.item.system.enchantments.ASPECTS[first].effects)[0];
      aspects.push({
        aspect: first,
        effect: firstEffect,
        bonus: this.item.system.enchantments.ASPECTS[first].effects[firstEffect].bonus
      });
      await this.item.update({ "system.enchantments.aspects": aspects });
    });

    html.find(".aspect-delete").click(async (e) => {
      const question = game.i18n.localize("arm5e.dialog.delete-question");
      let confirm = await getConfirmation(
        this.item.name,
        question,
        ArM5eActorSheet.getFlavor(this.item.actor?.type)
      );
      if (confirm) {
        const dataset = getDataset(e);
        let aspects = this.sheet.item.system.enchantments.aspects;
        aspects.splice(dataset.index, 1);
        await this.sheet.item.update({ "system.enchantments.aspects": aspects });
      }
    });
    html.find(".bonus-create").click(async (e) => {
      let bonuses = this.item.system.enchantments.bonuses;
      bonuses.push({
        name: "Generic",
        type: "labTotal",
        value: 1
      });
      await this.item.update({ "system.enchantments.bonuses": bonuses });
    });

    html.find(".bonus-delete").click(async (e) => {
      const question = game.i18n.localize("arm5e.dialog.delete-question");
      let confirm = await getConfirmation(
        this.item.name,
        question,
        ArM5eActorSheet.getFlavor(this.item.actor?.type)
      );
      if (confirm) {
        const dataset = getDataset(e);
        let bonuses = this.sheet.item.system.enchantments.bonuses;
        bonuses.splice(dataset.index, 1);
        await this.sheet.item.update({ "system.enchantments.bonuses": bonuses });
      }
    });

    html.find(".enchantment-create").click(async (e) => {
      let effects = this.item.system.enchantments.effects;
      effects.push({
        name: "My enchantment",
        system: new EnchantmentSchema(),
        receptacleId: this.item.system.enchantments.capacities[0].id
      });

      await this.item.update({
        "system.state": "enchanted",
        "system.enchantments.effects": effects
      });
      // add it to the cache
      let usercache = JSON.parse(sessionStorage.getItem(`usercache-${game.user.id}`));
      usercache[this.item.id].sections.visibility.enchantments.push({ desc: "", attributes: "" });
      sessionStorage.setItem(`usercache-${game.user.id}`, JSON.stringify(usercache));
    });

    html.find(".enchant-effect-show").click(async (e) => {
      const dataset = getDataset(e);
      let effects = this.item.system.enchantments.effects;
      const effect = effects[dataset.index];
      const item = await Item.create(
        {
          name: effect.name,
          type: "enchantment",
          img: effect.img,
          ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER },
          editable: false,
          system: effect.system,
          [`flags.${CONFIG.ARM5E.SYSTEM_ID}.readonly`]: "true"
        },
        { temporary: true }
      );
      item.sheet.render(true);
    });

    html.find(".enchant-effect-delete").click(async (e) => {
      const dataset = getDataset(e);
      const index = Number(dataset.index);

      const question = game.i18n.localize("arm5e.dialog.delete-question");
      let confirm = await getConfirmation(
        this.item.name,
        question,
        ArM5eActorSheet.getFlavor(this.item.actor?.type)
      );
      if (confirm) {
        let effects = this.sheet.item.system.enchantments.effects;
        effects.splice(index, 1);
        const updateData = { "system.enchantments.effects": effects };
        if (effects.length == 0) {
          updateData["system.state"] = "appraised";
        }
        await this.sheet.item.update(updateData);
        // remove it from the cache
        // let usercache = JSON.parse(sessionStorage.getItem(`usercache-${game.user.id}`));
        // usercache[this.item.id].sections.visibility.enchantments.splice(index, 1);
        // sessionStorage.setItem(`usercache-${game.user.id}`, JSON.stringify(usercache));
      }
    });
    html.find(".receptacle-idx-change").change(async (e) => {
      const dataset = getDataset(e);
      let receptacleId = e.currentTarget.selectedOptions[0].value;
      let effects = this.sheet.item.system.enchantments.effects;
      effects[dataset.index]["receptacleId"] = receptacleId;
      const updateData = { "system.enchantments.effects": effects };
      await this.sheet.item.update(updateData);
    });

    html.find(".drag-enchant").click(async (e) => {
      const dataset = getDataset(e);
      const item = this.item;
      const enchantIdx = dataset.index;
      if (item.isOwned) {
        dataset.name = item.name;
        dataset.roll = "item";
        dataset.id = item._id;
        dataset.physicalcondition = false;
        await useMagicItem(dataset, item);
      }
    });
  }

  async addEnchantment(enchantment) {
    const effects = this.item.system.enchantments.effects;

    const newEffect = {
      name: enchantment.name,
      img: enchantment.img,
      system: foundry.utils.deepClone(enchantment.system),
      receptacleId: this.item.system.enchantments.capacities[0].id
    };
    newEffect.system.state = "enchanted";
    effects.push(newEffect);
    await this.item.update({ "system.state": "enchanted", "system.enchantments.effects": effects });
  }
}
