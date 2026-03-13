import { ARM5E } from "../config.js";
import { UI } from "../constants/ui.js";
import { DiaryEntrySchema } from "../schemas/diarySchema.js";
import { debug, getDataset, log } from "../tools/tools.js";
import { compareDates } from "../tools/time.js";
// Similar syntax to importing, but note that
// this is object destructuring rather than an actual import
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class ActivitySchedule extends HandlebarsApplicationMixin(ApplicationV2) {
  /**
   * Constructor expects options with nested document containing actor and activity.
   * Activity is required and must not be null.
   * @param {Object} options - ApplicationV2 options
   * @param {Object} options.document - Container object
   * @param {Actor} options.document.actor - The actor document (required)
   * @param {Item} options.document.activity - The activity item (diary entry, required)
   */
  constructor(options) {
    super(options);
    this.displayYear = null;
    this.dates = [...(options.document.activity.system?.dates ?? [])]; // Copy array
    this.actor = options.document.actor;
    this.activity = options.document.activity;

    this.timeHook = Hooks.on("arm5e-date-change", (date) => {
      this.render(true);
    });
  }
  async close(options = {}) {
    Hooks.off("arm5e-date-change", this.timeHook);
    return super.close(options);
  }

  static DEFAULT_OPTIONS = {
    id: "activity-schedule",
    form: {
      handler: ActivitySchedule.#onSubmitHandler,
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
      changeYear: ActivitySchedule.changeYear,
      openItem: ActivitySchedule.openItem
    }
  };

  /**
   * Static wrapper that routes form submission to instance method.
   * This allows tests to invoke the submit logic directly via instance method.
   */
  static async #onSubmitHandler(event, form, formData) {
    return this._onSubmitSchedule.call(this, event, form, formData);
  }

  get title() {
    return game.i18n.localize("arm5e.activity.schedule.label");
  }

  static PARTS = {
    header: {
      template: "systems/arm5e/templates/generic/parts/astrolab-header.hbs"
    },
    activitySchedule: {
      template: "systems/arm5e/templates/generic/activity-schedule.hbs",
      templates: ["systems/arm5e/templates/generic/parts/calendar-grid.hbs"],
      scrollable: [".years"]
    },
    footer: {
      template: "systems/arm5e/templates/generic/parts/astrolab-footer.hbs"
    }
  };

  /**
   * Pure helper: check if selected season would conflict with existing activities.
   * Returns conflict state and enforceability based on activity type rules.
   */
  #checkSeasonConflict(selectedSeason, thisYearSchedule, activity, enforceSchedule) {
    if (!selectedSeason || thisYearSchedule.length === 0) {
      return { conflict: false, enforceConflict: false };
    }

    if (thisYearSchedule[0].seasons[selectedSeason.season]?.length === 0) {
      return { conflict: false, enforceConflict: false };
    }

    const currentEntry = {
      id: activity.id,
      img: activity.img,
      name: activity.name,
      applied: activity.system.done || activity.system.activity === "none",
      type: activity.system.activity
    };

    const hasConflict = DiaryEntrySchema.hasConflict(
      thisYearSchedule[0].seasons[selectedSeason.season],
      currentEntry
    );

    const enforceConflict = hasConflict && enforceSchedule;
    return { conflict: hasConflict, enforceConflict };
  }

  /**
   * Pure helper: build a single year's season grid with selection/conflict state.
   * Accounts for selected dates, other activities, and enforcement rules.
   */
  #buildActivityYear(
    year,
    actorSchedule,
    currentActivity,
    selectedDates,
    curYear,
    curSeason,
    enforceSchedule
  ) {
    const notAppliedStyle =
      'style="color: #000; box-shadow: 0 0 10px rgb(200, 0, 0); cursor: pointer;"';
    const dateIndex = selectedDates.findIndex((d) => d.year === year);

    let yearData = {
      year,
      seasons: {
        [CONFIG.SEASON_ORDER_INV[0]]: {
          future: false,
          selected: false,
          conflict: false,
          others: []
        },
        [CONFIG.SEASON_ORDER_INV[1]]: {
          future: false,
          selected: false,
          conflict: false,
          others: []
        },
        [CONFIG.SEASON_ORDER_INV[2]]: {
          future: false,
          selected: false,
          conflict: false,
          others: []
        },
        [CONFIG.SEASON_ORDER_INV[3]]: {
          future: false,
          selected: false,
          conflict: false,
          others: []
        }
      }
    };

    let thisYearSchedule = actorSchedule.filter((e) => e.year === year);

    for (let s of Object.keys(ARM5E.seasons)) {
      // Mark future seasons
      if (
        year > curYear ||
        (year === curYear && CONFIG.SEASON_ORDER[curSeason] < CONFIG.SEASON_ORDER[s])
      ) {
        yearData.seasons[s].future = true;
      } else if (year === curYear && CONFIG.SEASON_ORDER[curSeason] === CONFIG.SEASON_ORDER[s]) {
        yearData.seasons[s].today = true;
      }

      // Check if this season is selected
      const isSelected = selectedDates.some((d) => d.year === year && d.season === s);
      if (isSelected) {
        yearData.seasons[s].selected = true;
      }

      // Process other activities and check conflicts
      if (thisYearSchedule.length > 0 && thisYearSchedule[0].seasons[s].length > 0) {
        if (!isSelected) {
          // Not selected: just check if others conflict
          yearData.seasons[s].conflict = DiaryEntrySchema.hasConflict(
            thisYearSchedule[0].seasons[s]
          );
        } else {
          // Selected: check if current activity conflicts with others
          const conflictCheck = this.#checkSeasonConflict(
            { year, season: s },
            thisYearSchedule,
            currentActivity,
            enforceSchedule
          );
          yearData.seasons[s].conflict = conflictCheck.conflict;
        }

        // Add other activities to display
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
    }

    return yearData;
  }

  /**
   * Pure helper: apply final style/editability state to season event.
   */
  #applySeasonStyling(
    event,
    isSelected,
    others,
    conflict,
    isFuture,
    isToday,
    enforceSchedule,
    actType,
    selectedCount,
    duration
  ) {
    event.style = "";

    if (isSelected) {
      // Current selection in this activity
      event.edition = true;
      event.style = conflict ? UI.STYLES.CALENDAR_CONFLICT : UI.STYLES.CALENDAR_CURRENT;
      if (isFuture) {
        event.style += " future";
      } else if (isToday) {
        event.style += " today";
      }
    } else {
      // Not selected in this activity
      if (others.length > 0) {
        // Other activities exist
        if (
          enforceSchedule &&
          !ARM5E.activities.conflictExclusion.includes(actType) &&
          !ARM5E.activities.duplicateAllowed.includes(actType)
        ) {
          event.edition = false;
        } else {
          event.edition = true;
        }
        event.style = conflict ? UI.STYLES.CALENDAR_CONFLICT : UI.STYLES.CALENDAR_BUSY;
      } else {
        // Season is free
        event.edition = true;
      }

      if (isFuture) {
        event.style += " future";
      } else if (isToday) {
        event.style += " today";
      }

      // Disable further additions if activity duration is fully scheduled
      if (selectedCount === duration) {
        event.edition = false;
      }
    }
  }

  async _prepareContext(options = {}) {
    const data = await super._prepareContext(options);
    data.actor = this.actor;
    data.activity = this.activity;

    // Get current game date and schedule enforcement settings
    let currentDate = game.settings.get("arm5e", "currentDate");
    let enforceSchedule = game.settings.get("arm5e", "enforceSchedule");
    data.curYear = Number(currentDate.year);
    data.curSeason = currentDate.season;
    data.duration = this.activity.system.duration;
    data.activityName = `${this.actor.name} : ${this.activity.name}`;
    data.title = game.i18n.localize("arm5e.activity.schedule.label");

    // Determine initial display year
    if (this.dates.length === 0) {
      data.firstYear = data.curYear;
      data.firstSeason = data.curSeason;
    } else {
      data.firstYear = Number(this.dates[0].year);
      data.firstSeason = this.dates[0].season;
    }

    data.updatePossible = "";
    if (this.displayYear === null) {
      this.displayYear = data.firstYear;
    }

    // Build calendar grid
    data.selectedDates = [];
    const YEARS_BACK = 4;
    const YEARS_FORWARD = 5;
    const MIN_YEAR = this.displayYear - YEARS_BACK;
    const MAX_YEAR = this.displayYear + YEARS_FORWARD;

    const actorSchedule = this.actor.getSchedule(MIN_YEAR, MAX_YEAR, [], [this.activity.id]);
    const actType = this.activity.system.activity;
    let selectedCount = 0;
    data.message = "";

    // Build years using pure helper
    for (let y = MIN_YEAR; y <= MAX_YEAR; y++) {
      let year = this.#buildActivityYear(
        y,
        actorSchedule,
        this.activity,
        this.dates,
        data.curYear,
        data.curSeason,
        enforceSchedule
      );
      data.selectedDates.push(year);
    }

    // Apply styling and check for activity conflicts
    let activityConflicting = false;
    for (let y of data.selectedDates) {
      for (let [season, event] of Object.entries(y.seasons)) {
        const isSelected = this.dates.some((d) => d.year === y.year && d.season === season);
        if (isSelected) {
          selectedCount++;
          if (event.conflict) {
            activityConflicting = true;
          }
        }

        this.#applySeasonStyling(
          event,
          isSelected,
          event.others,
          event.conflict,
          event.future,
          event.today,
          enforceSchedule,
          actType,
          selectedCount,
          data.duration
        );
      }
    }

    // Determine if update is possible
    data.selectedCnt = selectedCount;
    if (
      this.activity.system.duration !== selectedCount ||
      (activityConflicting && enforceSchedule)
    ) {
      data.updatePossible = "disabled";
      if (activityConflicting && enforceSchedule) {
        data.message = game.i18n.localize("arm5e.activity.msg.scheduleConflict");
      }
    }

    data.displayYear = this.displayYear;
    log(false, data);
    data.config = CONFIG.ARM5E;
    return data;
  }

  _onRender(context, options) {
    super._onRender(context, options);
    const html = this.element;
    html.querySelector(".change-year").addEventListener("change", this._setYear.bind(this));

    html.querySelectorAll(".selectedSeason").forEach((el) => {
      el.addEventListener("change", (event) => this._selectSeason(event));
    });
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
    if (item) {
      item.apps[this.options.uniqueId] = this;
      item.sheet.render(true, { focus: true });
    }
  }

  /**
   * Public submit handler for activity schedule updates.
   * Callable directly for testing. Handles:
   * 1. Updates dependent activities with new schedule
   * 2. Updates this activity's schedule
   * 3. Syncs local state
   */
  async _onSubmitSchedule(event, form, formData) {
    // Update dependent items with this activity's new schedule
    for (let dependency of this.activity.system.externalIds) {
      if (game.actors.has(dependency.actorId)) {
        let actor = game.actors.get(dependency.actorId);
        if (actor.items.has(dependency.itemId)) {
          if (dependency.flags === 2) {
            // Flag 2 means update dependency schedule
            await actor.updateEmbeddedDocuments(
              "Item",
              [{ _id: dependency.itemId, system: { dates: this.dates } }],
              {}
            );
          }
        }
      }
    }

    // Update this activity's schedule
    await this.actor.updateEmbeddedDocuments("Item", [
      { _id: this.activity.id, system: { dates: this.dates } }
    ]);

    // Sync local state from form data (if present)
    if (formData.object.displayYear) {
      this.displayYear = formData.object.displayYear;
    }
    if (formData.object.dates) {
      this.dates = formData.object.dates;
    }
  }
  async _selectSeason(event) {
    event.preventDefault();
    let dataset = event.target.dataset;
    // log(false, `Select season ${dataset.season} ${dataset.year} ${event.target.value}`);
    // Create a copy of the dates array to avoid mutating the original
    let newDates = [...this.dates];
    let wasChecked = dataset.selected === "true" ? true : false;
    if (wasChecked) {
      // it was checked, so remove this season
      this.dates = newDates.filter((e) => {
        return !(e.year == Number(dataset.year) && e.season === dataset.season);
      });
    } else {
      // it was unchecked, so add this season
      newDates.push({
        year: Number(dataset.year),
        season: dataset.season,
        date: "",
        applied: false
      });
      this.dates = newDates.sort(compareDates);
    }
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
