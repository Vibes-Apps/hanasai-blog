# hanas.ai blog

`https://gethanas.com/blog` ve yönetim ekranı `https://cms.gethanas.com`. Ürün çekirdeğinden (`Vibes-Apps/hanasai`) ayrı repo ve
ayrı Worker'lar; mimari kararı ve gerekçesi çekirdek repoda `docs/TECH_PLAN.md` §19. Yazarlar için: [docs/BLOG.md](docs/BLOG.md).

## Yapı

```
content/posts/*.md     yazılar (dosya adı = adres). Editörün yazdığı tek yer.
public/                _headers (blog CSP'si) ve images/ (CMS medya klasörü → /blog/images)
src/                   derleme: zod şeması, markdown-it kuralları, sayfa şablonları, RSS, sitemap → dist/
styles/blog.css        bloga özgü görünüm (site CSS'inin üstüne)
vendor/site/           çekirdek siteden kopya: üst çubuk, footer, CSS, font, favicon (npm run sync-site)
cms/                   yönetim ekranı: Sveltia CMS yapılandırması (config.ts), derleme (Vite), giriş Worker'ı (worker/auth.js)
scripts/               tarayıcı kontrolleri (blog-check, cms-check), sync-site
```

| Worker | Adres | Ne sunar | Deploy |
| --- | --- | --- | --- |
| `hanasai-blog` | route `gethanas.com/blog*` | yalnızca statik dosya (script yok, gizli değer yok) | GitHub Actions, `main`'e her push |
| `hanasai-cms` | custom domain `cms.gethanas.com` | Sveltia CMS (statik) + `/auth`, `/callback` (GitHub App girişi) | elle |

`gethanas.com/blog*` route'u aynı hostname'deki çekirdek Worker'ın (Custom Domain) önüne geçer; çekirdeğin diğer yolları etkilenmez.

### Bilgi bloğu (src/schema.ts, CMS alanları cms/config.ts; ikisi test ile eşit tutulur)

`title`, `description` (120–160), `date`, `updated`?, `author`?, `tags`? (≤ 6, küçük harf-tire), `draft`,
`cover`? + `coverAlt` (kapak varsa zorunlu), `canonical`?. Bilinmeyen alan derlemeyi durdurur.

- **Kapak (`cover`):** yalnızca `/blog/images/<dosya>.(jpg|jpeg|png|webp)` (ya da aynısının `https://gethanas.com` ile tam adresi);
  dosya `public/images/` altında olmalı (derleme denetler, 500 KB üstü uyarı). Yazı başında `<figure class="post-cover">`, liste ve ilgili
  yazı kartlarında küçük kapak; `og:image` + `og:image:alt` + `twitter:card=summary_large_image`. 1200×630 oranında gösterilir
  (`object-fit: cover`, genişlik/yükseklik verili, düzen kaymaz). CMS: görsel alanı yalnızca yükleme (`choose_url: false`), dosya adları
  slug'lanır, en çok 2 MB.
- **Canonical (`canonical`):** yalnızca `https://` tam adres. `<link rel="canonical">` ve `og:url` bu olur. Yazının kendi adresinden
  farklıysa yazı `sitemap.xml`'e girmez (listede ve RSS'te kalır).

## Komutlar

```
npm install
npm test                 # vitest: şema, taslaklar, kaçış/link filtresi, görseller, ilgili yazılar, sayfalar, RSS, sitemap
npm run typecheck
npm run lint
npm run build            # dist/ (taslaklar hariç; canlıya giden bu)
npm run build:drafts     # taslaklar dahil, yalnızca yerel önizleme
npm run dev              # build + wrangler dev → http://127.0.0.1:8790/blog/
npm run check            # tarayıcı: 390/1280 px taşma, CSP ihlali, konsol hatası (dev açıkken)
npm run sync-site        # vendor/site'ı canlı gethanas.com'dan yeniler
npm run cms:build        # cms/dist (canlı yapılandırma)
```

Git Bash'te `/blog/...` gibi argümanlar Windows yoluna çevrilir: `MSYS_NO_PATHCONV=1 npx tsx scripts/blog-check.mts --paths /blog/x`.

### Yönetim ekranı yerelde

