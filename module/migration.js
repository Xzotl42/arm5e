import { ArM5ePCActor } from "./actor/actor.js";
import { ARM5E } from "./config.js";
import { TWILIGHT_STAGES } from "./helpers/long-term-activities.js";
import { computeLevel } from "./helpers/magic.js";
import { convertToNumber, error, log } from "./tools.js";

const DEPRECATED_ITEMS = ["speciality", "distinctive", "sanctumRoom", "personality"];
const DEPRECATED_ACTORS = ["scriptorium"];
export async function migration(originalVersion) {
  try {
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
        if (DEPRECATED_ACTORS.includes(a.type)) {
          game.actors.delete(a._id);
          continue;
        }

        log(true, `Invalid items in actor: ${a.items.invalidDocumentIds.size}`);
        const updateData = await migrateActorData(a, a.items);

        if (!foundry.utils.isEmpty(updateData)) {
          console.log(`Migrating Actor document ${a.name}`);
          updateData._id = a._id;
          actorsUpdates.push(foundry.utils.expandObject(updateData));
        }

        // const cleanData = cleanActorData(a)
        // if (!foundry.utils.isEmpty(cleanData)) {
        //     console.log(`Cleaning up Actor entity ${a.name}`);
        //     a.system = cleanData.system;
        // }
      } catch (err) {
        err.message = `Failed system migration for Actor ${a.name}: ${err.message}`;
        console.error(err);
      }
    }
    if (actorsUpdates.length > 0) {
      await Actor.updateDocuments(actorsUpdates, { diff: false });
    }

    // Migrate Invalid actors

    const invalidActorIds = Array.from(game.actors.invalidDocumentIds);
    const invalidActorsUpdates = [];
    for (const invalidId of invalidActorIds) {
      try {
        const rawData = foundry.utils.deepClone(
          game.actors._source.find((d) => d._id == invalidId)
        );

        console.log(`Migrating invalid Actor document: ${rawData.name}`);
        if (DEPRECATED_ACTORS.includes(rawData.type)) {
          game.actors.getInvalid(invalidId).delete();
          continue;
        }
        // let invalidActor = game.actors.getInvalid(invalidId);
        // log(false, `Invalid items in actor: ${invalidActor.items.invalidDocumentIds.size}`);
        // log(false, `Items in actor: ${invalidActor.items.size}`);
        const updateData = await migrateActorData(rawData, rawData.items);
        // let updateData = await invalidActor.update(updateData, { diff: true });
        console.log(`Migrated invalid Actor document: ${rawData.name}`);
        if (!foundry.utils.isEmpty(updateData)) {
          updateData._id = invalidId;
          invalidActorsUpdates.push(foundry.utils.expandObject(updateData));
        }
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
        if (DEPRECATED_ITEMS.includes(i.type)) {
          game.items.delete(i._id);
          continue;
        }
        const updateData = await migrateItemData(i);
        if (!foundry.utils.isEmpty(updateData)) {
          console.log(`Migrating Item document ${i.name}`);

          updateData._id = i._id;
          itemsUpdates.push(foundry.utils.expandObject(updateData));
        }
        console.log(`Migrated Item document ${i.name}`);

        // const cleanData = cleanItemData(i)
        // if (!foundry.utils.isEmpty(cleanData)) {
        //     console.log(`Cleaning up Item document ${i.name}`);
        //     i.system = cleanData.system;
        // }
      } catch (err) {
        err.message = `Failed system migration for Item ${i.name}: ${err.message}`;
        console.error(err);
      }
    }
    if (itemsUpdates.length > 0) {
      await Item.updateDocuments(itemsUpdates, { diff: false, recursive: true });
    }
    // Migrate Invalid items

    const invalidItemIds = Array.from(game.items.invalidDocumentIds);
    const invalidItemsUpdates = [];
    for (const invalidId of invalidItemIds) {
      try {
        const rawData = foundry.utils.deepClone(game.items._source.find((d) => d._id == invalidId));
        console.log(`Migrating invalid item document: ${rawData.name}`);
        let invalidItem = game.items.getInvalid(invalidId);
        const updateData = await migrateItemData(invalidItem);
        updateData._id = invalidId;
        if (!foundry.utils.isEmpty(updateData)) {
          invalidItemsUpdates.push({ _id: invalidId, ...updateData });
        }
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
          s.tokens.forEach((t) => (t._actor = null));
        }
      } catch (err) {
        err.message = `Failed system migration for Scene ${s.name}: ${err.message}`;
        console.error(err);
      }
    }

    // [DEV] Uncomment below to migrate system compendiums
    // for (let p of game.packs) {
    //   if (
    //     p.metadata.packageName !== CONFIG.ARM5E.SYSTEM_ID &&
    //     p.metadata.packageName !== CONFIG.ARM5E.REF_MODULE_ID
    //   )
    //     continue;
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
    await game.settings.set("arm5e", "systemMigrationVersion", game.system.version);
    ui.notifications.info(
      `Ars Magica 5e System Migration to version ${game.system.version} completed!`,
      {
        permanent: true
      }
    );
  } catch (err) {
    err.message = `Failed system migration: ${err.message}`;
    console.error(err);
  }
}

