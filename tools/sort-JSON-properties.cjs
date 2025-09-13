const fs = require("fs");
const path = require("path");

/**
 * Recursively sorts all properties of a JSON object alphabetically.
 * @param {any} obj
 * @returns {any}
 */
function sortProperties(obj) {
  if (Array.isArray(obj)) {
    return obj.map(sortProperties);
  } else if (obj && typeof obj === "object" && obj.constructor === Object) {
    return Object.keys(obj)
      .sort()
      .reduce((acc, key) => {
        acc[key] = sortProperties(obj[key]);
        return acc;
      }, {});
  } else {
    return obj;
  }
}

/**
 * Expands a flat JSON object with dot-separated keys into a nested object.
 * @param {Object} flatObj
 * @returns {Object}
 */
function expandFlatJSON(flatObj) {
  const result = {};
  for (const key in flatObj) {
    const parts = key.split(".");
    let current = result;
    for (let i = 0; i < parts.length; i++) {
      if (i === parts.length - 1) {
        current[parts[i]] = flatObj[key];
      } else {
        if (!current[parts[i]] || typeof current[parts[i]] !== "object") {
          current[parts[i]] = {};
        }
        current = current[parts[i]];
      }
    }
  }
  return result;
}

// Get language argument from command line
const lang = process.argv[2] || "en";

const langDir = process.argv[3] || "..\\lang";

const inputPath = path.join(langDir, `${lang}-old.json`);
const outputPath = path.join(langDir, `${lang}.json`);
// Usage example:

const json = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const expanded = expandFlatJSON(json);
const sorted = sortProperties(expanded);

fs.writeFileSync(outputPath, JSON.stringify(sorted, null, 2), "utf8");
console.log("Sorted JSON written to", outputPath);
