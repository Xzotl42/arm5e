import { ARM5E } from "../config.js";

import { log, error, slugify } from "../tools/tools.js";

import { ACTIVE_EFFECTS_TYPES } from "../constants/activeEffectsTypes.js";
import { textInput } from "../ui/dialogs.js";

/**
 * Extend the base ActiveEffectConfig sheet by limiting what can be edited
 * @extends {ActiveEffectConfig}
 */
export class ArM5eActiveEffectConfig extends foundry.applications.sheets.ActiveEffectConfig {
  static DEFAULT_OPTIONS = {
    classes: ["arm5e", "arm5eLargeDialog"],
    // classes: ["arm5e", "arm5eActiveEffect", "active-effect-sheet"],
    window: {
      contentClasses: ["standard-form"],
      icon: "fa-solid fa-person-rays"
    },
    position: { width: 600, height: 650 },
    form: {
      // handler: ArM5eActiveEffectConfig.handleSubmit,
      submitOnChange: true,
      closeOnSubmit: false
    },
    actions: {
      add: ArM5eActiveEffectConfig.addEffect
    }
  };

  /** @override */
  static TABS = {
    primary: {
      tabs: [
        { id: "details", icon: "fa-solid fa-book" },
        { id: "changes", icon: "fa-solid fa-gears" }
      ],
      initial: "details",
      labelPrefix: "EFFECT.TABS"
    }
  };

  /** @override */
  static PARTS = {
    headerFalvor: { template: "systems/arm5e/templates/generic/largeDialog-header.hbs" },
    header: {
      template: "systems/arm5e/templates/sheets/active-effect/header.hbs",
      classes: ["marginsides32"]
    },
    tabs: {
      // Foundry-provided generic template
      template: "templates/generic/tab-navigation.hbs"
    },
    details: {
      template: "systems/arm5e/templates/sheets/active-effect/details.hbs",
      classes: ["marginsides32"]
    },
    // duration: { template: "systems/arm5e/templates/sheets/active-effect/duration.hbs" },
    changes: {
      template: "systems/arm5e/templates/sheets/active-effect/changes.hbs",
      scrollable: ["ol[changes-list]"],
      classes: ["marginsides32"]
    },
    // footer: { template: "templates/generic/form-footer.hbs" }
    footer: { template: "systems/arm5e/templates/generic/largeDialog-footer.hbs" }
  };

  // /** @inheritDoc */
  // _onChangeForm(formConfig, event) {
  //   super._onChangeForm(formConfig, event);
  //   if (event.target.tagName === "COLOR-PICKER" && event.target.name.endsWith("tint")) {
  //     this.submit({ updateData: { tint: event.target.value } });
  //   }
  // }

  setFilter(filter, mod) {
    this.filter = filter;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.data = context.document.toObject();
    context.tabs = this._prepareTabs("primary");
    if (this.filter) {
      context.types = Object.fromEntries(
        Object.entries(ACTIVE_EFFECTS_TYPES).filter(
          ([k, v]) => v.category == this.filter || v.category === "none"
        )
      );
    } else {
      context.types = ACTIVE_EFFECTS_TYPES;
    }

    // context.data.ui = {
    //   nameAttr: "name",
    //   name: context.data.name,
    //   img: context.data.img,
    //   imgAttr: "img"
    // };

    context.flavor = "Inputs";
    context.origin = context.document.sourceName;
    // first effect created, add null effect type and subtype (still needed?)
    context.selectedTypes = this.document.getFlag("arm5e", "type");
    if (context.document.changes.length > 0 && context.selectedTypes == null) {
      context.selectedTypes = ["none"];
    }
    context.selectedSubtypes = this.document.getFlag("arm5e", "subtype");
    if (context.document.changes.length > 0 && context.selectedSubtypes == null) {
      context.selectedSubtypes = ["none"];
    }

    // get the data for all subtypes of the selected types
    // replace #OPTION# in key if it applies
    context.subtypes = [];
    context.currentProperties = [];
    context.options = this.document.getFlag("arm5e", "option");
    for (let idx = 0; idx < context.selectedTypes.length; idx++) {
      let subTypes = [];
      for (const [k, v] of Object.entries(context.types[context.selectedTypes[idx]].subtypes)) {
        let subType = {
          name: k,
          ...v
        };

        let tmp = subType.key;
        // option key replacement only done for abilities for now.
        if (context.types[context.selectedTypes[idx]].category === "abilities") {
          if (context.options[idx] != null) {
            tmp = tmp.replace("#OPTION#", context.options[idx]);
          }
        }
        if (typeof v.default == "boolean") {
          subType.isBool = true;
        } else {
          subType.isBool = false;
        }

        if (typeof v.default == "string") {
          subType.isString = true;
        } else {
          subType.isString = false;
        }

        let withChoice = v.choice;
        if (withChoice) {
          subType.withChoice = true;
        } else {
          subType.withChoice = false;
        }
        subType.computedKey = tmp;

        subType.modeStr = "arm5e.activeEffect.mode_" + subType.mode;

        subTypes.push(subType);
        if (k == context.selectedSubtypes[idx]) {
          context.currentProperties.push(subType);
        }
      }
      context.subtypes.push(subTypes);
    }

    context.devMode = game.modules
      .get("_dev-mode")
      ?.api?.getPackageDebugValue(CONFIG.ARM5E.SYSTEM_ID);

    context.isGM = game.user.isGM;
    context.footer = "Inputs";
    log(false, "Effect config sheet data");
    log(false, context);
    return context;
  }
  /** @override */

