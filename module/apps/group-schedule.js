import { ARM5E } from "../config.js";
import { UI } from "../constants/ui.js";
import { DiaryEntrySchema } from "../schemas/diarySchema.js";
import { debug, getDataset, log } from "../tools/tools.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class GroupSchedule extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(options) {
    super(options);
    this.displayYear = null;
    this.troupeFilter = "players";
  }

  static DEFAULT_OPTIONS = {
    id: "group-schedule",
    form: {
      submitOnChange: false,
      closeOnSubmit: false
    },
    classes: ["arm5e", "sheet", "calendar-sheet"],
    window: { contentClasses: ["standard-form"] },
    position: {
      width: 600,
      height: "auto"
    },
    tag: "form"
  };

  get title() {
    return game.i18n.localize("arm5e.time.troupeSchedule");
  }

  static PARTS = {
    header: {
      template: "systems/arm5e/templates/generic/parts/astrolab-header.hbs"
    },
    calendar: {
      template: "systems/arm5e/templates/generic/group-schedule.hbs",
      templates: ["systems/arm5e/templates/generic/parts/group-schedule-grid.hbs"],
      scrollable: [".years"]
    },
    footer: {
      template: "systems/arm5e/templates/generic/parts/astrolab-footer.hbs"
    }
  };

  async _prepareContext(options = {}) {
    const data = await super._prepareContext(options);
    let currentDate = game.settings.get("arm5e", "currentDate");
    data.curYear = Number(currentDate.year);
    data.curSeason = currentDate.season;
    data.selectedActors = [];
    data.title = this.title;
    data.troupeFilters = ARM5E.activities.troupeFilters;
    if (this.displayYear == null) {
      this.displayYear = data.curYear;
    }
    let actors = [];
    switch (this.troupeFilter) {
      case "all":
        actors = game.actors.filter((e) => e.type === "player" || e.type === "npc");
        break;
      case "players":
        actors = game.actors.filter((e) => e.type === "player");
        break;
      case "magi":
        actors = game.actors.filter(
          (e) => e.type === "player" && e.system.charType.value == "magus"
        );
        break;
      case "companions":
        actors = game.actors.filter(
          (e) => e.type === "player" && e.system.charType.value == "companion"
        );
        break;
      case "grogs":
        actors = game.actors.filter(
          (e) => e.type === "player" && e.system.charType.value == "grog"
        );
        break;
      case "npcs":
        actors = game.actors.filter((e) => e.type === "npc");
        break;
    }

    for (let actor of actors) {
      const actorSchedule = actor.getSchedule(this.displayYear, this.displayYear, [], []);

      data.message = "";
      let actorYear = {
        id: actor._id,
        actorName: actor.name,
        year: this.displayYear,
        seasons: {
          [CONFIG.SEASON_ORDER_INV[0]]: { selected: false, busy: false, activities: [] },
          [CONFIG.SEASON_ORDER_INV[1]]: { selected: false, busy: false, activities: [] },
          [CONFIG.SEASON_ORDER_INV[2]]: { selected: false, busy: false, activities: [] },
          [CONFIG.SEASON_ORDER_INV[3]]: { selected: false, busy: false, activities: [] }
        }
      };

      for (let s of Object.keys(ARM5E.seasons)) {
        if (actorSchedule.length > 0) {
          if (actorSchedule[0].seasons[s].length > 0) {
            actorYear.seasons[s].busy = DiaryEntrySchema.hasConflict(actorSchedule[0].seasons[s]);
            for (let busy of actorSchedule[0].seasons[s]) {
              actorYear.seasons[s].activities.push({ id: busy.id, name: busy.name, img: busy.img });
            }
          }
        }
      }
      data.selectedActors.push(actorYear);
    }

    // styling
    for (let a of data.selectedActors) {
      for (let event of Object.values(a.seasons)) {
        event.edition = false;
        if (event.activities.length > 0) {
          if (!event.busy) {
            event.style = UI.STYLES.CALENDAR_BUSY;
          } else {
            event.style = UI.STYLES.CALENDAR_CONFLICT;
          }
        }
      }
    }
    log(false, data);
    data.config = CONFIG.ARM5E;
    data.displayYear = this.displayYear;
    data.troupeFilter = this.troupeFilter;
    return data;
  }

  _onRender(context, options) {
    super._onRender(context, options);
    const html = this.element;
    html.querySelector(".change-year").addEventListener("change", this._setYear.bind(this));
    html
      .querySelector(".next-step")
      .addEventListener("click", async (event) => this._changeYear(event, 1));
    html
      .querySelector(".previous-step")
      .addEventListener("click", async (event) => this._changeYear(event, -1));
    html.querySelectorAll(".vignette").forEach((el) => {
      el.addEventListener("click", async (event) => {
        event.stopPropagation();
        const actor = game.actors.get(event.currentTarget.dataset.actorid);
        if (actor) {
          const item = actor.items.get(event.currentTarget.dataset.id);
          if (item) {
            item.apps[this.appId] = this;
            item.sheet.render(true, { focus: true });
          }
        }
      });
    });
    // Add activity Item
    html.querySelectorAll(".item-create").forEach((el) => {
      el.addEventListener("click", async (event) => {
        const dataset = getDataset(event);
        if (event.stopPropagation) event.stopPropagation();
        const actor = game.actors.get(dataset.actor);
        let data = { type: dataset.type, dates: [{ season: dataset.season, year: dataset.year }] };
        await actor.sheet._onItemCreate(data);
        this.render();
      });
    });

    html
      .querySelector(".troupeFilter")
      ?.addEventListener("change", (event) => this._changeTroupeFilter(event));
  }

  async _changeYear(event, offset) {
    event.preventDefault();
    const newYear = Number(getDataset(event).year) + offset;
    if (newYear < 0) {
      // no effect
      return;
    }
    this.displayYear = newYear;
    this.render();
  }
  async _setYear(event) {
    event.preventDefault();
    let newYear = Number(event.currentTarget.value);
    this.displayYear = newYear;
    this.render();
  }

  async _changeTroupeFilter(event) {
    event.preventDefault();
    let newFilter = event.target.value;
    this.troupeFilter = newFilter;
    this.render();
  }
}
