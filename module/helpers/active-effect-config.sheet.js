import { ARM5E } from "../config.js";

import { log, error } from "../tools.js";

import ACTIVE_EFFECTS_TYPES from "../constants/activeEffectsTypes.js";

/**
 * Extend the base ActiveEffectConfig sheet by limiting what can be edited
 * @extends {ActiveEffectConfig}
 */
export class ArM5eActiveEffectConfig extends ActiveEffectConfig {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["arm5e", "sheet", "active-effect-sheet"],
      width: 700,
      height: "600px",
      submitOnChange: true,
      closeOnSubmit: false,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "description"
        }
      ]
    });
  }

  get template() {
    return "systems/arm5e/templates/generic/active-effect-config.html";
  }

  /** @override */
  async getData() {
    const context = await super.getData();
    context.types = ACTIVE_EFFECTS_TYPES;

    // backward compatibility with V10
    if (CONFIG.ISV10) {
      context.data.ui = {
        name: context.data.label,
        img: context.data.icon
      };
    } else {
      context.data.ui = {
        name: context.data.name,
        img: context.data.icon
      };
    }

    // first effect created, add null effect type and subtype (still needed?)
    context.selectedTypes = this.object.getFlag("arm5e", "type");
    if (context.data.changes.length > 0 && context.selectedTypes == null) {
      context.selectedTypes = ["none"];
    }
    context.selectedSubtypes = this.object.getFlag("arm5e", "subtype");
    if (context.data.changes.length > 0 && context.selectedSubtypes == null) {
      context.selectedSubtypes = ["none"];
    }

    // get the data for all subtypes of the selected types
    // replace #OPTION# in key if it applies
    context.subtypes = [];
    context.options = this.object.getFlag("arm5e", "option");
    for (let idx = 0; idx < context.selectedTypes.length; idx++) {
      let tmpSubTypes = context.types[context.selectedTypes[idx]].subtypes;
      let tmp = tmpSubTypes[context.selectedSubtypes[idx]].key;
      // option key replacement only done for abilities for now.
      if (ACTIVE_EFFECTS_TYPES[context.selectedTypes[idx]].category === "abilities") {
        if (context.options[idx] != null) {
          tmp = tmp.replace("#OPTION#", context.options[idx]);
        }
      }
      if (
        typeof ACTIVE_EFFECTS_TYPES[context.selectedTypes[idx]].subtypes[
          context.selectedSubtypes[idx]
        ].default == "boolean"
      ) {
        tmpSubTypes[context.selectedSubtypes[idx]].isBool = true;
      } else {
        tmpSubTypes[context.selectedSubtypes[idx]].isBool = false;
      }

      if (
        typeof ACTIVE_EFFECTS_TYPES[context.selectedTypes[idx]].subtypes[
          context.selectedSubtypes[idx]
        ].default == "string"
      ) {
        tmpSubTypes[context.selectedSubtypes[idx]].isString = true;
      } else {
        tmpSubTypes[context.selectedSubtypes[idx]].isString = false;
      }

      let withChoice =
        ACTIVE_EFFECTS_TYPES[context.selectedTypes[idx]].subtypes[context.selectedSubtypes[idx]]
          .choice;
      if (withChoice) {
        tmpSubTypes[context.selectedSubtypes[idx]].withChoice = true;
      } else {
        tmpSubTypes[context.selectedSubtypes[idx]].withChoice = false;
      }
      tmpSubTypes[context.selectedSubtypes[idx]].computedKey = tmp;

      context.subtypes.push(tmpSubTypes);
    }

    context.devMode = game.modules
      .get("_dev-mode")
      ?.api?.getPackageDebugValue(CONFIG.ARM5E.SYSTEM_ID);
    log(false, "Effect config sheet data");
    log(false, context);
    return context;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // // Active Effect management
    html.find(".effect-type").change(async (ev) => {
      const index = parseInt(ev.currentTarget.dataset.index);
      await this._setType($(ev.currentTarget).val(), index);
    });

    html.find(".effect-subtype").change(async (ev) => {
      const index = parseInt(ev.currentTarget.dataset.index);
      await this._setSubtype(ev.currentTarget.selectedOptions[0].dataset.subtype, index);
    });

    html.find(".effect-value").change(async (ev) => {
      const index = parseInt(ev.currentTarget.dataset.index);
      await this._setValue(ev.currentTarget.value, index);
    });
  }

  // _castType(type, value) {
  //   const newVal = foundry.utils.getType(value);
  // }

  async _setValue(value, index) {
    let arrayTypes = this.object.getFlag("arm5e", "type");
    let arraySubtypes = this.object.getFlag("arm5e", "subtype");
    const changesData = this.document.changes;
    changesData[index] = {
      mode: ACTIVE_EFFECTS_TYPES[arrayTypes[index]].subtypes[arraySubtypes[index]].mode,
      key: ACTIVE_EFFECTS_TYPES[arrayTypes[index]].subtypes[arraySubtypes[index]].key,
      value: value
    };
    let updateFlags = {
      changes: changesData
    };
    await this.submit({ preventClose: true, updateData: updateFlags }).then(() => this.render());
  }

  async _setType(value, index) {
    let arrayTypes = this.object.getFlag("arm5e", "type");
    arrayTypes[index] = value;
    // also update subtype
    let arraySubtypes = this.object.getFlag("arm5e", "subtype");
    arraySubtypes[index] = Object.keys(ACTIVE_EFFECTS_TYPES[value].subtypes)[0];
    let arrayOptions = this.object.getFlag("arm5e", "option");
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
    let arrayTypes = this.object.getFlag("arm5e", "type");
    let arraySubtypes = this.object.getFlag("arm5e", "subtype");
    let arrayOptions = this.object.getFlag("arm5e", "option");
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

  _onEffectControl(event) {
    event.preventDefault();
    const button = event.currentTarget;
    let arrayTypes = this.object.getFlag("arm5e", "type");
    let arraySubtypes = this.object.getFlag("arm5e", "subtype");
    let arrayOptions = this.object.getFlag("arm5e", "option");
    let flags = {};
    switch (button.dataset.action) {
      case "add":
        arrayTypes.push("none");
        arraySubtypes.push("none");
        arrayOptions.push(null);
        flags = {
          arm5e: {
            type: arrayTypes,
            subtype: arraySubtypes,
            option: arrayOptions
          }
        };
        return this._addEffectChange(flags).then(() => this.render());

      case "option":
        const index = parseInt(event.currentTarget.dataset.idx);
        return this._setOption(
          index,
          arrayTypes[index],
          arraySubtypes[index],
          arrayOptions[index]
        ).then(() => this.render());
        break;
      case "delete":
        // remove type and subtype of the erased change
        arrayTypes.splice(button.dataset.idx, 1);
        arraySubtypes.splice(button.dataset.idx, 1);
        arrayOptions.splice(button.dataset.idx, 1);
        let updateFlags = {
          flags: {
            arm5e: {
              type: arrayTypes,
              subtype: arraySubtypes,
              option: arrayOptions
            }
          }
        };
        button.closest(".effect-change").remove();
        return this.submit({ preventClose: true, updateData: updateFlags }).then(() =>
          this.render()
        );
    }
  }

  async _setOption(index, type, subtype, option) {
    var chosenOption = option;
    let dialogData = {
      fieldName: "arm5e.sheet.skill.abilityOption",
      placeholder: "arm5e.dialog.hint.abilityOption",
      value: option
    };
    const html = await renderTemplate("systems/arm5e/templates/generic/textInput.html", dialogData);
    await new Promise((resolve) => {
      new Dialog(
        {
          title: game.i18n.localize("arm5e.sheet.skill.abilityOption"),
          content: html,
          buttons: {
            yes: {
              icon: "<i class='fas fa-check'></i>",
              label: `Yes`,
              callback: async (html) => {
                let result = html.find('input[name="inputField"]');
                if (result.val() !== "") {
                  chosenOption = result.val();
                }
                resolve();
              }
            },
            no: {
              icon: "<i class='fas fa-ban'></i>",
              label: `Cancel`,
              callback: () => {
                resolve();
              }
            }
          }
        },
        {
          jQuery: true,
          height: "140px",
          classes: ["arm5e-dialog", "dialog", "set-option"]
        }
      ).render(true);
    });
    // remove any non alphanumeric character
    chosenOption = chosenOption.replace(/[^a-zA-Z0-9]/gi, "");
    if (chosenOption == "") {
      chosenOption = ACTIVE_EFFECTS_TYPES[type].subtypes[subtype].default;
    }
    let computedKey = ACTIVE_EFFECTS_TYPES[type].subtypes[subtype].key;
    let updateData = {};
    let arrayOptions = this.object.getFlag("arm5e", "option");
    arrayOptions[index] = chosenOption;
    updateData[`flags.arm5e.option`] = arrayOptions;
    const changesData = this.document.changes;
    changesData[index].key = computedKey.replace("#OPTION#", chosenOption);
    updateData.changes = changesData;
    return this.submit({ preventClose: true, updateData: updateData });
  }

  async _addEffectChange(updateFlags) {
    const changesData = this.document.changes;
    changesData.push({ key: "", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "" });
    return this.submit({
      preventClose: true,
      updateData: {
        changes: changesData,
        flags: updateFlags
      }
    });
  }
}
