import { PickRequisites } from "../helpers/magic.js";
import { ArM5eItem } from "../item/item.js";
import { getDataset } from "../tools.js";

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
  return await new Promise((resolve) => {
    new Dialog(
      {
        title: title,
        content: html,
        buttons: {
          yes: {
            icon: "<i class='fas fa-check'></i>",
            label: game.i18n.localize(yesLabel),
            callback: () => resolve(true)
          },
          no: {
            icon: "<i class='fas fa-times'></i>",
            label: game.i18n.localize(noLabel),
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
  fieldName,
  placeholder,
  value,
  classes = [],
  validator = null
) {
  let dialogData = {
    fieldName: game.i18n.localize(fieldName),
    placeholder: placeholder,
    value: value
  };
  const html = await renderTemplate("systems/arm5e/templates/generic/textInput.html", dialogData);
  const inputText = await new Promise((resolve) => {
    new Dialog(
      {
        title: game.i18n.localize(title),
        content: html,
        buttons: {
          yes: {
            icon: "<i class='fas fa-check'></i>",
            label: `Yes`,
            callback: async (html) => {
              let result = html[0].querySelector(".textInput");

              if (validator && validator(result.value)) {
                resolve(result.value);
              } else {
                resolve(result.value);
              }
            }
          },
          no: {
            icon: "<i class='fas fa-ban'></i>",
            label: `Cancel`,
            callback: () => {
              resolve("");
            }
          }
        }
      },
      {
        height: "140px",
        classes: ["arm5e-dialog", "dialog"] //.push(classes)
      }
    ).render(true);
  });
  return inputText;
}

/////////////////////////
// Listeners
////////////////////////

export function addCommonListenersDialog(html) {
  html.find(".clickable").click((ev) => {
    $(ev.currentTarget).next().toggleClass("hide");
  });

  html.find(".select-on-focus").focus((ev) => {
    ev.preventDefault();
    ev.currentTarget.select();
  });
}

export function addPowersListenersDialog(html) {
  addCommonListenersDialog(html);

  // Power specific
  html.find(".power-cost").change(async (event) => {
    const dataset = getDataset(event);
    const val = Number(event.target.value);
    const e = html[0].getElementsByClassName("power-level")[0];
    e.innerHTML = game.i18n.format("arm5e.sheet.powerLevel", { res: 5 * val });
  });

  html.find(".power-form").change(async (event) => {
    const dataset = getDataset(event);
    const val = event.target.value;
    const e = html[0].getElementsByClassName("power-label")[0];
    e.value = e.value.replace(/\((.+)\)/i, `(${CONFIG.ARM5E.magic.arts[val].short})`);
  });
}

export function addMagicListenersDialog(html) {
  addCommonListenersDialog(html);

  // Magic specific
  html.find(".advanced-req-roll").click(async (e) => {
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
    const e1 = html[0].getElementsByClassName("technique-label")[0];
    e1.innerHTML = `${actor.rollInfo.magic.technique.label} (${actor.rollInfo.magic.technique.score})`;
    const e2 = html[0].getElementsByClassName("form-label")[0];
    e2.innerHTML = `${actor.rollInfo.magic.form.label} (${actor.rollInfo.magic.form.score})`;
  });

  html.find(".voice-and-gestures").change(async (event) => {
    const dataset = getDataset(event);
    const actor = game.actors.get(dataset.actorid);
    const name = $(event.target).attr("effect");
    await actor.selectVoiceAndGestures(name, $(event.target).val());
  });
}

export function addSoakListenersDialog(html) {
  addCommonListenersDialog(html);

  //html.querySelector(".SelectedFormDamage");
  html.find(".SelectedFormDamage").change(async (event) => {
    const dataset = getDataset(event);
    const val = event.target.value;
    const actor = game.actors.get(dataset.actorid);
    const classes = html[0].querySelector(".natural-resistance").classList;
    if (actor.system.bonuses.resistance[val]) {
      html[0].querySelector(".natRes").value = actor.system.bonuses.resistance[val];
      classes.remove("hidden");
    } else {
      classes.add("hidden");
    }

    if (actor.isMagus()) {
      if (val === "") {
        html[0].querySelector(".formRes").value = 0;
      } else {
        const resist = Math.ceil(actor.system.arts.forms[val].finalScore / 5);
        html[0].querySelector(".formRes").value = resist;
      }
    }
    actor.rollInfo.damage.form = val;
  });

  html.find(".ignoreArmor").change(async (event) => {
    const dataset = getDataset(event);
    const val = event.target.checked;
    const actor = game.actors.get(dataset.actorid);
    actor.rollInfo.damage.ignoreArmor = val;
    html[0].querySelector(".protection").classList.toggle("hidden");
  });
}
