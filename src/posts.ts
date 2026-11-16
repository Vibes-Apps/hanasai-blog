import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { BASE, SITE_URL, WORDS_PER_MINUTE } from "./config.js";
import { renderMarkdown } from "./markdown.js";
import { coverFile, formatIssues, frontmatterSchema, SLUG_RE, type Frontmatter } from "./schema.js";

// Yazıları content/posts/*.md dosyalarından okur. Dosya adı = slug (adres: /blog/<slug>).

export interface Post extends Frontmatter {
  slug: string;
  // Yazının kendi tam adresi (https://gethanas.com/blog/<slug>).
  url: string;
  // <link rel="canonical"> ve og:url: bilgi bloğundaki canonical, yoksa kendi adresi.
  canonicalUrl: string;
  // Canonical başka bir adresi gösteriyorsa false: yazı sitemap'e girmez (Google sitemap'te yalnızca canonical adresleri ister).
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

  const url = `${SITE_URL}${BASE}/${slug}`;
  const canonicalUrl = parsed.data.canonical ?? url;
  return {
    ...parsed.data,
    slug,
    url,
    canonicalUrl,
    // Sondaki / farkı aynı adres sayılır.
    selfCanonical: canonicalUrl.replace(/\/$/, "") === url,
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
  return posts.filter((p) => opts.includeDrafts || !p.draft).sort(byDateDesc);
}

// Etiket → yazılar (yazılar zaten yeniden eskiye sıralı gelir). Etiketler alfabetik.
export function tagIndex(posts: Post[]): Map<string, Post[]> {
  const m = new Map<string, Post[]>();
  for (const p of posts) for (const t of p.tags) m.set(t, [...(m.get(t) ?? []), p]);
  return new Map([...m.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

// İlgili yazılar: önce ortak etiket sayısı, sonra en yeniler. Kendisi hariç, en fazla `limit`.
export function relatedPosts(post: Post, all: Post[], limit = 3): Post[] {
  const shared = (p: Post) => p.tags.filter((t) => post.tags.includes(t)).length;
  return all
    .filter((p) => p.slug !== post.slug)
    .sort((a, b) => shared(b) - shared(a) || byDateDesc(a, b))
    .slice(0, limit);
}
