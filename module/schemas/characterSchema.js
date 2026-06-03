import { actorBase } from "./actorCommonSchema.js";
import {
  actorLink,
  basicTextField,
  basicIntegerField,
  boolOption,
  characteristicField,
  SeasonField
} from "./commonSchemas.js";

const fields = foundry.data.fields;

// ── Reusable helpers ─────────────────────────────────────────────────────────

const characteristicEntry = () =>
  new fields.SchemaField({
    value: characteristicField(),
    aging: basicIntegerField(0)
  });

const descriptionTextField = () => new fields.SchemaField({ value: basicTextField() });

// ── Default feature sets per subtype ─────────────────────────────────────────

/**
 * Return the default feature flags for a given character subtype.
 * Applied only at creation time; changing subtype later does NOT reset features.
 * @param {string} subtype
 * @returns {object}
 */
export function defaultFeatures(subtype) {
  const base = {
    magicSystem: false,
    magicSystemType: "hermetic",
    powers: false,
    fatigue: false,
    corporeal: false,
    combat: false,
    aging: false,
    might: false,
    confidence: false,
    confidenceType: "confidence",
    twilight: false,
    sigil: false,
    familiar: false,
    apprentice: false
  };

  switch (subtype) {
    case "magus":
      return {
        ...base,
        magicSystem: true,
        magicSystemType: "hermetic",
        fatigue: true,
        corporeal: true,
        combat: true,
        aging: true,
        confidence: true,
        confidenceType: "confidence",
        twilight: true,
        sigil: true,
        familiar: true,
        apprentice: true
      };
    case "companion":
      return {
        ...base,
        fatigue: true,
        corporeal: true,
        combat: true,
        aging: true,
        confidence: true
      };
    case "grog":
      return { ...base, fatigue: true, corporeal: true, combat: true };
    case "entity":
      return { ...base, powers: true, might: true };
    case "beast":
      return { ...base, fatigue: true, corporeal: true, combat: true, powers: true };
    case "mundane":
    default:
      return { ...base, fatigue: true, corporeal: true, combat: true, aging: true };
  }
}

// ── CharacterSchema ───────────────────────────────────────────────────────────

/**
 * TypeDataModel for the unified "character" actor type.
 * Merges all fields from the deprecated player, npc, and beast actor types.
 */
