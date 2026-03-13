import { getCompanion, getMagus } from "./testData.js";
import { QuickVitals, quickVitals } from "../helpers/combat.js";
import { QuickCombat, quickCombat } from "../helpers/combat.js";
import { QuickMagic, quickMagic } from "../helpers/magic.js";

export function registerQuickAppsIntegrationTesting(quench) {
  quench.registerBatch(
    "Ars-QuickApps",
    (context) => {
      const { describe, it, assert, before, after, afterEach } = context;
      let companion;
      let magus;
      let hasScene = false;
      let companionToken;
      let magusToken;

      before(async function () {
        this.timeout(300000); // 300 seconds for all quick apps integration tests
        companion = await getCompanion("TestCompanion");
        magus = await getMagus("TestMagus");

        if (game.scenes.viewed) {
          hasScene = true;
          // Add actors to canvas for token-based testing
          const companionData = await companion.getTokenDocument({ x: 500, y: 500 });
          companionData.actorLink = true;
          companionToken = (
            await canvas.scene.createEmbeddedDocuments("Token", [companionData])
          )[0];
          await companionToken.update({ actorLink: true });

          const magusData = await magus.getTokenDocument({ x: 1000, y: 1000 });
          magusData.actorLink = true;
          magusToken = (await canvas.scene.createEmbeddedDocuments("Token", [magusData]))[0];
          await magusToken.update({ actorLink: true });
        } else {
          ui.notifications.warn("No active scene - some tests may be limited");
        }
      });

      afterEach(async function () {
        // Clean up any open applications
        Object.values(ui.windows).forEach((app) => {
          if (
            app instanceof QuickCombat ||
            app instanceof QuickMagic ||
            app instanceof QuickVitals
          ) {
            app.close();
          }
        });
      });

      // ========== QuickVitals Tests ==========
      describe("QuickVitals AppV2", function () {
        it("QuickVitals.1: initializes with actor reference", async function () {
          this.timeout(300000);
          const vitals = new QuickVitals({ name: companion.name, actor: companion }, {});
          assert.equal(vitals.object.actor._id, companion._id, "actor not set correctly");
          assert.equal(vitals.object.name, companion.name, "name not set correctly");
          await vitals.close();
        });

        it("QuickVitals.2: _prepareContext returns valid structure", async function () {
          this.timeout(300000);
          const vitals = new QuickVitals({ name: companion.name, actor: companion }, {});
          const context = await vitals._prepareContext();

          assert.property(context, "name", "name missing");
          assert.property(context, "actor", "actor missing");
          assert.property(context, "woundCfg", "woundCfg missing");
          assert.property(context, "conscious", "conscious missing");
          assert.isBoolean(context.conscious, "conscious should be boolean");
          assert.equal(context.name, companion.name, "name incorrect");
          assert.equal(context.actor._id, companion._id, "actor incorrect");

          await vitals.close();
        });

        it("QuickVitals.3: conscious flag reflects fatigue state", async function () {
          this.timeout(300000);
          const vitals = new QuickVitals({ name: companion.name, actor: companion }, {});

          // Ensure actor is rested
          await companion.rest();
          let context = await vitals._prepareContext();
          assert.equal(context.conscious, true, "should be conscious when rested");

          // Add fatigue to test boundary
          const initialFatigue = companion.system.fatigueCurrent;
          await companion.loseFatigueLevel(1, false);
          context = await vitals._prepareContext();
          // Should still be conscious unless at max fatigue
          if (companion.system.fatigueCurrent < companion.system.fatigueMaxLevel) {
            assert.equal(context.conscious, true, "should be conscious below max fatigue");
          }

          // Restore state
          await companion.rest();
          await vitals.close();
        });

        it("QuickVitals.4: rest action restores fatigue", async function () {
          this.timeout(300000);
          const vitals = new QuickVitals({ name: companion.name, actor: companion }, {});

          // Add some fatigue
          await companion.loseFatigueLevel(2, false);
          const fatigueAfterLoss = companion.system.fatigueCurrent;
          assert.isAbove(fatigueAfterLoss, 0, "should have fatigue");

          // Call rest action
          await QuickVitals.rest.call(vitals, {}, {});
          assert.equal(companion.system.fatigueCurrent, 0, "fatigue should be cleared after rest");

          await vitals.close();
        });

        it("QuickVitals.5: addFatigue increases fatigue level", async function () {
          this.timeout(300000);
          const vitals = new QuickVitals({ name: companion.name, actor: companion }, {});
          await companion.rest();

          const initialFatigue = companion.system.fatigueCurrent;
          await QuickVitals.addFatigue.call(vitals, {}, {});
          assert.equal(
            companion.system.fatigueCurrent,
            initialFatigue + 1,
            "fatigue should increase by 1"
          );

          await companion.rest();
          await vitals.close();
        });

        it("QuickVitals.6: removeFatigue decreases fatigue level", async function () {
          this.timeout(300000);
          const vitals = new QuickVitals({ name: companion.name, actor: companion }, {});

          // Add fatigue first
          await companion.loseFatigueLevel(2, false);
          const fatigueLevel = companion.system.fatigueCurrent;

          await QuickVitals.removeFatigue.call(vitals, {}, {});
          assert.equal(
            companion.system.fatigueCurrent,
            fatigueLevel - 1,
            "fatigue should decrease by 1"
          );

          await companion.rest();
          await vitals.close();
        });

        it("QuickVitals.7: addWound increases wound count", async function () {
          this.timeout(300000);
          const vitals = new QuickVitals({ name: companion.name, actor: companion }, {});
          await companion.restoreHealth();

          const initialLightWounds = companion.system.wounds.light.length;
          const mockTarget = { dataset: { type: "light" } };

          await QuickVitals.addWound.call(vitals, {}, mockTarget);
          assert.equal(
            companion.system.wounds.light.length,
            initialLightWounds + 1,
            "light wounds should increase by 1"
          );

          await companion.restoreHealth();
          await vitals.close();
        });

        it("QuickVitals.8: registers in actor.apps on render", async function () {
          this.timeout(300000);
          const vitals = new QuickVitals({ name: companion.name, actor: companion }, {});
          await vitals.render(true);

          assert.property(companion.apps, vitals.options.uniqueId, "app should be in actor.apps");
          assert.equal(
            companion.apps[vitals.options.uniqueId],
            vitals,
            "app reference should match"
          );

          await vitals.close();
        });

        it("QuickVitals.9: removes from actor.apps on close", async function () {
          this.timeout(300000);
          const vitals = new QuickVitals({ name: companion.name, actor: companion }, {});
          await vitals.render(true);

          const appId = vitals.options.uniqueId;
          assert.property(companion.apps, appId, "app should exist before close");

          await vitals.close();
          assert.notProperty(companion.apps, appId, "app should be removed after close");
        });

        it("QuickVitals.10: renders without error and displays briefly", async function () {
          this.timeout(300000);
          const vitals = new QuickVitals({ name: companion.name, actor: companion }, {});
          await vitals.render(true);

          assert.ok(vitals.element, "element should exist after render");
          assert.ok(vitals.rendered, "should be marked as rendered");

          await new Promise((resolve) => setTimeout(resolve, 1000));
          await vitals.close();
        });
      });

      // ========== QuickCombat Tests ==========
      describe("QuickCombat AppV2", function () {
        it("QuickCombat.1: initializes with actor reference", async function () {
          this.timeout(300000);
          const combat = new QuickCombat({ name: companion.name, actor: companion }, {});
          assert.equal(combat.object.actor._id, companion._id, "actor not set correctly");
          assert.equal(combat.object.name, companion.name, "name not set correctly");
          await combat.close();
        });

        it("QuickCombat.2: _prepareContext returns valid combat structure", async function () {
          this.timeout(300000);
          const combat = new QuickCombat({ name: companion.name, actor: companion }, {});
          const context = await combat._prepareContext();

          assert.property(context, "name", "name missing");
          assert.property(context, "system", "system missing");
          assert.property(context, "combat", "combat stats missing");
          assert.property(context.system, "combat", "system.combat missing");
          assert.property(context.system, "characteristics", "system.characteristics missing");

          // Check combat stats
          assert.property(context.combat, "init", "initiative missing");
          assert.property(context.combat, "attack", "attack missing");
          assert.property(context.combat, "defense", "defense missing");
          assert.property(context.combat, "damage", "damage missing");
          assert.property(context.combat, "soak", "soak missing");

          await combat.close();
        });

        it("QuickCombat.3: computed combat stats are correct", async function () {
          this.timeout(300000);
          const combat = new QuickCombat({ name: companion.name, actor: companion }, {});
          const context = await combat._prepareContext();

          const expectedInit =
            companion.system.combat.init -
            companion.system.combat.overload +
            companion.system.characteristics.qik.value;
          const expectedAttack =
            companion.system.combat.atk +
            companion.system.combat.ability +
            companion.system.characteristics.dex.value;
          const expectedDefense =
            companion.system.combat.dfn +
            companion.system.combat.ability +
            companion.system.characteristics.qik.value;

          assert.equal(context.combat.init, expectedInit, "initiative calculation incorrect");
          assert.equal(context.combat.attack, expectedAttack, "attack calculation incorrect");
          assert.equal(context.combat.defense, expectedDefense, "defense calculation incorrect");

          await combat.close();
        });

        it("QuickCombat.4: registers in actor.apps on render", async function () {
          this.timeout(300000);
          const combat = new QuickCombat({ name: companion.name, actor: companion }, {});
          await combat.render(true);

          assert.property(companion.apps, combat.options.uniqueId, "app should be in actor.apps");
          assert.equal(
            companion.apps[combat.options.uniqueId],
            combat,
            "app reference should match"
          );

          await combat.close();
        });

        it("QuickCombat.5: removes from actor.apps on close", async function () {
          this.timeout(300000);
          const combat = new QuickCombat({ name: companion.name, actor: companion }, {});
          await combat.render(true);

          const appId = combat.options.uniqueId;
          assert.property(companion.apps, appId, "app should exist before close");

          await combat.close();
          assert.notProperty(companion.apps, appId, "app should be removed after close");
        });

        it("QuickCombat.6: renders without error and displays briefly", async function () {
          this.timeout(300000);
          const combat = new QuickCombat({ name: companion.name, actor: companion }, {});
          await combat.render(true);

          assert.ok(combat.element, "element should exist after render");
          assert.ok(combat.rendered, "should be marked as rendered");

          await new Promise((resolve) => setTimeout(resolve, 1000));
          await combat.close();
        });
      });

      // ========== QuickMagic Tests ==========
      describe("QuickMagic AppV2", function () {
        it("QuickMagic.1: initializes with actor and default arts", async function () {
          this.timeout(300000);
          const magic = new QuickMagic({ name: magus.name, actor: magus }, {});
          assert.equal(magic.object.actor._id, magus._id, "actor not set correctly");
          assert.equal(magic.object.name, magus.name, "name not set correctly");
          assert.equal(magic.object.technique, "cr", "default technique should be 'cr'");
          assert.equal(magic.object.form, "an", "default form should be 'an'");
          await magic.close();
        });

        it("QuickMagic.2: _prepareContext returns valid magic structure", async function () {
          this.timeout(300000);
          const magic = new QuickMagic({ name: magus.name, actor: magus }, {});
          const context = await magic._prepareContext();

          assert.property(context, "name", "name missing");
          assert.property(context, "system", "system missing");
          assert.property(context, "technique", "technique missing");
          assert.property(context, "form", "form missing");
          assert.property(context, "config", "config missing");
          assert.property(context, "selection", "selection missing");

          // Check system properties
          assert.property(context.system, "stances", "stances missing");
          assert.property(context.system, "arts", "arts missing");
          assert.property(context.system, "characteristics", "characteristics missing");
          assert.property(context.system, "laboratory", "laboratory missing");

          // Check selections
          assert.property(context.selection, "voiceStances", "voiceStances missing");
          assert.property(context.selection, "gesturesStances", "gesturesStances missing");
          assert.property(context.selection, "techniques", "techniques missing");
          assert.property(context.selection, "forms", "forms missing");

          await magic.close();
        });

        it("QuickMagic.3: technique and form can be changed", async function () {
          this.timeout(300000);
          const magic = new QuickMagic({ name: magus.name, actor: magus }, {});

          // Change technique and form
          magic.object.technique = "pe";
          magic.object.form = "vi";

          const context = await magic._prepareContext();
          assert.equal(context.technique, "pe", "technique should be 'pe'");
          assert.equal(context.form, "vi", "form should be 'vi'");

          await magic.close();
        });

        it("QuickMagic.4: selection options formatted correctly", async function () {
          this.timeout(300000);
          const magic = new QuickMagic({ name: magus.name, actor: magus }, {});
          const context = await magic._prepareContext();

          // Check that techniques have proper format (key: "Label (score)")
          for (const [key, value] of Object.entries(context.selection.techniques)) {
            assert.isString(value, `technique ${key} should have string value`);
            assert.match(value, /\(.+\)$/, `technique ${key} should have score in parentheses`);
          }

          // Check that forms have proper format
          for (const [key, value] of Object.entries(context.selection.forms)) {
            assert.isString(value, `form ${key} should have string value`);
            assert.match(value, /\(.+\)$/, `form ${key} should have score in parentheses`);
          }

          await magic.close();
        });

        it("QuickMagic.5: form submission updates technique and form", async function () {
          this.timeout(300000);
          const magic = new QuickMagic({ name: magus.name, actor: magus }, {});

          const mockFormData = {
            object: {
              technique: "mu",
              form: "co"
            }
          };

          await QuickMagic.DEFAULT_OPTIONS.form.handler.call(magic, {}, null, mockFormData);

          assert.equal(magic.object.technique, "mu", "technique should update to 'mu'");
          assert.equal(magic.object.form, "co", "form should update to 'co'");

          await magic.close();
        });

        it("QuickMagic.6: registers in actor.apps on render", async function () {
          this.timeout(300000);
          const magic = new QuickMagic({ name: magus.name, actor: magus }, {});
          await magic.render(true);

          assert.property(magus.apps, magic.options.uniqueId, "app should be in actor.apps");
          assert.equal(magus.apps[magic.options.uniqueId], magic, "app reference should match");

          await magic.close();
        });

        it("QuickMagic.7: removes from actor.apps on close", async function () {
          this.timeout(300000);
          const magic = new QuickMagic({ name: magus.name, actor: magus }, {});
          await magic.render(true);

          const appId = magic.options.uniqueId;
          assert.property(magus.apps, appId, "app should exist before close");

          await magic.close();
          assert.notProperty(magus.apps, appId, "app should be removed after close");
        });

        it("QuickMagic.8: only works with magus actors", async function () {
          this.timeout(300000);
          // This tests the helper function quickMagic
          // For a companion (non-magus), it should return early
          const result = await quickMagic(companion.name, companion);
          assert.isUndefined(result, "quickMagic should return undefined for non-magus");
        });

        it("QuickMagic.9: renders without error and displays briefly", async function () {
          this.timeout(300000);
          const magic = new QuickMagic({ name: magus.name, actor: magus }, {});
          await magic.render(true);

          assert.ok(magic.element, "element should exist after render");
          assert.ok(magic.rendered, "should be marked as rendered");

          await new Promise((resolve) => setTimeout(resolve, 1000));
          await magic.close();
        });

        it("QuickMagic.10: all techniques are available in selection", async function () {
          this.timeout(300000);
          const magic = new QuickMagic({ name: magus.name, actor: magus }, {});
          const context = await magic._prepareContext();

          const expectedTechniques = Object.keys(CONFIG.ARM5E.magic.techniques);
          const actualTechniques = Object.keys(context.selection.techniques);

          for (const tech of expectedTechniques) {
            assert.include(actualTechniques, tech, `technique ${tech} should be available`);
          }

          await magic.close();
        });

        it("QuickMagic.11: all forms are available in selection", async function () {
          this.timeout(300000);
          const magic = new QuickMagic({ name: magus.name, actor: magus }, {});
          const context = await magic._prepareContext();

          const expectedForms = Object.keys(CONFIG.ARM5E.magic.forms);
          const actualForms = Object.keys(context.selection.forms);

          for (const form of expectedForms) {
            assert.include(actualForms, form, `form ${form} should be available`);
          }

          await magic.close();
        });
      });

      // ========== Integration Tests ==========
      describe("Quick* Apps Integration", function () {
        it("Integration.1: all three apps can be opened simultaneously", async function () {
          this.timeout(300000);
          const vitals = new QuickVitals({ name: companion.name, actor: companion }, {});
          const combat = new QuickCombat({ name: companion.name, actor: companion }, {});
          const magic = new QuickMagic({ name: magus.name, actor: magus }, {});

          await vitals.render(true);
          await combat.render(true);
          await magic.render(true);

          assert.ok(vitals.rendered, "vitals should be rendered");
          assert.ok(combat.rendered, "combat should be rendered");
          assert.ok(magic.rendered, "magic should be rendered");

          await new Promise((resolve) => setTimeout(resolve, 1500));

          await vitals.close();
          await combat.close();
          await magic.close();
        });

        it("Integration.2: helper functions create and render apps", async function () {
          this.timeout(300000);

          // Test quickVitals helper
          const vitalsResult = await quickVitals(companion.name, companion);
          assert.property(
            companion.apps,
            Object.keys(companion.apps)[0],
            "vitals app should be created"
          );

          // Test quickCombat helper
          const combatResult = await quickCombat(companion.name, companion);
          assert.isAbove(Object.keys(companion.apps).length, 0, "combat app should be created");

          // Test quickMagic helper
          const magicResult = await quickMagic(magus.name, magus);
          assert.isAbove(Object.keys(magus.apps).length, 0, "magic app should be created");

          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Cleanup
          for (const appId in companion.apps) {
            await companion.apps[appId].close();
          }
          for (const appId in magus.apps) {
            await magus.apps[appId].close();
          }
        });

        it("Integration.3: multiple instances can exist for same actor", async function () {
          this.timeout(300000);
          const vitals1 = new QuickVitals({ name: companion.name, actor: companion }, {});
          const vitals2 = new QuickVitals({ name: companion.name, actor: companion }, {});

          await vitals1.render(true);
          await vitals2.render(true);

          assert.notEqual(
            vitals1.options.uniqueId,
            vitals2.options.uniqueId,
            "app IDs should be different"
          );
          assert.property(
            companion.apps,
            vitals1.options.uniqueId,
            "first app should be registered"
          );
          assert.property(
            companion.apps,
            vitals2.options.uniqueId,
            "second app should be registered"
          );

          await vitals1.close();
          await vitals2.close();
        });

        it("Integration.4: closing one app doesn't affect others", async function () {
          this.timeout(300000);
          const vitals = new QuickVitals({ name: companion.name, actor: companion }, {});
          const combat = new QuickCombat({ name: companion.name, actor: companion }, {});

          await vitals.render(true);
          await combat.render(true);

          await vitals.close();
          assert.ok(combat.rendered, "combat should still be rendered after vitals closed");

          await combat.close();
        });

        it("Integration.5: app state persists across renders", async function () {
          this.timeout(300000);
          const magic = new QuickMagic({ name: magus.name, actor: magus }, {});

          magic.object.technique = "in";
          magic.object.form = "me";

          await magic.render(true);
          const context1 = await magic._prepareContext();

          // Re-render
          await magic.render(false);
          const context2 = await magic._prepareContext();

          assert.equal(context1.technique, context2.technique, "technique should persist");
          assert.equal(context1.form, context2.form, "form should persist");

          await magic.close();
        });

        it("Integration.6: visual render test - all apps displayed together", async function () {
          this.timeout(300000);
          const vitals = new QuickVitals({ name: companion.name, actor: companion }, {});
          const combat = new QuickCombat({ name: companion.name, actor: companion }, {});
          const magic = new QuickMagic({ name: magus.name, actor: magus }, {});

          await vitals.render(true);
          await new Promise((resolve) => setTimeout(resolve, 300));
          await combat.render(true);
          await new Promise((resolve) => setTimeout(resolve, 300));
          await magic.render(true);

          // Display all three for 2 seconds
          await new Promise((resolve) => setTimeout(resolve, 2000));

          await vitals.close();
          await combat.close();
          await magic.close();
        });
      });

      after(async function () {
        // Cleanup
        if (companion) {
          await companion.rest();
          await companion.restoreHealth();
        }
        if (magus) {
          await magus.rest();
          await magus.restoreHealth();
        }

        // Remove tokens from scene
        if (hasScene) {
          if (companionToken) await companionToken.delete();
          if (magusToken) await magusToken.delete();
        }

        // Ensure all apps are closed
        Object.values(ui.windows).forEach((app) => {
          if (
            app instanceof QuickCombat ||
            app instanceof QuickMagic ||
            app instanceof QuickVitals
          ) {
            app.close();
          }
        });
      });
    },
    { displayName: "ARS : Quick Apps (AppV2) testsuite" }
  );
}
