import { log } from "./tools.js";

export async function migration(originalVersion) {
  ui.notifications.info(
    `Applying ARM5E System Migration for version ${game.system.version}. Please be patient and do not close your game or shut down your server.`,
    {
      permanent: true
    }
  );

  console.log("Starting migration...");

  // Migrate World Actors
  const actorsUpdates = [];
  for (let a of game.actors.contents) {
    try {
      if (a.type == "magus") {
        a.type = "player";
      }
      const updateData = await migrateActorData(a);

      if (!isEmpty(updateData)) {
        console.log(`Migrating Actor document ${a.name}`);
        updateData._id = a._id;
        actorsUpdates.push(foundry.utils.expandObject(updateData));
      }

      // const cleanData = cleanActorData(a)
      // if (!isEmpty(cleanData)) {
      //     console.log(`Cleaning up Actor entity ${a.name}`);
      //     a.system = cleanData.system;
      // }
    } catch (err) {
      err.message = `Failed system migration for Actor ${a.name}: ${err.message}`;
      console.error(err);
    }
  }
  if (actorsUpdates.length > 0) {
    await Actor.updateDocuments(actorsUpdates, { diff: true });
  }

  // Migrate Invalid actors

  const invalidActorIds = Array.from(game.actors.invalidDocumentIds);
  const invalidActorsUpdates = [];
  for (const invalidId of invalidActorIds) {
    try {
      const rawData = foundry.utils.deepClone(game.actors._source.find(d => d._id == invalidId));
      console.log(`Migrating invalid Actor document: ${rawData.name}`);
      // let invalidActor = game.actors.getInvalid(invalidId);
      const updateData = await migrateActorData(rawData);
      // let update = await invalidActor.update(updateData, { diff: true });
      console.log(`Migrated invalid Actor document: ${rawData.name}`);

      updateData._id = invalidId;
      invalidActorsUpdates.push(foundry.utils.expandObject(updateData));
    } catch (err) {
      err.message = `Failed system migration for invalid Actor ${invalidId}: ${err.message}`;
      console.error(err);
    }
  }
  if (invalidActorsUpdates.length > 0) {
    console.log(`Migrating ${invalidActorsUpdates.length} invalid Actor document(s)`);
    await Actor.updateDocuments(invalidActorsUpdates, { diff: false });
  }
  // Migrate World Items
  const itemsUpdates = [];
  for (let i of game.items) {
    try {
      const updateData = await migrateItemData(i);
      if (!foundry.utils.isEmpty(updateData)) {
        console.log(`Migrating Item document ${i.name}`);

        updateData._id = i._id;
        itemsUpdates.push(foundry.utils.expandObject(updateData));
      }
      console.log(`Migrated Item document ${i.name}`);

      // const cleanData = cleanItemData(i)
      // if (!isEmpty(cleanData)) {
      //     console.log(`Cleaning up Item document ${i.name}`);
      //     i.system = cleanData.system;
      // }
    } catch (err) {
      err.message = `Failed system migration for Item ${i.name}: ${err.message}`;
      console.error(err);
    }
  }
  if (itemsUpdates.length > 0) {
    await Item.updateDocuments(itemsUpdates, { diff: true });
  }
  // Migrate Invalid items

  const invalidItemIds = Array.from(game.items.invalidDocumentIds);
  const invalidItemsUpdates = [];
  for (const invalidId of invalidItemIds) {
    try {
      const rawData = foundry.utils.deepClone(game.items._source.find(d => d._id == invalidId));
      console.log(`Migrating invalid item document: ${rawData.name}`);
      const updateData = await migrateItemData(rawData);
      updateData._id = invalidId;
      invalidItemsUpdates.push(foundry.utils.expandObject(updateData));
    } catch (err) {
      err.message = `Failed system migration for invalid item ${invalidId}: ${err.message}`;
      console.error(err);
    }
  }
  if (invalidItemsUpdates.length > 0) {
    await Item.updateDocuments(invalidItemsUpdates, { diff: false });
  }

  // Migrate Actor Override Tokens
  for (let s of game.scenes) {
    try {
      const updateData = await migrateSceneData(s);
      if (!foundry.utils.isEmpty(updateData)) {
        console.log(`Migrating Scene entity ${s.name}`);
        await s.update(updateData, { enforceTypes: false });
        // If we do not do this, then synthetic token actors remain in cache
        // with the un-updated actor.
        s.tokens.forEach(t => (t._actor = null));
      }
    } catch (err) {
      err.message = `Failed system migration for Scene ${s.name}: ${err.message}`;
      console.error(err);
    }
  }

  // [DEV] Uncomment below to migrate system compendiums
  // for (let p of game.packs) {
  //   if (p.metadata.packageName !== "arm5e") continue;
  //   if (!["Actor", "Item", "Scene"].includes(p.documentName)) continue;
  //   await migrateCompendium(p);
  // }

  // Migrate World Compendium Packs
  for (let p of game.packs) {
    if (p.metadata.packageName !== "world") continue;
    if (!["Actor", "Item", "Scene"].includes(p.documentName)) continue;
    await migrateCompendium(p);
  }

  // Set the migration as complete
  game.settings.set("arm5e", "systemMigrationVersion", game.system.version);
  ui.notifications.info(
    `Ars Magica 5e System Migration to version ${game.system.version} completed!`,
    {
      permanent: true
    }
  );
}

