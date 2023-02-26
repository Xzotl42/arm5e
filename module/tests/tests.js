import { simpleDie, stressDie } from "../dice.js";
import { log, sleep } from "../tools.js";
import { armorItem, combatSkill, companionData, weaponItem } from "./testData.js";

export function registerTestSuites(quench) {
  registerRollTesting(quench);
  registerSheetDisplayTests(quench);
  registerItemCreationTests(quench);
}

function registerRollTesting(quench) {
  quench.registerBatch(
    "Ars-rolls",
    context => {
      const { describe, it, assert, before } = context;
      let actor;

      if (game.modules.get("dice-so-nice")?.active) {
        ui.notifications.warn("Disable dice-so-nice to test dice rolls");
        return;
      }

      before(async function() {
        actor = await Actor.create({
          name: `BobTheCompanion`,
          type: "player",
          system: companionData
        });
        await actor.sheet._itemCreate({ type: "ability", ...combatSkill });
        await actor.sheet._itemCreate({ type: "ability", ...combatSkill });
        await actor.sheet._itemCreate({ type: "weapon", ...weaponItem });
        await actor.sheet._itemCreate({ type: "armor", ...armorItem });
      });

      describe("Characteristics rolls", function() {
        for (let c of Object.keys(CONFIG.ARM5E.character.characteristics)) {
          it("Stress roll characteristic: " + [c], async function() {
            if (c === "cun") {
              assert.ok(true);
            } else {
              try {
                let dataset = { roll: "char", characteristic: c };
                actor.rollData.init(dataset, actor);
                let roll = await stressDie(actor, "char", 0, null, 10);
                log(false, roll);
                assert.ok(roll);
                if (roll.botched) return;
                assert.ok(roll.modifier() == actor.system.characteristics[c].value);
              } catch (err) {
                console.error(`Error: ${err}`);
                assert.ok(false);
              }
            }
          });
          it("Simple roll characteristic: " + [c], async function() {
            if (c === "cun") {
              assert.ok(true);
            } else {
              try {
                let dataset = { roll: "char", characteristic: c };
                actor.rollData.init(dataset, actor);
                let roll = await simpleDie(actor, "char", null);
                log(false, roll);
                assert.ok(roll);
                assert.ok(roll.modifier() == actor.system.characteristics[c].value);
              } catch (err) {
                console.error(`Error: ${err}`);
                assert.ok(false);
              }
            }
          });
        }
      });

      describe("Options rolls", function() {
        it("Personality roll", async function() {
          try {
            let dataset = { roll: "option", name: "Loyal", option1: 1, txtoption1: "score" };
            actor.rollData.init(dataset, actor);
            let roll = await stressDie(actor, "option", 0, null, 10);
            assert.ok(roll);
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("Reputation roll", async function() {
          try {
            let dataset = { roll: "option", name: "Dead", option1: 1, txtoption1: "score" };
            actor.rollData.init(dataset, actor);
            let roll = await stressDie(actor, "char", 0, null, 10);
            // log(false, roll);
            assert.ok(roll);
            if (roll.botched) return;
            assert.ok(roll.modifier() == 1);
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("All options roll", async function() {
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
            actor.rollData.init(dataset, actor);
            let roll = await simpleDie(actor, "option", null);
            log(false, roll);
            assert.ok(roll.total > 50);

            assert.ok(roll.modifier() == 50);
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("Init roll", async function() {
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
            actor.rollData.init(dataset, actor);
            let roll = await stressDie(actor, type, 0, null, 10);
            assert.ok(roll);
            if (roll.botched) return;
            log(false, roll);
            let tot =
              actor.system.characteristics.qik.value +
              actor.system.combat.init -
              actor.system.combat.overload;
            assert.ok(roll.modifier() == tot);
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("Combat roll", async function() {
          let type = "combat";
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
            actor.rollData.init(dataset, actor);
            let roll = await stressDie(actor, type, 0, null, 10);
            log(false, roll);
            assert.ok(roll);
            if (roll.botched) return;
            let tot =
              actor.system.characteristics.dex.value +
              actor.system.combat.atk +
              actor.system.combat.ability;
            assert.ok(roll.modifier() == tot);
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });
        it("Combat roll", async function() {
          let type = "combat";
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
            actor.rollData.init(dataset, actor);
            let roll = await stressDie(actor, type, 0, null, 10);
            log(false, roll);
            assert.ok(roll);
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });
      });
      after(async function() {
        if (actor) {
          await actor.delete();
        }
      });
    },
    { displayName: "ARS : Rolls testsuite" }
  );
}

function registerSheetDisplayTests(quench) {
  quench.registerBatch(
    "Ars-document-constructors",
    context => {
      const { describe, it, assert, afterEach } = context;

      describe("Actor create and display sheet Suite", function() {
        let actor;
        for (let t of CONFIG.Actor.documentClass.TYPES) {
          it(`Test ${t}'s constructor`, async function() {
            try {
              actor = await Actor.create({ name: `${t}Name`, type: t });
              actor.sheet.render(true);
              await sleep(100);
              await actor.sheet.close();
              assert.ok(true);
            } catch (e) {
              console.error(`Error with ${e}`);
              assert.ok(false);
            }
          });
        }

        afterEach(async function() {
          if (actor) {
            await actor.delete();
          }
        });
      });
      describe("Item create and display sheet ", function() {
        let item;
        for (let t of CONFIG.Item.documentClass.TYPES) {
          it(`Test ${t}'s constructor`, async function() {
            try {
              item = await Item.create({ name: `${t}Name`, type: t });
              item.sheet.render(true);
              await sleep(100);
              await item.sheet.close();

              assert.ok(true);
            } catch (e) {
              console.error(`Error with ${e}`);
              assert.ok(false);
            }
          });
        }

        afterEach(async function() {
          if (item) {
            await item.delete();
          }
        });
      });
    },
    { displayName: "ARS : Documents types creation and sheet display" }
  );
}
function registerItemCreationTests(quench) {
  quench.registerBatch(
    "Ars-ActorSheet",
    context => {
      const { describe, it, assert, after, before } = context;
      for (let a of CONFIG.Actor.documentClass.TYPES) {
        describe(`${a} Sheet`, function() {
          let actor;
          before(async function() {
            actor = await Actor.create({ name: `Bob`, type: a });
          });
          describe("Add items", function() {
            for (let t of CONFIG.Item.documentClass.TYPES) {
              it(`Try adding ${t} to actor`, async function() {
                if (actor.sheet.isItemDropAllowed({ type: t, system: { type: "dummy" } })) {
                  try {
                    let item = await actor.sheet._itemCreate({ type: t, system: {} });
                    assert.ok(item.length == 1);
                  } catch (e) {
                    console.error(`Error with ${e}`);
                    assert.ok(false);
                  }
                }
              });
            }
            it(`Render actor`, async function() {
              try {
                await actor.sheet.render(true);
                await sleep(100);
                await actor.sheet.close();
                assert.ok(true);
              } catch (e) {
                console.error(`Error with ${e}`);
                assert.ok(false);
              }
            });
          });
          after(async function() {
            if (actor) {
              await actor.delete();
            }
          });
        });
      }
    },
    { displayName: "ARS : Actor sheet tests" }
  );
}
