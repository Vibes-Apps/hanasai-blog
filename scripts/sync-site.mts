// Çekirdek sitenin (gethanas.com) ortak parçalarını vendor/site/'a kopyalar: üst çubuk, footer, CSS (fontlarıyla), favicon.
// Blog derlemesi ağa çıkmaz; bu dosyaları okur. Landing'in görünümü ya da footer'ı değişince geliştirici çalıştırır,
// farkı git diff'te inceler ve commit'ler. Kullanım: npm run sync-site [-- --site https://gethanas.com]
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";

const { values } = parseArgs({ options: { site: { type: "string", default: "https://gethanas.com" }, out: { type: "string", default: "vendor/site" } } });
const SITE = values.site!.replace(/\/$/, "");
const OUT = values.out!;
const PAGE = `${SITE}/about`; // Çekirdekte alt sayfa iskeletini (shell) kullanan, değişmesi en az olası sayfa.

async function get(url: string): Promise<Response> {
  const r = await fetch(url, { headers: { "user-agent": "hanasai-blog-sync" } });
  if (!r.ok) throw new Error(`${url} → HTTP ${r.status}`);
  return r;
}

function pick(html: string, re: RegExp, what: string): string {
  const m = re.exec(html);
  if (!m) throw new Error(`${PAGE}: ${what} bulunamadı`);
  return m[1] ?? m[0];
}

const html = await (await get(PAGE)).text();
const header = pick(html, /<header class="top"[\s\S]*?<\/header>/, "üst çubuk (<header class=\"top\">)");
const footer = pick(html, /<footer class="foot">[\s\S]*?<\/footer>/, "footer (<footer class=\"foot\">)");
const cssHref = pick(html, /<link rel="stylesheet" href="([^"]+)">/, "stylesheet linki");
// SVG ikon: çekirdek 2026-11-18'den (VIB-72) beri önce /favicon.ico'yu listeliyor; blog yalnızca SVG'yi kullanır.
const iconHref = pick(html, /<link rel="icon" href="([^"]+)" type="image\/svg\+xml">/, "SVG favicon linki");

const cssUrl = new URL(cssHref, PAGE);
let css = await (await get(cssUrl.href)).text();

rmSync(OUT, { recursive: true, force: true });
mkdirSync(`${OUT}/assets`, { recursive: true });

// CSS'in başvurduğu dosyalar (font) yanına indirilir; data: adresleri olduğu gibi kalır.
const fonts: string[] = [];
for (const m of [...css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)]) {
  const ref = m[1]!;
  if (ref.startsWith("data:")) continue;
  const u = new URL(ref, cssUrl);
  const name = u.pathname.split("/").pop()!;
  if (!/^[\w.-]+$/.test(name)) throw new Error(`beklenmeyen dosya adı: ${name}`);
  if (!fonts.includes(name)) {
    writeFileSync(`${OUT}/assets/${name}`, Buffer.from(await (await get(u.href)).arrayBuffer()));
    fonts.push(name);
  }
  css = css.replace(m[0], `url("./${name}")`);
}

writeFileSync(`${OUT}/header.html`, `${header}\n`);
writeFileSync(`${OUT}/footer.html`, `${footer}\n`);
writeFileSync(`${OUT}/site.css`, css);
writeFileSync(`${OUT}/favicon.svg`, Buffer.from(await (await get(new URL(iconHref, PAGE).href)).arrayBuffer()));
writeFileSync(
  `${OUT}/SOURCE.json`,
  `${JSON.stringify({ source: PAGE, syncedAt: new Date().toISOString().slice(0, 10), css: cssUrl.pathname, favicon: iconHref, assets: fonts }, null, 2)}\n`,
);
console.log(`vendor/site güncellendi: ${PAGE} (css ${cssUrl.pathname}, ${fonts.length} font)`);