/**
 * Apply migration rules to all Entities within a single Compendium pack
 * @param pack
 * @return {Promise}
 */
export const migrateCompendium = async function(pack) {
  const documentName = pack.documentName;
  if (!["Actor", "Item", "Scene"].includes(documentName)) return;

  // Unlock the pack for editing
  const wasLocked = pack.locked;
  await pack.configure({
    locked: false
  });

  // Begin by requesting server-side data model migration and get the migrated content
  await pack.migrate();
  const documents = await pack.getDocuments();

  // Iterate over compendium entries - applying fine-tuned migration functions
  for (let doc of documents) {
    // skip Compendium Folders documents
    if (doc.name.startsWith("#[CF")) continue;
    let updateData = {};
    try {
      switch (documentName) {
        case "Actor":
          updateData = await migrateActorData(doc);
          break;
        case "Item":
          updateData = await migrateItemData(doc);
          break;
        case "Scene":
          // TODO enable after fix
          // updateData = await migrateSceneData(doc);
          break;
      }

      // Save the entry, if data was changed
      if (foundry.utils.isEmpty(updateData)) continue;
      await doc.update(updateData);
      console.log(`Migrated ${documentName} entity ${doc.name} in Compendium ${pack.collection}`);
    } catch (err) {
      // Handle migration failures
      err.message = `Failed arm5e system migration for entity ${doc.name} in pack ${pack.collection}: ${err.message}`;
      console.error(err);
    }
  }

  // Apply the original locked status for the pack
  await pack.configure({
    locked: wasLocked
  });
  console.log(`Migrated all ${documentName} entities from Compendium ${pack.collection}`);
};

/**
 * Migrate a single Scene document to incorporate changes to the data model of it's actor data overrides
 * Return an Object of updateData to be applied
 * @param {object} scene            The Scene data to Update
 * @param {object} [migrationData]  Additional data to perform the migration
 * @returns {object}                The updateData to apply
 */
export const migrateSceneData = async function(scene, migrationData) {
  if (scene?.flags?.world) {
    let updateData = {};
    const aura = scene.flags.world[`aura_${scene._id}`];
    const type = scene.flags.world[`aura_type_${scene._id}`];
    if (aura && !type) {
      log(false, "Missing aura type");
      // TODOV10 check where flags are for scenes
      updateData[`flags.world.aura_type_${scene._id}`] = 1;
    }
    return updateData;
  }

  const tokens = await Promise.all(
    scene.tokens.map(async token => {
      const t = token.toObject();
      const update = {};

      if (!t.actorId || t.actorLink) {
        t.actorData = {};
      } else if (!game.actors.has(t.actorId)) {
        t.actorId = null;
        t.actorData = {};
      } else if (!t.actorLink) {
        const actor = duplicate(t.actorData);
        actor.type = token.actor?.type;

        if (actor.system) {
          actor.system.charType = { value: token.actor?.system?.charType?.value };
        }

        const update = await migrateActorData(actor);
        ["items", "effects"].forEach(embeddedName => {
          if (!update[embeddedName]?.length) return;
          const updates = new Map(update[embeddedName].map(u => [u._id, u]));
          t.actorData[embeddedName].forEach(original => {
            const update = updates.get(original._id);
            if (update) foundry.utils.mergeObject(original, update);
          });
          delete update[embeddedName];
        });

        foundry.utils.mergeObject(t.actorData, update);
      }
      return t;
    })
  );
  return { tokens };
};

/**
 * Migrate a single Actor entity to incorporate latest data model changes
 * Return an Object of updateData to be applied
 * @param {object} actor    The actor data object to update
 * @return {Object}         The updateData to apply
 */
