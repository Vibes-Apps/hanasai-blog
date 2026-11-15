import { readFileSync } from "node:fs";
import { BASE } from "./config.js";

// Üst çubuk ve footer, canlı gethanas.com'dan `npm run sync-site` ile vendor/site/'a kopyalanır (iki yerde duran
// parçaların listesi: docs/BLOG.md "Çekirdekle ortak parçalar"). Blog derlemesi ağa çıkmaz; yalnızca bu dosyaları okur.

export interface Shell {
  header: string;
  footer: string;
}

const BLOG_LI = `<li><a href="${BASE}/">Blog</a></li>`;

// Footer'ın "Company" sütununa Blog linki ekler (çekirdekteki link bayrakla açılır; blogda her zaman görünür).
export function withBlogLink(footer: string): string {
  if (footer.includes(`href="${BASE}/"`)) return footer;
  const re = /(<nav class="foot__col" aria-label="Company">[\s\S]*?<ul>[\s\S]*?<\/li>)/;
  if (!re.test(footer)) throw new Error('vendor/site/footer.html: "Company" sütunu bulunamadı; `npm run sync-site` çıktısını kontrol edin');
  return footer.replace(re, `$1${BLOG_LI}`);
}

export function loadShell(dir = "vendor/site"): Shell {
  const header = readFileSync(`${dir}/header.html`, "utf8").trim();
  const footer = withBlogLink(readFileSync(`${dir}/footer.html`, "utf8").trim());
  return { header, footer };
}
