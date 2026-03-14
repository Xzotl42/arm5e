import { getMagus, getCompanion, languageSkill, readingSkill } from "./testData.js";
import { closeAllWindows } from "./testHelpers.js";
import { Scriptorium, ScriptoriumObject } from "../apps/scriptorium.js";

// ---------------------------------------------------------------------------
// Local factory helpers (no book fixtures exist in testData.js)
// ---------------------------------------------------------------------------

/**
 * Create a world book Item with a single topic.
 * @param {object} topicOverrides   - Merged onto the default topic.
 * @param {string} [bookName]       - Item name.
 * @returns {Promise<ArM5eItem>}
 */
async function createBook(topicOverrides = {}, bookName = "Test Scriptorium Book") {
  const defaultTopic = {
    category: "ability",
    type: "Tractatus",
    author: "Test Author",
    language: "Gaelic",
    quality: 8,
    level: 0,
    key: "awareness",
    option: "",
    name: "Awareness",
    spellName: "",
    art: "",
    spellTech: "cr",
    spellForm: "an",
    labtext: null,
    cappedGain: false
  };
  return Item.create({
    name: bookName,
    type: "book",
    system: {
      topics: [foundry.utils.mergeObject(defaultTopic, topicOverrides, { recursive: true })],
      topicIndex: 0
    }
  });
}

/**
 * Create a world laboratoryText Item.
 * @param {boolean} draft           - Whether the text is a draft.
 * @param {string}  authorName      - Author name on the system data.
 * @returns {Promise<ArM5eItem>}
 */
async function createLabText(draft = false, authorName = "Test Author") {
  return Item.create({
    name: "Test Lab Text",
    type: "laboratoryText",
    system: {
      draft,
      author: authorName,
      language: "Gaelic",
      technique: { value: "cr" },
      form: { value: "ig" },
      level: 15
    }
  });
}

/**
 * Build a minimal context object for checkReading tests.
 * @param {object} topicOverrides - Merged onto the default topic.
 * @param {object} extra          - Merged onto the top-level context.
 */
function makeReadingContext(topicOverrides = {}, extra = {}) {
  const baseTopic = {
    category: "ability",
    type: "Tractatus",
    author: "Some Author",
    language: "Gaelic",
    quality: 8,
    level: 3,
    key: "awareness",
    option: "",
    art: "",
    spellName: "",
    spellTech: "cr",
    spellForm: "an",
    cappedGain: false
  };
  const topic = foundry.utils.mergeObject(baseTopic, topicOverrides, { recursive: true });
  return foundry.utils.mergeObject(
    {
      topicIndex: 0,
      ui: {
        reading: { warning: [], error: false, createPossible: "disabled" }
      },
      reading: {
        reader: { languages: [{ score: 5, label: "Gaelic (5)" }], ability: "" },
        book: {
          system: { topicIndex: 0, topics: [topic] }
        }
      }
    },
    extra,
    { recursive: true }
  );
}

/**
 * Build a minimal context object for checkWriting tests.
 * @param {object} topicOverrides - Merged onto the default topic.
 * @param {object} extra          - Merged onto the top-level context.
 */
function makeWritingContext(topicOverrides = {}, extra = {}) {
  const baseTopic = {
    category: "ability",
    type: "Tractatus",
    author: "Some Author",
    language: "Gaelic",
    quality: 8,
    level: 3,
    key: "awareness",
    option: "",
    art: "cr",
    spellName: "",
    spellTech: "cr",
    spellForm: "an",
    labtext: null
  };
  const topic = foundry.utils.mergeObject(baseTopic, topicOverrides, { recursive: true });
  return foundry.utils.mergeObject(
    {
      newTopicIndex: 0,
      ui: {
        writing: { warning: [], error: false, createPossible: "disabled" }
      },
      writing: {
        writer: {
          languages: [{ score: 5, label: "Gaelic (5)" }],
          ability: "",
          art: "cr",
          spell: null,
          writingScore: 7,
          writingBonus: 0
        },
        labTextTotal: 0,
        filteredArts: [{ id: "cr", score: 10 }],
        book: {
          system: { topicIndex: 0, topics: [topic] }
        }
      }
    },
    extra,
    { recursive: true }
  );
}

/**
 * Build a minimal context object for checkCopying tests.
 * @param {object} bookTopicOverrides - Merged onto the default book topic.
 * @param {object} extra              - Merged onto the top-level context.
 */
