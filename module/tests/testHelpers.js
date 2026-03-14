/**
 * Shared test utility helpers for arm5e test suites.
 *
 * Provides centralised versions of patterns previously copy-pasted across
 * individual test files:
 *   - fake DOM-event factories
 *   - dice-so-nice guard
 *   - standard active-effect setup for a magus
 *   - actor-state snapshot
 *   - linked-token creation
 *   - diary-template builder
 *   - unified addProgressItem
 *   - close-all-windows helper
 */

// ─── Fake DOM events ──────────────────────────────────────────────────────────

/**
 * Create a minimal fake DOM event with a `preventDefault` no-op.
 * Pass `extra` to add additional stubs such as `stopPropagation`.
 *
 * @param {object} [extra={}]  Additional properties merged into the event object.
 * @returns {{ preventDefault: Function, [key: string]: any }}
 */
export function makeEvent(extra = {}) {
  return Object.assign({ preventDefault: () => {} }, extra);
}

// ─── Dice-so-nice guard ───────────────────────────────────────────────────────

/**
 * Returns `true` (and emits a warning) when the `dice-so-nice` module is
 * active.  Use at the top of a batch registration so tests that depend on
 * deterministic dice are skipped gracefully:
 *
 * ```js
 * if (guardDiceRolls()) return;
 * ```
 *
 * @returns {boolean}
 */
export function guardDiceRolls() {
  if (game.modules.get("dice-so-nice")?.active) {
    ui.notifications.warn("Disable dice-so-nice to test dice rolls");
    return true;
  }
  return false;
}

// ─── Standard active-effect setup ────────────────────────────────────────────

/**
 * Apply the three standard active effects used in most roll/diary test suites:
 *   • Affinity Corpus  — affinity on `co`
 *   • Puissant Muto    — art bonus on `mu`
 *   • Deficient Perdo  — deficiency on `pe`
 *
 * @param {Actor}  magus                    A player-type actor document.
 * @param {number} [affinityCoeff=1.5]      Multiplier stored on the Affinity effect.
 */
export async function applyStandardMagusEffects(magus, affinityCoeff = 1.5) {
  await magus.addActiveEffect("Affinity Corpus", "affinity", "co", affinityCoeff, null);
  await magus.addActiveEffect("Puissant Muto", "art", "mu", 3, null);
  await magus.addActiveEffect("Deficient Perdo", "deficiency", "pe", undefined, null);
}

// ─── Actor state snapshot ─────────────────────────────────────────────────────

/**
 * Capture a lightweight snapshot of actor state before a roll so that
 * assertions can compare against the values recorded here.
 *
 * @param {Actor} actor
 * @returns {{ fatigueCurrent: number, warpingPoints: number }}
 */
export function captureActorState(actor) {
  return {
    fatigueCurrent: actor.system.fatigueCurrent,
    warpingPoints: actor.system.warping.points
  };
}

// ─── Token helpers ────────────────────────────────────────────────────────────

/**
 * Place an actor on the currently-viewed scene as an actor-linked token.
 * Returns `null` silently when no scene is viewed.
 *
 * @param {Actor}  actor
 * @param {number} [x=1000]
 * @param {number} [y=1000]
 * @returns {Promise<TokenDocument|null>}
 */
export async function createLinkedToken(actor, x = 1000, y = 1000) {
  if (!game.scenes.viewed) return null;
  const data = await actor.getTokenDocument({ x, y });
  data.actorLink = true;
  const [token] = await canvas.scene.createEmbeddedDocuments("Token", [data]);
  await token.update({ actorLink: true });
  return token;
}

// ─── Diary entry helpers ──────────────────────────────────────────────────────

/**
 * Return a fresh plain-object diary-entry template suitable for passing to
 * `actor.createEmbeddedDocuments("Item", [template])`.
 *
 * @param {number} [sourceQuality=5]
 * @param {number} [duration=1]
 * @returns {object}
 */
export function makeDiaryTemplate(sourceQuality = 5, duration = 1) {
  return {
    name: "Placeholder",
    type: "diaryEntry",
    system: {
      done: false,
      cappedGain: false,
      sourceQuality,
      activity: "none",
      progress: {
        abilities: [],
        arts: [],
        spells: [],
        newSpells: []
      },
      optionKey: "standard",
      duration,
      description: "Some description",
      externalIds: []
    }
  };
}

/**
 * Simulate a user clicking the "add progress item" button on a diary-entry
 * sheet.  Calls `entry.sheet._onProgressControl` with a synthetic event.
 *
 * The `teacherScoreOrSheetData` parameter is flexible:
 *   - `undefined`  → reads `entry.system.teacher.score` directly.
 *   - `number`     → uses the number as the raw teacher score (falls back to
 *                    `entry.system.teacher.score` when the value is falsy).
 *   - `object`     → reads `.system.teacherScore` from the sheet-data object.
 *
 * @param {Item}                           entry
 * @param {string}                         type
 * @param {string}                         defaultItem
 * @param {number|object|undefined}        [teacherScoreOrSheetData]
 */
export async function addProgressItem(entry, type, defaultItem, teacherScoreOrSheetData) {
  let teacherscore;
  if (teacherScoreOrSheetData === undefined) {
    teacherscore = entry.system.teacher.score;
  } else if (typeof teacherScoreOrSheetData === "number") {
    teacherscore = teacherScoreOrSheetData || entry.system.teacher.score;
  } else {
    teacherscore = teacherScoreOrSheetData.system.teacherScore;
  }

  const event = {
    preventDefault: () => {},
    currentTarget: {
      dataset: {
        type,
        action: "add",
        default: defaultItem,
        secondary: "false",
        teacherscore
      }
    }
  };

  return await entry.sheet._onProgressControl(event);
}

// ─── Window cleanup ───────────────────────────────────────────────────────────

/**
 * Close every currently-open `ui.windows` app that is an instance of the
 * given class.  Useful in `afterEach` hooks to prevent window leaks between
 * tests.
 *
 * @param {Function} AppClass  Constructor to match against.
 */
export function closeAllWindows(AppClass) {
  for (const app of Object.values(ui.windows)) {
    if (app instanceof AppClass) app.close();
  }
}
