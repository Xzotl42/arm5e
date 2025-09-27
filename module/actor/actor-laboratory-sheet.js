import { ARM5E } from "../config.js";
import ArM5eActiveEffect from "../helpers/active-effects.js";
import {
  GetEffectAttributesLabel,
  GetEnchantmentSelectOptions,
  GetFilteredMagicalAttributes,
  GetRawLabTotalLabel,
  PickRequisites,
  computeLevel,
  computeRawCastingTotal
} from "../helpers/magic.js";
import { resetOwnerFields } from "../item/item-converter.js";
import { ArM5eItemMagicSheet } from "../item/item-magic-sheet.js";
import { getDataset, log } from "../tools.js";
import { ArM5eActorSheet } from "./actor-sheet.js";
import { ArM5eItemDiarySheet } from "../item/item-diary-sheet.js";
import {
  HERMETIC_FILTER,
  HERMETIC_TOPIC_FILTER,
  TIME_FILTER,
  TOPIC_FILTER
} from "../constants/userdata.js";
import { DiaryEntrySchema } from "../schemas/diarySchema.js";
import { LabActivity, NoLabActivity, SpellActivity } from "../seasonal-activities/labActivity.js";

import { investigate } from "../helpers/long-term-activities.js";
import { ArM5eItem } from "../item/item.js";
/**
 * Extend the basic ArM5eActorSheet
 * @extends {ArM5eActorSheet}
 */
export class ArM5eLaboratoryActorSheet extends ArM5eActorSheet {
  constructor(object, options) {
    super(object, options);
  }

