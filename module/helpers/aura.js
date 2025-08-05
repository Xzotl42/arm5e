import { ARM5E } from "../config.js";
import { log } from "../tools.js";

export default class Aura {
  constructor(sceneId) {
    this.sceneId = sceneId;
    this.modifier = 0; // Modifier can be changed (if the user changes it in the dialog)
  }

  get values() {
    return this._sceneData.values;
  }

  get nightModifier() {
    return this._sceneData.nightModifier;
  }

  get visible() {
    return this._sceneData.visible;
  }

  // Scene may have been updated, so constantly retrieve scene flag data for aura values
  get _sceneData() {
    // fetch the scene if not done already
    if (!this.scene) {
      this.scene = game.scenes.get(this.sceneId);
    }
    // If scene doesn't specify aura data, merge with defaultAura to always have correct structure
    return foundry.utils.mergeObject(
      this.scene?.getFlag("arm5e", "aura") || {},
      this.constructor.defaultAura,
      {
        overwrite: false
      }
    );
  }

  // return the dominant aura level.
  get level() {
    return this.auraValueFor(this.dominantRealm);
  }

  /**
   * Takes an alignment number of a power and computes how the current aura will modify
   * that power being used. e.g. how much a faerie power is penalized in a divine aura
   *
   * @param {Number} alignment Number representing alignment of power being used
   * @returns
   */
  computeAuraModifierFor(alignment) {
    let dominantRealm = this.dominantRealm || "mundane";
    const multiplier = ARM5E.realmsExt[dominantRealm].influence[alignment];
    this.modifier = this.auraValueFor(dominantRealm) * multiplier;
    return this.modifier;
  }

  /**
   * Take the realms object of an actor and computes how the current aura will modify
   * that power/spell being used. This is used when a character has multiple alignments
   * the most benefiting modifier is returned
   *
   * @param {Object} realms actor field representing alignments (amd in the future, vulnerabilities)
   * @returns
   */
  computeMaxAuraModifier(realms) {
    let res = -9999;
    for (const [realm, properties] of Object.entries(realms)) {
      if (properties.aligned) {
        res = Math.max(res, this.computeAuraModifierFor(ARM5E.lookupRealm.indexOf(realm)));
      }
    }

    if (res == -9999) this.modifier = 0;
    else this.modifier = res;
    log(false, `Max aura mod : ${this.modifier}`);
    return this.modifier;
  }

  /**
   * Retrieve the realm that has the current highest value in the aura
   * The highest value is computed with the night modifier, if it is present and active
   */
  get dominantRealm() {
    let dominantRealm;
    let dominantRealmValue = 0;
    for (let realm in this.values) {
      if (this.auraValueFor(realm) > dominantRealmValue) {
        dominantRealmValue = this.values[realm];
        dominantRealm = realm;
      }
    }
    return dominantRealm;
    // TODO: What if two realms are the same value?
  }

  /**
   * Auras can have multiple realms, this retrieves the value of some realm in the aura,
   * including the night modifier if it is present
   *
   * @param {String} realm Realm string, such as "magic" or "divine"
   * @returns
   */
  auraValueFor(realm) {
    return (this.values[realm] || 0) + this._nightModifier(realm);
  }

  /**
   *
   * @param {String} realm Realm to calculate night modifier for, optional, if not provided use dominant realm
   * @returns
   */
  _nightModifier(realm) {
    realm = realm || this.dominantRealm;

    if (CONFIG.V12ORMORE) {
      if (this.scene?.environment.darknessLevel == 1) {
        // Probably not the most accurate check
        return this.nightModifier[realm] || 0;
      } else return 0;
    } else {
      if (this.scene?.darkness == 1) {
        // Probably not the most accurate check
        return this.nightModifier[realm] || 0;
      } else return 0;
    }
  }

  /**
   * Create an aura object from an actor and the scene they are associated with
   * If no token is on the map, juts use viewed scene
   *
   * @param {Actor} actor
   * @returns
   */
  static fromActor(actor) {
    let token = actor.getActiveTokens()[0];
    let scene;
    if (token) {
      scene = token.scene;
    } // no token on the map, just use viewed scene
    else {
      scene = canvas?.scene;
    }
    if (scene) {
      return new this(scene._id);
    } else {
      return new this(0);
    }
  }

  // Utility function for tests, it works incrementaly

  async set(realm, value, nightMod = 0) {
    if (value < 0 || !CONFIG.ARM5E.lookupRealm.includes(realm) || realm == "mundane") {
      return;
    }
    if (!this.scene) {
      this.scene = game.scenes.get(this.sceneId);
    }
    let currentAura =
      this.scene?.getFlag("arm5e", "aura") ?? foundry.utils.deepClone(Aura.defaultAura);
    currentAura.values[realm] = value;
    currentAura.nightModifier[realm] = nightMod;
    await this.scene.setFlag("arm5e", "aura", currentAura);
  }

  // Mundane is added here to easily compute cases with no aura
  static defaultAura = {
    values: {
      magic: 0,
      faeric: 0,
      divine: 0,
      infernal: 0
    },
    visible: false,
    nightModifier: {
      magic: 0,
      faeric: 0,
      divine: 0,
      infernal: 0
    }
  };
}
