import { ROLL_PROPERTIES } from "../helpers/rollWindow.js";
import { log, putInFoldableLinkWithAnimation } from "../tools.js";
import { basicIntegerField, boolOption } from "./commonSchemas.js";
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

  addListeners(html) {}

  getFlavor() {
    return `<h2 class="ars-chat-title chat-icon">${this.label}</h2>`;
  }
}

export class RollChatSchema extends BasicChatSchema {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      confidence: new fields.SchemaField({
        allowed: boolOption(true),
        score: basicIntegerField(),
        used: basicIntegerField()
      }),
      originalFlavor: new fields.StringField({
        required: false,
        blank: true,
        initial: ""
      }),
      roll: new fields.SchemaField({
        img: new fields.FilePathField({
          categories: ["IMAGE"],
          initial: null
        }),
        itemUuid: new fields.DocumentUUIDField(),
        type: new fields.StringField({
          required: false,
          blank: false,
          choices: Object.keys(ROLL_PROPERTIES),
          initial: "OPTION"
        }),
        // modifier: basicIntegerField(0, -999),
        details: new fields.StringField({
          required: false,
          blank: true,
          initial: ""
        }),
        botchCheck: boolOption(false),
        actorType: new fields.StringField({
          required: false,
          blank: false,
          initial: "npc"
        }),
        secondaryScore: basicIntegerField(0, -999),
        divider: basicIntegerField(1, 1),
        difficulty: basicIntegerField(1, 0)
      })
    };
  }

  static migrateData(data) {}

  static getDefault(itemData) {}

  static migrate(itemData) {
    const updateData = {};

    return updateData;
  }

  addListeners(html) {
    super.addListeners(html);

    if (this.parent.originatorOrGM) {
      const itemImg = html.find(".item-image");
      if (itemImg) {
        itemImg.click(async (ev) => {
          const img = $(ev.currentTarget.children[0]);
          const uuid = img.data("uuid");
          const item = await fromUuid(uuid);
          if (item) {
            item.sheet.render(true);
          }
        });
      }

      // TEMPORARY until chat rework
      html.find(".clickable").click((ev) => {
        $(ev.currentTarget).next().toggleClass("hide");
      });
      html.find(".clickable2").click((ev) => {
        $(ev.currentTarget).next().toggleClass("hide");
      });
    }
  }

  get formula() {
    const formula = this.parent.rolls[0].formula;
    if (this.confidence.used) {
      let toAppend = this.confidence.used * 3;
      const divider = this.roll?.divider ?? 1;
      if (divider > 1) {
        toAppend = `(${toAppend} / ${divider})`;
      }
      return formula + ` + ${toAppend}`;
    }
    return formula;
  }

  get botches() {
    return this.parent.rolls[0].botches;
  }

  getFlavor() {
    let img = this.roll?.img;

    let icon = "";
    if (img) {
      icon = `<div class="moreInfo item-image" >
        <img src="${img}" data-uuid="${this.roll.itemUuid}"width="30" height="30"></div>`;
    }
    return `<div class="flexrow">${icon}<h2 class="ars-chat-title chat-icon">${
      this.label
    }</h2></div>
    <div>${this.originalFlavor}</div>
    ${
      this.roll.details
        ? putInFoldableLinkWithAnimation("arm5e.sheet.details", this.roll.details)
        : ""
    }
    `;
  }

  showRollResults(actor, type) {
    let showRolls = game.settings.get("arm5e", "showRolls");
    return (
      game.users.get(game.userId).isGM ||
      actor?.isOwner ||
      (type === "player" && ["ALL", "PLAYERS"].includes(showRolls)) ||
      "ALL" == showRolls
    );
  }

  showRollFormulas(actor, type) {
    let showFormulas = game.settings.get("arm5e", "showRollFormulas");
    return (
      game.users.get(game.userId).isGM ||
      actor?.isOwner ||
      (type === "player" && ["ALL", "PLAYERS"].includes(showFormulas)) ||
      "ALL" == showFormulas
    );
  }

  cleanupFormula(input) {
    if (input.match(/(\d+)d10cf=10/g)) {
      return input.replace(/(\d+)d10cf=10/g, "$1 botch dice");
    } else if (input.match(/1di /g)) {
      return input.replace(/1di /g, "1d10 ");
    } else if (input.match(/1di10 /g)) {
      return input.replace(/1di10 /g, "1d10 ");
    } else if (input.match(/1di/g)) {
      return input.replace(/1di/g, "1d10");
    }
    return input;
  }

  // Hide parts of the message based on settings and permissions
  obfuscate(html, actor) {
    let rollFormula = html.find(".dice-formula");
    if (this.showRollFormulas(actor, this.roll.actorType ?? "npc")) {
      rollFormula.text(this.cleanupFormula(this.formula));
      const partf = html.find(".part-formula");
      partf.text(this.cleanupFormula(partf.text()));
    } else {
      rollFormula.remove();
      html.find(".dice-tooltip").remove();
    }

    let rollResult = html.find(".dice-total");
    if (this.showRollResults(actor, this.roll.actorType)) {
      let rollRes =
        (this.parent.rollTotal * this.roll.divider + (this.confidence.used ?? 0) * 3) /
        this.roll.divider;
      if (this.roll.secondaryScore) {
        let newValue = Math.round(this.roll.secondaryScore + rollRes);

        rollResult.text(Math.round(rollRes) + ` ( ${(newValue < 0 ? "" : "+") + newValue} ) `);
      } else {
        rollResult.text(Math.round(rollRes));
      }
    } else {
      rollResult.remove();
    }
  }

  addActionButtons(btnContainer, actor) {
    // confidence
    // confidence has been used already => no button
    if (
      this.confidence.allowed &&
      this.botches == 0 &&
      (this.confidence.used ?? 0) < this.confidence.score &&
      !actor._isGrog()
    ) {
      let title = game.i18n.localize("arm5e.messages.useConf");
      const useConfButton = $(
        `<button class="dice-confidence chat-button" data-msg-id="${this.parent._id}" data-actor-id="${actor.id}"><i class="fas fa-user-plus" title="${title}" ></i></button>`
      );
      // Handle button clicks
      useConfButton.on("click", async (ev) => {
        ev.stopPropagation();
        const actorId = ev.currentTarget.dataset.actorId;
        const message = game.messages.get(ev.currentTarget.dataset.msgId);
        await message.system.useConfidence(actorId);
      });
      btnContainer.append(useConfButton);
    }
  }
  async useConfidence(actorId) {
    const actor = game.actors.get(actorId);

    if (actor && (this.confidence.used ?? 0) < this.confidence.score) {
      if (await actor.useConfidencePoint()) {
        // add +3 * useConf to roll

        let usedConf = this.confidence.used + 1 || 1;
        let details = this.roll.details;
        // if (usedConf == 1) {
        // if (this.roll.botchCheck) {
        //   flavor += this.rolls[0].dice[0].results[0].result;
        // } else {
        //   flavor += 0;
        // }
        // }
        details += `<br/>+ ${game.i18n.localize("arm5e.sheet.confidence")} :  (3)`;

        let msgData = { system: { confidence: {}, roll: {} } };
        msgData.system.confidence.used = usedConf;
        msgData.system.roll.details = details;
        msgData.system.roll.formula += `+ ${this.formula}`;
        await this.parent.update(msgData);
      }
    }
  }
}

export class CombatChatSchema extends RollChatSchema {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      combat: new fields.SchemaField({
        attacker: new fields.DocumentUUIDField(),
        defenders: new fields.ArrayField(new fields.DocumentUUIDField())
      })
    };
  }

  static migrateData(data) {}

  static getDefault(itemData) {}

  static migrate(itemData) {
    const updateData = {};

    return updateData;
  }
  // getFlavor() {
  //   return super.getFlavor()
  // }
}
export class MagicChatSchema extends RollChatSchema {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      magic: new fields.SchemaField({
        caster: new fields.DocumentUUIDField(),
        targets: new fields.ArrayField(new fields.DocumentUUIDField())
      })
    };
  }

  getFailedMessage() {}

  static migrateData(data) {}

  static getDefault(itemData) {}

  static migrate(itemData) {
    const updateData = {};

    return updateData;
  }
}
