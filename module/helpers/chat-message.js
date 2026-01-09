import { log, putInFoldableLink, putInFoldableLinkWithAnimation } from "../tools.js";
import { SMSG_FIELDS } from "./socket-messages.js";
import { ArsRoll } from "./stressdie.js";

export class Arm5eChatMessage extends ChatMessage {
  static async handleSocketMessages(action, payload) {
    const msgId = payload[SMSG_FIELDS.CHAT_MSG_ID];
    if (!msgId) return;
    switch (action) {
      case "skipConfidence":
        {
          const msg = game.messages.get(msgId);
          if (msg) {
            if (msg.isAuthor || game.user.isGM) {
              if (!msg.system.impact.applied) {
                await msg.system._applyChatMessageUpdate(payload[SMSG_FIELDS.CHAT_MSG_DB_UPDATE]);
                game.arm5e.socketHandler.acknowledgeMessage(payload[SMSG_FIELDS.ID]);
              }
            }
          }
        }

        break;
      case "useConfidence":
      case "rollDefense":
      case "rollSoak":
      case "calculateDamage":
      case "applyDamage":
        {
          const msg = game.messages.get(msgId);
          if (msg) {
            if (msg.isAuthor || game.user.isGM) {
              if (!msg.system.impact.applied) {
                await msg.system._applyChatMessageUpdate(payload[SMSG_FIELDS.CHAT_MSG_DB_UPDATE]);
                game.arm5e.socketHandler.acknowledgeMessage(payload[SMSG_FIELDS.ID]);
              }
            }
          }
        }
        break;
      default:
        console.error(`Unknown chat socket message: ${action}`);
    }
  }

  /** @inheritDoc */
  prepareDerivedData() {
    // Create Roll instances for contained dice rolls
    this.rolls = this.rolls.reduce((rolls, rollData) => {
      try {
        rolls.push(ArsRoll.fromData(rollData));
      } catch (err) {
        Hooks.onError("ChatMessage#rolls", err, { rollData, log: "error" });
      }
      return rolls;
    }, []);
  }

  get actor() {
    return ChatMessage.getSpeakerActor(this.speaker);
  }

  get originatorOrGM() {
    return game.users.get(game.userId).isGM || this.actor?.isOwner;
  }

  /** @inheritDoc */
  async getHTML(...args) {
    if (this.system.getFlavor) {
      if (this.system.originalFlavor === "") {
        this.system.originalFlavor = this.flavor;
      }
      this.flavor = this.system.getFlavor();
    } else if (this.type === "base" && this.isRoll) {
      // chat roll
      this.rolls[0].total;
      if (this.rolls.length == 1 && this.rolls[0].botchCheck) {
        const botches = this.rolls[0].botches;
        if (botches == 0) {
          this.flavor += `<div class='flex-center' ><b style='text-align: center'>${game.i18n.format(
            "arm5e.messages.die.noBotch",
            { dicenum: this.rolls[0].botchDice }
          )}</b></div>`;
        } else if (botches == 1) {
          this.flavor += `<div class='flex-center' ><b style='text-align: center'>${game.i18n.localize(
            "arm5e.messages.die.botch"
          )}</b></div>`;
        } else {
          this.flavor += `<div class='flex-center' ><b style='text-align: center'>${game.i18n.format(
            "arm5e.messages.die.botches",
            { num: botches }
          )}</b></div>`;
        }
      }
    }

    const html = await super.getHTML();
    let actor = this.actor;

    if (this.isRoll) {
      if (this.system.obfuscate) {
        // obfuscate the first roll
        const roll = html[0].getElementsByClassName("dice-roll")[0];
        this.system.obfuscate(roll, actor);
      }
    }

    // legacy chat messages, ignore them
    // if (data.message.flags.arm5e) {
    //   return;
    // }

    if (actor !== null) {
      // Actor still exists in the world

    const metadata = html.find(".message-metadata");
    metadata.css("max-width", "fit-content");
    const msgTitle = html[0].querySelector(".message-sender");
    // const sender = msgTitle.textContent.replace("GameMaster", actor.tokenName);
    const sender = actor.tokenName;
    msgTitle.removeChild(msgTitle.firstChild);
    msgTitle.classList.add("flexrow");
    const imgDiv = document.createElement("div");
    imgDiv.classList.add("moreInfo", "speaker-image", "flex01");
    imgDiv.dataset.uuid = actor.uuid;
    const imgEl = document.createElement("img");
    imgEl.src = actor.tokenImage;
    imgEl.title = actor.tokenName;
    imgEl.width = 30;
    imgEl.height = 30;
    imgDiv.appendChild(imgEl);
    msgTitle.appendChild(imgDiv);
    const pEl = document.createElement("p");
    pEl.classList.add("message-sender-text");
    pEl.innerHTML = sender;
    msgTitle.appendChild(pEl);

    msgTitle.addEventListener("click", async (ev) => {
      const target = $(ev.currentTarget.children[0]);
      const uuid = target[0].dataset.uuid;
      const actor = await fromUuid(uuid);
      if (actor) {
        actor.sheet.render(true);
      }
    });
    }

    // msgTitle.html(actorFace);

    // if (!this.isRoll) return html;

    const flavor = html.find(".flavor-text");
    flavor.append(this.addActionButtons(html));

    // format any additional rolls
    if (this.system.formatTargets) {
      this.system.formatTargets(html);
    }

    if (this.system.addListeners) {
      this.system.addListeners(html);
    }

    const originatorOrGM = this.originatorOrGM;

    if (!originatorOrGM) {
      html.find(".clickable").remove();
    }

    return html;
  }

  addActionButtons(html) {
    const btnContainer = document.createElement("div");
    if (this.actor) {
    btnContainer.classList.add("btn-container");
    const btnArray = document.createElement("div");
    btnArray.classList.add("flexrow");

    let btnCnt = 0;
    if (this.system.addActionButtons) {
      btnCnt = this.system.addActionButtons(btnArray);
    }
    if (btnCnt) {
      const actionHeader = document.createElement("h2");
      actionHeader.classList.add("ars-chat-title");
      actionHeader.innerHTML = game.i18n.localize("arm5e.sheet.actions");
      btnContainer.appendChild(actionHeader);
      btnContainer.appendChild(btnArray);
      }
    }
    return btnContainer;
  }

  rollTotal(index = 0) {
    return this.rolls[index].total;
  }
}

export async function privateMessage(content, actor, title, flavor, type = "") {
  let messageData = {
    content: "",
    flavor: content + putInFoldableLinkWithAnimation("arm5e.sheet.details", flavor),
    speaker: ChatMessage.getSpeaker({
      actor: actor
    }),
    type: "standard",
    // roll: "0",
    system: { label: title },
    whisper: ChatMessage.getWhisperRecipients("gm"),
    blind: true
  };
  ChatMessage.create(messageData);
  // await roll.toMessage(messageData, { rollMode: CONST.DICE_ROLL_MODES.BLIND });
}
