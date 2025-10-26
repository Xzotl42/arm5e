import Aura from "../helpers/aura.js";
import { compareTopics, log } from "../tools.js";
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

  prepareBaseData() {
    this.size.bonus = 0;
    this.generalQuality.bonus = 0;
    this.safety.bonus = 0;
    this.health.bonus = 0;
    this.refinement.bonus = 0;
    this.upkeep.bonus = 0;
    this.warping.bonus = 0;
    this.aesthetics.bonus = 0;
    this.aesthetics.max = 999;
    this.auraBonus = 0;

    // Create data keys for lab specialty
    this.specialty = {};
    for (let key of Object.keys(CONFIG.ARM5E.magic.arts)) {
      this.specialty[key] = { bonus: 0 };
    }

    this.specialty.experimentation = { bonus: 0 };
    this.specialty.familiar = { bonus: 0 };
    this.specialty.items = { bonus: 0 };
    this.specialty.longevityRituals = { bonus: 0 };
    this.specialty.spells = { bonus: 0 };
    this.specialty.texts = { bonus: 0 };
    this.specialty.visExtraction = { bonus: 0 };

    this.owner.document = game.actors.get(this.owner.actorId);
    if (this.owner.document) {
      this.owner.value = this.owner.document.name;
      this.owner.linked = true;
    } else {
      this.owner.linked = false;
    }

    this.covenant.document = game.actors.get(this.covenant.actorId);
    if (this.covenant.document) {
      this.covenant.value = this.covenant.document.name;
      this.covenant.linked = true;
    } else {
      this.covenant.linked = false;
    }

    // Hopefully this can be reworked to use ID instead of name
    this.aura = new Aura(this.covenant.document?.system?.scene?.id);
  }

  prepareDerivedData() {
    this.physicalBooks = [];
    this.artsTopics = [];
    this.mundaneTopics = [];
    this.masteryTopics = [];
    this.laboratoryTexts = [];
    this.totalVirtues = 0;
    this.totalFlaws = 0;
    // TODO TMP
    this.specialities_old = [];
    this.personalities_old = [];
    this.distinctive = [];
    this.rooms_old = [];
    // TODO END

    this.rawVis = [];
    this.items = [];
    this.virtues = [];
    this.flaws = [];
    this.diaryEntries = [];
    this.laboratoryTexts = [];

    for (let [key, item] of this.parent.items.entries()) {
      // TODO TMP
      if (item.type === "speciality") {
        this.specialities_old.push(item);
      } else if (item.type === "distinctive") {
        this.distinctive.push(item);
      } else if (item.type === "sanctumRoom") {
        this.rooms_old.push(item);
      } else if (item.type === "personality") {
        this.personalities_old.push(item);
      } else if (item.type === "book") {
        let idx = 0;
        for (let topic of item.system.topics) {
          topic.id = item.id;
          topic.img = item.img;
          topic.index = idx++;
          topic.book = item.name;
          switch (topic.category) {
            case "ability":
              this.mundaneTopics.push(topic);
              break;
            case "art":
              this.artsTopics.push(topic);
              break;
            case "mastery":
              this.masteryTopics.push(topic);
              break;
            case "labText":
              topic.system = topic.labtext;
              if (topic.labtext != null) {
                topic.name = `${topic.book}: ${topic.labtextTitle}`;
              }
              this.laboratoryTexts.push(topic);
              break;
            default:
              error(false, `Unknown topic category${topic.category}`);
          }
        }
        this.physicalBooks.push(item);
      } else if (item.type === "laboratoryText") {
        let topic = {
          id: item.id,
          img: item.img,
          index: 0,
          book: "",
          category: "labText",
          name: item.name,
          system: item.system
        };

        this.laboratoryTexts.push(topic);
      } else if (item.type === "vis") {
        this.rawVis.push(item);
      } else if (item.type === "item") {
        this.items.push(item);
      } else if (item.type === "virtue") {
        this.virtues.push(item);
        if (CONFIG.ARM5E.impacts[item.system.impact.value]) {
          this.totalVirtues += CONFIG.ARM5E.impacts[item.system.impact.value].cost;
        }
      } else if (item.type === "flaw") {
        this.flaws.push(item);
        if (CONFIG.ARM5E.impacts[item.system.impact.value]) {
          this.totalFlaws += CONFIG.ARM5E.impacts[item.system.impact.value].cost;
        }
      } else if (item.type === "diaryEntry") {
        this.diaryEntries.push(item);
      }
    }
    this.virtues.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    this.flaws.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    this.rawVis.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    this.items.sort((a, b) => (a.sort || 0) - (b.sort || 0));

    this.physicalBooks.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    this.artsTopics.sort(compareTopics);
    this.mundaneTopics.sort(compareTopics);
    this.masteryTopics.sort(compareTopics);
    this.laboratoryTexts.sort(compareTopics);

    this.size.total = this.size.value + this.size.bonus;
    this.generalQuality.total = this.generalQuality.value + this.generalQuality.bonus;

    this.health.total = this.health.value + this.health.bonus;
    this.refinement.total = this.refinement.value + this.refinement.bonus;
    this.upkeep.total = this.upkeep.value + this.upkeep.bonus;
    this.warping.total = this.warping.value + this.warping.bonus;
    this.aesthetics.total = Math.min(
      this.aesthetics.value + this.aesthetics.bonus,
      this.aesthetics.max
    );

    this.freeVirtues = this.size.total + this.refinement.total;
    this.occupiedSize = Math.max(this.totalVirtues - this.totalFlaws, 0) - this.refinement.total;
    this.baseSafety = this.refinement.total - Math.max(this.occupiedSize, 0);
    this.safety.bonus += this.baseSafety;
    this.safety.total = this.safety.value + this.safety.bonus;
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
