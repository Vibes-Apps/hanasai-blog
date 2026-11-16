import { z } from "zod";
import { DEFAULT_AUTHOR } from "./config.js";
import { isTagSlug, TAGS, TAGS_MAX, TAGS_MIN } from "./tags.js";

// Yazının bilgi bloğu (front matter). CMS alanları (cms/config.ts) aynı kurallarla tanımlıdır; biri değişirse diğeri de değişir.
// Hatalı bilgi bloğu derlemeyi durdurur: mesajlar Türkçe, dosya ve alan adıyla (src/posts.ts).

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const DESCRIPTION_MIN = 120;
export const DESCRIPTION_MAX = 160;
export const TITLE_MAX = 110;
export { TAGS_MAX, TAGS_MIN } from "./tags.js";
export const COVER_ALT_MAX = 200;
// Kapak görseli yalnızca CMS'in medya klasöründen (public/images → /blog/images) ve paylaşım kartlarının okuduğu biçimlerde.
// Göreli (/blog/images/x.jpg) ya da kendi alan adımızla tam adres (https://gethanas.com/blog/images/x.jpg).
export const COVER_RE = /^(?:https:\/\/(?:www\.)?gethanas\.com)?\/blog\/images\/[A-Za-z0-9._~-]+\.(?:jpe?g|png|webp)$/i;

const isHttpsUrl = (s: string): boolean => {
  try {
    const u = new URL(s);
    return u.protocol === "https:" && !!u.hostname && !u.username && !u.password;
  } catch {
    return false;
  }
};

const required = (what: string) => (iss: { input: unknown }) => (iss.input === undefined ? "zorunlu alan eksik" : `${what} olmalı`);

// CMS boş bırakılan isteğe bağlı alanı "" ya da null yazabilir: yok sayılır.
const emptyToUndefined = (v: unknown) => (v === "" || v === null ? undefined : v);

const isValidDate = (s: string): boolean => {
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
};

const isoDate = z
  .string({ error: required("YYYY-AA-GG biçiminde tarih") })
  .regex(/^\d{4}-\d{2}-\d{2}$/, { error: "YYYY-AA-GG biçiminde olmalı (ör. 2026-11-15)" })
  .refine(isValidDate, { error: "geçerli bir tarih değil" });

const length = (min: number, max: number) => (s: string, ctx: z.RefinementCtx) => {
  if (s.length < min || s.length > max) ctx.addIssue({ code: "custom", message: `${min}–${max} karakter olmalı (şu an ${s.length})` });
};

export const frontmatterSchema = z
  .strictObject({
    title: z.string({ error: required("metin") }).trim().superRefine(length(1, TITLE_MAX)),
    description: z.string({ error: required("metin") }).trim().superRefine(length(DESCRIPTION_MIN, DESCRIPTION_MAX)),
    date: isoDate,
    updated: z.preprocess(emptyToUndefined, isoDate.optional()),
    author: z.preprocess(emptyToUndefined, z.string({ error: required("metin") }).trim().min(1).max(80).default(DEFAULT_AUTHOR)),
    tags: z.preprocess(
      emptyToUndefined,
      z
        // Etiketler yalnızca sabit listeden (src/tags.ts). Yayındaki yazıda en az 2 (aşağıda), her yazıda en çok 4.
        .array(
          z.string({ error: required("metin") }).refine(isTagSlug, {
            error: (iss) => `bilinmeyen etiket "${String(iss.input)}"; geçerli etiketler: ${TAGS.map((t) => t.slug).join(", ")}`,
          }),
          { error: required("liste") },
        )
        .max(TAGS_MAX, { error: `en fazla ${TAGS_MAX} etiket` })
        .refine((t) => new Set(t).size === t.length, { error: "aynı etiket iki kez yazılmış" })
        .default([]),
    ),
    draft: z.preprocess(emptyToUndefined, z.boolean({ error: required("true ya da false") }).default(false)),
    // Kapak görseli: yazının başında, listede ve paylaşım kartında (og:image). Alt metni zorunlu (aşağıda).
    cover: z.preprocess(
      emptyToUndefined,
      z
        .string({ error: required("metin") })
        .trim()
        .regex(COVER_RE, { error: "kapak görseli CMS'ten yüklenmiş olmalı (/blog/images/…), biçimi JPG, PNG ya da WebP" })
        .optional(),
    ),
    coverAlt: z.preprocess(emptyToUndefined, z.string({ error: required("metin") }).trim().max(COVER_ALT_MAX, { error: `en fazla ${COVER_ALT_MAX} karakter` }).optional()),
    // Canonical (sahibinin kararı, 2026-11-16): kendi blogumuzun adresi (https://gethanas.com/blog/<adres>) girilirse yazı O ADRESTE
    // yayınlanır, dosya adından gelen eski adres 301 ile yönlenir. Başka bir sitenin adresi girilirse "asıl yazı orada" demektir.
    canonical: z.preprocess(
      emptyToUndefined,
      z.string({ error: required("metin") }).trim().refine(isHttpsUrl, { error: "https:// ile başlayan tam bir adres olmalı" }).optional(),
    ),
  })
  .refine((d) => !d.updated || d.updated >= d.date, { error: "güncellenme tarihi yayın tarihinden önce olamaz", path: ["updated"] })
  .refine((d) => !d.cover || !!d.coverAlt, { error: "kapak görseli varsa alt metni zorunlu (görseli göremeyen biri için ne gösterdiğini anlatın)", path: ["coverAlt"] })
  .refine((d) => d.draft || d.tags.length >= TAGS_MIN, { error: `yayındaki yazıda en az ${TAGS_MIN} etiket olmalı`, path: ["tags"] })
  .refine((d) => !d.canonical || !isOwnBlogUrl(d.canonical) || ownBlogSlug(d.canonical) !== null, {
    error: "kendi blog adresimizde adres kısmı küçük harf, rakam ve tireden oluşmalı (ör. https://gethanas.com/blog/hotel-phone-tips)",
    path: ["canonical"],
  });

// Canonical kendi blogumuzu mu gösteriyor (gethanas.com/blog/…)? Öyleyse yazının adres kısmı; biçimi bozuksa null.
export function isOwnBlogUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return /^(?:www\.)?gethanas\.com$/i.test(u.hostname) && /^\/blog\//.test(u.pathname);
  } catch {
    return false;
  }
}

export function ownBlogSlug(url: string): string | null {
  if (!isOwnBlogUrl(url)) return null;
  const u = new URL(url);
  if (u.search || u.hash) return null;
  const slug = u.pathname.replace(/^\/blog\//, "").replace(/\/$/, "");
  return SLUG_RE.test(slug) ? slug : null;
}

// Kapak görselinin site içi yolu (/blog/images/x.jpg) ve public/ altındaki dosya yolu (images/x.jpg).
export const coverPath = (cover: string): string => cover.replace(/^https:\/\/(?:www\.)?gethanas\.com/i, "");
export const coverFile = (cover: string): string => coverPath(cover).replace(/^\/blog\//, "");

export type Frontmatter = z.infer<typeof frontmatterSchema>;

// Zod sorunlarını "alan: mesaj" satırlarına çevirir.
export function formatIssues(error: z.ZodError): string[] {
  return error.issues.map((i) => {
    if (i.code === "unrecognized_keys") return `bilinmeyen alan: ${i.keys.join(", ")}`;
    const path = i.path.length ? i.path.join(".") : "bilgi bloğu";
    return `${path}: ${i.message}`;
  });
}
