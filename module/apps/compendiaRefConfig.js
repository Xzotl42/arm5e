import { log } from "../tools/tools.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class CompendiaRefConfig extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "compendia-ref-config",
    classes: ["arm5e", "arm5e-config"],
    tag: "form",
    form: {
      handler: CompendiaRefConfig.#onSubmitHandler,
      submitOnChange: false,
      closeOnSubmit: true
    },
    window: {
      title: "Compendia reference",
      resizable: false,
      contentClasses: ["standard-form", "arm5e-config"]
    },
    position: {
      width: 400,
      height: "auto"
    }
  };

  static PARTS = {
    form: {
      template: "systems/arm5e/templates/generic/compendia-ref-config.html"
    }
  };

  static async #onSubmitHandler(event, form, formData) {
    const data = foundry.utils.expandObject(formData.object);

    await game.settings.set(CONFIG.ARM5E.SYSTEM_ID, "compendiaRef", data.referenceModule);
    await game.settings.set(CONFIG.ARM5E.SYSTEM_ID, "notifyMissingRef", data.nofifyMissingRef);
    ui.notifications.info("Settings.updated", { localize: true });
  }

  async _prepareContext(options = {}) {
    const context = await super._prepareContext(options);
    context.referenceModule = game.settings.get(CONFIG.ARM5E.SYSTEM_ID, "compendiaRef");
    context.nofifyMissingRef = game.settings.get(CONFIG.ARM5E.SYSTEM_ID, "notifyMissingRef");
    context.arsModules = game.modules.contents
      .filter((e) => {
        return (
          e.active &&
          Array.from(e.relationships.systems).some((e) => e.id == CONFIG.ARM5E.SYSTEM_ID)
        );
      })
      .map((e) => {
        return { label: e.title, id: e.id };
      });
    // if the module was disabled, reset to arm5e-compendia
    if (context.arsModules.find((e) => e.id === context.referenceModule) == undefined) {
      await game.settings.set(CONFIG.ARM5E.SYSTEM_ID, "compendiaRef", "arm5e-compendia");
      context.referenceModule = "arm5e-compendia";
    }

    log(false, context);
    return context;
  }
}
