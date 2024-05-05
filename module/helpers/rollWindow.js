import { ARM5E } from "../config.js";

import { simpleDie, stressDie, noRoll, changeMight, useItemCharge } from "../dice.js";
import { PickRequisites, checkTargetAndCalculateResistance, noFatigue } from "./magic.js";
import { chatFailedCasting } from "./chat.js";
import { ArM5ePCActor } from "../actor/actor.js";
import { setAgingEffects, agingCrisis } from "./long-term-activities.js";
import { exertSelf } from "./combat.js";
import { getDataset, log } from "../tools.js";

// below is a bitmap
const ROLL_MODES = {
  STRESS: 1,
  SIMPLE: 2,
  NO_BOTCH: 4,
  NO_CONF: 8, // no confidence use
  UNCONSCIOUS: 16, // can roll unconscious
  PRIVATE: 32, // roll is private between the GM and player
  // common combos
  STRESS_OR_SIMPLE: 3
};

const ROLL_MODIFIERS = {
  PHYSICAL: 1,
  ENCUMBRANCE: 2,
  AURA: 4
};

const DEFAULT_ROLL_PROPERTIES = {
  OPTION: {
    VAL: "option",
    MODE: ROLL_MODES.STRESS_OR_SIMPLE,
    MODIFIERS: 1,
    TITLE: "arm5e.dialog.title.rolldie"
  },
  ABILITY: {
    VAL: "ability",
    MODE: ROLL_MODES.STRESS_OR_SIMPLE,
    MODIFIERS: 5, // impacted by aura, if realm of the ability <> mundane
    TITLE: "arm5e.dialog.title.rolldie"
  },
  // COMBAT: {
  //   MODE: ROLL_MODES.STRESS,
  //   TITLE: "arm5e.dialog.title.rolldie",
  //   MODIFIERS: 1,
  //   // ALTER_ROLL: doubleAbility,
  //   ALT_ACTION: exertSelf,
  //   ALT_ACTION_LABEL: "arm5e.dialog.button.exertSelf"
  // },
  ATTACK: {
    VAL: "attack",
    MODE: ROLL_MODES.STRESS,
    TITLE: "arm5e.dialog.title.rolldie",
    MODIFIERS: 1,
    // ALTER_ROLL: doubleAbility,
    ALT_ACTION: exertSelf,
    ALT_ACTION_LABEL: "arm5e.dialog.button.exertSelf"
  },
  DEFENSE: {
    VAL: "defense",
    MODE: ROLL_MODES.STRESS,
    TITLE: "arm5e.dialog.title.rolldie",
    MODIFIERS: 1,
    // ALTER_ROLL: doubleAbility,
    ALT_ACTION: exertSelf,
    ALT_ACTION_LABEL: "arm5e.dialog.button.exertSelf"
  },
  INIT: {
    VAL: "init",
    MODE: ROLL_MODES.STRESS,
    MODIFIERS: 3,
    TITLE: "arm5e.dialog.title.rolldie"
  },
  MAGIC: {
    VAL: "magic",
    MODE: ROLL_MODES.STRESS,
    MODIFIERS: 7,
    TITLE: "arm5e.dialog.title.rolldie",
    CALLBACK: castSpell,
    ALTER_ROLL: noFatigue,
    ALT_ACTION: noRoll,
    ALT_ACTION_LABEL: "arm5e.dialog.button.noroll"
  },
  SPONT: {
    VAL: "spont",
    MODE: ROLL_MODES.STRESS,
    MODIFIERS: 7,
    TITLE: "arm5e.dialog.title.rolldie",
    CALLBACK: castSpell,
    ALTER_ROLL: noFatigue,
    ALT_ACTION: noRoll,
    ALT_ACTION_LABEL: "arm5e.dialog.button.noroll"
  },
  CHAR: {
    VAL: "char",
    MODE: 19, // STRESS + SIMPLE + UNCONSCIOUS
    MODIFIERS: 1,
    TITLE: "arm5e.dialog.title.rolldie"
  },
  SPELL: {
    VAL: "spell",
    MODE: ROLL_MODES.STRESS_OR_SIMPLE,
    MODIFIERS: 7,
    TITLE: "arm5e.dialog.title.rolldie",
    CALLBACK: castSpell
  },
  AGING: {
    VAL: "aging",
    MODE: 61, // STRESS + NO_BOTCH + NO_CONF + UNCONSCIOUS + PRIVATE
    MODIFIERS: 0,
    TITLE: "arm5e.aging.roll.label",
    CALLBACK: setAgingEffects
  },
  CRISIS: {
    VAL: "crisis",
    MODE: 58, // SIMPLE + NO_CONF + UNCONSCIOUS + PRIVATE
    MODIFIERS: 0,
    TITLE: "arm5e.aging.crisis.label",
    CALLBACK: agingCrisis
  }
};

