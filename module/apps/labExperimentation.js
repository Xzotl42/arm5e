import { ArsRoll } from "../helpers/roll.js";
import { log } from "../tools/tools.js";
import { privateMessage } from "../helpers/chat-message.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class LabExperimentation extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(
    data = {
      experimenter: game.user.character?.name || "Anonymous",
      subject: "",
      riskModifier: 0,
      aura: 0,
      discovery: false
    },
    options = {}
  ) {
    super(options);

    const currentDate = game.settings.get("arm5e", "currentDate");
    if (data.year === undefined) {
      data.year = currentDate.year;
    }
    if (data.season === undefined) {
      data.season = currentDate.season;
    }
    if (data.subject === "") {
      data.subject = game.i18n.localize("arm5e.rolltables.experimentation.subject");
    }
    if (data.experimenter === undefined) {
      data.experimenter = game.user.character.name;
    }

    data.reportBody = "";
    this.object = data;
  }

  static DEFAULT_OPTIONS = {
    id: "lab-experimentation",
    classes: ["arm5e", "sheet", "scriptorium-sheet"],
    tag: "form",
    form: {
      handler: LabExperimentation.#onSubmitHandler,
      submitOnChange: true,
      closeOnSubmit: false
    },
    window: {
      title: "arm5e.rolltables.experimentation.title",
      contentClasses: ["standard-form"]
    },
    position: {
      width: 600,
      height: "auto" // 828
    }
  };

  static PARTS = {
    header: { template: "systems/arm5e/templates/generic/parts/scriptorium-header.hbs" },
    form: {
      template: "systems/arm5e/templates/generic/labExperimentation.html"
    },
    footer: { template: "systems/arm5e/templates/generic/parts/scriptorium-footer.hbs" }
  };

  static async #onSubmitHandler(event, form, formData) {
    const expanded = foundry.utils.expandObject(formData.object);
    foundry.utils.mergeObject(this.object, expanded, { recursive: true });
  }

  async _prepareContext(options = {}) {
    const context = await super._prepareContext(options);
    context.seasons = CONFIG.ARM5E.seasons;
    context.experimenter = this.object.experimenter;
    context.subject = this.object.subject;
    context.riskModifier = this.object.riskModifier;
    context.aura = this.object.aura;
    context.discovery = this.object.discovery;
    context.year = this.object.year;
    context.season = this.object.season;
    context.reportBody = this.object.reportBody;
    return context;
  }

  _onRender(context, options) {
    super._onRender(context, options);
    const html = this.element;

    html.querySelectorAll(".select-on-focus").forEach((el) => {
      el.addEventListener("focus", (ev) => {
        ev.preventDefault();
        ev.currentTarget.select();
      });
    });

    html
      .querySelector(".experimentation-roll")
      ?.addEventListener("click", (ev) => this.rollForExperimentation(ev));

    html.querySelector(".clear-all")?.addEventListener("click", (ev) => this._clearAll(ev));

    html
      .querySelector(".create-journal")
      ?.addEventListener("click", (ev) => this._createJournal(ev));
  }

  get title() {
    return `${this.object.subject}, ${game.i18n.localize(
      CONFIG.ARM5E.seasons[this.object.season].label
    )} ${this.object.year}`;
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

    this.object.reportBody = reportBody;
    await this.render(true);
  }

  async _createJournal(event) {
    event.preventDefault();
    const data = this.object;
    if (data.reportBody === "") {
      return;
    }
    const folderName = game.i18n.localize("arm5e.rolltables.experimentation.title");
    let folder = game.folders.getName(folderName);
    if (!folder) {
      [folder] = await Folder.create([{ name: folderName, type: "JournalEntry" }]);
    }
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
    this.object.reportBody = "";
    await this.render(true);
  }

  ///////////////////////
  // LAB EXPERIMENTATION
  ////////////////////////

  async _rollForExperimentation(risk, aura, discovery = false) {
    const rollFormula = `${Math.abs(risk) + aura}ds + ${risk}`;

    const roll = new ArsRoll(rollFormula, {}, { actor: this.object.experimenter.uuid });

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
        reportBody += this._getTableResult("extraordinaryResults", res[0].description);
        flavor += this._getTableResult("extraordinaryResults", res[0].description, true);
        await roll.toMessage({ flavor: flavor });
        if (res[0].description === "rollTwice") {
          reportBody += await this._rollForExperimentation(risk, aura, discovery);
          reportBody += await this._rollForExperimentation(risk, aura, discovery);
        }
      } else {
        let tableRef = res.find((e) => e.type == "document");
        const subRt = docs.find((e) => tableRef.documentUuid === e.uuid);
        const subTitle = res.find((e) => e.type == "text").description;
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
          let subRoll = new ArsRoll(subFormula, {}, { actor: this.object.experimenter.uuid });
          await subRoll.evaluate();

          let subTotal = subRoll.total;
          const subRes = await subRt.getResultsForRoll(subTotal);
          reportBody += this._rollOnTableDesc(subTitle, subRoll);
          flavor = this._rollOnTableDesc(subTitle, subRoll, false);

          if (subTitle === "discovery" && subRes[0].description == "rollTwice") {
            reportBody += `<i>${this._getTableResult(subTitle, subRes[0].description)}</i>`;
            flavor += `<i>${this._getTableResult(subTitle, subRes[0].description)}</i>`;
            await subRoll.toMessage({ flavor: flavor });
            for (let i = 0; i < 2; i++) {
              let discoveryRoll = new ArsRoll(
                subFormula,
                {},
                { actor: this.object.experimenter.uuid }
              );
              await discoveryRoll.evaluate();
              let discoveryRes = await subRt.getResultsForRoll(discoveryRoll.total);
              while (discoveryRes[0].description == "rollTwice") {
                log(false, "RollTwice only once, reroll");
                discoveryRoll = new ArsRoll(
                  subFormula,
                  {},
                  { actor: this.object.experimenter.uuid }
                );
                await discoveryRoll.evaluate();
                discoveryRes = await subRt.getResultsForRoll(discoveryRoll.total);
              }

              reportBody += this._rollOnTableDesc(subTitle, discoveryRoll);
              reportBody += this._getTableResult(subTitle, discoveryRes[0].description);
              flavor = this._rollOnTableDesc(subTitle, discoveryRoll, false);
              flavor += this._getTableResult(subTitle, discoveryRes[0].description, true);
              await discoveryRoll.toMessage({ flavor: flavor });
            }
          } else {
            reportBody += this._getTableResult(subTitle, subRes[0].description);
            flavor += this._getTableResult(subTitle, subRes[0].description, true);
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
