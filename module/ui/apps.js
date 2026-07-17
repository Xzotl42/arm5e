import { ARM5E } from "../config.js";

import { Arm5eChatMessage } from "../helpers/chat-message.js";
import { ROLL_MODES, ROLL_PROPERTIES } from "./roll-window.js";
import { AuraConfig } from "../apps/aura-config.js";
import { getConfirmation } from "./dialogs.js";
import { LabExperimentation } from "../apps/labExperimentation.js";
import { Scriptorium, ScriptoriumObject } from "../apps/scriptorium.js";
import { DocumentPicker } from "../apps/document-picker.js";
import { QuickCombat, QuickVitals } from "../helpers/combat.js";
import { QuickMagic } from "../helpers/magic.js";

export class ArsApps {
  static async openAstrolab() {
    const res = await ui.astrolabium.render(true);
  }

  static async openScriptorium() {
    let formData = new ScriptoriumObject();
    const scriptorium = new Scriptorium(formData, {}); // data, options
    const res = await scriptorium.render(true);
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
      canvas.scene.setFlag(ARM5E.SYSTEM_ID, "aura", null);
    } else {
      const confirmed = await getConfirmation(
        game.i18n.localize("arm5e.canvas.buttons.clearAura"),
        game.i18n.localize("arm5e.dialog.confirmClearAura")
      );

      if (confirmed) {
        canvas.scene.setFlag(ARM5E.SYSTEM_ID, "aura", null);
      }
    }
  }

  static async quickCombat(tokenName, actor) {
    if (!actor.isCharacter()) return;

    const combat = new QuickCombat(
      {
        name: tokenName,
        actor: actor
      },
      {}
    );
    const res = await combat.render(true);
  }

  /**
   *
   * @param tokenName
   * @param actor
   */
  static async quickVitals(tokenName, actor) {
    if (!actor.isCharacter()) return;

    const vitals = new QuickVitals(
      {
        name: tokenName,
        actor: actor
      },
      {}
    ); // data, options
    const res = await vitals.render(true);
  }

  /**
   *
   * @param tokenName
   * @param actor
   */
  static async quickMagic(tokenName, actor) {
    if (!actor.isMagus()) return;

    const magic = new QuickMagic(
      {
        name: tokenName,
        actor: actor
      },
      {}
    );
    const res = await magic.render(true);
  }

  /* -------------------------------------------- */
  /*  Document Picker helpers                     */
  /* -------------------------------------------- */

  /**
   * Open a picker over any WorldCollection or Map.
   * Thin wrapper around {@link DocumentPicker.pick}.
   * @param {WorldCollection|Map<string,Document>} source
   * @param {object} [options]  Forwarded to DocumentPicker.pick
   * @returns {Promise<Document[]>}
   */
  static async pickDocuments(source, options = {}) {
    return DocumentPicker.pick(source, options);
  }

  /**
   * Pick one or more actors from `game.actors`.
   * @param {object} [options]
   * @param {Array<{label:string, fn:Function}>} [options.filters]
   *   Pre-built filter list. If omitted a set of common actor-type filters is generated
   *   from the types actually present in the world.
   * @param {string}  [options.title]         Dialog title
   * @param {boolean} [options.singleSelect=false]
   * @param {"Neutral"|"PC"|"NPC"|"Lab"|"covenant"|"codex"} [options.flavor="PC"]
   * @returns {Promise<Actor[]>}
   */
  static async pickActors({ filters, title, singleSelect = false, flavor = "PC", ...rest } = {}) {
    if (!filters) {
      const types = [...new Set(game.actors.map((a) => a.type))];
      filters = [
        { label: game.i18n.localize("arm5e.generic.all"), fn: () => true },
        ...types.map((t) => ({
          label: game.i18n.localize(`arm5e.sheet.${t}`),
          fn: (a) => a.type === t
        }))
      ];
    }
    return DocumentPicker.pick(game.actors, {
      title: title ?? game.i18n.localize("arm5e.dialog.pickActors"),
      filters,
      singleSelect,
      flavor,
      ...rest
    });
  }

  /**
   * Pick one or more items from `game.items`.
   * @param {object} [options]
   * @param {Array<{label:string, fn:Function}>} [options.filters]
   *   Pre-built filter list. If omitted a set of common item-type filters is generated
   *   from the types actually present in the world.
   * @param {string}  [options.title]         Dialog title
   * @param {boolean} [options.singleSelect=false]
   * @param {"Neutral"|"PC"|"NPC"|"Lab"|"covenant"|"codex"} [options.flavor="Neutral"]
   * @returns {Promise<Item[]>}
   */
  static async pickItems({
    filters,
    title,
    singleSelect = false,
    flavor = "Neutral",
    ...rest
  } = {}) {
    if (!filters) {
      const types = [...new Set(game.items.map((i) => i.type))];
      filters = [
        { label: game.i18n.localize("arm5e.generic.all"), fn: () => true },
        ...types.map((t) => ({
          label: game.i18n.localize(`arm5e.sheet.${t}`),
          fn: (i) => i.type === t
        }))
      ];
    }
    return DocumentPicker.pick(game.items, {
      title: title ?? game.i18n.localize("arm5e.dialog.pickItems"),
      filters,
      singleSelect,
      flavor,
      ...rest
    });
  }

  /* -------------------------------------------- */

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
