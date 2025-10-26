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
const lang = process.argv[2] || "all";

const langDir = process.argv[3] || "..\\lang";

if (lang === "all") {
  const files = fs.readdirSync(langDir).filter((f) => f.endsWith(".json"));
  files.forEach((file) => {
    const langName = path.basename(file, ".json");
    const filePath = path.join(langDir, file);
    const backupPath = path.join(langDir, `${langName}.json.bak`);

    // Create backup
    fs.copyFileSync(filePath, backupPath);
    console.log(`Backup created at ${backupPath}`);

    // Read, flatten, sort, and write
    const json = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const flatten = expandFlatJSON(json);
    const sorted = sortProperties(flatten);

    fs.writeFileSync(filePath, JSON.stringify(sorted, null, 2), "utf8");
    console.log(`Processed and sorted ${file}`);
  });
}
