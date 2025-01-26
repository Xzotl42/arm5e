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
    const btnContainer = $('<span class="btn-container" style="margin:2px;padding:3px;"></span>');

    if (this.system.addActionButtons) {
      this.system.addActionButtons(btnContainer, actor);
    }
    return btnContainer;
  }

  get rollTotal() {
    return this.rolls[0].total;
  }
}

function getFlavorForPlayersTotalSpell(flavorTotalSpell, actorCaster, showDataOfNPC) {
  if (actorCaster.hasPlayerOwner) {
    return flavorTotalSpell;
  }
  if (showDataOfNPC) {
    return flavorTotalSpell;
  }
  return "";
}

function getFlavorForPlayersTotalPenetration(flavorTotalPenetration, actorCaster, showDataOfNPC) {
  if (actorCaster.hasPlayerOwner) {
    return flavorTotalPenetration;
  }
  if (showDataOfNPC) {
    return flavorTotalPenetration;
  }
  return "";
}

function getFlavorForPlayersTotalMagicResistance(
  flavorTotalMagicResistance,
  actorTarget,
  showDataOfNPC
) {
  if (actorTarget.hasPlayerOwner) {
    return flavorTotalMagicResistance;
  }
  if (showDataOfNPC) {
    return flavorTotalMagicResistance;
  }
  return "";
}

function getFlavorForPlayersResult({
  messageOnlyWithName,
  messageTotalWithName,
  actorTarget,
  actorCaster,
  showDataOfNPC
}) {
  if (actorTarget.hasPlayerOwner && actorCaster.hasPlayerOwner) {
    return messageTotalWithName;
  }
  if (showDataOfNPC) {
    return messageTotalWithName;
  }
  return messageOnlyWithName;
}

async function chatFailedCasting(actorCaster, roll, message, fatigue) {
  const levelOfSpell = actorCaster.rollInfo.magic.level;
  const totalOfSpell = roll._total;
  const title =
    '<h2 class="ars-chat-title">' + game.i18n.localize("arm5e.sheet.spellFailed") + "</h2>";
  const messageTotalOfSpell = `${game.i18n.localize("arm5e.sheet.spellTotal")} (${totalOfSpell})`;
  const messageLevelOfSpell = `- ${game.i18n.localize("arm5e.sheet.spellLevel")} (${levelOfSpell})`;
  const castingTotal = `= ${totalOfSpell - levelOfSpell}`;
  let lostFatigue = "";
  if (fatigue > 0) {
    lostFatigue = `<br/>${game.i18n.format("arm5e.messages.fatigueLost", { num: fatigue })} `;
  }
  let warping = "";
  if (roll.botches > 0) {
    warping = `<br/>${game.i18n.format("arm5e.messages.die.warpGain", { num: roll.botches })} `;
  }
  const showDataOfNPC = game.settings.get("arm5e", "showNPCMagicDetails") === "SHOW_ALL";
  let flavorForPlayers = `${title}`;
  let extendedMsg = ` ${messageTotalOfSpell} ${messageLevelOfSpell} ${castingTotal}${lostFatigue}${warping}`;
  let flavorForGM = flavorForPlayers + extendedMsg;
  if (showDataOfNPC) {
    flavorForPlayers = flavorForGM;
  }

  await message.update({ flavor: message.flavor + flavorForPlayers });
  // ChatMessage.create({
  //   content: "",
  //   flavor: flavorForPlayers,
  //   speaker: ChatMessage.getSpeaker({
  //     actorCaster
  //   })
  // });
  // if (flavorForPlayers !== flavorForGM) {
  //   privateMessage("", actorCaster, flavorForGM);
  // }
}

