import { ARM5E } from "../config.js";
/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @returns {Promise}
 */
export const ArM5ePreloadHandlebarsTemplates = async function () {
  return foundry.applications.handlebars.loadTemplates([
    // Actor Sheet Partials
    `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/actor-characteristics.html`,
    `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/actor-fatigue.html`,
    `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/actor-abilities.html`,
    `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/actor-arts.html`,
    `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/actor-inventory.html`,
    `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/actor-combat.html`,
    `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/actor-virtuesFlaws.html`,
    `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/actor-familiar.html`,
    `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/actor-laboratoryTotals.html`,
    `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/actor-castingTotals.html`,
    `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/actor-voice-and-gestures.hbs`,
    `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/actor-diary.html`,
    // `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/actor-powers.html`,

    `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/actor-profiles.html`,
    `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/actor-magic-attributes.html`,

    `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/codex-base-effects.hbs`,
    `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/codex-magical-effects.hbs`,
    `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/codex-enchantments.hbs`,
    `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/codex-spells.hbs`,
    `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/codex-aspects.hbs`,
    `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/actor-weapons.html`,
    `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/actor-armor.html`,
    `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/actor-items.html`,

    `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/actor-vis.html`,

    `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/actor-attributesLaboratory.html`,
    `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/actor-lab-workbench.html`,

    `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/actor-library.html`,
    `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/actor-covenantCalendar.html`,
    `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/hermeticFilter.hbs`,
    `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/topicFilter.hbs`,
    `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/timeFilter.hbs`,

    `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/actor-magicSystem.html`,
    `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/actor-magicSystem-cfg.html`,
    `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/actor-magicSystem-template.html`,

    `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/template-item-char.hbs`,

    `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/template-item-ability.hbs`,
    `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/template-item-tech.hbs`,
    `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/template-item-form.hbs`,
    `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/template-item-mod.hbs`,
    `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/template-item-mult.hbs`,

    // Item Sheet Partials
    `systems/${ARM5E.SYSTEM_ID}/templates/item/parts/spell-design-alt.html`,
    `systems/${ARM5E.SYSTEM_ID}/templates/item/parts/enchantment-attributes.html`,
    `systems/${ARM5E.SYSTEM_ID}/templates/item/parts/item-enchant-extension-v2.hbs`,
    `systems/${ARM5E.SYSTEM_ID}/templates/item/parts/cost.hbs`,
    `systems/${ARM5E.SYSTEM_ID}/templates/item/parts/item-header.html`,
    `systems/${ARM5E.SYSTEM_ID}/templates/item/parts/item-footer.html`,
    `systems/${ARM5E.SYSTEM_ID}/templates/item/parts/item-thin-header.html`,
    `systems/${ARM5E.SYSTEM_ID}/templates/item/parts/item-thin-footer.html`,

    // Lab activity
    `systems/${ARM5E.SYSTEM_ID}/templates/lab-activities/noparams.html`,
    `systems/${ARM5E.SYSTEM_ID}/templates/lab-activities/spell.html`,
    `systems/${ARM5E.SYSTEM_ID}/templates/lab-activities/minor-enchantment.html`,
    `systems/${ARM5E.SYSTEM_ID}/templates/lab-activities/charged-item.html`,
    `systems/${ARM5E.SYSTEM_ID}/templates/lab-activities/vis-costs.html`,
    `systems/${ARM5E.SYSTEM_ID}/templates/lab-activities/investigation.html`,
    `systems/${ARM5E.SYSTEM_ID}/templates/lab-activities/longevity-ritual.html`,
    // Rolls partials
    `systems/${ARM5E.SYSTEM_ID}/templates/roll/parts/roll-header.hbs`,
    `systems/${ARM5E.SYSTEM_ID}/templates/roll/parts/roll-footer.hbs`,
    // `systems/${ARM5E.SYSTEM_ID}/templates/roll/parts/penetration-options.hbs`,
    // `systems/${ARM5E.SYSTEM_ID}/templates/roll/parts/combat-init.hbs`,
    // `systems/${ARM5E.SYSTEM_ID}/templates/roll/parts/combat-attack.hbs`,
    // `systems/${ARM5E.SYSTEM_ID}/templates/roll/parts/combat-defense.hbs`,
    // generic partials
    `systems/${ARM5E.SYSTEM_ID}/templates/generic/active-effects-tab.hbs`,
    // `systems/${ARM5E.SYSTEM_ID}/templates/generic/calendar-grid.hbs`,
    // `systems/${ARM5E.SYSTEM_ID}/templates/generic/group-schedule-grid.hbs`,
    // `systems/${ARM5E.SYSTEM_ID}/templates/generic/schedule-grid.hbs`,
    `systems/${ARM5E.SYSTEM_ID}/templates/generic/itemPickerDialog.html`,
    `systems/${ARM5E.SYSTEM_ID}/templates/generic/selectDialog.html`,
    `systems/${ARM5E.SYSTEM_ID}/templates/generic/textInput.html`,
    `systems/${ARM5E.SYSTEM_ID}/templates/generic/numberInput.html`,
    `systems/${ARM5E.SYSTEM_ID}/templates/generic/auraInput.html`,
    `systems/${ARM5E.SYSTEM_ID}/templates/generic/agingPointsEdit.html`,
    `systems/${ARM5E.SYSTEM_ID}/templates/generic/source.html`,
    `systems/${ARM5E.SYSTEM_ID}/templates/generic/aging-dialog.html`,
    `systems/${ARM5E.SYSTEM_ID}/templates/generic/metalic-bar.html`,
    `systems/${ARM5E.SYSTEM_ID}/templates/generic/parts/simpleFieldBacksection.hbs`,
    `systems/${ARM5E.SYSTEM_ID}/templates/generic/ars-editor.hbs`,
    `systems/${ARM5E.SYSTEM_ID}/templates/generic/ars-editor-V2.hbs`,
    `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/actor-description-v2.hbs`,
    `systems/${ARM5E.SYSTEM_ID}/templates/actor/parts/actor-laboratory-v2.html`,
    `systems/${ARM5E.SYSTEM_ID}/templates/generic/quick-combat.html`,
    `systems/${ARM5E.SYSTEM_ID}/templates/generic/quick-magic.html`,
    `systems/${ARM5E.SYSTEM_ID}/templates/generic/quick-vitals.html`,
    `systems/${ARM5E.SYSTEM_ID}/templates/generic/vis-study.html`,
    `systems/${ARM5E.SYSTEM_ID}/templates/generic/confirmation.html`,
    `systems/${ARM5E.SYSTEM_ID}/templates/generic/parts/scriptorium-reading.html`,
    `systems/${ARM5E.SYSTEM_ID}/templates/generic/parts/scriptorium-writing.html`,
    `systems/${ARM5E.SYSTEM_ID}/templates/generic/parts/scriptorium-copying.html`,
    // `systems/${ARM5E.SYSTEM_ID}/templates/generic/parts/scriptorium-header.hbs`,
    // `systems/${ARM5E.SYSTEM_ID}/templates/generic/parts/scriptorium-footer.hbs`,
    `systems/${ARM5E.SYSTEM_ID}/templates/generic/parts/list-item.hbs`,
    `systems/${ARM5E.SYSTEM_ID}/templates/generic/parts/largeDialog-header.hbs`,
    `systems/${ARM5E.SYSTEM_ID}/templates/generic/parts/largeDialog-footer.hbs`,
    `systems/${ARM5E.SYSTEM_ID}/templates/generic/parts/document-picker-header.hbs`,
    `systems/${ARM5E.SYSTEM_ID}/templates/generic/parts/document-picker-footer.hbs`,
    `systems/${ARM5E.SYSTEM_ID}/templates/generic/document-picker-body.hbs`
    // Apps partials
    // `systems/${ARM5E.SYSTEM_ID}/templates/generic/astrolab.hbs`
  ]);
};