export const migrateActorData = async function(actorDoc) {
  let actor = {};
  if (actorDoc instanceof CONFIG.Actor.documentClass) {
    actor = actorDoc._source;
  } else {
    actor = actorDoc;
  }
  if (CONFIG.Actor.systemDataModels[actor.type]) {
    return CONFIG.Actor.systemDataModels[actor.type].migrate(actor);
  }
  const updateData = {};
  if (!actor?.flags?.arm5e) {
    updateData["flags.arm5e"] = {};
  } else if (actor?.flags.arm5e.filters) {
    updateData["flags.arm5e.-=filters"] = null;
  }

  // token with barely anything to migrate
  if (actor.system == undefined) {
    return updateData;
  }

  if (actor.type == "laboratory") {
    // fix recursive problem with laboratory owner
    if (!(actor.system.owner.value instanceof String)) {
      updateData["system.owner.value"] = "";
    }

    // Update data to official names
    if (actor.system.salubrity) {
      updateData["system.health"] = actor.system.salubrity;
      updateData["system.-=salubrity"] = null;
    }
    if (actor.system.improvement) {
      updateData["system.refinement"] = actor.system.improvement;
      updateData["system.-=improvement"] = null;
    }
    if (actor.system.security) {
      updateData["system.safety"] = actor.system.security;
      updateData["system.-=security"] = null;
    }
    if (actor.system.maintenance) {
      updateData["system.upkeep"] = actor.system.maintenance;
      updateData["system.-=maintenance"] = null;
    }
  }

  if (actor.type == "covenant") {
    if (actor.system.currentYear != undefined) {
      updateData["system.datetime.year"] = actor.system.currentYear;
      updateData["system.datetime.season"] = "spring";
      updateData["system.-=currentYear"] = null;
    }
  }

  if (actor.type == "player" || actor.type == "npc" || actor.type == "beast") {
    if (actor.system.mightsFam) {
      updateData["system.powersFam"] = actor.system.mightsFam;
      updateData["system.-=mightsFam"] = null;
    }

    if (actor.system.mights) {
      updateData["system.powers"] = actor.system.mights;
      updateData["system.-=mights"] = null;
    }

    if (actor.system.soak) {
      updateData["system.vitals.soa.value"] = actor.system.soak.value;
      updateData["system.-=soak"] = null;
    }

    if (actor.system.size) {
      updateData["system.vitals.siz.value"] = actor.system.size.value;
      updateData["system.-=size"] = null;
    }

    // remove redundant data
    if (actor.system.houses != undefined) {
      updateData["system.-=houses"] = null;
    }

    if (actor.system.year?.value != undefined) {
      updateData["system.datetime.year"] = actor.system.year.value;
      updateData["system.-=year"] = null;
    }
    if (actor.system.season?.value != undefined) {
      updateData["system.datetime.season"] = actor.system?.season.value ?? "spring";
      updateData["system.-=season"] = null;
    }

    if (actor.system?.roll != undefined) {
      updateData["system.-=roll"] = null;
    }
    if (actor.system.decrepitude == undefined) {
      actor.system.decrepitude = {};
    }

    if (actor.system.warping == undefined) {
      actor.system.warping = {};
    }

    if (actor.system.realmAlignment == undefined) {
      actor.system.realmAlignment = 0;
    }
    // remove garbage stuff if it exists

    updateData["system.-=str"] = null;
    updateData["system.-=sta"] = null;
    updateData["system.-=int"] = null;
    updateData["system.-=per"] = null;
    updateData["system.-=dex"] = null;
    updateData["system.-=qik"] = null;
    updateData["system.-=cha"] = null;
    updateData["system.-=com"] = null;

    if (actor.system.pendingXP != undefined && actor.system.pendingXP > 0) {
      ChatMessage.create({
        content:
          "<b>MIGRATION NOTIFICATION</b><br/>" +
          `The field "Pending experience" has been repurposed for the new long term activities feature. ` +
          `This is a one time notification that <b>the character ${actor.name} had ${actor.system.pendingXP} xps pending.</b>`
      });
      updateData["system.-=pendingXP"] = null;
    }
  } else {
    if (actor.system.roll) {
      updateData["system.-=roll"] = null;
    }
  }

  if (actor.type == "player" || actor.type == "npc") {
    if (actor.system.charType.value !== "entity") {
      if (actor.system.decrepitude.score != undefined) {
        let exp = (actor.system.decrepitude.score * (actor.system.decrepitude.score + 1) * 5) / 2;
        if (actor.system.decrepitude.points >= 5 * (actor.system.decrepitude.score + 1)) {
          // if the experience is bigger than the needed for next level, ignore it
          updateData["system.decrepitude.points"] = exp;
        } else {
          // compute normally
          updateData["system.decrepitude.points"] = exp + actor.system.decrepitude.points;
        }
        updateData["system.decrepitude.-=score"] = null;
      }

      if (actor.system.warping.score != undefined) {
        let exp =
          (Number(actor.system.warping.score) * (Number(actor.system.warping.score) + 1) * 5) / 2;
        if (actor.system.warping.points >= 5 * (Number(actor.system.warping.score) + 1)) {
          // if the experience is bigger than the needed for next level, ignore it
          updateData["system.warping.points"] = exp;
        } else {
          // compute normally
          updateData["system.warping.points"] = exp + actor.system.warping.points;
        }
        updateData["system.warping.-=score"] = null;
      }
    } else {
      // entity
      // migrate might type to realm Alignment
      if (actor.system?.might?.realm != undefined) {
        updateData["system.realmAlignment"] =
          CONFIG.ARM5E.realmsExt[actor.system.might.realm].value;
        updateData["system.might.-=realm"] = null;
        updateData["system.might.-=type"] = null;
      } else if (actor.system?.might?.type != undefined) {
        updateData["system.realmAlignment"] = CONFIG.ARM5E.realmsExt[actor.system.might.type].value;
        updateData["system.might.-=realm"] = null;
        updateData["system.might.-=type"] = null;
      }
    }

    // if (actor.system.realmAlignment && typeof actor.system.realmAlignment === "string") {
    if (actor.system.realmAlignment && Number.isNaN(actor.system.realmAlignment)) {
      updateData["system.realmAlignment"] =
        CONFIG.ARM5E.realmsExt[actor.system.realmAlignment].value;
    }

    if (actor.system.charType.value == "magus" || actor.system.charType.value == "magusNPC") {
      updateData["system.realmAlignment"] = CONFIG.ARM5E.realmsExt.magic.value;
      if (actor.system?.sanctum?.value === undefined) {
        let sanctum = {
          value: actor.system.sanctum
        };
        updateData["system.sanctum"] = sanctum;
      }

      // if (actor.system?.laboratory != undefined) {
      //   updateData["system.laboratory.longevityRitual.labTotal"] = 0;
      //   updateData["system.laboratory.longevityRitual.modifier"] = 0;
      //   updateData["system.laboratory.longevityRitual.twilightScars"] = "";
      // }

      if (actor.system?.familiar?.characteristicsFam != undefined) {
        updateData["system.familiar.characteristicsFam.int"] = {
          value: actor.system.familiar.characteristicsFam.int.value
        };
        updateData["system.familiar.characteristicsFam.per"] = {
          value: actor.system.familiar.characteristicsFam.per.value
        };
        updateData["system.familiar.characteristicsFam.str"] = {
          value: actor.system.familiar.characteristicsFam.str.value
        };
        updateData["system.familiar.characteristicsFam.sta"] = {
          value: actor.system.familiar.characteristicsFam.sta.value
        };
        updateData["system.familiar.characteristicsFam.pre"] = {
          value: actor.system.familiar.characteristicsFam.pre.value
        };
        updateData["system.familiar.characteristicsFam.com"] = {
          value: actor.system.familiar.characteristicsFam.com.value
        };
        updateData["system.familiar.characteristicsFam.dex"] = {
          value: actor.system.familiar.characteristicsFam.dex.value
        };
        updateData["system.familiar.characteristicsFam.qik"] = {
          value: actor.system.familiar.characteristicsFam.qik.value
        };
      }
      //
      // migrate arts xp
      //
      if (actor.system?.arts?.techniques != undefined) {
        for (const [key, technique] of Object.entries(actor.system.arts.techniques)) {
          if (technique.experienceNextLevel != undefined) {
            // if the experience is equal or bigger than the xp for this score, use it as total xp
            let exp = (technique.score * (technique.score + 1)) / 2;
            if (technique.experience >= exp) {
              updateData["system.arts.techniques." + key + ".xp"] = technique.experience;
            } else if (technique.experience >= technique.score + 1) {
              // if the experience is bigger than the neeeded for next level, ignore it
              updateData["system.arts.techniques." + key + ".xp"] = exp;
            } else {
              // compute normally
              updateData["system.arts.techniques." + key + ".xp"] = exp + technique.experience;
            }

            updateData["system.-=experience"] = null;
            updateData["system.-=score"] = null;
            updateData["system.arts.techniques." + key + ".-=experienceNextLevel"] = null;
          }
        }
      }
      if (actor.system?.arts?.forms != undefined) {
        for (const [key, form] of Object.entries(actor.system.arts.forms)) {
          if (form.experienceNextLevel != undefined) {
            // if the experience is equal or bigger than the xp for this score, use it as total xp
            let exp = (form.score * (form.score + 1)) / 2;
            if (form.experience >= exp) {
              updateData["system.arts.forms." + key + ".xp"] = form.experience;
            } else if (form.experience >= form.score + 1) {
              // if the experience is bigger than the neeeded for next level, ignore it
              updateData["system.arts.forms." + key + ".xp"] = exp;
            } else {
              // compute normally
              updateData["system.arts.forms." + key + ".xp"] = exp + form.experience;
            }

            updateData["system.forms." + key + ".-=experience"] = null;
            updateData["system.forms." + key + "-=score"] = null;
            updateData["system.arts.forms." + key + ".-=experienceNextLevel"] = null;
          }
        }
      }
    }
  }

  if (actor.type == "player" || actor.type == "npc" || actor.type == "beast") {
    if (actor.effects && actor.effects.length > 0) {
      log(false, `Migrating effects of ${actor.name}`);
      const effects = actor.effects.reduce((arr, e) => {
        // Migrate effects
        const effectData = e instanceof CONFIG.ActiveEffect.documentClass ? e.toObject() : e;
        let effectUpdate = migrateActiveEffectData(effectData);
        if (!isEmpty(effectUpdate)) {
          // Update the effect
          effectUpdate._id = effectData._id;
          arr.push(expandObject(effectUpdate));
        }
        return arr;
      }, []);
      if (effects.length > 0) {
        log(false, effects);
        updateData.effects = effects;
      }
    }
    let currentFatigue = 0;
    if (actor.system.fatigue) {
      for (const [key, fat] of Object.entries(actor.system.fatigue)) {
        if (fat.level != undefined) {
          if (fat.level.value) {
            currentFatigue++;
          }
          updateData[`system.fatigue.${key}.-=level`] = null;
        }
      }
      if (currentFatigue > 0 && actor.system.fatigueCurrent == 0) {
        updateData["system.fatigueCurrent"] = currentFatigue;
      }
    }
  }

  // Migrate Owned Items
  if (!actorDoc.items) return updateData;
  let items = [];
  if (actorDoc.items.size !== 0) {
    for (let i of actorDoc.items) {
      // Migrate the Owned Item
      try {
        let itemUpdate = await migrateItemData(i);
        // Update the Owned Item
        if (!isEmpty(itemUpdate)) {
          itemUpdate._id = i._id;
          items.push(itemUpdate);
        }
      } catch (err) {
        err.message = `Failed system migration for owned item ${i._id}: ${err.message}`;
        console.error(err);
      }
    }
  }
  // Fix invalid owned items
  // Actors from Compendiums don't have the invalidDocumentIds field
  if (actorDoc.items.invalidDocumentIds !== undefined) {
    const invalidItemIds = Array.from(actorDoc.items.invalidDocumentIds);
    let invalidItemsUpdates = [];
    for (let invalidItemId of invalidItemIds) {
      try {
        const rawData = foundry.utils.deepClone(
          actorDoc.items._source.find(d => d._id == invalidItemId)
        );
        let invalidItem = actorDoc.items.getInvalid(invalidItemId);
        const itemUpdate = await migrateItemData(invalidItem);
        if (!isEmpty(itemUpdate)) {
          invalidItemsUpdates.push({ _id: invalidItemId, ...itemUpdate });
        }

        console.log(`Migrating invalid owned item document: ${rawData.name}`);
      } catch (err) {
        err.message = `Failed system migration for invalid item ${invalidItemId}: ${err.message}`;
        console.error(err);
      }
    }
    if (invalidItemsUpdates.length > 0) {
      items = items.concat(invalidItemsUpdates);
      // await Item.updateDocuments(invalidItemsUpdates, { diff: false, parent: actorDoc });
    }
  }
  if (items.length > 0) {
    updateData.items = items;
  }

  return updateData;
};