async function chatContestOfPower(
  message,
  { actorCaster, actorTarget, penetrationTotal, magicResistance, total, form }
) {
  const title =
    '<h3 class="ars-chat-title">' + game.i18n.localize("arm5e.sheet.contestOfMagic") + "</h3>";
  const messageTotalOfSpell = `${game.i18n.localize(
    "arm5e.sheet.totalPenetration"
  )} (${penetrationTotal})`;
  const messageMight = magicResistance?.might
    ? `${game.i18n.localize("arm5e.sheet.might")}: (${magicResistance.might})`
    : "";

  const messageForm = magicResistance?.formScore
    ? `+ ${game.i18n.localize("arm5e.sheet.formScore")}: (${magicResistance.formScore})`.replace(
        "$form$",
        form
      )
    : "";
  const messageAura =
    magicResistance.aura == 0
      ? ""
      : ` + ${game.i18n.localize("arm5e.sheet.aura")}: (${magicResistance.aura})`;

  const messageParma = magicResistance?.parma?.score
    ? `${game.i18n.localize("arm5e.sheet.parma")}: (${magicResistance.parma.score})`
    : "";

  const messageParmaSpeciality = magicResistance?.specialityIncluded
    ? ` (${game.i18n.localize("arm5e.sheet.specialityBonus")}: +1 ${
        magicResistance.specialityIncluded
      })`
    : "";
  const messageTotalMagicResistance = `${game.i18n.localize(
    "arm5e.sheet.totalMagicResistance"
  )}: (${magicResistance.total})`;

  const flavorTotalSpell = `${messageTotalOfSpell}<br/> `;
  const flavorTotalMagicResistance = `${messageMight}${messageParma}${messageParmaSpeciality}${messageForm}${messageAura}<br/><b>${messageTotalMagicResistance}</b>`;
  const messageTotal =
    total > 0
      ? `${game.i18n.localize("arm5e.sheet.spellOverMagicResistance")}`
      : `${game.i18n.localize("arm5e.sheet.magicResistanceOverSpell")}`;

  const messageWithoutTotal =
    total > 0
      ? `${game.i18n.localize("arm5e.sheet.spellOverMagicResistanceWithNoTotal")}`
      : `${game.i18n.localize("arm5e.sheet.magicResistanceOverSpellWithNoTotal")}`;

  const messageTotalWithName =
    total > 0
      ? messageTotal.replace("$target$", actorTarget.name).replace("$total$", total)
      : messageTotal.replace("$target$", actorTarget.name).replace("$total$", -total);

  const messageOnlyWithName =
    total > 0
      ? messageWithoutTotal.replace("$target$", actorTarget.name)
      : messageWithoutTotal.replace("$target$", actorTarget.name);

  const showDataOfNPC = game.settings.get("arm5e", "showNPCMagicDetails") === "SHOW_ALL";
  const flavorForPlayersTotalSpell = getFlavorForPlayersTotalSpell(
    flavorTotalSpell,
    actorCaster,
    showDataOfNPC
  );
  const flavorForPlayersTotalMagicResistance = getFlavorForPlayersTotalMagicResistance(
    flavorTotalMagicResistance,
    actorTarget,
    showDataOfNPC
  );
  const flavorForPlayersResult = getFlavorForPlayersResult({
    messageOnlyWithName,
    messageTotalWithName,
    actorTarget,
    actorCaster,
    showDataOfNPC
  });
  const flavorForGM = `${flavorTotalSpell}${flavorTotalMagicResistance}`;
  const flavorForPlayers = `${flavorForPlayersTotalSpell}${flavorForPlayersTotalMagicResistance}`;

  // const content = `<h4 class="dice-total">${flavorForPlayersResult}</h4>`;
  message = await message.update({
    // content: content,
    flavor:
      message.flavor +
      title +
      flavorForPlayersResult +
      (flavorForPlayers == ""
        ? ""
        : putInFoldableLinkWithAnimation(
            "arm5e.sheet.details",
            flavorForPlayers,
            true,
            "clickable2"
          )),
    "flags.arm5e.actorType": actorCaster.type // for if the actor is deleted
  });
  // ChatMessage.create({
  //   content,
  //   flavor: title + putInFoldableLinkWithAnimation("arm5e.sheet.details", flavorForPlayers),
  //   speaker: ChatMessage.getSpeaker({
  //     actorCaster
  //   }),
  // flags: {
  //   arm5e: {
  //     actorType: actorCaster.type // for if the actor is deleted
  //   }
  //   }
  // });
  if (flavorForPlayers !== flavorForGM) {
    privateMessage(messageTotalWithName, actorCaster, title, flavorForGM, "power");
  }
}

