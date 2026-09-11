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
  return { preventDefault: () => {}, ...extra };
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
 * sheet. Calls the V2 `progressControl` action with a synthetic event.
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
        subaction: "add",
        default: defaultItem,
        secondary: "false",
        teacherscore
      }
    }
  };

  await entry.sheet.constructor.progressControl.call(entry.sheet, event, event.currentTarget);
  return entry.system.progress[type];
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

// ─── Actor Link Verification Helpers ──────────────────────────────────────────

/**
 * Verify that a character is linked to a specific covenant.
 * Checks both the character's covenant field and the covenant's embedded inhabitant.
 *
 * @param {Actor} character        Player/NPC/Beast actor
 * @param {Actor} expectedCovenant The covenant that should be linked
 * @param {object} assert          Test assertion object
 */
export function verifyCharacterCovenantLink(character, expectedCovenant, assert) {
  assert.equal(
    character.system.covenant.actorId,
    expectedCovenant.id,
    `Character should be linked to covenant ${expectedCovenant.id}`
  );
  assert.equal(
    character.system.covenant.linked,
    true,
    "Character covenant link should be marked as linked"
  );
  assert.equal(
    character.system.covenant.value,
    expectedCovenant.name,
    "Character covenant value should match covenant name"
  );

  // Verify embedded inhabitant item exists in covenant
  const inhabitant = expectedCovenant.items.find(
    (i) => i.type === "inhabitant" && i.system.actorId === character.id
  );
  assert.isDefined(
    inhabitant,
    `Covenant should have inhabitant item for character ${character.id}`
  );
}

/**
 * Verify that a laboratory is linked to a specific covenant.
 * Checks both the lab's covenant field and the covenant's embedded labCovenant.
 *
 * @param {Actor} laboratory       Laboratory actor
 * @param {Actor} expectedCovenant The covenant that should be linked
 * @param {object} assert          Test assertion object
 */
export function verifyLabCovenantLink(laboratory, expectedCovenant, assert) {
  assert.equal(
    laboratory.system.covenant.actorId,
    expectedCovenant.id,
    `Lab should be linked to covenant ${expectedCovenant.id}`
  );
  assert.equal(
    laboratory.system.covenant.linked,
    true,
    "Lab covenant link should be marked as linked"
  );
  assert.equal(
    laboratory.system.covenant.value,
    expectedCovenant.name,
    "Lab covenant value should match covenant name"
  );

  // Verify embedded labCovenant item exists in covenant
  const labCov = expectedCovenant.items.find(
    (i) => i.type === "labCovenant" && i.system.sanctumId === laboratory.id
  );
  assert.isDefined(labCov, `Covenant should have labCovenant item for lab ${laboratory.id}`);
}

/**
 * Verify that a laboratory and character are bidirectionally linked as owner/sanctum.
 * Checks both directions: lab.system.owner ↔ character.system.sanctum
 *
 * @param {Actor} laboratory       Laboratory actor
 * @param {Actor} expectedCharacter The character that should be the owner
 * @param {object} assert          Test assertion object
 */
export function verifyLabOwnerLink(laboratory, expectedCharacter, assert) {
  // Lab → Character direction
  assert.equal(
    laboratory.system.owner.actorId,
    expectedCharacter.id,
    `Lab owner should be character ${expectedCharacter.id}`
  );
  assert.equal(laboratory.system.owner.linked, true, "Lab owner link should be marked as linked");
  assert.equal(
    laboratory.system.owner.value,
    expectedCharacter.name,
    "Lab owner value should match character name"
  );

  // Character → Lab direction (reverse)
  assert.equal(
    expectedCharacter.system.sanctum.actorId,
    laboratory.id,
    `Character sanctum should be lab ${laboratory.id}`
  );
  assert.equal(
    expectedCharacter.system.sanctum.linked,
    true,
    "Character sanctum link should be marked as linked"
  );
  assert.equal(
    expectedCharacter.system.sanctum.value,
    laboratory.name,
    "Character sanctum value should match lab name"
  );
}

/**
 * Verify that an actor link has been cleared (no actor linked).
 *
 * @param {Actor}  actor           The actor whose link should be cleared
 * @param {string} fieldPath       Path to the link field (e.g., "system.covenant")
 * @param {object} assert          Test assertion object
 */
export function verifyLinkCleared(actor, fieldPath, assert) {
  const [root, ...rest] = fieldPath.split(".");
  let field = actor[root];
  for (const key of rest) {
    field = field[key];
  }

  assert.equal(field.actorId, null, `${fieldPath}.actorId should be null after clearing link`);
  assert.equal(field.linked, false, `${fieldPath}.linked should be false after clearing link`);
  assert.equal(field.value, "", `${fieldPath}.value should be empty after clearing link`);
}

/**
 * Verify that a covenant does NOT have an inhabitant for a specific character.
 * Used to verify old inhabitants are deleted when a character changes covenants.
 *
 * @param {Actor}  covenant     The covenant to check
 * @param {string} characterId  The character ID that should NOT be in inhabitants
 * @param {object} assert       Test assertion object
 */
export function verifyCovenantDoesNotHaveInhabitant(covenant, characterId, assert) {
  const inhabitant = covenant.items.find(
    (i) => i.type === "inhabitant" && i.system.actorId === characterId
  );
  assert.isUndefined(
    inhabitant,
    `Covenant should not have inhabitant item for character ${characterId}`
  );
}

/**
 * Verify that a covenant does NOT have a labCovenant for a specific lab.
 * Used to verify old labCovenants are deleted when a lab changes covenants.
 *
 * @param {Actor}  covenant The covenant to check
 * @param {string} labId    The lab ID that should NOT be in labCovenants
 * @param {object} assert   Test assertion object
 */
export function verifyCovenantDoesNotHaveLabCovenant(covenant, labId, assert) {
  const labCov = covenant.items.find(
    (i) => i.type === "labCovenant" && i.system.sanctumId === labId
  );
  assert.isUndefined(labCov, `Covenant should not have labCovenant item for lab ${labId}`);
}

/**
 * Verify that a covenant HAS an inhabitant for a specific character.
 * Optionally checks the inhabitant category.
 *
 * @param {Actor}  covenant       The covenant to check
 * @param {string} characterId    The character ID that should be in inhabitants
 * @param {string} [category]     Optional category to verify (magi/companion/mundane/beast)
 * @param {object} assert         Test assertion object
 */
export function verifyCovenantHasInhabitant(covenant, characterId, category, assert) {
  const inhabitant = covenant.items.find(
    (i) => i.type === "inhabitant" && i.system.actorId === characterId
  );
  assert.isDefined(inhabitant, `Covenant should have inhabitant item for character ${characterId}`);

  if (category) {
    assert.equal(
      inhabitant.system.category,
      category,
      `Inhabitant should have category ${category}`
    );
  }
}

/**
 * Verify that a lab planning has been reset.
 * Used to verify cascade effect when lab's covenant or owner changes.
 *
 * @param {Actor}  laboratory Laboratory actor
 * @param {object} assert     Test assertion object
 */
export function verifyLabPlanningReset(laboratory, assert) {
  assert.equal(
    laboratory.flags?.arm5e?.planning?.type,
    "none",
    "Lab planning.type should be reset to 'none' after link change"
  );
}
