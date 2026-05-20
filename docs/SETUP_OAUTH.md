# OAuth & YouTube API Kurulum Rehberi

Bu adımların hepsi **Google Cloud Console** ve **terminal** üzerinde yapılır. Sonunda **Web Client ID** elde edeceksin — bunu `src/config.js`'e yapıştıracaksın. *(Android Client ID sadece standalone APK çıkardığında lazım, Expo Go ile geliştirme için gerek yok.)*

## OAuth akışı (Plan B — Chrome Custom Tabs + GitHub Pages bridge)

Expo Go + Google OAuth iki kez zorluk çıkardı:

1. **`Google.useAuthRequest`** Android'de `androidClientId` istiyor — Expo Go'nun paket adı (`host.exp.exponent`) Google tarafından artık yeni client'larda kabul edilmediği için bu yol kapalı.
2. **Embedded WebView ile manuel OAuth** Google'ın "secure browser" politikasına takılıyor (`disallowed_useragent`, hata 403). UA spoof'u da yetmiyor.

Bu yüzden şu mimariye geçtik:

```
[App: SignInScreen]
       │
       │ WebBrowser.openAuthSessionAsync(authUrl, returnUrl)
       ↓                                       ↑
[Chrome Custom Tab]                            │ deep link: focusview://oauthredirect
       │                                       │            (Expo Go'da exp://...)
       │ Google sign-in + consent              │
       ↓                                       │
[Google → redirect_uri]                        │
       │                                       │
       │ HTTP 302 with #access_token=...       │
       ↓                                       │
[ilkan234.github.io/focusview/oauth.html] ─────┘
       (Pages bridge — JS reads state, deep-links back)
```

- `expo-web-browser`'ın `openAuthSessionAsync`'i Chrome Custom Tab açar → Google bunu meşru tarayıcı sayar, `disallowed_useragent` yok.
- Google'ın `redirect_uri` olarak gördüğü URL **statik** olmak zorunda (GCP'de kayıtlı) ama Expo Go'da app'in deep link URL'i runtime'da değişiyor (`exp://<lan-ip>:<port>/--/oauthredirect`). Çözüm: `state` parametresine `<csrf>::<returnUrl>` paketleyip GitHub Pages'daki bridge sayfasına gönderiyoruz, oradaki JS state'i okuyup app'in dinamik deep link'ine yönlendiriyor.
- App tarafında `Linking.createURL('oauthredirect')` runtime'a göre doğru URL'i üretiyor.

