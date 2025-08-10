import { log } from "../tools.js";
import { Astrolab } from "../tools/astrolab.js";
import { ArM5eActiveEffectConfig } from "../helpers/active-effect-config-sheet.js";
import { Scriptorium, ScriptoriumObject } from "../tools/scriptorium.js";
import { AuraConfig } from "./aura-config.js";

export class ArsLayer extends InteractionLayer {
  async draw() {
    await super.draw();
    return this;
  }

  async _draw() {}

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
    let formData = {
      seasons: CONFIG.ARM5E.seasons,
      ...game.settings.get("arm5e", "currentDate")
    };
    // const html = await renderTemplate("systems/arm5e/templates/generic/astrolab.html", dialogData);

    const astrolab = new Astrolab(formData, {}); // data, options
    const res = await astrolab.render(true);
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
            if (active) ArsLayer.openAuraConfig();
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
            if (active) ArsLayer.clearAura();
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
            if (active) ArsLayer.openAstrolab();
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
            if (active) ArsLayer.openScriptorium();
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
          onClick: () => ArsLayer.openAuraConfig()
        },
        {
          name: "clearAura",
          title: game.i18n.localize("arm5e.canvas.buttons.clearAura"),
          icon: "icon-Tool_Delete_Perdo2",
          visible: game.user.isGM,
          button: true,
          onClick: () => ArsLayer.clearAura()
        },
        {
          name: "astrolab",
          title: "Astrolabium",
          icon: "icon-Tool_Astrolab",
          visible: game.user.isGM,
          button: true,
          onClick: () => ArsLayer.openAstrolab()
        },
        {
          name: "scriptorium",
          title: "Scriptorium",
          icon: "icon-Tool_Scriptorium",
          visible: true,
          button: true,
          onClick: () => ArsLayer.openScriptorium()
        }
      ],
      activeTool: "aura"
    });
  }
}
