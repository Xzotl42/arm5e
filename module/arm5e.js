// Import Modules
import { ARM5E, enrichAbilities, localizeAbilities, localizeCategories } from "./config.js";
import { ArM5eActor } from "./actor/actor.js";
import { ArM5eItem } from "./item/item.js";
import { ACTOR_SHEET_REGISTRATIONS_V2, ITEM_SHEET_REGISTRATIONS_V2 } from "./sheets/v2-sheets.js";
import ArM5eActiveEffect from "./helpers/active-effects.js";
import { prepareDatasetByTypeOfItem } from "./helpers/hotbar-helpers.js";
import { ArM5ePreloadHandlebarsTemplates } from "./ui/templates.js";
import { ArM5eActiveEffectConfig } from "./sheets/active-effect-config-sheet.js";
import { Astrolabium } from "./apps/astrolabium.js";
import { DocumentPicker } from "./apps/document-picker.js";
// Experiment
import { ArsLayer, addArsButtons } from "./ui/ars-layer.js";
import { customizePause } from "./ui/ars-pause.js";
import { migrateCompendium, migration } from "./migration.js";
import { log } from "./tools/tools.js";

import { migrateSettings, registerSettings } from "./settings.js";
import { registerTestSuites } from "./tests/tests.js";
import { AlternateStressDie, ArsRoll, StressDie, StressDieInternal } from "./helpers/roll.js";
import { clearUserCache } from "./constants/userdata.js";
import {
  ACTIVITIES_DEFAULT_ICONS,
  ARM5E_DEFAULT_ICONS,
  INHABITANTS_DEFAULT_ICONS
} from "./constants/ui.js";
import { SimpleCalendarSeasons, seasonOrder, seasonOrderInv } from "./tools/time.js";
import { magicalAttributesHelper } from "./helpers/magic.js";
import { Arm5eSocketHandler } from "./tools/socket-messages.js";
import { Arm5eChatMessage } from "./helpers/chat-message.js";
import { addActiveEffectsDefinitions } from "./constants/activeEffectsTypes.js";
// import { Astrolab } from "./tools/astrolab.js";
import { ArsApps } from "./ui/apps.js";
import {
  ACTOR_DATAMODEL_REGISTRATIONS,
  CHAT_DATAMODEL_REGISTRATIONS,
  DEPRECATED_ITEM_DATAMODEL_ALIASES,
  ITEM_DATAMODEL_REGISTRATIONS
} from "./schemas/schema-registrations.js";
import {
  buildConflictExclusionTypes,
  buildDuplicateAllowedTypes
} from "./seasonal-activities/activity-config.js";
import { registerActivityRollActions } from "./seasonal-activities/activity-roll-registrations.js";

// Ensure system config exists before any early hooks (e.g. i18nInit) mutate CONFIG.ARM5E.
CONFIG.ARM5E ??= ARM5E;

Hooks.once("i18nInit", async function () {
  CONFIG.ARM5E.LOCALIZED_ABILITIES = localizeAbilities();
  CONFIG.ARM5E.LOCALIZED_ABILITIESCAT = localizeCategories();
  CONFIG.ARM5E.LOCALIZED_ABILITIES_ENRICHED = enrichAbilities(CONFIG.ARM5E.LOCALIZED_ABILITIES);
  // CONFIG.ARM5E.LOCALIZED_ACTIVE_EFFECTS_TYPES;
});

