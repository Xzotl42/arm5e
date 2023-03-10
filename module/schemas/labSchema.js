import { log } from "../tools.js";
import { actorBase } from "./actorCommonSchema.js";
import { basicTextField } from "./commonSchemas.js";
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

const actorLink = () => {
  return new fields.SchemaField({
    value: new fields.StringField({ required: false, blank: true, initial: "" }),
    actorId: new fields.StringField({ required: false, blank: true, initial: "" }),
    linked: new fields.BooleanField({ required: false, initial: false })
  });
};


export class LabSchema extends foundry.abstract.DataModel {
  // TODO remove in V11
  static _enableV10Validation = true;

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

    let labAttributes = items.filter(i => {
      return (
        i.type === "sanctumRoom" ||
        i.type === "distinctive" ||
        i.type === "speciality" ||
        i.type === "personality"
      );
    });

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