Bu yüzden:
- Sadece **Web Client ID** yeterli (Android Client'a hâlâ gerek yok).
- GCP'de Authorized redirect URI olarak **GitHub Pages bridge URL'in** kayıtlı olmalı.
- GitHub Pages'ı bu repo'nun `/docs` klasöründen serve etmen lazım (kurulum aşağıda).

> **Önemli**: `src/config.js` artık `.gitignore`'da. Gerçek ID'lerini koyduğunda commit'e dahil olmayacak. Kurulum için template'i kopyala:
> ```bash
> cp src/config.example.js src/config.js
> ```
> (Bu repo'da `config.js` zaten yerinde, yine de fresh clone yaparsan bu komutu çalıştırman gerekir.)

---

## 0. GitHub Pages'ı aç (Plan B köprü sayfası için)

1. GitHub'da `ilkan234/focusview` repo'sunu aç → **Settings → Pages**.
2. **Source**: `Deploy from a branch` → **Branch**: `main` → **Folder**: `/docs` → **Save**.
3. ~1 dk bekle, sonra şu URL açılıyor mu kontrol et:
   ```
   https://ilkan234.github.io/focusview/oauth.html
   ```
   "Signing you in… / Sign-in failed: No data returned from Google." görmelisin (boş ziyarette beklenen davranış, hata mesajı değil).
4. **Bu URL'i bir kenara not et — Adım 4'te GCP'ye redirect URI olarak gireceğiz.**

> Sayfa `docs/oauth.html`'dan serve ediliyor; Jekyll'i devre dışı bırakmak için `docs/.nojekyll` da var. Markdown dosyaları da serve olabilir ama önemli değil — sadece `oauth.html`'i kullanıyoruz.

## 1. Google Cloud projesi

1. https://console.cloud.google.com → sağ üstte proje seçiciden **"New Project"**.
2. İsim: `focusview` (önemli değil, sadece sen göreceksin).
3. Proje oluştuktan sonra seçici listeden seç.

## 2. YouTube Data API v3'ü etkinleştir

1. Sol menü → **"APIs & Services" → "Library"**.
2. Arama: `YouTube Data API v3` → **Enable**.

## 3. OAuth consent screen (yeni UI — 2025)

Google bu sayfayı tek wizard'dan ayrı sekmelere böldü. Sol menü → **"APIs & Services" → "OAuth consent screen"** dediğinde "OAuth Overview" dashboard'una düşersin. **Soldaki alt menüde** şu sekmeler var:

```
OAuth Platform
├── Overview        ← dashboard / metrikler
├── Branding        ← (3.1) app adı, logo, support email
├── Audience        ← (3.2) USER TYPE: EXTERNAL + Test users
├── Clients         ← (§ 4 ve § 5) OAuth Client ID'leri
└── Data Access     ← (3.3) youtube.readonly scope
```

### 3.1 Branding
- App name: `focusview`
- User support email: kendi email'in
- Developer contact info: kendi email'in
- Logo / domain alanlarını boş bırakabilirsin
- **Save**

### 3.2 Audience
- User type: **External** (bu MVP için doğru seçim — Internal sadece Google Workspace organizasyonu içinse)
- External seçince **Test users** bölümü açılır → "+ Add users" → kendi Gmail adresini ekle. App "Testing" modundayken **sadece eklediğin test kullanıcıları** sign-in olabilir; bu MVP için yeterli, production'a verification başvurusu olmadan koymak gerekmez.
- **Save**

### 3.3 Data Access
- "Add or remove scopes" → arama kutusuna yapıştır:
  ```
  https://www.googleapis.com/auth/youtube.readonly
  ```
- Seç → Update → **Save**

> Eski wizard'ı bekliyorsan: yok, Google sildi. Sıralama önemli değil, üç sekmeyi de doldurman yeterli.

## 4. Web Client ID (Expo Go için kritik)

> Eğer Web Client'ı zaten oluşturduysan, **sadece authorized redirect URI'sini güncelle**: `https://ilkan234.github.io/focusview/oauth.html` ekle. Eski `auth.expo.io/...` URI'si artık kullanılmıyor, silebilirsin.

1. Sol menüden **OAuth Platform → Clients → "+ Create Client"** *(eski "APIs & Services → Credentials" sayfası hâlâ çalışır, ikisi de aynı yere gider)*.
2. Application type: **Web application**.
3. Name: `focusview-web`.
4. **Authorized redirect URIs** → şunu ekle (Adım 0'da Pages için aldığın URL):
   ```
   https://ilkan234.github.io/focusview/oauth.html
   ```
   - URL tam olarak böyle olmalı, sondaki slash yok. GitHub user'ın farklıysa o kısmı değiştir.
5. Create → açılan dialog'tan **Client ID**'yi kopyala (`xxxx.apps.googleusercontent.com` formatında).

Bunu `src/config.js`'de `GOOGLE_WEB_CLIENT_ID` değişkenine yapıştır.

## 5. Android Client ID (opsiyonel — sadece standalone APK için)

> **Expo Go ile geliştirme yapıyorsan bu bölümü atla.** Bu kısım ileride gerçek bir APK build'i (development build veya production APK) çıkardığında lazım olacak. O zamana kadar `GOOGLE_ANDROID_CLIENT_ID` config'de hiç yer almasın.

> Android Client'ı eklediğinde [src/config.js](../src/config.js) ve [src/screens/SignInScreen.js](../src/screens/SignInScreen.js) içine `GOOGLE_ANDROID_CLIENT_ID` export'unu ve `Google.useAuthRequest`'in `androidClientId` argümanını geri eklemen gerekecek.

### 5.1 SHA-1 fingerprint'ini al

**Debug build için** (Expo'nun otomatik oluşturduğu debug keystore'u kullanmak için EAS gerek):
```bash
npx eas credentials
```
- Platform: Android
- Profile: development veya preview
- Action: "Set up a new keystore" veya mevcut keystore'u listele
- EAS sana SHA-1'i gösterecek (`SHA1 Fingerprint: AA:BB:CC:...` formatında).

Alternatif olarak local debug keystore varsa:
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```
(Windows'ta `%USERPROFILE%\.android\debug.keystore`)

### 5.2 Android client oluştur

1. **OAuth Platform → Clients → "+ Create Client"**.
2. Application type: **Android**.
3. Name: `focusview-android`.
4. Package name: `com.ilkan234.focusview` *(app.json'da bu yazıyor, değiştireceksen ikisini de güncelle)*.
5. SHA-1 certificate fingerprint: 5.1'de aldığın değer.
6. Create → Client ID'yi kopyala.

Bunu `src/config.js`'de `GOOGLE_ANDROID_CLIENT_ID` değişkenine yapıştır.

---

## 6. Test

```bash
npx expo start
```
- Telefonunda Expo Go aç, QR kodu okut.
- Sign in with Google → Google'ın izin ekranı → izin ver.
- Geri uygulamaya dönüş → Home ekranı görünmeli.
- "+ New" → segment oluştur → tıkla → feed videoları getirmeli.

---

## Sık karşılaşılan hatalar

| Hata | Sebep | Çözüm |
|---|---|---|
| `redirect_uri_mismatch` | Web client'ın authorized redirect URI'si Expo proxy URL'siyle uyuşmuyor | URL tam olarak `https://auth.expo.io/@KULLANICI_ADI/focusview` olmalı, sonda slash yok |
| `Access blocked: focusview has not completed the Google verification process` | App "Testing" modunda ve sen test user olarak eklenmemişsin | Adım 3.5'e dön, kendini test user olarak ekle |
| `403 youtube.subscriptions.list` | YouTube Data API v3 etkin değil veya quota doldu | Adım 2'yi kontrol et, quota için GCP → APIs & Services → Quotas |
| Sign-in açılıyor ama hemen "cancel" tipinde geri dönüyor | Expo Go vs standalone client ID karışıklığı | Expo Go'da SADECE web client ID kullanılır; android client'ı için development build gerekir |
| Feed boş geliyor | Aboneliklerin yok, veya keyword'lerin hiçbir başlıkla eşleşmiyor | YouTube hesabında en az birkaç kanal subscribe et, keyword'leri daha genel tut |

---

## Test sonrası

Çalıştığını doğrulayınca [docs/TASKS.md](TASKS.md) içindeki ilgili checkbox'ları işaretle (`- [ ]` → `- [x]`).
