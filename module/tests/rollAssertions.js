/**
 * Shared assertion helpers and constants for roll-related test suites.
 *
 * Centralises the assertion logic that was previously duplicated between
 * rollMagicTests.js and rollOptionTests.js.
 */

import { TWILIGHT_STAGES } from "../seasonal-activities/long-term-activities.js";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Default expected confidence score for a standard magus. */
export const EXPECTED_CONFIDENCE_SCORE = 2;

/** Valid realm strings across all contexts. */
export const VALID_REALMS = ["magic", "faeric", "infernal", "divine"];

/** Philosophy + Artes Liberales bonus applied to ritual spells. */
export const PHILOSOPHY_ARTES_BONUS = 5;

/** Minimum botch count required to push a magus into twilight. */
export const TWILIGHT_BOTCH_THRESHOLD = 2;

/** Number of botch dice used in option/characteristic rolls. */
export const BOTCH_DIE_COUNT = 10;

// ─── Basic roll structure ─────────────────────────────────────────────────────

/**
 * Assert the basic shape of a roll message's system data.
 *
 * All `options` fields are optional — only those provided are checked.
 *
 * @param {object}  assert            Chai assert instance from the test context.
 * @param {object}  msgData           `msg.system`
 * @param {object}  [options={}]
 * @param {string}  [options.type]              Expected `roll.type`.
 * @param {number}  [options.difficulty]         Expected `roll.difficulty`.
 * @param {number}  [options.divider]            Expected `roll.divider`.
 * @param {string}  [options.expectedLabel]      Expected `label` field.
 * @param {number}  [options.confidenceScore]    Override expected confidence score check.
 *                                               Pass `null` to skip the score equality check.
 */
export function assertBasicRollStructure(assert, msgData, options = {}) {
  const {
    type,
    difficulty,
    divider,
    expectedLabel,
    confidenceScore = EXPECTED_CONFIDENCE_SCORE
  } = options;

  assert.ok(msgData, "msgData (msg.system) should exist");
  assert.ok(msgData.confidence.score >= 0, "confidence.score should be non-negative");
  assert.equal(msgData.confidence.used, 0, "confidence.used should be 0");
  assert.equal(msgData.roll.actorType, "player", "actorType should be 'player'");

  if (confidenceScore !== null && confidenceScore !== undefined) {
    assert.equal(
      msgData.confidence.score,
      confidenceScore,
      `confidence.score should be ${confidenceScore}`
    );
  }
  if (type !== undefined) {
    assert.equal(msgData.roll.type, type, `roll.type should be ${type}`);
  }
  if (difficulty !== undefined) {
    assert.equal(msgData.roll.difficulty, difficulty, `roll.difficulty should be ${difficulty}`);
  }
  if (divider !== undefined) {
    assert.equal(msgData.roll.divider, divider, `roll.divider should be ${divider}`);
  }
  if (expectedLabel !== undefined) {
    assert.equal(msgData.label, expectedLabel, `label should be "${expectedLabel}"`);
  }
}

// ─── Confidence ───────────────────────────────────────────────────────────────

/**
 * Assert that the initial confidence state is sane: score ≥ 0 and used = 0.
 *
 * @param {object} assert
 * @param {object} msgData  `msg.system`
 */
export function assertConfidenceState(assert, msgData) {
  assert.ok(msgData.confidence.score >= 0, "confidence.score should be non-negative");
  assert.equal(msgData.confidence.used, 0, "confidence.used should be 0 initially");
}

/**
 * Call `useConfidence` twice and assert the incremental state changes,
 * ending with `allowed = false` once both points are spent.
 *
 * @param {object} assert
 * @param {object} msg    Full chat-message document.
 * @param {Actor}  actor
 */
export async function testConfidenceUsage(assert, msg, actor) {
  await msg.system.useConfidence(actor._id);
  assert.equal(msg.system.confidence.used, 1, "confidence.used should be 1");
  assert.equal(msg.system.confidence.allowed, true, "confidence should still be allowed");
  await msg.system.useConfidence(actor._id);
  assert.equal(msg.system.confidence.used, 2, "confidence.used should be 2");
  assert.equal(msg.system.confidence.allowed, false, "confidence should not be allowed");
}

/**
 * Assert a non-botched roll with confidence available, then spend one
 * confidence point and re-check the incremental state.
 *
 * @param {object}  assert
 * @param {object}  msg             Full chat-message document.
 * @param {Actor}   actor
 * @param {number}  [expectedModifier]  When given, also asserts `msg.rolls[0].modifier`.
 */
export async function assertSuccessWithConfidence(assert, msg, actor, expectedModifier) {
  assert.equal(msg.system.impact.applied, false, "impact should not be applied yet");
  assert.equal(msg.system.confidence.allowed, true, "confidence should be allowed");
  if (expectedModifier !== undefined) {
    assert.equal(msg.rolls[0].modifier, expectedModifier, "modifier not correct");
  }
  const initialUsed = msg.system.confidence.used;
  await msg.system.useConfidence(actor._id);
  assert.equal(
    msg.system.confidence.used,
    initialUsed + 1,
    `confidence.used should be ${initialUsed + 1}`
  );
  const expectedAllowed = msg.system.confidence.used < msg.system.confidence.score;
  assert.equal(
    msg.system.confidence.allowed,
    expectedAllowed,
    `confidence ${expectedAllowed ? "should" : "should not"} be allowed ` +
      `(${msg.system.confidence.used}/${msg.system.confidence.score} used)`
  );
}

