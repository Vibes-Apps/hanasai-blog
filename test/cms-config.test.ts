import { describe, expect, it } from "vitest";
import { cmsConfig } from "../cms/config.js";
import { COVER_ALT_MAX, DESCRIPTION_MAX, DESCRIPTION_MIN, frontmatterSchema, TITLE_MAX } from "../src/schema.js";
import { TAGS, TAGS_MAX, TAGS_MIN } from "../src/tags.js";

// CMS alanları blog şemasıyla aynı kalmalı: biri değişip diğeri unutulursa bu test kırılır.
type Field = { name: string; widget: string; required?: boolean; minlength?: number; maxlength?: number; min?: number; max?: number; default?: unknown; type?: string };
const collection = (mode: "production" | "test") => (cmsConfig(mode).collections as { name: string; folder: string; fields: Field[] }[])[0]!;
const field = (name: string) => collection("production").fields.find((f) => f.name === name)!;

describe("CMS yapılandırması", () => {
  it("bilgi bloğu alanları şemanın alanlarıyla aynı (body hariç)", () => {
    const cms = collection("production").fields.map((f) => f.name).filter((n) => n !== "body").sort();
    // Zod 4: refine edilmiş strictObject'in şekli .shape üzerinden değil, iç şemadan okunur.
    const inner = (frontmatterSchema as unknown as { _zod: { def: { in?: { shape: object }; shape?: object } } })._zod.def;
    const shape = (inner.in?.shape ?? inner.shape) as object;
    expect(cms).toEqual(Object.keys(shape).sort());
  });

  it("uzunluk, etiket ve tarih kuralları şemadakiyle aynı", () => {
    expect(field("title").maxlength).toBe(TITLE_MAX);
    expect(field("description")).toMatchObject({ minlength: DESCRIPTION_MIN, maxlength: DESCRIPTION_MAX });
    // Sabit liste: işaret kutularıyla 2–4 seçim, değer adres kısmı, görünen ad label.
    expect(field("tags")).toMatchObject({ widget: "select", multiple: true, min: TAGS_MIN, max: TAGS_MAX, dropdown_threshold: TAGS.length });
    expect((field("tags") as Field & { options: unknown }).options).toEqual(TAGS.map((t) => ({ label: t.label, value: t.slug })));
    expect(field("date")).toMatchObject({ widget: "datetime", type: "date" });
    expect(field("updated")).toMatchObject({ widget: "datetime", type: "date", required: false });
    expect(field("draft")).toMatchObject({ widget: "boolean", default: true });
  });

  it("kapak görseli: yalnızca yükleme (dış adres yok), JPG/PNG/WebP, alt metin sınırı; canonical yalnızca https", () => {
    const cover = field("cover") as Field & { choose_url?: boolean; accept?: string };
    expect(cover).toMatchObject({ widget: "image", required: false, choose_url: false, accept: "image/jpeg,image/png,image/webp" });
    expect(field("coverAlt")).toMatchObject({ widget: "string", required: false, maxlength: COVER_ALT_MAX });
    const canonical = field("canonical") as Field & { pattern?: [string, string] };
    expect(canonical).toMatchObject({ widget: "string", type: "url", required: false });
    expect(new RegExp(canonical.pattern![0]).test("https://www.linkedin.com/pulse/x")).toBe(true);
    expect(new RegExp(canonical.pattern![0]).test("http://example.com")).toBe(false);
    expect(cmsConfig("production").media_libraries).toEqual({ default: { config: { slugify_filename: true, max_file_size: 2_000_000 } } });
  });

  it("içerik klasörü ve medya klasörü derlemenin okuduğu yerler", () => {
    const c = cmsConfig("production");
    expect(collection("production").folder).toBe("content/posts");
    expect(c).toMatchObject({ media_folder: "public/images", public_folder: "/blog/images", load_config_file: false });
  });

  it("canlıda GitHub, yerel testte sahte depo", () => {
    expect(cmsConfig("production").backend).toMatchObject({ name: "github", repo: "Vibes-Apps/hanasai-blog", branch: "main", base_url: "https://cms.gethanas.com" });
    expect(cmsConfig("test").backend).toEqual({ name: "test-repo" });
  });
});
