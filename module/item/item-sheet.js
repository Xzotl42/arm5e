import { getDataset, log } from "../tools.js";
import ArM5eActiveEffect from "../helpers/active-effects.js";
import { ARM5E_DEFAULT_ICONS, getConfirmation } from "../constants/ui.js";
import { ArM5eActorSheet } from "../actor/actor-sheet.js";
import { EnchantmentExtension } from "../schemas/enchantmentSchema.js";
import { ArM5eItemEnchantmentSheet } from "./subsheet/enchant-extension-sheet.js";
import { ARM5E } from "../config.js";
import { effectToLabText } from "./item-converter.js";
import { Sanatorium } from "../tools/sanatorium.js";
/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class ArM5eItemSheet extends ItemSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["arm5e", "sheet", "item"],
      width: 650,
      height: 750,
      // resizable: false,
      // dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}],
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "description"
        }
      ],
      dragDrop: [
        { dragSelector: null, dropSelector: ".drop-enchant" },
        { dragSelector: ".drag-enchant", dropSelector: null }
      ],
      scrollY: [".window-content"]
    });
  }

  constructor(data, options) {
    super(data, options);
    if (Object.keys(ARM5E.lab.enchantment.enchantableTypes).includes(this.item.type)) {
      this.enchantPossible = true;
      this.enchantSheet = new ArM5eItemEnchantmentSheet(this);
    }
  }

  // _onDragStart(event) {
  //   const li = event.currentTarget;
  //   // Create drag data
  //   let dragData;

  // }

  async _onDrop(event) {
    const dropData = TextEditor.getDragEventData(event);
    if (dropData.type == "Item") {
      if (this.enchantPossible) {
        const enchant = await Item.implementation.fromDropData(dropData);
        if (["enchantment", "spell", "magicalEffect"].includes(enchant.type)) {
          log(false, "Enchant dropped");
          // if (this.item.system.enchantments == null) {
          //   const updateData = {};
          //   updateData["system.state"] = "appraised";
          //   updateData["system.enchantments"] = new EnchantmentExtension();
          //   await this.item.update(updateData);
          // }
          await this.enchantSheet.addEnchantment(enchant);
        }
      }
    }
    // else if (dropData.type == "Actor" && event.currentTarget.dataset.drop === "reader") {
    //   const reader = await Actor.implementation.fromDropData(dropData);
    //   if (reader.type === "player" || reader.type === "npc") {
    //     await this._setReader(reader);
    //   }
    // }
  }

  /** @override */
  get template() {
    const path = "systems/arm5e/templates/item";
    // Return a single sheet for all item types.
    // return `${path}/item-sheet.html`;

    // Alternatively, you could use the following return statement to do a
    // unique item sheet by type, like `weapon-sheet.html`.

    switch (this.item.type) {
      case "vis":
        this.options.tabs = [];
        break;
      default:
        break;
    }

    if (this.item.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER)) {
      return `${path}/item-main-sheet.html`;
    }
    return `${path}/item-limited-sheet.html`;
  }

  get subsheetTemplate() {
    const path = "systems/arm5e/templates/item";
    // Return a single sheet for all item types.
    // return `${path}/item-sheet.html`;

    // Alternatively, you could use the following return statement to do a
    // unique item sheet by type, like `weapon-sheet.html`.

    switch (this.item.type) {
      case "vis":
        this.options.tabs = [];
        break;
      default:
        break;
    }

    if (this.item.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER)) {
      if (this.item.type === "inhabitant") {
        return this.getInhabitantSheet(path, this.item.system.category);
      }

      return `${path}/item-${this.item.type}-sheet.html`;
    }
    return `${path}/item-limited-sheet.html`;
  }

  /* -------------------------------------------- */

  getUserCache() {
    let usercache = JSON.parse(sessionStorage.getItem(`usercache-${game.user.id}`));
    if (usercache[this.item.id] == undefined) {
      usercache[this.item.id] = {
        sections: { visibility: { common: {}, book: {} } }
      };

      sessionStorage.setItem(`usercache-${game.user.id}`, JSON.stringify(usercache));
    } else if (usercache[this.item.id].sections == undefined) {
      usercache[this.item.id].sections = { visibility: { common: {}, book: {} } };
      sessionStorage.setItem(`usercache-${game.user.id}`, JSON.stringify(usercache));
    }
    return usercache[this.item.id];
  }

  /** @override */
  async getData() {
    const context = await super.getData();
    context.isGM = game.user.isGM;
    // Use a safe clone of the item data for further operations.
    const itemData = context.item;
    context.subsheet = this.subsheetTemplate;
    context.rollData = this.item.getRollData();
    context.ui = this.getUserCache();
    context.ui.flavor = "Neutral";
    context.selection = {};
    // Add the item's data to context.system for easier access, as well as flags.
    context.system = itemData.system;
    if (CONFIG.ISV10) {
      if (this.enchantPossible && context.system.state != "inert") {
        await this.enchantSheet.getData(context);
      } else {
        context.stateEdit = "disabled";
      }
    } else {
      if (this.enchantPossible && context.system.enchantments != null) {
        await this.enchantSheet.getData(context);
      } else {
        context.stateEdit = "disabled";
      }
    }

    if (this.item.system.description) {
      context.enrichedDescription = await TextEditor.enrichHTML(this.item.system.description, {
        // Whether to show secret blocks in the finished html
        secrets: this.document.isOwner,
        // Necessary in v11, can be removed in v12
        async: true,
        // Data to fill in for inline rolls
        rollData: context.rollData,
        // Relative UUID resolution
        relativeTo: this.item
      });
    }

    if (this.item.system.form) {
      context.enrichedForm = await TextEditor.enrichHTML(this.item.system.form, {
        // Whether to show secret blocks in the finished html
        secrets: this.document.isOwner,
        // Necessary in v11, can be removed in v12
        async: true,
        // Data to fill in for inline rolls
        rollData: context.rollData,
        // Relative UUID resolution
        relativeTo: this.item
      });
    }

    context.flags = itemData.flags;
    // context.ui.flavor = "Neutral";
    context.config = CONFIG.ARM5E;
    if (itemData.type == "weapon" && this.item.isOwned && this.item.actor._isCharacter()) {
      context.system.abilities = this.actor.system.abilities.map((v) => {
        return { id: v._id, name: `${v.name} (${v.system.speciality}) - ${v.system.finalScore}` };
      });
      context.system.abilities.unshift({
        id: "",
        name: "N/A"
      });
      //console.log("item-sheet get data weapon")
      //console.log(data)
    } else if (
      itemData.type == "ability" ||
      itemData.type == "diaryEntry" ||
      itemData.type == "book"
    ) {
      if (itemData.type == "ability") {
        if (["altTechnique", "altForm"].includes(itemData.system.category)) {
          itemData.system.altArt = true;
        }
        context.abilityKeysList = foundry.utils.deepClone(CONFIG.ARM5E.LOCALIZED_ABILITIES);
        delete context.abilityKeysList.technique;
        delete context.abilityKeysList.altTechnique;
        delete context.abilityKeysList.form;
        delete context.abilityKeysList.altForm;
        context.canBeAccelerated = false;
        if (
          itemData.system.altArt ||
          ["arcane", "supernaturalCat", "mystery"].includes(itemData.system.category)
        ) {
          context.canBeAccelerated = true;
        }
        if (CONFIG.ARM5E.ALL_ABILITIES[context.system.key].option) {
          context.ui.hasOption = true;
          context.ui.optionLocked = context.system.optionLinked ? "readonly" : "";
        }
      } else {
        context.abilityKeysList = CONFIG.ARM5E.LOCALIZED_ABILITIES;
      }
    }
    context.isOwned = this.item.isOwned;
    if (context.isOwned) {
      switch (this.actor.type) {
        case "player":
          context.ui.flavor = "PC";
          break;
        case "npc":
          context.ui.flavor = "NPC";
          break;
        case "beast":
          context.ui.flavor = "Beast";
          break;
        case "covenant":
          context.ui.flavor = "covenant";
          break;
        case "magicCodex":
          context.ui.flavor = "codex";
          break;
        case "laboratory":
          context.ui.flavor = "Lab";
          break;
        default:
          break;
      }
    }
    if (["weapon", "armor", "book", "item", "inhabitant", "labCovenant"].includes(itemData.type)) {
      if (context.isOwned) {
        context.system.effectCreation = CONFIG.ISV10 ? false : true;
      } else {
        context.system.effectCreation = true;
      }
    } else if (itemData.type == "virtue" || itemData.type == "flaw") {
      if (context.isOwned) {
        context.system.effectCreation = CONFIG.ISV10 ? false : true;
        switch (context.item.parent.type) {
          case "laboratory":
            context.config.virtueFlawTypes.available = {
              ...context.config.virtueFlawTypes.laboratory,
              ...context.config.virtueFlawTypes.all
            };
            break;
          case "covenant":
            context.config.virtueFlawTypes.available = {
              ...context.config.virtueFlawTypes.covenant,
              ...context.config.virtueFlawTypes.all
            };
            break;
          case "player":
          case "npc":
          case "beast":
            context.config.virtueFlawTypes.available = {
              ...context.config.virtueFlawTypes.character,
              ...context.config.virtueFlawTypes.all
            };
            break;
        }
      } else {
        context.system.effectCreation = true;
        context.config.virtueFlawTypes.available = {
          ...context.config.virtueFlawTypes.character,
          ...context.config.virtueFlawTypes.laboratory,
          ...context.config.virtueFlawTypes.covenant,
          ...context.config.virtueFlawTypes.all
        };
      }
    }

    if (itemData.type == "labCovenant") {
      if (itemData.system.linked) {
        context.canEdit = "readonly";
        context.canSelect = "disabled";
        context.system.upkeep = context.system.document.system.upkeep.total;
        context.system.quality = context.system.document.system.generalQuality.total;
      }
    }

    context.metagame = {
      view: game.settings.get("arm5e", "metagame"),
      edit: context.isGM ? "" : "readonly"
    };

    context.devMode = game.modules
      .get("_dev-mode")
      ?.api?.getPackageDebugValue(CONFIG.ARM5E.SYSTEM_ID);

    // Prepare active effects
    context.effects = ArM5eActiveEffect.prepareActiveEffectCategories(this.item.effects);

    log(false, "item-sheet get data");
    log(false, context);

    return context;
  }

  /* -------------------------------------------- */

  /** @override */
  setPosition(options = {}) {
    const position = super.setPosition(options);
    const sheetBody = this.element.find(".sheet-body");
    const bodyHeight = position.height - 500;
    sheetBody.css("height", bodyHeight);
    return position;
  }

  /* -------------------------------------------- */

  async _updateObject(event, formData) {
    if (this.item.system.enchantments) {
      if (CONFIG.ISV10) {
        if (this.enchantPossible && this.item.system.state != "inert") {
          formData = await this.enchantSheet._updateObject(event, formData);
        }
      } else {
        if (this.enchantPossible && this.item.system.enchantments != null) {
          formData = await this.enchantSheet._updateObject(event, formData);
        }
      }
    }
    return await super._updateObject(event, formData);
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    if (this.enchantPossible) {
      this.enchantSheet.addListeners(html);
    }

    html.find(".section-handle").click(async (ev) => {
      const dataset = getDataset(ev);
      log(false, `DEBUG section: ${dataset.section}, category: ${dataset.category}`);
      let index = dataset.index ?? "";
      let usercache = JSON.parse(sessionStorage.getItem(`usercache-${game.user.id}`));
      let scope = usercache[this.item._id].sections.visibility[dataset.category];
      let classes = document.getElementById(
        `${dataset.category}-${dataset.section}${index}-${this.item._id}`
      ).classList;
      if (scope) {
        if (classes.contains("hide")) {
          if (index !== "") {
            log(false, `DEBUG reveal ${dataset.section} at index ${index}`);
            scope[index][dataset.section] = "";
          } else {
            log(false, `DEBUG reveal ${dataset.section}`);
            scope[dataset.section] = "";
          }
        } else {
          if (index) {
            log(false, `DEBUG hide ${dataset.section} at index ${index}`);
            scope[index][dataset.section] = "hide";
          } else {
            log(false, `DEBUG hide ${dataset.section}`);
            scope[dataset.section] = "hide";
          }
        }
        sessionStorage.setItem(`usercache-${game.user.id}`, JSON.stringify(usercache));
      }
      // log(false, `DEBUG Flags: ${JSON.stringify(this.item.flags.arm5e.ui.sections.visibility)}`);
      classes.toggle("hide");
    });
    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // data-id and data-attr needed
    html.find(".increase-score").click(async () => await this.item.system.increaseScore());
    html.find(".decrease-score").click(async () => await this.item.system.decreaseScore());

    html.find(".harvest").click(async () => {
      await this.item.system.harvest();
    });

    html
      .find(".default-characteristic")
      .change((event) => this._onSelectDefaultCharacteristic(this.item, event));
    html.find(".item-name").change((event) => this._onNameChange(this.item, event));
    html.find(".ability-option").change((event) => this._cleanUpOption(this.item, event));
    html.find(".option-link").click(this._optionLinkChange.bind(this));

    html
      .find(".category-change")
      .change((event) => this._changeInhabitantCategory(this.item, event));
    html.find(".change-abilitykey").change((event) => this._changeAbilitykey(this.item, event));
    html.find(".change-VFType").change((event) => this._changeVFType(this.item, event));

    // Active Effect management
    html
      .find(".effect-control")
      .click((ev) => ArM5eActiveEffect.onManageActiveEffect(ev, this.item));

    html.find(".study-labtext").click((event) => this.item._studyLabText(this.item, event));

    html.find(".migrate").click((event) => this.item.migrate());

    html.find(".item-delete-confirm").click(async () => {
      const question = game.i18n.localize("arm5e.dialog.delete-question");
      let itemId = this.item._id;
      let confirm = await getConfirmation(
        this.item.name,
        question,
        ArM5eActorSheet.getFlavor(this.item.actor?.type)
      );
      if (confirm) {
        itemId = itemId instanceof Array ? itemId : [itemId];
        this.actor.deleteEmbeddedDocuments("Item", itemId, {});
      }
    });

    // html.find(".wound-recovery").click(async (event) => {
    //   const dataset = getDataset(event);
    //   await Sanatorium.createDialog(this.actor, this.item);
    // });

    html.find(".resource-focus").focus((ev) => {
      ev.preventDefault();
      ev.currentTarget.select();
    });

    html.find(".rollable").click(async (event) => {
      const dataset = getDataset(event);

      await this.object.actor.sheet._onRoll(dataset);
    });

    html.find(".create-labtext").click(async (event) => {
      if (!this.item.isOwned) return;
      let confirm = await getConfirmation(
        this.item.name,
        game.i18n.localize("arm5e.hints.createLabText"),
        ArM5eActorSheet.getFlavor(this.item.actor?.type)
      );
      if (confirm) {
        const dataset = getDataset(event);
        let effectData;
        if (dataset.index) {
          const enchant = foundry.utils.deepClone(
            this.item.system.enchantments.effects[dataset.index]
          );
          enchant.system = enchant.system.toObject();
          effectData = effectToLabText(enchant);
          effectData.system.author = this.item.system.enchantments.author;
        } else {
          effectData = effectToLabText(this.item.toObject());
          effectData.system.author = this.actor.name;
        }
        effectData.system.draft = true;

        await this.actor.createEmbeddedDocuments("Item", [effectData]);
      }
    });
  }
  async _changeAbilitykey(item, event) {
    event.preventDefault();
    await this.item._updateIcon("system.key", event.target.value);
  }

  async _changeInhabitantCategory(item, event) {
    event.preventDefault();
    await this.item._updateIcon("system.category", event.target.value);
  }

  async _changeVFType(item, event) {
    event.preventDefault();
    await this.item._updateIcon("system.type", event.target.value);
  }

  async _onSelectDefaultCharacteristic(item, event) {
    event.preventDefault();
    await this.item.update(
      {
        system: {
          defaultChaAb: $(".default-characteristic").find("option:selected").val()
        }
      },
      {}
    );
    return false;
  }
  async _onNameChange(item, event) {
    if (event.currentTarget.value === "") return;

    if (this.item.system.optionLinked) {
      const newName = event.currentTarget.value;
      const newValue = event.currentTarget.value.replace(/[^a-zA-Z0-9]/gi, "");
      await this.item.update(
        {
          name: newName,
          system: {
            option: newValue
          }
        },
        {}
      );
    }
  }
  async _cleanUpOption(item, event) {
    event.preventDefault();
    if (event.currentTarget.value == "") {
      event.currentTarget.value = "optionName";
    } else {
      // remove any non alphanumeric character
      event.currentTarget.value = event.currentTarget.value.replace(/[^a-zA-Z0-9]/gi, "");
    }
    await this.item.update(
      {
        system: {
          option: event.currentTarget.value
        }
      },
      {}
    );
  }

  async _optionLinkChange(event) {
    event.preventDefault();
    await this.item.update(
      {
        system: {
          optionLinked: !this.item.system.optionLinked
        }
      },
      {}
    );
  }
}

export class ArM5eItemSheetNoDesc extends ArM5eItemSheet {
  /** @override */
  static get defaultOptions() {
    // No tabs
    return foundry.utils.mergeObject(super.defaultOptions, {
      tabs: []
    });
  }
  /** @override */
  async getData() {
    return await super.getData();
  }
}
