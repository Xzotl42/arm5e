import { ArM5eActor } from "../actor/actor.js";
import { FLAVORS } from "../constants/ui.js";
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const { DragDrop } = foundry.applications.ux;
import ArM5eActiveEffect from "../helpers/active-effects.js";
import { getTopicDescription } from "../helpers/book-topic.js";
import { computeLevel, spellFormLabel, spellTechniqueLabel } from "../helpers/magic.js";
import { effectToLabText } from "../item/item-converter.js";
import { ArM5eItem } from "../item/item.js";
import { BookSchema } from "../schemas/bookSchema.js";
import { boolOption } from "../schemas/commonSchemas.js";
import { DiaryEntrySchema } from "../schemas/diarySchema.js";
import { LabTextSchema } from "../schemas/labTextSchema.js";
import { compareTopics, debug, getDataset, log } from "../tools/tools.js";
import { DocumentPicker } from "./document-picker.js";

/**
 * Plain data-carrier object that holds the mutable UI state of the Scriptorium application.
 * An instance is created once per Scriptorium session and kept on `this.object`.
 * It is mutated via `_updateData()` on every form-submit / action, then serialised into
 * the Handlebars context in `_prepareContext()`.
 *
 * Three independent activities share this object but operate on disjoint sub-trees:
 *  - `reading`  – a single reader + a single book
 *  - `writing`  – a single writer + a single book (possibly new)
 *  - `copying`  – a single scribe + an array of books / lab-texts
 *
 * `labTexts` (top-level) holds lab-texts queued for the *writing/translating* workflow.
 */
export class ScriptoriumObject {
  seasons = CONFIG.ARM5E.seasons;

  abilityKeysList = CONFIG.ARM5E.LOCALIZED_ABILITIES;

  arts = CONFIG.ARM5E.magic.arts;

  techs = CONFIG.ARM5E.magic.techniques;

  forms = CONFIG.ARM5E.magic.forms;

  bookTopics = CONFIG.ARM5E.books.categories;

  bookTypes = CONFIG.ARM5E.books.types;

  year = game.settings.get("arm5e", "currentDate").year;

  season = game.settings.get("arm5e", "currentDate").season;

  copying = {
    scribe: { id: null },
    books: [
      // {
      //   id: null,
      //   uuid: null,
      //   name: game.i18n.localize("arm5e.activity.book.title"),
      //   system: {
      //     topics: [
      //       {
      //         category: "ability",
      //         type: "Summa",
      //         author: game.i18n.localize("arm5e.generic.unknown"),
      //         language: game.i18n.localize("arm5e.skill.commonCases.latin"),
      //         quality: 1,
      //         level: 1,
      //         key: "",
      //         option: "",
      //         spellName: "",
      //         art: "",
      //         spellTech: "cr",
      //         spellForm: "an",
      //         year: this.year,
      //         season: this.season,
      //         flawed: false
      //       }
      //     ],
      //     topicIndex: 0
      //   }
      // }
    ],
    topicType: "Summa",
    quickCopy: false,
    individualCopies: false,
    labTexts: []
  };

  reading = {
    reader: { id: null },
    book: {
      id: null,
      uuid: null,
      name: game.i18n.localize("arm5e.activity.book.title"),
      system: {
        topics: [
          {
            category: "ability",
            type: "Summa",
            author: game.i18n.localize("arm5e.generic.unknown"),
            language: game.i18n.localize("arm5e.skill.commonCases.latin"),
            quality: 1,
            level: 1,
            key: "animalHandling",
            option: "",
            spellName: "",
            art: "",
            spellTech: "cr",
            spellForm: "an",
            year: this.year,
            season: this.season,
            cappedGain: false
          }
        ],
        topicIndex: 0
      }
    }
  };

  writing = {
    writer: { id: null },
    book: {
      id: null,
      uuid: null,
      name: game.i18n.localize("arm5e.activity.book.title"),
      system: {
        topics: [
          {
            category: "ability",
            type: "Summa",
            author: game.i18n.localize("arm5e.generic.unknown"),
            language: game.i18n.localize("arm5e.skill.commonCases.latin"),
            quality: 1,
            level: 1,
            key: "animalHandling",
            option: "",
            name: "",
            spellName: "",
            art: "",
            spellTech: "cr",
            spellForm: "an",
            labtext: null,
            year: this.year,
            season: this.season
          }
        ],
        topicIndex: -1
      }
    }
  };

  labTexts = [];
}

/**
 * The Scriptorium is a tool window (ApplicationV2) for book-related activities:
 *   - **Reading**  : a character studies a book and gains XP.
 *   - **Writing**  : a character authors a new book or appends a topic to an existing one.
 *   - **Copying**  : a scribe reproduces one or more books / lab-texts.
 *
 * Flow per activity:
 *  1. Drop an actor (reader / writer / scribe) onto the relevant drop-zone.
 *  2. Drop a book (or lab-text) onto the relevant drop-zone.
 *  3. Adjust parameters (season, year, topic, language …).
 *  4. Click "Create activity" to generate a `diaryEntry` item on the actor.
 *
 * State is held in a {@link ScriptoriumObject} stored on `this.object`.
 * Every form‐submit calls `#onSubmitHandler` which merges the changed fields
 * back into `this.object` and re-renders.
 */
export class Scriptorium extends HandlebarsApplicationMixin(ApplicationV2) {
  #dragDrop;

  /**
   * @param {ScriptoriumObject} data  - Mutable state object for this session.
   * @param {object}            options - ApplicationV2 options.
   */
  constructor(data, options = {}) {
    super(options);
    this.object = data;

    data.selected = null;
    this.#dragDrop = this.#createDragDropHandlers();
  }

  /** @override */
  static DEFAULT_OPTIONS = {
    tag: "form",
    classes: ["arm5e", "sheet", "scriptorium"],
    window: {
      title: "Scriptorium"
    },
    position: {
      width: 600,
      height: "auto"
    },
    form: {
      handler: Scriptorium.#onSubmitHandler,
      submitOnChange: true,
      closeOnSubmit: false
    },
    dragDrop: [
      { dragSelector: null, dropSelector: ".drop-book" },
      { dragSelector: null, dropSelector: ".drop-reader" },
      { dragSelector: null, dropSelector: ".drop-scribe" },
      { dragSelector: null, dropSelector: ".drop-writer" },
      { dragSelector: null, dropSelector: ".append-book" },
      { dragSelector: null, dropSelector: ".add-labtext" }
    ],
    actions: {
      setDate: Scriptorium.setDate,
      unlinkReadBook: Scriptorium.unlinkReadBook,
      unlinkWriteBook: Scriptorium.unlinkWriteBook,
      removeLabText: Scriptorium.removeLabText,
      removeLabTextCopy: Scriptorium.removeLabTextCopy,
      unlinkReader: Scriptorium.unlinkReader,
      unlinkWriter: Scriptorium.unlinkWriter,
      unlinkScribe: Scriptorium.unlinkScribe,
      createReadingActivity: Scriptorium.createReadingActivity,
      createWritingActivity: Scriptorium.createWritingActivity,
      createCopyingActivity: Scriptorium.createCopyingActivity,
      handleSection: Scriptorium.handleSection,
      nextTopic: Scriptorium.nextTopic,
      previousTopic: Scriptorium.previousTopic,
      nextTopicToCopy: Scriptorium.nextTopicToCopy,
      previousTopicToCopy: Scriptorium.previousTopicToCopy,
      removeBook: Scriptorium.removeBook,
      selectReader: Scriptorium.selectReader,
      selectScribe: Scriptorium.selectScribe,
      selectWriter: Scriptorium.selectWriter,
      selectReadingBook: Scriptorium.selectReadingBook,
      selectWritingBook: Scriptorium.selectWritingBook,
      selectCopyingBook: Scriptorium.selectCopyingBook
    }
  };

  /** @override */
  static PARTS = {
    header: {
      template: "systems/arm5e/templates/generic/parts/scriptorium-header.hbs"
    },
    tabs: {
      template: "systems/arm5e/templates/generic/parts/ars-tab-navigation.hbs",
      classes: ["greenBar", "marginsides32"]
    },
    reading: {
      template: "systems/arm5e/templates/generic/parts/scriptorium-reading.html",
      scrollable: ["remember"]
    },
    writing: {
      template: "systems/arm5e/templates/generic/parts/scriptorium-writing.html",
      scrollable: ["remember"]
    },
    copying: {
      template: "systems/arm5e/templates/generic/parts/scriptorium-copying.html",
      scrollable: ["remember"]
    },
    footer: {
      template: "systems/arm5e/templates/generic/parts/scriptorium-footer.hbs"
    }
  };

  /** @override */
  static TABS = {
    primary: {
      tabs: [
        { id: "reading", label: "arm5e.activity.reading", cssClass: "item flexrow" },
        { id: "writing", label: "arm5e.activity.writing", cssClass: "item flexrow" },
        { id: "copying", label: "arm5e.activity.copying", cssClass: "item flexrow" }
      ],
      initial: "reading"
    }
  };

  _canDragDrop(selector) {
    return true;
  }

  _canDragStart(selector) {
    return true;
  }

  _onDragStart(event) {}

  _onDragOver(event) {}

  /**
   * Create drag-and-drop workflow handlers for this Application
   * @returns {DragDrop[]}
   */
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

  /** @returns {DragDrop[]} */
  get dragDrop() {
    return this.#dragDrop;
  }

  /**
   * Unregister this window from every linked actor's `apps` registry so that those
   * actors stop re-rendering side-effects on this application after it closes.
   * @override
   */
  async close(options = {}) {
    if (this.object?.reading?.reader?.id) {
      const reader = game.actors.get(this.object.reading.reader.id);
      if (reader) delete reader.apps[this.options.uniqueId];
    }
    if (this.object?.writing?.writer?.id) {
      const writer = game.actors.get(this.object.writing.writer.id);
      if (writer) delete writer.apps[this.options.uniqueId];
    }
    if (this.object?.copying?.scribe?.id) {
      const scribe = game.actors.get(this.object.copying.scribe.id);
      if (scribe) delete scribe.apps[this.options.uniqueId];
    }
    return super.close(options);
  }

  /**
   * Handle items / actors dropped onto the various drop-zones.
   * Dispatch based on `event.currentTarget.dataset.drop`:
   *   "book"        → reading book
   *   "append-book" → writing book
   *   "add-labtext" → lab-text for translating
   *   "copy-book"   → book / lab-text for copying queue
   *   "reader" / "writer" / "scribe" → set the respective actor
   */
  async _onDrop(event) {
    try {
      const dropData = foundry.applications.ux.TextEditor.getDragEventData(event);
      if (dropData.type == "Item") {
        // If (this.item.system.activity === "teaching" || this.item.system.activity === "training") {

        if (event.currentTarget.dataset.drop === "book") {
          const book = await Item.implementation.fromDropData(dropData);
          if (book.type === "book") {
            await this._setReadingBook(book);
          }
        } else if (event.currentTarget.dataset.drop === "append-book") {
          const book = await Item.implementation.fromDropData(dropData);
          if (book.type === "book") {
            await this._setWritingBook(book);
          }
        } else if (event.currentTarget.dataset.drop === "add-labtext") {
          const text = await Item.implementation.fromDropData(dropData);
          if (text.type == "laboratoryText") {
            await this._addLabText(text);
          }
        } else if (event.currentTarget.dataset.drop === "copy-book") {
          const book = await Item.implementation.fromDropData(dropData);
          if (book.type === "book") {
            await this._addBookToCopy(book, dropData.topicIdx);
          } else if (book.type === "laboratoryText") {
            await this._addLabTextToCopy(book);
          }
        }
      } else if (dropData.type == "Actor") {
        if (event.currentTarget.dataset.drop === "reader") {
          const reader = await Actor.implementation.fromDropData(dropData);
          if (reader.type === "player" || reader.type === "npc") {
            await this._setReader(reader);
          }
        } else if (event.currentTarget.dataset.drop === "writer") {
          const writer = await Actor.implementation.fromDropData(dropData);
          if (writer.type === "player" || writer.type === "npc") {
            await this._setWriter(writer);
          }
        } else if (event.currentTarget.dataset.drop === "scribe") {
          const scribe = await Actor.implementation.fromDropData(dropData);
          if (scribe.type === "player" || scribe.type === "npc") {
            await this._setScribe(scribe);
          }
        }
      }
    } catch (err) {
      console.error("Scriptorium | _onDrop failed:", err);
      ui.notifications.error(game.i18n.localize("arm5e.scriptorium.msg.error"));
      this.render();
    }
  }

