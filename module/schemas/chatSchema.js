import { getWoundStr } from "../config.js";
import { createRoll } from "../dice.js";
import { fatigueCost } from "../helpers/magic.js";
import { ROLL_PROPERTIES } from "../helpers/rollWindow.js";
import { SMSG_FIELDS, SMSG_TYPES } from "../helpers/socket-messages.js";
import { ArsRoll } from "../helpers/stressdie.js";
import { getLastCombatMessageOfType, log, putInFoldableLinkWithAnimation } from "../tools.js";
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
      if (!showItem) {
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
    const item = roll.querySelector(".dice-total");
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

  get confPrompt() {
    return (
      !this.impact.applied &&
      this.confidence.allowed &&
      this.roll.botches == 0 &&
      (this.confidence.used ?? 0) < this.confidence.score
    );
  }

  addActionButtons(btnContainer, actor) {
    // confidence
    // confidence has been used already => no button
    let buttonsArray = [];
    if (this.confPrompt && actor.canUseConfidencePoint()) {
      const useConfButton = $(
        `<button class="dice-confidence chat-button" data-msg-id="${
          this.parent._id
        }" data-actor-id="${actor.id}">
        <i class="fas fa-user-plus" title="${game.i18n.localize(
          "arm5e.messages.useConf"
        )}" ></i></button>`
      );
      // Handle button clicks
      useConfButton.on("click", async (ev) => {
        ev.stopPropagation();
        const message = game.messages.get(ev.currentTarget.dataset.msgId);
        await message.system.useConfidence();
      });

      buttonsArray.push(useConfButton);
      if (
        this.impact.fatigueLevelsPending ||
        this.impact.woundGravity ||
        ((this.confidence.used ?? 0) < this.confidence.score && actor.canUseConfidencePoint())
      ) {
        const noConfButton = $(
          `<button class="dice-no-confidence chat-button" data-msg-id="${
            this.parent._id
          }" data-actor-id="${actor.id}">
          <i class="fa-solid fa-xmark" title="${game.i18n.localize(
            "arm5e.messages.noConf"
          )}" ></i></button>`
        );

        noConfButton.on("click", async (ev) => {
          ev.stopPropagation();
          const message = game.messages.get(ev.currentTarget.dataset.msgId);
          await message.system.skipConfidenceUse();
        });
        buttonsArray.push(noConfButton);
      }
    }
    if (buttonsArray.length === 0) return 0;
    const btnRow = $('<div class="flexrow"></div>');
    for (let b of buttonsArray) {
      btnRow.append(b);
    }
    btnContainer.append(btnRow);
    return buttonsArray.length;
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
    promises.push(
      this.parent.actor.changeWound(
        1,
        CONFIG.ARM5E.recovery.rankMapping[data.msgUpdate.system.impact.woundGravity],
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

export class CombatChatSchema extends RollChatSchema {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      combat: new fields.SchemaField({
        attacker: new fields.DocumentUUIDField(),
        defenders: new fields.ArrayField(new fields.DocumentUUIDField()),
        damageForm: hermeticForm("te")
      })
    };
  }

  formatTargets(html) {
    if (this.roll.type === "combatSoak") {
      const diceTotal = html[0].getElementsByClassName("dice-total")[0];
      diceTotal.innerHTML =
        this.impact.woundGravity !== 0
          ? game.i18n.format("arm5e.messages.woundResult", {
              typeWound: game.i18n.localize(
                "arm5e.messages.wound." +
                  CONFIG.ARM5E.recovery.rankMapping[this.impact.woundGravity]
              )
            })
          : game.i18n.localize("arm5e.messages.noWound");
    } else {
      if (this.parent.rolls.length < 2) return html;
      let ii = 0;
      const contentDiv = html[0].getElementsByClassName("message-content")[0];
      for (let diceRoll of contentDiv.getElementsByClassName("dice-roll")) {
        if (ii == 0) {
          // first is attack roll
          ii++;
          continue;
        }
        const div = document.createElement("div");
        const title = document.createElement("h3");
        title.classList.add("ars-chat-title");
        title.innerHTML = game.i18n.format("arm5e.messages.soak");
        div.append(title);

        this.obfuscate(diceRoll, this.parent.rolls[ii].actor, ii);
        diceRoll.insertAdjacentElement("beforebegin", div);

        ii++;
      }
    }
    return html;
  }

  enrichMessageData(actor) {
    super.enrichMessageData(actor);
    const updateData = {};
    switch (this.roll.type) {
      case "attack":
        const targetedTokens = Array.from(game.user.targets);
        updateData["system.combat"] = {
          attacker: actor.uuid,
          defenders: targetedTokens.map((e) => e.sourceId)
        };
        updateData.flavor =
          `<p>${game.i18n.format("arm5e.sheet.combat.flavor.attack", {
            attacker: actor.name,
            target: this.combat.defenders.length
              ? targetedTokens.map((e) => e.name).join(", ")
              : "",
            weapon: actor.system.combat.name
              ? actor.system.combat.name
              : game.i18n.localize("arm5e.sheet.combat.flavor.noWeapon")
          })}</p>` + this.parent.flavor;

        break;
      case "defense":
        {
          const lastAttackMessage = getLastCombatMessageOfType("attack");
          if (lastAttackMessage) {
            const attacker = fromUuidSync(lastAttackMessage.system.combat.attacker);
            updateData.flavor =
              `<p>${game.i18n.format("arm5e.sheet.combat.flavor.defense", {
                defender: actor.name,
                attacker: attacker?.name ?? game.i18n.localize("arm5e.generic.unknown"),
                weapon: actor.system.combat.name
                  ? actor.system.combat.name
                  : game.i18n.localize("arm5e.sheet.combat.flavor.noWeapon")
              })}</p>` + this.parent.flavor;
            updateData["system.combat"] = { attacker: attacker?.uuid ?? null, defenders: [] };
          } else {
            updateData.flavor =
              `<p>${game.i18n.format("arm5e.sheet.combat.flavor.defenseNoAttacker", {
                defender: actor.name,
                weapon: actor.system.combat.name
                  ? actor.system.combat.name
                  : game.i18n.localize("arm5e.sheet.combat.flavor.noWeapon")
              })}</p>` + this.parent.flavor;
            updateData["system.combat"] = { attacker: null, defenders: [] };
          }
        }
        break;
      case "damage":
        updateData.flavor = `<p>${game.i18n.format("arm5e.sheet.combat.flavor.damage", {
          attacker: actor.name
        })}</p>`;
        updateData["system.combat"] = {
          attacker: actor.uuid,
          defenders: []
        };
        break;
      case "soak":
        {
          updateData.flavor = `<p>${game.i18n.format("arm5e.sheet.combat.flavor.soak", {
            target: actor.name
          })}</p>`;
          const lastAttackMessage = getLastCombatMessageOfType("attack");
          if (lastAttackMessage) {
            const attacker = fromUuidSync(lastAttackMessage.system.combat.attacker);

            updateData["system.combat"] = {
              attacker: attacker?.uuid ?? null,
              defenders: []
            };
          }
        }
        break;
      default:
        break;
    }

    this.parent.updateSource(updateData);
  }

  static migrateData(data) {}

  static getDefault(itemData) {}

  static migrate(itemData) {
    const updateData = {};

    return updateData;
  }

  failedRoll() {
    return this.roll.botches > 0 || false;
  }
}
export class MagicChatSchema extends RollChatSchema {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      magic: new fields.SchemaField({
        caster: new fields.SchemaField({
          uuid: new fields.DocumentUUIDField(),
          hasPlayerOwner: boolOption(),
          penetration: new fields.ObjectField({
            nullable: true,
            required: false,
            initial: null
          })
          // form: new fields.StringField({ nullable: true, initial: null, required: false })
        }),
        targets: new fields.ArrayField(
          new fields.SchemaField({
            uuid: new fields.DocumentUUIDField(),
            name: new fields.StringField({ required: true, blank: false, initial: "target" }),
            hasPlayerOwner: boolOption(),
            magicResistance: new fields.ObjectField({
              nullable: true,
              required: false,
              initial: null
            })
          })
        ),
        ritual: boolOption(false),
        realm: new fields.StringField({
          required: false,
          blank: false,
          initial: "magic",
          choices: CONFIG.ARM5E.realmsExt
        }),
        form: new fields.StringField({
          required: false,
          blank: true,
          initial: "te"
        })
      })
    };
  }

  getImpactMessage() {
    let impactMessage = super.getImpactMessage();
    if (this.roll.botchCheck && this.roll.botches > 0) {
      impactMessage += `<br/>${game.i18n.format("arm5e.messages.die.warpGain", {
        num: this.roll.botches
      })} `;
    }
    return impactMessage;
  }

  enrichMessageData(actor) {
    super.enrichMessageData(actor);

    let realm = "magic";
    if (actor.rollInfo.type == "power") {
      realm = actor.rollInfo.power.realm;
    } else if (actor.rollInfo.type == "supernatural") {
      realm = actor.rollInfo.ability.realm;
    }
    this.magic = {
      caster: {
        uuid: actor.uuid,
        hasPlayerOwner: actor.hasPlayerOwner,
        penetration: {
          score: actor.rollInfo.penetration.score,
          specApply: actor.rollInfo.penetration.specApply,
          specialty: actor.rollInfo.penetration.speciality,
          multiplier: actor.rollInfo.penetration.multiplier,
          total: actor.rollInfo.penetration.total
        }
      },
      targets: [],
      ritual: actor.rollInfo.magic.ritual,
      realm: realm,
      form: actor.rollInfo.magic.form.value
    };

    this.parent.updateSource({
      "system.magic": this.magic,
      "system.roll.difficulty": actor.rollInfo.magic.level,
      "system.roll.divider": actor.rollInfo.magic.divide
    });
  }

  failedRoll() {
    return this.roll.botches > 0 || this.failedCasting();
  }

  formatTargets(html) {
    const rollType = this.roll.type;
    const contentDiv = html[0].getElementsByClassName("message-content")[0];

    for (let target of this.magic.targets) {
      let res = document.createElement("div");

      const title = document.createElement("h3");
      title.classList.add("ars-chat-title");
      title.innerHTML = game.i18n.format("arm5e.chat.contestOfMagicWith", { name: target.name });
      const titleWrapper = document.createElement("div");
      titleWrapper.classList.add("margintop4");
      titleWrapper.appendChild(title);
      res.append(titleWrapper);

      let castingTotal = "";
      if (!["item", "power"].includes(rollType)) {
        castingTotal = `${game.i18n.localize("arm5e.sheet.spellTotal")} (${
          this.parent.rollTotal(0) + this.confidenceModifier
        })`;
      }

      const showDetails =
        game.user.isGM || game.settings.get("arm5e", "showNPCMagicDetails") === "SHOW_ALL";
      // penetration
      let flavorTotalSpell = "";
      let flavorTotalPenetration = "";
      let magicLevel = "";
      let penetration = "";
      let penetrationSpec = "";
      if (showDetails || this.magic.caster.hasPlayerOwner) {
        const totalPenetration = `+ ${game.i18n.localize("arm5e.sheet.totalPenetration")} (${
          this.roll.secondaryScore + this.parent.rollTotal(0) - this.roll.difficulty
        })`;
        if (["item", "power"].includes(rollType)) {
          flavorTotalPenetration = `<b>${totalPenetration}</b><br/>`;
          flavorTotalSpell = "";
        } else {
          magicLevel = `- ${game.i18n.localize("arm5e.sheet.spellLevel")} (${
            this.roll.difficulty
          })`;
          penetration = `+ ${game.i18n.localize("arm5e.sheet.penetration")} (${
            this.magic.caster.penetration.total
          })`;

          penetrationSpec = this.magic.caster.penetration.specApply
            ? ` (${game.i18n.localize("arm5e.sheet.specialityBonus")}: +1 ${
                this.magic.caster.penetration.specialty
              })`
            : "";
          flavorTotalSpell = `${castingTotal}<br/> ${magicLevel}<br/>`;
          flavorTotalPenetration = `${penetration}${penetrationSpec}<br/><b>${totalPenetration}</b><br/>`;
        }
      }

      let flavorTotalMagicResistance = "";
      // magic resistance
      if (showDetails || target.hasPlayerOwner) {
        const might = target.magicResistance.might
          ? `${game.i18n.localize("arm5e.sheet.might")}: (${target.magicResistance.might})`
          : "";

        let form = "";
        if (target.magicResistance.formScore) {
          if (target.magicResistance.form !== "NONE") {
            form = `+ ${game.i18n.format("arm5e.sheet.formScore", {
              form: target.magicResistance.form
            })}: (${target.magicResistance.formScore})`;
          }
        }

        const aura =
          target.magicResistance.aura == 0
            ? ""
            : ` + ${game.i18n.localize("arm5e.sheet.aura")}: (${target.magicResistance.aura})`;

        // if there is another resistance, it i
        const parma = target.magicResistance.parma
          ? ` + ${game.i18n.localize("arm5e.sheet.parma")}: (${
              target.magicResistance.parma.score * 5
            })`
          : "";

        const parmaSpecialty = target.magicResistance.specialityIncluded
          ? ` (${game.i18n.localize("arm5e.sheet.specialityBonus")}: +5 ${
              target.magicResistance.specialityIncluded
            })`
          : "";

        const susceptibility = target.magicResistance.susceptible
          ? `${game.i18n.format("arm5e.realm.susceptible.impact", {
              realm: game.i18n.localize(CONFIG.ARM5E.realms[this.magic.realm].label),
              divisor: 2
            })}<br>`
          : "";
        const totalMagicResistance = `${game.i18n.localize("arm5e.chat.totalMagicResistance")}: (${
          target.magicResistance.total
        })`;
        if (target.magicResistance.otherResistance) {
          flavorTotalMagicResistance = `${game.i18n.localize(
            "arm5e.chat.otherMagicResistance"
          )} : ${
            target.magicResistance.otherResistance
          }<br/>${susceptibility}<b>${totalMagicResistance}</b>`;
        } else {
          flavorTotalMagicResistance = `${might}${parma}${parmaSpecialty}${form}${aura}<br/>${susceptibility}<b>${totalMagicResistance}</b>`;
        }
      }

      const total =
        this.roll.secondaryScore +
        this.parent.rollTotal(0) +
        this.confidenceModifier -
        this.roll.difficulty -
        target.magicResistance.total;
      let flavorTarget = "";
      if (total > 0) {
        if (showDetails || (this.magic.caster.hasPlayerOwner && target.hasPlayerOwner)) {
          flavorTarget = `${game.i18n.format("arm5e.sheet.spellOverMagicResistance", {
            target: target.name,
            total: total
          })}`;
        } else {
          flavorTarget = `${game.i18n.format("arm5e.sheet.spellOverMagicResistanceWithNoTotal", {
            target: target.name
          })}`;
        }
      } else {
        if (showDetails || (this.magic.caster.hasPlayerOwner && target.hasPlayerOwner)) {
          flavorTarget = `${game.i18n.format("arm5e.sheet.magicResistanceOverSpell", {
            target: target.name,
            total: total
          })}`;
        } else {
          flavorTarget = `${game.i18n.format("arm5e.sheet.magicResistanceOverSpellWithNoTotal", {
            target: target.name
          })}`;
        }
      }

      const finalFlavor = `${flavorTotalSpell}${flavorTotalPenetration}${flavorTotalMagicResistance}`;

      const targetHtml = document.createElement("div");
      targetHtml.classList.add("flavor-text");
      targetHtml.innerHTML = flavorTarget;
      res.append(targetHtml);
      const contentHtml = document.createElement("div");
      contentHtml.innerHTML = putInFoldableLinkWithAnimation(
        "arm5e.sheet.details",
        finalFlavor,
        true,
        "clickable"
      );

      res.append(contentHtml);
      contentDiv.append(res);
    }
    return html;
  }

  //
  fatigueCost(actor) {
    let res = { use: 0, partial: 0, fail: 0 };

    if (this.roll.type == "spell") {
      res = fatigueCost(
        actor,
        this.parent.rollTotal(0) + this.confidenceModifier,
        this.roll.difficulty,
        this.magic.ritual
      );
    }
    log(false, "fatigueCost", res);
    return res;
  }
  failedCasting() {
    if (this.roll.type == "spell")
      return this.parent.rollTotal(0) + this.confidenceModifier - this.roll.difficulty < -10;
    else return this.parent.rollTotal(0) + this.confidenceModifier - this.roll.difficulty < 0;
  }

  getFailedMessage() {
    const showDataOfNPC = game.settings.get("arm5e", "showNPCMagicDetails") === "SHOW_ALL";
    let messageFlavor = "";

    if (showDataOfNPC || this.parent.originatorOrGM) {
      const levelOfSpell = this.roll.difficulty;
      const totalOfSpell = this.parent.rollTotal(0) + this.confidenceModifier;
      const title =
        '<h2 class="ars-chat-title">' + game.i18n.localize("arm5e.sheet.spellFailed") + "</h2>";
      const messageTotalOfSpell = `${game.i18n.localize(
        "arm5e.sheet.spellTotal"
      )} (${totalOfSpell})`;
      const messageLevelOfSpell = `- ${game.i18n.localize(
        "arm5e.sheet.spellLevel"
      )} (${levelOfSpell})`;
      const castingTotal = `= ${totalOfSpell - levelOfSpell}`;
      let extendedMsg = ` ${messageTotalOfSpell} ${messageLevelOfSpell} ${castingTotal}`;
      let flavorForGM = `${title}` + messageFlavor + extendedMsg;
      messageFlavor = flavorForGM;
    }
    return messageFlavor;
  }

  static migrateData(data) {}

  static getDefault(itemData) {
    return {};
  }

  static migrate(itemData) {
    const updateData = {};

    return updateData;
  }
}

