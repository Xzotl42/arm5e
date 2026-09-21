import { ArM5eActorSheetV2 } from "./actor-sheet-v2.js";
import { ARM5E } from "../../config.js";
import { effectToLabText, resetOwnerFields } from "../../item/item-converter.js";
import {
  GetEffectAttributesLabel,
  GetEnchantmentSelectOptions,
  GetFilteredMagicalAttributes,
  GetRawLabTotalLabel,
  PickRequisites,
  computeLevel
} from "../../helpers/magic.js";
import {
  HERMETIC_FILTER,
  HERMETIC_TOPIC_FILTER,
  TIME_FILTER,
  TOPIC_FILTER
} from "../../constants/userdata.js";
import { DiaryEntrySchema } from "../../schemas/diarySchema.js";
import {
  LabActivity,
  NoLabActivity,
  SpellActivity
} from "../../seasonal-activities/labActivity.js";
import { log } from "../../tools/tools.js";

/**
 * AppV2 Laboratory actor sheet.
 */
export class ArM5eLaboratoryActorSheetV2 extends ArM5eActorSheetV2 {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["arm5e", "sheet", "actor", "actor-laboratory"],
    position: { width: 790, height: 800 },
    actions: {
      refreshPlanning: ArM5eLaboratoryActorSheetV2.refreshPlanning,
      resetPlanning: ArM5eLaboratoryActorSheetV2.resetPlanning,
      schedulePlanning: ArM5eLaboratoryActorSheetV2.schedulePlanning,
      moreInfo: ArM5eLaboratoryActorSheetV2.moreInfo,
      openLinkedActor: ArM5eLaboratoryActorSheetV2.openLinkedActor,
      openCodex: ArM5eLaboratoryActorSheetV2.openCodex
    }
  };

  /** @override */
  static TABS = {
    primary: {
      tabs: [
        {
          id: "planning",
          label: "arm5e.lab.planning.label",
          cssClass: "item flexrow"
        },
        {
          id: "virtues",
          label: "arm5e.sheet.virtuesFlaws",
          cssClass: "item flexrow"
        },
        {
          id: "attributes",
          label: "arm5e.sheet.attributes",
          cssClass: "item flexrow"
        },
        { id: "inventory", label: "arm5e.sheet.inventory", cssClass: "item flexrow" },
        { id: "diary", label: "arm5e.sheet.diary", cssClass: "item flexrow" },
        { id: "effects", label: "arm5e.sheet.effects", cssClass: "item flexrow" }
      ],
      initial: "planning"
    },
    "inventory-secondary": {
      tabs: [
        { id: "inventory", label: "arm5e.sheet.inventory", cssClass: "item flexrow" },
        { id: "library", label: "arm5e.sheet.library", cssClass: "item flexrow" }
      ],
      initial: "inventory"
    }
  };

  /** @override */
  static PARTS = {
    header: {
      template: `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/actor-lab-header-v2.hbs`
    },
    tabs: {
      template: `systems/${ARM5E.SYSTEM_ID}/templates/generic/parts/ars-tab-navigation.hbs`,
      classes: ["arm5eTabsLAB", "marginsides32"]
    },
    planning: {
      template: `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/actor-lab-planning-tab-v2.hbs`
    },
    virtues: {
      template: `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/actor-lab-virtues-tab-v2.hbs`
    },
    attributes: {
      template: `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/actor-lab-attributes-tab-v2.hbs`
    },
    inventory: {
      template: `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/actor-lab-inventory-tab-v2.hbs`
    },
    diary: {
      template: `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/actor-diary-tab-v2.hbs`
    },
    effects: {
      template: `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/actor-lab-effects-tab-v2.hbs`
    },
    footer: {
      template: `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/actor-lab-footer-v2.hbs`
    }
  };

  /** @override */
  static LIMITED_PARTS = {
    content: {
      template: `systems/${ARM5E.SYSTEM_ID}/templates/actor/lab-limited-sheet.html`,
      classes: ["limited-sheet", "flexcol"]
    },
    footer: {
      template: `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/actor-lab-footer-v2.hbs`
    }
  };

  _configureRenderOptions(options) {
    // This fills in `options.parts` with an array of ALL part keys by default
    // So we need to call `super` first
    super._configureRenderOptions(options);

    if (this.document.limited) {
      options.parts = Object.keys(ArM5eLaboratoryActorSheetV2.LIMITED_PARTS);
      options.position = { width: 600, height: 700 };
    }
  }

  getUserCache() {
    let usercache = JSON.parse(sessionStorage.getItem(`usercache-${game.user.id}`));
    if (usercache === null) usercache = {};
    if (usercache[this.actor.id] === undefined) {
      usercache[this.actor.id] = {
        filters: {
          hermetic: {
            spells: HERMETIC_FILTER,
            magicalEffects: HERMETIC_FILTER,
            laboratoryTexts: HERMETIC_FILTER
          },
          bookTopics: {
            abilitiesTopics: TOPIC_FILTER,
            artsTopics: TOPIC_FILTER,
            masteriesTopics: HERMETIC_TOPIC_FILTER
          },
          events: {
            diaryEvents: TIME_FILTER
          }
        },
        sections: {
          visibility: { common: {}, planning: {} }
        }
      };
    } else {
      const sections = { visibility: { common: {}, planning: {} } };
      foundry.utils.mergeObject(sections, usercache[this.actor.id].sections);
      usercache[this.actor.id].sections = sections;
    }
    sessionStorage.setItem(`usercache-${game.user.id}`, JSON.stringify(usercache));
    return usercache[this.actor.id];
  }

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.tabs = this._prepareTabs("primary");
    let isValid = true;
    const hasLinkedOwnerMagus =
      !!context.system.owner &&
      !!context.system.owner.linked &&
      context.system.owner.document?.isMagus?.();
    context.config = CONFIG.ARM5E;
    // context.ui = this.getUserCache();
    context.selection ??= {};

    context.covenants = game.actors
      .filter((a) => a.type === "covenant")
      .map((a) => ({ id: a.id, name: a.name }));

    await GetFilteredMagicalAttributes(context.selection);
    GetEnchantmentSelectOptions(context);

    if (hasLinkedOwnerMagus) {
      context.hasLinkedCodex = context.system.owner.document.system.codex.linked;

      context.planning = this.actor.getFlag(ARM5E.SYSTEM_ID, "planning");
      if (context.planning) {
        context.planning.activity = LabActivity.LabActivityFactory(
          this.actor.uuid,
          this.actor.system.owner.document.uuid,
          context.planning.type
        );
        if (!context.planning.data) {
          context.planning.data = context.planning.activity.getDefaultData();
        }
      } else {
        const defaultType = "inventSpell";
        const defaultActivity = new SpellActivity(
          this.actor.uuid,
          this.actor.system.owner.document.uuid,
          defaultType
        );
        const defaultData = defaultActivity.getDefaultData();
        context.planning = {
          activity: defaultActivity,
          type: defaultType,
          data: defaultData
        };
      }
    } else {
      const defaultType = "none";
      const defaultActivity = new NoLabActivity(this.actor.uuid, defaultType);
      const defaultData = defaultActivity.getDefaultData();
      context.planning = {
        activity: defaultActivity,
        type: defaultType,
        data: defaultData
      };
    }

    context.edition = context.config.activities.lab[context.planning.type].edition;
    context.planning.messages = [];
    context.planning.display = context.config.activities.lab[context.planning.type].display;
    context.planning.namePrefix = "flags.arm5e.planning.data.";

    const activity = context.planning.activity;
    context.activitySheet = activity.activitySheet;

    if (!hasLinkedOwnerMagus) {
      context.edition.schedule = "disabled";
      context.classes ??= {};
      context.tooltip ??= {};
      context.classes.aura ??= "editable";
      context.tooltip.aura ??= "";

      context.planning.modifiers ??= {};
      context.planning.modifiers.generic ??= 0;
      context.planning.modifiers.aura ??= 0;
      context.planning.modifiers.apprentice ??= 0;
      context.planning.modifiers.magicThSpecApply ??= 0;
      context.planning.activityBonus ??= 0;
      context.planning.labSpecTotal ??= { mod: 0, label: "" };
      context.planning.labTotal ??= { score: 0, label: "" };
      context.planning.duration ??= 0;
      context.planning.date ??= game.settings.get(ARM5E.SYSTEM_ID, "currentDate");
      return context;
    }

    switch (context.planning.type) {
      case "inventSpell":
      case "learnSpell":
        context.planning.data.system.level = computeLevel(context.planning.data.system, "spell");
        context.planning.label = GetEffectAttributesLabel(context.planning.data);
        break;
      case "chargedItem":
      case "minorEnchantment":
        if (context.planning.data?.enchantment?.system) {
          context.planning.data.enchantment.system.level = computeLevel(
            context.planning.data.enchantment.system,
            "enchantment"
          );
          context.planning.label = GetEffectAttributesLabel(context.planning.data.enchantment);
        }
        context.enchantPrefix = "flags.arm5e.planning.data.enchantment.";
        context.receptaclePrefix = "flags.arm5e.planning.data.receptacle.";
        if (context.planning.data.receptacle?.system?.enchantments?.aspects?.length > 0) {
          const aspect = context.planning.data.receptacle.system.enchantments.aspects[0].aspect;
          context.planning.data.ASPECTS[aspect] = CONFIG.ARM5E.ASPECTS[aspect];
        }
        break;
      case "visExtraction":
        context.planning.data.system.technique.value = "cr";
        context.planning.data.system.form.value = "vi";
        break;
      case "investigateItem":
        context.planning.data.system.technique.value = "in";
        context.planning.data.system.form.value = "vi";
        if (context.planning.data.receptacle?.uuid) {
          context.planning.data.receptacle = await fromUuid(context.planning.data.receptacle.uuid);
        }
        break;
      case "longevityRitual":
        context.planning.data.system.technique.value = "cr";
        context.planning.data.system.form.value = "co";
        context.planning.label = GetRawLabTotalLabel("cr", "co");
        break;
    }

    // Covenant handling — sets edition.aura and seeds the aura modifier
    if (context.system.covenant) {
      if (context.system.covenant.linked) {
        context.edition.aura = "readonly";
        context.planning.modifiers.aura = context.system.auraBonus;
      } else if (context.planning.modifiers === undefined) {
        context.planning.modifiers = { aura: context.system.auraBonus };
      } else if (context.planning.modifiers.aura === undefined) {
        context.planning.modifiers.aura = context.system.auraBonus;
      }
    }

    context.system.owner.magicTheory = context.system.owner.document.getAbilityStats("magicTheory");
    context.planning.modifiers.apprentice =
      (context.system.owner.document.system.apprentice?.int ?? 0) +
      (context.system.owner.document.system.apprentice?.magicTheory ?? 0);
    context.planning.modifiers.labQuality = this.actor.system.generalQuality.total;

    if (context.edition.aura === "readonly") {
      context.planning.modifiers.aura += this.actor.system.aura.computeMaxAuraModifier(
        context.system.owner.document.system.realms
      );
    }
    if (context.system.auraBonus) {
      context.edition.aura = "readonly";
      context.tooltip = {
        aura: game.i18n.format("arm5e.activeEffect.add", {
          score: (context.system.auraBonus < 0 ? "" : "+") + context.system.auraBonus,
          value: game.i18n.localize("arm5e.sheet.aura")
        })
      };
    }

    context.planning.modifiers.magicThSpecApply = context.planning.magicThSpecApply ? 1 : 0;
    context.planning.expiryAllowed = false;

    activity.modifiers = context.planning.modifiers;
    const labTot = activity.computeLabTotal(
      this.actor,
      this.actor.system.owner.document,
      context.planning.data,
      {
        distractions: context.planning.distractions,
        focus: context.planning.applyFocus
      }
    );
    context.planning.activityBonus = activity.ownerActivityMod;
    context.planning.labSpecTotal = activity.labActivitySpec(this.actor);
    context.planning.labTotal = { score: labTot.score, label: labTot.label };
    await activity.prepareData(context);

    context.hasVisCost = activity.hasVisCost;
    if (activity.hasVisCost) {
      const visCost = await activity.getVisCost(context.planning);
      visCost.techniqueLabel = CONFIG.ARM5E.magic.arts[visCost.technique].label;
      visCost.formLabel = CONFIG.ARM5E.magic.arts[visCost.form].label;

      const magusStock = (context.system.owner.document.system.vis ?? [])
        .filter((v) => v.system.art === visCost.technique || v.system.art === visCost.form)
        .reduce((res, current) => {
          res[current._id] = {
            label: current.name,
            amount: current.system.quantity,
            art: CONFIG.ARM5E.magic.arts[current.system.art].short,
            used: context.planning.data.visCost?.magus?.[current._id]?.used ?? 0
          };
          return res;
        }, {});

      const labStock = (this.actor.system.rawVis ?? [])
        .filter((v) => v.system.art === visCost.technique || v.system.art === visCost.form)
        .reduce((res, current) => {
          res[current._id] = {
            label: current.name,
            amount: current.system.quantity,
            art: CONFIG.ARM5E.magic.arts[current.system.art].short,
            used: context.planning.data.visCost?.lab?.[current._id]?.used ?? 0
          };
          return res;
        }, {});

      context.planning.data.visCost = {
        techniqueLabel: CONFIG.ARM5E.magic.arts[visCost.technique].label,
        formLabel: CONFIG.ARM5E.magic.arts[visCost.form].label,
        technique: visCost.technique,
        form: visCost.form,
        amount: visCost.amount,
        magus: magusStock,
        lab: labStock
      };
      context.planning.data.visCost.used = activity.visUsed(context.planning.data.visCost);

      if (
        context.planning.data.visCost.used >
        (context.system.owner.magicTheory.score + context.planning.modifiers.magicThSpecApply) * 2
      ) {
        context.planning.messages.push(
          game.i18n.format("arm5e.lab.planning.msg.tooMuchVis", {
            num: context.planning.data.visCost.used
          })
        );
        isValid = false;
      }

      const visCheck = activity.validateVisCost(context.planning.data.visCost);
      if (!visCheck.valid) {
        context.planning.messages.push(visCheck.message);
      }
      isValid = isValid && visCheck.valid;
    }

    activity.lastLabTotalAdjustment(context);

    const result = activity.validation(context.planning);
    isValid = isValid && result.valid;
    if (!isValid) {
      context.edition.schedule = "disabled";
      if (result.duration <= 1) {
        context.planning.messages.push(result.message);
      } else {
        context.planning.messages.push(game.i18n.localize("arm5e.lab.planning.msg.unsupported"));
        context.planning.messages.push(
          game.i18n.format("arm5e.lab.planning.msg.waste", { points: result.waste })
        );
      }
    } else {
      context.edition.schedule = "";
      if (result.message) {
        context.planning.messages.push(result.message);
      }
      if (activity.hasWaste) {
        context.planning.messages.push(
          game.i18n.format("arm5e.lab.planning.msg.waste", { points: result.waste })
        );
      } else {
        context.planning.messages.push(
          game.i18n.format("arm5e.lab.planning.msg.labTotalExcess", { points: result.waste })
        );
      }
    }
    context.planning.duration = result.duration;

    // Template safety defaults for the workbench partial until full lab-planning parity is ported.
    context.classes ??= {};
    context.tooltip ??= {};
    // context.classes.aura ??= "editable";
    context.tooltip.aura ??= "";

    context.planning.modifiers ??= {};
    context.planning.modifiers.generic ??= 0;
    context.planning.modifiers.aura ??= 0;
    context.planning.modifiers.apprentice ??= 0;
    context.planning.modifiers.magicThSpecApply ??= 0;
    context.planning.activityBonus ??= 0;
    context.planning.labSpecTotal ??= { mod: 0, label: "" };
    context.planning.labTotal ??= { score: 0, label: "" };
    context.planning.duration ??= 0;
    context.planning.date ??= game.settings.get(ARM5E.SYSTEM_ID, "currentDate");
    log(false, "Final planning context", context.planning);
    return context;
  }

  /** @override */
  async _preparePartContext(partId, context, options) {
    if (["planning", "virtues", "attributes", "inventory", "diary", "effects"].includes(partId)) {
      context.tab = context.tabs[partId];
      if (partId === "effects" && !context.isGM) {
        context.tab.cssClass = `${context.tab.cssClass} hidden`;
      } else if (partId === "inventory") {
        context.subtabs = this._prepareTabs("inventory-secondary");
      }
    }
    return super._preparePartContext(partId, context, options);
  }

  /** @override */
  isItemDropAllowed(itemData) {
    switch (itemData?.type) {
      case "virtue":
      case "flaw":
        switch (itemData?.system?.type) {
          case "laboratoryOutfitting":
          case "laboratoryStructure":
          case "laboratorySupernatural":
          case "other":
            return true;
          default:
            return false;
        }
      case "spell":
      case "vis":
      case "item":
      case "book":
      case "weapon":
      case "armor":
      case "personalityTrait":
      case "magicalEffect":
      case "laboratoryText":
        return true;
      default:
        return false;
    }
  }

  /** @override */
  isActorDropAllowed(type) {
    return ["player", "npc", "covenant"].includes(type);
  }

  /** @override */
  async _onRender(context, options) {
    await super._onRender(context, options);

    this.element.querySelectorAll(".advanced-req").forEach((el) => {
      el.addEventListener("click", this._onAdvancedReqClick.bind(this));
    });
    this.element.querySelectorAll(".lab-activity").forEach((el) => {
      el.addEventListener("change", this._changeActivity.bind(this));
    });
    this.element.querySelectorAll(".vis-use").forEach((el) => {
      el.addEventListener("change", this._useVis.bind(this));
    });
    // this.element.querySelectorAll(".owner-link").forEach((el) => {
    //   el.addEventListener("change", this._onOwnerLinkChange.bind(this));
    // });
    this.element.querySelectorAll(".covenant-link").forEach((el) => {
      el.addEventListener("change", this._onCovenantLinkChange.bind(this));
    });
    this.element.querySelectorAll(".type-change").forEach((el) => {
      el.addEventListener("change", this._onTypeChange.bind(this));
    });
    this.element.querySelectorAll(".aspect-change").forEach((el) => {
      el.addEventListener("change", this._onAspectChange.bind(this));
    });
    this.element.querySelectorAll(".effect-change").forEach((el) => {
      el.addEventListener("change", this._onEffectChange.bind(this));
    });
  }

  async _onAdvancedReqClick(event) {
    event.preventDefault();

    const planning = foundry.utils.deepClone(this.actor.getFlag(ARM5E.SYSTEM_ID, "planning") ?? {});
    if (!planning?.data) return;

    let updatePath = "system";
    let spellData = planning.data.system;
    if (["minorEnchantment", "chargedItem"].includes(planning.type)) {
      spellData = planning.data?.enchantment?.system;
      updatePath = "enchantment.system";
    }
    if (!spellData) return;

    const update = await PickRequisites(
      spellData,
      "Lab",
      planning.type === "learnSpell" ? "disabled" : "",
      updatePath
    );
    if (!update) return;

    planning.data = foundry.utils.mergeObject(planning.data, update);
    await this._updatePlanning(planning);
    this.render();
  }

  async _onTypeChange(event) {
    event.preventDefault();
    const newType = event.currentTarget.selectedOptions?.[0]?.value;
    if (!newType) return;

    const planning = foundry.utils.deepClone(this.actor.getFlag(ARM5E.SYSTEM_ID, "planning") ?? {});
    const receptacle = planning.data?.receptacle;
    if (!receptacle) return;

    planning.data.itemType = newType;
    planning.data.receptacle = {
      name: receptacle.name,
      type: newType,
      img: receptacle.img,
      system: receptacle.system
    };

    await this._updatePlanning(planning);
    this.render();
  }

  async _onAspectChange(event) {
    event.preventDefault();
    const idx = Number(event.currentTarget.dataset.index);
    if (Number.isNaN(idx)) return;

    const aspect = event.currentTarget.selectedOptions?.[0]?.value;
    if (!aspect) return;

    const planning = foundry.utils.deepClone(this.actor.getFlag(ARM5E.SYSTEM_ID, "planning") ?? {});
    const aspects = planning.data?.receptacle?.system?.enchantments?.aspects;
    if (!Array.isArray(aspects) || !aspects[idx]) return;

    const effect = Object.keys(CONFIG.ARM5E.ASPECTS?.[aspect]?.effects ?? {})[0];
    if (!effect) return;

    aspects[idx].aspect = aspect;
    aspects[idx].effect = effect;
    aspects[idx].bonus = CONFIG.ARM5E.ASPECTS[aspect].effects[effect].bonus;
    aspects[idx].effects = CONFIG.ARM5E.ASPECTS[aspect].effects;

    await this._updatePlanning(planning);
    this.render();
  }

  async _onEffectChange(event) {
    event.preventDefault();
    const idx = Number(event.currentTarget.dataset.index);
    if (Number.isNaN(idx)) return;

    const effect = event.currentTarget.selectedOptions?.[0]?.value;
    if (!effect) return;

    const planning = foundry.utils.deepClone(this.actor.getFlag(ARM5E.SYSTEM_ID, "planning") ?? {});
    const aspects = planning.data?.receptacle?.system?.enchantments?.aspects;
    if (!Array.isArray(aspects) || !aspects[idx]) return;

    const aspect = aspects[idx].aspect;
    if (!aspect || !CONFIG.ARM5E.ASPECTS?.[aspect]?.effects?.[effect]) return;

    aspects[idx].effect = effect;
    aspects[idx].bonus = CONFIG.ARM5E.ASPECTS[aspect].effects[effect].bonus;
    aspects[idx].effects = CONFIG.ARM5E.ASPECTS[aspect].effects;

    await this._updatePlanning(planning);
    this.render();
  }

  static async refreshPlanning(event, target) {
    event.preventDefault();
    this._refreshValues(event);
  }

  static async resetPlanning(event, target) {
    event.preventDefault();
    const planning = this.actor.getFlag(ARM5E.SYSTEM_ID, "planning");
    await this.resetPlanning(planning?.type ?? "none");
    this.render();
  }

  static async schedulePlanning(event, target) {
    event.preventDefault();
    await this._schedule();
  }

  static async moreInfo(event, target) {
    event.preventDefault();
    this._onClickMoreInfo(target.dataset);
  }

  static async openLinkedActor(event, target) {
    event.preventDefault();
    const actorId = target.dataset.actorid;
    if (!actorId) return;
    game.actors.get(actorId)?.sheet?.render(true, { focus: true });
  }

  static async openCodex(event, target) {
    event.preventDefault();
    const owner = this.actor.system.owner?.document;
    if (!owner) return;
    const codex = owner.system.codex.document;
    if (!codex) return;

    codex.sheet.render(true, { focus: true });
  }

  async _useVis(event) {
    event.preventDefault();
    const dataset = event.currentTarget.dataset;

    const amount = Number(dataset.amount);
    let val = Number(event.currentTarget.value);
    if (val > amount) {
      val = amount;
      event.currentTarget.value = amount;
    }
    const planning = this.actor.getFlag(ARM5E.SYSTEM_ID, "planning") ?? {};
    if (!planning.data?.visCost?.[dataset.stock]?.[dataset.id]) return;

    planning.data.visCost[dataset.stock][dataset.id].used = val;
    await this._updatePlanning(planning);
    this.render();
  }

  async _changeActivity(event) {
    const currentActivity = event.currentTarget.dataset.activity;
    const chosenActivity = event.currentTarget.value;
    switch (chosenActivity) {
      case "inventSpell":
      case "learnSpell": {
        switch (currentActivity) {
          case "inventSpell":
          case "learnSpell": {
            const planning = this.actor.getFlag(ARM5E.SYSTEM_ID, "planning");
            await this.resetPlanning(chosenActivity, planning?.data);
            return;
          }
          default:
            break;
        }
        break;
      }
      case "minorEnchantment":
      case "visExtraction":
      case "longevityRitual":
        break;
      default:
        break;
    }
    await this.resetPlanning(chosenActivity);
  }

  async resetPlanning(activityType = "none", data = undefined) {
    const planning = await this._resetPlanning(activityType, data);
    await this._updatePlanning(planning);
    return planning;
  }

  _resetPlanning(activityType = "none", data = undefined) {
    const ownerUuid = this.actor.system.owner?.document?.uuid;
    const activity = ownerUuid
      ? LabActivity.LabActivityFactory(this.actor.uuid, ownerUuid, activityType)
      : new NoLabActivity(this.actor.uuid, "none");

    const newData = data ?? activity.getDefaultData();
    return {
      activity,
      type: ownerUuid ? activityType : "none",
      data: newData,
      visibility: { desc: "hide", attr: "hide", options: "hide" },
      modifiers: { generic: 0, aura: 0, aspects: 0 },
      distractions: "none",
      magicThSpecApply: false,
      applyFocus: false
    };
  }

  async _updatePlanning(planning) {
    return this.actor.setFlag(ARM5E.SYSTEM_ID, "planning", planning);
  }

  _refreshValues(event) {
    event.preventDefault();
    this.render();
  }

  async _schedule() {
    const planning = foundry.utils.deepClone(this.actor.getFlag(ARM5E.SYSTEM_ID, "planning") ?? {});
    const owner = this.actor.system.owner?.document;
    if (!owner || !planning?.type) {
      ui.notifications.warn(game.i18n.localize("arm5e.lab.msg.noOwner"));
      return null;
    }

    const activity = LabActivity.LabActivityFactory(this.actor.uuid, owner.uuid, planning.type);
    planning.activity = activity;

    planning.date ??= game.settings.get(ARM5E.SYSTEM_ID, "currentDate");
    const result = activity.validation(planning);
    const duration = result.duration ?? planning.duration ?? 1;
    const dates = DiaryEntrySchema.buildSchedule(
      duration,
      Number(planning.date.year),
      planning.date.season
    );

    const labLog = [
      {
        name: game.i18n.format("arm5e.activity.title.labinuse", {
          activity: game.i18n.localize(CONFIG.ARM5E.activities.lab[planning.type].label),
          user: owner.name
        }),
        type: "diaryEntry",
        system: {
          dates,
          activity: "lab",
          duration,
          description: "",
          done: false
        }
      }
    ];

    const externalIds = [];
    switch (planning.type) {
      case "investigateItem": {
        if (planning.data?.receptacle?.uuid) {
          const labTotal = planning.labTotal?.score ?? 0;
          externalIds.push({
            actorId: null,
            itemId: null,
            uuid: planning.data.receptacle.uuid,
            flags: 16,
            data: { name: planning.data.receptacle.name, labTotal }
          });
        }
        break;
      }
      case "visExtraction":
      case "inventSpell":
      case "learnSpell":
      case "chargedItem":
        break;
      case "minorEnchantment":
      case "longevityRitual": {
        for (const [k, vis] of Object.entries(planning.data?.visCost?.magus ?? {})) {
          if (Number(vis.used) > 0) {
            externalIds.push({
              actorId: owner.id,
              itemId: k,
              flags: 1,
              data: { amount: vis.used }
            });
          }
        }
        for (const [k, vis] of Object.entries(planning.data?.visCost?.lab ?? {})) {
          if (Number(vis.used) > 0) {
            externalIds.push({
              actorId: this.actor.id,
              itemId: k,
              flags: 1,
              data: { amount: vis.used }
            });
          }
        }
        break;
      }
      default:
        throw new Error("Unsupported activity");
    }

    const entryData = [activity.getDiaryEntryData(planning)];
    entryData[0].system.duration = duration;
    entryData[0].system.dates = dates;

    const achievement = await activity.activityAchievements(planning);
    if (achievement !== null) {
      entryData[0].system.achievements.push(...achievement);
    }

    const logEntry = await this.actor.createEmbeddedDocuments("Item", labLog, {});
    externalIds.push({ actorId: this.actor.id, itemId: logEntry[0].id, flags: 2 });
    entryData[0].system.externalIds = externalIds;

    const ownerEntry = await owner.createEmbeddedDocuments("Item", entryData, {});
    ownerEntry[0]?.sheet?.render(true);
    return ownerEntry[0] ?? null;
  }

  async _onOwnerLinkChange(event) {
    event.preventDefault();
    const val = event.currentTarget.value;
    const owner = game.actors.getName(val);
    await this.linkToOwner(val, owner);
  }

  async linkToOwner(ownerName, owner) {
    if (owner && this.actor.system.owner?.linked && this.actor.system.owner.actorId === owner.id) {
      ui.notifications.warn("These actors are already linked.");
      return false;
    }

    const updateArray = [];

    if (this.actor.system.owner?.linked) {
      const previousOwner = this.actor.system.owner.document;
      if (previousOwner) {
        delete this.actor.apps[previousOwner.sheet?.appId];
        delete previousOwner.apps[this.options.uniqueId];
        const unbind = previousOwner.sheet?._unbindLaboratoryData();
        if (unbind) updateArray.push(unbind);
      }
    }

    const updateData = {
      _id: this.actor.id,
      "system.owner.value": ownerName,
      "system.owner.actorId": owner?._id ?? null
    };

    if (owner) {
      const bind = owner.sheet._bindLaboratoryData(this.actor);
      if (bind) updateArray.push(bind);
    }

    updateArray.push(updateData);
    await Actor.updateDocuments(updateArray);
    await this.resetPlanning("none");
    this.render();
    return true;
  }

  async _onCovenantLinkChange(event) {
    event.preventDefault();
    const value = event.currentTarget.value;
    const covenant = game.actors.get(value);
    await this.linkToCovenant(covenant?.name ?? "", covenant);
  }

  async linkToCovenant(covenantName, covenant) {
    if (
      covenant &&
      this.actor.system.covenant?.linked &&
      this.actor.system.covenant.actorId === covenant.id
    ) {
      ui.notifications.warn("These actors are already linked.");
      return false;
    }
    // TODO translate this confirmation message
    const confirmed = await getConfirmation(
      "",
      "Are you sure you want to link this laboratory to the covenant?",
      "Covenant",
      "Its owner and previous covenant will be reset."
    );
    if (!confirmed) return false;
    const updateArray = [];
    const promiseArray = [];
    let sanctumUpdate = {};
    if (this.actor.system.covenant?.linked) {
      const previousCovenant = this.actor.system.covenant.document;
      delete this.actor.apps[previousCovenant?.sheet?.appId];
      if (previousCovenant?.apps) delete previousCovenant.apps[this.options.uniqueId];
      promiseArray.push(previousCovenant?.sheet?._unbindLaboratory(this.actor));
      // remove lab ownership
      if (this.actor.system.owner?.linked) {
        const owner = this.actor.system.owner.document;
        delete this.actor.apps[owner?.sheet?.appId];
        if (owner?.apps) delete owner.apps[this.options.uniqueId];
        const unbind = owner.sheet._unbindLaboratoryData();
        if (unbind) updateArray.push(unbind);
        foundry.utils.mergeObject(sanctumUpdate, this.actor.sheet._unbindOwnerData());
      }
    }

    if (covenant) {
      promiseArray.push(covenant.sheet?._bindLaboratory?.(this.actor));
      foundry.utils.mergeObject(sanctumUpdate, this._bindCovenantData(covenant));
    } else {
      sanctumUpdate._id = this.actor.id;
      sanctumUpdate["system.covenant.value"] = covenantName;
      sanctumUpdate["system.covenant.actorId"] = null;
    }

    updateArray.push(sanctumUpdate);
    promiseArray.push(Actor.updateDocuments(updateArray));
    return Promise.all(promiseArray);
  }

  _onClickMoreInfo(dataset) {
    const actorId = dataset.id;
    if (!actorId) return;
    game.actors.get(actorId)?.sheet?.render(true, { focus: true });
  }

  /** @override */
  async _onDropItem(event, item) {
    const dropTarget = event.target?.closest?.("[data-drop]")?.dataset?.drop;
    let planning = this.actor.getFlag(ARM5E.SYSTEM_ID, "planning") ?? null;

    if (dropTarget === "spell" && planning) {
      switch (item.type) {
        case "laboratoryText": {
          if (item.system.type !== "spell") break;
          if (item.system.draft && item.system.author !== this.actor.system.owner.value) {
            ui.notifications.info(game.i18n.localize("arm5e.lab.planning.msg.draftLabText"));
            return null;
          }
          const labSpell = item.toObject();
          labSpell.type = "spell";
          planning.type = "learnSpell";
          planning.data = resetOwnerFields(labSpell);
          await this._updatePlanning(planning);
          this.render();
          return item;
        }
        case "magicalEffect":
          planning.type = "inventSpell";
          planning.data = item.toObject();
          await this._updatePlanning(planning);
          this.render();
          return item;
        case "spell":
        case "enchantment": {
          planning.type = "learnSpell";
          planning.data = resetOwnerFields(item.toObject());
          await this._updatePlanning(planning);
          this.render();
          return item;
        }
      }
    }

    if (dropTarget === "enchant" && planning) {
      switch (item.type) {
        case "laboratoryText": {
          if (!["enchantment", "spell"].includes(item.system.type)) break;
          if (item.system.draft && item.system.author !== this.actor.system.owner.value) {
            ui.notifications.info(game.i18n.localize("arm5e.lab.planning.msg.draftLabText"));
            return null;
          }
          const effect = item.toObject();
          effect.type = item.system.type;
          const data = resetOwnerFields(effect);
          planning.data.enchantment = {
            name: data.name,
            img: data.img,
            type: "enchantment",
            system: data.system
          };
          await this._updatePlanning(planning);
          this.render();
          return item;
        }
        case "magicalEffect":
        case "spell":
        case "enchantment": {
          const data = resetOwnerFields(item.toObject());
          planning.data.enchantment = {
            name: data.name,
            img: data.img,
            type: "enchantment",
            system: data.system
          };
          await this._updatePlanning(planning);
          this.render();
          return item;
        }
      }
    }

    if (dropTarget === "magic-item" && planning) {
      if (
        Object.keys(ARM5E.lab.enchantment.enchantableTypes).includes(item.type) &&
        item.system.state === "enchanted"
      ) {
        planning.data.receptacle = { uuid: item.uuid };
        await this._updatePlanning(planning);
        this.render();
        return item;
      }
      return super._onDropItem(event, item);
    }

    // Legacy behavior: external spell/effect/enchantment drops become laboratory texts.
    const isExternal = this.actor.uuid !== item.parent?.uuid;
    if (isExternal && this.needConversion(item.type)) {
      return await this.actor.createEmbeddedDocuments("Item", [this.convert(item.toObject())]);
    }
    return super._onDropItem(event, item);
  }

  /**
   * Returns true if this item type must be converted to a laboratoryText when dropped on a laboratory outside the workbench.
   * @param {string} type
   * @returns {boolean}
   */
  needConversion(type) {
    switch (type) {
      case "spell":
      case "magicalEffect":
      case "enchantment":
        return true;
      default:
        return false;
    }
  }

  /**
   * Convert spell/magicalEffect/enchantment to laboratoryText for laboratory storage.
   * @param {object} data The item data to convert
   * @returns {object} The converted item data
   * @override
   */
  convert(data) {
    return effectToLabText(data);
  }

  async _setOwner(character) {
    const updateArray = [];
    if (character?.isCharacter?.()) {
      if (this.actor.system.owner?.linked) {
        const previousOwner = this.actor.system.owner.document;
        if (previousOwner) {
          delete previousOwner.apps[this.options.uniqueId];
          delete this.actor.apps[previousOwner.sheet?.appId];
          const unbind = previousOwner.sheet?._unbindLaboratoryData();
          if (unbind) updateArray.push(unbind);
        }
      }
      const ownerBind = character.sheet?._bindLaboratoryData(this.actor);
      if (ownerBind) updateArray.push(ownerBind);
      updateArray.push([this._bindOwnerData(character)]);
    }
    return updateArray;
  }

  async setOwner(character) {
    const updates = await this._setOwner(character);
    return await Actor.updateDocuments(updates);
  }

  // async _setCovenant(covenant) {
  //   const updateArray = [];
  //   const promiseArray = [];
  //   if (covenant?.type === "covenant") {
  //     if (this.actor.system.covenant?.linked) {
  //       const previousCovenant = this.actor.system.covenant.document;
  //       if (previousCovenant) {
  //         delete previousCovenant.apps[this.options.uniqueId];
  //         delete this.actor.apps[previousCovenant.sheet?.appId];
  //         promiseArray.push(previousCovenant.sheet?._unbindLaboratory(this.actor));
  //       }
  //     }
  //     promiseArray.push(covenant.sheet?._bindLaboratory(this.actor));
  //     promiseArray.push(Actor.updateDocuments([this._bindCovenantData(covenant)]));
  //   }
  //   return Promise.all(promiseArray);
  // }

  // async setCovenant(covenant) {
  //   await this._setCovenant(covenant);
  //   return true;
  // }

  /** @override */
  async _onDropActor(event, actor) {
    if (!this.actor.isOwner) return false;
    if (actor?.isCharacter?.()) {
      ui.notifications.info(game.i18n.localize("arm5e.notification.linking.sanctumToCharacter"));
      return true;
    }
    if (actor?.type === "covenant") return this.linkToCovenant(actor.name, actor);
    return super._onDropActor(event, actor);
  }

  _bindOwnerData(actor) {
    if (!["player", "npc", "beast"].includes(actor?.type)) return [];
    const updateData = { _id: this.actor.id };
    updateData["system.owner.value"] = actor.name;
    updateData["system.owner.actorId"] = actor.id;
    updateData["flags.arm5e.planning"] = this._resetPlanning("none");
    return updateData;
  }

  _unbindOwnerData() {
    const updateData = { _id: this.actor.id };
    updateData["system.owner.value"] = "";
    updateData["system.owner.actorId"] = null;
    updateData["flags.arm5e.planning"] = this._resetPlanning("none");
    return updateData;
  }

  _bindCovenantData(actor) {
    if (!["covenant"].includes(actor?.type)) return [];
    const updateData = { _id: this.actor.id };
    updateData["system.covenant.value"] = actor.name;
    updateData["system.covenant.actorId"] = actor.id;
    updateData["flags.arm5e.planning"] = this._resetPlanning("none");
    return updateData;
  }

  _unbindCovenantData() {
    const updateData = { _id: this.actor.id };
    updateData["system.covenant.value"] = "";
    updateData["system.covenant.actorId"] = null;
    updateData["flags.arm5e.planning"] = this._resetPlanning("none");
    return updateData;
  }
}