  /**
   * Retrieve the scriptorium sub-tree from the per-user session cache.
   * If the cache entry is absent or does not yet contain the scriptorium key it is
   * initialised and written back immediately.
   *
   * @returns {object} The `usercache.scriptorium` sub-object (with `sections.visibility`).
   */
  getUserCache() {
    let usercache = JSON.parse(sessionStorage.getItem(`usercache-${game.user.id}`));
    // Guard against a completely missing cache entry (first visit or cleared storage).
    if (!usercache) {
      usercache = {
        scriptorium: {
          sections: {
            visibility: {
              scriptorium: {}
            }
          }
        }
      };
    } else if (usercache.scriptorium == undefined) {
      usercache.scriptorium = {
        sections: {
          visibility: {
            scriptorium: {}
          }
        }
      };
    }

    sessionStorage.setItem(`usercache-${game.user.id}`, JSON.stringify(usercache));
    return usercache.scriptorium;
  }

  /**
   * Merge an object of dot-notation update paths into `this.object` and re-render.
   * Mirrors the pattern used by Foundry's own document update helpers.
   * @param {object} updateData - Flat dot-notation keys (e.g. `"reading.reader.id": null`).
   */
  async _updateData(updateData) {
    const expanded = foundry.utils.expandObject(updateData);
    if (expanded.reading?.book?.system?.topics) {
      const topics = this.object.reading.book.system.topics;
      foundry.utils.mergeObject(topics, expanded.reading.book.system.topics);
      delete expanded.reading.book.system.topics;
    }
    if (expanded.writing?.book?.system?.topics) {
      const topics = this.object.writing.book.system.topics;
      foundry.utils.mergeObject(topics, expanded.writing.book.system.topics);
      delete expanded.writing.book.system.topics;
    }
    if (expanded.copying?.books) {
      const bookIndexes = Object.keys(expanded.copying.books);
      for (const index of bookIndexes) {
        if (expanded.copying.books[index].system?.topics) {
          const topics = this.object.copying.books[index].system.topics;
          foundry.utils.mergeObject(topics, expanded.copying.books[index].system.topics, {
            recursive: true
          });
          delete expanded.copying.books[index].system.topics;
        }
      }
      const books = this.object.copying.books;
      foundry.utils.mergeObject(books, expanded.copying.books);
      delete expanded.copying.books;
    }
    foundry.utils.mergeObject(this.object, expanded, { recursive: true });
    this.render();
  }

  /**
   * Build the base context shared by all parts.
   * Each part's context is further enriched by `_preparePartContext`.
   * @override
   */
  async _prepareContext(options) {
    const context = foundry.utils.expandObject(this.object);
    context.tabs = this._prepareTabs("primary");
    context.ui = {
      ...this.getUserCache(),
      reading: { warning: [], error: false, createPossible: "disabled" },
      writing: { warning: [], error: false, createPossible: "disabled" },
      copying: { warning: [], error: false, createPossible: "disabled" },
      editItem: ""
    };
    const currentDate = game.settings.get("arm5e", "currentDate");
    context.curYear = currentDate.year;
    context.curSeason = currentDate.season;
    context.isGM = game.user.isGM;
    return context;
  }

  // --- per-part context helpers (called from _preparePartContext) ---

  /**
   * Enrich `context` with reading-tab data:
   * validates reader abilities / languages, determines whether the reader
   * is skilled enough (or too skilled) for the current topic, and sets
   * `context.ui.reading` warning / error / createPossible flags.
   * @param {object} context - Shared context object (mutated in-place).
   */
  _prepareReadingContext(context) {
    if (context.reading.book.uuid !== null) {
      context.ui.canEditBook = "readonly";
      context.ui.disabledBook = "disabled";
    }

    let maxLevel = 99;
    const topicIndex = Number(context.reading.book.system.topicIndex);
    // For convenience
    context.topicIndex = topicIndex;
    const currentTopic = context.reading.book.system.topics[topicIndex];
    if (currentTopic.type === "Summa" && currentTopic.level) {
      maxLevel = currentTopic.level;
    }
    context.reading.book.currentTopic = currentTopic;
    // topicIndex + 1 is always a number; || 1 guards against topics array being empty.
    context.currentTopicNumber = topicIndex + 1;
    context.topicNum = context.reading.book.system.topics.length || 1;

    // READING SECTION

    if (context.reading.reader?.id) {
      context.ui.canEditReader = "readonly";
      context.ui.disabledReader = "disabled";
      if (currentTopic.category == "mastery") {
        context.ui.reading.disableType = "disabled";
      }
      let reader = game.actors.get(context.reading.reader.id);
      context.reading.reader.name = reader.name;
      // Get known languages
      context.reading.reader.languages = reader.system.abilities
        .filter((e) => {
          return (
            (e.system.key === "livingLanguage" || e.system.key === "deadLanguage") &&
            e.system.finalScore >= 4
          );
        })
        .map((lang) => {
          return { id: lang.id, name: lang.name, score: lang.system.finalScore };
        });

      // Always get spell list to have at least one spell selected
      context.reading.reader.spells = reader.system.spells
        .filter((s) => {
          return (
            s.system.technique.value === currentTopic.spellTech &&
            s.system.form.value === currentTopic.spellForm
          );
        })
        .map((s) => {
          return {
            id: s.id,
            name: s.name,
            technique: s.system.technique.value,
            form: s.system.form.value
          };
        });
      switch (currentTopic.category) {
        case "ability": {
          let availableAbilities = foundry.utils.duplicate(
            CONFIG.ARM5E.LOCALIZED_ABILITIES_ENRICHED
          );
          for (let a of reader.system.abilities) {
            let found = availableAbilities.findIndex(
              (e) => e.system.key == a.system.key && e.system.option == a.system.option
            );
            const computedKey = a.system.getComputedKey();
            if (found >= 0) {
              availableAbilities[found]._id = a._id;
              availableAbilities[found].system.xp = a.system.xp;
              availableAbilities[found].secondaryId = false;
              availableAbilities[found].system.score = a.system.derivedScore;
            } else {
              availableAbilities.push({
                _id: a._id,
                secondaryId: true,
                name: a.name,
                system: {
                  key: a.system.key,
                  xp: a.system.xp,
                  score: a.system.derivedScore,
                  option: a.system.option,
                  category: a.system.category
                }
              });
            }
          }
          // Reader.system.abilities.map((a) => {
          //   return {
          //     id: a.id,
          //     key: a.system.key,
          //     option: a.system.option,
          //     name: game.i18n.format(
          //       CONFIG.ARM5E.LOCALIZED_ABILITIES[a.system.key]
          //         ? CONFIG.ARM5E.LOCALIZED_ABILITIES[a.system.key].mnemonic
          //         : "Unknown",
          //       {
          //         option: a.system.option
          //       }
          //     ),
          //     score: a.system.finalScore
          //   };
          // });

          let filteredAbilities = availableAbilities.filter((a) => a.system.score < maxLevel);
          // Does the reader has the book topic ability?
          let ability = availableAbilities.find((a) => {
            return (
              a.system.key === currentTopic.key &&
              (currentTopic.option === null || a.system.option === currentTopic.option)
            );
          });

          if (ability) {
            // Is the reader low skilled enough?
            if (filteredAbilities.find((a) => a._id == ability._id)) {
              context.reading.reader.ability = ability._id;
              context.reading.reader.abilities = [ability];
            } else {
              context.ui.editItem = "disabled";
              context.ui.reading.warning.push(
                game.i18n.localize("arm5e.scriptorium.msg.tooSkilled")
              );
              context.ui.reading.error = true;
            }
          } else {
            // Check if the ability is not found because of the option field
            filteredAbilities = filteredAbilities.filter((a) => a.system.key == currentTopic.key);
            if (filteredAbilities.length > 0) {
              if (filteredAbilities.length > 1) {
                context.ui.reading.warning.push(
                  game.i18n.format("arm5e.scriptorium.msg.whichItem", {
                    item: game.i18n.localize("arm5e.sheet.ability")
                  })
                );
              }
              // If (!context.reading.reader.ability) {
              //   context.reading.reader.ability = filteredAbilities[0]._id.length ??
              // }
              context.reading.reader.abilities = filteredAbilities;
              // FilteredAbilities[0].name = game.i18n.format(
              //   CONFIG.ARM5E.LOCALIZED_ABILITIES[currentTopic.key].mnemonic,
              //   { option: currentTopic.option }
              // );
            } else {
              context.ui.editItem = "disabled";
              context.ui.reading.warning.push(
                game.i18n.format("arm5e.scriptorium.msg.missingItem", {
                  item: game.i18n.localize("arm5e.sheet.ability")
                })
              );
              context.ui.reading.error = true;
            }
            // Else {
            //   context.ui.editItem = "disabled";
            //   context.ui.warning = "arm5e.scriptorium.msg.missingItem";
            //   context.ui.warningParam = game.i18n.localize("arm5e.sheet.ability");
            //   context.error = true;
            // }
            // context.error = true;
          }

          break;
        }
        case "art": {
          break;
        }
        case "mastery": {
          if (context.reading.reader.spells.length === 0) {
            context.ui.editItem = "disabled";
            context.ui.reading.warning.push(
              game.i18n.format("arm5e.scriptorium.msg.missingItem", {
                item: game.i18n.localize("arm5e.sheet.spell")
              })
            );
            context.ui.reading.error = true;
          } else {
            if (!context.reading.reader.spell) {
              context.reading.reader.spell = context.reading.reader.spells[0].id;
            }
          }
          break;
        }
        case "labText": {
          context.ui.editItem = "disabled";
          context.ui.reading.warning.push(game.i18n.localize("arm5e.scriptorium.msg.labText"));
          context.ui.reading.error = true;
          break;
        }
        default:
          context.ui.reading.warning.push("Error");
          context.ui.reading.error = true;
          break;
      }
      this.checkReading(context, reader);
      // Log(false, `Scriptorium reading data: ${JSON.stringify(context.reading)}`);
    } else {
      context.ui.reading.error = true;
    }
    if (context.ui.reading.error === false) {
      context.ui.reading.createPossible = "";
    }
  }

