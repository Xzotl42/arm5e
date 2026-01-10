import { Arm5eChatMessage } from "../helpers/chat-message.js";
import { ROLL_MODES, ROLL_PROPERTIES } from "../helpers/rollWindow.js";
import { AuraConfig } from "../apps/aura-config.js";
import { getConfirmation } from "./dialogs.js";
import { LabExperimentation } from "../apps/labExperimentation.js";
import { Scriptorium, ScriptoriumObject } from "../apps/scriptorium.js";

export class ArsApps {
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

  static async rollForDamage(tokens) {
    const actors = tokens
      .map((e) => {
        return e.actor;
      })
      .filter((e) => {
        return e.isCharacter();
      });
    if (actors.length === 0) {
      console.error("No character token selected to roll damage");
    }

    // roll using the first actor, then duplicate

    const message = await actors[0].sheet.roll({
      roll: "damage",
      mode: ROLL_PROPERTIES.DAMAGE.MODE + ROLL_MODES.NO_CHAT
    });
    const promises = [];
    for (let a of actors) {
      const messageData = message.toObject();
      messageData.system.img = a.img;
      messageData.system.roll.actorType = a.type;
      messageData.speaker = Arm5eChatMessage.getSpeaker({ actor: a });
      promises.push(Arm5eChatMessage.create(messageData));
    }

    await Promise.all(promises);
  }
}
