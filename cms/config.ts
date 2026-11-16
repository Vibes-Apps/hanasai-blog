import { BASE, DEFAULT_AUTHOR, SITE_URL } from "../src/config.js";
import { COVER_ALT_MAX, DESCRIPTION_MAX, DESCRIPTION_MIN, SLUG_RE, TAGS_MAX, TITLE_MAX } from "../src/schema.js";

// CMS'in kabul ettiği en büyük dosya (kapak ve gövde görselleri). Derleme 500 KB üstü kapak için uyarı verir.
export const COVER_MAX_BYTES = 2_000_000;

// Sveltia CMS yapılandırması. Alan kuralları blogun şemasından (src/schema.ts) gelir: editör kaydetmeden önce aynı hataları görür,
// derleme de aynı kurallarla doğrular. Arayüz metinleri İngilizce (Sveltia arayüzü İngilizce), açıklamalar kısa.

export const REPO = "Vibes-Apps/hanasai-blog";
export const CMS_ORIGIN = "https://cms.gethanas.com";

export type Mode = "production" | "test";

const slugPattern = (re: RegExp): [string, string] => [re.source, "Use lowercase letters, numbers and hyphens only, e.g. guest-calls"];

export function cmsConfig(mode: Mode): Record<string, unknown> {
  const backend =
    mode === "test"
      ? // Yalnızca yerel uçtan uca test: tarayıcı belleğinde sahte depo, GitHub'a gitmez.
        { name: "test-repo" }
      : {
          name: "github",
          repo: REPO,
          branch: "main",
          // Giriş Worker'ı yönetim ekranıyla aynı adreste (/auth, /callback): cms/worker/auth.js.
          base_url: CMS_ORIGIN,
          commit_messages: {
            create: "Blog: yeni yazı {{slug}}",
            update: "Blog: {{slug}} güncellendi",
            delete: "Blog: {{slug}} silindi",
            uploadMedia: "Blog: görsel {{path}}",
            deleteMedia: "Blog: görsel silindi {{path}}",
          },
        };

  return {
    load_config_file: false,
    backend,
    site_url: `${SITE_URL}${BASE}/`,
    display_url: `${SITE_URL}${BASE}/`,
    // Görseller depoda public/images'a yazılır, sitede /blog/images altından sunulur.
    media_folder: "public/images",
    public_folder: `${BASE}/images`,
    // Yüklenen dosya adları adrese uygun hale getirilir ("Lobby Photo (1).JPG" → "lobby-photo-1.jpg"), en çok 2 MB.
    media_libraries: { default: { config: { slugify_filename: true, max_file_size: COVER_MAX_BYTES } } },
    slug: { encoding: "ascii", clean_accents: true, sanitize_replacement: "-", lowercase: true, trim: true, maxlength: 80 },
    output: { omit_empty_optional_fields: true },
    collections: [
      {
        name: "posts",
        label: "Posts",
        label_singular: "Post",
        description: "Blog posts. New posts start as drafts. Turn Draft off and save to publish; the site updates in about two minutes.",
        folder: "content/posts",
        extension: "md",
        format: "frontmatter",
        create: true,
        delete: true,
        // Adres yalnızca oluştururken seçilir; sonradan değişirse eski linkler kırılır.
        slug: { template: "{{title}}", editable: ["create"] },
        preview_path: "{{slug}}",
        summary: "{{title}} · {{date}}",
        sortable_fields: { fields: ["date", "title"], default: { field: "date", direction: "descending" } },
        fields: [
          {
            name: "title",
            label: "Title",
            widget: "string",
            maxlength: TITLE_MAX,
            hint: "British English. Sentence case, no full stop.",
          },
          {
            name: "description",
            label: "Description",
            widget: "string",
            minlength: DESCRIPTION_MIN,
            maxlength: DESCRIPTION_MAX,
            hint: `${DESCRIPTION_MIN}–${DESCRIPTION_MAX} characters. Shown in search results, link previews and the post list.`,
          },
          {
            name: "cover",
            label: "Cover image",
            widget: "image",
            required: false,
            // Yalnızca buraya yüklenen dosya: başka sitelerin görsel adresi girilemez.
            choose_url: false,
            accept: "image/jpeg,image/png,image/webp",
            hint: "Optional. 1200 × 630 px JPG or PNG works best (it is also the picture in link previews). Under 500 KB; 2 MB at most.",
          },
          {
            name: "coverAlt",
            label: "Cover image alt text",
            widget: "string",
            required: false,
            maxlength: COVER_ALT_MAX,
            hint: "Required if there is a cover image: describe what the picture shows in one sentence.",
          },
          { name: "date", label: "Publish date", widget: "datetime", type: "date", default: "{{now}}" },
          { name: "updated", label: "Updated", widget: "datetime", type: "date", required: false, hint: "Only if you changed the facts in the post." },
          { name: "author", label: "Author", widget: "string", required: false, default: DEFAULT_AUTHOR },
          {
            name: "tags",
            label: "Tags",
            widget: "list",
            required: false,
            max: TAGS_MAX,
            field: { name: "tag", label: "Tag", widget: "string", pattern: slugPattern(SLUG_RE) },
            hint: `Up to ${TAGS_MAX}. Reuse existing tags where you can.`,
          },
          {
            name: "canonical",
            label: "Canonical URL",
            widget: "string",
            type: "url",
            required: false,
            pattern: ["^https://\\S+$", "Use a full address starting with https://"],
            hint: "Leave empty for most posts. Only if this post was first published somewhere else: paste that address. Search engines then treat that address as the original, and this post is left out of our sitemap.",
          },
          { name: "draft", label: "Draft", widget: "boolean", default: true, hint: "Drafts are never published. Turn off and save to publish." },
          {
            name: "body",
            label: "Body",
            widget: "markdown",
            // Başlık (h1) bilgi bloğundan gelir: gövdede ## ve ### kullanılır.
            buttons: ["bold", "italic", "code", "link", "heading-two", "heading-three", "quote", "bulleted-list", "numbered-list"],
            editor_components: ["image", "code-block", "table", "hr"],
          },
        ],
      },
    ],
  };
}
