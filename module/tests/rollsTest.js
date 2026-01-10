import { log } from "../tools/tools.js";
import { getCompanion, getMagus } from "./testData.js";
import { ArsLayer } from "../ui/ars-layer.js";
import { ARM5E } from "../config.js";
import { simpleDie, stressDie } from "../helpers/dice.js";
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
      describe("Aging rolls", function () {
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
