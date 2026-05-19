# focusview — Görev Takibi

> Son güncelleme: 2026-05-19 (3. tur)

## Yapıldı

### Temel Altyapı
- [x] Expo + React Native projesi kurulumu
- [x] React Navigation stack navigator
- [x] Tema dosyası ([src/theme.js](../src/theme.js)) — koyu palet
- [x] AsyncStorage segment CRUD ([src/utils/storage.js](../src/utils/storage.js))

### Ekranlar
- [x] [HomeScreen](../src/screens/HomeScreen.js) — segment listesi + boş durum
- [x] [CreateSegmentScreen](../src/screens/CreateSegmentScreen.js) — isim + keyword chip'leri ile yeni segment

### Bu turda eklenenler (2026-05-19)
- [x] [src/config.js](../src/config.js) — OAuth client ID slotları, Shorts süre eşiği, kota limitleri
- [x] [src/utils/storage.js](../src/utils/storage.js) içine `saveToken` / `getToken` / `clearToken` (expiresAt damgalı, otomatik süresi dolma kontrolü)
- [x] [src/utils/youtube.js](../src/utils/youtube.js) — YouTube Data API v3 istemcisi:
  - `fetchAllSubscriptions`, `fetchUploadsPlaylistIds`, `fetchPlaylistVideoIds`, `fetchVideoDetails`
  - `parseDuration` (ISO 8601 → saniye), `isShort`, `matchesKeywords`
  - `fetchSegmentVideos` — orkestratör
  - `AuthError` sınıfı (401/403'de feed sign-in'e yönlendirsin diye)
- [x] [src/screens/SignInScreen.js](../src/screens/SignInScreen.js) — `Google.useAuthRequest` ile `youtube.readonly` scope, başarılı girişte token kaydı + Home'a `replace`
- [x] [src/screens/SegmentFeedScreen.js](../src/screens/SegmentFeedScreen.js) — loading state, pull-to-refresh, thumbnail + süre rozeti + kanal/zaman metası, boş durum, error state
- [x] [src/screens/VideoPlayerScreen.js](../src/screens/VideoPlayerScreen.js) — `react-native-webview` ile embed (`rel=0&modestbranding=1` → ilgili video paneli kapalı)
- [x] [App.js](../App.js) — token varlığına göre initial route (`SignIn` / `Home`), tüm yeni ekranlar register
- [x] [app.json](../app.json) — `"scheme": "focusview"` (native OAuth redirect için)

### 3. tur (2026-05-19) — API bağlantısı hazırlığı
- [x] Git init + GitHub remote (`origin` = https://github.com/ilkan234/focusview) + ilk commit + push
- [x] [src/config.js](../src/config.js) `.gitignore`'a alındı, [src/config.example.js](../src/config.example.js) template olarak commit edildi — gerçek ID'ler artık yanlışlıkla repo'ya kaçmaz
- [x] [app.json](../app.json) `android.package = "com.ilkan234.focusview"` eklendi — Android OAuth client için gerekli
- [x] [.gitignore](../.gitignore) `.claude/` proje ayarları ignore'a alındı
- [x] **[docs/SETUP_OAUTH.md](SETUP_OAUTH.md)** — GCP'de proje, YouTube Data API enable, consent screen, Web client + Android client kurulum rehberi + sık hatalar tablosu

---

## ⚠️ Sen Yapacaksın — Çalıştırmadan Önce

> Bu adımları yapmak için → **[docs/SETUP_OAUTH.md](SETUP_OAUTH.md)** dosyasını takip et.

- [ ] **GCP'de "focusview" projesi oluştur** (henüz yoksa)
- [ ] **YouTube Data API v3'ü etkinleştir** (APIs & Services → Library)
- [ ] **OAuth consent screen** — External, app adı focusview, scope `youtube.readonly`, kendi email'ini test user olarak ekle
- [ ] **Web OAuth Client oluştur** — authorized redirect URI: `https://auth.expo.io/@<expo-kullanici-adin>/focusview`
- [x] ~~Android OAuth Client~~ — Expo Go ile geliştirme için **gerekmiyor**, kod tabanından çıkarıldı. Standalone APK çıkarınca [SETUP_OAUTH.md § 5](SETUP_OAUTH.md#5-android-client-id-opsiyonel--sadece-standalone-apk-için)
- [x] **`src/config.js`'e Web Client ID yapıştırıldı**
- [ ] **GCP Web Client'a redirect URI eklendi mi**: `https://auth.expo.io/@ilkan1/focusview`
- [ ] **Gerçek cihazda smoke test**:
  - [ ] Sign-in akışı → token kaydı doğru mu
  - [ ] Bir segment oluştur → feed gerçekten dolu mu
  - [ ] Bir videoya tıkla → embed oynatıcı açılıyor mu
  - [ ] Pull-to-refresh çalışıyor mu
  - [ ] Token süresi dolduğunda (~1 saat) sign-in'e otomatik dönüş

---

## Bilinen Sınırlamalar — İleride Yapılacaklar

### Auth
- [ ] **Refresh token desteği** — şu an implicit flow, access token ~1 saat sonra ölüyor. PKCE/code flow'a geçilirse refresh token saklanıp sessizce yenilenebilir.
- [ ] **Home'da "Sign out" butonu** — şu an çıkış yapmanın UI yolu yok; sadece `AuthError`'da otomatik clear oluyor.

### Feed
- [ ] **Sayfalama** — şu an her segment için ilk N kanalın son 10 videosu, daha fazlasına "Load more" eklenebilir.
- [ ] **Önbellek (cache)** — her açılışta API'ye gitmek yerine, son sonuçları `AsyncStorage`'da saklayıp arka planda yenileme yapılabilir (TTL ~10dk).
- [ ] **Shorts eşiği** — şu an 60s. YouTube'un güncel 180s sınırına çekmek istenirse `SHORT_MAX_SECONDS = 180` ([src/config.js](../src/config.js)).
- [ ] **Keyword eşleştirme** — şu an basit `substring` arama (case-insensitive). Daha akıllı olsun istenirse tag'ler, kategoriler, fuzzy matching eklenebilir.
- [ ] **Açıklama uzunluğu** — videolar `description`'ı uzun olduğu için anahtar kelime başka bağlamda yanlış eşleşebiliyor. Sadece başlıkta arama opsiyonu eklenebilir.

### Home / Segment Yönetimi
- [ ] **Segment silme UI'ı** — `storage.deleteSegment` zaten var, sadece HomeScreen'de uzun basma veya swipe-to-delete bağlanmadı.
- [ ] **Segment düzenleme** — keyword ekle/çıkar mevcut bir segment için.
- [ ] **Segment sıralama / sürükle-bırak**.

### Oynatıcı
- [ ] **Native YouTube oynatıcı** (`react-native-youtube-iframe`) — WebView yerine, daha iyi tam ekran ve playback kontrolü.
- [ ] **Picture-in-picture** desteği.
- [ ] **İzlendi olarak işaretle** — izlenenler gri yapılabilir (lokal state, YouTube history'sini güncellemiyoruz).

### Kalite
- [ ] Error boundary
- [ ] Network bağlantı yoksa yumuşak hata mesajı
- [ ] Unit testler — özellikle `parseDuration`, `isShort`, `matchesKeywords`
- [ ] Tip güvenliği için TypeScript'e geçiş (opsiyonel)

---

## Açık Sorular (Karar Beklenenler)
- Shorts eşiği 60s mi 180s mı? (Şu an 60s)
- Bir segment için kanal başına kaç video taransın? (Şu an 10, max 100 kanal)
- Refresh token desteği MVP'de mi v2'de mi? (Şu an v2'de)
