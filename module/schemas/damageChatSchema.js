import { getWoundStr } from "../config.js";
import { fatigueCost } from "../helpers/magic.js";
import { ROLL_PROPERTIES } from "../helpers/rollWindow.js";
import { SMSG_FIELDS, SMSG_TYPES } from "../helpers/socket-messages.js";
import { ArsRoll } from "../helpers/stressdie.js";
import { log, putInFoldableLinkWithAnimation } from "../tools.js";
import { basicIntegerField, boolOption } from "./commonSchemas.js";
import { createChatButton, RollChatSchema } from "./rollChatSchema.js";
const fields = foundry.data.fields;

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
      flavorText += this.originalFlavor;
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

  addActionButtons(btnContainer) {
    // confidence
    // confidence has been used already => no button
    if (this.parent.actor.isOwner && !this.impact.applied) {
      const rollSoakBtn = createChatButton(
        this,
        this.parent.actor,
        "icon-Icon_Soak",
        "arm5e.messages.soak",
        "",
        async (ev) => {
          ev.stopPropagation();
          // const message = fromUuidSync(this.parent.uuid);
          // await message.system.rollSoak(actor);
          this.rollSoak(this.parent.actor);
        }
      );

      btnContainer.append(rollSoakBtn);
      if (game.user.isGM) {
        const cancelBtn = createChatButton(
          this.parent,
          this.parent.actor,
          "fas fa-ban",
          "arm5e.dialog.button.cancel",
          "",
          async (ev) => {
            ev.stopPropagation();
            // const message = fromUuidSync(this.parent.uuid);
            // await message.system.cancelDamageRoll(actor);
            this.cancelDamageRoll(this.parent.actor);
          }
        );

        btnContainer.append(cancelBtn);
      }
    }

    return btnContainer.children.length;
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
        ignoreArmor: this.damage.ignoreArmor
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
