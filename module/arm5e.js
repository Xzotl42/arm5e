// Import Modules
import { ARM5E, ARM5E_DEFAULT_ICONS, localizeAbilities, localizeCategories } from "./config.js";
import { ArM5ePCActor } from "./actor/actor.js";
import { ArM5ePCActorSheet } from "./actor/actor-pc-sheet.js";
import { ArM5eBeastActorSheet } from "./actor/actor-beast-sheet.js";
import { ArM5eNPCActorSheet } from "./actor/actor-npc-sheet.js";
import { ArM5eLaboratoryActorSheet } from "./actor/actor-laboratory-sheet.js";
import { ArM5eCovenantActorSheet } from "./actor/actor-covenant-sheet.js";
import { ArM5eMagicCodexSheet } from "./actor/actor-magic-codex-sheet.js";
import { ArM5eActorsDirectory } from "./ui/ars-actors-directory.js";
import { ArM5eCrucibleSheet } from "./actor/actor-crucible-sheet.js";
import { ArM5eItem } from "./item/item.js";
import { ArM5eItemSheet, ArM5eItemSheetNoDesc } from "./item/item-sheet.js";
import { ArM5eItemMagicSheet } from "./item/item-magic-sheet.js";
import { ArM5eBookSheet } from "./item/item-book-sheet.js";
import { ArM5eItemDiarySheet } from "./item/item-diary-sheet.js";
import ArM5eActiveEffect from "./helpers/active-effects.js";

import { ArM5eScene } from "./ui/ars-scene.js";
import { prepareDatasetByTypeOfItem } from "./helpers/items-helpers.js";
import { ArM5ePreloadHandlebarsTemplates } from "./templates.js";
import { ArM5eActiveEffectConfig } from "./helpers/active-effect-config.sheet.js";
import * as Arm5eChatMessage from "./helpers/chat.js";

import { clearAuraFromActor } from "./helpers/aura.js";

// experiment
import { ArsLayer, addArsButtons, onDropOnCanvas } from "./ui/ars-layer.js";

import { migration } from "./migration.js";
import { log, generateActiveEffectFromAbilities, getDocumentFromCompendium } from "./tools.js";

import { registerSettings } from "./settings.js";
import { registerTestSuites } from "./tests/tests.js";
import { StressDie } from "./helpers/stressdie.js";
import { UserguideTour } from "./tours/userguide-tour.js";

import {
  BaseEffectSchema,
  MagicalEffectSchema,
  SpellSchema,
  LabTextSchema
} from "./schemas/magicSchemas.js";
import { AbilitySchema } from "./schemas/abilitySchema.js";
import { BookSchema } from "./schemas/bookSchema.js";
import { DiaryEntrySchema } from "./schemas/diarySchema.js";
import { ItemSchema, VirtueFlawSchema, VisSchema } from "./schemas/minorItemsSchemas.js";
import { LabSchema } from "./schemas/labSchema.js";

Hooks.once("init", async function() {
  game.arm5e = {
    ArM5ePCActor,
    ArM5eItem,
    rollItemMacro
  };

  // Add system metadata
  CONFIG.ARM5E = ARM5E;

  registerSettings();

  // game.tours.register(
  //   ARM5E.SYSTEM_ID,
  //   "userguide",
  //   await UserguideTour.fromJSON("/systems/arm5e/tours/userguide.json")
  // );

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "1ds + @characteristics.qik.value + @combat.init - @combat.overload",
    decimals: 2
  };

  // Adding ars layer
  CONFIG.Canvas.layers["arsmagica"] = {
    layerClass: ArsLayer,
    group: "primary"
  };

  // Combatant.prototype.getInitiativeRoll = function (formula) {

  // }
  // Experimental
  CONFIG.Dice.types.push(StressDie);
  CONFIG.Dice.terms[StressDie.DENOMINATION] = StressDie;
  // instrumenting roll for testing
  Roll.prototype.botched = false;
  Roll.prototype.botchNum = 0;
  Roll.prototype.modifier = function() {
    if (!this.result) {
      return 0;
    }
    if (this.botched) {
      return 0;
    }
    // extract second term
    const pattern = /\w+\s\+\s+(-?\s?\d+)/;
    let res = pattern.exec(this.result);
    // remove whitespaces in negative numbers
    return Number(res[1].replace(/\s+/g, ""));
  };

  // UI customization
  CONFIG.ui.actors = ArM5eActorsDirectory;
  CONFIG.Item.sidebarIcon = "fas fa-sack-xmark";

  CONFIG.ARM5E_DEFAULT_ICONS = ARM5E_DEFAULT_ICONS[game.settings.get("arm5e", "defaultIconStyle")];

  // Define custom Document classes
  CONFIG.Actor.documentClass = ArM5ePCActor;
  CONFIG.Item.documentClass = ArM5eItem;
  CONFIG.ActiveEffect.documentClass = ArM5eActiveEffect;
  CONFIG.Scene.documentClass = ArM5eScene;

  // Define datamodel schemas
  setSystemDatamodels();

  // Register sheet application classes
  registerSheets();

  // Preload handlebars templates
  ArM5ePreloadHandlebarsTemplates();

  // If you need to add Handlebars helpers, here are a few useful examples:
  Handlebars.registerHelper("concat", function() {
    var outStr = "";
    for (var arg in arguments) {
      if (typeof arguments[arg] != "object") {
        outStr += arguments[arg];
      }
    }
    return outStr;
  });
  Handlebars.registerHelper("toLowerCase", function(str) {
    return str.toLowerCase();
  });

  Handlebars.registerHelper("ifIn", function(elem, list, options) {
    if (list.indexOf(elem) > -1) {
      return options.fn(this);
    }
    return options.inverse(this);
  });
});

