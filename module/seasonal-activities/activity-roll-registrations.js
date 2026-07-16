import {
  agingRoll,
  investigate,
  twilightUnderstandingRoll,
  visStudy
} from "./long-term-activities.js";

/**
 * Bind runtime roll handlers to activity config entries.
 * Keeps config.js data-only and avoids importing heavy runtime modules there.
 * @param {object} genericActivities
 */
export function registerActivityRollActions(genericActivities) {
  if (!genericActivities) return;

  if (genericActivities.aging?.roll) {
    genericActivities.aging.roll.action = agingRoll;
  }

  if (genericActivities.twilight?.roll) {
    genericActivities.twilight.roll.action = twilightUnderstandingRoll;
  }

  if (genericActivities.visStudy?.roll) {
    genericActivities.visStudy.roll.action = visStudy;
  }

  if (genericActivities.investigateItem?.roll) {
    genericActivities.investigateItem.roll.action = investigate;
  }
}
