import { sleep } from "../tools/tools.js";

/**
 *
 * @param quench
 */
export function registerItemCreationTests(quench) {
  quench.registerBatch(
    "Ars-ActorSheet",
    (context) => {
      const { describe, it, assert, after, before } = context;
      for (let a of CONFIG.Actor.documentClass.TYPES) {
        if (["base"].includes(a)) continue;
        describe(`${a} Sheet`, function () {
          this.timeout(300000); // 300 seconds for easier debugging

          let actor;
          const suiteState = { actor: null };
          before(async function () {
            actor = await Actor.create({ name: `Bob`, type: a });
            suiteState.actor = actor;
          });
          describe("Add items", function () {
            for (let t of CONFIG.Item.documentClass.TYPES) {
              it(`Try adding ${t} to actor`, async function () {
                const currentActor = suiteState.actor;
                if (currentActor.sheet.isItemDropAllowed({ type: t, system: { type: "dummy" } })) {
                  try {
                    let itemData = currentActor.sheet.convertIfNeeded({
                      name: `New ${t}`,
                      type: t,
                      system: {}
                    });
                    let item = await currentActor.createEmbeddedDocuments("Item", [itemData]);
                    assert.ok(item.length === 1);
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
            suiteState.actor = null;
          });
        });
      }
    },
    { displayName: "ARS : Actor sheet tests" }
  );
}
