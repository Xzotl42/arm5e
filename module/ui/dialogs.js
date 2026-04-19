import { PickRequisites } from "../helpers/magic.js";
import { ArM5eItem } from "../item/item.js";
import { getDataset } from "../tools/tools.js";
const renderTemplate = foundry.applications.handlebars.renderTemplate;
export async function getConfirmation(
  title,
  question,
  flavor = "Neutral",
  info1,
  info2,
  yesLabel = "arm5e.dialog.button.yes",
  noLabel = "arm5e.dialog.button.no"
) {
  const dialogData = {
    question: question,
    flavor: flavor,
    info1: info1,
    info2: info2
  };
  const html = await renderTemplate(
    "systems/arm5e/templates/generic/confirmation.html",
    dialogData
  );
  const proceed = await foundry.applications.api.DialogV2.confirm({
    window: { title: title },
    content: html,
    classes: ["arm5e-confirm"],
    rejectClose: false,
    modal: true,
    yes: {
      icon: "<i class='fas fa-check'></i>",
      label: game.i18n.localize(yesLabel),
      class: ["dialog-button"],
      callback: (event) => {
        return true;
      }
    },
    no: {
      icon: "<i class='fas fa-times'></i>",
      label: game.i18n.localize(noLabel),
      class: ["dialog-button"],
      callback: (event) => {
        return false;
      }
    }
  });
  return proceed;
}

export async function selectItemDialog(
  list,
  flavor = "Neutral",
  title = "Select Item",
  label = "Select an Item"
) {
  const dialogData = {
    list: list,
    label: label,
    flavor: flavor
  };
  const html = await renderTemplate(
    "systems/arm5e/templates/generic/itemPickerDialog.html",
    dialogData
  );
  return await new Promise((resolve) => {
    new Dialog(
      {
        title: title,
        content: html,
        buttons: {
          yes: {
            icon: "<i class='fas fa-check'></i>",
            // label: game.i18n.localize(yesLabel),
            callback: () => resolve(true)
          },
          no: {
            icon: "<i class='fas fa-times'></i>",
            // label: game.i18n.localize(noLabel),
            callback: () => resolve(false)
          }
        },
        default: "yes",
        close: () => resolve(false)
      },
      {
        jQuery: true,
        height: "150px",
        classes: ["arm5e-dialog", "dialog"]
      }
    ).render(true);
  });
}

export async function textInput(
  title,
  prompt,
  placeholder,
  value,
  help = "",
  classes = [],
  validator = null,
  listeners = null
) {
  let dialogData = {
    prompt: game.i18n.localize(prompt),
    placeholder: placeholder,
    value: value,
    help: help
  };
  const html = await renderTemplate("systems/arm5e/templates/generic/textInput.html", dialogData);

  return await foundry.applications.api.DialogV2.prompt({
    window: { title: title },
    content: html,
    classes: ["arm5e-prompt", ...classes],
    render: listeners
      ? listeners(event, dialog)
      : (event, dialog) => {
          dialog.element.querySelector(".textInput").addEventListener("focus", (ev) => {
            ev.preventDefault();
            ev.currentTarget.select();
          });
        },
    ok: {
      icon: "<i class='fas fa-check'></i>",
      label: game.i18n.localize("arm5e.generic.confirm"),
      class: ["dialog-button"],
      callback: async (event) => {
        let result = event.currentTarget.closest(".arm5e-prompt").querySelector(".textInput");

        if (validator) {
          if (validator(result.value)) {
            return result.value;
          } else {
            return "";
          }
        } else {
          return result.value;
        }
      }
    }
  });
}

