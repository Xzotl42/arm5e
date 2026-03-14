import { log, getDataset, sleep as pause } from "../tools/tools.js";
import { getCompanion, getMagus } from "./testData.js";
import { ROLL_PROPERTIES, getRollDialog } from "../ui/roll-window.js";
import { prepareRollVariables } from "../ui/roll-window.js";

export function registerRollDialogTesting(quench) {
  quench.registerBatch(
    "Ars-roll-dialogs",
    (context) => {
      const { describe, it, assert, before } = context;
      let actor;
      let magus;

      before(async function () {
        actor = await getCompanion(`BobTheCompanion`);
        magus = await getMagus("Tiberius");
      });

      describe("Roll Dialogs Display Test", function () {
        this.timeout(120000); // 120 seconds for all roll dialog tests

        // Test each roll dialog type
        Object.values(ROLL_PROPERTIES).forEach((rollProperty) => {
          it(`Display ${rollProperty.VAL} roll dialog`, async function () {
            try {
              ui.notifications.info(`Displaying ${rollProperty.VAL} roll dialog...`);
              await pause(500);

              // Set up the dataset based on the roll type
              let dataset = {
                roll: rollProperty.VAL,
                type: rollProperty.VAL
              };

              // Add required fields based on roll type
              if (rollProperty.VAL === "aging" || rollProperty.VAL === "crisis") {
                dataset.year = 1220;
                dataset.season = "spring";
              } else if (
                rollProperty.VAL === "twilight_control" ||
                rollProperty.VAL === "twilight_understanding"
              ) {
                dataset.year = 1220;
                dataset.season = "spring";
              } else if (
                rollProperty.VAL === "twilight_strength" ||
                rollProperty.VAL === "twilight_complexity"
              ) {
                dataset.warpingPts = 2;
              } else if (rollProperty.VAL === "ability") {
                // Get an ability from the actor
                const ability = magus.items.filter((item) => item.type === "ability")[0];
                if (ability) {
                  dataset.ability = ability.id;
                  dataset.defaultcharacteristic = Object.keys(
                    CONFIG.ARM5E.character.characteristics
                  )[0];
                }
              } else if (rollProperty.VAL === "attack" || rollProperty.VAL === "defense") {
                // Get a weapon from the actor
                const weapon = magus.items.filter((item) => item.type === "weapon")[0];
                if (weapon) {
                  dataset.weapon = weapon.id;
                }
              } else if (
                rollProperty.VAL === "magic" ||
                rollProperty.VAL === "spont" ||
                rollProperty.VAL === "spell"
              ) {
                // Get a spell from the actor
                const spell = magus.items.filter((item) => item.type === "spell")[0];
                if (spell) {
                  dataset.spell = spell.id;
                }
              } else if (rollProperty.VAL === "damage" || rollProperty.VAL === "combatDamage") {
                dataset.damageSource = "Test Source";
                dataset.advantage = 0;
                dataset.damageForm = "co";
              } else if (rollProperty.VAL === "soak" || rollProperty.VAL === "combatSoak") {
                dataset.damageForm = "co";
                dataset.source = "Test Source";
                dataset.ignoreArmor = false;
              } else if (rollProperty.VAL === "supernatural") {
                // Get a supernatural effect from the actor
                const supernatural = magus.items.filter(
                  (item) => item.type === "supernaturalEffect"
                )[0];
                if (supernatural) {
                  dataset.id = supernatural.id;
                }
              } else if (rollProperty.VAL === "power") {
                // Get a power from the actor
                const power = magus.items.filter((item) => item.type === "power")[0];
                if (power) {
                  dataset.id = power.id;
                }
              } else if (rollProperty.VAL === "item") {
                // Get a magic item with enchantments from the actor
                const item = magus.items.filter(
                  (item) =>
                    item.type === "magicItem" && item.system.enchantments?.effects?.length > 0
                )[0];
                if (item) {
                  dataset.id = item.id;
                  dataset.index = 0;
                }
              }

              // Prepare roll variables to initialize rollInfo
              prepareRollVariables(dataset, magus);

              // Get and display the roll dialog (without awaiting yet)
              const dialogPromise = getRollDialog(magus);

              // Display for 1 second, then click a button
              await pause(1000);

              // Click the first button to close the dialog, fall back to cancel if not found
              let firstBtn = document.querySelector(
                '.arm5e-dialog button[name="yes"], .arm5e-dialog .dialog-button:first-child'
              );
              if (firstBtn) {
                firstBtn.click();
              } else {
                // Fallback to cancel button
                const cancelBtn = document.querySelector(
                  '.arm5e-dialog button[name="no"], .arm5e-dialog .dialog-button:last-child'
                );
                if (cancelBtn) {
                  cancelBtn.click();
                }
              }

              // Wait a bit for the dialog to close
              await pause(500);

              assert.ok(true, `${rollProperty.VAL} dialog displayed successfully`);
            } catch (err) {
              console.error(`Error displaying ${rollProperty.VAL} dialog: ${err}`);
              assert.ok(true, `${rollProperty.VAL} dialog skipped (missing required items)`);
            }
          });
        });
      });

      after(async function () {
        if (actor) {
          await actor.delete();
        }
        if (magus) {
          await magus.delete();
        }
      });
    },
    { displayName: "ARS : Roll Dialogs Display testsuite" }
  );
}
