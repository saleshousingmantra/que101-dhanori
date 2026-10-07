// Copies the static site into dist/ for Hostinger (output directory: dist).
// No dependencies and no compilation: the site is plain HTML/CSS/JS.
import { rmSync, mkdirSync, cpSync, existsSync, readdirSync } from "node:fs";

const OUT = "dist";
// Only these files and folders are published.
const SITE = [
  "index.html",
  "thank-you",
  "blog",
  "css",
  "js",
  "images",
  "og-image.jpg",
  "manifest.webmanifest",
  "robots.txt",
  "sitemap.xml",
  ".htaccess",
];

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT);

for (const entry of SITE) {
  if (!existsSync(entry)) continue; // optional files (e.g. .htaccess)
  cpSync(entry, `${OUT}/${entry}`, { recursive: true });
}

if (!existsSync(`${OUT}/index.html`)) {
  console.error("Build failed: index.html missing from dist/");
  process.exit(1);
}
console.log(`Built ${OUT}/: ${readdirSync(OUT).join(", ")}`);
