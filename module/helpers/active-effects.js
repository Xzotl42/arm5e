import { ArM5ePCActor } from "../actor/actor.js";
import { ACTIVE_EFFECTS_TYPES } from "../constants/activeEffectsTypes.js";
import { ArM5eItem } from "../item/item.js";
// import { ArM5eItem } from "../item/item.js";
import { log } from "../tools.js";
/**
 * Extend the base ActiveEffect class to implement system-specific logic.
 * @extends {ActiveEffect}
 */
export default class ArM5eActiveEffect extends ActiveEffect {
  /**
   * Duration
   * @type {}
   */
  //  hermeticDuration = 0;

  prepareData() {
    super.prepareData();
  }

  prepareDerivedData() {
    super.prepareDerivedData();
    // In V10, if the effect is from an Item (virtue, etc) and is owned, prevent edition
    this.noEdit =
      !game.user.isTrusted ||
      (CONFIG.ISV10 &&
        ((this.parent?.documentName === "Item" && this.parent?.isOwned == true) ||
          (this.parent?.documentName === "Actor" && this.origin?.includes("Item")))) ||
      this.getFlag("arm5e", "noEdit");
    this.noDelete =
      // (CONFIG.ISV10 && this.noEdit) ||
      (this.parent?.documentName === "Item" && this.parent?.isOwned == true) ||
      (this.parent?.documentName === "Actor" && this.origin?.includes("Item"));
    if (!this.origin && this.target instanceof ArM5ePCActor && this.parent instanceof ArM5eItem) {
      this.origin = this.parent.uuid;
    }

    this.isHidden = this.flags.arm5e?.hidden && !game.user.isGM;
  }

  async getSource() {
    if (this.target instanceof ArM5ePCActor && this.parent instanceof ArM5eItem) {
      return this.parent;
    }
    return fromUuid(this.origin);
  }

  /** @inheritdoc */
  apply(actor, change) {
    //  Here check that every effect is properly configured before applying
    // TODO: check that every change of a generic ability has an option field set

    // if (check) return null;

    return super.apply(actor, change);
  }

  /**
   * Manage Active Effect instances through the Actor Sheet via effect control buttons.
   * @param {MouseEvent} event      The left-click event on the effect control
   * @param {Actor|Item} owner      The owning entity which manages this effect
   * @returns {Promise|null}        Promise that resolves when the changes are complete.
   */

  static async onManageActiveEffect(event, owner) {
    event.preventDefault();
    const a = event.currentTarget;
    const li = a.closest("li");
    let effect;
    if (CONFIG.ISV10) {
      effect = li.dataset.effectId ? owner.effects.get(li.dataset.effectId) : null;
    } else {
      effect = await fromUuid(li.dataset.effectId);
    }

    switch (a.dataset.action) {
      case "create":
        const data = {
          origin: owner.uuid,
          "duration.turns": li.dataset.effectType === "temporary" ? 999 : undefined, // TODO change when spell effects are there
          disabled: li.dataset.effectType === "inactive",
          tint: "#000000",
          changes: [],
          flags: {
            arm5e: {
              type: [],
              subtype: [],
              option: []
            }
          }
        };
        if (CONFIG.ISV10) {
          data.label = game.i18n.localize("arm5e.sheet.activeEffect.new");
          data.icon = "icons/svg/aura.svg";
        } else if (CONFIG.V12ORMORE) {
          data.name = game.i18n.localize("arm5e.sheet.activeEffect.new");
          data.img = "icons/svg/aura.svg";
        } else {
          data.name = game.i18n.localize("arm5e.sheet.activeEffect.new");
          // V11
          data.icon = "icons/svg/aura.svg";
        }
        return await owner.createEmbeddedDocuments("ActiveEffect", [data]);
      case "edit":
        effect.sheet.setFilter(li.dataset.filter);
        return effect.sheet.render(true);
      case "delete":
        return await effect.delete();
      case "toggle":
        return await effect.update({ disabled: !effect.disabled });
    }
  }

  /**
   * Prepare the data structure for Active Effects which are currently applied to an Actor or Item.
   * @param {ActiveEffect[]} effects    The array of Active Effect instances to prepare sheet data for
   * @return {object}                   Data for rendering
   */
  static prepareActiveEffectCategories(effects) {
    // Define effect header categories
    const categories = {
      temporary: {
        type: "temporary",
        label: "arm5e.sheet.activeEffect.section.temporary",
        effects: []
      },
      passive: {
        type: "passive",
        label: "arm5e.sheet.activeEffect.section.passive",
        effects: []
      },
      inactive: {
        type: "inactive",
        label: "arm5e.sheet.activeEffect.section.inactive",
        effects: []
      }
    };

    // Iterate over active effects, classifying them into categories
    for (let e of effects) {
      const isHidden = e.flags.arm5e?.hidden ?? false;
      if (CONFIG.ISV10) {
        e._getSourceName(); // Trigger a lookup for the source name
        e.name = e.label;
        e.img = e.icon;
        e.UUID = e._id;
        // } else if (CONFIG.V12ORMORE) {
      } else {
        e.UUID = e.uuid;
      }
      if (isHidden) {
        e.displayName = `${e.name} (${game.i18n.localize("arm5e.generic.hidden")})`;
      } else {
        e.displayName = e.name;
      }

      // TODO V11 use description field
      e.descr = e.buildActiveEffectDescription();
      // let effectTypes = e.getFlag("arm5e", "type");
      // let effectSubtypes = e.getFlag("arm5e", "subtype");
      // let effectOption = e.getFlag("arm5e", "option");
      // log(true, `DBG:Effect types: [${effectTypes}]`);
      // log(true, `DBG:Effect subtypes: [${effectSubtypes}]`);
      // log(true, `DBG:Effect options: [${effectOption}]`);
      if (e.disabled) categories.inactive.effects.push(e);
      else if (e.isTemporary) categories.temporary.effects.push(e);
      else categories.passive.effects.push(e);
    }
    return categories;
  }

