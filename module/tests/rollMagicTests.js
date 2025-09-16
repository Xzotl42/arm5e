import { log } from "../tools.js";
import { getCompanion, getMagus } from "./testData.js";
import { ArsLayer } from "../ui/ars-layer.js";
import { ARM5E } from "../config.js";
import { simpleDie, stressDie } from "../dice.js";
import Aura from "../helpers/aura.js";
import { ROLL_PROPERTIES } from "../helpers/rollWindow.js";

export function registerMagicRollTesting(quench) {
  quench.registerBatch(
    "Ars-Magic-rolls",
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
              fatigueOnUse: 1
            };
            magus.rollInfo.init(dataset, magus);
            const msg = await stressDie(magus, type, 0, undefined, 10);
            const roll = msg.rolls[0];

            log(false, roll);
            assert.ok(roll);
            if (roll.botches) {
              assert.equal(roll.total, 0, "botched");
              return;
            }
            const aura = Aura.fromActor(magus);
            aura.computeMaxAuraModifier(magus.system.realms);
            let tot =
              magus.system.arts.techniques.mu.finalScore +
              magus.system.arts.forms.co.finalScore +
              magus.system.characteristics.sta.value +
              magus.system.penalties.wounds.total +
              magus.system.fatigueTotal +
              aura.modifier;
            log(false, roll);
            assert.equal(roll.modifier, tot);
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
              fatigueOnUse: 1
            };
            magus.rollInfo.init(dataset, magus);
            const msg = await stressDie(magus, type, 0, undefined, 10);
            const roll = msg.rolls[0];

            log(false, roll);
            assert.ok(roll);
            if (roll.botches) {
              assert.equal(roll.total, 0, "botched");
              return;
            }
            const aura = Aura.fromActor(magus);
            aura.computeMaxAuraModifier(magus.system.realms);
            let tot =
              magus.system.arts.techniques.pe.finalScore +
              magus.system.arts.forms.co.finalScore +
              magus.system.characteristics.sta.value +
              magus.system.penalties.wounds.total +
              magus.system.fatigueTotal +
              aura.modifier;
            log(false, roll);
            assert.equal(roll.modifier, tot);
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
              fatigueOnUse: 1
            };
            magus.rollInfo.init(dataset, magus);
            const msg = await stressDie(magus, type, 0, undefined, 100);
            const roll = msg.rolls[0];

            log(false, roll);
            assert.ok(roll);
            if (roll.botches) {
              assert.equal(roll.total, 0, "botched");
              return;
            }
            const aura = Aura.fromActor(magus);
            aura.computeMaxAuraModifier(magus.system.realms);
            let tot =
              magus.system.arts.techniques.cr.finalScore +
              magus.system.arts.forms.ig.finalScore +
              magus.system.characteristics.sta.value +
              magus.system.penalties.wounds.total +
              magus.system.fatigueTotal +
              aura.modifier;
            log(false, roll);
            assert.equal(roll.modifier, tot);
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
              fatigueOnUse: 1
            };
            magus.rollInfo.init(dataset, magus);
            const msg = await stressDie(magus, type, 0, undefined, 1);
            const roll = msg.rolls[0];

            log(false, roll);
            assert.ok(roll);
            if (roll.botches) {
              assert.equal(roll.total, 0, "botched");
              return;
            }
            const aura = Aura.fromActor(magus);
            aura.computeMaxAuraModifier(magus.system.realms);
            let tot =
              // magus.system.arts.techniques.cr.finalScore +
              // magus.system.arts.forms.ig.finalScore +
              magus.system.characteristics.sta.value +
              magus.system.penalties.wounds.total +
              magus.system.fatigueTotal +
              aura.modifier;
            log(false, roll);
            assert.equal(roll.modifier, tot);
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
              // fatigueOnUse: 1
            };
            magus.rollInfo.init(dataset, magus);
            const msg = await stressDie(magus, type, 0, undefined, 1);
            const roll = msg.rolls[0];

            log(false, roll);
            assert.ok(roll);
            if (roll.botches) {
              assert.equal(roll.total, 0, "botched");
              return;
            }
            const aura = Aura.fromActor(magus);
            aura.computeMaxAuraModifier(magus.system.realms);
            let tot =
              magus.system.arts.techniques.mu.finalScore +
              magus.system.arts.forms.an.finalScore * 2 +
              magus.system.characteristics.sta.value +
              magus.system.penalties.wounds.total +
              magus.system.fatigueTotal +
              aura.modifier;
            log(false, roll);
            assert.equal(roll.modifier, tot);
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
            const msg = await stressDie(magus, type, 0, undefined, 4);
            const roll = msg.rolls[0];

            log(false, roll);
            assert.ok(roll);
            if (roll.botches) {
              assert.equal(roll.total, 0, "botched");
              return;
            }
            const aura = Aura.fromActor(magus);
            aura.computeMaxAuraModifier(magus.system.realms);
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
              aura.modifier;
            log(false, roll);
            assert.equal(roll.modifier, tot);
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
            const msg = await stressDie(magus, type, 0, undefined, 3);
            const roll = msg.rolls[0];

            log(false, roll);
            assert.ok(roll);
            if (roll.botches) {
              assert.equal(roll.total, 0, "botched");
              return;
            }
            const aura = Aura.fromActor(magus);
            aura.computeMaxAuraModifier(magus.system.realms);
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
              aura.modifier;
            log(false, roll);
            assert.equal(roll.modifier, tot);
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });
        it("Spell + deficiency", async function () {
          let type = "spell";
          try {
            let dataset = {
              roll: type,
              name: "Spell deficient",
              bonusActiveEffects: magus.system.bonuses.arts.spellcasting,
              id: Sp4._id
            };
            magus.rollInfo.init(dataset, magus);
            const msg = await stressDie(magus, type, 0, undefined, 3);
            const roll = msg.rolls[0];

            log(false, roll);
            assert.ok(roll);
            if (roll.botches) {
              assert.equal(roll.total, 0, "botched");
              return;
            }
            const aura = Aura.fromActor(magus);
            aura.computeMaxAuraModifier(magus.system.realms);
            let tot =
              magus.system.arts.techniques.pe.finalScore +
              magus.system.arts.forms.vi.finalScore +
              magus.system.characteristics.sta.value +
              magus.system.penalties.wounds.total +
              magus.system.fatigueTotal +
              Sp4.system.finalScore +
              Sp4.system.bonus +
              aura.modifier;
            log(false, roll);
            assert.equal(roll.modifier, tot);
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
            const msg = await stressDie(magus, type, 0, undefined, 3);
            const roll = msg.rolls[0];

            log(false, roll);
            assert.ok(roll);
            if (roll.botches) {
              assert.equal(roll.total, 0, "botched");
              return;
            }
            const aura = Aura.fromActor(magus);
            aura.computeMaxAuraModifier(magus.system.realms);
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
              aura.modifier;
            log(false, roll);
            assert.equal(roll.modifier, tot);
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
            const msg = await stressDie(magus, type, 0, undefined, 2);
            const roll = msg.rolls[0];

            log(false, roll);
            assert.ok(roll);
            if (roll.botches) {
              assert.equal(roll.total, 0, "botched");
              return;
            }
            const aura = Aura.fromActor(magus);
            aura.computeMaxAuraModifier(magus.system.realms);
            let tot =
              magus.system.arts.techniques.mu.finalScore +
              magus.system.arts.forms.vi.finalScore +
              magus.system.characteristics.sta.value +
              magus.system.penalties.wounds.total +
              magus.system.fatigueTotal +
              Sp3.system.finalScore +
              Sp3.system.bonus +
              5 + // phylosophy and artes liberales
              aura.modifier;
            log(false, roll);
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
    { displayName: "ARS : Magic Rolls testsuite" }
  );
}