Hooks.once("init", async function () {
  const socketHandler = new Arm5eSocketHandler();
  game.arm5e = {
    ArsLayer,
    ArM5eActor,
    ArM5eItem,
    // ArtSchema,
    ArsApps,
    DocumentPicker,
    socketHandler,
    rollItemMacro,
    migrateCompendium
  };

  CONFIG.ISV14 = game.release.generation === 14;
  CONFIG.ISV13 = game.release.generation === 13;

  // CONFIG.debug.hooks = true;

  // Add system metadata
  CONFIG.ARM5E = ARM5E;
  CONFIG.ARM5E.ItemDataModels = CONFIG.Item.dataModels;
  CONFIG.ARM5E.ActorDataModels = CONFIG.Actor.dataModels;
  registerActivityRollActions(CONFIG.ARM5E.activities?.generic);

  CONFIG.SC = { SEASONS: SimpleCalendarSeasons };

  registerSettings();

  // UI elements
  // CONFIG.ui.actors = ArsActorDirectory;

  /**
   * Set an initiative formula for the system
   * @type {string}
   */
  CONFIG.Combat.initiative = {
    formula: "1ds + @char.qik + @combat.init - @combat.overload + @physicalCondition",
    decimals: 2
  };

  // Adding ars layer
  CONFIG.Canvas.layers.arsmagica = {
    layerClass: ArsLayer,
    group: "interface"
  };

  // Combatant.prototype.getInitiativeRoll = function (formula) {

  // }
  // Experimental
  CONFIG.Dice.types.push(StressDie);
  CONFIG.Dice.types.push(StressDieInternal);
  CONFIG.Dice.types.push(AlternateStressDie);
  CONFIG.Dice.ArsRoll = ArsRoll;
  // CONFIG.Dice.types.push(StressDieNoBotchInternal);
  CONFIG.Dice.terms[StressDie.DENOMINATION] = StressDie;
  CONFIG.Dice.terms[StressDieInternal.DENOMINATION] = StressDieInternal;
  CONFIG.Dice.terms[AlternateStressDie.DENOMINATION] = AlternateStressDie;
  CONFIG.Dice.rolls[0] = ArsRoll;
  // CONFIG.Dice.rolls.push(ArsRoll);

  // UI customization
  CONFIG.Item.sidebarIcon = "ars-Icon_magic-chest";
  CONFIG.JournalEntry.sidebarIcon = "ars-icon-Tool_Journals_sidebar";

  customizePause();
  CONFIG.ARM5E_DEFAULT_ICONS = ARM5E_DEFAULT_ICONS[game.settings.get(ARM5E.SYSTEM_ID, "defaultIconStyle")];
  CONFIG.INHABITANTS_DEFAULT_ICONS =
    INHABITANTS_DEFAULT_ICONS[game.settings.get(ARM5E.SYSTEM_ID, "defaultIconStyle")];
  CONFIG.ACTIVITIES_DEFAULT_ICONS =
    ACTIVITIES_DEFAULT_ICONS[game.settings.get(ARM5E.SYSTEM_ID, "defaultIconStyle")];
  if (game.settings.get(ARM5E.SYSTEM_ID, "winterFirst")) {
    CONFIG.SEASON_ORDER = seasonOrder.winterFirst;
    CONFIG.SEASON_ORDER_INV = seasonOrderInv.winterFirst;
    CONFIG.ARM5E.seasons = CONFIG.ARM5E.seasonsLabels.winterFirst;
  } else {
    CONFIG.SEASON_ORDER = seasonOrder.standard;
    CONFIG.SEASON_ORDER_INV = seasonOrderInv.standard;
    CONFIG.ARM5E.seasons = CONFIG.ARM5E.seasonsLabels.standard;
  }

  CONFIG.ActiveEffect.legacyTransferral = false;

  // ////////////////////
  // CONFIG DONE!
  // ////////////////////

  Hooks.callAll("arm5e-config-done", CONFIG);

  CONFIG.ARM5E.activities.conflictExclusion = buildConflictExclusionTypes();
  CONFIG.ARM5E.activities.duplicateAllowed = buildDuplicateAllowedTypes();

  // Define custom Document classes
  CONFIG.Actor.documentClass = ArM5eActor;
  CONFIG.Item.documentClass = ArM5eItem;
  CONFIG.ActiveEffect.documentClass = ArM5eActiveEffect;
  CONFIG.ChatMessage.documentClass = Arm5eChatMessage;

  // Define datamodel schemas
  setDatamodels();

  // Register sheet application classes
  registerSheets();

  // Preload handlebars templates
  ArM5ePreloadHandlebarsTemplates();

  document.documentElement.style.setProperty(
    "--font-header",
    `"${game.settings.get(ARM5E.SYSTEM_ID, "headerFont")}", serif`
  );

  // /////////
  // HANDLEBARS HELPERS
  // /////////

  Handlebars.registerHelper("magicalAttributesHelper", magicalAttributesHelper);

  Handlebars.registerHelper("systemPath", function (relativePath) {
    const rel = typeof relativePath === "string" ? relativePath.replace(/^\/+/, "") : "";
    return rel ? `systems/${ARM5E.SYSTEM_ID}/${rel}` : `systems/${ARM5E.SYSTEM_ID}/`;
  });

  Handlebars.registerHelper("concat", function () {
    let outStr = "";
    for (let arg in arguments) {
      if (typeof arguments[arg] !== "object") {
        outStr += arguments[arg];
      }
    }
    return new Handlebars.SafeString(outStr);
  });
  Handlebars.registerHelper("toLowerCase", function (str) {
    return str.toLowerCase();
  });

  Handlebars.registerHelper("ifIn", function (elem, list, options) {
    if (list.indexOf(elem) > -1) {
      return options.fn(this);
    }
    return options.inverse(this);
  });

  Handlebars.registerHelper("isGM", function () {
    return game.user.isGM;
  });

  Handlebars.registerHelper("formatOptionalNumber", function (value, options) {
    const originalValue = value;
    const dec = options.hash.decimals ?? 0;
    const sign = options.hash.sign || false;
    if (value === null) return new Handlebars.SafeString("");
    if (typeof value === "string") value = parseFloat(value);
    if (Number.isNaN(value)) {
      console.warn("An invalid value was passed to formatOptionalNumber:", {
        originalValue,
        valueType: typeof originalValue,
        options
      });
    }
    let strVal = sign && value >= 0 ? `+${value.toFixed(dec)}` : value.toFixed(dec);
    return new Handlebars.SafeString(strVal);
  });
});