  /**
   * Enrich `context` with writing-tab data:
   * computes writing score, quality, duration, available abilities/arts/spells,
   * and sets `context.ui.writing` warning / error / createPossible flags.
   * @param {object} context - Shared context object (mutated in-place).
   */
  _prepareWritingContext(context) {
    if (context.writing.book.uuid !== null) {
      context.ui.canEditTitle = "readonly";
    }
    // New topic => writing
    context.newTopicIndex = context.writing.book.system.topics.length - 1;
    const newTopic = context.writing.book.system.topics[context.newTopicIndex];
    context.writing.book.newTopic = newTopic;

    // WRITING section
    if (context.writing.writer?.id) {
      let maxLevel = 99;
      if (newTopic.type === "Summa" && newTopic.level) {
        maxLevel = newTopic.level;
      }
      context.ui.canEditWriter = "readonly";
      context.ui.disabledWriter = "disabled";
      let writer = game.actors.get(context.writing.writer.id);
      const activeEffects = writer.appliedEffects;
      context.writing.writer.writingBonus = 0;
      const writingEffects = ArM5eActiveEffect.findAllActiveEffectsWithTypeAndSubtypeFiltered(
        activeEffects,
        "activities",
        "writing"
      );
      for (const e of writingEffects) {
        context.writing.writer.writingBonus += e.changes.reduce(
          (res, current) => (res += Number(current.value)),
          context.writing.writer.writingBonus
        );
      }
      if (newTopic.category == "mastery") {
        context.ui.writing.disableType = "disabled";
      }
      context.writing.writer.name = writer.name;
      // Get known languages
      context.writing.writer.languages = writer.system.abilities
        .filter((e) => {
          return (
            (e.system.key === "livingLanguage" || e.system.key === "deadLanguage") &&
            e.system.finalScore >= 5
          );
        })
        .map((lang) => {
          return {
            id: lang.id,
            name: lang.name,
            score: lang.system.finalScore,
            spec: lang.system.speciality,
            label: `${lang.name} (${lang.system.finalScore})`
          };
        });

      if (context.writing.writer.languages.length) {
        if (!context.writing.writer.language) {
          context.writing.writer.language = context.writing.writer.languages[0].id;
          context.writing.writer.languageSpec = context.writing.writer.languages[0].spec;
          context.writing.writer.languageSpecApply = false;
        }
        let writeScore = writer.items.get(context.writing.writer.language).system.finalScore;
        if (context.writing.writer.languageSpecApply) writeScore++;
        if (newTopic.category === "labText") {
          context.writing.writer.writingScoreLabel = game.i18n.localize(
            "arm5e.scriptorium.writer.writingScoreLabel2"
          );
          context.writing.writer.writingScore = writeScore * 20;
        } else {
          context.writing.writer.writingScoreLabel = game.i18n.localize(
            "arm5e.scriptorium.writer.writingScoreLabel"
          );
          context.writing.writer.writingScore =
            writeScore + writer.system.characteristics.com.value;
        }
      } else {
        context.writing.writer.writingScore = 0;
      }

      // Always get spell list to have at least one spell selected
      context.writing.writer.filteredSpells = writer.system.spells
        .filter((s) => {
          return s.system.finalScore >= 2;
        })
        .map((s) => {
          return {
            id: s.id,
            name: s.name,
            mastery: s.system.finalScore,
            label: `${s.name} (${s.system.finalScore})`
          };
        });
      let qualityBonus = 0;
      let work = 0;
      switch (newTopic.category) {
        case "ability": {
          context.writing.filteredAbilities = writer.system.abilities
            .filter((e) => e.system.derivedScore >= 2)
            .map((s) => {
              const scoreBonus = writer.system.bonuses.skills[s.system.getComputedKey()].bonus;
              const scoreLabel = scoreBonus
                ? `${s.system.derivedScore} + ${scoreBonus}`
                : `${s.system.derivedScore}`;
              return {
                id: s._id,
                name: s.name,
                system: s.system,
                label: `${s.name} (${scoreLabel})`
              };
            });
          //
          //   context.writing.book.ability;
          if (context.writing.filteredAbilities.length) {
            if (!context.writing.writer.ability) {
              context.writing.writer.ability = context.writing.filteredAbilities[0].id;
            }

            let ab = writer.items.get(context.writing.writer.ability);
            context.writing.book.system.topics[context.newTopicIndex].maxLevel = Math.round(
              ab.system.derivedScore / 2
            );

            context.writing.book.system.topics[context.newTopicIndex].key = ab.system.key;
            context.writing.book.system.topics[context.newTopicIndex].option = ab.system.option;
            if (newTopic.type === "Summa") {
              // Clamp level before computing bonus so qualityBonus is never negative
              context.writing.book.system.topics[context.newTopicIndex].level = Math.min(
                context.writing.book.system.topics[context.newTopicIndex].level,
                context.writing.book.system.topics[context.newTopicIndex].maxLevel
              );
              qualityBonus =
                (context.writing.book.system.topics[context.newTopicIndex].maxLevel -
                  context.writing.book.system.topics[context.newTopicIndex].level) *
                3;
              work = context.writing.book.system.topics[context.newTopicIndex].level * 5;
            }
          } else {
            // BUG-FIX: was incorrectly writing to context.ui.reading instead of context.ui.writing
            context.ui.writing.warning.push(
              game.i18n.localize("arm5e.scriptorium.writer.nothingToWrite")
            );
            context.ui.writing.error = true;
          }
          // Log(false, `writer.ability: ${context.writing.writer.ability}`);
          break;
        }
        case "art": {
          let tech = Object.entries(writer.system.arts.techniques)
            .map((e) => {
              const scoreLabel = e[1].bonus
                ? `${e[1].derivedScore} + ${e[1].bonus}`
                : `${e[1].derivedScore}`;
              return {
                id: e[0],
                score: e[1].derivedScore,
                label: `${e[1].label} (${scoreLabel})`
              };
            })
            .filter((e) => e.score >= 5);
          let forms = Object.entries(writer.system.arts.forms)
            .map((e) => {
              const scoreLabel = e[1].bonus
                ? `${e[1].derivedScore} + ${e[1].bonus}`
                : `${e[1].derivedScore}`;
              return {
                id: e[0],
                score: e[1].derivedScore,
                label: `${e[1].label} (${scoreLabel})`
              };
            })
            .filter((e) => e.score >= 5);
          context.writing.filteredArts = tech.concat(forms);
          if (context.writing.filteredArts.length) {
            if (!context.writing.writer.art) {
              context.writing.writer.art = context.writing.filteredArts[0].id;
            }
            context.writing.book.system.topics[context.newTopicIndex].maxLevel = Math.round(
              writer.getArtScore(context.writing.writer.art).derivedScore / 2
            );
            if (newTopic.type === "Summa") {
              // Clamp level before computing bonus so qualityBonus is never negative
              context.writing.book.system.topics[context.newTopicIndex].level = Math.min(
                context.writing.book.system.topics[context.newTopicIndex].level,
                context.writing.book.system.topics[context.newTopicIndex].maxLevel
              );
              qualityBonus =
                context.writing.book.system.topics[context.newTopicIndex].maxLevel -
                context.writing.book.system.topics[context.newTopicIndex].level;
              work = context.writing.book.system.topics[context.newTopicIndex].level;
            }
          } else {
            context.ui.writing.warning.push(
              game.i18n.localize("arm5e.scriptorium.writer.noQualifyingArts")
            );
            context.ui.writing.error = true;
          }
          break;
        }
        case "mastery": {
          if (context.writing.writer.filteredSpells.length === 0) {
            context.ui.editItem = "disabled";
            context.ui.writing.warning.push(
              game.i18n.format("arm5e.scriptorium.msg.missingItem", {
                item: game.i18n.localize("arm5e.sheet.spell")
              })
            );
            context.ui.writing.error = true;
          } else {
            if (!context.writing.writer.spell) {
              context.writing.writer.spell = context.writing.writer.filteredSpells[0].id;
            }
            let spell = context.writing.writer.filteredSpells.find(
              (e) => e.id == context.writing.writer.spell
            );
            context.writing.book.system.topics[context.newTopicIndex].maxLevel = Math.round(
              spell.mastery / 2
            );
            qualityBonus = 0;
          }
          break;
        }
        case "labText": {
          context.writing.labTextTotal = 0;
          for (let txt of context.labTexts) {
            context.writing.labTextTotal += txt.level;
          }
          break;
        }
      }
      // Quality bonus cannot be higher than twice the original bonus.
      // Quality bonus formula: Com+6+bonus is the base; Summa reduces bonus by (maxLevel-level)*factor.
      // Skip for labText topics — quality is not meaningful there (no Summa/Tractatus concept).
      if (newTopic.category !== "labText") {
        context.writing.book.system.topics[context.newTopicIndex].quality = Math.min(
          2 * (writer.system.characteristics.com.value + 6 + context.writing.writer.writingBonus),
          writer.system.characteristics.com.value +
            6 +
            context.writing.writer.writingBonus +
            qualityBonus
        );
      }

      // Duration in seasons. Tractatus always takes 1 season.
      // For labText, work=0 so this yields 0 seasons (translating uses a dedicated entry builder).
      // CAUTION: writingScore=0 (no qualifying language) causes Infinity/NaN here.
      if (newTopic.type === "Tractatus") {
        context.writing.writer.duration = 1;
      } else {
        context.writing.writer.duration = Math.ceil(work / context.writing.writer.writingScore);
      }
      this.checkWriting(context, writer);
      // Log(false, `Scriptorium writing data: ${JSON.stringify(context.writing)}`);
    } else {
      context.ui.writing.error = true;
    }
    if (context.ui.writing.error === false) {
      context.ui.writing.createPossible = "";
    }
  }

  /**
   * Enrich `context` with copying-tab data:
   * computes scribe writing speed, copy duration, final qualities, and sets
   * `context.ui.copying` warning / error / createPossible flags.
   * @param {object} context - Shared context object (mutated in-place).
   */
  _prepareCopyingContext(context) {
    if (context.copying.books.length) {
      context.ui.canEditBook = "readonly";
      context.ui.disabledBook = "disabled";
    }
    context.copying.copyTypes = {
      ...CONFIG.ARM5E.books.types,
      labText: game.i18n.localize("TYPES.Item.laboratoryText")
    };
    // Copied topic
    for (const book of context.copying.books) {
      const copyingTopicIndex = book.system.topicIndex;
      // Same correction as in _prepareReadingContext: arithmetic never returns null/undefined.
      book.currentTopicToCopyNumber = copyingTopicIndex + 1;
      book.copyTopicNum = book.system.topics.length || 1;
      book.currentTopic = book.system.topics[copyingTopicIndex];
    }

    // COPYING SECTION

    if (context.copying.scribe?.id) {
      context.ui.canEditScribe = "readonly";
      context.ui.disabledScribe = "disabled";
      // If (copyTopic.category == "mastery") {
      context.ui.copying.disableType = "disabled";
      // }
      let scribe = game.actors.get(context.copying.scribe.id);
      context.copying.scribe.name = scribe.name;
      // Get known languages
      context.copying.scribe.languages = scribe.system.abilities
        .filter((e) => {
          return (
            (e.system.key === "livingLanguage" || e.system.key === "deadLanguage") &&
            e.system.finalScore >= 3
          );
        })
        .map((lang) => {
          return {
            id: lang.id,
            name: lang.name,
            score: lang.system.finalScore,
            label: `${lang.name} (${lang.system.finalScore})`
          };
        });
      const scribeSkill = scribe.getAbilityStats("profession", "Scribe");
      context.copying.duration = 0;
      context.copying.scribe.speciality = scribeSkill.speciality;
      context.copying.scribe.score = scribeSkill.score;
      if (context.copying.scribe.specApply) {
        context.copying.scribe.score++;
      }
      switch (context.copying.topicType) {
        case "labText": {
          context.copying.scribe.writingScoreLabel = game.i18n.localize(
            "arm5e.scriptorium.copying.writingScoreLabel2"
          );
          context.copying.scribe.writingScore = context.copying.scribe.score * 60;
          context.copying.total = 0;
          for (let txt of context.copying.labTexts) {
            context.copying.total += txt.level;
          }

          context.copying.duration = Math.ceil(
            context.copying.total / context.copying.scribe.writingScore
          );
          break;
        }
        case "Tractatus":
          // Get the duration to copy everything
          if (context.copying.quickCopy) {
            context.copying.scribe.writingScore = 3;
            context.copying.scribe.writingScoreLabel = "3 Tractati per season";
          } else {
            context.copying.scribe.writingScore = 1;
            context.copying.scribe.writingScoreLabel = "1 Tractatus per season";
          }
          context.copying.duration = Math.ceil(
            context.copying.books.length / context.copying.scribe.writingScore
          );
          context.copying.total = context.copying.books.length;
          for (const b of context.copying.books) {
            const topic = b.system.topics[b.system.topicIndex];
            context.copying.total += topic.level;
            topic.finalQuality = context.copying.quickCopy ? topic.quality - 1 : topic.quality;
          }
          break;
        case "Summa": {
          context.copying.scribe.writingScoreLabel = game.i18n.localize(
            "arm5e.scriptorium.copying.writingScoreLabel"
          );
          context.copying.scribe.writingScore = context.copying.scribe.score + 6;
          if (context.copying.quickCopy) {
            context.copying.scribe.writingScore *= 3;
            context.copying.scribe.writingScoreLabel += " x 3";
          }
          context.copying.total = 0;
          for (const b of context.copying.books) {
            const topic = b.system.topics[b.system.topicIndex];
            // Ability summae need 5× level points to copy; Art summae need level points (RAW p.166)
            context.copying.total += topic.category === "ability" ? topic.level * 5 : topic.level;
            topic.finalQuality = context.copying.quickCopy ? topic.quality - 1 : topic.quality;
          }
          context.copying.duration = Math.ceil(
            context.copying.total / context.copying.scribe.writingScore
          );
          break;
        }
      }

      this.checkCopying(context, scribe);
      // Log(false, `Scriptorium copying data: ${JSON.stringify(context.copying)}`);
    } else {
      context.ui.copying.error = true;
    }
    context.copying.topicTypeChange =
      context.copying.books.length || context.copying.labTexts.length ? "disabled" : "";
    if (context.ui.copying.error === false) {
      context.ui.copying.createPossible = "";
    }
  }

