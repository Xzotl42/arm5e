import { log } from "../tools/tools.js";

import { Scriptorium, ScriptoriumObject } from "../apps/scriptorium.js";
import { AuraConfig } from "../apps/aura-config.js";
import { ArsApps } from "./apps.js";
import { getConfirmation } from "./dialogs.js";

export class ArsLayer extends foundry.canvas.layers.InteractionLayer {
  async draw() {
    await super.draw();
    return this;
  }

  addListenersDialog(html) {
    html.find('input[name="inputField"]').change((ev) => {
      let v = parseInt(ev.currentTarget.value);
      if (v < 1) ev.currentTarget.value = 1;
      if (v > 20) ev.currentTarget.value = 20;
    });

    html.find(".select-on-focus").focus((ev) => {
      ev.preventDefault();
      ev.currentTarget.select();
    });
  }
  ///////////////
  // for backward compatibility, use ArsApps instead
  ///////////////

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
  static async openAstrolab() {
    const res = await ui.astrolabium.render(true);
  }
  static async openScriptorium() {
    let formData = new ScriptoriumObject();
    const scriptorium = new Scriptorium(formData, {}); // data, options
    const res = await scriptorium.render(true);
  }

  static async openAuraConfig() {
    new AuraConfig(canvas.scene).render(true);
  }
  ///////////////
  // for backward compatibility: end
  ///////////////
}

export function addArsButtons(buttons) {
  buttons["ArsMagica"] = {
    name: "ArsMagica",
    title: "ArsMagica",
    layer: "arsmagica",
    icon: "icon-Tool_Ars",
    visible: true,
    tools: {
      aura: {
        name: "aura",
        order: 1,
        title: game.i18n.localize("arm5e.canvas.buttons.setAura"),
        icon: "icon-Tool_Auras",
        visible: game.user.isGM,
        button: true,
        onChange: (event, active) => {
          if (active) ArsApps.openAuraConfig();
        }
      },
      clearAura: {
        name: "clearAura",
        order: 2,
        title: game.i18n.localize("arm5e.canvas.buttons.clearAura"),
        icon: "icon-Tool_Delete_Perdo2",
        visible: game.user.isGM,
        button: true,
        onChange: (event, active) => {
          if (active) ArsApps.clearAura();
        }
      },
      astrolab: {
        name: "astrolab",
        order: 3,
        title: "Astrolabium",
        icon: "icon-Tool_Astrolab",
        visible: game.user.isGM,
        button: true,
        onChange: (event, active) => {
          if (active) ArsApps.openAstrolab();
        }
      },
      scriptorium: {
        name: "scriptorium",
        order: 4,
        title: "Scriptorium",
        icon: "icon-Tool_Scriptorium",
        visible: true,
        button: true,
        onChange: (event, active) => {
          if (active) ArsApps.openScriptorium();
        }
      },
      arcaneExperimentation: {
        name: "arcaneExperimentation",
        order: 5,
        title: "arm5e.rolltables.experimentation.title",
        icon: "icon-Tool_Ars",
        visible: true,
        button: true,
        onChange: (event, active) => {
          if (active) ArsApps.openLabExperimentation();
        }
      }
    }
  };
}