Hooks.once("ready", async function () {
  // astrolabium singleton
  let formData = {
    seasons: CONFIG.ARM5E.seasons,
    ...game.settings.get(ARM5E.SYSTEM_ID, "currentDate")
  };
  ui.astrolabium = new Astrolabium({ document: formData });

  // add generated active effects based on CONFIG

  addActiveEffectsDefinitions();

  await migrateSettings();
  // Check that the arm5e-compendia module is at least the minimum version
  const req = game.system.relationships.requires.find((e) => e.id === CONFIG.ARM5E.REF_MODULE_ID);
  if (req) {
    const minVersion = req.compatibility.minimum;
    const currentVersion = game.modules.get("arm5e-compendia").version;
    if (foundry.utils.isNewerVersion(minVersion, currentVersion)) {
      ui.notifications.warn(
        game.i18n.format("arm5e.system.dependencyWarning", {
          name: "arm5e-compendia",
          minimum: minVersion,
          current: currentVersion
        }),
        {
          permanent: true
        }
      );
    }
  }

  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => {
    if (["Item", "Actor"].includes(data.type)) {
      createArM5eMacro(data, slot);
      return false;
    }
  });

  Hooks.on("dropActorSheetData", (actor, sheet, data) => onDropActorSheetData(actor, sheet, data));
  // Hooks.on("dropCanvasData", async (canvas, data) => onDropOnCanvas(canvas, data));

  Hooks.on("updateActor", (actor) => {
    void syncLinkedInhabitantsForActor(actor);
  });
  Hooks.on("createItem", (item) => {
    if (!item?.parent || !["ability", "personalityTrait"].includes(item.type)) return;
    void syncLinkedInhabitantsForActor(item.parent);
  });
  Hooks.on("updateItem", (item) => {
    if (!item?.parent || !["ability", "personalityTrait"].includes(item.type)) return;
    void syncLinkedInhabitantsForActor(item.parent);
  });
  Hooks.on("deleteItem", (item) => {
    if (!item?.parent || !["ability", "personalityTrait"].includes(item.type)) return;
    void syncLinkedInhabitantsForActor(item.parent);
  });

  if (game.user.isGM) {
    // Determine whether a system migration is required and feasible
    // this below assumes that we stay on single digit version numbers...
    const currentVersion = game.settings.get(ARM5E.SYSTEM_ID, "systemMigrationVersion");
    const SYSTEM_VERSION_NEEDED = game.system.version;
    const COMPATIBLE_MIGRATION_VERSION = "1.1";
    const totalDocuments = game.actors.size + game.scenes.size + game.items.size;

    if (!currentVersion && totalDocuments === 0) {
      game.settings.set(ARM5E.SYSTEM_ID, "systemMigrationVersion", SYSTEM_VERSION_NEEDED);
    } else {
      // TODO remove after a while
      const UPDATE_BUG_VERSION = "2.0.2.8";
      if (foundry.utils.isNewerVersion(UPDATE_BUG_VERSION, currentVersion)) {
        ChatMessage.create({
          content:
            "<b>IMPORTANT NOTIFICATION</b><br/>" +
            "You receive this notification because you upgraded from a version lower than 2.0.2.8." +
            "On the change to V10 there was a bug introduced in the automatic update mechanism.<br/>" +
            "<br/><b>The only way to fix it is to uninstall the system and reinstall it again on your side </b>" +
            "(not the world, just the system, <b>your data is safe</b>).<br/>" +
            "<br/>If you don't do it, when you update, you will receive the latest changes from the dev branch with features under construction, unfinished and sometime buggy..." +
            "<br/>Sorry for the inconvenience"
        });
      }
      // END TODO
      const needsMigration =
        !currentVersion || foundry.utils.isNewerVersion(SYSTEM_VERSION_NEEDED, currentVersion);
      if (needsMigration) {
        // Perform the migration
        if (
          currentVersion &&
          foundry.utils.isNewerVersion(COMPATIBLE_MIGRATION_VERSION, currentVersion)
        ) {
          const warning =
            "Your Ars Magica system data is from too old a Foundry version and cannot be reliably migrated to the latest version. The process will be attempted, but errors may occur.";
          ui.notifications.error(warning, {
            permanent: true
          });
        }
        await migration(currentVersion);
      }
    }
  }

  // Setup session storage:

  if (game.settings.get(ARM5E.SYSTEM_ID, "clearUserCache")) {
    clearUserCache();
    game.settings.set(ARM5E.SYSTEM_ID, "clearUserCache", false);
  }
  let userData = sessionStorage.getItem(`usercache-${game.user.id}`);
  if (!userData) {
    // Create user cache if it doesn't exist yet
    sessionStorage.setItem(
      `usercache-${game.user.id}`,
      JSON.stringify({ version: game.system.version })
    );
  }

  // Await createIndexKeys(`${ARM5E.REF_MODULE_ID}.abilities`);
  // await createIndexKeys(`${ARM5E.REF_MODULE_ID}.flaws`);
  // await createIndexKeys(`${ARM5E.REF_MODULE_ID}.virtues`);
  // await createIndexKeys(`${ARM5E.REF_MODULE_ID}.laboratory-flaws`);
  // await createIndexKeys(`${ARM5E.REF_MODULE_ID}.laboratory-virtues`);
  // await createIndexKeys(`${ARM5E.REF_MODULE_ID}.equipment`);

  // compute indexes
  game.packs
    .get(`${ARM5E.REF_MODULE_ID}.abilities`)
    .getIndex({ fields: ["system.key", "system.option", "system.indexKey"] });
  game.packs.get(`${ARM5E.REF_MODULE_ID}.virtues`).getIndex({ fields: ["system.indexKey"] });
  game.packs.get(`${ARM5E.REF_MODULE_ID}.flaws`).getIndex({ fields: ["system.indexKey"] });
  game.packs.get(`${ARM5E.REF_MODULE_ID}.equipment`).getIndex({ fields: ["system.indexKey"] });
  game.packs.get(`${ARM5E.REF_MODULE_ID}.spells`).getIndex({
    fields: [
      "system.indexKey",
      "system.technique.value",
      "system.form.value",
      "system.baseLevel",
      "system.level",
      "system.technique-req",
      "system.form-req",
      "system.range.value",
      "system.duration.value",
      "system.target.value",
      // "system.complexity",
      // "system.targetSize",
      // "system.enhancingRequisite",
      "system.ritual"
      // "system.general",
      // "system.levelOffset"
    ]
  });

  // TESTING
});

