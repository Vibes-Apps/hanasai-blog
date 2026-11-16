import { describe, expect, it } from "vitest";
import { isAllowedHref, isOwnImage, renderMarkdown } from "../src/markdown.js";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { COVER_WARN_BYTES, ContentError, loadPosts, parsePost, readingMinutes, relatedPosts, splitFrontmatter, tagIndex, type Post } from "../src/posts.js";
import { DESC, contentDir, post } from "./helpers.js";

const problemsOf = (fn: () => unknown): string[] => {
  try {
    fn();
  } catch (e) {
    if (e instanceof ContentError) return e.problems;
    throw e;
  }
  return [];
};

describe("bilgi bloğu doğrulaması", () => {
  it("geçerli yazıyı okur, varsayılanları doldurur", () => {
    const p = parsePost("guest-calls.md", post({ author: undefined, tags: undefined, draft: undefined }));
    expect(p.slug).toBe("guest-calls");
    expect(p.author).toBe("The hanas.ai team");
    expect(p.tags).toEqual([]);
    expect(p.draft).toBe(false);
  });

  it("CMS'in boş bıraktığı isteğe bağlı alanları yok sayar", () => {
    const p = parsePost("x.md", post({ updated: "", author: "", tags: null }));
    expect(p.updated).toBeUndefined();
    expect(p.author).toBe("The hanas.ai team");
    expect(p.tags).toEqual([]);
  });

  it("YAML'daki tırnaksız tarihi metin olarak okur", () => {
    const src = `---\ntitle: T\ndescription: "${DESC}"\ndate: 2026-11-15\n---\n\nBody.\n`;
    expect(parsePost("x.md", src).date).toBe("2026-11-15");
  });

  it.each([
    ["eksik başlık", { title: undefined }, "title: zorunlu alan eksik"],
    ["kısa açıklama", { description: "Too short." }, "description: 120–160 karakter olmalı (şu an 10)"],
    ["uzun açıklama", { description: "x".repeat(161) }, "description: 120–160 karakter olmalı (şu an 161)"],
    ["tarih biçimi", { date: "15/11/2026" }, "date: YYYY-AA-GG biçiminde olmalı"],
    ["olmayan tarih", { date: "2026-02-30" }, "date: geçerli bir tarih değil"],
    ["güncelleme önce", { date: "2026-11-10", updated: "2026-11-01" }, "updated: güncellenme tarihi yayın tarihinden önce olamaz"],
    ["etiket biçimi", { tags: ["Guest Calls"] }, "tags.0: etiket küçük harf"],
    ["aynı etiket", { tags: ["a", "a"] }, "tags: aynı etiket iki kez"],
    ["taslak türü", { draft: "yes" }, "draft: true ya da false olmalı"],
    ["bilinmeyen alan", { category: "hotels" }, "bilinmeyen alan: category"],
  ])("%s → anlaşılır hata", (_name, fm, expected) => {
    const problems = problemsOf(() => parsePost("bad-post.md", post(fm)));
    expect(problems.join("\n")).toContain(`content/posts/bad-post.md: ${expected}`);
  });

  it("bilgi bloğu yoksa ya da dosya adı adres olamıyorsa durur", () => {
    expect(problemsOf(() => parsePost("x.md", "# No front matter\n")).join()).toContain('"---" ile açılıp kapanan');
    expect(problemsOf(() => parsePost("Bad Name.md", post())).join()).toContain("dosya adı adres olur");
  });

  it("bütün dosyaların hatalarını tek seferde bildirir", () => {
    const dir = contentDir({ "a.md": post({ title: undefined }), "b.md": post({ date: "nope" }), "ok.md": post() });
    const problems = problemsOf(() => loadPosts(dir));
    expect(problems.some((p) => p.startsWith("content/posts/a.md: title"))).toBe(true);
    expect(problems.some((p) => p.startsWith("content/posts/b.md: date"))).toBe(true);
    expect(new ContentError(problems).message).toMatch(/^İçerik hatası, derleme durdu:/);
  });

  it("CRLF satır sonlarını ve BOM'u kabul eder", () => {
    expect(splitFrontmatter("﻿---\r\ntitle: x\r\n---\r\nBody")).toEqual({ yaml: "title: x", body: "Body" });
  });
});

