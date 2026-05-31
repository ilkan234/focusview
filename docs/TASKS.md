# focusview — Görev Takibi

> Son güncelleme: 2026-05-31 (6. tur)

## Yapıldı

### 6. tur (2026-05-31) — Uygulama içi WebView OAuth + sessiz giriş + segment yönetimi
- [x] **OAuth'u uygulama içi WebView'e taşı** ([SignInScreen.js](../src/screens/SignInScreen.js)) — Custom Tabs + GitHub Pages bridge + deep-link terkedildi. Expo Go'da hesap seçiminden sonra `exp://` deep-link'i Android'de "mail uygulamasıyla aç" seçicisini açıp girişi düşürüyordu. Artık token doğrudan redirect URL fragment'ından, uygulamadan çıkmadan okunuyor.
- [x] **`disallowed_useragent` bypass** — WebView UA'sından `; wv` etiketi çıkarıldı (`BROWSER_UA`), Google embedded WebView'ı normal tarayıcı sayıyor.
- [x] **Token fragment'ı injected JS ile okunuyor** — Android nav event'leri `#` kısmını sildiği için sayfaya prob enjekte edilip `onMessage` ile token geri yollanıyor; `onShouldStartLoadWithRequest` http(s) dışı tüm navigasyonları bloklayarak stray `exp://` redirect'inin seçici açmasını engelliyor.
- [x] **Sessiz oto-yeniden giriş** — `storage.setHasSignedIn`/`getHasSignedIn` bayrağı; açılışta gizli WebView `prompt=none` ile token'ı sessizce yeniliyor (~12 sn timeout ile butona fallback). WebView `incognito` değil → Google oturum çerezi kalıcı.
- [x] **Segment silme UI'ı** ([HomeScreen.js](../src/screens/HomeScreen.js)) — kartta ⋯ butonu / uzun basma → Edit/Delete menüsü, onaylı silme + anında liste güncellemesi.
- [x] **Segment düzenleme** — `storage.updateSegment` eklendi; [CreateSegmentScreen.js](../src/screens/CreateSegmentScreen.js) `route.params.segment` ile düzenleme moduna geçiyor.
- [x] **Native YouTube oynatıcı** ([VideoPlayerScreen.js](../src/screens/VideoPlayerScreen.js)) — WebView embed yerine `react-native-youtube-iframe`.

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

### 5. tur (2026-05-19) — Plan B: Custom Tabs + GitHub Pages bridge
- [x] WebView ile manuel OAuth da `disallowed_useragent` (403) ile patladı — Google embedded WebView'ları reddediyor. UA spoof yetmedi.
- [x] **Chrome Custom Tabs** flow'una geç: `expo-web-browser`'ın `openAuthSessionAsync`'i. Google bunu meşru tarayıcı sayar.
- [x] **GitHub Pages bridge sayfası** ([docs/oauth.html](oauth.html)): Google'ın redirect ettiği statik HTTPS URL. JS state'ten `returnUrl`'i okuyup app'in runtime deep link'ine yönlendiriyor.
- [x] `expo-linking` kuruldu → `Linking.createURL('oauthredirect')` ile runtime'a göre `exp://...` veya `focusview://...` URL üretiliyor, state'in 2. parçasına `<csrf>::<returnUrl>` formatında paketlenip GH Pages'a gönderiliyor.
- [x] `OAUTH_HTTPS_REDIRECT` config → `https://ilkan234.github.io/focusview/oauth.html`.
- [x] [SignInScreen.js](../src/screens/SignInScreen.js) sadeleşti — Modal/WebView yok, tek `await WebBrowser.openAuthSessionAsync(...)` çağrısı + fragment parse + state doğrulama.

### 4. tur (2026-05-19) — Expo Go OAuth fix (terkedildi)
- [-] ~~`Google.useAuthRequest` → WebView ile manuel OAuth~~ — Google'ın `disallowed_useragent` politikası nedeniyle bu yol kapandı, 5. turda yerini Custom Tabs aldı.