/**
 * This function runs after game data has been requested and loaded from the servers, so entities exist
 */

Hooks.once("setup", async function () {});

Hooks.once("devModeReady", ({ registerPackageDebugFlag }) => {
  registerPackageDebugFlag(ARM5E.SYSTEM_ID);
});

Hooks.on("quenchReady", (quench) => {
  registerTestSuites(quench);
});

Hooks.on("simple-calendar-date-time-change", async (data) => {
  // Ignore change of less than an hour
  if (Math.abs(data.diff) < 3600) return;
  let current = game.settings.get(ARM5E.SYSTEM_ID, "currentDate");
  let newDatetime = {};
  if (
    current.year !== Number(data.date.year) ||
    current.season !== CONFIG.SC.SEASONS[data.date.currentSeason.name]
  ) {
    newDatetime = {
      year: Number(data.date.year),
      season: CONFIG.SC.SEASONS[data.date.currentSeason.name],
      date: "",
      month: data.date.month,
      day: data.date.day
    };
    await game.settings.set(ARM5E.SYSTEM_ID, "currentDate", newDatetime);
    Hooks.callAll("arm5e-date-change", newDatetime);
  }
});

// Hooks.on("diceSoNiceMessagePreProcess", (messageId, interception) => {
//   if (!game.dice3d) return;
//   const message = game.messages.get(messageId);
//   if (!message) return;
//   if (message.rolls.length >= 1) {
//     interception.willTrigger3DRoll = false;
//   }
// });

