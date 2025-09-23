import { ArsRoll } from "../helpers/stressdie.js";
import { log } from "../tools.js";
import { privateMessage } from "../helpers/chat-message.js";

export class LabExperimentation extends FormApplication {
  constructor(
    data = {
      experimenter: game.user.character?.name || "Anonymous",
      subject: "",
      riskModifier: 0,
      aura: 0,
      discovery: false
    },
    options
  ) {
    super(data, options);

    const currentDate = game.settings.get("arm5e", "currentDate");
    if (data.year === undefined) {
      this.object.year = currentDate.year;
    }
    if (data.season === undefined) {
      this.object.season = currentDate.season;
    }
    if (data.subject === "") {
      this.object.subject = game.i18n.localize("arm5e.rolltables.experimentation.subject");
    }
    if (data.experimenter === undefined) {
      this.object.experimenter = game.user.character.name;
    }

    this.object.reportBody = "";
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
      height: "750",
      submitOnChange: true,
      closeOnSubmit: false
    });
  }

  async getData(options = {}) {
    const context = foundry.utils.expandObject(await super.getData().object);
    context.seasons = CONFIG.ARM5E.seasons;
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

    html.find(".create-journal").click(this._createJournal.bind(this));
  }

  async rollForExperimentation(event) {
    event.preventDefault();
    const reportBody = await this._rollForExperimentation(
      this.object.riskModifier,
      this.object.aura,
      this.object.discovery
    );
    const report = `<h2>${this.title}</h2>${reportBody}`;
    const title = `${game.i18n.localize("arm5e.rolltables.experimentation.title")}`;
    await privateMessage("", game.user.character, title, report, "standard");
    await this.submit({
      updateData: { reportBody: reportBody }
    });
  }

  async _createJournal() {
    const data = this.object;
    if (data.reportBody === "") {
      return;
    }
    const folderName = game.i18n.localize("arm5e.rolltables.experimentation.title");
    let folder = game.folders.getName(folderName);
    if (!folder) {
      [folder] = await Folder.create([{ name: folderName, type: "JournalEntry" }]);
    }
    // TODO : better way to set the character name, constructor?
    let entry = game.journal.getName(data.experimenter);
    if (!entry) {
      [entry] = await JournalEntry.create([{ name: data.experimenter, folder: folder._id }]);
    }

    await entry.createEmbeddedDocuments("JournalEntryPage", [
      { name: this.title, type: "text", text: { content: data.reportBody } }
    ]);
  }

  async _clearAll(event) {
    event.preventDefault();

    await this.submit({
      updateData: { reportBody: "" }
    });
  }

  async _updateObject(event, formData) {
    const expanded = foundry.utils.expandObject(formData);
    foundry.utils.mergeObject(this.object, expanded, { recursive: true });
    this.render();
  }

  get title() {
    return `${this.object.subject}, ${game.i18n.localize(
      CONFIG.ARM5E.seasons[this.object.season].label
    )} ${this.object.year}`;
  }

  ///////////////////////
  // LAB EXPERIMENTATION
  ////////////////////////

  async _rollForExperimentation(risk, aura, discovery = false) {
    const rollFormula = `${Math.abs(risk) + aura}ds + ${risk}`;

    const roll = new ArsRoll(rollFormula, {});

    await roll.evaluate();

    // needed to set other roll attributes:
    const diceRoll = roll.total;
    let rtCompendium = game.packs.get("arm5e-compendia.rolltables");
    let docs = await rtCompendium.getDocuments();
    let rt = docs.find((e) => e.name == "Experimentation.main");
    let reportBody = `${this._rollOnTableDesc("main", roll)}<ul>`;

    let flavor = this._rollOnTableDesc("main", roll, false);
    if (roll.botches) {
      flavor = game.i18n.localize(
        "arm5e.rolltables.experimentation.extraordinaryResults.disaster.short"
      );
      reportBody += this._getTableResult("extraordinaryResults", "disaster");
      // flavor += this._getTableResult("extraordinaryResults", "disaster", true);
      flavor += ` : ${roll.desc}`;
      await roll.toMessage({ flavor: flavor });
      reportBody += this._listDisasters(roll.botches);
    } else {
      // let res = await rt.getResultsForRoll(10);
      let res = await rt.getResultsForRoll(diceRoll);
      log(false, res);
      if (res.length == 1) {
        reportBody += this._getTableResult("extraordinaryResults", res[0].text);
        flavor += this._getTableResult("extraordinaryResults", res[0].text, true);
        await roll.toMessage({ flavor: flavor });
        if (res[0].text === "rollTwice") {
          reportBody += await this._rollForExperimentation(risk, aura, discovery);
          reportBody += await this._rollForExperimentation(risk, aura, discovery);
        }
      } else {
        let tableRef;
        if (CONFIG.ISV13) {
          tableRef = res.find((e) => e.type == "document");
        } else {
          tableRef = res.find((e) => e.type == "pack");
        }
        const subRt = docs.find((e) => tableRef.documentId === e._id);
        const subTitle = res.find((e) => e.type == "text").text;
        reportBody += this._getTableResult("extraordinaryResults", subTitle);
        flavor += this._getTableResult("extraordinaryResults", subTitle, true);
        await roll.toMessage({ flavor: flavor });
        let subFormula;
        reportBody += "<ul>";
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
            reportBody += `<li><b>${game.i18n.format("arm5e.rolltables.experimentation.insight", {
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
          reportBody += this._rollOnTableDesc(subTitle, subRoll);
          flavor = this._rollOnTableDesc(subTitle, subRoll, false);

          if (subTitle === "discovery" && subRes[0].text == "rollTwice") {
            reportBody += `<i>${this._getTableResult(subTitle, subRes[0].text)}</i>`;
            flavor += `<i>${this._getTableResult(subTitle, subRes[0].text)}</i>`;
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

              reportBody += this._rollOnTableDesc(subTitle, discoveryRoll);
              reportBody += this._getTableResult(subTitle, discoveryRes[0].text);
              flavor = this._rollOnTableDesc(subTitle, discoveryRoll, false);
              flavor += this._getTableResult(subTitle, discoveryRes[0].text, true);
              await discoveryRoll.toMessage({ flavor: flavor });
            }
          } else {
            reportBody += this._getTableResult(subTitle, subRes[0].text);
            flavor += this._getTableResult(subTitle, subRes[0].text, true);
            await subRoll.toMessage({ flavor: flavor });
          }
        }

        reportBody += "</ul>";
      }
    }
    reportBody += "</ul>";

    return reportBody;
  }

  _rollOnTableDesc(tablename, roll, withFormula = true) {
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

  _getTableResult(tableName, mnemoSuffix, short = false) {
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

  _listDisasters(botches) {
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
}
