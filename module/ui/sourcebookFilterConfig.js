import { log } from "../tools.js";

export class SourcebookFilterConfig extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      title: game.i18n.localize("PERMISSION.Title"),
      id: "sourcebooks-filters-config",
      template: "systems/arm5e/templates/generic/sourcebook-filter-config.html",
      height: "auto",
      classes: ["arm5e-config"],
      closeOnSubmit: false,
      height: "auto",
      submitOnChange: false,
      submitOnClose: false,
      title: game.i18n.localize(`Sourcebooks filter`),
      width: 400,
      resizable: true
    });
  }

  async getData() {
    const data = super.getData();
    let sources = Object.fromEntries(
      Object.entries(CONFIG.ARM5E.generic.sourcesTypes).map((e) => {
        return [
          e[0],
          {
            display: e[1].display === undefined ? false : e[1].display, // true by default
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

  activateListeners(html) {
    super.activateListeners(html);
    html.find("button[name='reset']").click(this._onResetDefaults.bind(this));
  }

  async _onResetDefaults(event) {
    event.preventDefault();
    await game.settings.set(CONFIG.ARM5E.SYSTEM_ID, "sourcebookFilter", {});
    ui.notifications.info("Reset filters", { localize: true });
    return this.render();
  }

  async _updateObject(ev, formData) {
    const filters = foundry.utils.expandObject(formData);

    for (let [k, v] of Object.entries(filters)) {
      filters[k] = {
        value: v
      };
    }

    // Homebrew and Corebook always true
    filters["custom"] = { value: true };
    filters["ArM5"] = { value: true };
    filters["ArM5Def"] = { value: true };

    await game.settings.set(CONFIG.ARM5E.SYSTEM_ID, "sourcebookFilter", filters);
    ui.notifications.info("Settings updated", { localize: true });
  }
}
