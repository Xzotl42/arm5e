import { log } from "../tools.js";
import { Astrolab } from "../tools/astrolab.js";
import { ArM5eActiveEffectConfig } from "../helpers/active-effect-config.sheet.js";
import { Scriptorium, ScriptoriumObject } from "../tools/scriptorium.js";
import { AuraConfig } from "./aura-config.js";
import { ArsApps } from "../tools/apps.js";

export class ArsLayer extends InteractionLayer {
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

    html.find(".resource-focus").focus((ev) => {
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
  static async openAstrolab() {
    const res = await ui.astrolab.render(true);
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
  if (CONFIG.ISV13) {
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
  } else {
    buttons.push({
      name: "ArsMagica",
      title: "ArsMagica",
      layer: "arsmagica",
      icon: "icon-Tool_Ars",
      onChange: (event, active) => {},
      visible: true,
      tools: [
        {
          name: "aura",
          title: game.i18n.localize("arm5e.canvas.buttons.setAura"),
          icon: "icon-Tool_Auras",
          visible: game.user.isGM,
          button: true,
          onClick: () => ArsApps.openAuraConfig()
        },
        {
          name: "clearAura",
          title: game.i18n.localize("arm5e.canvas.buttons.clearAura"),
          icon: "icon-Tool_Delete_Perdo2",
          visible: game.user.isGM,
          button: true,
          onClick: () => ArsApps.clearAura()
        },
        {
          name: "astrolab",
          title: "Astrolabium",
          icon: "icon-Tool_Astrolab",
          visible: game.user.isGM,
          button: true,
          onClick: () => ArsApps.openAstrolab()
        },
        {
          name: "scriptorium",
          title: "Scriptorium",
          icon: "icon-Tool_Scriptorium",
          visible: true,
          button: true,
          onClick: () => ArsApps.openScriptorium()
        },
        {
          name: "arcaneExperimentation",
          title: "arm5e.rolltables.experimentation.title",
          icon: "icon-Tool_Ars",
          visible: true,
          button: true,
          onClick: () => ArsApps.openLabExperimentation()
        }
      ],
      activeTool: "aura"
    });
  }
}
