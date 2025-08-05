import { getActorsFromTargetedTokens } from "./tokens.js";
import { chatContestOfMagic, chatContestOfPower } from "./chat.js";
import { log } from "../tools.js";
import Aura from "./aura.js";

const VOICE_AND_GESTURES_ICONS = {
  voice: "icons/skills/trades/music-singing-voice-blue.webp",
  gestures: "icons/skills/social/wave-halt-stop.webp"
};

/**
 *
 */
export async function GetFilteredAspects() {
  const filterBooks = Object.fromEntries(
    Object.entries(await game.settings.get(CONFIG.ARM5E.SYSTEM_ID, "sourcebookFilter")).filter(
      ([key, f]) => f.display === true
    )
  );
  const filteredAspects = Object.entries(CONFIG.ARM5E.ASPECTS).filter(([key, val]) => {
    return val.src in filterBooks;
  });
  for (const [k, a] of filteredAspects) {
    a.effects = Object.fromEntries(
      Object.entries(a.effects).map(([key, val]) => {
        return [key, { ...val, selectLabel: `${val.name} (+${val.bonus})` }];
      })
    );
  }
  return Object.fromEntries(filteredAspects);
}

/**
 *
 * @param data
 */
export async function GetFilteredMagicalAttributes(data) {
  const filterBooks = Object.fromEntries(
    Object.entries(await game.settings.get(CONFIG.ARM5E.SYSTEM_ID, "sourcebookFilter")).filter(
      ([key, f]) => f.display === true
    )
  );
  // Filter to only the values configured in settings
  let tmp = Object.entries(CONFIG.ARM5E.magic.ranges).filter(([key, val]) => {
    return val.source in filterBooks;
  });

  data.ranges = Object.fromEntries(
    Object.entries(CONFIG.ARM5E.magic.ranges)
      .filter(([key, val]) => {
        return val.source in filterBooks;
      })
      .map(([k, v]) => {
        {
          if (v.impact != undefined) {
            return [
              k,
              { label: `${game.i18n.localize(v.label)}  (${v.impact})`, source: v.source }
            ];
          } else {
            return [k, { label: `${game.i18n.localize(v.label)}`, disabled: true }];
          }
        }
      })
  );

  data.targets = Object.fromEntries(
    Object.entries(CONFIG.ARM5E.magic.targets)
      .filter(([key, val]) => {
        return val.source in filterBooks;
      })
      .map(([k, v]) => {
        {
          if (v.impact != undefined) {
            return [
              k,
              { label: `${game.i18n.localize(v.label)}  (${v.impact})`, source: v.source }
            ];
          } else {
            return [k, { label: `${game.i18n.localize(v.label)}`, disabled: true }];
          }
        }
      })
  );

  data.durations = Object.fromEntries(
    Object.entries(CONFIG.ARM5E.magic.durations)
      .filter(([key, val]) => {
        return val.source in filterBooks;
      })
      .map(([k, v]) => {
        {
          if (v.impact != undefined) {
            return [
              k,
              { label: `${game.i18n.localize(v.label)}  (${v.impact})`, source: v.source }
            ];
          } else {
            return [k, { label: `${game.i18n.localize(v.label)}`, disabled: true }];
          }
        }
      })
  );
}

/**
 *
 * @param context
 */
export function GetEnchantmentSelectOptions(context) {
  context.selection.frequency = Object.fromEntries(
    Object.entries(CONFIG.ARM5E.lab.enchantment.effectUses).map(([k, v]) => {
      return [k, `${v} ${game.i18n.localize("arm5e.lab.enchantment.uses-per-day")}`];
    })
  );

  context.selection.materialBase = Object.fromEntries(
    Object.entries(CONFIG.ARM5E.lab.enchantment.materialBase).map(([k, v]) => {
      return [k, `(${v.base}) ${game.i18n.localize(v.eg)}`];
    })
  );

  context.selection.sizeMultiplier = Object.fromEntries(
    Object.entries(CONFIG.ARM5E.lab.enchantment.sizeMultiplier).map(([k, v]) => {
      return [k, `${game.i18n.localize(v.value)} (x ${v.mult})`];
    })
  );
}

/**
 *
 * @param spelldata
 * @param flavor
 * @param editable
 */
