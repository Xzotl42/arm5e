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
    const btnContainer = $('<div class="btn-container"></div>');

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