describe("kapak görseli ve canonical", () => {
  const COVER = "/blog/images/example-cover.png";

  it("kapak alt metniyle birlikte geçer; kendi alan adımızla tam adres de olur", () => {
    expect(parsePost("x.md", post({ cover: COVER, coverAlt: "A teal card" })).cover).toBe(COVER);
    expect(parsePost("x.md", post({ cover: `https://gethanas.com${COVER}`, coverAlt: "A teal card" })).cover).toBe(`https://gethanas.com${COVER}`);
  });

  it.each([
    ["alt metinsiz kapak", { cover: COVER }, "coverAlt: kapak görseli varsa alt metni zorunlu"],
    ["başka sitedeki kapak", { cover: "https://evil.example/a.jpg", coverAlt: "x" }, "cover: kapak görseli CMS'ten yüklenmiş olmalı"],
    ["medya klasörü dışı", { cover: "/assets/a.jpg", coverAlt: "x" }, "cover: kapak görseli CMS'ten yüklenmiş olmalı"],
    ["SVG kapak", { cover: "/blog/images/a.svg", coverAlt: "x" }, "cover: kapak görseli CMS'ten yüklenmiş olmalı"],
    ["http canonical", { canonical: "http://example.com/post" }, "canonical: https:// ile başlayan tam bir adres olmalı"],
    ["göreli canonical", { canonical: "/blog/other" }, "canonical: https:// ile başlayan tam bir adres olmalı"],
    ["javascript canonical", { canonical: "javascript:alert(1)" }, "canonical: https:// ile başlayan tam bir adres olmalı"],
  ])("%s → anlaşılır hata", (_name, fm, expected) => {
    expect(problemsOf(() => parsePost("bad-post.md", post(fm))).join("\n")).toContain(`content/posts/bad-post.md: ${expected}`);
  });

  it("canonical yoksa kendi adresi; başka adres verilirse selfCanonical false; sondaki / aynı sayılır", () => {
    const own = parsePost("my-post.md", post());
    expect(own).toMatchObject({ url: "https://gethanas.com/blog/my-post", canonicalUrl: "https://gethanas.com/blog/my-post", selfCanonical: true });
    const ext = parsePost("my-post.md", post({ canonical: "https://www.linkedin.com/pulse/original-article" }));
    expect(ext).toMatchObject({ canonicalUrl: "https://www.linkedin.com/pulse/original-article", selfCanonical: false });
    expect(parsePost("my-post.md", post({ canonical: "https://gethanas.com/blog/my-post/" })).selfCanonical).toBe(true);
  });

  it("derlemede kapak dosyası yoksa durur, büyükse uyarır", () => {
    const missing = contentDir({ "a.md": post({ cover: "/blog/images/does-not-exist.jpg", coverAlt: "x" }) });
    expect(problemsOf(() => loadPosts(missing, { publicDir: "public" })).join()).toContain("cover: görsel dosyası bulunamadı (images/does-not-exist.jpg)");
    // publicDir verilmezse (ör. CMS önizlemesi) dosyaya bakılmaz.
    expect(loadPosts(missing)).toHaveLength(1);

    const pub = mkdtempSync(join(tmpdir(), "blog-public-"));
    mkdirSync(join(pub, "images"));
    writeFileSync(join(pub, "images", "big.jpg"), Buffer.alloc(COVER_WARN_BYTES + 1));
    const big = loadPosts(contentDir({ "a.md": post({ cover: "/blog/images/big.jpg", coverAlt: "x" }) }), { publicDir: pub });
    expect(big[0]!.warnings.join()).toContain("500 KB altı önerilir");
  });
});

describe("taslaklar", () => {
  it("varsayılan olarak dışarıda kalır, istenirse dahil edilir", () => {
    const dir = contentDir({ "live.md": post(), "secret.md": post({ draft: true }) });
    expect(loadPosts(dir).map((p) => p.slug)).toEqual(["live"]);
    expect(loadPosts(dir, { includeDrafts: true }).map((p) => p.slug).sort()).toEqual(["live", "secret"]);
  });

  it("taslak da doğrulanır (hatalı taslak derlemeyi durdurur)", () => {
    const dir = contentDir({ "live.md": post(), "draft.md": post({ draft: true, date: "bad" }) });
    expect(problemsOf(() => loadPosts(dir)).join()).toContain("content/posts/draft.md: date");
  });
});

