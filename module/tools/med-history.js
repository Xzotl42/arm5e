import { ArM5eActorSheet } from "../actor/actor-sheet.js";
import { getConfirmation } from "../constants/ui.js";
import { stressDie } from "../dice.js";
import { GroupSchedule } from "./group-schedule.js";
import { compareDates, nextDate } from "./time.js";

export class MedicalHistory extends FormApplication {
  constructor(data, options) {
    super(data, options);
    Hooks.on("closeApplication", (app, html) => this.onClose(app));
  }

  static async createDialog(actor) {
    const medHist = new MedicalHistory(
      { title: game.i18n.localize("arm5e.sanatorium.medicalHistory"), patient: actor },
      {}
    ); // data, options

    const res = await medHist.render(true);
    actor.apps[medHist.appId] = medHist;
  }
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["arm5e", "sheet", "sanatorium-sheet"],
      title: game.i18n.localize("arm5e.sanatorium.medicalHistory"),
      template: "systems/arm5e/templates/generic/medical-history.html",
      scrollY: [".years"],
      width: "400",
      height: "400",
      submitOnChange: true,
      closeOnSubmit: false
    });
  }

  onClose(app) {
    if (app.object.patient) {
      delete app.object.patient.apps[app.appId];
    }
  }
  async getData(options = {}) {
    const context = await super.getData().object;
    let scars = context.patient.system.wounds["healthy"] ?? [].sort(compareDates);
    context.scars = scars.map((e) => {
      return {
        id: e._id,
        name: e.name,
        img: CONFIG.ARM5E.recovery.wounds[e.system.originalGravity].icon,
        gravity: game.i18n.localize(CONFIG.ARM5E.recovery.wounds[e.system.originalGravity].label),
        inflicted: `${game.i18n.localize(
          CONFIG.ARM5E.seasons[e.system.inflictedDate.season].label
        )} ${e.system.inflictedDate.year}`,
        healed: e.system.healedDate
          ? `${game.i18n.localize(CONFIG.ARM5E.seasons[e.system.healedDate.season].label)} ${
              e.system.healedDate.year
            }`
          : "TO_DELETE",
        recoveryTime: e.system.recoveryTime
      };
    });

    context.config = CONFIG.ARM5E;
    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find(".resource-focus").focus((ev) => {
      ev.preventDefault();
      ev.currentTarget.select();
    });

    html.find(".clear-history").click(this._clearHistory.bind(this));
    html.find(".wound-edit").click(this._displayWound.bind(this));
  }

  async _clearHistory(event) {
    let confirmed = true;
    if (game.settings.get("arm5e", "confirmDelete")) {
      const question = game.i18n.localize("arm5e.dialog.sure");
      confirmed = await getConfirmation(
        game.i18n.localize("arm5e.sanatorium.msg.clearHistory"),
        question,
        ArM5eActorSheet.getFlavor(this.object.patient.type)
      );
    }
    if (confirmed) {
      const items = this.object.patient.items
        .filter((e) => e.type == "wound" && e.system.gravity == "healthy")
        .map((e) => e._id);
      const cnt = await this.object.patient.deleteEmbeddedDocuments("Item", items);
    }
  }

  _displayWound(event) {
    event.preventDefault();
    const target = $(event.currentTarget);
    const item = this.object.patient.getEmbeddedDocument("Item", target.data("itemId"));
    item.sheet.render(true, { focus: true });
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
