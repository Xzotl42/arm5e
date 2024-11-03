import { log } from "./tools.js";
import { CompendiaRefConfig } from "./ui/compendiaRefConfig.js";
import { SourcebookFilterConfig } from "./ui/sourcebookFilterConfig.js";

export function registerSettings() {
  const ARM5E = CONFIG.ARM5E;
  /**
   * Track the system version upon which point a migration was last applied
   */
  game.settings.register(ARM5E.SYSTEM_ID, "systemMigrationVersion", {
    name: "System Migration Version",
    hint: "Allows to reset the version of the system to an older version in order to trigger a migration from that version. \
       Useful to quickly migrate documents freshly imported from an old compendium.",
    scope: "world",
    config: true,
    type: String,
    default: ""
  });

  /**
   * 2 Different sets of default icons for new documents
   */
  game.settings.register(ARM5E.SYSTEM_ID, "defaultIconStyle", {
    name: "Default icons style",
    hint: "Whether black&white or color version of default icons are used at creation of documents. \
      It only applies to brand new documents, a copy will keep the original icon.",
    scope: "world",
    config: true,
    type: String,
    choices: {
      MONO: "Monochrome",
      COLOR: "Color"
    },
    default: "MONO",
    onChange: (value) => {
      CONFIG.ARM5E_DEFAULT_ICONS = CONFIG.ARM5E_DEFAULT_ICONS[value];
    }
  });

  /**
   * 2 Different sets of default icons for new documents
   */
  game.settings.register(ARM5E.SYSTEM_ID, "artsIcons", {
    name: "Icons style for Arts",
    hint: "Choose between the Hermetic Arts symbols or Hand gestures to represent Hermetic Arts.",
    scope: "client",
    config: true,
    type: String,
    choices: {
      symbol: "Hermetic symbols",
      hand: "Hand gestures"
    },
    default: "symbol"
  });

  /**
   * Show source of document
   */
  game.settings.register(ARM5E.SYSTEM_ID, "metagame", {
    name: "Show metagame information",
    hint: "Whether to show the sourcebook and page where an Item is coming from.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(ARM5E.SYSTEM_ID, "showRolls", {
    name: "Show rolls",
    hint: "Who can see the rolls of who.",
    scope: "world",
    config: true,
    choices: {
      ALL: "Give me all details!",
      PLAYERS: "Only players rolls.",
      OWNED: "Only the rolls of owned characters."
    },
    default: "PLAYERS"
  });

  game.settings.register(ARM5E.SYSTEM_ID, "showRollFormulas", {
    name: "Show rolls formula",
    scope: "world",
    config: true,
    choices: {
      ALL: "Give me all details!",
      PLAYERS: "Only players rolls.",
      OWNED: "Only the formula for owned characters."
    },
    default: "PLAYERS"
  });

  /**
   * Show NPC magic details (cast, penetration and defense)
   */
  game.settings.register(ARM5E.SYSTEM_ID, "showNPCMagicDetails", {
    name: "Show NPC magic details (cast, penetration and defense)",
    hint: "During magic contests against a NPC, choose between: \
    -   Tell only if it is a success or failure \
    -   Tell exactly by how much a success or failure happened",
    scope: "world",
    config: true,
    choices: {
      SHOW_ALL: "Give me all details!",
      // PLAYERS: "Only players' results.",
      ONLY_RESULTS: "Show me only the result"
    },
    default: "ONLY_RESULTS"
  });

  /**
   * Fun rolls
   */

  game.settings.register(ARM5E.SYSTEM_ID, "funRolls", {
    name: "Fun stress dice",
    hint: "Show a dialog when rolling a 1 on stress die",
    scope: "world",
    config: true,
    choices: {
      NOBODY: "Nobody",
      PLAYERS_ONLY: "Players only",
      EVERYONE: "Everyone"
    },
    default: "PLAYERS_ONLY"
  });

  game.settings.register(ARM5E.SYSTEM_ID, "dramaticPause", {
    name: "Dramatic pause after rolling a one",
    hint: '[Dice so Nice integration] If you have the Dice so Nice module enabled and the "Fun stress die" setting disabled, \
    it will add a dramatic pause (ms) after rolling a one.',
    scope: "world",
    config: true,
    type: Number,
    range: { min: 0, max: 5000, step: 500 },
    default: 2000
  });

  game.settings.register(ARM5E.SYSTEM_ID, "confirmDelete", {
    name: "Quick delete",
    hint: "Ask for confirmation when deleting an owned item",
    scope: "client",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(ARM5E.SYSTEM_ID, "currentDate", {
    name: "Current date of the system",
    scope: "world",
    config: false,
    type: Object,
    default: { year: 1220, season: "spring", date: "", month: 2, day: 20 }
  });

  game.settings.register(ARM5E.SYSTEM_ID, "trackResources", {
    name: "Track resources",
    hint: "Create a diary entry whenever resources are added or removed from an Actor sheet (to disable during actor creation). This setting is also available in the Astrolabium",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(ARM5E.SYSTEM_ID, "enforceSchedule", {
    name: "Enforce schedule constraints",
    hint: "Whether to prevent users to schedule or apply seasonal activities due to constraints put in the system",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(ARM5E.SYSTEM_ID, "winterFirst", {
    name: "Winter first",
    hint: "Whether the first season of the year is winter or spring (advise: do not change while running a saga)",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });

  // game.settings.register(ARM5E.SYSTEM_ID, "complexeEquipmentMaintenance", {
  //   name: "Complex equipment maintenance",
  //   hint: "How detailed the maintenance of armor and weapons of a covenant is",
  //   scope: "world",
  //   config: true,
  //   type: Boolean,
  //   default: false
  // });

  game.settings.registerMenu(ARM5E.SYSTEM_ID, "sourcebookFilter", {
    name: game.i18n.localize("arm5e.config.sourcebookFilter"),
    label: game.i18n.localize("arm5e.config.sourcebookFilter"),
    icon: "fas fa-cogs",
    type: SourcebookFilterConfig,
    restricted: true
  });

  let filters = {
    custom: ARM5E.generic.sourcesTypes.custom,
    ArM5: ARM5E.generic.sourcesTypes.ArM5,
    ArM5Def: ARM5E.generic.sourcesTypes.ArM5Def
  };

  game.settings.register(ARM5E.SYSTEM_ID, "sourcebookFilter", {
    name: game.i18n.localize("arm5e.config.sourcebookFilter"),
    default: filters,
    type: Object,
    scope: "world",
    config: false
  });

  game.settings.registerMenu(ARM5E.SYSTEM_ID, "compendiaRef", {
    name: game.i18n.localize("arm5e.config.compendiaRef"),
    label: game.i18n.localize("arm5e.config.compendiaRef"),
    hint: game.i18n.localize("arm5e.config.hint.compendiaRef"),
    icon: "fas fa-cogs",
    type: CompendiaRefConfig,
    restricted: true
  });

  game.settings.register(ARM5E.SYSTEM_ID, "compendiaRef", {
    name: game.i18n.localize("arm5e.config.compendiaRef"),
    hint: game.i18n.localize("arm5e.config.hint.compendiaRef"),
    default: "arm5e-compendia",
    type: String,
    scope: "world",
    config: false
  });

  game.settings.register(ARM5E.SYSTEM_ID, "notifyMissingRef", {
    name: game.i18n.localize("Notifiy missing reference"),
    hint: game.i18n.localize("arm5e.config.hint.compendiaRef"),
    default: true,
    type: Boolean,
    scope: "world",
    config: false
  });

  game.settings.register(ARM5E.SYSTEM_ID, "clearUserCache", {
    name: "Clear user cache",
    hint: "Reset user cache on next refresh (filters).",
    icon: "fas fa-trash",
    scope: "client",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(ARM5E.SYSTEM_ID, "alternateStressDie", {
    name: "Use an alternate stress die",
    hint: "Instead of exploding on 1 and checking for botch on 10, it is the opposite. When exploding, add +10 to the roll instead of doubling.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });
}

export async function migrateSettings() {
  const ARM5E = CONFIG.ARM5E;
  let sourcebookFilter = game.settings.get(ARM5E.SYSTEM_ID, "sourcebookFilter");
  if (sourcebookFilter["custom"].display == undefined) {
    await game.settings.set(ARM5E.SYSTEM_ID, "sourcebookFilter", {
      custom: ARM5E.generic.sourcesTypes.custom,
      ArM5: ARM5E.generic.sourcesTypes.ArM5,
      ArM5Def: ARM5E.generic.sourcesTypes.ArM5Def
    });
  }
}