export class DamageChatSchema extends RollChatSchema {
  static defineSchema() {
    return {
      ...super.defineSchema(),

      damage: new fields.SchemaField({
        modifier: basicIntegerField(0, 0),
        source: new fields.StringField({ required: true, blank: true, initial: "" }),
        ignoreArmor: boolOption(),
        form: new fields.StringField({
          required: false,
          blank: true,
          initial: "te"
        }),
        target: new fields.SchemaField({
          uuid: new fields.DocumentUUIDField(),
          name: new fields.StringField({ required: true, blank: false, initial: "target" }),
          flavor: new fields.StringField({ required: false, blank: true, initial: "" }),
          details: new fields.StringField({ required: false, blank: true, initial: "" }),
          natRes: basicIntegerField(0, -9999),
          formRes: basicIntegerField(0, 0)
          // details: new fields.StringField({ required: false, blank: true, initial: "" })
        })
      })
    };
  }

  enrichMessageData(actor) {
    const rollInfo = actor.rollInfo;
    const updateData = {};

    if (rollInfo.type == "damage") {
      updateData["system.damage"] = {
        modifier: rollInfo.modifier,
        source: rollInfo.damage.source,
        form: rollInfo.damage.form,
        ignoreArmor: rollInfo.damage.ignoreArmor
      };
    } else if (rollInfo.type == "soak") {
      updateData["system.damage"] = {
        source: rollInfo.damage.source,
        modifier: rollInfo.modifier,
        form: rollInfo.damage.form,
        formRes: rollInfo.damage.formRes,
        natRes: rollInfo.damage.natRes,
        ignoreArmor: rollInfo.damage.ignoreArmor
      };
      updateData["system.roll.difficulty"] = rollInfo.difficulty;
    }

    this.parent.updateSource(updateData);
  }

