import { getDataset, log, slugify } from "../tools.js";
import ArM5eActiveEffect from "../helpers/active-effects.js";
import { ArM5eActorSheet } from "../actor/actor-sheet.js";
import { EnchantmentExtension } from "../schemas/enchantmentSchema.js";
import { ArM5eItemEnchantmentSheet } from "./subsheet/enchant-extension-sheet.js";
import { ARM5E } from "../config.js";
import { effectToLabText } from "./item-converter.js";
import { Sanatorium } from "../tools/sanatorium.js";
import { getConfirmation } from "../ui/dialogs.js";
import { FLAVORS } from "../constants/ui.js";
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
      height: 752,
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

  _getHeaderButtons() {
    const buttons = super._getHeaderButtons();
    if (this.item.isOwned) {
      buttons.unshift({
        label: game.i18n.localize("arm5e.sheet.owner"),
        // class applied to the button for styling but also a way to retrieve it, cannot be empty
        class: "show-owner",
        icon: "fas fa-user",
        onclick: () => {
          this.actor.sheet.render(true);
        }
      });
    }
    return buttons;
  }

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
    context.ui.flavor = FLAVORS.NEUTRAL;
    context.selection = {};
    // Add the item's data to context.system for easier access, as well as flags.
    context.system = itemData.system;

    if (this.enchantPossible && context.system.enchantments != null) {
      await this.enchantSheet.getData(context);
    } else {
      context.stateEdit = "disabled";
    }

    if (this.item.system.description) {
      context.enrichedDescription = await TextEditor.enrichHTML(this.item.system.description, {
        // Whether to show secret blocks in the finished html
        secrets: this.document.isOwner,
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
        // Data to fill in for inline rolls
        rollData: context.rollData,
        // Relative UUID resolution
        relativeTo: this.item
      });
    }

    context.flags = itemData.flags;
    // context.ui.flavor = FLAVORS.NEUTRAL;
    context.config = CONFIG.ARM5E;
    if (itemData.type == "weapon" && this.item.isOwned && this.item.actor.isCharacter()) {
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

        // context.selection.characteristics
      } else {
        context.abilityKeysList = CONFIG.ARM5E.LOCALIZED_ABILITIES;
      }
    }
    context.isOwned = this.item.isOwned;
    if (context.isOwned) {
      switch (this.actor.type) {
        case "player":
          context.ui.flavor = FLAVORS.PLAYER;
          break;
        case "npc":
          context.ui.flavor = FLAVORS.NPC;
          break;
        case "beast":
          context.ui.flavor = FLAVORS.BEAST;
          break;
        case "covenant":
          context.ui.flavor = FLAVORS.COVENANT;
          break;
        case "magicCodex":
          context.ui.flavor = FLAVORS.CODEX;
          break;
        case "laboratory":
          context.ui.flavor = FLAVORS.LABORATORY;
          break;
        default:
          break;
      }
    }
    context.system.effectCreation = true;
    if (["virtue", "flaw", "quality", "inferiority"].includes(itemData.type)) {
      if (context.isOwned) {
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

    // COST

    if (itemData.system.cost?.amount) {
      context.cost = {
        detail: game.settings.get("arm5e", "moneyManagementLevel"),
        currency: game.settings.get("arm5e", "currency"),
        coeff: game.settings.get("arm5e", "currencyCoeff"),
        hint: `${itemData.system.quantity * itemData.system.cost.amount} ${game.settings.get(
          "arm5e",
          "currency"
        )} total`
      };
    }

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
      if (this.enchantPossible && this.item.system.enchantments != null) {
        formData = await this.enchantSheet._updateObject(event, formData);
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
    html.find(".indexkey-edit").change((event) => this._slugifyIndexKey(event));

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

    if (this.item.system.addListeners) {
      this.item.system.addListeners(html);
    }

    html.find(".equipement").change(async (ev) => {
      await this.actor.sheet.toggleEquip(this.item._id);
    });

    // html.find(".wound-recovery").click(async (event) => {
    //   const dataset = getDataset(event);
    //   await Sanatorium.createDialog(this.actor, this.item);
    // });

    html.find(".select-on-focus").focus((ev) => {
      ev.preventDefault();
      ev.currentTarget.select();
    });

    html.find(".rollable").click(async (event) => {
      const dataset = getDataset(event);

      await this.object.actor.sheet.roll(dataset);
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

    html.find(".weapon-ability").change((event) => this._changeWeaponAbility(event));

    html.find(".equipment").change((event) => {
      let current = this.actor.system.combatPreps.current;
      const updateData = {};
      if (current !== "custom") {
        updateData["system.combatPreps.current"] = "custom";
        current = "custom";
      }
      const prep = this.actor.system.combatPreps.list[current];
      const idx = prep.ids.indexOf(this.item._id);
      if (idx >= 0) {
        prep.ids.splice(idx, 1);
      } else {
        prep.ids.push(this.item._id);
      }
      updateData[`system.combatPreps.list.${current}.ids`] = prep.ids;
      this.actor.update(updateData);
    });
  }

  async _changeWeaponAbility(event) {
    event.preventDefault();
    let ab = this.actor.items.get(event.currentTarget.value);
    await this.item.update(
      {
        system: {
          ability: {
            id: event.currentTarget.value,
            key: ab.system.key,
            option: ab.system.option
          }
        }
      },
      {}
    );
  }

  async _slugifyIndexKey(event) {
    event.preventDefault();
    const newValue = slugify(event.currentTarget.value);
    event.currentTarget.value = newValue;
    await this.item.update(
      {
        system: {
          indexKey: newValue
        }
      },
      {}
    );
  }

  async _changeAbilitykey(item, event) {
    event.preventDefault();
    const updateData = this.item._updateIcon(event.target.value);
    await this.item.system.changeKey(event.target.value, updateData);
  }

  async _changeInhabitantCategory(item, event) {
    event.preventDefault();
    const updateData = this.item._updateIcon(event.target.value);
    updateData["system.category"] = event.target.value;
    await this.item.update(updateData);
  }

  async _changeVFType(item, event) {
    event.preventDefault();
    const updateData = this.item._updateIcon(event.target.value);
    updateData["system.type"] = event.target.value;
    await this.item.update(updateData);
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
      const newValue = slugify(event.currentTarget.value, false);
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
      event.currentTarget.value = item.system.option;
      return;
    } else {
      // remove any non alphanumeric character
      event.currentTarget.value = slugify(event.currentTarget.value, false);
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
