import { getWoundStr } from "../config.js";
import { createRoll } from "../dice.js";
import { fatigueCost } from "../helpers/magic.js";
import { ROLL_PROPERTIES } from "../helpers/rollWindow.js";
import { SMSG_FIELDS, SMSG_TYPES } from "../helpers/socket-messages.js";
import { ArsRoll } from "../helpers/stressdie.js";
import {
  getDataset,
  getLastCombatMessageOfType,
  log,
  putInFoldableLinkWithAnimation
} from "../tools.js";
import { basicIntegerField, boolOption, hermeticForm } from "./commonSchemas.js";
const fields = foundry.data.fields;
export class BasicChatSchema extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      img: new fields.FilePathField({
        categories: ["IMAGE"],
        initial: null
      }),
      label: new fields.StringField({
        required: false,
        blank: true,
        initial: ""
      }),
      originalFlavor: new fields.StringField({
        required: false,
        blank: true,
        initial: ""
      })

      // style/mode : for announcement, OOC, NPC speech.
    };
  }

  static migrateData(data) {}

  static getDefault(itemData) {}

  static migrate(itemData) {
    const updateData = {};

    return updateData;
  }

  addListeners(html) {
    html.find(".clickable").click((ev) => {
      $(ev.currentTarget).next().toggleClass("hide");
    });
  }

  getFlavor() {
    return `<h2 class="ars-chat-title chat-icon">${this.label}</h2><div>${this.body}</div>`;
  }

  get body() {
    return this.originalFlavor;
  }

  // standard chat message doesn't have targets;
  formatTargets(html) {
    return "";
  }

  failedRoll() {
    return false;
  }
}
