import { ARM5E } from "../config.js";
import { UI } from "../constants/ui.js";
import { DiaryEntrySchema } from "../schemas/diarySchema.js";
import { debug, getDataset, log } from "../tools/tools.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class GroupSchedule extends HandlebarsApplicationMixin(ApplicationV2) {
  /**
   * Constructor initializes with default state.
   * @param {Object} options - ApplicationV2 options (typically empty)
   */
  constructor(options = {}) {
    super(options);
    this.displayYear = null;
    this.troupeFilter = options.troupeFilter || "players";
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
    tag: "form",
    actions: {
      changeYear: GroupSchedule.changeYear,
      openItem: GroupSchedule.openItem,
      createItem: GroupSchedule.createItem
    }
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

  /**
   * Pure helper: filter actors by troupe type.
   * @param {string} filter - Filter key (all, players, magi, companions, grogs, npcs)
   * @returns {Array} Filtered array of actors
   */
  #filterActorsByTroupe(filter) {
    let actors = [];
    switch (filter) {
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
    return actors;
  }

  /**
   * Pure helper: build season aggregation for a single actor and year.
   * @param {Object} actor - Actor document
   * @param {number} year - Display year
   * @returns {Object} Actor year object with aggregated activities per season
   */
  #buildActorYearRow(actor, year) {
    const actorSchedule = actor.getSchedule(year, year, [], []);
    let actorYear = {
      id: actor._id,
      actorName: actor.name,
      year,
      seasons: {
        [CONFIG.SEASON_ORDER_INV[0]]: { selected: false, busy: false, activities: [] },
        [CONFIG.SEASON_ORDER_INV[1]]: { selected: false, busy: false, activities: [] },
        [CONFIG.SEASON_ORDER_INV[2]]: { selected: false, busy: false, activities: [] },
        [CONFIG.SEASON_ORDER_INV[3]]: { selected: false, busy: false, activities: [] }
      }
    };

    for (let s of Object.keys(ARM5E.seasons)) {
      if (actorSchedule.length > 0 && actorSchedule[0].seasons[s].length > 0) {
        actorYear.seasons[s].busy = DiaryEntrySchema.hasConflict(actorSchedule[0].seasons[s]);
        for (let busy of actorSchedule[0].seasons[s]) {
          actorYear.seasons[s].activities.push({ id: busy.id, name: busy.name, img: busy.img });
        }
      }
    }

    return actorYear;
  }

  /**
   * Pure helper: apply styling to season event (busy/conflict/none).
   */
  #styleActorSeason(event, hasActivities, busy) {
    event.edition = false;
    if (hasActivities) {
      event.style = busy ? UI.STYLES.CALENDAR_CONFLICT : UI.STYLES.CALENDAR_BUSY;
    }
  }

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

    // Filter actors using pure helper
    let actors = this.#filterActorsByTroupe(this.troupeFilter);

    // Build actor rows using pure helper
    for (let actor of actors) {
      let actorYear = this.#buildActorYearRow(actor, this.displayYear);
      data.selectedActors.push(actorYear);
    }

    // Apply styling using pure helper
    for (let a of data.selectedActors) {
      for (let event of Object.values(a.seasons)) {
        this.#styleActorSeason(event, event.activities.length > 0, event.busy);
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
      .querySelector(".troupeFilter")
      ?.addEventListener("change", (event) => this._changeTroupeFilter(event));
  }

  static async changeYear(event, target) {
    const newYear = Number(target.dataset.year) + parseInt(target.dataset.offset);
    if (newYear < 0) return;
    this.displayYear = newYear;
    this.render();
  }

  static async openItem(event, target) {
    event.stopPropagation();
    const actor = game.actors.get(target.dataset.actorid);
    if (actor) {
      const item = actor.items.get(target.dataset.id);
      if (item) {
        item.apps[this.appId] = this;
        item.sheet.render(true, { focus: true });
      }
    }
  }

  static async createItem(event, target) {
    event.stopPropagation();
    const actor = game.actors.get(target.dataset.actor);
    const data = {
      type: target.dataset.type,
      dates: [{ season: target.dataset.season, year: target.dataset.year }]
    };
    await actor.sheet._onItemCreate(data);
    this.render();
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