export async function PickRequisites(spelldata, flavor, editable) {
  spelldata.config = {
    magic: {
      techniques: CONFIG.ARM5E.magic.techniques,
      forms: CONFIG.ARM5E.magic.forms
    }
  };
  spelldata.edition = editable;
  spelldata.ui = { flavor: flavor };
  log("false", spelldata);
  // Var itemData = this.item;
  let template = "systems/arm5e/templates/item/parts/requisites.html";
  let html = await renderTemplate(template, spelldata);

  let itemUpdate = await new Promise((resolve) => {
    new Dialog(
      {
        title: game.i18n.localize("arm5e.sheet.Requisites"),
        content: html,
        buttons: {
          yes: {
            icon: "<i class='fas fa-check'></i>",
            label: game.i18n.localize("arm5e.dialog.button.save"),
            callback: async (html) => {
              resolve(_setRequisites(html));
            }
          },
          no: {
            icon: "<i class='fas fa-ban'></i>",
            label: game.i18n.localize("arm5e.dialog.button.cancel"),
            callback: null
          }
        }
      },
      {
        classes: ["arm5e-dialog", "dialog"]
      }
    ).render(true);
  });
  return itemUpdate;
}

/**
 *
 * @param selector
 */
function _setRequisites(selector) {
  let itemUpdate = {};

  for (const tech of Object.entries(CONFIG.ARM5E.magic.techniques)) {
    let found = selector.find(`.Selected${tech[1].label}`);
    if (found.length > 0) {
      if (found[0].checked === true) {
        itemUpdate[`system.technique-req.${tech[0]}`] = true;
      } else {
        itemUpdate[`system.technique-req.${tech[0]}`] = false;
      }
    }
  }

  // Forms
  for (const form of Object.entries(CONFIG.ARM5E.magic.forms)) {
    let found = selector.find(`.Selected${form[1].label}`);
    if (found.length > 0) {
      if (found[0].checked === true) {
        itemUpdate[`system.form-req.${form[0]}`] = true;
      } else {
        itemUpdate[`system.form-req.${form[0]}`] = false;
      }
    }
  }

  return itemUpdate;
}

export class QuickMagic extends FormApplication {
  constructor(data, options) {
    super(data, options);
    this.object.technique = "cr";
    this.object.form = "an";
    Hooks.on("closeApplication", (app, html) => this.onClose(app));
  }

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["arm5e-dialog", "dialog"],
      title: game.i18n.localize("arm5e.sheet.magicLabel"),
      template: "systems/arm5e/templates/generic/quick-magic.html",
      width: "auto",
      height: "auto",
      submitOnChange: true,
      closeOnSubmit: false
    });
  }

  async _render(force, options = {}) {
    // Parent class rendering workflow
    await super._render(force, options);

    // Register the active Application with the referenced Documents
    this.object.actor.apps[this.appId] = this;
  }

  onClose(app) {
    if (this.object.actor.apps[app.appId] != undefined) {
      delete this.object.actor.apps[app.appId];
    }
  }

  async getData(options = {}) {
    let sys = {
      stances: this.object.actor.system.stances,
      arts: this.object.actor.system.arts,
      characteristics: this.object.actor.system.characteristics,
      laboratory: this.object.actor.system.laboratory
    };
    const context = {
      name: this.object.name,
      system: sys,
      technique: this.object.technique,
      form: this.object.form,
      config: { magic: CONFIG.ARM5E.magic },
      selection: {
        voiceStances: Object.fromEntries(
          Object.entries(this.object.actor.system.stances.voice).map(([k, v]) => {
            return [k, `${game.i18n.localize(CONFIG.ARM5E.magic.mod.voice[k].mnemonic)} (${v})`];
          })
        ),
        gesturesStances: Object.fromEntries(
          Object.entries(this.object.actor.system.stances.gestures).map(([k, v]) => {
            return [k, `${game.i18n.localize(CONFIG.ARM5E.magic.mod.gestures[k].mnemonic)} (${v})`];
          })
        ),
        techniques: Object.fromEntries(
          Object.entries(this.object.actor.system.arts.techniques).map(([k, v]) => {
            return [k, `${CONFIG.ARM5E.magic.arts[k].short} (${v.finalScore})`];
          })
        ),
        forms: Object.fromEntries(
          Object.entries(this.object.actor.system.arts.forms).map(([k, v]) => {
            return [k, `${CONFIG.ARM5E.magic.arts[k].short} (${v.finalScore})`];
          })
        )
      }
    };
    log(false, `QuickMagic: ${JSON.stringify(context)}`);
    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find(".rollable").click(async (event) => {
      event.preventDefault();
      let dataset = event.currentTarget.dataset;
      dataset.technique = this.object.technique;
      dataset.form = this.object.form;
      await this.object.actor.sheet._onRoll(dataset);
    });
    html.find(".voice-and-gestures").change(async (event) => {
      event.preventDefault();
      const name = $(event.target).attr("effect");
      await this.object.actor.selectVoiceAndGestures(name, $(event.target).val());
    });
  }

  async _updateObject(event, formData) {
    if (formData.technique) {
      this.object.technique = formData.technique;
    }
    if (formData.form) {
      this.object.form = formData.form;
    }
    // For (let [key, value] of Object.entries(formData)) {
    //   log(false, `Updated ${key} : ${value}`);
    //   this.object[key] = value;
    // }
    // this.object = foundry.utils.expandObject(this.object);
    // log(false, `Scriptorium object: ${JSON.stringify(this.object)}`);
    this.render();
  }
}
/**
 *
 * @param tokenName
 * @param actor
 */