  failedRoll() {
    return false;
  }

  get body() {
    let flavorText = "";
    if (this.roll.type == "damage") {
      flavorText = `<p>${game.i18n.format("arm5e.damage.damageflavor", {
        amount: this.parent.rollTotal(0),
        source: this.damage.source
      })}`;
      if (this.damage.form != "") {
        flavorText += `<br/>${game.i18n.format("arm5e.damage.form")} : ${
          CONFIG.ARM5E.magic.forms[this.damage.form].label
        }`;
      }
      if (this.damage.ignoreArmor) {
        flavorText += `<br/><i>${game.i18n.localize("arm5e.damage.ignoreArmor")}</i>`;
      }
      flavorText += `</p>`;
      // } else if (this.roll.type == "soak") {
      //   flavorText = `<p>${game.i18n.format("arm5e.damage.soakFlavor", {
      //     amount: this.roll.difficulty - this.parent.rollTotal(0),
      //     source: this.damage.source
      //   })}`;
      //   if (this.damage.ignoreArmor) {
      //     flavorText += `<br/><i>${game.i18n.localize("arm5e.damage.ignoreArmor")}</i>`;
      //   }
      //   flavorText += `</p>`;
    }
    return flavorText;
  }

  formatTargets(html) {
    if (this.parent.rolls.length < 2) return html;
    let ii = 0;
    const contentDiv = html[0].querySelector(".message-content");
    for (let diceRoll of contentDiv.getElementsByClassName("dice-roll")) {
      if (ii == 0) {
        // first is attack roll
        ii++;
        continue;
      }
      const div = document.createElement("div");
      const title = document.createElement("h3");
      title.classList.add("ars-chat-title");
      title.innerHTML = game.i18n.format("arm5e.messages.soak");
      div.append(title);
      const flavorText = document.createElement("div");
      flavorText.innerHTML = this.damage.target.flavor;
      div.append(flavorText);
      const details = document.createElement("div");
      details.innerHTML = putInFoldableLinkWithAnimation(
        "arm5e.sheet.details",
        this.damage.target.details
      );
      div.append(details);
      const diceTotal = diceRoll.querySelector(".dice-total");
      diceTotal.innerHTML =
        this.impact.woundGravity !== 0
          ? game.i18n.format("arm5e.messages.woundResult", {
              typeWound: game.i18n.localize(
                "arm5e.messages.wound." +
                  CONFIG.ARM5E.recovery.rankMapping[this.impact.woundGravity]
              )
            })
          : game.i18n.localize("arm5e.messages.noWound");
      this.obfuscate(diceRoll, this.parent.rolls[1].actor, 1);
      diceRoll.insertAdjacentElement("beforebegin", div);

      ii++;
    }
    return html;
  }