Hooks.once("ready", async function() {
  // DEV:
  // generateActiveEffectFromAbilities();

  // translate and sort all abilities keys
  CONFIG.ARM5E.LOCALIZED_ABILITIES = localizeAbilities();
  CONFIG.ARM5E.LOCALIZED_ABILITIESCAT = localizeCategories();
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => {
    if (data.type === "Item") {
      createArM5eMacro(data, slot);
      return false;
    }
  });

  Hooks.on("dropActorSheetData", (actor, sheet, data) => onDropActorSheetData(actor, sheet, data));
  Hooks.on("dropCanvasData", (canvas, data) => onDropOnCanvas(canvas, data));

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
            `On the change to V10 there was a bug introduced in the automatic update mechanism.<br/>` +
            `<br/><b>The only way to fix it is to uninstall the system and reinstall it again on your side </b>` +
            `(not the world, just the system, <b>your data is safe</b>).<br/>` +
            `<br/>If you don't do it, when you update, you will receive the latest changes from the dev branch with features under construction, unfinished and sometime buggy...` +
            `<br/>Sorry for the inconvenience`
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
          const warning = `Your Ars Magica system data is from too old a Foundry version and cannot be reliably migrated to the latest version. The process will be attempted, but errors may occur.`;
          ui.notifications.error(warning, {
            permanent: true
          });
        }
        await migration(currentVersion);
      }
    }
  }

  // check and warning that magic codex is missing or more than one occurence.
  // TODO: re-enable it (and move it?) when Codex is used in lab activities
  // const codex = game.actors.filter(a => a.type === "magicCodex");
  // if (codex.length > 1) {
  //   ui.notifications.warn(game.i18n.localize("arm5e.notification.codex.tooMany"), {
  //     permanent: false
  //   });
  // } else if (codex.length === 0) {
  //   ui.notifications.warn(game.i18n.localize("arm5e.notification.codex.none"), {
  //     permanent: false
  //   });
  // }

  // setup session storage:

  let userData = sessionStorage.getItem(`usercache-${game.user.id}`);
  if (!userData) {
    // create user cache if it doesn't exist yet
    sessionStorage.setItem(`usercache-${game.user.id}`, JSON.stringify({}));
  }
});

/**
 * This function runs after game data has been requested and loaded from the servers, so entities exist
 */

Hooks.once("setup", function() {});

Hooks.once("devModeReady", ({ registerPackageDebugFlag }) => {
  registerPackageDebugFlag(ARM5E.SYSTEM_ID);
});

Hooks.on("quenchReady", quench => {
  registerTestSuites(quench);
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
  const item = await fromUuid(data.uuid);
  if (!item.isOwned) {
    ui.notifications.warn("You can only create macro buttons for owned Items");
    return true;
  }

  // Create the macro command
  const command = `game.arm5e.rollItemMacro('${item._id}', '${item.actor._id}');`;
  let macro = game.macros.contents.find(m => m.name === item.name && m.command === command);
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command: command,
      flags: {
        "arm5e.itemMacro": true
      }
    });
  }
  await game.user.assignHotbarMacro(macro, slot);
  return false;
}