export async function quickMagic(tokenName, actor) {
  if (!actor._isMagus()) return;

  const magic = new QuickMagic(
    {
      name: tokenName,
      actor: actor
    },
    {}
  );
  const res = await magic.render(true);
}

/**
 *
 * @param base
 * @param num
 */
export function addSpellMagnitude(base, num) {
  if (num === 0) {
    return base;
  }
  // In case base is a string
  base = parseInt(base);
  if (num > 0) {
    // Log(false, `Adding ${num} magnitudes from ${base}`);
    if (base + num <= 5) {
      return base + num;
    }
    let loop = num;
    let res = base;
    while (loop > 0) {
      if (res < 5) {
        res++;
      } else {
        res = res + 5;
      }
      loop--;
    }
    return res;
  } else {
    // Log(false, `Adding ${num} magnitudes from ${base}`);
    if (base + num <= 1) {
      return base + num;
    }
    let loop = num;
    let res = base;
    while (loop < 0) {
      if (res <= 5) {
        res--;
      } else {
        res = res - 5;
      }
      loop++;
    }
    // Log(false, `returns ${res}`);
    return res;
  }
}

/**
 *
 * @param item
 * @param short
 */
export function spellTechniqueLabel(item, short = false) {
  let label = CONFIG.ARM5E.magic.techniques[item.technique.value][short ? "short" : "label"];
  let techReq = Object.entries(item["technique-req"]).filter((r) => r[1] === true);
  if (techReq.length > 0) {
    label += " (";
    techReq.forEach((key) => {
      label += `${CONFIG.ARM5E.magic.arts[key[0]].short} `;
    });
    // Remove last whitespace
    label = label.substring(0, label.length - 1);
    label += ")";
  }
  return label;
}

/**
 *
 * @param item
 * @param short
 */
export function spellFormLabel(item, short = false) {
  let label = CONFIG.ARM5E.magic.forms[item.form.value][short ? "short" : "label"];
  let techReq = Object.entries(item["form-req"]).filter((r) => r[1] === true);
  if (techReq.length > 0) {
    label += " (";
    techReq.forEach((key) => {
      label += `${CONFIG.ARM5E.magic.arts[key[0]].short} `;
    });
    // Remove last whitespace
    label = label.substring(0, label.length - 1);
    label += ")";
  }
  return label;
}

// Return a localize string of a magic effect attributes
/**
 *
 * @param item
 */