export async function numberInput(
  title,
  prompt,
  placeholder,
  value,
  help = "",
  classes = [],
  validator = null,
  constraints = { min: null, max: null, step: 1 },
  listeners = null
) {
  let dialogData = {
    prompt: game.i18n.localize(prompt),
    placeholder: placeholder,
    value: value,
    help: help,
    constraints: constraints
  };
  const html = await renderTemplate("systems/arm5e/templates/generic/numberInput.html", dialogData);

  return await foundry.applications.api.DialogV2.prompt({
    window: { title: title },
    content: html,
    classes: ["arm5e-prompt", ...classes],
    render: listeners
      ? listeners(event, dialog)
      : (event, dialog) => {
          dialog.element.querySelector(".numberInput").addEventListener("focus", (ev) => {
            ev.preventDefault();
            ev.currentTarget.select();
          });
        },
    ok: {
      icon: "<i class='fas fa-check'></i>",
      label: game.i18n.localize("arm5e.generic.confirm"),
      class: ["dialog-button"],
      callback: async (event) => {
        let result = event.currentTarget.closest(".arm5e-prompt").querySelector(".numberInput");
        let val = parseInt(result.value);
        if (isNaN(val)) val = 0;
        if (constraints.min !== null && val < constraints.min) {
          val = constraints.min;
          ui.notifications.warn(
            game.i18n.format("arm5e.notifications.valueMin", { min: constraints.min })
          );
        }
        if (constraints.max !== null && val > constraints.max) {
          val = constraints.max;
          ui.notifications.warn(
            game.i18n.format("arm5e.notifications.valueMax", { max: constraints.max })
          );
        }
        if (validator) {
          if (validator(val)) {
            return val;
          } else {
            return 0;
          }
        } else {
          return val;
        }
      }
    }
  });
}

export async function customDialog(payload) {
  return await new Promise((resolve) => {
    if (!payload.close) {
      payload.close = () => {
        resolve(null);
      };
    }
    for (let i = 0; i < payload.buttons.length; i++) {
      payload.buttons[i].class = payload.buttons[i].class || ["dialog-button"];
    }
    if (!payload.render) {
      payload.render = (event, dialog) => {
        const elements = dialog.element.querySelectorAll(".select-on-focus");
        for (let el of elements) {
          el.addEventListener("focus", (ev) => {
            ev.preventDefault();
            ev.currentTarget.select();
          });
        }
      };
    }
    payload.submit = (result, dialog) => {
      resolve(result);
    };

    if (!payload.classes) {
      payload.classes = ["arm5e-dialog"];
    } else if (!payload.classes.includes("arm5e-dialog")) {
      payload.classes.push("arm5e-dialog");
    }

    const dialog = new foundry.applications.api.DialogV2(payload);

    // Attach render event listener if render callback is provided
    if (payload.render instanceof Function) {
      dialog.addEventListener("render", (event) => payload.render(event, dialog));
    }

    dialog.render({ force: true });
  });
}

// A generic dialog that supports async button callbacks and prevent multiple clicks

export async function customDialogAsync(payload) {
  return await new Promise((resolve) => {
    let settled = false;
    let pending = null;
    const owner = payload.owner ?? null;
    if (owner) {
      delete payload.owner;
    }

    const finish = (value) => {
      if (!settled) {
        settled = true;
        resolve(value);
      }
    };

    const cleanupOwnerDialog = (dialog) => {
      if (owner?._pendingDialogs) {
        owner._pendingDialogs.delete(dialog);
        if (!owner._pendingDialogs.size) {
          owner._pendingDialogs = null;
        }
      }
    };
    if (!payload.classes) {
      payload.classes = ["arm5e-dialog"];
    } else if (!payload.classes.includes("arm5e-dialog")) {
      payload.classes.push("arm5e-dialog");
    }

    if (!payload.render) {
      payload.render = (event, dialog) => {
        const elements = dialog.element.querySelectorAll(".select-on-focus");
        for (let el of elements) {
          el.addEventListener("focus", (ev) => {
            ev.preventDefault();
            ev.currentTarget.select();
          });
        }
      };
    }

    // Patch the button callbacks to put a guard around resolution
    for (let i = 0; i < payload.buttons.length; i++) {
      payload.buttons[i].class = payload.buttons[i].class || ["dialog-button"];
      const originalCallback = payload.buttons[i].callback;
      payload.buttons[i].callback = (event, button, dialog) => {
        // Start the async work and capture the promise immediately so the close
        // handler can await it if the dialog is closed while it's running.
        pending = (async () => {
          return await originalCallback(event, button, dialog);
        })();

        // When it finishes, resolve (unless already resolved).
        pending
          .then((msg) => finish(msg))
          .catch(() => {
            console.error("Error in dialog", payload.title);
            finish(null);
          });
        return true;
      };
    }

    payload.close = () => {
      // If a button triggered async work and the dialog is closed while it's running,
      // wait for it and then resolve with its result; otherwise resolve null.
      if (pending) {
        pending.then((msg) => finish(msg)).catch(() => finish(null));
      } else {
        finish(null);
      }

      cleanupOwnerDialog(dialog);
    };

    const dialog = new foundry.applications.api.DialogV2(payload);

    // Ensure force-closing by external code always settles this promise.
    // DialogV2 close paths are not guaranteed to trigger submit callbacks.
    const originalClose = dialog.close.bind(dialog);
    dialog.close = async (...args) => {
      if (pending) {
        pending.then((msg) => finish(msg)).catch(() => finish(null));
      } else {
        finish(null);
      }
      cleanupOwnerDialog(dialog);
      return originalClose(...args);
    };

    if (owner) {
      owner._pendingDialogs ??= new Set();
      owner._pendingDialogs.add(dialog);
    }

    // Attach render event listener if render callback is provided
    if (payload.render instanceof Function) {
      dialog.addEventListener("render", (event) => payload.render(event, dialog));
    }

    dialog.render({ force: true });
  });
}

