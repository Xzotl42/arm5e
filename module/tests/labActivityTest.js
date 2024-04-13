import { log } from "../tools.js";
import { getCompanion, getLab, getMagus } from "./testData.js";
import { ArsLayer } from "../ui/ars-layer.js";
import { ARM5E } from "../config.js";
import { simpleDie, stressDie } from "../dice.js";

export function registerLabActivityTesting(quench) {
  quench.registerBatch(
    "Ars-LabActivity",
    (context) => {
      const { describe, it, assert, expect, should, before, after } = context;
      let magus;
      let lab;
      const ACTIVITIES = Object.fromEntries(
        Object.entries(ARM5E.activities.lab).filter((e) => e[1].enabled == "")
      );

      before(async function () {
        magus = await getMagus("Tiberius");

        await magus.addActiveEffect("Affinity Corpus", "affinity", "co", 2, null);
        await magus.addActiveEffect("Puissant Muto", "art", "mu", 3, null);
        await magus.addActiveEffect("Deficient Perdo", "deficiency", "pe", undefined, null);
        magus.sheet.render(true);
        lab = await getLab("The Lair of Tiberius");
        lab.sheet.render(true);
        // link magus and lab
        await magus.sheet._onDropActor(null, { uuid: lab.uuid });
      });

      describe("LabActivity activity change", function () {
        for (let act of Object.keys(ACTIVITIES)) {
          it(`Switch to ${act}`, async function () {
            try {
              lab.sheet._resetPlanning(act);
              assert.ok(true);
            } catch (err) {
              console.error(`Error: ${err}`);
              assert.ok(false);
            }
          });
        }
      });

      describe("Lab totals Spells", function () {
        for (let tech of Object.keys(ARM5E.magic.techniques)) {
          for (let form of Object.keys(ARM5E.magic.forms)) {
            it(`Lab total ${tech} ${form}`, async function () {
              try {
                await lab.sheet._resetPlanning("inventSpell");
                const labData = lab.getFlag("arm5e", "planning");
                labData.data.system.technique.value = tech;
                labData.data.system.form.value = form;
                const data = await lab.sheet.getData();
                log(false, `${tech} ${form} : ${data.planning.labTotal.score}`);
                assert.equal(
                  data.planning.labTotal.score,
                  magus.system.labTotals[form][tech].total,
                  `Lab total ${tech} ${form}`
                );
              } catch (err) {
                console.error(`Error: ${err}`);
                assert.ok(false);
              }
            });
          }
        }
      });

      after(async function () {
        if (magus) {
          await magus.delete();
        }

        if (lab) {
          await lab.delete();
        }
      });
    },
    { displayName: "ARS : LabActivity testsuite" }
  );
}
