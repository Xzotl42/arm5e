import { log, sleep } from "../tools.js";
import { getCompanion, getLab, getMagus } from "./testData.js";
import { ArsLayer } from "../ui/ars-layer.js";
import { ARM5E } from "../config.js";
import { simpleDie, stressDie } from "../dice.js";
import Aura from "../helpers/aura.js";
import { ROLL_PROPERTIES } from "../helpers/rollWindow.js";

export function registerDEBUGTest(quench) {
  quench.registerBatch(
    "Ars-DEBUG",
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
      let lab;

      if (game.modules.get("dice-so-nice")?.active) {
        ui.notifications.warn("Disable dice-so-nice to test dice rolls");
        return;
      }
      let hasScene = false;
      if (game.scenes.viewed) {
        hasScene = true;
      }

      before(async function () {
        // actor = await getCompanion(`BobTheCompanionDEBUG`);
        magus = await getMagus("TiberiusDEBUG");
        ME1 = magus.items.getName("Standard effect");
        ME2 = magus.items.getName("All req effect");
        ME3 = magus.items.getName("Effect with focus");
        Sp1 = magus.items.getName("Standard spell");
        Sp2 = magus.items.getName("Spell with focus");
        Sp3 = magus.items.getName("Ritual spell");
        lab = await getLab("The Lair of Tiberius");
        lab.sheet.render(true);
        magus.sheet.render(true);
        actor = await Actor.create({ name: `Bob`, type: "covenant" });
        // link magus and lab
        await magus.sheet._onDropActor(null, { uuid: lab.uuid });
        await magus.addActiveEffect("Affinity Corpus", "affinity", "co", 2, null);
        await magus.addActiveEffect("Puissant Muto", "art", "mu", 3, null);
        await magus.addActiveEffect("Deficient Perdo", "deficiency", "pe", undefined, null);
        if (hasScene) {
          const data = await magus.getTokenDocument({ x: 1000, y: 1000 });
          data.actorLink = true;
          magusToken = (await canvas.scene.createEmbeddedDocuments("Token", [data]))[0];
          await magusToken.update({ actorLink: true });
          // aura = new Aura(canvas.scene.id);
          // await aura.set("faeric", 6);
          ArsLayer.clearAura(true);
        }
      });

      describe("Magic rolls", function () {
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
      });

      after(async function () {
        if (lab) {
          await lab.sheet.close();
          await lab.delete();
        }
        if (actor) {
          await actor.delete();
        }
        if (magusToken) {
          await magusToken.delete();
        }
        if (magus) {
          await magus.sheet.close();
          await magus.delete();
        }
      });
    },
    { displayName: "ARS : DEBUG testsuite" }
  );
}
