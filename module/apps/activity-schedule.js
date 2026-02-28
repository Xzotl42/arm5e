import { ARM5E } from "../config.js";
import { UI } from "../constants/ui.js";
import { DiaryEntrySchema } from "../schemas/diarySchema.js";
import { debug, getDataset, log } from "../tools/tools.js";
import { compareDates } from "../tools/time.js";
// Similar syntax to importing, but note that
// this is object destructuring rather than an actual import
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class ActivitySchedule extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(options) {
    super(options);
    this.displayYear = null;
    this.dates = options.document.activity.system.dates;
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
      handler: ActivitySchedule.#onSubmit,
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
    // actions: {
    //   update: ActivitySchedule.#onSubmit
    // }
  };

  get title() {
    return "Activity schedule";
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

  async _prepareContext(options = {}) {
    const data = await super._prepareContext(options);
    data.actor = this.actor;
    data.activity = this.activity;

    // Get current game date and schedule enforcement settings
    let currentDate = game.settings.get("arm5e", "currentDate");
    let enforceSchedule = game.settings.get("arm5e", "enforceSchedule");
    data.curYear = Number(currentDate.year);
    data.curSeason = currentDate.season;
    data.duration = data.activity.system.duration;
    data.activityName = `${data.actor.name} : ${data.activity.name}`;
    data.title = game.i18n.localize("arm5e.activity.schedule.label");

    // Determine the initial year/season to display (first selected date or current date)
    if (this.dates.length == 0) {
      // All seasons unselected, use current date as starting point
      data.firstYear = data.curYear;
      data.firstSeason = data.curSeason;
    } else {
      data.firstYear = Number(this.dates[0].year);
      data.firstSeason = this.dates[0].season;
    }

    // Initialize update button state and display year
    data.updatePossible = "";
    if (this.displayYear == null) {
      this.displayYear = data.firstYear;
    }

    // Initialize display year and data structures
    data.selectedDates = [];
    const YEARS_BACK = 4;
    const YEARS_FORWARD = 5;
    // Calculate the range of years to display based on current display year only
    // This ensures the year window doesn't jump around when selecting/deselecting dates
    const MIN_YEAR = this.displayYear - YEARS_BACK;
    const MAX_YEAR = this.displayYear + YEARS_FORWARD;

    // Fetch the actor's schedule for the calculated year range, excluding this activity
    const actorSchedule = data.actor.getSchedule(MIN_YEAR, MAX_YEAR, [], [data.activity.id]);

    // Initialize counters and data for building the calendar
    let dateIndex = 0;
    data.selectedCnt = 0;
    data.message = "";
    const actType = data.activity.system.activity;
    const notAppliedStyle =
      'style="color: #000; box-shadow: 0 0 10px rgb(200, 0, 0); cursor: pointer;"';

    // Build calendar grid by iterating through all years and seasons in the range
    for (let y = MIN_YEAR; y <= MAX_YEAR; y++) {
      // Initialize year object with empty season data
      let year = {
        year: y,
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

      // Get all activities scheduled for this year
      let thisYearSchedule = actorSchedule.filter((e) => {
        return e.year == y;
      });

      // Process each season
      for (let s of Object.keys(ARM5E.seasons)) {
        // Mark seasons as future or today based on current date
        if (
          y > data.curYear ||
          (y == data.curYear && CONFIG.SEASON_ORDER[data.curSeason] < CONFIG.SEASON_ORDER[s])
        ) {
          year.seasons[s].future = true;
        } else if (
          y == data.curYear &&
          CONFIG.SEASON_ORDER[data.curSeason] == CONFIG.SEASON_ORDER[s]
        ) {
          // Mark the current season/year
          year.seasons[s].today = true;
        }

        // Check if this season is selected in the current activity's schedule
        if (dateIndex < this.dates.length) {
          if (y == this.dates[dateIndex].year && s == this.dates[dateIndex].season) {
            dateIndex++;
            year.seasons[s].selected = true;
            data.selectedCnt++;
          }
        }

        // Process other activities in the same season
        if (thisYearSchedule.length > 0) {
          if (thisYearSchedule[0].seasons[s].length > 0) {
            let currentEntry;
            // Check for conflicts between this activity and existing activities
            if (!year.seasons[s].selected) {
              if (DiaryEntrySchema.hasConflict(thisYearSchedule[0].seasons[s])) {
                year.seasons[s].conflict = true;
              }
            } else {
              // If this season is selected, check if the current activity conflicts with others
              currentEntry = {
                id: data.activity.id,
                img: data.activity.img,
                name: data.activity.name,
                applied: data.activity.system.done || data.activity.system.activity === "none",
                type: data.activity.system.activity
              };
              if (DiaryEntrySchema.hasConflict(thisYearSchedule[0].seasons[s], currentEntry)) {
                year.seasons[s].conflict = true;
                data.message = game.i18n.localize("arm5e.activity.msg.scheduleConflict");
              }
            }

            // Add other activities to the display, applying special styling for unapplied activities
            for (let busy of thisYearSchedule[0].seasons[s]) {
              let tmpStyle = busy.applied ? "" : notAppliedStyle;
              year.seasons[s].others.push({
                id: busy.id,
                name: busy.name,
                img: busy.img,
                style: tmpStyle
              });
            }
          }
        }
      }
      data.selectedDates.push(year);
    }
    // Apply visual styling to calendar events based on their state
    let activityConflicting = false;
    for (let y of data.selectedDates) {
      for (let event of Object.values(y.seasons)) {
        event.style = "";
        if (event.selected) {
          // Currently selected event in this activity
          event.edition = true;
          if (event.conflict) {
            // Highlight conflicts with red styling
            event.style = UI.STYLES.CALENDAR_CONFLICT;
            activityConflicting = true;
          } else {
            // Use standard current event styling
            event.style = UI.STYLES.CALENDAR_CURRENT;
          }
          if (event.future) {
            event.style += " future";
          } else if (event.today) {
            event.style += " today";
          }
        } else {
          // Event is not selected in this activity
          if (event.others.length > 0) {
            // Other activities are scheduled in this season
            if (
              enforceSchedule &&
              !ARM5E.activities.conflictExclusion.includes(actType) &&
              !ARM5E.activities.duplicateAllowed.includes(actType)
            ) {
              // Prevent editing if schedule enforcement is enabled and this activity type doesn't allow duplicates
              event.edition = false;
            } else {
              event.edition = true;
            }
            if (!event.conflict) {
              // Use busy season styling
              event.style = UI.STYLES.CALENDAR_BUSY;
            } else {
              // Highlight conflicts
              event.style = UI.STYLES.CALENDAR_CONFLICT;
            }
          } else {
            // Season is free, allow editing
            event.edition = true;
          }
          if (event.future) {
            event.style += " future";
          } else if (event.today) {
            event.style += " today";
          }
          // Disable further additions if activity duration is fully scheduled
          if (data.selectedCnt == data.activity.system.duration) {
            event.edition = false;
          }
        }
      }
    }

    // Disable update button if schedule is invalid
    // Invalid when: duration doesn't match selected seasons OR conflicts exist and schedule is enforced
    if (
      data.activity.system.duration != data.selectedCnt ||
      (activityConflicting && enforceSchedule)
    ) {
      data.updatePossible = "disabled";
    }

    // Add remaining context data for template rendering
    data.displayYear = this.displayYear;
    log(false, data);
    data.config = CONFIG.ARM5E;
    return data;
  }

  _onRender(context, options) {
    super._onRender(context, options);
    const html = this.element;
    html.querySelector(".change-year").addEventListener("change", this._setYear.bind(this));
    // html.addEventListener("change", (event) => {
    //   const target = event.target;
    //   if (!(target instanceof HTMLElement)) return;
    //   if (target.classList.contains("selectedSeason")) {
    //     this._selectSeason(event);
    //   }
    // });
    html.querySelectorAll(".selectedSeason").forEach((el) => {
      el.addEventListener("change", (event) => this._selectSeason(event));
    });
    html
      .querySelector(".next-step")
      .addEventListener("click", async (event) => this._changeYear(event, 1));
    html
      .querySelector(".previous-step")
      .addEventListener("click", async (event) => this._changeYear(event, -1));
    html.querySelector(".vignette")?.addEventListener("click", async (event) => {
      event.stopPropagation();
      const item = this.actor.items.get(event.currentTarget.dataset.id);
      if (item) {
        item.apps[this.appId] = this;
        item.sheet.render(true, { focus: true });
      }
    });
    // html
    //   .querySelector(".schedule-update")
    //   .addEventListener("click", async (event) => await this.submit(event));
  }

  // _onChangeForm(formConfig, event) {
  //   super._onChangeForm(formConfig, event);
  //   event.preventDefault();
  //   const dataset = getDataset(event);
  // }

  static async #onSubmit(event, form, formData) {
    for (let dependency of this.activity.system.externalIds) {
      if (game.actors.has(dependency.actorId)) {
        let actor = game.actors.get(dependency.actorId);
        if (actor.items.has(dependency.itemId)) {
          if (dependency.flags == 2) {
            // update schedule of dependency
            await actor.updateEmbeddedDocuments(
              "Item",
              [{ _id: dependency.itemId, system: { dates: this.dates } }],
              {}
            );
          }
        }
      }
    }
    await this.actor.updateEmbeddedDocuments("Item", [
      { _id: this.activity.id, system: { dates: this.dates } }
    ]);

    if (formData.object.displayYear) {
      this.displayYear = formData.object.displayYear;
    }
    if (formData.object.dates) {
      this.dates = formData.object.dates;
    }

    // this.close();
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

  // async _updateObject(event, formData) {
  //   if (formData.displayYear) {
  //     this.displayYear = formData.displayYear;
  //   }
  //   if (formData.dates) {
  //     this.dates = formData.dates;
  //   }

  //   return;
  // }
}
