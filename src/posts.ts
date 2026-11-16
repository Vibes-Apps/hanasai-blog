import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { BASE, SITE_URL, WORDS_PER_MINUTE } from "./config.js";
import { renderMarkdown } from "./markdown.js";
import { coverFile, formatIssues, frontmatterSchema, isOwnBlogUrl, ownBlogSlug, SLUG_RE, type Frontmatter } from "./schema.js";
import { TAGS } from "./tags.js";

// Yazıları content/posts/*.md dosyalarından okur. Dosya adı = slug (yazının kimliği). Yayın adresi normalde /blog/<slug>;
// canonical kendi blogumuzun bir adresini gösteriyorsa yazı o adreste yayınlanır ve /blog/<slug> oraya 301 ile yönlenir.

export interface Post extends Frontmatter {
  // Dosya adı (kimlik; CMS'teki adres alanı). Yayın adresi için `path` kullanılır.
  slug: string;
  // Yayın adresinin son parçası: canonical kendi blogumuzu gösteriyorsa oradan, yoksa slug.
  urlSlug: string;
  // Site içi yol (/blog/<urlSlug>) ve tam adres.
  path: string;
  url: string;
  // <link rel="canonical"> ve og:url: başka bir sitenin adresi verildiyse o, yoksa yazının kendi adresi.
  canonicalUrl: string;
  // Canonical başka bir siteyi gösteriyorsa false: yazı sitemap'e girmez (Google sitemap'te yalnızca canonical adresleri ister).
  selfCanonical: boolean;
  file: string;
  html: string;
  words: number;
  readingMinutes: number;
  warnings: string[];
}

export class ContentError extends Error {
  constructor(readonly problems: string[]) {
    super(`İçerik hatası, derleme durdu:\n${problems.map((p) => `  - ${p}`).join("\n")}`);
    this.name = "ContentError";
  }
}

// "---" ile açılıp kapanan YAML bilgi bloğunu gövdeden ayırır.
export function splitFrontmatter(src: string): { yaml: string; body: string } | null {
  const text = (src.charCodeAt(0) === 0xfeff ? src.slice(1) : src).replace(/\r\n?/g, "\n");
  if (!text.startsWith("---\n")) return null;
  const end = text.indexOf("\n---", 4);
  if (end === -1) return null;
  const after = text.slice(end + 4);
  if (after !== "" && !after.startsWith("\n")) return null;
  return { yaml: text.slice(4, end), body: after.replace(/^\n/, "") };
}

export const readingMinutes = (words: number): number => Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));

// Tek dosyayı doğrular ve çevirir. Sorun varsa "dosya: alan: mesaj" satırlarıyla ContentError atar.
export function parsePost(file: string, src: string): Post {
  const name = file.replace(/^.*[\\/]/, "");
  const slug = name.replace(/\.md$/, "");
  const where = `content/posts/${name}`;
  const problems: string[] = [];
  if (!SLUG_RE.test(slug)) problems.push(`${where}: dosya adı adres olur; küçük harf, rakam ve tireden oluşmalı (ör. answering-guest-calls.md)`);

  const parts = splitFrontmatter(src);
  if (!parts) throw new ContentError([...problems, `${where}: dosya "---" ile açılıp kapanan bir bilgi bloğuyla başlamalı`]);

  let raw: unknown;
  try {
    raw = parseYaml(parts.yaml) ?? {};
  } catch (e) {
    throw new ContentError([...problems, `${where}: bilgi bloğu okunamadı (YAML): ${(e as Error).message.split("\n")[0]}`]);
  }
  const parsed = frontmatterSchema.safeParse(raw);
  if (!parsed.success) problems.push(...formatIssues(parsed.error).map((m) => `${where}: ${m}`));
  if (!parts.body.trim()) problems.push(`${where}: yazının gövdesi boş`);

  const r = renderMarkdown(parts.body);
  problems.push(...r.problems.map((m) => `${where}: ${m}`));
  if (problems.length || !parsed.success) throw new ContentError(problems);

  // Kendi blogumuzun adresi verildiyse yazı orada yayınlanır (schema bu adresin biçimini zaten denetledi).
  const canonical = parsed.data.canonical;
  const urlSlug = (canonical && ownBlogSlug(canonical)) || slug;
  const path = `${BASE}/${urlSlug}`;
  const url = `${SITE_URL}${path}`;
  const external = !!canonical && !isOwnBlogUrl(canonical);
  return {
    ...parsed.data,
    slug,
    urlSlug,
    path,
    url,
    canonicalUrl: external ? canonical! : url,
    selfCanonical: !external,
    file: where,
    html: r.html,
    words: r.words,
    readingMinutes: readingMinutes(r.words),
    warnings: r.warnings.map((m) => `${where}: ${m}`),
  };
}

