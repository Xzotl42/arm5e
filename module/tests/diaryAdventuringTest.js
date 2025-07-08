import { log } from "../tools.js";
import { getCompanion, getMagus } from "./testData.js";
import { ArsLayer } from "../ui/ars-layer.js";
import { ARM5E } from "../config.js";
import Aura from "../helpers/aura.js";
import { getAbilityFromCompendium } from "../tools/compendia.js";

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

export function registerAdventuringTesting(quench) {
  quench.registerBatch(
    "Ars-adventuring",
    (context) => {
      const { describe, it, assert, expect, should, beforeEach, afterEach } = context;
      let actor;
      let magus;
      let entry;
      let magusToken;
      let aura;
      let activityBonusAE;
      let result;
      let event;

      beforeEach(async function () {
        actor = await getCompanion(`BobTheCompanion`);
        // ArsLayer.clearAura(true);
        magus = await getMagus("Tiberius");

        await magus.addActiveEffect("Affinity Corpus", "affinity", "co", 1.5, null);
        await magus.addActiveEffect("Puissant Muto", "art", "mu", 3, null);
        await magus.addActiveEffect("Deficient Perdo", "deficiency", "pe", undefined, null);

        diaryTemplate.system.activity = "adventuring";
        entry = await magus.createEmbeddedDocuments("Item", [diaryTemplate], {});
        assert.equal(entry.length, 1, "Item created");
        entry = entry[0];
        event = {};
      });

      describe("Adventuring nominal", function () {
        it("Single Ability", async function () {
          let sheet = entry.sheet;

          const sheetData = await entry.sheet.getData();
          log(false, JSON.stringify(sheetData.system));
          // sheet._tabs[0].activate("advanced");
          expect(entry.system.done).to.equal(false);
          expect(entry.system.dates.length).to.equal(1);

          expect(entry.system.progress.abilities.length).to.equal(0);
          const ability = magus.system.abilities[0];
          const oldXp = ability.system.xp;
          let progressItemCol = await addProgressItem(entry, "abilities", ability._id, sheetData);
          expect(entry.system.progress.spells.length).to.equal(0);
          expect(entry.system.progress.arts.length).to.equal(0);
          expect(entry.system.progress.newSpells.length).to.equal(0);
          expect(entry.system.progress.abilities.length).to.equal(1);

          result = await sheet._onProgressApply(event, false);

          expect(result.system.applyError).to.equal("arm5e.activity.msg.wrongTotalXp");

          // assign xp
          progressItemCol[0].xp = 99;
          await entry.update({ "system.progress.abilities": progressItemCol });
          result = await sheet._onProgressApply(event, false);

          expect(result.system.applyError).to.equal("arm5e.activity.msg.wrongSingleItemXp");
          progressItemCol[0].xp = entry.system.sourceQuality + result.system.sourceModifier;
          await entry.update({ "system.progress.abilities": progressItemCol });

          result = await sheet._onProgressApply(event, false);

          expect(result.system.applyError).to.equal("");

          expect(ability.system.xp).to.equal(oldXp + 5);

          await sheet._onProgressRollback(undefined, false);
          expect(ability.system.xp).to.equal(oldXp);
          // log(false, JSON.stringify(sheetData));
          await entry.update({ "system.progress.abilities": [] });
          assert.ok(true);
          sheet.close();
        });
        it("Multiple Abilities", async function () {
          let sheet = entry.sheet;

          const sheetData = await entry.sheet.getData();
          log(false, JSON.stringify(sheetData.system));
          // sheet._tabs[0].activate("advanced");
          expect(entry.system.done).to.equal(false);
          expect(entry.system.dates.length).to.equal(1);

          expect(entry.system.progress.abilities.length).to.equal(0);
          const abilities = [magus.system.abilities[0]];
          abilities.push(await getAbilityFromCompendium("areaLore", "Geneva"));
          const oldXps = [abilities[0].system.xp, 0];
          let progressItemCol = await addProgressItem(
            entry,
            "abilities",
            abilities[0]._id,
            sheetData
          );

          entry.sheet._addAbility(abilities[1]);

          const progressAbilities = foundry.utils.duplicate(entry.system.progress.abilities);
          expect(entry.system.progress.spells.length).to.equal(0);
          expect(entry.system.progress.arts.length).to.equal(0);
          expect(entry.system.progress.newSpells.length).to.equal(0);
          expect(entry.system.progress.abilities.length).to.equal(2);

          result = await sheet._onProgressApply(event, false);

          expect(result.system.applyError).to.equal("arm5e.activity.msg.wrongTotalXp");

          // assign xp

          progressAbilities[0].xp = 99;
          await entry.update({ "system.progress.abilities": progressAbilities });
          result = await sheet._onProgressApply(event, false);

          expect(result.system.applyError).to.equal("arm5e.activity.msg.wrongSingleItemXp");
          progressAbilities[0].xp = 3 + result.system.sourceModifier;
          progressAbilities[1].xp = 2;
          await entry.update({ "system.progress.abilities": progressAbilities });

          result = await sheet._onProgressApply(event, false);

          expect(result.system.applyError).to.equal("");

          expect(abilities[0].system.xp).to.equal(oldXps[0] + 3);
          abilities[1] = magus.getAbility("areaLore", "Geneva");
          expect(abilities[1] != undefined);
          expect(abilities[1].system.xp).to.equal(oldXps[1] + 2);

          await sheet._onProgressRollback(undefined, false);
          expect(abilities[0].system.xp).to.equal(oldXps[0]);
          expect(abilities[1].system.xp).to.equal(oldXps[1]);
          // log(false, JSON.stringify(sheetData));
          await entry.update({ "system.progress.abilities": [] });
          assert.ok(true);
          sheet.close();
        });

        it("Single spell", async function () {
          let sheet = entry.sheet;

          const sheetData = await entry.sheet.getData();
          log(false, JSON.stringify(sheetData.system));
          expect(entry.system.done).to.equal(false);
          expect(entry.system.dates.length).to.equal(1);

          expect(entry.system.progress.spells.length).to.equal(0);
          const spell = magus.items.get(sheetData.system.defaultSpellMastery);
          const oldXp = spell.system.xp;
          let progressItemCol = await addProgressItem(
            entry,
            "spells",
            sheetData.system.defaultSpellMastery,
            sheetData
          );
          expect(entry.system.progress.spells.length).to.equal(1);
          expect(entry.system.progress.arts.length).to.equal(0);
          expect(entry.system.progress.newSpells.length).to.equal(0);
          expect(entry.system.progress.abilities.length).to.equal(0);

          result = await sheet._onProgressApply(event, false);

          expect(result.system.applyError).to.equal("arm5e.activity.msg.wrongTotalXp");

          // assign xp
          progressItemCol[0].xp = 99;
          await entry.update({ "system.progress.spells": progressItemCol });
          result = await sheet._onProgressApply(event, false);

          expect(result.system.applyError).to.equal("arm5e.activity.msg.wrongSingleItemXp");
          progressItemCol[0].xp = entry.system.sourceQuality + result.system.sourceModifier;
          await entry.update({ "system.progress.spells": progressItemCol });
          // if (entry.system.applyError != "") {
          //   console.warn(entry.system.applyError);
          // }

          result = await sheet._onProgressApply(event, false);

          expect(result.system.applyError).to.equal("");

          expect(spell.system.xp).to.equal(oldXp + 5);

          await sheet._onProgressRollback(undefined, false);
          expect(spell.system.xp).to.equal(oldXp);
          // log(false, JSON.stringify(sheetData));
          await entry.update({ "system.progress.spells": [] });
          assert.ok(true);
          sheet.close();
        });
        it("Single Art", async function () {
          let sheet = entry.sheet;

          const sheetData = await entry.sheet.getData();
          log(false, JSON.stringify(sheetData.system));
          expect(entry.system.done).to.equal(false);
          expect(entry.system.dates.length).to.equal(1);

          expect(entry.system.progress.arts.length).to.equal(0);
          const art = magus.system.arts.techniques.mu;
          const oldXp = art.xp;
          let arts = await addProgressItem(entry, "arts", "mu", sheetData);
          expect(entry.system.progress.spells.length).to.equal(0);
          expect(entry.system.progress.arts.length).to.equal(1);
          expect(entry.system.progress.newSpells.length).to.equal(0);
          expect(entry.system.progress.abilities.length).to.equal(0);

          result = await sheet._onProgressApply(event, false);

          expect(result.system.applyError).to.equal("arm5e.activity.msg.wrongTotalXp");

          // assign xp
          arts[0].xp = 99;
          await entry.update({ "system.progress.arts": arts });
          result = await sheet._onProgressApply(event, false);

          expect(result.system.applyError).to.equal("arm5e.activity.msg.wrongSingleItemXp");

          arts[0].xp = entry.system.sourceQuality + result.system.sourceModifier;
          await entry.update({ "system.progress.arts": arts });
          // if (entry.system.applyError != "") {
          //   console.warn(entry.system.applyError);
          // }

          result = await sheet._onProgressApply(event, false);

          expect(result.system.applyError).to.equal("");
          expect(magus.system.arts.techniques.mu.xp).to.equal(oldXp + 5);

          await sheet._onProgressRollback(undefined, false);
          expect(art.xp).to.equal(oldXp);
          await entry.update({ "system.progress.arts": [] });
          assert.ok(true);
          sheet.close();
        });
        it("Combo", async function () {
          await entry.update({ "system.sourceQuality": 15 });
          let sheet = entry.sheet;

          const sheetData = await entry.sheet.getData();
          log(false, JSON.stringify(sheetData.system));
          expect(entry.system.done).to.equal(false);
          expect(entry.system.dates.length).to.equal(1);
          expect(entry.system.progress.spells.length).to.equal(0);
          const ability = magus.system.abilities[0];
          const oldXpAb = ability.system.xp;
          const spell = magus.system.spells[0];
          const oldXpSpell = spell.system.xp;
          const oldXpArt = magus.system.arts.forms.me.xp;
          let spells = await addProgressItem(entry, "spells", spell._id, sheetData);
          let abilities = await addProgressItem(entry, "abilities", ability._id, sheetData);
          let arts = await addProgressItem(entry, "arts", "me", sheetData);

          expect(entry.system.progress.spells.length).to.equal(1);
          expect(entry.system.progress.arts.length).to.equal(1);
          expect(entry.system.progress.newSpells.length).to.equal(0);
          expect(entry.system.progress.abilities.length).to.equal(1);

          result = await sheet._onProgressApply(event, false);

          expect(result.system.applyError).to.equal("arm5e.activity.msg.wrongTotalXp");

          // assign xp
          abilities[0].xp = 5;
          await entry.update({ "system.progress.abilities": abilities });
          result = await sheet._onProgressApply(event, false);

          expect(result.system.applyError).to.equal("arm5e.activity.msg.wrongTotalXp");
          spells[0].xp = 5;
          await entry.update({ "system.progress.spells": spells });
          result = await sheet._onProgressApply(event, false);

          expect(result.system.applyError).to.equal("arm5e.activity.msg.wrongTotalXp");
          arts[0].xp = 5;
          await entry.update({ "system.progress.arts": arts });
          result = await sheet._onProgressApply(event, false);

          expect(result.system.applyError).to.equal("");

          expect(ability.system.xp).to.equal(oldXpAb + 5);
          expect(spell.system.xp).to.equal(oldXpSpell + 5);
          expect(magus.system.arts.forms.me.xp).to.equal(oldXpArt + 5);

          await sheet._onProgressRollback(undefined, false);
          expect(ability.system.xp).to.equal(oldXpAb);
          expect(spell.system.xp).to.equal(oldXpSpell);
          expect(magus.system.arts.forms.me.xp).to.equal(oldXpArt);
          // log(false, JSON.stringify(sheetData));

          assert.ok(true);
          await sheet.resetProgress(5);
        });
      });

      describe("Adventuring with AE bonus", function () {
        it("Single Ability", async function () {
          let sheet = entry.sheet;
          await entry.update({ "system.sourceQuality": 2 });
          activityBonusAE = await magus.addActiveEffect(
            "Bonus adventuring",
            "activities",
            "adventuring",
            3,
            null
          );
          activityBonusAE = activityBonusAE[0]._id;
          const sheetData = await entry.sheet.getData();
          log(false, JSON.stringify(sheetData.system));
          // sheet._tabs[0].activate("advanced");
          expect(entry.system.done).to.equal(false);
          expect(entry.system.dates.length).to.equal(1);
          expect(entry.system.progress.abilities.length).to.equal(0);
          const ability = magus.system.abilities[0];
          const oldXp = ability.system.xp;
          let progressItemCol = await addProgressItem(entry, "abilities", ability._id, sheetData);
          expect(entry.system.progress.spells.length).to.equal(0);
          expect(entry.system.progress.arts.length).to.equal(0);
          expect(entry.system.progress.newSpells.length).to.equal(0);
          expect(entry.system.progress.abilities.length).to.equal(1);
          event.qualitymod = result.system.sourceModifier;
          result = await sheet._onProgressApply(event, false);
          event.qualitymod = result.system.sourceModifier;
          expect(result.system.applyError).to.equal("arm5e.activity.msg.wrongTotalXp");

          // assign xp
          progressItemCol[0].xp = 99;
          await entry.update({ "system.progress.abilities": progressItemCol });
          result = await sheet._onProgressApply(event, false);

          expect(result.system.applyError).to.equal("arm5e.activity.msg.wrongSingleItemXp");
          progressItemCol[0].xp = entry.system.sourceQuality + result.system.sourceModifier;
          await entry.update({ "system.progress.abilities": progressItemCol });

          result = await sheet._onProgressApply(event, false);

          expect(result.system.applyError).to.equal("");
          // await entry.sheet.render(true);
          expect(ability.system.xp).to.equal(
            oldXp + entry.system.sourceQuality + result.system.sourceModifier
          );

          await sheet._onProgressRollback(undefined, false);
          expect(ability.system.xp).to.equal(oldXp);
          // log(false, JSON.stringify(sheetData));
          await entry.update({ "system.progress.abilities": [] });
          assert.ok(true);
          sheet.close();
        });
        it("Single spell", async function () {
          let sheet = entry.sheet;
          await entry.update({ "system.sourceQuality": 2 });
          activityBonusAE = await magus.addActiveEffect(
            "Bonus adventuring",
            "activities",
            "adventuring",
            3,
            null
          );
          const sheetData = await entry.sheet.getData();
          event.qualitymod = sheetData.system.sourceModifier;
          log(false, JSON.stringify(sheetData.system));
          expect(entry.system.done).to.equal(false);
          expect(entry.system.dates.length).to.equal(1);

          expect(entry.system.progress.spells.length).to.equal(0);
          const spell = magus.items.get(sheetData.system.defaultSpellMastery);
          const oldXp = spell.system.xp;
          let progressItemCol = await addProgressItem(
            entry,
            "spells",
            sheetData.system.defaultSpellMastery,
            sheetData
          );
          expect(entry.system.progress.spells.length).to.equal(1);
          expect(entry.system.progress.arts.length).to.equal(0);
          expect(entry.system.progress.newSpells.length).to.equal(0);
          expect(entry.system.progress.abilities.length).to.equal(0);

          result = await sheet._onProgressApply(event, false);

          expect(result.system.applyError).to.equal("arm5e.activity.msg.wrongTotalXp");

          // assign xp
          progressItemCol[0].xp = 99;
          await entry.update({ "system.progress.spells": progressItemCol });
          result = await sheet._onProgressApply(event, false);

          expect(result.system.applyError).to.equal("arm5e.activity.msg.wrongSingleItemXp");
          progressItemCol[0].xp = entry.system.sourceQuality + result.system.sourceModifier;
          await entry.update({ "system.progress.spells": progressItemCol });
          // if (entry.system.applyError != "") {
          //   console.warn(entry.system.applyError);
          // }

          result = await sheet._onProgressApply(event, false);

          expect(result.system.applyError).to.equal("");

          expect(spell.system.xp).to.equal(
            oldXp + entry.system.sourceQuality + result.system.sourceModifier
          );

          await sheet._onProgressRollback(undefined, false);
          expect(spell.system.xp).to.equal(oldXp);
          // log(false, JSON.stringify(sheetData));
          await entry.update({ "system.progress.spells": [] });
          assert.ok(true);
          sheet.close();
        });
        it("Single Art", async function () {
          let sheet = entry.sheet;
          await entry.update({ "system.sourceQuality": 2 });
          activityBonusAE = await magus.addActiveEffect(
            "Bonus adventuring",
            "activities",
            "adventuring",
            3,
            null
          );
          const sheetData = await entry.sheet.getData();
          log(false, JSON.stringify(sheetData.system));
          expect(entry.system.done).to.equal(false);
          expect(entry.system.dates.length).to.equal(1);

          expect(entry.system.progress.arts.length).to.equal(0);
          const art = magus.system.arts.techniques.mu;
          const oldXp = art.xp;
          let arts = await addProgressItem(entry, "arts", "mu", sheetData);
          expect(entry.system.progress.spells.length).to.equal(0);
          expect(entry.system.progress.arts.length).to.equal(1);
          expect(entry.system.progress.newSpells.length).to.equal(0);
          expect(entry.system.progress.abilities.length).to.equal(0);

          result = await sheet._onProgressApply(event, false);

          expect(result.system.applyError).to.equal("arm5e.activity.msg.wrongTotalXp");

          // assign xp
          arts[0].xp = 99;
          await entry.update({ "system.progress.arts": arts });
          result = await sheet._onProgressApply(event, false);

          expect(result.system.applyError).to.equal("arm5e.activity.msg.wrongSingleItemXp");

          arts[0].xp = entry.system.sourceQuality + result.system.sourceModifier;
          await entry.update({ "system.progress.arts": arts });
          // if (entry.system.applyError != "") {
          //   console.warn(entry.system.applyError);
          // }

          result = await sheet._onProgressApply(event, false);

          expect(result.system.applyError).to.equal("");
          expect(magus.system.arts.techniques.mu.xp).to.equal(oldXp + 5);

          await sheet._onProgressRollback(undefined, false);
          expect(art.xp).to.equal(oldXp);
          await entry.update({ "system.progress.arts": [] });
          sheet.close();
        });
        it("Combo", async function () {
          await entry.update({ "system.sourceQuality": 12 });
          let sheet = entry.sheet;
          activityBonusAE = await magus.addActiveEffect(
            "Bonus adventuring",
            "activities",
            "adventuring",
            3,
            null
          );
          activityBonusAE = activityBonusAE[0];
          const sheetData = await entry.sheet.getData();
          const ability = magus.system.abilities[0];
          const oldXpAb = ability.system.xp;
          const spell = magus.system.spells[0];
          const oldXpSpell = spell.system.xp;
          const oldXpArt = magus.system.arts.forms.me.xp;

          log(false, JSON.stringify(sheetData.system));
          expect(entry.system.done).to.equal(false);
          expect(entry.system.dates.length).to.equal(1);

          expect(entry.system.progress.spells.length).to.equal(0);
          let spells = await addProgressItem(entry, "spells", spell._id, sheetData);
          let abilities = await addProgressItem(entry, "abilities", ability._id, sheetData);
          let arts = await addProgressItem(entry, "arts", "me", sheetData);

          expect(entry.system.progress.spells.length).to.equal(1);
          expect(entry.system.progress.arts.length).to.equal(1);
          expect(entry.system.progress.newSpells.length).to.equal(0);
          expect(entry.system.progress.abilities.length).to.equal(1);
          result = await sheet._onProgressApply(event, false);

          expect(result.system.applyError).to.equal("arm5e.activity.msg.wrongTotalXp");

          // assign xp
          abilities[0].xp = 5;
          await entry.update({ "system.progress.abilities": abilities }, { actor: magus });
          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("arm5e.activity.msg.wrongTotalXp");
          spells[0].xp = 5;
          await entry.update({ "system.progress.spells": spells }, { actor: magus });
          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("arm5e.activity.msg.wrongTotalXp");
          arts[0].xp = 5;
          await entry.update({ "system.progress.arts": arts }, { actor: magus });
          result = await sheet._onProgressApply(event, false);
          expect(result.system.applyError).to.equal("");

          expect(ability.system.xp).to.equal(oldXpAb + 5);
          expect(spell.system.xp).to.equal(oldXpSpell + 5);
          expect(magus.system.arts.forms.me.xp).to.equal(oldXpArt + 5);

          await sheet._onProgressRollback(undefined, false);
          expect(ability.system.xp).to.equal(oldXpAb);
          expect(spell.system.xp).to.equal(oldXpSpell);
          expect(magus.system.arts.forms.me.xp).to.equal(oldXpArt);
          // log(false, JSON.stringify(sheetData));

          await sheet.resetProgress(5);
          await magus.deleteEmbeddedDocuments("ActiveEffect", [activityBonusAE._id]);
          sheet.close();
        });
      });
      describe("Adventuring with affinity", function () {
        it("Single Ability", async function () {
          // try {
          let sheet = entry.sheet;
          await magus.addActiveEffect(
            "Affinity arteLib",
            "affinityAcademicAbility",
            "artesLib",
            1.5,
            null
          );
          const sheetData = await entry.sheet.getData();
          log(false, JSON.stringify(sheetData.system));
          // sheet._tabs[0].activate("advanced");
          expect(entry.system.done).to.equal(false);
          expect(entry.system.dates.length).to.equal(1);

          expect(entry.system.progress.abilities.length).to.equal(0);
          const ability = magus.system.abilities[0];
          const oldXp = ability.system.xp;
          let progressItemCol = await addProgressItem(entry, "abilities", ability._id, sheetData);
          expect(entry.system.progress.spells.length).to.equal(0);
          expect(entry.system.progress.arts.length).to.equal(0);
          expect(entry.system.progress.newSpells.length).to.equal(0);
          expect(entry.system.progress.abilities.length).to.equal(1);

          result = await sheet._onProgressApply(event, false);

          expect(result.system.applyError).to.equal("arm5e.activity.msg.wrongTotalXp");

          // assign xp
          progressItemCol[0].xp = 99;
          await entry.update({ "system.progress.abilities": progressItemCol }, { actor: magus });
          result = await sheet._onProgressApply(event, false);

          expect(result.system.applyError).to.equal("arm5e.activity.msg.wrongSingleItemXp");
          progressItemCol[0].xp = entry.system.sourceQuality + result.system.sourceModifier;
          await entry.update({ "system.progress.abilities": progressItemCol }, { actor: magus });

          result = await sheet._onProgressApply(event, false);

          expect(result.system.applyError).to.equal("");

          expect(ability.system.xp).to.equal(oldXp + 5);

          await sheet._onProgressRollback(undefined, false);
          expect(ability.system.xp).to.equal(oldXp);
          // log(false, JSON.stringify(sheetData));
          await entry.update({ "system.progress.abilities": [] }, { actor: magus });
          sheet.close();
          // } catch (err) {
          //   console.error(`Error: ${err}`);
          //   assert.ok(false);
          // }
        });
        it("Single spell", async function () {
          try {
            let sheet = entry.sheet;
            await magus.addActiveEffect(
              "Affinity spellmastery",
              "spellmastery",
              "xpCoeff",
              1.5,
              null
            );
            const sheetData = await entry.sheet.getData();
            log(false, JSON.stringify(sheetData.system));
            expect(entry.system.done).to.equal(false);
            expect(entry.system.dates.length).to.equal(1);

            expect(entry.system.progress.spells.length).to.equal(0);
            const spell = magus.items.get(sheetData.system.defaultSpellMastery);
            const oldXp = spell.system.xp;
            let progressItemCol = await addProgressItem(
              entry,
              "spells",
              sheetData.system.defaultSpellMastery,
              sheetData
            );
            expect(entry.system.progress.spells.length).to.equal(1);
            expect(entry.system.progress.arts.length).to.equal(0);
            expect(entry.system.progress.newSpells.length).to.equal(0);
            expect(entry.system.progress.abilities.length).to.equal(0);

            result = await sheet._onProgressApply(event, false);

            expect(result.system.applyError).to.equal("arm5e.activity.msg.wrongTotalXp");

            // assign xp
            progressItemCol[0].xp = 99;
            await entry.update({ "system.progress.spells": progressItemCol }, { actor: magus });
            result = await sheet._onProgressApply(event, false);

            expect(result.system.applyError).to.equal("arm5e.activity.msg.wrongSingleItemXp");
            progressItemCol[0].xp = entry.system.sourceQuality + result.system.sourceModifier;
            await entry.update({ "system.progress.spells": progressItemCol }, { actor: magus });
            result = await sheet._onProgressApply(event, false);

            expect(result.system.applyError).to.equal("");

            expect(spell.system.xp).to.equal(oldXp + 5);
            // check rollback
            await sheet._onProgressRollback(undefined, false);
            expect(spell.system.xp).to.equal(oldXp);
            await entry.update({ "system.progress.spells": [] }, { actor: magus });
            assert.ok(true);
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });
        it("Single Art", async function () {
          try {
            let sheet = entry.sheet;

            const sheetData = await entry.sheet.getData();
            log(false, JSON.stringify(sheetData.system));
            expect(entry.system.done).to.equal(false);
            expect(entry.system.dates.length).to.equal(1);

            expect(entry.system.progress.arts.length).to.equal(0);
            const art = magus.system.arts.forms.co;
            const oldXp = art.xp;
            let arts = await addProgressItem(entry, "arts", "co", sheetData);
            expect(entry.system.progress.spells.length).to.equal(0);
            expect(entry.system.progress.arts.length).to.equal(1);
            expect(entry.system.progress.newSpells.length).to.equal(0);
            expect(entry.system.progress.abilities.length).to.equal(0);

            result = await sheet._onProgressApply(event, false);

            expect(result.system.applyError).to.equal("arm5e.activity.msg.wrongTotalXp");

            // assign xp
            arts[0].xp = 99;
            await entry.update({ "system.progress.arts": arts });
            result = await sheet._onProgressApply(event, false);

            expect(result.system.applyError).to.equal("arm5e.activity.msg.wrongSingleItemXp");

            arts[0].xp = entry.system.sourceQuality + result.system.sourceModifier;
            await entry.update({ "system.progress.arts": arts });
            // if (entry.system.applyError != "") {
            //   console.warn(entry.system.applyError);
            // }

            result = await sheet._onProgressApply(event, false);

            expect(result.system.applyError).to.equal("");
            expect(magus.system.arts.forms.co.xp).to.equal(oldXp + 5);

            await sheet._onProgressRollback(undefined, false);
            expect(art.xp).to.equal(oldXp);
            await entry.update({ "system.progress.arts": [] });
            assert.ok(true);
            sheet.close();
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });
        it("Combo", async function () {
          await entry.update({ "system.sourceQuality": 15 });
          let sheet = entry.sheet;

          const sheetData = await entry.sheet.getData();
          log(false, JSON.stringify(sheetData.system));
          expect(entry.system.done).to.equal(false);
          expect(entry.system.dates.length).to.equal(1);

          const ability = magus.system.abilities[0];
          const oldXpAb = ability.system.xp;
          const spell = magus.items.get(sheetData.system.defaultSpellMastery);
          const oldXpSpell = spell.system.xp;
          const oldXpArt = magus.system.arts.forms.co.xp;

          expect(entry.system.progress.spells.length).to.equal(0);
          let spells = await addProgressItem(
            entry,
            "spells",
            sheetData.system.defaultSpellMastery,
            sheetData
          );
          let abilities = await addProgressItem(entry, "abilities", ability._id, sheetData);
          let arts = await addProgressItem(entry, "arts", "co", sheetData);

          expect(entry.system.progress.spells.length).to.equal(1);
          expect(entry.system.progress.arts.length).to.equal(1);
          expect(entry.system.progress.newSpells.length).to.equal(0);
          expect(entry.system.progress.abilities.length).to.equal(1);

          result = await sheet._onProgressApply(event, false);

          expect(result.system.applyError).to.equal("arm5e.activity.msg.wrongTotalXp");

          // assign xp
          abilities[0].xp = 5;
          await entry.update({ "system.progress.abilities": abilities });
          result = await sheet._onProgressApply(event, false);

          expect(result.system.applyError).to.equal("arm5e.activity.msg.wrongTotalXp");
          spells[0].xp = 5;
          await entry.update({ "system.progress.spells": spells });
          result = await sheet._onProgressApply(event, false);

          expect(result.system.applyError).to.equal("arm5e.activity.msg.wrongTotalXp");
          arts[0].xp = 5;
          await entry.update({ "system.progress.arts": arts });
          result = await sheet._onProgressApply(event, false);

          expect(result.system.applyError).to.equal("");

          expect(ability.system.xp).to.equal(oldXpAb + 5);
          expect(spell.system.xp).to.equal(oldXpSpell + 5);
          expect(magus.system.arts.forms.co.xp).to.equal(oldXpArt + 5);

          await sheet._onProgressRollback(undefined, false);
          expect(ability.system.xp).to.equal(oldXpAb);
          expect(spell.system.xp).to.equal(oldXpSpell);
          expect(magus.system.arts.forms.co.xp).to.equal(oldXpArt);
          // log(false, JSON.stringify(sheetData));

          assert.ok(true);
          sheet.close();
          await sheet.resetProgress(5);
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
      });
    },
    { displayName: "ARS : Diary Adventuring" }
  );
}
