const fs = require("fs");
const path = require("path");

function getType(variable) {
  const typeOf = typeof variable;
  if (typeOf !== "object") return typeOf;
  if (variable === null) return "null";
  if (!variable.constructor) return "Object";
  if (variable.constructor === Object) return "Object";
  return "Unknown";
}

const SKIPPED_PROPERTIES = new Set(["__proto__", "constructor", "prototype"]);

function setProperty(object, key, value) {
  if (!key || SKIPPED_PROPERTIES.has(key)) return false;

  let target = object;
  if (key.includes(".")) {
    const parts = key.split(".");
    if (parts.some((p) => SKIPPED_PROPERTIES.has(p))) return false;

    key = parts.pop();
    target = parts.reduce((o, p) => {
      if (!(p in o)) o[p] = {};
      return o[p];
    }, object);
  }

  if (!(key in target) || target[key] !== value) {
    target[key] = value;
    return true;
  }

  return false;
}

function expandObject(obj) {
  const _expand = (value, depth) => {
    if (depth > 32) throw new Error("Maximum object expansion depth exceeded");
    if (!value) return value;
    if (Array.isArray(value)) return value.map((v) => _expand(v, depth + 1));
    if (getType(value) !== "Object") return value;

    const expanded = {};
    for (const [k, v] of Object.entries(value)) {
      setProperty(expanded, k, _expand(v, depth + 1));
    }
    return expanded;
  };

  return _expand(obj, 0);
}

function sortProperties(obj) {
  if (Array.isArray(obj)) {
    return obj.map(sortProperties);
  }

  if (obj && typeof obj === "object" && obj.constructor === Object) {
    return Object.keys(obj)
      .sort()
      .reduce((acc, key) => {
        acc[key] = sortProperties(obj[key]);
        return acc;
      }, {});
  }

  return obj;
}

function processLanguageFile(langName, langDir) {
  const filePath = path.join(langDir, `${langName}.json`);
  const backupPath = path.join(langDir, `${langName}.json.bak`);

  if (!fs.existsSync(filePath)) {
    console.error(`Language file not found: ${filePath}`);
    process.exitCode = 1;
    return;
  }

  fs.copyFileSync(filePath, backupPath);
  console.log(`Backup created at ${backupPath}`);

  const json = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const expanded = expandObject(json);
  const sorted = sortProperties(expanded);

  fs.writeFileSync(filePath, JSON.stringify(sorted, null, 2), "utf8");
  console.log(`Processed and expanded ${langName}.json`);
}

const lang = process.argv[2] || "all";
const langDirArg = process.argv[3] || "..\\lang";
const langDir = path.isAbsolute(langDirArg) ? langDirArg : path.resolve(__dirname, langDirArg);

if (lang === "all") {
  const files = fs.readdirSync(langDir).filter((f) => f.endsWith(".json"));
  files.forEach((file) => processLanguageFile(path.basename(file, ".json"), langDir));
} else {
  processLanguageFile(lang, langDir);
}