  /** @override */
  async _preparePartContext(partId, context) {
    switch (partId) {
      case "reading":
        context.tab = context.tabs[partId];
        this._prepareReadingContext(context);
        break;
      case "writing":
        context.tab = context.tabs[partId];
        this._prepareWritingContext(context);
        break;
      case "copying":
        context.tab = context.tabs[partId];
        this._prepareCopyingContext(context);
        break;
      default:
        break;
    }
    return context;
  }

  /**
   * Wire up DOM event listeners that are not covered by the `actions` system
   * (season/year selects, book-topic category selects, writing-language select)
   * and rebind drag-drop handlers after each render.
   * @override
   */
  _onRender(context, options) {
    super._onRender(context, options);
    const html = this.element;
    html
      .querySelectorAll(".change-season")
      .forEach((el) => el.addEventListener("change", this._changeSeason.bind(this)));
    html
      .querySelectorAll(".change-year")
      .forEach((el) => el.addEventListener("change", this._changeYear.bind(this)));
    html
      .querySelectorAll(".book-topic-change")
      .forEach((el) => el.addEventListener("change", this._changeBookTopic.bind(this)));
    html
      .querySelectorAll(".language-writer")
      .forEach((el) => el.addEventListener("change", async (e) => this._changeWritenLanguage(e)));
    this.#dragDrop.forEach((d) => d.bind(this.element));
  }

  // ---------------------------------------------------------------------------
  // Static action handlers (registered in DEFAULT_OPTIONS.actions)
  // Each one is a thin try/catch wrapper that delegates to the corresponding
  // `_` instance method.  Errors are caught, logged, and reported via a
  // notification, never propagated to Foundry's top-level handler.
  // ---------------------------------------------------------------------------

  static async setDate(event, target) {
    try {
      await this.setDate(target.dataset);
    } catch (err) {
      console.error("Scriptorium | setDate failed:", err);
      ui.notifications.error(game.i18n.localize("arm5e.scriptorium.msg.error"));
      this.render();
    }
  }

  static async unlinkReadBook(event, target) {
    try {
      await this._resetReadBook(target.dataset);
    } catch (err) {
      console.error("Scriptorium | unlinkReadBook failed:", err);
      ui.notifications.error(game.i18n.localize("arm5e.scriptorium.msg.error"));
      this.render();
    }
  }

  static async unlinkWriteBook(event, target) {
    try {
      await this._resetWriteBook();
    } catch (err) {
      console.error("Scriptorium | unlinkWriteBook failed:", err);
      ui.notifications.error(game.i18n.localize("arm5e.scriptorium.msg.error"));
      this.render();
    }
  }

  static async removeLabText(event, target) {
    try {
      await this._removeLabText(target.dataset);
    } catch (err) {
      console.error("Scriptorium | removeLabText failed:", err);
      ui.notifications.error(game.i18n.localize("arm5e.scriptorium.msg.error"));
      this.render();
    }
  }

  static async removeLabTextCopy(event, target) {
    try {
      await this._removeLabTextCopy(target.dataset);
    } catch (err) {
      console.error("Scriptorium | removeLabTextCopy failed:", err);
      ui.notifications.error(game.i18n.localize("arm5e.scriptorium.msg.error"));
      this.render();
    }
  }

  static async unlinkReader(event, target) {
    try {
      await this._resetReader();
    } catch (err) {
      console.error("Scriptorium | unlinkReader failed:", err);
      ui.notifications.error(game.i18n.localize("arm5e.scriptorium.msg.error"));
      this.render();
    }
  }

  static async unlinkWriter(event, target) {
    try {
      await this._resetWriter();
    } catch (err) {
      console.error("Scriptorium | unlinkWriter failed:", err);
      ui.notifications.error(game.i18n.localize("arm5e.scriptorium.msg.error"));
      this.render();
    }
  }

  static async unlinkScribe(event, target) {
    try {
      await this._resetScribe();
    } catch (err) {
      console.error("Scriptorium | unlinkScribe failed:", err);
      ui.notifications.error(game.i18n.localize("arm5e.scriptorium.msg.error"));
      this.render();
    }
  }

  static async createReadingActivity(event, target) {
    try {
      await this._createReadingDiaryEntry(target.dataset);
    } catch (err) {
      console.error("Scriptorium | createReadingActivity failed:", err);
      ui.notifications.error(game.i18n.localize("arm5e.scriptorium.msg.error"));
      this.render();
    }
  }

  static async createWritingActivity(event, target) {
    try {
      if (target.dataset.category === "labText") {
        await this._createTranslatingDiaryEntry(target.dataset);
      } else {
        await this._createWritingDiaryEntry(target.dataset);
      }
    } catch (err) {
      console.error("Scriptorium | createWritingActivity failed:", err);
      ui.notifications.error(game.i18n.localize("arm5e.scriptorium.msg.error"));
      this.render();
    }
  }

  static async createCopyingActivity(event, target) {
    try {
      await this._createCopyingDiaryEntry();
    } catch (err) {
      console.error("Scriptorium | createCopyingActivity failed:", err);
      ui.notifications.error(game.i18n.localize("arm5e.scriptorium.msg.error"));
      this.render();
    }
  }

  static async handleSection(event, target) {
    try {
      await this._handle_section(target.dataset);
    } catch (err) {
      console.error("Scriptorium | handleSection failed:", err);
      ui.notifications.error(game.i18n.localize("arm5e.scriptorium.msg.error"));
      this.render();
    }
  }

  static async nextTopic(event, target) {
    try {
      await this._changeCurrentTopic("reading", target.dataset, 1);
    } catch (err) {
      console.error("Scriptorium | nextTopic failed:", err);
      ui.notifications.error(game.i18n.localize("arm5e.scriptorium.msg.error"));
      this.render();
    }
  }

  static async previousTopic(event, target) {
    try {
      await this._changeCurrentTopic("reading", target.dataset, -1);
    } catch (err) {
      console.error("Scriptorium | previousTopic failed:", err);
      ui.notifications.error(game.i18n.localize("arm5e.scriptorium.msg.error"));
      this.render();
    }
  }

  static async nextTopicToCopy(event, target) {
    try {
      await this._changeTopic("copying", target.dataset, 1);
    } catch (err) {
      console.error("Scriptorium | nextTopicToCopy failed:", err);
      ui.notifications.error(game.i18n.localize("arm5e.scriptorium.msg.error"));
      this.render();
    }
  }

  static async previousTopicToCopy(event, target) {
    try {
      await this._changeTopic("copying", target.dataset, -1);
    } catch (err) {
      console.error("Scriptorium | previousTopicToCopy failed:", err);
      ui.notifications.error(game.i18n.localize("arm5e.scriptorium.msg.error"));
      this.render();
    }
  }

  static async removeBook(event, target) {
    try {
      await this._removeBook(target.dataset);
    } catch (err) {
      console.error("Scriptorium | removeBook failed:", err);
      ui.notifications.error(game.i18n.localize("arm5e.scriptorium.msg.error"));
      this.render();
    }
  }

  static async selectReader(event, target) {
    const [reader] = await DocumentPicker.selectOwnedCharacter(
      "arm5e.scriptorium.button.selectReader"
    );
    if (reader) {
      await this._setReader(reader);
    }
  }

  static async selectWriter(event, target) {
    const [writer] = await DocumentPicker.selectOwnedCharacter(
      "arm5e.scriptorium.button.selectWriter"
    );
    if (writer) {
      await this._setWriter(writer);
    }
  }

  static async selectScribe(event, target) {
    const [scribe] = await DocumentPicker.selectOwnedCharacter(
      "arm5e.scriptorium.button.selectScribe"
    );
    if (scribe) {
      await this._setScribe(scribe);
    }
  }

  static async selectReadingBook(event, target) {
    // if there is a reader already linked
    let reader = null;
    if (this.object.reading.reader.id !== null) {
      reader = game.actors.get(this.object.reading.reader.id);
    }

    const [book] = await this.selectBook("arm5e.scriptorium.button.selectBookToRead", reader);

    if (book) {
      await this._setReadingBook(book);
    }
  }

  static async selectWritingBook(event, target) {
    // if there is a writer already linked
    let writer = null;
    if (this.object.writing.writer.id !== null) {
      writer = game.actors.get(this.object.writing.writer.id);
    }

    const [book] = await this.selectBook("arm5e.scriptorium.button.selectWritingBook", writer);

    if (book) {
      await this._setWritingBook(book);
    }
  }

  static async selectCopyingBook(event, target) {
    // if there is a scribe already linked
    let scribe = null;
    if (this.object.copying.scribe.id !== null) {
      scribe = game.actors.get(this.object.copying.scribe.id);
    }

    const [book] = await this.selectBook(
      "arm5e.scriptorium.button.selectBookToAppend",
      scribe,
      true
    );

    if (book) {
      if (book.type === "laboratoryText") {
        await this._addLabTextToCopy(book);
      } else {
        await this._addBookToCopy(book, book.system.topicIndex ?? 0);
      }
    }
  }

