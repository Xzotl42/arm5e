import { log, sleep } from "../tools/tools.js";
import { getCompanion, getMagus, getTeacher } from "./testData.js";
import { ArsLayer } from "../ui/ars-layer.js";
import { ARM5E } from "../config.js";
import Aura from "../helpers/aura.js";

// import { Quench } from "../quench.js";

const diaryTemplate = {
  name: `Placeholder`,
  type: "diaryEntry",
  system: {
    done: false,
    cappedGain: false,
    sourceQuality: 5,
    activity: "none",
    progress: {
      abilities: [],
      arts: [],
      spells: [],
      newSpells: []
    },
    optionKey: "standard",
    duration: 1,
    description: `Some description`,
    externalIds: []
  }
};

async function addProgressItem(entry, type, defaultItem) {
  const event = {
    preventDefault: () => {},
    currentTarget: {
      dataset: {
        type: type,
        action: "add",
        default: defaultItem,
        secondary: "false",
        teacherscore: entry.system.teacher.score
      }
    }
  };

  return await entry.sheet._onProgressControl(event);
}

export function registerTrainingTesting(quench) {
  quench.registerBatch(
    "Ars-training",
    (context) => {
      const { describe, it, assert, expect, should, before, after } = context;
      let actor;
      let magus;
      let teacher;
      let entry;
      let magusToken;
      let activityBonusAE;
      let activityBonusAETeacher;
      let result;
      let event = {};
      beforeEach(async function () {
        actor = await getCompanion(`BobTheCompanion`);
        ArsLayer.clearAura(true);
        magus = await getMagus("Tiberius");
        teacher = await getTeacher("Master on the hill");
        await magus.addActiveEffect("Affinity Corpus", "affinity", "co", 1.5, null);
        await magus.addActiveEffect("Puissant Muto", "art", "mu", 3, null);
        await magus.addActiveEffect("Deficient Perdo", "deficiency", "pe", undefined, null);
        diaryTemplate.system.activity = "training";
        entry = await magus.createEmbeddedDocuments("Item", [diaryTemplate], {});
        assert.equal(entry.length, 1, "Item created");
        entry = entry[0];
      });
      describe("DEBUG", function () {
        it("Dummy", async function () {
          assert.ok(true);
        });
      });
      describe("Training nominal", function () {
        it("Single Ability", async function () {
          let sheet = entry.sheet;
          const sheetData = await entry.sheet.getData();
          event.qualitymod = sheetData.system.sourceModifier;
          expect(entry.system.done).to.equal(false);
          expect(entry.system.dates.length).to.equal(1);

          expect(entry.system.progress.abilities.length).to.equal(0);
          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("arm5e.activity.msg.uselessTeacher");
          await sheet._setTeacher(teacher);

          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("arm5e.activity.msg.noProgressItems");

          const ability = magus.system.abilities[2];
          const oldXp = ability.system.xp;
          let teacherSkill = await teacher.getAbilityStats(
            ability.system.key,
            ability.system.option
          );
          let progressItemCol = await addProgressItem(
            entry,
            "abilities",
            ability._id,
            teacherSkill.score
          );
          expect(entry.system.progress.spells.length).to.equal(0);
          expect(entry.system.progress.arts.length).to.equal(0);
          expect(entry.system.progress.newSpells.length).to.equal(0);
          expect(entry.system.progress.abilities.length).to.equal(1);
          let progressItem = entry.system.progress.abilities[0];

          expect(progressItem.teacherScore).to.equal(teacherSkill.score);
          // assign xp

          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("");

          expect(ability.system.xp).to.equal(oldXp + progressItem.xp);

          await sheet._onProgressRollback(undefined, false);
          expect(ability.system.xp).to.equal(oldXp);
          // log(false, JSON.stringify(sheetData));
          await entry.sheet._resetTeacher();
          assert.ok(true);
        });
        it("Single spell", async function () {
          let sheet = entry.sheet;
          expect(entry.system.done).to.equal(false);
          expect(entry.system.dates.length).to.equal(1);
          const sheetData = await entry.sheet.getData();
          event.qualitymod = sheetData.system.sourceModifier;
          expect(entry.system.progress.abilities.length).to.equal(0);

          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("arm5e.activity.msg.uselessTeacher");
          await sheet._setTeacher(teacher);

          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("arm5e.activity.msg.noProgressItems");
          const spell = magus.items.get(entry.system.defaultSpellMastery);
          const oldXp = spell.system.xp;
          let progressItemCol = await addProgressItem(entry, "spells", spell._id);
          expect(entry.system.progress.spells.length).to.equal(1);
          expect(entry.system.progress.arts.length).to.equal(0);
          expect(entry.system.progress.newSpells.length).to.equal(0);
          expect(entry.system.progress.abilities.length).to.equal(0);

          let progressItem = entry.system.progress.spells[0];
          let teacherSpell = await teacher.items.getName(spell.name);
          expect(progressItem.teacherScore).to.equal(teacherSpell.system.finalScore);
          // assign xp

          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("");

          expect(spell.system.xp).to.equal(oldXp + progressItem.xp);

          await sheet._onProgressRollback(undefined, false);
          expect(spell.system.xp).to.equal(oldXp);
          // log(false, JSON.stringify(sheetData));
          await entry.sheet._resetTeacher();
          // await entry.update({ "system.progress.spells": [] });
          assert.ok(true);
        });
      });
      describe("Training capped", function () {
        it("Single Ability", async function () {
          let sheet = entry.sheet;
          const sheetData = await entry.sheet.getData();
          event.qualitymod = sheetData.system.sourceModifier;

          expect(entry.system.done).to.equal(false);
          expect(entry.system.dates.length).to.equal(1);

          expect(entry.system.progress.abilities.length).to.equal(0);

          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("arm5e.activity.msg.uselessTeacher");
          await sheet._setTeacher(teacher);

          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("arm5e.activity.msg.noProgressItems");
          const ability = magus.system.abilities[0];
          let teacherSkill = await teacher.getAbilityStats(
            ability.system.key,
            ability.system.option
          );
          let teacherXp = ((teacherSkill.score * (teacherSkill.score + 1)) / 2) * 5;
          await magus.updateEmbeddedDocuments("Item", [
            { _id: ability._id, "system.xp": teacherXp - 5 }
          ]);
          const oldXp = ability.system.xp;
          let progressItemCol = await addProgressItem(entry, "abilities", ability._id);
          expect(entry.system.progress.spells.length).to.equal(0);
          expect(entry.system.progress.arts.length).to.equal(0);
          expect(entry.system.progress.newSpells.length).to.equal(0);
          expect(entry.system.progress.abilities.length).to.equal(1);
          let progressItem = entry.system.progress.abilities[0];
          expect(progressItem.teacherScore).to.equal(teacherSkill.score);
          // assign xp

          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("arm5e.activity.msg.gainCapped");

          expect(ability.system.xp).to.equal(oldXp + progressItem.xp);

          await sheet._onProgressRollback(undefined, false);
          expect(ability.system.xp).to.equal(oldXp);
          // log(false, JSON.stringify(sheetData));
          await entry.sheet._resetTeacher();
          assert.ok(true);
        });
        it("Single spell", async function () {
          let sheet = entry.sheet;
          expect(entry.system.done).to.equal(false);
          expect(entry.system.dates.length).to.equal(1);
          const sheetData = await entry.sheet.getData();
          event.qualitymod = sheetData.system.sourceModifier;
          expect(entry.system.progress.abilities.length).to.equal(0);

          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("arm5e.activity.msg.uselessTeacher");
          await sheet._setTeacher(teacher);

          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("arm5e.activity.msg.noProgressItems");
          const spell = magus.items.get(entry.system.defaultSpellMastery);
          let teacherSpell = await teacher.items.getName(spell.name);
          await magus.updateEmbeddedDocuments("Item", [
            { _id: spell._id, "system.xp": teacherSpell.system.xp - 5 }
          ]);
          const oldXp = spell.system.xp;
          let progressItemCol = await addProgressItem(entry, "spells", spell._id);
          expect(entry.system.progress.spells.length).to.equal(1);
          expect(entry.system.progress.arts.length).to.equal(0);
          expect(entry.system.progress.newSpells.length).to.equal(0);
          expect(entry.system.progress.abilities.length).to.equal(0);

          let progressItem = entry.system.progress.spells[0];

          expect(progressItem.teacherScore).to.equal(teacherSpell.system.finalScore);
          // assign xp

          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("arm5e.activity.msg.gainCapped");

          expect(spell.system.xp).to.equal(teacherSpell.system.xp - 5 + progressItem.xp);

          await sheet._onProgressRollback(undefined, false);
          expect(spell.system.xp).to.equal(oldXp);
          // log(false, JSON.stringify(sheetData));
          await entry.sheet._resetTeacher();
          // await entry.update({ "system.progress.spells": [] });
          assert.ok(true);
        });
      });
      describe("Training with unlinked teacher", function () {
        it("Single Ability", async function () {
          let sheet = entry.sheet;
          const sheetData = await entry.sheet.getData();
          event.qualitymod = sheetData.system.sourceModifier;
          expect(entry.system.done).to.equal(false);
          expect(entry.system.dates.length).to.equal(1);

          expect(entry.system.progress.abilities.length).to.equal(0);

          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("arm5e.activity.msg.uselessTeacher");
          await entry.update({ "system.teacher.score": 6 });
          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("arm5e.activity.msg.noProgressItems");
          const ability = magus.system.abilities[0];
          const oldXp = ability.system.xp;
          let progressItemCol = await addProgressItem(entry, "abilities", ability._id);
          expect(entry.system.progress.spells.length).to.equal(0);
          expect(entry.system.progress.arts.length).to.equal(0);
          expect(entry.system.progress.newSpells.length).to.equal(0);
          expect(entry.system.progress.abilities.length).to.equal(1);
          let progressItem = entry.system.progress.abilities[0];
          expect(progressItem.teacherScore).to.equal(entry.system.teacher.score);
          // assign xp

          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("");

          expect(ability.system.xp).to.equal(oldXp + progressItem.xp);

          await sheet._onProgressRollback(undefined, false);
          expect(ability.system.xp).to.equal(oldXp);
          // log(false, JSON.stringify(sheetData));
          await entry.update({ "system.progress.abilities": [] });
          assert.ok(true);
        });
        it("Single spell", async function () {
          let sheet = entry.sheet;
          expect(entry.system.done).to.equal(false);
          expect(entry.system.dates.length).to.equal(1);
          const sheetData = await entry.sheet.getData();
          event.qualitymod = sheetData.system.sourceModifier;
          expect(entry.system.progress.abilities.length).to.equal(0);

          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("arm5e.activity.msg.uselessTeacher");
          await entry.update({ "system.teacher.score": 6 });

          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("arm5e.activity.msg.noProgressItems");
          const spell = magus.items.get(entry.system.defaultSpellMastery);
          const oldXp = spell.system.xp;
          let progressItemCol = await addProgressItem(
            entry,
            "spells",
            entry.system.defaultSpellMastery
          );
          expect(entry.system.progress.spells.length).to.equal(1);
          expect(entry.system.progress.arts.length).to.equal(0);
          expect(entry.system.progress.newSpells.length).to.equal(0);
          expect(entry.system.progress.abilities.length).to.equal(0);

          let progressItem = entry.system.progress.spells[0];
          expect(progressItem.teacherScore).to.equal(entry.system.teacher.score);
          // assign xp

          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("");

          expect(spell.system.xp).to.equal(oldXp + progressItem.xp);

          await sheet._onProgressRollback(undefined, false);
          expect(spell.system.xp).to.equal(oldXp);
          // log(false, JSON.stringify(sheetData));
          await entry.sheet._resetTeacher();
          assert.ok(true);
        });
      });
      describe("Training with capped source and unlinked", function () {
        it("Single Ability", async function () {
          let sheet = entry.sheet;
          const sheetData = await entry.sheet.getData();
          event.qualitymod = sheetData.system.sourceModifier;
          expect(entry.system.done).to.equal(false);
          expect(entry.system.dates.length).to.equal(1);

          expect(entry.system.progress.abilities.length).to.equal(0);

          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("arm5e.activity.msg.uselessTeacher");
          let teacherScore = 5;
          let teacherXp = ((teacherScore * (teacherScore + 1)) / 2) * 5;
          await entry.update({ "system.teacher.score": teacherScore });

          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("arm5e.activity.msg.noProgressItems");
          const ability = magus.system.abilities[0];

          let progressItemCol = await addProgressItem(entry, "abilities", ability._id);
          await magus.updateEmbeddedDocuments("Item", [
            { _id: ability._id, "system.xp": teacherXp - 5 }
          ]);
          const oldXp = ability.system.xp;
          expect(entry.system.progress.spells.length).to.equal(0);
          expect(entry.system.progress.arts.length).to.equal(0);
          expect(entry.system.progress.newSpells.length).to.equal(0);
          expect(entry.system.progress.abilities.length).to.equal(1);
          let progressItem = entry.system.progress.abilities[0];

          expect(progressItem.teacherScore).to.equal(entry.system.teacher.score);
          // assign xp

          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("arm5e.activity.msg.gainCapped");

          expect(ability.system.xp).to.equal(oldXp + progressItem.xp);

          await sheet._onProgressRollback(undefined, false);
          expect(ability.system.xp).to.equal(oldXp);
          // log(false, JSON.stringify(sheetData));
          await entry.sheet._resetTeacher();
          assert.ok(true);
        });
        it("Single spell", async function () {
          let sheet = entry.sheet;
          let teacherScore = 6;
          expect(entry.system.done).to.equal(false);
          expect(entry.system.dates.length).to.equal(1);
          const sheetData = await entry.sheet.getData();
          event.qualitymod = sheetData.system.sourceModifier;
          expect(entry.system.progress.abilities.length).to.equal(0);

          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("arm5e.activity.msg.uselessTeacher");
          await entry.update({ "system.teacher.score": teacherScore });

          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("arm5e.activity.msg.noProgressItems");
          const spell = magus.items.get(entry.system.defaultSpellMastery);

          let teacherXp = ((teacherScore * (teacherScore + 1)) / 2) * 5;
          await entry.update({ "system.teacher.score": teacherScore });

          let progressItemCol = await addProgressItem(
            entry,
            "spells",
            entry.system.defaultSpellMastery
          );
          await magus.updateEmbeddedDocuments("Item", [
            { _id: spell._id, "system.xp": teacherXp - 5 }
          ]);
          const oldXp = spell.system.xp;
          expect(entry.system.progress.spells.length).to.equal(1);
          expect(entry.system.progress.arts.length).to.equal(0);
          expect(entry.system.progress.newSpells.length).to.equal(0);
          expect(entry.system.progress.abilities.length).to.equal(0);

          let progressItem = entry.system.progress.spells[0];
          expect(progressItem.teacherScore).to.equal(entry.system.teacher.score);
          // assign xp

          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("arm5e.activity.msg.gainCapped");

          expect(spell.system.xp).to.equal(oldXp + progressItem.xp);
          expect(entry.system.done).to.equal(true);
          await sheet._onProgressRollback(undefined, false);
          expect(spell.system.xp).to.equal(oldXp);
          // log(false, JSON.stringify(sheetData));
          await entry.update({ "system.progress.spells": [] });
          await entry.sheet._resetTeacher();
          assert.ok(true);
        });
      });
      describe("Training nominal with AE", function () {
        it("Single Ability", async function () {
          let sheet = entry.sheet;

          activityBonusAE = await magus.addActiveEffect(
            "Bonus training",
            "activities",
            "training",
            3,
            null
          );
          activityBonusAE = activityBonusAE[0]._id;
          activityBonusAETeacher = await teacher.addActiveEffect(
            "Bonus training",
            "activities",
            "teacher",
            5,
            null
          );
          activityBonusAETeacher = activityBonusAETeacher[0]._id;

          const sheetData = await entry.sheet.getData();
          event.qualitymod = sheetData.system.sourceModifier;
          expect(entry.system.done).to.equal(false);
          expect(entry.system.dates.length).to.equal(1);

          expect(entry.system.progress.abilities.length).to.equal(0);

          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("arm5e.activity.msg.uselessTeacher");
          await sheet._setTeacher(teacher);

          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("arm5e.activity.msg.noProgressItems");
          const ability = magus.system.abilities[0];

          await magus.updateEmbeddedDocuments("Item", [{ _id: ability._id, "system.xp": 30 }]);
          const oldXp = ability.system.xp;
          let teacherSkill = await teacher.getAbilityStats(
            ability.system.key,
            ability.system.option
          );
          let progressItemCol = await addProgressItem(
            entry,
            "abilities",
            ability._id,
            teacherSkill.score
          );
          expect(entry.system.progress.spells.length).to.equal(0);
          expect(entry.system.progress.arts.length).to.equal(0);
          expect(entry.system.progress.newSpells.length).to.equal(0);
          expect(entry.system.progress.abilities.length).to.equal(1);
          let progressItem = entry.system.progress.abilities[0];

          expect(progressItem.teacherScore).to.equal(teacherSkill.score);
          // assign xp

          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("");

          expect(ability.system.xp).to.equal(oldXp + progressItem.xp);

          await sheet._onProgressRollback(undefined, false);
          expect(ability.system.xp).to.equal(oldXp);
          // log(false, JSON.stringify(sheetData));
          await entry.sheet._resetTeacher();
          assert.ok(true);
        });
        it("Single spell", async function () {
          let sheet = entry.sheet;
          activityBonusAE = await magus.addActiveEffect(
            "Bonus training",
            "activities",
            "training",
            3,
            null
          );
          activityBonusAE = activityBonusAE[0]._id;
          activityBonusAETeacher = await teacher.addActiveEffect(
            "Bonus training",
            "activities",
            "teacher",
            5,
            null
          );
          activityBonusAETeacher = activityBonusAETeacher[0]._id;

          const sheetData = await entry.sheet.getData();
          event.qualitymod = sheetData.system.sourceModifier;

          expect(entry.system.done).to.equal(false);
          expect(entry.system.dates.length).to.equal(1);

          expect(entry.system.progress.abilities.length).to.equal(0);

          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("arm5e.activity.msg.uselessTeacher");
          await sheet._setTeacher(teacher);

          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("arm5e.activity.msg.noProgressItems");
          const spell = magus.items.get(entry.system.defaultSpellMastery);
          await magus.updateEmbeddedDocuments("Item", [{ _id: spell._id, "system.xp": 30 }]);
          const oldXp = spell.system.xp;
          let progressItemCol = await addProgressItem(entry, "spells", spell._id);
          expect(entry.system.progress.spells.length).to.equal(1);
          expect(entry.system.progress.arts.length).to.equal(0);
          expect(entry.system.progress.newSpells.length).to.equal(0);
          expect(entry.system.progress.abilities.length).to.equal(0);

          let progressItem = entry.system.progress.spells[0];
          let teacherSpell = await teacher.items.getName(spell.name);
          expect(progressItem.teacherScore).to.equal(teacherSpell.system.finalScore);
          // assign xp

          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("");

          expect(spell.system.xp).to.equal(oldXp + progressItem.xp);

          await sheet._onProgressRollback(undefined, false);
          expect(spell.system.xp).to.equal(oldXp);
          // log(false, JSON.stringify(sheetData));
          await entry.sheet._resetTeacher();
          // await entry.update({ "system.progress.spells": [] });
          assert.ok(true);
        });
      });
      describe("Training capped  with AE", function () {
        it("Single Ability", async function () {
          let sheet = entry.sheet;
          activityBonusAE = await magus.addActiveEffect(
            "Bonus training",
            "activities",
            "training",
            3,
            null
          );
          activityBonusAE = activityBonusAE[0]._id;
          activityBonusAETeacher = await teacher.addActiveEffect(
            "Bonus training",
            "activities",
            "teacher",
            5,
            null
          );
          activityBonusAETeacher = activityBonusAETeacher[0]._id;

          const sheetData = await entry.sheet.getData();
          event.qualitymod = sheetData.system.sourceModifier;
          expect(entry.system.done).to.equal(false);
          expect(entry.system.dates.length).to.equal(1);

          expect(entry.system.progress.abilities.length).to.equal(0);

          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("arm5e.activity.msg.uselessTeacher");
          await sheet._setTeacher(teacher);

          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("arm5e.activity.msg.noProgressItems");
          const ability = magus.system.abilities[0];
          let teacherSkill = await teacher.getAbilityStats(
            ability.system.key,
            ability.system.option
          );
          let teacherXp = ((teacherSkill.score * (teacherSkill.score + 1)) / 2) * 5;
          await magus.updateEmbeddedDocuments("Item", [
            { _id: ability._id, "system.xp": teacherXp - 5 }
          ]);
          const oldXp = ability.system.xp;
          let progressItemCol = await addProgressItem(entry, "abilities", ability._id);
          expect(entry.system.progress.spells.length).to.equal(0);
          expect(entry.system.progress.arts.length).to.equal(0);
          expect(entry.system.progress.newSpells.length).to.equal(0);
          expect(entry.system.progress.abilities.length).to.equal(1);
          let progressItem = entry.system.progress.abilities[0];
          expect(progressItem.teacherScore).to.equal(teacherSkill.score);
          // assign xp

          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("arm5e.activity.msg.gainCapped");

          expect(ability.system.xp).to.equal(oldXp + progressItem.xp);

          await sheet._onProgressRollback(undefined, false);
          expect(ability.system.xp).to.equal(oldXp);
          // log(false, JSON.stringify(sheetData));
          await entry.sheet._resetTeacher();
          assert.ok(true);
        });
        it("Single Ability 2", async function () {
          let sheet = entry.sheet;
          activityBonusAE = await magus.addActiveEffect(
            "Bonus training",
            "activities",
            "training",
            3,
            null
          );
          activityBonusAE = activityBonusAE[0]._id;
          activityBonusAETeacher = await teacher.addActiveEffect(
            "Bonus training",
            "activities",
            "teacher",
            5,
            null
          );
          activityBonusAETeacher = activityBonusAETeacher[0]._id;

          const sheetData = await entry.sheet.getData();
          event.qualitymod = sheetData.system.sourceModifier;
          expect(entry.system.done).to.equal(false);
          expect(entry.system.dates.length).to.equal(1);

          expect(entry.system.progress.abilities.length).to.equal(0);

          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("arm5e.activity.msg.uselessTeacher");
          await sheet._setTeacher(teacher);

          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("arm5e.activity.msg.noProgressItems");
          const ability = magus.system.abilities[0];
          let teacherSkill = await teacher.getAbilityStats(
            ability.system.key,
            ability.system.option
          );
          let teacherXp = ((teacherSkill.score * (teacherSkill.score + 1)) / 2) * 5;
          await magus.updateEmbeddedDocuments("Item", [
            { _id: ability._id, "system.xp": teacherXp - 10 }
          ]);
          const oldXp = ability.system.xp;
          let progressItemCol = await addProgressItem(entry, "abilities", ability._id);
          expect(entry.system.progress.spells.length).to.equal(0);
          expect(entry.system.progress.arts.length).to.equal(0);
          expect(entry.system.progress.newSpells.length).to.equal(0);
          expect(entry.system.progress.abilities.length).to.equal(1);
          let progressItem = entry.system.progress.abilities[0];
          expect(progressItem.teacherScore).to.equal(teacherSkill.score);
          // assign xp

          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("arm5e.activity.msg.gainCapped");

          expect(ability.system.xp).to.equal(oldXp + progressItem.xp);

          await sheet._onProgressRollback(undefined, false);
          expect(ability.system.xp).to.equal(oldXp);
          // log(false, JSON.stringify(sheetData));
          await entry.sheet._resetTeacher();
          assert.ok(true);
        });
        it("Single spell", async function () {
          let sheet = entry.sheet;

          activityBonusAE = await magus.addActiveEffect(
            "Bonus training",
            "activities",
            "training",
            3,
            null
          );
          activityBonusAE = activityBonusAE[0]._id;
          activityBonusAETeacher = await teacher.addActiveEffect(
            "Bonus training",
            "activities",
            "teacher",
            5,
            null
          );
          activityBonusAETeacher = activityBonusAETeacher[0]._id;

          const sheetData = await entry.sheet.getData();
          event.qualitymod = sheetData.system.sourceModifier;
          expect(entry.system.done).to.equal(false);
          expect(entry.system.dates.length).to.equal(1);

          expect(entry.system.progress.abilities.length).to.equal(0);

          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("arm5e.activity.msg.uselessTeacher");
          await sheet._setTeacher(teacher);

          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("arm5e.activity.msg.noProgressItems");
          const spell = magus.items.get(entry.system.defaultSpellMastery);
          let teacherSpell = await teacher.items.getName(spell.name);

          let progressItemCol = await addProgressItem(
            entry,
            "spells",
            entry.system.defaultSpellMastery
          );
          await magus.updateEmbeddedDocuments("Item", [
            { _id: spell._id, "system.xp": teacherSpell.system.xp - 5 }
          ]);

          const oldXp = spell.system.xp;
          expect(entry.system.progress.spells.length).to.equal(1);
          expect(entry.system.progress.arts.length).to.equal(0);
          expect(entry.system.progress.newSpells.length).to.equal(0);
          expect(entry.system.progress.abilities.length).to.equal(0);

          let progressItem = entry.system.progress.spells[0];
          expect(progressItem.teacherScore).to.equal(teacherSpell.system.finalScore);
          // assign xp

          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("arm5e.activity.msg.gainCapped");

          expect(spell.system.xp).to.equal(oldXp + progressItem.xp);

          await sheet._onProgressRollback(undefined, false);
          expect(spell.system.xp).to.equal(oldXp);
          // log(false, JSON.stringify(sheetData));
          await entry.sheet._resetTeacher();
          // await entry.update({ "system.progress.spells": [] });
          assert.ok(true);
        });
      });
      describe("Training with unlinked teacher  with AE", function () {
        it("Single Ability", async function () {
          let sheet = entry.sheet;
          activityBonusAE = await magus.addActiveEffect(
            "Bonus training",
            "activities",
            "training",
            3,
            null
          );
          activityBonusAE = activityBonusAE[0]._id;
          activityBonusAETeacher = await teacher.addActiveEffect(
            "Bonus training",
            "activities",
            "teacher",
            5,
            null
          );
          activityBonusAETeacher = activityBonusAETeacher[0]._id;

          const sheetData = await entry.sheet.getData();
          event.qualitymod = sheetData.system.sourceModifier;
          expect(entry.system.done).to.equal(false);
          expect(entry.system.dates.length).to.equal(1);

          expect(entry.system.progress.abilities.length).to.equal(0);

          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("arm5e.activity.msg.uselessTeacher");
          await entry.update({ "system.teacher.score": 6 });
          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("arm5e.activity.msg.noProgressItems");
          const ability = magus.system.abilities[0];
          const oldXp = ability.system.xp;
          let progressItemCol = await addProgressItem(entry, "abilities", ability._id);
          expect(entry.system.progress.spells.length).to.equal(0);
          expect(entry.system.progress.arts.length).to.equal(0);
          expect(entry.system.progress.newSpells.length).to.equal(0);
          expect(entry.system.progress.abilities.length).to.equal(1);
          let progressItem = entry.system.progress.abilities[0];
          expect(progressItem.teacherScore).to.equal(entry.system.teacher.score);
          // assign xp

          result = await sheet._onProgressApply(event, false);

          expect(result.system.applyError).to.equal("");

          expect(ability.system.xp).to.equal(oldXp + progressItem.xp);

          await sheet._onProgressRollback(undefined, false);
          expect(ability.system.xp).to.equal(oldXp);
          // log(false, JSON.stringify(sheetData));
          await entry.update({ "system.progress.abilities": [] });
          assert.ok(true);
        });
        it("Single spell", async function () {
          let sheet = entry.sheet;
          activityBonusAE = await magus.addActiveEffect(
            "Bonus training",
            "activities",
            "training",
            3,
            null
          );
          activityBonusAE = activityBonusAE[0]._id;
          activityBonusAETeacher = await teacher.addActiveEffect(
            "Bonus training",
            "activities",
            "teacher",
            5,
            null
          );
          activityBonusAETeacher = activityBonusAETeacher[0]._id;

          const sheetData = await entry.sheet.getData();
          event.qualitymod = sheetData.system.sourceModifier;
          expect(entry.system.done).to.equal(false);
          expect(entry.system.dates.length).to.equal(1);

          expect(entry.system.progress.abilities.length).to.equal(0);

          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("arm5e.activity.msg.uselessTeacher");
          await entry.update({ "system.teacher.score": 6 });

          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("arm5e.activity.msg.noProgressItems");
          const spell = magus.items.get(entry.system.defaultSpellMastery);
          let progressItemCol = await addProgressItem(
            entry,
            "spells",
            entry.system.defaultSpellMastery
          );
          let teacherSpell = await teacher.items.getName(spell.name);
          await magus.updateEmbeddedDocuments("Item", [
            { _id: spell._id, "system.xp": teacherSpell.system.xp - 5 }
          ]);

          const oldXp = spell.system.xp;
          expect(entry.system.progress.spells.length).to.equal(1);
          expect(entry.system.progress.arts.length).to.equal(0);
          expect(entry.system.progress.newSpells.length).to.equal(0);
          expect(entry.system.progress.abilities.length).to.equal(0);

          let progressItem = entry.system.progress.spells[0];
          expect(progressItem.teacherScore).to.equal(entry.system.teacher.score);
          // assign xp

          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("");

          expect(spell.system.xp).to.equal(oldXp + progressItem.xp);

          await sheet._onProgressRollback(undefined, false);
          expect(spell.system.xp).to.equal(oldXp);
          // log(false, JSON.stringify(sheetData));
          await entry.sheet._resetTeacher();
          assert.ok(true);
        });
      });
      describe("Training with capped source, with AE and unlinked", function () {
        it("Single Ability", async function () {
          let sheet = entry.sheet;
          activityBonusAE = await magus.addActiveEffect(
            "Bonus training",
            "activities",
            "training",
            3,
            null
          );
          activityBonusAE = activityBonusAE[0]._id;
          activityBonusAETeacher = await teacher.addActiveEffect(
            "Bonus training",
            "activities",
            "teacher",
            5,
            null
          );
          activityBonusAETeacher = activityBonusAETeacher[0]._id;

          const sheetData = await entry.sheet.getData();
          event.qualitymod = sheetData.system.sourceModifier;
          expect(entry.system.done).to.equal(false);
          expect(entry.system.dates.length).to.equal(1);

          expect(entry.system.progress.abilities.length).to.equal(0);

          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("arm5e.activity.msg.uselessTeacher");
          let teacherScore = 5;
          let teacherXp = ((teacherScore * (teacherScore + 1)) / 2) * 5;
          await entry.update({ "system.teacher.score": teacherScore });

          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("arm5e.activity.msg.noProgressItems");
          const ability = magus.system.abilities[0];

          let progressItemCol = await addProgressItem(entry, "abilities", ability._id);
          await magus.updateEmbeddedDocuments("Item", [
            { _id: ability._id, "system.xp": teacherXp - 5 }
          ]);
          const oldXp = ability.system.xp;
          expect(entry.system.progress.spells.length).to.equal(0);
          expect(entry.system.progress.arts.length).to.equal(0);
          expect(entry.system.progress.newSpells.length).to.equal(0);
          expect(entry.system.progress.abilities.length).to.equal(1);
          let progressItem = entry.system.progress.abilities[0];

          expect(progressItem.teacherScore).to.equal(entry.system.teacher.score);
          // assign xp

          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("arm5e.activity.msg.gainCapped");

          expect(ability.system.xp).to.equal(oldXp + progressItem.xp);

          await sheet._onProgressRollback(undefined, false);
          expect(ability.system.xp).to.equal(oldXp);
          // log(false, JSON.stringify(sheetData));
          await entry.sheet._resetTeacher();
          assert.ok(true);
        });
        it("Single spell", async function () {
          let sheet = entry.sheet;
          activityBonusAE = await magus.addActiveEffect(
            "Bonus training",
            "activities",
            "training",
            3,
            null
          );
          activityBonusAE = activityBonusAE[0]._id;
          activityBonusAETeacher = await teacher.addActiveEffect(
            "Bonus training",
            "activities",
            "teacher",
            5,
            null
          );
          activityBonusAETeacher = activityBonusAETeacher[0]._id;

          const sheetData = await entry.sheet.getData();
          event.qualitymod = sheetData.system.sourceModifier;
          let teacherScore = 6;
          expect(entry.system.done).to.equal(false);
          expect(entry.system.dates.length).to.equal(1);

          expect(entry.system.progress.abilities.length).to.equal(0);

          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("arm5e.activity.msg.uselessTeacher");
          await entry.update({ "system.teacher.score": teacherScore });

          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("arm5e.activity.msg.noProgressItems");
          const spell = magus.items.get(entry.system.defaultSpellMastery);

          let teacherXp = ((teacherScore * (teacherScore + 1)) / 2) * 5;
          await entry.update({ "system.teacher.score": teacherScore });

          let progressItemCol = await addProgressItem(
            entry,
            "spells",
            entry.system.defaultSpellMastery
          );
          await magus.updateEmbeddedDocuments("Item", [
            { _id: spell._id, "system.xp": teacherXp - 5 }
          ]);
          const oldXp = spell.system.xp;
          expect(entry.system.progress.spells.length).to.equal(1);
          expect(entry.system.progress.arts.length).to.equal(0);
          expect(entry.system.progress.newSpells.length).to.equal(0);
          expect(entry.system.progress.abilities.length).to.equal(0);

          let progressItem = entry.system.progress.spells[0];
          expect(progressItem.teacherScore).to.equal(entry.system.teacher.score);
          // assign xp

          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("arm5e.activity.msg.gainCapped");

          expect(spell.system.xp).to.equal(oldXp + progressItem.xp);

          await sheet._onProgressRollback(undefined, false);
          expect(spell.system.xp).to.equal(oldXp);
          // log(false, JSON.stringify(sheetData));
          await entry.update({ "system.progress.spells": [] });
          assert.ok(true);
        });
        it("Single spell 2", async function () {
          let sheet = entry.sheet;
          activityBonusAE = await magus.addActiveEffect(
            "Bonus training",
            "activities",
            "training",
            3,
            null
          );
          activityBonusAE = activityBonusAE[0]._id;

          const sheetData = await entry.sheet.getData();
          event.qualitymod = sheetData.system.sourceModifier;
          let teacherScore = 5;
          expect(entry.system.done).to.equal(false);
          expect(entry.system.dates.length).to.equal(1);

          expect(entry.system.progress.abilities.length).to.equal(0);

          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("arm5e.activity.msg.uselessTeacher");
          await entry.update({ "system.teacher.score": teacherScore });

          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("arm5e.activity.msg.noProgressItems");
          const spell = magus.items.get(entry.system.defaultSpellMastery);

          let teacherXp = ((teacherScore * (teacherScore + 1)) / 2) * 5;
          await entry.update({ "system.teacher.score": teacherScore });

          let progressItemCol = await addProgressItem(
            entry,
            "spells",
            entry.system.defaultSpellMastery
          );
          await magus.updateEmbeddedDocuments("Item", [
            { _id: spell._id, "system.xp": teacherXp - 10 }
          ]);
          const oldXp = spell.system.xp;
          expect(entry.system.progress.spells.length).to.equal(1);
          expect(entry.system.progress.arts.length).to.equal(0);
          expect(entry.system.progress.newSpells.length).to.equal(0);
          expect(entry.system.progress.abilities.length).to.equal(0);

          let progressItem = entry.system.progress.spells[0];
          expect(progressItem.teacherScore).to.equal(entry.system.teacher.score);
          // assign xp

          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("arm5e.activity.msg.gainCapped");

          expect(spell.system.xp).to.equal(oldXp + progressItem.xp);

          await sheet._onProgressRollback(undefined, false);
          expect(spell.system.xp).to.equal(oldXp);
          // log(false, JSON.stringify(sheetData));
          await entry.update({ "system.progress.spells": [] });
          assert.ok(true);
        });
      });
      afterEach(async function () {
        if (actor) {
          await actor.delete();
        }
        if (magusToken) {
          await magusToken.delete();
        }
        if (magus) {
          await magus.delete();
        }

        if (teacher) {
          await teacher.delete();
        }
      });
    },
    { displayName: "ARS : Diary Training" }
  );
}
