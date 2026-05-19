# focusview — Proje Özeti

## Kısaca
**focusview**, kullanıcının YouTube hesabına bağlanan, abone olduğu kanalların videolarını **anahtar kelime tabanlı segmentlere** ayıran ve **Shorts'u tamamen filtreleyen** bir Android uygulamasıdır. Amaç: kullanıcıyı YouTube'un öneri algoritmasına maruz bırakmadan, sadece kendi seçtiği konulara odaklı bir izleme deneyimi sunmak.

## Teknoloji
- **React Native + Expo** (managed workflow, `expo: ~54`)
- **expo-auth-session** + **expo-web-browser** — Google OAuth (YouTube readonly scope)
- **@react-navigation/stack** — ekranlar arası navigasyon
- **@react-native-async-storage/async-storage** — segmentler ve OAuth token kalıcılığı
- **react-native-webview** — YouTube embed oynatıcı

## Mimari

```
focusview/
├── App.js                              # Stack navigator, token varsa Home / yoksa SignIn
├── app.json                            # Expo config + "scheme": "focusview"
├── src/
│   ├── config.js                       # OAuth client ID'leri, Shorts süre eşiği, kota limitleri
│   ├── theme.js                        # Renkler + spacing
│   ├── utils/
│   │   ├── storage.js                  # Segment + token CRUD (AsyncStorage)
│   │   └── youtube.js                  # YouTube Data API v3 istemcisi
│   └── screens/
│       ├── SignInScreen.js             # Google OAuth giriş
│       ├── HomeScreen.js               # Segment listesi (boş durumlu)
│       ├── CreateSegmentScreen.js      # Yeni segment (isim + keyword chip'leri)
│       ├── SegmentFeedScreen.js        # Segment için filtrelenmiş video listesi
│       └── VideoPlayerScreen.js        # WebView embed oynatıcı
└── docs/
    ├── PROJECT.md                      # (bu dosya)
    └── TASKS.md                        # iş takibi
```

## Veri Akışı

1. **Giriş** — `SignInScreen` Google OAuth ile **access token** alır, `storage.saveToken` ile `expiresAt` damgalı saklar.
2. **Segment oluşturma** — `CreateSegmentScreen` isim + keyword listesi alır, `storage.addSegment` ile kaydeder.
3. **Feed yükleme** — `SegmentFeedScreen` çalıştığında:
   - `subscriptions` → kullanıcının abone olduğu kanalları getir (en fazla `MAX_CHANNELS_SCANNED`)
   - `channels?part=contentDetails` → her kanalın `uploads` playlist ID'sini al
   - `playlistItems` → her playlist'in son `VIDEOS_PER_CHANNEL` videosunu al
   - `videos?part=contentDetails,snippet` → süre + meta verileri al
   - **Filtre**: süresi `SHORT_MAX_SECONDS` (varsayılan 60s) altındakileri at (Shorts)
   - **Filtre**: başlık/açıklamada en az bir keyword içerenleri tut
   - `publishedAt` desc sırala
4. **Oynatma** — `VideoPlayerScreen` `youtube.com/embed/{id}?rel=0&modestbranding=1` URL'sini WebView'da açar; `rel=0` ile YouTube'un ilgili videolar paneli kapatılır (filtrelenmemiş içerik sızmasın diye).

## Token Yönetimi
- **Implicit flow** kullanılıyor — access token ~1 saat geçerli, refresh token yok.
- Token süresi dolarsa `youtube.js` `AuthError` fırlatır; `SegmentFeedScreen` `clearToken` çağırıp `SignIn`'e yönlendirir.
- Refresh token istenirse PKCE/code flow'a geçmek gerekir (TASKS.md'de mevcut).

## Kota Notu
YouTube Data API v3 günlük varsayılan kota: **10,000 birim/gün**.
- 100 kanal taraması: ~100 birim
- Tüm videoların detayları: ~kanal_sayısı × 1 birim
- Bir tarama yaklaşık **200-300 birim** tüketir → günde rahatlıkla 30+ feed yenileme yapılabilir.

Limitler `src/config.js` üzerinden ayarlanabilir.

## Konfigürasyon — ÇALIŞTIRMADAN ÖNCE
1. [src/config.js](../src/config.js) içine **Google Cloud Console**'dan alınan OAuth client ID'lerini yapıştır:
   - `GOOGLE_WEB_CLIENT_ID` — Expo Go ile geliştirirken (auth proxy)
   - `GOOGLE_ANDROID_CLIENT_ID` — standalone Android build için
2. Aynı Google Cloud projesinde **YouTube Data API v3** etkin olmalı.
3. `npm run android` veya `expo start` → `a`.

## Renk Paleti (`src/theme.js`)
- Arkaplan: `#0F0F0F` (YouTube koyu temasına yakın)
- Yüzey: `#1A1A1A`
- Vurgu: `#FF4757` (canlı kırmızı CTA)
- Metin: `#FFFFFF` / ikincil `#888888`
