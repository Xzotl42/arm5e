/**
 * Actor-sheet test suites — one batch per actor type.
 *
 * Each suite:
 *   • Navigates to every primary tab and asserts the tab link becomes active.
 *   • Navigates to every subtab within each primary tab.
 *   • For each registered action, finds the first matching [data-action] element
 *     in the live sheet DOM and calls the handler.  Tests that have no matching
 *     element (conditional / item-dependant UI not present) are skipped gracefully.
 *
 * Actor setup
 *   PC      — getMagus() → charType "magus", arts/lab tabs visible.
 *   NPC     — charType "magusNPC" so arts/lab tabs are included.
 *   Beast   — plain beast with a weapon and a quality item.
 *   Covenant — plain covenant (no extra items required).
 */

import { sleep } from "../tools/tools.js";
import { getMagus } from "./testData.js";
import { makeEvent } from "./testHelpers.js";

// ── Shared helpers ─────────────────────────────────────────────────────────────

/**
 * Activate a tab group entry and wait for any triggered re-render to settle.
 * @param {ActorSheetV2} sheet
 * @param {string} tabId
 * @param {string} [group="primary"]
 */
async function goTab(sheet, tabId, group = "primary") {
  sheet.changeTab(tabId, group);
  await sleep(200);
}

/**
 * Find the first element in the live sheet DOM with the given data-action value.
 * @param {ActorSheetV2} sheet
 * @param {string} name
 * @returns {Element|null}
 */
function findAction(sheet, name) {
  return sheet.element?.querySelector(`[data-action="${name}"]`) ?? null;
}

/**
 * Get a queryable root element from a Foundry app instance.
 * Supports both AppV1-style wrapped elements and AppV2 HTMLElement roots.
 * @param {Application} app
 * @returns {HTMLElement|null}
 */
function getAppElement(app) {
  const element = app?.element;
  if (!element) return null;
  if (element instanceof HTMLElement) return element;
  if (element[0] instanceof HTMLElement) return element[0];
  return null;
}

/**
 * Detect whether an application is an ARM5e-managed dialog.
 * @param {Application|ApplicationV2} app
 * @returns {boolean}
 */
function isArm5eDialogApp(app) {
  const root = getAppElement(app);
  if (!root) return false;
  return (
    root.classList.contains("arm5e-dialog") ||
    root.classList.contains("arm5e-roll") ||
    root.classList.contains("arm5e-confirm") ||
    root.classList.contains("arm5e-prompt")
  );
}

/**
 * Close dialogs opened by action tests without touching sheet/quench/core UI.
 * Primary path uses explicit sheet._pendingRollDialog when available.
 * Fallback closes ui.activeWindow only if it is an ARM5e dialog.
 * @param {ActorSheetV2} keepOpen
 */
async function closeExtraWindows(keepOpen) {
  // Explicit handle published by sheet._roll() for RollWindow.
  const pendingRoll = keepOpen?._pendingRollDialog;
  if (pendingRoll) {
    try {
      await pendingRoll.close({ force: true });
    } catch {
      // ignore
    }
    await sleep(100);
  }

  // Explicit handles published by customDialogAsync({ owner: sheet, ... }).
  const pendingDialogs = keepOpen?._pendingDialogs;
  if (pendingDialogs?.size) {
    for (const dialog of Array.from(pendingDialogs)) {
      try {
        await dialog.close({ force: true });
      } catch {
        // ignore
      }
    }
    await sleep(100);
  }

  // Fallback for other ARM5e dialogs (confirmation/prompt/custom).
  let active = ui.activeWindow;
  while (active && active !== keepOpen && isArm5eDialogApp(active)) {
    try {
      await active.close({ force: true });
    } catch {
      // ignore
    }
    await sleep(100);
    active = ui.activeWindow;
  }
}

/**
 * Run a sheet action while automatically closing any modal or blocking dialog
 * it opens, allowing actions that await dialog resolution to settle.
 * @param {ActorSheetV2} sheet
 * @param {Function} fn
 * @param {Event} event
 * @param {Element} el
 * @returns {Promise<unknown>}
 */