async function onDropActorSheetData(actor, sheet, data) {
  if (data.type == "Folder") {
    return true;
  }
  if (data.type == "Item") {
    let item = await fromUuid(data.uuid);

    if (sheet.isItemDropAllowed(item)) {
      return true;
    } else {
      log(true, "Prevented invalid item drop " + item.name + " on actor " + actor.name);
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
 * @return {Promise}
 */
function rollItemMacro(itemId, actorId) {
  const actor = game.actors.get(actorId);
  const item = actor.items.get(itemId);
  if (!item)
    return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);
  const dataset = prepareDatasetByTypeOfItem(item);
  if (isEmpty(dataset)) {
    item.sheet.render(true);
  } else if (item.type == "power") {
    actor.sheet._onUsePower(dataset);
  } else {
    actor.sheet._onRoll(dataset);
  }
}

Hooks.on("renderChatMessage", (message, html, data) =>
  Arm5eChatMessage.addChatListeners(message, html, data)
);

Hooks.on("deleteToken", (token, options, userId) => {
  // if the token is linked to an actor, remove the aura
  if (token.isLinked) {
    clearAuraFromActor(token.actor);
  }
});

Hooks.on("getSceneControlButtons", buttons => addArsButtons(buttons));

Hooks.on("renderPause", function() {
  if ($("#pause").attr("class") !== "paused") return;
  const path = "/systems/arm5e/assets/clockwork.svg";
  // const opacity = 100
  const speed = "20s linear 0s infinite normal none running rotation";
  const opacity = 0.6;
  $("#pause.paused img").attr("src", path);
  $("#pause.paused img").css({ opacity: opacity, "--fa-animation-duration": "20s" });
});

function setSystemDatamodels() {
  CONFIG.Item.systemDataModels["ability"] = AbilitySchema;
  CONFIG.Item.systemDataModels["book"] = BookSchema;
  CONFIG.Item.systemDataModels["virtue"] = VirtueFlawSchema;
  CONFIG.Item.systemDataModels["flaw"] = VirtueFlawSchema;
  CONFIG.Item.systemDataModels["item"] = ItemSchema;
  CONFIG.Item.systemDataModels["vis"] = VisSchema;
  CONFIG.Item.systemDataModels["baseEffect"] = BaseEffectSchema;
  CONFIG.Item.systemDataModels["magicalEffect"] = MagicalEffectSchema;
  CONFIG.Item.systemDataModels["spell"] = SpellSchema;
  CONFIG.Item.systemDataModels["laboratoryText"] = LabTextSchema;
  CONFIG.Item.systemDataModels["diaryEntry"] = DiaryEntrySchema;
  //Actors
  CONFIG.Actor.systemDataModels["laboratory"] = LabSchema;
}

function registerSheets() {
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

  // Actors.registerSheet("arm5eCrucible", ArM5eCrucibleSheet, {
  //     types: ["crucible"],
  //     makeDefault: true,
  //     label: "arm5e.sheet.crucible"
  // });

  // let astrolabData = game.
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("arm5e", ArM5eItemMagicSheet, {
    types: ["magicalEffect", "enchantment", "spell", "baseEffect", "laboratoryText", "magicItem"],
    makeDefault: true
  });

  Items.registerSheet("arm5e", ArM5eItemDiarySheet, {
    types: ["diaryEntry"],
    makeDefault: true
  });

  Items.registerSheet("arm5e", ArM5eBookSheet, {
    types: ["book"],
    makeDefault: true
  });

  Items.registerSheet("arm5e", ArM5eItemSheet, {
    types: [
      "weapon",
      "armor",
      "item",
      "virtue",
      "flaw",
      "ability",
      "abilityFamiliar",
      "power",
      // "might",
      "powerFamiliar",
      // "mightFamiliar",
      "speciality",
      "distinctive",
      "sanctumRoom",
      "personality",
      "reputation",
      "habitantMagi",
      "habitantCompanion",
      "habitantSpecialists",
      "habitantHabitants",
      "habitantHorses",
      "habitantLivestock",
      "possessionsCovenant",
      "visSourcesCovenant",
      "visStockCovenant",
      "calendarCovenant",
      "incomingSource",
      "labCovenant",
      "personalityTrait",
      "reputationChar"
    ],
    makeDefault: true
  });

  Items.registerSheet("arm5e", ArM5eItemSheetNoDesc, { types: ["vis"] });

  // [DEV] comment line bellow to get access to the original sheet
  DocumentSheetConfig.unregisterSheet(ActiveEffect, "core", ActiveEffectConfig);
  DocumentSheetConfig.registerSheet(ActiveEffect, "arm5e", ArM5eActiveEffectConfig);
}
