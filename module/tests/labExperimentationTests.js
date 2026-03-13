import { LabExperimentation } from "../apps/labExperimentation.js";
import { getMagus } from "./testData.js";

function buildExperimentationData(options = {}) {
  const {
    experimenter = "Test Experimenter",
    subject = "Test Subject",
    riskModifier = 1,
    aura = 2,
    discovery = false,
    year = 1220,
    season = "spring"
  } = options;

  return {
    experimenter,
    subject,
    riskModifier,
    aura,
    discovery,
    year,
    season
  };
}

function buildMockEvent() {
  return {
    preventDefault: () => {},
    stopPropagation: () => {}
  };
}

export function registerLabExperimentationTesting(quench) {
  quench.registerBatch(
    "Ars-LabExperimentation",
    (context) => {
      const { describe, it, assert, before, after } = context;
      let magus;

      before(async function () {
        this.timeout(300000);
        magus = await getMagus("ExperimentationTester");
      });

      describe("LabExperimentation AppV2", function () {
        this.timeout(300000);

        it("LabExperimentation.1: constructor initializes with defaults", async function () {
          const app = new LabExperimentation();

          assert.property(app.object, "experimenter", "experimenter should be set");
          assert.property(app.object, "subject", "subject should be set");
          assert.property(app.object, "riskModifier", "riskModifier should be set");
          assert.property(app.object, "aura", "aura should be set");
          assert.property(app.object, "discovery", "discovery should be set");
          assert.property(app.object, "year", "year should be set from game settings");
          assert.property(app.object, "season", "season should be set from game settings");
          assert.equal(app.object.reportBody, "", "reportBody should be empty string");

          await app.close();
        });

        it("LabExperimentation.2: constructor accepts and sets provided data", async function () {
          const data = buildExperimentationData({
            experimenter: "Custom Experimenter",
            subject: "Custom Subject",
            riskModifier: 3,
            aura: 5,
            discovery: true,
            year: 1225,
            season: "summer"
          });
          const app = new LabExperimentation(data);

          assert.equal(app.object.experimenter, "Custom Experimenter", "custom experimenter");
          assert.equal(app.object.subject, "Custom Subject", "custom subject");
          assert.equal(app.object.riskModifier, 3, "custom riskModifier");
          assert.equal(app.object.aura, 5, "custom aura");
          assert.equal(app.object.discovery, true, "custom discovery");
          assert.equal(app.object.year, 1225, "custom year");
          assert.equal(app.object.season, "summer", "custom season");

          await app.close();
        });

        it("LabExperimentation.3: constructor fills empty subject with localized default", async function () {
          const data = buildExperimentationData({ subject: "" });
          const app = new LabExperimentation(data);

          assert.notEqual(app.object.subject, "", "subject should not be empty");
          assert.equal(
            app.object.subject,
            game.i18n.localize("arm5e.rolltables.experimentation.subject"),
            "subject should be localized default"
          );

          await app.close();
        });

        it("LabExperimentation.4: _prepareContext returns expected structure", async function () {
          const data = buildExperimentationData({
            experimenter: "Test User",
            subject: "Test Item",
            riskModifier: 2,
            aura: 3,
            discovery: true,
            year: 1222,
            season: "autumn"
          });
          const app = new LabExperimentation(data);

          const ctx = await app._prepareContext();

          assert.property(ctx, "seasons", "seasons should be in context");
          assert.property(ctx, "experimenter", "experimenter should be in context");
          assert.property(ctx, "subject", "subject should be in context");
          assert.property(ctx, "riskModifier", "riskModifier should be in context");
          assert.property(ctx, "aura", "aura should be in context");
          assert.property(ctx, "discovery", "discovery should be in context");
          assert.property(ctx, "year", "year should be in context");
          assert.property(ctx, "season", "season should be in context");
          assert.property(ctx, "reportBody", "reportBody should be in context");

          assert.equal(ctx.experimenter, "Test User", "experimenter context value");
          assert.equal(ctx.subject, "Test Item", "subject context value");
          assert.equal(ctx.riskModifier, 2, "riskModifier context value");
          assert.equal(ctx.aura, 3, "aura context value");
          assert.equal(ctx.discovery, true, "discovery context value");

          await app.close();
        });

        it("LabExperimentation.5: form handler merges submitted data", async function () {
          const data = buildExperimentationData();
          const app = new LabExperimentation(data);

          await LabExperimentation.DEFAULT_OPTIONS.form.handler.call(app, {}, null, {
            object: {
              riskModifier: 5,
              aura: 8,
              subject: "Updated Subject"
            }
          });

          assert.equal(app.object.riskModifier, 5, "riskModifier should be updated");
          assert.equal(app.object.aura, 8, "aura should be updated");
          assert.equal(app.object.subject, "Updated Subject", "subject should be updated");

          await app.close();
        });

        it("LabExperimentation.6: static rollExperimentation delegates to rollForExperimentation", async function () {
          const data = buildExperimentationData();
          const app = new LabExperimentation(data);
          let called = false;

          app.rollForExperimentation = async () => {
            called = true;
          };

          await LabExperimentation.rollExperimentation.call(app, {}, {});
          assert.equal(called, true, "rollForExperimentation should be called");

          await app.close();
        });

        it("LabExperimentation.7: static clearAll delegates to _clearAll", async function () {
          const data = buildExperimentationData();
          const app = new LabExperimentation(data);
          let called = false;

          app._clearAll = async () => {
            called = true;
          };

          await LabExperimentation.clearAll.call(app, {}, {});
          assert.equal(called, true, "_clearAll should be called");

          await app.close();
        });

        it("LabExperimentation.8: static createJournal delegates to _createJournal", async function () {
          const data = buildExperimentationData();
          const app = new LabExperimentation(data);
          let called = false;

          app._createJournal = async () => {
            called = true;
          };

          await LabExperimentation.createJournal.call(app, {}, {});
          assert.equal(called, true, "_createJournal should be called");

          await app.close();
        });

        it("LabExperimentation.9: _clearAll resets reportBody and rerenders", async function () {
          const data = buildExperimentationData();
          const app = new LabExperimentation(data);
          app.object.reportBody = "<p>Some report</p>";

          let rendered = false;
          app.render = () => {
            rendered = true;
          };

          await app._clearAll(buildMockEvent());

          assert.equal(app.object.reportBody, "", "reportBody should be cleared");
          assert.equal(rendered, true, "render should be called");

          await app.close();
        });

        it("LabExperimentation.10: title getter formats correctly", async function () {
          const data = buildExperimentationData({
            subject: "Enchanted Amulet",
            year: 1220,
            season: "spring"
          });
          const app = new LabExperimentation(data);

          const title = app.title;
          assert.include(title, "Enchanted Amulet", "title should include subject");
          assert.include(title, "1220", "title should include year");

          await app.close();
        });

        it("LabExperimentation.11: _getTableResult returns localized text", async function () {
          const data = buildExperimentationData();
          const app = new LabExperimentation(data);

          const shortResult = app._getTableResult("extraordinaryResults", "disaster", true);
          assert.isString(shortResult, "should return string");
          assert.include(shortResult, "<li>", "should contain list item");

          const longResult = app._getTableResult("extraordinaryResults", "disaster", false);
          assert.isString(longResult, "should return string");
          assert.include(longResult, "<li>", "should contain list item");
          assert.include(longResult, ":", "long format should include colon separator");

          await app.close();
        });

        it("LabExperimentation.12: _listDisasters lists disasters based on botches", async function () {
          const data = buildExperimentationData();
          const app = new LabExperimentation(data);

          const noBotches = app._listDisasters(0);
          assert.equal(noBotches, "", "no botches should return empty string");

          const oneBotch = app._listDisasters(1);
          assert.include(oneBotch, "<li>", "one botch should list disaster");

          const threeBotches = app._listDisasters(3);
          const liCount = (threeBotches.match(/<li>/g) || []).length;
          assert.isAtLeast(liCount, 3, "three botches should have multiple disasters listed");

          await app.close();
        });

        it("LabExperimentation.13: renders and closes without error", async function () {
          const data = buildExperimentationData();
          const app = new LabExperimentation(data);
          await app.render(true);

          assert.ok(app.element, "element should exist after render");
          assert.ok(app.rendered, "app should be rendered");

          await app.close();
        });

        it("LabExperimentation.14: _rollOnTableDesc generates correct flavor text", async function () {
          const data = buildExperimentationData();
          const app = new LabExperimentation(data);

          // Mock roll object
          const mockRoll = {
            originalFormula: "5ds + 2",
            desc: "Roll: 15"
          };

          const flavorWithFormula = app._rollOnTableDesc("main", mockRoll, true);
          assert.isString(flavorWithFormula, "should return string");
          assert.include(flavorWithFormula, "<b>", "should contain bold tags");
          assert.include(flavorWithFormula, "5ds + 2", "should include formula");

          const flavorWithoutFormula = app._rollOnTableDesc("main", mockRoll, false);
          assert.isString(flavorWithoutFormula, "should return string");
          assert.include(flavorWithoutFormula, "<b>", "should contain bold tags");
          assert.notInclude(flavorWithoutFormula, "5ds + 2", "should not include formula");

          await app.close();
        });

        it("LabExperimentation.15: _rollForExperimentation returns non-empty report body", async function () {
          this.timeout(300000);
          const data = buildExperimentationData({
            experimenter: magus.uuid,
            riskModifier: 1,
            aura: 2,
            discovery: false
          });
          const app = new LabExperimentation(data);

          const reportBody = await app._rollForExperimentation(1, 2, false);

          assert.isString(reportBody, "should return string report body");
          assert.isNotEmpty(reportBody, "report body should not be empty");
          assert.include(reportBody, "<ul>", "report should contain list elements");
          assert.include(reportBody, "</ul>", "report should close list elements");

          await app.close();
        });

        it("LabExperimentation.16: _rollForExperimentation handles positive risk modifier", async function () {
          this.timeout(300000);
          const data = buildExperimentationData({
            experimenter: magus.uuid,
            riskModifier: 3,
            aura: 1,
            discovery: false
          });
          const app = new LabExperimentation(data);

          const reportBody = await app._rollForExperimentation(3, 1, false);

          assert.isString(reportBody, "should return string");
          assert.isNotEmpty(reportBody, "should generate report body");

          await app.close();
        });

        it("LabExperimentation.17: _rollForExperimentation handles negative risk modifier", async function () {
          this.timeout(300000);
          const data = buildExperimentationData({
            experimenter: magus.uuid,
            riskModifier: -2,
            aura: 3,
            discovery: false
          });
          const app = new LabExperimentation(data);

          const reportBody = await app._rollForExperimentation(-2, 3, false);

          assert.isString(reportBody, "should return string");
          assert.isNotEmpty(reportBody, "should generate report body");

          await app.close();
        });

        it("LabExperimentation.18: _rollForExperimentation handles discovery mode", async function () {
          this.timeout(300000);
          const data = buildExperimentationData({
            experimenter: magus.uuid,
            riskModifier: 1,
            aura: 2,
            discovery: true
          });
          const app = new LabExperimentation(data);

          const reportBody = await app._rollForExperimentation(1, 2, true);

          assert.isString(reportBody, "should return string");
          assert.isNotEmpty(reportBody, "should generate report body");

          await app.close();
        });

        it("LabExperimentation.19: rollForExperimentation updates reportBody and rerenders", async function () {
          this.timeout(300000);
          const data = buildExperimentationData({
            experimenter: magus.uuid,
            subject: "Test Item",
            riskModifier: 1,
            aura: 2,
            discovery: false
          });
          const app = new LabExperimentation(data);

          let rendered = false;
          app.render = () => {
            rendered = true;
          };

          const reportBefore = app.object.reportBody;
          await app.rollForExperimentation(buildMockEvent());

          assert.notEqual(app.object.reportBody, reportBefore, "reportBody should be updated");
          assert.isNotEmpty(app.object.reportBody, "reportBody should contain roll results");
          assert.equal(rendered, true, "render should be called");

          await app.close();
        });

        it("LabExperimentation.20: _rollForExperimentation with zero aura", async function () {
          this.timeout(300000);
          const data = buildExperimentationData({
            experimenter: magus.uuid,
            riskModifier: 1,
            aura: 0,
            discovery: false
          });
          const app = new LabExperimentation(data);

          const reportBody = await app._rollForExperimentation(1, 0, false);

          assert.isString(reportBody, "should return string");
          assert.isNotEmpty(reportBody, "should generate report body even with zero aura");

          await app.close();
        });

        it("LabExperimentation.21: _rollForExperimentation generates proper HTML structure", async function () {
          this.timeout(300000);
          const data = buildExperimentationData({
            experimenter: magus.uuid,
            riskModifier: 1,
            aura: 2,
            discovery: false
          });
          const app = new LabExperimentation(data);

          const reportBody = await app._rollForExperimentation(1, 2, false);

          // Check for basic HTML structure
          assert.include(reportBody, "<li>", "should contain list items");
          assert.include(reportBody, "<ul>", "should contain unordered lists");
          assert.include(reportBody, "</li>", "should close list items");
          assert.include(reportBody, "</ul>", "should close lists");

          // Validate balanced HTML
          const ulCount = (reportBody.match(/<ul>/g) || []).length;
          const ulCloseCount = (reportBody.match(/<\/ul>/g) || []).length;
          assert.equal(ulCount, ulCloseCount, "opening and closing ul tags should match");

          await app.close();
        });
      });

      after(async function () {
        Object.values(ui.windows).forEach((app) => {
          if (app instanceof LabExperimentation) {
            app.close();
          }
        });

        if (magus) {
          await magus.delete();
        }
      });
    },
    { displayName: "ARS : Lab Experimentation (AppV2) testsuite" }
  );
}
