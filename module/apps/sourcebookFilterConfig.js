import { log } from "../tools/tools.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class SourcebookFilterConfig extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(options) {
    super(options);
    this.buttons = {
      submit: {
        label: game.i18n.localize("PERMISSION.Submit"),
        icon: "fas fa-save",
        action: "submit",
        cssClass: ["dialog-button"]
      },
      reset: {
        label: game.i18n.localize("PERMISSION.Reset"),
        icon: "fas fa-sync",
        action: "reset",
        cssClass: ["dialog-button"]
      }
    };
  }
  static DEFAULT_OPTIONS = {
    id: "sourcebooks-filters-config",
    classes: ["arm5e", "arm5e-config"],
    tag: "form",
    form: {
      handler: SourcebookFilterConfig.#onSubmitHandler,
      submitOnChange: false,
      closeOnSubmit: true
    },
    window: {
      title: "Sourcebooks filter",
      resizable: false,
      contentClasses: ["standard-form", "arm5e-config"]
    },
    position: {
      width: 400,
      height: "auto"
    },
    actions: {
      // submit: SourcebookFilterConfig.#onSubmitHandler,
      reset: SourcebookFilterConfig.#onResetDefaults
    }
  };

  static PARTS = {
    form: {
      template: "systems/arm5e/templates/generic/sourcebook-filter-config.html"
    },
    buttons: {
      template: "systems/arm5e/templates/roll/parts/roll-buttons.hbs"
    }
  };

  static async #onSubmitHandler(event, form, formData) {
    await this._onSubmitFilters(event, formData);
  }

  async _prepareContext(options = {}) {
    const data = await super._prepareContext(options);
    data.buttons = this.buttons;
    let sources = Object.fromEntries(
      Object.entries(CONFIG.ARM5E.generic.sourcesTypes).map((e) => {
        return [
          e[0],
          {
            display: e[1].display === undefined ? false : e[1].display,
            label: e[1].label,
            edit: e[1].edit ? "disabled" : ""
          }
        ];
      })
    );
    data.sourcebooks = foundry.utils.mergeObject(
      sources,
      await game.settings.get(CONFIG.ARM5E.SYSTEM_ID, "sourcebookFilter")
    );

    log(false, data);
    return data;
  }

  static async #onResetDefaults(event, target) {
    event.preventDefault();
    await game.settings.set(CONFIG.ARM5E.SYSTEM_ID, "sourcebookFilter", {});
    ui.notifications.info("Reset filters", { localize: true });
    return this.render(true);
  }

  async _onSubmitFilters(ev, formData) {
    const filters = foundry.utils.expandObject(formData.object);

    for (let [k, v] of Object.entries(filters)) {
      filters[k] = {
        display: v
      };
    }

    // Homebrew and Corebook always true
    filters["custom"] = { display: true };
    filters["ArM5"] = { display: true };
    filters["ArM5Def"] = { display: true };

    await game.settings.set(CONFIG.ARM5E.SYSTEM_ID, "sourcebookFilter", filters);
    ui.notifications.info("Settings updated", { localize: true });
  }
}
