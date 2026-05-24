import { sleep } from "../tools/tools.js";

const SKIPPED_ITEM_TYPES = new Set([
  "magicItem",
  "personalityTrait",
  "reputation",
  "habitantMagi",
  "inhabitant",
  "habitantCompanion",
  "habitantSpecialists",
  "habitantHabitants",
  "habitantHorses",
  "habitantLivestock",
  "visStockCovenant",
  "baseEffect",
  "sanctumRoom",
  "labCovenant",
  "abilityFamiliar",
  "powerFamiliar",
  "speciality",
  "distinctive",
  "personality",
  "mundaneBook",
  "calendarCovenant",
  "wound",
  "container"
]);

export function registerSheetDisplayTests(quench) {
  quench.registerBatch(
    "Ars-document-constructors",
    (context) => {
      const { describe, it, assert } = context;

      describe("Actor create and display sheet Suite", function () {
        this.timeout(300000); // 300 seconds for easier debugging

        for (let t of CONFIG.Actor.documentClass.TYPES) {
          it(`Test ${t}'s constructor`, async function () {
            let actor;
            try {
              actor = await Actor.create({ name: `${t}Name`, type: t });
              actor.sheet.render(true);
              await sleep(100);
              await actor.sheet.close();
              assert.ok(true);
            } catch (e) {
              console.error(`Error with ${e}`);
              assert.ok(false);
            } finally {
              if (actor) {
                await actor.delete();
              }
            }
          });
        }
      });

      describe("Item create and display sheet ", function () {
        this.timeout(300000); // 300 seconds for easier debugging
        for (let t of CONFIG.Item.documentClass.TYPES) {
          if (!SKIPPED_ITEM_TYPES.has(t)) {
            it(`Test ${t}'s constructor`, async function () {
              let item;
              try {
                item = await Item.create({ name: `${t}Name`, type: t });
                item.sheet.render(true);
                await sleep(100);
                await item.sheet.close();

                assert.ok(true);
              } catch (e) {
                console.error(`Error with ${e}`);
                assert.ok(false);
              } finally {
                if (item) {
                  await item.delete();
                }
              }
            });
          }
        }
      });
    },
    { displayName: "ARS : Documents types creation and sheet display" }
  );
}
