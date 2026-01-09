import { getWoundStr } from "../config.js";
import { ROLL_PROPERTIES } from "../helpers/rollWindow.js";
import { SMSG_FIELDS, SMSG_TYPES } from "../helpers/socket-messages.js";
import { log, putInFoldableLinkWithAnimation } from "../tools.js";
import { BasicChatSchema } from "./basicChatSchema.js";
import { basicIntegerField, boolOption } from "./commonSchemas.js";
const fields = foundry.data.fields;

export class RollChatSchema extends BasicChatSchema {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      targets: new fields.ArrayField(new fields.DocumentUUIDField()),
      confidence: new fields.SchemaField({
        allowed: boolOption(true),
        score: basicIntegerField(0, 0),
        used: basicIntegerField(0, 0)
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
          choices: Object.values(ROLL_PROPERTIES).map((e) => e.VAL),
          initial: "option"
        }),
        // modifier: basicIntegerField(0, -999),
        details: new fields.StringField({
          required: false,
          blank: true,
          initial: ""
        }),
        botchCheck: boolOption(false),
        botches: basicIntegerField(0, 0),
        actorType: new fields.StringField({
          required: false,
          blank: false,
          initial: "npc"
        }),
        secondaryScore: basicIntegerField(0),
        divider: basicIntegerField(1, 1),
        difficulty: basicIntegerField(0, 0)
      }),
      rootMessage: new fields.DocumentUUIDField(),
      impact: new fields.SchemaField(
        {
          applied: boolOption(false),
          fatigueLevelsLost: basicIntegerField(0, 0),
          fatigueLevelsPending: basicIntegerField(0, 0),
          fatigueLevelsFail: basicIntegerField(0, 0),
          woundGravity: new fields.NumberField({
            required: false,
            nullable: false,
            integer: true,
            initial: 0,
            step: 1,
            min: 0,
            max: 5
          })
        },
        {
          initial: {
            fatigueLevelsLost: 0,
            fatigueLevelsPending: 0,
            fatigueLevelsFail: 0,
            woundGravity: 0
          }
        }
      )
    };
  }

  static migrateData(data) {}

  static getDefault(itemData) {}

  static migrate(itemData) {
    const updateData = {};

    return updateData;
  }

  // update the schema with missing data specific to the roll before the message creation.
  // finish with an updateSource
  enrichMessageData(actor) {}

  // standard roll chat message doesn't have targets;
  formatTargets(html) {
    return "";
  }

  addListeners(html) {
    super.addListeners(html);
    if (this.parent.actor && this.parent.originatorOrGM) {
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
    }
  }

  formula(idx = 0) {
    let formula = this.parent.rolls[idx].formula;
    if (this.confidence.used) {
      let toAppend = this.confidence.used * 3;
      const divider = this.roll?.divider ?? 1;
      if (divider > 1) {
        toAppend = `(${toAppend} / ${divider})`;
      }
      formula += ` + ${toAppend}`;
    }

    if (this.roll.difficulty && this.roll.botches === 0) {
      formula += ` versus ${this.roll.difficulty}`;
    }
    return formula;
  }

  get confidenceModifier() {
    return (this.confidence.used * 3) / this.roll?.divider ?? 1;
  }

  getFlavor() {
    let img = this.roll?.img;
    let showItem = this.showRollResults(this.parent.actor, this.roll.actorType);
    let label = this.label;
    let icon = "";
    if (img) {
      // TODO find cleaner way
      if (!showItem && !this.parent.type.startsWith("combat")) {
        label = game.i18n.localize("arm5e.generic.unknown");
        img = "systems/arm5e/assets/icons/QuestionMark.webp";
      }
      icon = `<div class="moreInfo item-image" >
          <img src="${img}" data-uuid="${this.roll.itemUuid}"width="30" height="30"></div>`;
    }
    let res = `<div class="flexrow">${icon}<h2 class="ars-chat-title chat-icon">${label}</h2></div>`;

    res += `<div>${this.body}</div>`;
    if (showItem) {
      res += this.getImpactMessage();
    }
    res += `${
      this.roll.details
        ? putInFoldableLinkWithAnimation(
            "arm5e.sheet.details",
            this.roll.details +
              (this.confidenceModifier
                ? `<br/>+ ${game.i18n.localize("arm5e.sheet.confidence")} :  (${
                    this.confidenceModifier
                  })`
                : "")
          )
        : ""
    }
    `;

    if (showItem) {
      if (this.getFailedMessage && this.failedRoll()) {
        res += this.getFailedMessage();
      }
    }

    return res;
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

  // get needPrompt() {
  //   return this.impact.fatigueLevels || this.impact.woundGravity;
  // }

  cleanupFormula(input) {
    if (input.match(/(\d+)d10cf=10/g)) {
      return input.replace(/(\d+)d10cf=10/g, "$1 botch dice");
    } else if (input.match(/(\d+)dscf=10/g)) {
      return input.replace(/(\d+)dscf=10/g, "$1 botch dice");
    } else if (input.match(/1di /g)) {
      return input.replace(/1di /g, "1d10 ");
    } else if (input.match(/1di10 /g)) {
      return input.replace(/1di10 /g, "1d10 ");
    } else if (input.match(/1dsx=1 /g)) {
      return input.replace(/1dsx=1 /g, "1d10 ");
    } else if (input.match(/1di/g)) {
      return input.replace(/1di/g, "1d10");
    }
    return input;
  }

  // Hide parts of the message based on settings and permissions
  obfuscate(roll, actor, idx = 0) {
    let rollFormula = roll.querySelector(".dice-formula");
    if (rollFormula) {
      if (this.showRollFormulas(actor, this.roll.actorType ?? "npc")) {
        rollFormula.innerText = this.cleanupFormula(this.formula(idx));
        const partf = roll.querySelector(".part-formula");
        if (partf) {
          partf.innerText = this.cleanupFormula(partf.innerText);
        }
      } else {
        rollFormula.remove();
        roll.querySelector(".dice-tooltip").remove();
      }
    }
    const item = roll.querySelector(".dice-total");
    if (item) {
      if (this.showRollResults(actor, this.roll.actorType)) {
        const original = parseInt(item.innerText);
        if (!isNaN(original)) {
          let rollRes = this.parent.rollTotal(idx) + this.confidenceModifier;
          if (this.roll.secondaryScore) {
            let newValue = Math.round(this.roll.secondaryScore + rollRes - this.roll.difficulty);

            item.innerText = Math.round(rollRes) + ` ( ${(newValue < 0 ? "" : "+") + newValue} ) `;
          } else {
            item.innerText = Math.round(rollRes);
          }
        }
      } else {
        item.remove();
      }
    }
  }

  get confPrompt() {
    return (
      !this.impact.applied &&
      this.confidence.allowed &&
      this.roll.botches == 0 &&
      (this.confidence.used ?? 0) < this.confidence.score
    );
  }

  addActionButtons(btnContainer) {
    // confidence
    // confidence has been used already => no button
    if (
      this.parent.actor?.isOwner &&
      this.confPrompt &&
      this.parent.actor.canUseConfidencePoint()
    ) {
      const useConfButton = createChatButton(
        this.parent,
        this.parent.actor,
        "fas fa-user-plus",
        "",
        "arm5e.messages.useConf",
        "dice-confidence",
        async (ev) => {
          ev.stopPropagation();
          // const message = fromUuidSync(ev.dataset.msgUuid);
          // await message.system.useConfidence();
          await this.useConfidence();
        }
      );
      // Handle button clicks

      btnContainer.append(useConfButton);
      if (
        this.impact.fatigueLevelsPending ||
        this.impact.woundGravity ||
        ((this.confidence.used ?? 0) < this.confidence.score &&
          this.parent.actor.canUseConfidencePoint())
      ) {
        const noConfButton = createChatButton(
          this.parent,
          this.parent.actor,
          "fa-solid fa-xmark",
          "",
          "arm5e.messages.noConf",
          "dice-no-confidence",
          async (ev) => {
            ev.stopPropagation();
            // const message = fromUuidSync(ev.dataset.msgUuid);
            // await message.system.skipConfidenceUse();
            this.skipConfidenceUse();
          }
        );
        btnContainer.append(noConfButton);
      }
    }

    return btnContainer.children.length;
  }

  fatigueCost(actor) {
    // return { use: 0, partial: 0, fail: 0 };
    const res = {
      use: this.impact.fatigueLevelsLost || 0,
      partial: this.impact.fatigueLevelsPending || 0,
      fail: this.impact.fatigueLevelsFail || 0
    };
    log(false, "fatigueCost", res);
    return res;
  }
  async skipConfidenceUse() {
    if (this.parent.actor) {
      const res = this._skipConfidenceUse();
      if (res) {
        const updateData = foundry.utils.expandObject(res);
        if (this.parent.isAuthor || game.user.isGM) {
          await Promise.all(this._applyChatMessageUpdate(updateData));
        } else if (this.parent.actor.isOwner) {
          // Not the author, but owner of the actor rolling
          game.arm5e.socketHandler.emitAwaited(SMSG_TYPES.CHAT, "skipConfidence", {
            [SMSG_FIELDS.CHAT_MSG_ID]: this.parent._id,
            [SMSG_FIELDS.SENDER]: game.user._id,
            [SMSG_FIELDS.CHAT_MSG_DB_UPDATE]: updateData
          });
        } else {
          ui.notifications.info(game.i18n.localize("arm5e.chat.notifications.notInitiator"), {
            permanent: true
          });
        }
      }
    } else {
      log(false, "skipConfidenceUse: actor not found");
    }
  }

  _applySkipConfidenceUse(data) {
    const promises = [];
    promises.push(this.parent.actor.update(data.actorUpdate ?? {}));
    promises.push(this.parent.update(data.msgUpdate ?? {}));
    promises.push(
      this.parent.actor.changeWound(
        1,
        // CONFIG.ARM5E.recovery.rankMapping[this.impact.woundGravity],
        CONFIG.ARM5E.recovery.rankMapping[data.msgUpdate["system.impact.woundGravity"]],
        game.i18n.localize("arm5e.sheet.fatigue.overflow")
      )
    );
    return promises;
  }

  _skipConfidenceUse() {
    const dbUpdate = {};

    const messageData = { "system.impact.applied": true };
    const updateData = { "system.states.confidencePrompt": false };
    let res = null;
    if (this.failedRoll()) {
      const totalFatigueLost = this.impact.fatigueLevelsPending + this.impact.fatigueLevelsFail;
      res = this.parent.actor._changeFatigueLevel(updateData, totalFatigueLost, false);

      messageData["system.impact.fatigueLevelsLost"] =
        this.impact.fatigueLevelsLost + totalFatigueLost;
    } else {
      res = this.parent.actor._changeFatigueLevel(
        updateData,
        this.impact.fatigueLevelsPending,
        false
      );
      messageData["system.impact.fatigueLevelsLost"] =
        this.impact.fatigueLevelsLost + res.fatigueLevels;
    }
    messageData["system.impact.woundGravity"] = res.woundGravity;
    messageData["system.confidence.allowed"] = false; // no more confidence allowed
    messageData["system.impact.fatigueLevelsPending"] = 0;
    messageData["system.impact.fatigueLevelsFail"] = 0;
    dbUpdate.actorUpdate = updateData;
    dbUpdate.msgUpdate = messageData;
    return dbUpdate;
  }

  async useConfidence() {
    if (this.parent.actor) {
      const res = this._useConfidence();
      if (res) {
        const updateData = foundry.utils.expandObject(res);
        if (this.parent.isAuthor || game.user.isGM) {
          await Promise.all(this._applyChatMessageUpdate(updateData));
        } else if (this.parent.actor.isOwner) {
          // Not the author, but owner of the actor rolling
          game.arm5e.socketHandler.emitAwaited(SMSG_TYPES.CHAT, "useConfidence", {
            [SMSG_FIELDS.CHAT_MSG_ID]: this.parent._id,
            [SMSG_FIELDS.SENDER]: game.user._id,
            [SMSG_FIELDS.CHAT_MSG_DB_UPDATE]: updateData
          });
        } else {
          ui.notifications.info(game.i18n.localize("arm5e.chat.notifications.notInitiator"), {
            permanent: true
          });
        }
        // refresh subsequent messages
        const index = game.messages.contents.findIndex((e) => e._id === this.parent._id);
        for (let i = index + 1; i < game.messages.contents.length; i++) {
          ui.chat.updateMessage(game.messages.contents[i]);
        }
      }
    } else {
      log(false, "skipConfidenceUse: actor not found");
    }
  }

  _applyChatMessageUpdate(data) {
    log(false, "applying chat message update", data);
    const promises = [];
    promises.push(this.parent.actor.update(data.actorUpdate ?? {}));
    promises.push(this.parent.update(data.msgUpdate ?? {}));
    const gravity = data.msgUpdate.system?.impact?.woundGravity ?? 0;
    promises.push(
      this.parent.actor.changeWound(
        1,
        CONFIG.ARM5E.recovery.rankMapping[gravity],
        game.i18n.localize("arm5e.sheet.fatigue.overflow")
      )
    );
    return promises;
  }

  _useConfidence() {
    const dbUpdate = {};
    if ((this.confidence.used ?? 0) < this.confidence.score) {
      let usedConf = this.confidence.used + 1 || 1;
      let msgData = { system: { confidence: {}, roll: {} } };

      msgData.system.confidence.used = usedConf;
      this.confidence.used = usedConf;
      msgData.system.roll.formula = `${this.formula}`;

      let impact = this.fatigueCost(this.parent.actor);

      // Lost fatigue levels + wound if overflow
      const updateData = {};

      this.parent.actor._useConfidencePoint(updateData);
      let res = null;
      // actor used its last confidence point or reached its maximum amount to spend.
      if (
        usedConf == this.parent.actor.system.con.score ||
        this.parent.actor.system.con.points == 1
      ) {
        let fatigueToApply = 0;
        if (this.failedRoll()) {
          fatigueToApply = impact.partial + impact.fail;
        } else {
          fatigueToApply = impact.partial;
        }
        res = this.parent.actor._changeFatigueLevel(updateData, fatigueToApply, false);
        // await actor.changeWound(
        //   1,
        //   CONFIG.ARM5E.recovery.rankMapping[res.woundGravity],
        //   game.i18n.localize("arm5e.sheet.fatigue.overflow")
        // );
        msgData["system.impact.woundGravity"] = res.woundGravity;
        msgData["system.impact.applied"] = true;

        msgData["system.impact.fatigueLevelsLost"] =
          this.impact.fatigueLevelsLost + res.fatigueLevels;
        msgData["system.impact.fatigueLevelsPending"] = 0;
        msgData["system.impact.fatigueLevelsFail"] = 0;
        msgData["system.confidence.allowed"] = false; // no more confidence allowed
        updateData["system.states.confidencePrompt"] = false;
      } else {
        const tmp = {}; // no update of actor needed, just recompute impact
        let res = null;
        if (this.failedRoll()) {
          res = this.parent.actor._changeFatigueLevel(tmp, impact.fail + impact.partial);
          if (res.woundGravity) {
            // wound overflow smaller than fail
            if (res.woundGravity <= impact.fail) {
              msgData["system.impact.fatigueLevelsFail"] = impact.fail - res.woundGravity;
            } else {
              msgData["system.impact.fatigueLevelsFail"] = 0;
              const overflow = res.woundGravity - impact.fail;
              if (overflow <= impact.partial) {
                msgData["system.impact.fatigueLevelsPending"] = impact.partial - overflow;
              } else {
                msgData["system.impact.fatigueLevelsPending"] = 0;
              }
            }
          } else {
            msgData["system.impact.fatigueLevelsFail"] = impact.fail;
            msgData["system.impact.fatigueLevelsPending"] = impact.partial;
          }
        } else {
          res = this.parent.actor._changeFatigueLevel(tmp, impact.partial);
          msgData["system.impact.fatigueLevelsFail"] = 0;
          msgData["system.impact.fatigueLevelsPending"] = res.fatigueLevels;
        }

        msgData["system.impact.applied"] = false;
        msgData["system.impact.woundGravity"] = res.woundGravity;
      }
      dbUpdate.actorUpdate = updateData;
      dbUpdate.msgUpdate = msgData;
      return dbUpdate;
    }
    return null;
  }

  failedRoll() {
    return (
      this.roll.botches > 0 ||
      this.parent.rollTotal(0) + this.confidenceModifier - this.roll.difficulty < 0
    );
  }
  getFailedMessage() {
    const showDataOfNPC = game.settings.get("arm5e", "showNPCMagicDetails") === "SHOW_ALL";
    let messageFlavor = "";

    if (showDataOfNPC || this.parent.originatorOrGM) {
      const title =
        '<h2 class="ars-chat-title">' + game.i18n.localize("arm5e.sheet.rollFailed") + "</h2>";

      let flavorForGM = `${title}`;
      messageFlavor = flavorForGM;
    }
    return messageFlavor;
  }

  getImpactMessage() {
    let impactMessage = "";
    if (this.impact.fatigueLevelsLost > 0) {
      impactMessage += `<br/>${game.i18n.format("arm5e.messages.fatigueLost", {
        num: this.impact.fatigueLevelsLost
      })} `;
    }
    if (this.impact.fatigueLevelsPending + this.impact.fatigueLevelsFail > 0) {
      impactMessage += `<br/>${game.i18n.format("arm5e.messages.fatigueLost", {
        num: this.impact.fatigueLevelsPending + this.impact.fatigueLevelsFail
      })} `;
      impactMessage += ` (${game.i18n.localize("arm5e.generic.pending")})`;
    }
    if (this.impact.woundGravity) {
      impactMessage += `<br/>${game.i18n.format("arm5e.messages.woundResult", {
        typeWound: getWoundStr(this.impact.woundGravity)
      })}`;
      if (!this.impact.applied)
        impactMessage += ` (${game.i18n.localize("arm5e.generic.pending")})`;
    }

    return impactMessage;
  }

  enrichMessageData(actor) {
    // this.parent.updateSource({
    // });
  }
}

export function createChatButton(msg, actor, icon, btnLabel, title, className, onClick) {
  const btn = document.createElement("button");
  btn.classList.add("chat-button");
  if (className) {
    btn.classList.add(className);
  }
  btn.dataset.actorId = actor.id;
  btn.dataset.msgUuid = msg.uuid;
  btn.innerHTML = `<i class="${icon}" title="${game.i18n.localize(title)}" >${btnLabel}</i>`;
  // Handle button clicks
  btn.addEventListener("click", onClick);
  return btn;
}
