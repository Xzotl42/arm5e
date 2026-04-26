import { log } from "../tools/tools.js";
import { TWILIGHT_STAGES } from "../seasonal-activities/long-term-activities.js";
import {
  _applyImpact,
  ROLL_MODES,
  UseMagicItemWindow,
  UsePowerRollWindow
} from "../ui/roll-window.js";
import { customDialogAsync } from "../ui/dialogs.js";
const renderTemplate = foundry.applications.handlebars.renderTemplate;
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
 * @param updatePath
 */
export async function PickRequisites(spelldata, flavor, editable, updatePath = "system") {
  spelldata.config = {
    magic: {
      techniques: CONFIG.ARM5E.magic.techniques,
      forms: CONFIG.ARM5E.magic.forms
    },
    updatePath: updatePath
  };
  spelldata.edition = editable;
  spelldata.ui = { flavor: flavor };
  log("false", spelldata);
  // Var itemData = this.item;
  let template = "systems/arm5e/templates/item/parts/requisites.html";
  let html = await renderTemplate(template, spelldata);

  return await customDialogAsync({
    window: {
      title: game.i18n.localize("arm5e.sheet.Requisites")
    },
    classes: ["arm5eRequisite"],
    content: html,
    buttons: [
      {
        action: "confirm",
        icon: "<i class='fas fa-check'></i>",
        label: game.i18n.localize("arm5e.generic.confirm"),
        callback: async (event, button, dialog) => {
          return _setRequisites(dialog.element, updatePath);
        }
      },
      {
        action: "cancel",
        icon: "<i class='fas fa-ban'></i>",
        label: game.i18n.localize("arm5e.dialog.button.cancel"),
        callback: null
      }
    ]
  });
}

/**
 *
 * @param selector
 * @param updatePath
 */
function _setRequisites(selector, updatePath) {
  let itemUpdate = {};

  for (const tech of Object.entries(CONFIG.ARM5E.magic.techniques)) {
    let found = selector.querySelector(`.Selected${tech[1].label}`);
    if (found.checked === true) {
      itemUpdate[`${updatePath}.technique-req.${tech[0]}`] = true;
    } else {
      itemUpdate[`${updatePath}.technique-req.${tech[0]}`] = false;
    }
  }

  // Forms
  for (const form of Object.entries(CONFIG.ARM5E.magic.forms)) {
    let found = selector.querySelector(`.Selected${form[1].label}`);
    if (found.checked === true) {
      itemUpdate[`${updatePath}.form-req.${form[0]}`] = true;
    } else {
      itemUpdate[`${updatePath}.form-req.${form[0]}`] = false;
    }
  }

  return itemUpdate;
}

export class QuickMagic extends foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.api.ApplicationV2
) {
  constructor(data, options = {}) {
    super(options);
    this.object = data;
    this.object.technique ??= "cr";
    this.object.form ??= "an";
  }

  static DEFAULT_OPTIONS = {
    id: "quick-magic",
    classes: ["arm5e-dialog", "dialog"],
    window: {
      title: "arm5e.sheet.magicLabel",
      resizable: true
    },
    position: {
      width: 260,
      height: "auto"
    },
    form: {
      handler: QuickMagic.#onSubmitHandler,
      submitOnChange: true,
      closeOnSubmit: false
    },
    tag: "form",
    actions: {
      roll: QuickMagic.roll
    }
  };

  static PARTS = {
    main: {
      template: "systems/arm5e/templates/generic/quick-magic.html"
    }
  };

  static async #onSubmitHandler(event, form, formData) {
    if (formData.object.technique) {
      this.object.technique = formData.object.technique;
    }
    if (formData.object.form) {
      this.object.form = formData.object.form;
    }
    this.render();
  }

  async _prepareContext() {
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
    // log(false, `QuickMagic: ${JSON.stringify(context)}`);
    return context;
  }

  _onRender(context, options) {
    this.object.actor.apps[this.options.uniqueId] = this;

    this.element.querySelectorAll(".voice-and-gestures").forEach((element) => {
      element.addEventListener("change", async (event) => {
        event.preventDefault();
        const name = event.currentTarget.getAttribute("effect");
        await this.object.actor.selectVoiceAndGestures(name, event.currentTarget.value);
      });
    });
  }

  static async roll(event, target) {
    target.dataset.technique = this.object.technique;
    target.dataset.form = this.object.form;
    await this.object.actor.sheet.roll(event, target);
  }

  async close(options = {}) {
    if (this.object?.actor?.apps?.[this.options.uniqueId]) {
      delete this.object.actor.apps[this.options.uniqueId];
    }
    return super.close(options);
  }
}
/**
 *
 * @param tokenName
 * @param actor
 */
