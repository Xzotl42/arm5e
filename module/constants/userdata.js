import { log } from "../tools/tools.js";

const HERMETIC_FILTER = {
  techniqueFilter: "",
  formFilter: "",
  levelFilter: 0,
  levelOperator: 0,
  expanded: false
};

const HERMETIC_TOPIC_FILTER = {
  techniqueFilter: "",
  formFilter: "",
  qualityFilter: 0,
  qualityOperator: 0,
  expanded: false
};

const TOPIC_FILTER = {
  topicFilter: "",
  typeFilter: "",
  levelFilter: 0,
  levelOperator: 0,
  qualityFilter: 0,
  qualityOperator: 0,
  expanded: false
};

const TIME_FILTER = {
  minYearFilter: 0,
  maxYearFilter: 0,
  typeFilter: "",
  expanded: false
};

function updateUserCache(actorId, category, list, key, value) {
  let usercache = JSON.parse(sessionStorage.getItem(`usercache-${game.user.id}`));

  if (usercache[actorId].filters[category] == undefined) {
    usercache[actorId].filters[category] = { [list]: { [key]: value } };
  } else if (usercache[actorId].filters[category][list] == undefined) {
    usercache[actorId].filters[category][list] = { [key]: value };
  } else {
    usercache[actorId].filters[category][list][key] = value;
  }
  log(false, `Set field ${key} of ${list ?? "unknown"} to ${value}`);
  sessionStorage.setItem(`usercache-${game.user.id}`, JSON.stringify(usercache));
}

function clearUserCache() {
  sessionStorage.removeItem(`usercache-${game.user.id}`);
  ui.notifications.info("User cache has been reset.");
}

export {
  TOPIC_FILTER,
  HERMETIC_FILTER,
  HERMETIC_TOPIC_FILTER,
  TIME_FILTER,
  updateUserCache,
  clearUserCache
};