  addActionButtons(btnContainer, actor) {
    // confidence
    // confidence has been used already => no button
    let buttonsArray = [];
    if (!this.impact.applied) {
      // const rollSoakBtn = $(
      //   `<button class="chat-button" data-msg-id="${this.parent._id}" data-actor-id="${actor.id}">
      //   <i class="icon-Icon_Soak" title="${game.i18n.localize(
      //     "arm5e.messages.soak"
      //   )}" ></i></button>`
      // );
      const rollSoakBtn = createChatButton(
        this,
        actor,
        "icon-Icon_Soak",
        "arm5e.messages.soak",
        this.rollSoak
      );
      // Handle button clicks
      rollSoakBtn.on("click", async (ev) => {
        ev.stopPropagation();
        const message = game.messages.get(ev.currentTarget.dataset.msgId);
        await message.system.rollSoak(actor);
      });

      buttonsArray.push(rollSoakBtn);
      if (game.user.isGM) {
        const cancelBtn = createChatButton(
          this,
          actor,
          "fas fa-ban",
          "arm5e.dialog.button.cancel",
          this.cancelDamageRoll
        );
        cancelBtn.on("click", async (ev) => {
          ev.stopPropagation();
          const message = game.messages.get(ev.currentTarget.dataset.msgId);
          await message.system.cancelDamageRoll(actor);
        });
        buttonsArray.push(cancelBtn);
      }
    }
    if (buttonsArray.length === 0) return 0;
    const btnRow = $('<div class="flexrow"></div>');
    for (let b of buttonsArray) {
      btnRow.append(b);
    }
    btnContainer.append(btnRow);
    return buttonsArray.length;
  }

