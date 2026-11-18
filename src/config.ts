// Blogun sabitleri. Ürün yüzü yalnızca İngiliz İngilizcesi (çekirdek repo CLAUDE.md, "Hedef pazar").
// Blog, gethanas.com/blog altında ayrı bir Worker'dan sunulur (çekirdek repo TECH_PLAN §19).

export const SITE_URL = "https://gethanas.com";
export const BASE = "/blog";
export const BLOG_URL = `${SITE_URL}${BASE}/`;
export const LANG = "en-GB";

export const BLOG_TITLE = "Blog";
export const BLOG_DESCRIPTION =
  "Practical notes for boutique hotel owners in the UK on guest calls, booking requests and running a front desk with an AI receptionist.";
// Marka adı (VIB-72, sahibinin kararı 2026-11-18): sitede ve blogda "Hanas". Logodaki yazı (vendor/site, çekirdekten) aynı kalır.
export const BRAND = "Hanas";
// Çekirdek sitenin JSON-LD Organization kimliği (gethanas.com ana sayfasında tanımlı); yazıların yazarı ve yayıncısı.
export const ORG_ID = `${SITE_URL}/#org`;
export const ORG_LOGO = `${SITE_URL}/logo-512.png`;

export const FEED_TITLE = `${BRAND} blog`;

// Yönetim ekranındaki varsayılan da buradan gelir (cms/config.ts); CMS bir sonraki deploy'unda güncellenir.
export const DEFAULT_AUTHOR = `The ${BRAND} team`;
// Yazı sonundaki kutu landing'deki erken erişim formuna gider (aynı alan adı).
export const CTA_URL = "/#early-access";
export const WORDS_PER_MINUTE = 200;

// Gövdedeki görseller yalnızca bu kökenden ya da göreli yoldan olabilir (CSP img-src 'self').
export const OWN_HOSTS = ["gethanas.com", "www.gethanas.com"];