export function GetEffectAttributesLabel(item) {
  if (!IsMagicalEffect(item)) return "";
  let label = `${spellTechniqueLabel(item.system, true)} ${spellFormLabel(item.system, true)} ${
    item.system.level ? item.system.level : computeLevel(item.system, item.type)
  } - ${game.i18n.localize("arm5e.spell.range.short")}: ${game.i18n.localize(
    CONFIG.ARM5E.magic.ranges[item.system.range.value].label
  )} ${game.i18n.localize("arm5e.spell.duration.short")}: ${game.i18n.localize(
    CONFIG.ARM5E.magic.durations[item.system.duration.value].label
  )} ${game.i18n.localize("arm5e.spell.target.short")}: ${game.i18n.localize(
    CONFIG.ARM5E.magic.targets[item.system.target.value].label
  )}`;
  if (item.type === "enchantment") {
    label += `, ${game.i18n.localize("arm5e.lab.enchantment.effectFrequency")} : ${
      CONFIG.ARM5E.lab.enchantment.effectUses[item.system.effectfrequency]
    } ${game.i18n.localize("arm5e.lab.enchantment.uses-per-day")}`;
    if (item.system.penetration) {
      label += `, ${game.i18n.localize("arm5e.lab.enchantment.penetration")} : +${
        item.system.penetration
      }`;
    }
    if (item.system.maintainConc) {
      label += `, ${game.i18n.localize("arm5e.lab.enchantment.maintainConc")}`;
    }
  }
  return label;
}

export function GetRawLabTotalLabel(technique, form, level = null) {
  let res = CONFIG.ARM5E.magic.techniques[technique]["short"];
  res += ` ${CONFIG.ARM5E.magic.forms[form]["short"]}`;
  if (level) res += ` - ${level}`;
  return res;
}

/**
 *
 * @param item
 */
export function IsMagicalEffect(item) {
  return (
    item.type === "magicalEffect" ||
    item.type === "enchantment" ||
    item.type === "spell" ||
    (item.type === "laboratoryText" &&
      (item.system.type === "spell" || item.system.type === "enchantment"))
  );
}
/**
 *
 * @param item
 */
export function canBeEnchanted(item) {
  return ["item", "armor", "weapon", "book"].includes(item.type);
}

/**
 *
 * @param system
 * @param type
 */
export function computeLevel(system, type) {
  if (!system) return;
  let effectLevel = system.baseLevel;

  if (system.range.value) {
    effectLevel = addSpellMagnitude(
      effectLevel,
      CONFIG.ARM5E.magic.ranges[system.range.value].impact
    );
  }
  if (system.duration.value) {
    effectLevel = addSpellMagnitude(
      effectLevel,
      CONFIG.ARM5E.magic.durations[system.duration.value].impact
    );
  }
  if (system.target.value) {
    effectLevel = addSpellMagnitude(
      effectLevel,
      CONFIG.ARM5E.magic.targets[system.target.value].impact
    );
  }
  if (system.complexity) {
    effectLevel = addSpellMagnitude(effectLevel, system.complexity);
  }
  if (system.targetSize) {
    effectLevel = addSpellMagnitude(effectLevel, system.targetSize);
  }
  if (system.enhancingRequisite) {
    effectLevel = addSpellMagnitude(effectLevel, system.enhancingRequisite);
  }

  if (type === "enchantment" || (type === "laboratoryText" && system.type === "enchantment")) {
    effectLevel += parseInt(system.effectfrequency);
    if (system.penetration % 2 === 1) {
      system.penetration += 1;
    }
    effectLevel += system.penetration / 2;

    if (system.maintainConc) {
      effectLevel += 5;
    }

    if (system.environmentalTrigger) {
      effectLevel += 3;
    }

    if (system.restrictedUse) {
      effectLevel += 3;
    }

    if (system.linkedTrigger) {
      effectLevel += 3;
    }
  } else {
    let shouldBeRitual = system.ritual;
    // Duration above moon are rituals and rituals are minimum level 20
    if (
      CONFIG.ARM5E.magic.durations[system.duration.value].impact > 3 ||
      system.target.value === "bound" ||
      effectLevel > 50
    ) {
      shouldBeRitual = true;
    }

    if (shouldBeRitual && effectLevel < 20) {
      effectLevel = 20;
    }
    system.ritual = shouldBeRitual;
  }
  if (system.general) {
    effectLevel += system.levelOffset ?? 0;
  }
  return effectLevel;
}

/**
 *
 * @param effect
 * @param owner
 * @param options
 */