// experimental, allow simple die for everything
const ALTERNATE_ROLL_PROPERTIES = {
  OPTION: {
    MODE: ROLL_MODES.SIMPLE,
    TITLE: "arm5e.dialog.title.rolldie"
  },
  COMBAT: {
    MODE: ROLL_MODES.SIMPLE,
    TITLE: "arm5e.dialog.title.rolldie",
    ALT_ACTION: exertSelf,
    ALT_ACTION_LABEL: "arm5e.dialog.button.exertSelf"
  },
  INIT: {
    MODE: ROLL_MODES.SIMPLE,
    TITLE: "arm5e.dialog.title.rolldie"
  },
  MAGIC: {
    MODE: ROLL_MODES.SIMPLE,
    TITLE: "arm5e.dialog.title.rolldie",
    CALLBACK: castSpell,
    ALT_ACTION: noRoll,
    ALT_ACTION_LABEL: "arm5e.dialog.button.noroll"
  },
  SPONT: {
    MODE: ROLL_MODES.SIMPLE,
    TITLE: "arm5e.dialog.title.rolldie",
    CALLBACK: castSpell
  },
  CHAR: {
    MODE: 18, // STRESS + SIMPLE + UNCONSCIOUS
    TITLE: "arm5e.dialog.title.rolldie"
  },
  SPELL: {
    MODE: ROLL_MODES.SIMPLE,
    TITLE: "arm5e.dialog.title.rolldie",
    CALLBACK: castSpell
  },
  AGING: {
    MODE: 61, // STRESS + NO_BOTCH + NO_CONF + UNCONSCIOUS + PRIVATE
    TITLE: "arm5e.aging.roll.label",
    CALLBACK: setAgingEffects
  },
  CRISIS: {
    MODE: 58, // SIMPLE + NO_CONF + UNCONSCIOUS + PRIVATE
    TITLE: "arm5e.aging.crisis.label",
    CALLBACK: agingCrisis
  }
};

const ROLL_PROPERTIES = DEFAULT_ROLL_PROPERTIES;
//const ROLL_PROPERTIES = ALTERNATE_ROLL_PROPERTIES;

function getRollTypeProperties(type) {
  return ROLL_PROPERTIES[type.toUpperCase()] ?? ROLL_PROPERTIES.OPTION;
}

function prepareRollVariables(dataset, actor) {
  actor.rollData.init(dataset, actor);
  // log(false, `Roll data: ${JSON.stringify(actor.rollData)}`);
}