// // TODO: remove when V14 only and use the above
Hooks.on("diceSoNiceMessageProcessed", (messageId, interception) => {
  if (!game.dice3d) return;
  const message = game.messages.get(messageId);
  if (!message) return;
  if (message.rolls.length > 1) {
    interception.willTrigger3DRoll = false;
  }
});
/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createArM5eMacro(data, slot) {
  const doc = await fromUuid(data.uuid);

  if (doc.isOwned) {
    // Create the macro command
    const command = `game.arm5e.rollItemMacro('${doc.uuid}', '${doc.actor.uuid}',event);`;
    let macro = game.macros.contents.find((m) => m.name === doc.name && m.command === command);
    if (!macro) {
      macro = await Macro.create({
        name: doc.name,
        type: "script",
        img: doc.img,
        command: command,
        flags: {
          "arm5e.itemMacro": true
        }
      });
    }
    await game.user.assignHotbarMacro(macro, slot);
    return true;
  } else {
    let macro = await Macro.implementation.create({
      name: `${game.i18n.localize("Display")} ${doc.name}`,
      type: CONST.MACRO_TYPES.SCRIPT,
      img: doc.img,
      command: `await foundry.applications.ui.Hotbar.toggleDocumentSheet("${doc.uuid}");`
    });
    await game.user.assignHotbarMacro(macro, slot);
    return true;
  }
}

/**
 *
 * @param actor
 * @param sheet
 * @param data
 */
