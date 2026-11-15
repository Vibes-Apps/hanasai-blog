# Blog yazar kılavuzu

hanas.ai blogu **https://gethanas.com/blog** adresinde. Yazılar tarayıcıdan, yönetim ekranında yazılır ve yayınlanır:
**https://cms.gethanas.com**. Kod bilgisi gerekmez.

## Giriş

1. https://cms.gethanas.com adresini açın, **Sign in with GitHub**'a basın.
2. İlk girişte GitHub, "hanas.ai blog editor" uygulamasını yetkilendirmenizi ister. Uygulama yalnızca blog içeriğinin durduğu
   depoya (`Vibes-Apps/hanasai-blog`) erişir, başka hiçbir depoya erişmez.
3. Girebilmek için GitHub hesabınızın bu depoda yazma yetkisi olmalı. Yetkiyi depo sahibi verir.

Giriş 6 ay boyunca hatırlanır. Ortak bir bilgisayarda işiniz bitince sağ üstteki hesap menüsünden **Sign Out** yapın.
Arayüz tarayıcınızın diline göre Türkçe ya da İngilizce açılır; alan adları ve açıklamaları İngilizcedir.

## Yazı yazma ve yayınlama

1. **Posts → New**.
2. Alanları doldurun (aşağıdaki tablo). Sağdaki **Preview** paneli yazının metnini blog yazı tipiyle gösterir.
3. **Save**. Yeni yazı **taslak** olarak kaydedilir (Draft açık). Taslak sitede, RSS'te ve site haritasında görünmez.
4. Yayınlamak için **Draft** anahtarını kapatıp **Save**'e basın. Site yaklaşık **2 dakika** içinde güncellenir:
   `https://gethanas.com/blog/<adres>`.
5. Yayından kaldırmak için Draft'ı yeniden açıp kaydedin ya da yazıyı silin (**Delete**).

Kaydettiğiniz her değişiklik bir sürüm olarak saklanır. Yanlışlıkla silinen ya da bozulan bir yazı geri getirilebilir;
geliştiriciye haber verin.

### Yayınlanmadıysa

2–3 dakika sonra yazı görünmüyorsa yayın adımı hata vermiş olabilir:
https://github.com/Vibes-Apps/hanasai-blog/actions. Kırmızı satırı açın; hata mesajı Türkçedir ve dosya ile alan adını
söyler (ör. `content/posts/x.md: description: 120–160 karakter olmalı (şu an 98)`). Düzeltip yeniden kaydedin. Hata
varken site bozulmaz; son çalışan hali yayında kalır.

## Alanlar

| Alan | Kural | Nerede görünür |
| --- | --- | --- |
| **Title** | Zorunlu, en fazla 110 karakter. Cümle düzeninde (yalnızca ilk kelime ve özel adlar büyük harf), sonda nokta yok. | Sayfa başlığı, liste, paylaşım önizlemesi |
| **Description** | Zorunlu, **120–160 karakter** (sayaç alanın altında). Yazıyı bir iki cümleyle özetleyin. | Google sonuçları, link önizlemesi, liste |
| **Publish date** | Zorunlu. Yayın tarihi; liste yeniden eskiye bu tarihe göre sıralanır. | Yazı ve liste |
| **Updated** | İsteğe bağlı. Yalnızca yazıdaki bilgiyi değiştirdiyseniz (yazım düzeltmesi için değil). | Yazının üstünde "Updated …" |
| **Author** | İsteğe bağlı. Boş bırakılırsa "The hanas.ai team". | Yazının üstünde "By …" |
| **Tags** | İsteğe bağlı, en fazla 6. Küçük harf, rakam ve tire: `guest-calls`, `front-desk`. Var olan etiketleri tekrar kullanın. | Etiket sayfaları (`/blog/tag/<etiket>`), ilgili yazılar |
| **Draft** | Yeni yazıda açık. Kapatıp kaydetmek = yayınlamak. | — |
| **Body** | Yazının metni (zorunlu). | Yazı sayfası |