  async selectBook(title, actor, withLabTexts = false) {
    let types = ["book"];
    if (withLabTexts) {
      types.push("laboratoryText");
    }
    const filters = [
      {
        label: "World Books",
        fn: (e) => types.includes(e.type) && e.testUserPermission(game.user, "OBSERVER")
      }
    ];
    let source = game.items.contents.filter(
      (e) => types.includes(e.type) && e.testUserPermission(game.user, "OBSERVER")
    );

    // if there is a reader already linked
    if (actor) {
      source.push(...actor.items.filter((e) => types.includes(e.type)));
      if (actor.system.covenant?.linked) {
        const covenant = actor.system.covenant.document;
        source.push(...covenant.items.filter((e) => types.includes(e.type)));
        filters.push({
          label: "Covenant Books",
          fn: (e) => types.includes(e.type) && e.parent?.uuid === covenant.uuid
        });
      }
      if (actor.system.sanctum?.linked) {
        const sanctum = actor.system.sanctum.document;
        source.push(...sanctum.items.filter((e) => types.includes(e.type)));
        filters.push({
          label: "Sanctum Books",
          fn: (e) => types.includes(e.type) && e.parent?.uuid === sanctum.uuid
        });
      }
    }

    const fields = [
      {
        label: "Table of Contents",
        fn: (doc) => {
          let toc =
            doc.type == "book"
              ? BookSchema.getTableOfContentsSynthetic(doc.system, false)
              : doc.system.toString();

          return `<i class="ars-Icon_Readspell" data-tooltip="${toc.replaceAll(
            '"',
            "&quot;"
          )}" data-tooltip-class="doc-picker-tooltip"></i>`;
        }
      }
    ];
    const flavor = CONFIG.ARM5E.FLAVORS.Laboratory;
    const singleSelect = true;
    return await DocumentPicker.pick(source, {
      title: game.i18n.localize(title),
      filters,
      singleSelect,
      fields,
      flavor
    });
  }

  async _changeWritenLanguage(event) {
    event.preventDefault();
    const writer = game.actors.get(this.object.writing.writer.id);
    const lang = writer.items.get(event.currentTarget.value);

    const updateData = {
      "writing.writer.language": lang._id,
      "writing.writer.languageSpec": lang.system.speciality,
      "writing.writer.languageSpecApply": false
    };
    await this._updateData(updateData);
  }

  async _removeBook(dataset) {
    const bookIndex = Number(dataset.bookIndex);
    const index = Number(dataset.index);
    this.object.copying.books.splice(bookIndex, 1);
    this.render();
    // Await this._updateData({
    //   preventClose: true,
    //   updateData: { "copying.books": books }
    // });
  }

  async _changeTopic(activity, dataset, offset) {
    const bookIndex = Number(dataset.bookIndex);
    const newIndex = Number(dataset.index) + offset;
    if (
      newIndex > this.object[activity].books[bookIndex].system.topics.length - 1 ||
      newIndex < 0
    ) {
      // No effect
      return;
    }
    const books = structuredClone(this.object[activity].books);
    books[bookIndex].system.topicIndex = newIndex;
    const str = `${activity}.books`;
    await this._updateData({ [str]: books });
  }

  async _changeCurrentTopic(activity, dataset, offset) {
    const newIndex = Number(dataset.index) + offset;
    if (newIndex > this.object[activity].book.system.topics.length - 1 || newIndex < 0) {
      // No effect
      return;
    }
    // Let updateData = ;
    // updateData["reading.book.system.topicIndex"] = newIndex;
    const str = `${activity}.book.system.topicIndex`;
    await this._updateData({ [str]: newIndex });
  }

  async _handle_section(dataset) {
    log(false, `DEBUG section: ${dataset.section}, category: ${dataset.category}`);
    // Ensure the cache entry exists with all required fields before accessing it.
    // getUserCache() initialises missing keys and writes them back to sessionStorage.
    this.getUserCache();
    let usercache = JSON.parse(sessionStorage.getItem(`usercache-${game.user.id}`));
    let scope = usercache.scriptorium.sections.visibility[dataset.category];
    let classes = document.getElementById(`${dataset.category}-${dataset.section}`).classList;
    if (scope) {
      if (classes.contains("hide")) {
        log(false, `DEBUG reveal ${dataset.section}`);
        scope[dataset.section] = "";
      } else {
        log(false, `DEBUG hide ${dataset.section}`);
        scope[dataset.section] = "hide";
      }
      sessionStorage.setItem(`usercache-${game.user.id}`, JSON.stringify(usercache));
    }
    // Log(false, `DEBUG Flags: ${JSON.stringify(this.item.flags.arm5e.ui.sections.visibility)}`);
    classes.toggle("hide");
  }

  /**
   * Build and open a `diaryEntry` Item for a lab-text translating session.
   * One topic per lab-text is appended to the book's topic list; the template
   * topic (at `dataset.index`) is removed from the book before saving.
   * @param {DOMStringMap} dataset - Button dataset containing the topic index.
   */
  async _createTranslatingDiaryEntry(dataset) {
    const objectData = foundry.utils.expandObject(this.object);
    const writer = game.actors.get(objectData.writing.writer.id);

    const writerData = objectData.writing.writer;
    const book = foundry.utils.deepClone(objectData.writing.book);
    // Create a safe copy of the topics
    const bookTopics = book.system.topics;
    // Remove the placeholder topic
    let [topicTemplate] = bookTopics.splice(dataset.index, 1);
    const labTexts = objectData.labTexts;

    let activityName = game.i18n.format("arm5e.scriptorium.translating.activity", {
      title: book.name
    });

    // Add a new topic for each lab text
    let topics = [];
    let description = "<ul>";
    for (const e of labTexts) {
      const labText = await fromUuid(e.uuid);
      if (!labText) {
        console.error(`Could not find labtext from uuid: ${e.uuid}`);
        return;
      }
      const topic = foundry.utils.deepClone(topicTemplate);
      topic.author = writer.name;
      topic.language = writer.items.get(writerData.language).name;
      topic.labtextTitle = e.name;
      labText.system.draft = false;
      topic.labtext = labText.system.toObject(false);
      topic.type = null;
      topic.art = null;
      topic.key = null;
      topic.option = null;
      topic.spellName = null;
      description += `<li>"${labText.name}" : ${e.label} ${e.level}</li><br/>`;
      topics.push(topic);
    }
    description += "</ul>";

    const achievement = {
      name: book.name,
      type: "book",
      img: book.img,
      system: book.system,
      _id: book.id
    };
    achievement.system.topics = bookTopics.concat(topics);

    if (book.id) {
      achievement.updateExisting = true;
    }

    const extraData = {
      actorId: objectData.writing.writer.id,
      itemId: book.id,
      flags: 8,
      data: {
        title: book.name,
        topicIndex: dataset.index,
        topicNumber: topics.length
      }
    };

    const entryData = [
      {
        name: activityName,
        type: "diaryEntry",
        system: {
          cappedGain: false,
          dates: [{ season: objectData.season, year: Number(objectData.year), applied: false }],
          sourceQuality: 0,
          activity: "writing",
          done: false,
          progress: {
            abilities: [],
            arts: [],
            spells: [],
            newSpells: []
          },
          optionKey: "standard",
          duration: 1,
          description: game.i18n.format("arm5e.scriptorium.msg.diaryDescTranslating", {
            name: writer.name,
            title: book.name,
            description: description
          }),
          achievements: [achievement],
          externalIds: [extraData]
        }
      }
    ];
    let entry = await writer.createEmbeddedDocuments("Item", entryData, {});
    entry[0].sheet.render(true);
  }

  /**
   * Build and open a `diaryEntry` Item for a copying session.
   * Handles two sub-modes:
   *  - `individualCopies`: each book/lab-text becomes its own achievement.
   *  - merged (default): books with the same name are merged into a single achievement;
   *    all lab-texts are collected into a single "folio" book achievement.
   */
  async _createCopyingDiaryEntry() {
    const objectData = foundry.utils.expandObject(this.object);
    const scribe = game.actors.get(objectData.copying.scribe.id);
    const books = structuredClone(objectData.copying.books);

    let activityName = game.i18n.localize("arm5e.scriptorium.copying.activity");
    if (books.length == 1) {
      activityName += `: "${books[0].name}"`;
    }

    const achievementsIndex = {};

    const extraData = [];
    if (objectData.copying.individualCopies) {
      let suffix = 1;
      for (const book of books) {
        const topic = structuredClone(book.system.topics[book.system.topicIndex]);
        topic.quality = topic.finalQuality;
        book.system.topics = [topic];
        let bookName = book.name;
        if (achievementsIndex[bookName]) {
          bookName += suffix;
          suffix++;
        }
        achievementsIndex[bookName] = {
          name: book.name,
          type: "book",
          img: book.img,
          system: book.system
        };
        extraData.push({
          actorId: scribe.id,
          itemId: null,
          flags: 0
        });
      }
      for (let text of objectData.copying.labTexts) {
        achievementsIndex[`labText ${suffix}`] = {
          name: text.name,
          type: "laboratoryText",
          img: text.img,
          system: text.system
        };
        extraData.push({
          actorId: scribe.id,
          itemId: null,
          flags: 0
        });
        suffix++;
      }
    } else {
      for (const book of books) {
        const topic = structuredClone(book.system.topics[book.system.topicIndex]);
        topic.quality = topic.finalQuality;
        if (!achievementsIndex[book.name]) {
          book.system.topics = [topic];
          achievementsIndex[book.name] = {
            name: book.name,
            type: "book",
            img: book.img,
            system: book.system
          };
          extraData.push({
            actorId: scribe.id,
            itemId: null,
            flags: 0
          });
        } else {
          achievementsIndex[book.name].system.topics.push(topic);
        }
      }

      if (objectData.copying.labTexts.length) {
        const folio = {
          name: game.i18n.localize("arm5e.scriptorium.folio"),
          type: "book",
          img: "icons/sundries/documents/document-symbol-circle-brown.webp",
          system: { topics: [] }
        };
        extraData.push({
          actorId: scribe.id,
          itemId: null,
          flags: 0
        });

        for (let text of objectData.copying.labTexts) {
          const topic = {};
          topic.author = scribe.name;
          topic.category = "labText";
          topic.language = text.system.language;
          topic.labtextTitle = text.name;
          topic.labtext = text.system;
          topic.type = null;
          topic.art = null;
          topic.key = null;
          topic.option = null;
          topic.spellName = null;
          //  += `<li>"${text.name}" : ${text.label} ${text.level}</li><br/>`;
          folio.system.topics.push(topic);
        }
        folio.system.description = BookSchema.getTableOfContentsSynthetic(folio.system);
        achievementsIndex.labTextFolio = folio;
      }
    }

    // Update descriptions:
    let diaryDesc = `${game.i18n.format("arm5e.scriptorium.msg.diaryDescCopying", {
      name: scribe.name
    })}<ul>`;
    for (const book of books) {
      diaryDesc += `<li>${book.name}</li>`;
      book.system.description = BookSchema.getTableOfContentsSynthetic(book.system);
      book.system.description += `<br/>${game.i18n.format(
        "arm5e.scriptorium.copying.scribeDescription",
        {
          scribe: scribe.name,
          season: game.i18n.localize(CONFIG.ARM5E.seasons[objectData.season].label),
          year: objectData.year
        }
      )}`;
    }
    for (let text of objectData.copying.labTexts) {
      diaryDesc += `<li>${text.name}</li>`;
    }
    diaryDesc += "</ul>";

    const entryData = [
      {
        name: activityName,
        type: "diaryEntry",
        system: {
          cappedGain: false,
          dates: DiaryEntrySchema.buildSchedule(
            objectData.copying.duration,
            Number(objectData.year),
            objectData.season
          ),
          sourceQuality: 0,
          activity: "copying",
          done: false,
          progress: {
            abilities: [],
            arts: [],
            spells: [],
            newSpells: []
          },
          optionKey: "standard",
          duration: objectData.copying.duration,
          description: diaryDesc,
          achievements: Object.values(achievementsIndex),
          externalIds: extraData
        }
      }
    ];
    let entry = await scribe.createEmbeddedDocuments("Item", entryData, {});
    entry[0].sheet.render(true);
  }

