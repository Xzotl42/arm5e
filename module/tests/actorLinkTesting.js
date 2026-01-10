import { log, sleep } from "../tools/tools.js";
import { getCompanion, getMagus } from "./testData.js";
import { ArsLayer } from "../ui/ars-layer.js";
import { ARM5E } from "../config.js";
import { simpleDie, stressDie } from "../helpers/dice.js";
import Aura from "../helpers/aura.js";

export function registerActorLinkTesting(quench) {
  quench.registerBatch(
    "Ars-ActorLink",
    (context) => {
      const { describe, it, assert, expect, should, before, after } = context;

      const actorTypes = ["player", "npc", "laboratory", "covenant", "beast"];

      before(async function () {});

      describe("ActorLink nominal", function () {
        let src;
        let target;
        for (let srcType of actorTypes) {
          for (let targetType of actorTypes) {
            it(`Link ${srcType} to ${targetType}`, async function () {
              try {
                src = await Actor.create({ name: `${srcType}Name`, type: srcType });
                target = await Actor.create({ name: `${targetType}Name`, type: targetType });

                if (target.sheet.isActorDropAllowed(srcType)) {
                  let res = await target.sheet._onDropActor(null, { uuid: src.uuid });

                  src.sheet.render(true);
                  target.sheet.render(true);
                  await sleep(100);
                  await src.sheet.close();
                  await target.sheet.close();
                }
              } catch (err) {
                console.error(`Error: ${err}`);
                assert.ok(false);
              }
            });
          }
        }
        afterEach(async function () {
          log(false, "Clean up after each");
          if (src) {
            await src.delete();
          }
          if (target) {
            await target.delete();
          }
        });
      });
    },
    { displayName: "ARS : ActorLink testsuite" }
  );
}
