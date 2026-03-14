import { ArM5eActorSheet } from "../actor/actor-sheet.js";
import { getConfirmation } from "../ui/dialogs.js";
import { compareDates, nextDate } from "../tools/time.js";

export class MedicalHistory extends foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.api.ApplicationV2
) {
  constructor(data, options = {}) {
    super(options);
    this.object = data;
    this.object.patient.apps[this.options.uniqueId] = this;
  }

  static async createDialog(actor) {
    const medHist = new MedicalHistory({
      title: game.i18n.localize("arm5e.sanatorium.medicalHistory"),
      patient: actor
    });
    const res = await medHist.render(true);
  }

  async close(options = {}) {
    if (this.object?.patient?.apps?.[this.options.uniqueId] != undefined) {
      delete this.object.patient.apps[this.options.uniqueId];
    }
    return super.close(options);
  }

  static DEFAULT_OPTIONS = {
    id: "medical-history",
    classes: ["arm5e", "sheet", "med-history"],
    window: {
      title: "arm5e.sanatorium.medicalHistory",
      icon: "fas fa-notes-medical",
      resizable: true
    },
    position: {
      width: 400,
      height: "auto"
    },
    form: {
      handler: MedicalHistory.#onSubmitHandler,
      submitOnChange: true,
      closeOnSubmit: false
    },
    tag: "form",
    actions: {
      clearHistory: MedicalHistory.clearHistory,
      displayWound: MedicalHistory.displayWound
    }
  };

  static PARTS = {
    header: {
      template: "systems/arm5e/templates/generic/parts/medical-history-header.hbs"
    },
    form: {
      template: "systems/arm5e/templates/generic/medical-history.html",
      scrollable: [".years"]
    },
    footer: {
      template: "systems/arm5e/templates/generic/parts/medical-history-footer.hbs"
    }
  };

  static async #onSubmitHandler(event, form, formData) {
    for (let [key, value] of Object.entries(formData.object)) {
      this.object[key] = value;
    }
    this.object = foundry.utils.expandObject(this.object);
    this.render();
  }

  async _prepareContext() {
    const context = foundry.utils.deepClone(this.object);
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

  _onRender(context, options) {
    // Handle select on focus
    const selectElements = this.element.querySelectorAll(".select-on-focus");
    selectElements.forEach((el) => {
      el.addEventListener("focus", (ev) => {
        ev.preventDefault();
        ev.currentTarget.select();
      });
    });
  }

  static async clearHistory(event, target) {
    await this._clearHistory();
  }

  static async displayWound(event, target) {
    const itemId = target.dataset.itemId;
    const item = this.object.patient.getEmbeddedDocument("Item", itemId);
    item.sheet.render(true, { focus: true });
  }

  async _clearHistory(event) {
    let confirmed = false;
    if (event.shiftKey) {
      confirmed = true;
    } else if (game.settings.get("arm5e", "confirmDelete")) {
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
    const itemId = event.currentTarget.dataset.itemId;
    const item = this.object.patient.getEmbeddedDocument("Item", itemId);
    item.sheet.render(true, { focus: true });
  }
}
