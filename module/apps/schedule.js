import { ARM5E } from "../config.js";
import { UI } from "../constants/ui.js";
import { DiaryEntrySchema } from "../schemas/diarySchema.js";
import { debug, getDataset, log } from "../tools/tools.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class Schedule extends HandlebarsApplicationMixin(ApplicationV2) {
  /**
   * Constructor expects options with document field containing the actor.
   * @param {Object} options - ApplicationV2 options
   * @param {Actor} options.document - The actor document
   */
  constructor(options) {
    super(options);
    this.displayYear = null;
    this.actor = options.document;
    this.actor.apps[this.options.uniqueId] = this; // Register with actor's app management
  }

  async close(options = {}) {
    if (this.actor?.apps?.[this.options.uniqueId] != undefined) {
      delete this.actor.apps[this.options.uniqueId];
    }
    return super.close(options);
  }

  static DEFAULT_OPTIONS = {
    id: "schedule",
    classes: ["arm5e", "sheet", "calendar-sheet"],
    window: { contentClasses: ["standard-form"] },
    position: {
      width: 600,
      height: "auto"
    },
    tag: "form",
    actions: {
      changeYear: Schedule.changeYear,
      openItem: Schedule.openItem,
      createItem: Schedule.createItem
    }
  };

  get title() {
    return this.actor?.name ?? game.i18n.localize("arm5e.sheet.calendar");
  }

  static PARTS = {
    header: {
      template: "systems/arm5e/templates/generic/parts/astrolab-header.hbs"
    },
    schedule: {
      template: "systems/arm5e/templates/generic/character-schedule.hbs",
      templates: ["systems/arm5e/templates/generic/parts/schedule-grid.hbs"],
      scrollable: [".years"]
    },
    footer: {
      template: "systems/arm5e/templates/generic/parts/astrolab-footer.hbs"
    }
  };

  /**
   * Pure helper: build schedule for a single year with season conflict detection.
   * @param {number} year - Year to build
   * @param {Array} actorSchedule - Array of scheduled entries for this year
   * @param {number} curYear - Current game year
   * @param {string} curSeason - Current game season
   * @param {number} born - Birth year of actor
   * @param {number} agingStart - Aging start bonus threshold
   * @returns {Object} Year object with seasons, conflicts, and aging markers
   */
  #buildScheduleYear(year, actorSchedule, curYear, curSeason, born, agingStart) {
    const notAppliedStyle =
      'style="color: #000; box-shadow: 0 0 10px rgb(200, 0, 0); cursor: pointer;"';
    let yearData = {
      year,
      seasons: {
        [CONFIG.SEASON_ORDER_INV[0]]: {
          selected: false,
          conflict: false,
          future: false,
          others: []
        },
        [CONFIG.SEASON_ORDER_INV[1]]: {
          selected: false,
          conflict: false,
          future: false,
          others: []
        },
        [CONFIG.SEASON_ORDER_INV[2]]: {
          selected: false,
          conflict: false,
          future: false,
          others: []
        },
        [CONFIG.SEASON_ORDER_INV[3]]: {
          selected: false,
          conflict: false,
          future: false,
          others: []
        }
      }
    };

    let thisYearSchedule = actorSchedule.filter((e) => e.year == year);

    for (let s of Object.keys(ARM5E.seasons)) {
      // Mark future seasons
      if (
        year > curYear ||
        (year == curYear && CONFIG.SEASON_ORDER[curSeason] < CONFIG.SEASON_ORDER[s])
      ) {
        yearData.seasons[s].future = true;
      }

      // Process other activities
      if (thisYearSchedule.length > 0 && thisYearSchedule[0].seasons[s].length > 0) {
        yearData.seasons[s].conflict = DiaryEntrySchema.hasConflict(thisYearSchedule[0].seasons[s]);
        for (let busy of thisYearSchedule[0].seasons[s]) {
          let tmpStyle = busy.applied ? "" : notAppliedStyle;
          yearData.seasons[s].others.push({
            id: busy.id,
            name: busy.name,
            img: busy.img,
            style: tmpStyle
          });
        }
      }

      // Check if aging roll is needed
      if (
        agingStart + born <= year &&
        s === "winter" &&
        (thisYearSchedule.length == 0 ||
          thisYearSchedule[0]?.seasons[s].filter((s) => s.type === "aging").length == 0)
      ) {
        if (yearData.seasons[s].others.length == 0) {
          yearData.seasons[s].others.push({
            id: 0,
            name: "Aging roll needed",
            img: "systems/arm5e/assets/icons/Icon_Aging_and_Decrepitude.png"
          });
        }
        yearData.seasons[s].agingNeeded = true;
      }
    }

    return yearData;
  }

  /**
   * Pure helper: apply final styling to a single season event.
   */
  #styleSeasonEvent(event, hasOthers, conflict, isFuture) {
    event.edition = true;
    event.style = "";
    if (hasOthers) {
      event.style = conflict ? UI.STYLES.CALENDAR_CONFLICT : UI.STYLES.CALENDAR_BUSY;
    }
    if (isFuture) {
      event.style += " future";
    }
  }

  async _prepareContext(options = {}) {
    const data = await super._prepareContext(options);
    data.actor = this.actor;
    let currentDate = game.settings.get("arm5e", "currentDate");
    let enforceSchedule = game.settings.get("arm5e", "enforceSchedule");
    data.curYear = Number(currentDate.year);
    data.curSeason = currentDate.season;

    data.title = this.actor.name;

    if (this.displayYear == null) {
      this.displayYear = data.curYear;
    }

    data.selectedDates = [];
    const YEARS_BACK = 12;
    const YEARS_FORWARD = 2;
    const MIN_YEAR = this.displayYear - YEARS_BACK;
    const MAX_YEAR = this.displayYear + YEARS_FORWARD;
    const actorSchedule = this.actor.getSchedule(MIN_YEAR, MAX_YEAR, [], []);
    let born = Number(data.actor.system.description?.born.value) ?? data.curYear;
    const agingStart = 35 + data.actor.system.bonuses.traits.agingStart;
    data.message = "";
    if (Number.isNaN(born)) {
      data.message = "No year of birth defined!";
      born = 1;
    }

    // Build calendar grid using pure helper
    for (let y = MAX_YEAR; y >= MIN_YEAR; y--) {
      let year = this.#buildScheduleYear(
        y,
        actorSchedule,
        data.curYear,
        data.curSeason,
        born,
        agingStart
      );
      data.selectedDates.push(year);
    }

    // Apply styling to all seasons
    for (let y of data.selectedDates) {
      for (let event of Object.values(y.seasons)) {
        this.#styleSeasonEvent(event, event.others.length > 0, event.conflict, event.future);
      }
    }

    log(false, data);
    data.config = CONFIG.ARM5E;
    data.displayYear = this.displayYear;
    return data;
  }

  _onRender(context, options) {
    super._onRender(context, options);
    const html = this.element;
    html.querySelector(".change-year").addEventListener("change", this._setYear.bind(this));
  }

  static async changeYear(event, target) {
    const newYear = Number(target.dataset.year) + parseInt(target.dataset.offset);
    if (newYear < 0) return;
    this.displayYear = newYear;
    this.render();
  }

  static async openItem(event, target) {
    event.stopPropagation();
    const item = this.actor.items.get(target.dataset.id);
  }

  static async createItem(event, target) {
    event.stopPropagation();
    const data = {
      type: target.dataset.type,
      dates: [{ season: target.dataset.season, year: target.dataset.year }]
    };
    await this.actor.sheet._onItemCreate(data);
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
}
