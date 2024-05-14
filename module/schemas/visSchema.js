import { ARM5E } from "../config.js";
import { stressDie } from "../dice.js";
import Aura from "../helpers/aura.js";
import { setVisStudyResults } from "../helpers/long-term-activities.js";
import { convertToNumber, log } from "../tools.js";
import {
  boolOption,
  convertToInteger,
  CostField,
  itemBase,
  SeasonField,
  XpField
} from "./commonSchemas.js";
const fields = foundry.data.fields;

export class VisSchema extends foundry.abstract.DataModel {
  // TODO remove in V11
  static _enableV10Validation = true;

  static defineSchema() {
    return {
      ...itemBase(),
      art: new fields.StringField({
        required: false,
        blank: false,
        initial: "cr",
        choices: Object.keys(ARM5E.magic.arts)
      }),
      pawns: new fields.NumberField({
        // DEPRECATED use quantity instead
        required: false,
        nullable: true,
        min: 0,
        initial: null,
        step: 1
      }),
      quantity: new fields.NumberField({
        required: false,
        nullable: true,
        integer: true,
        min: 0, // allow quantity of 0 to keep an eye on what is missing
        initial: 1,
        step: 1
      }),
      cost: CostField("priceless")
    };
  }

  static migrateData(data) {
    if (data.art?.value) {
      data.art = data.art.value;
    }
    return data;
  }

  static migrate(itemData) {
    const updateData = {
      type: "vis"
    };
    if (itemData.system.art.value !== undefined) {
      updateData["system.art"] = itemData.system.art.value;
    } else if (itemData.system.art == "") {
      updateData["system.art"] = "cr";
    }
    // get ride of form of vis field
    if (
      itemData.system.form != undefined &&
      itemData.system.form !== "Physical form of the raw vis." &&
      itemData.system.form !== ""
    ) {
      updateData["system.description"] = itemData.system.description + itemData.system.form;
      updateData["system.-=form"] = null;
    }

    if (itemData.system.pawns) {
      updateData["system.quantity"] = convertToNumber(itemData.system.pawns, 1);
      updateData["system.pawns"] = null;
    }
    return updateData;
  }

  hasQuantity() {
    return { name: "quantity", qty: this.quantity };
  }

  async studyVis(item) {
    const actor = item.actor;
    let artStats = actor.getArtStats(this.art);
    let amount = Math.max(1, Math.ceil(artStats.derivedScore / 5));
    if (amount > this.quantity) {
      ui.notifications.info(
        game.i18n.format("arm5e.notification.noEnoughVis", { name: actor.name })
      );
      return;
    }
    let aura = 0;
    if (actor.system.covenant.linked) {
      const covenant = actor.system.covenant.document;
      let aura = new Aura(covenant.system.scene.id);
      aura.computeMaxAuraModifier(actor.system.realms);
    }
    let dialogData = {
      aura: aura,
      amount: amount,
      art: CONFIG.ARM5E.magic.arts[this.art].label,
      bonusActiveEffects: actor.system.bonuses.activities.visStudy
    };
    let auraLabel = game.i18n.localize("arm5e.sheet.aura");
    let dataset = {
      roll: "option",
      name: "",
      physicalcondition: false,
      moredata: { id: this.parent._id, art: this.art, amount: amount, diaryId: item._id }
    };
    actor.rollInfo.init(dataset, actor);
    const html = await renderTemplate("systems/arm5e/templates/generic/vis-study.html", dialogData);
    new Dialog(
      {
        title: game.i18n.localize("arm5e.activity.visStudy"),
        content: html,
        buttons: {
          yes: {
            icon: "<i class='fas fa-check'></i>",
            label: game.i18n.localize("arm5e.dialog.button.roll"),
            callback: async (html) => {
              let val = html.find('input[name="aura"]');
              actor.rollInfo.setGenericField(auraLabel, Number(val.val()), 1, "+");
              await stressDie(actor, dataset.roll, 0, setVisStudyResults);
            }
          }
        },
        default: "yes",
        close: null
      },
      {
        jQuery: true,
        height: "140px",
        classes: ["arm5e-dialog", "dialog"]
      }
    ).render(true);
  }

  async createDiaryEntry(actor) {
    let currentDate = game.settings.get("arm5e", "currentDate");
    const entryData = [
      {
        name: game.i18n.format("arm5e.activity.title.visStudy", {
          art: game.i18n.localize(CONFIG.ARM5E.magic.arts[this.art].label)
        }),
        type: "diaryEntry",
        system: {
          done: false,
          rollDone: false,
          cappedGain: false,
          dates: [{ season: currentDate.season, date: "", year: currentDate.year, applied: true }],
          sourceQuality: 0,
          activity: "visStudy",
          progress: {
            abilities: [],
            arts: [],
            spells: [],
            newSpells: []
          },
          optionKey: "standard",
          duration: 1,
          externalIds: [
            {
              actorId: actor.id,
              itemId: this.parent._id,
              flags: 1
            }
          ]
        }
      }
    ];
    let entry = await actor.createEmbeddedDocuments("Item", entryData, {});
    return entry[0];
  }
}

export class VisSourceSchema extends foundry.abstract.DataModel {
  // TODO remove in V11
  static _enableV10Validation = true;

  static defineSchema() {
    return {
      ...itemBase(),
      art: new fields.StringField({
        required: false,
        blank: false,
        initial: "cr",
        choices: Object.keys(ARM5E.magic.arts)
      }),
      visLabel: new fields.StringField({
        required: false,
        blank: true,
        initial: ""
      }),
      form: new fields.StringField({
        required: false,
        blank: true,
        initial: ""
      }),
      place: new fields.StringField({
        required: false,
        blank: true,
        initial: ""
      }),
      season: SeasonField(),
      pawns: new fields.NumberField({
        required: false,
        nullable: true,
        min: 0,
        initial: null,
        step: 1
      }),
      yearHarvested: new fields.NumberField({
        required: false,
        nullable: true,
        integer: true,
        initial: null,
        step: 1
      })
    };
  }

  async harvest() {
    if (!this.parent.isOwned) {
      return;
    }

    const covenantVis = this.parent.actor.system.vis;

    const existingReserve = covenantVis.filter((e) => {
      return e.system.art == this.art && e.name == this.visLabel;
    });
    if (existingReserve.length) {
      // update existing Vis pile
      const vis = structuredClone(existingReserve[0]);
      const updateData = {
        _id: existingReserve[0]._id,
        "system.quantity": vis.system.quantity + this.pawns
      };
      await this.parent.actor.updateEmbeddedDocuments("Item", [updateData]);
      this.parent.actor.sheet.render(false);
      return;
    } else {
      let desc;
      if (this.form == "") {
        desc = game.i18n.format("arm5e.sheet.visDesc", {
          covenant: this.parent.actor.name,
          name: this.parent.name
        });
      } else {
        desc = this.form;
      }
      let name;
      if (this.visLabel == "") {
        name = this.parent.name;
      } else {
        name = this.visLabel;
      }

      const vis = {
        name: name,
        type: "vis",
        system: {
          art: this.art,
          quantity: this.pawns,
          description: desc
        }
      };
      return await this.parent.actor.createEmbeddedDocuments("Item", [vis]);
    }

    //TODO check the year harvested
  }

  static migrateData(data) {
    return data;
  }

  static migrate(itemData) {
    const updateData = {};
    return updateData;
  }
}