  async rollSoak(actor) {
    // if ()

    // have a method that  doesn't update the message directly but returns the data to update

    if (this.parent.actor) {
      const message = await actor.sheet.roll({
        roll: "soak",
        source: this.damage.source,
        difficulty: this.parent.rollTotal(0),
        damageForm: this.damage.form,
        ignoreArmor: this.damage.ignoreArmor,
        rootMessage: this.parent._id
      });
      if (message) {
        const dbUpdate = {};

        const messageData = { "system.impact.applied": true };
        messageData["system.damage"] = message.system.damage;
        messageData["system.impact"] = message.system.impact;
        // adjust message content
        message.system.roll.type = "damage";
        delete message.system.roll.details;
        messageData["system.roll"] = message.system.roll;
        messageData["roll"] = message.rolls[0].toJSON(); // soak roll only

        const actorData = { "system.states.pendingDamage": false };

        dbUpdate.actorUpdate = actorData;
        dbUpdate.msgUpdate = messageData;

        const updateData = foundry.utils.expandObject(dbUpdate);
        if (this.parent.isAuthor || game.user.isGM) {
          log(false, "applying soak chat message update", updateData);
          await Promise.all(this._applyChatMessageUpdate(updateData));
        } else if (this.parent.actor.isOwner) {
          // Not the author, but owner of the actor rolling
          game.arm5e.socketHandler.emitAwaited(SMSG_TYPES.CHAT, "rollSoak", {
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
      log(false, "rollSoak: actor not found");
    }
  }

  _applyChatMessageUpdate(data) {
    const rolls = this.parent.rolls;

    rolls.push(ArsRoll.fromData(data.msgUpdate.roll)); // new soak roll
    data.msgUpdate.rolls = rolls;

    return super._applyChatMessageUpdate(data);
  }

  async cancelDamageRoll(actor) {
    const promises = [];
    let newFlavor =
      this.originalFlavor +
      `<p style="text-align:center;"><b>${game.i18n.localize("arm5e.generic.cancelled")}</b></p>`;
    promises.push(
      this.parent.update({ "system.impact.applied": true, "system.originalFlavor": newFlavor })
    );
    promises.push(actor.update({ "system.states.pendingDamage": false }));
    await Promise.all(promises);
  }
}

function createChatButton(msg, actor, icon, title, onClick) {
  const btn = $(
    `<button class="chat-button" data-msg-id="${msg.parent._id}" data-actor-id="${
      actor.id
    }" data-msg-id="${msg._id}">
        <i class="${icon}" title="${game.i18n.localize(title)}" ></i></button>`
  );
  // btn.on("click", onClick);
  return btn;
}
