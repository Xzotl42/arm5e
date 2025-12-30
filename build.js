import * as esbuild from "esbuild";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const moduleDir = path.join(__dirname, "module");
const distDir = path.join(__dirname, "dist");
const outputFile = path.join(distDir, "arm5e.min.js");

// Create dist directory if it doesn't exist
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
  console.log(`Created dist directory: ${distDir}`);
}

// Build using esbuild
try {
  const result = await esbuild.build({
    entryPoints: [path.join(moduleDir, "arm5e.js")],
    bundle: true,
    minify: true,
    sourcemap: true,
    outfile: outputFile,
    format: "iife",
    logLevel: "info"
  });

  console.log(`\n✓ Successfully minified all files!`);
  console.log(`Output file: ${outputFile}`);
  console.log(`Source map: ${outputFile}.map`);

  // Get file sizes
  const minifiedSize = fs.statSync(outputFile).size;
  console.log(`Output size: ${(minifiedSize / 1024).toFixed(2)} KB`);
} catch (error) {
  console.error("Error during minification:", error);
  process.exit(1);
}
