import { convertToNumber, debug, log } from "../tools.js";
import { GroupSchedule } from "./group-schedule.js";

export class Astrolab extends FormApplication {
  constructor(data, options) {
    super(data, options);
    this.object.trackRes = game.settings.get("arm5e", "trackResources");

    Hooks.on("arm5e-date-change", (date) => {
      this.object.year = date.year;
      this.object.season = date.season;
      this.render(true);
    });
  }

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["arm5e", "sheet", "astrolab-sheet"],
      title: "Astrolab",
      template: "systems/arm5e/templates/generic/astrolab.html",
      width: "600",
      height: "auto",
      submitOnChange: true,
      closeOnSubmit: false
    });
  }
  async getData(options = {}) {
    const data = await super.getData().object;
    let currentDate = game.settings.get("arm5e", "currentDate");
    data.curYear = currentDate.year;
    data.curSeason = currentDate.season;
    if (game.modules.get("foundryvtt-simple-calendar")?.active) {
      data.dateChange = "disabled";
    }

    data.date = "1220-03-21";
    data.trackRes = game.settings.get("arm5e", "trackResources");

    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find(".set-date").click(this.setDate.bind(this));
    html.find(".rest-all").click(this.restEveryone.bind(this));
    html.find(".group-schedule").click(this.displaySchedule.bind(this));
    html.find(".trackRes").change(async (e) => {
      e.preventDefault();
      let value = e.target.checked;
      let oldValue = game.settings.get("arm5e", "trackResources");
      log(false, `value=${value}, settting=${oldValue}`);
      await game.settings.set("arm5e", "trackResources", !oldValue);
    });
    html.find(".show-calendar").click((e) => {
      SimpleCalendar.api.showCalendar(null, true);
    });
  }
  async displaySchedule(event) {
    event.preventDefault();
    const schedule = new GroupSchedule();
    const res = await schedule.render(true);
  }

  async setDate(event) {
    event.preventDefault();

    const year = this.object.year;
    const season = this.object.season;
    ui.notifications.info(
      game.i18n.format("arm5e.notification.setDate", {
        year: year,
        season: game.i18n.localize(CONFIG.ARM5E.seasons[season].label)
      })
    );
    await game.settings.set("arm5e", "currentDate", {
      year: year,
      season: season
    });
    Hooks.callAll("arm5e-date-change", { year: year, season: season });
    this.render();
  }

  async restEveryone(event) {
    event.preventDefault();
    const dataset = event.currentTarget.dataset;
    const updateData = {
      "system.fatigueCurrent": 0,
      "system.fatigueLongTerm": 0
    };
    await game.actors.updateAll(updateData, (e) => {
      return e.type === "player" || e.type === "npc" || e.type === "beast";
    });
  }

  async _updateObject(event, formData) {
    if (formData.season) {
      this.object.season = formData.season;
    }
    if (formData.year) {
      this.object.year = formData.year;
    }
    if (formData.trackRes) {
      this.object.trackRes = formData.trackRes;
    }
  }
}
