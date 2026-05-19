# OAuth & YouTube API Kurulum Rehberi

Bu adımların hepsi **Google Cloud Console** ve **terminal** üzerinde yapılır. Sonunda iki ID elde edeceksin — bunları `src/config.js`'e yapıştıracaksın.

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

## 3. OAuth consent screen

1. Sol menü → **"APIs & Services" → "OAuth consent screen"**.
2. User Type: **External** → Create.
3. App information:
   - App name: `focusview`
   - User support email: kendi email'in
   - Developer contact: kendi email'in
   - Logo / domain alanlarını boş bırakabilirsin
4. **Scopes** ekranı → "Add or Remove Scopes" → manuel olarak şunu ekle:
   ```
   https://www.googleapis.com/auth/youtube.readonly
   ```
5. **Test users** ekranı → "Add Users" → kendi Google email'ini ekle. (App "Testing" modundayken sadece eklediğin test kullanıcıları sign-in olabilir; production'a geçmek için Google'ın verification sürecini geçmen lazım, MVP için Testing modu yeterli.)
6. Save & Continue → bitir.

## 4. Web Client ID (Expo Go için kritik)

1. **"APIs & Services" → "Credentials" → "+ Create Credentials" → "OAuth client ID"**.
2. Application type: **Web application**.
3. Name: `focusview-web`.
4. **Authorized redirect URIs** → şunu ekle (Expo username'ini değiştir):
   ```
   https://auth.expo.io/@SENIN_EXPO_KULLANICI_ADIN/focusview
   ```
   - Expo username'i bulmak için terminalde: `npx expo whoami` (Expo hesabın yoksa `npx expo register` ile aç).
5. Create → açılan dialog'tan **Client ID**'yi kopyala (`xxxx.apps.googleusercontent.com` formatında).

Bunu `src/config.js`'de `GOOGLE_WEB_CLIENT_ID` değişkenine yapıştır.

## 5. Android Client ID (standalone APK için)

> Eğer sadece Expo Go ile geliştireceksen bu adımı atlayabilirsin. Ama development build / production APK yapacaksan zorunlu.

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

1. **Credentials → "+ Create Credentials" → "OAuth client ID"**.
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
