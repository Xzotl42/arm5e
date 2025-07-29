import { ArsRoll } from "../helpers/stressdie.js";
import { log } from "../tools.js";
import { privateMessage } from "../helpers/chat-message.js";

export class LabExperimentation extends FormApplication {
  constructor(data, options) {
    super(data, options);

    this.object = {
      riskModifier: 3,
      aura: 4,
      discovery: false,
      report: ""
    };
  }

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["arm5e", "sheet", "scriptorium-sheet"],
      title: "arm5e.rolltables.experimentation.title",
      template: "systems/arm5e/templates/generic/labExperimentation.html",
      dragDrop: [],
      tabs: [],
      width: "600",
      height: "800",
      submitOnChange: true,
      closeOnSubmit: false
    });
  }

  async getData(options = {}) {
    const context = foundry.utils.expandObject(await super.getData().object);
    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find(".resource-focus").focus((ev) => {
      ev.preventDefault();
      ev.currentTarget.select();
    });
    html.find(".experimentation-roll").click(async (ev) => {
      await this.rollForExperimentation(ev);
    });
    html.find(".clear-all").click(this._clearAll.bind(this));
  }

  async rollForExperimentation(event) {
    event.preventDefault();
    const report = await rollForExperimentation(
      this.object.riskModifier,
      this.object.aura,
      this.object.discovery
    );
    await privateMessage(
      "",
      game.user.character,
      game.i18n.localize("arm5e.rolltables.experimentation.title"),
      report,
      "standard"
    );
    await this.submit({
      updateData: { report: report }
    });
  }

  async _clearAll(event) {
    event.preventDefault();

    await this.submit({
      updateData: { report: "" }
    });
  }

  async _updateObject(event, formData) {
    const expanded = foundry.utils.expandObject(formData);
    foundry.utils.mergeObject(this.object, expanded, { recursive: true });
    this.render();
  }
}

///////////////////////
// LAB EXPERIMENTATION
////////////////////////

export async function rollForExperimentation(risk, aura, discovery = false) {
  const rollFormula = `${Math.abs(risk) + aura}ds + ${risk}`;

  const roll = new ArsRoll(rollFormula, {});

  await roll.evaluate();

  // needed to set other roll attributes:
  const diceRoll = roll.total;
  let rtCompendium = game.packs.get("arm5e-compendia.rolltables");
  let docs = await rtCompendium.getDocuments();
  let rt = docs.find((e) => e.name == "Experimentation.main");
  let report = `${_rollOnTableDesc("main", roll)}<ul>`;
  let flavor = _rollOnTableDesc("main", roll, false);
  if (roll.botches) {
    flavor = game.i18n.localize(
      "arm5e.rolltables.experimentation.extraordinaryResults.disaster.short"
    );
    report += _getTableResult("extraordinaryResults", "disaster");
    // flavor += _getTableResult("extraordinaryResults", "disaster", true);
    flavor += ` : ${roll.desc}`;
    await roll.toMessage({ flavor: flavor });
    report += _listDisasters(roll.botches);
  } else {
    // let res = await rt.getResultsForRoll(10);
    let res = await rt.getResultsForRoll(diceRoll);
    log(false, res);
    if (res.length == 1) {
      report += _getTableResult("extraordinaryResults", res[0].text);
      flavor += _getTableResult("extraordinaryResults", res[0].text, true);
      await roll.toMessage({ flavor: flavor });
      if (res[0].text === "rollTwice") {
        report += await rollForExperimentation(risk, aura, discovery);
        report += await rollForExperimentation(risk, aura, discovery);
      }
    } else {
      const tableRef = res.find((e) => e.type == "pack");
      const subRt = docs.find((e) => tableRef.documentId === e._id);
      const subTitle = res.find((e) => e.type == "text").text;
      report += _getTableResult("extraordinaryResults", subTitle);
      flavor += _getTableResult("extraordinaryResults", subTitle, true);
      await roll.toMessage({ flavor: flavor });
      let subFormula;
      report += "<ul>";
      switch (subTitle) {
        case "sideEffect":
          subFormula = "1d10";
          break;
        case "modifiedEffect":
        case "discovery":
          subFormula = `1d10 + ${risk}`;
      }
      if (discovery) {
        // check if discovery can be reached
        if (diceRoll < 10 + risk && diceRoll > 10 - risk) {
          // special result for arcane discovery
          report += `<li><b>${game.i18n.format("arm5e.rolltables.experimentation.insight", {
            risk: 10 - diceRoll
          })}
          </b></li>`;
        }
      }
      if (!(subTitle === "discovery" && discovery)) {
        let subRoll = new ArsRoll(subFormula, {});
        await subRoll.evaluate();

        let subTotal = subRoll.total;
        const subRes = await subRt.getResultsForRoll(subTotal);
        report += _rollOnTableDesc(subTitle, subRoll);
        flavor = _rollOnTableDesc(subTitle, subRoll, false);

        if (subTitle === "discovery" && subRes[0].text == "rollTwice") {
          report += `<i>${_getTableResult(subTitle, subRes[0].text)}</i>`;
          flavor += `<i>${_getTableResult(subTitle, subRes[0].text)}</i>`;
          await subRoll.toMessage({ flavor: flavor });
          for (let i = 0; i < 2; i++) {
            let discoveryRoll = new ArsRoll(subFormula, {});
            await discoveryRoll.evaluate();
            let discoveryRes = await subRt.getResultsForRoll(discoveryRoll.total);
            while (discoveryRes[0].text == "rollTwice") {
              log(false, "RollTwice only once, reroll");
              discoveryRoll = new ArsRoll(subFormula, {});
              await discoveryRoll.evaluate();
              discoveryRes = await subRt.getResultsForRoll(discoveryRoll.total);
            }

            report += _rollOnTableDesc(subTitle, discoveryRoll);
            report += _getTableResult(subTitle, discoveryRes[0].text);
            flavor = _rollOnTableDesc(subTitle, discoveryRoll, false);
            flavor += _getTableResult(subTitle, discoveryRes[0].text, true);
            await discoveryRoll.toMessage({ flavor: flavor });
          }
        } else {
          report += _getTableResult(subTitle, subRes[0].text);
          flavor += _getTableResult(subTitle, subRes[0].text, true);
          await subRoll.toMessage({ flavor: flavor });
        }
      }

      report += "</ul>";
    }
  }
  report += "</ul>";

  return report;
}

