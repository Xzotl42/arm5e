export const seasonOrder = {
  standard: { spring: 0, summer: 1, autumn: 2, winter: 3 },
  winterFirst: { winter: 0, spring: 1, summer: 2, autumn: 3 }
};
export const seasonOrderInv = {
  standard: { 0: "spring", 1: "summer", 2: "autumn", 3: "winter" },
  winterFirst: { 0: "winter", 1: "spring", 2: "summer", 3: "autumn" }
};
export function nextDate(season, year) {
  if (season == CONFIG.SEASON_ORDER_INV[3]) {
    return { season: CONFIG.SEASON_ORDER_INV[0], year: Number(year) + 1 };
  } else {
    return { season: CONFIG.SEASON_ORDER_INV[CONFIG.SEASON_ORDER[season] + 1], year: Number(year) };
  }
}

export function isInThePast(date) {
  let datetime = game.settings.get("arm5e", "currentDate");
  if (Number(date.year) < Number(datetime.year)) return true;
  if (
    Number(date.year) == Number(datetime.year) &&
    CONFIG.SEASON_ORDER[date.season] < CONFIG.SEASON_ORDER[datetime.season]
  ) {
    return true;
  }
  // TODO months and days?
  return false;
}

// Return the number of seasons between two dates
// positive result means date2 further in the future
export function seasonsDelta(date1, date2) {
  return (
    4 * (date2.year - date1.year) +
    CONFIG.SEASON_ORDER[date2.season] -
    CONFIG.SEASON_ORDER[date1.season]
  );
}

export const SimpleCalendarSeasons = {
  Spring: "spring",
  Summer: "summer",
  Fall: "autumn",
  Winter: "winter"
};

export function compareDiaryEntries(e1, e2) {
  if (e1.system.dates[0].year < e2.system.dates[0].year) {
    return 1;
  } else if (e1.system.dates[0].year > e2.system.dates[0].year) {
    return -1;
  } else {
    if (
      CONFIG.SEASON_ORDER[e1.system.dates[0].season] <
      CONFIG.SEASON_ORDER[e2.system.dates[0].season]
    ) {
      return 1;
    } else if (
      CONFIG.SEASON_ORDER[e1.system.dates[0].season] >
      CONFIG.SEASON_ORDER[e2.system.dates[0].season]
    ) {
      return -1;
    } else {
      let cmp = -e1.system.dates[0].date.localeCompare(e2.system.dates[0].date);
      if (cmp) {
        return cmp;
      } else {
        return e1.name.localeCompare(e2.name);
      }
    }
  }
}

// used in the calendar
export function compareDates(e1, e2) {
  if (e1.year == e2.year) {
    if (CONFIG.SEASON_ORDER[e1.season] < CONFIG.SEASON_ORDER[e2.season]) {
      return -1;
    } else if (CONFIG.SEASON_ORDER[e1.season] > CONFIG.SEASON_ORDER[e2.season]) {
      return 1;
    } else {
      return 0;
    }
  } else if (e1.year < e2.year) {
    return -1;
  } else {
    //e1.year > e2.year
    return 1;
  }
}

// get a date shifted by offset seasons
export function getShiftedDate(date, offset) {
  if (offset == 0) return { year: date.year, season: date.season };

  const totalSeasons = CONFIG.SEASON_ORDER[date.season] + offset;
  // Use ((x % 4) + 4) % 4 to get a positive modulo, which JavaScript's % does not guarantee
  const newSeasonIndex = ((totalSeasons % 4) + 4) % 4;
  const yearOffset = Math.floor(totalSeasons / 4);

  return {
    season: CONFIG.SEASON_ORDER_INV[newSeasonIndex],
    year: date.year + yearOffset
  };
}
