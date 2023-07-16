import { debug, getDataset, log } from "../tools.js";
import { GroupSchedule } from "./group-schedule.js";

export class Sanatorium extends FormApplication {
  constructor(data, options) {
    super(data, options);
    this.object.daysLeft = 92; // TODO configurable?
    this.object.seasons = CONFIG.ARM5E.seasons;
    this.object.curYear = this.object.patient.system.datetime.year;
    this.object.curSeason = this.object.patient.system.datetime.season;
    this.object.modifiers = {
      magicalHelp: 0,
      mundaneHelp: 0,
      activeEffect: 0,
      labHealth: 0
    };
  }

  static async createDialog(actor) {
    const dialogData = { patient: actor };
    const sanatorium = new Sanatorium(dialogData, {}); // data, options
    actor.apps[sanatorium.appId] = sanatorium;
    const res = await sanatorium.render(true);
  }
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["arm5e", "sheet", "sanatorium-sheet"],
      title: "Sanatorium",
      template: "systems/arm5e/templates/generic/sanatorium.html",
      width: "600",
      height: "600",
      submitOnChange: true,
      closeOnSubmit: false
    });
  }

  onClose(app) {
    if (app.object.patient) {
      delete patient.apps[app.appId];
    }
  }
  async getData(options = {}) {
    const context = await super.getData().object;
    const patient = context.patient;
    context.modifiers.activeEffect = patient.system.bonuses.traits.recovery;

    if (patient.system.sanctum.linked) {
      const lab = game.actors.get(patient.system.sanctum.actorId);
      if (lab) {
        context.modifiers.labHealth = lab.system.health.total;
      }
    }
    context.wounds = {};
    for (let [type, attr] of Object.entries(patient.system.wounds)) {
      if (attr.number.value > 0) {
        context.wounds[type] = [];
        for (let ii = 0; ii < attr.number.value; ii++) {
          context.wounds[type].push({ icon: CONFIG.ARM5E.recovery.wounds[type].icon });
        }
      }
    }
    log(false, `Sanatorium: ${JSON.stringify(context.wounds)}`);
    log(false, `Sanatorium: ${context.daysLeft}`);
    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find(".resource-focus").focus((ev) => {
      ev.preventDefault();
      ev.currentTarget.select();
    });

    html.find(".recovery-roll").click(this._recoveryRoll.bind(this));
  }

  async _recoveryRoll(event) {
    const patient = this.object.patient;

    for (let [type, attr] of Object.entries(patient.system.wounds)) {
      let dataset = {
        roll: "option",
        name: "",
        option1: aura,
        txtoption1: 0,
        physicalcondition: false
      };
      await stressDie(actor, dataset.roll, 0, setVisStudyResults);
    }
    log(false, data);
  }

  async _updateObject(event, formData) {
    for (let [key, value] of Object.entries(formData)) {
      log(false, `Updated ${key} : ${value}`);
      this.object[key] = value;
    }
    this.object = foundry.utils.expandObject(this.object);
    this.render();

    return;
  }
}