**Adres (slug):** yazı ilk kez kaydedilirken başlıktan üretilir (ör. *Answering guest calls at night* →
`answering-guest-calls-at-night`). Oluştururken değiştirebilirsiniz; sonradan değiştirilemez, çünkü paylaşılmış linkler kırılır.

Okuma süresi (dakikada yaklaşık 200 kelime), yazı sonundaki "Get early access" kutusu ve ilgili yazılar (önce ortak etiketli,
sonra en yeni yazılar) kendiliğinden eklenir.

## Metin biçimi

- Başlık (Title) sayfanın ana başlığıdır. Gövdede bölümler için **Heading 2**, alt bölümler için **Heading 3** kullanın.
- Kısa paragraflar: telefonda okunur. 2–4 cümle.
- Listeler, alıntı (quote), tablo, kod bloğu ve ayraç (hr) editörün araç çubuğunda.
- HTML yazmayın: gövdedeki HTML etiketleri metin olarak görünür, çalışmaz.
- Linkler `https://`, `mailto:` ya da sitemizdeki bir sayfa (ör. `/#how`) olabilir. Başka türdeki linkler link olmaz.

### Görseller

- Editörde görsel ekleyin; dosya depoya yüklenir ve `/blog/images/…` adresinden sunulur.
- Yalnızca kendi alan adımızdan görsel kullanılır; başka sitelerin görsel adresleri yazıyı yayınlatmaz.
- **Alt metin zorunlu**: görseli göremeyen biri için ne gösterdiğini bir cümleyle anlatın.
- Kapak görseli yok. Telif hakkı size ya da hanas.ai'ye ait olmayan görsel kullanmayın.

## Yazı kuralları

- **Dil:** İngiliz İngilizcesi (*organise, colour, enquiry*). Fiyat, tarih ve saat İngiltere biçiminde (15 November 2026).
- **Okur:** İngiltere'deki butik otel sahipleri. Pratik, kısa, jargon yok.
- **Kaynak ve tarih:** Rakipler hakkındaki her bilgi ve her olgu iddiası (istatistik, yasa, pazar verisi) kaynağa link verir ve
  okunduğu tarihi yazar: "… ([source](https://…), accessed 15 November 2026)". `/compare` sayfalarındaki gibi. Kaynağı olmayan
  iddia yazılmaz (İngiltere reklam kuralları, CAP Code).
- **Hukuki tavsiye yok:** "You must…", "This is legal…" gibi hukuki tavsiye olarak okunabilecek cümle yazmayın. Gerekirse
  resmi kaynağa yönlendirin (ICO, GOV.UK) ve "this is not legal advice" yazın.
- **Fiyat rakamı yazmayın:** paketler ve fiyatlar değişebilir; [pricing](/#pricing) bölümüne link verin.
- **Ürün hakkında:** yalnızca bugün çalışanı yazın; landing'de olmayan özellik vaat etmeyin (ör. PMS entegrasyonu "roadmap").
- **Alıntılar** gerçek kişilerden, izinle ve adıyla. Uydurma alıntı ya da müşteri yorumu yok.

## Örnek yazı

Bütün biçimleri gösteren örnek: `content/posts/example-post.md` (editörde "Example post: every format feature in one place").
**Taslaktır ve hiçbir zaman yayınlanmaz.** Kopyalamak için açın, kendi yazınızı yeni bir yazı olarak oluşturun.

## Geliştiriciye haber verilecekler

- **İlk yazı yayınlandığında:** landing'in footer'ındaki "Blog" linki çekirdek repoda bir bayrakla açılır (yazı yokken link
  gösterilmez).
- Landing'in görünümü ya da footer'ı değiştiğinde blogdaki kopyası güncellenir (README "Çekirdekle ortak parçalar").
- Yeni bir editör eklenecekse: depoda yazma yetkisi (GitHub → Settings → Collaborators).