export const migrateActiveEffectData = async function(effectData) {
  let effectUpdate = {};
  // update flags

  // Update from 1.3.1
  if (effectData.flags.type != undefined) {
    effectUpdate["flags.arm5e.type"] = [effectData.flags.type];
    effectUpdate["flags.-=type"] = null;
  }
  if (effectData.flags.subtype != undefined) {
    effectUpdate["flags.arm5e.subtype"] = [effectData.flags.subtype];
    effectUpdate["flags.-=subtype"] = null;
  }
  if (effectData.flags.value != undefined) {
    effectUpdate["flags.arm5e.value"] = [effectData.flags.value];
    effectUpdate["flags.-=value"] = null;
  }

  // Fix mess active effect V1
  if (effectData.flags?.arm5e.type != undefined) {
    if (!(effectData.flags.arm5e.type instanceof Array)) {
      if (effectData.flags.arm5e.type === "spellCasting") {
        effectData.flags.arm5e.type = "spellcasting";
      }
      effectUpdate["flags.arm5e.type"] = [effectData.flags.arm5e.type];
    } else {
      let idx = 0;
      for (const name of effectData.flags.arm5e.type.values()) {
        if (name === "spellCasting") {
          effectUpdate["flags.arm5e.type." + idx] = "spellcasting";
        }
        idx++;
      }
    }
  }

  if (
    effectData.flags?.arm5e.subtype != undefined &&
    !(effectData.flags.arm5e.subtype instanceof Array)
  ) {
    effectUpdate["flags.arm5e.subtype"] = [effectData.flags.arm5e.subtype];
  }

  if (effectData.flags?.arm5e?.option == undefined) {
    let optionArray = Array(effectData.changes.length).fill(null);
    effectUpdate["flags.arm5e.option"] = optionArray;
  }

  return effectUpdate;
};

