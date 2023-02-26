/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const ArM5ePreloadHandlebarsTemplates = async function() {
  return loadTemplates([
    // Actor Sheet Partials
    "systems/arm5e/templates/actor/parts/actor-characteristics.html",
    "systems/arm5e/templates/actor/parts/actor-fatigue.html",
    "systems/arm5e/templates/actor/parts/actor-description.html",
    "systems/arm5e/templates/actor/parts/actor-abilities.html",
    "systems/arm5e/templates/actor/parts/actor-arts.html",
    "systems/arm5e/templates/actor/parts/actor-inventory.html",
    "systems/arm5e/templates/actor/parts/actor-combat.html",
    "systems/arm5e/templates/actor/parts/actor-virtuesFlaws.html",
    "systems/arm5e/templates/actor/parts/actor-familiar.html",
    "systems/arm5e/templates/actor/parts/actor-laboratory.html",
    "systems/arm5e/templates/actor/parts/actor-laboratoryTotals.html",
    "systems/arm5e/templates/actor/parts/actor-castingTotals.html",
    "systems/arm5e/templates/actor/parts/actor-voice-and-gestures.html",
    "systems/arm5e/templates/actor/parts/actor-diary.html",

    "systems/arm5e/templates/actor/parts/actor-setAbilities.html",
    "systems/arm5e/templates/actor/parts/actor-magic-attributes.html",

    "systems/arm5e/templates/actor/parts/actor-base-effects.html",
    "systems/arm5e/templates/actor/parts/actor-magical-effects.html",
    "systems/arm5e/templates/actor/parts/actor-enchantments.html",
    "systems/arm5e/templates/actor/parts/actor-spells.html",
    "systems/arm5e/templates/actor/parts/actor-weapons.html",
    "systems/arm5e/templates/actor/parts/actor-armor.html",

    "systems/arm5e/templates/actor/parts/actor-atributesLaboratory.html",
    "systems/arm5e/templates/actor/parts/actor-inventoryLaboratory.html",

    "systems/arm5e/templates/actor/parts/actor-covenantAtributes.html",
    "systems/arm5e/templates/actor/parts/actor-covenantHabitants.html",
    "systems/arm5e/templates/actor/parts/actor-covenantPosessions.html",
    "systems/arm5e/templates/actor/parts/actor-covenantEconomics.html",
    "systems/arm5e/templates/actor/parts/actor-library.html",
    "systems/arm5e/templates/actor/parts/actor-covenantCalendar.html",
    "systems/arm5e/templates/actor/parts/hermeticFilter.html",

    "systems/arm5e/templates/actor/parts/crucible-magic-item.html",
    "systems/arm5e/templates/actor/parts/crucible-enchantment.html",
    // Item Sheet Partials
    "systems/arm5e/templates/item/parts/spell-design.html",
    "systems/arm5e/templates/item/parts/enchantment.html",
    // "systems/arm5e/templates/item/parts/item-enchantment.html",
    "systems/arm5e/templates/item/parts/magic-item.html",
    // "systems/arm5e/templates/item/parts/item-magic-item.html",
    "systems/arm5e/templates/item/parts/authorship.html",
    "systems/arm5e/templates/item/parts/seasonal-activity.html",
    "systems/arm5e/templates/item/parts/item-header.html",
    "systems/arm5e/templates/item/parts/item-footer.html",
    "systems/arm5e/templates/item/parts/activities.html",
    // Rolls partials
    "systems/arm5e/templates/roll/parts/roll-header.html",
    "systems/arm5e/templates/roll/parts/roll-footer.html",
    "systems/arm5e/templates/roll/parts/penetration-options.html",
    // generic partials
    "systems/arm5e/templates/generic/active-effects.html",
    "systems/arm5e/templates/generic/calendar-grid.html",
    "systems/arm5e/templates/generic/simpleListPicker.html",
    "systems/arm5e/templates/generic/textInput.html",
    "systems/arm5e/templates/generic/auraInput.html",
    "systems/arm5e/templates/generic/agingPointsEdit.html",
    "systems/arm5e/templates/generic/largeDialog-footer.html",
    "systems/arm5e/templates/generic/largeDialog-header.html",
    "systems/arm5e/templates/generic/source.html",
    "systems/arm5e/templates/generic/aging-dialog.html",
    "systems/arm5e/templates/generic/metalic-bar.html"
  ]);
};
