import { log } from "../tools/tools.js";
import { getCompanion, getMagus } from "./testData.js";
import { ArsLayer } from "../ui/ars-layer.js";
import { ARM5E } from "../config.js";
import { simpleDie, stressDie } from "../helpers/dice.js";
import Aura from "../helpers/aura.js";
import {
  applyStandardMagusEffects,
  captureActorState,
  createLinkedToken,
  guardDiceRolls
} from "./testHelpers.js";

export function register__TEMPLATE__Testing(quench) {
  quench.registerBatch(
    "Ars-__TEMPLATE__",
    (context) => {
      const { describe, it, assert, expect, should, before, after } = context;
      let actor;
      let magus;

      let magusToken;
      let aura;

      // Guard: skip if dice-so-nice is active (would break deterministic roll tests).
      // Remove this line if this suite does not perform dice rolls.
      if (guardDiceRolls()) return;

      const hasScene = !!game.scenes.viewed;

      before(async function () {
        actor = await getCompanion(`BobTheCompanion`);
        ArsLayer.clearAura(true);
        magus = await getMagus("Tiberius");

        // Apply the standard trio of active effects used by most test suites.
        await applyStandardMagusEffects(magus);

        // Create a linked token on the current scene (skipped when no scene is open).
        if (hasScene) {
          magusToken = await createLinkedToken(magus);
          aura = new Aura(canvas.scene.id);
          await aura.set("faeric", 6);
        }
      });

      describe("__TEMPLATE__ nominal", function () {
        it("__TEMPLATE__1: ", async function () {
          try {
            let dataset = { roll: "char", characteristic: "sta" };
            actor.rollInfo.init(dataset, actor);
            const initialState = captureActorState(actor);
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
              actor.system.characteristics.sta.value,
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
