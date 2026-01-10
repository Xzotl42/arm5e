import { convertToNumber, debug, log } from "../tools/tools.js";
import { GroupSchedule } from "./group-schedule.js";

// Similar syntax to importing, but note that
// this is object destructuring rather than an actual import
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class Astrolabium extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(data, options) {
    super(options);
    this.appData = data;
    this.appData.trackRes = game.settings.get("arm5e", "trackResources");

    Hooks.on("arm5e-date-change", (date) => {
      this.appData.year = date.year;
      this.appData.season = date.season;
      this.render(true);
    });
  }

  static DEFAULT_OPTIONS = {
    id: "astrolabium",
    form: {
      handler: Astrolabium.#onSubmit,
      submitOnChange: true,
      closeOnSubmit: false
    },
    classes: ["arm5e", "sheet", "astrolab-sheet"],
    window: { contentClasses: ["standard-form"] },
    position: {
      width: 600,
      height: "auto"
    },
    tag: "form"
  };

  get title() {
    return "Astrolabium";
  }

  static PARTS = {
    astrolabium: {
      template: "systems/arm5e/templates/generic/astrolab.hbs"
    }
  };

  // data

  appData;

  async _prepareContext(options = {}) {
    const data = await super._prepareContext(options);
    let currentDate = game.settings.get("arm5e", "currentDate");
    data.curYear = currentDate.year;
    data.curSeason = currentDate.season;
    data.year = this.appData.year;
    data.season = this.appData.season;
    if (game.modules.get("foundryvtt-simple-calendar")?.active) {
      data.dateChange = "disabled";
    }
    data.seasons = this.appData.seasons;
    data.date = "1220-03-21";
    data.trackRes = game.settings.get("arm5e", "trackResources");

    return data;
  }

  _onRender(context, options) {
    super._onRender(context, options);
    const html = this.element;
    html.querySelector(".set-date").addEventListener("click", this.setDate.bind(this));
    html.querySelector(".rest-all").addEventListener("click", this.restEveryone.bind(this));
    html
      .querySelector(".group-schedule")
      .addEventListener("click", this.displaySchedule.bind(this));
    html.querySelector(".trackRes").addEventListener("change", async (e) => {
      e.preventDefault();
      let value = e.target.checked;
      let oldValue = game.settings.get("arm5e", "trackResources");
      log(false, `value=${value}, settting=${oldValue}`);
      await game.settings.set("arm5e", "trackResources", !oldValue);
    });
    if (game.modules.get("foundryvtt-simple-calendar")?.active) {
      html.querySelector(".show-calendar").addEventListener("click", (e) => {
        SimpleCalendar.api.showCalendar(null, true);
      });
    }
  }
  async displaySchedule(event) {
    event.preventDefault();
    const schedule = new GroupSchedule();
    const res = await schedule.render(true);
  }

  async setDate(event) {
    event.preventDefault();

    const year = this.appData.year;
    const season = this.appData.season;
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

  static #onSubmit(event, form, formData) {
    const data = formData.object;
    if (data.season) {
      this.appData.season = data.season;
    }
    if (data.year) {
      this.appData.year = data.year;
    }
    if (data.trackRes) {
      this.appData.trackRes = data.trackRes;
    }
  }
}