/////////////////////////
// Listeners
////////////////////////

export function addAbilityListenersDialog(context, html) {
  html.querySelector(".SelectedAbility")?.addEventListener("change", (ev) => {
    ev.preventDefault();
    const dataset = getDataset(ev);
    const val = ev.currentTarget.value;
    const specialty = html.querySelector(".SpecialtyLabel");
    context.rollInfo.ability.id = val;
    const actor = game.actors.get(dataset.actorid);
    if (val === "None") {
      context.rollInfo.ability.speciality = "";
    } else {
      const ability = actor.items.get(val);
      context.rollInfo.ability.speciality = ability.system.speciality;
    }
    specialty.innerHTML =
      game.i18n.localize("arm5e.sheet.speciality") + ` (${context.rollInfo.ability.speciality})`;
  });
}

export function addPowersListenersDialog(context, html) {
  // Power specific
  html.querySelector(".power-cost")?.addEventListener("change", async (event) => {
    const dataset = getDataset(event);
    const val = Number(event.target.value);
    const e = html.querySelector(".power-level");
    e.innerHTML = game.i18n.format("arm5e.sheet.powerLevel", { res: 5 * val });
  });

  html.querySelector(".power-form")?.addEventListener("change", async (event) => {
    const dataset = getDataset(event);
    const val = event.target.value;
    const e = html.querySelector(".power-label");
    e.value = e.value.replace(/\((.+)\)/i, `(${CONFIG.ARM5E.magic.arts[val].short})`);
  });
}

export function addMagicListenersDialog(context, html) {
  // Magic specific
  html.querySelector(".advanced-req-roll")?.addEventListener("click", async (e) => {
    const dataset = getDataset(e);
    const actor = game.actors.get(dataset.actorid);
    let newSpell;
    let newSpellData = {
      technique: { value: actor.rollInfo.magic.technique.value },
      form: { value: actor.rollInfo.magic.form.value },
      ["technique-req"]: actor.rollInfo.magic["technique-req"],
      ["form-req"]: actor.rollInfo.magic["form-req"]
    };
    if (dataset.type == "spont") {
      newSpell = new ArM5eItem({
        name: "SpontSpell",
        type: "magicalEffect",
        system: newSpellData
      });
    } else {
      const item = actor.items.get(dataset.itemid);
      newSpellData = item.toObject();
      newSpellData.system["technique-req"] = actor.rollInfo.magic["technique-req"];
      newSpellData.system["form-req"] = actor.rollInfo.magic["form-req"];
      // Create a tmp Item in memory
      newSpell = new ArM5eItem(newSpellData);
    }

    let update = await PickRequisites(newSpell.system, dataset.flavor);
    await newSpell.updateSource(update);
    let techData = newSpell.system.getTechniqueData(actor);
    actor.rollInfo.magic.technique.label = techData[0];
    actor.rollInfo.magic.technique.score = techData[1];
    actor.rollInfo.magic.technique.deficiency = techData[2];
    let formData = newSpell.system.getFormData(actor);
    actor.rollInfo.magic.form.label = formData[0];
    actor.rollInfo.magic.form.score = formData[1];
    actor.rollInfo.magic.form.deficiency = formData[2];
    actor.rollInfo.magic["technique-req"] = newSpell.system["technique-req"];
    actor.rollInfo.magic["form-req"] = newSpell.system["form-req"];
    const e1 = html.querySelector(".technique-label");
    e1.innerHTML = `${actor.rollInfo.magic.technique.label} (${actor.rollInfo.magic.technique.score})`;
    const e2 = html.querySelector(".form-label");
    e2.innerHTML = `${actor.rollInfo.magic.form.label} (${actor.rollInfo.magic.form.score})`;
  });

  html.querySelector(".voice-and-gestures")?.addEventListener("change", async (event) => {
    const dataset = getDataset(event);
    const actor = game.actors.get(dataset.actorid);
    const name = $(event.target).attr("effect");
    await actor.selectVoiceAndGestures(name, $(event.target).val());
  });
}

