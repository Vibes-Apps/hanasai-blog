import { z } from "zod";
import { DEFAULT_AUTHOR } from "./config.js";

// Yazının bilgi bloğu (front matter). CMS alanları (cms/config.ts) aynı kurallarla tanımlıdır; biri değişirse diğeri de değişir.
// Hatalı bilgi bloğu derlemeyi durdurur: mesajlar Türkçe, dosya ve alan adıyla (src/posts.ts).

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const DESCRIPTION_MIN = 120;
export const DESCRIPTION_MAX = 160;
export const TITLE_MAX = 110;
export const TAGS_MAX = 6;

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
        .array(z.string({ error: required("metin") }).regex(SLUG_RE, { error: "etiket küçük harf, rakam ve tireden oluşmalı (ör. guest-calls)" }), {
          error: required("liste"),
        })
        .max(TAGS_MAX, { error: `en fazla ${TAGS_MAX} etiket` })
        .refine((t) => new Set(t).size === t.length, { error: "aynı etiket iki kez yazılmış" })
        .default([]),
    ),
    draft: z.preprocess(emptyToUndefined, z.boolean({ error: required("true ya da false") }).default(false)),
  })
  .refine((d) => !d.updated || d.updated >= d.date, { error: "güncellenme tarihi yayın tarihinden önce olamaz", path: ["updated"] });

export type Frontmatter = z.infer<typeof frontmatterSchema>;

// Zod sorunlarını "alan: mesaj" satırlarına çevirir.
export function formatIssues(error: z.ZodError): string[] {
  return error.issues.map((i) => {
    if (i.code === "unrecognized_keys") return `bilinmeyen alan: ${i.keys.join(", ")}`;
    const path = i.path.length ? i.path.join(".") : "bilgi bloğu";
    return `${path}: ${i.message}`;
  });
}
