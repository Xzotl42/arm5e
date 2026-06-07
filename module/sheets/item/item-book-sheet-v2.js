import { ArM5eItemSheetV2 } from "./item-sheet-v2.js";
import { EnchantExtensionV2 } from "./enchant-extension-v2.js";
import { ArM5eActorSheetV2 } from "../actor/actor-sheet-v2.js";
import { getConfirmation } from "../../ui/dialogs.js";
import { spellFormLabel, spellTechniqueLabel } from "../../helpers/magic.js";
import { getTopicDescription } from "../../helpers/book-topic.js";
import { BookSchema } from "../../schemas/bookSchema.js";
import { ArM5eItem } from "../../item/item.js";
import { FLAVORS } from "../../constants/ui.js";

const { DragDrop } = foundry.applications.ux;

/**
 * AppV2 sheet for book items.
 */
export class ArM5eBookItemSheetV2 extends ArM5eItemSheetV2 {
  #dragDrop;

  constructor(options = {}) {
    super(options);
    this.#dragDrop = this.#createDragDropHandlers();
  }

  /**
   * Return a deep-cloned, dense array of topics from any source shape.
   * Foundry may store topics as a plain object keyed by index (e.g. after a partial update),
   * and sparse or null entries cause DataModelValidationError when the whole array is submitted.
   * This normalises both cases into a clean Array before any read or write operation.
   * @param {Array|object|null|undefined} topics  Raw topics value from item.system.topics
   * @returns {object[]}  Dense cloned array with null/undefined entries removed
   */
  static #normalizedTopics(topics) {
    if (!topics) return [];
    const arr = topics instanceof Array ? topics : Object.values(topics);
    return foundry.utils.deepClone(arr).filter((topic) => topic !== undefined && topic !== null);
  }

  /**
   * Clamp a topic index so it always points to an existing slot.
   * The stored flag (flags.arm5e.currentBookTopic) can become stale when topics are removed,
   * so this prevents out-of-bounds access during context preparation and action handlers.
   * @param {number|string} index      Raw index value (may come from a dataset attribute)
   * @param {number}        topicCount Total number of topics in the array
   * @returns {number}  A safe integer index in [0, topicCount-1], or 0 when the array is empty
   */
  static #clampTopicIndex(index, topicCount) {
    const max = Math.max(0, topicCount - 1);
    const numeric = Number(index);
    if (!Number.isFinite(numeric)) return 0;
    return Math.max(0, Math.min(numeric, max));
  }

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["arm5e", "sheet", "item"],
    position: { width: 500, height: 650 },
    dragDrop: [{ dragSelector: null, dropSelector: ".drop-labtext" }],
    actions: {
      previousTopic: ArM5eBookItemSheetV2.previousTopic,
      nextTopic: ArM5eBookItemSheetV2.nextTopic,
      addTopic: ArM5eBookItemSheetV2.addTopic,
      removeTopic: ArM5eBookItemSheetV2.removeTopic,
      planReading: ArM5eBookItemSheetV2.planReading,
      planCopy: ArM5eBookItemSheetV2.planCopy,
      showLabText: ArM5eBookItemSheetV2.showLabText,
      createTableOfContents: ArM5eBookItemSheetV2.createTableOfContents,
      itemDeleteConfirm: ArM5eItemSheetV2.itemDeleteConfirm,
      ...EnchantExtensionV2.actions
    }
  };

  /** @override */
  static TABS = {
    primary: {
      tabs: [
        { id: "description", label: "arm5e.sheet.description", cssClass: "item flexrow" },
        { id: "enchantments", label: "arm5e.sheet.item.enchantments", cssClass: "item" },
        { id: "effects", label: "arm5e.sheet.effects", cssClass: "item flexrow" }
      ],
      initial: "description"
    }
  };

  /** @override */
  static PARTS = {
    header: {
      template: "systems/arm5e/templates/item/parts/item-book-header-v2.hbs"
    },
    tabs: {
      template: "systems/arm5e/templates/generic/parts/ars-tab-navigation.hbs",
      classes: ["marginItemPart"]
    },
    description: {
      template: "systems/arm5e/templates/item/parts/item-book-description-v2.hbs"
    },
    enchantments: {
      template: "systems/arm5e/templates/item/parts/item-enchant-extension-v2.hbs"
    },
    effects: {
      template: "systems/arm5e/templates/item/parts/item-effects-v2.hbs"
    },
    footer: {
      template: "systems/arm5e/templates/item/parts/item-footer-v2.hbs"
    }
  };

  /** @override */
  getUserCache() {
    const cache = super.getUserCache();
    if (this.item.system.enchantments) {
      EnchantExtensionV2.getUserCacheEnchantments(cache, this.item);
    }
    return cache;
  }

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.tabs = this._prepareTabs("primary");
    if (!this.item.system.enchantments) {
      delete context.tabs.enchantments;
    } else {
      await EnchantExtensionV2.prepareEnchantmentContext(context, this.isEditable);
    }

    context.abilityKeysList = CONFIG.ARM5E.LOCALIZED_ABILITIES;

    context.noEdit = this.isEditable ? "" : "readonly";
    context.noSelect = this.isEditable ? "" : "disabled";

    // Build per-topic UI metadata and labText summaries
    context.system.topics = ArM5eBookItemSheetV2.#normalizedTopics(context.system.topics);

    let idx = 0;
    context.topicsUi = [];
    for (const topic of context.system.topics) {
      if (topic.category === "mastery" || topic.category === "labText") {
        context.topicsUi[idx] = { bookTypeEdit: "disabled" };
      } else {
        context.topicsUi[idx] = { bookTypeEdit: "" };
      }
      if (topic.category === "labText" && topic.labtextTitle !== "") {
        topic.labtext.summary = game.i18n.localize(
          context.config.lab.labTextType[topic.labtext.type]
        );
        topic.labtext.summary += `: ${topic.labtextTitle} - ${spellTechniqueLabel(
          topic.labtext
        )} ${spellFormLabel(topic.labtext)} ${topic.labtext.level}`;
      }
      idx++;
    }

    context.topicIdx = ArM5eBookItemSheetV2.#clampTopicIndex(
      this.item.getFlag("arm5e", "currentBookTopic") ?? 0,
      context.system.topics.length
    );
    context.currentTopicNumber = context.topicIdx + 1;
    context.currentTopic = context.system.topics[context.topicIdx] ?? null;
    context.topicNum = context.system.topics.length;

    return context;
  }

  /** @override */
  async _preparePartContext(partId, context, options) {
    if (["description", "enchantments", "effects"].includes(partId)) {
      context.tab = context.tabs?.[partId];
    }
    return super._preparePartContext(partId, context, options);
  }

  /** @override */
  _processFormData(event, form, formData) {
    let prepared = super._processFormData(event, form, formData);
    prepared = EnchantExtensionV2.processFormData(prepared, this.item);
    const submittedTopics = prepared.system?.topics;
    if (!submittedTopics) return prepared;

    const topics = ArM5eBookItemSheetV2.#normalizedTopics(this.item.system.topics);
    const topicEntries = Object.entries(submittedTopics)
      .filter(([key, value]) => Number.isInteger(Number(key)) && value && typeof value === "object")
      .sort(([a], [b]) => Number(a) - Number(b));

    for (const [key, value] of topicEntries) {
      const index = Number(key);
      const sourceTopic = foundry.utils.deepClone(topics[index]);
      if (!sourceTopic) continue;

      const mergedTopic = foundry.utils.mergeObject(sourceTopic, value, {
        inplace: false,
        insertKeys: true,
        insertValues: true,
        overwrite: true
      });

      if (mergedTopic.category === "mastery") {
        mergedTopic.type = "Tractatus";
      } else if (mergedTopic.category === "labText") {
        mergedTopic.labtextTitle = sourceTopic.labtextTitle;
        mergedTopic.labtext = sourceTopic.labtext;
      }

      topics[index] = mergedTopic;
    }

    prepared.system.topics = topics;
    return prepared;
  }

  /** @override */
  async _onRender(context, options) {
    await super._onRender(context, options);
    this.#dragDrop.forEach((d) => d.bind(this.element));
    this.element
      .querySelector(".book-category")
      ?.addEventListener("change", (e) => this._changeTopicCategory(e));
    this.element
      .querySelector(".book-type")
      ?.addEventListener("change", (e) => this._changeBookType(e));
    EnchantExtensionV2.wireListeners.call(this);
  }

  _canDragStart(selector) {
    return this.item?.isOwner && this.isEditable;
  }

  _canDragDrop(selector) {
    return this.item?.isOwner && this.isEditable;
  }

  _onDragStart(event) {}

  _onDragOver(event) {}

  #createDragDropHandlers() {
    return this.options.dragDrop.map((d) => {
      d.permissions = {
        dragstart: this._canDragStart.bind(this),
        drop: this._canDragDrop.bind(this)
      };
      d.callbacks = {
        dragstart: this._onDragStart.bind(this),
        dragover: this._onDragOver.bind(this),
        drop: this._onDrop.bind(this)
      };
      return new DragDrop.implementation(d);
    });
  }

  /** @override */
  async _onDrop(event) {
    event.preventDefault();
    const dropData = foundry.applications.ux.TextEditor.getDragEventData(event);
    const target = event.target;
    const dropTarget =
      target?.closest?.(".drop-labtext") ??
      (event.currentTarget?.classList?.contains("drop-labtext") ? event.currentTarget : null);

    if (dropData.type !== "Item" || !dropTarget || dropTarget?.dataset?.drop !== "labtext") {
      return super._onDrop(event);
    }

    const topics = ArM5eBookItemSheetV2.#normalizedTopics(this.item.system.topics);
    const index = ArM5eBookItemSheetV2.#clampTopicIndex(
      dropTarget?.dataset?.index ?? this.item.getFlag("arm5e", "currentBookTopic") ?? 0,
      topics.length
    );

    const labtext = await Item.implementation.fromDropData(dropData);
    if (labtext.type !== "spell" && labtext.type !== "laboratoryText") return;
    if (!topics[index]) return;

    const topicLabText = foundry.utils.deepClone(labtext.system);
    if (labtext.type === "spell") {
      topicLabText.type = "spell";
    }

    topics[index] = {
      type: null,
      art: null,
      key: null,
      option: null,
      spellName: null,
      category: "labText",
      labtextTitle: labtext.name,
      labtext: topicLabText
    };
    await this.item.update({ "system.topics": topics });
  }

  /** Called when the topic-category select changes */
  async _changeTopicCategory(event) {
    event.preventDefault();
    event.stopPropagation();
    const chosenTopic = event.target.value;
    const topics = ArM5eBookItemSheetV2.#normalizedTopics(this.item.system.topics);
    const index = ArM5eBookItemSheetV2.#clampTopicIndex(
      event.target.dataset.index ?? 0,
      topics.length
    );
    if (!topics[index]) return;
    const bookType = topics[index]?.type;
    let topic;
    if (chosenTopic === "ability") {
      topic = {
        type: bookType,
        art: null,
        key: "awareness",
        option: "",
        spellName: null,
        category: "ability",
        labtext: null,
        labtextTitle: ""
      };
    } else if (chosenTopic === "art") {
      topic = {
        type: bookType,
        art: "cr",
        key: null,
        option: null,
        category: "art",
        labtext: null,
        labtextTitle: ""
      };
    } else if (chosenTopic === "mastery") {
      topic = {
        type: "Tractatus",
        art: null,
        key: null,
        option: null,
        level: 0,
        spellName: "Mastered spell",
        category: "mastery",
        labtext: null,
        labtextTitle: ""
      };
    } else {
      topic = {
        type: null,
        art: null,
        key: null,
        option: null,
        spellName: null,
        category: "labText",
        labtext: null,
        labtextTitle: ""
      };
    }
    topics[index] = topic;
    await this.item.update({ "system.topics": topics });
  }

  /** Called when the book-type select changes */
  async _changeBookType(event) {
    event.preventDefault();
    event.stopPropagation();
    const chosenType = event.target.value;
    const topics = ArM5eBookItemSheetV2.#normalizedTopics(this.item.system.topics);
    const index = ArM5eBookItemSheetV2.#clampTopicIndex(
      event.target.dataset.index ?? 0,
      topics.length
    );
    const topic = topics[index];
    if (!topic) return;
    topic.type = chosenType;
    if (chosenType === "Tractatus") topic.level = 0;
    topics[index] = topic;
    await this.item.update({ "system.topics": topics });
  }

  // ─── Static Actions ───────────────────────────────────────────────────────

  static async previousTopic(event, target) {
    const newIndex = Number(target.dataset.index) - 1;
    if (newIndex < 0) return;
    await this.item.setFlag("arm5e", "currentBookTopic", newIndex);
  }

  static async nextTopic(event, target) {
    const newIndex = Number(target.dataset.index) + 1;
    if (newIndex > this.item.system.topics.length - 1) return;
    await this.item.setFlag("arm5e", "currentBookTopic", newIndex);
  }

  static async addTopic(event, target) {
    event.preventDefault();
    const topics = ArM5eBookItemSheetV2.#normalizedTopics(this.item.system.topics);
    const index = ArM5eBookItemSheetV2.#clampTopicIndex(target.dataset.index ?? 0, topics.length);
    const currentDate = game.settings.get("arm5e", "currentDate");
    const currentTopic = topics[index];
    const newTopic = {
      author: currentTopic?.author ?? "",
      language: currentTopic?.language ?? "",
      year: currentDate.year,
      season: currentDate.season,
      art: "cr",
      key: null,
      option: null,
      spellName: null,
      category: "art",
      quality: 1,
      level: 0,
      mastery: false,
      labtext: null,
      labtextTitle: ""
    };
    const newIdx = topics.length;
    topics.push(newTopic);
    // await this.item.setFlag("arm5e", "currentBookTopic", newIdx);
    await this.item.update({ "flags.arm5e.currentBookTopic": newIdx, "system.topics": topics });
  }

  static async removeTopic(event, target) {
    event.preventDefault();
    const topics = ArM5eBookItemSheetV2.#normalizedTopics(this.item.system.topics);
    const idx = ArM5eBookItemSheetV2.#clampTopicIndex(target.dataset.index ?? 0, topics.length);
    if (!topics.length) return;
    let confirm = true;
    let flavor = FLAVORS.NEUTRAL;
    if (this.item.isOwned) flavor = ArM5eActorSheetV2.getFlavor(this.item.actor.type);
    if (!event.shiftKey && game.settings.get("arm5e", "confirmDelete")) {
      confirm = await getConfirmation(
        game.i18n.localize("arm5e.dialog.delete-topic"),
        game.i18n.localize("arm5e.dialog.delete-question"),
        flavor
      );
    }
    if (confirm) {
      topics.splice(idx, 1);
      await this.item.update({
        "system.topics": topics,
        "flags.arm5e.currentBookTopic": Math.max(0, Math.min(idx - 1, topics.length - 1))
      });
    }
  }

  static async planReading(event, target) {
    event.preventDefault();
    if (!this.item?.system?.readBook) return;
    // const dataset = ArM5eBookItemSheetV2.#resolveTopicActionDataset(target);
    const index = parseInt(target.dataset.index) ?? 0;
    await this.item.system.readBook(this.item, { index });
  }

  static async planCopy(event, target) {
    event.preventDefault();
    if (!this.item?.system?.copyBook) return;
    // const dataset = ArM5eBookItemSheetV2.#resolveTopicActionDataset(target);
    const index = parseInt(target.dataset.index) ?? 0;
    await this.item.system.copyBook(this.item, { index });
  }

  static async showLabText(event, target) {
    const index = parseInt(target.dataset.index) ?? 0;
    const topic = this.item.system.topics[index];
    const labText = new ArM5eItem(
      {
        name: topic.labtextTitle,
        type: "laboratoryText",
        ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER },
        editable: false,
        system: topic.labtext,
        [`flags.${CONFIG.ARM5E.SYSTEM_ID}.readonly`]: "true"
      },
      { temporary: true }
    );
    labText.sheet.render(true);
  }

  static async createTableOfContents(event, target) {
    event.preventDefault();
    let desc = this.item.system.description;
    if (event.shiftKey) {
      desc += BookSchema.getTableOfContentsVerbose(this.item.system);
    } else {
      desc += BookSchema.getTableOfContentsSynthetic(this.item.system);
    }
    await this.item.update({ "system.description": desc });
  }
}
