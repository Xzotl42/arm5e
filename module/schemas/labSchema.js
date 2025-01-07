import { log } from "../tools.js";
import { actorBase } from "./actorCommonSchema.js";
import { actorLink, basicTextField } from "./commonSchemas.js";
const fields = foundry.data.fields;

const labAttribute = () => {
  return new fields.SchemaField({
    description: new fields.StringField({ required: false, blank: true, initial: "" }),
    value: new fields.NumberField({
      required: false,
      nullable: false,
      integer: true,
      initial: 0,
      step: 1
    })
  });
};

export class LabSchema extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: new fields.StringField({ required: false, blank: true, initial: "" }),
      source: new fields.StringField({ required: false, initial: "custom" }),
      page: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        initial: 0,
        min: 0,
        step: 1
      }),
      indexKey: new fields.StringField({ required: false, blank: true, initial: "" }),
      review_status: new fields.StringField({
        required: false,
        blank: true,
        initial: "toReview",
        choices: Object.keys(CONFIG.ARM5E.generic.reviewStatus)
      }),
      reviewer: new fields.StringField({ required: false, blank: true, initial: "" }),
      owner: actorLink(),
      covenant: actorLink(),
      location: new fields.StringField({ required: false, blank: true, initial: "" }),
      size: labAttribute(),
      generalQuality: labAttribute(),
      safety: labAttribute(),
      health: labAttribute(),
      refinement: labAttribute(),
      upkeep: labAttribute(),
      warping: labAttribute(),
      aesthetics: labAttribute(),
      specialties: basicTextField(),
      features: basicTextField(),
      rooms: basicTextField(),
      personalities: basicTextField()
    };
  }

  get buildPoints() {
    let res = 50;
    if (this.parent?.system.virtues) {
      for (let virtue of this.parent.system.virtues) {
        if (virtue.system.impact.value == "minor") {
          res += 10;
        } else if (virtue.system.impact.value == "major") {
          res += 20;
        }
      }
    }
    if (this.parent?.system.flaws) {
      for (let flaw of this.parent.system.flaws) {
        if (flaw.system.impact.value == "minor") {
          res -= 10;
        } else if (flaw.system.impact.value == "major") {
          res -= 20;
        }
      }
    }
    return Math.max(0, res + this.size.total * 20);
  }

  static migrate(data, itemsData) {
    const updateData = {};
    let items = Array.isArray(itemsData) ? itemsData : itemsData.toObject();
    if (data.system.salubrity) {
      updateData["system.health"] = data.system.salubrity;
      updateData["system.-=salubrity"] = null;
    }
    if (data.system.improvement) {
      updateData["system.refinement"] = data.system.improvement;
      updateData["system.-=improvement"] = null;
    }
    if (data.system.security) {
      updateData["system.safety"] = data.system.security;
      updateData["system.-=security"] = null;
    }
    if (data.system.maintenance) {
      updateData["system.upkeep"] = data.system.maintenance;
      updateData["system.-=maintenance"] = null;
    }

    if (
      data.system.covenant?.value &&
      (data.system.covenant.actorId == null || data.system.covenant.actorId === "")
    ) {
      let cov = game.actors.filter(
        (a) => a.type == "covenant" && a.name == data.system.covenant.value
      );
      if (cov.length > 0) {
        updateData["system.covenant.actorId"] = cov[0]._id;
      }
    }

    if (
      data.system.owner?.value &&
      (data.system.owner.actorId == null || data.system.owner.actorId === "")
    ) {
      let cov = game.actors.filter(
        (a) => ["player", "npc"].includes(a.type) && a.name == data.system.owner.value
      );
      if (cov.length > 0) {
        updateData["system.owner.actorId"] = cov[0]._id;
      }
    }

    let labAttributes = items.filter((i) => {
      return (
        i.type === "sanctumRoom" ||
        i.type === "distinctive" ||
        i.type === "speciality" ||
        i.type === "personality"
      );
    });

    // updateData["system.page"] = convertToNumber(data.system.generalQuality.total, 0);

    let specialties = "";
    let personalities = "";
    let features = "";
    let rooms = "";
    for (let a of labAttributes) {
      switch (a.type) {
        case "speciality":
          specialties += `<li><b>${a.name}</b> (${a.system.points}) : ${a.system.description}</li>`;
          break;
        case "distinctive":
          features += `<li><b>${a.name}</b> (${a.system.foco})<br/> (${a.system.speciality} ${a.system.bonus})  : ${a.system.description}</li>`;
          break;
        case "personality":
          personalities += `<li><b>${a.name}</b> (${a.system.points}) : ${a.system.description}</li>`;
          break;
        case "sanctumRoom":
          rooms += `<li><b>${a.name}</b> (${a.system.size}) : ${a.system.description}</li>`;
          break;
      }
    }
    if (specialties !== "") {
      updateData["system.specialties"] = `<ul>${specialties}</ul>`;
    }

    if (features !== "") {
      updateData["system.features"] = `<ul>${features}</ul>`;
    }

    if (personalities !== "") {
      updateData["system.personalities"] = `<ul>${personalities}</ul>`;
    }

    if (rooms !== "") {
      updateData["system.rooms"] = `<ul>${rooms}</ul>`;
    }

    return updateData;
  }

  //   static migrateData(data) {}
}
