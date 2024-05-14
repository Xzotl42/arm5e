import { stressDie } from "../dice.js";
import { GetEffectAttributesLabel, computeLevel } from "../helpers/magic.js";
import { log } from "../tools.js";

export class InvestigationRoll extends FormApplication {
  constructor(diary, data, options) {
    data.effects = data.system.enchantments.effects.map((e) => {
      return {
        name: e.name,
        img: e.img,
        desc: e.system.description,
        level: computeLevel(e.system, e.type),
        receptacleId: e.receptacleId,
        details: GetEffectAttributesLabel(e),
        visible: !e.system.hidden
      };
    });

    if (data.system.enchantments.state === "talisman") {
      data.effects.push({
        name: game.i18n.localize("arm5e.enchantment.attuned"),
        img: CONFIG.ARM5E_DEFAULT_ICONS["enchantment"],
        level: 20,
        details: "Cr Vi 20",
        visible: data.system.enchantments.attunementVisible
      });
    }
    super(data, options);
    this.actor = diary.actor;
    this.diary = diary;
    this.object.botchDice = 1;
    this.object.failedInvestigation = false;
    this.object.diaryDescription = "<br/><ul>";
    Hooks.on("closeApplication", (app, html) => this.onClose(app));
  }

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["arm5e", "sheet", "sanatorium-sheet"],
      title: game.i18n.localize("arm5e.lab.activity.itemInvestigation"),
      template: "systems/arm5e/templates/generic/investigationRoll.html",
      scrollY: [".years"],
      width: "600",
      height: "800",
      submitOnChange: true,
      closeOnSubmit: false
    });
  }

  onClose(app) {}

  async getData(options = {}) {
    const context = await super.getData().object;
    context.visibleEffects = context.effects
      .filter((e) => e.visible)
      .sort((a, b) => a.level - b.level);

    context.discoveredEffects = context.effects
      .filter((e) => e.discovered)
      .sort((a, b) => a.level - b.level);

    context.config = CONFIG.ARM5E;

    log(false, context);
    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find(".resource-focus").focus((ev) => {
      ev.preventDefault();
      ev.currentTarget.select();
    });
    html.find(".investigate").click(this._investigate.bind(this));
    html.find(".end-investigate").click(this._endInvestigation.bind(this));
  }
  async _endInvestigation(event) {
    const magicItem = await fromUuid(this.object.uuid);
    // const effects = magicItem.system.enchantments.effects.map((a) => {
    //   return { ...a };
    // });
    const effects = structuredClone(magicItem.system.enchantments.effects);
    const itemData = {};
    if (magicItem.system.enchantments.state == "talisman") {
      const idx = this.object.effects.findIndex((e) => {
        return e.name == game.i18n.localize("arm5e.enchantment.attuned") && e.level == 20;
      });
      if (this.object.effects[idx].discovered) {
        itemData["system.enchantments.attunementVisible"] = true;
      }
      this.object.effects.splice(idx, 1);
    }
    for (let idx = 0; idx < this.object.effects.length; idx++) {
      if (this.object.effects[idx].discovered) {
        effects[idx].system.hidden = false;
      }
    }
    itemData["system.enchantments.effects"] = effects;
    await magicItem.update(itemData);
    magicItem.sheet.render(false);
    // diary update
    const diaryData = {};
    diaryData["system.done"] = true;
    diaryData["system.description"] = this.diary.system.description + this.object.diaryDescription;
    await this.diary.update(diaryData);
    this.diary.sheet.render(false);
    this.close();
  }

  async _investigate(event) {
    const labTotal = this.object.labTotal;
    const effects = foundry.utils.deepClone(this.object.effects);
    const hiddenEffects = effects
      .filter((e) => {
        return !e.visible && !e.discovered;
      })
      .sort((a, b) => a.level - b.level);
    let dataset = {
      roll: "option",
      name: game.i18n.format("arm5e.lab.planning.investigation.diaryTitle", {
        name: this.object.name
      }),
      physicalcondition: false
    };
    this.actor.rollInfo.init(dataset, this.actor);
    this.actor.rollInfo.setGenericField(
      game.i18n.localize("arm5e.sheet.labTotal"),
      labTotal,
      1,
      "+"
    );
    let desc = this.object.diaryDescription;
    let failed = false;
    const res = await stressDie(
      this.actor,
      dataset.roll,
      16,
      undefined,
      this.object.botchDice ?? 0
    );
    desc += `<li>${game.i18n.format("arm5e.lab.planning.investigation.rolled", {
      total: res._total,
      labTotal: labTotal
    })}`;
    if (hiddenEffects.length == 0) {
      desc += `<br/>${game.i18n.localize(
        "arm5e.lab.planning.investigation.nothingFound"
      )}</li></ul>`;
      failed = true;
    } else if (res._total == 0) {
      desc += `<br/>${game.i18n.format("arm5e.lab.planning.investigation.botched", {
        botches: res.botches
      })}</li>`;
      failed = true;
    } else if (res._total >= hiddenEffects[0].level) {
      desc += `<br/>${game.i18n.format("arm5e.lab.planning.investigation.foundEffect", {
        effect: `"${hiddenEffects[0].name}" ${hiddenEffects[0].details}`
      })}</li>`;
      hiddenEffects[0].discovered = true;
    } else {
      desc += `<br/>${game.i18n.localize(
        "arm5e.lab.planning.investigation.nothingFound."
      )}</li></ul>`;
      failed = true;
    }

    const updateData = {
      diaryDescription: desc,
      failedInvestigation: failed,
      effects: effects
    };

    // this.render(true);
    await this.submit({
      preventClose: true,
      updateData: updateData
    });
  }

  async _updateObject(event, formData) {
    const expanded = foundry.utils.expandObject(formData);
    foundry.utils.mergeObject(this.object, expanded, { recursive: true });
    this.render();
  }
}
