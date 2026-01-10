import { ArM5eActor } from "../actor/actor.js";
import { FLAVORS } from "../constants/ui.js";
import ArM5eActiveEffect from "../helpers/active-effects.js";
import { computeLevel, spellFormLabel, spellTechniqueLabel } from "../helpers/magic.js";
import { getTopicDescription } from "../item/item-book-sheet.js";
import { effectToLabText } from "../item/item-converter.js";
import { ArM5eItem } from "../item/item.js";
import { BookSchema } from "../schemas/bookSchema.js";
import { boolOption } from "../schemas/commonSchemas.js";
import { DiaryEntrySchema } from "../schemas/diarySchema.js";
import { compareTopics, debug, getDataset, log } from "../tools/tools.js";
import { selectItemDialog } from "../ui/dialogs.js";

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
            key: "",
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
            key: "",
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

export class Scriptorium extends FormApplication {
  constructor(data, options) {
    super(data, options);
    data.lists = {
      books: game.items.filter((i) => i.type === "book"),
      labTexts: game.items.filter((i) => i.type === "laboratoryText"),
      characters: game.actors.filter((a) => a.type === "player" || a.type === "npc")
    };
    data.selected = null;
    // Hooks.on("closeApplication", (app, html) => this.onClose(app));
  }

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["arm5e", "sheet", "scriptorium-sheet"],
      title: "Scriptorium",
      template: "systems/arm5e/templates/generic/scriptorium.html",
      dragDrop: [
        { dragSelector: null, dropSelector: ".drop-book" },
        { dragSelector: null, dropSelector: ".drop-reader" },
        { dragSelector: null, dropSelector: ".drop-scribe" },
        { dragSelector: null, dropSelector: ".drop-writer" },
        { dragSelector: null, dropSelector: ".append-book" },
        { dragSelector: null, dropSelector: ".add-labtext" }
      ],
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "reading"
        }
      ],
      width: "600",
      height: "800",
      submitOnChange: true,
      closeOnSubmit: false
    });
  }

  _canDragDrop(selector) {
    return true;
  }

  onClose(app) {
    // If (app.object.reading.book.uuid != null) {
    //   fromUuidSync(app.object.reading.book.uuid).apps[app.appId] = undefined;
    // }
    if (app.object?.reading?.reader.id != null) {
      let reader = game.actors.get(app.object.reading.reader.id);
      delete reader.apps[app.appId];
    }
  }

  async _onDrop(event) {
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
  }

  getUserCache() {
    let usercache = JSON.parse(sessionStorage.getItem(`usercache-${game.user.id}`));
    if (usercache.scriptorium == undefined) {
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

  async getData(options = {}) {
    const context = foundry.utils.expandObject(await super.getData().object);
    context.ui = {
      ...this.getUserCache(),
      reading: { warning: [], error: false, createPossible: "disabled" },
      writing: { warning: [], error: false, createPossible: "disabled" },
      copying: { warning: [], error: false, createPossible: "disabled" },
      editItem: ""
    };
    let currentDate = game.settings.get("arm5e", "currentDate");
    context.curYear = currentDate.year;
    context.curSeason = currentDate.season;
    if (context.reading.book.uuid !== null) {
      context.ui.canEditBook = "readonly";
      context.ui.disabledBook = "disabled";
    }

    if (context.writing.book.uuid !== null) {
      context.ui.canEditTitle = "readonly";
    }

    if (context.copying.books.length) {
      context.ui.canEditBook = "readonly";
      context.ui.disabledBook = "disabled";
    }

    let maxLevel = 99;
    const topicIndex = Number(context.reading.book.system.topicIndex);
    // For convenience

    context.topicIndex = Number(topicIndex);
    const currentTopic = context.reading.book.system.topics[context.topicIndex];
    if (currentTopic.type === "Summa" || currentTopic.level) {
      maxLevel = currentTopic.level;
    }

    context.reading.book.currentTopic = currentTopic;
    context.currentTopicNumber = context.topicIndex + 1 ?? 1;
    context.topicNum = context.reading.book.system.topics.length ?? 1;
    // New topic => writing

    context.newTopicIndex = context.writing.book.system.topics.length - 1;
    const newTopic = context.writing.book.system.topics[context.newTopicIndex];
    context.writing.book.newTopic = newTopic;
    context.copying.copyTypes = {
      ...CONFIG.ARM5E.books.types,
      labText: game.i18n.localize("ITEM.TypeLaboratorytext")
    };

    // Copied topic
    for (const book of context.copying.books) {
      const copyingTopicIndex = book.system.topicIndex;
      book.currentTopicToCopyNumber = copyingTopicIndex + 1 ?? 1;
      book.copyTopicNum = book.system.topics.length ?? 1;
      book.currentTopic = book.system.topics[copyingTopicIndex];
    }
    // Context.copyingTopicIndex = context.copying.currentTopic;

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
    }

    // //////////////
    // WRITING section
    // /////////////
    if (context.writing.writer?.id) {
      if (newTopic.type === "Summa" || newTopic.level) {
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
              qualityBonus =
                (context.writing.book.system.topics[context.newTopicIndex].maxLevel -
                  context.writing.book.system.topics[context.newTopicIndex].level) *
                3;
              // Adjust the level if it is above the max
              context.writing.book.system.topics[context.newTopicIndex].level = Math.min(
                context.writing.book.system.topics[context.newTopicIndex].level,
                context.writing.book.system.topics[context.newTopicIndex].maxLevel
              );
              work = context.writing.book.system.topics[context.newTopicIndex].level * 5;
            }
          } else {
            context.ui.reading.warning.push(
              game.i18n.localize("arm5e.scriptorium.writer.nothingToWrite")
            );
            context.ui.reading.error = true;
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
              qualityBonus =
                context.writing.book.system.topics[context.newTopicIndex].maxLevel -
                context.writing.book.system.topics[context.newTopicIndex].level;
              // Adjust the level if it is above the max
              context.writing.book.system.topics[context.newTopicIndex].level = Math.min(
                context.writing.book.system.topics[context.newTopicIndex].level,
                context.writing.book.system.topics[context.newTopicIndex].maxLevel
              );
              work = context.writing.book.system.topics[context.newTopicIndex].level;
            }
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
      // Quality bonus cannot be higher than twice the original bonus
      context.writing.book.system.topics[context.newTopicIndex].quality = Math.min(
        2 * (writer.system.characteristics.com.value + 6 + context.writing.writer.writingBonus),
        writer.system.characteristics.com.value +
          6 +
          context.writing.writer.writingBonus +
          qualityBonus
      );

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
            context.copying.total += topic.level;
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

    if (context.ui.reading.error === false) {
      context.ui.reading.createPossible = "";
    }
    if (context.ui.writing.error === false) {
      context.ui.writing.createPossible = "";
    }
    if (context.ui.copying.error === false) {
      context.ui.copying.createPossible = "";
    }

    // Log(false, `Scriptorium ui: ${JSON.stringify(context.ui)}`);
    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find(".set-date").click(this.setDate.bind(this));
    html.find(".change-season").change(this._changeSeason.bind(this));
    html.find(".change-year").change(this._changeYear.bind(this));
    html.find(".book-topic-change").change(this._changeBookTopic.bind(this));
    html.find(".unlink-read-book").click(this._resetReadBook.bind(this));

    html.find(".unlink-bookAppend").click(this._resetWriteBook.bind(this));

    html.find(".remove-labText").click(this._removeLabText.bind(this));
    html.find(".remove-labTextCopy").click(this._removeLabTextCopy.bind(this));

    html.find(".unlink-reader").click(this._resetReader.bind(this));
    html.find(".unlink-writer").click(this._resetWriter.bind(this));
    html.find(".unlink-scribe").click(this._resetScribe.bind(this));
    html.find(".create-reading-activity").click(this._createReadingDiaryEntry.bind(this));
    html.find(".create-writing-activity").click(async (event) => {
      const dataset = getDataset(event);
      if (dataset.category == "labText") {
        await this._createTranslatingDiaryEntry(event);
      } else {
        await this._createWritingDiaryEntry(event);
      }
    });
    html.find(".create-copying-activity").click(this._createCopyingDiaryEntry.bind(this));
    html.find(".section-handle").click(this._handle_section.bind(this));

    html.find(".next-topic").click(async (event) => this._changeCurrentTopic("reading", event, 1));
    html
      .find(".previous-topic")
      .click(async (event) => this._changeCurrentTopic("reading", event, -1));
    html.find(".next-topicToCopy").click(async (event) => this._changeTopic("copying", event, 1));
    html
      .find(".previous-topicToCopy")
      .click(async (event) => this._changeTopic("copying", event, -1));

    html.find(".remove-book").click(async (event) => this._removeBook(event));

    html.find(".language-writer").change(async (e) => this._changeWritenLanguage(e));

    // html.find(".drop-book").click(this.pickItem.bind(this, "book"));
    // html.find(".drop-reader").click(this.pickItem.bind(this, "character"));
    // html.find(".drop-scribe").click(this.pickItem.bind(this, "character"));
    // html.find(".drop-writer").click(this.pickItem.bind(this, "character"));
    // html.find(".append-book").click(this.pickItem.bind(this, "book"));
    // html.find(".add-labtext").click(this.pickItem.bind(this, "laboratoryText"));
  }

  async pickItem(type) {
    if (type === "book") {
      await selectItemDialog(this.object.lists.books, FLAVORS.LABORATORY);
    } else if (type === "character") {
      await selectItemDialog(this.object.lists.characters, FLAVORS.LABORATORY);
    } else if (type === "laboratoryText") {
      await selectItemDialog(this.object.lists.labTexts, FLAVORS.LABORATORY);
    }
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
    await this.submit({
      preventClose: true,
      updateData: updateData
    });
  }

  async _removeBook(event) {
    const dataset = getDataset(event);
    const bookIndex = Number(dataset.bookIndex);
    const index = Number(dataset.index);
    this.object.copying.books.splice(bookIndex, 1);
    this.render(true);
    // Await this.submit({
    //   preventClose: true,
    //   updateData: { "copying.books": books }
    // });
  }

  async _changeTopic(activity, event, offset) {
    const dataset = getDataset(event);
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
    await this.submit({
      preventClose: true,
      updateData: { [str]: books }
    });
  }

  async _changeCurrentTopic(activity, event, offset) {
    event.preventDefault();
    const newIndex = Number(getDataset(event).index) + offset;
    if (newIndex > this.object[activity].book.system.topics.length - 1 || newIndex < 0) {
      // No effect
      return;
    }
    // Let updateData = ;
    // updateData["reading.book.system.topicIndex"] = newIndex;
    const str = `${activity}.book.system.topicIndex`;
    await this.submit({
      preventClose: true,
      updateData: { [str]: newIndex }
    });
  }

  async _handle_section(ev) {
    const dataset = getDataset(ev);
    log(false, `DEBUG section: ${dataset.section}, category: ${dataset.category}`);
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

  async _createTranslatingDiaryEntry(event) {
    const objectData = foundry.utils.expandObject(this.object);
    const writer = game.actors.get(objectData.writing.writer.id);

    const writerData = objectData.writing.writer;
    const book = foundry.utils.deepClone(objectData.writing.book);
    const dataset = event.currentTarget.dataset;
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

  async _createCopyingDiaryEntry(event) {
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

  async _createWritingDiaryEntry(event) {
    const objectData = foundry.utils.expandObject(this.object);
    const writer = game.actors.get(objectData.writing.writer.id);

    const writerData = objectData.writing.writer;
    const book = objectData.writing.book;
    const dataset = event.currentTarget.dataset;
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

  async _createReadingDiaryEntry(event) {
    const objectData = foundry.utils.expandObject(this.object);
    const reader = game.actors.get(objectData.reading.reader.id);
    const readerData = objectData.reading.reader;
    const book = objectData.reading.book;
    const dataset = event.currentTarget.dataset;
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
      case "mastery":
        let readerSpell = reader.system.spells.find((s) => s.id === dataset.spellId);
        entryData[0].system.progress.spells.push({
          id: dataset.spellId,
          name: readerSpell.name,
          maxLevel: 0,
          form: readerSpell.system.form.value,
          xp: entryData[0].system.cappedGain
            ? quality
            : quality + reader.system.bonuses.activities.reading
        });
    }
    let entry = await reader.createEmbeddedDocuments("Item", entryData, {});
    entry[0].sheet.render(true);
  }

  async _resetReader(event) {
    let reader = game.actors.get(this.object.reading.reader.id);
    delete reader.apps[this.appId];
    let updatedData = {
      "reading.reader.id": null,
      "reading.reader.name": "",
      "reading.reader.ability": "",
      "reading.reader.spellName": "",
      "reading.reader.language": ""
    };
    await this.submit({
      preventClose: true,
      updateData: updatedData
    });
  }

  async _resetWriter(event) {
    let writer = game.actors.get(this.object.writing.writer.id);
    delete writer.apps[this.appId];
    let updatedData = {
      "writing.writer.id": null,
      "writing.writer.name": "",
      "writing.writer.ability": "",
      "writing.writer.spellName": "",
      "writing.writer.language": ""
    };
    await this.submit({
      preventClose: true,
      updateData: updatedData
    });
  }

  async _resetScribe(event) {
    let scribe = game.actors.get(this.object.copying.scribe.id);
    delete scribe.apps[this.appId];
    let updatedData = {
      "copying.scribe.id": null,
      "copying.scribe.name": "",
      "copying.scribe.ability": "",
      "copying.scribe.spellName": "",
      "copying.scribe.language": ""
    };
    await this.submit({
      preventClose: true,
      updateData: updatedData
    });
  }

  async _resetReadBook(event) {
    const objectData = foundry.utils.expandObject(this.object);
    const index = event.currentTarget.dataset.index;
    const singleTopic = objectData.reading.book.system.topics[index];
    singleTopic.level = singleTopic.type === "Tractatus" ? 0 : singleTopic.level;
    let updatedData = {
      "reading.book.id": null,
      "reading.book.uuid": null,
      "reading.book.system.topics": [singleTopic],
      "reading.book.system.topicIndex": 0
    };
    await this.submit({
      preventClose: true,
      updateData: updatedData
    });
  }

  async _resetWriteBook(event) {
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
    await this.submit({
      preventClose: true,
      updateData: updatedData
    });
  }

  async _changeSeason(event) {
    await this.submit({
      preventClose: true,
      updateData: { season: event.currentTarget.value }
    });
  }

  async _changeYear(event) {
    await this.submit({
      preventClose: true,
      updateData: { year: event.currentTarget.value }
    });
  }

  async _setReadingBook(book) {
    if (!book.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER)) {
      ui.notifications.info(game.i18n.localize("arm5e.scriptorium.msg.bookNoAccess"));
      return;
    }
    let index = book.getFlag("arm5e", "currentBookTopic") ?? 0;
    book.system.topicIndex = index;
    // Book.apps[this.appId] = this;

    await this.submit({
      preventClose: true,
      updateData: {
        "reading.book": { name: book.name, id: book.id, uuid: book.uuid, system: book.system }
      }
    });
  }

  async _setWritingBook(book) {
    if (!book.isOwned) {
      ui.notifications.info(game.i18n.localize("arm5e.scriptorium.msg.bookNotOwned"));
      return;
    }
    const newTopicIndex = book.system.topics.length;
    let newTopic =
      this.object.writing.book.system.topics[this.object.writing.book.system.topics.length - 1];
    // Book.apps[this.appId] = this;
    book.system.topics.push(newTopic);
    book.system.topicIndex = book.system.topics.length - 1;

    await this.submit({
      preventClose: true,
      updateData: {
        "writing.book": { name: book.name, id: book.id, uuid: book.uuid, system: book.system }
      }
    });
  }

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
    await this.submit({
      preventClose: true,
      updateData: {
        "copying.topicType": topicType,
        "copying.books": books
      }
    });
  }

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
    await this.submit({
      preventClose: true,
      updateData: {
        labTexts: labtexts
      }
    });
  }

  async _addLabTextToCopy(text) {
    if (this.object.copying.books.length) {
      return;
    }
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
    await this.submit({
      preventClose: true,
      updateData: {
        "copying.labTexts": labtexts,
        "copying.topicType": "labText"
      }
    });
  }

  async _removeLabText(event) {
    const dataset = getDataset(event);

    let labtexts = foundry.utils.duplicate(this.object.labTexts);
    labtexts.splice(Number(dataset.index), 1);
    await this.submit({
      preventClose: true,
      updateData: {
        labTexts: labtexts
      }
    });
  }

  async _removeLabTextCopy(event) {
    const dataset = getDataset(event);

    let labtexts = foundry.utils.duplicate(this.object.copying.labTexts);
    labtexts.splice(Number(dataset.index), 1);
    await this.submit({
      preventClose: true,
      updateData: {
        "copying.labTexts": labtexts
      }
    });
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
    reader.apps[this.appId] = this;
    const readingData = { reader: readerInfo };
    await this.submit({
      preventClose: true,
      updateData: { reading: readingData }
    });
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
    writer.apps[this.appId] = this;
    const writingData = { writer: writerInfo };
    await this.submit({
      preventClose: true,
      updateData: { writing: writingData }
    });
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
    scribe.apps[this.appId] = this;
    const copyingData = { scribe: scribeInfo };
    await this.submit({
      preventClose: true,
      updateData: { copying: copyingData }
    });
  }

  async setDate(event) {
    event.preventDefault();
    const dataset = event.currentTarget.dataset;
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

  async _updateObject(event, formData) {
    const expanded = foundry.utils.expandObject(formData);

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
    // If (formData.season) {
    //   this.object.season = formData.season;
    // }
    // if (formData.year) {
    //   this.object.year = formData.year;
    // }
    // for (let [key, value] of Object.entries(formData)) {
    //   log(false, `Updated ${key} : ${value}`);
    //   this.object[key] = value;
    // }
    // this.object = foundry.utils.expandObject(this.object);
    // // log(false, `Scriptorium object: ${JSON.stringify(this.object)}`);
    // this.render();
  }

  async _changeBookTopic(event) {
    event.preventDefault();
    const index = Number(event.currentTarget.dataset.index);
    const activity = event.currentTarget.dataset.activity;
    let chosenTopic = $(`.book-topic-change.${activity}`).val();
    const topicData = this.object[activity].book.system.topics[index];
    if (chosenTopic === "ability") {
      topicData.art = null;
      topicData.key = "awareness";
      topicData.option = "";
      topicData.spellName = null;
      topicData.name = "";
      topicData.category = "ability";
      topicData.labText = null;
    } else if (chosenTopic === "art") {
      // Missing data, reset to default
      topicData.art = "cr";
      topicData.key = null;
      topicData.option = "";
      topicData.spellName = null;
      topicData.name = null;
      topicData.category = "art";
      topicData.labText = null;
    } else if (chosenTopic === "mastery") {
      topicData.art = null;
      topicData.key = null;
      topicData.option = "";
      topicData.spellName = "Mastered spell";
      topicData.name = null;
      topicData.category = "mastery";
      topicData.type = "Tractatus";
      topicData.labText = null;
    } else if (chosenTopic === "labText") {
      topicData.art = null;
      topicData.key = null;
      topicData.spellName = null;
      topicData.name = null;
      topicData.option = "";
      topicData.category = "labText";
      // TODO
    }
    await this.submit({
      preventClose: true,
      updateData: { [`${activity}.book.system.topics.${index}`]: topicData }
    });
    // Log(false, `Book topic: ${item.system.topic}`);
  }

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
          const tractati = this.getWritenTractati(writer);
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
          const tractati = this.getWritenTractati(writer);

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
        const tractati = this.getWritenTractati(writer);
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

  checkCopying(context, scribe) {
    // Is the character able to  read?
    let readingSkill = scribe.getAbilityStats("artesLib");
    if (readingSkill.score == 0) {
      context.ui.copying.warning.push(game.i18n.localize("arm5e.scriptorium.msg.illiterate"));
      context.ui.copying.error = true;
    }
    if (context.copying.scribe.languages.length == 0) {
      context.ui.copying.warning.push(game.i18n.localize("arm5e.scriptorium.msg.noLanguage"));
      context.error = true;
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
      context.error = true;
    }
  }

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
      context.error = true;
    }
    if (currentTopic.type === "Summa") {
      if (Number.isNaN(currentTopic.level) || currentTopic.level < 1) {
        context.reading.ui.warning.push(game.i18n.localize("arm5e.scriptorium.msg.invalidLevel"));
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
      case "mastery":
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

  getWritenTractati(actor) {
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
