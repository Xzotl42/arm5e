// Import Modules
import { ARM5E, enrichAbilities, localizeAbilities, localizeCategories } from "./config.js";
import { ArM5eActor } from "./actor/actor.js";
import { ArM5ePCActorSheet } from "./actor/actor-pc-sheet.js";
import { ArM5eBeastActorSheet } from "./actor/actor-beast-sheet.js";
import { ArM5eNPCActorSheet } from "./actor/actor-npc-sheet.js";
import { ArM5eLaboratoryActorSheet } from "./actor/actor-laboratory-sheet.js";
import { ArM5eCovenantActorSheet } from "./actor/actor-covenant-sheet.js";
import { ArM5eMagicCodexSheet } from "./actor/actor-magic-codex-sheet.js";
import { ArM5eItem } from "./item/item.js";
import { ArM5eItemSheet, ArM5eItemSheetNoDesc } from "./item/item-sheet.js";
import { ArM5eItemMagicSheet } from "./item/item-magic-sheet.js";
import { ArM5eBookSheet } from "./item/item-book-sheet.js";
import { ArM5eItemDiarySheet } from "./item/item-diary-sheet.js";
import { ArM5eItemVisSheet } from "./item/item-vis-sheet.js";
import ArM5eActiveEffect from "./helpers/active-effects.js";
import { prepareDatasetByTypeOfItem } from "./helpers/hotbar-helpers.js";
import { ArM5ePreloadHandlebarsTemplates } from "./templates.js";
import { ArM5eActiveEffectConfig } from "./helpers/active-effect-config.sheet.js";
import { ArM5eActiveEffectConfigV2 } from "./sheets/active-effect-config-sheet_V2.js";

// Experiment
import { ArsLayer, addArsButtons } from "./ui/ars-layer.js";
import { customizePause } from "./ui/ars-pause.js";
import { migrateCompendium, migration } from "./migration.js";
import { log } from "./tools.js";