export const migrateItemData = async function(item) {
  let itemData = {};
  if (item instanceof CONFIG.Item.documentClass) {
    itemData = item._source;
  } else {
    itemData = item;
  }
  if (CONFIG.Item.systemDataModels[item.type]) {
    return CONFIG.Item.systemDataModels[item.type].migrate(itemData);
  }
  const updateData = {};
  if (_isMagicalItem(itemData)) {
    if (itemData.type != "baseEffect") {
      if (
        itemData.system.duration.value === undefined ||
        CONFIG.ARM5E.magic.durations[itemData.system.duration.value] === undefined
      ) {
        // console.log(`Guessing duration: ${itemData.system.duration}`);
        updateData["system.duration.value"] = _guessDuration(
          itemData.name,
          itemData.system.duration
        );
      }
      if (itemData.type == "laboratoryText") {
        // fixing season key
        if (!Object.keys(CONFIG.ARM5E.seasons).includes(itemData.system.season)) {
          if (Object.keys(CONFIG.ARM5E.seasons).includes(itemData.system.season.toLowerCase())) {
            updateData["system.season"] = itemData.system.season.toLowerCase();
          } else {
            updateData["system.season"] = "spring";
          }
        }
      }
      if (
        itemData.system.range.value === undefined ||
        CONFIG.ARM5E.magic.ranges[itemData.system.range.value] === undefined
      ) {
        // console.log(`Guessing range: ${itemData.system.range}`);
        updateData["system.range.value"] = _guessRange(itemData.name, itemData.system.range);
      }
      if (
        itemData.system.target.value === undefined ||
        CONFIG.ARM5E.magic.targets[itemData.system.target.value] === undefined
      ) {
        // console.log(`Guessing target: ${itemData.system.target}`);
        updateData["system.target.value"] = _guessTarget(itemData.name, itemData.system.target);
      }
    }

    if (itemData.system.technique.value === "") {
      updateData["system.technique.value"] = "cr";
    }
    if (itemData.system.form.value === "") {
      updateData["system.form.value"] = "an";
    }
    // remove redundant data
    if (itemData.system.techniques != undefined) {
      updateData["system.-=techniques"] = null;
    }
    if (itemData.system.forms != undefined) {
      updateData["system.-=forms"] = null;
    }
    if (itemData.system["technique-requisites"] != undefined) {
      updateData["system.-=technique-requisites"] = null;
    }
    if (itemData.system["form-requisites"] != undefined) {
      updateData["system.-=form-requisites"] = null;
    }
    if (itemData.system["technique-requisite"] != undefined) {
      if (
        itemData.system["technique-requisite"].value != "n-a" &&
        itemData.system["technique-requisite"].value != ""
      ) {
        updateData["system.technique-req." + itemData.system["technique-requisite"].value] = true;
      }
      updateData["system.-=technique-requisite"] = null;
    }

    if (itemData.system["form-requisite"] != undefined) {
      if (
        itemData.system["form-requisite"].value != "n-a" &&
        itemData.system["form-requisite"].value != ""
      ) {
        updateData["system.form-req." + itemData.system["form-requisite"].value] = true;
      }
      updateData["system.-=form-requisite"] = null;
    }

    // temporary : removal of authorship in spell, it will only be present in lab texts
    if (itemData.type == "spell") {
      if (itemData.system.author) {
        updateData["system.-=author"] = null;
      }
      if (itemData.system.year) {
        updateData["system.-=year"] = null;
      }
      if (itemData.system.season) {
        updateData["system.-=season"] = null;
      }
      if (itemData.system.language) {
        updateData["system.-=language"] = null;
      }
      if (itemData.system.exp) {
        let exp = ((itemData.system.mastery * (itemData.system.mastery + 1)) / 2) * 5;
        if (itemData.system.exp >= exp) {
          updateData["system.xp"] = itemData.system.exp;
        } else if (itemData.system.exp >= (itemData.system.mastery + 1) * 5) {
          // if the experience is bigger than the neeeded for next level, ignore it
          updateData["system.xp"] = exp;
        } else {
          // compute normally
          updateData["system.xp"] = exp + itemData.system.exp;
        }
        // TODO: to be uncommented when we are sure the new system works
        // updateData["system.-=mastery"] = null;
        updateData["system.-=exp"] = null;
      }
    }
  }
  // Fix type of Item
  if (itemData.type == "visSourcesCovenant" || itemData.type == "visStockCovenant") {
    // V10 datamodel cleanup (2.0.0)
    if (itemData.system.art.value !== undefined) {
      updateData["system.art"] = itemData.system.art.value;
    }

    // get ride of form of vis field
    if (itemData.type == "vis") {
      if (
        itemData.system.form != undefined &&
        itemData.system.form !== "Physical form of the raw vis." &&
        itemData.system.form !== ""
      ) {
        updateData["system.description"] = itemData.system.description + itemData.system.form;
        updateData["system.-=form"] = null;
      }
    }
  } else if (itemData.type == "mundaneBook") {
    updateData["type"] = "book";
    updateData["name"] = itemData.name;

    // if (itemData.system.topic === undefined) {
    //   let topic = {};
    //   if (itemData.system.key) {
    //     topic.art = null;
    //     topic.key = itemData.system.key;
    //     topic.option = itemData.system.option;
    //     topic.spellName = null;
    //     topic.category = "ability";
    //   } else {
    //     // missing data, reset to default
    //     topic.art = null;
    //     topic.key = "awareness";
    //     topic.option = "";
    //     topic.spellName = null;
    //     topic.category = "ability";
    //   }

    //   if (itemData.system.type.value !== undefined) {
    //     if (itemData.system.type.value == "summa") {
    //       topic.type = "Summa";
    //     } else if (itemData.system.type.value == "tract") {
    //       topic.type = "Tractatus";
    //     } else {
    //       topic.type = itemData.system.type.value;
    //     }
    //   } else {
    //     if (itemData.system.type == "summa") {
    //       topic.type = "Summa";
    //     } else if (itemData.system.type == "tract") {
    //       topic.type = "Tractatus";
    //     }
    //   }

    //   updateData["system.topic"] = topic;
    // } else {
    //   let topic = {
    //     art: null,
    //     key: "awareness",
    //     option: "",
    //     spellName: null,
    //     category: "ability",
    //     type: "Summa"
    //   };
    //   updateData["system.topic"] = topic;
    // }
    // // V10 datamodel cleanup (2.0.0)

    // if (!Object.keys(CONFIG.ARM5E.seasons).includes(itemData.system.season)) {
    //   if (Object.keys(CONFIG.ARM5E.seasons).includes(itemData.system.season.toLowerCase())) {
    //     updateData["system.season"] = itemData.system.season.toLowerCase();
    //   } else {
    //     updateData["system.season"] = "spring";
    //   }
    // }
    if (itemData.system.ability != undefined) {
      // the field ability is no longer used,
      // appending the value to the description.
      updateData["system.description"] =
        itemData.system.description +
        `<p>MIGRATION: value of ability field: ${itemData.system.ability}</p>`;
      // updateData["system.-=ability"] = null;
    }
    if (itemData.system.types) {
      updateData["system.-=types"] = null;
    }
  } else if (itemData.type == "might") {
    updateData["type"] = "power";
  }

  if (itemData.type == "mightFamiliar") {
    updateData["type"] = "powerFamiliar";
  }

  if (itemData.effects.length > 0) {
    log(false, `Migrating effects of ${itemData.name}`);
    const effects = itemData.effects.reduce((arr, e) => {
      // Migrate effects
      const effectData = e instanceof CONFIG.ActiveEffect.documentClass ? e.toObject() : e;
      let effectUpdate = migrateActiveEffectData(effectData);
      if (!isEmpty(effectUpdate)) {
        // Update the effect
        effectUpdate._id = effectData._id;
        arr.push(expandObject(effectUpdate));
      }
      return arr;
    }, []);
    if (effects.length > 0) {
      updateData.effects = effects;
    }
  }
  // if (itemData.effects) {
  //   log(false, `Effects of items: ${itemData.effects}`);
  // }

  return updateData;
};