export function addSoakListenersDialog(context, html) {
  html.querySelector(".SelectedFormDamage")?.addEventListener("change", async (event) => {
    const dataset = getDataset(event);
    const val = event.target.value;
    const actor = game.actors.get(dataset.actorid);
    const classes = html.querySelector(".natural-resistance").classList;
    if (actor.system.bonuses.resistance[val]) {
      html.querySelector(".natRes").value = actor.system.bonuses.resistance[val];
      classes.remove("hidden");
    } else {
      classes.add("hidden");
    }

    if (actor.isMagus()) {
      if (val === "") {
        html.querySelector(".formRes").value = 0;
      } else {
        const resist = Math.ceil(actor.system.arts.forms[val].finalScore / 5);
        html.querySelector(".formRes").value = resist;
      }
    }
    actor.rollInfo.damage.form = val;
  });

  html.querySelector(".ignoreArmor")?.addEventListener("change", async (event) => {
    const dataset = getDataset(event);
    const val = event.target.checked;
    const actor = game.actors.get(dataset.actorid);
    actor.rollInfo.damage.ignoreArmor = val;
    html.querySelector(".protection").classList.toggle("hidden");
  });
}

export function addCombatListenersDialog(context, html) {
  html.querySelector(".refresh-targets")?.addEventListener("click", (event) => {
    const dataset = getDataset(event);
    const actor = game.actors.get(dataset.actorid);
    actor.rollInfo.getTargetsInfo();
    const targetLabel = html.querySelector(".target-label");
    targetLabel.innerText = actor.rollInfo.combat.targetLabel;
    const targetNames = html.querySelector(".target-names");
    targetNames.innerText = actor.rollInfo.combat.targetNames;
  });

  html.querySelector(".preps")?.addEventListener("change", async (event) => {
    const dataset = getDataset(event);
    const updateData = {};
    updateData["system.combatPreps.current"] = event.target.value;
    const actor = game.actors.get(dataset.actorid);
    actor.rollInfo.setGenericField();
    await actor.update(updateData);
    let field = html.querySelector(".ability");
    if (field) {
      field.innerText = `${game.i18n.localize("arm5e.sheet.ability")} (${
        actor.system.combat.ability
      })`;
    }
    field = html.querySelector(".attack");
    if (field) {
      field.innerText = `${game.i18n.localize("arm5e.sheet.attack")} (${actor.system.combat.atk})`;
    }
    field = html.querySelector(".init");
    if (field) {
      field.innerText = `${game.i18n.localize("arm5e.sheet.initiative")} (${
        actor.system.combat.init
      })`;
    }

    field = html.querySelector(".defense");
    if (field) {
      field.innerText = `${game.i18n.localize("arm5e.sheet.defense")} (${actor.system.combat.dfn})`;
    }

    field = html.querySelector(".overload");
    if (field) {
      field.innerText = `${game.i18n.localize("arm5e.sheet.encumbrance")} (${
        actor.system.combat.overload
      })`;
    }
  });
}
