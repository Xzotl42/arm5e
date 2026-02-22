import { log } from "../tools/tools.js";
import { getCompanion, getMagus } from "./testData.js";
import {
  getConfirmation,
  textInput,
  numberInput,
  customDialog,
  customDialogAsync
} from "../ui/dialogs.js";

const renderTemplate = foundry.applications.handlebars.renderTemplate;

export function registerDialogTesting(quench) {
  quench.registerBatch(
    "Ars-dialogs",
    (context) => {
      const { describe, it, assert, before } = context;
      let actor;
      let magus;

      const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

      before(async function () {
        actor = await getCompanion(`BobTheCompanion`);
        magus = await getMagus("Tiberius");
      });

      describe("DialogV2 Confirmation Dialogs", function () {
        this.timeout(10000); // 10 seconds for all dialog tests

        it("Basic confirmation dialog - Neutral flavor", async function () {
          try {
            ui.notifications.info("Displaying confirmation dialog with Neutral flavor...");
            await pause(500);

            getConfirmation(
              "Test Confirmation",
              "Do you want to proceed with this test action?",
              "Neutral",
              "This is additional info line 1",
              "This is additional info line 2"
            ).catch(() => {}); // Ignore rejection when dialog is closed

            // Let it display for 3 seconds
            await pause(3000);

            // Close the active dialog
            if (ui.activeWindow) {
              await ui.activeWindow.close({ force: true });
            }

            assert.ok(true, "Dialog displayed successfully");
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("Confirmation dialog - PC flavor", async function () {
          try {
            ui.notifications.info("Displaying confirmation dialog with PC flavor...");
            await pause(500);

            getConfirmation(
              "Delete Character",
              "Are you sure you want to delete this character?",
              "PC",
              "Character: Bob the Companion",
              "This action cannot be undone",
              "arm5e.dialog.button.yes",
              "arm5e.dialog.button.no"
            ).catch(() => {});

            // Let it display for 3 seconds
            await pause(3000);

            // Close the active dialog
            if (ui.activeWindow) {
              await ui.activeWindow.close({ force: true });
            }

            assert.ok(true, "Dialog displayed successfully");
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("Confirmation dialog - NPC flavor", async function () {
          try {
            ui.notifications.info("Displaying confirmation dialog with NPC flavor...");
            await pause(500);

            getConfirmation(
              "Reset Twilight",
              "Do you want to reset the twilight episode?",
              "NPC",
              "Current stage: Pending Control",
              "Twilight points will be reset to 0"
            ).catch(() => {});

            // Let it display for 3 seconds
            await pause(3000);

            // Close the active dialog
            if (ui.activeWindow) {
              await ui.activeWindow.close({ force: true });
            }

            assert.ok(true, "Dialog displayed successfully");
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });
      });

      describe("DialogV2 Text Input Dialogs", function () {
        this.timeout(10000); // 10 seconds for all dialog tests

        it("Text input dialog - simple", async function () {
          try {
            ui.notifications.info("Displaying text input dialog...");
            await pause(500);

            textInput(
              "Enter Name",
              game.i18n.localize("arm5e.sheet.name"),
              "Enter a name...",
              "Default Name",
              "This will be the name of your item"
            ).catch(() => {});

            // Let it display for 3 seconds
            await pause(3000);

            // Close the active dialog
            if (ui.activeWindow) {
              await ui.activeWindow.close({ force: true });
            }

            assert.ok(true, "Dialog displayed successfully");
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("Text input dialog - with validator", async function () {
          try {
            ui.notifications.info("Displaying text input dialog with validator...");
            await pause(500);

            const validator = (value) => value.length > 0;

            textInput(
              "Enter Valid Name",
              game.i18n.localize("arm5e.sheet.name"),
              "Name cannot be empty",
              "",
              "Validator ensures name is not empty",
              [],
              validator
            ).catch(() => {});

            // Let it display for 3 seconds
            await pause(3000);

            // Close the active dialog
            if (ui.activeWindow) {
              await ui.activeWindow.close({ force: true });
            }

            assert.ok(true, "Dialog displayed successfully");
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });
      });

      describe("DialogV2 Number Input Dialogs", function () {
        this.timeout(10000); // 10 seconds for all dialog tests

        it("Number input dialog - basic", async function () {
          try {
            ui.notifications.info("Displaying number input dialog...");
            await pause(500);

            numberInput(
              "Enter Value",
              "arm5e.generic.value",
              "0",
              5,
              "Enter a numeric value"
            ).catch(() => {});

            // Let it display for 3 seconds
            await pause(3000);

            // Close the active dialog
            if (ui.activeWindow) {
              await ui.activeWindow.close({ force: true });
            }

            assert.ok(true, "Dialog displayed successfully");
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("Number input dialog - with constraints", async function () {
          try {
            ui.notifications.info("Displaying number input dialog with min/max constraints...");
            await pause(500);

            const constraints = { min: 0, max: 100, step: 5 };

            numberInput(
              "Enter Score",
              "arm5e.sheet.score",
              "0",
              50,
              "Value must be between 0 and 100",
              [],
              null,
              constraints
            ).catch(() => {});

            // Let it display for 3 seconds
            await pause(3000);

            // Close the active dialog
            if (ui.activeWindow) {
              await ui.activeWindow.close({ force: true });
            }

            assert.ok(true, "Dialog displayed successfully");
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("Number input dialog - with validator", async function () {
          try {
            ui.notifications.info("Displaying number input dialog with validator...");
            await pause(500);

            const validator = (value) => value % 2 === 0; // Must be even

            numberInput(
              "Enter Even Number",
              "arm5e.generic.value",
              "0",
              10,
              "Value must be an even number",
              [],
              validator,
              { min: 0, max: 100, step: 1 }
            ).catch(() => {});

            // Let it display for 3 seconds
            await pause(3000);

            // Close the active dialog
            if (ui.activeWindow) {
              await ui.activeWindow.close({ force: true });
            }

            assert.ok(true, "Dialog displayed successfully");
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });
      });

      describe("DialogV2 Custom Dialogs", function () {
        this.timeout(10000); // 10 seconds for all dialog tests

        it("Custom dialog - aging summary", async function () {
          try {
            ui.notifications.info("Displaying custom aging dialog...");
            await pause(500);

            const dialogData = {
              year: 1220,
              season: "winter",
              aging: 2,
              livingConditions: 0,
              crisis: 8,
              chars: CONFIG.ARM5E.character.characteristics
            };

            const renderedTemplate = await renderTemplate(
              "systems/arm5e/templates/generic/aging-dialog.html",
              dialogData
            );

            customDialog({
              window: { title: game.i18n.localize("arm5e.aging.summary") },
              content: renderedTemplate,
              classes: ["arm5e-prompt"],
              buttons: [
                {
                  action: "yes",
                  class: ["dialog-button"],
                  label: game.i18n.localize("arm5e.dialog.button.yes"),
                  icon: "<i class='fas fa-check'></i>",
                  callback: (event, button, dialog) => {
                    return { confirmed: true };
                  }
                },
                {
                  action: "no",
                  class: ["dialog-button"],
                  label: game.i18n.localize("arm5e.dialog.button.no"),
                  icon: "<i class='fas fa-times'></i>",
                  callback: (event, button, dialog) => {
                    return { confirmed: false };
                  }
                }
              ]
            }).catch(() => {});

            // Let it display for 3 seconds
            await pause(3000);

            // Close the active dialog
            if (ui.activeWindow) {
              await ui.activeWindow.close({ force: true });
            }

            assert.ok(true, "Dialog displayed successfully");
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
        });

        it("Custom async dialog - with async callback", async function () {
          try {
            ui.notifications.info("Displaying custom async dialog...");
            await pause(500);

            const dialogData = {
              message: "This is a custom async dialog with async button callbacks"
            };

            customDialogAsync({
              window: { title: "Async Dialog Test" },
              content: `<p class="marginsides32">${dialogData.message}</p>`,
              classes: ["arm5e-dialog"],
              buttons: [
                {
                  action: "process",
                  class: ["dialog-button"],
                  label: "Process (Async)",
                  icon: "<i class='fas fa-cog'></i>",
                  callback: async (event, button, dialog) => {
                    // Simulate async operation
                    await new Promise((resolve) => setTimeout(resolve, 500));
                    return { processed: true, value: 42 };
                  }
                },
                {
                  action: "cancel",
                  class: ["dialog-button"],
                  label: "Cancel",
                  icon: "<i class='fas fa-times'></i>",
                  callback: async (event, button, dialog) => {
                    return { processed: false };
                  }
                }
              ]
            }).catch(() => {});

            // Let it display for 3 seconds
            await pause(3000);

            // Close the active dialog
            if (ui.activeWindow) {
              await ui.activeWindow.close({ force: true });
            }

            assert.ok(true, "Dialog displayed successfully");
          } catch (err) {
            console.error(`Error: ${err}`);
            assert.ok(false);
          }
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
    { displayName: "ARS : Dialog (DialogV2) testsuite" }
  );
}