async function invokeActionWithDialogCleanup(sheet, fn, event, el) {
  const actionName = el?.dataset?.action ?? fn?.name ?? "unknown";
  const timeoutMs = 10000;
  const pollMs = 100;
  const deadline = Date.now() + timeoutMs;
  let settled = false;
  const actionPromise = Promise.resolve()
    .then(() => fn.call(sheet, event, el))
    .finally(() => {
      settled = true;
    });

  // Some actions await modal confirmation dialogs. Close any extra windows
  // while the action is still pending so the returned promise can resolve.
  while (!settled && Date.now() < deadline) {
    await sleep(pollMs);
    await closeExtraWindows(sheet);
  }

  if (!settled) {
    // Ensure any late rejection does not surface as unhandled if we timeout.
    actionPromise.catch(() => {});
    await closeExtraWindows(sheet);
    throw new Error(`Timed out waiting for action '${actionName}' to settle`);
  }

  const result = await actionPromise;
  await closeExtraWindows(sheet);
  return result;
}

// ── Static action lists ────────────────────────────────────────────────────────
// Declared statically so for-loops inside registerBatch() run synchronously at
// registration time (before before() has executed), while the it() callbacks
// themselves are async and see the fully-initialised sheet through the closure.

/** Actions from ArM5eActorSheetV2 (base sheet). */
const BASE_ACTIONS = [
  "toggleHidden",
  "toggleBookTopic",
  "toggleAbilityCategory",
  "toggleSectionCollapse",
  "roll",
  "calculateDamage",
  "soakDamage",
  "powerUse",
  "itemAdd",
  "itemCreate",
  "itemEdit",
  "itemView",
  "itemClone",
  "itemDelete",
  "itemDeleteConfirm",
  "openLinkedActor"
];

/** Actions from Arm5eCharacterActorSheetV2 + base, covering PC / NPC / Beast. */
const CHARACTER_ACTIONS = [
  ...BASE_ACTIONS,
  "actorProfile",
  "characterSchedule",
  "rollAging",
  "recoveryStart",
  "twilightEpisode",
  "scheduleAging",
  "actorRest",
  "addFatigue",
  "removeFatigue",
  "addWound",
  "woundEdit",
  "bookEdit",
  "planReading",
  "visStudy",
  "studyLabtext",
  "increaseTech",
  "decreaseTech",
  "increaseForm",
  "decreaseForm",
  "increaseScore",
  "decreaseScore",
  "prepCreate",
  "prepDelete",
  "viewMedicalHistory",
  "migrateActor",
  "removeCreationMode",
  "clearConfidencePrompt"
];

/** Actions from ArM5eCovenantActorSheetV2 + base. */
const COVENANT_ACTIONS = [...BASE_ACTIONS, "removeLinkedItem", "harvestItem", "toggleInhabitants"];

// ── Tab-tree declarations ──────────────────────────────────────────────────────

/**
 * Tab tree for PC and NPC sheets (identical structure; different charType controls
 * which conditional tabs are actually rendered).
 * Each entry: { id, subtabs?: { group, ids[] } }
 */
const CHARACTER_TABS = [
  { id: "description", subtabs: { group: "desc-secondary", ids: ["desc", "wounds"] } },
  { id: "abilities", subtabs: { group: "abilities-secondary", ids: ["abilities", "vandf"] } },
  { id: "powers" }, // conditional — only rendered when actor.system.features.powers is true
  { id: "arts", subtabs: { group: "arts-secondary", ids: ["arts-subtab", "casting-total"] } },
  { id: "laboratory", subtabs: { group: "lab-secondary", ids: ["lab", "lab-total"] } },
  {
    id: "tradition",
    subtabs: { group: "tradition-secondary", ids: ["tradition-subtab", "tradition-config"] }
  },
  { id: "inventory", subtabs: { group: "inventory-secondary", ids: ["inventory", "library"] } },
  { id: "diary" },
  { id: "effects" },
  { id: "config" } // only rendered for GMs
];

/** Tab tree for Beast sheets. */
const BEAST_TABS = [
  { id: "description", subtabs: { group: "desc-secondary", ids: ["desc", "wounds"] } },
  { id: "abilities", subtabs: { group: "abilities-secondary", ids: ["abilities", "vandf"] } },
  { id: "whereabouts" },
  { id: "effects" }
];

