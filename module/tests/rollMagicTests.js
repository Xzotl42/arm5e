import { log } from "../tools.js";
import { getCompanion, getMagus } from "./testData.js";
import { ArsLayer } from "../ui/ars-layer.js";
import { ARM5E } from "../config.js";
import { simpleDie, stressDie } from "../dice.js";
import Aura from "../helpers/aura.js";
import { ROLL_PROPERTIES } from "../helpers/rollWindow.js";
import { TWILIGHT_STAGES } from "../helpers/long-term-activities.js";

export function registerMagicRollTesting(quench) {
  quench.registerBatch(
    "Ars-Magic-rolls",
    (context) => {
      const { describe, it, assert, after, before } = context;
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
      describe("Magic rolls", function () {
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
          Sp5 = magus.items.getName("Spell partial failing");

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

        describe("Magic rolls", function () {
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
              let fatigueCurrent = magus.system.fatigueCurrent;
              let currentWarping = magus.system.warping.points;
              const msg = await stressDie(magus, type, 0, magus.rollInfo.properties.CALLBACK, 10);
              const roll = msg.rolls[0];

              log(false, roll);
              assert.ok(roll);

              const aura = Aura.fromActor(magus);
              aura.computeMaxAuraModifier(magus.system.realms);
              const msgData = msg.system;
              assert.ok(msgData, "system missing");
              // assert.equal(msgData.label, "Spontaneous");
              assert.equal(msgData.confidence.score, 2, "confidence.score should be 2");
              assert.ok(msgData.confidence.score >= 0, "confidence.score should be non-negative");
              assert.equal(msgData.confidence.used, 0, "confidence.used should be 0");
              assert.equal(msgData.roll.type, type, "roll.type should be spont");
              assert.equal(msgData.roll.difficulty, 0, "roll.difficulty should be 0");
              assert.equal(msgData.roll.divider, 2, "divider should be 2");
              assert.equal(msgData.roll.actorType, "player");
              assert.equal(msgData.impact.fatigueLevelsLost, 1, "fatigue levels lost should be 1");
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
              assert.equal(msgData.impact.woundGravity, 0, "wound gravity should be 0");

              assert.equal(fatigueCurrent + 1, magus.system.fatigueCurrent, "fatigue not changed");

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
              assert.equal(msg.system.magic.ritual, false, "ritual should be false");
              assert.equal(msg.system.magic.realm, "magic", "realm is not magic");

              assert.ok(
                ["magic", "faeric", "infernal", "divine"].includes(msg.system.magic.realm),
                "realm value unexpected"
              );

              if (roll.botches) {
                assert.equal(msgData.failedRoll(), true, "failed roll incorrect");
                assert.equal(msgData.impact.applied, true, "shoud be applied");
                assert.equal(roll.total, 0, "botched");
                assert.equal(msgData.roll.botchCheck, true, "Check for botch missing");
                assert.equal(msgData.roll.botches, roll.botches, "Wrong number of botches");
                assert.equal(msg.system.confidence.allowed, false, "confidence is not allowed");
                assert.equal(
                  currentWarping + roll.botches,
                  magus.system.warping.points,
                  "warping changed"
                );
                if (roll.botches >= 2) {
                  assert.equal(magus.system.twilight.stage, TWILIGHT_STAGES.PENDING_STRENGTH);
                }
              } else {
                assert.equal(
                  msgData.roll.difficulty > msg.rollTotal(0),
                  msgData.failedRoll(),
                  "failed roll incorrect"
                );
                assert.equal(msgData.impact.applied, false, "shoud not be applied");
                assert.equal(msgData.confidence.allowed, true, "confidence is allowed");

                let tot =
                  magus.system.arts.techniques.mu.finalScore +
                  magus.system.arts.forms.co.finalScore +
                  magus.system.characteristics.sta.value +
                  magus.system.penalties.wounds.total +
                  magus.system.fatigueTotal +
                  aura.modifier;

                assert.equal(roll.modifier, tot, "bad modifier");
                await msgData.useConfidence(magus._id);
                assert.equal(msg.system.confidence.used, 1, "confidence.used should be 1");
                assert.equal(msg.system.confidence.allowed, true, "confidence is not allowed");
                await msgData.useConfidence(magus._id);
                assert.equal(msg.system.confidence.used, 2, "confidence.used should be 2");
                assert.equal(msg.system.confidence.allowed, false, "confidence is allowed");
              }
            } catch (err) {
              console.error(`Error: ${err}`);
              // assert.ok(false);
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
              let fatigueCurrent = magus.system.fatigueCurrent;
              let currentWarping = magus.system.warping.points;
              await magus.rest();
              magus.rollInfo.init(dataset, magus);
              const msg = await stressDie(magus, type, 0, magus.rollInfo.properties.CALLBACK, 10);
              const roll = msg.rolls[0];
              const aura = Aura.fromActor(magus);
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
              assert.ok(msgData, "system missing");
              // assert.equal(msgData.label, "Spontaneous");
              assert.equal(msgData.confidence.score, 2, "confidence.score should be 2");
              assert.ok(msgData.confidence.score >= 0, "confidence.score should be non-negative");
              assert.equal(msgData.confidence.used, 0, "confidence.used should be 0");
              assert.equal(msgData.roll.type, type, "roll.type should be spont");
              assert.equal(msgData.roll.difficulty, 0, "roll.difficulty should be 0");
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

              assert.equal(fatigueCurrent + 1, magus.system.fatigueCurrent, "fatigue not changed");

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
              assert.equal(msg.system.magic.ritual, false, "ritual should be false");
              assert.equal(msg.system.magic.realm, "magic", "realm is not magic");

              assert.ok(
                ["magic", "faeric", "infernal", "divine"].includes(msg.system.magic.realm),
                "realm value unexpected"
              );

              if (roll.botches) {
                assert.equal(msgData.failedRoll(), true, "failed roll incorrect");
                assert.equal(msgData.impact.applied, true, "shoud be applied");
                assert.equal(roll.total, 0, "botched");
                assert.equal(msgData.roll.botchCheck, true, "Check for botch missing");
                assert.equal(msgData.roll.botches, roll.botches, "Wrong number of botches");
                assert.equal(msg.system.confidence.allowed, false, "confidence is not allowed");
                assert.equal(
                  currentWarping + roll.botches,
                  magus.system.warping.points,
                  "warping changed"
                );
                if (roll.botches >= 2) {
                  assert.equal(magus.system.twilight.stage, TWILIGHT_STAGES.PENDING_STRENGTH);
                }
              } else {
                assert.equal(
                  msgData.roll.difficulty > msg.rollTotal(0),
                  msgData.failedRoll(),
                  "failed roll incorrect"
                );
                assert.equal(msgData.impact.applied, false, "shoud not be applied");
                assert.equal(msgData.confidence.allowed, true, "confidence is allowed");

                assert.equal(roll.modifier, tot, "bad modifier");
                await msgData.useConfidence(magus._id);
                assert.equal(msg.system.confidence.used, 1, "confidence.used should be 1");
                assert.equal(msg.system.confidence.allowed, true, "confidence is not allowed");
                await msgData.useConfidence(magus._id);
                assert.equal(msg.system.confidence.used, 2, "confidence.used should be 2");
                assert.equal(msg.system.confidence.allowed, false, "confidence is allowed");
              }
              log(false, roll);
            } catch (err) {
              console.error(`Error: ${err}`);
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
              const aura = Aura.fromActor(magus);
              aura.computeMaxAuraModifier(magus.system.realms);
              let tot =
                magus.system.arts.techniques.cr.finalScore +
                magus.system.arts.forms.ig.finalScore +
                magus.system.characteristics.sta.value +
                magus.system.penalties.wounds.total +
                magus.system.fatigueTotal +
                aura.modifier;
              let fatigueCurrent = magus.system.fatigueCurrent;
              let currentWarping = magus.system.warping.points;
              await magus.rest();
              magus.rollInfo.init(dataset, magus);
              const msg = await stressDie(magus, type, 0, magus.rollInfo.properties.CALLBACK, 100);
              const roll = msg.rolls[0];

              log(false, roll);
              assert.ok(roll);
              const msgData = msg.system;
              assert.ok(msgData, "system missing");
              // assert.equal(msgData.label, "Spontaneous");
              assert.equal(msgData.confidence.score, 2, "confidence.score should be 2");
              assert.ok(msgData.confidence.score >= 0, "confidence.score should be non-negative");
              assert.equal(msgData.confidence.used, 0, "confidence.used should be 0");
              assert.equal(msgData.roll.type, type, "roll.type should be spont");
              assert.equal(
                msgData.roll.difficulty,
                ME1.system.level,
                "roll.difficulty should be 10"
              );
              assert.equal(msgData.roll.divider, 2, "divider should be 2");
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

              assert.equal(fatigueCurrent, magus.system.fatigueCurrent, "fatigue not changed");

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
              assert.equal(msg.system.magic.ritual, false, "ritual should be false");
              assert.equal(msg.system.magic.realm, "magic", "realm is not magic");

              assert.ok(
                ["magic", "faeric", "infernal", "divine"].includes(msg.system.magic.realm),
                "realm value unexpected"
              );

              if (roll.botches) {
                assert.equal(msgData.failedRoll(), true, "failed roll incorrect");
                assert.equal(msgData.impact.applied, true, "shoud be applied");
                assert.equal(roll.total, 0, "botched");
                assert.equal(msgData.roll.botchCheck, true, "Check for botch missing");
                assert.equal(msgData.roll.botches, roll.botches, "Wrong number of botches");
                assert.equal(msg.system.confidence.allowed, false, "confidence is not allowed");
                assert.equal(
                  currentWarping + roll.botches,
                  magus.system.warping.points,
                  "warping changed"
                );
                if (roll.botches >= 2) {
                  assert.equal(magus.system.twilight.stage, TWILIGHT_STAGES.PENDING_STRENGTH);
                }
              } else {
                assert.equal(
                  msgData.roll.difficulty > msg.rollTotal(0),
                  msgData.failedRoll(),
                  "failed roll incorrect"
                );
                assert.equal(msgData.impact.applied, false, "shoud not be applied");
                assert.equal(msgData.confidence.allowed, true, "confidence is allowed");

                assert.equal(roll.modifier, tot, "bad modifier");
                await msgData.useConfidence(magus._id);
                assert.equal(msg.system.confidence.used, 1, "confidence.used should be 1");
                assert.equal(msg.system.confidence.allowed, true, "confidence is not allowed");
                await msgData.useConfidence(magus._id);
                assert.equal(msg.system.confidence.used, 2, "confidence.used should be 2");
                assert.equal(msg.system.confidence.allowed, false, "confidence is allowed");
              }
            } catch (err) {
              console.error(`Error: ${err}`);
              assert.ok(false);
            }
          });
          it("Magic effect all req", async function () {
            let type = "magic";
            try {
              await magus.rest();
              let dataset = {
                roll: type,
                bonusActiveEffects: magus.system.bonuses.arts.spellcasting,
                id: ME2._id,
                fatigueOnUse: 1
              };
              let fatigueCurrent = magus.system.fatigueCurrent;
              let currentWarping = magus.system.warping.points;
              await magus.rest();
              magus.rollInfo.init(dataset, magus);
              const msg = await stressDie(magus, type, 0, magus.rollInfo.properties.CALLBACK, 1);
              const roll = msg.rolls[0];
              const aura = Aura.fromActor(magus);
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
              assert.equal(fatigueCurrent + 1, magus.system.fatigueCurrent, "fatigue not changed");

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
              assert.equal(msg.system.magic.ritual, false, "ritual should be false");
              assert.equal(msg.system.magic.realm, "magic", "realm is not magic");

              assert.ok(
                ["magic", "faeric", "infernal", "divine"].includes(msg.system.magic.realm),
                "realm value unexpected"
              );

              if (roll.botches) {
                assert.equal(msgData.impact.applied, true, "shoud be applied");
                assert.equal(roll.total, 0, "botched");
                assert.equal(msgData.roll.botchCheck, true, "Check for botch missing");
                assert.equal(msgData.roll.botches, roll.botches, "Wrong number of botches");
                assert.equal(msg.system.confidence.allowed, false, "confidence is not allowed");
                assert.equal(
                  currentWarping + roll.botches,
                  magus.system.warping.points,
                  "warping changed"
                );
                if (roll.botches >= 2) {
                  assert.equal(magus.system.twilight.stage, TWILIGHT_STAGES.PENDING_STRENGTH);
                }
              } else {
                assert.equal(msgData.impact.applied, false, "shoud not be applied");
                assert.equal(msgData.confidence.allowed, true, "confidence is allowed");

                assert.equal(roll.modifier, tot, "bad modifier");
                await msgData.useConfidence(magus._id);
                assert.equal(msg.system.confidence.used, 1, "confidence.used should be 1");
                assert.equal(msg.system.confidence.allowed, true, "confidence is not allowed");
                await msgData.useConfidence(magus._id);
                assert.equal(msg.system.confidence.used, 2, "confidence.used should be 2");
                assert.equal(msg.system.confidence.allowed, false, "confidence is allowed");
              }
            } catch (err) {
              console.error(`Error: ${err}`);
              assert.ok(false);
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
              await magus.rest();
              let fatigueCurrent = magus.system.fatigueCurrent;
              let currentWarping = magus.system.warping.points;
              const msg = await stressDie(magus, type, 0, magus.rollInfo.properties.CALLBACK, 1);
              const roll = msg.rolls[0];

              const aura = Aura.fromActor(magus);
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
              assert.ok(msgData, "system missing");
              // assert.equal(msgData.label, "Spontaneous");
              assert.equal(msgData.confidence.score, 2, "confidence.score should be 2");
              assert.ok(msgData.confidence.score >= 0, "confidence.score should be non-negative");
              assert.equal(msgData.confidence.used, 0, "confidence.used should be 0");
              assert.equal(msgData.roll.type, type, "roll.type should be spont");
              assert.equal(
                msgData.roll.difficulty,
                ME3.system.level,
                "roll.difficulty should be 25"
              );
              assert.equal(msgData.roll.divider, 2, "divider should be 2");
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

              assert.equal(fatigueCurrent + 1, magus.system.fatigueCurrent, "fatigue not changed");

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
              assert.equal(msg.system.magic.ritual, false, "ritual should be false");
              assert.equal(msg.system.magic.realm, "magic", "realm is not magic");

              assert.ok(
                ["magic", "faeric", "infernal", "divine"].includes(msg.system.magic.realm),
                "realm value unexpected"
              );

              if (roll.botches) {
                assert.equal(msgData.impact.applied, true, "shoud be applied");
                assert.equal(roll.total, 0, "botched");
                assert.equal(msgData.roll.botchCheck, true, "Check for botch missing");
                assert.equal(msgData.roll.botches, roll.botches, "Wrong number of botches");
                assert.equal(msg.system.confidence.allowed, false, "confidence is not allowed");
                assert.equal(
                  currentWarping + roll.botches,
                  magus.system.warping.points,
                  "warping changed"
                );
                if (roll.botches >= 2) {
                  assert.equal(magus.system.twilight.stage, TWILIGHT_STAGES.PENDING_STRENGTH);
                }
                assert.equal(msgData.failedRoll(), true, "failed roll should be true");
              } else {
                assert.equal(
                  msgData.roll.difficulty > msg.rollTotal(0),
                  msgData.failedRoll(),
                  "failed roll incorrect"
                );
                assert.equal(msgData.impact.applied, false, "shoud not be applied");
                assert.equal(msgData.confidence.allowed, true, "confidence is allowed");

                assert.equal(roll.modifier, tot, "bad modifier");
                await msgData.useConfidence(magus._id);
                assert.equal(msg.system.confidence.used, 1, "confidence.used should be 1");
                assert.equal(msg.system.confidence.allowed, true, "confidence is not allowed");
                await msgData.useConfidence(magus._id);
                assert.equal(msg.system.confidence.used, 2, "confidence.used should be 2");
                assert.equal(msg.system.confidence.allowed, false, "confidence is allowed");
              }
            } catch (err) {
              console.error(`Error: ${err}`);
              assert.ok(false);
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
              await magus.rest();
              let fatigueCurrent = magus.system.fatigueCurrent;
              let currentWarping = magus.system.warping.points;
              const msg = await stressDie(magus, type, 0, magus.rollInfo.properties.CALLBACK, 4);
              const roll = msg.rolls[0];

              const aura = Aura.fromActor(magus);
              aura.computeMaxAuraModifier(magus.system.realms);
              // assert.equal(Sp1.system.bonus, magus.rollInfo.magic.bonus);
              let tot =
                magus.system.arts.techniques.mu.finalScore +
                magus.system.arts.forms.im.finalScore +
                magus.system.characteristics.sta.value +
                magus.system.penalties.wounds.total +
                magus.system.fatigueTotal +
                Sp1.system.finalScore +
                Sp1.system.bonus +
                aura.modifier;
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
                Sp1.system.level,
                "roll.difficulty should be 25"
              );
              assert.equal(msgData.roll.divider, 1, "divider should be 1");
              assert.equal(msgData.roll.actorType, "player");

              if (roll.botches) {
                assert.equal(msgData.failedRoll(), true, "failed roll should be true");
                assert.equal(msgData.impact.applied, true, "shoud be applied");
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
                assert.equal(fatigueCurrent, magus.system.fatigueCurrent, "fatigue not changed");
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
                assert.equal(msg.system.magic.ritual, false, "ritual should be false");
                assert.equal(msg.system.magic.realm, "magic", "realm is not magic");

                assert.ok(
                  ["magic", "faeric", "infernal", "divine"].includes(msg.system.magic.realm),
                  "realm value unexpected"
                );

                assert.equal(msgData.impact.applied, false, "shoud not be applied");
                assert.equal(msgData.confidence.allowed, true, "confidence is allowed");

                assert.equal(roll.modifier, tot, "bad modifier");
                await msgData.useConfidence(magus._id);
                assert.equal(msg.system.confidence.used, 1, "confidence.used should be 1");
                assert.equal(msg.system.confidence.allowed, true, "confidence is not allowed");

                await msgData.useConfidence(magus._id);
                assert.equal(msg.system.confidence.used, 2, "confidence.used should be 2");
                assert.equal(msg.system.confidence.allowed, false, "confidence is allowed");
              }
            } catch (err) {
              console.error(`Error: ${err}`);
              assert.ok(false);
            }
          });
          it("Spell 2", async function () {
            let type = "spell";
            try {
              await magus.rest();
              let dataset = {
                roll: type,
                bonusActiveEffects: magus.system.bonuses.arts.spellcasting,
                id: Sp2._id
              };
              let fatigueCurrent = magus.system.fatigueCurrent;
              let currentWarping = magus.system.warping.points;
              magus.rollInfo.init(dataset, magus);
              await magus.rest();
              const msg = await stressDie(magus, type, 0, magus.rollInfo.properties.CALLBACK, 3);
              const roll = msg.rolls[0];

              log(false, roll);
              assert.ok(roll);

              const aura = Aura.fromActor(magus);
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
              assert.ok(msgData, "system missing");
              // assert.equal(msgData.label, "Spontaneous");
              assert.equal(msgData.confidence.score, 2, "confidence.score should be 2");
              assert.ok(msgData.confidence.score >= 0, "confidence.score should be non-negative");
              assert.equal(msgData.confidence.used, 0, "confidence.used should be 0");
              assert.equal(msgData.roll.type, type, "roll.type should be spont");
              assert.equal(
                msgData.roll.difficulty,
                Sp2.system.level,
                "roll.difficulty should be 25"
              );
              assert.equal(msgData.roll.divider, 1, "divider should be 1");
              assert.equal(msgData.roll.actorType, "player");

              if (roll.botches) {
                assert.equal(msgData.failedRoll(), true, "failed roll should be true");
                assert.equal(msgData.impact.applied, true, "shoud be applied");
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
                assert.equal(fatigueCurrent, magus.system.fatigueCurrent, "fatigue not changed");
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
                assert.equal(msg.system.magic.ritual, false, "ritual should be false");
                assert.equal(msg.system.magic.realm, "magic", "realm is not magic");

                assert.ok(
                  ["magic", "faeric", "infernal", "divine"].includes(msg.system.magic.realm),
                  "realm value unexpected"
                );

                assert.equal(msgData.impact.applied, false, "shoud not be applied");
                assert.equal(msgData.confidence.allowed, true, "confidence is allowed");

                assert.equal(roll.modifier, tot, "bad modifier");
                await msgData.useConfidence(magus._id);
                assert.equal(msg.system.confidence.used, 1, "confidence.used should be 1");
                assert.equal(msg.system.confidence.allowed, true, "confidence is not allowed");

                await msgData.useConfidence(magus._id);
                assert.equal(msg.system.confidence.used, 2, "confidence.used should be 2");
                assert.equal(msg.system.confidence.allowed, false, "confidence is allowed");
              }
            } catch (err) {
              console.error(`Error: ${err}`);
              assert.ok(false);
            }
          });
          it("Spell partial fail", async function () {
            let type = "spell";
            try {
              await magus.rest();
              let dataset = {
                roll: type,
                bonusActiveEffects: magus.system.bonuses.arts.spellcasting,
                id: Sp5._id
              };
              let fatigueCurrent = magus.system.fatigueCurrent;
              let currentWarping = magus.system.warping.points;
              magus.rollInfo.init(dataset, magus);
              const msg = await stressDie(magus, type, 0, magus.rollInfo.properties.CALLBACK, 3);
              const roll = msg.rolls[0];

              log(false, roll);
              assert.ok(roll);

              const aura = Aura.fromActor(magus);
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
              assert.ok(msgData, "system missing");
              // assert.equal(msgData.label, "Spontaneous");
              assert.equal(msgData.confidence.score, 2, "confidence.score should be 2");
              assert.ok(msgData.confidence.score >= 0, "confidence.score should be non-negative");
              assert.equal(msgData.confidence.used, 0, "confidence.used should be 0");
              assert.equal(msgData.roll.type, type, "roll.type should be spont");
              assert.equal(
                msgData.roll.difficulty,
                Sp5.system.level,
                "roll.difficulty should be 25"
              );
              assert.equal(msgData.roll.divider, 1, "divider should be 1");
              assert.equal(msgData.roll.actorType, "player");

              if (roll.botches) {
                assert.equal(msgData.failedRoll(), true, "failed roll should be true");
                assert.equal(msgData.impact.applied, true, "shoud be applied");
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
                assert.equal(fatigueCurrent, magus.system.fatigueCurrent, "fatigue not changed");
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
                assert.equal(msg.system.magic.ritual, false, "ritual should be false");
                assert.equal(msg.system.magic.realm, "magic", "realm is not magic");

                assert.ok(
                  ["magic", "faeric", "infernal", "divine"].includes(msg.system.magic.realm),
                  "realm value unexpected"
                );

                assert.equal(msgData.impact.applied, false, "shoud not be applied");
                assert.equal(msgData.confidence.allowed, true, "confidence is allowed");

                assert.equal(roll.modifier, tot, "bad modifier");
                await msgData.useConfidence(magus._id);
                assert.equal(msg.system.confidence.used, 1, "confidence.used should be 1");
                assert.equal(msg.system.confidence.allowed, true, "confidence is not allowed");

                await msgData.useConfidence(magus._id);
                assert.equal(msg.system.confidence.used, 2, "confidence.used should be 2");
                assert.equal(msg.system.confidence.allowed, false, "confidence is allowed");
              }
            } catch (err) {
              console.error(`Error: ${err}`);
              assert.ok(false);
            }
          });
          it("Spell + deficiency", async function () {
            let type = "spell";
            try {
              await magus.rest();
              let dataset = {
                roll: type,
                name: "Spell deficient",
                bonusActiveEffects: magus.system.bonuses.arts.spellcasting,
                id: Sp4._id
              };
              let fatigueCurrent = magus.system.fatigueCurrent;
              let currentWarping = magus.system.warping.points;
              magus.rollInfo.init(dataset, magus);

              const msg = await stressDie(magus, type, 0, magus.rollInfo.properties.CALLBACK, 3);
              const roll = msg.rolls[0];

              log(false, roll);
              assert.ok(roll);

              const aura = Aura.fromActor(magus);
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
              assert.ok(msgData, "system missing");
              // assert.equal(msgData.label, "Spontaneous");
              assert.equal(msgData.confidence.score, 2, "confidence.score should be 2");
              assert.ok(msgData.confidence.score >= 0, "confidence.score should be non-negative");
              assert.equal(msgData.confidence.used, 0, "confidence.used should be 0");
              assert.equal(msgData.roll.type, type, "roll.type should be spont");
              assert.equal(
                msgData.roll.difficulty,
                Sp4.system.level,
                "roll.difficulty should be 25"
              );
              assert.equal(msgData.roll.divider, 2, "divider should be 2");
              assert.equal(msgData.roll.actorType, "player");

              if (roll.botches) {
                assert.equal(msgData.failedRoll(), true, "failed roll should be true");
                assert.equal(msgData.impact.applied, true, "shoud be applied");
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
                assert.equal(fatigueCurrent, magus.system.fatigueCurrent, "fatigue not changed");
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
                assert.equal(msg.system.magic.ritual, false, "ritual should be false");
                assert.equal(msg.system.magic.realm, "magic", "realm is not magic");

                assert.ok(
                  ["magic", "faeric", "infernal", "divine"].includes(msg.system.magic.realm),
                  "realm value unexpected"
                );

                assert.equal(msgData.impact.applied, false, "shoud not be applied");
                assert.equal(msgData.confidence.allowed, true, "confidence is allowed");

                assert.equal(roll.modifier, tot, "bad modifier");
                await msgData.useConfidence(magus._id);
                assert.equal(msg.system.confidence.used, 1, "confidence.used should be 1");
                assert.equal(msg.system.confidence.allowed, true, "confidence is not allowed");

                await msgData.useConfidence(magus._id);
                assert.equal(msg.system.confidence.used, 2, "confidence.used should be 2");
                assert.equal(msg.system.confidence.allowed, false, "confidence is allowed");
              }
            } catch (err) {
              console.error(`Error: ${err}`);
              assert.ok(false);
            }
          });
          it("Spell loud and exaggerated", async function () {
            let type = "spell";
            try {
              await magus.rest();
              await magus.update({
                "system.stances.voice": "loud",
                "system.stances.gestures": "exaggerated"
              });
              let dataset = {
                roll: type,
                bonusActiveEffects: magus.system.bonuses.arts.spellcasting,
                id: Sp2._id
              };
              let fatigueCurrent = magus.system.fatigueCurrent;
              let currentWarping = magus.system.warping.points;
              magus.rollInfo.init(dataset, magus);
              const msg = await stressDie(magus, type, 0, magus.rollInfo.properties.CALLBACK, 3);
              const roll = msg.rolls[0];

              log(false, roll);
              assert.ok(roll);

              const aura = Aura.fromActor(magus);
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
              assert.ok(msgData, "system missing");
              // assert.equal(msgData.label, "Spontaneous");
              assert.equal(msgData.confidence.score, 2, "confidence.score should be 2");
              assert.ok(msgData.confidence.score >= 0, "confidence.score should be non-negative");
              assert.equal(msgData.confidence.used, 0, "confidence.used should be 0");
              assert.equal(msgData.roll.type, type, "roll.type should be spont");
              assert.equal(
                msgData.roll.difficulty,
                Sp2.system.level,
                "roll.difficulty should be 25"
              );
              assert.equal(msgData.roll.divider, 1, "divider should be 1");
              assert.equal(msgData.roll.actorType, "player");

              assert.equal(
                msgData.roll.difficulty - 10 > msg.rollTotal(0),
                msgData.failedRoll(),
                "failed roll incorrect"
              );
              if (roll.botches) {
                assert.equal(msgData.impact.applied, true, "shoud be applied");
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
                // failed or partial success
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
                assert.equal(fatigueCurrent, magus.system.fatigueCurrent, "fatigue not changed");
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
                assert.equal(msg.system.magic.ritual, false, "ritual should be false");
                assert.equal(msg.system.magic.realm, "magic", "realm is not magic");

                assert.ok(
                  ["magic", "faeric", "infernal", "divine"].includes(msg.system.magic.realm),
                  "realm value unexpected"
                );

                assert.equal(msgData.impact.applied, false, "shoud not be applied");
                assert.equal(msgData.confidence.allowed, true, "confidence is allowed");

                assert.equal(roll.modifier, tot, "bad modifier");
                await msgData.useConfidence(magus._id);
                assert.equal(msg.system.confidence.used, 1, "confidence.used should be 1");
                assert.equal(msg.system.confidence.allowed, true, "confidence is not allowed");

                await msgData.useConfidence(magus._id);
                assert.equal(msg.system.confidence.used, 2, "confidence.used should be 2");
                assert.equal(msg.system.confidence.allowed, false, "confidence is allowed");
              }
            } catch (err) {
              console.error(`Error: ${err}`);
              assert.ok(false);
            }
          });
          it("Ritual spell", async function () {
            let type = "spell";
            try {
              await magus.rest();
              let dataset = {
                roll: type,
                bonusActiveEffects: magus.system.bonuses.arts.spellcasting,
                id: Sp3._id
              };
              let fatigueCurrent = magus.system.fatigueCurrent;
              let currentWarping = magus.system.warping.points;
              magus.rollInfo.init(dataset, magus);
              const aura = Aura.fromActor(magus);
              aura.computeMaxAuraModifier(magus.system.realms);
              let tot =
                magus.system.arts.techniques.mu.finalScore +
                magus.system.arts.forms.vi.finalScore +
                magus.system.characteristics.sta.value +
                magus.system.penalties.wounds.total +
                magus.system.fatigueTotal +
                Sp3.system.finalScore +
                Sp3.system.bonus +
                5 + // phylosophy and artes liberales
                aura.modifier;
              const msg = await stressDie(magus, type, 0, magus.rollInfo.properties.CALLBACK, 2);
              const roll = msg.rolls[0];

              log(false, roll);
              assert.ok(roll);

              const msgData = msg.system;
              assert.ok(msgData, "system missing");
              // assert.equal(msgData.label, "Spontaneous");
              assert.equal(msgData.confidence.score, 2, "confidence.score should be 2");
              assert.ok(msgData.confidence.score >= 0, "confidence.score should be non-negative");
              assert.equal(msgData.confidence.used, 0, "confidence.used should be 0");
              assert.equal(msgData.roll.type, type, "roll.type should be spont");
              assert.equal(
                msgData.roll.difficulty,
                Sp3.system.level,
                "roll.difficulty should be 25"
              );
              assert.equal(msgData.roll.divider, 1, "divider should be 1");
              assert.equal(msgData.roll.actorType, "player");
              assert.equal(msg.system.magic.ritual, true, "ritual should be true");
              if (roll.botches) {
                assert.equal(msgData.impact.applied, true, "shoud be applied");
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

                let cnt = Math.ceil((msgData.roll.difficulty - msg.rollTotal(0)) / 5);
                // failed or partial success
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
                  fatigueCurrent + 1,
                  magus.system.fatigueCurrent,
                  "fatigue not changed"
                );
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

                assert.equal(msg.system.magic.realm, "magic", "realm is not magic");

                assert.ok(
                  ["magic", "faeric", "infernal", "divine"].includes(msg.system.magic.realm),
                  "realm value unexpected"
                );

                assert.equal(msgData.impact.applied, false, "shoud not be applied");
                assert.equal(msgData.confidence.allowed, true, "confidence is allowed");

                assert.equal(roll.modifier, tot, "bad modifier");
                await msgData.useConfidence(magus._id);
                assert.equal(msg.system.confidence.used, 1, "confidence.used should be 1");
                assert.equal(msg.system.confidence.allowed, true, "confidence is not allowed");

                await msgData.useConfidence(magus._id);
                assert.equal(msg.system.confidence.used, 2, "confidence.used should be 2");
                assert.equal(msg.system.confidence.allowed, false, "confidence is allowed");
              }
            } catch (err) {
              console.error(`Error: ${err}`);
              assert.ok(false);
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
              let fatigueCurrent = magus.system.fatigueCurrent;
              let currentWarping = magus.system.warping.points;
              await magus.restoreHealth();
              magus.rollInfo.init(dataset, magus);
              const aura = Aura.fromActor(magus);
              aura.computeMaxAuraModifier(magus.system.realms);
              let tot =
                magus.system.arts.techniques.mu.finalScore +
                magus.system.arts.forms.vi.finalScore +
                magus.system.characteristics.sta.value +
                magus.system.penalties.wounds.total +
                magus.system.fatigueTotal +
                Sp3.system.finalScore +
                Sp3.system.bonus +
                5 + // phylosophy and artes liberales
                aura.modifier;
              // const msg = await stressDie(magus, type, 0, magus.rollInfo.properties.CALLBACK, 12);
              const msg = await stressDie(magus, type, 2, magus.rollInfo.properties.CALLBACK, 12);
              const roll = msg.rolls[0];

              log(false, roll);
              assert.ok(roll);

              const msgData = msg.system;
              assert.ok(msgData, "system missing");
              // assert.equal(msgData.label, "Spontaneous");
              assert.equal(msgData.confidence.score, 2, "confidence.score should be 2");
              assert.ok(msgData.confidence.score >= 0, "confidence.score should be non-negative");
              assert.equal(msgData.confidence.used, 0, "confidence.used should be 0");
              assert.equal(msgData.roll.type, type, "roll.type should be spont");
              assert.equal(
                msgData.roll.difficulty,
                Sp3.system.level,
                "roll.difficulty should be 25"
              );
              assert.equal(msgData.roll.divider, 1, "divider should be 1");
              assert.equal(msgData.roll.actorType, "player");
              assert.equal(msg.system.magic.ritual, true, "ritual should be true");
              if (roll.botches) {
                assert.equal(msgData.impact.applied, true, "shoud be applied");
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
                  fatigueCurrent + 2,
                  magus.system.fatigueCurrent,
                  "fatigue not changed"
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
                // failed or partial success
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
                    fatigueCurrent + 1,
                    magus.system.fatigueCurrent,
                    "fatigue not changed"
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
                    fatigueCurrent + 1,
                    magus.system.fatigueCurrent,
                    "fatigue not changed"
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

                assert.equal(msg.system.magic.realm, "magic", "realm is not magic");

                assert.ok(
                  ["magic", "faeric", "infernal", "divine"].includes(msg.system.magic.realm),
                  "realm value unexpected"
                );

                assert.equal(msgData.impact.applied, false, "shoud not be applied");
                assert.equal(msgData.confidence.allowed, true, "confidence is allowed");

                assert.equal(roll.modifier, tot, "bad modifier");
                await msgData.useConfidence(magus._id);
                assert.equal(msg.system.confidence.used, 1, "confidence.used should be 1");
                assert.equal(msg.system.confidence.allowed, true, "confidence is not allowed");

                await msgData.useConfidence(magus._id);
                assert.equal(msg.system.confidence.used, 2, "confidence.used should be 2");
                assert.equal(msg.system.confidence.allowed, false, "confidence is allowed");
              }
            } catch (err) {
              console.error(`Error: ${err}`);
              assert.ok(false);
            }
          });

          // it("Ritual spell 3", async function () {
          //   let type = "spell";
          //   try {
          //     await magus.update({ "system.fatigueCurrent": 4 });
          //     let dataset = {
          //       roll: type,
          //       bonusActiveEffects: magus.system.bonuses.arts.spellcasting,
          //       id: Sp3._id
          //     };
          //     let fatigueCurrent = magus.system.fatigueCurrent;
          //     let currentWarping = magus.system.warping.points;
          //     magus.rollInfo.init(dataset, magus);
          //     await magus.rest();
          //     const msg = await stressDie(magus, type, 0, magus.rollInfo.properties.CALLBACK, 2);
          //     const roll = msg.rolls[0];

          //     log(false, roll);
          //     assert.ok(roll);
          //     if (roll.botches) {
          //       assert.equal(roll.total, 0, "botched");
          //       return;
          //     }
          //     const aura = Aura.fromActor(magus);
          //     aura.computeMaxAuraModifier(magus.system.realms);
          //     let tot =
          //       magus.system.arts.techniques.mu.finalScore +
          //       magus.system.arts.forms.vi.finalScore +
          //       magus.system.characteristics.sta.value +
          //       magus.system.penalties.wounds.total +
          //       magus.system.fatigueTotal +
          //       Sp3.system.finalScore +
          //       Sp3.system.bonus +
          //       5 + // phylosophy and artes liberales
          //       aura.modifier;

          //     const msgData = msg.system;
          //     assert.ok(msgData, "system missing");
          //     // assert.equal(msgData.label, "Spontaneous");
          //     assert.equal(msgData.confidence.score, 2, "confidence.score should be 2");
          //     assert.ok(msgData.confidence.score >= 0, "confidence.score should be non-negative");
          //     assert.equal(msgData.confidence.used, 0, "confidence.used should be 0");
          //     assert.equal(msgData.roll.type, type, "roll.type should be spont");
          //     assert.equal(
          //       msgData.roll.difficulty,
          //       Sp3.system.level,
          //       "roll.difficulty should be 25"
          //     );
          //     assert.equal(msgData.roll.divider, 1, "divider should be 1");
          //     assert.equal(msgData.roll.actorType, "player");
          //     assert.equal(msg.system.magic.ritual, true, "ritual should be true");
          //     if (roll.botches) {
          //       assert.equal(msgData.impact.applied, true, "shoud be applied");
          //       assert.equal(roll.total, 0, "botched");
          //       assert.equal(msgData.roll.botchCheck, true, "Check for botch missing");
          //       assert.equal(msgData.roll.botches, roll.botches, "Wrong number of botches");
          //       assert.equal(msg.system.confidence.allowed, false, "confidence is not allowed");
          //       assert.equal(
          //         msgData.impact.fatigueLevelsLost,
          //         1,
          //         "fatigue levels lost should be 1"
          //       );
          //       assert.equal(
          //         msgData.impact.fatigueLevelsPending,
          //         0,
          //         "fatigue levels pending should be 0"
          //       );
          //       assert.equal(
          //         currentWarping + roll.botches,
          //         magus.system.warping.points,
          //         "warping changed"
          //       );
          //       assert.equal(msgData.failedRoll(), true, "failed roll should be true");
          //       if (roll.botches >= 2) {
          //         assert.equal(magus.system.twilight.stage, TWILIGHT_STAGES.PENDING_STRENGTH);
          //       }
          //     } else {
          //       assert.equal(
          //         msgData.roll.difficulty - 10 > msg.rollTotal(0),
          //         msgData.failedRoll(),
          //         "failed roll incorrect"
          //       );

          //       let cnt = Math.ceil((msgData.roll.difficulty - msg.rollTotal(0)) / 5);
          //       // failed or partial success
          //       if (msgData.failedRoll()) {
          //         assert.equal(
          //           msgData.impact.fatigueLevelsLost,
          //           1,
          //           "fatigue levels lost should be 1"
          //         );
          //         if (cnt >= 2) {
          //           assert.equal(
          //             msgData.impact.fatigueLevelsPending,
          //             2,
          //             "fatigue levels pending should be 2"
          //           );
          //           assert.equal(
          //             msgData.impact.fatigueLevelsFail,
          //             cnt - 2,
          //             `fatigue levels on fail should be ${cnt - 2}`
          //           );
          //         } else {
          //           assert.equal(
          //             msgData.impact.fatigueLevelsPending,
          //             cnt,
          //             `fatigue levels pending should be ${cnt}`
          //           );
          //         }
          //       } else if (msg.rollTotal(0) < msgData.roll.difficulty) {
          //         assert.equal(
          //           msgData.impact.fatigueLevelsLost,
          //           1,
          //           "fatigue levels lost should be 1"
          //         );

          //         assert.equal(
          //           msgData.impact.fatigueLevelsPending,
          //           cnt,
          //           `fatigue levels pending should be ${cnt}`
          //         );
          //         assert.equal(
          //           msgData.impact.fatigueLevelsFail,
          //           0,
          //           "fatigue levels on fail should be 0"
          //         );
          //       } else {
          //         // success
          //         assert.equal(
          //           msgData.impact.fatigueLevelsLost,
          //           1,
          //           "fatigue levels lost should be 1"
          //         );
          //         assert.equal(
          //           msgData.impact.fatigueLevelsPending,
          //           0,
          //           "fatigue levels pending should be 0"
          //         );
          //         assert.equal(
          //           msgData.impact.fatigueLevelsFail,
          //           0,
          //           "fatigue levels on fail should be 0"
          //         );
          //       }
          //       assert.equal(msgData.impact.woundGravity, 0, "wound gravity should be 0");
          //       assert.equal(
          //         fatigueCurrent + 1,
          //         magus.system.fatigueCurrent,
          //         "fatigue not changed"
          //       );
          //       assert.ok(msg.system.magic, "magic data missing");
          //       assert.ok(msg.system.magic.caster, "caster missing");
          //       assert.equal(msg.system.magic.caster.form, null, "caster form is not null");
          //       assert.ok(msg.system.magic.caster.penetration, "penetration missing");
          //       assert.equal(
          //         msg.system.magic.caster.penetration.total,
          //         msg.system.magic.caster.penetration.score *
          //           msg.system.magic.caster.penetration.multiplier,
          //         "penetration total incorrect"
          //       );
          //       assert.ok(Array.isArray(msg.system.magic.targets), "targets should be array");

          //       assert.equal(msg.system.magic.realm, "magic", "realm is not magic");

          //       assert.ok(
          //         ["magic", "faeric", "infernal", "divine"].includes(msg.system.magic.realm),
          //         "realm value unexpected"
          //       );

          //       assert.equal(msgData.impact.applied, false, "shoud not be applied");
          //       assert.equal(msgData.confidence.allowed, true, "confidence is allowed");

          //       assert.equal(roll.modifier, tot, "bad modifier");
          //       await msgData.useConfidence(magus._id);
          //       assert.equal(msg.system.confidence.used, 1, "confidence.used should be 1");
          //       assert.equal(msg.system.confidence.allowed, true, "confidence is not allowed");

          //       await msgData.useConfidence(magus._id);
          //       assert.equal(msg.system.confidence.used, 2, "confidence.used should be 2");
          //       assert.equal(msg.system.confidence.allowed, false, "confidence is allowed");
          //     }
          //   } catch (err) {
          //     console.error(`Error: ${err}`);
          //     assert.ok(false);
          //   }
          // });
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
      });
    },
    { displayName: "ARS : Magic Rolls testsuite" }
  );
}
