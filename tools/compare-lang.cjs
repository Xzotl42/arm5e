const fs = require("fs");
const path = require("path");

/**
 * Recursively compares two objects and collects differences.
 * @param {any} obj1
 * @param {any} obj2
 * @param {string} prefix
 * @param {Array} diffs
 */
function compare(obj1, obj2, prefix = "", diffs = []) {
  if (obj1 && typeof obj1 === "object" && obj2 && typeof obj2 === "object") {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    for (const key of keys2) {
      if (!(key in obj1)) {
        diffs.push({ type: "added", path: prefix ? `${prefix}.${key}` : key });
      }
    }
    for (const key of keys1) {
      if (!(key in obj2)) {
        diffs.push({ type: "removed", path: prefix ? `${prefix}.${key}` : key });
      } else {
        compare(obj1[key], obj2[key], prefix ? `${prefix}.${key}` : key, diffs);
      }
    }
  }
}

// Usage example:
const file1 = process.argv[2];
const file2 = process.argv[3];

if (!file1 || !file2) {
  console.error("Usage: node compare-lang.cjs <file1.json> <file2.json>");
  process.exit(1);
}

const json1 = JSON.parse(fs.readFileSync(file1, "utf8"));
const json2 = JSON.parse(fs.readFileSync(file2, "utf8"));

const diffs = [];
compare(json2, json1, "", diffs);

if (diffs.length === 0) {
  console.log("No differences found.");
} else {
  for (const diff of diffs) {
    if (diff.type === "added") {
      console.log(`Added: ${diff.path}`);
    } else if (diff.type === "removed") {
      console.log(`Removed: ${diff.path}`);
    }
  }
}
