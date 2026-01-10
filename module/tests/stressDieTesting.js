import { stressDie } from "../helpers/dice.js";
import { StressDieInternal } from "../helpers/roll.js";
import { log } from "../tools/tools.js";
import { companionData } from "./testData.js";

export function registerStressDieTesting(quench) {
  quench.registerBatch(
    "Ars-StressDie",
    (context) => {
      let actor;
      if (game.modules.get("dice-so-nice")?.active) {
        ui.notifications.warn("Disable dice-so-nice to test dice rolls");
        return;
      }
      const { describe, it, assert, after, before } = context;
      describe(`Exploding die`, function () {
        before(async function () {
          actor = await Actor.create({
            name: `BobTheCompanion`,
            type: "player",
            system: companionData
          });
        });
        describe("Dice", function () {
          for (const score of Array(5).keys()) {
            it(`Die exploding`, async function () {
              let die = new StressDieInternal();
              await die.evaluate({ async: true, minimize: true });
              assert.equal(die.total, 1, "Min not correct");
              log(false, `Roll result: ${die.total}`);
            });
            it(`Die botching `, async function () {
              let die = new StressDieInternal();
              await die.evaluate({ async: true, maximize: true });
              assert.equal(die.total, 0, "Max not correct");
            });
          }
          after(async function () {});
        });
        describe("Rolls", function () {
          for (const score of Array(20).keys()) {
            it(`Roll exploding`, async function () {
              let dataset = { roll: "char", characteristic: "pre" };
              actor.rollInfo.init(dataset, actor);
              const msg = await stressDie(actor, "char", 1, null, 10);
              const roll = msg.rolls[0];
              assert.equal(roll.total > 0, true, "No explosion!");
              log(false, `Roll result: ${roll.total}`);
            });
          }
          after(async function () {});
        });
        after(async function () {
          if (actor) {
            await actor.delete();
          }
        });
      });
    },
    { displayName: "ARS : Stress die tests" }
  );
}