/** Tab tree for Covenant sheets (no subtabs). */
const COVENANT_TABS = [
  { id: "attributes" },
  { id: "habitants" },
  { id: "posessions" },
  { id: "economics" },
  { id: "library" },
  { id: "diary" },
  { id: "effects" }
];

// ── Suite factory ──────────────────────────────────────────────────────────────

/**
 * Register a Quench batch that covers tab navigation and action smoke-tests for
 * one actor-sheet type.
 *
 * @param {object}   quench
 * @param {object}   cfg
 * @param {string}   cfg.batchId        Unique batch ID (e.g. "Ars-Sheet-PC").
 * @param {string}   cfg.displayName    Label shown in the Quench UI.
 * @param {Array}    cfg.tabs           Tab tree ({ id, subtabs? }).
 * @param {string[]} cfg.actions        Static list of action names.
 * @param {Function} cfg.createActor    Async factory: () => Promise<Actor>.
 */
function registerActorSheetSuite(quench, { batchId, displayName, tabs, actions, createActor }) {
  quench.registerBatch(
    batchId,
    (context) => {
      const { describe, it, assert, before, after, afterEach } = context;

      let actor;
      let sheet;

      // Minimal fake event that satisfies most action guards.
      const event = makeEvent({ stopPropagation: () => {} });

      before(async function () {
        this.timeout(60000);
        actor = await createActor();
        sheet = actor.sheet;
        sheet.render(true);
        await sleep(500); // allow initial PARTS render to complete
      });

      after(async function () {
        try {
          await sheet?.close();
        } catch {
          /* ignore */
        }
        try {
          await actor?.delete();
        } catch {
          /* ignore */
        }
      });

      afterEach(async function () {
        // Close any dialogs / apps opened by action invocations.
        await closeExtraWindows(sheet);
      });

      // ── Tab navigation tests ───────────────────────────────────────────────

      describe("Tab navigation", function () {
        this.timeout(30000);

        for (const tab of tabs) {
          // ── Primary tab ──────────────────────────────────────────────────
          it(`Tab: ${tab.id}`, async function () {
            try {
              // Some tabs are conditional (powers, config, arts, …). Check that
              // the nav link element exists before trying to activate it.
              const navLink = sheet.element?.querySelector(
                `[data-group="primary"][data-tab="${tab.id}"]`
              );
              if (!navLink) {
                assert.ok(true, `${tab.id} not rendered for this actor state — skipped`);
                return;
              }

              await goTab(sheet, tab.id, "primary");

              // After activation, the link should carry the "active" class.
              const activeLink = sheet.element?.querySelector(
                `[data-group="primary"][data-tab="${tab.id}"].active`
              );
              assert.ok(activeLink, `${tab.id} tab link is active after navigation`);
            } catch (err) {
              console.error(`[Sheet tab test] Tab ${tab.id}:`, err);
              assert.ok(false, String(err));
            }
          });

          // ── Subtabs (if any) ─────────────────────────────────────────────
          if (tab.subtabs) {
            for (const subId of tab.subtabs.ids) {
              it(`Subtab: ${tab.id} › ${subId}`, async function () {
                try {
                  // Guard: parent primary tab must be rendered.
                  const navLink = sheet.element?.querySelector(
                    `[data-group="primary"][data-tab="${tab.id}"]`
                  );
                  if (!navLink) {
                    assert.ok(true, `${tab.id} not rendered — subtab ${subId} skipped`);
                    return;
                  }

                  // Navigate to primary tab first, then subtab.
                  await goTab(sheet, tab.id, "primary");
                  await goTab(sheet, subId, tab.subtabs.group);

                  // The subtab nav link must be active.
                  const activeSubLink = sheet.element?.querySelector(
                    `[data-group="${tab.subtabs.group}"][data-tab="${subId}"].active`
                  );
                  assert.ok(
                    activeSubLink,
                    `subtab ${subId} is active within group "${tab.subtabs.group}"`
                  );
                } catch (err) {
                  console.error(`[Sheet tab test] Subtab ${tab.id} › ${subId}:`, err);
                  assert.ok(false, String(err));
                }
              });
            }
          }
        }
      });

      // ── Action smoke tests ─────────────────────────────────────────────────

      describe("Actions", function () {
        this.timeout(30000);

        for (const actionName of actions) {
          it(`Action: ${actionName}`, async function () {
            try {
              // Look up the handler from the merged options at runtime (sheet is
              // defined here since before() has already run).
              const fn = sheet?.options?.actions?.[actionName];
              if (typeof fn !== "function") {
                assert.ok(true, `${actionName} not registered on this sheet — skipped`);
                return;
              }

              // Find a real DOM element carrying this data-action attribute.
              // Using a live DOM element means target.closest() works correctly
              // and target.dataset already has any context values set by the template.
              const el = findAction(sheet, actionName);
              if (!el) {
                assert.ok(
                  true,
                  `${actionName} has no [data-action] element in current DOM — skipped`
                );
                return;
              }

              await invokeActionWithDialogCleanup(sheet, fn, event, el);
              assert.ok(true, `${actionName} completed without throwing`);
            } catch (err) {
              console.error(`[Sheet action test] ${actionName}:`, err);
              assert.ok(false, String(err));
            }
          });
        }
      });
    },
    { displayName }
  );
}

