import { InvestigationRoll } from "../apps/investigationRoll.js";
import { getMagus } from "./testData.js";

function buildDiaryMock(actor) {
  return {
    actor,
    system: { description: "Diary test" },
    sheet: { render: () => {} },
    async update(data) {
      this._lastUpdate = data;
      return this;
    }
  };
}

function buildInvestigationData(magus, options = {}) {
  const { talisman = false } = options;
  const spells = magus.items.filter((i) => i.type === "spell");
  const e1 = spells[0]?.toObject();
  const e2 = spells[1]?.toObject();

  if (!e1 || !e2) {
    throw new Error("Not enough spell items on magus to build investigation data");
  }

  e1.system.hidden = false;
  e2.system.hidden = true;

  return {
    name: "Test Invested Item",
    uuid: "Compendium.fake.uuid",
    labTotal: 15,
    system: {
      enchantments: {
        state: talisman ? "talisman" : "opened",
        attunementVisible: false,
        effects: [e1, e2],
        capacities: [
          { id: "cap-a", desc: "Cap A" },
          { id: "cap-b", desc: "Cap B" }
        ]
      }
    }
  };
}

export function registerInvestigationRollTesting(quench) {
  quench.registerBatch(
    "Ars-InvestigationRoll",
    (context) => {
      const { describe, it, assert, before, after } = context;
      let magus;
      let diary;

      if (game.modules.get("dice-so-nice")?.active) {
        ui.notifications.warn("Disable dice-so-nice to test investigation roll");
        return;
      }

      before(async function () {
        this.timeout(300000);
        magus = await getMagus("InvestigationTester");
        diary = buildDiaryMock(magus);
      });

      describe("InvestigationRoll AppV2", function () {
        this.timeout(300000);

        it("InvestigationRoll.0: constructor throws if labTotal is missing", async function () {
          const data = buildInvestigationData(magus);
          delete data.labTotal;

          assert.throws(
            () => new InvestigationRoll(diary, data, {}),
            "InvestigationRoll: labTotal is required in data argument",
            "should throw error when labTotal is missing"
          );
        });

        it("InvestigationRoll.1: constructor initializes computed fields", async function () {
          const data = buildInvestigationData(magus);
          const app = new InvestigationRoll(diary, data, {});

          assert.equal(app.actor._id, magus._id, "actor should be diary.actor");
          assert.equal(app.diary, diary, "diary reference should be set");
          assert.equal(app.object.botchDice, 1, "botchDice should default to 1");
          assert.equal(
            app.object.failedInvestigation,
            false,
            "failedInvestigation should default false"
          );
          assert.equal(
            app.object.diaryDescription,
            "<br/><ul>",
            "diaryDescription should be initialized"
          );
          assert.isArray(app.object.effects, "effects should be computed into array");
          assert.isAtLeast(app.object.effects.length, 2, "effects should contain mapped effects");

          await app.close();
        });

        it("InvestigationRoll.2: constructor adds talisman attunement effect", async function () {
          const data = buildInvestigationData(magus, { talisman: true });
          const app = new InvestigationRoll(diary, data, {});

          const attuned = app.object.effects.find(
            (e) => e.name === game.i18n.localize("arm5e.enchantment.attuned") && e.level === 20
          );
          assert.ok(attuned, "attunement effect should be added for talisman");

          await app.close();
        });

        it("InvestigationRoll.3: _prepareContext returns expected structure", async function () {
          const data = buildInvestigationData(magus);
          const app = new InvestigationRoll(diary, data, {});

          app.object.effects[0].discovered = true;
          const ctx = await app._prepareContext();

          assert.property(ctx, "visibleEffects", "visibleEffects missing");
          assert.property(ctx, "discoveredEffects", "discoveredEffects missing");
          assert.property(ctx, "config", "config missing");
          assert.property(ctx, "selection", "selection missing");
          assert.property(ctx.selection, "capacities", "capacities missing");
          assert.equal(
            Object.keys(ctx.selection.capacities).length,
            2,
            "capacities count mismatch"
          );

          await app.close();
        });

        it("InvestigationRoll.4: _preparePartContext sets header/footer values", async function () {
          const data = buildInvestigationData(magus);
          const app = new InvestigationRoll(diary, data, {});

          const headerCtx = await app._preparePartContext("header", {});
          const footerCtx = await app._preparePartContext("footer", {});

          assert.equal(headerCtx.flavor, "Inputs", "header flavor incorrect");
          assert.equal(footerCtx.footer, "Inputs", "footer text incorrect");

          await app.close();
        });

        it("InvestigationRoll.5: form handler merges submitted object", async function () {
          const data = buildInvestigationData(magus);
          const app = new InvestigationRoll(diary, data, {});
          let rendered = false;
          app.render = () => {
            rendered = true;
          };

          await InvestigationRoll.DEFAULT_OPTIONS.form.handler.call(app, {}, null, {
            object: {
              botchDice: 3,
              failedInvestigation: true
            }
          });

          assert.equal(app.object.botchDice, 3, "botchDice should be updated from form");
          assert.equal(
            app.object.failedInvestigation,
            true,
            "failedInvestigation should be updated"
          );
          assert.equal(rendered, true, "render should be called by submit handler");
        });

        it("InvestigationRoll.6: static investigate delegates to _investigate", async function () {
          const data = buildInvestigationData(magus);
          const app = new InvestigationRoll(diary, data, {});
          let called = false;
          app._investigate = async () => {
            called = true;
          };

          await InvestigationRoll.investigate.call(app, {}, {});
          assert.equal(called, true, "_investigate should be called");

          await app.close();
        });

        it("InvestigationRoll.7: static endInvestigation delegates to _endInvestigation", async function () {
          const data = buildInvestigationData(magus);
          const app = new InvestigationRoll(diary, data, {});
          let called = false;
          app._endInvestigation = async () => {
            called = true;
          };

          await InvestigationRoll.endInvestigation.call(app, {}, {});
          assert.equal(called, true, "_endInvestigation should be called");

          await app.close();
        });

        it("InvestigationRoll.8: _investigate updates state and requests re-render", async function () {
          const data = buildInvestigationData(magus);
          const app = new InvestigationRoll(diary, data, {});
          app.object.botchDice = 0;

          let rendered = false;
          app.render = () => {
            rendered = true;
          };

          const descBefore = app.object.diaryDescription;
          await app._investigate({});

          assert.notEqual(
            app.object.diaryDescription,
            descBefore,
            "diaryDescription should change"
          );
          assert.isBoolean(app.object.failedInvestigation, "failedInvestigation should be boolean");
          assert.isArray(app.object.effects, "effects should remain an array");
          assert.equal(rendered, true, "render should be called after investigation");

          await app.close();
        });

        it("InvestigationRoll.9: renders and closes without error", async function () {
          const data = buildInvestigationData(magus);
          const app = new InvestigationRoll(diary, data, {});
          await app.render(true);

          assert.ok(app.element, "element should exist after render");
          assert.ok(app.rendered, "app should be rendered");

          await app.close();
        });
      });

      after(async function () {
        Object.values(ui.windows).forEach((app) => {
          if (app instanceof InvestigationRoll) {
            app.close();
          }
        });

        if (magus) {
          await magus.delete();
        }
      });
    },
    { displayName: "ARS : Investigation Roll (AppV2) testsuite" }
  );
}