export class CharacterSchema extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      // ── Standard item/actor base fields ──────────────────────────────────
      source: new fields.StringField({ required: false, initial: "custom" }),
      page: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        initial: 0,
        min: 0,
        step: 1
      }),
      indexKey: basicTextField(),
      review_status: new fields.StringField({
        required: false,
        blank: true,
        initial: "toReview",
        choices: Object.keys(CONFIG.ARM5E.generic.reviewStatus)
      }),
      reviewer: basicTextField(),

      // ── Unified character type classification ──────────────────────────────
      /**
       * Subtype drives the default feature set at creation. Does not auto-update features if changed later.
       * companion and grog are only meaningful when role === "player".
       */
      subtype: new fields.StringField({
        required: false,
        blank: false,
        initial: "mundane",
        choices: ["magus", "companion", "grog", "entity", "mundane", "beast"]
      }),
      /** Role within the game: player-controlled or NPC. */
      role: new fields.StringField({
        required: false,
        blank: false,
        initial: "player",
        choices: ["player", "npc"]
      }),

      // ── Feature flags ──────────────────────────────────────────────────────
      /**
       * Booleans control tab/section visibility. All flags are editable only in creation mode.
       * magicSystem: true → magic tab visible; magicSystemType distinguishes hermetic vs. alternate.
       * confidence: true → confidence/faith track visible; confidenceType selects the label.
       * hasMight is a computed flag (set by prepareBaseData from features.might) used by shared code.
       */
      features: new fields.SchemaField({
        magicSystem: boolOption(),
        magicSystemType: new fields.StringField({
          required: false,
          blank: false,
          initial: "hermetic",
          choices: ["hermetic", "alternate"]
        }),
        powers: boolOption(),
        fatigue: boolOption(),
        corporeal: boolOption(),
        combat: boolOption(),
        aging: boolOption(),
        might: boolOption(),
        confidence: boolOption(),
        confidenceType: new fields.StringField({
          required: false,
          blank: false,
          initial: "confidence",
          choices: ["confidence", "faith"]
        }),
        lab: boolOption(),
        sigil: boolOption(),
        familiar: boolOption(),
        apprentice: boolOption()
      }),

      // ── Demographics & identity ────────────────────────────────────────────
      age: new fields.SchemaField({ value: basicIntegerField(25, 0) }),
      apparent: new fields.SchemaField({ value: basicIntegerField(25, 0) }),
      playername: basicTextField(),

      house: new fields.SchemaField({
        value: new fields.StringField({ required: false, blank: false, initial: "n-a" }),
        label: basicTextField()
      }),
      domusMagnus: new fields.SchemaField({
        value: basicTextField(),
        label: basicTextField(),
        dtype: new fields.StringField({ required: false, blank: true, initial: "String" })
      }),
      primus: new fields.SchemaField({
        value: basicTextField(),
        label: basicTextField(),
        dtype: new fields.StringField({ required: false, blank: true, initial: "String" })
      }),
      parens: new fields.SchemaField({
        value: basicTextField(),
        label: basicTextField(),
        dtype: new fields.StringField({ required: false, blank: true, initial: "String" })
      }),
      apprenticeship: new fields.SchemaField({
        value: basicTextField(),
        label: basicTextField(),
        dtype: new fields.StringField({ required: false, blank: true, initial: "String" })
      }),
      sigil: new fields.SchemaField({
        value: new fields.StringField({
          required: false,
          blank: true,
          initial: "A flash of blue light."
        }),
        label: basicTextField(),
        dtype: new fields.StringField({ required: false, blank: true, initial: "String" })
      }),

      // ── Text fields ────────────────────────────────────────────────────────
      biography: basicTextField(),
      secrets: basicTextField(),

      // ── Biographical description object ────────────────────────────────────
      description: new fields.SchemaField({
        born: new fields.SchemaField({ value: basicIntegerField(1200, -9999) }),
        apprentice: new fields.SchemaField({ value: basicIntegerField(10, 0) }),
        birthname: descriptionTextField(),
        birthplace: descriptionTextField(),
        nationality: descriptionTextField(),
        religion: descriptionTextField(),
        height: descriptionTextField(),
        weight: descriptionTextField(),
        gender: descriptionTextField(),
        hair: descriptionTextField(),
        eyes: descriptionTextField(),
        title: descriptionTextField(),
        handed: descriptionTextField()
      }),

      // ── Characteristics ────────────────────────────────────────────────────
      characteristics: new fields.SchemaField({
        int: characteristicEntry(),
        per: characteristicEntry(),
        str: characteristicEntry(),
        sta: characteristicEntry(),
        pre: characteristicEntry(),
        com: characteristicEntry(),
        dex: characteristicEntry(),
        qik: characteristicEntry(),
        /** Beast cunningness replaces intelligence; which is active depends on features.subtype. */
        cun: characteristicEntry()
      }),

      // ── Vitals ────────────────────────────────────────────────────────────
      vitals: new fields.SchemaField({
        siz: new fields.SchemaField({ value: characteristicField() }),
        soa: new fields.SchemaField({ value: basicIntegerField(0) }),
        enc: new fields.SchemaField({ value: basicIntegerField(0) })
      }),

      // ── Confidence / faith points ──────────────────────────────────────────
      con: new fields.SchemaField({
        label: basicTextField(),
        score: basicIntegerField(1),
        points: basicIntegerField(3)
      }),

      // ── Covenant & laboratory links ────────────────────────────────────────
      covenant: actorLink(),
      sanctum: actorLink(),

      // ── Realm alignment ────────────────────────────────────────────────────
      realms: new fields.SchemaField({
        magic: new fields.SchemaField({ aligned: boolOption(), susceptible: boolOption() }),
        faeric: new fields.SchemaField({ aligned: boolOption(), susceptible: boolOption() }),
        divine: new fields.SchemaField({ aligned: boolOption(), susceptible: boolOption() }),
        infernal: new fields.SchemaField({ aligned: boolOption(), susceptible: boolOption() })
      }),

      // ── State flags ────────────────────────────────────────────────────────
      states: new fields.SchemaField({
        pendingCrisis: boolOption(),
        creationMode: boolOption(true),
        confidencePrompt: boolOption(),
        pendingDamage: boolOption()
      }),

      // ── Combat preparations ────────────────────────────────────────────────
      combatPreps: new fields.SchemaField({
        current: new fields.StringField({ required: false, blank: false, initial: "custom" }),
        list: new fields.ObjectField({ required: false, initial: { custom: { ids: [] } } })
      }),

      // ── Might (entity/beast) ───────────────────────────────────────────────
      might: new fields.SchemaField({
        label: basicTextField(),
        form: basicTextField(),
        value: new fields.NumberField({
          required: false,
          nullable: true,
          integer: true,
          initial: 0,
          step: 1,
          min: 0
        }),
        points: new fields.NumberField({
          required: false,
          nullable: true,
          integer: true,
          initial: 0,
          step: 1,
          min: 0
        })
      }),

      // ── Decrepitude & warping ──────────────────────────────────────────────
      decrepitude: new fields.SchemaField({
        label: basicTextField(),
        score: basicIntegerField(0, 0),
        points: basicIntegerField(0, 0),
        effects: basicTextField()
      }),
      warping: new fields.SchemaField({
        label: basicTextField(),
        score: basicIntegerField(0, 0),
        points: basicIntegerField(0, 0),
        effects: basicTextField()
      }),

      // ── Beast flag ────────────────────────────────────────────────────────
      /** Whether a beast-subtype character has intelligence (uses int) or cunningness (uses cun). */
      intelligent: boolOption(false),

      // ── Fatigue ───────────────────────────────────────────────────────────
      fatigueTotal: basicIntegerField(0),
      fatigueCurrent: basicIntegerField(0, 0),
      longTermFatigue: basicIntegerField(0, 0),
      fatigue: new fields.ObjectField({
        required: false,
        initial: {
          fresh: { amount: 0, number: 0 },
          winded: { amount: 1, number: 0 },
          weary: { amount: 1, number: -1 },
          tired: { amount: 1, number: -3 },
          dazed: { amount: 1, number: -5 },
          unconscious: { amount: 1, number: 0 }
        }
      }),

      // ── Arts & stances (Hermetic magic) ────────────────────────────────────
      stances: new fields.ObjectField({
        required: false,
        initial: { voiceStance: "firm", gesturesStance: "bold" }
      }),
      arts: new fields.ObjectField({
        required: false,
        initial: {
          techniques: {
            cr: { label: "Creo", xp: 0 },
            in: { label: "Intellego", xp: 0 },
            mu: { label: "Muto", xp: 0 },
            pe: { label: "Perdo", xp: 0 },
            re: { label: "Rego", xp: 0 }
          },
          forms: {
            an: { label: "Animal", xp: 0 },
            aq: { label: "Aquam", xp: 0 },
            au: { label: "Auram", xp: 0 },
            co: { label: "Corpus", xp: 0 },
            he: { label: "Herbam", xp: 0 },
            ig: { label: "Ignem", xp: 0 },
            im: { label: "Imaginem", xp: 0 },
            me: { label: "Mentem", xp: 0 },
            te: { label: "Terram", xp: 0 },
            vi: { label: "Vim", xp: 0 }
          }
        }
      }),

      // ── Alternate magic system ─────────────────────────────────────────────
      magicSystem: new fields.ObjectField({
        required: false,
        nullable: true,
        initial: null
      }),

      // ── Twilight ───────────────────────────────────────────────────────────
      twilight: new fields.ObjectField({
        required: false,
        initial: {
          stage: 0,
          pointsGained: 0,
          strength: 0,
          complexity: 0,
          enigmaSpec: false,
          concentrationSpec: false,
          control: null,
          year: null,
          season: null
        }
      }),

      // ── Familiar bond ─────────────────────────────────────────────────────
      familiar: new fields.ObjectField({
        required: false,
        initial: {
          nameFam: "",
          specieFam: "",
          techniqueFam: { value: "" },
          formFam: { value: "" },
          cordFam: { bronze: 0, silver: 0, gold: 0 },
          characteristicsFam: {
            int: { value: 0 },
            per: { value: 0 },
            str: { value: 0 },
            sta: { value: 0 },
            pre: { value: 0 },
            com: { value: 0 },
            dex: { value: 0 },
            qik: { value: 0 }
          },
          vitalsFam: {
            size: { value: 0 },
            might: { value: 0 },
            soak: { value: 0 },
            fatigue: { value: 0 },
            initiative: { value: 0 },
            attack: { value: 0 },
            defense: { value: 0 },
            damage: { value: 0 }
          },
          abilitiesFam: [],
          powersFam: []
        }
      }),

      // ── Sanctum laboratory data ────────────────────────────────────────────
      laboratory: new fields.ObjectField({
        required: false,
        initial: {
          longevityRitual: { labTotal: 0, modifier: 0, twilightScars: "" },
          abilitiesSelected: {
            finesse: { abilityID: "", value: 0, label: "" },
            awareness: { abilityID: "", value: 0, label: "" },
            concentration: { abilityID: "", value: 0, label: "" },
            artesLib: { abilityID: "", value: 0, label: "" },
            philosophy: { abilityID: "", value: 0, label: "" },
            parma: { abilityID: "", value: 0, label: "", speciality: "" },
            magicTheory: { abilityID: "", value: 0, label: "" },
            penetration: { abilityID: "", value: 0, label: "" }
          },
          fastCastingSpeed: { value: 0, sumary: "Qik + Finesse + stress die" },
          determiningEffect: { value: 0, sumary: "Per + Awareness + die VS 15-magnitude" },
          targeting: { value: 0, sumary: "Per + Finesse + die" },
          concentration: { value: 0, sumary: "Sta + Concentration + die" },
          magicResistance: { value: 0, sumary: "Parma * 5 + Form" },
          multipleCasting: { value: 0, sumary: "Int + Finesse + stress die - no of spells VS 9" },
          basicLabTotal: { value: 0, sumary: "Int + Magic theory + Aura (+ Technique + Form)" },
          totalPenetration: { value: 0, sumary: "Penetration + (Active effects penetration...)" },
          visLimit: { value: 0, sumary: "Magic theory * 2" }
        }
      }),

      // ── Apprentice info ───────────────────────────────────────────────────
      apprentice: new fields.ObjectField({
        required: false,
        initial: { name: "", age: 0, years: 0, int: 0, magicTheory: 0 }
      }),

      // ── Roll data placeholder ─────────────────────────────────────────────
      roll: new fields.ObjectField({ required: false, initial: {} }),

      // ── Vis registry (for characters that track vis) ───────────────────────
      visRegistry: new fields.ObjectField({ required: false, nullable: true, initial: null }),

      // ── Source tracking ────────────────────────────────────────────────────
      version: new fields.StringField({ required: false, blank: true, initial: "2.0.2" }),
      resource: new fields.ObjectField({
        required: false,
        initial: { fatigue: { value: 0, max: 5 } }
      })
    };
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────

  prepareBaseData() {
    // Compute hasMight from features.might for compatibility with shared code
    // (actor.js _prepareCharacterData and roll-window.js check features.hasMight)
    if (this.features.might) {
      this.features.hasMight = true;
      this.features.powers = true;
    } else {
      this.features.hasMight = false;
    }
  }

  // ── Static helpers ────────────────────────────────────────────────────────

  /** @type {string[]} Actor types that are deprecated in favour of "character". */
  static DEPRECATED_TYPES = ["player", "npc", "beast"];

  /**
   * Map an old actor's type + charType.value to the new subtype string.
   * @param {string} actorType   Old actor type: "player", "npc", "beast".
   * @param {string} charType    Old charType.value.
   * @returns {{ subtype: string, role: string }}
   */
  static resolveSubtypeAndRole(actorType, charType) {
    let role = actorType === "player" ? "player" : "npc";
    let subtype = "mundane";

    switch (actorType) {
      case "beast":
        subtype = "beast";
        role = "npc";
        break;
      case "player":
        switch (charType) {
          case "magus":
            subtype = "magus";
            break;
          case "companion":
            subtype = "companion";
            break;
          case "grog":
            subtype = "grog";
            break;
          default:
            subtype = "mundane";
        }
        break;
      case "npc":
        switch (charType) {
          case "magusNPC":
            subtype = "magus";
            break;
          case "entity":
            subtype = "entity";
            break;
          default:
            subtype = "mundane";
        }
        break;
    }

    return { subtype, role };
  }
}
