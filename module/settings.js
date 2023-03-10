import { SourcebookFilterConfig } from "./ui/sourcebookFilterConfig.js";

export function registerSettings() {
  const ARM5E = CONFIG.ARM5E;
  /**
   * Track the system version upon which point a migration was last applied
   */
  game.settings.register(ARM5E.SYSTEM_ID, "systemMigrationVersion", {
    name: "System Migration Version",
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
    scope: "world",
    config: true,
    type: String,
    choices: {
      MONO: "Monochrome",
      COLOR: "Color"
    },
    default: "MONO",
    onChange: value => {
      CONFIG.ARM5E_DEFAULT_ICONS = ARM5E.ARM5E_DEFAULT_ICONS[value];
    }
  });

  /**
   * 2 Different sets of default icons for new documents
   */
  game.settings.register(ARM5E.SYSTEM_ID, "artsIcons", {
    name: "Icons style for art",
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
    name: "Show metagame information (sourcebook, page)",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  /**
   * Show NPC magic details (cast, penetration and defense)
   */
  game.settings.register(ARM5E.SYSTEM_ID, "showNPCMagicDetails", {
    name: "Show NPC magic details (cast, penetration and defense)",
    scope: "world",
    config: true,
    choices: {
      SHOW_ALL: "Give me all details!",
      ONLY_RESULTS: "Show me only the result"
    },
    default: "ONLY_RESULTS"
  });

  /**
   * Fun rolls
   */

  game.settings.register(ARM5E.SYSTEM_ID, "funRolls", {
    name: "Show a dialog when rolling a 1 on stress die",
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
    scope: "world",
    config: true,
    type: Number,
    range: { min: 0, max: 5000, step: 500 },
    default: 2000
  });

  game.settings.register(ARM5E.SYSTEM_ID, "confirmDelete", {
    name: "Ask for confirmation when deleting an owned item",
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
    default: { year: 1220, season: "spring" }
  });

  game.settings.registerMenu(ARM5E.SYSTEM_ID, "sourcebookFilter", {
    name: game.i18n.localize("arm5e.config.sourcebookFilter"),
    label: game.i18n.localize("arm5e.config.sourcebookFilter"),
    icon: "fas fa-cogs",
    type: SourcebookFilterConfig,
    restricted: true
  });

  let filters = {
    custom: ARM5E.generic.sourcesTypes.custom,
    ArM5: ARM5E.generic.sourcesTypes.ArM5
  };

  game.settings.register(ARM5E.SYSTEM_ID, "sourcebookFilter", {
    name: game.i18n.localize("arm5e.config.sourcebookFilter"),
    default: filters,
    type: Object,
    scope: "world",
    config: false
  });
}