function _rollOnTableDesc(tablename, roll, withFormula = true) {
  let flavor;
  if (withFormula) {
    flavor = game.i18n.format("arm5e.rolltables.experimentation.report.tableRoll", {
      tablename: game.i18n.localize(
        `arm5e.rolltables.experimentation.extraordinaryResults.${tablename}.short`
      ),
      formula: roll.originalFormula,
      total: roll.desc
    });
  } else {
    flavor = game.i18n.format("arm5e.rolltables.experimentation.report.tableRoll2", {
      tablename: game.i18n.localize(
        `arm5e.rolltables.experimentation.extraordinaryResults.${tablename}.short`
      )
    });
  }
  return `<b>${flavor}</b>`;
}

// function _getResultDescription(mnemoSuffix, roll) {
//   const flavor = game.i18n.localize(
//     "arm5e.rolltables.experimentation.extraordinaryResults." + mnemoSuffix
//   );

//   return `<li><b>${flavor}</b> : ${game.i18n.localize(
//     "arm5e.rolltables.experimentation.extraordinaryResults.desc." + mnemoSuffix
//   )}</li>`;
// }

function _getTableResult(tableName, mnemoSuffix, short = false) {
  const flavor = game.i18n.localize(
    `arm5e.rolltables.experimentation.${tableName}.${mnemoSuffix}.short`
  );
  if (short) {
    return `<li>${flavor}</li>`;
  } else {
    return `<li><b>${flavor}</b> : ${game.i18n.localize(
      `arm5e.rolltables.experimentation.${tableName}.${mnemoSuffix}.long`
    )}
  </li>`;
  }
}

function _listDisasters(botches) {
  let res = "<ul>";
  if (botches <= 0) {
    return "";
  }
  if (botches >= 1) {
    res += `<li>${game.i18n.localize("arm5e.rolltables.experimentation.disaster.1botch")}</li>`;
  }
  if (botches >= 2) {
    res += `<li>${game.i18n.localize("arm5e.rolltables.experimentation.disaster.2botches")}</li>`;
  }
  if (botches >= 3) {
    res += `<li>${game.i18n.localize("arm5e.rolltables.experimentation.disaster.3botches")}</li>`;
  }
  if (botches >= 4) {
    res += `<li>${game.i18n.localize("arm5e.rolltables.experimentation.disaster.4botches")}</li>`;
  }
  if (botches >= 5) {
    res += `<li>${game.i18n.localize("arm5e.rolltables.experimentation.disaster.5botches")}</li>`;
  }
  res += "</ul>";
  return res;
}
