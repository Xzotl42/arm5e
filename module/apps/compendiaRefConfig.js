import { log } from "../tools/tools.js";

export class CompendiaRefConfig extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "sourcebooks-filters-config",
      template: "systems/arm5e/templates/generic/compendia-ref-config.html",
      classes: ["arm5e-config"],
      closeOnSubmit: true,
      height: "auto",
      submitOnChange: false,
      submitOnClose: false,
      title: game.i18n.localize(`Compendia reference`),
      width: 400,
      resizable: true
    });
  }

  async getData() {
    const context = super.getData();
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

  async _updateObject(ev, formData) {
    const data = foundry.utils.expandObject(formData);

    await game.settings.set(CONFIG.ARM5E.SYSTEM_ID, "compendiaRef", data.referenceModule);
    await game.settings.set(CONFIG.ARM5E.SYSTEM_ID, "notifyMissingRef", data.nofifyMissingRef);
    ui.notifications.info("Settings.updated", { localize: true });
  }
}