function chooseTemplate(dataset) {
  if (
    [
      ROLL_PROPERTIES.ATTACK.VAL,
      ROLL_PROPERTIES.DEFENSE.VAL,
      ROLL_PROPERTIES.INIT.VAL,
      ROLL_PROPERTIES.OPTION.VAL
    ].includes(dataset.roll)
  ) {
    return "systems/arm5e/templates/roll/roll-options.html";
  }
  if ([ROLL_PROPERTIES.CHAR.VAL, ROLL_PROPERTIES.ABILITY.VAL].includes(dataset.roll)) {
    return "systems/arm5e/templates/roll/roll-characteristic.html";
  }
  if (dataset.roll == ROLL_PROPERTIES.SPONT.VAL) {
    //spontaneous magic
    return "systems/arm5e/templates/roll/roll-magic.html";
  }
  if ([ROLL_PROPERTIES.MAGIC.VAL, ROLL_PROPERTIES.SPELL.VAL].includes(dataset.roll)) {
    return "systems/arm5e/templates/roll/roll-spell.html";
  }
  if (dataset.roll == ROLL_PROPERTIES.AGING.VAL) {
    //aging roll
    return "systems/arm5e/templates/roll/roll-aging.html";
  }
  if (dataset.roll == ROLL_PROPERTIES.CRISIS.VAL) {
    //aging crisis roll
    return "systems/arm5e/templates/roll/roll-aging-crisis.html";
  }
  return "";
}

function updateCharacteristicDependingOnRoll(dataset, actor) {
  if (
    [ROLL_PROPERTIES.SPONT.VAL, ROLL_PROPERTIES.MAGIC.VAL, ROLL_PROPERTIES.SPELL.VAL].includes(
      dataset.roll
    )
  ) {
    actor.rollData.characteristic = "sta";
  }
}

function getDebugButtonsIfNeeded(actor, callback) {
  if (!game.modules.get("_dev-mode")?.api?.getPackageDebugValue(ARM5E.SYSTEM_ID)) return {};
  return {
    explode: {
      label: "DEV Roll 1",
      callback: async (html) => {
        actor = getFormData(html, actor);
        await stressDie(actor, actor.rollData.type, 1, callback);
      }
    },
    zero: {
      label: "DEV Roll 0",
      callback: async (html) => {
        actor = getFormData(html, actor);
        await stressDie(actor, actor.rollData.type, 2, callback);
      }
    }
  };
}

function getDialogData(dataset, html, actor) {
  const callback = getRollTypeProperties(dataset.roll).CALLBACK;

  let btns = {};
  let mode = 0;
  const altAction = getRollTypeProperties(dataset.roll).ALT_ACTION;
  let altBtn;
  if (altAction) {
    const btnLabel = getRollTypeProperties(dataset.roll).ALT_ACTION_LABEL;
    const rollAlteration = getRollTypeProperties(dataset.roll).ALTER_ROLL;
    altBtn = {
      icon: "<i class='fas fa-check'></i>",
      label: game.i18n.localize(btnLabel),
      callback: async (html) => {
        actor = getFormData(html, actor);
        if (rollAlteration) {
          rollAlteration(actor);
        }
        await altAction(actor, mode, callback);
      }
    };
  }

  const title = getRollTypeProperties(dataset.roll).TITLE;
  if (getRollTypeProperties(dataset.roll).MODE & ROLL_MODES.STRESS) {
    if (getRollTypeProperties(dataset.roll).MODE & ROLL_MODES.NO_BOTCH) {
      mode = 4; // no botches
    }
    btns.yes = {
      icon: "<i class='fas fa-check'></i>",
      label: game.i18n.localize("arm5e.dialog.button.stressdie"),
      callback: async (html) => {
        actor = getFormData(html, actor);
        await stressDie(actor, dataset.roll, mode, callback);
      }
    };
    if (altAction) {
      btns.alt = altBtn;
    }
    if (getRollTypeProperties(dataset.roll).MODE & ROLL_MODES.SIMPLE) {
      btns.no = {
        icon: "<i class='fas fa-check'></i>",
        label: game.i18n.localize("arm5e.dialog.button.simpledie"),
        callback: async (html) => {
          actor = getFormData(html, actor);
          await simpleDie(actor, dataset.roll, callback);
        }
      };
    } else {
      btns.no = {
        icon: "<i class='fas fa-ban'></i>",
        label: game.i18n.localize("arm5e.dialog.button.cancel"),
        callback: async (html) => {
          await actor.rollData.reset();
        }
      };
    }
  } else {
    // Simple die only
    btns.yes = {
      icon: "<i class='fas fa-check'></i>",
      label: game.i18n.localize("arm5e.dialog.button.simpledie"),
      callback: async (html) => {
        actor = getFormData(html, actor);
        await simpleDie(actor, dataset.roll, callback);
      }
    };
    if (altAction) {
      btns.alt = altBtn;
    }
    btns.no = {
      icon: "<i class='fas fa-ban'></i>",
      label: game.i18n.localize("arm5e.dialog.button.cancel"),
      callback: async (html) => {
        await actor.rollData.reset();
      }
    };
  }
  return {
    title: game.i18n.localize(title),
    content: html,
    render: addListenersDialog,
    buttons: {
      ...btns,
      ...getDebugButtonsIfNeeded(actor, callback)
    }
  };
}

