const fs = require("fs");
const path = require("path");

function flattenObject(obj, prefix = "", res = {}) {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        flattenObject(value, newKey, res);
      } else {
        res[newKey] = value;
      }
    }
  }
  return res;
}

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
    const flatten = flattenObject(json);
    const sorted = sortProperties(flatten);

    fs.writeFileSync(filePath, JSON.stringify(sorted, null, 2), "utf8");
    console.log(`Processed and sorted ${file}`);
  });
}
