import { SMSG_FIELDS, SMSG_TYPES } from "../helpers/socket-messages.js";
import {
  getDataset,
  getLastCombatMessageOfType,
  log,
  putInFoldableLinkWithAnimation
} from "../tools.js";
import { basicIntegerField, boolOption, hermeticForm } from "./commonSchemas.js";
import { createChatButton, RollChatSchema } from "./rollChatSchema.js";
const fields = foundry.data.fields;

export class CombatChatSchema extends RollChatSchema {
  static defineSchema() {
    return {
      ...super.defineSchema()
    };
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

export class CombatAttackChatSchema extends CombatChatSchema {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      combat: new fields.SchemaField({
        attacker: new fields.DocumentUUIDField(),
        damageForm: hermeticForm("te"),
        defenders: new fields.ArrayField(
          new fields.SchemaField({
            uuid: new fields.DocumentUUIDField(),
            name: new fields.StringField({ required: false, blank: true, initial: "" }),
            state: new fields.StringField({ required: false, blank: false, initial: "attacked" })
          })
        )
      })
    };
  }

  enrichMessageData(actor) {
    super.enrichMessageData(actor);
    const updateData = {};
    updateData["system.combat.attacker"] = actor.uuid;
    updateData["system.combat.defenders"] = actor.rollInfo.combat.defenders;
    updateData.flavor =
      `<p>${game.i18n.format("arm5e.sheet.combat.flavor.attack", {
        attacker: actor.tokenName,
        target: actor.rollInfo.combat.defenders.length
          ? actor.rollInfo.combat.defenders.map((e) => e.name).join(", ")
          : "",
        weapon: actor.system.combat.name
          ? actor.system.combat.name
          : game.i18n.localize("arm5e.sheet.combat.flavor.noWeapon")
      })}</p>` + this.parent.flavor;

    this.parent.updateSource(updateData);
  }

  formatTargets(html) {
    const contentDiv = html; //.querySelector("li.chat-message");
    for (let def of this.combat.defenders) {
      const defender = fromUuidSync(def.uuid);
      if (defender) {
        const div = document.createElement("div");
        div.classList.add("flexrow", "padding4");
        const title = document.createElement("h2");
        title.classList.add("ars-chat-title");
        title.innerHTML = def.name;
        div.append(title);
        if (this.roll.botches == 0) {
          const button = document.createElement("button");
          button.classList.add("defend", "chat-button", "flex0");
          button.dataset.msgUuid = this.parent.uuid;
          button.dataset.defenderUuid = def.uuid;

          if (def.state === "attacked") {
            button.innerHTML = `<i class="fas fa-shield" title="${game.i18n.localize(
              "arm5e.sheet.combat.defend"
            )}"></i>`;
          } else {
            button.disabled = true;
            button.innerHTML = `<i class="fas fa-check""></i>`;
          }

          button.addEventListener("click", async (event) => {
            const dataset = getDataset(event);
            await this.rollDefense(defender, dataset);
          });
          if (!defender.isOwner) {
            button.disabled = true;
          }
          div.append(button);
        }
        contentDiv.appendChild(div);
      } else {
        log(false, "defender not found for uuid", def.uuid);
      }
    }
  }
  async rollDefense(defender, dataset) {
    // defender = fromUuidSync(dataset.defenderUuid);
    if (defender) {
      const msg = await defender.sheet.roll({
        name: game.i18n.localize("arm5e.sheet.defense"),
        roll: "defense",
        rootMessage: dataset.msgUuid
      });
      if (msg) {
        const def = this.combat.defenders.find((d) => d.uuid === defender.uuid);
        def.state = "defended";
        const updateData = {
          msgUpdate: {
            system: {
              rootMessage: this.parent.uuid,
              combat: {
                defenders: this.combat.defenders,

                impact: { applied: true }
              }
            },
            actorUpdate: {}
          }
        };
        if (this.parent.isAuthor || game.user.isGM) {
          await Promise.all(this._applyChatMessageUpdate(updateData));
        } else if (defender.isOwner) {
          // Not the author, but owner of the actor rolling
          game.arm5e.socketHandler.emitAwaited(SMSG_TYPES.CHAT, "rollDefense", {
            [SMSG_FIELDS.CHAT_MSG_ID]: this.parent._id,
            [SMSG_FIELDS.SENDER]: game.user._id,
            [SMSG_FIELDS.CHAT_MSG_DB_UPDATE]: updateData
          });
        } else {
          ui.notifications.info(game.i18n.localize("arm5e.chat.notifications.notInitiator"), {
            permanent: false
          });
        }
      }
    } else {
      game.ui.notifications.error(game.i18n.localize("arm5e.chat.notifications.defenderNotFound"));
    }
  }
}

