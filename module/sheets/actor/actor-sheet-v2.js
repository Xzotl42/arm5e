const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;
import { ARM5E } from "../../config.js";
import { Arm5eChatMessage } from "../../helpers/chat-message.js";
import { buildSoakDataset, combatDamage, computeDamage, setWounds } from "../../helpers/combat.js";
import { usePower } from "../../helpers/magic.js";
import ArM5eActiveEffect from "../../helpers/active-effects.js";
import { ArM5eMagicSystem } from "../../actor/subsheets/magic-system.js";
import { spellFormLabel, spellTechniqueLabel } from "../../helpers/magic.js";
import {
  getDataset,
  getLastCombatMessageOfType,
  slugify,
  diaryEntryFilter,
  hermeticFilter,
  hermeticTopicFilter,
  topicFilter,
  compareLabTexts
} from "../../tools/tools.js";
import { UI } from "../../constants/ui.js";
import { customDialogAsync, getConfirmation } from "../../ui/dialogs.js";
import { getRollDialog, getRollTypeProperties, ROLL_MODES } from "../../ui/roll-window.js";
import {
  HERMETIC_FILTER,
  HERMETIC_TOPIC_FILTER,
  TIME_FILTER,
  TOPIC_FILTER,
  updateUserCache
} from "../../constants/userdata.js";
import { getRefCompendium } from "../../tools/compendia.js";

const renderTemplate = foundry.applications.handlebars.renderTemplate;

/**
 * Shared AppV2 actor sheet base.
 *
 * This class intentionally contains shared behavior only.
 * Concrete sheet layouts must be defined by child classes through PARTS.
 */
