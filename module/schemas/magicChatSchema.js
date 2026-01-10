import { fatigueCost } from "../helpers/magic.js";
import { log, putInFoldableLinkWithAnimation } from "../tools/tools.js";
import { boolOption } from "./commonSchemas.js";
import { RollChatSchema } from "./rollChatSchema.js";
const fields = foundry.data.fields;

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
    const res = super.getImpactMessage();
    if (this.roll.botchCheck && this.roll.botches > 0) {
      res.innerHTML += `<br/>${game.i18n.format("arm5e.messages.die.warpGain", {
        num: this.roll.botches
      })} `;
    }
    return res;
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
    const contentDiv = html.getElementsByClassName("message-content")[0];

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