  static findAllActiveEffectsWithType(effects, type) {
    const activeEffects = [];
    for (let e of effects) {
      if (CONFIG.ISV10) e._getSourceName(); // Trigger a lookup for the source name
      if (!e.disabled && e?.getFlag("arm5e", "type")?.includes(type)) {
        activeEffects.push(e);
      }
    }
    return activeEffects;
  }

  static findAllActiveEffectsWithTypeFiltered(effects, type) {
    const activeEffects = [];
    let filtered = effects.filter((e) => !e.disabled && e.getFlag("arm5e", "type").includes(type));
    for (let e of filtered) {
      if (CONFIG.ISV10) e._getSourceName(); // Trigger a lookup for the source name
      let idx = 0;
      let filteredChanges = [];
      for (let ch of e.changes) {
        if (e.flags.arm5e.type[idx] === type) {
          log(false, ch);
          filteredChanges.push(ch);
        }
      }
      e.changes = filteredChanges;
      activeEffects.push(e);
    }
    return activeEffects;
  }

  static findAllActiveEffectsWithTypeAndSubtypeFiltered(effects, type, subtype) {
    const activeEffects = [];

    let filtered = effects.filter((e) => {
      const typeFlag = e.getFlag("arm5e", "type");
      const subtypeFlag = e.getFlag("arm5e", "subtype");
      return (
        !e.disabled &&
        (typeFlag ? typeFlag.includes(type) : false) &&
        (subtypeFlag ? subtypeFlag.includes(subtype) : false)
      );
    });
    for (let e of filtered) {
      if (CONFIG.ISV10) e._getSourceName(); // Trigger a lookup for the source name
      let idx = 0;
      let filteredChanges = [];
      for (let ch of e.changes) {
        if (e.flags.arm5e.type[idx] === type && e.flags.arm5e.subtype[idx] === subtype) {
          filteredChanges.push(ch);
        }
        idx++;
      }
      if (filteredChanges.length > 0) {
        e.changes = filteredChanges;
        activeEffects.push(e);
      }
    }
    return activeEffects;
  }

  static findAllActiveEffectsWithSubtype(effects, subtype) {
    let res = [];
    for (let e of effects) {
      if (CONFIG.ISV10) e._getSourceName(); // Trigger a lookup for the source name
      if (!e.disabled && e?.getFlag("arm5e", "subtype")?.includes(subtype)) {
        res.push(e);
      }
    }
    return res;
  }

  static findAllActiveEffectsWithSubtypeFiltered(effects, subtype) {
    let res = [];
    let filtered = effects.filter(
      (e) => !e.disabled && e.getFlag("arm5e", "subtype").includes(subtype)
    );

    for (let e of filtered) {
      if (CONFIG.ISV10) e._getSourceName(); // Trigger a lookup for the source name
      let idx = 0;
      let filteredChanges = [];
      for (let ch of e.changes) {
        if (e.flags.arm5e.subtype[idx] === subtype) {
          log(false, ch);
          filteredChanges.push(ch);
        }
      }
      e.changes = filteredChanges;
      res.push(e);
    }

    return res;
  }

  static async applyCustomEffect(actor, change, current, delta, changes) {
    log(false, `CUSTOM effect apply: change: ${change}, current : ${current}, delta: ${delta}`);
  }

  //********************************* */
  // ACTIVE EFFECT NON STATIC METHODS
  //********************************* */

  // TODO review before use
  buildActiveEffectDescription() {
    let descr = "";

    try {
      let idx = 0;
      let effectTypes = this.getFlag("arm5e", "type");
      let effectSubtypes = this.getFlag("arm5e", "subtype");
      let effectOption = this.getFlag("arm5e", "option");
      for (let c of Object.values(this.changes)) {
        // log(false, ACTIVE_EFFECTS_TYPES[effectTypes[idx]]);
        descr += game.i18n.localize(ACTIVE_EFFECTS_TYPES[effectTypes[idx]].mnemonic) + ": ";
        let subtype = game.i18n.localize(
          ACTIVE_EFFECTS_TYPES[effectTypes[idx]].subtypes[effectSubtypes[idx]].mnemonic
        );
        switch (c.mode) {
          case CONST.ACTIVE_EFFECT_MODES.MULTIPLY:
            if (effectOption[idx]) {
              subtype = game.i18n.format(subtype, { option: effectOption[idx] });
            }
            descr +=
              game.i18n.format("arm5e.sheet.activeEffect.multiply", {
                type: subtype
              }) +
              (c.value < 0 ? "" : "+") +
              c.value;
            break;
          case CONST.ACTIVE_EFFECT_MODES.ADD:
            if (effectOption[idx]) {
              subtype = game.i18n.format(subtype, { option: effectOption[idx] });
            }
            descr += game.i18n.format("arm5e.sheet.activeEffect.add", {
              score: (c.value < 0 ? "" : "+") + c.value,
              value: subtype
            });
            break;
          case CONST.ACTIVE_EFFECT_MODES.OVERRIDE:
            descr += ` = ${c.value}`;
            break;
          case CONST.ACTIVE_EFFECT_MODES.UPGRADE:
            descr += ` = ${c.value}`;
            break;
          default:
            descr += "Unsupported effect mode";
        }
        descr += "&#13;";
        idx++;
      }

      return descr;
    } catch (error) {
      console.error(error);
      console.log(`Build effect description failed : ${JSON.stringify(this)}`);
      return "Error: see console";
    }
  }
}
