# OAuth & YouTube API Kurulum Rehberi

Bu adımların hepsi **Google Cloud Console** ve **terminal** üzerinde yapılır. Sonunda **Web Client ID** elde edeceksin — bunu `src/config.js`'e yapıştıracaksın. *(Android Client ID sadece standalone APK çıkardığında lazım, Expo Go ile geliştirme için gerek yok.)*

## Neden WebView ile manuel OAuth?

Expo SDK 50'den itibaren `expo-auth-session/providers/google` Android'de **mutlaka** `androidClientId` istiyor — ki bu da ancak standalone bir build varsa anlamlı (Expo Go'nun paket adı `host.exp.exponent` ve Google bu paket adını yeni client'lar için kabul etmiyor). Yani **Expo Go + Google.useAuthRequest** kombinasyonu artık geçmiyor.

Çözüm: [src/screens/SignInScreen.js](../src/screens/SignInScreen.js) Google'ın OAuth URL'sini bir `WebView` modal'ında açıyor, kullanıcı izin verdikten sonra Google'ın redirect ettiği URL'i WebView içinde yakalayıp fragment'taki `access_token`'ı çekiyor. Standart implicit-flow.

Bu yüzden:
- Sadece **Web Client ID** yeterli (Android Client'a gerek yok).
- Redirect URI sadece bir **string** — Google'ın bilmesi gereken o, hedef sayfanın gerçekten yüklenmesine gerek yok (biz WebView'da intercept ediyoruz).

> **Önemli**: `src/config.js` artık `.gitignore`'da. Gerçek ID'lerini koyduğunda commit'e dahil olmayacak. Kurulum için template'i kopyala:
> ```bash
> cp src/config.example.js src/config.js
> ```
> (Bu repo'da `config.js` zaten yerinde, yine de fresh clone yaparsan bu komutu çalıştırman gerekir.)

---

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

1. Sol menüden **OAuth Platform → Clients → "+ Create Client"** *(eski "APIs & Services → Credentials" sayfası hâlâ çalışır, ikisi de aynı yere gider)*.
2. Application type: **Web application**.
3. Name: `focusview-web`.
4. **Authorized redirect URIs** → şunu ekle (Expo username'ini değiştir):
   ```
   https://auth.expo.io/@SENIN_EXPO_KULLANICI_ADIN/focusview
   ```
   - Expo username'i bulmak için terminalde: `npx expo whoami` (Expo hesabın yoksa `npx expo register` ile aç).
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
