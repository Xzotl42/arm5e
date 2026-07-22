import { InhabitantSchema } from "../schemas/inhabitantSchema.js";

const SOURCE_ACTOR_TYPES = new Set(["player", "npc", "beast"]);
const RELEVANT_ACTOR_PATHS = [
  "name",
  "img",
  "system.description.born.value",
  "system.characteristics.com.value",
  "system.characteristics.pre.value"
];

let linkedInhabitants = new Map();
let indexIsDirty = true;
const pendingActorIds = new Set();
let drainScheduled = false;
let drainRunning = false;

function rebuildIndex() {
  const nextIndex = new Map();

  for (const covenant of game.actors.filter((actor) => actor.type === "covenant")) {
    for (const item of covenant.items) {
      if (item.type !== "inhabitant" || !item.system.actorId) continue;
      const links = nextIndex.get(item.system.actorId) ?? [];
      links.push({ covenantId: covenant.id, itemId: item.id });
      nextIndex.set(item.system.actorId, links);
    }
  }

  linkedInhabitants = nextIndex;
  indexIsDirty = false;
}

function buildChangedUpdate(item, actor) {
  const desired = {
    name: actor.name,
    img: actor.img,
    ...Object.fromEntries(
      Object.entries(InhabitantSchema.getLinkedSyncData(item.system, actor)).map(([key, value]) => [
        `system.${key}`,
        value
      ])
    )
  };
  const update = { _id: item.id };

  for (const [path, value] of Object.entries(desired)) {
    const current = foundry.utils.getProperty(item, path);
    if (!Object.is(current, value)) update[path] = value;
  }

  return Object.keys(update).length > 1 ? update : null;
}

async function syncActor(actor) {
  if (!actor || !SOURCE_ACTOR_TYPES.has(actor.type)) return;

  const activeGM = game.users.activeGM;
  if (activeGM && !activeGM.isSelf) return;

  if (indexIsDirty) rebuildIndex();
  const links = linkedInhabitants.get(actor.id);
  if (!links?.length) return;

  const updatesByCovenant = new Map();
  for (const { covenantId, itemId } of links) {
    const covenant = game.actors.get(covenantId);
    if (!covenant?.isOwner) continue;

    const item = covenant.items.get(itemId);
    if (!item || item.type !== "inhabitant" || item.system.actorId !== actor.id) {
      indexIsDirty = true;
      continue;
    }

    const update = buildChangedUpdate(item, actor);
    if (!update) continue;
    const updates = updatesByCovenant.get(covenant) ?? [];
    updates.push(update);
    updatesByCovenant.set(covenant, updates);
  }

  for (const [covenant, updates] of updatesByCovenant) {
    await covenant.updateEmbeddedDocuments("Item", updates, {
      render: false,
      arm5eLinkedInhabitantSync: true
    });
    covenant.sheet?.render(false);
  }
}

async function drainQueue() {
  if (drainRunning) return;
  drainScheduled = false;
  drainRunning = true;

  try {
    while (pendingActorIds.size) {
      const actorIds = [...pendingActorIds];
      pendingActorIds.clear();
      for (const actorId of actorIds) {
        try {
          await syncActor(game.actors.get(actorId));
        } catch (error) {
          console.error("ArM5e | Failed to synchronize linked covenant inhabitants", error);
        }
      }
    }
  } finally {
    drainRunning = false;
    if (pendingActorIds.size) scheduleDrain();
  }
}

function scheduleDrain() {
  if (drainScheduled || drainRunning) return;
  drainScheduled = true;
  queueMicrotask(() => void drainQueue());
}

export function requestLinkedInhabitantSync(actor) {
  if (!actor || !SOURCE_ACTOR_TYPES.has(actor.type)) return;
  pendingActorIds.add(actor.id);
  scheduleDrain();
}

export function invalidateLinkedInhabitantIndex() {
  indexIsDirty = true;
}

function hasChangeAtPath(changes, path) {
  const changedPaths = Object.keys(foundry.utils.flattenObject(changes));
  return changedPaths.some(
    (changedPath) =>
      changedPath === path || changedPath.startsWith(`${path}.`) || path.startsWith(`${changedPath}.`)
  );
}

export function hasRelevantLinkedInhabitantActorChange(changes) {
  return RELEVANT_ACTOR_PATHS.some((path) => hasChangeAtPath(changes, path));
}

export function hasLinkedInhabitantActorIdChange(changes) {
  return hasChangeAtPath(changes, "system.actorId");
}
