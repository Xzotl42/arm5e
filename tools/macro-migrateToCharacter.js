/**
 * Ars Magica 5e — Migrate Actors to "character" Type
 * =====================================================
 * Paste this entire script into a FoundryVTT macro (type: Script) and run it.
 *
 * What it does:
 *  - Finds all world actors with deprecated types: player, npc, beast
 *  - Creates a [BACKUP] copy of each actor before migrating
 *  - Converts each actor to the unified "character" type, deriving the
 *    correct subtype (magus, companion, grog, entity, mundane, beast) and
 *    role (player, npc) from the existing charType.value
 *  - Preserves all items, Active Effects, and system data
 *  - Reports results in the console and via notifications
 *
 * Safe to run multiple times — already-migrated actors (type === "character")
 * are skipped.
 */
(async () => {
  if (!game.user.isGM) {
    ui.notifications.error("Only GMs can run the character migration.");
    return;
  }

  // ── Import helpers from the system ─────────────────────────────────────────
  const { migrateActorToCharacter } = await import("systems/arm5e/module/migration.js");

  const DEPRECATED_TYPES = ["player", "npc", "beast"];
  const candidates = game.actors.contents.filter((a) => DEPRECATED_TYPES.includes(a.type));

  if (candidates.length === 0) {
    ui.notifications.info("No deprecated-type actors found — nothing to migrate.");
    return;
  }

  // ── Confirm dialog ──────────────────────────────────────────────────────────
  const confirmed = await Dialog.confirm({
    title: "Migrate Actors to Character Type",
    content: `
      <p>This will migrate <strong>${candidates.length}</strong> actor(s) of types
      <em>player, npc, beast</em> to the unified <strong>character</strong> type.</p>
      <p>A <strong>[BACKUP]</strong> copy of each actor will be created first.</p>
      <p>Existing actors and their items will be updated in place.</p>
      <p>Are you sure?</p>
    `,
    yes: () => true,
    no: () => false,
    defaultYes: false
  });

  if (!confirmed) {
    ui.notifications.info("Migration cancelled.");
    return;
  }

  // ── Run migration ───────────────────────────────────────────────────────────
  let successCount = 0;
  let failCount = 0;
  const allWarnings = [];

  ui.notifications.info(`Migrating ${candidates.length} actor(s)… please wait.`, {
    permanent: false
  });

  for (const actor of candidates) {
    try {
      const { backup, updated, warnings } = await migrateActorToCharacter(actor);
      successCount++;
      if (warnings.length > 0) {
        allWarnings.push(...warnings);
      }
      console.log(
        `[arm5e migration] "${actor.name}": ${actor.type} → character ` +
          `(subtype: ${updated.system.subtype}, role: ${updated.system.role})${
            backup ? `, backup: "${backup.name}"` : ""
          }`
      );
    } catch (err) {
      failCount++;
      console.error(`[arm5e migration] Failed to migrate "${actor.name}":`, err);
    }
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  const summary = `Migration complete: ${successCount} succeeded, ${failCount} failed.`;
  console.log(`[arm5e migration] ${summary}`);

  if (failCount > 0) {
    ui.notifications.error(`${summary} Check F12 console for errors.`, { permanent: true });
  } else {
    ui.notifications.info(summary, { permanent: true });
  }

  if (allWarnings.length > 0) {
    console.warn(`[arm5e migration] ${allWarnings.length} warning(s):\n${allWarnings.join("\n")}`);
    ui.notifications.warn(
      `${allWarnings.length} Active Effect warning(s) — check F12 console for details.`,
      { permanent: true }
    );
  }
})();