export class CombatDefenseChatSchema extends CombatChatSchema {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      combat: new fields.SchemaField({
        attacker: new fields.DocumentUUIDField(),
        damageForm: hermeticForm("te"),
        defender: new fields.SchemaField({
          uuid: new fields.DocumentUUIDField(),
          name: new fields.StringField({ required: false, blank: true, initial: "" })
        }),
        damageComputed: boolOption(false)
      })
    };
  }
  enrichMessageData(actor) {
    const updateData = {};
    const rootMsg = fromUuidSync(actor.rollInfo.rootMessageUuid);
    // rolled from an attack message
    if (rootMsg) {
      const attackerUuid = rootMsg.system.combat.attacker;
      const defender = rootMsg.system.combat.defenders.find((def) => def.uuid === actor.uuid);
      updateData["system.combat.attacker"] = attackerUuid;
      updateData["system.combat.defender"] = {
        uuid: actor.uuid,
        name: defender.name
      };
      updateData["system.combat.damageComputed"] = false;
      const attacker = fromUuidSync(attackerUuid);
      updateData.flavor =
        `<p>${game.i18n.format("arm5e.sheet.combat.flavor.defense", {
          defender: defender.name,
          attacker: attacker?.tokenName ?? game.i18n.localize("arm5e.generic.unknown"),
          weapon: actor.system.combat.name
            ? actor.system.combat.name
            : game.i18n.localize("arm5e.sheet.combat.flavor.noWeapon")
        })}</p>` + this.parent.flavor;
    } else {
      // rolled independently
      let lastAttackMessage = getLastCombatMessageOfType("combatAttack", (msg) => {
        return msg.system.combat.defenders.some(
          (def) => def.uuid === actor.uuid && def.state === "attacked"
        );
      });

      if (!lastAttackMessage) {
        // no attack found where the actor is explicitly a defender
        // try to find last attack message in general
        lastAttackMessage = getLastCombatMessageOfType("combatAttack");
      }
      if (lastAttackMessage) {
        const attacker = fromUuidSync(lastAttackMessage.system.combat.attacker);
        updateData.flavor =
          `<p>${game.i18n.format("arm5e.sheet.combat.flavor.defense", {
            defender: actor.tokenName,
            attacker: attacker?.tokenName ?? game.i18n.localize("arm5e.generic.unknown"),
            weapon: actor.system.combat.name
              ? actor.system.combat.name
              : game.i18n.localize("arm5e.sheet.combat.flavor.noWeapon")
          })}</p>` + this.parent.flavor;
        updateData["system.combat"] = {
          attacker: attacker?.uuid ?? null,
          defender: {
            uuid: actor.uuid,
            name: actor.tokenName
          }
        };
      } else {
        updateData.flavor =
          `<p>${game.i18n.format("arm5e.sheet.combat.flavor.defenseNoAttacker", {
            defender: actor.tokenName,
            weapon: actor.system.combat.name
              ? actor.system.combat.name
              : game.i18n.localize("arm5e.sheet.combat.flavor.noWeapon")
          })}</p>` + this.parent.flavor;
        updateData["system.combat"] = {
          attacker: null,
          defender: {
            uuid: actor.uuid,
            name: actor.tokenName
          }
        };
      }
    }

    this.parent.updateSource(updateData);
  }

  getAdvantage() {
    const defenseMessage = this.parent;
    let attackMessage = fromUuidSync(this.rootMessage);
    if (attackMessage == null) {
      attackMessage = getLastCombatMessageOfType("combatAttack", (msg) => {
        return msg.system.combat.defenders.some(
          (def) => def.uuid === this.parent.actor.uuid && def.state === "attacked"
        );
      });

      if (!attackMessage) {
        // no attack found where the actor is explicitly a defender
        // try to find last attack message in general
        attackMessage = getLastCombatMessageOfType("combatAttack");
      }
    }
    let attackScore = 0;
    let defenseScore = 0;
    if (defenseMessage && attackMessage) {
      attackScore = attackMessage.rollTotal() > 0 ? attackMessage.rollTotal() : 0;
      attackScore += attackMessage.system.confidenceModifier;
      defenseScore = defenseMessage.rollTotal() > 0 ? defenseMessage.rollTotal() : 0;
      defenseScore += this.confidenceModifier;
    }
    return attackScore - defenseScore;
  }

  addActionButtons(btnContainer) {
    if (!this.combat.damageComputed) {
      const advantage = this.getAdvantage();
      const attacker = fromUuidSync(this.combat.attacker);
      if (attacker?.isOwner) {
        let damageButton;
        if (advantage > 0) {
          damageButton = createChatButton(
            this.parent,
            attacker,
            "icon-Icon_Soak",
            advantage,
            "arm5e.damage.compute",
            "damageButton",
            async (ev) => {
              const dataset = getDataset(ev);
              await this.calculateDamage(attacker, dataset);
            }
          );
        } else {
          damageButton = createChatButton(
            this.parent,
            attacker,
            "",
            game.i18n.localize("arm5e.generic.missed"),
            "arm5e.damage.compute",
            "damageButton",
            async (ev) => {}
          );
          damageButton.disabled = true;
        }
        damageButton.dataset.advantage = advantage;
        btnContainer.append(damageButton);
      }
      super.addActionButtons(btnContainer);
    }
    return btnContainer.children.length;
  }

  async calculateDamage(actor, dataset) {
    const msg = await actor.sheet._onCalculateDamage({
      advantage: dataset.advantage,
      roll: "combatDamage",
      rootMessage: this.parent.uuid
    });
    if (msg === null) return;
    // update to the defense message to disable damage button and confidence use
    const updateData = {
      msgUpdate: {
        system: {
          combat: {
            damageComputed: true
          },
          impact: { applied: true }
        }
      },
      actorUpdate: { system: { states: { confidencePrompt: false } } }
    };
    const promises = [];
    if (this.parent.isAuthor || game.user.isGM) {
      promises.push(Promise.all(this._applyChatMessageUpdate(updateData)));
    } else if (actor.isOwner) {
      // Not the author, but owner of the actor rolling
      promises.push(
        game.arm5e.socketHandler.emitAwaited(SMSG_TYPES.CHAT, "calculateDamage", {
          [SMSG_FIELDS.CHAT_MSG_ID]: this.parent._id,
          [SMSG_FIELDS.SENDER]: game.user._id,
          [SMSG_FIELDS.CHAT_MSG_DB_UPDATE]: updateData
        })
      );
    } else {
      ui.notifications.info(game.i18n.localize("arm5e.chat.notifications.notInitiator"), {
        permanent: true
      });
      return;
    }
    const attacker = fromUuidSync(this.combat.attacker);
    if (attacker) {
      promises.push(attacker.update({ system: { states: { confidencePrompt: false } } }));
    }
    const attackMessage = fromUuidSync(this.rootMessage);
    if (attackMessage) {
      promises.push(attackMessage.update({ "system.impact.applied": true }));
    }
    await Promise.all(promises);
  }
}