import { migrateSettings, registerSettings } from "./settings.js";
import { registerTestSuites } from "./tests/tests.js";
import { AlternateStressDie, ArsRoll, StressDie, StressDieInternal } from "./helpers/stressdie.js";
import { UserguideTour } from "./tours/userguide-tour.js";
import { BaseEffectSchema, MagicalEffectSchema, SpellSchema } from "./schemas/magicSchemas.js";
import { AbilitySchema } from "./schemas/abilitySchema.js";
import { BookSchema } from "./schemas/bookSchema.js";
import { DiaryEntrySchema } from "./schemas/diarySchema.js";
import {
  ItemSchema,
  PersonalityTraitSchema,
  QualityInferioritySchema,
  ReputationSchema,
  SanctumSchema,
  VirtueFlawSchema
} from "./schemas/minorItemsSchemas.js";
import { LabSchema } from "./schemas/labSchema.js";
import { ArmorSchema, WeaponSchema } from "./schemas/weaponArmorSchema.js";
import { CodexSchema } from "./schemas/actorCommonSchema.js";
import { VisSchema, VisSourceSchema } from "./schemas/visSchema.js";
import { clearUserCache } from "./constants/userdata.js";
import {
  ACTIVITIES_DEFAULT_ICONS,
  ARM5E_DEFAULT_ICONS,
  INHABITANTS_DEFAULT_ICONS
} from "./constants/ui.js";
import { InhabitantSchema } from "./schemas/inhabitantSchema.js";
import { SimpleCalendarSeasons, seasonOrder, seasonOrderInv } from "./tools/time.js";
import { WoundSchema } from "./schemas/woundSchema.js";
import { ArM5eSmallSheet } from "./item/item-small-sheet.js";
import { EnchantmentEffectSchema } from "./schemas/enchantmentSchema.js";
import { magicalAttributesHelper } from "./helpers/magic.js";
import { CovenantSchema } from "./schemas/covenantSchema.js";
import { ArM5eCovenantInhabitantSheet } from "./item/item-inhabitantCovenant.js";
import { ArM5eSupernaturalEffectSheet } from "./item/item-supernaturalEffect-sheet.js";
import { SupernaturalEffectSchema } from "./schemas/supernaturalEffectSchema.js";
import { Arm5eSocketHandler } from "./helpers/socket-messages.js";
import { PowerSchema } from "./schemas/powerSchemas.js";
import {
  BasicChatSchema,
  CombatChatSchema,
  RollChatSchema,
  MagicChatSchema,
  DamageChatSchema
} from "./schemas/chatSchema.js";
import { Arm5eChatMessage } from "./helpers/chat-message.js";
import { addActiveEffectsDefinitions } from "./constants/activeEffectsTypes.js";
import { Astrolab } from "./tools/astrolab.js";
import { ArsApps } from "./tools/apps.js";
import { LabTextSchema } from "./schemas/labTextSchema.js";

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
    socketHandler,
    rollItemMacro,
    migrateCompendium
  };

  CONFIG.ISV13 = game.release.generation == 13;
  // Add system metadata
  CONFIG.ARM5E = ARM5E;
  CONFIG.ARM5E.ItemDataModels = CONFIG.Item.dataModels;
  CONFIG.ARM5E.ActorDataModels = CONFIG.Actor.dataModels;

  CONFIG.SC = { SEASONS: SimpleCalendarSeasons };

  registerSettings();

  // UI elements
  // CONFIG.ui.actors = ArsActorDirectory;

  // Game.tours.register(
  //   ARM5E.SYSTEM_ID,
  //   "userguide",
  //   await UserguideTour.fromJSON("systems/arm5e/tours/userguide.json")
  // );

  /**
   * Set an initiative formula for the system
   * @type {string}
   */
  CONFIG.Combat.initiative = {
    formula: "1ds + @char.qik + @combat.init - @combat.overload + @physicalCondition",
    decimals: 2
  };

  // Adding ars layer
  if (CONFIG.ISV13) {
    CONFIG.Canvas.layers.arsmagica = {
      layerClass: ArsLayer,
      group: "interface"
    };
  } else {
    CONFIG.Canvas.layers.arsmagica = {
      layerClass: ArsLayer,
      group: "primary"
    };
  }

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
  //CONFIG.Dice.rolls.push(ArsRoll);

  // UI customization
  CONFIG.Item.sidebarIcon = "icon-Icon_magic-chest";
  CONFIG.JournalEntry.sidebarIcon = "icon-Tool_Journals_sidebar";

  if (CONFIG.ISV13) {
    customizePause();
  }
  CONFIG.ARM5E_DEFAULT_ICONS = ARM5E_DEFAULT_ICONS[game.settings.get("arm5e", "defaultIconStyle")];
  CONFIG.INHABITANTS_DEFAULT_ICONS =
    INHABITANTS_DEFAULT_ICONS[game.settings.get("arm5e", "defaultIconStyle")];
  CONFIG.ACTIVITIES_DEFAULT_ICONS =
    ACTIVITIES_DEFAULT_ICONS[game.settings.get("arm5e", "defaultIconStyle")];
  if (game.settings.get("arm5e", "winterFirst")) {
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

  CONFIG.ARM5E.activities.conflictExclusion = Object.entries(CONFIG.ARM5E.activities.generic)
    .filter((e) => e[1].scheduling.conflict == false)
    .map((e) => e[0]);
  CONFIG.ARM5E.activities.duplicateAllowed = Object.entries(CONFIG.ARM5E.activities.generic)
    .filter((e) => e[1].scheduling.duplicate)
    .map((e) => e[0]);

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
    `"${game.settings.get("arm5e", "headerFont")}", serif`
  );

  // /////////
  // HANDLEBARS HELPERS
  // /////////

  Handlebars.registerHelper("magicalAttributesHelper", magicalAttributesHelper);

  Handlebars.registerHelper("concat", function () {
    let outStr = "";
    for (let arg in arguments) {
      if (typeof arguments[arg] != "object") {
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
    if (value == null) return new Handlebars.SafeString("");
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
    ...game.settings.get("arm5e", "currentDate")
  };
  ui.astrolab = new Astrolab(formData, {});

  // add generated active effects based on CONFIG

  addActiveEffectsDefinitions();

  await migrateSettings();
  // Check that the arm5e-compendia module is at least the minimum version
  const req = game.system.relationships.requires.find((e) => e.id == CONFIG.ARM5E.REF_MODULE_ID);
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

  if (game.release.generation == 13) {
    ui.notifications.info(game.i18n.localize("arm5e.system.V13Disclaimer"), {
      permanent: false
    });
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

  if (game.user.isGM) {
    // Determine whether a system migration is required and feasible
    // this below assumes that we stay on single digit version numbers...
    const currentVersion = game.settings.get("arm5e", "systemMigrationVersion");
    const SYSTEM_VERSION_NEEDED = game.system.version;
    const COMPATIBLE_MIGRATION_VERSION = "1.1";
    const totalDocuments = game.actors.size + game.scenes.size + game.items.size;

    if (!currentVersion && totalDocuments === 0) {
      game.settings.set("arm5e", "systemMigrationVersion", SYSTEM_VERSION_NEEDED);
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

  if (game.settings.get("arm5e", "clearUserCache")) {
    clearUserCache();
    game.settings.set("arm5e", "clearUserCache", false);
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
  let current = game.settings.get("arm5e", "currentDate");
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
    await game.settings.set("arm5e", "currentDate", newDatetime);
    Hooks.callAll("arm5e-date-change", newDatetime);
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
    const command = `game.arm5e.rollItemMacro('${doc._id}', '${doc.actor._id}',event);`;
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
      command: `await Hotbar.toggleDocumentSheet("${doc.uuid}");`
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
  if (data.type == "Folder") {
    return true;
  }
  if (data.type == "Item") {
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
  } else if (data.type == "Actor") {
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
 * @param {string} itemName
 * @param itemId
 * @param actorId
 * @returns {Promise}
 */
function rollItemMacro(itemId, actorId, event = undefined) {
  const actor = game.actors.get(actorId);
  if (!actor) {
    return ui.notifications.warn(`No Actor with Id ${actorId} exists in the world`);
  }
  const item = actor.items.get(itemId);
  if (!item)
    return ui.notifications.warn(`Your controlled Actor does not have an item with ID: ${itemId}`);
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
  } else if (item.type == "power") {
    actor.sheet._onUsePower(dataset);
  } else {
    actor.sheet._onRoll(dataset);
  }
}

Hooks.on("renderDialog", (dialog, html) => {
  let deprecatedTypes = [
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
  Array.from(html.find("#document-create option")).forEach((i) => {
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

// V12 only
Hooks.on("renderPause", function () {
  if ($("#pause").attr("class") !== "paused") return;
  const path = "systems/arm5e/assets/clockwork.svg";
  const opacity = 0.6;
  $("#pause.paused img").attr("src", path);
  $("#pause.paused img").css({ opacity: opacity, "--fa-animation-duration": "20s" });
});

/**
 *
 */
function setDatamodels() {
  // CONFIG.ARM5E.ItemDataModels["art"] = ArtSchema;
  CONFIG.ARM5E.ItemDataModels.ability = AbilitySchema;
  CONFIG.ARM5E.ItemDataModels.virtue = VirtueFlawSchema;
  CONFIG.ARM5E.ItemDataModels.flaw = VirtueFlawSchema;
  CONFIG.ARM5E.ItemDataModels.quality = QualityInferioritySchema;
  CONFIG.ARM5E.ItemDataModels.inferiority = QualityInferioritySchema;
  CONFIG.ARM5E.ItemDataModels.item = ItemSchema;
  CONFIG.ARM5E.ItemDataModels.vis = VisSchema;
  CONFIG.ARM5E.ItemDataModels.visSourcesCovenant = VisSourceSchema;
  CONFIG.ARM5E.ItemDataModels.baseEffect = BaseEffectSchema;
  CONFIG.ARM5E.ItemDataModels.magicalEffect = MagicalEffectSchema;
  CONFIG.ARM5E.ItemDataModels.spell = SpellSchema;
  CONFIG.ARM5E.ItemDataModels.laboratoryText = LabTextSchema;
  CONFIG.ARM5E.ItemDataModels.personalityTrait = PersonalityTraitSchema;
  CONFIG.ARM5E.ItemDataModels.reputation = ReputationSchema;
  CONFIG.ARM5E.ItemDataModels.armor = ArmorSchema;
  CONFIG.ARM5E.ItemDataModels.weapon = WeaponSchema;
  CONFIG.ARM5E.ItemDataModels.inhabitant = InhabitantSchema;
  CONFIG.ARM5E.ItemDataModels.wound = WoundSchema;
  CONFIG.ARM5E.ItemDataModels.labCovenant = SanctumSchema;

  CONFIG.ARM5E.ItemDataModels.enchantment = EnchantmentEffectSchema;
  CONFIG.ARM5E.ItemDataModels.book = BookSchema;
  CONFIG.ARM5E.ItemDataModels.diaryEntry = DiaryEntrySchema;
  CONFIG.ARM5E.ItemDataModels.supernaturalEffect = SupernaturalEffectSchema;
  CONFIG.ARM5E.ItemDataModels.power = PowerSchema;
  // Actors
  CONFIG.ARM5E.ActorDataModels.laboratory = LabSchema;
  CONFIG.ARM5E.ActorDataModels.magicCodex = CodexSchema;
  CONFIG.ARM5E.ActorDataModels.covenant = CovenantSchema;

  // ChatMessages

  CONFIG.ChatMessage.dataModels.standard = BasicChatSchema;
  CONFIG.ChatMessage.dataModels.roll = RollChatSchema;
  CONFIG.ChatMessage.dataModels.combat = CombatChatSchema;
  CONFIG.ChatMessage.dataModels.magic = MagicChatSchema;
  CONFIG.ChatMessage.dataModels.damage = DamageChatSchema;
  // Deprecated types
  CONFIG.ARM5E.ItemDataModels.visStockCovenant = VisSchema;
}

/**
 *
 */
function registerSheets() {
  try {
    if (CONFIG.ISV13) {
      foundry.applications.apps.DocumentSheetConfig.unregisterSheet(
        Actor,
        "core",
        foundry.appv1.sheets.ActorSheet
      );

      // ["player","npc","laboratoy","covenant"],
      foundry.applications.apps.DocumentSheetConfig.registerSheet(
        Actor,
        "arm5ePC",
        ArM5ePCActorSheet,
        {
          types: ["player"],
          makeDefault: true,
          label: "arm5e.sheet.player"
        }
      );
      foundry.applications.apps.DocumentSheetConfig.registerSheet(
        Actor,
        "arm5eNPC",
        ArM5eNPCActorSheet,
        {
          types: ["npc"],
          makeDefault: true,
          label: "arm5e.sheet.npc"
        }
      );
      foundry.applications.apps.DocumentSheetConfig.registerSheet(
        Actor,
        "arm5eBeast",
        ArM5eBeastActorSheet,
        {
          types: ["beast"],
          makeDefault: true,
          label: "arm5e.sheet.beast"
        }
      );

      foundry.applications.apps.DocumentSheetConfig.registerSheet(
        Actor,
        "arm5eLaboratory",
        ArM5eLaboratoryActorSheet,
        {
          types: ["laboratory"],
          makeDefault: true,
          label: "arm5e.sheet.laboratory"
        }
      );
      foundry.applications.apps.DocumentSheetConfig.registerSheet(
        Actor,
        "arm5eCovenant",
        ArM5eCovenantActorSheet,
        {
          types: ["covenant"],
          makeDefault: true,
          label: "arm5e.sheet.covenant"
        }
      );

      foundry.applications.apps.DocumentSheetConfig.registerSheet(
        Actor,
        "arm5eMagicCodex",
        ArM5eMagicCodexSheet,
        {
          types: ["magicCodex"],
          makeDefault: true,
          label: "arm5e.sheet.magic-codex"
        }
      );

      // Handlebars.registerHelper("arraySize", function (data) {
      //   return data.length;
      // });

      // let astrolabData = game.
      foundry.applications.apps.DocumentSheetConfig.unregisterSheet(
        Item,
        "core",
        foundry.appv1.sheets.ItemSheet
      );

      foundry.applications.apps.DocumentSheetConfig.registerSheet(Item, "arm5e", ArM5eSmallSheet, {
        types: ["wound"],
        makeDefault: true
      });

      foundry.applications.apps.DocumentSheetConfig.registerSheet(Item, "arm5e", ArM5eItemSheet, {
        types: [
          "art",
          "weapon",
          "armor",
          "item",
          "virtue",
          "flaw",
          "quality",
          "inferiority",
          "ability",
          "abilityFamiliar",
          // "might",
          "powerFamiliar",
          // "mightFamiliar",
          "speciality",
          "distinctive",
          "sanctumRoom",
          "reputation",
          // "inhabitant",
          "habitantMagi", // Deprecated
          "habitantCompanion", // Deprecated
          "habitantSpecialists", // Deprecated
          "habitantHabitants", // Deprecated
          "habitantHorses", // Deprecated
          "habitantLivestock", // Deprecated
          "possessionsCovenant",
          "visSourcesCovenant",
          "visStockCovenant",
          "calendarCovenant",
          "incomingSource",
          "labCovenant",
          "personalityTrait"
        ],
        makeDefault: true
      });
      foundry.applications.apps.DocumentSheetConfig.registerSheet(
        Item,
        "arm5e",
        ArM5eItemVisSheet,
        {
          types: ["vis"],
          makeDefault: true
        }
      );
      foundry.applications.apps.DocumentSheetConfig.registerSheet(Item, "arm5e", ArM5eBookSheet, {
        types: ["book"],
        makeDefault: true
      });

      foundry.applications.apps.DocumentSheetConfig.registerSheet(
        Item,
        "arm5e",
        ArM5eItemDiarySheet,
        {
          types: ["diaryEntry"],
          makeDefault: true
        }
      );
      foundry.applications.apps.DocumentSheetConfig.registerSheet(
        Item,
        "arm5e",
        ArM5eCovenantInhabitantSheet,
        {
          types: ["inhabitant"],
          makeDefault: true
        }
      );

      foundry.applications.apps.DocumentSheetConfig.registerSheet(
        Item,
        "arm5e",
        ArM5eItemMagicSheet,
        {
          types: [
            "magicalEffect",
            "enchantment",
            "spell",
            "baseEffect",
            "laboratoryText",
            "magicItem",
            "power"
          ],
          makeDefault: true
        }
      );

      foundry.applications.apps.DocumentSheetConfig.registerSheet(
        Item,
        "arm5e",
        ArM5eSupernaturalEffectSheet,
        {
          types: ["supernaturalEffect"],
          makeDefault: true
        }
      );

      // Items.registerSheet("arm5e", ArM5eItemSheetNoDesc, { types: ["vis"] });

      foundry.applications.apps.DocumentSheetConfig.unregisterSheet(
        ActiveEffect,
        "core",
        foundry.applications.sheets.ActiveEffectConfig
      );

      foundry.applications.apps.DocumentSheetConfig.registerSheet(
        ActiveEffect,
        "arm5e",
        ArM5eActiveEffectConfigV2
      );
    } else {
      // V12
      Actors.unregisterSheet("core", ActorSheet);

      // ["player","npc","laboratoy","covenant"],
      Actors.registerSheet("arm5ePC", ArM5ePCActorSheet, {
        types: ["player"],
        makeDefault: true,
        label: "arm5e.sheet.player"
      });
      Actors.registerSheet("arm5eNPC", ArM5eNPCActorSheet, {
        types: ["npc"],
        makeDefault: true,
        label: "arm5e.sheet.npc"
      });
      Actors.registerSheet("arm5eBeast", ArM5eBeastActorSheet, {
        types: ["beast"],
        makeDefault: true,
        label: "arm5e.sheet.beast"
      });

      Actors.registerSheet("arm5eLaboratory", ArM5eLaboratoryActorSheet, {
        types: ["laboratory"],
        makeDefault: true,
        label: "arm5e.sheet.laboratory"
      });
      Actors.registerSheet("arm5eCovenant", ArM5eCovenantActorSheet, {
        types: ["covenant"],
        makeDefault: true,
        label: "arm5e.sheet.covenant"
      });

      Actors.registerSheet("arm5eMagicCodex", ArM5eMagicCodexSheet, {
        types: ["magicCodex"],
        makeDefault: true,
        label: "arm5e.sheet.magic-codex"
      });

      // Handlebars.registerHelper("arraySize", function (data) {
      //   return data.length;
      // });

      // let astrolabData = game.
      DocumentSheetConfig.unregisterSheet(Item, "core", ItemSheet);

      DocumentSheetConfig.registerSheet(Item, "arm5e", ArM5eSmallSheet, {
        types: ["wound"],
        makeDefault: true
      });

      DocumentSheetConfig.registerSheet(Item, "arm5e", ArM5eItemSheet, {
        types: [
          "art",
          "weapon",
          "armor",
          "item",
          "virtue",
          "flaw",
          "quality",
          "inferiority",
          "ability",
          "abilityFamiliar",
          // "might",
          "powerFamiliar",
          // "mightFamiliar",
          "speciality",
          "distinctive",
          "sanctumRoom",
          "reputation",
          // "inhabitant",
          "habitantMagi", // Deprecated
          "habitantCompanion", // Deprecated
          "habitantSpecialists", // Deprecated
          "habitantHabitants", // Deprecated
          "habitantHorses", // Deprecated
          "habitantLivestock", // Deprecated
          "possessionsCovenant",
          "visSourcesCovenant",
          "visStockCovenant",
          "calendarCovenant",
          "incomingSource",
          "labCovenant",
          "personalityTrait"
        ],
        makeDefault: true
      });
      DocumentSheetConfig.registerSheet(Item, "arm5e", ArM5eItemVisSheet, {
        types: ["vis"],
        makeDefault: true
      });
      DocumentSheetConfig.registerSheet(Item, "arm5e", ArM5eBookSheet, {
        types: ["book"],
        makeDefault: true
      });

      DocumentSheetConfig.registerSheet(Item, "arm5e", ArM5eItemDiarySheet, {
        types: ["diaryEntry"],
        makeDefault: true
      });
      DocumentSheetConfig.registerSheet(Item, "arm5e", ArM5eCovenantInhabitantSheet, {
        types: ["inhabitant"],
        makeDefault: true
      });

      DocumentSheetConfig.registerSheet(Item, "arm5e", ArM5eItemMagicSheet, {
        types: [
          "magicalEffect",
          "enchantment",
          "spell",
          "baseEffect",
          "laboratoryText",
          "magicItem",
          "power"
        ],
        makeDefault: true
      });

      DocumentSheetConfig.registerSheet(Item, "arm5e", ArM5eSupernaturalEffectSheet, {
        types: ["supernaturalEffect"],
        makeDefault: true
      });

      // Items.registerSheet("arm5e", ArM5eItemSheetNoDesc, { types: ["vis"] });

      // [DEV] comment line bellow to get access to the original sheet
      DocumentSheetConfig.unregisterSheet(ActiveEffect, "core", ActiveEffectConfig);
      DocumentSheetConfig.registerSheet(ActiveEffect, "arm5e", ArM5eActiveEffectConfig);
    }
  } catch (err) {
    err.message = `Failed registration of a sheet: ${err.message}`;
    console.error(err);
  }
}
