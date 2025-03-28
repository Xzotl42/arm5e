import { ROLL_PROPERTIES } from "../helpers/rollWindow.js";
import { log, putInFoldableLinkWithAnimation } from "../tools.js";
import { basicIntegerField, boolOption } from "./commonSchemas.js";
import { SpellSchema } from "./magicSchemas.js";
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

  // standard chat message doesn't have targets;
  getTargetsHtml() {
    return "";
  }
}

export class RollChatSchema extends BasicChatSchema {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      confidence: new fields.SchemaField({
        allowed: boolOption(true),
        score: basicIntegerField(0, 0),
        used: basicIntegerField(0, 0)
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
        difficulty: basicIntegerField(1, 0)
      }),
      impact: new fields.SchemaField(
        {
          applied: boolOption(false),
          fatigueLevels: basicIntegerField(0, 0),
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
        { initial: { fatigueLevels: 0, woundGravity: 0 } }
      )
    };
  }

  static migrateData(data) {}

  static getDefault(itemData) {}

  static migrate(itemData) {
    const updateData = {};

    return updateData;
  }

  // standard roll chat message doesn't have targets;
  getTargetsHtml() {
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

    res += `<div>${this.originalFlavor}</div>`;
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

    if (this.getFailedMessage && this.failedCasting()) {
      res += this.getFailedMessage();
    } else {
      res += this.getTargetsHtml();
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
      let rollRes = this.parent.rollTotal + this.confidenceModifier;
      if (this.roll.secondaryScore) {
        let newValue = Math.round(this.roll.secondaryScore + rollRes - this.roll.difficulty);

        rollResult.text(Math.round(rollRes) + ` ( ${(newValue < 0 ? "" : "+") + newValue} ) `);
      } else {
        rollResult.text(Math.round(rollRes));
      }
    } else {
      rollResult.remove();
    }
  }

  // _applyImpact(actor, updateData) {
  //   if (actor) {
  //     actor._changeFatigueLevel(updateData, this.impact.fatigueLevels, false);

  //   }
  // }

  addActionButtons(btnContainer, actor) {
    // confidence
    // confidence has been used already => no button
    if (
      !this.impact.applied &&
      this.confidence.allowed &&
      this.roll.botches == 0 &&
      (this.confidence.used ?? 0) < this.confidence.score &&
      actor.canUseConfidencePoint()
    ) {
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
        const actorId = ev.currentTarget.dataset.actorId;
        const message = game.messages.get(ev.currentTarget.dataset.msgId);
        await message.system.useConfidence(actorId);
      });
      btnContainer.append(useConfButton);
      if (this.impact.fatigueLevels || this.impact.woundGravity) {
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
          const actorId = ev.currentTarget.dataset.actorId;
          const message = game.messages.get(ev.currentTarget.dataset.msgId);
          const actor = game.actors.get(actorId);

          const updateData = { "system.states.confidencePrompt": false };
          actor._changeFatigueLevel(updateData, this.impact.fatigueLevels, false);
          await actor.update(updateData);
          await actor.changeWound(
            1,
            CONFIG.ARM5E.recovery.rankMapping[this.impact.woundGravity],
            game.i18n.localize("arm5e.sheet.fatigueOverflow")
          );
          await message.update({ "system.impact.applied": true });
        });
        btnContainer.append(noConfButton);
      }
    }
  }

  fatigueCost(actor) {
    return 0;
  }

  async useConfidence(actorId) {
    const actor = game.actors.get(actorId);

    if (actor && (this.confidence.used ?? 0) < this.confidence.score) {
      let usedConf = this.confidence.used + 1 || 1;
      let msgData = { system: { confidence: {}, roll: {} } };

      msgData.system.confidence.used = usedConf;
      this.confidence.used = usedConf;
      msgData.system.roll.formula = `${this.formula}`;

      let fatigue = this.fatigueCost(actor);

      // Lost fatigue levels + wound if overflow
      const updateData = {};

      actor._useConfidencePoint(updateData);
      if (usedConf == actor.system.con.score || actor.system.con.points == 1) {
        await actor.changeWound(
          1,
          CONFIG.ARM5E.recovery.rankMapping[this.impact.woundGravity],
          game.i18n.localize("arm5e.sheet.fatigueOverflow")
        );
        actor._changeFatigueLevel(updateData, this.impact.fatigueLevels, false);
        msgData["system.impact.applied"] = true;
        updateData["system.states.confidencePrompt"] = false;
      } else {
        const tmp = {}; // no update of actor needed, just recompute impact
        msgData.system.impact = actor._changeFatigueLevel(tmp, fatigue);
      }
      await actor.update(updateData);
      await this.parent.update(msgData);
    }
  }

  getImpactMessage() {
    let impactMessage = "";
    if (this.impact.fatigueLevels > 0) {
      impactMessage += `<br/>${game.i18n.format("arm5e.messages.fatigueLost", {
        num: this.impact.fatigueLevels
      })} `;
      if (!this.impact.applied)
        impactMessage += ` (${game.i18n.localize("arm5e.generic.pending")})`;
    }
    if (this.impact.wound) {
      impactMessage += `<br/>${game.i18n.format("arm5e.messages.woundResult", {
        typeWound: this.impact.woundGravity
      })}`;
      if (!this.impact.applied)
        impactMessage += ` (${game.i18n.localize("arm5e.generic.pending")})`;
    }
    if (this.roll.botchCheck && this.roll.botches > 0) {
      impactMessage += `<br/>${game.i18n.format("arm5e.messages.die.warpGain", {
        num: this.roll.botches
      })} `;
    }
    return impactMessage;
  }

  addInfo(actor) {}
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

  addInfo(actor) {
    this.combat = { attacker: actor.uuid, defenders: [] };
    this.parent.updateSource({ "system.combat": this.combat });
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
        caster: new fields.SchemaField({
          uuid: new fields.DocumentUUIDField(),
          hasPlayerOwner: boolOption(),
          penetration: new fields.ObjectField({
            nullable: true,
            required: false,
            initial: null
          }),
          form: new fields.StringField({ nullable: true, initial: null, required: false })
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
        ritual: boolOption(false)
      })
    };
  }

  addInfo(actor) {
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
      ritual: actor.rollInfo.magic.ritual
    };
    this.roll.difficulty = actor.rollInfo.magic.level;
    this.roll.divider = actor.rollInfo.magic.divide;
    this.parent.updateSource({
      "system.magic": this.magic,
      "system.roll.difficulty": this.roll.difficulty,
      "system.roll.divider": this.roll.divider
    });
  }

  getTargetsHtml() {
    let res = "";
    for (let target of this.magic.targets) {
      const title =
        '<h3 class="ars-chat-title">' + game.i18n.localize("arm5e.sheet.contestOfMagic") + "</h3>";
      const castingTotal = `${game.i18n.localize("arm5e.sheet.spellTotal")} (${
        this.parent.rollTotal + this.confidenceModifier
      })`;

      const showDetails =
        game.user.isGM || game.settings.get("arm5e", "showNPCMagicDetails") === "SHOW_ALL";
      // penetration
      let flavorTotalSpell = "";
      let flavorTotalPenetration = "";
      if (showDetails || this.magic.caster.hasPlayerOwner) {
        const magicLevel = `- ${game.i18n.localize("arm5e.sheet.spellLevel")} (${
          this.roll.difficulty
        })`;
        const penetration = `+ ${game.i18n.localize("arm5e.sheet.penetration")} (${
          this.magic.caster.penetration.total
        })`;

        const penetrationSpec = this.magic.caster.penetration.specApply
          ? ` (${game.i18n.localize("arm5e.sheet.specialityBonus")}: +1 ${
              this.magic.caster.penetration.specialty
            })`
          : "";

        const totalPenetration = `+ ${game.i18n.localize("arm5e.sheet.totalPenetration")} (${
          this.roll.secondaryScore + this.parent.rollTotal - this.roll.difficulty
        })`;

        flavorTotalPenetration = `${penetration}${penetrationSpec}<br/><b>${totalPenetration}</b><br/>`;

        flavorTotalSpell = `${castingTotal}<br/> ${magicLevel}<br/>`;
      }

      let flavorTotalMagicResistance = "";
      // magic resistance
      if (showDetails || target.hasPlayerOwner) {
        const might = target.magicResistance.might
          ? `${game.i18n.localize("arm5e.sheet.might")}: (${target.magicResistance.might})`
          : "";
        const form =
          target.magicResistance.form !== "NONE"
            ? `+ ${game.i18n.format("arm5e.sheet.formScore", {
                form: target.magicResistance.form
              })}: (${target.magicResistance.formScore})`
            : "";

        const aura =
          target.magicResistance.aura == 0
            ? ""
            : ` + ${game.i18n.localize("arm5e.sheet.aura")}: (${target.magicResistance.aura})`;

        const parma = target.magicResistance?.parma?.score
          ? `${game.i18n.localize("arm5e.sheet.parma")}: (${target.magicResistance.parma.score})`
          : "";

        const parmaSpecialty = target.magicResistance?.specialityIncluded
          ? ` (${game.i18n.localize("arm5e.sheet.specialityBonus")}: +1 ${
              target.magicResistance.specialityIncluded
            })`
          : "";
        const totalMagicResistance = `${game.i18n.localize("arm5e.sheet.totalMagicResistance")}: (${
          target.magicResistance.total
        })`;
        flavorTotalMagicResistance = `${might}${parma}${parmaSpecialty}${form}${aura}<br/><b>${totalMagicResistance}</b>`;
      }

      const total =
        this.roll.secondaryScore +
        this.parent.rollTotal +
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
      res +=
        title +
        flavorTarget +
        putInFoldableLinkWithAnimation("arm5e.sheet.details", finalFlavor, true, "clickable2");
    }
    return res;
  }

  //
  fatigueCost(actor) {
    return SpellSchema.fatigueCost(
      actor,
      this.parent.rollTotal + this.confidenceModifier,
      this.roll.difficulty,
      this.magic.ritual
    );
  }
  failedCasting() {
    if (this.roll.type == "spell")
      return this.parent.rollTotal + this.confidenceModifier - this.roll.difficulty < -10;
    else return this.parent.rollTotal + this.confidenceModifier - this.roll.difficulty < 0;
  }

  getFailedMessage() {
    const showDataOfNPC = game.settings.get("arm5e", "showNPCMagicDetails") === "SHOW_ALL";
    let messageFlavor = "";

    if (showDataOfNPC || this.parent.originatorOrGM) {
      const levelOfSpell = this.roll.difficulty;
      const totalOfSpell = this.parent.rollTotal + this.confidenceModifier;
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