  /** @override */
  get template() {
    if (this.actor.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER)) {
      return "systems/arm5e/templates/actor/actor-laboratory-sheet.html";
    }
    return "systems/arm5e/templates/actor/lab-limited-sheet.html";
  }

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["arm5e", "sheet", "actor"],
      template: "systems/arm5e/templates/actor/actor-laboratory-sheet.html",
      width: 790,
      height: 800,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "planning"
        },
        {
          navSelector: ".inventory-tabs",
          contentSelector: ".inventory-body",
          initial: "inventory"
        }
      ],
      dragDrop: [
        { dragSelector: null, dropSelector: ".drop-spell" },
        { dragSelector: null, dropSelector: ".drop-enchant" },
        { dragSelector: null, dropSelector: ".drop-magic-item" },
        { dragSelector: null, dropSelector: ".mainLaboratory" }
      ]
    });
  }

  getUserCache() {
    let usercache = JSON.parse(sessionStorage.getItem(`usercache-${game.user.id}`));
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
      let sections = { visibility: { common: {}, planning: {} } };
      foundry.utils.mergeObject(sections, usercache[this.actor.id].sections);
      usercache[this.actor.id].sections = sections;
    }
    sessionStorage.setItem(`usercache-${game.user.id}`, JSON.stringify(usercache));
    return usercache[this.actor.id];
  }

  /* -------------------------------------------- */

  /** @override */
  /**
   * Description
   * @returns {any}
   */
  async getData() {
    // log(false, "GET WORKBENCH DATA");
    let context = await super.getData();
    let isValid = true;

    await GetFilteredMagicalAttributes(context.selection);

    GetEnchantmentSelectOptions(context);

    if (
      context.system.owner &&
      context.system.owner.linked &&
      context.system.owner.document.isMagus()
    ) {
      // Owner
      // this.actor.apps[context.system.owner.document.sheet.appId] =
      //   context.system.owner.document.sheet;

      // context.system.owner.document.apps[this.appId] = this;

      context.planning = this.actor.getFlag(ARM5E.SYSTEM_ID, "planning");
      if (context.planning) {
        context.planning.activity = LabActivity.LabActivityFactory(
          this.actor.uuid,
          this.actor.system.owner.document.uuid,
          context.planning.type
        );
        if (!context.planning.data)
          context.planning.data = await context.planning.activity.getDefaultData();
      } else {
        const defaultType = "inventSpell";
        const defaultActivity = new SpellActivity(
          this.actor.uuid,
          this.actor.system.owner.document.uuid,
          defaultType
        );
        const defaultData = await defaultActivity.getDefaultData();
        context.planning = {
          activity: defaultActivity,
          type: defaultType,
          data: defaultData
        };
      }

      // if (context.planning.activity === undefined) {
      //   context.planning.activity = new SpellActivity(
      //     this.actor.uuid,
      //     this.actor.system.owner.document.uuid,
      //     "inventSpell"
      //   );
      //   context.planning.type = "inventSpell";
      // }
    } else {
      this._prepareCharacterItems(context);
      const defaultType = "none";
      const defaultActivity = new NoLabActivity(this.actor.uuid, defaultType);
      const defaultData = await defaultActivity.getDefaultData();
      context.planning = {
        activity: defaultActivity,
        type: defaultType,
        data: defaultData
      };

      // context.planning.modifiers.apprentice = 0;
      log(false, "lab-sheet getData", context);

      return context;
    }
    const activity = context.planning.activity;
    context.config = CONFIG.ARM5E;

    // Context.planning = this.actor.getFlag(ARM5E.SYSTEM_ID, "planning");

    // if (this.planning === undefined) {
    //   let newData = await this.planning.activity.getDefaultData();
    //   this.planning = {
    //     type: "inventSpell",
    //     data: newData,
    //     visibility: { desc: "hide", attr: "hide", options: "hide" },
    //     modifiers: { generic: 0, aura: 0 },
    //     distractions: "none",
    //     magicThSpecApply: false
    //   };
    // }
    context.edition = context.config.activities.lab[context.planning.type].edition;
    context.planning.messages = [];

    // Covenant
    if (context.system.covenant) {
      if (context.system.covenant.linked) {
        // this.actor.apps[context.system.covenant.document.sheet.appId] =
        //   context.system.covenant.document.sheet;
        context.edition.aura = "readonly";
        context.planning.modifiers.aura = context.system.auraBonus;
      } else {
        context.edition.aura = "";
        context.classes = { aura: "editable" };
        if (context.planning.modifiers === undefined) {
          context.planning.modifiers = { aura: context.system.auraBonus };
        } else if (context.planning.modifiers.aura === undefined)
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
      // context.planning.modifiers.aura += context.system.auraBonus;
      context.tooltip = {
        aura: game.i18n.format("arm5e.activeEffect.add", {
          score: (context.system.auraBonus < 0 ? "" : "+") + context.system.auraBonus,
          value: game.i18n.localize("arm5e.sheet.aura")
        })
      };
    }

    context.planning.modifiers.magicThSpecApply = context.planning.magicThSpecApply ? 1 : 0;

    // TODO fix covenant date
    if (context.planning.date === undefined) {
      context.planning.date = game.settings.get("arm5e", "currentDate");
    } else if (context.planning.date.year == null) {
      context.planning.date.year = game.settings.get("arm5e", "currentDate").year;
    }

    context.planning.display = context.config.activities.lab[context.planning.type].display;

    context.planning.namePrefix = "flags.arm5e.planning.data.";
    context.planning.expiryAllowed = false;
    switch (context.planning.type) {
      case "inventSpell":
      case "learnSpell":
        context.planning.data.system.level = computeLevel(context.planning.data.system, "spell");
        context.planning.label = GetEffectAttributesLabel(context.planning.data);
        break;
      case "chargedItem":
      case "minorEnchantment":
        context.planning.data.enchantment.system.level = computeLevel(
          context.planning.data.enchantment.system,
          "enchantment"
        );
        context.planning.label = GetEffectAttributesLabel(context.planning.data.enchantment);
        context.enchantPrefix = "flags.arm5e.planning.data.enchantment.";
        context.receptaclePrefix = "flags.arm5e.planning.data.receptacle.";
        if (context.planning.data.receptacle?.system.enchantments.aspects.length > 0) {
          // If settings were too restrictive, allow existing Items to keep their value.
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
          context.planning.data.receptacle = await fromUuid(context.planning.data.receptacle?.uuid);
        }
        break;
      case "longevityRitual":
        context.planning.data.system.technique.value = "cr";
        context.planning.data.system.form.value = "co";
        context.planning.label = GetRawLabTotalLabel("cr", "co");
        break;
    }
    activity.modifiers = context.planning.modifiers;
    context.activitySheet = activity.activitySheet;
    // activity.prepareData(context.planning);
    let labTot = activity.computeLabTotal(
      this.actor,
      this.actor.system.owner.document,
      context.planning.data,
      { distractions: context.planning.distractions, focus: context.planning.applyFocus }
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

      let magusStock = context.system.owner.document.system.vis
        .filter((v) => {
          return v.system.art === visCost.technique || v.system.art === visCost.form;
        })
        .reduce((res, current) => {
          res[current._id] = {
            label: current.name,
            amount: current.system.quantity,
            art: CONFIG.ARM5E.magic.arts[current.system.art].short,
            used: context.planning.data.visCost?.magus[current._id]?.used ?? 0
          };
          return res;
        }, {});

      let labStock = this.actor.system.rawVis
        .filter((v) => {
          return v.system.art === visCost.technique || v.system.art === visCost.form;
        })
        .reduce((res, current) => {
          res[current._id] = {
            label: current.name,
            amount: current.system.quantity,
            art: CONFIG.ARM5E.magic.arts[current.system.art].short,
            used: context.planning.data.visCost?.lab[current._id]?.used ?? 0
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

      // Check if vis cost is more than 2 x magic theory
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

      let res = activity.validateVisCost(context.planning.data.visCost);
      if (!res.valid) {
        context.planning.messages.push(res.message);
      }
      isValid &= res.valid;
    }

    // rename it to post-processing?
    activity.lastLabTotalAdjustment(context);

    let result = activity.validation(context.planning);
    isValid &= result.valid;
    if (!isValid) {
      context.edition.schedule = "disabled";
      if (result.duration <= 1) {
        context.planning.messages.push(result.message);
      } else {
        context.planning.messages.push(game.i18n.localize("arm5e.lab.planning.msg.unsupported"));
        context.planning.messages.push(
          game.i18n.format("arm5e.lab.planning.msg.waste", {
            points: result.waste
          })
        );
      }
    } else {
      context.edition.schedule = "";
      if (result.message) {
        context.planning.messages.push(result.message);
      }
      if (activity.hasWaste) {
        context.planning.messages.push(
          game.i18n.format("arm5e.lab.planning.msg.waste", {
            points: result.waste
          })
        );
      } else {
        context.planning.messages.push(
          game.i18n.format("arm5e.lab.planning.msg.labTotalExcess", {
            points: result.waste
          })
        );
      }
    }
    context.planning.duration = result.duration;

    // Prepare items.
    this._prepareCharacterItems(context);

    log(false, "lab-sheet getData", context);
    return context;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    if (this.actor.flags.arm5e.planning?.activity instanceof SpellActivity) {
      this.actor.flags.arm5e.planning.activity.activateListeners(html);
    }
    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;
    html.find(".advanced-req").click(async () => {
      let planning = this.actor.getFlag(ARM5E.SYSTEM_ID, "planning");
      let updatePath = "system";
      let spellData = planning.data.system;
      if (["minorEnchantment", "chargedItem"].includes(planning.type)) {
        spellData = planning.data.enchantment.system;
        updatePath = "enchantment.system";
      }
      let update = await PickRequisites(
        spellData,
        "Lab",
        planning.type === "learnSpell" ? "disabled" : "",
        updatePath
      );
      if (update) {
        let tmp = foundry.utils.mergeObject(planning.data, update);
        planning.data = tmp;
        await this.actor.setFlag(ARM5E.SYSTEM_ID, "planning", planning);
      }
    });

    html.find(".lab-activity").change(async (event) => this._changeActivity(event));
    html.find(".reset-planning").click(async (event) => {
      let planning = this.actor.getFlag(ARM5E.SYSTEM_ID, "planning");
      event.preventDefault();
      await this._resetPlanning(planning?.type ?? "none");
      this.render();
    });
    html.find(".vis-use").change(async (event) => this._useVis(event));
    html.find(".refresh").click(this._refreshValues.bind(this));
    html.find(".schedule").click(async () => this._schedule());
    html.find(".moreinfo").click(async (ev) => {
      const actorId = $(ev.currentTarget).data("id");
      game.actors.get(actorId).sheet.render(true, { focus: true });
    });
    html.find(".type-change").change(async (event) => {
      event.preventDefault();
      let newType = event.currentTarget.selectedOptions[0].value;
      this.actor.flags.arm5e.planning.data.itemType = newType;
      const receptacle = this.actor.flags.arm5e.planning.data.receptacle;
      let newReceptacle = new ArM5eItem(
        {
          name: receptacle.name,
          type: newType,
          img: receptacle.img,
          system: receptacle.system
        },
        { temporary: true, render: false }
      );
      newReceptacle = newReceptacle.toObject();
      await this.submit({
        preventClose: true,
        updateData: { "flags.arm5e.planning.data.receptacle": newReceptacle }
      });
      this.render();
    });

    html.find(".aspect-change").change(async (e) => {
      const dataset = getDataset(e);
      let aspects = this.actor.flags.arm5e.planning.data.receptacle.system.enchantments.aspects;
      // let aspects = this.planning.data.receptacle.system.enchantments.aspects;
      let aspect = e.currentTarget.selectedOptions[0].value;
      const effect = Object.keys(CONFIG.ARM5E.ASPECTS[aspect].effects)[0];
      aspects[Number(dataset.index)].aspect = aspect;
      aspects[Number(dataset.index)].effect = effect;
      aspects[Number(dataset.index)].bonus = CONFIG.ARM5E.ASPECTS[aspect].effects[effect].bonus;
      aspects[Number(dataset.index)].effects = CONFIG.ARM5E.ASPECTS[aspect].effects;
      await this.submit({
        preventClose: true,
        updateData: { "flags.arm5e.planning.data.receptacle.system.enchantments.aspects": aspects }
      });
      this.render();
    });
    html.find(".effect-change").change(async (e) => {
      const dataset = getDataset(e);
      let aspects = this.actor.flags.arm5e.planning.data.receptacle.system.enchantments.aspects;
      // let aspects = this.planning.data.receptacle.system.enchantments.aspects;
      const effect = e.currentTarget.selectedOptions[0].value;
      const aspect = aspects[Number(dataset.index)].aspect;
      aspects[Number(dataset.index)].effect = effect;
      aspects[Number(dataset.index)].bonus = CONFIG.ARM5E.ASPECTS[aspect].effects[effect].bonus;
      aspects[Number(dataset.index)].effects = CONFIG.ARM5E.ASPECTS[aspect].effects;
      await this.submit({
        preventClose: true,
        updateData: { "flags.arm5e.planning.data.receptacle.system.enchantments.aspects": aspects }
      });
      this.render();
    });

    html.find(".owner-link").change(async (ev) => {
      ev.preventDefault();
      const val = ev.target.value;
      const owner = game.actors.getName(val);
      let updateArray = [];
      // if the actor was linked, remove listener
      if (this.actor.system.owner.linked) {
        delete this.actor.apps[this.actor.system.owner.document.sheet?.appId];
        delete this.actor.system.owner.document.apps[this.appId];
        updateArray.push(await this.actor.system.owner.document.sheet._unbindActor(this.actor));
      }
      let updateData = { "system.owner.value": val };
      if (owner) {
        updateData["system.owner.actorId"] = owner._id;
        updateArray.push(await owner.sheet._bindActor(this.actor));
      } else {
        updateData["system.owner.actorId"] = null;
      }
      updateData["_id"] = this.actor._id;
      updateArray.push(updateData);
      await Actor.updateDocuments(updateArray);
    });
  }

  async _useVis(event) {
    event.preventDefault();
    const dataset = getDataset(event);

    const amount = Number(dataset.amount);
    let val = Number(event.target.value);
    if (val > amount) {
      val = amount;
      event.target.value = amount;
    }
    const planning = this.actor.flags.arm5e.planning;
    planning.data.visCost[dataset.stock][dataset.id].used = val;

    await this.submit({
      preventClose: true,
      updateData: { "flags.arm5e.planning.data.visCost": planning.data.visCost }
    });
    this.render();
  }

  async _changeActivity(event) {
    const activity = getDataset(event).activity;
    let chosenActivity = $(".lab-activity").find("option:selected")[0].value;
    switch (chosenActivity) {
      case "inventSpell":
      case "learnSpell":
        switch (activity) {
          case "inventSpell":
          case "learnSpell":
            const planning = this.actor.getFlag(ARM5E.SYSTEM_ID, "planning");
            await this._resetPlanning(chosenActivity, planning.data);
            return;
          default:
            break;
        }
        break;
      case "minorEnchantment":
      case "visExtraction":
      case "longevityRitual":
        break;
    }
    await this._resetPlanning(chosenActivity);
  }

  async _resetPlanning(activityType = "none", data = undefined, onlyData = false) {
    // await this.actor.update({ "flags.arm5e.planning.-=data": null }, { render: false });
    const activity = LabActivity.LabActivityFactory(
      this.actor.uuid,
      this.actor.system.owner.document.uuid,
      activityType
    );
    let newData = data ?? (await activity.getDefaultData());
    const planning = {
      activity: activity,
      type: activityType,
      data: newData,
      visibility: { desc: "hide", attr: "hide", options: "hide" },
      modifiers: { generic: 0, aura: 0, aspects: 0 },
      distractions: "none",
      magicThSpecApply: false,
      applyFocus: false
    };
    if (onlyData) return planning;
    let tmp = await this.actor.update(
      { "flags.arm5e.planning": planning },
      { diff: false, recursive: false, render: true }
    );
    this.render();
  }

  _refreshValues(event) {
    event.preventDefault();
    this.render();
  }

  async _schedule() {
    let planning = this.actor.getFlag(ARM5E.SYSTEM_ID, "planning");

    const activity = this.actor.flags.arm5e.planning.activity;
    let owner = this.actor.system.owner.document;
    let applied = false;
    let dates = DiaryEntrySchema.buildSchedule(
      planning.duration,
      planning.date.year,
      planning.date.season
    );

    // Add a lab diary entry for occupation
    const labLog = [
      {
        name: game.i18n.format("arm5e.activity.title.labinuse", {
          activity: game.i18n.localize(CONFIG.ARM5E.activities.lab[planning.type].label),
          user: owner.name
        }),
        type: "diaryEntry",
        system: {
          dates: dates,
          activity: "lab",
          duration: planning.duration,
          description: "",
          done: false
        }
      }
    ];

    const externalIds = [];

    switch (planning.type) {
      case "investigateItem":
        externalIds.push({
          actorId: null,
          itemId: null,
          uuid: planning.data.receptacle.uuid,
          flags: 16,
          data: { name: planning.data.receptacle.name, labTotal: planning.labTotal.score }
        });
        break;
      case "visExtraction":
      case "inventSpell":
      case "learnSpell":
      case "chargedItem":
        break;

      case "minorEnchantment":
      case "longevityRitual":
        for (let [k, vis] of Object.entries(planning.data.visCost.magus)) {
          if (Number(vis.used) > 0) {
            externalIds.push({
              actorId: owner._id,
              itemId: k,
              flags: 1,
              data: { amount: vis.used }
            });
          }
        }
        for (let [k, vis] of Object.entries(planning.data.visCost.lab)) {
          if (Number(vis.used) > 0) {
            externalIds.push({
              actorId: this.actor._id,
              itemId: k,
              flags: 1,
              data: { amount: vis.used }
            });
          }
        }

        break;
      default:
        throw new Error("Unsupported activity");
    }

    const entryData = [activity.getDiaryEntryData(planning)];

    let achievement = await activity.activityAchievements(planning);
    if (achievement != null) {
      entryData[0].system.achievements.push(...achievement);
    }

    let log = await this.actor.createEmbeddedDocuments("Item", labLog, {});
    externalIds.push({ actorId: this.actor._id, itemId: log[0]._id, flags: 2 });
    entryData[0].system.externalIds = externalIds;
    let entry = await owner.createEmbeddedDocuments("Item", entryData, {});
    // switch (planning.type) {
    //   case "inventSpell":
    //   case "learnSpell":
    //     await entry[0].sheet.addNewSpell(planning.data);
    //     break;
    //   default:
    //     break;
    // }
    entry[0].sheet.render(true);
    return entry[0]; // for test purposes
  }

  async _onDropItem(event, data) {
    let dropTarget;
    if (event.currentTarget) {
      dropTarget = event.currentTarget.dataset.drop;
    } else {
      dropTarget = event.target[0].closest("drop");
    }
    let item = await Item.implementation.fromDropData(data);
    let planning = this.actor.getFlag(ARM5E.SYSTEM_ID, "planning");
    if (item.type === "book") {
      let topicIdx = Number(data.topicIdx);
      const topic = item.system.topics[topicIdx];
      if (topic.category == "labText") {
        item = new ArM5eItem(
          { name: topic.name, type: "laboratoryText", system: topic.system.toObject() },
          { temporary: true }
        );
      }
    }
    if (dropTarget === "spell") {
      event.stopImmediatePropagation();
      switch (item.type) {
        case "laboratoryText": {
          if (item.system.type !== "spell") {
            break;
          }
          if (item.system.draft && item.system.author !== this.actor.system.owner.value) {
            ui.notifications.info(game.i18n.localize("arm5e.lab.planning.msg.draftLabText"));
            return false;
          }
          const labSpell = item.toObject();
          labSpell.type = "spell";
          let newSpell = new ArM5eItem(labSpell, { temporary: true });
          planning.type = "learnSpell";
          let data = newSpell.toObject();
          planning.data = resetOwnerFields(data);
          await this.submit({
            preventClose: true,
            updateData: { "flags.arm5e.planning": planning }
          });
          this.render();
          return true;
        }
        case "magicalEffect":
          let newEffect = new ArM5eItem(item.toObject(), { temporary: true });
          planning.type = "inventSpell";
          planning.data = newEffect.toObject();
          await this.submit({
            preventClose: true,
            updateData: { "flags.arm5e.planning": planning }
          });
          this.render();
          return true;
        case "spell": {
          let newSpell = new ArM5eItem(item.toObject(), { temporary: true });
          planning.type = "learnSpell";
          let data = newSpell.toObject();
          planning.data = resetOwnerFields(data);
          await this.submit({
            preventClose: true,
            updateData: { "flags.arm5e.planning": planning }
          });
          this.render();
          return true;
        }
        case "enchantment": {
          let newEnchant = new ArM5eItem(item.toObject(), { temporary: true });
          planning.type = "learnSpell";
          let data = newEnchant.toObject();
          planning.data = resetOwnerFields(data);
          await this.submit({
            preventClose: true,
            updateData: { "flags.arm5e.planning": planning }
          });
          this.render();
          return true;
        }
        default:
          return await super._onDropItem(event, data);
      }
    } else if (dropTarget === "enchant") {
      event.stopImmediatePropagation();
      switch (item.type) {
        case "laboratoryText": {
          if (!["enchantment", "spell"].includes(item.system.type)) {
            break;
          }
          if (item.system.draft && item.system.author !== this.actor.system.owner.value) {
            ui.notifications.info(game.i18n.localize("arm5e.lab.planning.msg.draftLabText"));
            return false;
          }

          const effect = item.toObject();
          effect.type = item.system.type;
          let data = new ArM5eItem(effect, { temporary: true });
          resetOwnerFields(data);
          planning.data.enchantment = {
            name: data.name,
            img: data.img,
            type: "enchantment",
            system: data.system
          };
          await this.submit({
            preventClose: true,
            updateData: { "flags.arm5e.planning": planning }
          });
          this.render();
          return true;
        }
        case "magicalEffect":
        case "spell": {
          let newSpell = new ArM5eItem(item.toObject(), { temporary: true });
          let data = newSpell.toObject();
          resetOwnerFields(data);
          planning.data.enchantment = {
            name: data.name,
            img: data.img,
            type: "enchantment",
            system: data.system
          };
          await this.submit({
            preventClose: true,
            updateData: { "flags.arm5e.planning": planning }
          });
          this.render();
          return true;
        }
        case "enchantment": {
          let newEnchant = new ArM5eItem(item.toObject(), { temporary: true });
          let data = newEnchant.toObject();
          resetOwnerFields(data);
          planning.data.enchantment = {
            name: data.name,
            img: data.img,
            type: "enchantment",
            system: data.system
          };
          await this.submit({
            preventClose: true,
            updateData: { "flags.arm5e.planning": planning }
          });
          this.render();
          return true;
        }
        case "item": {
        }
        default: {
          return await super._onDropItem(event, data);
        }
      }
    } else if (dropTarget === "magic-item") {
      event.stopImmediatePropagation();
      if (
        Object.keys(ARM5E.lab.enchantment.enchantableTypes).includes(item.type) &&
        item.system.state == "enchanted"
      ) {
        planning.data.receptacle = {
          uuid: item.uuid
          // name: item.name,
          // img: item.img,
          // type: item.type,
          // system: item.system.toObject()
        };
        await this.submit({
          preventClose: true,
          updateData: { "flags.arm5e.planning": planning }
        });
        this.render();
      } else {
        return await super._onDropItem(event, data);
      }
    } else {
      const type = item.type;

      // transform input into labText
      if (type == "spell" || type == "magicalEffect" || type == "enchantment") {
        log(false, "Valid drop");
        // create a labText data:
        return await super._onDropItemCreate(effectToLabText(item.toObject()));
      }
      const res = await super._onDropItem(event, data);
      return res;
    }
  }

  async _onDrop(event) {
    event.preventDefault();
    const res = await super._onDrop(event);
    return res;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @param sheetData
   * @returns {undefined}
   */
  _prepareCharacterItems(sheetData) {
    super._prepareCharacterItems(sheetData);
  }

  isItemDropAllowed(itemData) {
    switch (itemData.type) {
      case "virtue":
      case "flaw":
        switch (itemData.system.type) {
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

  isActorDropAllowed(type) {
    switch (type) {
      case "player":
      case "npc":
      case "covenant":
        return true;
      default:
        return false;
    }
  }

  async _setOwner(character) {
    let updateArray = [];
    if (character.isCharacter()) {
      if (this.actor.system.owner.linked) {
        delete this.actor.system.owner.document.apps[this.appId];
        delete this.actor.apps[this.actor.system.owner.document.sheet?.appId];
        updateArray.push(this.actor.system.owner.document.sheet._unbindActor(this.actor));
      }
      updateArray.push(character.sheet._bindActor(this.actor));
      updateArray.push(this._bindActor(character));
    }
    return await Promise.all(updateArray);
  }

  async setOwner(character) {
    return await Actor.updateDocuments(await this._setOwner(character));
  }

  async _setCovenant(covenant) {
    let updateArray = [];
    if (covenant.type === "covenant") {
      if (this.actor.system.covenant.linked) {
        delete this.actor.system.covenant.document.apps[this.appId];
        delete this.actor.apps[this.actor.system.covenant.document.sheet?.appId];
        await this.actor.system.covenant.document.sheet._unbindActor(this.actor);
      }
      await covenant.sheet._bindActor(this.actor);
      updateArray.push(this._bindActor(covenant));
    }
    return await Promise.all(updateArray);
  }

  async setCovenant(covenant) {
    return await Actor.updateDocuments(await this._setCovenant(covenant));
  }

  /**
   * Handle dropping of an actor reference or item data onto an Actor Sheet
   * @param {DragEvent} event     The concluding DragEvent which contains drop data
   * @param {Object} data         The data transfer extracted from the event
   * @return {Promise<Object>}    A data object which describes the result of the drop
   * @private
   * @override
   */
  async _onDropActor(event, data) {
    if (!this.actor.isOwner) {
      return false;
    }
    let droppedActor = await fromUuid(data.uuid);
    // link both ways

    if (droppedActor.isCharacter()) {
      return await this.setOwner(droppedActor);
    } else if (droppedActor.type === "covenant") {
      return await this.setCovenant(droppedActor);
    }
  }

  async _bindActor(actor) {
    if (!["covenant", "player", "npc", "beast"].includes(actor.type)) return [];
    let updateData = { _id: this.actor._id };
    if (actor.type == "covenant") {
      updateData["system.covenant.value"] = actor.name;
      updateData["system.covenant.actorId"] = actor._id;
    } else if (["player", "npc", "beast"].includes(actor.type)) {
      updateData["system.owner.value"] = actor.name;
      updateData["system.owner.actorId"] = actor._id;
      this.actor.system.owner.document = actor;
      updateData["flags.arm5e.planning"] = await this._resetPlanning("none", undefined, true);
    }
    return updateData;
  }

  async _unbindActor(actor) {
    if (!["covenant", "player", "npc", "beast"].includes(actor.type)) return [];
    let updateData = { _id: this.actor._id };
    if (actor.type == "covenant") {
      updateData["system.covenant.value"] = "";
      updateData["system.covenant.actorId"] = null;
    } else if (["player", "npc", "beast"].includes(actor.type)) {
      updateData["system.owner.value"] = "";
      updateData["system.owner.actorId"] = null;
      this.actor.system.owner.document = actor;
      updateData["flags.arm5e.planning"] = await this._resetPlanning("none", undefined, true);
    }

    return updateData;
  }

  /** @inheritdoc */
  async _updateObject(event, formData) {
    if (!this.object.id) return;

    return super._updateObject(event, formData);
  }
}
