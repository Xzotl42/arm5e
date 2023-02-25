import { debug, log } from "../tools.js";

export class Calendar extends FormApplication {
  constructor(data, options) {
    super(data, options);
  }
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["arm5e", "sheet", "calendar-sheet"],
      title: "Calendar",
      template: "systems/arm5e/templates/generic/calendar.html",
      width: "600",
      height: "auto"
    });
  }
  async getData(options = {}) {
    const data = await super.getData().object;
    let currentDate = game.settings.get("arm5e", "currentDate");
    data.curYear = Number(currentDate.year);
    data.curSeason = currentDate.season;
    data.years = [];
    for (let y = data.curYear - 2; y < data.curYear + 5; y++) {
      data.years.push(y);
    }

    data.config = CONFIG.ARM5E;
    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find(".change-season").change(this._changeSeason.bind(this));
    html.find(".change-year").change(this._changeYear.bind(this));
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

  async updateActors(event) {
    event.preventDefault();
    const dataset = event.currentTarget.dataset;
    const updateData = {
      system: { datetime: { season: dataset.season, year: dataset.year } }
    };
    await game.actors.updateAll(updateData, e => {
      return e.type === "player" || e.type === "npc" || e.type === "covenant";
    });
    ui.notifications.info(
      game.i18n.format("arm5e.notification.synchActors", {
        year: dataset.year,
        season: game.i18n.localize(CONFIG.ARM5E.seasons[dataset.season].label)
      })
    );
  }

  async _updateObject(event, formData) {
    if (formData.season) {
      this.object.season = formData.season;
    }
    if (formData.year) {
      this.object.year = formData.year;
    }

    this.render();

    return;
  }
}
