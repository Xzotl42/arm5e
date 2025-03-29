import { log, putInFoldableLink, putInFoldableLinkWithAnimation } from "../tools.js";
import { ArsRoll } from "./stressdie.js";

export class Arm5eChatMessage extends ChatMessage {
  static async enrichChatMessage(message, html, data) {
    // if (message.flags.arm5e === undefined && message.rolls.length) {
    //   await message.setFlag("arm5e", {
    //     type: type,
    //     actorType: actor.type // for if the actor is deleted
    //   });
    // }
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
    }

    const html = await super.getHTML();
    let actor = this.actor;

    if (this.isRoll) {
      if (this.system.obfuscate) {
        this.system.obfuscate(html, actor);
      }
    }

    if (this.system.addListeners) {
      this.system.addListeners(html);
    }

    const originatorOrGM = this.originatorOrGM;

    // let msg = html.find(".chat-message");
    // var details = html[0].getElementsByClassName("clickable");
    if (!originatorOrGM) {
      html.find(".clickable").remove();
      html.find(".clickable2").remove();
    }
    // legacy chat messages, ignore them
    // if (data.message.flags.arm5e) {
    //   return;
    // }

    if (actor === null) {
      // Actor no longer exists in the world
      return html;
    }
    let tokenName;
    let actorImg = this.system.img;
    if (actor.prototypeToken !== null) {
      tokenName = actor.prototypeToken.name;
      if (actor.prototypeToken.texture?.src) {
        actorImg = actor.prototypeToken.texture.src;
      }
    }

    const metadata = html.find(".message-metadata");
    metadata.css("max-width", "fit-content");
    const msgTitle = html.find(".message-sender");
    // const msgTitle = !!html.querySelector(".message-sender");
    // is there a better way?
    let text = msgTitle.text();
    text = text.replace("GameMaster", tokenName);
    msgTitle.text(text);
    const actorFace = $(
      `<div class="flexrow"><div class="moreInfo speaker-image flex01" data-uuid="${actor.uuid}" >
      <img src="${actorImg}" title="${tokenName}" width="30" height="30"></div><p>${text}</p></div>`
    );

    actorFace.on("click", async (ev) => {
      const target = $(ev.currentTarget.children[0]);
      const uuid = target[0].dataset.uuid;
      const actor = await fromUuid(uuid);
      if (actor) {
        actor.sheet.render(true);
      }
    });

    msgTitle.html(actorFace);

    if (!this.isRoll) return html;

    const flavor = html.find(".flavor-text");
    flavor.append(this.addActionButtons(html, actor));

    return html;
  }

  addActionButtons(html, actor) {
    const btnContainer = $('<div class="btn-container" style="margin:2px;padding:3px;"></div>');

    let btnCnt = 0;
    if (this.system.addActionButtons) {
      btnCnt = this.system.addActionButtons(btnContainer, actor);
    }
    if (btnCnt) {
      btnContainer.prepend(
        '<h3 class="ars-chat-title">' + game.i18n.localize("arm5e.sheet.actions") + "</h3>"
      );
    }
    return btnContainer;
  }

  get rollTotal() {
    return this.rolls[0].total;
  }
}

async function privateMessage(content, actor, title, flavor, type = "") {
  // only roll messages can be hidden from roller

  // let roll = new Roll("0");

  let messageData = {
    content: "",
    flavor: title + content + putInFoldableLinkWithAnimation("arm5e.sheet.details", flavor),
    speaker: ChatMessage.getSpeaker({
      actor
    }),
    type: CONST.CHAT_MESSAGE_TYPES.ROLL,
    // roll: "0",
    whisper: ChatMessage.getWhisperRecipients("gm"),
    blind: true,
    flags: {
      arm5e: {
        type: type,
        actorType: actor.type // for if the actor is deleted
      }
    }
  };
  ChatMessage.create(messageData);
  // await roll.toMessage(messageData, { rollMode: CONST.DICE_ROLL_MODES.BLIND });
}
