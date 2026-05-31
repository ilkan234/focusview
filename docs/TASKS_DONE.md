# focusview — Tamamlananlar (Changelog)

> Biten işlerin arşivi. En yeni en üstte. Açık/yapılacak işler için → **[TASKS.md](TASKS.md)**.

## 6. tur — 2026-05-31
Uygulama içi WebView OAuth + sessiz giriş + segment yönetimi.

- **OAuth'u uygulama içi WebView'e taşı** ([SignInScreen.js](../src/screens/SignInScreen.js)) — Custom Tabs + GitHub Pages bridge + deep-link terkedildi. Expo Go'da hesap seçiminden sonra `exp://` deep-link'i Android'de "mail uygulamasıyla aç" seçicisini açıp girişi düşürüyordu. Artık token doğrudan redirect URL fragment'ından, uygulamadan çıkmadan okunuyor.
- **`disallowed_useragent` bypass** — WebView UA'sından `; wv` etiketi çıkarıldı (`BROWSER_UA`), Google embedded WebView'ı normal tarayıcı sayıyor.
- **Token fragment'ı injected JS ile okunuyor** — Android nav event'leri `#` kısmını sildiği için sayfaya prob enjekte edilip `onMessage` ile token geri yollanıyor; `onShouldStartLoadWithRequest` http(s) dışı tüm navigasyonları bloklayarak stray `exp://` redirect'inin seçici açmasını engelliyor.
- **Sessiz oto-yeniden giriş** — `storage.setHasSignedIn`/`getHasSignedIn` bayrağı; açılışta gizli WebView `prompt=none` ile token'ı sessizce yeniliyor (~12 sn timeout ile butona fallback). WebView `incognito` değil → Google oturum çerezi kalıcı.
- **Segment silme UI'ı** ([HomeScreen.js](../src/screens/HomeScreen.js)) — kartta ⋯ butonu / uzun basma → Edit/Delete menüsü, onaylı silme + anında liste güncellemesi.
- **Segment düzenleme** — `storage.updateSegment` eklendi; [CreateSegmentScreen.js](../src/screens/CreateSegmentScreen.js) `route.params.segment` ile düzenleme moduna geçiyor.
- **Native YouTube oynatıcı** ([VideoPlayerScreen.js](../src/screens/VideoPlayerScreen.js)) — WebView embed yerine `react-native-youtube-iframe`.

## 5. tur — 2026-05-19  *(6. turda terkedildi)*
Plan B: Custom Tabs + GitHub Pages bridge. (6. turda yerini uygulama içi WebView aldı.)

- WebView ile manuel OAuth da `disallowed_useragent` (403) ile patladı — Google embedded WebView'ları reddediyordu, UA spoof yetmedi.
- **Chrome Custom Tabs** flow'una geçildi: `expo-web-browser`'ın `openAuthSessionAsync`'i (Google bunu meşru tarayıcı sayar).
- **GitHub Pages bridge sayfası** ([docs/oauth.html](oauth.html)): Google'ın redirect ettiği statik HTTPS URL; JS state'ten `returnUrl`'i okuyup app'in runtime deep link'ine yönlendiriyordu.
- `expo-linking` ile `Linking.createURL('oauthredirect')` → runtime'a göre `exp://...`/`focusview://...` URL, state'in 2. parçasına `<csrf>::<returnUrl>` paketlenip GH Pages'a gönderiliyordu.
- `OAUTH_HTTPS_REDIRECT` config → `https://ilkan234.github.io/focusview/oauth.html`.
- [SignInScreen.js](../src/screens/SignInScreen.js) tek `WebBrowser.openAuthSessionAsync(...)` çağrısına sadeleştirildi.

## 4. tur — 2026-05-19  *(terkedildi)*
- `Google.useAuthRequest` → WebView ile manuel OAuth — Google'ın `disallowed_useragent` politikası nedeniyle kapandı, 5. turda yerini Custom Tabs aldı.

## 3. tur — 2026-05-19
API bağlantısı hazırlığı + repo kurulumu.

- Git init + GitHub remote (`origin` = https://github.com/ilkan234/focusview) + ilk commit + push.
- [src/config.js](../src/config.js) `.gitignore`'a alındı, [src/config.example.js](../src/config.example.js) template olarak commit edildi — gerçek ID'ler repo'ya kaçmaz.
- [app.json](../app.json) `android.package = "com.ilkan234.focusview"` eklendi.
- [.gitignore](../.gitignore) `.claude/` proje ayarları ignore'a alındı.
- **[docs/SETUP_OAUTH.md](SETUP_OAUTH.md)** — GCP proje, YouTube Data API enable, consent screen, Web/Android client kurulum rehberi + sık hatalar tablosu.

## Çekirdek özellikler — 2026-05-19
- [src/config.js](../src/config.js) — OAuth client ID slotları, Shorts süre eşiği, kota limitleri.
- [src/utils/storage.js](../src/utils/storage.js) — `saveToken` / `getToken` / `clearToken` (expiresAt damgalı, otomatik süre kontrolü).
- [src/utils/youtube.js](../src/utils/youtube.js) — YouTube Data API v3 istemcisi: `fetchAllSubscriptions`, `fetchUploadsPlaylistIds`, `fetchPlaylistVideoIds`, `fetchVideoDetails`, `parseDuration`, `isShort`, `matchesKeywords`, `fetchSegmentVideos`, `AuthError`.
- [src/screens/SegmentFeedScreen.js](../src/screens/SegmentFeedScreen.js) — loading state, pull-to-refresh, thumbnail + süre rozeti + kanal/zaman metası, boş durum, error state.
- [App.js](../App.js) — token varlığına göre initial route (`SignIn`/`Home`), tüm ekranlar register.
- [app.json](../app.json) — `"scheme": "focusview"`.

## Erken altyapı — ilk turlar
- Expo + React Native projesi kurulumu.
- React Navigation stack navigator.
- Tema dosyası ([src/theme.js](../src/theme.js)) — koyu palet.
- AsyncStorage segment CRUD ([src/utils/storage.js](../src/utils/storage.js)).
- [HomeScreen](../src/screens/HomeScreen.js) — segment listesi + boş durum.
- [CreateSegmentScreen](../src/screens/CreateSegmentScreen.js) — isim + keyword chip'leri ile yeni segment.

## Kurulum (GCP) — tamamlanan adımlar
- GCP'de "focusview" projesi oluşturuldu.
- YouTube Data API v3 etkinleştirildi.
- OAuth consent screen — External + test user.
- Android OAuth Client kod tabanından çıkarıldı (Expo Go geliştirme için gereksiz).
- `src/config.js`'e Web Client ID yapıştırıldı.
