// Blog sayfalarının gerçek tarayıcı kontrolü (headless Chrome): 390 ve 1280 px'te yatay taşma, CSP ihlali, konsol/ağ hatası,
// stil ve fontun yüklenmesi. Yerelde: `npm run build:drafts` + `npm run dev` açıkken
//   npx tsx scripts/blog-check.mts [--base http://127.0.0.1:8790] [--shots .wrangler/shots]
// Canlıda: npx tsx scripts/blog-check.mts --base https://gethanas.com --paths /blog/,/blog/<slug>
import { mkdirSync } from "node:fs";
import { parseArgs } from "node:util";
import { Browser, checker } from "./lib/cdp.mjs";

const { values } = parseArgs({
  options: {
    base: { type: "string", default: "http://127.0.0.1:8790" },
    shots: { type: "string", default: ".wrangler/shots" },
    paths: { type: "string", default: "/blog/,/blog/example-post,/blog/tag/example,/blog/does-not-exist" },
  },
});
const B = values.base!.replace(/\/$/, "");
const SHOTS = values.shots!;
mkdirSync(SHOTS, { recursive: true });
const PATHS = values.paths!.split(",").filter(Boolean);
const WIDTHS = [390, 1280];
const { check, failures } = checker();

const browser = await Browser.launch();
try {
  for (const path of PATHS) {
    for (const w of WIDTHS) {
      const page = await browser.page({ isolated: true });
      await page.viewport(w);
      await page.goto(`${B}${path}`);
      const label = `${path} @${w}`;
      const status = page.documentStatuses().at(-1);
      check(`${label}: durum kodu`, path.includes("does-not-exist") ? status === 404 : status === 200, String(status));
      // 404 sayfasının kendisi Chrome'da ağ hatası olarak loglanır: beklenen durum, sayılmaz.
      const errs = page.errors().filter((e) => !(path.includes("does-not-exist") && e.startsWith("log.network") && e.includes(path)));
      check(`${label}: CSP ihlali / konsol hatası yok`, errs.length === 0, errs.join(" | "));
      check(`${label}: yatay taşma yok`, !(await page.overflowX()));
      const styled = await page.eval<boolean>(`getComputedStyle(document.body).backgroundColor === "rgb(251, 250, 247)"`);
      check(`${label}: site CSS'i yüklendi`, styled);
      await page.eval("document.fonts.ready");
      const font = await page.eval<boolean>(`document.fonts.check('16px "Hanken Grotesk"') && [...document.fonts].some((f) => f.family.includes("Hanken") && f.status === "loaded")`);
      check(`${label}: Hanken Grotesk yüklendi`, font);
      // Taşmanın kaynağını bulmak için: sayfadan geniş öğeler.
      const wide = await page.eval<string[]>(
        `[...document.querySelectorAll("main *")].filter((e) => e.getBoundingClientRect().right > window.innerWidth + 1 && !e.closest(".table-wrap, pre, .topics")).slice(0, 5).map((e) => e.tagName + "." + e.className)`,
      );
      check(`${label}: içerik ekrandan taşmıyor`, wide.length === 0, wide.join(", "));
      await page.screenshot(`${SHOTS}/blog-${path.replace(/[^a-z0-9]+/gi, "_")}-${w}.png`);
    }
  }
} finally {
  browser.close();
}
const n = failures();
console.log(n ? `\n${n} HATA` : "\nHepsi tamam.");
process.exit(n ? 1 : 0);
