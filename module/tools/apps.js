import { AuraConfig } from "../ui/aura-config.js";
import { LabExperimentation } from "./labExperimentation.js";
import { Scriptorium, ScriptoriumObject } from "./scriptorium.js";

export class ArsApps {
  static async openAstrolab() {
    // const html = await renderTemplate("systems/arm5e/templates/generic/astrolab.html", dialogData);

    // const astrolab = new Astrolab(formData, {}); // data, options
    const res = await ui.astrolab.render(true);
  }
  static async openScriptorium() {
    let formData = new ScriptoriumObject();
    // // const html = await renderTemplate("systems/arm5e/templates/generic/astrolab.html", dialogData);
    const scriptorium = new Scriptorium(formData, {}); // data, options
    const res = await scriptorium.render(true);
  }

  static async openAuraConfig() {
    new AuraConfig(canvas.scene).render(true);
  }

  static async openLabExperimentation() {
    let exp = new LabExperimentation();
    const res = await exp.render(true);
  }

  static async openAuraConfig() {
    new AuraConfig(canvas.scene).render(true);
  }

  static async clearAura(bypassDialog = false) {
    if (bypassDialog) {
      canvas.scene.setFlag("arm5e", "aura", null);
    } else {
      Dialog.confirm({
        title: game.i18n.localize("arm5e.canvas.buttons.clearAura"),
        content: game.i18n.localize("arm5e.dialog.confirmClearAura"),
        yes: () => {
          canvas.scene.setFlag("arm5e", "aura", null);
        },
        no: () => {}
      });
    }
  }
}
