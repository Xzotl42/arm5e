import { log } from "../tools.js";
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
        actor = await getCompanion(`BobTheCompanionDEBUG`);
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

      describe("DEBUG Magic rolls", function () {
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
              usefatigue: true
            };
            magus.rollInfo.init(dataset, magus);
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
              magus.system.penalties.wounds.total +
              magus.system.fatigueTotal;
            assert.equal(roll.modifier(), tot);
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