export class ArM5eActorSheetV2 extends HandlebarsApplicationMixin(ActorSheetV2) {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["arm5e", "sheet", "actor"],
    position: { width: 790, height: 800 },
    form: {
      submitOnChange: true
    },
    window: {
      resizable: true
    },
    actions: {
      toggleHidden: ArM5eActorSheetV2.toggleHidden,
      toggleBookTopic: ArM5eActorSheetV2.toggleBookTopic,
      toggleAbilityCategory: ArM5eActorSheetV2.toggleAbilityCategory,
      toggleSectionCollapse: ArM5eActorSheetV2.toggleSectionCollapse,
      roll: ArM5eActorSheetV2.roll,
      calculateDamage: ArM5eActorSheetV2.calculateDamage,
      soakDamage: ArM5eActorSheetV2.soakDamage,
      powerUse: ArM5eActorSheetV2.powerUse,
      itemAdd: ArM5eActorSheetV2.itemAdd,
      itemCreate: ArM5eActorSheetV2.itemCreate,
      itemEdit: ArM5eActorSheetV2.itemEdit,
      itemView: ArM5eActorSheetV2.itemView,
      itemClone: ArM5eActorSheetV2.itemClone,
      itemDelete: ArM5eActorSheetV2.itemDelete,
      itemDeleteConfirm: ArM5eActorSheetV2.itemDeleteConfirm,
      openLinkedActor: ArM5eActorSheetV2.openLinkedActor
    }
  };

  /** @override */
  static PARTS = {};

  /**
   * Optional limited-view parts a child can provide.
   * If empty, regular PARTS are used.
   * @type {Record<string, HandlebarsTemplatePart>}
   */
  static LIMITED_PARTS = {};

  /**
   * Decide whether the current user can view the full sheet.
   * @returns {boolean}
   * @protected
   */
  _canViewFullSheet() {
    return (
      this.actor?.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER) ?? false
    );
  }

  /** @override */
  _configureRenderParts(options) {
    if (!this._canViewFullSheet()) {
      const limitedParts = this.constructor.LIMITED_PARTS ?? {};
      if (Object.keys(limitedParts).length) return foundry.utils.deepClone(limitedParts);
    }
    return super._configureRenderParts(options);
  }

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    // --- Base actor references and permissions ---
    context.actor = this.actor;
    context.system = this.actor?.system;
    context.flags = this.actor?.flags;
    context.selection = {}; // placeholder for child-sheet selection dropdowns
    context.ui = this.getUserCache(); // per-user UI state (filters, visibility, etc.)
    context.rollData = this.actor?.getRollData?.() ?? {};
    context.config = CONFIG.ARM5E;
    context.isGM = game.user.isGM;
    context.isOwner = this.document?.isOwner ?? false;
    context.metagame = {
      view: game.settings.get("arm5e", "metagame"),
      edit: context.isGM ? "" : "readonly"
    };

    // Allow trusted users to create active effects from the sheet
    context.system.effectCreation = game.user.isTrusted;

    // --- Current in-game date ---
    context.datetime = game.settings.get("arm5e", "currentDate");
    context.datetime.seasonLabel = game.i18n.localize(
      CONFIG.ARM5E.seasons[context.datetime.season].label
    );

    // --- Book topic filters (not applicable to the magic codex) ---
    if (this.actor.type != "magicCodex") {
      // Arts topics filter
      let artsFilters = context.ui.filters.bookTopics.artsTopics;
      context.system.filteredArtsTopics = topicFilter(
        artsFilters,
        context.system.artsTopics,
        "art"
      );
      if (artsFilters.expanded) {
        context.ui.artsFilterVisibility = "";
      } else {
        context.ui.artsFilterVisibility = "hidden";
      }
      if (
        artsFilters.topic != "" ||
        artsFilters.typeFilter != "" ||
        (artsFilters.levelFilter != 0 && artsFilters.levelFilter != null) ||
        (artsFilters.qualityFilter != 0 && artsFilters.qualityFilter != null)
      ) {
        context.ui.artsTopicsFilter = UI.STYLES.FILTER_ACTIVE;
      }

      // Abilities topics filter
      let abilitiesFilters = context.ui.filters.bookTopics.abilitiesTopics;
      context.system.filteredMundaneTopics = topicFilter(
        abilitiesFilters,
        context.system.mundaneTopics,
        "key"
      );
      if (abilitiesFilters.expanded) {
        context.ui.abilitiesFilterVisibility = "";
      } else {
        context.ui.abilitiesFilterVisibility = "hidden";
      }
      if (
        abilitiesFilters.topic != "" ||
        abilitiesFilters.typeFilter != "" ||
        (abilitiesFilters.levelFilter != 0 && abilitiesFilters.levelFilter != null) ||
        (abilitiesFilters.qualityFilter != 0 && abilitiesFilters.qualityFilter != null)
      ) {
        context.ui.abilitiesTopicsFilter = UI.STYLES.FILTER_ACTIVE;
      }

      // Masteries topics filter
      let masteriesFilters = context.ui.filters.bookTopics.masteriesTopics;
      context.system.filteredMasteriesTopics = hermeticTopicFilter(
        masteriesFilters,
        context.system.masteryTopics
      );
      if (masteriesFilters.expanded) {
        context.ui.masteriesFilterVisibility = "";
      } else {
        context.ui.masteriesFilterVisibility = "hidden";
      }
      if (
        masteriesFilters.formFilter != "" ||
        masteriesFilters.techniqueFilter != "" ||
        (masteriesFilters.levelFilter != 0 && masteriesFilters.levelFilter != null)
      ) {
        context.ui.masteriesTopicsFilter = UI.STYLES.FILTER_ACTIVE;
      }
    }

    // --- Enriched description HTML ---
    const description = this.actor?.system?.description;
    if (description) {
      context.enrichedDescription = await foundry.applications.ux.TextEditor.enrichHTML(
        description,
        {
          secrets: this.document.isOwner,
          rollData: context.rollData,
          relativeTo: this.actor
        }
      );
    }

    // --- Diary entries filter and activity map (grouped by year/season) ---
    if (context.system.diaryEntries) {
      let diaryFilters = context.ui.filters.events.diaryEvents;
      let diaryCopy = context.system.diaryEntries.map((e) => e.toObject());
      let filteredActivities = diaryEntryFilter(diaryFilters, diaryCopy);
      if (diaryFilters.expanded) {
        context.ui.diaryFilterVisibility = "";
      } else {
        context.ui.diaryFilterVisibility = "hidden";
      }
      if (
        diaryFilters.typeFilter != "" ||
        (diaryFilters.minYearFilter != 0 && diaryFilters.minYearFilter != null) ||
        (diaryFilters.maxYearFilter != 0 && diaryFilters.maxYearFilter != null)
      ) {
        context.ui.diaryFilter = UI.STYLES.FILTER_ACTIVE;
      }

      // Build a year→season→activities map sorted newest-first
      const activitiesMap = new Map();
      for (let entry of filteredActivities) {
        let step = 1;
        for (let date of entry.system.dates) {
          let activity = {};
          if (entry.system.done || entry.system.activity == "none") {
            activity.ui = { diary: 'style="font-style: normal;"' };
          } else {
            activity.ui = { diary: 'style="font-style: italic; color: grey"' };
          }

          if (entry.system.dates.length > 1) {
            activity.name = `${entry.name} (${step} of ${entry.system.dates.length})`;
          } else {
            activity.name = entry.name;
          }
          step++;
          activity.img = entry.img;
          activity.type = game.i18n.localize(
            CONFIG.ARM5E.activities.generic[entry.system.activity].label
          );
          activity.date = date.date;
          activity._id = entry._id;
          if (!activitiesMap.has(date.year)) {
            activitiesMap.set(date.year, {
              [CONFIG.SEASON_ORDER_INV[3]]: [],
              [CONFIG.SEASON_ORDER_INV[2]]: [],
              [CONFIG.SEASON_ORDER_INV[1]]: [],
              [CONFIG.SEASON_ORDER_INV[0]]: []
            });
          }
          activitiesMap.get(date.year)[date.season].push(activity);
        }
      }
      context.system.activities = Array.from(
        new Map(
          [...activitiesMap.entries()].sort(function (a, b) {
            return b[0] - a[0];
          })
        ),
        ([key, value]) => ({
          year: key,
          seasons: value
        })
      );
    }

    // --- Laboratory texts filter (player, npc, laboratory, covenant) ---
    if (
      this.actor.type == "player" ||
      this.actor.type == "npc" ||
      this.actor.type == "laboratory" ||
      this.actor.type == "covenant"
    ) {
      let labtTextFilters = context.ui.filters.hermetic.laboratoryTexts;
      context.system.filteredLaboratoryTexts = hermeticFilter(
        labtTextFilters,
        context.system.laboratoryTexts
      );
      if (labtTextFilters.expanded) {
        context.ui.labtTextFilterVisibility = "";
      } else {
        context.ui.labtTextFilterVisibility = "hidden";
      }
      if (
        labtTextFilters.formFilter != "" ||
        labtTextFilters.techniqueFilter != "" ||
        (labtTextFilters.levelFilter != 0 && labtTextFilters.levelFilter != null)
      ) {
        context.ui.labTextFilter = UI.STYLES.FILTER_ACTIVE;
      }
      context.system.filteredLaboratoryTexts =
        context.system.filteredLaboratoryTexts.sort(compareLabTexts);
    }

    // --- Dev-mode debug flag ---
    context.devMode = game.modules.get("_dev-mode")?.api?.getPackageDebugValue(ARM5E.SYSTEM_ID);
    // Refresh roll data now that all system values are set
    context.rollData = this.actor.getRollData();

    // --- Active effects ---
    context.effects = ArM5eActiveEffect.prepareActiveEffectCategories(
      Array.from(this.actor.allApplicableEffects())
    );

    // --- Per-item UI decorations (virtues/flaws visibility, spell labels, magic hints…) ---
    this._prepareActorItems(context);

    // --- Custom magic system hook ---
    if (context.system.features?.magicSystem) {
      if (!this.magicSystem) {
        this.magicSystem = new ArM5eMagicSystem(this.actor);
      }
      this.magicSystem.getData(context);
    }

    return context;
  }

  /**
   * Organize and classify Items for Character sheets.
   * Child classes can override to add type-specific item preparation.
   *
   * @param {Object} actorData The context to prepare.
   */
  _prepareActorItems(actorData) {
    // --- Virtues, flaws, qualities, inferiorities, masteries ---
    // Applies to all actor types that carry these item lists.
    if (
      actorData.actor.type == "player" ||
      actorData.actor.type == "npc" ||
      actorData.actor.type == "laboratory" ||
      actorData.actor.type == "covenant" ||
      actorData.actor.type == "beast"
    ) {
      // Italic style when the item has active effects attached; visibility gated on hidden flag
      for (let virtue of actorData.system.virtues) {
        if (virtue.effects.size > 0) {
          virtue.system.ui = { style: 'style="font-style:italic"' };
        }
        if (!virtue.system.hidden || actorData.isGM) {
          virtue.system.visible = true;
        }
      }

      for (let flaw of actorData.system.flaws) {
        if (flaw.effects.size > 0) {
          flaw.system.ui = { style: 'style="font-style:italic"' };
        }
        if (!flaw.system.hidden || actorData.isGM) {
          flaw.system.visible = true;
        }
      }

      for (let q of actorData.system.qualities ?? []) {
        if (q.effects.size > 0) {
          q.system.ui = { style: 'style="font-style:italic"' };
        }
        if (!q.system.hidden || actorData.isGM) {
          q.system.visible = true;
        }
      }

      for (let inf of actorData.system.inferiorities ?? []) {
        if (inf.effects.size > 0) {
          inf.system.ui = { style: 'style="font-style:italic"' };
        }
        if (!inf.system.hidden || actorData.isGM) {
          inf.system.visible = true;
        }
      }

      // Build a compact "CrIg"-style label for each mastery topic
      for (let mastery of actorData.system.masteryTopics) {
        mastery.spellLabel = `${mastery.spellName} (${
          CONFIG.ARM5E.magic.arts[mastery.spellTech].short
        }${CONFIG.ARM5E.magic.arts[mastery.spellForm].short})`;
      }
    }

    // --- Spells and magical effects (player / npc only) ---
    // Compute display labels for technique/form requirements and mastery hint icon.
    if (actorData.actor.type == "player" || actorData.actor.type == "npc") {
      for (let spell of actorData.system.spells) {
        spell.TechReq = spellTechniqueLabel(spell.system);
        spell.FormReq = spellFormLabel(spell.system);
        // Show a small icon when the spell has a mastery score
        spell.masteryHint =
          spell.system.finalScore > 0
            ? `<i title="${game.i18n.localize("arm5e.spell.masteryHint")}  ${
                spell.system.finalScore
              } - ${spell.system.masteryAbilities}" class="ars-Icon_Effects-small"></i>`
            : "";
      }

      for (let effect of actorData.system.magicalEffects) {
        effect.TechReq = spellTechniqueLabel(effect.system);
        effect.FormReq = spellFormLabel(effect.system);
      }
    }

    // --- Enchantment hint icons for items, weapons, and armor ---
    // Shows a small icon whenever the item is not in the "inert" (non-magical) state.
    if (actorData.system.items) {
      for (let item of actorData.system.items) {
        item.magicHint =
          item.system.state === "inert"
            ? ""
            : `<i title="${game.i18n.localize(
                ARM5E.lab.enchantment.receptacle.state[item.system.state]
              )}" class="ars-Icon_Effects-small"></i>`;
      }
    }
    if (actorData.system.weapons) {
      for (let item of actorData.system.weapons) {
        item.magicHint =
          item.system.state === "inert"
            ? ""
            : `<i title="${game.i18n.localize(
                ARM5E.lab.enchantment.receptacle.state[item.system.state]
              )}" class="ars-Icon_Effects-small"></i>`;
      }
    }
    if (actorData.system.armor) {
      for (let item of actorData.system.armor) {
        item.magicHint =
          item.system.state === "inert"
            ? ""
            : `<i title="${game.i18n.localize(
                ARM5E.lab.enchantment.receptacle.state[item.system.state]
              )}" class="ars-Icon_Effects-small"></i>`;
      }
    }
  }

  /**
   * Shared AppV2 baseline user cache shape.
   * Child classes with specialized filters can override this.
   * @returns {object}
   */
  getUserCache() {
    const cacheKey = `usercache-${game.user.id}`;
    let usercache = JSON.parse(sessionStorage.getItem(cacheKey) ?? "{}");

    usercache[this.actor.id] ??= {
      filters: {
        hermetic: {
          spells: foundry.utils.deepClone(HERMETIC_FILTER),
          magicalEffects: foundry.utils.deepClone(HERMETIC_FILTER),
          laboratoryTexts: foundry.utils.deepClone(HERMETIC_FILTER)
        },
        bookTopics: {
          abilitiesTopics: foundry.utils.deepClone(TOPIC_FILTER),
          artsTopics: foundry.utils.deepClone(TOPIC_FILTER),
          masteriesTopics: foundry.utils.deepClone(HERMETIC_TOPIC_FILTER)
        },
        events: {
          diaryEvents: foundry.utils.deepClone(TIME_FILTER)
        }
      },
      sections: {
        visibility: { common: {} }
      },
      lists: {
        visibility: { abilities: {} }
      }
    };

    usercache[this.actor.id].sections ??= { visibility: { common: {} } };
    usercache[this.actor.id].sections.visibility ??= { common: {} };
    usercache[this.actor.id].lists ??= { visibility: { abilities: {} } };
    usercache[this.actor.id].lists.visibility ??= { abilities: {} };

    sessionStorage.setItem(cacheKey, JSON.stringify(usercache));
    return usercache[this.actor.id];
  }

  /** @override */
  async _preparePartContext(partId, context, options) {
    return super._preparePartContext(partId, context, options);
  }

  /**
   * Define whether a dropped item type is allowed on this actor sheet.
   * Child sheets can override.
   * @param {object} itemData
   * @returns {boolean}
   */
  isItemDropAllowed(itemData) {
    return true;
  }

  /**
   * Define whether a dropped actor type is allowed on this actor sheet.
   * Child sheets can override.
   * @param {string} type
   * @returns {boolean}
   */
  isActorDropAllowed(type) {
    return false;
  }

  /** @override */
  async _onDropItem(event, item) {
    if (!this.isItemDropAllowed(item?.toObject?.() ?? item)) return null;
    return super._onDropItem(event, item);
  }

  /** @override */
  async _onDropActor(event, actor) {
    if (!this.isActorDropAllowed(actor?.type)) return null;
    return super._onDropActor(event, actor);
  }

  static async toggleHidden(event, target) {
    event.preventDefault();
    const list = target.dataset.list || target.dataset.hidden;
    const category = target.dataset.category;
    if (!list || !category) return;

    const node = this.element.querySelector(`.${list}`);
    if (!node) return;

    const expanded = node.classList.contains("hidden");
    updateUserCache(this.actor.id, category, list, "expanded", expanded);
    node.classList.toggle("hidden");
  }

  static async toggleBookTopic(event, target) {
    event.preventDefault();
    const topic = target.dataset.topic;
    if (!topic) return;
    this.element.querySelector(`#${topic}`)?.classList.toggle("hide");
  }

  static async toggleAbilityCategory(event, target) {
    event.preventDefault();
    const category = target.dataset.category;
    if (!category) return;

    const cacheKey = `usercache-${game.user.id}`;
    const usercache = JSON.parse(sessionStorage.getItem(cacheKey) ?? "{}");
    usercache[this.actor.id] ??= this.getUserCache();
    const scope = usercache[this.actor.id].lists?.visibility?.abilities;
    const classes = this.element.querySelector(`#${category}`)?.classList;
    if (!classes) return;

    if (scope) scope[category] = classes.contains("hide") ? "" : "hide";
    sessionStorage.setItem(cacheKey, JSON.stringify(usercache));
    classes.toggle("hide");
  }

  static async toggleSectionCollapse(event, target) {
    event.preventDefault();
    const section = target.dataset.section;
    const category = target.dataset.category;
    const index = target.dataset.index ?? "";
    if (!section || !category) return;

    const cacheKey = `usercache-${game.user.id}`;
    const usercache = JSON.parse(sessionStorage.getItem(cacheKey) ?? "{}");
    usercache[this.actor.id] ??= this.getUserCache();

    const actorCache = usercache[this.actor.id];
    actorCache.sections ??= { visibility: {} };
    actorCache.sections.visibility ??= {};
    actorCache.sections.visibility[category] ??= {};
    const scope = actorCache.sections.visibility[category];

    const id = `${category}-${section}${index}-${this.actor.id}`;
    const classes = this.element.querySelector(`#${id}`)?.classList;
    if (!classes) return;

    if (index !== "") {
      scope[index] ??= {};
      scope[index][section] = classes.contains("hide") ? "" : "hide";
    } else {
      scope[section] = classes.contains("hide") ? "" : "hide";
    }

    usercache[this.actor.id] = actorCache;
    sessionStorage.setItem(cacheKey, JSON.stringify(usercache));
    classes.toggle("hide");
  }

  static async itemAdd(event, target) {
    event.preventDefault();
    const collection = await getRefCompendium(target.dataset.compendium);
    if (!collection) return this.constructor.itemCreate.call(this, event, target);
    new foundry.applications.sidebar.apps.Compendium({ collection }).render(true);
  }

  static async itemCreate(event, target) {
    event.preventDefault();
    const type = target.dataset.type;
    if (!type) return;

    const system = {};
    if (target.dataset.category) system.category = target.dataset.category;

    const name = target.dataset.name ?? `New ${type}`;
    const [item] = await this.actor.createEmbeddedDocuments("Item", [{ name, type, system }], {});
    item?.sheet?.render(true, { focus: true });
  }

  static async itemEdit(event, target) {
    event.preventDefault();
    const itemId = target.closest(".item")?.dataset?.itemId;
    if (!itemId) return;
    this.actor.getEmbeddedDocument("Item", itemId)?.sheet?.render(true, { focus: true });
  }

  static async itemView(event, target) {
    event.preventDefault();
    const uuid = target.closest(".item")?.dataset?.uuid;
    if (!uuid) return;
    (await fromUuid(uuid))?.sheet?.render(true, { focus: true });
  }

  static async itemClone(event, target) {
    event.preventDefault();
    const uuid = target.closest(".item")?.dataset?.uuid;
    if (!uuid) return;
    const item = await fromUuid(uuid);
    if (!item) return;
    const [newItem] = await this.actor.createEmbeddedDocuments("Item", [
      { name: item.name, type: item.type, system: foundry.utils.duplicate(item.system) }
    ]);
    newItem?.sheet?.render(true, { focus: true });
  }

  static async itemDelete(event, target) {
    event.preventDefault();
    const itemEl = target.closest(".item");
    const itemId = itemEl?.dataset?.itemId;
    if (!itemId) return;

    let confirmed = !!event.shiftKey;
    if (!confirmed && game.settings.get("arm5e", "confirmDelete")) {
      confirmed = await getConfirmation(
        itemEl.dataset.name ?? "",
        game.i18n.localize("arm5e.dialog.delete-question"),
        this.actor.type
      );
    } else if (!confirmed) {
      confirmed = true;
    }
    if (!confirmed) return;

    await this.actor.deleteEmbeddedDocuments("Item", [itemId], {});
    this.render(false);
  }

  static async itemDeleteConfirm(event, target) {
    event.preventDefault();
    const itemEl = target.closest(".item");
    const itemId = itemEl?.dataset?.itemId;
    if (!itemId) return;

    let confirmed = !!event.shiftKey;
    if (!confirmed) {
      confirmed = await getConfirmation(
        itemEl.dataset.name ?? "",
        game.i18n.localize("arm5e.dialog.delete-question"),
        this.actor.type
      );
    }
    if (!confirmed) return;

    await this.actor.deleteEmbeddedDocuments("Item", [itemId], {});
    this.render(false);
  }

  static async openLinkedActor(event, target) {
    event.preventDefault();
    const actorId = target.dataset.actorid;
    if (!actorId) return;
    game.actors.get(actorId)?.sheet?.render(true, { focus: true });
  }

  static async roll(event, target) {
    const dataset = getDataset(event);
    if (await this.isRollPossible(dataset)) {
      return this._roll(dataset);
    }
    return null;
  }

  static async calculateDamage(event, target) {
    event.preventDefault();
    await computeDamage(this.actor);
  }

  static async soakDamage(event, target) {
    const dataset = getDataset(event);
    const msg = await this._onSoakDamage(dataset);
    if (msg == null) return;
    if (msg.system.impact.woundGravity) {
      await this.actor.changeWound(
        1,
        CONFIG.ARM5E.recovery.rankMapping[msg.system.impact.woundGravity]
      );
    }
    Arm5eChatMessage.create(msg.toObject());
  }

  static async powerUse(event, target) {
    const dataset = getDataset(event);
    await usePower(dataset, this.actor);
  }

  async _onIndexKeyChange(event) {
    const newValue = slugify(event.currentTarget.value);
    event.currentTarget.value = newValue;
    await this.actor.update({
      system: {
        indexKey: newValue
      }
    });
  }

  async _onItemContextMenu(event) {
    const itemEl = event.currentTarget;
    const itemId = itemEl.dataset.itemId;
    const uuid = itemEl.dataset.uuid;
    if (!itemId && !uuid) return;

    event.preventDefault();

    let item = itemId ? this.document.items.get(itemId) : null;
    if (!item && uuid) {
      item = await fromUuid(uuid);
    }
    if (!item || (!item.system.description && item.system.state !== "enchanted")) return;

    this._toggleItemSummary(itemEl, item.getSummary());
  }

  _toggleItemSummary(itemEl, summaryHtml) {
    const next = itemEl.nextElementSibling;
    if (next?.classList.contains("item-summary")) {
      next.remove();
      return;
    }

    const summary = document.createElement("div");
    summary.classList.add("item-summary");
    summary.innerHTML = summaryHtml;
    itemEl.insertAdjacentElement("afterend", summary);
  }

  async _onSoakDamage(dataset) {
    let damage = 0;
    let form = "te";
    if (dataset.rootMessage) {
      const msg = fromUuidSync(dataset.rootMessage);
      damage = msg.system.combat.damageTotal > 0 ? msg.system.combat.damageTotal : 0;
      form = msg.system.combat.damageForm;
    } else {
      const lastMessageDamage = getLastCombatMessageOfType("combatDamage");
      if (lastMessageDamage) {
        damage =
          lastMessageDamage.system.combat.damageTotal > 0
            ? lastMessageDamage.system.combat.damageTotal
            : 0;
        form = lastMessageDamage.system.combat.damageForm;
      }
    }

    const dialogData = {
      actor: this.actor,
      damage,
      modifier: 0,
      natRes: form,
      formRes: form,
      selection: { natRes: {}, formRes: {} }
    };

    for (const [key, resist] of Object.entries(this.actor.system.bonuses.resistance)) {
      if (resist !== 0) {
        dialogData.hasResistance = true;
        dialogData.selection.natRes[key] = {
          res: resist,
          label: `${CONFIG.ARM5E.magic.arts[key].label} (${resist})`
        };
      }
    }

    if (this.actor.isMagus()) {
      dialogData.isMagus = true;
      dialogData.selection.formRes = {};
      for (const [key, currentForm] of Object.entries(this.actor.system.arts.forms)) {
        dialogData.selection.formRes[key] = {
          res: Math.ceil(currentForm.finalScore / 5),
          label: `${currentForm.label} (${Math.ceil(currentForm.finalScore / 5)})`
        };
      }
    }

    const html = await renderTemplate(
      "systems/arm5e/templates/actor/parts/actor-soak.html",
      dialogData
    );

    return customDialogAsync({
      window: { title: game.i18n.localize("arm5e.dialog.woundCalculator") },
      content: html,
      buttons: [
        {
          action: "yes",
          label: game.i18n.localize("arm5e.messages.applyDamage"),
          icon: "<i class='fas fa-check'></i>",
          callback: async (dialogEvent, button, dialog) => {
            const soakData = buildSoakDataset(dialog.element, this.actor);
            return setWounds(soakData, this.actor);
          }
        },
        {
          action: "no",
          label: game.i18n.localize("arm5e.dialog.button.cancel"),
          icon: "<i class='fas fa-ban'></i>",
          callback: () => null
        }
      ]
    });
  }

  async isRollPossible(dataset) {
    if (game.settings.get("arm5e", "passConfidencePromptOnRoll")) {
      const pendingConfMsg = game.messages.contents.filter((message) => {
        return message.speaker?.actor === this.actor.id && message.system.confPrompt;
      });
      if (pendingConfMsg.length) {
        await Promise.all(
          pendingConfMsg.map((message) => message.update({ "system.confPrompt": false }))
        );
      } else if (this.actor.system.states.confidencePrompt) {
        await this.actor.update({ "system.states.confidencePrompt": false });
      }
    } else if (this.actor.system.states.confidencePrompt) {
      ui.notifications.info(game.i18n.localize("arm5e.notification.confidencePromptPending"), {
        permanent: true
      });
      return false;
    }

    if (this.actor.system.wounds.dead.length > 0) {
      ui.notifications.info(game.i18n.localize("arm5e.notification.dead"), { permanent: true });
      return false;
    }

    if (this.actor.system.states.pendingDamage && dataset.roll !== "soak") {
      ui.notifications.warn(game.i18n.localize("arm5e.notification.damagePending"), {
        permanent: true
      });
      await this.actor.update({ "system.states.pendingDamage": false });
    }

    const rollProperties = getRollTypeProperties(dataset.roll);
    if (dataset.mode) {
      rollProperties.MODE = parseInt(dataset.mode);
    }

    if ((rollProperties.MODE & ROLL_MODES.UNCONSCIOUS) === 0) {
      if (this.actor.system.states.pendingCrisis) {
        ui.notifications.info(game.i18n.localize("arm5e.notification.pendingCrisis"), {
          permanent: true
        });
        return false;
      }

      if (this.actor.system.wounds.incap.length > 0) {
        ui.notifications.info(game.i18n.localize("arm5e.notification.incapacited"), {
          permanent: true
        });
        return false;
      }

      if (this.actor.system.fatigueCurrent === this.actor.system.fatigueMaxLevel) {
        ui.notifications.info(game.i18n.localize("arm5e.notification.unconscious"), {
          permanent: true
        });
        return false;
      }

      if (
        ![
          "twilight_control",
          "twilight_strength",
          "twilight_complexity",
          "twilight_understanding"
        ].includes(dataset.roll) &&
        this.actor.system.twilight?.stage > 1
      ) {
        ui.notifications.info(game.i18n.localize("arm5e.twilight.notification.pendingEpisode"), {
          permanent: false
        });
        return false;
      }
    }

    return true;
  }

  async _roll(dataset) {
    this.actor.system.charmetadata = ARM5E.character.characteristics;
    this.actor.config = CONFIG.ARM5E;
    return getRollDialog(this.actor, dataset);
  }

  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);

    const filterBindings = [
      [".topic-filter", "topicFilter"],
      [".type-filter", "typeFilter"],
      [".technique-filter", "techniqueFilter"],
      [".form-filter", "formFilter"],
      [".levelOperator-filter", "levelOperator"],
      [".level-filter", "levelFilter"],
      [".qualityOperator-filter", "qualityOperator"],
      [".quality-filter", "qualityFilter"],
      [".minyear-filter", "minYearFilter"],
      [".maxyear-filter", "maxYearFilter"]
    ];

    for (const [selector, key] of filterBindings) {
      this.element.querySelectorAll(selector).forEach((el) => {
        el.addEventListener("change", async (event) => {
          event.preventDefault();
          const target = event.currentTarget;
          const list = target.dataset.list;
          const category = target.dataset.category;
          if (!list || !category) return;
          updateUserCache(this.actor.id, category, list, key, target.value);
          if (key === "minYearFilter" || key === "maxYearFilter") {
            await this.submit({ preventClose: true });
          }
          this.render();
        });
      });
    }

    this.element.querySelectorAll(".select-on-focus").forEach((el) => {
      el.addEventListener("focus", (event) => event.currentTarget.select());
    });

    this.element.querySelectorAll(".indexkey-edit").forEach((el) => {
      el.addEventListener("change", (event) => this._onIndexKeyChange(event));
    });

    this.element.querySelectorAll(".item").forEach((el) => {
      el.addEventListener("contextmenu", (event) => void this._onItemContextMenu(event));
    });
  }
}
