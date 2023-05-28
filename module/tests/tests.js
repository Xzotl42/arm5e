import { ARM5E } from "../config.js";
import { simpleDie, stressDie } from "../dice.js";
import { setAuraValueForAllTokensInScene } from "../helpers/aura.js";
import { StressDieInternal } from "../helpers/stressdie.js";
import { log, sleep } from "../tools.js";
import { ArsLayer } from "../ui/ars-layer.js";
import {
  armorItem,
  combatSkill,
  companionData,
  heavyCombatSkill,
  languageSkill,
  magicalEffect1,
  magicalEffect2,
  magicalEffect3,
  magusData,
  penetrationSkill,
  readingSkill,
  spellData1,
  spellData2,
  spellData3,
  weaponItem
} from "./testData.js";

export function registerTestSuites(quench) {
  registerStressDieTesting(quench);
  registerAbilityScoresTesting(quench);
  registerRollTesting(quench);
  registerSheetDisplayTests(quench);
  registerItemCreationTests(quench);
}

export function registerStressDieTesting(quench) {
  quench.registerBatch(
    "Ars-StressDie",
    context => {
      let actor;
      if (game.modules.get("dice-so-nice")?.active) {
        ui.notifications.warn("Disable dice-so-nice to test dice rolls");
        return;
      }
      const { describe, it, assert, after, before } = context;
      describe(`Exploding die`, function() {
        before(async function() {
          actor = await Actor.create({
            name: `BobTheCompanion`,
            type: "player",
            system: companionData
          });
        });
        describe("Dice", function() {
          for (const score of Array(5).keys()) {
            it(`Die exploding`, async function() {
              let die = new StressDieInternal();
              await die.evaluate({ async: true, minimize: true });
              assert.equal(die.total, 1, "Min not correct");
              log(false, `Roll result: ${die.total}`);
            });
            it(`Die botching `, async function() {
              let die = new StressDieInternal();
              await die.evaluate({ async: true, maximize: true });
              assert.equal(die.total, 0, "Max not correct");
            });
          }
          after(async function() {});
        });
        describe("Rolls", function() {
          for (const score of Array(20).keys()) {
            it(`Roll exploding`, async function() {
              let dataset = { roll: "char", characteristic: "pre" };
              actor.rollData.init(dataset, actor);
              let roll = await stressDie(actor, "char", 1, null, 10);
              assert.equal(roll.total > 0, true, "No explosion!");
              log(false, `Roll result: ${roll.total}`);
            });
          }
          after(async function() {});
        });
        after(async function() {
          if (actor) {
            await actor.delete();
          }
        });
      });
    },
    { displayName: "ARS : Stress die tests" }
  );
}
function registerRollTesting(quench) {
  quench.registerBatch(
    "Ars-rolls",
    context => {
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

      if (game.modules.get("dice-so-nice")?.active) {
        ui.notifications.warn("Disable dice-so-nice to test dice rolls");
        return;
      }
      let hasScene = false;
      if (game.scenes.viewed) {
        hasScene = true;
      }

      before(async function() {
        actor = await Actor.create({
          name: `BobTheCompanion`,
          type: "player",
          system: companionData
        });
        ArsLayer.clearAura();
        await actor.sheet._itemCreate({ name: "sword", type: "ability", ...combatSkill });
        await actor.sheet._itemCreate({ name: "poleaxe", type: "ability", ...heavyCombatSkill });
        await actor.sheet._itemCreate({ type: "weapon", ...weaponItem });
        await actor.sheet._itemCreate({ type: "armor", ...armorItem });

        magus = await Actor.create({
          name: `MerlinTheMagus`,
          type: "player",
          system: magusData
        });
        await magus.sheet._itemCreate({
          name: "Penetration",
          type: "ability",
          ...penetrationSkill
        });
        await magus.sheet._itemCreate({
          name: "Artes liberales",
          type: "ability",
          ...readingSkill
        });
        await magus.sheet._itemCreate({ name: "Gaelic", type: "ability", ...languageSkill });
        ME1 = (
          await magus.sheet._itemCreate({
            name: "Standard effect",
            type: "magicalEffect",
            ...magicalEffect1
          })
        )[0];
        ME2 = (
          await magus.sheet._itemCreate({
            name: "All req effect",
            type: "magicalEffect",
            ...magicalEffect2
          })
        )[0];
        ME3 = (
          await magus.sheet._itemCreate({
            name: "Effect with focus",
            type: "magicalEffect",
            ...magicalEffect3
          })
        )[0];
        Sp1 = (
          await magus.sheet._itemCreate({
            name: "Standard spell",
            type: "spell",
            ...spellData1
          })
        )[0];
        Sp2 = (
          await magus.sheet._itemCreate({
            name: "Spell with focus",
            type: "spell",
            ...spellData2
          })
        )[0];
        Sp3 = (
          await magus.sheet._itemCreate({
            name: "Ritual spell",
            type: "spell",
            ...spellData3
          })
        )[0];

        await magus.addActiveEffect("Affinity Corpus", "affinity", "co", 2, null);
        await magus.addActiveEffect("Puissant Muto", "art", "mu", 3, null);
        await magus.addActiveEffect("Deficient Perdo", "deficiency", "pe", undefined, null);
        if (hasScene) {
          const data = await magus.getTokenDocument({ x: 1000, y: 1000 });
          data.actorLink = true;
          magusToken = (await canvas.scene.createEmbeddedDocuments("Token", [data]))[0];
          await magusToken.update({ actorLink: true });
          await setAuraValueForAllTokensInScene(6, ARM5E.REALM_TYPES.FAERIC);
        }
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

      describe("Options rolls", function() {
        it("Personality roll", async function() {
          try {
            let dataset = { roll: "option", name: "Loyal", option1: 1, txtoption1: "score" };
            actor.rollData.init(dataset, actor);
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

        it("Reputation roll", async function() {
          try {
            let dataset = { roll: "option", name: "Dead", option1: 1, txtoption1: "score" };
            actor.rollData.init(dataset, actor);
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

            assert.equal(roll.modifier(), 50, "modifier not correct");
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
        it("Combat roll defense", async function() {
          let type = "combat";
          try {
            let dataset = {
              roll: type,
              name: "combat",
              option1: actor.system.characteristics.qik.value,
              txtoption1: "quickness",
              option2: actor.system.combat.ability,
              txtoption2: "ability",
              option3: actor.system.combat.dfn,
              txtoption3: "attack"
            };
            actor.rollData.init(dataset, actor);
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
        it("Combat roll exertion", async function() {
          let type = "combat";
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
            actor.rollData.init(dataset, actor);
            actor.rollData.combat.exertion = true;
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
        it("Combat wounded", async function() {
          await actor.changeWound(3, "light");
          let type = "combat";
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
            actor.rollData.init(dataset, actor);
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
      describe("Magic rolls", function() {
        it("Raw spontaneous", async function() {
          await magus.changeWound(3, "light");
          let type = "spont";
          try {
            let dataset = {
              roll: type,
              name: "Spontaneous",
              bonusActiveEffects: magus.system.bonuses.arts.spellcasting, // tmp
              technique: "mu",
              form: "co",
              divide: 2,
              usefatigue: true
            };
            magus.rollData.init(dataset, magus);
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
              magus.system.woundsTotal +
              magus.system.fatigueTotal +
              3;
            assert.equal(roll.modifier(), tot);
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });
        it("Raw spontaneous + deficiency", async function() {
          let type = "spont";
          try {
            let dataset = {
              roll: type,
              name: "Spontaneous deficient",
              bonusActiveEffects: magus.system.bonuses.arts.spellcasting,
              technique: "pe",
              form: "co",
              divide: 2,
              usefatigue: true
            };
            magus.rollData.init(dataset, magus);
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
              magus.system.woundsTotal +
              magus.system.fatigueTotal +
              1 +
              3;
            assert.equal(roll.modifier(), tot);
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });
        it("Magic effect std", async function() {
          let type = "magic";
          try {
            let dataset = {
              roll: type,
              bonusActiveEffects: magus.system.bonuses.arts.spellcasting,
              id: ME1._id,
              divide: 2,
              usefatigue: true
            };
            magus.rollData.init(dataset, magus);
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
              magus.system.woundsTotal +
              magus.system.fatigueTotal +
              2 +
              3;
            assert.equal(roll.modifier(), tot);
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });
        it("Magic effect all req", async function() {
          let type = "magic";
          try {
            await magus.rest();
            let dataset = {
              roll: type,
              bonusActiveEffects: magus.system.bonuses.arts.spellcasting,
              id: ME2._id,
              divide: 2,
              usefatigue: true
            };
            magus.rollData.init(dataset, magus);
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
              magus.system.woundsTotal +
              magus.system.fatigueTotal +
              3;
            assert.equal(roll.modifier(), tot);
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });
        it("Magic effect with focus", async function() {
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
            magus.rollData.init(dataset, magus);
            let roll = await stressDie(magus, type, 0, undefined, 1);
            log(false, roll);
            assert.ok(roll);
            if (roll.botches) {
              assert.equal(roll.total, 0, "botched");
              return;
            }
            // assert.equal(ME3.system.applyFocus, magus.rollData.magic.focus);
            let tot =
              magus.system.arts.techniques.mu.finalScore +
              magus.system.arts.forms.an.finalScore * 2 +
              magus.system.characteristics.sta.value +
              magus.system.woundsTotal +
              magus.system.fatigueTotal +
              3;
            assert.equal(roll.modifier(), tot);
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });
        it("Spell", async function() {
          let type = "spell";
          try {
            await magus.rest();
            let dataset = {
              roll: type,
              bonusActiveEffects: magus.system.bonuses.arts.spellcasting,
              id: Sp1._id
            };
            magus.rollData.init(dataset, magus);
            let roll = await stressDie(magus, type, 0, undefined, 4);
            log(false, roll);
            assert.ok(roll);
            if (roll.botches) {
              assert.equal(roll.total, 0, "botched");
              return;
            }

            // assert.equal(Sp1.system.masteryScore, magus.rollData.magic.mastery);
            // assert.equal(Sp1.system.bonus, magus.rollData.magic.bonus);
            let tot =
              magus.system.arts.techniques.mu.finalScore +
              magus.system.arts.forms.im.finalScore +
              magus.system.characteristics.sta.value +
              magus.system.woundsTotal +
              magus.system.fatigueTotal +
              Sp1.system.mastery +
              Sp1.system.bonus +
              3;
            assert.equal(roll.modifier(), tot);
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });
        it("Spell 2", async function() {
          let type = "spell";
          try {
            await magus.rest();
            let dataset = {
              roll: type,
              bonusActiveEffects: magus.system.bonuses.arts.spellcasting,
              id: Sp2._id
            };
            magus.rollData.init(dataset, magus);
            let roll = await stressDie(magus, type, 0, undefined, 3);
            log(false, roll);
            assert.ok(roll);
            if (roll.botches) {
              assert.equal(roll.total, 0, "botched");
              return;
            }

            // assert.equal(Sp1.system.masteryScore, magus.rollData.magic.mastery);
            // assert.equal(Sp1.system.bonus, magus.rollData.magic.bonus);
            let tot =
              magus.system.arts.techniques.mu.finalScore +
              magus.system.arts.forms.co.finalScore * 2 +
              magus.system.characteristics.sta.value +
              magus.system.woundsTotal +
              magus.system.fatigueTotal +
              Sp2.system.mastery +
              Sp2.system.bonus +
              3;
            assert.equal(roll.modifier(), tot);
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });
        it("Spell loud and exaggerated", async function() {
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
            magus.rollData.init(dataset, magus);
            let roll = await stressDie(magus, type, 0, undefined, 3);
            log(false, roll);
            assert.ok(roll);
            if (roll.botches) {
              assert.equal(roll.total, 0, "botched");
              return;
            }

            // assert.equal(Sp1.system.masteryScore, magus.rollData.magic.mastery);
            // assert.equal(Sp1.system.bonus, magus.rollData.magic.bonus);
            let tot =
              magus.system.arts.techniques.mu.finalScore +
              magus.system.arts.forms.co.finalScore * 2 +
              magus.system.characteristics.sta.value +
              magus.system.woundsTotal +
              magus.system.fatigueTotal +
              Sp2.system.mastery +
              Sp2.system.bonus +
              3;
            assert.equal(roll.modifier(), tot);
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });
        it("Ritual spell", async function() {
          let type = "spell";
          try {
            await magus.rest();
            let dataset = {
              roll: type,
              bonusActiveEffects: magus.system.bonuses.arts.spellcasting,
              id: Sp3._id
            };
            magus.rollData.init(dataset, magus);
            let roll = await stressDie(magus, type, 0, undefined, 2);
            log(false, roll);
            assert.ok(roll);
            if (roll.botches) {
              assert.equal(roll.total, 0, "botched");
              return;
            }

            // assert.equal(Sp1.system.masteryScore, magus.rollData.magic.mastery);
            // assert.equal(Sp1.system.bonus, magus.rollData.magic.bonus);
            let tot =
              magus.system.arts.techniques.mu.finalScore +
              magus.system.arts.forms.vi.finalScore +
              magus.system.characteristics.sta.value +
              magus.system.woundsTotal +
              magus.system.fatigueTotal +
              Sp3.system.mastery +
              Sp3.system.bonus +
              3;
            assert.equal(roll.modifier(), tot);
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
          if (t !== "mundaneBook") {
            //TMP
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
                // await actor.update({ name: "new Name" });
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

const MAX_SCORE = 10;
function registerAbilityScoresTesting(quench) {
  quench.registerBatch(
    "Ars-AbilityScore",
    context => {
      const { describe, it, assert, after, before } = context;
      describe(`Normal ability`, function() {
        let actor;
        let item;
        before(async function() {
          actor = await Actor.create({ name: `Bob`, type: "player" });
          item = (
            await actor.sheet._itemCreate({
              name: "myAbility",
              type: "ability",
              system: {
                key: "dowsing"
              }
            })
          )[0];
        });
        describe("Add xps", function() {
          for (const score of Array(MAX_SCORE).keys()) {
            let inc = (score + 1) * 5;
            it(`Adding ${inc} to actor`, async function() {
              await item.update({ "system.xp": item.system.xp + inc }, { parent: actor.id });
              assert.equal(item.system.finalScore, score + 1, "Final score");
              assert.equal(item.system.xpNextLevel, 5 * (score + 2), "xpNextLevel");
              assert.equal(item.system.remainingXp, 0, "remainingXp");
            });
          }
          after(async function() {
            if (item) {
              await item.update({ "system.xp": 0 }, { parent: actor.id });
            }
          });
        });

        describe("Add xp+1", function() {
          for (const score of Array(MAX_SCORE).keys()) {
            let inc = (score + 1) * 5;

            it(`Adding ${inc + 1} to actor`, async function() {
              await item.update(
                { "system.xp": (5 * (score + 1) * (score + 2)) / 2 + 1 },
                { parent: actor.id }
              );
              assert.equal(item.system.finalScore, score + 1, "Final score");
              assert.equal(item.system.xpNextLevel, 5 * (score + 2), "xpNextLevel");
              assert.equal(item.system.remainingXp, 1, "remainingXp");
            });
          }
          after(async function() {
            if (item) {
              await item.update({ "system.xp": 0 }, { parent: actor.id });
            }
          });
        });
        describe("Add xp-1", function() {
          for (const score of Array(MAX_SCORE).keys()) {
            let inc = (score + 1) * 5;

            it(`Adding ${inc - 1} to actor`, async function() {
              await item.update(
                { "system.xp": (5 * (score + 1) * (score + 2)) / 2 - 1 },
                { parent: actor.id }
              );
              assert.equal(item.system.finalScore, score, "Final score");
              assert.equal(item.system.xpNextLevel, 5 * (score + 1), "xpNextLevel");
              assert.equal(item.system.remainingXp, 5 * (score + 1) - 1, "remainingXp");
            });
          }
          after(async function() {
            if (item) {
              await item.update({ "system.xp": 0 }, { parent: actor.id });
            }
          });
        });

        describe("Increase score", function() {
          for (const score of Array(MAX_SCORE).keys()) {
            it(`Increase score to ${score + 1}`, async function() {
              await item.system._increaseScore();
              assert.equal(item.system.finalScore, score + 1, "Final score");
              assert.equal(item.system.xpNextLevel, 5 * (score + 2), "xpNextLevel");
              assert.equal(item.system.remainingXp, 0, "remainingXp");
            });
          }
        });

        describe("Decrease score", function() {
          for (const score of Array(MAX_SCORE).keys()) {
            it(`Increase score to ${MAX_SCORE - score}`, async function() {
              await item.system._decreaseScore();
              assert.equal(item.system.finalScore, MAX_SCORE - 1 - score, "Final score");
              assert.equal(item.system.xpNextLevel, 5 * (MAX_SCORE - score), "xpNextLevel");
              assert.equal(item.system.remainingXp, 0, "remainingXp");
            });
          }
        });
        after(async function() {
          if (actor) {
            await actor.delete();
          }
        });
      });
    },
    { displayName: "ARS : Ability score computation" }
  );
}
