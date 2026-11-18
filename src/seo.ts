import { BRAND, LANG, ORG_ID, ORG_LOGO, SITE_URL } from "./config.js";
import type { Post } from "./posts.js";
import { coverPath } from "./schema.js";
import { tagLabel } from "./tags.js";

// Yapılandırılmış veri (JSON-LD), VIB-72 (çekirdek repo TECH_PLAN §28).
// - Yazı: BlogPosting (yazar ve yayıncı Organization "Hanas", kişi adı yok) + BreadcrumbList (Home › Blog › yazı).
// - /blog/ ve etiket sayfaları: BreadcrumbList + yazıların ItemList'i. noindex sayfalara yazılmaz (pages.ts).
// Organization'ın kendisi çekirdek sitenin ana sayfasında tanımlı (@id https://gethanas.com/#org); burada aynı kimlikle
// adı, adresi ve logosu tekrarlanır ki yazı sayfası tek başına da okunabilsin.
// CSP: <script type="application/ld+json"> bir veri bloğudur, çalıştırılmaz; blogun script'e izin vermeyen CSP'si onu
// engellemez (npm run check ile doğrulanır). "<" kaçırılır: metindeki "</script>" bloğu erken kapatamaz.
// Kapsam dışı: liste yazılarının ("7 best …") içeriğinden ItemList üretmek.

export type LdNode = Record<string, unknown>;

export function jsonLdScript(nodes: LdNode[]): string {
  const json = JSON.stringify({ "@context": "https://schema.org", "@graph": nodes }).replace(/</g, "\\u003c");
  return `<script type="application/ld+json">${json}</script>`;
}

const org = (): LdNode => ({ "@type": "Organization", "@id": ORG_ID, name: BRAND, url: `${SITE_URL}/`, logo: ORG_LOGO });

export function blogPosting(p: Post): LdNode {
  return {
    "@type": "BlogPosting",
    "@id": `${p.url}#article`,
    headline: p.title,
    description: p.description,
    url: p.url,
    datePublished: p.date,
    ...(p.updated ? { dateModified: p.updated } : {}),
    ...(p.cover ? { image: `${SITE_URL}${coverPath(p.cover)}` } : {}),
    author: org(),
    publisher: org(),
    // Canonical başka bir siteyi gösteriyorsa ana sayfa orası (yazı sitemap'e de girmez).
    mainEntityOfPage: { "@type": "WebPage", "@id": p.canonicalUrl },
    inLanguage: LANG,
    ...(p.tags.length ? { keywords: p.tags.map(tagLabel) } : {}),
  };
}

// Home › … ; son öğe sayfanın kendisi. items: [ad, tam adres].
export function breadcrumb(items: [string, string][]): LdNode {
  const all: [string, string][] = [["Home", `${SITE_URL}/`], ...items];
  return {
    "@type": "BreadcrumbList",
    itemListElement: all.map(([name, item], i) => ({ "@type": "ListItem", position: i + 1, name, item })),
  };
}

// Sayfadaki yazı listesi, sayfadaki sırayla (yeniden eskiye).
export function itemList(pageUrl: string, posts: Post[]): LdNode {
  return {
    "@type": "ItemList",
    "@id": `${pageUrl}#posts`,
    numberOfItems: posts.length,
    itemListElement: posts.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: p.url, name: p.title })),
  };
}
