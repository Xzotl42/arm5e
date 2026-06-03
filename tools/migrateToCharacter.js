/**
 * tools/migrateToCharacter.js
 *
 * Standalone world migration script for the arm5e system.
 * Migrates all world actors with deprecated types (player, npc, beast) to
 * the new unified "character" actor type.
 *
 * Run from the FoundryVTT browser console (or as a macro) after loading the world:
 *
 *   import("systems/arm5e/tools/migrateToCharacter.js").then(m => m.runMigration());
 *
 * Or paste the IIFE below into the console:
 *
 *   (async () => { const m = await import("systems/arm5e/tools/migrateToCharacter.js"); await m.runMigration(); })();
 */

import { migrateActorToCharacter } from "../module/migration.js";

const DEPRECATED_TYPES = ["player", "npc", "beast"];

/**
 * Run the full world actor migration to the "character" type.
 *
 * @param {object} [options]
 * @param {boolean} [options.dryRun=false]  If true, only report what would be migrated, don't actually migrate.
 * @returns {Promise<void>}
 */
export async function runMigration({ dryRun = false } = {}) {
  if (!game.user.isGM) {
    ui.notifications.error("arm5e | migrateToCharacter: Only GMs can run this migration.");
    return;
  }

  const candidates = game.actors.contents.filter((a) => DEPRECATED_TYPES.includes(a.type));

  if (candidates.length === 0) {
    ui.notifications.info(
      "arm5e | migrateToCharacter: No deprecated-type actors found. Nothing to migrate."
    );
    return;
  }

  const mode = dryRun ? "[DRY RUN] " : "";
  console.log(`arm5e | ${mode}migrateToCharacter: Found ${candidates.length} actor(s) to migrate.`);
  ui.notifications.info(
    `arm5e | ${mode}Starting character type migration for ${candidates.length} actor(s)…`,
    { permanent: false }
  );

  let successCount = 0;
  let failCount = 0;
  const allWarnings = [];

  for (const actor of candidates) {
    try {
      console.log(`arm5e | ${mode}Migrating "${actor.name}" (${actor.type})…`);
      if (!dryRun) {
        const { backup, updated, warnings } = await migrateActorToCharacter(actor);
        if (warnings.length > 0) {
          allWarnings.push(...warnings);
          console.warn(`arm5e | Warnings for "${actor.name}":`, warnings);
        }
        console.log(
          `arm5e | Migrated "${updated.name}" → subtype: ${updated.system.subtype}, role: ${
            updated.system.role
          }${backup ? ` (backup: "${backup.name}")` : ""}`
        );
      }
      successCount++;
    } catch (err) {
      failCount++;
      console.error(`arm5e | Failed to migrate "${actor.name}": ${err.message}`, err);
    }
  }

  const summary = `${mode}Migration complete: ${successCount} succeeded, ${failCount} failed.`;
  console.log(`arm5e | ${summary}`);
  if (failCount > 0) {
    ui.notifications.error(`arm5e | ${summary} Check the console for errors.`, { permanent: true });
  } else {
    ui.notifications.info(`arm5e | ${summary}`, { permanent: false });
  }

  if (allWarnings.length > 0) {
    console.warn(`arm5e | Migration warnings (${allWarnings.length}):\n${allWarnings.join("\n")}`);
    ui.notifications.warn(
      `arm5e | ${allWarnings.length} warning(s) during migration. Check the console (F12) for details.`,
      { permanent: true }
    );
  }
}
