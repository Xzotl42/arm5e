import { log } from "../tools/tools.js";
import { getCompanion, getMagus } from "./testData.js";
import { ArsLayer } from "../ui/ars-layer.js";
import { ARM5E } from "../config.js";
import { simpleDie, stressDie } from "../helpers/dice.js";
import Aura from "../helpers/aura.js";
import { ROLL_PROPERTIES } from "../ui/roll-window.js";

export function registerRollTesting(quench) {
  quench.registerBatch(
    "Ars-rolls",
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

      describe("Characteristics rolls", function () {
        this.timeout(300000); // 300 seconds for easier debugging

        for (let c of Object.keys(CONFIG.ARM5E.character.characteristics)) {
          it("Stress roll characteristic: " + [c], async function () {
            if (c === "cun") {
              assert.ok(true);
            } else {
              try {
                let dataset = { roll: "char", characteristic: c, difficulty: 6 };
                actor.rollInfo.init(dataset, actor);

                const msg = await stressDie(actor, "char", 0, null, 10);
                const roll = msg.rolls[0];
                log(false, roll);
                assert.ok(roll);
                if (roll.botches) {
                  assert.equal(roll.total, 0, "botched");
                  return;
                }
                assert.equal(
                  roll.modifier,
                  actor.system.characteristics[c].value,
                  "modifier not correct"
                );
              } catch (err) {
                console.error(`Error: ${err}`);
                assert.ok(false);
              }
            }
          });
          it("Simple roll characteristic: " + [c], async function () {
            if (c === "cun") {
              assert.ok(true);
            } else {
              try {
                let dataset = { roll: "char", characteristic: c, difficulty: 6 };
                actor.rollInfo.init(dataset, actor);
                const msg = await simpleDie(actor, "char", null);
                const roll = msg.rolls[0];
                log(false, roll);
                assert.ok(roll);
                assert.equal(
                  roll.modifier,
                  actor.system.characteristics[c].value,
                  "modifier not correct"
                );
              } catch (err) {
                console.error(`Error: ${err}`);
                assert.ok(false);
              }
            }
          });
        }
      });
      describe("Damage rolls", function () {
        this.timeout(300000); // 300 seconds for easier debugging

        const damageTestCases = [
          {
            form: "te",
            source: "weapon",
            ignoreArmor: false,
            difficulty: 10,
            desc: "Terram damage"
          },
          { form: "ig", source: "fire", ignoreArmor: false, difficulty: 15, desc: "Ignem damage" },
          {
            form: "co",
            source: "spell",
            ignoreArmor: true,
            difficulty: 12,
            desc: "Corpus damage ignoring armor"
          },
          { form: "an", source: "beast", ignoreArmor: false, difficulty: 8, desc: "Animal damage" },
          { form: "me", source: "mental", ignoreArmor: true, difficulty: 20, desc: "Mentem damage" }
        ];

        damageTestCases.forEach((testCase, idx) => {
          it(testCase.desc, async function () {
            try {
              let dataset = {
                roll: "damage",
                damageSource: testCase.source,
                damageForm: testCase.form,
                difficulty: testCase.difficulty
              };
              actor.rollInfo.init(dataset, actor);
              actor.rollInfo.damage = {
                source: testCase.source,
                form: testCase.form,
                ignoreArmor: testCase.ignoreArmor
              };
              const msg = await stressDie(actor, "damage", 0, null, 10);
              const roll = msg.rolls[0];
              log(false, roll);
              assert.ok(roll);
              if (roll.botches) {
                assert.equal(roll.total, 0, "botched");
                return;
              }
              assert.equal(roll.modifier, 0, "modifier not correct");
            } catch (err) {
              console.error(`Error: ${err}`);
              assert.ok(false);
            }
          });
        });
      });
      describe("Soak rolls", function () {
        this.timeout(300000); // 300 seconds for easier debugging

        const soakTestCases = [
          {
            form: "te",
            source: "weapon",
            ignoreArmor: false,
            natRes: 0,
            formRes: 0,
            difficulty: 12,
            desc: "Basic soak with armor"
          },
          {
            form: "ig",
            source: "fire",
            ignoreArmor: false,
            natRes: 0,
            formRes: 5,
            difficulty: 15,
            desc: "Ignem soak with form resistance"
          },
          {
            form: "co",
            source: "spell",
            ignoreArmor: true,
            natRes: 3,
            formRes: 0,
            difficulty: 18,
            desc: "Corpus soak without armor with natural resistance"
          },
          {
            form: "an",
            source: "beast",
            ignoreArmor: false,
            natRes: 2,
            formRes: 3,
            difficulty: 10,
            desc: "Animal soak with both resistances"
          },
          {
            form: "me",
            source: "mental",
            ignoreArmor: true,
            natRes: 0,
            formRes: 8,
            difficulty: 20,
            desc: "Mentem soak with high form resistance"
          },
          {
            form: "vi",
            source: "magic",
            ignoreArmor: false,
            natRes: 5,
            formRes: 5,
            difficulty: 25,
            desc: "Vim soak with high resistances"
          }
        ];

        soakTestCases.forEach((testCase, idx) => {
          it(testCase.desc, async function () {
            try {
              let dataset = {
                roll: "soak",
                damageForm: testCase.form,
                source: testCase.source,
                difficulty: testCase.difficulty,
                ignoreArmor: testCase.ignoreArmor
              };
              actor.rollInfo.init(dataset, actor);
              actor.rollInfo.damage = {
                source: testCase.source,
                form: testCase.form,
                ignoreArmor: testCase.ignoreArmor,
                natRes: testCase.natRes,
                formRes: testCase.formRes
              };
              const msg = await stressDie(actor, "soak", 0, null, 0);
              const roll = msg.rolls[0];
              log(false, roll);
              assert.ok(roll);
              if (roll.botches) {
                assert.equal(roll.total, 0, "botched");
                return;
              }
              // Soak modifier should include stamina + armor (if not ignored) + resistances
              let expectedMod = actor.system.characteristics.sta.value;
              if (!testCase.ignoreArmor) {
                expectedMod += actor.system.combat.prot;
              }
              expectedMod += testCase.natRes + testCase.formRes;
              assert.equal(roll.modifier, expectedMod, "modifier not correct");
            } catch (err) {
              console.error(`Error: ${err}`);
              assert.ok(false);
            }
          });
        });
      });
      describe("Twilight rolls", function () {
        this.timeout(300000); // 300 seconds for easier debugging

        it("Twilight control roll", async function () {
          try {
            let dataset = {
              roll: "twilight_control",
              season: "winter",
              year: "1222"
            };
            magus.rollInfo.init(dataset, magus);
            const concentrationScore = magus.rollInfo.twilight.concentration.score;
            const vimMod = Math.ceil(magus.system.arts.forms.vi.finalScore / 5);
            const expectedMod =
              magus.system.characteristics.sta.value + concentrationScore + vimMod;
            const msg = await stressDie(magus, "twilight_control", 0, null, 0);
            const roll = msg.rolls[0];
            log(false, roll);
            assert.ok(roll);
            if (roll.botches) {
              assert.equal(roll.total, 0, "botched");
              return;
            }
            assert.equal(roll.modifier, expectedMod, "modifier not correct");
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("Twilight strength roll", async function () {
          try {
            let dataset = {
              roll: "twilight_strength",
              warpingPts: 3
            };
            magus.rollInfo.init(dataset, magus);
            const warpingScore = magus.system.warping.finalScore ?? 0;
            const enigmaScore = magus.rollInfo.twilight.enigma.score;
            aura = Aura.fromActor(magus);
            const expectedMod = warpingScore + enigmaScore + dataset.warpingPts + aura.level;
            const msg = await stressDie(magus, "twilight_strength", 0, null, 0);
            const roll = msg.rolls[0];
            log(false, roll);
            assert.ok(roll);
            assert.equal(roll.modifier, expectedMod, "modifier not correct");
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("Twilight complexity roll", async function () {
          try {
            let dataset = {
              roll: "twilight_complexity"
            };
            magus.rollInfo.init(dataset, magus);
            const warpingScore = magus.system.warping.finalScore ?? 0;
            const msg = await stressDie(magus, "twilight_complexity", 0, null, 0);
            const roll = msg.rolls[0];
            log(false, roll);
            assert.ok(roll);
            if (roll.botches) {
              assert.equal(roll.total, 0, "botched");
              return;
            }
            assert.equal(roll.modifier, warpingScore, "modifier not correct");
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("Twilight understanding roll", async function () {
          try {
            let dataset = {
              roll: "twilight_understanding",
              warpingPts: 2
            };
            magus.rollInfo.init(dataset, magus);
            const enigmaScore = magus.rollInfo.twilight.enigma.score;
            const expectedMod = magus.system.characteristics.int.value + enigmaScore;
            const msg = await stressDie(magus, "twilight_understanding", 0, null, 0);
            const roll = msg.rolls[0];
            log(false, roll);
            assert.ok(roll);
            if (roll.botches) {
              assert.equal(roll.total, 0, "botched");
              return;
            }
            assert.equal(roll.modifier, expectedMod, "modifier not correct");
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });
      });
      describe("Aging rolls", function () {
        this.timeout(300000); // 300 seconds for easier debugging

        for (const loop of Array(5).keys()) {
          it("Aging roll number " + [loop], async function () {
            try {
              let dataset = {
                roll: "aging",
                season: "winter",
                year: "1222"
              };
              actor.rollInfo.init(dataset, actor);
              const ageMod = actor.rollInfo.getGenericFieldValue(1);
              const msg = await stressDie(actor, "aging", 4, null, 0);
              const roll = msg.rolls[0];
              log(false, roll);
              assert.ok(roll);
              if (roll.botches) {
                assert.equal(roll.total, 0, "botched");
                return;
              }
              assert.equal(roll.modifier, ageMod, "modifier not correct");
            } catch (err) {
              console.error(`Error: ${err}`);
              assert.ok(false);
            }
          });
        }
        for (const loop of Array(5).keys()) {
          it("Crisis roll number " + [loop], async function () {
            try {
              let dataset = {
                roll: "crisis",
                season: "winter",
                year: "1222"
              };
              actor.rollInfo.init(dataset, actor);
              const ageMod =
                actor.rollInfo.getGenericFieldValue(1) + actor.rollInfo.getGenericFieldValue(2);
              const msg = await simpleDie(actor, "crisis", null);
              const roll = msg.rolls[0];
              log(false, roll);
              assert.ok(roll);
              if (roll.botches) {
                assert.equal(roll.total, 0, "botched");
                return;
              }
              assert.equal(roll.modifier, ageMod, "modifier not correct");
            } catch (err) {
              console.error(`Error: ${err}`);
              assert.ok(false);
            }
          });
        }
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
    { displayName: "ARS : Rolls testsuite" }
  );
}