  /**
   * Build and open a `diaryEntry` Item for a book-writing season.
   * Resolves the topic details (language, art/ability/spell) from the writer state,
   * then builds an achievement that will be applied once the diary entry is confirmed.
   * @param {DOMStringMap} dataset - Button dataset containing the topic index.
   */
  async _createWritingDiaryEntry(dataset) {
    const objectData = foundry.utils.expandObject(this.object);
    const writer = game.actors.get(objectData.writing.writer.id);

    const writerData = objectData.writing.writer;
    const book = objectData.writing.book;
    const topic = book.system.topics[dataset.index];

    let activityName = game.i18n.format("arm5e.scriptorium.writing.activity", {
      title: book.name
    });

    topic.art = writerData.art;
    topic.author = writer.name;
    topic.language = writer.items.get(writerData.language).name;
    if (topic.category == "mastery" && writerData.spell) {
      const spell = writer.items.get(writerData.spell);
      topic.spellName = spell.name;
      topic.spellTech = spell.system.technique.value;
      topic.spellForm = spell.system.form.value;
    } else if (topic.category == "ability") {
      const ability = writer.items.get(writerData.ability);
      topic.name = ability.name;
    }

    const achievement = {
      name: book.name,
      type: "book",
      img: book.img,
      system: book.system,
      _id: book.id
    };
    if (book.id) {
      achievement.updateExisting = true;
    }

    const extraData = {
      actorId: objectData.writing.writer.id,
      itemId: book.id,
      flags: 8,
      data: { title: book.name, topic: topic, topicIndex: dataset.index }
    };

    const entryData = [
      {
        name: activityName,
        type: "diaryEntry",
        system: {
          cappedGain: false,
          dates: DiaryEntrySchema.buildSchedule(
            writerData.duration,
            Number(objectData.year),
            objectData.season
          ),
          sourceQuality: 0,
          activity: "writing",
          done: false,
          progress: {
            abilities: [],
            arts: [],
            spells: [],
            newSpells: []
          },
          optionKey: "standard",
          duration: writerData.duration,
          description: game.i18n.format("arm5e.scriptorium.msg.diaryDescWriting", {
            name: writer.name,
            title: book.name,
            type: topic.type,
            language: topic.language,
            topic: getTopicDescription(topic)
          }),
          achievements: [achievement],
          externalIds: [extraData]
        }
      }
    ];
    let entry = await writer.createEmbeddedDocuments("Item", entryData, {});
    entry[0].sheet.render(true);
  }

  /**
   * Build and open a `diaryEntry` Item for a book-reading season.
   * Populates the appropriate progress section (abilities / arts / spells) and
   * applies XP capping when the reader is near the topic level cap.
   * @param {DOMStringMap} dataset - Button dataset with abilityId / spellId.
   */
  async _createReadingDiaryEntry(dataset) {
    const objectData = foundry.utils.expandObject(this.object);
    const reader = game.actors.get(objectData.reading.reader.id);
    const readerData = objectData.reading.reader;
    const book = objectData.reading.book;
    const topic = book.system.topics[dataset.index];
    let activityName = game.i18n.format("arm5e.scriptorium.reading.activity", {
      title: book.name
    });

    const extraData = {
      actorId: objectData.reading.reader.id,
      itemId: book.id,
      flags: 8,
      data: { title: book.name, topic: topic }
    };

    const entryData = [
      {
        name: activityName,
        type: "diaryEntry",
        system: {
          cappedGain: false,
          dates: [{ season: objectData.season, year: Number(objectData.year), applied: false }],
          sourceQuality: topic.quality,
          activity: "reading",
          done: false,
          progress: {
            abilities: [],
            arts: [],
            spells: [],
            newSpells: []
          },
          optionKey: "standard",
          duration: 1,
          description: game.i18n.format("arm5e.scriptorium.msg.diaryDescReading", {
            name: reader.name,
            title: book.name,
            author: topic.author,
            type: topic.type,
            language: topic.language,
            topic: getTopicDescription(topic)
          }),
          externalIds: [extraData]
        }
      }
    ];
    let quality = topic.quality;
    let maxLevel = 0;
    switch (topic.category) {
      case "ability":
        if (topic.type == "Summa") {
          objectData.ui = {};
          if (dataset.abilityId.length == 16) {
            let ab = reader.system.abilities.find((a) => {
              return a._id === dataset.abilityId;
            });
            entryData[0].system.cappedGain = topic.cappedGain; // This.checkAbilityOverload(objectData, reader, ab);
          } else {
            entryData[0].system.cappedGain = false;
          }
          entryData[0].system.sourceQuality = quality;
          maxLevel = topic.level;
        }
        entryData[0].system.progress.abilities.push({
          id: dataset.abilityId,
          category: CONFIG.ARM5E.LOCALIZED_ABILITIES[topic.key]?.category ?? "general",
          name: game.i18n.format(CONFIG.ARM5E.LOCALIZED_ABILITIES[topic.key].mnemonic, {
            option: topic.option
          }),
          key: topic.key,
          option: topic.option,
          secondaryId: dataset.abilityId.length != 16,
          maxLevel: maxLevel,
          xp: entryData[0].system.cappedGain
            ? quality
            : quality + reader.system.bonuses.activities.reading
        });
        log(false, entryData[0].system.progress.abilities[0]);
        break;
      case "art":
        if (topic.type == "Summa") {
          let art = reader.getArtStats(topic.art);
          objectData.ui = {};
          entryData[0].system.cappedGain = topic.cappedGain; // This.checkArtOverload(objectData, reader, art);
          // if (entryData[0].system.cappedGain) {
          //   quality = topic.quality;
          // }
          entryData[0].system.sourceQuality = quality;
          maxLevel = topic.level;
        }
        entryData[0].system.progress.arts.push({
          key: topic.art,
          maxLevel: maxLevel,
          xp: entryData[0].system.cappedGain
            ? quality
            : quality +
              reader.system.bonuses.activities.reading +
              reader.system.bonuses.activities.readingArts
        });
        break;
      case "mastery": {
        const readerSpell = reader.system.spells.find((s) => s.id === dataset.spellId);
        entryData[0].system.progress.spells.push({
          id: dataset.spellId,
          name: readerSpell.name,
          maxLevel: 0,
          form: readerSpell.system.form.value,
          xp: entryData[0].system.cappedGain
            ? quality
            : quality + reader.system.bonuses.activities.reading
        });
        break;
      }
    }
    let entry = await reader.createEmbeddedDocuments("Item", entryData, {});
    entry[0].sheet.render(true);
  }

  /**
   * Detach the current reader from this application and clear reading state.
   * Also removes this app from the actor's `.apps` registry.
   */
  async _resetReader() {
    let reader = game.actors.get(this.object.reading.reader.id);
    delete reader.apps[this.options.uniqueId];
    let updatedData = {
      "reading.reader.id": null,
      "reading.reader.name": "",
      "reading.reader.ability": "",
      "reading.reader.spellName": "",
      "reading.reader.language": ""
    };
    await this._updateData(updatedData);
  }

  /**
   * Detach the current writer from this application and clear writing state.
   * Also removes this app from the actor's `.apps` registry.
   */
  async _resetWriter() {
    let writer = game.actors.get(this.object.writing.writer.id);
    delete writer.apps[this.options.uniqueId];
    let updatedData = {
      "writing.writer.id": null,
      "writing.writer.name": "",
      "writing.writer.ability": "",
      "writing.writer.spellName": "",
      "writing.writer.language": ""
    };
    await this._updateData(updatedData);
  }

  /**
   * Detach the current scribe from this application and clear copying state.
   * Also removes this app from the actor's `.apps` registry.
   */
  async _resetScribe() {
    let scribe = game.actors.get(this.object.copying.scribe.id);
    delete scribe.apps[this.options.uniqueId];
    let updatedData = {
      "copying.scribe.id": null,
      "copying.scribe.name": "",
      "copying.scribe.ability": "",
      "copying.scribe.spellName": "",
      "copying.scribe.language": ""
    };
    await this._updateData(updatedData);
  }

  async _resetReadBook(dataset) {
    const objectData = foundry.utils.expandObject(this.object);
    const index = dataset.index;
    const singleTopic = objectData.reading.book.system.topics[index];
    singleTopic.level = singleTopic.type === "Tractatus" ? 0 : singleTopic.level;
    let updatedData = {
      "reading.book.id": null,
      "reading.book.uuid": null,
      "reading.book.system.topics": [singleTopic],
      "reading.book.system.topicIndex": 0
    };
    await this._updateData(updatedData);
  }

  async _resetWriteBook() {
    const objectData = foundry.utils.expandObject(this.object);
    const index = objectData.writing.book.system.topics.length - 1;
    const singleTopic = objectData.writing.book.system.topics[index];
    singleTopic.level = singleTopic.type === "Tractatus" ? 0 : singleTopic.level;
    let updatedData = {
      "writing.book.id": null,
      "writing.book.uuid": null,
      "writing.book.system.topics": [singleTopic],
      "writing.book.system.topicIndex": 0
    };
    objectData.writing.book.system.topics = [];
    await this._updateData(updatedData);
  }

  async _changeSeason(event) {
    await this._updateData({ season: event.currentTarget.value });
  }

  async _changeYear(event) {
    await this._updateData({ year: event.currentTarget.value });
  }

  /**
   * Set the book that the reader will study.
   * Reads and respects the `arm5e.currentBookTopic` flag if set.
   * @param {ArM5eItem} book - A book-type item.
   */
  async _setReadingBook(book) {
    if (!book.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER)) {
      ui.notifications.info(game.i18n.localize("arm5e.scriptorium.msg.bookNoAccess"));
      return;
    }
    if (book.system.topics.length == 0) {
      ui.notifications.info(game.i18n.localize("arm5e.scriptorium.msg.emptyBook"));
      return;
    }
    let index = book.getFlag("arm5e", "currentBookTopic") ?? 0;
    book.system.topicIndex = index;