async function onDropActorSheetData(actor, sheet, data) {
  if (data.type === "Folder") {
    return true;
  }
  if (data.type === "Item") {
    let item = await fromUuid(data.uuid);

    // For book topics
    if (data.topicIdx) {
      item.topicIdx = data.topicIdx;
    }
    if (sheet.isItemDropAllowed(item)) {
      return true;
    } else {
      log(true, `Prevented invalid item drop ${item.name} on actor ${actor.name}`);
      return false;
    }
  } else if (data.type === "Actor") {
    let droppedActor = await fromUuid(data.uuid);

    if (sheet.isActorDropAllowed(droppedActor.type)) {
      return true;
    } else {
      console.log("Prevented invalid Actor drop");
      return false;
    }
  } else {
    return false;
  }
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param itemUuid
 * @param actorUuid
 * @param event
 */
function rollItemMacro(itemUuid, actorUuid, event = undefined) {
  let item = null;
  let actor = null;

  if (actorUuid.length === 16) {
    actor = game.actors.get(actorUuid);
    ui.notifications.warn(
      `This is a legacy macro. Please recreate it as it may not work anymore in future versions.`
    );
  } else {
    actor = fromUuidSync(actorUuid);
  }

  if (!actor) {
    return ui.notifications.warn(`No Actor with Id ${actorUuid} exists in the world`);
  }

  if (itemUuid.length === 16) {
    item = actor.items.get(itemUuid);
    ui.notifications.warn(
      `This is a legacy macro. Please recreate it as it may not work anymore in future versions.`
    );
  } else {
    item = fromUuidSync(itemUuid);
  }

  if (!item)
    return ui.notifications.warn(
      `Your controlled Actor does not have an item with Uuid: ${itemUuid}`
    );
  if (event) {
    if (event.shiftKey) {
      item.sheet.render(true);
      return;
    } else if (event.ctrlKey) {
      actor.sheet.render(true);
      return;
    }
  }

  const dataset = prepareDatasetByTypeOfItem(item);
  if (foundry.utils.isEmpty(dataset)) {
    item.sheet.render(true);
  } else if (item.type === "power") {
    actor.sheet._onUsePower(dataset);
  } else {
    actor.sheet.roll(dataset);
  }
}

Hooks.on("renderDialogV2", (app, html, data, options) => {
  let deprecatedTypes = [
    "art",
    "magicItem",
    "personalityTrait",
    "reputation",
    "habitantMagi",
    "inhabitant",
    "habitantCompanion",
    "habitantSpecialists",
    "habitantHabitants",
    "habitantHorses",
    "habitantLivestock",
    "visStockCovenant",
    "baseEffect",
    "sanctumRoom",
    "labCovenant",
    "abilityFamiliar",
    "powerFamiliar",
    "speciality",
    "distinctive",
    "personality",
    "mundaneBook",
    "calendarCovenant",
    "wound",
    "container"
  ]; //
  html.querySelectorAll('select[name="type"] option').forEach((i) => {
    if (deprecatedTypes.includes(i.value)) {
      i.remove();
    }
  });
});

// On Apply an ActiveEffect that uses a CUSTOM application mode.
Hooks.on("applyActiveEffect", (actor, change, current, delta, changes) => {
  ArM5eActiveEffect.applyCustomEffect(actor, change, current, delta, changes);
});

Hooks.on("getSceneControlButtons", (buttons) => addArsButtons(buttons));

/**
 *
 */
function setDatamodels() {
  Object.assign(CONFIG.ARM5E.ItemDataModels, ITEM_DATAMODEL_REGISTRATIONS);
  Object.assign(CONFIG.ARM5E.ActorDataModels, ACTOR_DATAMODEL_REGISTRATIONS);
  Object.assign(CONFIG.ChatMessage.dataModels, CHAT_DATAMODEL_REGISTRATIONS);

  // Deprecated types
  Object.assign(CONFIG.ARM5E.ItemDataModels, DEPRECATED_ITEM_DATAMODEL_ALIASES);
}

/**
 *
 */
function registerSheets() {
  try {
    foundry.applications.apps.DocumentSheetConfig.unregisterSheet(
      Actor,
      "core",
      foundry.appv1.sheets.ActorSheet
    );

    for (const { id, sheetClass, options } of ACTOR_SHEET_REGISTRATIONS_V2) {
      foundry.applications.apps.DocumentSheetConfig.registerSheet(Actor, id, sheetClass, options);
    }

    foundry.applications.apps.DocumentSheetConfig.unregisterSheet(
      Item,
      "core",
      foundry.appv1.sheets.ItemSheet
    );

    for (const { sheetClass, options } of ITEM_SHEET_REGISTRATIONS_V2) {
      foundry.applications.apps.DocumentSheetConfig.registerSheet(
        Item,
        ARM5E.SYSTEM_ID,
        sheetClass,
        options
      );
    }

    foundry.applications.apps.DocumentSheetConfig.unregisterSheet(
      ActiveEffect,
      "core",
      foundry.applications.sheets.ActiveEffectConfig
    );

    foundry.applications.apps.DocumentSheetConfig.registerSheet(
      ActiveEffect,
      ARM5E.SYSTEM_ID,
      ArM5eActiveEffectConfig
    );
  } catch (err) {
    err.message = `Failed registration of a sheet: ${err.message}`;
    console.error(err);
  }
}
