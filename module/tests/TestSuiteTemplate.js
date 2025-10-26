import { log } from "../tools.js";
import { getCompanion, getMagus } from "./testData.js";
import { ArsLayer } from "../ui/ars-layer.js";
import { ARM5E } from "../config.js";
import { simpleDie, stressDie } from "../dice.js";
import Aura from "../helpers/aura.js";

export function register__TEMPLATE__Testing(quench) {
  quench.registerBatch(
    "Ars-__TEMPLATE__",
    (context) => {
      const { describe, it, assert, expect, should, before, after } = context;
      let actor;
      let magus;

      let magusToken;
      let aura;

      let hasScene = false;
      if (game.scenes.viewed) {
        hasScene = true;
      }

      before(async function () {
        actor = await getCompanion(`BobTheCompanion`);
        ArsLayer.clearAura(true);
        magus = await getMagus("Tiberius");

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

      describe("__TEMPLATE__ nominal", function () {
        it("__TEMPLATE__1: ", async function () {
          try {
            let dataset = { roll: "char", characteristic: c };
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
    { displayName: "ARS : __TEMPLATE__ testsuite" }
  );
}
