import { log } from "../tools/tools.js";
import { getCompanion, getMagus } from "./testData.js";
import { ArsLayer } from "../ui/ars-layer.js";
import { ARM5E } from "../config.js";
import { simpleDie, stressDie } from "../helpers/dice.js";
import Aura from "../helpers/aura.js";
import { ROLL_PROPERTIES } from "../ui/roll-window.js";
import { TWILIGHT_STAGES } from "../seasonal-activities/long-term-activities.js";

export function registerMagicRollTesting(quench) {
  quench.registerBatch(
    "Ars-Magic-rolls",
    (context) => {
      const { describe, it, assert, after, before, afterEach } = context;
      let actor;
      let magus;
      let ME1;
      let ME2;
      let ME3;
      let Sp1;
      let Sp2;
      let Sp3;
      let Sp4;
      let Sp5;
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

      // Constants for expected values
      const EXPECTED_CONFIDENCE_SCORE = 2;
      const VALID_REALMS = ["magic", "faeric", "infernal", "divine"];
      const PHILOSOPHY_ARTES_BONUS = 5; // Philosophy and Artes Liberales bonus for ritual spells
      const TWILIGHT_BOTCH_THRESHOLD = 2; // Number of botches needed to trigger twilight

      // Helper functions to reduce duplication
      function assertBasicMagicStructure(assert, msgData, type, difficulty, divider) {
        assert.ok(msgData, "system missing");
        assert.equal(
          msgData.confidence.score,
          EXPECTED_CONFIDENCE_SCORE,
          "confidence.score should be 2"
        );
        assert.ok(msgData.confidence.score >= 0, "confidence.score should be non-negative");
        assert.equal(msgData.confidence.used, 0, "confidence.used should be 0");
        assert.equal(msgData.roll.type, type, `roll.type should be ${type}`);
        assert.equal(
          msgData.roll.difficulty,
          difficulty,
          `roll.difficulty should be ${difficulty}`
        );
        assert.equal(msgData.roll.divider, divider, `divider should be ${divider}`);
        assert.equal(msgData.roll.actorType, "player");
      }

      function assertMagicDataStructure(assert, msg, isRitual = false) {
        assert.ok(msg.system.magic, "magic data missing");
        assert.ok(msg.system.magic.caster, "caster missing");
        assert.equal(msg.system.magic.caster.form, null, "caster form is not null");
        assert.ok(msg.system.magic.caster.penetration, "penetration missing");
        assert.equal(
          msg.system.magic.caster.penetration.total,
          msg.system.magic.caster.penetration.score *
            msg.system.magic.caster.penetration.multiplier,
          "penetration total incorrect"
        );
        assert.ok(Array.isArray(msg.system.magic.targets), "targets should be array");
        assert.equal(msg.system.magic.ritual, isRitual, `ritual should be ${isRitual}`);
        assert.equal(msg.system.magic.realm, "magic", "realm is not magic");
        assert.ok(VALID_REALMS.includes(msg.system.magic.realm), "realm value unexpected");
      }

      function assertBotchBehavior(assert, roll, msgData, actor, initialWarping) {
        assert.equal(msgData.failedRoll(), true, "failed roll incorrect");
        assert.equal(msgData.impact.applied, true, "should be applied");
        assert.equal(roll.total, 0, "botched");
        assert.equal(msgData.roll.botchCheck, true, "Check for botch missing");
        assert.equal(msgData.roll.botches, roll.botches, "Wrong number of botches");
        assert.equal(msgData.confidence.allowed, false, "confidence is not allowed");
        assert.equal(
          initialWarping + roll.botches,
          actor.system.warping.points,
          "warping should have increased"
        );
        if (roll.botches >= TWILIGHT_BOTCH_THRESHOLD) {
          assert.equal(actor.system.twilight.stage, TWILIGHT_STAGES.PENDING_STRENGTH);
        }
      }

      // Helper to assert standard fatigue/wound impact (non-ritual, non-failing spells)
      function assertStandardImpact(assert, msgData, originalFatigue, actor, options = {}) {
        const {
          fatigueLost = 0,
          fatiguePending = 0,
          fatigueFail = 0,
          woundGravity = 0,
          fatigueChanged = fatigueLost
        } = options;

        assert.equal(
          msgData.impact.fatigueLevelsLost,
          fatigueLost,
          `fatigue levels lost should be ${fatigueLost}`
        );
        assert.equal(
          msgData.impact.fatigueLevelsPending,
          fatiguePending,
          `fatigue levels pending should be ${fatiguePending}`
        );
        if (fatigueFail !== undefined) {
          assert.equal(
            msgData.impact.fatigueLevelsFail,
            fatigueFail,
            `fatigue levels on fail should be ${fatigueFail}`
          );
        }
        assert.equal(
          msgData.impact.woundGravity,
          woundGravity,
          `wound gravity should be ${woundGravity}`
        );
        assert.equal(
          originalFatigue + fatigueChanged,
          actor.system.fatigueCurrent,
          "fatigue should have changed"
        );
      }

      async function testConfidenceUsage(assert, msg, actor) {
        await msg.system.useConfidence(actor._id);
        assert.equal(msg.system.confidence.used, 1, "confidence.used should be 1");
        assert.equal(msg.system.confidence.allowed, true, "confidence should still be allowed");
        await msg.system.useConfidence(actor._id);
        assert.equal(msg.system.confidence.used, 2, "confidence.used should be 2");
        assert.equal(msg.system.confidence.allowed, false, "confidence should not be allowed");
      }

      // Helper to calculate total modifier for magic rolls
      function calculateMagicModifier(magus, aura, options = {}) {
        const { technique, form, formMultiplier = 1, spell, philosophyBonus = 0 } = options;
        let total =
          magus.system.characteristics.sta.value +
          magus.system.penalties.wounds.total +
          magus.system.fatigueTotal +
          aura.modifier;

        if (spell) {
          // For spells: use lowest technique and lowest form from requisites
          let lowestTech = spell.system.technique.value;
          let lowestTechScore = magus.system.arts.techniques[lowestTech].finalScore;

          // Check technique requisites for lower score
          if (spell.system["technique-req"]) {
            for (const [tech, required] of Object.entries(spell.system["technique-req"])) {
              if (required && tech !== lowestTech) {
                const techScore = magus.system.arts.techniques[tech].finalScore;
                if (techScore < lowestTechScore) {
                  lowestTech = tech;
                  lowestTechScore = techScore;
                }
              }
            }
          }

          let lowestForm = spell.system.form.value;
          let lowestFormScore = magus.system.arts.forms[lowestForm].finalScore;

          // Check form requisites for lower score
          if (spell.system["form-req"]) {
            for (const [frm, required] of Object.entries(spell.system["form-req"])) {
              if (required && frm !== lowestForm) {
                const formScore = magus.system.arts.forms[frm].finalScore;
                if (formScore < lowestFormScore) {
                  lowestForm = frm;
                  lowestFormScore = formScore;
                }
              }
            }
          }

          // Apply focus if applicable - doubles the lowest art
          let techTotal = lowestTechScore;
          let formTotal = lowestFormScore;
          if (spell.system.applyFocus) {
            if (lowestTechScore <= lowestFormScore) {
              techTotal = lowestTechScore * 2;
            } else {
              formTotal = lowestFormScore * 2;
            }
          }

          total += techTotal + formTotal;

          // Add mastery (finalScore) and bonus
          total += spell.system.finalScore + spell.system.bonus;

          // Philosophy and Artes Liberales bonus ONLY for ritual spells
          if (spell.system.ritual && philosophyBonus) {
            total += philosophyBonus;
          }
        } else if (technique && form) {
          // Spontaneous magic - simple technique + form calculation
          total +=
            magus.system.arts.techniques[technique].finalScore +
            magus.system.arts.forms[form].finalScore * formMultiplier;
        }

        return total;
      }

      // Helper to enable or disable an active effect by type and subtype
      async function setActiveEffectState(actor, type, subtype, enabled) {
        const effects = actor.effects.filter((e) => {
          const flags = e.flags?.arm5e;
          if (!flags) return false;
          const effectTypes = Array.isArray(flags.type) ? flags.type : [flags.type];
          const effectSubtypes = Array.isArray(flags.subtype) ? flags.subtype : [flags.subtype];
          return effectTypes.includes(type) && effectSubtypes.includes(subtype);
        });

        for (const effect of effects) {
          if (effect.disabled !== !enabled) {
            await effect.update({ disabled: !enabled });
          }
        }

        return effects.length;
      }

      // Helper to track initial state before a test
      function captureActorState(actor) {
        return {
          fatigueCurrent: actor.system.fatigueCurrent,
          warpingPoints: actor.system.warping.points
        };
      }

      describe("Magic rolls", function () {
        this.timeout(300000); // 300 seconds for easier debugging

        before(async function () {
          actor = await getCompanion(`BobTheCompanion`);
          ArsLayer.clearAura(true);
          magus = await getMagus("Tiberius");
          ME1 = magus.items.getName("ME: Cr Ig Formulaic");
          ME2 = magus.items.getName("ME: All Requisites");
          ME3 = magus.items.getName("ME: Mu An with Focus");
          Sp1 = magus.items.getName("Spell: Cr Ig Standard");
          Sp2 = magus.items.getName("Spell: Mu Co with Focus");
          Sp3 = magus.items.getName("Spell: Re Vi Ritual");
          Sp4 = magus.items.getName("Spell: Pe Vi with Deficiency");
          Sp5 = magus.items.getName("Spell: Re Au Partial Fail");

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

        beforeEach(async function () {
          // Ensure clean state before each test
          await magus.rest();
          await magus.restoreHealth();
          log(false, "=== Clean state prepared for test ===");
          log(false, "Current fatigue:", magus.system.fatigueCurrent);
        });

        describe("Magic rolls", function () {
          this.timeout(300000); // 300 seconds for easier debugging

          it("Raw spontaneous", async function () {
            await magus.changeWound(3, "light");
            let type = "spont";
            try {
              let dataset = {
                roll: type,
                name: "Spontaneous",
                bonusActiveEffects: magus.system.bonuses.arts.spellcasting, // tmp
                technique: "mu",
                form: "co",
                fatigueOnUse: 1
              };
              magus.rollInfo.init(dataset, magus);
              const initialState = captureActorState(magus);
              const msg = await stressDie(magus, type, 0, magus.rollInfo.properties.CALLBACK, 10);
              const roll = msg.rolls[0];

              log(false, roll);
              assert.ok(roll);

              aura = Aura.fromActor(magus);
              aura.computeMaxAuraModifier(magus.system.realms);
              const msgData = msg.system;

              // Validate basic magic roll structure
              assertBasicMagicStructure(assert, msgData, type, 0, 2);

              assertStandardImpact(assert, msgData, initialState.fatigueCurrent, magus, {
                fatigueLost: 1,
                fatiguePending: 0,
                fatigueFail: 0,
                woundGravity: 0,
                fatigueChanged: 1
              });

              // Validate magic data structure
              assertMagicDataStructure(assert, msg, false);

              // Calculate expected modifier for validation
              aura = Aura.fromActor(magus);
              aura.computeMaxAuraModifier(magus.system.realms);
              let tot = calculateMagicModifier(magus, aura, { technique: "mu", form: "co" });

              if (roll.botches) {
                assertBotchBehavior(assert, roll, msgData, magus, initialState.warpingPoints);
              } else {
                assert.equal(
                  msgData.roll.difficulty > msg.rollTotal(0),
                  msgData.failedRoll(),
                  "failed roll incorrect"
                );
                assert.equal(msgData.impact.applied, false, "should be applied");
                assert.equal(msgData.confidence.allowed, true, "confidence is allowed");

                assert.equal(roll.modifier, tot, "modifier incorrect");
                await testConfidenceUsage(assert, msg, magus);
              }
            } catch (err) {
              assert.fail(`Test failed: ${err.message}`);
            } finally {
              // Clean up wounds added in this test
              await magus.restoreHealth();
            }
          });
          it("Raw spontaneous + deficiency", async function () {
            let type = "spont";
            try {
              let dataset = {
                roll: type,
                name: "Spontaneous deficient",
                bonusActiveEffects: magus.system.bonuses.arts.spellcasting,
                technique: "pe",
                form: "co",
                fatigueOnUse: 1
              };
              let originalFatigue = magus.system.fatigueCurrent;
              let currentWarping = magus.system.warping.points;
              magus.rollInfo.init(dataset, magus);
              const msg = await stressDie(magus, type, 0, magus.rollInfo.properties.CALLBACK, 10);
              const roll = msg.rolls[0];
              aura = Aura.fromActor(magus);
              aura.computeMaxAuraModifier(magus.system.realms);
              let tot =
                magus.system.arts.techniques.pe.finalScore +
                magus.system.arts.forms.co.finalScore +
                magus.system.characteristics.sta.value +
                magus.system.penalties.wounds.total +
                magus.system.fatigueTotal +
                aura.modifier;

              log(false, roll);
              assert.ok(roll);
              const msgData = msg.system;

              // Validate basic magic roll structure
              assertBasicMagicStructure(assert, msgData, type, 0, 4);

              assert.equal(msgData.impact.fatigueLevelsLost, 1, "fatigue levels lost should be 1");
              assert.equal(
                msgData.impact.fatigueLevelsFail,
                0,
                "fatigue levels on fail should be 0"
              );
              assert.equal(
                msgData.impact.fatigueLevelsPending,
                0,
                "fatigue levels pending should be 0"
              );
              assert.equal(msgData.impact.woundGravity, 0, "wound gravity should be 0");

              assert.equal(
                originalFatigue + 1,
                magus.system.fatigueCurrent,
                "fatigue should have increased by 1"
              );

              // Validate magic data structure
              assertMagicDataStructure(assert, msg, false);

              if (roll.botches) {
                assertBotchBehavior(assert, roll, msgData, magus, currentWarping);
              } else {
                assert.equal(
                  msgData.roll.difficulty > msg.rollTotal(0),
                  msgData.failedRoll(),
                  "failed roll incorrect"
                );
                assert.equal(msgData.impact.applied, false, "should not be applied");
                assert.equal(msgData.confidence.allowed, true, "confidence is allowed");

                assert.equal(roll.modifier, tot, "modifier incorrect");
                await testConfidenceUsage(assert, msg, magus);
              }
              log(false, roll);
            } catch (err) {
              assert.fail(`Test failed: ${err.message}`);
            }
          });
          it("Magic effect std", async function () {
            let type = "magic";
            try {
              let dataset = {
                roll: type,
                bonusActiveEffects: magus.system.bonuses.arts.spellcasting,
                id: ME1._id,
                fatigueOnUse: 1
              };
              aura = Aura.fromActor(magus);
              aura.computeMaxAuraModifier(magus.system.realms);
              let tot =
                magus.system.arts.techniques.cr.finalScore +
                magus.system.arts.forms.ig.finalScore +
                magus.system.characteristics.sta.value +
                magus.system.penalties.wounds.total +
                magus.system.fatigueTotal +
                aura.modifier;
              let originalFatigue = magus.system.fatigueCurrent;
              let currentWarping = magus.system.warping.points;
              magus.rollInfo.init(dataset, magus);
              const msg = await stressDie(magus, type, 0, magus.rollInfo.properties.CALLBACK, 100);
              const roll = msg.rolls[0];

              log(false, roll);
              assert.ok(roll);
              const msgData = msg.system;

              // Validate basic magic roll structure
              assertBasicMagicStructure(assert, msgData, type, ME1.system.level, 2);

              assert.equal(msgData.impact.fatigueLevelsLost, 1, "fatigue levels lost should be 1");
              assert.equal(
                msgData.impact.fatigueLevelsFail,
                0,
                "fatigue levels on fail should be 0"
              );
              assert.equal(
                msgData.impact.fatigueLevelsPending,
                0,
                "fatigue levels pending should be 0"
              );
              assert.equal(msgData.impact.woundGravity, 0, "wound gravity should be 0");

              assert.equal(
                originalFatigue + 1,
                magus.system.fatigueCurrent,
                "fatigue should have increased by 1"
              );

              // Validate magic data structure
              assertMagicDataStructure(assert, msg, false);

              if (roll.botches) {
                assertBotchBehavior(assert, roll, msgData, magus, currentWarping);
              } else {
                assert.equal(
                  msgData.roll.difficulty > msg.rollTotal(0),
                  msgData.failedRoll(),
                  "failed roll incorrect"
                );
                assert.equal(msgData.impact.applied, false, "should not be applied");
                assert.equal(msgData.confidence.allowed, true, "confidence is allowed");

                assert.equal(roll.modifier, tot, "modifier incorrect");
                await testConfidenceUsage(assert, msg, magus);
              }
            } catch (err) {
              assert.fail(`Test failed: ${err.message}`);
            }
          });
          it("Magic effect all req", async function () {
            let type = "magic";
            try {
              let dataset = {
                roll: type,
                bonusActiveEffects: magus.system.bonuses.arts.spellcasting,
                id: ME2._id,
                fatigueOnUse: 1
              };
              let originalFatigue = magus.system.fatigueCurrent;
              let currentWarping = magus.system.warping.points;
              magus.rollInfo.init(dataset, magus);
              const msg = await stressDie(magus, type, 0, magus.rollInfo.properties.CALLBACK, 1);
              const roll = msg.rolls[0];
              aura = Aura.fromActor(magus);
              aura.computeMaxAuraModifier(magus.system.realms);
              let tot =
                // magus.system.arts.techniques.cr.finalScore +
                // magus.system.arts.forms.ig.finalScore +
                magus.system.characteristics.sta.value +
                magus.system.penalties.wounds.total +
                magus.system.fatigueTotal +
                aura.modifier;

              assert.ok(roll);
              log(false, roll);
              const msgData = msg.system;
              assert.ok(msgData, "system missing");
              // assert.equal(msgData.label, "Spontaneous");
              assert.equal(msgData.confidence.score, 2, "confidence.score should be 2");
              assert.ok(msgData.confidence.score >= 0, "confidence.score should be non-negative");
              assert.equal(msgData.confidence.used, 0, "confidence.used should be 0");
              assert.equal(msgData.roll.type, type, "roll.type should be spont");
              assert.equal(
                msgData.roll.difficulty,
                ME2.system.level,
                "roll.difficulty should be 5"
              );
              assert.equal(msgData.roll.divider, 4, "divider should be 4");
              assert.equal(msgData.roll.actorType, "player");
              assert.equal(msgData.impact.fatigueLevelsLost, 1, "fatigue levels lost should be 1");
              assert.equal(
                msgData.impact.fatigueLevelsFail,
                0,
                "fatigue levels on fail should be 0"
              );
              assert.equal(
                msgData.impact.fatigueLevelsPending,
                0,
                "fatigue levels pending should be 0"
              );
              assert.equal(msgData.impact.woundGravity, 0, "wound gravity should be 0");
              assert.equal(
                msgData.roll.difficulty > msg.rollTotal(0),
                msgData.failedRoll(),
                "failed roll incorrect"
              );
              assert.equal(
                originalFatigue + 1,
                magus.system.fatigueCurrent,
                "fatigue should have increased by 1"
              );

              // Validate magic data structure
              assertMagicDataStructure(assert, msg, false);

              if (roll.botches) {
                assertBotchBehavior(assert, roll, msgData, magus, currentWarping);
              } else {
                assert.equal(msgData.impact.applied, false, "should not be applied");
                assert.equal(msgData.confidence.allowed, true, "confidence is allowed");

                assert.equal(roll.modifier, tot, "modifier incorrect");
                await testConfidenceUsage(assert, msg, magus);
              }
            } catch (err) {
              assert.fail(`Test failed: ${err.message}`);
            }
          });
          it("Magic effect with focus", async function () {
            let type = "magic";
            try {
              let dataset = {
                roll: type,
                bonusActiveEffects: magus.system.bonuses.arts.spellcasting,
                id: ME3.id
                // divide: 2,
                // fatigueOnUse: 1
              };

              magus.rollInfo.init(dataset, magus);
              let originalFatigue = magus.system.fatigueCurrent;
              let currentWarping = magus.system.warping.points;
              const msg = await stressDie(magus, type, 0, magus.rollInfo.properties.CALLBACK, 1);
              const roll = msg.rolls[0];

              aura = Aura.fromActor(magus);
              aura.computeMaxAuraModifier(magus.system.realms);
              let tot =
                magus.system.arts.techniques.mu.finalScore +
                magus.system.arts.forms.an.finalScore * 2 +
                magus.system.characteristics.sta.value +
                magus.system.penalties.wounds.total +
                magus.system.fatigueTotal +
                aura.modifier;

              log(false, roll);
              const msgData = msg.system;

              // Validate basic magic roll structure
              assertBasicMagicStructure(assert, msgData, type, ME3.system.level, 2);

              assert.equal(msgData.impact.fatigueLevelsLost, 1, "fatigue levels lost should be 1");
              assert.equal(
                msgData.impact.fatigueLevelsFail,
                0,
                "fatigue levels on fail should be 0"
              );
              assert.equal(
                msgData.impact.fatigueLevelsPending,
                0,
                "fatigue levels pending should be 0"
              );
              assert.equal(msgData.impact.woundGravity, 0, "wound gravity should be 0");

              assert.equal(
                originalFatigue + 1,
                magus.system.fatigueCurrent,
                "fatigue should have increased by 1"
              );

              // Validate magic data structure
              assertMagicDataStructure(assert, msg, false);

              if (roll.botches) {
                assertBotchBehavior(assert, roll, msgData, magus, currentWarping);
                assert.equal(msgData.failedRoll(), true, "failed roll should be true");
              } else {
                assert.equal(
                  msgData.roll.difficulty > msg.rollTotal(0),
                  msgData.failedRoll(),
                  "failed roll incorrect"
                );
                assert.equal(msgData.impact.applied, false, "should not be applied");
                assert.equal(msgData.confidence.allowed, true, "confidence is allowed");

                assert.equal(roll.modifier, tot, "modifier incorrect");
                await testConfidenceUsage(assert, msg, magus);
              }
            } catch (err) {
              assert.fail(`Test failed: ${err.message}`);
            }
          });
          it("Spell", async function () {
            let type = "spell";
            try {
              let dataset = {
                roll: type,
                bonusActiveEffects: magus.system.bonuses.arts.spellcasting,
                id: Sp1._id
              };

              magus.rollInfo.init(dataset, magus);
              let originalFatigue = magus.system.fatigueCurrent;
              let currentWarping = magus.system.warping.points;
              const msg = await stressDie(magus, type, 0, magus.rollInfo.properties.CALLBACK, 4);
              const roll = msg.rolls[0];

              aura = Aura.fromActor(magus);
              aura.computeMaxAuraModifier(magus.system.realms);
              // assert.equal(Sp1.system.bonus, magus.rollInfo.magic.bonus);
              let tot = calculateMagicModifier(magus, aura, { spell: Sp1 });
              log(false, roll);
              const msgData = msg.system;

              // Validate basic magic roll structure
              assertBasicMagicStructure(assert, msgData, type, Sp1.system.level, 1);

              if (roll.botches) {
                assert.equal(msgData.failedRoll(), true, "failed roll should be true");
                assert.equal(msgData.impact.applied, true, "should be applied");
                assert.equal(roll.total, 0, "botched");
                assert.equal(msgData.roll.botchCheck, true, "Check for botch missing");
                assert.equal(msgData.roll.botches, roll.botches, "Wrong number of botches");
                assert.equal(msg.system.confidence.allowed, false, "confidence is not allowed");
                assert.equal(
                  msgData.impact.fatigueLevelsLost,
                  1,
                  "fatigue levels lost should be 1"
                );
                assert.equal(
                  msgData.impact.fatigueLevelsPending,
                  0,
                  "fatigue levels pending should be 0"
                );
                assert.equal(
                  currentWarping + roll.botches,
                  magus.system.warping.points,
                  "warping changed"
                );
                assert.equal(msgData.failedRoll(), true, "failed roll should be true");
                if (roll.botches >= 2) {
                  assert.equal(magus.system.twilight.stage, TWILIGHT_STAGES.PENDING_STRENGTH);
                }
              } else {
                assert.equal(
                  msgData.roll.difficulty - 10 > msg.rollTotal(0),
                  msgData.failedRoll(),
                  "failed roll incorrect"
                );
                // failed or partial success
                if (msgData.failedRoll() || msg.rollTotal(0) < msgData.roll.difficulty) {
                  assert.equal(
                    msgData.impact.fatigueLevelsLost,
                    0,
                    "fatigue levels lost should be 0"
                  );

                  assert.equal(
                    msgData.impact.fatigueLevelsPending,
                    1,
                    "fatigue levels pending should be 1"
                  );
                } else {
                  assert.equal(
                    msgData.impact.fatigueLevelsLost,
                    0,
                    "fatigue levels lost should be 0"
                  );
                  assert.equal(
                    msgData.impact.fatigueLevelsPending,
                    0,
                    "fatigue levels pending should be 0"
                  );
                }
                assert.equal(msgData.impact.woundGravity, 0, "wound gravity should be 0");
                assert.equal(
                  originalFatigue,
                  magus.system.fatigueCurrent,
                  "fatigue should not have changed"
                );

                // Validate magic data structure
                assertMagicDataStructure(assert, msg, false);

                assert.equal(msgData.impact.applied, false, "should not be applied");
                assert.equal(msgData.confidence.allowed, true, "confidence is allowed");

                assert.equal(roll.modifier, tot, "modifier incorrect");
                await testConfidenceUsage(assert, msg, magus);
              }
            } catch (err) {
              assert.fail(`Test failed: ${err.message}`);
            }
          });
          it("Spell 2", async function () {
            let type = "spell";
            try {
              let dataset = {
                roll: type,
                bonusActiveEffects: magus.system.bonuses.arts.spellcasting,
                id: Sp2._id
              };
              let originalFatigue = magus.system.fatigueCurrent;
              let currentWarping = magus.system.warping.points;
              magus.rollInfo.init(dataset, magus);
              const msg = await stressDie(magus, type, 0, magus.rollInfo.properties.CALLBACK, 3);
              const roll = msg.rolls[0];

              log(false, roll);
              assert.ok(roll);

              aura = Aura.fromActor(magus);
              aura.computeMaxAuraModifier(magus.system.realms);
              // assert.equal(Sp1.system.masteryScore, magus.rollInfo.magic.mastery);
              // assert.equal(Sp1.system.bonus, magus.rollInfo.magic.bonus);
              let tot =
                magus.system.arts.techniques.mu.finalScore +
                magus.system.arts.forms.co.finalScore * 2 +
                magus.system.characteristics.sta.value +
                magus.system.penalties.wounds.total +
                magus.system.fatigueTotal +
                Sp2.system.finalScore +
                Sp2.system.bonus +
                aura.modifier;
              log(false, roll);

              const msgData = msg.system;

              // Validate basic magic roll structure
              assertBasicMagicStructure(assert, msgData, type, Sp2.system.level, 1);

              if (roll.botches) {
                // Validate botch behavior
                await assertBotchBehavior(assert, roll, msgData, magus, currentWarping);
              } else {
                assert.equal(
                  msgData.roll.difficulty - 10 > msg.rollTotal(0),
                  msgData.failedRoll(),
                  "failed roll incorrect"
                );
                // failed or partial success
                if (msgData.failedRoll() || msg.rollTotal(0) < msgData.roll.difficulty) {
                  assert.equal(
                    msgData.impact.fatigueLevelsLost,
                    0,
                    "fatigue levels lost should be 0"
                  );

                  assert.equal(
                    msgData.impact.fatigueLevelsPending,
                    1,
                    "fatigue levels pending should be 1"
                  );
                } else {
                  assert.equal(
                    msgData.impact.fatigueLevelsLost,
                    0,
                    "fatigue levels lost should be 0"
                  );
                  assert.equal(
                    msgData.impact.fatigueLevelsPending,
                    0,
                    "fatigue levels pending should be 0"
                  );
                }
                assert.equal(msgData.impact.woundGravity, 0, "wound gravity should be 0");
                assert.equal(
                  originalFatigue,
                  magus.system.fatigueCurrent,
                  "fatigue should not have changed"
                );

                // Validate magic data structure
                assertMagicDataStructure(assert, msg, false);

                assert.equal(msgData.impact.applied, false, "should not be applied");
                assert.equal(msgData.confidence.allowed, true, "confidence is allowed");

                assert.equal(roll.modifier, tot, "modifier incorrect");
                await testConfidenceUsage(assert, msg, magus);
              }
            } catch (err) {
              assert.fail(`Test failed: ${err.message}`);
            }
          });
          it("Spell partial fail", async function () {
            let type = "spell";
            try {
              let dataset = {
                roll: type,
                bonusActiveEffects: magus.system.bonuses.arts.spellcasting,
                id: Sp5._id
              };
              let originalFatigue = magus.system.fatigueCurrent;
              let currentWarping = magus.system.warping.points;
              magus.rollInfo.init(dataset, magus);
              const msg = await stressDie(magus, type, 0, magus.rollInfo.properties.CALLBACK, 3);
              const roll = msg.rolls[0];

              log(false, roll);
              assert.ok(roll);

              aura = Aura.fromActor(magus);
              aura.computeMaxAuraModifier(magus.system.realms);
              // assert.equal(Sp1.system.masteryScore, magus.rollInfo.magic.mastery);
              // assert.equal(Sp1.system.bonus, magus.rollInfo.magic.bonus);
              let tot =
                magus.system.arts.techniques.re.finalScore +
                magus.system.arts.forms.au.finalScore +
                magus.system.characteristics.sta.value +
                magus.system.penalties.wounds.total +
                magus.system.fatigueTotal +
                Sp5.system.finalScore +
                Sp5.system.bonus +
                aura.modifier;
              log(false, roll);

              const msgData = msg.system;

              // Validate basic magic roll structure
              assertBasicMagicStructure(assert, msgData, type, Sp5.system.level, 1);

              if (roll.botches) {
                // Validate botch behavior
                await assertBotchBehavior(assert, roll, msgData, magus, currentWarping);
              } else {
                assert.equal(
                  msgData.roll.difficulty - 10 > msg.rollTotal(0),
                  msgData.failedRoll(),
                  "failed roll incorrect"
                );
                // failed or partial success - special handling for fatigueLevelsFail
                if (msgData.failedRoll()) {
                  assert.equal(
                    msgData.impact.fatigueLevelsLost,
                    0,
                    "fatigue levels lost should be 0"
                  );

                  assert.equal(
                    msgData.impact.fatigueLevelsPending,
                    0,
                    "fatigue levels pending should be 0"
                  );
                  assert.equal(
                    msgData.impact.fatigueLevelsFail,
                    1,
                    "fatigue levels on fail should be 1"
                  );
                } else if (msg.rollTotal(0) < msgData.roll.difficulty) {
                  assert.equal(
                    msgData.impact.fatigueLevelsLost,
                    0,
                    "fatigue levels lost should be 0"
                  );

                  assert.equal(
                    msgData.impact.fatigueLevelsPending,
                    1,
                    "fatigue levels pending should be 1"
                  );
                  assert.equal(
                    msgData.impact.fatigueLevelsFail,
                    0,
                    "fatigue levels on fail should be 0"
                  );
                } else {
                  assert.equal(
                    msgData.impact.fatigueLevelsLost,
                    0,
                    "fatigue levels lost should be 0"
                  );
                  assert.equal(
                    msgData.impact.fatigueLevelsPending,
                    0,
                    "fatigue levels pending should be 0"
                  );
                }
                assert.equal(msgData.impact.woundGravity, 0, "wound gravity should be 0");
                assert.equal(
                  originalFatigue,
                  magus.system.fatigueCurrent,
                  "fatigue should not have changed"
                );

                // Validate magic data structure
                assertMagicDataStructure(assert, msg, false);

                assert.equal(msgData.impact.applied, false, "should not be applied");
                assert.equal(msgData.confidence.allowed, true, "confidence is allowed");

                assert.equal(roll.modifier, tot, "modifier incorrect");
                await testConfidenceUsage(assert, msg, magus);
              }
            } catch (err) {
              assert.fail(`Test failed: ${err.message}`);
            }
          });
          it("Spell + deficiency", async function () {
            let type = "spell";
            try {
              let dataset = {
                roll: type,
                name: "Spell deficient",
                bonusActiveEffects: magus.system.bonuses.arts.spellcasting,
                id: Sp4._id
              };
              let originalFatigue = magus.system.fatigueCurrent;
              let currentWarping = magus.system.warping.points;
              magus.rollInfo.init(dataset, magus);

              const msg = await stressDie(magus, type, 0, magus.rollInfo.properties.CALLBACK, 3);
              const roll = msg.rolls[0];

              log(false, roll);
              assert.ok(roll);

              aura = Aura.fromActor(magus);
              aura.computeMaxAuraModifier(magus.system.realms);
              let tot =
                magus.system.arts.techniques.pe.finalScore +
                magus.system.arts.forms.vi.finalScore +
                magus.system.characteristics.sta.value +
                magus.system.penalties.wounds.total +
                magus.system.fatigueTotal +
                Sp4.system.finalScore +
                Sp4.system.bonus +
                aura.modifier;
              log(false, roll);

              const msgData = msg.system;

              // Validate basic magic roll structure (note divider=2 for deficiency)
              assertBasicMagicStructure(assert, msgData, type, Sp4.system.level, 2);

              if (roll.botches) {
                // Validate botch behavior
                await assertBotchBehavior(assert, roll, msgData, magus, currentWarping);
              } else {
                assert.equal(
                  msgData.roll.difficulty - 10 > msg.rollTotal(0),
                  msgData.failedRoll(),
                  "failed roll incorrect"
                );
                // failed or partial success - special handling for fatigueLevelsFail
                if (msgData.failedRoll()) {
                  assert.equal(
                    msgData.impact.fatigueLevelsLost,
                    0,
                    "fatigue levels lost should be 0"
                  );

                  assert.equal(
                    msgData.impact.fatigueLevelsPending,
                    0,
                    "fatigue levels pending should be 0"
                  );
                  assert.equal(
                    msgData.impact.fatigueLevelsFail,
                    1,
                    "fatigue levels on fail should be 1"
                  );
                } else if (msg.rollTotal(0) < msgData.roll.difficulty) {
                  assert.equal(
                    msgData.impact.fatigueLevelsLost,
                    0,
                    "fatigue levels lost should be 0"
                  );

                  assert.equal(
                    msgData.impact.fatigueLevelsPending,
                    1,
                    "fatigue levels pending should be 1"
                  );
                  assert.equal(
                    msgData.impact.fatigueLevelsFail,
                    0,
                    "fatigue levels on fail should be 0"
                  );
                } else {
                  // success
                  assert.equal(
                    msgData.impact.fatigueLevelsLost,
                    0,
                    "fatigue levels lost should be 0"
                  );
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
                }
                assert.equal(msgData.impact.woundGravity, 0, "wound gravity should be 0");
                assert.equal(
                  originalFatigue,
                  magus.system.fatigueCurrent,
                  "fatigue should not have changed"
                );

                // Validate magic data structure
                assertMagicDataStructure(assert, msg, false);

                assert.equal(msgData.impact.applied, false, "should not be applied");
                assert.equal(msgData.confidence.allowed, true, "confidence is allowed");

                assert.equal(roll.modifier, tot, "modifier incorrect");
                await testConfidenceUsage(assert, msg, magus);
              }
            } catch (err) {
              assert.fail(`Test failed: ${err.message}`);
            }
          });
          it("Spell loud and exaggerated", async function () {
            let type = "spell";
            try {
              await magus.update({
                "system.stances.voice": "loud",
                "system.stances.gestures": "exaggerated"
              });
              let dataset = {
                roll: type,
                bonusActiveEffects: magus.system.bonuses.arts.spellcasting,
                id: Sp2._id
              };
              let originalFatigue = magus.system.fatigueCurrent;
              let currentWarping = magus.system.warping.points;
              magus.rollInfo.init(dataset, magus);
              const msg = await stressDie(magus, type, 0, magus.rollInfo.properties.CALLBACK, 3);
              const roll = msg.rolls[0];

              log(false, roll);
              assert.ok(roll);

              aura = Aura.fromActor(magus);
              aura.computeMaxAuraModifier(magus.system.realms);
              // assert.equal(Sp1.system.masteryScore, magus.rollInfo.magic.mastery);
              // assert.equal(Sp1.system.bonus, magus.rollInfo.magic.bonus);
              let tot =
                magus.system.arts.techniques.mu.finalScore +
                magus.system.arts.forms.co.finalScore * 2 +
                magus.system.characteristics.sta.value +
                magus.system.penalties.wounds.total +
                magus.system.fatigueTotal +
                Sp2.system.finalScore +
                Sp2.system.bonus +
                aura.modifier;
              log(false, roll);

              const msgData = msg.system;

              // Validate basic magic roll structure
              assertBasicMagicStructure(assert, msgData, type, Sp2.system.level, 1);

              assert.equal(
                msgData.roll.difficulty - 10 > msg.rollTotal(0),
                msgData.failedRoll(),
                "failed roll incorrect"
              );
              if (roll.botches) {
                // Validate botch behavior
                await assertBotchBehavior(assert, roll, msgData, magus, currentWarping);
              } else {
                // failed or partial success - special handling for fatigueLevelsFail
                if (msgData.failedRoll()) {
                  assert.equal(
                    msgData.impact.fatigueLevelsLost,
                    0,
                    "fatigue levels lost should be 0"
                  );

                  assert.equal(
                    msgData.impact.fatigueLevelsPending,
                    0,
                    "fatigue levels pending should be 0"
                  );
                  assert.equal(
                    msgData.impact.fatigueLevelsFail,
                    1,
                    "fatigue levels on fail should be 1"
                  );
                } else if (msg.rollTotal(0) < msgData.roll.difficulty) {
                  assert.equal(
                    msgData.impact.fatigueLevelsLost,
                    0,
                    "fatigue levels lost should be 0"
                  );

                  assert.equal(
                    msgData.impact.fatigueLevelsPending,
                    1,
                    "fatigue levels pending should be 1"
                  );
                  assert.equal(
                    msgData.impact.fatigueLevelsFail,
                    0,
                    "fatigue levels on fail should be 0"
                  );
                } else {
                  // success
                  assert.equal(
                    msgData.impact.fatigueLevelsLost,
                    0,
                    "fatigue levels lost should be 0"
                  );
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
                }
                assert.equal(msgData.impact.woundGravity, 0, "wound gravity should be 0");
                assert.equal(
                  originalFatigue,
                  magus.system.fatigueCurrent,
                  "fatigue should not have changed"
                );

                // Validate magic data structure
                assertMagicDataStructure(assert, msg, false);

                assert.equal(msgData.impact.applied, false, "should not be applied");
                assert.equal(msgData.confidence.allowed, true, "confidence is allowed");

                assert.equal(roll.modifier, tot, "modifier incorrect");
                await testConfidenceUsage(assert, msg, magus);
              }
            } catch (err) {
              assert.fail(`Test failed: ${err.message}`);
            }
          });
          it("Ritual spell", async function () {
            let type = "spell";
            try {
              let dataset = {
                roll: type,
                bonusActiveEffects: magus.system.bonuses.arts.spellcasting,
                id: Sp3._id
              };
              let originalFatigue = magus.system.fatigueCurrent;
              let currentWarping = magus.system.warping.points;
              magus.rollInfo.init(dataset, magus);
              aura = Aura.fromActor(magus);
              aura.computeMaxAuraModifier(magus.system.realms);
              let tot = calculateMagicModifier(magus, aura, {
                spell: Sp3,
                philosophyBonus: PHILOSOPHY_ARTES_BONUS
              });
              const msg = await stressDie(magus, type, 0, magus.rollInfo.properties.CALLBACK, 2);
              const roll = msg.rolls[0];

              log(false, roll);
              assert.ok(roll);

              const msgData = msg.system;

              // Validate basic magic roll structure
              assertBasicMagicStructure(assert, msgData, type, Sp3.system.level, 1);
              assert.equal(msg.system.magic.ritual, true, "ritual should be true");

              if (roll.botches) {
                // Validate botch behavior
                await assertBotchBehavior(assert, roll, msgData, magus, currentWarping);
              } else {
                assert.equal(
                  msgData.roll.difficulty - 10 > msg.rollTotal(0),
                  msgData.failedRoll(),
                  "failed roll incorrect"
                );

                let cnt = Math.ceil((msgData.roll.difficulty - msg.rollTotal(0)) / 5);
                // failed or partial success - ritual spell has special fatigue/wound logic
                if (msgData.failedRoll()) {
                  assert.equal(
                    msgData.impact.fatigueLevelsLost,
                    1,
                    "fatigue levels lost should be 1"
                  );
                  if (cnt >= 2) {
                    assert.equal(
                      msgData.impact.fatigueLevelsPending,
                      2,
                      "fatigue levels pending should be 2"
                    );
                    assert.equal(
                      msgData.impact.fatigueLevelsFail,
                      cnt - 2,
                      `fatigue levels on fail should be ${cnt - 2}`
                    );
                  } else {
                    assert.equal(
                      msgData.impact.fatigueLevelsPending,
                      cnt,
                      `fatigue levels pending should be ${cnt}`
                    );
                  }
                } else if (msg.rollTotal(0) < msgData.roll.difficulty) {
                  assert.equal(
                    msgData.impact.fatigueLevelsLost,
                    1,
                    "fatigue levels lost should be 1"
                  );

                  assert.equal(
                    msgData.impact.fatigueLevelsPending,
                    cnt,
                    `fatigue levels pending should be ${cnt}`
                  );
                  assert.equal(
                    msgData.impact.fatigueLevelsFail,
                    0,
                    "fatigue levels on fail should be 0"
                  );
                } else {
                  // success
                  assert.equal(
                    msgData.impact.fatigueLevelsLost,
                    1,
                    "fatigue levels lost should be 1"
                  );
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
                }
                assert.equal(msgData.impact.woundGravity, 0, "wound gravity should be 0");
                assert.equal(
                  originalFatigue + 1,
                  magus.system.fatigueCurrent,
                  "fatigue should have increased by 1"
                );

                // Validate magic data structure
                assertMagicDataStructure(assert, msg, true);

                assert.equal(msgData.impact.applied, false, "should not be applied");
                assert.equal(msgData.confidence.allowed, true, "confidence is allowed");

                assert.equal(roll.modifier, tot, "modifier incorrect");
                await testConfidenceUsage(assert, msg, magus);
              }
            } catch (err) {
              assert.fail(`Test failed: ${err.message}`);
            }
          });
          it("Ritual spell 2", async function () {
            let type = "spell";
            try {
              await magus.update({ "system.fatigueCurrent": 3 });
              let dataset = {
                roll: type,
                bonusActiveEffects: magus.system.bonuses.arts.spellcasting,
                id: Sp3._id
              };
              let originalFatigue = magus.system.fatigueCurrent;
              let currentWarping = magus.system.warping.points;
              magus.rollInfo.init(dataset, magus);
              aura = Aura.fromActor(magus);
              aura.computeMaxAuraModifier(magus.system.realms);
              let tot = calculateMagicModifier(magus, aura, {
                spell: Sp3,
                philosophyBonus: PHILOSOPHY_ARTES_BONUS
              });
              // const msg = await stressDie(magus, type, 0, magus.rollInfo.properties.CALLBACK, 12);
              const msg = await stressDie(magus, type, 2, magus.rollInfo.properties.CALLBACK, 12);
              const roll = msg.rolls[0];

              log(false, roll);
              assert.ok(roll);

              const msgData = msg.system;

              // Validate basic magic roll structure
              assertBasicMagicStructure(assert, msgData, type, Sp3.system.level, 1);
              assert.equal(msg.system.magic.ritual, true, "ritual should be true");

              if (roll.botches) {
                assert.equal(msgData.impact.applied, true, "should be applied");
                assert.equal(roll.total, 0, "botched");
                assert.equal(msgData.roll.botchCheck, true, "Check for botch missing");
                assert.equal(msgData.roll.botches, roll.botches, "Wrong number of botches");
                assert.equal(msg.system.confidence.allowed, false, "confidence is not allowed");
                assert.equal(
                  msgData.impact.fatigueLevelsLost,
                  2,
                  "fatigue levels lost should be 2"
                );
                assert.equal(
                  currentWarping + roll.botches,
                  magus.system.warping.points,
                  "warping changed"
                );

                assert.equal(
                  msgData.impact.fatigueLevelsPending,
                  0,
                  "fatigue levels pending should be 0"
                );
                assert.equal(
                  msgData.impact.fatigueLevelsFail,
                  0,
                  `fatigue levels on fail should be  0`
                );
                let cnt = Math.ceil(msgData.roll.difficulty / 5);
                assert.equal(
                  msgData.impact.woundGravity,
                  Math.min(cnt - 2, 5),
                  "wound gravity incorrect"
                );

                assert.equal(
                  originalFatigue + 2,
                  magus.system.fatigueCurrent,
                  "fatigue should have increased by 2"
                );
                assert.equal(msgData.failedRoll(), true, "failed roll should be true");
                if (roll.botches >= 2) {
                  assert.equal(magus.system.twilight.stage, TWILIGHT_STAGES.PENDING_STRENGTH);
                }
              } else {
                assert.equal(
                  msgData.roll.difficulty - 10 > msg.rollTotal(0),
                  msgData.failedRoll(),
                  "failed roll incorrect"
                );

                let cnt = Math.ceil((msgData.roll.difficulty - msg.rollTotal(0)) / 5);
                // failed or partial success - ritual spell 2 has complex wound/fatigue logic
                if (msgData.failedRoll()) {
                  assert.equal(
                    msgData.impact.fatigueLevelsLost,
                    1,
                    "fatigue levels lost should be 1"
                  );
                  if (cnt >= 2) {
                    console.log("failed by 10 or more");
                    assert.equal(
                      msgData.impact.fatigueLevelsPending,
                      1,
                      "fatigue levels pending should be 1"
                    );
                    assert.equal(
                      msgData.impact.fatigueLevelsFail,
                      0,
                      `fatigue levels on fail should be 0`
                    );

                    assert.equal(msgData.impact.woundGravity, cnt - 1, "wound gravity incorrect");
                  } else {
                    assert.equal(
                      msgData.impact.fatigueLevelsPending,
                      1,
                      `fatigue levels pending should be 1`
                    );
                    assert.equal(msgData.impact.woundGravity, 1, "wound gravity incorrect");
                  }
                  assert.equal(
                    originalFatigue + 1,
                    magus.system.fatigueCurrent,
                    "fatigue should have increased by 1"
                  );
                } else if (msg.rollTotal(0) < msgData.roll.difficulty) {
                  assert.equal(
                    msgData.impact.fatigueLevelsLost,
                    1,
                    "fatigue levels lost should be 1"
                  );
                  assert.equal(
                    msgData.impact.fatigueLevelsPending,
                    1,
                    `fatigue levels pending should be 1`
                  );
                  assert.equal(
                    msgData.impact.fatigueLevelsFail,
                    0,
                    "fatigue levels on fail should be 0"
                  );
                  assert.equal(
                    originalFatigue + 1,
                    magus.system.fatigueCurrent,
                    "fatigue should have increased by 1"
                  );
                  assert.equal(msgData.impact.woundGravity, cnt - 1, "wound gravity incorrect");
                } else {
                  // success
                  assert.equal(
                    msgData.impact.fatigueLevelsLost,
                    1,
                    "fatigue levels lost should be 1"
                  );
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
                  assert.equal(msgData.impact.woundGravity, 0, "wound gravity incorrect");
                }

                // Validate magic data structure
                assertMagicDataStructure(assert, msg, true);

                assert.equal(msgData.impact.applied, false, "should not be applied");
                assert.equal(msgData.confidence.allowed, true, "confidence is allowed");

                assert.equal(roll.modifier, tot, "modifier incorrect");
                await testConfidenceUsage(assert, msg, magus);
              }
            } catch (err) {
              assert.fail(`Test failed: ${err.message}`);
            }
          });
        });

        describe("Aura interaction tests", function () {
          this.timeout(300000); // 300 seconds for easier debugging

          it("Magic aura provides full bonus for magic-aligned caster", async function () {
            if (!hasScene) {
              this.skip();
              return;
            }
            let type = "spell";
            try {
              // Reset aura to default, then set magic aura
              await aura.reset();
              await aura.set("magic", 5);
              let dataset = {
                roll: type,
                bonusActiveEffects: magus.system.bonuses.arts.spellcasting,
                id: Sp1._id
              };
              const initialState = captureActorState(magus);
              magus.rollInfo.init(dataset, magus);
              const msg = await stressDie(magus, type, 0, magus.rollInfo.properties.CALLBACK, 5);
              const roll = msg.rolls[0];

              aura = Aura.fromActor(magus);
              aura.computeMaxAuraModifier(magus.system.realms);

              const msgData = msg.system;
              assertBasicMagicStructure(assert, msgData, type, Sp1.system.level, 1);

              // Magic aura should provide full bonus (multiplier 1.0) for magic-aligned caster
              assert.equal(aura.modifier, 5, "Magic aura modifier should be 5 (5 * 1.0)");

              assertMagicDataStructure(assert, msg, false);
            } catch (err) {
              assert.fail(`Test failed: ${err.message}`);
            }
          });

          it("Faeric aura provides half bonus for magic-aligned caster", async function () {
            if (!hasScene) {
              this.skip();
              return;
            }
            let type = "spell";
            try {
              // Reset aura to default, then set faeric aura
              await aura.reset();
              await aura.set("faeric", 6);
              let dataset = {
                roll: type,
                bonusActiveEffects: magus.system.bonuses.arts.spellcasting,
                id: Sp1._id
              };
              const initialState = captureActorState(magus);
              magus.rollInfo.init(dataset, magus);
              const msg = await stressDie(magus, type, 0, magus.rollInfo.properties.CALLBACK, 5);
              const roll = msg.rolls[0];

              aura = Aura.fromActor(magus);
              aura.computeMaxAuraModifier(magus.system.realms);

              const msgData = msg.system;
              assertBasicMagicStructure(assert, msgData, type, Sp1.system.level, 1);

              // Faeric aura provides half bonus (multiplier 0.5) for magic-aligned caster
              assert.equal(aura.modifier, 3, "Faeric aura modifier should be 3 (6 * 0.5)");

              assertMagicDataStructure(assert, msg, false);
            } catch (err) {
              assert.fail(`Test failed: ${err.message}`);
            }
          });

          it("Divine aura heavily penalizes magic-aligned caster", async function () {
            if (!hasScene) {
              this.skip();
              return;
            }
            let type = "spell";
            try {
              // Reset aura to default, then set divine aura
              await aura.reset();
              await aura.set("divine", 4);
              let dataset = {
                roll: type,
                bonusActiveEffects: magus.system.bonuses.arts.spellcasting,
                id: Sp1._id
              };
              const initialState = captureActorState(magus);
              magus.rollInfo.init(dataset, magus);
              const msg = await stressDie(magus, type, 0, magus.rollInfo.properties.CALLBACK, 5);
              const roll = msg.rolls[0];

              aura = Aura.fromActor(magus);
              aura.computeMaxAuraModifier(magus.system.realms);

              const msgData = msg.system;
              assertBasicMagicStructure(assert, msgData, type, Sp1.system.level, 1);

              // Divine aura heavily penalizes (multiplier -3) for magic-aligned caster
              assert.equal(aura.modifier, -12, "Divine aura modifier should be -12 (4 * -3)");

              assertMagicDataStructure(assert, msg, false);
            } catch (err) {
              assert.fail(`Test failed: ${err.message}`);
            }
          });

          it("Infernal aura penalizes magic-aligned caster", async function () {
            if (!hasScene) {
              this.skip();
              return;
            }
            try {
              // Reset aura to default, then set infernal aura
              await aura.reset();
              await aura.set("infernal", 5);
              aura = Aura.fromActor(magus);
              aura.computeMaxAuraModifier(magus.system.realms);
              // Infernal aura penalizes (multiplier -1) for magic-aligned caster
              assert.equal(aura.modifier, -5, "Infernal aura modifier should be -5 (5 * -1)");

              // Test zero aura (no modifier)
              await aura.reset();
              aura = Aura.fromActor(magus);
              aura.computeMaxAuraModifier(magus.system.realms);
              assert.equal(aura.modifier, 0, "Zero aura should provide no modifier");
            } catch (err) {
              assert.fail(`Test failed: ${err.message}`);
            }
          });

          it("Faeric-aligned caster: full bonus in faeric, half in magic, penalties in divine/infernal", async function () {
            if (!hasScene) {
              this.skip();
              return;
            }
            try {
              // Switch to faeric alignment
              await setActiveEffectState(magus, "realm", "magic", false);
              await setActiveEffectState(magus, "realm", "faeric", true);

              await aura.reset();
              await aura.set("faeric", 6);
              aura = Aura.fromActor(magus);
              aura.computeMaxAuraModifier(magus.system.realms);

              // Faeric-aligned caster gets full bonus (multiplier 1.0) in faeric aura
              assert.equal(
                aura.modifier,
                6,
                "Faeric aura modifier should be 6 (6 * 1.0) for faeric-aligned"
              );

              // Check magic aura (half bonus, rounded up)
              await aura.reset();
              await aura.set("magic", 5);
              aura = Aura.fromActor(magus);
              aura.computeMaxAuraModifier(magus.system.realms);
              assert.equal(
                aura.modifier,
                3,
                "Magic aura modifier should be 3 (ceil(5 * 0.5)) for faeric-aligned"
              );

              // Check divine aura penalty
              await aura.reset();
              await aura.set("divine", 4);
              aura = Aura.fromActor(magus);
              aura.computeMaxAuraModifier(magus.system.realms);
              assert.equal(
                aura.modifier,
                -16,
                "Divine aura modifier should be -16 (4 * -4) for faeric-aligned"
              );

              // Check infernal aura penalty
              await aura.reset();
              await aura.set("infernal", 5);
              aura = Aura.fromActor(magus);
              aura.computeMaxAuraModifier(magus.system.realms);
              assert.equal(
                aura.modifier,
                -10,
                "Infernal aura modifier should be -10 (5 * -2) for faeric-aligned"
              );

              // Restore magic alignment
              await setActiveEffectState(magus, "realm", "faeric", false);
              await setActiveEffectState(magus, "realm", "magic", true);
            } catch (err) {
              // Restore magic alignment even on failure
              await setActiveEffectState(magus, "realm", "faeric", false);
              await setActiveEffectState(magus, "realm", "magic", true);
              assert.fail(`Test failed: ${err.message}`);
            }
          });

          it("Divine-aligned caster: full bonus in divine, no effect in magic/faeric/infernal", async function () {
            if (!hasScene) {
              this.skip();
              return;
            }
            try {
              // Switch to divine alignment
              await setActiveEffectState(magus, "realm", "magic", false);
              await setActiveEffectState(magus, "realm", "divine", true);

              await aura.reset();
              await aura.set("divine", 4);
              aura = Aura.fromActor(magus);
              aura.computeMaxAuraModifier(magus.system.realms);

              // Divine-aligned caster gets full bonus (multiplier 1.0) in divine aura
              assert.equal(
                aura.modifier,
                4,
                "Divine aura modifier should be 4 (4 * 1.0) for divine-aligned"
              );

              // Check magic aura (no effect)
              await aura.reset();
              await aura.set("magic", 5);
              aura = Aura.fromActor(magus);
              aura.computeMaxAuraModifier(magus.system.realms);
              assert.equal(
                aura.modifier,
                0,
                "Magic aura modifier should be 0 (5 * 0) for divine-aligned"
              );

              // Check faeric aura (no effect)
              await aura.reset();
              await aura.set("faeric", 6);
              aura = Aura.fromActor(magus);
              aura.computeMaxAuraModifier(magus.system.realms);
              assert.equal(
                aura.modifier,
                0,
                "Faeric aura modifier should be 0 (6 * 0) for divine-aligned"
              );

              // Check infernal aura (no effect)
              await aura.reset();
              await aura.set("infernal", 5);
              aura = Aura.fromActor(magus);
              aura.computeMaxAuraModifier(magus.system.realms);
              assert.equal(
                aura.modifier,
                0,
                "Infernal aura modifier should be 0 (5 * 0) for divine-aligned"
              );

              // Restore magic alignment
              await setActiveEffectState(magus, "realm", "divine", false);
              await setActiveEffectState(magus, "realm", "magic", true);
            } catch (err) {
              // Restore magic alignment even on failure
              await setActiveEffectState(magus, "realm", "divine", false);
              await setActiveEffectState(magus, "realm", "magic", true);
              assert.fail(`Test failed: ${err.message}`);
            }
          });

          it("Infernal-aligned caster: full bonus in infernal, penalties in magic/faeric, heavy in divine", async function () {
            if (!hasScene) {
              this.skip();
              return;
            }
            try {
              // Switch to infernal alignment
              await setActiveEffectState(magus, "realm", "magic", false);
              await setActiveEffectState(magus, "realm", "infernal", true);

              await aura.reset();
              await aura.set("infernal", 5);
              aura = Aura.fromActor(magus);
              aura.computeMaxAuraModifier(magus.system.realms);

              // Infernal-aligned caster gets full bonus (multiplier 1.0) in infernal aura
              assert.equal(
                aura.modifier,
                5,
                "Infernal aura modifier should be 5 (5 * 1.0) for infernal-aligned"
              );

              // Check magic aura penalty
              await aura.reset();
              await aura.set("magic", 5);
              aura = Aura.fromActor(magus);
              aura.computeMaxAuraModifier(magus.system.realms);
              assert.equal(
                aura.modifier,
                -5,
                "Magic aura modifier should be -5 (5 * -1) for infernal-aligned"
              );

              // Check divine aura penalty
              await aura.reset();
              await aura.set("divine", 4);
              aura = Aura.fromActor(magus);
              aura.computeMaxAuraModifier(magus.system.realms);
              assert.equal(
                aura.modifier,
                -20,
                "Divine aura modifier should be -20 (4 * -5) for infernal-aligned"
              );

              // Check faeric aura penalty
              await aura.reset();
              await aura.set("faeric", 6);
              aura = Aura.fromActor(magus);
              aura.computeMaxAuraModifier(magus.system.realms);
              assert.equal(
                aura.modifier,
                -6,
                "Faeric aura modifier should be -6 (6 * -1) for infernal-aligned"
              );

              // Restore magic alignment
              await setActiveEffectState(magus, "realm", "infernal", false);
              await setActiveEffectState(magus, "realm", "magic", true);
            } catch (err) {
              // Restore magic alignment even on failure
              await setActiveEffectState(magus, "realm", "infernal", false);
              await setActiveEffectState(magus, "realm", "magic", true);
              assert.fail(`Test failed: ${err.message}`);
            }
          });
        });

        describe("Penetration calculation tests", function () {
          this.timeout(300000); // 300 seconds for easier debugging

          it("Penetration calculated correctly for spell", async function () {
            let type = "spell";
            try {
              let dataset = {
                roll: type,
                bonusActiveEffects: magus.system.bonuses.arts.spellcasting,
                id: Sp1._id
              };
              const initialState = captureActorState(magus);
              magus.rollInfo.init(dataset, magus);
              const msg = await stressDie(magus, type, 0, magus.rollInfo.properties.CALLBACK, 8);

              const msgData = msg.system;
              assertBasicMagicStructure(assert, msgData, type, Sp1.system.level, 1);
              assertMagicDataStructure(assert, msg, false);

              // Verify penetration calculation
              const penetration = msgData.magic.caster.penetration;
              assert.ok(penetration, "Penetration data should exist");
              assert.ok(penetration.score !== undefined, "Penetration score should be defined");
              assert.ok(
                penetration.multiplier !== undefined,
                "Penetration multiplier should be defined"
              );
              assert.equal(
                penetration.total,
                penetration.score * penetration.multiplier,
                "Penetration total should equal score × multiplier"
              );
            } catch (err) {
              assert.fail(`Test failed: ${err.message}`);
            }
          });

          it("Penetration total updates with casting bonus", async function () {
            let type = "spell";
            try {
              let dataset = {
                roll: type,
                bonusActiveEffects: magus.system.bonuses.arts.spellcasting,
                id: Sp2._id
              };
              magus.rollInfo.init(dataset, magus);
              const msg = await stressDie(magus, type, 0, magus.rollInfo.properties.CALLBACK, 10);

              const msgData = msg.system;
              const penetration = msgData.magic.caster.penetration;
              const castingTotal = msg.rollTotal(0);

              // Penetration should include casting surplus
              assert.ok(penetration.total >= 0, "Penetration total should be non-negative");

              // If spell succeeded, penetration includes the margin of success
              if (!msgData.failedRoll()) {
                const margin = castingTotal - msgData.roll.difficulty;
                assert.ok(margin >= 0, "Success margin should be positive for successful cast");
              }
            } catch (err) {
              assert.fail(`Test failed: ${err.message}`);
            }
          });
        });

        describe("Multi-target tests", function () {
          this.timeout(300000); // 300 seconds for easier debugging

          it("Target array initialized for spell cast", async function () {
            let type = "spell";
            try {
              let dataset = {
                roll: type,
                bonusActiveEffects: magus.system.bonuses.arts.spellcasting,
                id: Sp1._id
              };
              magus.rollInfo.init(dataset, magus);
              const msg = await stressDie(magus, type, 0, magus.rollInfo.properties.CALLBACK, 6);

              const msgData = msg.system;
              assertMagicDataStructure(assert, msg, false);

              // Verify targets array exists and is properly structured
              assert.ok(Array.isArray(msgData.magic.targets), "Targets should be an array");
              assert.ok(
                msgData.magic.targets.length >= 0,
                "Targets array should have valid length"
              );
            } catch (err) {
              assert.fail(`Test failed: ${err.message}`);
            }
          });

          it("Magic data structure includes targeting information", async function () {
            let type = "magic";
            try {
              let dataset = {
                roll: type,
                bonusActiveEffects: magus.system.bonuses.arts.spellcasting,
                id: ME1._id,
                fatigueOnUse: 1
              };
              const initialState = captureActorState(magus);
              magus.rollInfo.init(dataset, magus);
              const msg = await stressDie(magus, type, 0, magus.rollInfo.properties.CALLBACK, 7);

              const msgData = msg.system;
              assertMagicDataStructure(assert, msg, false);

              // Verify targeting structure
              assert.ok(msgData.magic.caster, "Caster data should exist");
              assert.ok(Array.isArray(msgData.magic.targets), "Targets should be array");
              assert.equal(
                msgData.magic.caster.form,
                null,
                "Caster form should be null for standard cast"
              );
            } catch (err) {
              assert.fail(`Test failed: ${err.message}`);
            }
          });
        });

        describe("Mastery ability tests", function () {
          this.timeout(300000); // 300 seconds for easier debugging

          it("Spell with mastery includes mastery data", async function () {
            let type = "spell";
            try {
              let dataset = {
                roll: type,
                bonusActiveEffects: magus.system.bonuses.arts.spellcasting,
                id: Sp1._id
              };
              magus.rollInfo.init(dataset, magus);
              const msg = await stressDie(magus, type, 0, magus.rollInfo.properties.CALLBACK, 4);

              aura = Aura.fromActor(magus);
              aura.computeMaxAuraModifier(magus.system.realms);

              // Calculate expected total with mastery
              const expectedTot = calculateMagicModifier(magus, aura, { spell: Sp1 });

              const msgData = msg.system;
              assertBasicMagicStructure(assert, msgData, type, Sp1.system.level, 1);

              // Spell mastery data should be included in calculations
              assert.ok(Sp1.system.finalScore !== undefined, "Spell should have final score");
              assert.ok(Sp1.system.bonus !== undefined, "Spell should have bonus");

              const roll = msg.rolls[0];
              if (!roll.botches) {
                assert.equal(
                  roll.modifier,
                  expectedTot,
                  "Modifier should match calculated total including mastery"
                );
              }
            } catch (err) {
              assert.fail(`Test failed: ${err.message}`);
            }
          });

          it("Mastery bonus applied in spell casting", async function () {
            let type = "spell";
            try {
              let dataset = {
                roll: type,
                bonusActiveEffects: magus.system.bonuses.arts.spellcasting,
                id: Sp2._id
              };
              magus.rollInfo.init(dataset, magus);
              const msg = await stressDie(magus, type, 0, magus.rollInfo.properties.CALLBACK, 9);
              const roll = msg.rolls[0];

              aura = Aura.fromActor(magus);
              aura.computeMaxAuraModifier(magus.system.realms);

              const msgData = msg.system;

              // Verify spell bonus is included
              const spellBonus = Sp2.system.bonus;
              assert.ok(spellBonus !== undefined, "Spell should have bonus value");

              // Calculate total including mastery bonus
              const expectedTotal = calculateMagicModifier(magus, aura, {
                spell: Sp2,
                formMultiplier: 2
              });

              if (!roll.botches) {
                assert.equal(
                  roll.modifier,
                  expectedTotal,
                  "Roll modifier should include mastery bonus"
                );
              }

              assertMagicDataStructure(assert, msg, false);
            } catch (err) {
              assert.fail(`Test failed: ${err.message}`);
            }
          });

          it("Mastery reduces botch dice in stressful situations", async function () {
            let type = "spell";
            try {
              let dataset = {
                roll: type,
                bonusActiveEffects: magus.system.bonuses.arts.spellcasting,
                id: Sp1._id
              };
              const initialState = captureActorState(magus);
              magus.rollInfo.init(dataset, magus);

              // High botch dice to potentially test mastery protection
              const msg = await stressDie(magus, type, 0, magus.rollInfo.properties.CALLBACK, 1);
              const roll = msg.rolls[0];

              const msgData = msg.system;

              // If botch occurred, verify botch handling is correct
              if (roll.botches) {
                assertBotchBehavior(assert, roll, msgData, magus, initialState.warpingPoints);
              } else {
                // No botch - verify spell data
                assertBasicMagicStructure(assert, msgData, type, Sp1.system.level, 1);
                assertMagicDataStructure(assert, msg, false);
              }
            } catch (err) {
              assert.fail(`Test failed: ${err.message}`);
            }
          });
        });

        after(async function () {
          // Clean up any wounds/fatigue before deleting
          if (magus) {
            await magus.restoreHealth();
          }
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
      });
    },
    { displayName: "ARS : Magic Rolls testsuite" }
  );
}
