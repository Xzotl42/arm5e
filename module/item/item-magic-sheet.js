import { ArM5eItemSheet } from "./item-sheet.js";
import { log } from "../tools.js";
import { ARM5E } from "../config.js";
/**
 * Extend the basic ArM5eItemSheet with some very simple modifications
 * @extends {ArM5eItemSheet}
 */
export class ArM5eItemMagicSheet extends ArM5eItemSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["arm5e", "sheet", "item"],
      width: 654,
      height: 800,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "spell-design"
        }
      ]
    });
  }

  /* -------------------------------------------- */

  /** @override */
  async getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the item object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = await super.getData();
    context.system.localizedDesc = this.item._getEffectAttributesLabel();
    const filterBooks = Object.fromEntries(
      Object.entries(await game.settings.get(CONFIG.ARM5E.SYSTEM_ID, "sourcebookFilter")).filter(
        ([key, f]) => f.value === true
      )
    );

    context.ranges = Object.fromEntries(
      Object.entries(CONFIG.ARM5E.magic.ranges).filter(([key, val]) => {
        return val.source in filterBooks;
      })
    );

    context.targets = Object.fromEntries(
      Object.entries(CONFIG.ARM5E.magic.targets).filter(([key, val]) => {
        return val.source in filterBooks;
      })
    );

    context.durations = Object.fromEntries(
      Object.entries(CONFIG.ARM5E.magic.durations).filter(([key, val]) => {
        return val.source in filterBooks;
      })
    );

    switch (this.item.type) {
      case "spell":
      case "enchantment":
      case "magicItem":
      case "laboratoryText":
      case "magicalEffect":
        context.ranges[context.system.range.value] =
          CONFIG.ARM5E.magic.ranges[context.system.range.value];
        context.targets[context.system.target.value] =
          CONFIG.ARM5E.magic.targets[context.system.target.value];
        context.durations[context.system.duration.value] =
          CONFIG.ARM5E.magic.durations[context.system.duration.value];
        break;
      default:
        break;
    }

    return context;
  }

  /* -------------------------------------------- */

  // /** @override */
  // setPosition(options = {}) {
  //     const position = super.setPosition(options);
  //     const sheetBody = this.element.find(".sheet-body");
  //     const bodyHeight = position.height - 380;
  //     sheetBody.css("height", bodyHeight);
  //     return position;
  // }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;
    html.find(".advanced-req").click(this._pickRequisites.bind(this));
  }

  async _pickRequisites(event) {
    event.preventDefault();
    this.item.system.config = {
      magic: {
        techniques: CONFIG.ARM5E.magic.techniques,
        forms: CONFIG.ARM5E.magic.forms
      }
    };
    this.item.system.ui = { flavor: event.currentTarget.dataset.flavor };
    log("false", this.item.system);
    var itemData = this.item;
    let template = "systems/arm5e/templates/item/parts/requisites.html";
    renderTemplate(template, this.item.system).then(function(html) {
      new Dialog(
        {
          title: game.i18n.localize("arm5e.sheet.Requisites"),
          content: html,
          buttons: {
            yes: {
              icon: "<i class='fas fa-check'></i>",
              label: game.i18n.localize("arm5e.dialog.button.save"),
              callback: html => _setRequisites(html, itemData)
            },
            no: {
              icon: "<i class='fas fa-ban'></i>",
              label: game.i18n.localize("arm5e.dialog.button.cancel"),
              callback: null
            }
          }
        },
        {
          classes: ["arm5e-dialog", "dialog"]
        }
      ).render(true);
    });
  }
}

export async function _setRequisites(selector, item) {
  let itemUpdate = {};
  let found = selector.find(".SelectedCreo");
  if (found.length > 0) {
    if (found[0].checked == true) {
      itemUpdate["system.technique-req.cr"] = true;
    } else {
      itemUpdate["system.technique-req.cr"] = false;
    }
  }
  found = selector.find(".SelectedIntellego");
  if (found.length > 0) {
    if (found[0].checked == true) {
      itemUpdate["system.technique-req.in"] = true;
    } else {
      itemUpdate["system.technique-req.in"] = false;
    }
  }
  found = selector.find(".SelectedMuto");
  if (found.length > 0) {
    if (found[0].checked == true) {
      itemUpdate["system.technique-req.mu"] = true;
    } else {
      itemUpdate["system.technique-req.mu"] = false;
    }
  }
  found = selector.find(".SelectedPerdo");
  if (found.length > 0) {
    if (found[0].checked == true) {
      itemUpdate["system.technique-req.pe"] = true;
    } else {
      itemUpdate["system.technique-req.pe"] = false;
    }
  }
  found = selector.find(".SelectedRego");
  if (found.length > 0) {
    if (found[0].checked == true) {
      itemUpdate["system.technique-req.re"] = true;
    } else {
      itemUpdate["system.technique-req.re"] = false;
    }
  }

  // Forms
  found = selector.find(".SelectedAnimal");
  if (found.length > 0) {
    if (found[0].checked == true) {
      itemUpdate["system.form-req.an"] = true;
    } else {
      itemUpdate["system.form-req.an"] = false;
    }
  }

  found = selector.find(".SelectedAquam");
  if (found.length > 0) {
    if (found[0].checked == true) {
      itemUpdate["system.form-req.aq"] = true;
    } else {
      itemUpdate["system.form-req.aq"] = false;
    }
  }
  found = selector.find(".SelectedAuram");
  if (found.length > 0) {
    if (found[0].checked == true) {
      itemUpdate["system.form-req.au"] = true;
    } else {
      itemUpdate["system.form-req.au"] = false;
    }
  }

  found = selector.find(".SelectedCorpus");
  if (found.length > 0) {
    if (found[0].checked == true) {
      itemUpdate["system.form-req.co"] = true;
    } else {
      itemUpdate["system.form-req.co"] = false;
    }
  }

  found = selector.find(".SelectedHerbam");
  if (found.length > 0) {
    if (found[0].checked == true) {
      itemUpdate["system.form-req.he"] = true;
    } else {
      itemUpdate["system.form-req.he"] = false;
    }
  }

  found = selector.find(".SelectedIgnem");
  if (found.length > 0) {
    if (found[0].checked == true) {
      itemUpdate["system.form-req.ig"] = true;
    } else {
      itemUpdate["system.form-req.ig"] = false;
    }
  }

  found = selector.find(".SelectedImaginem");
  if (found.length > 0) {
    if (found[0].checked == true) {
      itemUpdate["system.form-req.im"] = true;
    } else {
      itemUpdate["system.form-req.im"] = false;
    }
  }
  found = selector.find(".SelectedMentem");
  if (found.length > 0) {
    if (found[0].checked == true) {
      itemUpdate["system.form-req.me"] = true;
    } else {
      itemUpdate["system.form-req.me"] = false;
    }
  }

  found = selector.find(".SelectedTerram");
  if (found.length > 0) {
    if (found[0].checked == true) {
      itemUpdate["system.form-req.te"] = true;
    } else {
      itemUpdate["system.form-req.te"] = false;
    }
  }

  found = selector.find(".SelectedVim");
  if (found.length > 0) {
    if (found[0].checked == true) {
      itemUpdate["system.form-req.vi"] = true;
    } else {
      itemUpdate["system.form-req.vi"] = false;
    }
  }

  await item.update(itemUpdate);
}