export function computeRawCastingTotal(effect, owner, options = {}) {
  if (owner.type != "player" && owner.type != "npc") {
    return 0;
  }
  let effectData = effect.system;
  let res = 0;
  let tech = 1000;
  let form = 1000;
  let label = "";
  let deficientTech = false;
  let deficientForm = false;
  let techReq = Object.entries(effectData["technique-req"]).filter((r) => r[1] === true);
  let formReq = Object.entries(effectData["form-req"]).filter((r) => r[1] === true);
  if (owner.system.arts.techniques[effectData.technique.value].deficient) {
    deficientTech = true;
  }
  if (owner.system.arts.forms[effectData.form.value].deficient) {
    deficientForm = true;
  }
  if (techReq.length > 0) {
    techReq.forEach((key) => {
      if (owner.system.arts.techniques[key[0]].deficient) {
        deficientTech = true;
      }
      tech = Math.min(tech, owner.system.arts.techniques[key[0]].finalScore);
    });

    tech = Math.min(owner.system.arts.techniques[effectData.technique.value].finalScore, tech);
  } else {
    tech = owner.system.arts.techniques[effectData.technique.value].finalScore;
  }
  if (formReq.length > 0) {
    formReq.forEach((key) => {
      if (owner.system.arts.forms[key[0]].deficient) {
        deficientForm = true;
      }
      form = Math.min(tech, owner.system.arts.forms[key[0]].finalScore);
    });
    form = Math.min(owner.system.arts.forms[effectData.form.value].finalScore, form);
  } else {
    form = owner.system.arts.forms[effectData.form.value].finalScore;
  }
  let techlabel = `${game.i18n.localize("arm5e.sheet.tech")}: ${tech}`;
  let formlabel = `${game.i18n.localize("arm5e.sheet.fo")}: ${form}`;

  if (effectData.applyFocus || options.focus) {
    res += tech + form + Math.min(tech, form);
    if (tech >= form) {
      formlabel = `(${formlabel} x 2) : ${2 * form}`;
    } else {
      techlabel += `(${techlabel} x 2) : ${2 * tech}`;
    }
  } else {
    res += tech + form;
  }

  return {
    total: res,
    deficientTech: deficientTech,
    deficientForm: deficientForm,
    label: `${techlabel} + ${formlabel} &#10`
  };
}

/**
 *
 * @param actor
 */
async function noFatigue(actor) {
  if (actor._isMagus()) {
    actor.rollInfo.useFatigue = false;
    actor.rollInfo.magic.divide = actor.system.bonuses.arts.spontDividerNoFatigue;
  }
}

/**
 *
 * @param actorCaster
 * @param roll
 * @param message
 */
async function checkTargetAndCalculateResistance(actorCaster, roll, message) {
  const actorsTargeted = getActorsFromTargetedTokens(actorCaster);
  if (!actorsTargeted) {
    return false;
  }
  switch (actorCaster.rollInfo.type) {
    case "power":
      for (let actorTarget of actorsTargeted) {
        const successOfPower = calculateSuccessOfPower({
          actorTarget,
          actorCaster,
          roll,
          spell: message
        });
        await chatContestOfPower(message, {
          actorCaster,
          actorTarget,
          ...successOfPower
        });
      }
      break;
    case "item":
      for (let actorTarget of actorsTargeted) {
        const successOfPower = calculateSuccessOfMagicItem({
          actorTarget,
          actorCaster,
          roll,
          spell: message
        });
        await chatContestOfPower(message, {
          actorCaster,
          actorTarget,
          ...successOfPower
        });
      }
      break;
    default:
      for (let actorTarget of actorsTargeted) {
        const successOfMagic = calculateSuccessOfMagic({
          actorTarget,
          actorCaster,
          roll,
          spell: message
        });
        await chatContestOfMagic(message, {
          actorCaster,
          actorTarget,
          ...successOfMagic
        });
      }
  }
}

/**
 *
 * @param root0
 * @param root0.actorCaster
 * @param root0.roll
 * @param root0.spell
 */