async function useMagicItem(dataset, item) {
  if (item.system.enchantments.charges == 0) {
    ui.notifications.warn(game.i18n.localize("arm5e.notification.noChargesLeft"));
    return;
  }

  prepareRollVariables(dataset, item.actor);
  log(false, `Roll variables: ${JSON.stringify(item.actor.system.roll)}`);
  let template = "systems/arm5e/templates/actor/parts/actor-itemUse.html";
  item.actor.system.roll = item.actor.rollData;
  item.actor.config = CONFIG.ARM5E;
  const renderedTemplate = await renderTemplate(template, item.actor);

  const dialog = new Dialog(
    {
      title: game.i18n.localize("arm5e.dialog.magicItemUse"),
      content: renderedTemplate,
      render: addListenersDialog,
      buttons: {
        yes: {
          icon: "<i class='fas fa-check'></i>",
          label: game.i18n.localize("arm5e.dialog.magicItemUse"),
          callback: async (html) => {
            getFormData(html, item.actor);
            await noRoll(item.actor, 1, useItemCharge);
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
      jQuery: true,
      height: "600px",
      width: "400px",
      classes: ["roll-dialog", "arm5e-dialog", "dialog"]
    }
  );
  dialog.render(true);
}

async function usePower(dataset, actor) {
  if (Number(dataset.cost > actor.system.might.points)) {
    ui.notifications.warn(game.i18n.localize("arm5e.notification.noMightPoints"));
    return;
  }

  prepareRollVariables(dataset, actor);
  log(false, `Roll variables: ${JSON.stringify(actor.system.roll)}`);
  let template = "systems/arm5e/templates/actor/parts/actor-powerUse.html";
  actor.system.roll = actor.rollData;
  const renderedTemplate = await renderTemplate(template, actor);

  const dialog = new Dialog(
    {
      title: dataset.name,
      content: renderedTemplate,
      render: addListenersDialog,
      buttons: {
        yes: {
          icon: "<i class='fas fa-check'></i>",
          label: game.i18n.localize("arm5e.dialog.powerUse"),
          callback: async (html) => {
            actor = getFormData(html, actor);
            await noRoll(actor, 1, changeMight);
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
      jQuery: true,
      height: "600px",
      width: "400px",
      classes: ["roll-dialog", "arm5e-dialog", "dialog"]
    }
  );
  dialog.render(true);
}
function addListenersDialog(html) {
  html.find(".clickable").click((ev) => {
    $(ev.currentTarget).next().toggleClass("hide");
  });

  html.find(".resource-focus").focus((ev) => {
    ev.preventDefault();
    ev.currentTarget.select();
  });

  html.find(".advanced-req-roll").click(async (e) => {
    const dataset = getDataset(e);
    const actor = game.actors.get(dataset.actorid);
    const item = actor.items.get(dataset.itemid);
    // create a tmp Item in memory
    let newSpell = await Item.create(item.toObject(), { temporary: true });
    let update = await PickRequisites(newSpell.system, dataset.flavor);
    await newSpell.updateSource(update);
    let techData = newSpell._getTechniqueData(actor.system);
    actor.rollData.magic.techniqueLabel = techData[0];
    actor.rollData.magic.techniqueScore = techData[1];
    actor.rollData.magic.techDeficiency = techData[2];
    let formData = newSpell._getFormData(actor.system);
    actor.rollData.magic.formLabel = formData[0];
    actor.rollData.magic.formScore = formData[1];
    actor.rollData.magic.formDeficiency = formData[2];
  });

  html.find(".voice-and-gestures").change(async (event) => {
    const dataset = getDataset(event);
    const actor = game.actors.get(dataset.actorid);
    const name = $(event.target).attr("effect");
    await actor.selectVoiceAndGestures(name, $(event.target).val());
  });
}

async function renderRollTemplate(dataset, template, actor) {
  if (!template) {
    return;
  }
  actor.system.roll = actor.rollData;
  actor.config = CONFIG.ARM5E;
  const renderedTemplate = await renderTemplate(template, actor);
  const dialogData = getDialogData(dataset, renderedTemplate, actor);
  const dialog = new Dialog(
    {
      ...dialogData,
      render: addListenersDialog
    },
    {
      classes: ["arm5e-dialog", "dialog"],
      height: "780px",
      width: "400px"
    }
  );
  dialog.render(true);
  return dialog;
}

async function castSpell(actorCaster, roll, message) {
  // first check that the spell succeeds
  const levelOfSpell = actorCaster.rollData.magic.level;
  const totalOfSpell = Math.round(roll._total);

  if (roll.botches > 0) {
    await actorCaster.update({
      "system.warping.points": actorCaster.system.warping.points + roll.botches
    });
  }
  if (actorCaster.rollData.type == "spell") {
    if (totalOfSpell < levelOfSpell || actorCaster.rollData.magic.ritual) {
      let fatigue = 1;
      if (actorCaster.rollData.magic.ritual) {
        fatigue = Math.max(Math.ceil((levelOfSpell - totalOfSpell) / 5), 1);
      }
      // lose fatigue levels
      await actorCaster.loseFatigueLevel(fatigue);
      if (totalOfSpell < levelOfSpell - 10) {
        await chatFailedCasting(actorCaster, roll, message, fatigue);
        return false;
      }
    }
    // Uncomment when A-A integration is ready
    // let data = {
    //   itemId: actorCaster.rollData.itemId,
    //   targets: game.user.targets,
    //   actorId: actorCaster._id
    // };

    // Hooks.callAll("arm5e:spellcasting", data, {user : game.user.id});
  } else {
    log(false, `Casting total: ${totalOfSpell}`);
    // Magic effect
    if (totalOfSpell < levelOfSpell) {
      await chatFailedCasting(actorCaster, roll, message, 0);
      return false;
    }
  }
  // then do contest of magic
  await checkTargetAndCalculateResistance(actorCaster, roll, message);
}

export function getFormData(html, actor) {
  let find = html.find(".SelectedCharacteristic");
  if (find.length > 0) {
    actor.rollData.characteristic = find[0].value;
  }
  find = html.find(".SelectedAbility");
  if (find.length > 0) {
    if (find[0].value == "None") {
      const dataset = {
        name: actor.rollData.name,
        roll: "char",
        characteristic: actor.rollData.characteristic,
        modifier: actor.rollData.modifier
      };
      actor.rollData.init(dataset, actor);
      // actor.rollData.ability.score = 0;
      // actor.rollData.ability.name = "";
      // actor.rollData.type = "char";
    } else {
      const dataset = {
        name: actor.rollData.name,
        roll: "ability",
        ability: find[0].value,
        defaultcharacteristic: actor.rollData.characteristic,
        modifier: actor.rollData.modifier
      };
      actor.rollData.init(dataset, actor);

      // const ability = actor.items.get(find[0].value);
      // actor.rollData.ability.score = ability.system.finalScore;
      // actor.rollData.ability.name = ability.name;
      // actor.rollData.type = "ability";
    }
  }

  find = html.find(".abilitySpeciality");
  if (find.length > 0) {
    actor.rollData.ability.specApply = find[0].checked;
  }

  find = html.find(".SelectedTechnique");
  if (find.length > 0) {
    actor.rollData.magic.technique = find[0].value;
    actor.rollData.magic.techniqueLabel = ARM5E.magic.techniques[find[0].value].label;
    actor.rollData.magic.techniqueScore = parseInt(
      actor.system.arts.techniques[find[0].value].finalScore
    );

    if (actor.system.arts.techniques[find[0].value].deficient) {
      actor.rollData.magic.techDeficiency = true;
    } else {
      actor.rollData.magic.techDeficiency = false;
    }
  }

  find = html.find(".SelectedForm");
  if (find.length > 0) {
    actor.rollData.magic.form = find[0].value;
    actor.rollData.magic.formLabel = ARM5E.magic.forms[find[0].value].label;
    actor.rollData.magic.formScore = parseInt(actor.system.arts.forms[find[0].value].finalScore);
    if (actor.system.arts.forms[find[0].value].deficient) {
      actor.rollData.magic.formDeficiency = true;
    } else {
      actor.rollData.magic.formDeficiency = false;
    }
  }

  find = html.find(".SelectedAura");
  if (find.length > 0) {
    actor.rollData.environment.aura.modifier = Number(find[0].value) ?? 0;
  }

  find = html.find(".SelectedLevel");
  if (find.length > 0) {
    actor.rollData.magic.level = Number(find[0].value) ?? 0;
  }

  find = html.find(".SelectedModifier");
  if (find.length > 0) {
    actor.rollData.modifier = Number(find[0].value) ?? 0;
    // negative modifier
    if ([ROLL_PROPERTIES.CRISIS.VAL].includes(actor.rollData.type)) {
      actor.rollData.modifier = -actor.rollData.modifier;
    }
  }

  find = html.find(".SelectedAdvantage");
  if (find.length > 0) {
    actor.rollData.combat.advantage = Number(find[0].value) ?? 0;
  }

  find = html.find(".SelectedFocus");
  if (find.length > 0) {
    actor.rollData.magic.focus = find[0].checked;
  }

  find = html.find(".SelectedYear");
  if (find.length > 0) {
    actor.rollData.environment.year = Number(find[0].value) ?? 1220;
  }

  if (
    [ROLL_PROPERTIES.SPONT.VAL, ROLL_PROPERTIES.MAGIC.VAL, ROLL_PROPERTIES.SPELL.VAL].includes(
      actor.rollData.type
    ) ||
    actor.rollData.type == "power"
  ) {
    find = html.find(".penSpeciality");
    if (find.length > 0) {
      actor.rollData.penetration.specApply = find[0].checked;
    }
    find = html.find(".spellMastery");
    if (find.length > 0) {
      actor.rollData.penetration.penetrationMastery = find[0].checked;
    }
    find = html.find(".multiplierBonusArcanic");
    if (find.length > 0) {
      actor.rollData.penetration.multiplierBonusArcanic = Number(find[0].value) ?? 0;
    }

    find = html.find(".multiplierBonusSympathic");
    if (find.length > 0) {
      actor.rollData.penetration.multiplierBonusSympathic = Number(find[0].value) ?? 0;
    }
  }
  let idx = 0;
  for (let optEffect of actor.rollData.optionalBonuses) {
    find = html.find(`.SelectedOptional${idx}`);
    if (find.length > 0) {
      actor.rollData.optionalBonuses[idx].active = find[0].checked;
    }
    idx++;
  }

  return actor;
}

export {
  chooseTemplate,
  updateCharacteristicDependingOnRoll,
  renderRollTemplate,
  prepareRollVariables,
  ROLL_MODES,
  ROLL_MODIFIERS,
  ROLL_PROPERTIES,
  getRollTypeProperties,
  usePower,
  useMagicItem
};