// ─── Impact defaults ──────────────────────────────────────────────────────────

/**
 * Assert that a roll has zero impact in all three default fields.
 *
 * @param {object} assert
 * @param {object} msgData  `msg.system`
 */
export function assertImpactDefaults(assert, msgData) {
  assert.equal(msgData.impact.fatigueLevelsLost, 0, "fatigue levels lost should be 0");
  assert.equal(msgData.impact.fatigueLevelsPending, 0, "fatigue levels pending should be 0");
  assert.equal(msgData.impact.woundGravity, 0, "wound gravity should be 0");
}

/**
 * Assert fatigue and wound-impact fields for a resolved spell roll.
 *
 * @param {object} assert
 * @param {object} msgData
 * @param {number} originalFatigue   Fatigue value captured **before** the roll.
 * @param {Actor}  actor
 * @param {object} [options={}]
 * @param {number}  [options.fatigueLost=0]
 * @param {number}  [options.fatiguePending=0]
 * @param {number}  [options.fatigueFail=0]
 * @param {number}  [options.woundGravity=0]
 * @param {number}  [options.fatigueChanged]  Defaults to `fatigueLost`.
 */
export function assertStandardImpact(assert, msgData, originalFatigue, actor, options = {}) {
  const {
    fatigueLost = 0,
    fatiguePending = 0,
    fatigueFail = 0,
    woundGravity = 0,
    fatigueChanged = fatigueLost
  } = options;

  assert.equal(
    msgData.impact.fatigueLevelsLost,
    fatigueLost,
    `fatigue levels lost should be ${fatigueLost}`
  );
  assert.equal(
    msgData.impact.fatigueLevelsPending,
    fatiguePending,
    `fatigue levels pending should be ${fatiguePending}`
  );
  if (fatigueFail !== undefined) {
    assert.equal(
      msgData.impact.fatigueLevelsFail,
      fatigueFail,
      `fatigue levels on fail should be ${fatigueFail}`
    );
  }
  assert.equal(
    msgData.impact.woundGravity,
    woundGravity,
    `wound gravity should be ${woundGravity}`
  );
  assert.equal(
    originalFatigue + fatigueChanged,
    actor.system.fatigueCurrent,
    "fatigue should have changed"
  );
}

// ─── Botch behaviour ──────────────────────────────────────────────────────────

/**
 * Assert the complete botch outcome.
 *
 * Provide `options.actor` and `options.initialWarping` to additionally check
 * that warping points increased and, when botch count reaches the threshold,
 * that the twilight stage advanced.
 *
 * @param {object} assert
 * @param {object} roll     `msg.rolls[0]`
 * @param {object} msgData  `msg.system`
 * @param {object} [options={}]
 * @param {Actor}  [options.actor]
 * @param {number} [options.initialWarping]
 */
export function assertBotchBehavior(assert, roll, msgData, options = {}) {
  const { actor, initialWarping } = options;

  assert.equal(msgData.failedRoll(), true, "failed roll incorrect");
  assert.equal(msgData.impact.applied, true, "should be applied");
  assert.equal(roll.total, 0, "botched");
  assert.equal(msgData.roll.botchCheck, true, "Check for botch missing");
  assert.equal(msgData.roll.botches, roll.botches, "Wrong number of botches");
  assert.equal(msgData.confidence.allowed, false, "confidence is not allowed");

  if (actor !== undefined && initialWarping !== undefined) {
    assert.equal(
      initialWarping + roll.botches,
      actor.system.warping.points,
      "warping should have increased"
    );
    if (roll.botches >= TWILIGHT_BOTCH_THRESHOLD) {
      assert.equal(actor.system.twilight.stage, TWILIGHT_STAGES.PENDING_STRENGTH);
    }
  }
}

// ─── Magic-specific ───────────────────────────────────────────────────────────

/**
 * Assert the presence and shape of the `magic` payload inside a chat message.
 *
 * @param {object}  assert
 * @param {object}  msg          Full chat-message document.
 * @param {boolean} [isRitual=false]
 */
export function assertMagicDataStructure(assert, msg, isRitual = false) {
  assert.ok(msg.system.magic, "magic data missing");
  assert.ok(msg.system.magic.caster, "caster missing");
  assert.equal(msg.system.magic.caster.form, null, "caster form is not null");
  assert.ok(msg.system.magic.caster.penetration, "penetration missing");
  assert.equal(
    msg.system.magic.caster.penetration.total,
    msg.system.magic.caster.penetration.score * msg.system.magic.caster.penetration.multiplier,
    "penetration total incorrect"
  );
  assert.ok(Array.isArray(msg.system.magic.targets), "targets should be array");
  assert.equal(msg.system.magic.ritual, isRitual, `ritual should be ${isRitual}`);
  assert.equal(msg.system.magic.realm, "magic", "realm is not magic");
  assert.ok(VALID_REALMS.includes(msg.system.magic.realm), "realm value unexpected");
}
