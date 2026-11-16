// Yönetim ekranının yerel uçtan uca kontrolü (headless Chrome, Sveltia "test-repo": tarayıcı belleğinde sahte depo).
// Akış: giriş → yeni yazı → alanları doldur → önizleme → kaydet → listede görünür. CSP ihlali ve konsol hatası olmamalı.
// Gerçek GitHub girişi otomatikleştirilemez; canlıda sahibi tarayıcıdan dener (docs/BLOG.md).
// Kullanım: npx tsx cms/build.ts --test && npx wrangler dev -c cms/wrangler.jsonc --port 8791  (ayrı pencerede), sonra
//   npx tsx scripts/cms-check.mts [--base http://127.0.0.1:8791] [--shots .wrangler/shots]
import { copyFileSync, mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { parsePost } from "../src/posts.js";
import { Browser, checker, type Page } from "./lib/cdp.mjs";

const { values } = parseArgs({ options: { base: { type: "string", default: "http://127.0.0.1:8791" }, shots: { type: "string", default: ".wrangler/shots" } } });
const B = values.base!.replace(/\/$/, "");
const SHOTS = values.shots!;
mkdirSync(SHOTS, { recursive: true });
const { check, failures } = checker();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Görünür metni içeren buton/linki tıklar (Sveltia arayüzü Svelte; seçiciler sürüme göre değişebilir, metinle aranır).
async function clickByText(page: Page, text: string | RegExp): Promise<boolean> {
  const re = text instanceof RegExp ? text.source : text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const flags = text instanceof RegExp ? text.flags : "";
  return page.eval<boolean>(`(() => {
    // Sveltia ikonları metin (ligature) olarak butona girer ("edit New"): metnin sonu eşleşir.
    const re = new RegExp(${JSON.stringify(`(^|\\s)${re}\\s*$`)}, ${JSON.stringify(flags)});
    const el = [...document.querySelectorAll("button, a, [role=button], [role=menuitem], [role=option]")].find((x) => re.test(x.textContent || "") && !x.disabled && x.getAttribute("aria-disabled") !== "true");
    if (!el) return false; el.click(); return true; })()`);
}

async function waitFor(page: Page, expr: string, ms = 15000): Promise<boolean> {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if (await page.eval<boolean>(`!!(${expr})`).catch(() => false)) return true;
    await sleep(200);
  }
  return false;
}

// Etiketi verilen alanın input/textarea'sını doldurur (etiket metni → en yakın alan kutusu).
async function fillField(page: Page, label: string, value: string): Promise<boolean> {
  return page.eval<boolean>(`(() => {
    const labels = [...document.querySelectorAll("label, [id$=-label], .field-label, h4, legend, span")].filter((l) => (l.textContent || "").trim().replace(/\\s*\\*$/, "") === ${JSON.stringify(label)});
    for (const l of labels) {
      let box = l;
      for (let i = 0; i < 6 && box; i++, box = box.parentElement) {
        const input = box.querySelector('input:not([type=checkbox]):not([type=hidden]), textarea');
        if (input) {
          const proto = input.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
          Object.getOwnPropertyDescriptor(proto, "value").set.call(input, ${JSON.stringify(value)});
          input.dispatchEvent(new Event("input", { bubbles: true }));
          input.dispatchEvent(new Event("change", { bubbles: true }));
          return true;
        }
      }
    }
    return false; })()`);
}

const TITLE = "Browser test post for the editor";
const COVER_ALT = "A pale teal card with the words Example cover image";
const DESC = "This description is written by the automated editor check. It needs between 120 and 160 characters to pass the same rule as the build.";

