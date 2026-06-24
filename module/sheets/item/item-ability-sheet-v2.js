import { slugify } from "../../tools/tools.js";
import { ArM5eItemSheetV2 } from "./item-sheet-v2.js";

/**
 * AppV2 sheet for ability items.
 */
export class ArM5eAbilityItemSheetV2 extends ArM5eItemSheetV2 {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["arm5e", "sheet", "item"],
    position: { width: 500, height: 600 },
    actions: {
      increaseScore: ArM5eAbilityItemSheetV2.increaseScore,
      decreaseScore: ArM5eAbilityItemSheetV2.decreaseScore,
      toggleOptionLink: ArM5eAbilityItemSheetV2.toggleOptionLink,
      rollAbility: ArM5eAbilityItemSheetV2.rollAbility,
      itemDeleteConfirm: ArM5eItemSheetV2.itemDeleteConfirm
    }
  };

  /** @override */
  static TABS = {
    primary: {
      tabs: [{ id: "description", label: "arm5e.sheet.description", cssClass: "item flexrow" }],
      initial: "description"
    }
  };

  /** @override */
  static PARTS = {
    header: {
      template: "systems/arm5e/templates/item/parts/item-ability-header-v2.hbs"
    },
    tabs: {
      template: "systems/arm5e/templates/generic/parts/ars-tab-navigation.hbs",
      classes: ["marginItemPart"]
    },
    description: {
      template: "systems/arm5e/templates/item/parts/item-ability-description-v2.hbs"
    },
    footer: {
      template: "systems/arm5e/templates/item/parts/item-footer-v2.hbs"
    }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.tabs = this._prepareTabs("primary");

    const sys = this.item.system;
    context.altArt = ["altTechnique", "altForm"].includes(sys.category);

    if (context.altArt) {
      context.abilityKeysList = CONFIG.ARM5E.LOCALIZED_ABILITIES;
    } else {
      context.abilityKeysList = foundry.utils.deepClone(CONFIG.ARM5E.LOCALIZED_ABILITIES);
      delete context.abilityKeysList.technique;
      delete context.abilityKeysList.altTechnique;
      delete context.abilityKeysList.form;
      delete context.abilityKeysList.altForm;
    }

    context.canBeAccelerated =
      context.altArt || ["arcane", "supernaturalCat", "mystery"].includes(sys.category);

    const abilityDef = CONFIG.ARM5E.ALL_ABILITIES[sys.key];
    if (abilityDef?.option) {
      context.ui.hasOption = true;
      context.ui.optionLocked = sys.optionLinked ? "readonly" : "";
    } else {
      context.ui.hasOption = false;
      context.ui.optionLocked = "";
    }

    return context;
  }

  /** @override */
  async _preparePartContext(partId, context, options) {
    if (partId === "description") {
      context.tab = context.tabs?.description;
    }
    return super._preparePartContext(partId, context, options);
  }

  /** @override */
  async _onRender(context, options) {
    await super._onRender(context, options);
    // Ability key change needs extra logic beyond form submitOnChange
    this.element.querySelectorAll(".change-abilitykey").forEach((el) => {
      el.addEventListener("change", async (event) => {
        event.preventDefault();
        const updateData = this.item._updateIcon(event.target.value);
        await this.item.system.changeKey(event.target.value, updateData);
      });
    });

    this.element.querySelectorAll(".item-name").forEach((el) => {
      el.addEventListener("change", (event) => this._onNameChange(event));
    });

    this.element.querySelectorAll(".ability-option").forEach((el) => {
      el.addEventListener("change", (event) => this._cleanUpOption(event));
    });
  }

  async _onNameChange(event) {
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

  async _cleanUpOption(event) {
    event.preventDefault();

    if (event.currentTarget.value === "") {
      event.currentTarget.value = this.item.system.option;
      return;
    }

    event.currentTarget.value = slugify(event.currentTarget.value, false);
    await this.item.update(
      {
        system: {
          option: event.currentTarget.value
        }
      },
      {}
    );
  }

  static async increaseScore(event, target) {
    event.preventDefault();
    await this.item?.system?.increaseScore?.();
  }

  static async decreaseScore(event, target) {
    event.preventDefault();
    await this.item?.system?.decreaseScore?.();
  }

  static async toggleOptionLink(event, target) {
    event.preventDefault();
    await this.item.update({ system: { optionLinked: !this.item.system.optionLinked } }, {});
  }

  static async rollAbility(event, target) {
    event.preventDefault();
    if (!this.item.isOwned || !this.actor?.sheet?.roll) return;
    const dataset = {
      roll: "ability",
      ability: this.item._id,
      defaultcharacteristic: this.item.system.defaultChaAb
    };
    await this.actor.sheet.roll(dataset);
  }
}
