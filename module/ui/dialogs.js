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
