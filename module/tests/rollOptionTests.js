import { log, sleep } from "../tools.js";
import { getCompanion, getMagus } from "./testData.js";
import { ArsLayer } from "../ui/ars-layer.js";
import { ARM5E } from "../config.js";
import { simpleDie, stressDie } from "../dice.js";
import Aura from "../helpers/aura.js";
import { ROLL_PROPERTIES } from "../helpers/rollWindow.js";

export function registerOptionRollTesting(quench) {
  quench.registerBatch(
    "Ars-Option-rolls",
    (context) => {
      const { describe, it, assert, before } = context;
      let actor;
      let magus;
      let ME1;
      let ME2;
      let ME3;
      let Sp1;
      let Sp2;
      let Sp3;
      let Sp4;
      let magusToken;
      let aura;

      if (game.modules.get("dice-so-nice")?.active) {
        ui.notifications.warn("Disable dice-so-nice to test dice rolls");
        return;
      }
      let hasScene = false;
      if (game.scenes.viewed) {
        hasScene = true;
      }

      before(async function () {
        actor = await getCompanion(`BobTheCompanion`);
        ArsLayer.clearAura(true);
        magus = await getMagus("Tiberius");
        ME1 = magus.items.getName("Standard effect");
        ME2 = magus.items.getName("All req effect");
        ME3 = magus.items.getName("Effect with focus");
        Sp1 = magus.items.getName("Standard spell");
        Sp2 = magus.items.getName("Spell with focus");
        Sp3 = magus.items.getName("Ritual spell");
        Sp4 = magus.items.getName("Spell with deficiency");

        await magus.addActiveEffect("Affinity Corpus", "affinity", "co", 2, null);
        await magus.addActiveEffect("Puissant Muto", "art", "mu", 3, null);
        await magus.addActiveEffect("Deficient Perdo", "deficiency", "pe", undefined, null);
        if (hasScene) {
          const data = await magus.getTokenDocument({ x: 1000, y: 1000 });
          data.actorLink = true;
          magusToken = (await canvas.scene.createEmbeddedDocuments("Token", [data]))[0];
          await magusToken.update({ actorLink: true });
          aura = new Aura(canvas.scene.id);
          await aura.set("faeric", 6);
        } else {
          aura = new Aura(0);
        }
      });
      describe("Options rolls", function () {
        it("Personality roll", async function () {
          try {
            let dataset = {
              roll: "option",
              name: "Personality Loyal",
              option1: 1,
              txtoption1: "score",
              difficulty: 6
            };
            await actor.rest();
            actor.rollInfo.init(dataset, actor);
            const msg = await stressDie(actor, "option", 0, actor.rollInfo.properties.CALLBACK, 10);
            const roll = msg.rolls[0];
            const msgData = msg.system;

            assert.ok(roll);
            assert.ok(msgData, "system missing");
            assert.equal(msgData.label, "Personality Loyal");
            assert.equal(msgData.confidence.score, 1);
            assert.equal(msgData.roll.type, "option");
            assert.equal(msgData.roll.difficulty, dataset.difficulty);
            assert.equal(msgData.roll.actorType, "player");
            assert.equal(msgData.impact.fatigueLevelsLost, 0, "fatigue levels lost should be 0");
            assert.equal(
              msgData.impact.fatigueLevelsPending,
              0,
              "fatigue levels pending should be 0"
            );
            assert.equal(msgData.impact.woundGravity, 0, "wound gravity should be 0");

            assert.equal(
              msgData.roll.difficulty > msg.rollTotal,
              msgData.failedRoll(),
              "failed roll incorrect"
            );
            if (roll.botches) {
              assert.equal(msgData.impact.applied, true, "shoud be applied");
              assert.equal(roll.total, 0, "botched");
              assert.equal(msgData.roll.botchCheck, true, "Check for botch missing");
              assert.equal(msgData.roll.botches, roll.botches, "Wrong number of botches");
              assert.equal(msg.system.confidence.allowed, false, "confidence is not allowed");
            } else {
              assert.equal(msgData.impact.applied, false, "shoud not be applied");
              assert.equal(roll.modifier, 1, "bad modifier");
              assert.equal(msgData.confidence.allowed, true, "confidence is allowed");
              await msgData.useConfidence(actor._id);
              assert.equal(msg.system.confidence.used, 1, "confidence.used should be 1");
              assert.equal(msg.system.confidence.allowed, false, "confidence is not allowed");
            }
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false, err);
          }
        });
        it("Personality roll doomed to fail", async function () {
          try {
            let dataset = {
              roll: "option",
              name: "Personality roll doomed to fail",
              option1: 1,
              txtoption1: "score",
              difficulty: 99
            };
            await actor.rest();
            actor.rollInfo.init(dataset, actor);
            const botchNum = 10;
            const msg = await stressDie(
              actor,
              "option",
              0,
              actor.rollInfo.properties.CALLBACK,
              botchNum
            );
            const roll = msg.rolls[0];
            assert.ok(roll);
            const msgData = msg.system;

            assert.ok(msgData, "system missing");
            assert.equal(msgData.label, "Personality roll doomed to fail");
            assert.equal(msgData.confidence.score, 1);
            assert.ok(msgData.confidence.score >= 0, "confidence.score should be non-negative");
            assert.equal(msgData.confidence.used, 0, "confidence.used should be 0");
            assert.equal(msgData.roll.type, "option");
            assert.equal(msgData.roll.difficulty, dataset.difficulty);
            assert.equal(msgData.roll.actorType, "player");
            assert.equal(msgData.impact.fatigueLevelsLost, 0, "fatigue levels lost should be 0");
            assert.equal(
              msgData.impact.fatigueLevelsPending,
              0,
              "fatigue levels pending should be 0"
            );
            assert.equal(msgData.impact.woundGravity, 0, "wound gravity should be 0");
            assert.equal(
              msgData.roll.difficulty > msg.rollTotal,
              msgData.failedRoll(),
              "failed roll incorrect"
            );
            if (roll.botches) {
              assert.equal(msgData.impact.applied, true, "shoud be applied");
              assert.equal(roll.total, 0, "botched");
              assert.equal(msgData.roll.botchCheck, true, "Check for botch missing");
              assert.equal(msgData.roll.botches, roll.botches, "Wrong number of botches");
              assert.equal(msg.system.confidence.allowed, false, "confidence is not allowed");
            } else {
              assert.equal(msgData.impact.applied, false, "shoud not be applied");
              assert.equal(msgData.confidence.allowed, true, "confidence is allowed");
              assert.equal(roll.modifier, 1, "bad modifier");
              await msgData.useConfidence(actor._id);
              assert.equal(msg.system.confidence.used, 1, "confidence.used should be 1");
              assert.equal(msg.system.confidence.allowed, false, "confidence is not allowed");
            }
            // await msgData.useConfidence(magus._id);
            // assert.equal(msgData.confidence.used, 2, "confidence.used should be 2");
            // assert.equal(msgData.confidence.allowed, false, "confidence is not allowed");
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false, err);
          }
        });
        it("Roll with fatigue roll doomed to fail", async function () {
          try {
            let dataset = {
              roll: "option",
              name: "Fatigue roll doomed to fail",
              option1: 1,
              txtoption1: "score",
              difficulty: 999,
              fatigueOnFail: 2
            };
            await actor.rest();
            actor.rollInfo.init(dataset, actor);
            const fatigueCurrent = actor.system.fatigueCurrent;
            const botchNum = 10;
            const msg = await stressDie(
              actor,
              "option",
              dataset.mode,
              actor.rollInfo.properties.CALLBACK,
              botchNum
            );
            const roll = msg.rolls[0];
            assert.ok(roll);
            const msgData = msg.system;

            assert.ok(msgData, "system missing");
            assert.equal(msgData.label, "Fatigue roll doomed to fail");
            assert.equal(msgData.confidence.score, 1);
            assert.ok(msgData.confidence.score >= 0, "confidence.score should be non-negative");
            assert.equal(msgData.confidence.used, 0, "confidence.used should be 0");
            assert.equal(msgData.roll.type, "option");
            assert.equal(msgData.roll.difficulty, dataset.difficulty);
            assert.equal(msgData.roll.actorType, "player");

            assert.equal(msgData.impact.woundGravity, 0, "wound gravity should be 0");

            if (roll.botches) {
              assert.equal(msgData.failedRoll(), true, "failed roll incorrect");
              assert.equal(msgData.impact.applied, true, "shoud be applied");
              assert.equal(roll.total, 0, "botched");
              assert.equal(msgData.roll.botchCheck, true, "Check for botch missing");
              assert.equal(msgData.roll.botches, roll.botches, "Wrong number of botches");
              assert.equal(msg.system.confidence.allowed, false, "confidence is not allowed");
              assert.equal(msgData.impact.fatigueLevelsLost, 2, "fatigue levels lost should be 2");
              assert.equal(
                msgData.impact.fatigueLevelsPending,
                0,
                "fatigue levels pending should be 0"
              );
              assert.equal(
                msgData.impact.fatigueLevelsFail,
                0,
                "fatigue levels on fail should be 0"
              );
            } else {
              assert.equal(
                msgData.roll.difficulty > msg.rollTotal,
                msgData.failedRoll(),
                "failed roll incorrect"
              );
              assert.equal(msgData.impact.applied, false, "shoud not be applied");
              assert.equal(msgData.impact.fatigueLevelsLost, 0, "fatigue levels lost should be 0");
              assert.equal(
                msgData.impact.fatigueLevelsPending,
                0,
                "fatigue levels pending should be 0"
              );
              assert.equal(
                msgData.impact.fatigueLevelsFail,
                2,
                "fatigue levels on fail should be 2"
              );
              assert.equal(msgData.confidence.allowed, true, "confidence is allowed");
              assert.equal(fatigueCurrent, actor.system.fatigueCurrent, "fatigue changed");
              assert.equal(roll.modifier, 1, "bad modifier");
              await msgData.useConfidence(actor._id);
              assert.equal(
                fatigueCurrent + 2,
                actor.system.fatigueCurrent,
                "fatigue should change"
              );
              assert.equal(msg.system.confidence.used, 1, "confidence.used should be 1");
              assert.equal(msg.system.confidence.allowed, false, "confidence is not allowed");
            }

            // await msgData.useConfidence(magus._id);
            // assert.equal(msgData.confidence.used, 2, "confidence.used should be 2");
            // assert.equal(msgData.confidence.allowed, false, "confidence is not allowed");
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false, err);
          }
        });
        it("Roll with fatigue on use", async function () {
          try {
            let dataset = {
              roll: "option",
              name: "Fatigue on Use",
              option1: 1,
              txtoption1: "score",
              difficulty: 6,
              fatigueOnUse: 3
            };
            await actor.rest();
            actor.rollInfo.init(dataset, actor);
            let fatigueCurrent = actor.system.fatigueCurrent;
            const botchNum = 10;
            const msg = await stressDie(
              actor,
              "option",
              dataset.mode,
              actor.rollInfo.properties.CALLBACK,
              botchNum
            );
            const roll = msg.rolls[0];
            assert.ok(roll);
            const msgData = msg.system;

            assert.ok(msgData, "system missing");
            assert.equal(msgData.label, "Fatigue on Use");
            assert.equal(msgData.confidence.score, 1);
            assert.ok(msgData.confidence.score >= 0, "confidence.score should be non-negative");
            assert.equal(msgData.confidence.used, 0, "confidence.used should be 0");
            assert.equal(msgData.roll.type, "option");
            assert.equal(msgData.roll.difficulty, 6);
            assert.equal(msgData.roll.actorType, "player");
            assert.equal(msgData.impact.fatigueLevelsLost, 3, "fatigue levels lost should be 3");

            assert.equal(fatigueCurrent + 3, actor.system.fatigueCurrent, "fatigue not changed");
            if (roll.botches) {
              assert.equal(roll.total, 0, "botched");
              assert.equal(msgData.roll.botchCheck, true, "Check for botch missing");
              assert.equal(msgData.roll.botches, roll.botches, "Wrong number of botches");
              assert.equal(msg.system.confidence.allowed, false, "confidence is not allowed");
              assert.equal(
                msgData.impact.fatigueLevelsPending,
                0,
                "fatigue levels pending should be 0"
              );
              assert.equal(msgData.impact.woundGravity, 0, "wound gravity should be 0");
              assert.equal(msgData.impact.applied, true, "shoud be applied");
              assert.equal(
                msgData.roll.difficulty > msg.rollTotal,
                msgData.failedRoll(),
                "failed roll incorrect"
              );
              assert.equal(msgData.failedRoll(), true, "failed roll should be true");
            } else {
              assert.equal(
                msgData.impact.fatigueLevelsPending,
                0,
                "fatigue levels pending should be 0"
              );
              assert.equal(msgData.impact.woundGravity, 0, "wound gravity should be 0");
              assert.equal(msgData.impact.applied, false, "shoud not be applied");
              assert.equal(
                msgData.roll.difficulty > msg.rollTotal,
                msgData.failedRoll(),
                "failed roll incorrect"
              );
              assert.equal(msgData.confidence.allowed, true, "confidence is allowed");
              assert.equal(roll.modifier, 1, "bad modifier");
              fatigueCurrent = actor.system.fatigueCurrent;
              await msgData.useConfidence(actor._id);
              assert.equal(
                fatigueCurrent,
                actor.system.fatigueCurrent,
                "fatigue should not change"
              );
              assert.equal(msg.system.confidence.used, 1, "confidence.used should be 1");
              assert.equal(msg.system.confidence.allowed, false, "confidence is not allowed");
            }
            await actor.rest();
            // await msgData.useConfidence(magus._id);
            // assert.equal(msgData.confidence.used, 2, "confidence.used should be 2");
            // assert.equal(msgData.confidence.allowed, false, "confidence is not allowed");
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false, err);
          }
        });

        it("Reputation roll", async function () {
          try {
            let dataset = {
              roll: "option",
              name: "Dead reputation",
              option1: 1,
              txtoption1: "score"
            };
            await actor.rest();
            actor.rollInfo.init(dataset, actor);
            const msg = await stressDie(actor, "char", 0, actor.rollInfo.properties.CALLBACK, 10);
            const roll = msg.rolls[0];
            log(false, roll);
            assert.ok(roll);
            const msgData = msg.system;

            assert.ok(msgData, "system missing");
            assert.equal(msgData.label, "Dead reputation");
            assert.equal(msgData.confidence.score, 1);
            assert.ok(msgData.confidence.score >= 0, "confidence.score should be non-negative");
            assert.equal(msgData.confidence.used, 0, "confidence.used should be 0");
            assert.equal(msgData.roll.type, "option");
            assert.equal(msgData.roll.difficulty, 0);
            assert.equal(msgData.roll.actorType, "player");
            assert.equal(msgData.impact.fatigueLevelsLost, 0, "fatigue levels lost should be 0");
            assert.equal(
              msgData.impact.fatigueLevelsPending,
              0,
              "fatigue levels pending should be 0"
            );
            assert.equal(msgData.impact.woundGravity, 0, "wound gravity should be 0");
            if (roll.botches) {
              assert.equal(msgData.impact.applied, true, "shoud be applied");
              assert.equal(roll.total, 0, "botched");
              assert.equal(msgData.roll.botchCheck, true, "Check for botch missing");
              assert.equal(msgData.roll.botches, roll.botches, "Wrong number of botches");
              assert.equal(msg.system.confidence.allowed, false, "confidence is not allowed");
              assert.equal(msgData.failedRoll(), true, "failed roll should be true");
            } else {
              assert.equal(
                msgData.roll.difficulty > msg.rollTotal,
                msgData.failedRoll(),
                "failed roll incorrect"
              );
              assert.equal(msgData.impact.applied, false, "shoud not be applied");
              assert.equal(msgData.confidence.allowed, true, "confidence is allowed");
              assert.equal(roll.modifier, 1, "bad modifier");
              await msgData.useConfidence(actor._id);
              assert.equal(msg.system.confidence.used, 1, "confidence.used should be 1");
              assert.equal(msg.system.confidence.allowed, false, "confidence is not allowed");
            }
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false, err);
          }
        });

        it("All options roll", async function () {
          try {
            let dataset = {
              roll: "option",
              name: "All options",
              option1: 10,
              txtoption1: "score",
              option2: 10,
              txtoption2: "score 2",
              option3: 10,
              txtoption3: "score 3",
              option4: 10,
              txtoption4: "score 4",
              option5: 10,
              txtoption5: "score 5"
            };
            await actor.rest();
            actor.rollInfo.init(dataset, actor);
            const msg = await simpleDie(actor, "option", actor.rollInfo.properties.CALLBACK);
            const roll = msg.rolls[0];
            const msgData = msg.system;
            log(false, roll);
            assert.equal(msgData.roll.botchCheck, false, "Check for botch missing");
            assert.equal(msgData.roll.botches, roll.botches, "Wrong number of botches");
            assert.ok(roll.total > 50);
            assert.equal(roll.modifier, 50, "modifier not correct");

            assert.ok(msgData, "system missing");
            assert.equal(msgData.label, "All options");
            assert.equal(msgData.confidence.score, 1);
            assert.ok(msgData.confidence.score >= 0, "confidence.score should be non-negative");
            assert.equal(msgData.confidence.used, 0, "confidence.used should be 0");
            assert.equal(msgData.roll.type, "option");
            assert.equal(msgData.roll.difficulty, dataset.difficulty || 0);
            assert.equal(msgData.roll.actorType, "player");
            assert.equal(msgData.impact.fatigueLevelsLost, 0, "fatigue levels lost should be 0");
            assert.equal(
              msgData.impact.fatigueLevelsPending,
              0,
              "fatigue levels pending should be 0"
            );
            assert.equal(msgData.impact.woundGravity, 0, "wound gravity should be 0");
            assert.equal(msgData.impact.applied, false, "shoud not be applied");
            assert.equal(
              msgData.roll.difficulty > msg.rollTotal,
              msgData.failedRoll(),
              "failed roll incorrect"
            );

            await msgData.useConfidence(actor._id);
            assert.equal(msg.system.confidence.used, 1, "confidence.used should be 1");
            assert.equal(msg.system.confidence.allowed, false, "confidence is not allowed");
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false, err);
          }
        });

        it("Init roll", async function () {
          let type = "init";
          try {
            let dataset = {
              roll: type,
              name: "Initiative",
              option1: actor.system.characteristics.qik.value,
              txtoption1: "quick",
              option2: actor.system.combat.init,
              txtoption2: "init",
              option3: actor.system.combat.overload,
              txtoption3: "overload"
            };
            await actor.rest();
            actor.rollInfo.init(dataset, actor);
            const msg = await stressDie(actor, type, 0, actor.rollInfo.properties.CALLBACK, 10);
            const roll = msg.rolls[0];
            assert.ok(roll);
            log(false, roll);
            const msgData = msg.system;

            assert.ok(msgData, "system missing");
            assert.equal(msgData.label, "Initiative");
            assert.equal(msgData.confidence.score, 1);
            assert.ok(msgData.confidence.score >= 0, "confidence.score should be non-negative");
            assert.equal(msgData.confidence.used, 0, "confidence.used should be 0");
            assert.equal(msgData.roll.type, "init");
            assert.equal(msgData.roll.difficulty, dataset.difficulty || 0);
            assert.equal(msgData.roll.actorType, "player");
            assert.equal(msgData.impact.fatigueLevelsLost, 0, "fatigue levels lost should be 0");
            assert.equal(
              msgData.impact.fatigueLevelsPending,
              0,
              "fatigue levels pending should be 0"
            );
            assert.equal(msgData.impact.woundGravity, 0, "wound gravity should be 0");
            if (roll.botches) {
              assert.equal(msgData.impact.applied, true, "shoud be applied");
              assert.equal(roll.total, 0, "botched");
              assert.equal(msgData.roll.botchCheck, true, "Check for botch missing");
              assert.equal(msgData.roll.botches, roll.botches, "Wrong number of botches");
              assert.equal(msg.system.confidence.allowed, false, "confidence is not allowed");
            } else {
              assert.equal(
                msgData.roll.difficulty > msg.rollTotal,
                msgData.failedRoll(),
                "failed roll incorrect"
              );
              assert.equal(msgData.impact.applied, false, "shoud not be applied");
              assert.equal(msgData.confidence.allowed, true, "confidence is allowed");
              let tot =
                actor.system.characteristics.qik.value +
                actor.system.combat.init -
                actor.system.combat.overload;
              assert.equal(roll.modifier, tot, "bad modifier");
              await msgData.useConfidence(actor._id);
              assert.equal(msg.system.confidence.used, 1, "confidence.used should be 1");
              assert.equal(msg.system.confidence.allowed, false, "confidence is not allowed");
            }
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false, err);
          }
        });

        it("Combat roll", async function () {
          let type = ROLL_PROPERTIES.ATTACK.VAL;
          try {
            let dataset = {
              roll: type,
              name: "Combat attack",
              option1: actor.system.characteristics.dex.value,
              txtoption1: "dex",
              option2: actor.system.combat.ability,
              txtoption2: "ability",
              option3: actor.system.combat.atk,
              txtoption3: "attack"
            };
            await actor.rest();
            actor.rollInfo.init(dataset, actor);
            const msg = await stressDie(actor, type, 0, actor.rollInfo.properties.CALLBACK, 10);
            const roll = msg.rolls[0];
            log(false, roll);
            assert.ok(roll);
            const msgData = msg.system;

            assert.ok(msgData, "system missing");
            assert.equal(msgData.label, "Combat attack");
            assert.equal(msgData.confidence.score, 1);
            assert.ok(msgData.confidence.score >= 0, "confidence.score should be non-negative");
            assert.equal(msgData.confidence.used, 0, "confidence.used should be 0");
            assert.equal(msgData.roll.type, "attack");
            assert.equal(msgData.roll.difficulty, dataset.difficulty || 0);
            assert.equal(msgData.roll.actorType, "player");
            assert.equal(msgData.impact.fatigueLevelsLost, 0, "fatigue levels lost should be 0");
            assert.equal(
              msgData.impact.fatigueLevelsPending,
              0,
              "fatigue levels pending should be 0"
            );
            assert.equal(msgData.impact.woundGravity, 0, "wound gravity should be 0");

            if (roll.botches) {
              assert.equal(msgData.failedRoll(), true, "failed roll incorrect");
              assert.equal(msgData.impact.applied, true, "shoud be applied");
              assert.equal(roll.total, 0, "botched");
              assert.equal(msgData.roll.botchCheck, true, "Check for botch missing");
              assert.equal(msgData.roll.botches, roll.botches, "Wrong number of botches");
              assert.equal(msg.system.confidence.allowed, false, "confidence is not allowed");
            } else {
              assert.equal(
                msgData.roll.difficulty > msg.rollTotal,
                msgData.failedRoll(),
                "failed roll incorrect"
              );
              assert.equal(msgData.impact.applied, false, "shoud not be applied");
              assert.equal(msgData.confidence.allowed, true, "confidence is allowed");
              let tot =
                actor.system.characteristics.dex.value +
                actor.system.combat.atk +
                actor.system.combat.ability;
              assert.equal(roll.modifier, tot, "modifier not correct");

              await msgData.useConfidence(actor._id);
              assert.equal(msg.system.confidence.used, 1, "confidence.used should be 1");
              assert.equal(msg.system.confidence.allowed, false, "confidence is not allowed");
            }
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false, err);
          }
        });
        it("Combat roll defense", async function () {
          let type = ROLL_PROPERTIES.DEFENSE.VAL;
          try {
            let dataset = {
              roll: type,
              name: "Combat defense",
              option1: actor.system.characteristics.qik.value,
              txtoption1: "quickness",
              option2: actor.system.combat.ability,
              txtoption2: "ability",
              option3: actor.system.combat.dfn,
              txtoption3: "defense"
            };
            await actor.rest();
            actor.rollInfo.init(dataset, actor);
            const msg = await stressDie(actor, type, 0, actor.rollInfo.properties.CALLBACK, 10);
            const roll = msg.rolls[0];
            log(false, roll);
            assert.ok(roll);

            const msgData = msg.system;

            assert.ok(msgData, "system missing");
            assert.equal(msgData.label, "Combat defense");
            assert.equal(msgData.confidence.score, 1);
            assert.ok(msgData.confidence.score >= 0, "confidence.score should be non-negative");
            assert.equal(msgData.confidence.used, 0, "confidence.used should be 0");
            assert.equal(msgData.roll.type, "defense");
            assert.equal(msgData.roll.difficulty, dataset.difficulty || 0);
            assert.equal(msgData.roll.actorType, "player");
            assert.equal(msgData.impact.fatigueLevelsLost, 0, "fatigue levels lost should be 0");
            assert.equal(
              msgData.impact.fatigueLevelsPending,
              0,
              "fatigue levels pending should be 0"
            );
            assert.equal(msgData.impact.woundGravity, 0, "wound gravity should be 0");

            if (roll.botches) {
              assert.equal(msgData.failedRoll(), true, "failed roll incorrect");
              assert.equal(msgData.impact.applied, true, "shoud be applied");
              assert.equal(roll.total, 0, "botched");
              assert.equal(msgData.roll.botchCheck, true, "Check for botch missing");
              assert.equal(msgData.roll.botches, roll.botches, "Wrong number of botches");
              assert.equal(msg.system.confidence.allowed, false, "confidence is not allowed");
            } else {
              assert.equal(
                msgData.roll.difficulty > msg.rollTotal,
                msgData.failedRoll(),
                "failed roll incorrect"
              );
              assert.equal(msgData.impact.applied, false, "shoud not be applied");
              assert.equal(msgData.confidence.allowed, true, "confidence is allowed");
              let tot =
                actor.system.characteristics.qik.value +
                actor.system.combat.ability +
                actor.system.combat.dfn;
              assert.equal(roll.modifier, tot, "modifier not correct");
              await msgData.useConfidence(actor._id);
              assert.equal(msg.system.confidence.used, 1, "confidence.used should be 1");
              assert.equal(msg.system.confidence.allowed, false, "confidence is not allowed");
            }
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false, err);
          }
        });
        it("Combat roll exertion", async function () {
          let type = ROLL_PROPERTIES.ATTACK.VAL;
          try {
            let dataset = {
              roll: type,
              name: "Combat exertion",
              option1: actor.system.characteristics.dex.value,
              txtoption1: "dex",
              option2: actor.system.combat.ability,
              txtoption2: "ability",
              option3: actor.system.combat.atk,
              txtoption3: "attack"
            };
            await actor.rest();
            actor.rollInfo.init(dataset, actor);
            actor.rollInfo.combat.exertion = true;
            const msg = await stressDie(actor, type, 0, actor.rollInfo.properties.CALLBACK, 10);
            const roll = msg.rolls[0];
            log(false, roll);
            assert.ok(roll);

            const msgData = msg.system;

            assert.ok(msgData, "system missing");
            assert.equal(msgData.label, "Combat exertion");
            assert.equal(msgData.confidence.score, 1);
            assert.ok(msgData.confidence.score >= 0, "confidence.score should be non-negative");
            assert.equal(msgData.confidence.used, 0, "confidence.used should be 0");
            assert.equal(msgData.roll.type, "attack");
            assert.equal(msgData.roll.difficulty, dataset.difficulty || 0);
            assert.equal(msgData.roll.actorType, "player");
            assert.equal(msgData.impact.fatigueLevelsLost, 0, "fatigue levels lost should be 0");
            assert.equal(
              msgData.impact.fatigueLevelsPending,
              0,
              "fatigue levels pending should be 0"
            );
            assert.equal(msgData.impact.woundGravity, 0, "wound gravity should be 0");
            if (roll.botches) {
              assert.equal(msgData.failedRoll(), true, "failed roll incorrect");
              assert.equal(msgData.impact.applied, true, "shoud be applied");
              assert.equal(roll.total, 0, "botched");
              assert.equal(msgData.roll.botchCheck, true, "Check for botch missing");
              assert.equal(msgData.roll.botches, roll.botches, "Wrong number of botches");
              assert.equal(msg.system.confidence.allowed, false, "confidence is not allowed");
            } else {
              assert.equal(
                msgData.roll.difficulty > msg.rollTotal,
                msgData.failedRoll(),
                "failed roll incorrect"
              );
              assert.equal(msgData.impact.applied, false, "shoud not be applied");
              assert.equal(msgData.confidence.allowed, true, "confidence is allowed");
              let tot =
                actor.system.characteristics.dex.value +
                actor.system.combat.atk +
                2 * actor.system.combat.ability;
              assert.equal(roll.modifier, tot, "modifier not correct");
              await msgData.useConfidence(actor._id);
              assert.equal(msg.system.confidence.used, 1, "confidence.used should be 1");
              assert.equal(msg.system.confidence.allowed, false, "confidence is not allowed");
            }
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false, err);
          }
        });
        it("Combat wounded", async function () {
          await actor.changeWound(3, "light");
          let type = ROLL_PROPERTIES.ATTACK.VAL;
          try {
            let dataset = {
              roll: type,
              name: "Combat wounded",
              option1: actor.system.characteristics.dex.value,
              txtoption1: "dex",
              option2: actor.system.combat.ability,
              txtoption2: "ability",
              option3: actor.system.combat.atk,
              txtoption3: "attack"
            };
            actor.rollInfo.init(dataset, actor);
            const msg = await stressDie(actor, type, 0, actor.rollInfo.properties.CALLBACK, 10);
            const roll = msg.rolls[0];
            log(false, roll);
            assert.ok(roll);

            const msgData = msg.system;

            assert.ok(msgData, "system missing");
            assert.equal(msgData.label, "Combat wounded");
            assert.equal(msgData.confidence.score, 1);
            assert.ok(msgData.confidence.score >= 0, "confidence.score should be non-negative");
            assert.equal(msgData.confidence.used, 0, "confidence.used should be 0");
            assert.equal(msgData.roll.type, "attack");
            assert.equal(msgData.roll.difficulty, dataset.difficulty || 0);
            assert.equal(msgData.roll.actorType, "player");
            assert.equal(msgData.impact.fatigueLevelsLost, 0, "fatigue levels lost should be 0");
            assert.equal(
              msgData.impact.fatigueLevelsPending,
              0,
              "fatigue levels pending should be 0"
            );
            assert.equal(msgData.impact.woundGravity, 0, "wound gravity should be 0");
            if (roll.botches) {
              assert.equal(msgData.failedRoll(), true, "failed roll incorrect");
              assert.equal(msgData.impact.applied, true, "shoud be applied");
              assert.equal(roll.total, 0, "botched");
              assert.equal(msgData.roll.botchCheck, true, "Check for botch missing");
              assert.equal(msgData.roll.botches, roll.botches, "Wrong number of botches");
              assert.equal(msg.system.confidence.allowed, false, "confidence is not allowed");
            } else {
              assert.equal(
                msgData.roll.difficulty > msg.rollTotal,
                msgData.failedRoll(),
                "failed roll incorrect"
              );
              assert.equal(msgData.impact.applied, false, "shoud not be applied");
              assert.equal(msgData.confidence.allowed, true, "confidence is allowed");
              let tot =
                actor.system.characteristics.dex.value +
                actor.system.combat.atk +
                actor.system.combat.ability -
                3;
              assert.equal(roll.modifier, tot, "modifier not correct");
              await msgData.useConfidence(actor._id);
              assert.equal(msg.system.confidence.used, 1, "confidence.used should be 1");
              assert.equal(msg.system.confidence.allowed, false, "confidence is not allowed");
            }
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false, err);
          }
        });
        it("Hard roll skip confidence", async function () {
          try {
            let dataset = {
              roll: "option",
              name: "Hard roll",
              option1: 1,
              txtoption1: "score",
              difficulty: 9,
              fatigueOnFail: 2
            };
            await actor.rest();
            await actor.restoreHealth();
            const fatigueCurrent = actor.system.fatigueCurrent;
            actor.rollInfo.init(dataset, actor);
            const msg = await stressDie(actor, "char", 0, actor.rollInfo.properties.CALLBACK, 10);
            const roll = msg.rolls[0];
            log(false, roll);
            assert.ok(roll);
            const msgData = msg.system;

            assert.ok(msgData, "system missing");
            assert.equal(msgData.label, "Hard roll");
            assert.equal(msgData.confidence.score, 1);
            assert.ok(msgData.confidence.score >= 0, "confidence.score should be non-negative");
            assert.equal(msgData.confidence.used, 0, "confidence.used should be 0");
            assert.equal(msgData.roll.type, "option");
            assert.equal(msgData.roll.difficulty, dataset.difficulty || 0);
            assert.equal(msgData.roll.actorType, "player");
            assert.equal(msgData.impact.fatigueLevelsLost, 0, "fatigue levels lost should be 0");

            if (roll.botches) {
              assert.equal(msgData.impact.applied, true, "shoud be applied");
              assert.equal(roll.total, 0, "botched");
              assert.equal(msgData.roll.botchCheck, true, "Check for botch missing");
              assert.equal(msgData.roll.botches, roll.botches, "Wrong number of botches");
              assert.equal(msg.system.confidence.allowed, false, "confidence is not allowed");
              assert.equal(msg.failedRoll(), true, "failed roll should be true");

              assert.equal(
                msg.system.impact.fatigueLevelsLost,
                2,
                "fatigue levels lost should be 2"
              );
              assert.equal(
                msg.system.impact.fatigueLevelsPending,
                0,
                "fatigue levels pending should be 0"
              );
              assert.equal(
                msg.system.impact.fatigueLevelsFail,
                0,
                "fatigue levels on fail should be 0"
              );
            } else {
              assert.equal(
                msgData.roll.difficulty > msg.rollTotal,
                msgData.failedRoll(),
                "failed roll incorrect"
              );
              if (msgData.failedRoll()) {
                assert.equal(
                  msgData.impact.fatigueLevelsLost,
                  0,
                  "fatigue levels lost should be 0"
                );
                assert.equal(
                  msgData.impact.fatigueLevelsFail,
                  2,
                  "fatigue levels on fail should be 2"
                );
                assert.equal(
                  msgData.impact.fatigueLevelsPending,
                  0,
                  "fatigue levels pending should be 0"
                );
                assert.equal(msgData.impact.woundGravity, 0, "wound gravity should be 0");

                assert.equal(msgData.impact.applied, false, "shoud not be applied");

                assert.equal(msgData.confidence.allowed, true, "confidence is allowed");
                // skip confidence
                await msgData.skipConfidenceUse(actor._id);

                assert.equal(msg.system.confidence.used, 0, "confidence.used should be 0");
                assert.equal(msg.system.confidence.allowed, false, "confidence is not allowed");
                assert.equal(
                  msg.system.impact.fatigueLevelsLost,
                  2,
                  "fatigue levels lost should be 2"
                );
                assert.equal(
                  msg.system.impact.fatigueLevelsPending,
                  0,
                  "fatigue levels pending should be 0"
                );
                assert.equal(
                  msg.system.impact.fatigueLevelsFail,
                  0,
                  "fatigue levels on fail should be 0"
                );
                assert.equal(msg.system.impact.woundGravity, 0, "wound gravity should be 0");
                assert.equal(
                  fatigueCurrent + 2,
                  actor.system.fatigueCurrent,
                  "fatigue should change"
                );
              } else {
                assert.equal(
                  msg.system.impact.fatigueLevelsLost,
                  0,
                  "fatigue levels lost should be 0"
                );
                assert.equal(
                  msg.system.impact.fatigueLevelsPending,
                  0,
                  "fatigue levels pending should be 0"
                );
                assert.equal(
                  msg.system.impact.fatigueLevelsFail,
                  0,
                  "fatigue levels on fail should be 0"
                );
                assert.equal(msg.system.impact.woundGravity, 0, "wound gravity should be 0");

                assert.equal(msg.system.impact.applied, false, "shoud not be applied");

                assert.equal(msg.system.confidence.allowed, true, "confidence is allowed");
                // skip confidence
                await msg.system.skipConfidenceUse(actor._id);
                assert.equal(msg.system.confidence.used, 0, "confidence.used should be 0");
                assert.equal(msg.system.confidence.allowed, false, "confidence is not allowed");
                assert.equal(
                  msg.system.impact.fatigueLevelsLost,
                  0,
                  "fatigue levels lost should be 0"
                );
                assert.equal(
                  msg.system.impact.fatigueLevelsPending,
                  0,
                  "fatigue levels pending should be 0"
                );
                assert.equal(msg.system.impact.woundGravity, 0, "wound gravity should be 0");
                assert.equal(
                  fatigueCurrent,
                  actor.system.fatigueCurrent,
                  "fatigue should not change"
                );
              }

              assert.equal(roll.modifier, 1, "bad modifier");
            }
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false, err);
          }
        });
      });

      after(async function () {
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
    { displayName: "ARS : Option Rolls testsuite" }
  );
}