export class CombatDamageChatSchema extends CombatChatSchema {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      combat: new fields.SchemaField({
        attacker: new fields.DocumentUUIDField(),
        damageForm: hermeticForm("te"),
        defender: new fields.SchemaField({
          uuid: new fields.DocumentUUIDField(),
          name: new fields.StringField({ required: false, blank: true, initial: "" }),
          flavor: new fields.StringField({ required: false, blank: true, initial: "" }),
          details: new fields.StringField({ required: false, blank: true, initial: "" })
        }),
        damageTotal: basicIntegerField(0, 0),
        damageApplied: boolOption(false)
      })
    };
  }

  addActionButtons(btnContainer) {
    if (!this.combat.damageApplied) {
      const defender = fromUuidSync(this.combat.defender.uuid);
      if (defender?.isOwner && this.combat.damageTotal > 0) {
        const defDiv = document.createElement("div");
        defDiv.classList.add("flexrow");
        const defImgDiv = document.createElement("div");
        defImgDiv.classList.add("moreInfo", "speaker-image", "flex02");
        defImgDiv.dataset.uuid = defender.uuid;
        const img = document.createElement("img");
        img.src = defender.img;
        img.title = defender.name;
        img.width = 30;
        img.height = 30;
        defImgDiv.appendChild(img);
        defDiv.appendChild(defImgDiv);
        const p = document.createElement("p");
        p.classList.add("defender-soak");
        p.innerText = defender.name;
        defDiv.appendChild(p);
        btnContainer.appendChild(defDiv);
        //   <div class="flexrow"><div class="moreInfo speaker-image flex01" data-uuid="Actor.WsMainalaYvXROVH">
        // <img src="icons/svg/mystery-man-black.svg" title="Lupersus" width="30" height="30"></div><p>Lupersus</p></div>

        const damageButton = createChatButton(
          this.parent,
          defender,
          "icon-Icon_Soak_red",
          "",
          "arm5e.messages.applyDamage",
          "applyDamageButton",
          async (ev) => {
            const dataset = getDataset(ev);
            await this.applyDamage(defender, dataset);
          }
        );
        damageButton.classList.add("flex03");

        btnContainer.append(damageButton);
      }
      super.addActionButtons(btnContainer);
    }
    return btnContainer.children.length;
  }

  async applyDamage(defender, dataset) {
    const msg = await defender.sheet._onSoakDamage({
      advantage: this.combat.damageTotal,
      roll: "combatSoak",
      rootMessage: this.parent.uuid
    });

    if (msg === null) return;
    // update to the defense message to disable damage button and confidence use
    const updateData = {
      msgUpdate: {
        rolls: [msg.rolls[0].toJSON()], // soak "roll" only
        system: {
          // roll: msg.system.roll,
          combat: {
            damageApplied: true,
            defender: {
              flavor: msg.flavor,
              details: msg.system.roll.details
            }
          },
          impact: { applied: true, woundGravity: msg.system.impact.woundGravity }
        }
      },
      actorUpdate: {}
    };
    if (this.parent.isAuthor || game.user.isGM) {
      await Promise.all(this._applyChatMessageUpdate(updateData));
    } else if (defender.isOwner) {
      // Not the author, but owner of the actor rolling
      await game.arm5e.socketHandler.emitAwaited(SMSG_TYPES.CHAT, "applyDamage", {
        [SMSG_FIELDS.CHAT_MSG_ID]: this.parent._id,
        [SMSG_FIELDS.SENDER]: game.user._id,
        [SMSG_FIELDS.CHAT_MSG_DB_UPDATE]: updateData
      });
    } else {
      ui.notifications.info(game.i18n.localize("arm5e.chat.notifications.notInitiator"), {
        permanent: true
      });
    }
    const gravity = msg.system.impact.woundGravity || 0;
    if (gravity > 0) {
      await defender.changeWound(
        1,
        CONFIG.ARM5E.recovery.rankMapping[gravity],
        game.i18n.format("arm5e.sheet.combat.wound", { attacker: this.parent.actor })
      );
    }
  }

  enrichMessageData(actor) {
    super.enrichMessageData(actor);
    const message = fromUuidSync(this.rootMessage);
    const updateData = {};
    const defender = message ? message.system.combat.defender : null;
    if (!defender) {
      updateData.flavor = `<p>${game.i18n.format("arm5e.sheet.combat.flavor.damage", {
        attacker: actor.tokenName,
        amount: this.combat.damageTotal
      })}</p>`;
    } else {
      updateData.flavor = `<p>${game.i18n.format("arm5e.sheet.combat.flavor.damageWithTarget", {
        attacker: actor.tokenName,
        amount: this.combat.damageTotal,
        target: defender.name
      })}</p>`;
    }
    if (this.combat.damageForm != "") {
      updateData.flavor += `<br/>${game.i18n.format("arm5e.damage.form")} : ${
        CONFIG.ARM5E.magic.forms[this.combat.damageForm].label
      }`;
    }
    updateData["system.combat"] = {
      attacker: actor.uuid,
      defender: defender
    };
    this.parent.updateSource(updateData);
  }

  formatTargets(html) {
    if (this.parent.rolls.length == 0) return html;
    const contentDiv = html.querySelector(".message-content");

    const div = document.createElement("div");
    const title = document.createElement("h2");
    title.classList.add("ars-chat-title");
    title.innerHTML = game.i18n.format("arm5e.sheet.soak");
    div.append(title);
    const flavorText = document.createElement("div");
    flavorText.innerHTML = this.combat.defender.flavor;
    div.append(flavorText);
    const def = fromUuidSync(this.combat.defender.uuid);
    if (this.showRollFormulas(def, this.roll.actorType ?? "npc")) {
      const details = document.createElement("div");
      details.innerHTML = putInFoldableLinkWithAnimation(
        "arm5e.sheet.details",
        this.combat.defender.details
      );
      div.append(details);
    }
    const soakRes = document.createElement("h4");
    soakRes.classList.add("dice-roll", "dice-total");
    soakRes.innerHTML =
      this.impact.woundGravity !== 0
        ? game.i18n.format("arm5e.messages.woundResult", {
            typeWound: game.i18n.localize(
              "arm5e.messages.wound." + CONFIG.ARM5E.recovery.rankMapping[this.impact.woundGravity]
            )
          })
        : game.i18n.localize("arm5e.messages.noWound");
    // this.obfuscate(diceRoll, this.parent.rolls[0].actor, 1);
    contentDiv.appendChild(div);
    contentDiv.appendChild(soakRes);
    // diceRoll.insertAdjacentElement("afterbegin", div);

    return html;
  }
}

