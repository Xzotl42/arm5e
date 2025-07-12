import { log, sleep } from "../tools.js";
import { getCompanion, getLab, getMagus, newSpell1 } from "./testData.js";
import { ArsLayer } from "../ui/ars-layer.js";
import { ARM5E } from "../config.js";
import Aura from "../helpers/aura.js";
import { VisExtractionActivity } from "../seasonal-activities/labActivity.js";

// import { Quench } from "../quench.js";

const diaryTemplate = {
  name: `Placeholder`,
  type: "diaryEntry",
  system: {
    done: false,
    cappedGain: false,
    sourceQuality: 240,
    activity: "none",
    progress: {
      abilities: [],
      arts: [],
      spells: [],
      newSpells: []
    },
    optionKey: "standard",
    duration: 60,
    description: `Some description`,
    externalIds: []
  }
};

async function addProgressItem(entry, type, defaultItem, sheetData) {
  const event = {
    preventDefault: () => {},
    currentTarget: {
      dataset: {
        type: type,
        action: "add",
        default: defaultItem,
        secondary: "false",
        teacherscore: sheetData.system.teacherScore
      }
    }
  };

  return await entry.sheet._onProgressControl(event);
}

export function registerVisTesting(quench) {
  quench.registerBatch(
    "Ars-Vis",
    (context) => {
      const { describe, it, assert, expect, should, beforeEach, afterEach } = context;
      let actor;
      let magus;
      let lab;
      let entry;
      let result;
      let event;
      beforeEach(async function () {
        actor = await getCompanion(`BobTheCompanion`);
        ArsLayer.clearAura(true);
        magus = await getMagus("Tiberius");
        lab = await getLab("The lair of Tiberius");
        await magus.addActiveEffect("Affinity Corpus", "affinity", "co", 1.5, null);
        await magus.addActiveEffect("Puissant Muto", "art", "mu", 3, null);
        await magus.addActiveEffect("Deficient Perdo", "deficiency", "pe", undefined, null);
        await lab.sheet.setOwner(magus);

        // diaryTemplate.system.activity = "visExtraction";
        // diaryTemplate.system.sourceQuality = 3;
        // entry = await magus.createEmbeddedDocuments("Item", [diaryTemplate], {});
        // assert.equal(entry.length, 1, "Item created");
        // entry = entry[0];
        event = { dataset: {} };
      });

      describe("Vis extraction nominal", function () {
        it("Extraction Nominal", async function () {
          await lab.sheet._resetPlanning("visExtraction");
          await lab.sheet.getData();
          entry = await lab.sheet._schedule();
          let sheet = entry.sheet;
          // const activity = new VisExtractionActivity(lab, magus);

          const sheetData = await sheet.getData();
          log(false, JSON.stringify(sheetData.system));
          // sheet._tabs[0].activate("advanced");
          expect(entry.system.done).to.equal(false);
          expect(entry.system.dates.length).to.equal(1);

          expect(entry.system.progress.abilities.length).to.equal(0);
          expect(entry.system.progress.spells.length).to.equal(0);
          expect(entry.system.progress.arts.length).to.equal(0);
          expect(entry.system.progress.newSpells.length).to.equal(0);

          result = await sheet._onProgressApply(event, false);

          expect(entry.system.achievements[0].type).to.equal("vis");
          const visId = entry.system.achievements[0]._id;

          expect(magus.items.has(visId));
          let visItem = magus.items.get(visId);
          expect(visItem.system.quantity == 2);
          expect(visItem.system.art == "vi");
          await sheet._onProgressRollback(undefined, false);

          expect(!magus.items.has(visId));

          expect(!magus.items.has(entry._id));
          // expect(ability.system.xp).to.equal(oldXp);
          // // log(false, JSON.stringify(sheetData));
          // await entry.update({ "system.progress.abilities": [] });
          assert.ok(true);
          // sheet.close();
        });
      });
      describe("Vis extraction nominal", function () {
        it("Vis study", async function () {
          await lab.sheet._resetPlanning("visStudy");
          await lab.sheet.getData();
          entry = await lab.sheet._schedule();
          let sheet = entry.sheet;
          // const activity = new VisExtractionActivity(lab, magus);

          const sheetData = await sheet.getData();
          log(false, JSON.stringify(sheetData.system));
          // sheet._tabs[0].activate("advanced");
          expect(entry.system.done).to.equal(false);
          expect(entry.system.dates.length).to.equal(1);

          expect(entry.system.progress.abilities.length).to.equal(0);
          expect(entry.system.progress.spells.length).to.equal(0);
          expect(entry.system.progress.arts.length).to.equal(0);
          expect(entry.system.progress.newSpells.length).to.equal(0);

          result = await sheet._onProgressApply(event, false);

          expect(entry.system.achievements[0].type).to.equal("vis");
          const visId = entry.system.achievements[0]._id;

          expect(magus.items.has(visId));
          let visItem = magus.items.get(visId);
          expect(visItem.system.quantity == 2);
          expect(visItem.system.art == "vi");
          await sheet._onProgressRollback(undefined, false);

          expect(!magus.items.has(visId));

          expect(!magus.items.has(entry._id));
          // expect(ability.system.xp).to.equal(oldXp);
          // // log(false, JSON.stringify(sheetData));
          // await entry.update({ "system.progress.abilities": [] });
          assert.ok(true);
          // sheet.close();
        });
      });

      afterEach(async function () {
        if (actor) {
          await actor.delete();
        }
        if (magus) {
          await magus.delete();
        }

        if (lab) {
          await lab.delete();
        }
      });
    },
    { displayName: "ARS : Diary vis activities" }
  );
}
