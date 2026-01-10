import { log, sleep } from "../tools/tools.js";
import { getCompanion, getMagus } from "./testData.js";
import { ArsLayer } from "../ui/ars-layer.js";
import { ARM5E } from "../config.js";
import { simpleDie, stressDie } from "../helpers/dice.js";
import Aura from "../helpers/aura.js";
import { Sanatorium } from "../apps/sanatorium.js";

const DEFAULT_ROLL = (sanatorium) => {
  return {
    roll: "char",
    name: "Recovery",
    characteristic: "sta",
    txtoption1: game.i18n.localize("arm5e.sanatorium.recoveryBonus"),
    option1: sanatorium.object.modifiers.activeEffect,
    txtoption2: game.i18n.localize("arm5e.sanatorium.mundaneHelp"),
    option2: sanatorium.object.modifiers.mundaneHelp,
    txtoption3: game.i18n.localize("arm5e.sanatorium.magicalHelp"),
    option3: sanatorium.object.modifiers.magicalHelp,
    txtoption4: game.i18n.localize("arm5e.sanatorium.labHealth"),
    option4: sanatorium.object.modifiers.labHealth,
    txtoption5: game.i18n.localize("arm5e.messages.die.bonus"),
    option5: 0,
    physicalcondition: false
  };
};

export function registerRecoveryTesting(quench) {
  quench.registerBatch(
    "Ars-Recovery",
    (context) => {
      const { describe, it, assert, expect, should, before, after } = context;
      // let actor;
      let magus;
      let dataset;
      let event;
      let gravity = "medium";
      const datetime = game.settings.get("arm5e", "currentDate");
      let woundName;
      before(async function () {
        ArsLayer.clearAura(true);
        magus = await getMagus("Tiberius");

        event = {
          preventDefault: () => {}
        };
        await magus.addActiveEffect("Recovery bonus", "vitals", "recovery", 4, null);
      });

      beforeEach(async function () {
        log(false, `XZ new wound ${gravity}`);
        const wound = (await magus.changeWound(1, gravity))[0];
        await wound.update({ "system.inflictedDate.year": datetime.year - 10 });
      });

      describe("Recovery nominal", async function () {
        CONFIG.ARM5E.recovery.wounds;

        for (const [woundName, woundCfg] of Object.entries(CONFIG.ARM5E.recovery.wounds)) {
          let count = 1;
          log(false, `XZRecovery ${woundName}`);
          if (woundName == "dead") continue;
          gravity = woundName;
          log(false, `XZRecovery2 ${gravity}`);
          it(`Recovery ${gravity} : season ${count}`, async function () {
            try {
              while (!magus.system.wounds.dead?.length && magus.hasWounds) {
                const sanatorium = new Sanatorium(magus, {}, {}); // data, options

                const sData = sanatorium.object;
                const res = await sanatorium.render(true);
                await sleep(50);
                event.dataset = DEFAULT_ROLL(sanatorium);

                while (sData.wounds.dead == undefined && sData.activeWounds > 0) {
                  await sanatorium._recoveryRoll(event);
                  await sleep(50);
                }
                const entry = await sanatorium._createDiaryEntry({
                  dataset: {}
                });

                entry.sheet.close();

                sanatorium.close();
                log(false, `Recovery of ${gravity}, season ${count}`);
                count++;
              }
              await magus.restoreHealth(true);
            } catch (err) {
              console.error(`Error: ${err}`);
              assert.ok(false);
            }
          });
        }
      });

      after(async function () {
        if (actor) {
          await actor.delete();
        }

        if (magus) {
          await magus.delete();
        }
      });
    },
    { displayName: "ARS : Recovery testsuite" }
  );
}