function _isMagicalItem(itemData) {
  switch (itemData.type) {
    case "spell":
    case "magicalEffect":
    case "enchantment":
    case "baseEffect":
      return true;
    case "laboratoryText": {
      return itemData.system.type === "spell";
    }
    default:
      return false;
  }
}

/**
 * Scrub an Actor's system data, removing all keys which are not explicitly defined in the system template
 * @param {Object} actor    The data object for an Actor
 * @return {Object}             The scrubbed Actor data
 */
function cleanActorData(actor) {
  // Scrub system data
  const model = game.system.model.Actor[actor.type];
  actor.system = filterObject(actor.system, model);

  // Return the scrubbed data
  return actor;
}

/**
 * Scrub an Item's system data, removing all keys which are not explicitly defined in the system template
 * @param {Object} item    The data object for an Item
 * @return {Object}             The scrubbed Item data
 */
function cleanItemData(item) {
  // Scrub system data
  const model = game.system.model.Item[item.type];
  item.system = filterObject(item.system, model);

  // Return the scrubbed data
  return item;
}

// TODO remove once all magic Items are switched to V10 datamodel

// Unfortunaltly, since the range was a free input field, it has to be guessed
function _guessRange(name, value) {
  if (value && value !== "") {
    switch (value.toLowerCase()) {
      case "personnal":
      case "pers":
      case "per":
      case game.i18n.localize("arm5e.spell.ranges.personal"):
        return "personal";
      case "touch":
      case game.i18n.localize("arm5e.spell.ranges.touch"):
        return "touch";
      case "eye":
      case game.i18n.localize("arm5e.spell.ranges.eye"):
        return "eye";
      case "voice":
      case game.i18n.localize("arm5e.spell.ranges.voice"):
        return "voice";
      case "road":
      case game.i18n.localize("arm5e.spell.ranges.road"):
        return "road";
      case "sight":
      case game.i18n.localize("arm5e.spell.ranges.sight"):
        return "sight";
      case "arc":
      case "arcane connection":
      case game.i18n.localize("arm5e.spell.ranges.arc"):
        return "arc";
      case "special":
      case "spe":
      case "spec":
      case game.i18n.localize("arm5e.spell.special"):
        return "special";
      default:
        break;
    }
  }
  ChatMessage.create({
    content:
      "<b>MIGRATION NOTIFICATION</b><br/>" +
      `Warning: Unable to guess range \"${value}\" of ${name}, you will have to set it back manually. ` +
      `It has been reset to ${game.i18n.localize("arm5e.spell.ranges.personal")}</b>`
  });
  console.warn(`Range \"${value}\" of spell ${name} could not be guessed`);
  return "personal";
}

