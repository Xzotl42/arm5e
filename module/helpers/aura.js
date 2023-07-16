import ACTIVE_EFFECTS_TYPES from "../constants/activeEffectsTypes.js";
import ArM5eActiveEffect from "./active-effects.js";
import { log } from "../tools.js";
import { ARM5E } from "../config.js";

const ICON = "icons/magic/defensive/barrier-shield-dome-blue-purple.webp";

function createAuraActiveEffect(realm, level) {
  const label = `${game.i18n.localize("arm5e.sheet.levelAura")}`;

  const changeData = [
    {
      key: ACTIVE_EFFECTS_TYPES.aura.subtypes.auraLevel.key,
      value: level,
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE
    },
    {
      key: ACTIVE_EFFECTS_TYPES.aura.subtypes.auraRealm.key,
      value: realm,
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE
    }
  ];
  const activeEffectData = {
    label: label,
    icon: ICON,
    duration: {
      rounds: undefined
    },
    flags: {
      arm5e: {
        type: ["aura", "aura"],
        subtype: ["auraLevel", "auraRealm"],
        option: [null, null]
      }
    },
    changes: changeData,
    tint: "#000000"
  };

  return activeEffectData;
}

async function setAuraEffect(actor, activeEffectData) {
  const aura = ArM5eActiveEffect.findAllActiveEffectsWithTypeFiltered(actor.effects, "aura");

  if (aura.length > 1) {
    console.error("Problem: multiple auras on an Actor");
  }
  if (aura.length) {
    log(
      false,
      `AURA_MANAGEMENT Change aura for ${actor.name}, Aura ${activeEffectData.changes[0].value} ${activeEffectData.changes[1].value}`
    );
    aura[0]._getSourceName();
    activeEffectData._id = aura[0]._id;
    return await actor.updateEmbeddedDocuments("ActiveEffect", [activeEffectData]);
  }

  log(
    false,
    `AURA_MANAGEMENT Add aura for ${actor.name}, Aura ${activeEffectData.changes[0].value} ${activeEffectData.changes[1].value}`
  );
  return await actor.createEmbeddedDocuments("ActiveEffect", [activeEffectData]);
}

async function modifyAuraActiveEffectForAllTokensInScene(scene, value, type) {
  if (!scene.active) {
    return;
  }
  if (Object.values(ARM5E.REALM_TYPES).includes(type)) {
    let activeEffectData = createAuraActiveEffect(type, value);
    activeEffectData.origin = scene.uuid;

    const tokens = scene.tokens.filter((token) => token.actor);
    for (const token of tokens) {
      if (token.actor._isCharacter()) {
        if (token.isLinked) {
          // patch the active effect data
          await setAuraEffect(token.actor, activeEffectData);
        } else {
          // patch the active effect data
          log(false, `Change aura for ${token.name}`);
          await setAuraEffect(token.actor, activeEffectData);
        }
      }
    }
  }
}

async function addActiveEffectAuraToActor(actor, value, type) {
  if (Object.values(ARM5E.REALM_TYPES).includes(type)) {
    const auraEffect = createAuraActiveEffect(type, value);
    // patch the active effect data
    await setAuraEffect(actor, auraEffect);
  }
}

async function clearAuraFromActor(actor) {
  if (actor == undefined || actor == null) return;
  log(false, `AURA_MANAGEMENT: clear effect for ${actor.name}`);
  const effects = ArM5eActiveEffect.findAllActiveEffectsWithTypeFiltered(actor.effects, "aura");
  let toDelete = [];
  for (const e of effects) {
    toDelete.push(e._id);
  }
  await actor.deleteEmbeddedDocuments("ActiveEffect", toDelete);
}

function computeAuraModifier(alignment, auraVal, auraRealm) {
  const char = CONFIG.ARM5E.lookupRealm[parseInt(alignment)];
  const multiplier = CONFIG.ARM5E.realmsExt[auraRealm].influence[parseInt(alignment)];
  log(
    false,
    "Computed aura :" +
      char +
      ", Aura: " +
      auraVal +
      " of type " +
      auraRealm +
      " = " +
      auraVal * multiplier
  );
  return auraVal * multiplier;
}

async function setAuraValueForAllTokensInScene(value, type) {
  if (Object.values(ARM5E.REALM_TYPES).includes(Number(type))) {
    // Store a flag with the current aura
    await game.scenes.viewed.setFlag("world", "aura_" + game.scenes.viewed._id, Number(value));
    await game.scenes.viewed.setFlag("world", "aura_type_" + game.scenes.viewed._id, Number(type));
    modifyAuraActiveEffectForAllTokensInScene(game.scenes.viewed, value, type);
  }
}

async function setAuraValueForToken(value, type) {
  if (Object.values(ARM5E.REALM_TYPES).includes(type)) {
    await addActiveEffectAuraToActor(this, Number(value), Number(type));
  }
}

async function resetTokenAuraToSceneAura() {
  const aura = game.scenes.viewed.getFlag("world", "aura_" + game.scenes.viewed._id);
  const type = game.scenes.viewed.getFlag("world", "aura_type_" + game.scenes.viewed._id);
  if (aura !== undefined && !Number.isNaN(aura) && type !== undefined && !Number.isNaN(type)) {
    await addActiveEffectAuraToActor(this, Number(aura), Number(type));
  }
}

function getAuraModifier(actor, alignment) {
  const effects = ArM5eActiveEffect.findAllActiveEffectsWithTypeFiltered(actor.effects, "aura");
  if (effects.length == 0) return null;
  const level = effects[0].changes[0].value;
  const realm = effects[0].changes[1].value;
  const auraRealm = CONFIG.ARM5E.lookupRealm[parseInt(realm)];
  return computeAuraModifier(alignment, level, auraRealm);
}

export {
  getAuraModifier,
  computeAuraModifier,
  modifyAuraActiveEffectForAllTokensInScene,
  addActiveEffectAuraToActor,
  clearAuraFromActor,
  setAuraValueForAllTokensInScene,
  setAuraValueForToken,
  resetTokenAuraToSceneAura
};
