import MarkdownIt, { type Env as MdEnv, type RendererRule } from "markdown-it";
import { OWN_HOSTS } from "./config.js";

// Yazı gövdesini HTML'e çevirir. Yalnızca derlemede çalışır (Worker'a kod girmez).
// Güvenlik kuralları (çekirdek repo TECH_PLAN §19):
// - Ham HTML kapalı: `<script>` gibi etiketler metin olarak kaçışlanır (html: false).
// - Linkler yalnızca http(s), mailto ve göreli olabilir; diğerleri (javascript:, data:, //dış) link olmaz, düz metin kalır.
// - Dış linklere rel="noopener".
// - Görseller yalnızca kendi alan adımızdan (göreli yol ya da https://gethanas.com) ve alt metni zorunlu; aksi derleme hatası.
// - Satır içi stil üretilmez (CSP style-src 'self').

const SCHEME_RE = /^([a-z][a-z0-9+.-]*):/i;
const ALLOWED_SCHEMES = new Set(["http", "https", "mailto"]);

// Protokolsüz dış adres ("//x.com", "/\x.com") tarayıcıda başka siteye gider: izin verilmez.
const isProtocolRelative = (u: string): boolean => /^[\\/]{2}/.test(u) || /^\/\\/.test(u);

export function isAllowedHref(url: string): boolean {
  const u = url.trim();
  if (!u || isProtocolRelative(u)) return false;
  const m = SCHEME_RE.exec(u);
  if (!m) return true;
  return ALLOWED_SCHEMES.has(m[1]!.toLowerCase());
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function isExternalHref(href: string): boolean {
  if (!/^https?:\/\//i.test(href)) return false;
  const host = hostOf(href);
  return host === null || !OWN_HOSTS.includes(host);
}

export function isOwnImage(src: string): boolean {
  const s = src.trim();
  if (!s || isProtocolRelative(s)) return false;
  const m = SCHEME_RE.exec(s);
  if (!m) return true;
  if (m[1]!.toLowerCase() !== "https") return false;
  const host = hostOf(s);
  return host !== null && OWN_HOSTS.includes(host);
}

export interface RenderResult {
  html: string;
  // Derlemeyi durduran sorunlar (görsel kuralları).
  problems: string[];
  // Derlemeyi durdurmayan uyarılar (etkisizleştirilen link, gövdedeki h1).
  warnings: string[];
  words: number;
}

interface Env extends MdEnv {
  problems: string[];
  warnings: string[];
}
const envOf = (env: MdEnv | undefined): Env => env as Env;
const attr = (v: string | number | null): string => (v === null ? "" : String(v));

const md = new MarkdownIt({ html: false, linkify: false, typographer: true });

let rejectedLinks: string[] = [];
md.validateLink = (url: string): boolean => {
  const ok = isAllowedHref(url);
  if (!ok) rejectedLinks.push(url);
  return ok;
};

const passThrough: RendererRule = (tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options);

const defaultLinkOpen = md.renderer.rules.link_open ?? passThrough;
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const t = tokens[idx]!;
  if (isExternalHref(attr(t.attrGet("href")))) t.attrSet("rel", "noopener");
  return defaultLinkOpen(tokens, idx, options, env, self);
};

const defaultImage = md.renderer.rules.image ?? passThrough;
md.renderer.rules.image = (tokens, idx, options, mdEnv, self) => {
  const env = envOf(mdEnv);
  const t = tokens[idx]!;
  const src = attr(t.attrGet("src"));
  const alt = self.renderInlineAsText(t.children ?? [], options, env).trim();
  if (!src) env.problems.push("görsel adresi geçersiz (yalnızca kendi alan adımızdan göreli yol ya da https://gethanas.com)");
  else if (!isOwnImage(src)) env.problems.push(`görsel yalnızca kendi alan adımızdan olabilir: ${src}`);
  if (!alt) env.problems.push(`görselin alt metni yok: ${src || "(adres yok)"}`);
  t.attrSet("loading", "lazy");
  t.attrSet("decoding", "async");
  return defaultImage(tokens, idx, options, env, self);
};

// Tablolar dar ekranda sayfayı taşırmasın: kendi kutusunda yatay kayar.
md.renderer.rules.table_open = () => '<div class="table-wrap"><table>\n';
md.renderer.rules.table_close = () => "</table></div>\n";

// Sütun hizası markdown-it'te style="text-align:…" olur; CSP satır içi stili engeller, sınıfa çevrilir (styles/blog.css).
for (const name of ["th_open", "td_open"] as const) {
  md.renderer.rules[name] = (tokens, idx, options, _env, self) => {
    const t = tokens[idx]!;
    const align = /text-align:\s*(left|center|right)/.exec(attr(t.attrGet("style")))?.[1];
    if (t.attrs) t.attrs = t.attrs.filter(([k]) => k !== "style");
    if (align) t.attrJoin("class", `ta-${align}`);
    return self.renderToken(tokens, idx, options);
  };
}

// Başlık (h1) bilgi bloğundan gelir; gövdedeki "# " başlıklar h2'ye indirilir.
md.core.ruler.push("demote_h1", (state) => {
  for (const t of state.tokens) {
    if ((t.type === "heading_open" || t.type === "heading_close") && t.tag === "h1") {
      t.tag = "h2";
      if (t.type === "heading_open") envOf(state.env).warnings.push("gövdede '# ' başlık var; h2'ye indirildi (alt başlıklar için ## ve ### kullanın)");
    }
  }
});

const ENTITY: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'" };

export function countWords(html: string): number {
  const text = html.replace(/<[^>]+>/g, " ").replace(/&(?:amp|lt|gt|quot|#39);/g, (e) => ENTITY[e] ?? " ");
  return text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

export function renderMarkdown(src: string): RenderResult {
  const env: Env = { problems: [], warnings: [] };
  rejectedLinks = [];
  const html = md.render(src, env);
  for (const url of new Set(rejectedLinks)) env.warnings.push(`izin verilmeyen link düz metin olarak bırakıldı: ${url}`);
  return { html, problems: env.problems, warnings: env.warnings, words: countWords(html) };
}
