import { getCompanion, getMagus } from "./testData.js";
import { ArsLayer } from "../ui/ars-layer.js";
import { simpleDie, stressDie } from "../helpers/dice.js";
import Aura from "../helpers/aura.js";
import { ROLL_PROPERTIES } from "../ui/roll-window.js";
import { log } from "../tools/tools.js";
import {
  assertBasicRollStructure as _assertBasicRollStructure,
  assertConfidenceState as _assertConfidenceState,
  assertImpactDefaults as _assertImpactDefaults,
  assertBotchBehavior as _assertBotchBehavior,
  assertSuccessWithConfidence as _assertSuccessWithConfidence,
  BOTCH_DIE_COUNT
} from "./rollAssertions.js";
import { guardDiceRolls, createLinkedToken } from "./testHelpers.js";

export function registerOptionRollTesting(quench) {
  quench.registerBatch(
    "Ars-Option-rolls",
    (context) => {
      const { describe, it, assert, before, afterEach } = context;
      let actor;
      let magus;
      let magusToken;
      let aura;

      // Compatibility wrappers: preserve the existing closure-style call signatures
      // (no leading `assert` parameter) by closing over `assert` from quench context.
      function assertBasicRollStructure(msgData, expectedLabel, expectedType) {
        return _assertBasicRollStructure(assert, msgData, {
          expectedLabel,
          type: expectedType,
          confidenceScore: null
        });
      }

      function assertConfidenceState(msgData) {
        return _assertConfidenceState(assert, msgData);
      }

      function assertImpactDefaults(msgData) {
        return _assertImpactDefaults(assert, msgData);
      }

      function assertBotchBehavior(msgData, roll) {
        return _assertBotchBehavior(assert, roll, msgData);
      }

      async function assertSuccessWithConfidence(msg, actor, expectedModifier) {
        return _assertSuccessWithConfidence(assert, msg, actor, expectedModifier);
      }

      if (guardDiceRolls()) return;

      before(async function () {
        actor = await getCompanion(`BobTheCompanion`);
        ArsLayer.clearAura(true);
        magus = await getMagus("Tiberius");

        const hasScene = !!game.scenes.viewed;
        if (hasScene) {
          magusToken = await createLinkedToken(magus);
          aura = new Aura(canvas.scene.id);
          await aura.set("faeric", 6);
        } else {
          aura = new Aura(0);
        }
      });

      afterEach(async function () {
        await actor.rest();
        await actor.restoreHealth();
      });
      describe("Options rolls", function () {
        this.timeout(300000); // 300 seconds for easier debugging

        it("Personality roll", async function () {
          const dataset = {
            roll: "option",
            name: "Personality Loyal",
            option1: 1,
            txtoption1: "score",
            difficulty: 6
          };
          actor.rollInfo.init(dataset, actor);
          const msg = await stressDie(
            actor,
            "option",
            0,
            actor.rollInfo.properties.CALLBACK,
            BOTCH_DIE_COUNT
          );
          const roll = msg.rolls[0];
          const msgData = msg.system;

          assert.ok(roll, "roll should exist");
          assertBasicRollStructure(msgData, "Personality Loyal", "option");
          assert.equal(msgData.confidence.score, 1, "confidence score should be 1");
          assertConfidenceState(msgData);
          assert.equal(msgData.roll.difficulty, dataset.difficulty, "difficulty should match");
          assertImpactDefaults(msgData);
          assert.equal(
            msgData.roll.difficulty > msg.rollTotal(),
            msgData.failedRoll(),
            "failed roll calculation incorrect"
          );

          if (roll.botches) {
            assertBotchBehavior(msgData, roll);
          } else {
            assert.equal(roll.modifier, 1, "modifier should be 1");
            await assertSuccessWithConfidence(msg, actor, 1);
          }
        });
        it("Personality roll doomed to fail", async function () {
          const dataset = {
            roll: "option",
            name: "Personality roll doomed to fail",
            option1: 1,
            txtoption1: "score",
            difficulty: 99
          };
          actor.rollInfo.init(dataset, actor);
          const msg = await stressDie(
            actor,
            "option",
            0,
            actor.rollInfo.properties.CALLBACK,
            BOTCH_DIE_COUNT
          );
          const roll = msg.rolls[0];
          const msgData = msg.system;

          assert.ok(roll, "roll should exist");
          assertBasicRollStructure(msgData, "Personality roll doomed to fail", "option");
          assert.equal(msgData.confidence.score, 1, "confidence score should be 1");
          assertConfidenceState(msgData);
          assert.equal(msgData.roll.difficulty, dataset.difficulty, "difficulty should match");
          assertImpactDefaults(msgData);
          assert.equal(
            msgData.roll.difficulty > msg.rollTotal(0),
            msgData.failedRoll(),
            "failed roll calculation incorrect"
          );

          if (roll.botches) {
            assertBotchBehavior(msgData, roll);
          } else {
            assert.equal(roll.modifier, 1, "modifier should be 1");
            await assertSuccessWithConfidence(msg, actor, 1);
          }
        });
        it("Roll with fatigue roll doomed to fail", async function () {
          const dataset = {
            roll: "option",
            name: "Fatigue roll doomed to fail",
            option1: 1,
            txtoption1: "score",
            difficulty: 999,
            fatigueOnFail: 2
          };
          actor.rollInfo.init(dataset, actor);
          const fatigueCurrent = actor.system.fatigueCurrent;
          const msg = await stressDie(
            actor,
            "option",
            0,
            actor.rollInfo.properties.CALLBACK,
            BOTCH_DIE_COUNT
          );
          const roll = msg.rolls[0];
          const msgData = msg.system;

          assert.ok(roll, "roll should exist");
          assertBasicRollStructure(msgData, "Fatigue roll doomed to fail", "option");
          assert.equal(msgData.confidence.score, 1, "confidence score should be 1");
          assertConfidenceState(msgData);
          assert.equal(msgData.roll.difficulty, dataset.difficulty, "difficulty should match");
          assert.equal(msgData.impact.woundGravity, 0, "wound gravity should be 0");

          if (roll.botches) {
            assert.equal(msgData.failedRoll(), true, "should be a failed roll");
            assertBotchBehavior(msgData, roll);
            assert.equal(msgData.impact.fatigueLevelsLost, 2, "fatigue levels lost should be 2");
            assert.equal(
              msgData.impact.fatigueLevelsPending,
              0,
              "fatigue levels pending should be 0"
            );
            assert.equal(msgData.impact.fatigueLevelsFail, 0, "fatigue levels on fail should be 0");
          } else {
            assert.equal(
              msgData.roll.difficulty > msg.rollTotal(0),
              msgData.failedRoll(),
              "failed roll calculation incorrect"
            );
            assert.equal(msgData.impact.applied, false, "impact should not be applied yet");
            assert.equal(msgData.impact.fatigueLevelsLost, 0, "fatigue levels lost should be 0");
            assert.equal(
              msgData.impact.fatigueLevelsPending,
              0,
              "fatigue levels pending should be 0"
            );
            assert.equal(msgData.impact.fatigueLevelsFail, 2, "fatigue levels on fail should be 2");
            assert.equal(msgData.confidence.allowed, true, "confidence should be allowed");
            assert.equal(
              fatigueCurrent,
              actor.system.fatigueCurrent,
              "fatigue should not change yet"
            );
            assert.equal(roll.modifier, 1, "modifier should be 1");
            await msgData.useConfidence(actor._id);
            assert.equal(
              fatigueCurrent + 2,
              actor.system.fatigueCurrent,
              "fatigue should increase after confidence use"
            );
            assert.equal(msg.system.confidence.used, 1, "confidence.used should be 1");
            assert.equal(msg.system.confidence.allowed, false, "confidence not allowed after use");
          }
        });
        it("Roll with fatigue on use", async function () {
          const dataset = {
            roll: "option",
            name: "Fatigue on Use",
            option1: 1,
            txtoption1: "score",
            difficulty: 6,
            fatigueOnUse: 3
          };
          actor.rollInfo.init(dataset, actor);
          let fatigueCurrent = actor.system.fatigueCurrent;
          const msg = await stressDie(
            actor,
            "option",
            0,
            actor.rollInfo.properties.CALLBACK,
            BOTCH_DIE_COUNT
          );
          const roll = msg.rolls[0];
          const msgData = msg.system;

          assert.ok(roll, "roll should exist");
          assertBasicRollStructure(msgData, "Fatigue on Use", "option");
          assert.equal(msgData.confidence.score, 1, "confidence score should be 1");
          assertConfidenceState(msgData);
          assert.equal(msgData.roll.difficulty, 6, "difficulty should be 6");
          assert.equal(msgData.impact.fatigueLevelsLost, 3, "fatigue levels lost should be 3");
          assert.equal(
            fatigueCurrent + 3,
            actor.system.fatigueCurrent,
            "fatigue should increase by 3"
          );

          if (roll.botches) {
            assert.equal(roll.total, 0, "botch total should be 0");
            assert.equal(msgData.roll.botchCheck, true, "botch check should be true");
            assert.equal(msgData.roll.botches, roll.botches, "botch count should match");
            assert.equal(msgData.confidence.allowed, false, "confidence not allowed on botch");
            assert.equal(
              msgData.impact.fatigueLevelsPending,
              0,
              "fatigue levels pending should be 0"
            );
            assert.equal(msgData.impact.woundGravity, 0, "wound gravity should be 0");
            assert.equal(msgData.impact.applied, true, "impact should be applied");
            assert.equal(msgData.failedRoll(), true, "should be a failed roll");
          } else {
            assert.equal(
              msgData.impact.fatigueLevelsPending,
              0,
              "fatigue levels pending should be 0"
            );
            assert.equal(msgData.impact.woundGravity, 0, "wound gravity should be 0");
            assert.equal(msgData.impact.applied, false, "impact should not be applied yet");
            assert.equal(
              msgData.roll.difficulty > msg.rollTotal(0),
              msgData.failedRoll(),
              "failed roll calculation incorrect"
            );
            assert.equal(msgData.confidence.allowed, true, "confidence should be allowed");
            assert.equal(roll.modifier, 1, "modifier should be 1");
            fatigueCurrent = actor.system.fatigueCurrent;
            await msgData.useConfidence(actor._id);
            assert.equal(
              fatigueCurrent,
              actor.system.fatigueCurrent,
              "fatigue should not change on confidence use"
            );
            assert.equal(msg.system.confidence.used, 1, "confidence.used should be 1");
            assert.equal(msg.system.confidence.allowed, false, "confidence not allowed after use");
          }
        });

        it("Roll with both fatigue on use and on fail", async function () {
          const dataset = {
            roll: "option",
            name: "Fatigue on both",
            option1: 1,
            txtoption1: "score",
            difficulty: 999,
            fatigueOnUse: 2,
            fatigueOnFail: 3
          };
          actor.rollInfo.init(dataset, actor);
          let fatigueCurrent = actor.system.fatigueCurrent;
          const msg = await stressDie(
            actor,
            "option",
            0,
            actor.rollInfo.properties.CALLBACK,
            BOTCH_DIE_COUNT
          );
          const roll = msg.rolls[0];
          const msgData = msg.system;

          assert.ok(roll, "roll should exist");
          assertBasicRollStructure(msgData, "Fatigue on both", "option");
          assert.equal(msgData.confidence.score, 1, "confidence score should be 1");
          assertConfidenceState(msgData);
          assert.equal(msgData.roll.difficulty, 999, "difficulty should be 999");
          assert.equal(msgData.impact.fatigueLevelsLost, 2, "fatigue levels lost should be 2");
          assert.equal(
            fatigueCurrent + 2,
            actor.system.fatigueCurrent,
            "fatigue should increase by 2 from use"
          );

          if (roll.botches) {
            assert.equal(msgData.failedRoll(), true, "should be a failed roll");
            assertBotchBehavior(msgData, roll);
            assert.equal(msgData.impact.fatigueLevelsFail, 3, "fatigue levels on fail should be 3");
          } else {
            assert.equal(
              msgData.roll.difficulty > msg.rollTotal(0),
              msgData.failedRoll(),
              "failed roll calculation incorrect"
            );
            assert.equal(msgData.impact.applied, false, "impact should not be applied yet");
            assert.equal(msgData.impact.fatigueLevelsFail, 3, "fatigue levels on fail should be 3");
            assert.equal(msgData.confidence.allowed, true, "confidence should be allowed");
            assert.equal(roll.modifier, 1, "modifier should be 1");
            fatigueCurrent = actor.system.fatigueCurrent;
            await msgData.useConfidence(actor._id);
            // Should add both fatigueOnUse (already applied) and fatigueOnFail (from failing)
            assert.equal(
              fatigueCurrent + 3,
              actor.system.fatigueCurrent,
              "fatigue should increase by 3 more from fail after confidence use"
            );
            assert.equal(msg.system.confidence.used, 1, "confidence.used should be 1");
            assert.equal(msg.system.confidence.allowed, false, "confidence not allowed after use");
          }
        });

        it("Roll while already fatigued", async function () {
          // First, apply some fatigue
          await actor.loseFatigueLevel(2, false);
          const initialFatigue = actor.system.fatigueCurrent;
          assert.equal(initialFatigue, 2, "actor should start with 2 fatigue levels");

          const dataset = {
            roll: "option",
            name: "Roll while fatigued",
            option1: 1,
            txtoption1: "score",
            difficulty: 6,
            fatigueOnUse: 1
          };
          actor.rollInfo.init(dataset, actor);
          const msg = await stressDie(
            actor,
            "option",
            0,
            actor.rollInfo.properties.CALLBACK,
            BOTCH_DIE_COUNT
          );
          const roll = msg.rolls[0];
          const msgData = msg.system;

          assert.ok(roll, "roll should exist");
          assertBasicRollStructure(msgData, "Roll while fatigued", "option");
          assert.equal(msgData.confidence.score, 1, "confidence score should be 1");
          assertConfidenceState(msgData);
          assert.equal(msgData.roll.difficulty, 6, "difficulty should be 6");
          assert.equal(msgData.impact.fatigueLevelsLost, 1, "fatigue levels lost should be 1");
          assert.equal(
            initialFatigue + 1,
            actor.system.fatigueCurrent,
            "fatigue should increase by 1 from initial level"
          );

          if (roll.botches) {
            assertBotchBehavior(msgData, roll);
          } else {
            assert.equal(
              msgData.roll.difficulty > msg.rollTotal(0),
              msgData.failedRoll(),
              "failed roll calculation incorrect"
            );
            assert.equal(msgData.impact.applied, false, "impact should not be applied yet");
            assert.equal(msgData.confidence.allowed, true, "confidence should be allowed");
            // Modifier should account for fatigue penalty
            const fatiguePenalty = Math.floor(actor.system.fatigueCurrent / 2);
            const expectedModifier = 1 - fatiguePenalty;
            assert.equal(
              roll.modifier,
              expectedModifier,
              `modifier should be ${expectedModifier} (1 - ${fatiguePenalty} fatigue penalty)`
            );
            await msgData.useConfidence(actor._id);
            assert.equal(msg.system.confidence.used, 1, "confidence.used should be 1");
            assert.equal(msg.system.confidence.allowed, false, "confidence not allowed after use");
          }
        });

        it("Reputation roll", async function () {
          const dataset = {
            roll: "option",
            name: "Dead reputation",
            option1: 1,
            txtoption1: "score"
          };
          actor.rollInfo.init(dataset, actor);
          const msg = await stressDie(
            actor,
            "option",
            0,
            actor.rollInfo.properties.CALLBACK,
            BOTCH_DIE_COUNT
          );
          const roll = msg.rolls[0];
          log(false, roll);

          assert.ok(roll, "roll should exist");
          assertBasicRollStructure(msg.system, "Dead reputation", "option");
          assert.equal(msg.system.confidence.score, 1, "confidence score should be 1");
          assertConfidenceState(msg.system);
          assert.equal(msg.system.roll.difficulty, 0, "difficulty should be 0");
          assertImpactDefaults(msg.system);

          if (roll.botches) {
            assertBotchBehavior(msg.system, roll);
            assert.equal(msg.system.failedRoll(), true, "should be a failed roll");
          } else {
            assert.equal(
              msg.system.roll.difficulty > msg.rollTotal(0),
              msg.system.failedRoll(),
              "failed roll calculation incorrect"
            );
            assert.equal(roll.modifier, 1, "modifier should be 1");
            await assertSuccessWithConfidence(msg, actor, 1);
          }
        });

        it("Simple die with multiple options", async function () {
          const dataset = {
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
          actor.rollInfo.init(dataset, actor);
          const msg = await simpleDie(actor, "option", actor.rollInfo.properties.CALLBACK);
          const roll = msg.rolls[0];
          const msgData = msg.system;
          log(false, roll);

          assert.equal(msgData.roll.botchCheck, false, "botch check should be false");
          assert.equal(msgData.roll.botches, roll.botches, "botch count should match");
          assert.ok(roll.total > 50, "total should be greater than 50");
          assert.equal(roll.modifier, 50, "modifier should be 50");

          assertBasicRollStructure(msgData, "All options", "option");
          assert.equal(msgData.confidence.score, 1, "confidence score should be 1");
          assertConfidenceState(msgData);
          assert.equal(msgData.roll.difficulty, 0, "difficulty should be 0");
          assertImpactDefaults(msgData);
          assert.equal(msgData.impact.applied, false, "impact should not be applied");
          assert.equal(
            msgData.roll.difficulty > msg.rollTotal(0),
            msgData.failedRoll(),
            "failed roll calculation incorrect"
          );

          await msgData.useConfidence(actor._id);
          assert.equal(msg.system.confidence.used, 1, "confidence.used should be 1");
          assert.equal(msg.system.confidence.allowed, false, "confidence not allowed after use");
        });

        it("Init roll", async function () {
          const type = "init";
          const dataset = {
            roll: type,
            name: "Initiative"
          };
          actor.rollInfo.init(dataset, actor);
          const msg = await stressDie(
            actor,
            type,
            0,
            actor.rollInfo.properties.CALLBACK,
            BOTCH_DIE_COUNT
          );
          const roll = msg.rolls[0];
          log(false, roll);

          assert.ok(roll, "roll should exist");
          assertBasicRollStructure(msg.system, "Initiative", "init");
          assert.equal(msg.system.confidence.score, 1, "confidence score should be 1");
          assertConfidenceState(msg.system);
          assert.equal(msg.system.roll.difficulty, 0, "difficulty should be 0");
          assertImpactDefaults(msg.system);

          if (roll.botches) {
            assertBotchBehavior(msg.system, roll);
          } else {
            assert.equal(
              msg.system.roll.difficulty > msg.rollTotal(0),
              msg.system.failedRoll(),
              "failed roll calculation incorrect"
            );
            assert.equal(msg.system.impact.applied, false, "impact should not be applied yet");
            assert.equal(msg.system.confidence.allowed, true, "confidence should be allowed");
            const expectedModifier =
              actor.system.characteristics.qik.value +
              actor.system.combat.init -
              actor.system.combat.overload;
            assert.equal(roll.modifier, expectedModifier, "modifier should match calculation");
            await msg.system.useConfidence(actor._id);
            assert.equal(msg.system.confidence.used, 1, "confidence.used should be 1");
            assert.equal(msg.system.confidence.allowed, false, "confidence not allowed after use");
          }
        });

        describe("Combat rolls", function () {
          this.timeout(300000); // 300 seconds for easier debugging

          it("Combat roll attack", async function () {
            const type = ROLL_PROPERTIES.ATTACK.VAL;
            const dataset = {
              roll: type,
              name: "Combat attack"
            };
            actor.rollInfo.init(dataset, actor);
            const msg = await stressDie(
              actor,
              type,
              0,
              actor.rollInfo.properties.CALLBACK,
              BOTCH_DIE_COUNT
            );
            const roll = msg.rolls[0];
            log(false, roll);

            assert.ok(roll, "roll should exist");
            assertBasicRollStructure(msg.system, "Combat attack", "attack");
            assert.equal(msg.system.confidence.score, 1, "confidence score should be 1");
            assertConfidenceState(msg.system);
            assert.equal(msg.system.roll.difficulty, 0, "difficulty should be 0");
            assertImpactDefaults(msg.system);

            if (roll.botches) {
              assertBotchBehavior(msg.system, roll);
            } else {
              assert.equal(msg.system.impact.applied, false, "impact should not be applied yet");
              assert.equal(msg.system.confidence.allowed, true, "confidence should be allowed");
              const expectedModifier =
                actor.system.characteristics.dex.value +
                actor.system.combat.atk +
                actor.system.combat.ability;
              assert.equal(roll.modifier, expectedModifier, "modifier should match calculation");
              await msg.system.useConfidence(actor._id);
              assert.equal(msg.system.confidence.used, 1, "confidence.used should be 1");
              assert.equal(
                msg.system.confidence.allowed,
                false,
                "confidence not allowed after use"
              );
            }
          });
          it("Combat roll defense", async function () {
            const type = ROLL_PROPERTIES.DEFENSE.VAL;
            const dataset = {
              roll: type,
              name: "Combat defense"
            };
            actor.rollInfo.init(dataset, actor);
            const msg = await stressDie(
              actor,
              type,
              0,
              actor.rollInfo.properties.CALLBACK,
              BOTCH_DIE_COUNT
            );
            const roll = msg.rolls[0];
            log(false, roll);

            assert.ok(roll, "roll should exist");
            assertBasicRollStructure(msg.system, "Combat defense", "defense");
            assert.equal(msg.system.confidence.score, 1, "confidence score should be 1");
            assertConfidenceState(msg.system);
            assert.equal(msg.system.roll.difficulty, 0, "difficulty should be 0");
            assertImpactDefaults(msg.system);

            if (roll.botches) {
              assertBotchBehavior(msg.system, roll);
            } else {
              assert.equal(msg.system.impact.applied, false, "impact should not be applied yet");
              assert.equal(msg.system.confidence.allowed, true, "confidence should be allowed");
              const expectedModifier =
                actor.system.characteristics.qik.value +
                actor.system.combat.ability +
                actor.system.combat.dfn;
              assert.equal(roll.modifier, expectedModifier, "modifier should match calculation");
              await msg.system.useConfidence(actor._id);
              assert.equal(msg.system.confidence.used, 1, "confidence.used should be 1");
              assert.equal(
                msg.system.confidence.allowed,
                false,
                "confidence not allowed after use"
              );
            }
          });
          it("Combat roll with exertion", async function () {
            const type = ROLL_PROPERTIES.ATTACK.VAL;
            const dataset = {
              roll: type,
              name: "Combat exertion"
            };
            actor.rollInfo.init(dataset, actor);
            actor.rollInfo.combat.exertion = true;
            const msg = await stressDie(
              actor,
              type,
              0,
              actor.rollInfo.properties.CALLBACK,
              BOTCH_DIE_COUNT
            );
            const roll = msg.rolls[0];
            log(false, roll);

            assert.ok(roll, "roll should exist");
            assertBasicRollStructure(msg.system, "Combat exertion", "attack");
            assert.equal(msg.system.confidence.score, 1, "confidence score should be 1");
            assertConfidenceState(msg.system);
            assert.equal(msg.system.roll.difficulty, 0, "difficulty should be 0");
            assertImpactDefaults(msg.system);

            if (roll.botches) {
              assertBotchBehavior(msg.system, roll);
            } else {
              assert.equal(msg.system.impact.applied, false, "impact should not be applied yet");
              assert.equal(msg.system.confidence.allowed, true, "confidence should be allowed");
              const expectedModifier =
                actor.system.characteristics.dex.value +
                actor.system.combat.atk +
                2 * actor.system.combat.ability;
              assert.equal(
                roll.modifier,
                expectedModifier,
                "modifier should match calculation with exertion"
              );
              await msg.system.useConfidence(actor._id);
              assert.equal(msg.system.confidence.used, 1, "confidence.used should be 1");
              assert.equal(
                msg.system.confidence.allowed,
                false,
                "confidence not allowed after use"
              );
            }
          });
          it("Combat roll defense with exertion", async function () {
            const type = ROLL_PROPERTIES.DEFENSE.VAL;
            const dataset = {
              roll: type,
              name: "Combat defense exertion"
            };
            actor.rollInfo.init(dataset, actor);
            actor.rollInfo.combat.exertion = true;
            const msg = await stressDie(
              actor,
              type,
              0,
              actor.rollInfo.properties.CALLBACK,
              BOTCH_DIE_COUNT
            );
            const roll = msg.rolls[0];
            log(false, roll);

            assert.ok(roll, "roll should exist");
            assertBasicRollStructure(msg.system, "Combat defense exertion", "defense");
            assert.equal(msg.system.confidence.score, 1, "confidence score should be 1");
            assertConfidenceState(msg.system);
            assert.equal(msg.system.roll.difficulty, 0, "difficulty should be 0");
            assertImpactDefaults(msg.system);

            if (roll.botches) {
              assertBotchBehavior(msg.system, roll);
            } else {
              assert.equal(msg.system.impact.applied, false, "impact should not be applied yet");
              assert.equal(msg.system.confidence.allowed, true, "confidence should be allowed");
              const expectedModifier =
                actor.system.characteristics.qik.value +
                2 * actor.system.combat.ability +
                actor.system.combat.dfn;
              assert.equal(
                roll.modifier,
                expectedModifier,
                "modifier should match calculation with exertion (2x ability)"
              );
              await msg.system.useConfidence(actor._id);
              assert.equal(msg.system.confidence.used, 1, "confidence.used should be 1");
              assert.equal(
                msg.system.confidence.allowed,
                false,
                "confidence not allowed after use"
              );
            }
          });
          it("Combat roll while wounded", async function () {
            await actor.changeWound(3, "light");
            const type = ROLL_PROPERTIES.ATTACK.VAL;
            const dataset = {
              roll: type,
              name: "Combat wounded"
            };
            actor.rollInfo.init(dataset, actor);
            const msg = await stressDie(
              actor,
              type,
              0,
              actor.rollInfo.properties.CALLBACK,
              BOTCH_DIE_COUNT
            );
            const roll = msg.rolls[0];
            log(false, roll);

            assert.ok(roll, "roll should exist");
            assertBasicRollStructure(msg.system, "Combat wounded", "attack");
            assert.equal(msg.system.confidence.score, 1, "confidence score should be 1");
            assertConfidenceState(msg.system);
            assert.equal(msg.system.roll.difficulty, 0, "difficulty should be 0");
            assertImpactDefaults(msg.system);

            if (roll.botches) {
              assert.equal(msg.system.failedRoll(), true, "should be a failed roll");
              assertBotchBehavior(msg.system, roll);
            } else {
              assert.equal(
                msg.system.roll.difficulty > msg.rollTotal(0),
                msg.system.failedRoll(),
                "failed roll calculation incorrect"
              );
              assert.equal(msg.system.impact.applied, false, "impact should not be applied yet");
              assert.equal(msg.system.confidence.allowed, true, "confidence should be allowed");
              const expectedModifier =
                actor.system.characteristics.dex.value +
                actor.system.combat.atk +
                actor.system.combat.ability -
                3;
              assert.equal(
                roll.modifier,
                expectedModifier,
                "modifier should include wound penalty"
              );
              await msg.system.useConfidence(actor._id);
              assert.equal(msg.system.confidence.used, 1, "confidence.used should be 1");
              assert.equal(
                msg.system.confidence.allowed,
                false,
                "confidence not allowed after use"
              );
            }
          });
          it("Combat roll with medium wounds", async function () {
            await actor.changeWound(1, "medium");
            const type = ROLL_PROPERTIES.ATTACK.VAL;
            const dataset = {
              roll: type,
              name: "Combat medium wound"
            };
            actor.rollInfo.init(dataset, actor);
            const msg = await stressDie(
              actor,
              type,
              0,
              actor.rollInfo.properties.CALLBACK,
              BOTCH_DIE_COUNT
            );
            const roll = msg.rolls[0];
            log(false, roll);

            assert.ok(roll, "roll should exist");
            assertBasicRollStructure(msg.system, "Combat medium wound", "attack");
            assert.equal(msg.system.confidence.score, 1, "confidence score should be 1");
            assertConfidenceState(msg.system);
            assert.equal(msg.system.roll.difficulty, 0, "difficulty should be 0");
            assertImpactDefaults(msg.system);

            if (roll.botches) {
              assert.equal(msg.system.failedRoll(), true, "should be a failed roll");
              assertBotchBehavior(msg.system, roll);
            } else {
              assert.equal(
                msg.system.roll.difficulty > msg.rollTotal(0),
                msg.system.failedRoll(),
                "failed roll calculation incorrect"
              );
              assert.equal(msg.system.impact.applied, false, "impact should not be applied yet");
              assert.equal(msg.system.confidence.allowed, true, "confidence should be allowed");
              const expectedModifier =
                actor.system.characteristics.dex.value +
                actor.system.combat.atk +
                actor.system.combat.ability -
                3;
              assert.equal(
                roll.modifier,
                expectedModifier,
                "modifier should include medium wound penalty (-3 per wound)"
              );
              await msg.system.useConfidence(actor._id);
              assert.equal(msg.system.confidence.used, 1, "confidence.used should be 1");
              assert.equal(
                msg.system.confidence.allowed,
                false,
                "confidence not allowed after use"
              );
            }
          });
          it("Combat roll with heavy wounds", async function () {
            await actor.changeWound(1, "heavy");
            const type = ROLL_PROPERTIES.ATTACK.VAL;
            const dataset = {
              roll: type,
              name: "Combat heavy wound"
            };
            actor.rollInfo.init(dataset, actor);
            const msg = await stressDie(
              actor,
              type,
              0,
              actor.rollInfo.properties.CALLBACK,
              BOTCH_DIE_COUNT
            );
            const roll = msg.rolls[0];
            log(false, roll);

            assert.ok(roll, "roll should exist");
            assertBasicRollStructure(msg.system, "Combat heavy wound", "attack");
            assert.equal(msg.system.confidence.score, 1, "confidence score should be 1");
            assertConfidenceState(msg.system);
            assert.equal(msg.system.roll.difficulty, 0, "difficulty should be 0");
            assertImpactDefaults(msg.system);

            if (roll.botches) {
              assertBotchBehavior(msg.system, roll);
            } else {
              assert.equal(msg.system.impact.applied, false, "impact should not be applied yet");
              assert.equal(msg.system.confidence.allowed, true, "confidence should be allowed");
              const expectedModifier =
                actor.system.characteristics.dex.value +
                actor.system.combat.atk +
                actor.system.combat.ability -
                5;
              assert.equal(
                roll.modifier,
                expectedModifier,
                "modifier should include heavy wound penalty (-5 per wound)"
              );
              await msg.system.useConfidence(actor._id);
              assert.equal(msg.system.confidence.used, 1, "confidence.used should be 1");
              assert.equal(
                msg.system.confidence.allowed,
                false,
                "confidence not allowed after use"
              );
            }
          });
          it("Combat roll with incapacitating wounds", async function () {
            await actor.changeWound(1, "incap");
            const type = ROLL_PROPERTIES.ATTACK.VAL;
            const dataset = {
              roll: type,
              name: "Combat incap wound"
            };
            actor.rollInfo.init(dataset, actor);
            const msg = await stressDie(
              actor,
              type,
              0,
              actor.rollInfo.properties.CALLBACK,
              BOTCH_DIE_COUNT
            );
            const roll = msg.rolls[0];
            log(false, roll);

            assert.ok(roll, "roll should exist");
            assertBasicRollStructure(msg.system, "Combat incap wound", "attack");
            assert.equal(msg.system.confidence.score, 1, "confidence score should be 1");
            assertConfidenceState(msg.system);
            assert.equal(msg.system.roll.difficulty, 0, "difficulty should be 0");
            assertImpactDefaults(msg.system);

            if (roll.botches) {
              assertBotchBehavior(msg.system, roll);
            } else {
              assert.equal(msg.system.impact.applied, false, "impact should not be applied yet");
              assert.equal(msg.system.confidence.allowed, true, "confidence should be allowed");
              const expectedModifier =
                actor.system.characteristics.dex.value +
                actor.system.combat.atk +
                actor.system.combat.ability -
                99;
              assert.equal(
                roll.modifier,
                expectedModifier,
                "modifier should include incapacitating wound penalty (-10 per wound)"
              );
              await msg.system.useConfidence(actor._id);
              assert.equal(msg.system.confidence.used, 1, "confidence.used should be 1");
              assert.equal(
                msg.system.confidence.allowed,
                false,
                "confidence not allowed after use"
              );
            }
          });
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
            const fatigueCurrent = actor.system.fatigueCurrent;
            actor.rollInfo.init(dataset, actor);
            const msg = await stressDie(
              actor,
              "option",
              0,
              actor.rollInfo.properties.CALLBACK,
              BOTCH_DIE_COUNT
            );
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
                msgData.roll.difficulty > msg.rollTotal(0),
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
                await msgData.skipConfidenceUse();

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
                await msg.system.skipConfidenceUse();
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

      describe("Confidence mechanics", function () {
        this.timeout(300000); // 300 seconds for easier debugging

        it("Multiple confidence uses", async function () {
          // Temporarily boost actor's confidence score to test multiple uses
          const originalConfidence = actor.system.con.score;
          await actor.update({ "system.con.score": 3 });

          const dataset = {
            roll: "option",
            name: "Multiple Confidence Test",
            option1: 1,
            txtoption1: "score",
            difficulty: 6
          };
          actor.rollInfo.init(dataset, actor);
          const msg = await stressDie(
            actor,
            "option",
            0,
            actor.rollInfo.properties.CALLBACK,
            BOTCH_DIE_COUNT
          );
          const roll = msg.rolls[0];
          const msgData = msg.system;

          assert.ok(roll, "roll should exist");
          assertBasicRollStructure(msgData, "Multiple Confidence Test", "option");
          assert.equal(msgData.confidence.score, 3, "confidence score should be 3");
          assert.equal(msgData.confidence.used, 0, "confidence.used should be 0 initially");

          if (roll.botches) {
            assertBotchBehavior(msgData, roll);
          } else {
            // First confidence use
            assert.equal(
              msg.system.confidence.allowed,
              true,
              "confidence should be allowed (1st use)"
            );
            await msg.system.useConfidence(actor._id);
            assert.equal(msg.system.confidence.used, 1, "confidence.used should be 1");
            assert.equal(
              msg.system.confidence.allowed,
              true,
              "confidence should still be allowed (1/3 used)"
            );

            // Second confidence use
            await msg.system.useConfidence(actor._id);
            assert.equal(msg.system.confidence.used, 2, "confidence.used should be 2");
            assert.equal(
              msg.system.confidence.allowed,
              true,
              "confidence should still be allowed (2/3 used)"
            );

            // Third confidence use (exhausts all points)
            await msg.system.useConfidence(actor._id);
            assert.equal(msg.system.confidence.used, 3, "confidence.used should be 3");
            assert.equal(
              msg.system.confidence.allowed,
              false,
              "confidence should not be allowed (3/3 used - exhausted)"
            );
          }

          // Restore original confidence score
          await actor.update({ "system.con.score": originalConfidence });
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