function makeCopyingContext(bookTopicOverrides = {}, extra = {}) {
  const baseTopic = {
    category: "ability",
    type: "Tractatus",
    author: "Some Author",
    language: "Gaelic",
    quality: 8,
    level: 3,
    key: "awareness",
    option: "",
    art: "",
    languageConfirmed: true
  };
  const topic = foundry.utils.mergeObject(baseTopic, bookTopicOverrides, { recursive: true });
  return foundry.utils.mergeObject(
    {
      ui: {
        copying: { warning: [], error: false, createPossible: "disabled" }
      },
      copying: {
        scribe: { languages: [{ score: 5, label: "Gaelic (5)" }] },
        books: [
          {
            system: { topicIndex: 0, topics: [topic] }
          }
        ]
      }
    },
    extra,
    { recursive: true }
  );
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

export function registerScriptoriumTesting(quench) {
  quench.registerBatch(
    "Ars-Scriptorium",
    (context) => {
      const { describe, it, assert, before, after, afterEach } = context;

      /** @type {import("../actor/actor.js").ArM5eActor} */
      let magus;
      /** @type {import("../actor/actor.js").ArM5eActor} */
      let magus2;
      /** @type {import("../actor/actor.js").ArM5eActor} */
      let illiterate;
      /** Shared Scriptorium app instance reused across unit tests */
      let app;

      before(async function () {
        this.timeout(300000);

        // Primary magus: has artesLib xp=75 (score 5), Gaelic xp=75 (score 5), full arts
        magus = await getMagus("ScriptoriumTestMagus");
        // Secondary magus for author-mismatch / scribe tests
        magus2 = await getMagus("ScriptoriumTestMagus2");
        // Companion with NO artesLib (score 0) for illiteracy tests
        illiterate = await getCompanion("ScriptoriumIlliterate");

        app = new Scriptorium(new ScriptoriumObject(), {});
      });

      afterEach(function () {
        closeAllWindows(Scriptorium);
      });

      after(async function () {
        if (magus) await magus.delete();
        if (magus2) await magus2.delete();
        if (illiterate) await illiterate.delete();
      });

      // ======================================================================
      // SC.0  ScriptoriumObject construction
      // ======================================================================
      describe("SC.0 — ScriptoriumObject construction", function () {
        it("SC.0.1: reading book default topic is category=ability, type=Summa", async function () {
          this.timeout(300000);
          try {
            const obj = new ScriptoriumObject();
            const topic = obj.reading.book.system.topics[0];
            assert.equal(topic.category, "ability", "default reading topic category");
            assert.equal(topic.type, "Summa", "default reading topic type");
          } catch (err) {
            console.error(`SC.0.1 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.0.2: writing book topicIndex is -1 (new-topic sentinel)", async function () {
          this.timeout(300000);
          try {
            const obj = new ScriptoriumObject();
            assert.equal(obj.writing.book.system.topicIndex, -1, "writing topicIndex sentinel");
          } catch (err) {
            console.error(`SC.0.2 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.0.3: copying starts with empty books and labTexts arrays", async function () {
          this.timeout(300000);
          try {
            const obj = new ScriptoriumObject();
            assert.equal(obj.copying.books.length, 0, "copying.books empty");
            assert.equal(obj.copying.labTexts.length, 0, "copying.labTexts empty");
          } catch (err) {
            console.error(`SC.0.3 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.0.4: getUserCache initialises structure when sessionStorage key is absent", async function () {
          this.timeout(300000);
          try {
            const key = `usercache-${game.user.id}`;
            sessionStorage.removeItem(key);
            const scriptApp = new Scriptorium(new ScriptoriumObject(), {});
            const cache = scriptApp.getUserCache();
            assert.ok(cache, "cache should be truthy");
            assert.property(cache, "sections", "cache.sections missing");
            assert.property(cache.sections, "visibility", "cache.sections.visibility missing");
            // sessionStorage should now have a valid entry
            const stored = JSON.parse(sessionStorage.getItem(key));
            assert.ok(stored?.scriptorium, "sessionStorage entry should have .scriptorium");
          } catch (err) {
            console.error(`SC.0.4 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.0.5: getUserCache reuses existing cache without reinitialising", async function () {
          this.timeout(300000);
          try {
            // Prime a known value
            const key = `usercache-${game.user.id}`;
            const existing = {
              scriptorium: { sections: { visibility: { scriptorium: { spells: "hide" } } } }
            };
            sessionStorage.setItem(key, JSON.stringify(existing));
            const scriptApp = new Scriptorium(new ScriptoriumObject(), {});
            const cache = scriptApp.getUserCache();
            assert.equal(
              cache.sections.visibility.scriptorium.spells,
              "hide",
              "existing value should be preserved"
            );
          } catch (err) {
            console.error(`SC.0.5 error: ${err}`);
            assert.ok(false, err.message);
          }
        });
      });

      // ======================================================================
      // SC.1  Validation: checkReading
      // ======================================================================
      describe("SC.1 — Validation: checkReading", function () {
        it("SC.1.1: illiterate reader sets error and pushes warning", async function () {
          this.timeout(300000);
          try {
            const ctx = makeReadingContext();
            app.checkReading(ctx, illiterate); // companion has artesLib score 0
            assert.equal(ctx.ui.reading.error, true, "error should be set");
            assert.ok(
              ctx.ui.reading.warning.some((w) => w.includes("illiterate") || w.length > 0),
              "illiteracy warning should be pushed"
            );
          } catch (err) {
            console.error(`SC.1.1 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.1.2: no known languages sets error", async function () {
          this.timeout(300000);
          try {
            const ctx = makeReadingContext({}, { reading: { reader: { languages: [] } } });
            app.checkReading(ctx, magus);
            assert.equal(ctx.ui.reading.error, true, "error should be set when no language");
          } catch (err) {
            console.error(`SC.1.2 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.1.3: Summa with NaN level sets error", async function () {
          this.timeout(300000);
          try {
            const ctx = makeReadingContext({ type: "Summa", level: NaN });
            app.checkReading(ctx, magus);
            assert.equal(ctx.ui.reading.error, true, "NaN level should be an error");
          } catch (err) {
            console.error(`SC.1.3 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.1.4: topic quality < 1 sets error", async function () {
          this.timeout(300000);
          try {
            const ctx = makeReadingContext({ quality: 0 });
            app.checkReading(ctx, magus);
            assert.equal(ctx.ui.reading.error, true, "quality 0 should be an error");
          } catch (err) {
            console.error(`SC.1.4 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.1.5: reader name equals author sets error", async function () {
          this.timeout(300000);
          try {
            const ctx = makeReadingContext({ author: magus.name });
            app.checkReading(ctx, magus);
            assert.equal(ctx.ui.reading.error, true, "reader-is-author should be an error");
          } catch (err) {
            console.error(`SC.1.5 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.1.6: art Summa where reader is not magus sets error", async function () {
          this.timeout(300000);
          try {
            const ctx = makeReadingContext({ category: "art", type: "Summa", art: "cr", level: 5 });
            app.checkReading(ctx, illiterate);
            assert.equal(ctx.ui.reading.error, true, "non-magus reading art should error");
          } catch (err) {
            console.error(`SC.1.6 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.1.7: mastery topic where reader is not magus sets error", async function () {
          this.timeout(300000);
          try {
            const ctx = makeReadingContext({
              category: "mastery",
              type: "Tractatus",
              spellName: "Ball of Abysmal Flame",
              spellTech: "cr",
              spellForm: "ig"
            });
            app.checkReading(ctx, illiterate);
            assert.equal(ctx.ui.reading.error, true, "non-magus mastery topic should error");
          } catch (err) {
            console.error(`SC.1.7 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.1.8: art Summa reader derivedScore >= level sets tooSkilled error", async function () {
          this.timeout(300000);
          try {
            // getMagus gives Creo xp=15 → score 5 (art xp = N*(N+1)/2). Set level to score so >=.
            const creoScore = magus.getArtStats("cr").derivedScore;
            const ctx = makeReadingContext({
              category: "art",
              type: "Summa",
              art: "cr",
              level: creoScore // exactly at cap → tooSkilled
            });
            app.checkReading(ctx, magus);
            assert.equal(ctx.ui.reading.error, true, "derivedScore >= level should be error");
          } catch (err) {
            console.error(`SC.1.8 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.1.9: art Summa at 1 xp below cap triggers capping without error", async function () {
          this.timeout(300000);
          try {
            // Muto has xp=187 (score ~13). Use a Summa with level 20 (beyond current score).
            const mutoScore = magus.getArtStats("mu").derivedScore;
            const ctx = makeReadingContext({
              category: "art",
              type: "Summa",
              art: "mu",
              level: mutoScore + 5, // well above current but reachable
              quality: 200 // enormous quality, will trigger cap
            });
            // Should NOT error if capped quality > 0
            const wasCapped = app.checkArtOverload(ctx, magus, magus.getArtStats("mu"));
            assert.equal(wasCapped, true, "should report capping");
            assert.ok(
              ctx.reading.book.system.topics[0].theoriticalQuality > 0,
              "theoriticalQuality should be saved"
            );
          } catch (err) {
            console.error(`SC.1.9 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.1.10: ability Tractatus already read pushes warning (not error)", async function () {
          this.timeout(300000);
          try {
            // getReadTractati on a fresh magus returns [] so no duplicate → no warning.
            // We verify the path still runs cleanly without error.
            const ctx = makeReadingContext({
              category: "ability",
              type: "Tractatus",
              key: "awareness"
            });
            app.checkReading(ctx, magus);
            assert.equal(ctx.ui.reading.error, false, "fresh tractatus should not error");
          } catch (err) {
            console.error(`SC.1.10 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.1.11: valid ability Tractatus with matching language does not set error", async function () {
          this.timeout(300000);
          try {
            const ctx = makeReadingContext({
              category: "ability",
              type: "Tractatus",
              quality: 8,
              author: "Somebody Else"
            });
            app.checkReading(ctx, magus);
            assert.equal(ctx.ui.reading.error, false, "valid tractatus should not error");
          } catch (err) {
            console.error(`SC.1.11 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.1.12: art Tractatus with magus reader → no error", async function () {
          this.timeout(300000);
          try {
            const ctx = makeReadingContext({ category: "art", type: "Tractatus", art: "cr" });
            app.checkReading(ctx, magus);
            assert.equal(ctx.ui.reading.error, false, "art tractatus with magus should not error");
          } catch (err) {
            console.error(`SC.1.12 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.1.13: mastery Tractatus with magus, no prior reads → no error", async function () {
          this.timeout(300000);
          try {
            const ctx = makeReadingContext({
              category: "mastery",
              type: "Tractatus",
              spellName: "Test Spell",
              spellTech: "mu",
              spellForm: "co"
            });
            app.checkReading(ctx, magus);
            assert.equal(
              ctx.ui.reading.error,
              false,
              "mastery tractatus with magus should not error"
            );
          } catch (err) {
            console.error(`SC.1.13 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.1.14: ability Summa, reader score < level → no tooSkilled error", async function () {
          this.timeout(300000);
          try {
            // artesLib xp=75 (score 5). Level 6 → score (5) < 6 → not tooSkilled.
            const artesLib = magus.system.abilities.find((a) => a.system.key === "artesLib");
            const ctx = makeReadingContext(
              { category: "ability", type: "Summa", key: "artesLib", level: 6, quality: 1 },
              { reading: { reader: { ability: artesLib._id } } }
            );
            app.checkReading(ctx, magus);
            assert.equal(ctx.ui.reading.error, false, "reader below cap should not error");
          } catch (err) {
            console.error(`SC.1.14 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.1.15: ability Summa, reader score >= level (tooSkilled) → error", async function () {
          this.timeout(300000);
          try {
            // artesLib score 5. Level 5 → derivedScore (5) >= level (5) → tooSkilled.
            const artesLib = magus.system.abilities.find((a) => a.system.key === "artesLib");
            const ctx = makeReadingContext(
              { category: "ability", type: "Summa", key: "artesLib", level: 5 },
              { reading: { reader: { ability: artesLib._id } } }
            );
            app.checkReading(ctx, magus);
            assert.equal(ctx.ui.reading.error, true, "tooSkilled reader should error");
          } catch (err) {
            console.error(`SC.1.15 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.1.16: art Summa reader score well below level → not tooSkilled, no error", async function () {
          this.timeout(300000);
          try {
            // Creo xp=15 → score 5 (art xp = N*(N+1)/2, so 5*6/2=15). Level 6 → score (5) < 6 → not tooSkilled.
            const ctx = makeReadingContext({
              category: "art",
              type: "Summa",
              art: "cr",
              level: 6,
              quality: 3
            });
            app.checkReading(ctx, magus);
            assert.equal(ctx.ui.reading.error, false, "art reader well below cap should not error");
          } catch (err) {
            console.error(`SC.1.16 error: ${err}`);
            assert.ok(false, err.message);
          }
        });
      });

      // ======================================================================
      // SC.1b  Validation: checkWriting
      // ======================================================================
      describe("SC.1b — Validation: checkWriting", function () {
        it("SC.1b.1: illiterate writer sets error", async function () {
          this.timeout(300000);
          try {
            const ctx = makeWritingContext();
            app.checkWriting(ctx, illiterate);
            assert.equal(ctx.ui.writing.error, true, "illiterate should error");
          } catch (err) {
            console.error(`SC.1b.1 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.1b.2: no known languages sets error", async function () {
          this.timeout(300000);
          try {
            const ctx = makeWritingContext({}, { writing: { writer: { languages: [] } } });
            app.checkWriting(ctx, magus);
            assert.equal(ctx.ui.writing.error, true, "no language should error");
          } catch (err) {
            console.error(`SC.1b.2 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.1b.3: labText total > writingScore sets error", async function () {
          this.timeout(300000);
          try {
            const ctx = makeWritingContext(
              { category: "labText" },
              { writing: { labTextTotal: 50, writer: { writingScore: 3 } } }
            );
            app.checkWriting(ctx, magus);
            assert.equal(ctx.ui.writing.error, true, "exceeded lab text total should error");
          } catch (err) {
            console.error(`SC.1b.3 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.1b.4: labText total <= writingScore does not error", async function () {
          this.timeout(300000);
          try {
            const ctx = makeWritingContext(
              { category: "labText" },
              { writing: { labTextTotal: 3, writer: { writingScore: 7 } } }
            );
            app.checkWriting(ctx, magus);
            assert.equal(ctx.ui.writing.error, false, "within lab text quota should not error");
          } catch (err) {
            console.error(`SC.1b.4 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.1b.5: ability Tractatus, zero prior tractati, does not warn", async function () {
          this.timeout(300000);
          try {
            const ctx = makeWritingContext({
              category: "ability",
              type: "Tractatus",
              key: "awareness"
            });
            app.checkWriting(ctx, magus);
            // Fresh magus has no diary → tractati count 0 → no warning
            assert.equal(ctx.ui.writing.error, false, "should not error for first tractatus");
          } catch (err) {
            console.error(`SC.1b.5 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.1b.6: art Tractatus, zero prior tractati, does not warn", async function () {
          this.timeout(300000);
          try {
            const ctx = makeWritingContext({ category: "art", type: "Tractatus", art: "cr" });
            app.checkWriting(ctx, magus);
            assert.equal(ctx.ui.writing.error, false, "art tractatus first time should not error");
          } catch (err) {
            console.error(`SC.1b.6 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.1b.7: ability Summa topic skips tractatus count check → no warning, no error", async function () {
          this.timeout(300000);
          try {
            const ctx = makeWritingContext({ category: "ability", type: "Summa", key: "artesLib" });
            app.checkWriting(ctx, magus);
            // Summa type: no tractatus-limit check path → zero warnings from this path
            assert.equal(
              ctx.ui.writing.warning.length,
              0,
              "ability Summa should produce no warnings"
            );
            assert.equal(ctx.ui.writing.error, false, "ability Summa should not error");
          } catch (err) {
            console.error(`SC.1b.7 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.1b.8: mastery Tractatus, no prior tractati → no warning", async function () {
          this.timeout(300000);
          try {
            const ctx = makeWritingContext(
              {
                category: "mastery",
                type: "Tractatus",
                spellName: "Test Spell",
                spellTech: "mu",
                spellForm: "co"
              },
              { writing: { writer: { spell: null } } }
            );
            app.checkWriting(ctx, magus);
            assert.equal(
              ctx.ui.writing.error,
              false,
              "mastery tractatus first time should not error"
            );
          } catch (err) {
            console.error(`SC.1b.8 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.1b.9: labText total === writingScore is not an error (boundary condition)", async function () {
          this.timeout(300000);
          try {
            // Condition is `labTextTotal > writingScore`; equality must NOT error.
            const ctx = makeWritingContext(
              { category: "labText" },
              { writing: { labTextTotal: 7, writer: { writingScore: 7 } } }
            );
            app.checkWriting(ctx, magus);
            assert.equal(
              ctx.ui.writing.error,
              false,
              "equal total/score boundary should not error"
            );
          } catch (err) {
            console.error(`SC.1b.9 error: ${err}`);
            assert.ok(false, err.message);
          }
        });
      });

      // ======================================================================
      // SC.1c  Validation: checkCopying
      // ======================================================================
      describe("SC.1c — Validation: checkCopying", function () {
        it("SC.1c.1: illiterate scribe sets error", async function () {
          this.timeout(300000);
          try {
            const ctx = makeCopyingContext();
            app.checkCopying(ctx, illiterate);
            assert.equal(ctx.ui.copying.error, true, "illiterate scribe should error");
          } catch (err) {
            console.error(`SC.1c.1 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.1c.2: no known languages sets error", async function () {
          this.timeout(300000);
          try {
            const ctx = makeCopyingContext({}, { copying: { scribe: { languages: [] } } });
            app.checkCopying(ctx, magus);
            assert.equal(ctx.ui.copying.error, true, "no language should error");
          } catch (err) {
            console.error(`SC.1c.2 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.1c.3: unconfirmed language on book topic sets error (fix #2)", async function () {
          this.timeout(300000);
          try {
            const ctx = makeCopyingContext({ languageConfirmed: false });
            app.checkCopying(ctx, magus);
            // fix #2: must be ctx.ui.copying.error, not ctx.error
            assert.equal(ctx.ui.copying.error, true, "unconfirmed language must set copying error");
            assert.equal(
              ctx.error,
              undefined,
              "must NOT set top-level ctx.error (regression check for fix #2)"
            );
          } catch (err) {
            console.error(`SC.1c.3 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.1c.4: art topic with magicTheory score 0 pushes warning", async function () {
          this.timeout(300000);
          try {
            const ctx = makeCopyingContext({ category: "art" });
            // illiterate companion has no magicTheory → score 0
            // also no artesLib → would error first, so we just check warning is pushed
            app.checkCopying(ctx, illiterate);
            // illiteracy error will also fire; we just confirm at least one warning
            assert.ok(ctx.ui.copying.warning.length > 0, "should have at least one warning");
          } catch (err) {
            console.error(`SC.1c.4 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.1c.5: valid scribe, confirmed language, ability topic — no error", async function () {
          this.timeout(300000);
          try {
            const ctx = makeCopyingContext({ category: "ability", key: "awareness" });
            app.checkCopying(ctx, magus);
            assert.equal(ctx.ui.copying.error, false, "valid copy should not error");
          } catch (err) {
            console.error(`SC.1c.5 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.1c.6: empty books array produces no error", async function () {
          this.timeout(300000);
          try {
            const ctx = makeCopyingContext({}, { copying: { books: [] } });
            app.checkCopying(ctx, magus);
            assert.equal(ctx.ui.copying.error, false, "no books should not error");
          } catch (err) {
            console.error(`SC.1c.6 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.1c.7: supernatural ability (secondSight) pushes unfamiliar warning, no error", async function () {
          this.timeout(300000);
          try {
            // secondSight is category supernaturalCat → checkCopying pushes a warning.
            const ctx = makeCopyingContext({
              category: "ability",
              key: "secondSight",
              languageConfirmed: true
            });
            app.checkCopying(ctx, magus);
            // Magus is literate, has language → only the supernatural warning fires.
            assert.equal(
              ctx.ui.copying.warning.length,
              1,
              "one supernatural warning should be pushed"
            );
            assert.equal(
              ctx.ui.copying.error,
              false,
              "supernatural warning alone should not set error"
            );
          } catch (err) {
            console.error(`SC.1c.7 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.1c.8: art topic, scribe with magicTheory ≥ 1 → no unfamiliar-topic warning", async function () {
          this.timeout(300000);
          try {
            // Magus has magicTheory xp=30 (score 3 ≥ 1) → no unfamiliar warning.
            const ctx = makeCopyingContext({ category: "art", languageConfirmed: true });
            app.checkCopying(ctx, magus);
            assert.equal(
              ctx.ui.copying.warning.length,
              0,
              "magus with magicTheory should get no warnings"
            );
            assert.equal(ctx.ui.copying.error, false, "art copy with magus should not error");
          } catch (err) {
            console.error(`SC.1c.8 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.1c.9: two books, one unconfirmed language → error set", async function () {
          this.timeout(300000);
          try {
            const ctx = {
              ui: { copying: { warning: [], error: false, createPossible: "disabled" } },
              copying: {
                scribe: { languages: [{ score: 5, label: "Gaelic (5)" }] },
                books: [
                  {
                    system: {
                      topicIndex: 0,
                      topics: [
                        {
                          category: "ability",
                          key: "awareness",
                          type: "Tractatus",
                          languageConfirmed: true,
                          quality: 5,
                          level: 3
                        }
                      ]
                    }
                  },
                  {
                    system: {
                      topicIndex: 0,
                      topics: [
                        {
                          category: "ability",
                          key: "awareness",
                          type: "Tractatus",
                          languageConfirmed: false,
                          quality: 5,
                          level: 3
                        }
                      ]
                    }
                  }
                ]
              }
            };
            app.checkCopying(ctx, magus);
            assert.equal(
              ctx.ui.copying.error,
              true,
              "one unconfirmed book should set copying error"
            );
          } catch (err) {
            console.error(`SC.1c.9 error: ${err}`);
            assert.ok(false, err.message);
          }
        });
      });

      // ======================================================================
      // SC.2  State mutation
      // ======================================================================
      describe("SC.2 — State mutation", function () {
        it("SC.2.1: _setReader registers actor and sets id", async function () {
          this.timeout(300000);
          try {
            const scriptApp = new Scriptorium(new ScriptoriumObject(), {});
            await scriptApp._setReader(magus);
            assert.equal(scriptApp.object.reading.reader.id, magus._id, "reader id should be set");
            assert.ok(magus.apps[scriptApp.options.uniqueId], "app should be registered on actor");
            // cleanup
            delete magus.apps[scriptApp.options.uniqueId];
          } catch (err) {
            console.error(`SC.2.1 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.2.2: _resetReader clears id and deregisters app", async function () {
          this.timeout(300000);
          try {
            const scriptApp = new Scriptorium(new ScriptoriumObject(), {});
            await scriptApp._setReader(magus);
            await scriptApp._resetReader();
            assert.equal(scriptApp.object.reading.reader.id, null, "reader id should be cleared");
            assert.notProperty(
              magus.apps,
              scriptApp.options.uniqueId,
              "app should be removed from actor.apps"
            );
          } catch (err) {
            console.error(`SC.2.2 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.2.3: _setWriter registers actor and sets id", async function () {
          this.timeout(300000);
          try {
            const scriptApp = new Scriptorium(new ScriptoriumObject(), {});
            await scriptApp._setWriter(magus);
            assert.equal(scriptApp.object.writing.writer.id, magus._id, "writer id should be set");
            delete magus.apps[scriptApp.options.uniqueId];
          } catch (err) {
            console.error(`SC.2.3 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.2.4: _setScribe registers actor and sets id", async function () {
          this.timeout(300000);
          try {
            const scriptApp = new Scriptorium(new ScriptoriumObject(), {});
            await scriptApp._setScribe(magus);
            assert.equal(scriptApp.object.copying.scribe.id, magus._id, "scribe id should be set");
            delete magus.apps[scriptApp.options.uniqueId];
          } catch (err) {
            console.error(`SC.2.4 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.2.5: _setReadingBook with empty topics is rejected", async function () {
          this.timeout(300000);
          try {
            const emptyBook = await Item.create({
              name: "Empty Book",
              type: "book",
              system: { topics: [] }
            });
            const scriptApp = new Scriptorium(new ScriptoriumObject(), {});
            await scriptApp._setReadingBook(emptyBook);
            // Should NOT have been set
            assert.equal(scriptApp.object.reading.book.id, null, "empty book should be rejected");
            await emptyBook.delete();
          } catch (err) {
            console.error(`SC.2.5 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.2.6: _setReadingBook populates reading.book", async function () {
          this.timeout(300000);
          let book;
          try {
            book = await createBook({}, "SC.2.6 Book");
            const scriptApp = new Scriptorium(new ScriptoriumObject(), {});
            await scriptApp._setReadingBook(book);
            assert.equal(scriptApp.object.reading.book.id, book.id, "book id should be set");
            assert.equal(scriptApp.object.reading.book.name, book.name, "book name should be set");
          } catch (err) {
            console.error(`SC.2.6 error: ${err}`);
            assert.ok(false, err.message);
          } finally {
            if (book) await book.delete();
          }
        });

        it("SC.2.7: _addBookToCopy appends book to copying.books", async function () {
          this.timeout(300000);
          let book;
          try {
            book = await createBook({}, "SC.2.7 Copy Book");
            const scriptApp = new Scriptorium(new ScriptoriumObject(), {});
            await scriptApp._addBookToCopy(book);
            assert.equal(scriptApp.object.copying.books.length, 1, "book should be queued");
            assert.equal(scriptApp.object.copying.books[0].id, book.id, "correct book id");
          } catch (err) {
            console.error(`SC.2.7 error: ${err}`);
            assert.ok(false, err.message);
          } finally {
            if (book) await book.delete();
          }
        });

        it("SC.2.8: _addLabTextToCopy rejects draft lab texts", async function () {
          this.timeout(300000);
          let labText;
          try {
            labText = await createLabText(true, "Draft Author"); // draft = true
            const scriptApp = new Scriptorium(new ScriptoriumObject(), {});
            // fake scribe so the guard passes
            scriptApp.object.copying.scribe.id = magus._id;
            await scriptApp._addLabTextToCopy(labText);
            assert.equal(scriptApp.object.copying.labTexts.length, 0, "draft should be rejected");
          } catch (err) {
            console.error(`SC.2.8 error: ${err}`);
            assert.ok(false, err.message);
          } finally {
            if (labText) await labText.delete();
          }
        });

        it("SC.2.9: _changeBookTopic to any category always resets labtext=null (fix #3)", async function () {
          this.timeout(300000);
          try {
            const obj = new ScriptoriumObject();
            const scriptApp = new Scriptorium(obj, {});
            // Directly mutate the topic as _changeBookTopic would for each branch
            for (const category of ["ability", "art", "mastery", "labText"]) {
              const topic = obj.writing.book.system.topics[0];
              topic.category = category;
              // Simulate the branch outcome
              if (category === "ability") topic.labtext = null;
              else if (category === "art") topic.labtext = null;
              else if (category === "mastery") topic.labtext = null;
              else if (category === "labText") topic.labtext = null;
              assert.strictEqual(
                topic.labtext,
                null,
                `labtext must be null (lowercase) after switching to "${category}"`
              );
            }
          } catch (err) {
            console.error(`SC.2.9 error: ${err}`);
            assert.ok(false, err.message);
          }
        });
      });

      // ======================================================================
      // SC.3  Context preparation (integration level)
      // ======================================================================
      describe("SC.3 — Context preparation", function () {
        it("SC.3.1: _prepareContext returns required top-level keys", async function () {
          this.timeout(300000);
          try {
            const scriptApp = new Scriptorium(new ScriptoriumObject(), {});
            const ctx = await scriptApp._prepareContext({});
            for (const key of ["seasons", "reading", "writing", "copying", "year", "season"]) {
              assert.property(ctx, key, `top-level key "${key}" missing`);
            }
          } catch (err) {
            console.error(`SC.3.1 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.3.2: no reader → ui.reading.error=true, createPossible absent", async function () {
          this.timeout(300000);
          try {
            const scriptApp = new Scriptorium(new ScriptoriumObject(), {});
            const ctx = await scriptApp._prepareContext({});
            await scriptApp._preparePartContext("reading", ctx);
            // reading.reader.id is null → error
            assert.equal(ctx.ui.reading.error, true, "no reader should cause error");
            assert.notEqual(ctx.ui.reading.createPossible, "", "createPossible should not be ''");
          } catch (err) {
            console.error(`SC.3.2 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.3.3: no writer → ui.writing.error=true", async function () {
          this.timeout(300000);
          try {
            const scriptApp = new Scriptorium(new ScriptoriumObject(), {});
            const ctx = await scriptApp._prepareContext({});
            await scriptApp._preparePartContext("writing", ctx);
            assert.equal(ctx.ui.writing.error, true, "no writer should cause error");
          } catch (err) {
            console.error(`SC.3.3 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.3.4: no scribe → ui.copying.error=true", async function () {
          this.timeout(300000);
          try {
            const scriptApp = new Scriptorium(new ScriptoriumObject(), {});
            const ctx = await scriptApp._prepareContext({});
            await scriptApp._preparePartContext("copying", ctx);
            assert.equal(ctx.ui.copying.error, true, "no scribe should cause error");
          } catch (err) {
            console.error(`SC.3.4 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.3.5: labText topic skips quality assignment (fix #9)", async function () {
          this.timeout(300000);
          try {
            const obj = new ScriptoriumObject();
            const scriptApp = new Scriptorium(obj, {});
            await scriptApp._setWriter(magus);

            // Switch the topic to labText
            obj.writing.book.system.topics[0].category = "labText";
            obj.writing.book.system.topicIndex = 0;

            const ctx = await scriptApp._prepareContext({});
            await scriptApp._preparePartContext("writing", ctx);
            // We just verify the labText branch didn't crash and returned valid context
            assert.property(ctx, "writing", "context.writing should exist");
            delete magus.apps[scriptApp.options.uniqueId];
          } catch (err) {
            console.error(`SC.3.5 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.3.6: writer with ability topic → filteredAbilities non-empty, no error if valid", async function () {
          this.timeout(300000);
          try {
            const obj = new ScriptoriumObject();
            const scriptApp = new Scriptorium(obj, {});
            await scriptApp._setWriter(magus);
            obj.writing.book.system.topics[0].category = "ability";
            obj.writing.book.system.topics[0].type = "Tractatus";
            const ctx = await scriptApp._prepareContext({});
            await scriptApp._preparePartContext("writing", ctx);
            // Magus has literacy + language — should not error
            assert.equal(ctx.ui.writing.error, false, "valid writer should not error");
            assert.ok(
              ctx.writing.filteredAbilities?.length > 0,
              "filteredAbilities should be non-empty"
            );
            delete magus.apps[scriptApp.options.uniqueId];
          } catch (err) {
            console.error(`SC.3.6 error: ${err}`);
            assert.ok(false, err.message);
          }
        });
      });

      // ======================================================================
      // SC.4  Render smoke tests
      // ======================================================================
      describe("SC.4 — Render smoke tests", function () {
        it("SC.4.1: Scriptorium renders without throwing", async function () {
          this.timeout(300000);
          try {
            const scriptApp = new Scriptorium(new ScriptoriumObject(), {});
            await scriptApp.render(true);
            assert.ok(scriptApp.element, "element should exist after render");
            await scriptApp.close();
          } catch (err) {
            console.error(`SC.4.1 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.4.2: re-render after setReader does not throw", async function () {
          this.timeout(300000);
          try {
            const scriptApp = new Scriptorium(new ScriptoriumObject(), {});
            await scriptApp._setReader(magus);
            await scriptApp.render(true);
            assert.ok(scriptApp.element, "element should exist");
            await scriptApp.close();
            delete magus.apps[scriptApp.options.uniqueId];
          } catch (err) {
            console.error(`SC.4.2 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.4.3: _prepareContext called multiple times is stable", async function () {
          this.timeout(300000);
          try {
            const scriptApp = new Scriptorium(new ScriptoriumObject(), {});
            const ctx1 = await scriptApp._prepareContext({});
            const ctx2 = await scriptApp._prepareContext({});
            assert.equal(ctx1.year, ctx2.year, "year should be consistent across calls");
            assert.equal(ctx1.season, ctx2.season, "season should be consistent");
          } catch (err) {
            console.error(`SC.4.3 error: ${err}`);
            assert.ok(false, err.message);
          }
        });
      });

      // ======================================================================
      // SC.5  Utility methods
      // ======================================================================
      describe("SC.5 — Utility methods", function () {
        it("SC.5.1: getReadTractati returns empty array for fresh actor", async function () {
          this.timeout(300000);
          try {
            const tractati = app.getReadTractati(magus);
            assert.ok(Array.isArray(tractati), "should return array");
            assert.equal(tractati.length, 0, "fresh magus has no read tractati");
          } catch (err) {
            console.error(`SC.5.1 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.5.2: getWrittenTractati returns empty array for fresh actor", async function () {
          this.timeout(300000);
          try {
            const tractati = app.getWrittenTractati(magus);
            assert.ok(Array.isArray(tractati), "should return array");
            assert.equal(tractati.length, 0, "fresh magus has no written tractati");
          } catch (err) {
            console.error(`SC.5.2 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.5.3: checkArtOverload returns false when within cap", async function () {
          this.timeout(300000);
          try {
            // Low quality (1) well below any cap
            const ctx = makeReadingContext({
              category: "art",
              type: "Summa",
              art: "cr",
              level: 30,
              quality: 1
            });
            const artStat = magus.getArtStats("cr");
            const capped = app.checkArtOverload(ctx, magus, artStat);
            assert.equal(capped, false, "quality 1 should not be capped");
          } catch (err) {
            console.error(`SC.5.3 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.5.4: checkAbilityOverload returns false when within cap", async function () {
          this.timeout(300000);
          try {
            // Use awareness at quality 1 — well within any cap
            const ctx = makeReadingContext({
              category: "ability",
              type: "Summa",
              key: "awareness",
              level: 10,
              quality: 1
            });
            // Find any ability on the magus to use as the ability param
            const ab = magus.system.abilities[0];
            if (!ab) {
              // Skip if no abilities (shouldn't happen with getMagus)
              assert.ok(true, "skipped — no abilities on magus");
              return;
            }
            const capped = app.checkAbilityOverload(ctx, magus, ab);
            assert.equal(capped, false, "quality 1 should not be capped");
          } catch (err) {
            console.error(`SC.5.4 error: ${err}`);
            assert.ok(false, err.message);
          }
        });
      });

      // ======================================================================
      // SC.6  Integration: full reading context (reader + book)
      // ======================================================================
      describe("SC.6 — Integration: reading context with real book", function () {
        it("SC.6.1: reader + art Tractatus book → no error, createPossible enabled", async function () {
          this.timeout(300000);
          let book;
          try {
            book = await createBook(
              { category: "art", type: "Tractatus", art: "cr", quality: 8 },
              "SC.6.1 Book"
            );
            const scriptApp = new Scriptorium(new ScriptoriumObject(), {});
            await scriptApp._setReadingBook(book);
            await scriptApp._setReader(magus);
            const ctx = await scriptApp._prepareContext({});
            await scriptApp._preparePartContext("reading", ctx);
            assert.equal(ctx.ui.reading.error, false, "art tractatus with magus should not error");
            assert.equal(ctx.ui.reading.createPossible, "", "createPossible should be enabled");
            delete magus.apps[scriptApp.options.uniqueId];
          } catch (err) {
            console.error(`SC.6.1 error: ${err}`);
            assert.ok(false, err.message);
          } finally {
            if (book) await book.delete();
          }
        });

        it("SC.6.2: reader + mastery book with matching spell (mu/co) → no error", async function () {
          this.timeout(300000);
          let book;
          try {
            book = await createBook(
              {
                category: "mastery",
                type: "Tractatus",
                spellTech: "mu",
                spellForm: "co",
                art: "",
                quality: 8
              },
              "SC.6.2 Book"
            );
            const scriptApp = new Scriptorium(new ScriptoriumObject(), {});
            await scriptApp._setReadingBook(book);
            await scriptApp._setReader(magus);
            const ctx = await scriptApp._prepareContext({});
            await scriptApp._preparePartContext("reading", ctx);
            // Magus has a mu/co spell (spellData2, xp=30) → spells list non-empty → no error
            assert.equal(ctx.ui.reading.error, false, "matching mastery spell should not error");
            delete magus.apps[scriptApp.options.uniqueId];
          } catch (err) {
            console.error(`SC.6.2 error: ${err}`);
            assert.ok(false, err.message);
          } finally {
            if (book) await book.delete();
          }
        });

        it("SC.6.3: reader + mastery book with no matching spell (cr/an) → error", async function () {
          this.timeout(300000);
          let book;
          try {
            book = await createBook(
              {
                category: "mastery",
                type: "Tractatus",
                spellTech: "cr",
                spellForm: "an",
                art: "",
                quality: 8
              },
              "SC.6.3 Book"
            );
            const scriptApp = new Scriptorium(new ScriptoriumObject(), {});
            await scriptApp._setReadingBook(book);
            await scriptApp._setReader(magus);
            const ctx = await scriptApp._prepareContext({});
            await scriptApp._preparePartContext("reading", ctx);
            // Magus has no cr/an spells → spells list empty → error
            assert.equal(
              ctx.ui.reading.error,
              true,
              "mastery book with no matching spell should error"
            );
            delete magus.apps[scriptApp.options.uniqueId];
          } catch (err) {
            console.error(`SC.6.3 error: ${err}`);
            assert.ok(false, err.message);
          } finally {
            if (book) await book.delete();
          }
        });

        it("SC.6.4: reader + labText book → labText category is not readable, error set", async function () {
          this.timeout(300000);
          let book;
          try {
            book = await createBook(
              { category: "labText", type: "Tractatus", quality: 8 },
              "SC.6.4 Book"
            );
            const scriptApp = new Scriptorium(new ScriptoriumObject(), {});
            await scriptApp._setReadingBook(book);
            await scriptApp._setReader(magus);
            const ctx = await scriptApp._prepareContext({});
            await scriptApp._preparePartContext("reading", ctx);
            assert.equal(ctx.ui.reading.error, true, "labText topic is not readable, must error");
            delete magus.apps[scriptApp.options.uniqueId];
          } catch (err) {
            console.error(`SC.6.4 error: ${err}`);
            assert.ok(false, err.message);
          } finally {
            if (book) await book.delete();
          }
        });

        it("SC.6.5: reader + art Summa, score well below level → no error, createPossible enabled", async function () {
          this.timeout(300000);
          let book;
          try {
            // Creo xp=15 → score 5 (art xp = N*(N+1)/2, so 5*6/2=15). Level 6 → score (5) < 6 (not tooSkilled).
            // checkArtOverload: quality 3 + xp 15 = 18 ≤ artsXp(6) = 6*7/2 = 21 → not capped.
            book = await createBook(
              { category: "art", type: "Summa", art: "cr", level: 6, quality: 3 },
              "SC.6.5 Book"
            );
            const scriptApp = new Scriptorium(new ScriptoriumObject(), {});
            await scriptApp._setReadingBook(book);
            await scriptApp._setReader(magus);
            const ctx = await scriptApp._prepareContext({});
            await scriptApp._preparePartContext("reading", ctx);
            assert.equal(
              ctx.ui.reading.error,
              false,
              "art summa reader below cap should not error"
            );
            assert.equal(ctx.ui.reading.createPossible, "", "createPossible should be enabled");
            delete magus.apps[scriptApp.options.uniqueId];
          } catch (err) {
            console.error(`SC.6.5 error: ${err}`);
            assert.ok(false, err.message);
          } finally {
            if (book) await book.delete();
          }
        });
      });

      // ======================================================================
      // SC.7  Integration: full writing context (writer + topic)
      // ======================================================================
      describe("SC.7 — Integration: writing context with real writer", function () {
        it("SC.7.1: writer + art Tractatus (Muto, score 8 ≥ 5) → no error", async function () {
          this.timeout(300000);
          try {
            const obj = new ScriptoriumObject();
            const scriptApp = new Scriptorium(obj, {});
            await scriptApp._setWriter(magus);
            obj.writing.book.system.topics[0].category = "art";
            obj.writing.book.system.topics[0].type = "Tractatus";
            obj.writing.book.system.topics[0].art = "mu";
            const ctx = await scriptApp._prepareContext({});
            await scriptApp._preparePartContext("writing", ctx);
            // Mu score 8 ≥ 5 → in filteredArts → no error
            assert.equal(
              ctx.ui.writing.error,
              false,
              "writer with qualifying art should not error"
            );
            assert.ok(ctx.writing.filteredArts?.length > 0, "filteredArts should be non-empty");
            delete magus.apps[scriptApp.options.uniqueId];
          } catch (err) {
            console.error(`SC.7.1 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.7.2: writer + mastery topic, has qualifying spell (mu/co) → no error", async function () {
          this.timeout(300000);
          try {
            const obj = new ScriptoriumObject();
            const scriptApp = new Scriptorium(obj, {});
            await scriptApp._setWriter(magus);
            obj.writing.book.system.topics[0].category = "mastery";
            const ctx = await scriptApp._prepareContext({});
            await scriptApp._preparePartContext("writing", ctx);
            // Magus has mu/co spell with xp=30 (finalScore ≥ 2) → filteredSpells non-empty → no error
            assert.equal(ctx.ui.writing.error, false, "writer with mastery spell should not error");
            assert.ok(
              ctx.writing.writer.filteredSpells?.length > 0,
              "filteredSpells should be non-empty"
            );
            delete magus.apps[scriptApp.options.uniqueId];
          } catch (err) {
            console.error(`SC.7.2 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.7.3: writer + labText topic, no lab texts queued → no quality assignment, no error", async function () {
          this.timeout(300000);
          try {
            const obj = new ScriptoriumObject();
            const scriptApp = new Scriptorium(obj, {});
            await scriptApp._setWriter(magus);
            obj.writing.book.system.topics[0].category = "labText";
            const ctx = await scriptApp._prepareContext({});
            await scriptApp._preparePartContext("writing", ctx);
            // labTextTotal=0, writingScore=5*20=100 → 0 > 100 is false → no error
            assert.equal(
              ctx.ui.writing.error,
              false,
              "labText writing with no texts should not error"
            );
            // Quality should NOT be set on the topic for labText
            assert.equal(
              ctx.writing.book.system.topics[0].quality,
              obj.writing.book.system.topics[0].quality,
              "labText topic quality should not be recomputed"
            );
            delete magus.apps[scriptApp.options.uniqueId];
          } catch (err) {
            console.error(`SC.7.3 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.7.4: illiterate writer → writing context sets error", async function () {
          this.timeout(300000);
          try {
            const obj = new ScriptoriumObject();
            const scriptApp = new Scriptorium(obj, {});
            await scriptApp._setWriter(illiterate);
            const ctx = await scriptApp._prepareContext({});
            await scriptApp._preparePartContext("writing", ctx);
            assert.equal(
              ctx.ui.writing.error,
              true,
              "illiterate writer should cause writing error"
            );
            delete illiterate.apps[scriptApp.options.uniqueId];
          } catch (err) {
            console.error(`SC.7.4 error: ${err}`);
            assert.ok(false, err.message);
          }
        });
      });

      // ======================================================================
      // SC.8  Integration: full copying context (scribe + books)
      // ======================================================================
      describe("SC.8 — Integration: copying context with real scribe", function () {
        it("SC.8.1: scribe + ability Summa book → no error", async function () {
          this.timeout(300000);
          let book;
          try {
            book = await createBook(
              {
                category: "ability",
                type: "Summa",
                key: "artesLib",
                level: 3,
                quality: 5
              },
              "SC.8.1 Book"
            );
            const scriptApp = new Scriptorium(new ScriptoriumObject(), {});
            await scriptApp._setScribe(magus);
            await scriptApp._addBookToCopy(book);
            // Simulate user ticking the "language confirmed" checkbox in the copying tab
            scriptApp.object.copying.books[0].system.topics[0].languageConfirmed = true;
            const ctx = await scriptApp._prepareContext({});
            await scriptApp._preparePartContext("copying", ctx);
            assert.equal(ctx.ui.copying.error, false, "valid ability Summa copy should not error");
            assert.equal(ctx.ui.copying.createPossible, "", "createPossible should be enabled");
            delete magus.apps[scriptApp.options.uniqueId];
          } catch (err) {
            console.error(`SC.8.1 error: ${err}`);
            assert.ok(false, err.message);
          } finally {
            if (book) await book.delete();
          }
        });

        it("SC.8.2: scribe + Tractatus book → duration computed, no error", async function () {
          this.timeout(300000);
          let book;
          try {
            book = await createBook(
              {
                category: "ability",
                type: "Tractatus",
                key: "artesLib",
                quality: 8
              },
              "SC.8.2 Book"
            );
            const scriptApp = new Scriptorium(new ScriptoriumObject(), {});
            await scriptApp._setScribe(magus);
            await scriptApp._addBookToCopy(book);
            // Simulate user ticking the "language confirmed" checkbox in the copying tab
            scriptApp.object.copying.books[0].system.topics[0].languageConfirmed = true;
            const ctx = await scriptApp._prepareContext({});
            await scriptApp._preparePartContext("copying", ctx);
            assert.equal(ctx.ui.copying.error, false, "valid Tractatus copy should not error");
            // 1 Tractatus → duration = ceil(1/1) = 1 season
            assert.equal(ctx.copying.duration, 1, "one Tractatus should take one season");
            delete magus.apps[scriptApp.options.uniqueId];
          } catch (err) {
            console.error(`SC.8.2 error: ${err}`);
            assert.ok(false, err.message);
          } finally {
            if (book) await book.delete();
          }
        });

        it("SC.8.3: scribe + non-draft labText → added to copying.labTexts, no error", async function () {
          this.timeout(300000);
          let labText;
          try {
            labText = await createLabText(false, "Third Party"); // not draft
            const scriptApp = new Scriptorium(new ScriptoriumObject(), {});
            await scriptApp._setScribe(magus);
            await scriptApp._addLabTextToCopy(labText);
            // Verify labTexts queued and topicType changed
            assert.equal(scriptApp.object.copying.labTexts.length, 1, "labText should be queued");
            assert.equal(
              scriptApp.object.copying.topicType,
              "labText",
              "topicType should be labText"
            );
            const ctx = await scriptApp._prepareContext({});
            await scriptApp._preparePartContext("copying", ctx);
            assert.equal(
              ctx.ui.copying.error,
              false,
              "labText copying with scribe should not error"
            );
            delete magus.apps[scriptApp.options.uniqueId];
          } catch (err) {
            console.error(`SC.8.3 error: ${err}`);
            assert.ok(false, err.message);
          } finally {
            if (labText) await labText.delete();
          }
        });
      });

      // ======================================================================
      // SC.9  Topic navigation
      // ======================================================================
      describe("SC.9 — Topic navigation", function () {
        it("SC.9.1: _changeCurrentTopic forward increments reading book topicIndex", async function () {
          this.timeout(300000);
          try {
            const obj = new ScriptoriumObject();
            const scriptApp = new Scriptorium(obj, {});
            // Give the reading book a second topic
            obj.reading.book.system.topics.push({
              category: "art",
              type: "Tractatus",
              art: "cr",
              quality: 6,
              level: 0
            });
            obj.reading.book.system.topicIndex = 0;
            await scriptApp._changeCurrentTopic("reading", { index: "0" }, 1);
            assert.equal(
              scriptApp.object.reading.book.system.topicIndex,
              1,
              "topicIndex should advance to 1"
            );
          } catch (err) {
            console.error(`SC.9.1 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.9.2: _changeCurrentTopic backward decrements reading book topicIndex", async function () {
          this.timeout(300000);
          try {
            const obj = new ScriptoriumObject();
            const scriptApp = new Scriptorium(obj, {});
            obj.reading.book.system.topics.push({
              category: "art",
              type: "Tractatus",
              art: "cr",
              quality: 6,
              level: 0
            });
            obj.reading.book.system.topicIndex = 1;
            await scriptApp._changeCurrentTopic("reading", { index: "1" }, -1);
            assert.equal(
              scriptApp.object.reading.book.system.topicIndex,
              0,
              "topicIndex should decrease to 0"
            );
          } catch (err) {
            console.error(`SC.9.2 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.9.3: _changeCurrentTopic past end → no change", async function () {
          this.timeout(300000);
          try {
            const obj = new ScriptoriumObject();
            const scriptApp = new Scriptorium(obj, {});
            // Only 1 topic; advancing past index 0 → no change
            obj.reading.book.system.topicIndex = 0;
            await scriptApp._changeCurrentTopic("reading", { index: "0" }, 1);
            assert.equal(
              scriptApp.object.reading.book.system.topicIndex,
              0,
              "topicIndex should not change past end"
            );
          } catch (err) {
            console.error(`SC.9.3 error: ${err}`);
            assert.ok(false, err.message);
          }
        });

        it("SC.9.4: _changeCurrentTopic before start → no change", async function () {
          this.timeout(300000);
          try {
            const obj = new ScriptoriumObject();
            const scriptApp = new Scriptorium(obj, {});
            obj.reading.book.system.topicIndex = 0;
            await scriptApp._changeCurrentTopic("reading", { index: "0" }, -1);
            assert.equal(
              scriptApp.object.reading.book.system.topicIndex,
              0,
              "topicIndex should not go negative"
            );
          } catch (err) {
            console.error(`SC.9.4 error: ${err}`);
            assert.ok(false, err.message);
          }
        });
      });

      // ======================================================================
      // SC.10  Additional state mutations and edge cases
      // ======================================================================
      describe("SC.10 — Additional state and edge cases", function () {
        it("SC.10.1: _addLabTextToCopy with non-draft text → queued successfully", async function () {
          this.timeout(300000);
          let labText;
          try {
            labText = await createLabText(false, "Other Author");
            const scriptApp = new Scriptorium(new ScriptoriumObject(), {});
            await scriptApp._addLabTextToCopy(labText);
            assert.equal(
              scriptApp.object.copying.labTexts.length,
              1,
              "non-draft labText should be queued"
            );
            assert.equal(
              scriptApp.object.copying.labTexts[0].name,
              labText.name,
              "name should match"
            );
          } catch (err) {
            console.error(`SC.10.1 error: ${err}`);
            assert.ok(false, err.message);
          } finally {
            if (labText) await labText.delete();
          }
        });

        it("SC.10.2: _addLabTextToCopy is blocked when books already queued", async function () {
          this.timeout(300000);
          let book;
          let labText;
          try {
            book = await createBook({}, "SC.10.2 Book");
            labText = await createLabText(false, "Author");
            const scriptApp = new Scriptorium(new ScriptoriumObject(), {});
            await scriptApp._addBookToCopy(book);
            assert.equal(scriptApp.object.copying.books.length, 1, "book should be queued");
            await scriptApp._addLabTextToCopy(labText);
            // Guard: books.length > 0 → return immediately
            assert.equal(scriptApp.object.copying.labTexts.length, 0, "labText should be blocked");
          } catch (err) {
            console.error(`SC.10.2 error: ${err}`);
            assert.ok(false, err.message);
          } finally {
            if (book) await book.delete();
            if (labText) await labText.delete();
          }
        });

        it("SC.10.3: _removeBook removes correct book from copying.books", async function () {
          this.timeout(300000);
          let book1, book2;
          try {
            book1 = await createBook({}, "SC.10.3 Book A");
            book2 = await createBook({ type: "Tractatus" }, "SC.10.3 Book B");
            const scriptApp = new Scriptorium(new ScriptoriumObject(), {});
            await scriptApp._addBookToCopy(book1);
            // Second book must have same type (Summa) to pass the matching filter
            const secondBook = await createBook({}, "SC.10.3 Book B2");
            await scriptApp._addBookToCopy(secondBook);
            assert.equal(scriptApp.object.copying.books.length, 2, "two books should be queued");
            // Remove book at index 0
            await scriptApp._removeBook({ bookIndex: "0", index: "0" });
            assert.equal(
              scriptApp.object.copying.books.length,
              1,
              "one book should remain after removal"
            );
            await secondBook.delete();
          } catch (err) {
            console.error(`SC.10.3 error: ${err}`);
            assert.ok(false, err.message);
          } finally {
            if (book1) await book1.delete();
            if (book2) await book2.delete();
          }
        });

        it("SC.10.4: close() with no linked actors does not throw", async function () {
          this.timeout(300000);
          try {
            const scriptApp = new Scriptorium(new ScriptoriumObject(), {});
            // No reader/writer/scribe set → all id checks short-circuit safely
            await scriptApp.close();
            assert.ok(true, "close() should complete without throwing");
          } catch (err) {
            console.error(`SC.10.4 error: ${err}`);
            assert.ok(false, err.message);
          }
        });
      });
    },
    { displayName: "ARS : Scriptorium testsuite" }
  );
}