export async function quickMagic(tokenName, actor) {
  if (!actor.isMagus()) return;

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
 * @param requisites
 */
export function getRequisitesLabel(requisites) {
  let result = "";
  if (requisites.length == 0) {
    return result;
  }
  result += "(";
  requisites.forEach((key) => {
    result += `${CONFIG.ARM5E.magic.arts[key[0]].short} `;
  });
  // remove last whitespace
  result = result.substring(0, result.length - 1);
  result += ")";
  return result;
}

/**
 *
 * @param item
 * @param short
 */
export function spellTechniqueLabel(item, short = false) {
  let label = CONFIG.ARM5E.magic.techniques[item.technique.value][short ? "short" : "label"];
  let techReq = Object.entries(item["technique-req"]).filter((r) => r[1] === true);
  label += getRequisitesLabel(techReq);

  return label;
}

/**
 *
 * @param item
 * @param short
 */
export function spellFormLabel(item, short = false) {
  let label = CONFIG.ARM5E.magic.forms[item.form.value][short ? "short" : "label"];
  let formReq = Object.entries(item["form-req"]).filter((r) => r[1] === true);
  label += getRequisitesLabel(formReq);
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

/**
 *
 * @param technique
 * @param form
 * @param level
 */
export function GetRawLabTotalLabel(technique, form, level = null) {
  let res = CONFIG.ARM5E.magic.techniques[technique].short;
  res += ` ${CONFIG.ARM5E.magic.forms[form].short}`;
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
 * @param general
 */
export function computeLevel(system, type, general = true) {
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
  if (general && system.general) {
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
      form = Math.min(form, owner.system.arts.forms[key[0]].finalScore);
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
function noFatigue(actor) {
  if (actor.isMagus()) {
    actor.rollInfo.impact.fail.fatigue = 0;
    actor.rollInfo.magic.divide = actor.system.bonuses.arts.spontDividerNoFatigue;
  }
}

/**
 *
 * @param actor
 * @param castingTotal
 * @param difficulty
 * @param ritual
 */
function fatigueCost(actor, castingTotal, difficulty, ritual = false) {
  const res = { use: 0, partial: 0, fail: 0 };
  const delta = castingTotal - difficulty;

  if (ritual) {
    calculateRitualFatigueCost(res, delta, difficulty, castingTotal, actor);
  } else {
    calculateSpellFatigueCost(res, delta, actor);
  }

  log(false, "Spell fatigue cost", res);
  return res;
}

/**
 *
 * @param res
 * @param delta
 * @param difficulty
 * @param castingTotal
 * @param actor
 */
function calculateRitualFatigueCost(res, delta, difficulty, castingTotal, actor) {
  const ritualFatigueCancelled = actor.system.bonuses.arts.ritualFatigueCancelled;

  // Base cost for casting ritual (reduced by mythic blood virtue)
  res.use = Math.max(1 - ritualFatigueCancelled, 0);

  // Additional fatigue if ritual fails
  if (delta < 0) {
    const failureMargin = difficulty - castingTotal;
    const totalFatigueLevels = Math.ceil(failureMargin / 5);

    // Mythic blood can cancel up to 2 partial fatigue levels beyond the initial use cost
    const partialFatigueCancellation = Math.min(Math.max(ritualFatigueCancelled - 1, 0), 2);

    const MAX_PARTIAL_LEVELS = 2;

    if (totalFatigueLevels > MAX_PARTIAL_LEVELS) {
      // Split between partial (first 2) and full fatigue (rest)
      res.fail = totalFatigueLevels - MAX_PARTIAL_LEVELS;
      res.partial = Math.max(MAX_PARTIAL_LEVELS - partialFatigueCancellation, 0);
      log(false, `Ritual fatigue (high): totalLevels=${totalFatigueLevels}, res=`, res);
    } else {
      // All fatigue is partial, apply cancellation
      res.partial = Math.max(totalFatigueLevels - partialFatigueCancellation, 0);
      log(false, `Ritual fatigue (low): totalLevels=${totalFatigueLevels}, res=`, res);
    }
  }
}

/**
 *
 * @param res
 * @param delta
 * @param actor
 */
function calculateSpellFatigueCost(res, delta, actor) {
  const fatigueThreshold = actor.system.bonuses.arts.spellFatigueThreshold;

  // Spell fails by more than 10: full fatigue level
  if (delta < -10) {
    res.fail = 1;
  }
  // Spell fails (considering fatigue threshold bonus): partial fatigue
  else if (delta + fatigueThreshold < 0) {
    res.partial = 1;
  }
}

/**
 *
 * @param actorCaster
 * @param roll
 * @param message
 */
async function castSpell(actorCaster, roll, message) {
  // message.system.magic = { caster: actor.uuid, targets: [] };
  // message.system.magic.targets =

  // First check that the spell succeeds
  const levelOfSpell = actorCaster.rollInfo.magic.level;
  const totalOfSpell = Math.round(roll._total);
  const messageUpdate = {};
  messageUpdate["system.roll.difficulty"] = levelOfSpell;
  // messageUpdate["type"] = "magic";
  const updateData = {};
  if (roll.botches > 0) {
    if (roll.botches >= actorCaster.system.bonuses.arts.warpingThreshold) {
      // twilight pending
      updateData["system.twilight.pointsGained"] = roll.botches;
      updateData["system.twilight.stage"] = TWILIGHT_STAGES.PENDING_STRENGTH;
      updateData["system.twilight.year"] = actorCaster.rollInfo.environment.year;
      updateData["system.twilight.season"] = actorCaster.rollInfo.environment.season;
    }
    updateData["system.warping.points"] = actorCaster.system.warping.points + roll.botches;
    // await actorCaster.update(updateData);
  }
  if (actorCaster.rollInfo.type == "spell") {
    const res = fatigueCost(
      actorCaster,
      totalOfSpell,
      levelOfSpell,
      actorCaster.rollInfo.magic.ritual
    );
    actorCaster.rollInfo.impact.fatigue = res;
  }
  const updateImpact = await _applyImpact(actorCaster, roll, message);
  foundry.utils.mergeObject(updateData, updateImpact);

  // const form = CONFIG.ARM5E.magic.arts[actorCaster.rollInfo.magic.form.value]?.label ?? "NONE";
  await actorCaster.update(updateData);
  await handleTargetsOfMagic(actorCaster, actorCaster.rollInfo.magic.form.value, message);
  message.updateSource(messageUpdate);
  // Then do contest of magic
}

/**
 *
 * @param actorCaster
 * @param roll
 * @param message
 */
async function castSupernaturalEffect(actorCaster, roll, message) {
  // First check that the spell succeeds
  const levelOfSpell = actorCaster.rollInfo.magic.level;
  const totalOfSpell = Math.round(roll._total);
  const messageUpdate = {};
  const updateData = {};
  messageUpdate["system.roll.difficulty"] = levelOfSpell;
  messageUpdate.type = "magic";
  if (roll.botches > 0) {
    const updateData = {};
    if (roll.botches >= actorCaster.system.bonuses.arts.warpingThreshold) {
      // twilight pending
      updateData["system.twilight.pointsGained"] = roll.botches;
      updateData["system.twilight.stage"] = 1;
      updateData["system.twilight.year"] = actorCaster.rollInfo.environment.year;
      updateData["system.twilight.season"] = actorCaster.rollInfo.environment.season;
    }
    updateData["system.warping.points"] = actorCaster.system.warping.points + roll.botches;
  }
  if (actorCaster.rollInfo.mode & ROLL_MODES.NO_ROLL) {
    messageUpdate["system.impact.applied"] = true;
  }
  const updateImpact = await _applyImpact(actorCaster, roll, message);
  foundry.utils.mergeObject(updateData, updateImpact);
  await actorCaster.update(updateData);

  message.updateSource(messageUpdate);
  // Then do contest of magic
  // const form = CONFIG.ARM5E.magic.arts[actorCaster.rollInfo.magic.form.value]?.label ?? "NONE";
  await handleTargetsOfMagic(actorCaster, actorCaster.rollInfo.magic.form.value, message);
}

/**
 *
 * @param actorCaster
 * @param roll
 * @param form
 * @param message
 */
async function handleTargetsOfMagic(actorCaster, form, message) {
  const targetedTokens = game.user.targets; // getActorsFromTargetedTokens(actorCaster);
  if (!targetedTokens) {
    return false;
  }

  const targets = [];
  for (let tokenTarget of targetedTokens) {
    const target = {
      uuid: tokenTarget.actor.uuid,
      name: tokenTarget.name, // use the token name instead of the actor's if possible
      magicResistance: tokenTarget.actor.magicResistanceDetails(form, message.system.magic.realm),
      hasPlayerOwner: tokenTarget.actor.hasPlayerOwner
    };
    targets.push(target);
  }

  message.updateSource({
    "system.magic.targets": targets
    // "system.magic.caster.penetration.total": penetration
  });
}

/**
 *
 * @param attributes
 * @param options
 */
function magicalAttributesHelper(attributes, options) {
  // For (const range of Object.entries(ranges))
  return foundry.applications.handlebars.selectOptions(attributes, options);
}

/**
 *
 * @param dataset
 * @param item
 */
async function useMagicItem(dataset, item) {
  if (item.system.enchantments.charges == 0) {
    ui.notifications.warn(game.i18n.localize("arm5e.notification.noChargesLeft"));
    return;
  }
  item.actor.rollInfo.init(dataset, item.actor);
  new UseMagicItemWindow(item.actor, { window: { title: dataset.name } }).render(true);
}

/**
 *
 * @param dataset
 * @param actor
 */
async function usePower(dataset, actor) {
  if (Number(dataset.cost) > actor.system.might.points) {
    ui.notifications.warn(game.i18n.localize("arm5e.notification.noMightPoints"));
    return;
  }
  actor.rollInfo.init(dataset, actor);
  const rollProperties = actor.rollInfo.properties;
  // log(false, `Roll variables: ${JSON.stringify(actor.system.roll)}`);
  // let template = "systems/arm5e/templates/roll/powerUse.html";
  actor.system.roll = actor.rollInfo;
  actor.config = { magic: CONFIG.ARM5E.magic };
  const options = { window: { title: dataset.name } };
  new UsePowerRollWindow(actor, options).render(true);
}

export {
  handleTargetsOfMagic,
  noFatigue,
  fatigueCost,
  magicalAttributesHelper,
  castSpell,
  castSupernaturalEffect,
  useMagicItem,
  usePower
};