export class CombatSoakChatSchema extends CombatChatSchema {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      combat: new fields.SchemaField({
        attacker: new fields.DocumentUUIDField(),
        damageForm: hermeticForm("te"),
        defender: new fields.SchemaField({
          uuid: new fields.DocumentUUIDField(),
          name: new fields.StringField({ required: false, blank: true, initial: "" })
        }),
        damageTotal: basicIntegerField(0, 0)
      })
    };
  }

  formatTargets(html) {
    const diceTotal = html.getElementsByClassName("dice-total")[0];
    diceTotal.innerHTML =
      this.impact.woundGravity !== 0
        ? game.i18n.format("arm5e.messages.woundResult", {
            typeWound: game.i18n.localize(
              "arm5e.messages.wound." + CONFIG.ARM5E.recovery.rankMapping[this.impact.woundGravity]
            )
          })
        : game.i18n.localize("arm5e.messages.noWound");
  }

  enrichMessageData(actor) {
    super.enrichMessageData(actor);
    const updateData = {};
    updateData.flavor = `<p>${game.i18n.format("arm5e.sheet.combat.flavor.soak", {
      target: actor.tokenName
    })}</p>`;
    const lastAttackMessage = getLastCombatMessageOfType("attack");
    if (lastAttackMessage) {
      const attacker = fromUuidSync(lastAttackMessage.system.combat.attacker);

      updateData["system.combat"] = {
        attacker: attacker?.uuid ?? null,
        defenders: []
      };
    }
    this.parent.updateSource(updateData);
  }
}