// Yeniden eskiye; aynı gün yazılanlar slug sırasıyla (derleme her seferinde aynı çıktıyı verir).
export const byDateDesc = (a: Post, b: Post): number => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug);

// Kapak görseli için boyut uyarısı: büyük dosya sayfayı ve paylaşım kartını yavaşlatır (CMS en çok 2 MB kabul eder).
export const COVER_WARN_BYTES = 500_000;

// Kapak görseli public/ altında gerçekten var mı, boyutu makul mü. Yalnızca publicDir verilince bakılır (derleme verir).
function checkCover(p: Post, publicDir: string, problems: string[]): void {
  if (!p.cover) return;
  const file = join(publicDir, coverFile(p.cover));
  if (!existsSync(file)) {
    problems.push(`${p.file}: cover: görsel dosyası bulunamadı (${coverFile(p.cover)}); CMS'ten yeniden yükleyin`);
    return;
  }
  const size = statSync(file).size;
  if (size > COVER_WARN_BYTES) p.warnings.push(`${p.file}: cover: görsel ${Math.round(size / 1000)} KB; 500 KB altı önerilir (1200×630 px JPG)`);
}

// Bütün yazıları okur; hatalar tek seferde, hepsi birlikte bildirilir. Taslaklar varsayılan olarak dışarıda kalır.
// publicDir verilirse kapak görsellerinin dosyaları da denetlenir.
export function loadPosts(dir: string, opts: { includeDrafts?: boolean; publicDir?: string } = {}): Post[] {
  let files: string[];
  try {
    files = readdirSync(dir).filter((f) => f.endsWith(".md")).sort();
  } catch {
    return [];
  }
  const posts: Post[] = [];
  const problems: string[] = [];
  for (const f of files) {
    try {
      const p = parsePost(f, readFileSync(join(dir, f), "utf8"));
      if (opts.publicDir) checkCover(p, opts.publicDir, problems);
      posts.push(p);
    } catch (e) {
      if (e instanceof ContentError) problems.push(...e.problems);
      else throw e;
    }
  }
  if (problems.length) throw new ContentError(problems);
  const out = posts.filter((p) => opts.includeDrafts || !p.draft).sort(byDateDesc);
  checkAddresses(out);
  return out;
}

// Yayın adresleri çakışmamalı: iki yazı aynı adresi isteyemez, bir yazının yeni adresi başka bir yazının adresi olamaz.
// Ayrılmış adresler (tag/, assets/, images/, feed.xml…) dosya adı ya da canonical olarak kullanılamaz.
const RESERVED = new Set(["tag", "assets", "images", "feed", "sitemap", "404", "index"]);
function checkAddresses(posts: Post[]): void {
  const problems: string[] = [];
  const owner = new Map<string, Post>();
  for (const p of posts) {
    if (RESERVED.has(p.urlSlug)) problems.push(`${p.file}: adres "${p.urlSlug}" ayrılmış, başka bir adres seçin`);
    const prev = owner.get(p.urlSlug);
    if (prev) problems.push(`${p.file}: adres /blog/${p.urlSlug} başka bir yazıda da kullanılıyor (${prev.file})`);
    else owner.set(p.urlSlug, p);
  }
  // Taşınan yazının eski adresi (dosya adı) başka bir yazının yayın adresi olamaz: yönlendirme onu ezerdi.
  for (const p of posts) {
    const other = owner.get(p.slug);
    if (p.urlSlug !== p.slug && other && other !== p) problems.push(`${p.file}: eski adres /blog/${p.slug}, ${other.file} yazısının adresiyle çakışıyor`);
  }
  if (problems.length) throw new ContentError(problems);
}

// Eski adresten (dosya adı) yeni adrese kalıcı yönlendirmeler: canonical'la taşınan yazılar.
export const movedPosts = (posts: Post[]): { from: string; to: string }[] =>
  posts.filter((p) => p.urlSlug !== p.slug).map((p) => ({ from: `${BASE}/${p.slug}`, to: p.path }));

// Etiket → yazılar (yazılar zaten yeniden eskiye sıralı gelir). Sabit listenin bütün etiketleri, listedeki sırayla; yazısı olmayan
// etiketin listesi boş.
export function tagIndex(posts: Post[]): Map<string, Post[]> {
  return new Map(TAGS.map((t) => [t.slug, posts.filter((p) => p.tags.includes(t.slug))]));
}

// İlgili yazılar: önce ortak etiket sayısı, sonra en yeniler. Kendisi hariç, en fazla `limit`.
export function relatedPosts(post: Post, all: Post[], limit = 3): Post[] {
  const shared = (p: Post) => p.tags.filter((t) => post.tags.includes(t)).length;
  return all
    .filter((p) => p.slug !== post.slug)
    .sort((a, b) => shared(b) - shared(a) || byDateDesc(a, b))
    .slice(0, limit);
}