### 3. tur (2026-05-19) — API bağlantısı hazırlığı
- [x] Git init + GitHub remote (`origin` = https://github.com/ilkan234/focusview) + ilk commit + push
- [x] [src/config.js](../src/config.js) `.gitignore`'a alındı, [src/config.example.js](../src/config.example.js) template olarak commit edildi — gerçek ID'ler artık yanlışlıkla repo'ya kaçmaz
- [x] [app.json](../app.json) `android.package = "com.ilkan234.focusview"` eklendi — Android OAuth client için gerekli
- [x] [.gitignore](../.gitignore) `.claude/` proje ayarları ignore'a alındı
- [x] **[docs/SETUP_OAUTH.md](SETUP_OAUTH.md)** — GCP'de proje, YouTube Data API enable, consent screen, Web client + Android client kurulum rehberi + sık hatalar tablosu

---

## ⚠️ Sen Yapacaksın — Çalıştırmadan Önce

> Bu adımları yapmak için → **[docs/SETUP_OAUTH.md](SETUP_OAUTH.md)** dosyasını takip et.

- [ ] **GitHub Pages'ı aç** (5. turdan sonra eklendi) — Settings → Pages → main branch / `/docs` folder → Save. `https://ilkan234.github.io/focusview/oauth.html` açılmalı.
- [x] ~~GCP'de "focusview" projesi oluştur~~
- [x] ~~YouTube Data API v3'ü etkinleştir~~
- [x] ~~OAuth consent screen — External + test user~~
- [ ] **Web OAuth Client'a yeni redirect URI ekle**: `https://ilkan234.github.io/focusview/oauth.html` *(eski `auth.expo.io/...` URI'sini silebilirsin)*
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
- [x] **Sessiz yeniden giriş** (6. tur) — implicit flow token ~1 saatte ölüyor ama açılışta gizli WebView `prompt=none` ile sessizce yeniliyor; kullanıcı tekrar giriş yapmıyor.
- [ ] **Refresh token desteği** — kalıcı çözüm için PKCE/code flow'a geçip refresh token saklamak. (Sessiz yeniden giriş çoğu durumu kapatıyor; bu artık düşük öncelik.)
- [ ] **Home'da "Sign out" butonu** — şu an çıkış yapmanın UI yolu yok; sadece `AuthError`'da otomatik clear oluyor. (Not: `focusview_signed_in` bayrağı da temizlenmeli.)

### Feed
- [ ] **Sayfalama** — şu an her segment için ilk N kanalın son 10 videosu, daha fazlasına "Load more" eklenebilir.
- [ ] **Önbellek (cache)** — her açılışta API'ye gitmek yerine, son sonuçları `AsyncStorage`'da saklayıp arka planda yenileme yapılabilir (TTL ~10dk).
- [ ] **Shorts eşiği** — şu an 60s. YouTube'un güncel 180s sınırına çekmek istenirse `SHORT_MAX_SECONDS = 180` ([src/config.js](../src/config.js)).
- [ ] **Keyword eşleştirme** — şu an basit `substring` arama (case-insensitive). Daha akıllı olsun istenirse tag'ler, kategoriler, fuzzy matching eklenebilir.
- [ ] **Açıklama uzunluğu** — videolar `description`'ı uzun olduğu için anahtar kelime başka bağlamda yanlış eşleşebiliyor. Sadece başlıkta arama opsiyonu eklenebilir.

### Home / Segment Yönetimi
- [x] **Segment silme UI'ı** (6. tur) — HomeScreen'de ⋯ / uzun basma → onaylı silme.
- [x] **Segment düzenleme** (6. tur) — CreateSegmentScreen düzenleme modu + `storage.updateSegment`.
- [ ] **Segment sıralama / sürükle-bırak**.

### Oynatıcı
- [x] **Native YouTube oynatıcı** (`react-native-youtube-iframe`) — WebView embed yerine geçildi (6. tur).
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