async function chatContestOfMagic(
  message,
  { actorCaster, actorTarget, penetration, magicResistance, total, form }
) {
  const title =
    '<h3 class="ars-chat-title">' + game.i18n.localize("arm5e.sheet.contestOfMagic") + "</h3>";
  const messageTotalOfSpell = `${game.i18n.localize("arm5e.sheet.spellTotal")} (${
    penetration.totalOfSpell
  })`;
  const messageLevelOfSpell = `- ${game.i18n.localize("arm5e.sheet.spellLevel")} (${
    penetration.levelOfSpell
  })`;

  const messagePenetration = `+ ${game.i18n.localize("arm5e.sheet.penetration")} (${
    penetration.penetration
  })`;
  const messageSpeciality = penetration.specialityIncluded
    ? ` (${game.i18n.localize("arm5e.sheet.specialityBonus")}: +1 ${
        penetration.specialityIncluded
      })`
    : "";
  const messageTotalPenetration = `${game.i18n.localize("arm5e.sheet.totalPenetration")}: (${
    penetration.total
  })`;

  const messageMight = magicResistance?.might
    ? `${game.i18n.localize("arm5e.sheet.might")}: (${magicResistance.might})`
    : "";

  const messageForm = magicResistance?.formScore
    ? `+ ${game.i18n.localize("arm5e.sheet.formScore")}: (${magicResistance.formScore})`.replace(
        "$form$",
        form
      )
    : "";
  const messageAura =
    magicResistance.aura == 0
      ? ""
      : ` + ${game.i18n.localize("arm5e.sheet.aura")}: (${magicResistance.aura})`;

  const messageParma = magicResistance?.parma?.score
    ? `${game.i18n.localize("arm5e.sheet.parma")}: (${magicResistance.parma.score})`
    : "";

  const messageParmaSpeciality = magicResistance?.specialityIncluded
    ? ` (${game.i18n.localize("arm5e.sheet.specialityBonus")}: +1 ${
        magicResistance.specialityIncluded
      })`
    : "";
  const messageTotalMagicResistance = `${game.i18n.localize(
    "arm5e.sheet.totalMagicResistance"
  )}: (${magicResistance.total})`;
  const flavorTotalSpell = `${messageTotalOfSpell}<br/> ${messageLevelOfSpell}<br/>`;
  const flavorTotalPenetration = `${messagePenetration}${messageSpeciality}<br/><b>${messageTotalPenetration}</b><br/>`;
  const flavorTotalMagicResistance = `${messageMight}${messageParma}${messageParmaSpeciality}${messageForm}${messageAura}<br/><b>${messageTotalMagicResistance}</b>`;

  const messageTotal =
    total > 0
      ? `${game.i18n.localize("arm5e.sheet.spellOverMagicResistance")}`
      : `${game.i18n.localize("arm5e.sheet.magicResistanceOverSpell")}`;

  const messageWithoutTotal =
    total > 0
      ? `${game.i18n.localize("arm5e.sheet.spellOverMagicResistanceWithNoTotal")}`
      : `${game.i18n.localize("arm5e.sheet.magicResistanceOverSpellWithNoTotal")}`;

  const messageTotalWithName =
    total > 0
      ? messageTotal.replace("$target$", actorTarget.name).replace("$total$", total)
      : messageTotal.replace("$target$", actorTarget.name).replace("$total$", -total);

  const messageOnlyWithName =
    total > 0
      ? messageWithoutTotal.replace("$target$", actorTarget.name)
      : messageWithoutTotal.replace("$target$", actorTarget.name);

  const showDataOfNPC = game.settings.get("arm5e", "showNPCMagicDetails") === "SHOW_ALL";
  const flavorForPlayersTotalSpell = getFlavorForPlayersTotalSpell(
    flavorTotalSpell,
    actorCaster,
    showDataOfNPC
  );
  const flavorForPlayersTotalPenetration = getFlavorForPlayersTotalPenetration(
    flavorTotalPenetration,
    actorCaster,
    showDataOfNPC
  );
  const flavorForPlayersTotalMagicResistance = getFlavorForPlayersTotalMagicResistance(
    flavorTotalMagicResistance,
    actorTarget,
    showDataOfNPC
  );
  const flavorForPlayersResult = getFlavorForPlayersResult({
    messageOnlyWithName,
    messageTotalWithName,
    actorTarget,
    actorCaster,
    showDataOfNPC
  });
  const flavorForGM = `${flavorTotalSpell}${flavorTotalPenetration}${flavorTotalMagicResistance}`;
  const flavorForPlayers = `${flavorForPlayersTotalSpell}${flavorForPlayersTotalPenetration}${flavorForPlayersTotalMagicResistance}`;

  // const content = `<h4 class="dice-total">${flavorForPlayersResult}</h4>`;

  message = await message.update({
    // content: content,
    flavor:
      message.flavor +
      title +
      flavorForPlayersResult +
      (flavorForPlayers == ""
        ? ""
        : putInFoldableLinkWithAnimation(
            "arm5e.sheet.details",
            flavorForPlayers,
            true,
            "clickable2"
          )),
    "flags.arm5e.actorType": actorCaster.type // for if the actor is deleted
  });

  // ChatMessage.create({
  //   content,
  //   flavor: title + putInFoldableLinkWithAnimation("arm5e.sheet.details", flavorForPlayers),
  //   speaker: ChatMessage.getSpeaker({
  //     actorCaster
  //   })
  // });
  if (flavorForPlayers !== flavorForGM) {
    privateMessage(messageTotalWithName, actorCaster, title, flavorForGM, "magic");
  }
  return message;
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

export { chatContestOfMagic, chatFailedCasting, chatContestOfPower };
