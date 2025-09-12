import { log } from "../tools.js";
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
            log(false, roll);
            assert.ok(roll);
            if (roll.botched) {
              assert.equal(roll.total, 0, "botched");
              return;
            }
            assert.equal(roll.modifier, 1, "bad modifier");
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

            assert.equal(roll.modifier, 50, "modifier not correct");
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
            assert.equal(roll.modifier, tot, "modifier not correct");
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
            assert.equal(roll.modifier, tot);
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
              roll.modifier,
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
            assert.equal(roll.modifier, tot);
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
            assert.equal(roll.modifier, tot);
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
    { displayName: "ARS : Option Rolls testsuite" }
  );
}