// Unfortunaltly, since the target was a free input field, it has to be guessed
function _guessTarget(name, value) {
  if (value && value !== "") {
    switch (value.toLowerCase().trim()) {
      case "individual":
      case "ind":
      case "indiv":
      case game.i18n.localize("arm5e.spell.targets.ind"):
        return "ind";
      case "circle":
      case "cir":
      case game.i18n.localize("arm5e.spell.targets.circle"):
        return "circle";
      case "part":
      case "par":
      case game.i18n.localize("arm5e.spell.targets.part"):
        return "part";
      case "group":
      case "gro":
      case "grp":
      case game.i18n.localize("arm5e.spell.targets.group"):
        return "group";
      case "room":
      case game.i18n.localize("arm5e.spell.targets.room"):
        return "room";
      case "struct":
      case "str":
      case game.i18n.localize("arm5e.spell.targets.struct"):
        return "struct";
      case "boundary":
      case "bound":
      case "bou":
      case game.i18n.localize("arm5e.spell.targets.bound"):
        return "bound";
      case "taste":
      case "tas":
      case game.i18n.localize("arm5e.spell.targets.taste"):
        return "taste";
      case "hearing":
      case "hea":
      case game.i18n.localize("arm5e.spell.targets.hearing"):
        return "hearing";
      case "touch":
      case "tou":
      case game.i18n.localize("arm5e.spell.targets.touch"):
        return "touch";
      case "smell":
      case "sme":
      case game.i18n.localize("arm5e.spell.targets.smell"):
        return "smell";
      case "sight":
      case "sig":
      case game.i18n.localize("arm5e.spell.targets.sight"):
        return "sight";
      case "special":
      case "spe":
      case "spec":
      case game.i18n.localize("arm5e.spell.special"):
        return "special";
      default:
        break;
    }
  }
  ChatMessage.create({
    content:
      "<b>MIGRATION NOTIFICATION</b><br/>" +
      `Warning: Unable to guess target \"${value}\" of ${name}, you will have to set it back manually. ` +
      `It has been reset to ${game.i18n.localize("arm5e.spell.targets.ind")}</b>`
  });
  console.warn(`Target \"${value}\" of spell ${name} could not be guessed`);
  return "ind";
}