// Sveltia arayüz dilini tarayıcıdan seçer; metinle arandığı için test İngilizce arayüzle çalışır.
const browser = await Browser.launch(["--lang=en-GB", "--accept-lang=en-GB"]);
try {
  const page = await browser.page({ isolated: true });
  await page.viewport(1280, 900);
  await page.goto(`${B}/`);
  check("yönetim ekranı açıldı", await waitFor(page, `document.body.innerText.length > 20`), "");
  await sleep(1500);
  await page.screenshot(`${SHOTS}/cms-1-login.png`);
  const loginTexts = await page.eval<string[]>(`[...document.querySelectorAll("button")].map((b) => b.textContent.trim()).filter(Boolean)`);
  console.log("giriş ekranı butonları:", loginTexts.join(" | "));

  check("test deposuyla giriş", await clickByText(page, /(Work with Test Repository|Sign In|Log ?in).*/i));
  check("yazı listesi göründü", await waitFor(page, `/Posts/.test(document.body.innerText)`, 20000));
  await sleep(1000);
  await page.screenshot(`${SHOTS}/cms-2-list.png`);

  check("yeni yazı", await clickByText(page, /(New|Create)( Post)?/i));
  check("düzenleyici açıldı", await waitFor(page, `/Description/.test(document.body.innerText)`, 15000));
  await sleep(800);
  check("başlık", await fillField(page, "Title", TITLE));
  check("açıklama", await fillField(page, "Description", DESC));
  await sleep(500);
  await page.screenshot(`${SHOTS}/cms-3-editor.png`);
  const bodyText = await page.eval<string>("document.body.innerText");
  check("açıklama sayacı görünüyor (minlength/maxlength)", /\d+\s*\/\s*160/.test(bodyText) || /160/.test(bodyText), "");
  check("önizleme paneli var", await page.eval<boolean>(`!!document.querySelector("iframe") || /Preview/i.test(document.body.innerText)`));

  // Negatif: gövde boş ve açıklama kısa → kayıt reddedilir (derlemedeki kurallarla aynı).
  check("kısa açıklama", await fillField(page, "Description", "Too short."));
  check("kaydet (hatalı)", await clickByText(page, /Save( as Draft)?/i));
  await sleep(1200);
  check("hatalı yazı kaydedilmedi", await page.eval<boolean>(`/has an error|have errors|fields have/i.test(document.body.innerText) && /Creating/.test(document.body.innerText)`));
  await page.screenshot(`${SHOTS}/cms-4-invalid.png`);

  check("açıklama düzeltildi", await fillField(page, "Description", DESC));
  const focused = await page.eval<boolean>(`(() => { const ed = [...document.querySelectorAll('[contenteditable="true"]')].pop(); if (!ed) return false; ed.focus(); return true; })()`);
  check("gövde düzenleyicisi bulundu", focused);
  await page.typeText("This body was typed by the automated editor check.");
  await sleep(500);
  check("önizlemede gövde görünüyor", await waitFor(page, `[...document.querySelectorAll("iframe")].some((f) => { try { return /typed by the automated/.test(f.contentDocument.body.innerText); } catch { return false; } }) || /typed by the automated[\\s\\S]*typed by the automated/.test(document.body.innerText)`, 5000));

  // Kapak görseli: dosya adı bilerek boşluklu ve büyük harfli; CMS adresine uygun hale getirmeli (slugify_filename).
  const upload = join(mkdtempSync(join(tmpdir(), "cms-cover-")), "Example Cover (1).PNG");
  copyFileSync("public/images/example-cover.png", upload);
  await page.setFiles('input[type="file"]', [upload]);
  // Önizleme bir iframe içinde: kapak orada, yüklenmiş (naturalWidth > 0) bir resim olarak görünmeli.
  check(
    "kapak görseli yüklendi ve önizlemede",
    await waitFor(
      page,
      `[document, ...[...document.querySelectorAll("iframe")].map((f) => { try { return f.contentDocument; } catch { return null; } })].filter(Boolean)
        .some((d) => [...d.querySelectorAll("img")].some((i) => i.naturalWidth === 1200 && i.naturalHeight === 630))`,
      10000,
    ),
  );
  check("kapak alt metni", await fillField(page, "Cover image alt text", COVER_ALT));
  await page.screenshot(`${SHOTS}/cms-4b-cover.png`);

  // Etiketler: sabit listeden işaret kutusuyla 2 seçim (CMS en az 2 ister).
  // Sveltia kutunun adını ayrı bir öğeden bağlar (aria-labelledby); yoksa kutunun bulunduğu satırın metni.
  const NAME_OF = `const nameOf = (e) => (e.getAttribute("aria-label")
      || (e.getAttribute("aria-labelledby") || "").split(" ").map((id) => document.getElementById(id)?.textContent || "").join(" ")
      || e.closest("label")?.textContent || e.parentElement?.textContent || e.textContent || "").trim();`;
  const tick = (label: string) =>
    page.eval<boolean>(`(() => { ${NAME_OF}
      const box = [...document.querySelectorAll('[role="checkbox"], input[type="checkbox"]')].find((e) => {
        const text = nameOf(e);
        return text === ${JSON.stringify(label)} || text.endsWith(" " + ${JSON.stringify(label)});
      });
      if (!box) return false; box.click(); return true; })()`);
  const tagBoxes = await page.eval<string[]>(`(() => { ${NAME_OF} return [...document.querySelectorAll('[role="checkbox"], input[type="checkbox"]')].map(nameOf); })()`);
  check("10 etiket işaret kutusu olarak görünüyor", ["AI Receptionist", "Hotels & B&Bs", "Product News"].every((l) => tagBoxes.some((t) => t.endsWith(l))), tagBoxes.join(" | "));
  check("etiket: AI Receptionist", await tick("AI Receptionist"));
  check("etiket: Comparisons", await tick("Comparisons"));
  await sleep(400);
  await page.screenshot(`${SHOTS}/cms-4c-tags.png`);

  check("kaydet", await clickByText(page, /Save( as Draft)?/i));
  check("kaydedildi", await waitFor(page, `!/Creating/.test(document.body.innerText)`, 8000));
  await sleep(1000);
  await page.screenshot(`${SHOTS}/cms-5-saved.png`);
  // Test deposu bellekte: sayfa yenilenmez, uygulama içinde listeye dönülür.
  await page.eval(`location.hash = "#/collections/posts"`);
  check("listede görünüyor", await waitFor(page, `document.body.innerText.includes(${JSON.stringify(TITLE)})`, 10000));
  await page.screenshot(`${SHOTS}/cms-6-list.png`);

  // CMS'in yazdığı dosya (test deposu tarayıcının OPFS alanında) blogun doğrulayıcısından geçmeli: aynı şema.
  const files = await page.eval<Record<string, string>>(`(async () => {
    const root = await navigator.storage.getDirectory();
    let d = await root.getDirectoryHandle("sveltia-cms-test");
    for (const part of ["content", "posts"]) d = await d.getDirectoryHandle(part);
    const out = {};
    for await (const [name, h] of d.entries()) out[name] = await (await h.getFile()).text();
    return out; })()`);
  const images = await page.eval<string[]>(`(async () => {
    const root = await navigator.storage.getDirectory();
    let d = await root.getDirectoryHandle("sveltia-cms-test");
    for (const part of ["public", "images"]) d = await d.getDirectoryHandle(part);
    const out = [];
    for await (const [name] of d.entries()) out.push(name);
    return out; })()`).catch(() => [] as string[]);
  check("görsel dosyası public/images altına yazıldı", images.includes("example-cover-1.png"), images.join(", "));
  const names = Object.keys(files);
  check("CMS dosyayı content/posts altına yazdı", names.length === 1 && names[0] === "browser-test-post-for-the-editor.md", names.join(", "));
  try {
    const p = parsePost(names[0]!, files[names[0]!]!);
    check("CMS'in yazdığı dosya blog şemasından geçti", p.title === TITLE && p.description === DESC && p.draft === true && /^\d{4}-\d{2}-\d{2}$/.test(p.date));
    check("kapak yolu /blog/images altında, dosya adı düzeltilmiş", p.cover === "/blog/images/example-cover-1.png" && p.coverAlt === COVER_ALT, `${p.cover} | ${p.coverAlt}`);
    check("etiketler adres kısmıyla kaydedildi", JSON.stringify([...p.tags].sort()) === JSON.stringify(["ai-receptionist", "comparisons"]), p.tags.join(", "));
  } catch (e) {
    check("CMS'in yazdığı dosya blog şemasından geçti", false, `${(e as Error).message}\n${files[names[0]!]}`);
  }

  const errs = page.errors();
  check("CSP ihlali / konsol hatası yok", errs.length === 0, errs.slice(0, 5).join(" | "));
} finally {
  browser.close();
}
const n = failures();
console.log(n ? `\n${n} HATA` : "\nHepsi tamam.");
process.exit(n ? 1 : 0);