/**
 * Apply migration rules to all Entities within a single Compendium pack
 * @param pack
 * @return {Promise}
 */
export const migrateCompendium = async function (pack) {
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
          updateData = await migrateActorData(doc, doc.items);
          break;
        case "Item":
          updateData = await migrateItemData(doc);
          break;
        case "Scene":
          updateData = await migrateSceneData(doc);
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
export const migrateSceneData = async function (scene, migrationData) {
  const updateData = {};
  const tokens = await Promise.all(
    scene.tokens.map(async (token) => {
      const t = token instanceof foundry.abstract.DataModel ? token.toObject() : token;
      const update = {};
      if (!game.actors.has(t.actorId)) t.actorId = null;
      if (!t.actorId || t.actorLink) {
        t.actorData = {};
      } else if (!t.actorLink) {
        const update = await migrateActorData(token, undefined);
        if (CONFIG.ISV10) {
          ["items", "effects"].forEach((embeddedName) => {
            if (!update[embeddedName]?.length) return;
            const updates = new Map(update[embeddedName].map((u) => [u._id, u]));
            t.actorData[embeddedName].forEach((original) => {
              const update = updates.get(original._id);
              if (update) foundry.utils.mergeObject(original, update);
            });
            delete update[embeddedName];
          });
          foundry.utils.mergeObject(t.actorData, update);
        } else {
          t.delta = update;
        }
      }
      return t;
    })
  );

  updateData.tokens = tokens;

  let aura = scene.flags.world?.[`aura_${scene.id}`];
  let auraType = scene.flags.world?.[`aura_type_${scene.id}`];

  if (Number.isNumeric(aura) || Number.isNumeric(auraType)) {
    updateData["flags.-=world"] = null;

    let newAuraData = {
      aura: {
        visible: false,
        nightModifier: { magic: 0, faeric: 0, divine: 0, infernal: 0 },
        values: { magic: 0, faeric: 0, divine: 0, infernal: 0 }
      }
    };
    newAuraData.aura.values[CONFIG.ARM5E.lookupRealm[auraType]] = aura;

    updateData["flags.arm5e"] = newAuraData;
  }

  return updateData;
};

const isEffectObsolete = function (effect) {
  try {
    if (
      effect.flags.arm5e?.type &&
      effect.flags.arm5e.type[0] === "spellcasting" &&
      ["gestures", "voice", "aura"].includes(effect.flags.arm5e.subtype[0])
    ) {
      if (effect.flags.arm5e.value) {
        return true;
      }
    } else if (effect.flags.arm5e?.type && effect.flags.arm5e.type[0] === "aura") {
      return true;
    }
    return false;
  } catch {
    error(true, "PB with EFFECT: " + JSON.stringify(effect.flags.arm5e));
    return true;
  }
};

/**
 * Migrate a single Actor entity to incorporate latest data model changes
 * Return an Object of updateData to be applied
 * @param {object} actor    The actor data object to update
 * @return {Object}         The updateData to apply
 */
export const migrateActorData = async function (actorDoc, actorItems) {
  let actor = {};
  let updateData = {};
  if (actorDoc instanceof CONFIG.Actor.documentClass) {
    actor = actorDoc._source;
  } else if (actorDoc instanceof CONFIG.Token.documentClass) {
    actor = actorDoc.delta?.toObject() ?? foundry.utils.deepClone(actorDoc.actorData);
    actor.type = actorDoc.actor?.type;
    actor.synthetic = true;
    actor.name = actorDoc.name;
    actorItems = actor.items;
    if (actor.system) {
      actor.system.charType = { value: actorDoc.actor?.system?.charType?.value };
    }
  } else {
    actor = actorDoc;
  }
  if (CONFIG.ARM5E.ActorDataModels[actor.type]) {
    updateData = CONFIG.ARM5E.ActorDataModels[actor.type].migrate(
      actor,
      actorDoc.items ? actorDoc.items : []
    );
  } else {
    if (!actor?.flags?.arm5e) {
      updateData["flags.arm5e"] = {};
    } else if (actor?.flags.arm5e.filters) {
      // remove legacy filters
      updateData["flags.arm5e.-=filters"] = null;
    }

    // token with barely anything to migrate
    if (actor.system == undefined) {
      return updateData;
    }

    if (actor.type == "covenant") {
      if (actor.system.currentYear != undefined) {
        updateData["system.-=currentYear"] = null;
      }
    }

    // external links
    if (
      actor.system.covenant?.value &&
      (actor.system.covenant?.actorId == null || actor.system.covenant?.actorId == "")
    ) {
      let cov = game.actors.filter(
        (a) => a.type == "covenant" && a.name == actor.system.covenant.value
      );
      if (cov.length > 0) {
        updateData["system.covenant.actorId"] = cov[0]._id;
      }
    }
    if (
      actor.system.sanctum?.value &&
      (actor.system.sanctum?.actorId == null || actor.system.sanctum?.actorId == "")
    ) {
      let lab = game.actors.filter(
        (a) => a.type == "laboratory" && a.name == actor.system.sanctum.value
      );
      if (lab.length > 0) {
        updateData["system.sanctum.actorId"] = lab[0]._id;
      }
    }

    if (
      actor.system.owner?.value &&
      (actor.system.owner?.actorId == null || actor.system.owner?.actorId == "")
    ) {
      let owner = game.actors.filter(
        (a) => ["player", "npc"].includes(a.type) && a.name == actor.system.owner.value
      );
      if (owner.length > 0) {
        updateData["system.owner.actorId"] = owner[0]._id;
      }
    }

    if (["player", "npc", "beast"].includes(actor.type)) {
      if (actor.system.charType && actor.system.charType.value === undefined) {
        updateData["system.charType"] = { value: actor.system.charType };
      }

      if (actor.type === "beast") {
        if (!actor.system.characteristics.int) {
          // if (actor.system.characteristics.int) {
          // delete actor.system.characteristics.int;

          // let newChars = Object.entries(actor.system.characteristics);
          // newChars.unshift(["int"]);
          // const tmp = Object.fromEntries(newChars);
          updateData["system.characteristics.int"] = { value: 0, aging: 0 };
        }
      }

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

      if (actor.system.apprentice) {
        if (actor.system.apprentice.int === null) {
          updateData["system.apprentice.int"] = 0;
        }
      }

      // for beasts
      if (actor.system.description == undefined) {
        updateData["system.description"] = { born: { value: 1200 } };
      }

      // remove redundant data
      if (actor.system.houses != undefined) {
        updateData["system.-=houses"] = null;
      }

      if (actor.system.year?.value != undefined) {
        updateData["system.-=year"] = null;
      }
      if (actor.system.datetime != undefined) {
        updateData["system.-=datetime"] = null;
      }

      if (actor.system.season?.value != undefined) {
        updateData["system.-=season"] = null;
      }

      if (actor.system.stances === undefined) {
        updateData["system.stances"] = { voiceStance: "firm", gesturesStance: "bold" };
      } else {
        if (actor.system.stances.voiceStance == undefined) {
          updateData["system.stances.voiceStance"] = "firm";
        }
        if (actor.system.stances.gesturesStance == undefined) {
          updateData["system.stances.gesturesStance"] = "bold";
        }
      }

      // if (actor.system.)

      // if (actor.system?.roll != undefined) {
      //   updateData["system.-=roll"] = null;
      // }
      // if (actor.system.decrepitude == undefined) {
      //   updateData["system.decrepitude"] = {};
      // }

      // if (actor.system.warping == undefined) {
      //   updateData["system.warping"] = {};
      // }

      // remove garbage stuff if it exists
      if (actor.system.str) updateData["system.-=str"] = null;
      if (actor.system.sta) updateData["system.-=sta"] = null;
      if (actor.system.int) updateData["system.-=int"] = null;
      if (actor.system.per) updateData["system.-=per"] = null;
      if (actor.system.dex) updateData["system.-=dex"] = null;
      if (actor.system.qik) updateData["system.-=qik"] = null;
      if (actor.system.cha) updateData["system.-=cha"] = null;
      if (actor.system.com) updateData["system.-=com"] = null;

      if (actor.system.pendingXP != undefined && actor.system.pendingXP > 0) {
        ChatMessage.create({
          content:
            "<b>MIGRATION NOTIFICATION</b><br/>" +
            `The field "Pending experience" has been repurposed for the new long term activities feature. ` +
            `This is a one time notification that <b>the character ${actor.name} had ${actor.system.pendingXP} xps pending.</b>`
        });
        updateData["system.-=pendingXP"] = null;
      }
      let wounds = [];
      let sendMsg = false;
      let syntheticWoundsMsg = `<b>MIGRATION NOTIFICATION</b><br/>The character ${actorDoc.name}'s token was unable to migrate his/her wounds.<ul>`;
      for (let wtype of Object.keys(CONFIG.ARM5E.recovery.wounds)) {
        if (wtype == "healthy") continue;
        if (actor.system.wounds && actor.system.wounds[wtype]?.number != undefined) {
          // if (actor.synthetic) {
          //   syntheticWoundsMsg += `<li>${actor.system.wounds[wtype]?.number.value} ${wtype} wounds</li>`;
          //   sendMsg = true;

          //   await actorDoc.delta.update({ "system.-=wounds": null });
          //   break;
          //   // updateData[`system.wounds.${wtype}.-=number`] = null;
          //   // updateData[`system.wounds.${wtype}.-=penalty`] = null;
          //   // updateData[`system.wounds.${wtype}.-=notes`] = null;
          // } else {
          if (actorDoc instanceof ArM5ePCActor || actor.synthetic) {
            let datetime = game.settings.get("arm5e", "currentDate");
            for (let ii = 0; ii < actor.system.wounds[wtype].number.value; ii++) {
              let woundData = {
                name: `${game.i18n.localize(`arm5e.sheet.${wtype}`)} ${game.i18n.localize(
                  "arm5e.sheet.wound.label"
                )}`,
                type: "wound",
                system: {
                  inflictedDate: {
                    year: datetime.year,
                    season: datetime.season
                  },
                  healedDate: { year: null, season: "spring" },
                  gravity: wtype,
                  originalGravity: wtype,
                  trend: 0,
                  bonus: 0,
                  nextRoll: 0,
                  description: `Migrated: notes = ${actor.system.wounds[wtype].notes.value}`
                }
              };
              wounds.push(woundData);
            }
            updateData[`system.wounds.${wtype}.-=number`] = null;
            updateData[`system.wounds.${wtype}.-=penalty`] = null;
            updateData[`system.wounds.${wtype}.-=notes`] = null;
          } else {
            sendMsg = true;
          }
          // }
        }
      }

      // if (sendMsg && actorDoc.synthetic) {
      //   syntheticWoundsMsg += "</ul><br/>You will have to add them manually.";

      //   ChatMessage.create({
      //     content: syntheticWoundsMsg
      //   });
      // } else
      if (wounds.length > 0) {
        log(false, `${wounds.length} wound items created`);
        if (actorDoc instanceof ArM5ePCActor) {
          await actorDoc.createEmbeddedDocuments("Item", wounds);
        } else if (actor.synthetic) {
          await actorDoc.delta.createEmbeddedDocuments("Item", wounds);
        }
      } else if (sendMsg) {
        ChatMessage.create({
          content:
            "<b>MIGRATION NOTIFICATION</b><br/>" +
            `The character ${actor.name} was unable to migrate his/her wounds. Triggering a new migration will fix it (See FAQ)`
        });
      }

      if (actor.system.reputation) {
        if (actorDoc instanceof ArM5ePCActor) {
          for (let rep of Object.values(actor.system.reputation)) {
            if (rep.label === "" || rep.label === null || rep.label == undefined) continue;

            let reputationData = {
              name: rep.label,
              type: "reputation",
              system: {
                xp: ((rep.score * (rep.score + 1)) / 2) * 5,
                type: "local",
                description: `Migration: type = ${rep.type}`
              }
            };

            await actorDoc.createEmbeddedDocuments("Item", [reputationData]);
          }
          updateData["system.-=reputation"] = null;
        } else {
          if (actor.synthetic) {
            updateData["system.-=reputation"] = null;
          } else {
            ChatMessage.create({
              content:
                "<b>MIGRATION NOTIFICATION</b><br/>" +
                `The character ${actor.name} was unable to migrate his/her reputations. Triggering a new migration will fix it (See FAQ)`
            });
          }
        }
      }

      if (actor.system.personality) {
        if (actorDoc instanceof ArM5ePCActor) {
          for (let pers of Object.values(actor.system.personality)) {
            if (pers.label === "" || pers.label === null || pers.label === undefined) {
              continue;
            }

            let persData = {
              name: pers.label,
              type: "personalityTrait",
              system: {
                xp: ((pers.score * (pers.score + 1)) / 2) * 5,
                description: ``
              }
            };

            await actorDoc.createEmbeddedDocuments("Item", [persData]);
          }
          updateData["system.-=personality"] = null;
        } else {
          if (actor.synthetic) {
            updateData["system.-=personality"] = null;
          } else {
            ChatMessage.create({
              content:
                "<b>MIGRATION NOTIFICATION</b><br/>" +
                `The character ${actor.name} was unable to migrate his/her personality traits. Triggering a new migration will fix it (See FAQ)`
            });
          }
        }
      }
    } else {
      if (actor.system.roll) {
        updateData["system.-=roll"] = null;
      }
    }

    if (actor.type == "player" || actor.type == "npc") {
      let realms = {
        magic: { aligned: false },
        faeric: { aligned: false },
        divine: { aligned: false },
        infernal: { aligned: false }
      };
      let realmsUpdate = false;
      if (actor.system.realms === undefined) {
        realmsUpdate = true;
      }
      if (actor.system.charType.value !== "entity") {
        if (actor.system.decrepitude?.score != undefined) {
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

        if (actor.system.warping?.score != undefined) {
          let exp =
            (Number(actor.system.warping.score) * (Number(actor.system.warping.score) + 1) * 5) / 2;
          if (actor.system.warping.points >= 5 * (Number(actor.system.warping.score) + 1)) {
            // if the experience is bigger than the needed for next level, ignore it
            updateData["system.warping.points"] = exp;
          } else {
            // compute normally
            updateData["system.warping.points"] = exp + Number(actor.system.warping.points);
          }
          updateData["system.warping.-=score"] = null;
        }
      } else {
        // entity
        // migrate might type to realms Alignment
        if (actor.system?.might?.realm != undefined) {
          realmsUpdate = true;
          realms[actor.system.might.realm].aligned = true;
          updateData["system.might.-=realm"] = null;
          updateData["system.might.-=type"] = null;
        } else if (actor.system?.might?.type != undefined) {
          realmsUpdate = true;
          realms[actor.system.might.type].aligned = true;
          updateData["system.might.-=realm"] = null;
          updateData["system.might.-=type"] = null;
        }
      }

      if (actor.system?.realmAlignment != undefined) {
        realmsUpdate = true;
        if (Number.isNaN(actor.system.realmAlignment)) {
          if (ARM5E.lookupRealm.indexOf(actor.system.realmAlignment) != -1) {
            realms[actor.system.realmAlignment].aligned = true;
          }
        } else {
          if (actor.system.realmAlignment > 0) {
            realms[ARM5E.lookupRealm[actor.system.realmAlignment]].aligned = true;
          } else if (["magus", "magusNPC"].includes(actor.system.charType.value)) {
            realms["magic"].aligned = true;
          }
        }
        updateData["system.-=realmAlignment"] = null;
      }

      if (["magus", "magusNPC"].includes(actor.system.charType.value)) {
        if (actor.system.realms === undefined) {
          realms["magic"].aligned = true;
          realmsUpdate = true;
          updateData["system.-=realmAlignment"] = null;
        }
        if (actor.system?.sanctum?.value === undefined) {
          let sanctum = {
            value: actor.system.sanctum
          };
          updateData["system.sanctum"] = sanctum;
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
      if (realmsUpdate == true) {
        updateData["system.realms"] = realms;
      }
    }
  }
  if (
    actor.type == "player" ||
    actor.type == "npc" ||
    actor.type == "beast" ||
    actor.type == "laboratory" ||
    actor.type == "covenant"
  ) {
    if (CONFIG.ISV10) {
      if (actor.effects && (actor.effects.length > 0 || actor.effects.size > 0)) {
        log(false, `Migrating effects of ${actor.name}`);
        // Migrate effects
        let effects = [];
        let toDelete = [];
        for (let e of actor.effects) {
          if (isEffectObsolete(e)) {
            if (actorDoc instanceof ArM5ePCActor) {
              toDelete.push(e._id);
              continue;
            }
          }
          const effectData = e instanceof CONFIG.ActiveEffect.documentClass ? e.toObject() : e;

          let effectUpdate = await migrateActiveEffectData(effectData);
          if (!foundry.utils.isEmpty(effectUpdate)) {
            // Update the effect
            effectUpdate._id = effectData._id;
            effects.push(foundry.utils.expandObject(effectUpdate));
          }
        }

        if (toDelete.length > 0) {
          if (actorDoc instanceof ArM5ePCActor) {
            await actorDoc.deleteEmbeddedDocuments("ActiveEffect", toDelete);
          } else {
            ChatMessage.create({
              content:
                "<b>MIGRATION NOTIFICATION</b><br/>" +
                `The character ${actorDoc.name} was unable to clean up obsolete active effects. Triggering a new migration will fix it (See FAQ)`
            });
          }
        }

        if (effects.length > 0) {
          log(false, effects);
          updateData.effects = effects;
        }
      }
    } else {
      let applied = actorDoc.effects;
      if (actorDoc instanceof ArM5ePCActor) {
        applied = Array.from(actorDoc.allApplicableEffects());
      } else if (actor.synthetic) {
        applied = actor.effects;
      }
      if (applied && applied.length > 0) {
        let effects = [];
        let toDelete = [];
        for (let e of applied) {
          // if effect comes from an item, no need to migrate it.
          if (e.transfer == true) {
            continue;
          } else {
            // Effect is a remnant of V10 coming from an item
            const [actorPrefix, actorId, itemPrefix, itemId] = e.origin?.split(".") ?? [];
            let hasItem = false;
            if (actors.items instanceof Collection) {
              hasItem = actorDoc.items.has(itemId);
            } else if (actors.items instanceof Array) {
              hasItem = actorDoc.items.some((e) => e._id === itemId);
            }
            if (itemPrefix && hasItem) {
              if (actorDoc instanceof ArM5ePCActor || actor.synthetic) {
                console.log(`DEBUG: Found duplicate effect of origin: "${e.origin}", delete it.`);
                toDelete.push(e._id);
                continue;
              }
            }
          }

          if (isEffectObsolete(e)) {
            if (actorDoc instanceof ArM5ePCActor || actor.synthetic) {
              toDelete.push(e._id);
              continue;
            }
          }
          const effectData = e instanceof CONFIG.ActiveEffect.documentClass ? e.toObject() : e;

          let effectUpdate = await migrateActiveEffectData(effectData);
          if (!foundry.utils.isEmpty(effectUpdate)) {
            // Update the effect
            effectUpdate._id = effectData._id;
            effects.push(foundry.utils.expandObject(effectUpdate));
          }
        }

        if (toDelete.length > 0) {
          if (actorDoc instanceof ArM5ePCActor) {
            await actorDoc.deleteEmbeddedDocuments("ActiveEffect", toDelete);
          } else if (actor.synthetic) {
            await actorDoc.delta.deleteEmbeddedDocuments("ActiveEffect", toDelete);
          } else {
            ChatMessage.create({
              content:
                "<b>MIGRATION NOTIFICATION</b><br/>" +
                `The character ${actorDoc.name} was unable to clean up obsolete active effects. Triggering a new migration will fix it (See FAQ)`
            });
          }
        }

        if (effects.length > 0) {
          log(false, effects);
          updateData.effects = effects;
        }
      }
    }
  }
  if (actor.type == "player" || actor.type == "npc" || actor.type == "beast") {
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

    if (!actor.system.twilight) {
      updateData["twilight"] = {
        stage: TWILIGHT_STAGES.NONE,
        pointsGained: 0,
        strength: 0,
        complexity: 0,
        year: null,
        season: null
      };
    }
  }

  // Migrate Owned Items
  if (!actorDoc.items) return updateData;
  let items = [];
  if (actorItems.length !== 0 || actorItems.size != 0) {
    for (let i of actorDoc.items) {
      // Migrate the Owned Item
      try {
        if (i instanceof CONFIG.Item.documentClass) {
          if (DEPRECATED_ITEMS.includes(i.type)) {
            await actorDoc.items.delete(i._id);
            continue;
          }
        }
        let itemUpdate = await migrateItemData(i);
        // Update the Owned Item
        if (!foundry.utils.isEmpty(itemUpdate)) {
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
  if (actorItems.invalidDocumentIds !== undefined && actorItems.invalidDocumentIds.size > 0) {
    const invalidItemIds = Array.from(actorDoc.items.invalidDocumentIds);
    let invalidItemsUpdates = [];
    for (let invalidItemId of invalidItemIds) {
      try {
        const rawData = foundry.utils.deepClone(
          actorDoc.items._source.find((d) => d._id == invalidItemId)
        );
        let invalidItem = actorDoc.items.getInvalid(invalidItemId);
        const itemUpdate = await migrateItemData(invalidItem);
        if (!foundry.utils.isEmpty(itemUpdate)) {
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

export const migrateActiveEffectData = async function (effectData) {
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
  if (effectData.flags?.arm5e?.type != undefined) {
    if (!(effectData.flags.arm5e.type instanceof Array)) {
      if (effectData.flags.arm5e.type === "spellCasting") {
        effectData.flags.arm5e.type = ["spellcasting"];
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
    effectData.flags?.arm5e?.subtype != undefined &&
    !(effectData.flags.arm5e.subtype instanceof Array)
  ) {
    effectUpdate["flags.arm5e.subtype"] = [effectData.flags.arm5e.subtype];
  }

  if (effectData.flags?.arm5e?.option == undefined) {
    let optionArray = Array(effectData.changes.length).fill(null);
    effectUpdate["flags.arm5e.option"] = optionArray;
  } else {
    let options = effectData.flags.arm5e.option;
    let subtypes = effectData.flags.arm5e.subtype;
    let types = effectData.flags.arm5e.type;
    let changes = [];
    let idx = 0;
    let needUpdate = false;
    for (let ch of effectData.changes) {
      if (ch.key === "system.bonuses.skills.civilCanonLaw.bonus") {
        ch.key = "system.bonuses.skills.law_CivilAndCanon.bonus";
        options[idx] = "CivilAndCanon";
        subtypes[idx] = "law";
        needUpdate = true;
      } else if (ch.key === "system.bonuses.skills.commonLaw.bonus") {
        ch.key = "system.bonuses.skills.law_Common.bonus";
        options[idx] = "Common";
        subtypes[idx] = "law";
        needUpdate = true;
      } else if (ch.key === "system.wounds.light.penalty.value") {
        ch.key = "system.penalties.wounds.light";
        needUpdate = true;
      } else if (ch.key === "system.wounds.medium.penalty.value") {
        ch.key = "system.penalties.wounds.medium";
        needUpdate = true;
      } else if (ch.key === "system.wounds.heavy.penalty.value") {
        ch.key = "system.penalties.wounds.heavy";
        needUpdate = true;
      } else if (ch.key == "system.bonuses.activities.writing") {
        // fix "writting" typo
        if (types[idx] == "writting") {
          types[idx] == "writing";
          needUpdate = true;
        }
      } else if (ch.key === "system.realmAlignment") {
        switch (ch.value) {
          case "1":
            ch.key = "system.realms.magic.aligned";
            ch.value = true;
            subtypes[idx] = "magic";
            needUpdate = true;
            break;
          case "2":
            ch.key = "system.realms.faeric.aligned";
            ch.value = true;
            subtypes[idx] = "faeric";
            needUpdate = true;
            break;
          case "3":
            ch.key = "system.realms.divine.aligned";
            ch.value = true;
            subtypes[idx] = "divine";
            needUpdate = true;
            break;
          case "4":
            ch.key = "system.realms.infernal.aligned";
            ch.value = true;
            subtypes[idx] = "infernal";
            needUpdate = true;
            break;
          default:
            // not possible

            break;
        }
      } else if (
        ch.key === "system.bonuses.arts.voice" ||
        ch.key === "system.bonuses.arts.gestures" ||
        (ch.key === "system.bonuses.arts.spellcasting" && subtypes[idx] === "gesture") ||
        (types[idx] == "spellcasting" && subtypes[idx] === "aura")
      ) {
        // delete those old effects

        types.splice(idx, 1);
        subtypes.splice(idx, 1);
        options.splice(idx, 1);
        idx++;
        needUpdate = true;
        continue;
      } else if (types[idx] == "spellcasting" && subtypes[idx] === "aura") {
      }
      changes.push(ch);
      idx++;
    }
    if (needUpdate) {
      effectUpdate["flags.arm5e.option"] = options;
      effectUpdate["flags.arm5e.subtype"] = subtypes;
      effectUpdate["flags.arm5e.type"] = types;
      effectUpdate["changes"] = changes;
    }
  }

  return effectUpdate;
};

export const migrateItemData = async function (item) {
  let itemData = {};
  let updateData = {};
  if (item instanceof CONFIG.Item.documentClass) {
    itemData = item._source;
  } else {
    itemData = item;
  }
  if (CONFIG.ARM5E.ItemDataModels[item.type]) {
    updateData = CONFIG.ARM5E.ItemDataModels[item.type].migrate(itemData);
  } else {
    if (
      [
        "habitantMagi",
        "habitantCompanion",
        "habitantSpecialists",
        "habitantHabitants",
        "habitantHorses",
        "habitantLivestock"
      ].includes(itemData.type)
    ) {
      updateData["type"] = "inhabitant";
      if (
        itemData.name != "" &&
        (itemData.system.actorId == null || itemData.system.actorId === "")
      ) {
        let inhabitant = game.actors.filter(
          (a) => ["player", "npc", "beast"].includes(a.type) && a.name == itemData.name
        );
        if (inhabitant.length > 0) {
          updateData["system.actorId"] = inhabitant[0]._id;
        }
      }
      switch (itemData.type) {
        case "habitantMagi":
          updateData["system.category"] = "magi";
          if (itemData.name === "") {
            updateData["name"] = "Magus name";
          }
          updateData["system.extradata.giftType"] = itemData.giftType;
          break;
        case "habitantCompanion":
          updateData["system.category"] = "companions";
          if (itemData.name === "") {
            updateData["name"] = "Companion name";
          }
          break;
        case "habitantSpecialists":
          updateData["system.category"] = "specialists";
          if (itemData.name === "") {
            updateData["name"] = "Specialist name";
          }
          break;
        case "habitantHabitants":
          updateData["system.category"] = "servants";
          if (itemData.name === "") {
            updateData["name"] = "Grog name";
          }
          break;
        case "habitantHorses":
          updateData["system.category"] = "horses";
          if (itemData.name === "") {
            updateData["name"] = "Horse name";
          }
          break;
        case "habitantLivestock":
          updateData["system.category"] = "livestock";
          if (itemData.name === "") {
            updateData["name"] = "LivestockBreed";
          }
          break;
        default:
          updateData["system.category"] = "servants";
          if (itemData.name === "") {
            updateData["name"] = "A grog";
          }
      }
      if (typeof itemData.system.loyalty != "number") {
        updateData["system.loyalty"] = convertToNumber(itemData.system.loyalty, 0);
      }
      if (typeof itemData.system.score != "number") {
        updateData["system.score"] = convertToNumber(itemData.system.score, 0);
      }
      if (typeof itemData.system.quantity != "number") {
        updateData["system.quantity"] = convertToNumber(itemData.system.quantity, 0);
      }
      if (typeof itemData.system.yearBorn != "number") {
        updateData["system.yearBorn"] = convertToNumber(itemData.system.yearBorn, 1200);
      }

      if (typeof itemData.system.points != "number") {
        updateData["system.points"] = convertToNumber(
          itemData.system.points,
          ARM5E.covenant.inhabitants[updateData["system.category"]].points
        );
      }
    } else if (itemData.type === "magicItem") {
      // transform magicItems into Items with enchantment
      let description = "<b>Migrated from legacy magic Item</b><br/>";
      updateData["type"] = "item";
      updateData["system.quantity"] = 1;

      updateData["system.carried"] = true;
      const ench = {};
      if (itemData.system.uses) {
        updateData["system.state"] = "enchanted";
        ench.state = "charged";
        ench.charged = true;
        ench.charges = itemData.system.uses;
        ench.originalCharges = itemData.system.uses;
      } else {
        updateData["system.state"] = "enchanted";
        ench.state = "lesser";
        ench.charged = false;
        ench.charges = null;
      }
      ench.year = convertToNumber(itemData.system.year, 1200);
      ench.author = itemData.system.creator;
      ench.talisman = false;
      const level = computeLevel(itemData.system, "spell");
      const delta = itemData.system.level - level;
      if (delta != 0) {
        description += `Computed level (${level}) doesn't match original item level (${itemData.system.level}), please review.<br/>`;
      }

      ench.capacities = [
        {
          id: foundry.utils.randomID(),
          sizeMultiplier: "tiny",
          materialBase: "base1",
          desc: "",
          prepared: false
        }
      ];

      ench.effects = [
        {
          name: itemData.system.effects ?? game.i18n.localize("arm5e.sheet.effect"),
          type: "enchantment",
          receptacleId: ench.capacities[0].id,
          system: {
            baseLevel: 1,
            technique: { value: itemData.system.technique.value },
            form: { value: itemData.system.form.value },
            range: { value: itemData.system.range.value },
            duration: { value: itemData.system.duration.value },
            target: { value: itemData.system.target.value }
          }
        }
      ];

      updateData["system.enchantments"] = ench;
      updateData["system.description"] = `${description}<br/>${itemData.system.description}`;
    } else if (_isMagicalItem(itemData)) {
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
  }
  // either an array or an embedded collection
  if (item.effects.length > 0 || item.effects.size) {
    log(false, `Migrating effects of ${item.name}`);
    let effects = [];
    let toDelete = [];

    for (let e of item.effects) {
      if (isEffectObsolete(e)) {
        toDelete.push(e._id);
        continue;
      }
      // Migrate effects
      const effectData = e instanceof CONFIG.ActiveEffect.documentClass ? e.toObject() : e;
      let effectUpdate = await migrateActiveEffectData(effectData);
      if (!foundry.utils.isEmpty(effectUpdate)) {
        // Update the effect
        effectUpdate._id = effectData._id;
        effects.push(foundry.utils.expandObject(effectUpdate));
      }
    }
    if (toDelete.length > 0) {
      if (item instanceof CONFIG.Item.documentClass) {
        await item.deleteEmbeddedDocuments("ActiveEffect", toDelete);
      } else {
        ChatMessage.create({
          content:
            "<b>MIGRATION NOTIFICATION</b><br/>" +
            `The item ${item.name} was unable to clean up obsolete active effects. Triggering a new migration will fix it (See FAQ)`
        });
      }
    }

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