- **Otomatik deneme (GitHub'sız):** `npx tsx cms/build.ts --test` ve `npx wrangler dev -c cms/wrangler.jsonc --port 8791`
  (ayrı pencerede), sonra `npx tsx scripts/cms-check.mts`. Sveltia'nın sahte deposu (tarayıcı belleği/OPFS) kullanılır.
  Akış: giriş → yeni yazı → hatalı kayıt reddedilir → gövde → önizleme → kaydet → listede; kaydedilen dosya `src/posts.ts`
  doğrulayıcısından geçmeli, CSP ihlali olmamalı.
- **Gerçek dosyalarla:** `npm run cms:build` ve `npx wrangler dev -c cms/wrangler.jsonc --port 8791`, Chrome/Edge'de
  http://localhost:8791 → **Work with Local Repository** → bu repo klasörünü seçin. Değişiklikler diske yazılır (commit sizde).
  Yazdıklarınızı `npm run build:drafts && npm run dev` ile görün.

## Yayın akışı

1. Editör CMS'te kaydeder → GitHub App'in kullanıcı token'ıyla `main`'e commit.
2. `.github/workflows/deploy.yml`: `npm ci` → `npm test` → `npm run build` → `wrangler versions upload` + `versions deploy`.
3. Token (`CLOUDFLARE_API_TOKEN`, repo secret): Cloudflare'de hesaba ait token "hanasai-blog GitHub Actions deploy", kapsam
   **yalnızca `hanasai-blog`**, rol Editor, route izni yok. **Bitiş: 2027-11-15**; süresi dolunca yayın durur (Actions'ta deploy
   adımı düşer). Yenilemek: aynı kapsamla yeni token → `gh secret set CLOUDFLARE_API_TOKEN -R Vibes-Apps/hanasai-blog`.
   Hesap kimliği repo değişkeni `CLOUDFLARE_ACCOUNT_ID`.
4. Hatalı içerik derlemeyi Türkçe mesajla durdurur; canlı site son iyi halinde kalır.

Route ve CMS deploy'u elle (hesap sahibinin `wrangler login`'iyle):

```
npm run build && npx wrangler deploy                                  # route değişirse
npm run cms:build && npx wrangler deploy -c cms/wrangler.jsonc        # yönetim ekranı
npx wrangler secret put GITHUB_CLIENT_SECRET -c cms/wrangler.jsonc    # değeri sahibi girer
```

## Yetki modeli

- **Editörler:** `Vibes-Apps/hanasai-blog`'da Write yetkisi olan GitHub kullanıcıları. Çekirdek repoya erişim gerekmez.
- **CMS girişi:** GitHub App (organizasyon altında, yalnızca bu repoya kurulu; izinler Contents RW + Metadata R). Kullanıcı
  token'ı = App izinleri ∩ kurulu repo ∩ kullanıcının yetkisi; 8 saatte bir `hanasai-cms` üzerinden yenilenir (refresh 6 ay).
  Token yönetim ekranının origin'inde (`cms.gethanas.com`) localStorage'da durur; `gethanas.com`'dan okunamaz.
- **Yönetim ekranının CSP'si** (`cms/static/_headers`) blogunkinden gevşek (`style-src 'unsafe-inline'`, `api.github.com`); bu
  yüzden ayrı origin'de. Script yalnızca `'self'` (Sveltia Vite ile derlenir, dış CDN yok).
- **Blog sayfalarının CSP'si** (`public/_headers`): `default-src 'none'`, script yok. `_headers` yolları `base_path` dahil tam
  yolla eşleşir (`/blog/assets/*`); yerelde doğrulandı.
- **Kalan risk:** blog `gethanas.com` ile aynı origin. Bu repoya yazabilen biri `/blog` altına JS koyabilir ve panele girişli
  bir kullanıcının oturumuyla panel isteği yapabilir. Editör sayısı az ve güvenilir tutulur; organizasyonda 2FA önerilir.
  Ekip dışından editör gelirse: içerik için ayrı repo ya da `blog.gethanas.com` (TECH_PLAN §19).

## Çekirdekle ortak parçalar (iki yerde duranlar)

| Parça | Çekirdekte | Blogda | Güncelleme |
| --- | --- | --- | --- |
| Üst çubuk, footer | `site/pages.ts` `headerHtml`/`footerHtml` | `vendor/site/header.html`, `footer.html` (+ Blog linki `src/shell.ts`) | `npm run sync-site` |
| Site CSS'i, font, favicon | `site/style.css`, `site/fonts/`, `site/static/favicon.svg` | `vendor/site/site.css`, `assets/`, `favicon.svg` | `npm run sync-site` |
| Güvenlik başlıkları | `site/static/_headers` | `public/_headers` (daha katı: script yok) | elle |
| CTA metni | landing "Early access" bölümü | `src/pages.ts` `postPage` | elle |
| Blog linki (footer) | bayrak, ilk yazı yayınlanınca açılır | her zaman | çekirdek repo |
| `robots.txt` | `Sitemap: https://gethanas.com/blog/sitemap.xml` | — | çekirdek repo |

Fiyatlar ve saklama süreleri blogda yok (yazılarda fiyat rakamı yazılmaz, `/#pricing`'e link verilir): kopyalanan olgu yok.

Sveltia sürümü sabit (`@sveltia/cms` 0.266.0, 1.0 öncesi; minor sürümler kırıcı olabilir). Yükseltirken `cms-check`'i çalıştırın.
Font Hanken Grotesk, SIL OFL 1.1 (`vendor/OFL-hanken-grotesk.txt`). Giriş Worker'ı sveltia-cms-auth, MIT (`cms/worker/LICENSE.txt`).
