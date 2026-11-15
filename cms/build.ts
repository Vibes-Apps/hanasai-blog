import { createHash } from "node:crypto";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { build } from "vite";
import { cmsConfig, type Mode } from "./config.js";

// Yönetim ekranını cms/dist/'e derler (Worker hanasai-cms, cms.gethanas.com).
// Sveltia CMS'in npm paketi bir paketleyiciyle kullanılmak üzere hazırlanmış (yalın modül adları, JSON import'ları,
// import.meta.url varlıkları); Vite bunları kendi alan adımızdan sunulan, içerik hash'li dosyalara çevirir. Dış CDN yok:
// CSP script-src 'self' yeterli. Vite yalnızca burada, derlemede kullanılır; blog sayfalarına ve Worker'lara kod girmez.
// Kullanım: npx tsx cms/build.ts [--test]   (--test: GitHub yerine tarayıcı belleğinde sahte depo, yalnızca yerel deneme)

const OUT = resolve("cms/dist");
const ROOT = resolve("cms/.build");
const mode: Mode = process.argv.includes("--test") ? "test" : "production";
const hash = (s: string | Buffer) => createHash("sha256").update(s).digest("hex").slice(0, 10);
const { version } = JSON.parse(readFileSync("node_modules/@sveltia/cms/package.json", "utf8")) as { version: string };

// Önizleme stili: sitenin CSS'i (token'lar, font) + önizleme tipografisi. Font, CSS'in yanına kopyalanır.
const siteCss = readFileSync("vendor/site/site.css", "utf8");
const previewCss = `${siteCss}\n\n/* ---------- Önizleme (cms/preview.css) ---------- */\n${readFileSync("cms/preview.css", "utf8")}`;
const previewFile = `preview-${hash(previewCss)}.css`;

rmSync(ROOT, { recursive: true, force: true });
mkdirSync(ROOT, { recursive: true });
writeFileSync(
  `${ROOT}/admin.js`,
  `// Otomatik üretildi (cms/build.ts). Mod: ${mode}. Sveltia ${version}.
import { init, registerPreviewStyle } from "@sveltia/cms";
registerPreviewStyle("/${previewFile}");
init({ config: ${JSON.stringify(cmsConfig(mode))} });
`,
);
writeFileSync(
  `${ROOT}/index.html`,
  `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>hanas.ai blog editor</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<script type="module" src="./admin.js"></script>
</head>
<body></body>
</html>
`,
);

await build({
  root: ROOT,
  configFile: false,
  logLevel: "warn",
  publicDir: false,
  build: {
    outDir: OUT,
    emptyOutDir: true,
    assetsDir: "assets",
    sourcemap: false,
    // Satır içi varlık yok (data: URL'leri yerine dosya): CSP'yi sade tutar.
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 100_000,
    modulePreload: { polyfill: false },
  },
});

cpSync("cms/static", OUT, { recursive: true });
writeFileSync(`${OUT}/${previewFile}`, previewCss);
cpSync("vendor/site/assets", OUT, { recursive: true });
cpSync("vendor/site/favicon.svg", `${OUT}/favicon.svg`);
rmSync(ROOT, { recursive: true, force: true });

const html = readFileSync(`${OUT}/index.html`, "utf8");
if (/<script(?![^>]*\ssrc=)[^>]*>/.test(html) || /\sstyle=/.test(html)) throw new Error("cms/dist/index.html satır içi script/stil içeriyor (CSP)");
console.log(`cms → cms/dist/ (Sveltia ${version}, mod ${mode})`);
