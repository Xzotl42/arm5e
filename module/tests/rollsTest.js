import { log } from "../tools.js";
import { getCompanion, getMagus } from "./testData.js";
import { ArsLayer } from "../ui/ars-layer.js";
import { ARM5E } from "../config.js";
import { simpleDie, stressDie } from "../dice.js";
import Aura from "../helpers/aura.js";
import { ROLL_PROPERTIES } from "../helpers/rollWindow.js";

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
        }
      });

      describe("Characteristics rolls", function () {
        for (let c of Object.keys(CONFIG.ARM5E.character.characteristics)) {
          it("Stress roll characteristic: " + [c], async function () {
            if (c === "cun") {
              assert.ok(true);
            } else {
              try {
                let dataset = { roll: "char", characteristic: c };
                actor.rollInfo.init(dataset, actor);

                let roll = await stressDie(actor, "char", 0, null, 10);
                log(false, roll);
                assert.ok(roll);
                if (roll.botches) {
                  assert.equal(roll.total, 0, "botched");
                  return;
                }
                assert.equal(
                  roll.modifier(),
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
                let dataset = { roll: "char", characteristic: c };
                actor.rollInfo.init(dataset, actor);
                let roll = await simpleDie(actor, "char", null);
                log(false, roll);
                assert.ok(roll);
                assert.equal(
                  roll.modifier(),
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
      describe("Aging rolls", function () {
        for (const loop of Array(25).keys()) {
          it("Aging roll number " + [loop], async function () {
            try {
              let dataset = {
                roll: "aging",
                season: "winter",
                year: "1222"
              };
              actor.rollInfo.init(dataset, actor);
              const ageMod = actor.rollInfo.getGenericFieldValue(1);
              let roll = await stressDie(actor, "aging", 4, null, 0);
              log(false, roll);
              assert.ok(roll);
              if (roll.botches) {
                assert.equal(roll.total, 0, "botched");
                return;
              }
              assert.equal(roll.modifier(), ageMod, "modifier not correct");
            } catch (err) {
              console.error(`Error: ${err}`);
              assert.ok(false);
            }
          });
        }
        for (const loop of Array(25).keys()) {
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
              let roll = await simpleDie(actor, "crisis", null);
              log(false, roll);
              assert.ok(roll);
              if (roll.botches) {
                assert.equal(roll.total, 0, "botched");
                return;
              }
              assert.equal(roll.modifier(), ageMod, "modifier not correct");
            } catch (err) {
              console.error(`Error: ${err}`);
              assert.ok(false);
            }
          });
        }
      });
      describe("Options rolls", function () {
        it("Personality roll", async function () {
          try {
            let dataset = { roll: "option", name: "Loyal", option1: 1, txtoption1: "score" };
            actor.rollInfo.init(dataset, actor);
            let roll = await stressDie(actor, "option", 0, null, 10);
            if (roll.botched) {
              assert.equal(roll.total, 0, "botched");
              return;
            }
            assert.ok(roll);
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("Reputation roll", async function () {
          try {
            let dataset = { roll: "option", name: "Dead", option1: 1, txtoption1: "score" };
            actor.rollInfo.init(dataset, actor);
            let roll = await stressDie(actor, "char", 0, null, 10);
            // log(false, roll);
            assert.ok(roll);
            if (roll.botched) {
              assert.equal(roll.total, 0, "botched");
              return;
            }
            assert.equal(roll.modifier(), 1, "bad modifier");
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
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
            actor.rollInfo.init(dataset, actor);
            let roll = await simpleDie(actor, "option", null);
            log(false, roll);
            assert.ok(roll.total > 50);

            assert.equal(roll.modifier(), 50, "modifier not correct");
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
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
            actor.rollInfo.init(dataset, actor);
            let roll = await stressDie(actor, type, 0, null, 10);
            assert.ok(roll);
            if (roll.botches) {
              assert.equal(roll.total, 0, "botched");
              return;
            }
            log(false, roll);
            let tot =
              actor.system.characteristics.qik.value +
              actor.system.combat.init -
              actor.system.combat.overload;
            assert.equal(roll.modifier(), tot, "modifier not correct");
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("Combat roll", async function () {
          let type = ROLL_PROPERTIES.ATTACK.VAL;
          try {
            let dataset = {
              roll: type,
              name: "all options",
              option1: actor.system.characteristics.dex.value,
              txtoption1: "dex",
              option2: actor.system.combat.ability,
              txtoption2: "ability",
              option3: actor.system.combat.atk,
              txtoption3: "attack"
            };
            actor.rollInfo.init(dataset, actor);
            let roll = await stressDie(actor, type, 0, null, 10);
            log(false, roll);
            assert.ok(roll);
            if (roll.botches) {
              assert.equal(roll.total, 0, "botched");
              return;
            }
            let tot =
              actor.system.characteristics.dex.value +
              actor.system.combat.atk +
              actor.system.combat.ability;
            assert.equal(roll.modifier(), tot);
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });
        it("Combat roll defense", async function () {
          let type = ROLL_PROPERTIES.DEFENSE.VAL;
          try {
            let dataset = {
              roll: type,
              name: "combat",
              option1: actor.system.characteristics.qik.value,
              txtoption1: "quickness",
              option2: actor.system.combat.ability,
              txtoption2: "ability",
              option3: actor.system.combat.dfn,
              txtoption3: "defense"
            };
            actor.rollInfo.init(dataset, actor);
            let roll = await stressDie(actor, type, 0, null, 10);
            log(false, roll);
            assert.ok(roll);
            if (roll.botches) {
              assert.equal(roll.total, 0, "botched");
              return;
            }
            assert.equal(
              roll.modifier(),
              actor.system.characteristics.qik.value +
                actor.system.combat.ability +
                actor.system.combat.dfn
            );
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });
        it("Combat roll exertion", async function () {
          let type = ROLL_PROPERTIES.ATTACK.VAL;
          try {
            let dataset = {
              roll: type,
              name: "combat",
              option1: actor.system.characteristics.dex.value,
              txtoption1: "dex",
              option2: actor.system.combat.ability,
              txtoption2: "ability",
              option3: actor.system.combat.atk,
              txtoption3: "attack"
            };
            actor.rollInfo.init(dataset, actor);
            actor.rollInfo.combat.exertion = true;
            let roll = await stressDie(actor, type, 0, null, 10);
            log(false, roll);
            assert.ok(roll);
            if (roll.botches) {
              assert.equal(roll.total, 0, "botched");
              return;
            }
            let tot =
              actor.system.characteristics.dex.value +
              actor.system.combat.atk +
              2 * actor.system.combat.ability;
            assert.equal(roll.modifier(), tot);
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });
        it("Combat wounded", async function () {
          await actor.changeWound(3, "light");
          let type = ROLL_PROPERTIES.ATTACK.VAL;
          try {
            let dataset = {
              roll: type,
              name: "combat",
              option1: actor.system.characteristics.dex.value,
              txtoption1: "dex",
              option2: actor.system.combat.ability,
              txtoption2: "ability",
              option3: actor.system.combat.atk,
              txtoption3: "attack"
            };
            actor.rollInfo.init(dataset, actor);
            let roll = await stressDie(actor, type, 0, null, 10);
            log(false, roll);
            assert.ok(roll);
            if (roll.botches) {
              assert.equal(roll.total, 0, "botched");
              return;
            }
            let tot =
              actor.system.characteristics.dex.value +
              actor.system.combat.atk +
              actor.system.combat.ability -
              3;
            assert.equal(roll.modifier(), tot);
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });
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
              usefatigue: true
            };
            magus.rollInfo.init(dataset, magus);
            let roll = await stressDie(magus, type, 0, undefined, 10);
            log(false, roll);
            assert.ok(roll);
            if (roll.botches) {
              assert.equal(roll.total, 0, "botched");
              return;
            }
            let tot =
              magus.system.arts.techniques.mu.finalScore +
              magus.system.arts.forms.co.finalScore +
              magus.system.characteristics.sta.value +
              magus.system.penalties.wounds.total +
              magus.system.fatigueTotal +
              3;
            assert.equal(roll.modifier(), tot);
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
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
              usefatigue: true
            };
            magus.rollInfo.init(dataset, magus);
            let roll = await stressDie(magus, type, 0, undefined, 10);
            log(false, roll);
            assert.ok(roll);
            if (roll.botches) {
              assert.equal(roll.total, 0, "botched");
              return;
            }
            let tot =
              magus.system.arts.techniques.pe.finalScore +
              magus.system.arts.forms.co.finalScore +
              magus.system.characteristics.sta.value +
              magus.system.penalties.wounds.total +
              magus.system.fatigueTotal +
              1 +
              3;
            assert.equal(roll.modifier(), tot);
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });
        it("Magic effect std", async function () {
          let type = "magic";
          try {
            let dataset = {
              roll: type,
              bonusActiveEffects: magus.system.bonuses.arts.spellcasting,
              id: ME1._id,
              usefatigue: true
            };
            magus.rollInfo.init(dataset, magus);
            let roll = await stressDie(magus, type, 0, undefined, 100);
            log(false, roll);
            assert.ok(roll);
            if (roll.botches) {
              assert.equal(roll.total, 0, "botched");
              return;
            }
            let tot =
              magus.system.arts.techniques.cr.finalScore +
              magus.system.arts.forms.ig.finalScore +
              magus.system.characteristics.sta.value +
              magus.system.penalties.wounds.total +
              magus.system.fatigueTotal +
              2 +
              3;
            assert.equal(roll.modifier(), tot);
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
              usefatigue: true
            };
            magus.rollInfo.init(dataset, magus);
            let roll = await stressDie(magus, type, 0, undefined, 1);
            log(false, roll);
            assert.ok(roll);
            if (roll.botches) {
              assert.equal(roll.total, 0, "botched");
              return;
            }
            let tot =
              // magus.system.arts.techniques.cr.finalScore +
              // magus.system.arts.forms.ig.finalScore +
              magus.system.characteristics.sta.value +
              magus.system.penalties.wounds.total +
              magus.system.fatigueTotal +
              3;
            assert.equal(roll.modifier(), tot);
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });
        it("Magic effect with focus", async function () {
          let type = "magic";
          try {
            await magus.rest();
            let dataset = {
              roll: type,
              bonusActiveEffects: magus.system.bonuses.arts.spellcasting,
              id: ME3.id
              // divide: 2,
              // usefatigue: true
            };
            magus.rollInfo.init(dataset, magus);
            let roll = await stressDie(magus, type, 0, undefined, 1);
            log(false, roll);
            assert.ok(roll);
            if (roll.botches) {
              assert.equal(roll.total, 0, "botched");
              return;
            }
            // assert.equal(ME3.system.applyFocus, magus.rollInfo.magic.focus);
            let tot =
              magus.system.arts.techniques.mu.finalScore +
              magus.system.arts.forms.an.finalScore * 2 +
              magus.system.characteristics.sta.value +
              magus.system.penalties.wounds.total +
              magus.system.fatigueTotal +
              3;
            assert.equal(roll.modifier(), tot);
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });
        it("Spell", async function () {
          let type = "spell";
          try {
            await magus.rest();
            let dataset = {
              roll: type,
              bonusActiveEffects: magus.system.bonuses.arts.spellcasting,
              id: Sp1._id
            };
            magus.rollInfo.init(dataset, magus);
            let roll = await stressDie(magus, type, 0, undefined, 4);
            log(false, roll);
            assert.ok(roll);
            if (roll.botches) {
              assert.equal(roll.total, 0, "botched");
              return;
            }

            // assert.equal(Sp1.system.masteryScore, magus.rollInfo.magic.mastery);
            // assert.equal(Sp1.system.bonus, magus.rollInfo.magic.bonus);
            let tot =
              magus.system.arts.techniques.mu.finalScore +
              magus.system.arts.forms.im.finalScore +
              magus.system.characteristics.sta.value +
              magus.system.penalties.wounds.total +
              magus.system.fatigueTotal +
              Sp1.system.finalScore +
              Sp1.system.bonus +
              3;
            assert.equal(roll.modifier(), tot);
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
            magus.rollInfo.init(dataset, magus);
            let roll = await stressDie(magus, type, 0, undefined, 3);
            log(false, roll);
            assert.ok(roll);
            if (roll.botches) {
              assert.equal(roll.total, 0, "botched");
              return;
            }

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
              3;
            assert.equal(roll.modifier(), tot);
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
            magus.rollInfo.init(dataset, magus);
            let roll = await stressDie(magus, type, 0, undefined, 3);
            log(false, roll);
            assert.ok(roll);
            if (roll.botches) {
              assert.equal(roll.total, 0, "botched");
              return;
            }

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
              3;
            assert.equal(roll.modifier(), tot);
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
            magus.rollInfo.init(dataset, magus);
            let roll = await stressDie(magus, type, 0, undefined, 2);
            log(false, roll);
            assert.ok(roll);
            if (roll.botches) {
              assert.equal(roll.total, 0, "botched");
              return;
            }

            let tot =
              magus.system.arts.techniques.mu.finalScore +
              magus.system.arts.forms.vi.finalScore +
              magus.system.characteristics.sta.value +
              magus.system.penalties.wounds.total +
              magus.system.fatigueTotal +
              Sp3.system.finalScore +
              Sp3.system.bonus +
              3;
            assert.equal(roll.modifier(), tot);
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
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
    { displayName: "ARS : Rolls testsuite" }
  );
}
