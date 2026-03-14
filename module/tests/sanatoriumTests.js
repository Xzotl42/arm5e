import { log, sleep } from "../tools/tools.js";
import { getMagus } from "./testData.js";
import { ArsLayer } from "../ui/ars-layer.js";
import { Sanatorium } from "../apps/sanatorium.js";
import { makeEvent } from "./testHelpers.js";

export function registerSanatoriumTesting(quench) {
  quench.registerBatch(
    "Ars-Sanatorium",
    (context) => {
      const { describe, it, assert, before, after, beforeEach, afterEach } = context;

      let magus;
      const getDatetime = () => game.settings.get("arm5e", "currentDate");
      const fakeEvent = makeEvent();

      // ─── helpers ─────────────────────────────────────────────────────────────

      /** Create a fresh Sanatorium instance without rendering the UI. */
      function makeSan() {
        return new Sanatorium(magus);
      }

      /**
       * Build a minimal plain-object wound stub for _processWoundRoll unit tests.
       * Does NOT create a real Foundry item — suitable for pure logic tests only.
       */
      function woundStub(type, overrides = {}) {
        const autoName = (t) =>
          `${game.i18n.localize(CONFIG.ARM5E.recovery.wounds[t].label)} ${game.i18n.localize(
            "arm5e.sheet.wound.label"
          )}`;
        return Object.assign(
          {
            name: autoName(type),
            originalGravity: type,
            description: "",
            recoveryTime: 0,
            daysFirstSeason: 0,
            bonus: 0,
            trend: 0,
            nextRoll: 0,
            locked: false,
            img: "",
            style: ""
          },
          overrides
        );
      }

      /** Build an empty newWounds accumulator matching _recoveryRoll's shape. */
      function blankNewWounds() {
        return { healthy: [], light: [], medium: [], heavy: [], incap: [], dead: [] };
      }

      /**
       * Inflict a wound of the given gravity on magus by calling changeWound,
       * then backdate it 10 years so the Sanatorium will treat it this session.
       * Returns the created wound item.
       */
      async function inflictWound(gravity) {
        const wounds = await magus.changeWound(1, gravity);
        const wound = wounds[0];
        await wound.update({ "system.inflictedDate.year": getDatetime().year - 10 });
        return wound;
      }

      // ─── suite-level setup / teardown ─────────────────────────────────────────

      before(async function () {
        ArsLayer.clearAura(true);
        magus = await getMagus("SanatoriumTester");
      });

      after(async function () {
        if (magus) await magus.delete();
      });

      // ═══════════════════════════════════════════════════════════════════════════
      // 1. SESSION INITIALISATION
      // ═══════════════════════════════════════════════════════════════════════════
      describe("Session initialisation", function () {
        this.timeout(300000);

        afterEach(async function () {
          await magus.restoreHealth(true);
        });

        it("init: default state when patient has no wounds", async function () {
          try {
            const san = makeSan();
            assert.equal(
              san.object.availableDays,
              CONFIG.ARM5E.recovery.daysInSeason[san.object.curSeason],
              "availableDays defaults to full season"
            );
            assert.equal(san.object.hasWounds, false, "hasWounds is false");
            assert.equal(san.object.nextRecoveryPeriod, 0, "nextRecoveryPeriod is 0");
            assert.equal(san.object.rollMode, "none", "rollMode is 'none'");
            assert.equal(san.object.dateChange, "disabled", "dateChange locked by default");
            assert.equal(san.object.individualRollDone, false, "individualRollDone is false");
            san.close();
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("init: dateChange unlocked when patient has a brand-new wound (recoveryTime=0)", async function () {
          try {
            await inflictWound("medium");
            const san = makeSan();
            assert.equal(
              san.object.dateChange,
              "",
              "dateChange is '' (unlocked) for first-time wound"
            );
            san.close();
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("init: wounds bucket created for each inflicted gravity type", async function () {
          try {
            await inflictWound("light");
            await inflictWound("heavy");
            const san = makeSan();
            assert.equal(san.object.wounds["light"]?.length, 1, "one light wound");
            assert.equal(san.object.wounds["heavy"]?.length, 1, "one heavy wound");
            san.close();
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("init: hasWounds true when at least one treatable wound exists", async function () {
          try {
            await inflictWound("medium");
            const san = makeSan();
            assert.equal(san.object.hasWounds, true, "hasWounds should be true");
            san.close();
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("init: modifiers start at zero", async function () {
          try {
            const san = makeSan();
            assert.equal(san.object.modifiers.mundaneHelp, 0, "mundaneHelp = 0");
            assert.equal(san.object.modifiers.magicalHelp, 0, "magicalHelp = 0");
            assert.equal(san.object.modifiers.labHealth, 0, "labHealth = 0");
            san.close();
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });
      });

      // ═══════════════════════════════════════════════════════════════════════════
      // 2. LOG HELPERS
      // ═══════════════════════════════════════════════════════════════════════════
      describe("Log helpers", function () {
        this.timeout(60000);

        it("_openLogDaySection: writes day header on first call", function () {
          try {
            const san = makeSan();
            const logState = { description: "", logDayAdded: false };
            san._openLogDaySection(logState, 5);
            assert.ok(logState.description.includes("<h4"), "h4 tag written");
            assert.equal(logState.logDayAdded, true, "logDayAdded set to true");
            san.close();
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("_openLogDaySection: subsequent calls are no-ops (idempotent)", function () {
          try {
            const san = makeSan();
            const logState = { description: "", logDayAdded: false };
            san._openLogDaySection(logState, 5);
            const firstLen = logState.description.length;
            san._openLogDaySection(logState, 5);
            assert.equal(
              logState.description.length,
              firstLen,
              "description length unchanged on second call"
            );
            san.close();
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("_updateWoundName: renames auto-generated wound name when type changes", function () {
          try {
            const san = makeSan();
            const autoName = (t) =>
              `${game.i18n.localize(CONFIG.ARM5E.recovery.wounds[t].label)} ${game.i18n.localize(
                "arm5e.sheet.wound.label"
              )}`;
            const wound = { name: autoName("light") };
            san._updateWoundName(wound, "light", "healthy");
            assert.equal(wound.name, autoName("healthy"), "name updated to healthy auto-name");
            san.close();
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("_updateWoundName: preserves custom wound names unchanged", function () {
          try {
            const san = makeSan();
            const wound = { name: "Black Sword Wound" };
            san._updateWoundName(wound, "light", "healthy");
            assert.equal(wound.name, "Black Sword Wound", "custom name preserved");
            san.close();
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });
      });

      // ═══════════════════════════════════════════════════════════════════════════
      // 3. _processWoundRoll — DETERMINISTIC OUTCOME LOGIC
      //    Uses raw rollTotal integers — no dice involved.
      // ═══════════════════════════════════════════════════════════════════════════
      describe("_processWoundRoll — deterministic outcome logic", function () {
        this.timeout(60000);

        // shared sanatorium for all unit tests in this block
        let san;
        before(function () {
          san = makeSan();
          san.object.availableDays = CONFIG.ARM5E.recovery.daysInSeason[getDatetime().season] ?? 91;
          san.object.nextRecoveryPeriod = 0;
          san.object.curYear = getDatetime().year;
          san.object.curSeason = getDatetime().season;
        });
        after(function () {
          san.close();
        });

        it("improvement: trend=-1, bonus reset to 0, style=improved", function () {
          try {
            const medCfg = CONFIG.ARM5E.recovery.wounds["medium"];
            const wound = woundStub("medium", { bonus: 6, trend: 0 });
            const newWounds = blankNewWounds();
            san._processWoundRoll(
              wound,
              "medium",
              "medium",
              medCfg.improvement,
              { description: "", logDayAdded: false },
              newWounds
            );
            assert.equal(newWounds.medium.length, 1, "wound pushed to medium bucket");
            assert.equal(wound.trend, -1, "trend is -1 (improving)");
            assert.equal(wound.bonus, 0, "bonus reset to 0");
            assert.equal(wound.style, "improved", "style = improved");
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("stable: bonus += 3, trend stays 0", function () {
          try {
            const medCfg = CONFIG.ARM5E.recovery.wounds["medium"];
            const wound = woundStub("medium", { bonus: 3, trend: 0 });
            const newWounds = blankNewWounds();
            san._processWoundRoll(
              wound,
              "medium",
              "medium",
              medCfg.stability,
              { description: "", logDayAdded: false },
              newWounds
            );
            assert.equal(newWounds.medium.length, 1, "wound pushed to medium bucket");
            assert.equal(wound.trend, 0, "trend stays 0");
            assert.equal(wound.bonus, 6, "bonus = 3 + 3");
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("worsening: trend=1, bonus=0, style=worsened", function () {
          try {
            const medCfg = CONFIG.ARM5E.recovery.wounds["medium"];
            const wound = woundStub("medium", { bonus: 6, trend: 0 });
            const newWounds = blankNewWounds();
            san._processWoundRoll(
              wound,
              "medium",
              "medium",
              medCfg.stability - 1,
              { description: "", logDayAdded: false },
              newWounds
            );
            assert.equal(newWounds.medium.length, 1, "wound still in medium bucket");
            assert.equal(wound.trend, 1, "trend = 1 (worsening)");
            assert.equal(wound.bonus, 0, "bonus reset to 0");
            assert.equal(wound.style, "worsened", "style = worsened");
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("healed: wound moves to healthy, locked=true, nextRoll=0, healedDate set", function () {
          try {
            const wound = woundStub("light", { trend: -1 });
            const newWounds = blankNewWounds();
            san._processWoundRoll(
              wound,
              "light",
              "healthy",
              0,
              { description: "", logDayAdded: false },
              newWounds
            );
            assert.equal(newWounds.healthy.length, 1, "wound moved to healthy bucket");
            assert.equal(wound.locked, true, "wound locked");
            assert.equal(wound.nextRoll, 0, "nextRoll cleared to 0");
            assert.ok(wound.healedDate, "healedDate is set");
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("daysFirstSeason: set to availableDays - nextRecoveryPeriod on first-ever roll", function () {
          try {
            san.object.availableDays = 92;
            san.object.nextRecoveryPeriod = 20;
            const medCfg = CONFIG.ARM5E.recovery.wounds["medium"];
            const wound = woundStub("medium", { recoveryTime: 0 });
            const newWounds = blankNewWounds();
            san._processWoundRoll(
              wound,
              "medium",
              "medium",
              medCfg.improvement,
              { description: "", logDayAdded: false },
              newWounds
            );
            assert.equal(wound.daysFirstSeason, 72, "daysFirstSeason = 92 - 20 = 72");
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("recoveryTime: accumulates by wCfg.interval on each roll", function () {
          try {
            const medCfg = CONFIG.ARM5E.recovery.wounds["medium"];
            san.object.nextRecoveryPeriod = 0;
            const wound = woundStub("medium", { recoveryTime: medCfg.interval });
            const newWounds = blankNewWounds();
            san._processWoundRoll(
              wound,
              "medium",
              "medium",
              medCfg.improvement,
              { description: "", logDayAdded: false },
              newWounds
            );
            assert.equal(
              wound.recoveryTime,
              medCfg.interval * 2,
              "recoveryTime doubled after second roll"
            );
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("stable bonus carry-over: two consecutive stable rolls accumulate bonus correctly", function () {
          try {
            const medCfg = CONFIG.ARM5E.recovery.wounds["medium"];
            const wound = woundStub("medium", { bonus: 0, trend: 0 });
            // First stable roll: bonus 0 → 3
            san._processWoundRoll(
              wound,
              "medium",
              "medium",
              medCfg.stability,
              { description: "", logDayAdded: false },
              blankNewWounds()
            );
            assert.equal(wound.bonus, 3, "bonus = 3 after first stable roll");
            assert.equal(wound.trend, 0, "trend still 0 after first stable roll");
            // Second stable roll using the same wound — bonus should carry over: 3 → 6
            san._processWoundRoll(
              wound,
              "medium",
              "medium",
              medCfg.stability,
              { description: "", logDayAdded: false },
              blankNewWounds()
            );
            assert.equal(
              wound.bonus,
              6,
              "bonus = 6 after second stable roll (carry-over confirmed)"
            );
            assert.equal(wound.trend, 0, "trend remains 0 through both stable rolls");
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("second improvement (trend=-1): commits wound to one rank lighter than effective type", function () {
          try {
            // Wound already trending better (trend=-1) — next roll uses effective type "light"
            // (rankMapping[medium.rank + (-1)] = "light"). On improvement the wound commits:
            // commitRank = lightCfg.rank − 1 = 0 = "healthy".
            const wound = woundStub("medium", { bonus: 0, trend: -1 });
            const newWounds = blankNewWounds();
            const lightCfg = CONFIG.ARM5E.recovery.wounds["light"];
            san._processWoundRoll(
              wound,
              "medium",
              "light",
              lightCfg.improvement,
              { description: "", logDayAdded: false },
              newWounds
            );
            assert.equal(newWounds.healthy.length, 1, "wound committed to healthy bucket");
            assert.equal(wound.trend, 0, "trend reset to 0 on commit");
            assert.equal(wound.style, "improved", "style = improved");
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("second worsening (trend=+1): commits wound to one rank heavier than effective type", function () {
          try {
            // Wound already trending worse (trend=+1) — next roll uses effective type "heavy"
            // (rankMapping[medium.rank + 1] = "heavy"). On worsening the wound commits:
            // commitRank = heavyCfg.rank + 1 = 4 = "incap".
            const wound = woundStub("medium", { bonus: 0, trend: 1 });
            const newWounds = blankNewWounds();
            const heavyCfg = CONFIG.ARM5E.recovery.wounds["heavy"];
            san._processWoundRoll(
              wound,
              "medium",
              "heavy",
              heavyCfg.stability - 1, // below stability threshold → worsening
              { description: "", logDayAdded: false },
              newWounds
            );
            assert.equal(newWounds.incap.length, 1, "wound committed to incap bucket");
            assert.equal(wound.trend, 0, "trend reset to 0 on commit");
            assert.equal(wound.style, "worsened", "style = worsened");
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });
      });

      // ═══════════════════════════════════════════════════════════════════════════
      // 4. STANDARD RECOVERY — LIGHT / MEDIUM / HEAVY
      // ═══════════════════════════════════════════════════════════════════════════
      describe("Standard recovery — Light / Medium / Heavy", function () {
        this.timeout(300000);

        afterEach(async function () {
          await magus.restoreHealth(true);
        });

        it("waiting wound: not rolled when nextRoll is in the future", async function () {
          try {
            await inflictWound("light");
            const san = makeSan();
            san.object.wounds["light"][0].nextRoll = 50;
            await san._recoveryRoll(fakeEvent);
            assert.equal(
              san.object.wounds["light"][0].nextRoll,
              50,
              "nextRoll unchanged for waiting wound"
            );
            assert.equal(
              san.object.nextRecoveryPeriod,
              50,
              "period advances to the waiting wound's nextRoll"
            );
            san.close();
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("locked wound: carried over unchanged without rolling", async function () {
          try {
            await inflictWound("light");
            const san = makeSan();
            san.object.wounds["light"][0].locked = true;
            const origNextRoll = san.object.wounds["light"][0].nextRoll;
            await san._recoveryRoll(fakeEvent);
            assert.equal(san.object.wounds["light"][0].locked, true, "wound still locked");
            assert.equal(
              san.object.wounds["light"][0].nextRoll,
              origNextRoll,
              "nextRoll unchanged"
            );
            san.close();
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("wound with trend=-1 on the lightest rank heals automatically (no die needed)", async function () {
          try {
            await inflictWound("light");
            const san = makeSan();
            // trend=-1 on rank-1 wound → rankMapping[0] = "healthy" → no die, instant heal
            san.object.wounds["light"][0].trend = -1;
            await san._recoveryRoll(fakeEvent);
            assert.equal((san.object.wounds["healthy"] ?? []).length, 1, "wound moved to healthy");
            assert.equal((san.object.wounds["light"] ?? []).length, 0, "light bucket is empty");
            san.close();
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("dateChange locks to 'disabled' after the first roll", async function () {
          try {
            await inflictWound("medium");
            const san = makeSan();
            assert.equal(san.object.dateChange, "", "unlocked before first roll");
            await san._recoveryRoll(fakeEvent);
            assert.equal(san.object.dateChange, "disabled", "locked after first roll");
            san.close();
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("incapacited flag: lighter wounds delayed by incap interval when incap is due", async function () {
          try {
            await inflictWound("incap");
            await inflictWound("light");
            const san = makeSan();
            // Force incap to improve at sunrise (resolved) so incapacited=true is set
            san.object.wounds["incap"][0].bonus = 200;
            const lightNextBefore = san.object.wounds["light"][0].nextRoll;
            await san._recoveryRoll(fakeEvent);
            const incapInterval = CONFIG.ARM5E.recovery.wounds["incap"].interval;
            assert.equal(
              san.object.wounds["light"][0].nextRoll,
              lightNextBefore + incapInterval,
              "light wound nextRoll delayed by incap interval"
            );
            san.close();
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });
      });

      // ═══════════════════════════════════════════════════════════════════════════
      // 5. INCAPACITATING WOUND MECHANICS (sunrise + sunset)
      // ═══════════════════════════════════════════════════════════════════════════
      describe("Incapacitating wound mechanics", function () {
        this.timeout(300000);

        afterEach(async function () {
          await magus.restoreHealth(true);
        });

        it("improvement at sunrise (step 1): wound stays incap with trend=-1, sunset sub-roll skipped", async function () {
          // Two-step incap improvement: first improvement sets trend=-1 and keeps wound in
          // the incap bucket. The wound is committed to heavy only on the NEXT period roll.
          try {
            await inflictWound("incap");
            const san = makeSan();
            // Huge bonus guarantees total >> improvement threshold at sunrise → resolved immediately
            san.object.wounds["incap"][0].bonus = 200;
            await san._recoveryRoll(fakeEvent);
            const logText = san.object.log;
            const sunriseLabel = game.i18n.localize("arm5e.sanatorium.msg.sunriseRoll");
            const sunsetLabel = game.i18n.localize("arm5e.sanatorium.msg.sunsetRoll");
            assert.ok(logText.includes(sunriseLabel), "log contains Sunrise label");
            assert.ok(
              !logText.includes(sunsetLabel),
              "log does NOT contain Sunset label (resolved = true, sunset skipped)"
            );
            // First step: wound stays in incap with trend=-1
            const incapWound = (san.object.wounds["incap"] ?? [])[0];
            assert.ok(incapWound, "wound still in incap bucket after first improvement step");
            assert.equal(incapWound.trend, -1, "trend = -1 (pending second-step Heavy-grade roll)");
            assert.equal((san.object.wounds["heavy"] ?? []).length, 0, "heavy bucket still empty");
            san.close();
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("improvement at sunrise (step 2, trend=-1): resolved via Heavy-grade roll on second period", async function () {
          // With trend=-1 already set, the wound is treated via the trendingBetter path:
          // a Heavy-grade roll is made. With bonus=200 this lands above the improvement
          // threshold (15) → wound commits to medium (heavyCfg.rank − 1 = 2).
          try {
            await inflictWound("incap");
            const san = makeSan();
            // Simulate post-first-improvement state: trend already -1
            san.object.wounds["incap"][0].trend = -1;
            san.object.wounds["incap"][0].bonus = 200;
            await san._recoveryRoll(fakeEvent);
            assert.equal(
              (san.object.wounds["medium"] ?? []).length,
              1,
              "wound resolved to medium via Heavy-grade improvement"
            );
            assert.equal(
              (san.object.wounds["incap"] ?? []).length,
              0,
              "incap bucket empty after second step"
            );
            san.close();
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("trendingBetter incap (trend=-1) does NOT block LMH wounds from rolling in the same period", async function () {
          // When the only due incap wound is trending better (trend=-1), it rolls as a
          // Heavy-grade wound this period. It is not a "normal" incap wound, so it must
          // NOT set incapacited=true — Light/Medium/Heavy wounds must also roll in the
          // same recovery period, not get delayed by the incap interval.
          try {
            await inflictWound("incap");
            await inflictWound("light");
            await inflictWound("medium");
            const san = makeSan();
            // Put incap in trendingBetter state
            san.object.wounds["incap"][0].trend = -1;
            san.object.wounds["incap"][0].bonus = 200;
            const lightNextBefore = san.object.wounds["light"][0].nextRoll;
            const medNextBefore = san.object.wounds["medium"][0].nextRoll;
            await san._recoveryRoll(fakeEvent);
            const incapInterval = CONFIG.ARM5E.recovery.wounds["incap"].interval;
            // Light wound must NOT have been delayed by the incap interval
            assert.notEqual(
              san.object.wounds["light"]?.[0]?.nextRoll,
              lightNextBefore + incapInterval,
              "light wound was NOT delayed by incap interval (trendingBetter does not block)"
            );
            // Medium wound must also have rolled (recoveryTime > 0) or at least not been
            // delayed: it should have been processed normally
            assert.notEqual(
              san.object.wounds["medium"]?.[0]?.nextRoll,
              medNextBefore + incapInterval,
              "medium wound was NOT delayed by incap interval"
            );
            san.close();
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("trendingBetter incap worsens back to incap: next roll uses heavy interval (90 days), not incap interval", async function () {
          // If the Heavy-grade roll fails (worsening), the wound regresses to incap but
          // the roll happened on the heavy cadence: nextRoll advances by heavyCfg.interval
          // (90 days), NOT the 1-day incap interval.  The log message must also say "90 days".
          try {
            await inflictWound("incap");
            const san = makeSan();
            san.object.wounds["incap"][0].trend = -1;
            san.object.wounds["incap"][0].bonus = -200; // force heavy roll to worsen
            const preNextRoll = san.object.wounds["incap"][0].nextRoll;
            await san._recoveryRoll(fakeEvent);
            // Wound should have regressed back to incap
            const incapAfter = san.object.wounds["incap"] ?? [];
            assert.equal(incapAfter.length, 1, "wound back in incap bucket after worsening");
            const heavyInterval = CONFIG.ARM5E.recovery.wounds["heavy"].interval;
            assert.equal(
              incapAfter[0].nextRoll,
              preNextRoll + heavyInterval,
              `nextRoll advanced by heavy interval (${heavyInterval}), not incap interval`
            );
            san.close();
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("death at sunrise (total ≤ 0): wound moves to dead, locked", async function () {
          try {
            await inflictWound("incap");
            const san = makeSan();
            // Extreme negative bonus → sta + bonus + die total will be ≤ 0
            san.object.wounds["incap"][0].bonus = -200;
            await san._recoveryRoll(fakeEvent);
            assert.equal((san.object.wounds["dead"] ?? []).length, 1, "wound moved to dead");
            assert.equal(san.object.wounds["dead"][0].locked, true, "dead wound locked");
            san.close();
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("recoveryTime: incremented by incap interval after first improvement roll (wound stays incap)", async function () {
          // Two-step: on first improvement the wound stays in incap with trend=-1.
          // Its recoveryTime accumulates the incap interval (1 day) even though it has not
          // yet moved to the heavy bucket.
          try {
            await inflictWound("incap");
            const san = makeSan();
            san.object.wounds["incap"][0].bonus = 200; // improve → stays incap with trend=-1
            const incapInterval = CONFIG.ARM5E.recovery.wounds["incap"].interval;
            await san._recoveryRoll(fakeEvent);
            // Wound still in incap bucket after first step
            const w = (san.object.wounds["incap"] ?? [])[0];
            assert.ok(w, "wound still in incap after first step");
            assert.equal(w.recoveryTime, incapInterval, "recoveryTime = incap interval (1 day)");
            assert.equal(w.trend, -1, "trend = -1 (second step pending)");
            san.close();
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("daysFirstSeason: set from availableDays − preRollPeriod on first incap roll (wound stays incap)", async function () {
          // Two-step: wound stays incap after first improvement. daysFirstSeason is still
          // recorded in the incap commit phase when recoveryTime transitions from 0 → 1.
          try {
            await inflictWound("incap");
            const san = makeSan();
            san.object.wounds["incap"][0].bonus = 200;
            const preRoll = san.object.nextRecoveryPeriod;
            await san._recoveryRoll(fakeEvent);
            // Wound is still in incap with trend=-1 after first step
            const w = (san.object.wounds["incap"] ?? [])[0];
            assert.ok(w, "wound still in incap after first step");
            assert.equal(
              w.daysFirstSeason,
              san.object.availableDays - preRoll,
              "daysFirstSeason = availableDays - preRollPeriod"
            );
            san.close();
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("incap wound locks for next season when nextRoll would exceed availableDays", async function () {
          // Two-step: wound stays incap after first improvement. nextRoll is advanced by
          // incapCfg.interval (1 day). If the new nextRoll > availableDays the wound locks.
          try {
            await inflictWound("incap");
            const san = makeSan();
            // Place wound so that nextRoll + incapCfg.interval (1) exceeds availableDays
            san.object.wounds["incap"][0].nextRoll = san.object.availableDays;
            san.object.nextRecoveryPeriod = san.object.availableDays;
            san.object.wounds["incap"][0].bonus = 200; // improvement → stays incap with trend=-1
            await san._recoveryRoll(fakeEvent);
            // Wound remains in incap but should be locked (nextRoll overflows into next season)
            const w = (san.object.wounds["incap"] ?? [])[0];
            assert.ok(w, "wound still in incap bucket");
            assert.equal(w.locked, true, "wound locked for next season");
            san.close();
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("two incap wounds: both processed in same cycle (both stay incap with trend=-1 after first step)", async function () {
          // Two-step: each incap wound independently advances to trend=-1 on first improvement.
          // Both wounds should remain in the incap bucket after the first period roll.
          try {
            await inflictWound("incap");
            await inflictWound("incap");
            const san = makeSan();
            assert.equal(san.object.wounds["incap"].length, 2, "two incap wounds present");
            san.object.wounds["incap"][0].bonus = 200;
            san.object.wounds["incap"][1].bonus = 200;
            await san._recoveryRoll(fakeEvent);
            const incapAfter = san.object.wounds["incap"] ?? [];
            assert.equal(incapAfter.length, 2, "both wounds still in incap after first step");
            assert.equal(incapAfter[0].trend, -1, "wound 0 trend = -1");
            assert.equal(incapAfter[1].trend, -1, "wound 1 trend = -1");
            assert.equal((san.object.wounds["heavy"] ?? []).length, 0, "heavy bucket still empty");
            san.close();
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("already-worsening incap wound (trend=1): dies on next worsening roll", async function () {
          // NOTE: non-deterministic path — only passes when sunrise roll < stability.
          // With bonus=-200 vs any reasonable Stamina, the die total will be ≤ 0 (death),
          // which also removes the wound. So we verify wound is no longer incap.
          try {
            await inflictWound("incap");
            const san = makeSan();
            san.object.wounds["incap"][0].trend = 1; // already worsening
            san.object.wounds["incap"][0].bonus = -200; // force low total → death
            await san._recoveryRoll(fakeEvent);
            assert.equal(
              (san.object.wounds["incap"] ?? []).length,
              0,
              "wound is no longer incap (dead or resolved)"
            );
            san.close();
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("incap stable: bonus decremented by 1 per stable sub-roll and committed to wound", async function () {
          // Non-deterministic: assertion fires only when both sub-rolls are stable
          // (wound remains incap). Verifies the bonus-decrement carry-over mechanic
          // between the sunrise and sunset sub-rolls.
          try {
            await inflictWound("incap");
            const san = makeSan();
            const startBonus = 0;
            san.object.wounds["incap"][0].bonus = startBonus;
            await san._recoveryRoll(fakeEvent);
            const stillIncap = (san.object.wounds["incap"] ?? [])[0];
            if (stillIncap && stillIncap.trend === -1) {
              // Two-step improvement: wound stays incap with trend=-1 and bonus reset to 0.
              // This is a valid improvement outcome — no decrement expected here.
              assert.equal(stillIncap.bonus, 0, "improvement resets bonus to 0 (two-step path)");
            } else if (stillIncap) {
              // Both sub-rolls were stable — bonus must have decremented at least once
              assert.ok(
                stillIncap.bonus <= startBonus - 1,
                `bonus decremented by ≥1 from stable sub-roll(s): was ${startBonus}, now ${stillIncap.bonus}`
              );
            } else {
              // Wound died — valid outcome; decrement path not reachable this run
              assert.ok(true, "wound died — stable decrement path not reachable this run");
            }
            san.close();
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });
      });

      // ═══════════════════════════════════════════════════════════════════════════
      // 6. SINGLE-WOUND ROLL SENTINEL (_recoveryRollSingle)
      // ═══════════════════════════════════════════════════════════════════════════
      describe("Single-wound roll sentinel (_recoveryRollSingle)", function () {
        this.timeout(300000);

        afterEach(async function () {
          await magus.restoreHealth(true);
        });

        it("wounds of strictly higher rank are excluded when a lower-rank wound is targeted", async function () {
          try {
            const lightWound = await inflictWound("light");
            await inflictWound("heavy");
            const san = makeSan();
            const heavyNextBefore = san.object.wounds["heavy"][0].nextRoll;
            await san._recoveryRollSingle(lightWound._id ?? lightWound.id);
            assert.equal(
              san.object.wounds["heavy"][0].nextRoll,
              heavyNextBefore,
              "heavy wound nextRoll unchanged"
            );
            san.close();
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("incap wound excluded when target is Heavy (incap rank > heavy rank)", async function () {
          try {
            const heavyWound = await inflictWound("heavy");
            await inflictWound("incap");
            const san = makeSan();
            const incapNextBefore = san.object.wounds["incap"][0].nextRoll;
            await san._recoveryRollSingle(heavyWound._id ?? heavyWound.id);
            assert.equal(
              san.object.wounds["incap"][0].nextRoll,
              incapNextBefore,
              "incap wound nextRoll unchanged"
            );
            san.close();
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("wounds of equal rank also roll (same-rank wound participates)", async function () {
          try {
            const medWound1 = await inflictWound("medium");
            await inflictWound("medium");
            const san = makeSan();
            assert.equal(san.object.wounds["medium"].length, 2, "two medium wounds");
            // Both medium wounds should roll when one is targeted
            await san._recoveryRollSingle(medWound1._id ?? medWound1.id);
            // After roll, both wounds should have been processed (recoveryTime incremented)
            const allMedAndOther = [
              ...(san.object.wounds["medium"] ?? []),
              ...(san.object.wounds["light"] ?? []),
              ...(san.object.wounds["heavy"] ?? []),
              ...(san.object.wounds["healthy"] ?? [])
            ];
            const rolledCount = allMedAndOther.filter((w) => w.recoveryTime > 0).length;
            assert.equal(rolledCount, 2, "both medium wounds have been rolled (recoveryTime > 0)");
            san.close();
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("individualRollDone flag set to true after _recoveryRollSingle", async function () {
          try {
            const wound = await inflictWound("medium");
            const san = makeSan();
            assert.equal(san.object.individualRollDone, false, "starts false");
            await san._recoveryRollSingle(wound._id ?? wound.id);
            assert.equal(san.object.individualRollDone, true, "set to true after single roll");
            san.close();
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("_singleRollMaxRank sentinel deleted from instance after _recoveryRollSingle", async function () {
          try {
            const wound = await inflictWound("medium");
            const san = makeSan();
            await san._recoveryRollSingle(wound._id ?? wound.id);
            assert.equal(san._singleRollMaxRank, undefined, "sentinel cleaned up");
            san.close();
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("incap wound as target: incap rolls; lower-rank wounds are delayed (not rolled) due to incap priority", async function () {
          // When an incapacitating wound is targeted via _recoveryRollSingle:
          // _singleRollMaxRank = incap.rank (4) → incap IS processed (rank 4 ≤ 4)
          // incapacited=true is set → the L/M/H block delays lower wounds instead of rolling them.
          try {
            const incapWound = await inflictWound("incap");
            await inflictWound("medium");
            const san = makeSan();
            san.object.wounds["incap"][0].bonus = 200; // force improvement → known outcome (heavy)
            const medNextBefore = san.object.wounds["medium"][0].nextRoll;
            await san._recoveryRollSingle(incapWound._id ?? incapWound.id);
            const incapInterval = CONFIG.ARM5E.recovery.wounds["incap"].interval;
            // Medium wound must be delayed, not rolled
            assert.equal(
              san.object.wounds["medium"][0].nextRoll,
              medNextBefore + incapInterval,
              "medium wound delayed by incap interval"
            );
            assert.equal(
              san.object.wounds["medium"][0].recoveryTime,
              0,
              "medium wound not yet rolled (recoveryTime still 0)"
            );
            // The incap wound was processed (stays incap with trend=-1 after first improvement step)
            const rolledIncap = san.object.wounds["incap"] ?? [];
            assert.ok(
              rolledIncap.length >= 1 && rolledIncap[0].trend === -1,
              "incap wound rolled: still in incap bucket with trend=-1 (first step of two-step improvement)"
            );
            assert.equal(san.object.individualRollDone, true, "individualRollDone set to true");
            san.close();
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("rank ceiling persists on second roll click (continuation of single-wound session)", async function () {
          // After _recoveryRollSingle targets a Light wound, individualRollDone=true and
          // individualRollMaxRank = light rank. A second click on the Roll button must NOT
          // let the Medium wound (rank > light rank) participate — the rank ceiling must
          // be re-applied by the recoveryRoll action handler's else-if branch.
          try {
            const lightWound = await inflictWound("light");
            await inflictWound("medium");
            const san = makeSan();
            // First roll: targets the light wound only
            await san._recoveryRollSingle(lightWound._id ?? lightWound.id);
            assert.equal(
              san.object.individualRollDone,
              true,
              "individualRollDone true after first roll"
            );
            const lightRank = CONFIG.ARM5E.recovery.wounds["light"].rank;
            assert.equal(
              san.object.individualRollMaxRank,
              lightRank,
              "individualRollMaxRank = light rank"
            );
            // Capture medium wound state before the second roll
            const medRecoveryBefore = san.object.wounds["medium"][0].recoveryTime;
            const medNextBefore = san.object.wounds["medium"][0].nextRoll;
            // Second click: simulating the Roll button via the static action handler
            await Sanatorium.recoveryRoll.call(san, fakeEvent, null);
            // Medium wound must still be excluded — nextRoll and recoveryTime unchanged
            assert.equal(
              san.object.wounds["medium"][0].recoveryTime,
              medRecoveryBefore,
              "medium wound recoveryTime unchanged on second roll (rank ceiling enforced)"
            );
            assert.equal(
              san.object.wounds["medium"][0].nextRoll,
              medNextBefore,
              "medium wound nextRoll unchanged on second roll (rank ceiling enforced)"
            );
            san.close();
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("end recovery auto-commits improving wound (trend=-1) to next lighter grade", async function () {
          // When the user ends a single-wound session early while the wound has trend=-1,
          // _createDiaryEntry must auto-advance it one rank lighter (medium → light)
          // without requiring an additional roll period.
          try {
            const wound = await inflictWound("medium");
            const san = makeSan();
            // Force improvement on this roll → wound ends with trend=-1 in medium bucket
            san.object.wounds["medium"][0].bonus = 200;
            await san._recoveryRollSingle(wound._id ?? wound.id);
            // Sanity: wound should still be in medium with trend=-1 after first step
            assert.ok(
              (san.object.wounds["medium"] ?? []).some((w) => w.trend === -1),
              "wound in medium bucket with trend=-1 before diary commit"
            );
            // End the recovery session — auto-commit must kick in
            await san._createDiaryEntry(fakeEvent);
            // After commit, the live item must have gravity="light"
            const liveItem = magus.items.get(wound._id ?? wound.id);
            assert.equal(
              liveItem.system.gravity,
              "light",
              "wound gravity advanced to light on end-recovery auto-commit"
            );
            san.close();
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("end recovery auto-commits incap wound (trend=-1) to heavy on early exit", async function () {
          // An incap wound with trend=-1 (first improvement step done) should be committed
          // to heavy when the user ends the single-wound session early.
          try {
            const wound = await inflictWound("incap");
            const san = makeSan();
            san.object.wounds["incap"][0].bonus = 200; // force first-step improvement
            await san._recoveryRollSingle(wound._id ?? wound.id);
            assert.ok(
              (san.object.wounds["incap"] ?? []).some((w) => w.trend === -1),
              "incap wound has trend=-1 before diary commit"
            );
            await san._createDiaryEntry(fakeEvent);
            const liveItem = magus.items.get(wound._id ?? wound.id);
            assert.equal(
              liveItem.system.gravity,
              "heavy",
              "incap wound advanced to heavy on end-recovery auto-commit"
            );
            san.close();
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("end recovery does NOT auto-commit trending wounds in a standard (non-single) session", async function () {
          // trend=-1 wounds should only be auto-committed on end of a single-wound session.
          // In a standard roll session (individualRollDone=false) the wound must be left
          // in its current bucket with trend=-1 intact.
          try {
            const wound = await inflictWound("medium");
            const san = makeSan();
            // Force improvement via standard _recoveryRoll (not _recoveryRollSingle)
            san.object.wounds["medium"][0].bonus = 200;
            await san._recoveryRoll(fakeEvent);
            // individualRollDone must remain false for a standard roll
            assert.equal(san.object.individualRollDone, false, "not a single-wound session");
            // If outcome was trend=-1, ending the session must NOT auto-advance the wound
            const sessionWound = (san.object.wounds["medium"] ?? [])[0];
            if (sessionWound && sessionWound.trend === -1) {
              await san._createDiaryEntry(fakeEvent);
              const liveItem = magus.items.get(wound._id ?? wound.id);
              assert.equal(
                liveItem.system.gravity,
                "medium",
                "wound stays medium — no auto-commit in standard session"
              );
              san.close();
            } else {
              // Wound already committed to a different bucket — test not applicable this run
              assert.ok(true, "wound already committed (not in medium/trend=-1 state)");
              san.close();
            }
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });
      });

      // ═══════════════════════════════════════════════════════════════════════════
      // 7. OVERSTRAIN CHECKS
      // ═══════════════════════════════════════════════════════════════════════════
      describe("Overstrain checks (_overstrainedRoll)", function () {
        this.timeout(300000);

        afterEach(async function () {
          await magus.restoreHealth(true);
        });

        it("no wounds: returns without error, actor unmodified", async function () {
          try {
            // No wounds inflicted — should notify and return without throwing
            const totalWoundsBefore = Object.values(magus.system.wounds)
              .filter(Array.isArray)
              .reduce((sum, arr) => sum + arr.length, 0);
            await Sanatorium._overstrainedRoll(magus);
            const totalWoundsAfter = Object.values(magus.system.wounds)
              .filter(Array.isArray)
              .reduce((sum, arr) => sum + arr.length, 0);
            assert.equal(totalWoundsAfter, totalWoundsBefore, "no wounds added");
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("worst wound targeted: with light + medium, medium receives the check", async function () {
          try {
            await inflictWound("light");
            const medWound = await inflictWound("medium");
            const lightWoundsBefore = (magus.system.wounds["light"] ?? []).length;
            await Sanatorium._overstrainedRoll(magus);
            // Light wound count must be unchanged — only medium (or heavier) is targeted
            assert.equal(
              (magus.system.wounds["light"] ?? []).length,
              lightWoundsBefore,
              "light wound untouched"
            );
            // Medium wound is either still medium (stable) or heavy (worsened) — both valid
            const medItem = magus.items.get(medWound.id);
            const finalGravity = medItem.system.gravity;
            assert.ok(
              ["medium", "heavy"].includes(finalGravity),
              `medium wound gravity is a valid post-overstrain outcome: ${finalGravity}`
            );
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("outcome is always valid: wound gravity either unchanged or one rank higher", async function () {
          try {
            const wound = await inflictWound("medium");
            const gravityBefore = magus.items.get(wound.id).system.gravity;
            await Sanatorium._overstrainedRoll(magus);
            const gravityAfter = magus.items.get(wound.id).system.gravity;
            // For a medium wound: valid outcomes are "medium" (stable) or "heavy" (worsened)
            const medRank = CONFIG.ARM5E.recovery.wounds["medium"].rank;
            const afterRank = CONFIG.ARM5E.recovery.wounds[gravityAfter]?.rank ?? 0;
            assert.ok(
              afterRank === medRank || afterRank === medRank + 1,
              `gravity changed by at most 1 rank: ${gravityBefore} → ${gravityAfter}`
            );
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });
      });

      // ═══════════════════════════════════════════════════════════════════════════
      // 8. PERIOD AND SEASON BOUNDARY LOCKING
      // ═══════════════════════════════════════════════════════════════════════════
      describe("Period and season boundary locking", function () {
        this.timeout(300000);

        afterEach(async function () {
          await magus.restoreHealth(true);
        });

        it("nextRecoveryPeriod advances after a roll", async function () {
          try {
            await inflictWound("light");
            const san = makeSan();
            const startPeriod = san.object.nextRecoveryPeriod;
            await san._recoveryRoll(fakeEvent);
            assert.ok(
              san.object.nextRecoveryPeriod > startPeriod || !san.object.hasWounds,
              "period advanced or season done"
            );
            san.close();
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("wound locked when nextRoll would exceed availableDays after the roll", async function () {
          try {
            await inflictWound("light");
            const san = makeSan();
            const lightCfg = CONFIG.ARM5E.recovery.wounds["light"];
            // Place wound near end-of-season so nextRoll + interval > availableDays
            const placedAt = san.object.availableDays - 1;
            san.object.wounds["light"][0].nextRoll = placedAt;
            san.object.nextRecoveryPeriod = placedAt;
            await san._recoveryRoll(fakeEvent);
            // After roll: nextRoll = placedAt + interval > availableDays → locked
            assert.equal(
              san.object.wounds["light"][0].locked,
              true,
              "wound locked for next season"
            );
            san.close();
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("hasWounds becomes false when the only wound is exhausted for the season", async function () {
          try {
            await inflictWound("light");
            const san = makeSan();
            san.object.wounds["light"][0].trend = -1; // heals automatically → locked
            await san._recoveryRoll(fakeEvent);
            assert.equal(san.object.hasWounds, false, "no more wounds due this season");
            san.close();
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("hasWounds remains true when a second wound is still due after the first rolls", async function () {
          try {
            await inflictWound("light");
            await inflictWound("light");
            const san = makeSan();
            // Give the second wound a future nextRoll so it is not processed now
            san.object.wounds["light"][1].nextRoll = 50;
            await san._recoveryRoll(fakeEvent);
            assert.equal(san.object.hasWounds, true, "second wound still pending");
            san.close();
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });
      });

      // ═══════════════════════════════════════════════════════════════════════════
      // 9. PENALTY DAY TRACKING
      // ═══════════════════════════════════════════════════════════════════════════
      describe("Penalty day tracking", function () {
        this.timeout(300000);

        afterEach(async function () {
          await magus.restoreHealth(true);
        });

        it("penaltyDays accumulates at least one entry after a roll", async function () {
          try {
            await inflictWound("medium");
            const san = makeSan();
            await san._recoveryRoll(fakeEvent);
            assert.ok(
              Object.keys(san.object.penaltyDays).length > 0,
              "penaltyDays has at least one entry"
            );
            san.close();
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("penaltyDays days value equals the elapsed period length", async function () {
          try {
            await inflictWound("medium");
            const san = makeSan();
            const medCfg = CONFIG.ARM5E.recovery.wounds["medium"];
            const startPeriod = san.object.nextRecoveryPeriod;
            await san._recoveryRoll(fakeEvent);
            const elapsed = san.object.nextRecoveryPeriod - startPeriod;
            const totalDays = Object.values(san.object.penaltyDays).reduce((sum, d) => sum + d, 0);
            assert.equal(totalDays, elapsed, "total penaltyDays == elapsed period");
            san.close();
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("_resetForNextSeason: clears log, penaltyDays, nextRecoveryPeriod, individualRollDone", async function () {
          try {
            await inflictWound("medium");
            const san = makeSan();
            await san._recoveryRoll(fakeEvent);
            // Inject extra state to confirm it gets cleared
            san.object.penaltyDays = { "-3": 99 };
            san.object.individualRollDone = true;
            san._resetForNextSeason();
            assert.equal(san.object.log, "", "log cleared");
            assert.equal(san.object.nextRecoveryPeriod, 0, "nextRecoveryPeriod reset to 0");
            assert.equal(Object.keys(san.object.penaltyDays).length, 0, "penaltyDays cleared");
            assert.equal(san.object.individualRollDone, false, "individualRollDone reset to false");
            san.close();
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });
      });

      // ═══════════════════════════════════════════════════════════════════════════
      // 10. FAST RECOVERY GUARD
      // ═══════════════════════════════════════════════════════════════════════════
      describe("Fast recovery guard", function () {
        this.timeout(300000);

        afterEach(async function () {
          await magus.restoreHealth(true);
        });

        it("re-entrant _fastRecovery call is a no-op when _fastRecoveryRunning=true", async function () {
          try {
            await inflictWound("light");
            const san = makeSan();
            // Simulate already-running state
            san._fastRecoveryRunning = true;
            const logBefore = san.object.log;
            const periodBefore = san.object.nextRecoveryPeriod;
            await san._fastRecovery(fakeEvent);
            assert.equal(san.object.log, logBefore, "log unchanged (call skipped)");
            assert.equal(
              san.object.nextRecoveryPeriod,
              periodBefore,
              "period unchanged (call skipped)"
            );
            san._fastRecoveryRunning = false;
            san.close();
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });
      });
    },
    { displayName: "ARS : Sanatorium testsuite" }
  );
}