// ── Per-sheet suite registrations ─────────────────────────────────────────────

/**
 * PC Actor Sheet — uses a fully-equipped magus (charType "magus") so that the
 * arts, laboratory, and inventory tabs are all present.
 */
export function registerPCSheetTests(quench) {
  registerActorSheetSuite(quench, {
    batchId: "Ars-Sheet-PC",
    displayName: "ARS : PC Actor Sheet",
    tabs: CHARACTER_TABS,
    actions: CHARACTER_ACTIONS,
    createActor: () => getMagus("SheetTestPC")
  });
}

/**
 * NPC Actor Sheet — created with charType "magusNPC" so the arts and laboratory
 * primary tabs are rendered.  Basic combat item added so item-related actions
 * have at least one element to target.
 */
export function registerNPCSheetTests(quench) {
  registerActorSheetSuite(quench, {
    batchId: "Ars-Sheet-NPC",
    displayName: "ARS : NPC Actor Sheet",
    tabs: CHARACTER_TABS,
    actions: CHARACTER_ACTIONS,
    createActor: async () => {
      const actor = await Actor.create({
        name: "SheetTestNPC",
        type: "npc",
        system: { charType: { value: "magusNPC" } }
      });
      await actor.createEmbeddedDocuments("Item", [
        {
          name: "Athletics",
          type: "ability",
          system: { key: "athletics", xp: 30, defaultChaAb: "dex" }
        },
        { name: "Short Sword", type: "weapon", system: {} },
        { name: "Leather", type: "armor", system: {} }
      ]);
      return actor;
    }
  });
}

/**
 * Beast Actor Sheet — plain beast with a weapon and a quality item so the
 * abilities and description tabs have something to render.
 */
export function registerBeastSheetTests(quench) {
  registerActorSheetSuite(quench, {
    batchId: "Ars-Sheet-Beast",
    displayName: "ARS : Beast Actor Sheet",
    tabs: BEAST_TABS,
    actions: CHARACTER_ACTIONS,
    createActor: async () => {
      const actor = await Actor.create({ name: "SheetTestBeast", type: "beast" });
      await actor.createEmbeddedDocuments("Item", [
        { name: "Claws", type: "weapon", system: {} },
        { name: "Stealth", type: "quality", system: {} }
      ]);
      return actor;
    }
  });
}

/**
 * Covenant Actor Sheet — plain covenant; no extra items required because the
 * basic covenant tabs (attributes, habitants, economics, …) render without items.
 */
export function registerCovenantSheetTests(quench) {
  registerActorSheetSuite(quench, {
    batchId: "Ars-Sheet-Covenant",
    displayName: "ARS : Covenant Actor Sheet",
    tabs: COVENANT_TABS,
    actions: COVENANT_ACTIONS,
    createActor: () => Actor.create({ name: "SheetTestCovenant", type: "covenant" })
  });
}
