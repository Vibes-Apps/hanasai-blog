import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { BASE } from "./config.js";
import { indexPage, notFoundPage, postPage, postPath, rssXml, sitemapXml, tagPage, tagPath, type Assets, type Ctx } from "./pages.js";
import { ContentError, loadPosts, relatedPosts, tagIndex, type Post } from "./posts.js";
import { loadShell } from "./shell.js";

// Blogu dist/'e derler. dist/ Worker'ın statik dosya klasörüdür; adresler assets.base_path=/blog ile /blog altında sunulur
// (wrangler.jsonc). Çıktı yolları BASE'siz: dist/index.html → /blog/, dist/<slug>.html → /blog/<slug>.

export interface BuildOptions {
  contentDir?: string;
  outDir?: string;
  vendorDir?: string;
  publicDir?: string;
  stylesFile?: string;
  // Yalnızca testler ve yerel önizleme için: taslakları da derler. Canlı derleme asla taslak içermez.
  includeDrafts?: boolean;
}

export interface BuildResult {
  posts: Post[];
  tags: string[];
  files: string[];
  warnings: string[];
}

const hash = (data: string | Buffer): string => createHash("sha256").update(data).digest("hex").slice(0, 10);

function write(out: string, file: string, data: string | Buffer, files: string[]): void {
  const path = join(out, file);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, data);
  files.push(file);
}

// Çekirdek sitenin CSS'i (vendor/site/site.css, fontlarıyla) + blog CSS'i tek dosyada, adı içerik hash'li.
function buildAssets(vendorDir: string, stylesFile: string, out: string, files: string[]): Assets {
  const siteCss = readFileSync(join(vendorDir, "site.css"), "utf8");
  const css = `${siteCss}\n\n/* ---------- Blog (styles/blog.css) ---------- */\n${readFileSync(stylesFile, "utf8")}`;
  const cssFile = `assets/blog-${hash(css)}.css`;
  write(out, cssFile, css, files);

  let font: string | undefined;
  const vendorAssets = join(vendorDir, "assets");
  if (existsSync(vendorAssets)) {
    for (const f of readdirSync(vendorAssets)) {
      write(out, `assets/${f}`, readFileSync(join(vendorAssets, f)), files);
      if (f.endsWith(".woff2")) font ??= `assets/${f}`;
    }
  }
  const icon = readFileSync(join(vendorDir, "favicon.svg"));
  const favicon = `assets/favicon-${hash(icon)}.svg`;
  write(out, favicon, icon, files);
  return { css: cssFile, favicon, ...(font ? { font } : {}) };
}

export function build(opts: BuildOptions = {}): BuildResult {
  const contentDir = opts.contentDir ?? "content/posts";
  const out = opts.outDir ?? "dist";
  const vendorDir = opts.vendorDir ?? "vendor/site";
  const publicDir = opts.publicDir ?? "public";
  const stylesFile = opts.stylesFile ?? "styles/blog.css";

  // Önce içerik: hatalıysa dist/ silinmeden durur (son iyi çıktı yerinde kalır).
  const posts = loadPosts(contentDir, { includeDrafts: opts.includeDrafts ?? false });

  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  const files: string[] = [];
  // public/: _headers ve görseller (CMS'in medya klasörü public/images → /blog/images).
  if (existsSync(publicDir)) {
    cpSync(publicDir, out, { recursive: true });
    const walk = (d: string, rel = ""): void => {
      for (const e of readdirSync(d, { withFileTypes: true })) {
        if (e.isDirectory()) walk(join(d, e.name), `${rel}${e.name}/`);
        else files.push(`${rel}${e.name}`);
      }
    };
    walk(publicDir);
  }

  const ctx: Ctx = { assets: buildAssets(vendorDir, stylesFile, out, files), shell: loadShell(vendorDir) };
  const tags = tagIndex(posts);

  write(out, "index.html", indexPage(posts, ctx), files);
  for (const p of posts) write(out, `${p.slug}.html`, postPage(p, relatedPosts(p, posts), ctx), files);
  for (const [tag, list] of tags) write(out, `tag/${tag}.html`, tagPage(tag, list, ctx), files);
  write(out, "404.html", notFoundPage(ctx), files);
  write(out, "feed.xml", rssXml(posts), files);

  const newest = posts.map((p) => p.updated ?? p.date).sort().at(-1);
  write(
    out,
    "sitemap.xml",
    sitemapXml([
      ...(posts.length ? [{ path: `${BASE}/`, ...(newest ? { lastmod: newest } : {}) }] : []),
      ...posts.map((p) => ({ path: postPath(p.slug), lastmod: p.updated ?? p.date })),
      ...[...tags.keys()].map((t) => ({ path: tagPath(t) })),
    ]),
    files,
  );

  return { posts, tags: [...tags.keys()], files, warnings: posts.flatMap((p) => p.warnings) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const r = build({ includeDrafts: process.argv.includes("--drafts") });
    for (const w of r.warnings) console.warn(`UYARI ${w}`);
    console.log(`blog → dist/ (${r.posts.length} yazı, ${r.tags.length} etiket, ${r.files.length} dosya)${process.argv.includes("--drafts") ? " [TASLAKLAR DAHİL: yalnızca yerel önizleme]" : ""}`);
  } catch (e) {
    if (e instanceof ContentError) {
      console.error(e.message);
      process.exit(1);
    }
    throw e;
  }
}
