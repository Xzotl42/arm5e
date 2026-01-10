import { sleep } from "../tools/tools.js";

export function registerItemCreationTests(quench) {
  quench.registerBatch(
    "Ars-ActorSheet",
    (context) => {
      const { describe, it, assert, after, before } = context;
      for (let a of CONFIG.Actor.documentClass.TYPES) {
        if (["base"].includes(a)) continue;
        describe(`${a} Sheet`, function () {
          let actor;
          before(async function () {
            actor = await Actor.create({ name: `Bob`, type: a });
          });
          describe("Add items", function () {
            for (let t of CONFIG.Item.documentClass.TYPES) {
              it(`Try adding ${t} to actor`, async function () {
                if (actor.sheet.isItemDropAllowed({ type: t, system: { type: "dummy" } })) {
                  try {
                    let item = await actor.sheet._itemCreate({ type: t, system: {} });
                    assert.ok(item.length == 1);
                    item[0].sheet.render(true);
                    await sleep(100);
                    await item[0].sheet.close();
                  } catch (e) {
                    console.error(`Error with ${e}`);
                    assert.ok(false);
                  }
                }
              });
            }
            it(`Render actor`, async function () {
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
          after(async function () {
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