    await this._updateData({
      "reading.book": { name: book.name, id: book.id, uuid: book.uuid, system: book.system }
    });
  }

  /**
   * Append the current new-topic template from the writing state onto `book`'s
   * topic list, then set `book` as the target for the writing activity.
   * Only books owned by a single actor are allowed (to guarantee write access later).
   * @param {ArM5eItem} book - A book-type item owned by an actor.
   */
  async _setWritingBook(book) {
    if (!book.isOwned) {
      ui.notifications.info(game.i18n.localize("arm5e.scriptorium.msg.bookNotOwned"));
      return;
    }
    const newTopicIndex = book.system.topics.length;
    let newTopic =
      this.object.writing.book.system.topics[this.object.writing.book.system.topics.length - 1];
    book.system.topics.push(newTopic);
    book.system.topicIndex = book.system.topics.length - 1;

    await this._updateData({
      "writing.book": { name: book.name, id: book.id, uuid: book.uuid, system: book.system }
    });
  }

  /**
   * Add `bookToAdd` to the copying queue.
   * When books are already queued, only topics matching the first book's type are kept.
   * When the dropped topic is a labText category it is rerouted to `_addLabTextToCopy`.
   * Cannot mix lab-texts and books in the same copying session.
   * @param {ArM5eItem} bookToAdd   - A book-type item.
   * @param {number}   [topicIndex] - Override topic index from the drag payload.
   */
  async _addBookToCopy(bookToAdd, topicIndex) {
    if (!bookToAdd.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER)) {
      ui.notifications.info(game.i18n.localize("arm5e.scriptorium.msg.bookNoAccess"));
      return;
    }
    if (!bookToAdd.system.topics.length) {
      log(false, "Empty book");
      return;
    }

    const bookData = structuredClone(bookToAdd.system);
    const books = this.object.copying.books;
    let topicType;
    if (books.length) {
      topicType = books[0].system.topics[0].type;
      const matchingTopics = structuredClone(bookData.topics.filter((e) => e.type == topicType));
      if (matchingTopics.length) {
        bookData.topicIndex = 0;
        bookData.topics = matchingTopics;
      } else {
        ui.notifications.info(game.i18n.localize("arm5e.scriptorium.msg.noSimilarTopic"));
        return;
      }
    } else {
      const index = topicIndex ? topicIndex : bookToAdd.getFlag("arm5e", "currentBookTopic") ?? 0;
      const topic = bookData.topics[index];
      if (topic.category === "labText") {
        topic.system = topic.labtext;
        topic.name = topic.labtextTitle;
        await this._addLabTextToCopy(topic);
        return;
      }
      if (this.object.copying.labTexts.length) {
        return;
      }
      topicType = topic.type;

      const matchingTopics = structuredClone(bookData.topics.filter((e) => e.type == topicType));
      bookData.topicIndex = matchingTopics.findIndex((e) => compareTopics(e, topic) == 0);
      bookData.topics = matchingTopics;
    }

    books.push({ name: bookToAdd.name, id: bookToAdd.id, uuid: bookToAdd.uuid, system: bookData });
    await this._updateData({
      "copying.topicType": topicType,
      "copying.books": books
    });
  }

  /**
   * Add a draft lab-text to the writing queue (translating mode).
   * Only the writer's own draft lab-texts can be queued here.
   * @param {ArM5eItem} text - The laboratoryText item dropped.
   */
  async _addLabText(text) {
    const writer = game.actors.get(this.object.writing.writer.id);
    if (!text.system.draft || text.system.author != writer.name) {
      ui.notifications.info(game.i18n.localize("arm5e.scriptorium.msg.translationOnly"));
      return;
    }
    let labtexts = this.object.labTexts;
    labtexts.push({
      name: text.name,
      uuid: text.uuid,
      label: `${spellTechniqueLabel(text.system, true)}${spellFormLabel(text.system, true)}`,
      level: text.system.level,
      img: text.img
    });
    await this._updateData({ labTexts: labtexts });
  }

  /**
   * Add a lab-text to the copying queue.
   * Only accepts finalized texts (draft === false) - drafts belong to the translating workflow.
   * Cannot be mixed with regular books in the same copying session.
   */
  async _addLabTextToCopy(text) {
    if (this.object.copying.books.length) {
      return;
    }
    // NOTE: `scribe` is fetched here but never actually used; the permission logic
    // relies on the drop UI only being available after a scribe is set.
    const scribe = game.actors.get(this.object.copying.scribe.id);

    if (text.system.draft) {
      ui.notifications.info(game.i18n.localize("arm5e.scriptorium.msg.translationOnly"));
      return;
    }
    let labtexts = this.object.copying.labTexts;
    labtexts.push({
      name: text.name,
      label: `(${text.system.language}) ${spellTechniqueLabel(text.system, true)}${spellFormLabel(
        text.system,
        true
      )}`,
      level: text.system.level,
      img: CONFIG.ARM5E_DEFAULT_ICONS.laboratoryText,
      system: text.system
    });
    await this._updateData({
      "copying.labTexts": labtexts,
      "copying.topicType": "labText"
    });
  }

  async _removeLabText(dataset) {
    let labtexts = foundry.utils.duplicate(this.object.labTexts);
    labtexts.splice(Number(dataset.index), 1);
    await this._updateData({ labTexts: labtexts });
  }

  async _removeLabTextCopy(dataset) {
    let labtexts = foundry.utils.duplicate(this.object.copying.labTexts);
    labtexts.splice(Number(dataset.index), 1);
    await this._updateData({ "copying.labTexts": labtexts });
  }

  async _setReader(reader) {
    if (!reader.isOwner) {
      ui.notifications.info(game.i18n.localize("arm5e.scriptorium.msg.actorNotAuthorized"));
      return;
    }
    log(false, "set reader info");
    let readerInfo = {
      id: reader._id,
      name: reader.name
    };
    reader.apps[this.options.uniqueId] = this;
    const readingData = { reader: readerInfo };
    await this._updateData({ reading: readingData });
  }

  async _setWriter(writer) {
    if (!writer.isOwner) {
      ui.notifications.info(game.i18n.localize("arm5e.scriptorium.msg.actorNotAuthorized"));
      return;
    }
    log(false, "set writer info");
    let writerInfo = {
      id: writer._id,
      name: writer.name
    };
    writer.apps[this.options.uniqueId] = this;
    const writingData = { writer: writerInfo };
    await this._updateData({ writing: writingData });
  }

  async _setScribe(scribe) {
    if (!scribe.isOwner) {
      ui.notifications.info(game.i18n.localize("arm5e.scriptorium.msg.actorNotAuthorized"));
      return;
    }
    log(false, "set scribe info");
    let scribeInfo = {
      id: scribe._id,
      name: scribe.name
    };
    scribe.apps[this.options.uniqueId] = this;
    const copyingData = { scribe: scribeInfo };
    await this._updateData({ copying: copyingData });
  }

  async setDate(dataset) {
    ui.notifications.info(
      game.i18n.format("arm5e.notification.setDate", {
        year: dataset.year,
        season: game.i18n.localize(CONFIG.ARM5E.seasons[dataset.season].label)
      })
    );
    await game.settings.set("arm5e", "currentDate", {
      year: dataset.year,
      season: dataset.season
    });
    this.render();
  }

  /**
   * Static submit handler invoked by Foundry's ApplicationV2 form machinery.
   * Merges the submitted form fields back into `this.object` while carefully
   * preserving array-indexed topics (which `mergeObject` would otherwise overwrite).
   */
  static async #onSubmitHandler(event, form, formData) {
    try {
      const expanded = foundry.utils.expandObject(formData.object);

      if (expanded.reading?.book?.system?.topics) {
        const topics = this.object.reading.book.system.topics;
        foundry.utils.mergeObject(topics, expanded.reading.book.system.topics);
        delete expanded.reading.book.system.topics;
      }
      if (expanded.writing?.book?.system?.topics) {
        const topics = this.object.writing.book.system.topics;
        foundry.utils.mergeObject(topics, expanded.writing.book.system.topics);
        delete expanded.writing.book.system.topics;
      }

      if (expanded.copying?.books) {
        const bookIndexes = Object.keys(expanded.copying.books);
        for (const index of bookIndexes) {
          if (expanded.copying.books[index].system?.topics) {
            const topics = this.object.copying.books[index].system.topics;
            foundry.utils.mergeObject(topics, expanded.copying.books[index].system.topics, {
              recursive: true
            });
            delete expanded.copying.books[index].system.topics;
          }
        }
        const books = this.object.copying.books;
        foundry.utils.mergeObject(books, expanded.copying.books);
        delete expanded.copying.books;
      }

      foundry.utils.mergeObject(this.object, expanded, { recursive: true });
      this.render();
    } catch (err) {
      console.error("Scriptorium | submit failed:", err);
      ui.notifications.error(game.i18n.localize("arm5e.scriptorium.msg.error"));
      this.render();
    }
  }

  /**
   * Handle the `<select>` that changes the topic category (ability/art/mastery/labText)
   * for the current book topic in reading or writing.
   * Resets the topic fields to safe defaults for the newly selected category.
   */
  async _changeBookTopic(event) {
    event.preventDefault();
    const index = Number(event.currentTarget.dataset.index);
    const activity = event.currentTarget.dataset.activity;
    let chosenTopic = this.element.querySelector(`.book-topic-change.${activity}`).value;
    const topicData = this.object[activity].book.system.topics[index];
    if (chosenTopic === "ability") {
      topicData.art = null;
      topicData.key = "awareness";
      topicData.option = "";
      topicData.spellName = null;
      topicData.name = "";
      topicData.category = "ability";
      topicData.labtext = null;
    } else if (chosenTopic === "art") {
      // Missing data, reset to default
      topicData.art = "cr";
      topicData.key = null;
      topicData.option = "";
      topicData.spellName = null;
      topicData.name = null;
      topicData.category = "art";
      topicData.labtext = null;
    } else if (chosenTopic === "mastery") {
      topicData.art = null;
      topicData.key = null;
      topicData.option = "";
      topicData.spellName = "Mastered spell";
      topicData.name = null;
      topicData.category = "mastery";
      topicData.type = "Tractatus";
      topicData.labtext = null;
    } else if (chosenTopic === "labText") {
      topicData.art = null;
      topicData.key = null;
      topicData.spellName = null;
      topicData.name = null;
      topicData.option = "";
      topicData.category = "labText";
      // BUG-FIX: was `topicData.labText = null` (capital T), inconsistent with the `labtext`
      // field name used everywhere else in the system.
      topicData.labtext = null;
      // TODO
    }
    await this._updateData({ [`${activity}.book.system.topics.${index}`]: topicData });
    // Log(false, `Book topic: ${item.system.topic}`);
  }

  /**
   * Validate the writing context and push warnings/errors into `context.ui.writing`.
   * Checks literacy, language availability, and Tractatus limits per topic category.
   * @param {object}   context - Prepared context (mutated in-place).
   * @param {ArM5eActor} writer - The writing actor document.
   */
  checkWriting(context, writer) {
    const bookData = context.writing.book;
    const topic = context.writing.book.system.topics[context.newTopicIndex];
    // Is the character able to  read?
    let writingSkill = writer.getAbilityStats("artesLib");
    if (writingSkill.score == 0) {
      context.ui.writing.warning.push(game.i18n.localize("arm5e.scriptorium.msg.illiterate"));
      context.ui.writing.error = true;
    }
    // Know any language at proper level?
    if (context.writing.writer.languages.length == 0) {
      context.ui.writing.warning.push(game.i18n.localize("arm5e.scriptorium.msg.noLanguage"));
      context.ui.writing.error = true;
    }

    switch (topic.category) {
      case "ability": {
        if (topic.type === "Tractatus") {
          const tractati = this.getWrittenTractati(writer);
          const tnum = tractati.filter((e) => {
            return e.topic.key == topic.key && e.topic.option == topic.option;
          }).length;
          if (tnum) {
            const writerScore = writer.getAbilityStats(topic.key, topic.option);

            if (Math.ceil(writerScore.score / 2) == tnum) {
              context.ui.writing.warning.push(
                game.i18n.localize("arm5e.scriptorium.msg.tooManyTractati")
              );
            }
          }
        }
        break;
      }
      case "art": {
        if (topic.type === "Tractatus") {
          const tractati = this.getWrittenTractati(writer);

          const tnum = tractati.filter((e) => {
            return e.topic.art == topic.art;
          }).length;
          if (tnum) {
            const writerScore = writer.getArtStats(topic.art);

            if (Math.ceil(writerScore.score / 5) == tnum) {
              context.ui.writing.warning.push(
                game.i18n.localize("arm5e.scriptorium.msg.tooManyTractati")
              );
            }
          }
        }
        break;
      }
      case "mastery": {
        const tractati = this.getWrittenTractati(writer);
        const tnum = tractati.filter((e) => {
          return (
            e.topic.spellName == topic.spellName &&
            e.topic.spellTech == topic.spellTech &&
            e.topic.spellForm == topic.spellForm
          );
        }).length;
        if (tnum) {
          const writerScore = writer.getSpellMasteryStats(context.writing.writer.spell);

          if (Math.ceil(writerScore.score / 2) == tnum) {
            context.ui.writing.warning.push(
              game.i18n.localize("arm5e.scriptorium.msg.tooManyTractati")
            );
          }
        }

        break;
      }
      case "labText": {
        if (context.writing.labTextTotal > context.writing.writer.writingScore) {
          context.ui.writing.warning.push(
            game.i18n.localize("arm5e.scriptorium.msg.tooManyLTLevels")
          );
          context.ui.writing.error = true;
        }
        break;
      }
    }
  }

  /**
   * Validate the copying context and push warnings/errors into `context.ui.copying`.
   * Checks literacy, language availability, and topic-category familiarity.
   * @param {object}   context - Prepared context (mutated in-place).
   * @param {ArM5eActor} scribe - The copying actor document.
   */
  checkCopying(context, scribe) {
    // Is the character able to  read?
    let readingSkill = scribe.getAbilityStats("artesLib");
    if (readingSkill.score == 0) {
      context.ui.copying.warning.push(game.i18n.localize("arm5e.scriptorium.msg.illiterate"));
      context.ui.copying.error = true;
    }
    if (context.copying.scribe.languages.length == 0) {
      context.ui.copying.warning.push(game.i18n.localize("arm5e.scriptorium.msg.noLanguage"));
      context.ui.copying.error = true;
    }
    let unconfirmedLang = 0;
    for (const book of context.copying.books) {
      const currentTopic = book.system.topics[book.system.topicIndex];
      if (!currentTopic.languageConfirmed) {
        unconfirmedLang++;
      }
      switch (currentTopic.category) {
        case "ability": {
          const checkCategory = CONFIG.ARM5E.LOCALIZED_ABILITIES_ENRICHED.find(
            (e) => e.system.key == currentTopic.key
          );

          const restrictedCat = ["supernaturalCat", "mystery"].includes(
            checkCategory.system.category
          );
          const restrictedAb = ["magicTheory", "parma"].includes(currentTopic.key);

          if (restrictedCat) {
            context.ui.copying.warning.push(
              `${game.i18n.localize(
                "arm5e.scriptorium.msg.unfamiliarTopic2"
              )} (${game.i18n.localize(
                CONFIG.ARM5E.LOCALIZED_ABILITIES[currentTopic.key].mnemonic
              )}${currentTopic.option === "" ? "" : ` : ${currentTopic.option}`})`
            );
          }
          const ab = scribe.system.abilities.find((a) => {
            return a.system.key === currentTopic.key;
          });
          break;
        }

        case "art":
        case "mastery":
        case "spell": {
          const magicTheory = scribe.getAbilityStats("magicTheory");
          if (magicTheory.score < 1) {
            context.ui.copying.warning.push(
              game.i18n.format("arm5e.scriptorium.msg.unfamiliarTopic", {
                topic: game.i18n.localize(CONFIG.ARM5E.books.categories[currentTopic.category])
              })
            );
          }
          break;
        }
      }
    }

    if (unconfirmedLang) {
      context.ui.copying.warning.push(game.i18n.localize("arm5e.scriptorium.msg.unconfirmedLang"));
      context.ui.copying.error = true;
    }
  }

  /**
   * Validate the reading context and push warnings/errors into `context.ui.reading`.
   * Checks literacy, language, level/quality validity, author match, and Tractatus history.
   * @param {object}   context - Prepared context (mutated in-place).
   * @param {ArM5eActor} reader - The reading actor document.
   */
  checkReading(context, reader) {
    const bookData = context.reading.book;
    const currentTopic = context.reading.book.system.topics[context.topicIndex];
    // Is the character able to  read?
    let readingSkill = reader.getAbilityStats("artesLib");
    if (readingSkill.score == 0) {
      context.ui.reading.warning.push(game.i18n.localize("arm5e.scriptorium.msg.illiterate"));
      context.ui.reading.error = true;
    }
    // Know any language at proper level?
    if (context.reading.reader.languages.length == 0) {
      context.ui.reading.warning.push(game.i18n.localize("arm5e.scriptorium.msg.noLanguage"));
      // BUG-FIX: was `context.error = true`; should target the reading UI sub-tree.
      context.ui.reading.error = true;
    }
    if (currentTopic.type === "Summa") {
      if (Number.isNaN(currentTopic.level) || currentTopic.level < 1) {
        // BUG-FIX: was `context.reading.ui.warning.push` (wrong path) and missing error flag.
        context.ui.reading.warning.push(game.i18n.localize("arm5e.scriptorium.msg.invalidLevel"));
        context.ui.reading.error = true;
      }
    }
    if (Number.isNaN(currentTopic.quality) || currentTopic.quality < 1) {
      context.ui.reading.warning.push(game.i18n.localize("arm5e.scriptorium.msg.invalidQuality"));
      context.ui.reading.error = true;
    }

    if (reader.name == currentTopic.author) {
      context.ui.reading.warning.push(game.i18n.localize("arm5e.scriptorium.msg.readerIsAuthor"));
      context.ui.reading.error = true;
    }

    switch (currentTopic.category) {
      case "ability": {
        const checkCategory = CONFIG.ARM5E.LOCALIZED_ABILITIES_ENRICHED.find(
          (e) => e.system.key == currentTopic.key
        );
        const supernatural =
          checkCategory.system.category === "supernaturalCat" ||
          ["enigma", "faerieMagic", "heartbeast", "verditiusMagic"].includes(currentTopic.key);
        let ab = reader.system.abilities.find((a) => {
          return a._id === context.reading.reader.ability;
        });
        if (supernatural && (!ab || ab.system.derivedScore == 0)) {
          context.ui.reading.warning.push(
            game.i18n.localize("arm5e.scriptorium.msg.missingSupernatural")
          );
          context.ui.reading.error = true;
        } else if (currentTopic.type === "Summa") {
          if (ab?.system.derivedScore >= currentTopic.level) {
            context.ui.reading.warning.push(game.i18n.localize("arm5e.scriptorium.msg.tooSkilled"));
            context.ui.reading.error = true;
          } else if (ab) {
            this.checkAbilityOverload(context, reader, ab);
          }
        } else {
          const tractati = this.getReadTractati(reader);
          const t = tractati.find((e) => {
            return (
              e.topic.key == currentTopic.key &&
              e.topic.option == currentTopic.option &&
              e.topic.quality == currentTopic.quality
            );
          });
          if (t) {
            context.ui.reading.warning.push(
              game.i18n.format("arm5e.scriptorium.msg.tractatusAlreadyRead", { title: t.title })
            );
          }
        }
        break;
      }
      case "art": {
        if (!reader.isMagus()) {
          context.ui.reading.warning.push(game.i18n.localize("arm5e.scriptorium.msg.notMagus"));
          context.ui.reading.error = true;
        }
        if (currentTopic.type === "Summa") {
          let art = reader.getArtStats(currentTopic.art);
          if (art.derivedScore >= currentTopic.level) {
            context.ui.reading.warning.push(game.i18n.localize("arm5e.scriptorium.msg.tooSkilled"));
            context.ui.reading.error = true;
          } else {
            currentTopic.cappedGain = this.checkArtOverload(context, reader, art);
          }
        } else {
          const tractati = this.getReadTractati(reader);

          const t = tractati.find((e) => {
            return e.topic.art == currentTopic.art && e.topic.quality == currentTopic.quality;
          });
          if (t) {
            context.ui.reading.warning.push(
              game.i18n.format("arm5e.scriptorium.msg.tractatusAlreadyRead", { title: t.title })
            );
          }
        }
        break;
      }
      case "mastery": {
        if (!reader.isMagus()) {
          context.ui.reading.warning.push(game.i18n.localize("arm5e.scriptorium.msg.notMagus"));
          context.ui.reading.error = true;
        }
        const tractati = this.getReadTractati(reader);
        const t = tractati.find((e) => {
          return (
            e.topic.spellName == currentTopic.spellName &&
            e.topic.spellTech == currentTopic.spellTech &&
            e.topic.spellForm == currentTopic.spellForm &&
            e.topic.quality == currentTopic.quality
          );
        });
        if (t) {
          context.ui.reading.warning.push(
            game.i18n.format("arm5e.scriptorium.msg.tractatusAlreadyRead", { title: t.title })
          );
        }
        break;
      }
    }
  }

  /**
   * Check whether reading this Summa would exceed the art XP cap.
   * If so, clamp `currentTopic.quality` to the remaining XP budget and return `true`.
   * Modifies `currentTopic.theoriticalQuality` (note: typo preserved for data compatibility)
   * with the original un-capped value for display.
   * @param {object}    context - Prepared reading context.
   * @param {ArM5eActor} reader  - The reader actor.
   * @param {object}    artStat - Art stats object from `reader.getArtStats()`.
   * @returns {boolean} `true` if XP was capped, `false` otherwise.
   */
  checkArtOverload(context, reader, artStat) {
    // Let artStat = reader.getArtStats();
    const coeff = artStat.xpCoeff;
    const currentTopic = context.reading.book.system.topics[context.reading.book.system.topicIndex];
    let newXp = currentTopic.quality + reader.system.bonuses.activities.reading + artStat.xp;
    let maxXp = ArM5eActor.getArtXp(currentTopic.level) / coeff;
    if (newXp > maxXp) {
      let newSource = maxXp - artStat.xp;
      currentTopic.theoriticalQuality = currentTopic.quality;
      currentTopic.quality = newSource > 0 ? newSource : 0;
      if (currentTopic.quality == 0) {
        context.ui.reading.error = true;
      }
      if (context.ui?.reading?.warning) {
        context.ui.reading.warning.push(
          game.i18n.format("arm5e.scriptorium.msg.cappedQuality", {
            item: currentTopic.quality
          })
        );
      }
      return true;
    }
    return false;
  }

  /**
   * Check whether reading this Summa would exceed the ability XP cap.
   * Mirrors {@link checkArtOverload} but uses ability XP thresholds.
   * @param {object}    context  - Prepared reading context.
   * @param {ArM5eActor} reader   - The reader actor.
   * @param {object}    ability  - The ability item document (`reader.system.abilities` entry).
   * @returns {boolean} `true` if XP was capped, `false` otherwise.
   */
  checkAbilityOverload(context, reader, ability) {
    const coeff = ability.system.xpCoeff;
    const currentTopic = context.reading.book.system.topics[context.reading.book.system.topicIndex];
    let newXp = currentTopic.quality + reader.system.bonuses.activities.reading + ability.system.xp;
    let maxXp = ArM5eActor.getAbilityXp(currentTopic.level) / coeff;
    if (newXp > maxXp) {
      let newSource = maxXp - ability.system.xp;
      currentTopic.theoriticalQuality = currentTopic.quality;
      currentTopic.quality = newSource > 0 ? newSource : 0;
      if (currentTopic.quality == 0) {
        context.ui.reading.error = true;
      }
      if (context.ui?.reading?.warning) {
        context.ui.reading.warning.push(
          game.i18n.format("arm5e.scriptorium.msg.cappedQuality", {
            item: currentTopic.quality
          })
        );
      }
      return true;
    }
    return false;
  }

  /**
   * Return the list of Tractati already read by `actor` (from their diary entries).
   * Only entries with `flags == 8` and a `Tractatus` topic type are included.
   * @param {ArM5eActor} actor
   * @returns {{ title: string, topic: object }[]}
   */
  getReadTractati(actor) {
    const reading = actor._getDiariesOfType("reading");

    const tractati = reading.filter((e) => {
      return e.system.externalIds.find((d) => {
        return d.flags == 8 && d.data.topic?.type == "Tractatus";
      });
    });
    // ExternalId is an array!
    return tractati.map((e) => {
      return {
        title: e.system.externalIds[0].data.title,
        topic: e.system.externalIds[0].data.topic
      };
    });
  }

  /**
   * Return the list of Tractati already written by `actor` (from their diary entries).
   * Used to enforce per-topic Tractatus authorship limits (score/2 or score/5 for arts).
   * @param {ArM5eActor} actor
   * @returns {{ title: string, topic: object }[]}
   */
  getWrittenTractati(actor) {
    const writing = actor._getDiariesOfType("writing");

    const tractati = writing.filter((e) => {
      return e.system.externalIds.find((d) => {
        return d.flags == 8 && d.data.topic?.type == "Tractatus";
      });
    });
    // ExternalId is an array!
    return tractati.map((e) => {
      return {
        title: e.system.externalIds[0].data.title,
        topic: e.system.externalIds[0].data.topic
      };
    });
  }
}
