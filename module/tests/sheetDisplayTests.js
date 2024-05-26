import { sleep } from "../tools.js";
const DEPRECATED = [
  "personality",
  "mundaneBook",
  "habitantCompanion",
  "habitantSpecialists",
  "habitantHabitants",
  "habitantHorses",
  "habitantLivestock",
  "habitantMagi"
];
export function registerSheetDisplayTests(quench) {
  quench.registerBatch(
    "Ars-document-constructors",
    (context) => {
      const { describe, it, assert, afterEach } = context;

      describe("Actor create and display sheet Suite", function () {
        let actor;
        for (let t of CONFIG.Actor.documentClass.TYPES) {
          it(`Test ${t}'s constructor`, async function () {
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

        afterEach(async function () {
          if (actor) {
            await actor.delete();
          }
        });
      });
      describe("Item create and display sheet ", function () {
        let item;
        for (let t of CONFIG.Item.documentClass.TYPES) {
          if (!DEPRECATED.includes(t)) {
            //TMP
            it(`Test ${t}'s constructor`, async function () {
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

        afterEach(async function () {
          if (item) {
            await item.delete();
          }
        });
      });
    },
    { displayName: "ARS : Documents types creation and sheet display" }
  );
}