  _onRender(context, options) {
    // keep in mind that if your callback is a named function instead of an arrow function expression
    // you'll need to use `bind(this)` to maintain context

    // Inputs with class `.effect-type`
    const changeTypes = this.element.querySelectorAll(".effect-type");
    for (const input of changeTypes) {
      input.addEventListener("change", async (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();

        const index = parseInt(e.currentTarget.dataset.index);
        await this._setType(e.currentTarget.selectedOptions[0].value, index);
      });
    }

    const changeSubTypes = this.element.querySelectorAll(".effect-subtype");
    for (const input of changeSubTypes) {
      input.addEventListener("change", async (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();

        const index = parseInt(e.currentTarget.dataset.index);
        await this._setSubtype(e.currentTarget.selectedOptions[0].value, index);
      });
    }

    const changeValues = this.element.querySelectorAll(".effect-value");
    for (const input of changeValues) {
      input.addEventListener("change", async (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();

        const index = parseInt(e.currentTarget.dataset.index);
        await this._setValue(e.currentTarget.value, index);
      });
    }

    const changeOptions = this.element.querySelectorAll(".effect-option");
    for (const input of changeOptions) {
      input.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();

        const index = parseInt(e.currentTarget.dataset.index);

        await this._setOption(index);
      });
    }

    const deletesChange = this.element.querySelectorAll(".effect-delete");
    for (const input of deletesChange) {
      input.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();

        const index = parseInt(e.currentTarget.dataset.index);

        await this._deleteChange(index);
      });
    }
  }

  // _castType(type, value) {
  //   const newVal = foundry.utils.getType(value);
  // }

  async _deleteChange(index) {
    let arrayTypes = this.document.getFlag("arm5e", "type");
    let arraySubtypes = this.document.getFlag("arm5e", "subtype");
    let arrayOptions = this.document.getFlag("arm5e", "option");
    let changes = this.document.changes;
    arrayTypes.splice(index, 1);
    arraySubtypes.splice(index, 1);
    arrayOptions.splice(index, 1);
    changes.splice(index, 1);
    let updateFlags = {
      changes: changes,
      flags: {
        arm5e: {
          type: arrayTypes,
          subtype: arraySubtypes,
          option: arrayOptions
        }
      }
    };
    await this.submit({ preventClose: true, updateData: updateFlags }).then(() => this.render());
  }

  async _setValue(value, index) {
    let arrayTypes = this.document.getFlag("arm5e", "type");
    let arraySubtypes = this.document.getFlag("arm5e", "subtype");
    let arrayOptions = this.document.getFlag("arm5e", "option");
    const effect = ACTIVE_EFFECTS_TYPES[arrayTypes[index]].subtypes[arraySubtypes[index]];
    let newKey = effect.key;
    if (arrayOptions[index] != null) {
      newKey = newKey.replace("#OPTION#", arrayOptions[index]);
    }

    if (typeof effect.default == "boolean") {
      value = true;
    }
    const changesData = this.document.changes;
    changesData[index] = {
      mode: ACTIVE_EFFECTS_TYPES[arrayTypes[index]].subtypes[arraySubtypes[index]].mode,
      key: newKey,
      value: value
    };
    let updateFlags = {
      changes: changesData
    };
    await this.submit({ preventClose: true, updateData: updateFlags }).then(() => this.render());
  }

  async _setType(value, index) {
    let arrayTypes = this.document.getFlag("arm5e", "type");
    arrayTypes[index] = value;
    // also update subtype
    let arraySubtypes = this.document.getFlag("arm5e", "subtype");
    arraySubtypes[index] = Object.keys(ACTIVE_EFFECTS_TYPES[value].subtypes)[0];
    let arrayOptions = this.document.getFlag("arm5e", "option");
    arrayOptions[index] = ACTIVE_EFFECTS_TYPES[value].subtypes[arraySubtypes[index]].option || null;
    const changesData = this.document.changes;
    changesData[index] = {
      mode: ACTIVE_EFFECTS_TYPES[value].subtypes[arraySubtypes[index]].mode,
      key: ACTIVE_EFFECTS_TYPES[value].subtypes[arraySubtypes[index]].key,
      value: ACTIVE_EFFECTS_TYPES[value].subtypes[arraySubtypes[index]].default
    };
    let updateFlags = {
      flags: {
        arm5e: {
          type: arrayTypes,
          subtype: arraySubtypes,
          option: arrayOptions
        }
      },
      changes: changesData
    };
    await this.submit({ preventClose: true, updateData: updateFlags }).then(() => this.render());
  }
  async _setSubtype(value, index) {
    let arrayTypes = this.document.getFlag("arm5e", "type");
    let arraySubtypes = this.document.getFlag("arm5e", "subtype");
    let arrayOptions = this.document.getFlag("arm5e", "option");
    arraySubtypes[index] = value;
    arrayOptions[index] =
      ACTIVE_EFFECTS_TYPES[arrayTypes[index]].subtypes[arraySubtypes[index]].option || null;
    let computedKey = ACTIVE_EFFECTS_TYPES[arrayTypes[index]].subtypes[value].key;
    if (arrayOptions[index] != null) {
      computedKey = computedKey.replace("#OPTION#", arrayOptions[index]);
    }
    const changesData = this.document.changes;
    changesData[index] = {
      mode: ACTIVE_EFFECTS_TYPES[arrayTypes[index]].subtypes[value].mode,
      key: computedKey,
      value: ACTIVE_EFFECTS_TYPES[arrayTypes[index]].subtypes[arraySubtypes[index]].default
    };
    let update = {
      flags: {
        arm5e: {
          type: arrayTypes,
          subtype: arraySubtypes,
          option: arrayOptions
        }
      },
      changes: changesData
    };

    await this.submit({ preventClose: true, updateData: update }).then(() => this.render());
  }

  static async addEffect(context) {
    let arrayTypes = this.document.getFlag("arm5e", "type");
    let arraySubtypes = this.document.getFlag("arm5e", "subtype");
    let arrayOptions = this.document.getFlag("arm5e", "option");
    arrayTypes.push("none");
    arraySubtypes.push("none");
    arrayOptions.push(null);
    const flags = {
      arm5e: {
        type: arrayTypes,
        subtype: arraySubtypes,
        option: arrayOptions
      }
    };
    return this._addEffectChange(flags).then(() => this.render());
  }

  async _setOption(index) {
    let arrayTypes = this.document.getFlag("arm5e", "type");
    const type = arrayTypes[index];
    let arraySubtypes = this.document.getFlag("arm5e", "subtype");
    const subtype = arraySubtypes[index];
    let arrayOptions = this.document.getFlag("arm5e", "option");
    var chosenOption = arrayOptions[index];
    let dialogData = {
      fieldName: "arm5e.sheet.skill.abilityOption",
      placeholder: "arm5e.dialog.hint.abilityOption",
      value: chosenOption
    };
    chosenOption = await textInput(
      game.i18n.localize("arm5e.sheet.skill.abilityOption"),
      "arm5e.sheet.skill.abilityOption",
      "arm5e.dialog.hint.abilityOption",
      chosenOption,
      "",
      [],
      (value) => {
        return value.length > 0;
      }
    );
    if (!chosenOption) {
      return;
    }
    // remove any non alphanumeric character
    chosenOption = slugify(chosenOption, false);
    if (!chosenOption) {
      chosenOption = ACTIVE_EFFECTS_TYPES[type].subtypes[subtype].default;
    }
    let computedKey = ACTIVE_EFFECTS_TYPES[type].subtypes[subtype].key;
    let updateData = {};
    arrayOptions[index] = chosenOption;
    updateData[`flags.arm5e.option`] = arrayOptions;
    const changesData = this.document.changes;
    changesData[index].key = computedKey.replace("#OPTION#", chosenOption);
    updateData.changes = changesData;
    return await this.submit({ preventClose: true, updateData: updateData });
  }

  async _addEffectChange(updateFlags) {
    const changesData = this.document.changes;
    changesData.push({ key: "", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "" });
    return await this.submit({
      preventClose: true,
      updateData: {
        changes: changesData,
        flags: updateFlags
      }
    });
  }
}