// Unfortunaltely, since the duration was a free input field, it has to be guessed
function _guessDuration(name, value) {
  if (value && value !== "") {
    switch (value.toLowerCase().trim()) {
      case "moment":
      case "momentary":
      case "mom":
      case game.i18n.localize("arm5e.spell.durations.moment"):
        return "moment";
      case "diameter":
      case "dia":
      case "diam":
        return "diam";
      case "concentration":
      case game.i18n.localize("arm5e.spell.durations.conc"):
        return "conc";
      case "sun":
      case game.i18n.localize("arm5e.spell.durations.sun"):
        return "sun";
      case "ring":
      case game.i18n.localize("arm5e.spell.durations.ring"):
        return "ring";
      case "moon":
      case game.i18n.localize("arm5e.spell.durations.moon"):
        return "moon";
      case "fire":
      case game.i18n.localize("arm5e.spell.durations.fire"):
        return "fire";
      case "bargain":
      case "barg":
      case game.i18n.localize("arm5e.spell.durations.barg"):
        return "bargain";
      case "year":
      case game.i18n.localize("arm5e.spell.durations.year"):
        return "year";
      case "condition":
      case "cond":
      case game.i18n.localize("arm5e.spell.durations.condition"):
        return "condition";
      case "year+1":
      case game.i18n.localize("arm5e.spell.durations.year+1"):
        return "year+1";
      case "special":
      case "spe":
      case "spec":
      case game.i18n.localize("arm5e.spell.special"):
        return "special";
      default:
        break;
    }
  }
  ChatMessage.create({
    content:
      "<b>MIGRATION NOTIFICATION</b><br/>" +
      `Warning: Unable to guess duration \"${value}\" of ${name}, you will have to set it back manually. ` +
      `It has been reset to ${game.i18n.localize("arm5e.spell.durations.moment")}</b>`
  });
  console.warn(`Duration \"${value}\" of spell ${name} could not be guessed`);
  return "moment";
}
