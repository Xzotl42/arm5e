import { AuraConfig } from "../ui/aura-config.js";
import { getConfirmation } from "../ui/dialogs.js";
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
      const confirmed = await getConfirmation(
        game.i18n.localize("arm5e.canvas.buttons.clearAura"),
        game.i18n.localize("arm5e.dialog.confirmClearAura")
      );

      if (confirmed) {
        canvas.scene.setFlag("arm5e", "aura", null);
      }
    }
  }
}