describe("kaçış ve link filtresi", () => {
  it("ham HTML'i metin olarak kaçışlar", () => {
    const r = renderMarkdown('Hi <script>alert(1)</script> <img src=x onerror="alert(1)"> <b style="color:red">x</b>');
    expect(r.html).not.toMatch(/<script|<img|<b /);
    expect(r.html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it.each(["javascript:alert(1)", "JaVaScRiPt:alert(1)", "data:text/html,x", "vbscript:x", "file:///etc/passwd", "//evil.example/x", "tel:+441234"])(
    "%s link olmaz, düz metin kalır ve uyarı yazılır",
    (href) => {
      const r = renderMarkdown(`[click](${href})`);
      expect(r.html).not.toContain("<a ");
      expect(r.warnings.join()).toContain("izin verilmeyen link");
    },
  );

  it("kaçışlı karakterle gizlenmiş javascript: linki de etkisiz", () => {
    for (const src of ["[x](java&#09;script:alert(1))", "[x](&#106;avascript:alert(1))", "<javascript:alert(1)>", "[x][r]\n\n[r]: javascript:alert(1)"]) {
      const html = renderMarkdown(src).html;
      expect(html).not.toMatch(/href="\s*javascript:/i);
      expect(html).not.toMatch(/href="[^"]*&#106;/);
    }
  });

  it("http(s), mailto ve göreli linklere izin verir; dış linke rel=noopener ekler", () => {
    const r = renderMarkdown("[a](https://ico.org.uk/x) [b](https://gethanas.com/#pricing) [c](/#how) [d](mailto:hi@example.com) [e](../other-post)");
    expect(r.html).toContain('<a href="https://ico.org.uk/x" rel="noopener">a</a>');
    expect(r.html).toContain('<a href="https://gethanas.com/#pricing">b</a>');
    expect(r.html).toContain('<a href="/#how">c</a>');
    expect(r.html).toContain('<a href="mailto:hi@example.com">d</a>');
    expect(r.html).toContain('<a href="../other-post">e</a>');
    expect(r.warnings).toEqual([]);
  });

  it("satır içi stil üretmez; tabloyu kayan kutuya sarar", () => {
    const r = renderMarkdown("| a | b |\n| :-- | --: |\n| 1 | 2 |");
    expect(r.html).toContain('<div class="table-wrap"><table>');
    expect(r.html).not.toContain("style=");
    expect(r.html).toContain('<th class="ta-left">a</th>');
    expect(r.html).toContain('<td class="ta-right">2</td>');
  });

  it("gövdedeki h1'i h2'ye indirir ve uyarır", () => {
    const r = renderMarkdown("# Big\n\ntext");
    expect(r.html).toContain("<h2>Big</h2>");
    expect(r.warnings.join()).toContain("h2'ye indirildi");
  });

  it("isAllowedHref ve isOwnImage kuralları", () => {
    expect(isAllowedHref("/\\evil.example")).toBe(false);
    expect(isAllowedHref("#section")).toBe(true);
    expect(isOwnImage("/blog/images/a.png")).toBe(true);
    expect(isOwnImage("images/a.png")).toBe(true);
    expect(isOwnImage("https://gethanas.com/blog/images/a.png")).toBe(true);
    expect(isOwnImage("http://gethanas.com/a.png")).toBe(false);
    expect(isOwnImage("https://evil.example/a.png")).toBe(false);
    expect(isOwnImage("data:image/png;base64,AAAA")).toBe(false);
  });
});

describe("görseller", () => {
  it("kendi alan adımızdan, alt metinli görsel geçer", () => {
    const p = parsePost("x.md", post({}, "![A diagram of a call](/blog/images/a.svg)"));
    expect(p.html).toContain('<img src="/blog/images/a.svg" alt="A diagram of a call" loading="lazy" decoding="async">');
  });

  it("dış alan adından görsel ve alt metinsiz görsel derlemeyi durdurur", () => {
    expect(problemsOf(() => parsePost("x.md", post({}, "![A photo](https://evil.example/a.png)"))).join()).toContain("görsel yalnızca kendi alan adımızdan");
    expect(problemsOf(() => parsePost("x.md", post({}, "![](/blog/images/a.png)"))).join()).toContain("görselin alt metni yok");
  });

  it("javascript: adresli görsel hiç görsel olmaz, düz metin kalır", () => {
    const p = parsePost("x.md", post({}, "![x](javascript:alert(1))"));
    expect(p.html).not.toContain("<img");
    expect(p.warnings.join()).toContain("izin verilmeyen link");
  });
});

describe("okuma süresi, etiketler, ilgili yazılar", () => {
  it("dakikada ~200 kelime, en az 1 dakika", () => {
    expect(readingMinutes(1)).toBe(1);
    expect(readingMinutes(200)).toBe(1);
    expect(readingMinutes(201)).toBe(2);
    const p = parsePost("x.md", post({}, `${"word ".repeat(450)}`));
    expect(p.words).toBe(450);
    expect(p.readingMinutes).toBe(3);
  });

  const mk = (slug: string, date: string, tags: string[]): Post =>
    ({
      slug,
      date,
      tags,
      title: slug,
      description: DESC,
      author: "a",
      draft: false,
      url: `https://gethanas.com/blog/${slug}`,
      canonicalUrl: `https://gethanas.com/blog/${slug}`,
      selfCanonical: true,
      file: "",
      html: "",
      words: 1,
      readingMinutes: 1,
      warnings: [],
    }) as Post;

  it("ilgili yazılar: önce ortak etiket sayısı, sonra en yeniler; kendisi hariç, en fazla 3", () => {
    const me = mk("me", "2026-11-01", ["a", "b"]);
    const all = [me, mk("both", "2026-01-01", ["a", "b"]), mk("one-new", "2026-10-01", ["a"]), mk("one-old", "2026-02-01", ["b"]), mk("none-newest", "2026-11-05", ["z"])];
    expect(relatedPosts(me, all).map((p) => p.slug)).toEqual(["both", "one-new", "one-old"]);
    expect(relatedPosts(me, [me, mk("none", "2026-01-01", [])]).map((p) => p.slug)).toEqual(["none"]);
    expect(relatedPosts(me, [me])).toEqual([]);
  });

  it("etiket dizini alfabetik, yazılar sırasını korur", () => {
    const idx = tagIndex([mk("n", "2026-11-02", ["zeta", "alpha"]), mk("o", "2026-11-01", ["alpha"])]);
    expect([...idx.keys()]).toEqual(["alpha", "zeta"]);
    expect(idx.get("alpha")!.map((p) => p.slug)).toEqual(["n", "o"]);
  });
});