function calculatePenetration({ actorCaster, roll, spell }) {
  const levelOfSpell = actorCaster.rollInfo.magic.level;
  const totalOfSpell = roll._total;
  const penetrationRolldata = actorCaster.rollInfo.penetration;
  const penetration = actorCaster.getAbilityStats("penetration");
  let specialityIncluded = "";
  if (penetrationRolldata.specApply) {
    specialityIncluded = penetration.speciality;
  }
  // If (
  //   CONFIG.ARM5E.magic.arts[spell.system.form.value].label.toUpperCase() ===
  //     penetration.speciality.toUpperCase() ||
  //   CONFIG.ARM5E.magic.arts[spell.system.form.value].label.toUpperCase() ===
  //     penetration.speciality.toUpperCase()
  // ) {
  //   penetration += 1;
  //   specialityIncluded = penetration.speciality;
  // }

  return {
    totalOfSpell,
    levelOfSpell,
    penetration: penetrationRolldata.total,
    specialityIncluded,
    total: totalOfSpell - levelOfSpell + penetrationRolldata.total
  };
}

/**
 *
 * @param actor
 * @param form
 */
function calculateResistance(actor, form) {
  let magicResistance =
    Number(actor.system.laboratory?.magicResistance?.value) ||
    Number(actor.system?.might?.value) ||
    0; //  No magicResistance != magicResistance of 0

  // TODO support magic resistance for hedge magic forms

  let specialityIncluded = "";
  const parma = actor.getAbilityStats("parma");
  if (parma.speciality && parma.speciality.toUpperCase() === form.toUpperCase()) {
    specialityIncluded = form;
    magicResistance += 5;
  }

  const arts = actor.system?.arts;
  let auraMod = 0;
  // TODO, do a better job for player aligned to a realm
  if (actor._hasMight()) {
    let aura = Aura.fromActor(actor);
    auraMod = aura.computeMaxAuraModifier(actor.system.realms);
    magicResistance += parseInt(auraMod);
  }

  let formScore = 0;
  if (arts) {
    const formKey = Object.keys(arts.forms).filter(
      (key) => arts.forms[key].label.toUpperCase() === form.toUpperCase()
    )[0];
    formScore = arts.forms[formKey]?.finalScore || 0;
  }

  return {
    might: actor.system?.might?.value,
    specialityIncluded,
    total: magicResistance + formScore,
    formScore,
    parma,
    aura: auraMod
  };
}

/**
 *
 * @param root0
 * @param root0.actorCaster
 * @param root0.actorTarget
 * @param root0.roll
 */
function calculateSuccessOfMagic({ actorCaster, actorTarget, roll }) {
  const form = CONFIG.ARM5E.magic.arts[actorCaster.rollInfo.magic.form.value]?.label ?? "NONE";
  const penetration = calculatePenetration({ actorCaster, roll });
  const magicResistance = calculateResistance(actorTarget, form);
  return {
    penetration,
    magicResistance,
    total: penetration.total - magicResistance.total,
    form
  };
}

// TODO: merge with above for big refactorization next version

/**
 *
 * @param root0
 * @param root0.actorCaster
 * @param root0.actorTarget
 * @param root0.roll
 */
function calculateSuccessOfPower({ actorCaster, actorTarget, roll }) {
  const form = CONFIG.ARM5E.magic.arts[actorCaster.rollInfo.power.form].label;
  const penetrationTotal = actorCaster.rollInfo.secondaryScore + roll.total;

  // CalculatePenetration({ actorCaster, roll, spell });
  const magicResistance = calculateResistance(actorTarget, form);
  return {
    penetrationTotal,
    magicResistance,
    total: penetrationTotal - magicResistance.total,
    form
  };
}

/**
 *
 * @param root0
 * @param root0.actorCaster
 * @param root0.actorTarget
 * @param root0.roll
 */
function calculateSuccessOfMagicItem({ actorCaster, actorTarget, roll }) {
  const form = CONFIG.ARM5E.magic.arts[actorCaster.rollInfo.item.form].label;
  const penetrationTotal = actorCaster.rollInfo.secondaryScore + roll.total;

  // CalculatePenetration({ actorCaster, roll, spell });
  const magicResistance = calculateResistance(actorTarget, form);
  return {
    penetrationTotal,
    magicResistance,
    total: penetrationTotal - magicResistance.total,
    form
  };
}

/**
 *
 * @param attributes
 * @param options
 */
function magicalAttributesHelper(attributes, options) {
  // For (const range of Object.entries(ranges))
  return HandlebarsHelpers.selectOptions(attributes, options);
}

export {
  calculateSuccessOfMagic,
  checkTargetAndCalculateResistance,
  noFatigue,
  magicalAttributesHelper
};
