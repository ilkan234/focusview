# focusview — Proje Özeti

## Kısaca
**focusview**, kullanıcının YouTube hesabına bağlanan, abone olduğu kanalların videolarını **anahtar kelime tabanlı segmentlere** ayıran ve **Shorts'u tamamen filtreleyen** bir Android uygulamasıdır. Amaç: kullanıcıyı YouTube'un öneri algoritmasına maruz bırakmadan, sadece kendi seçtiği konulara odaklı bir izleme deneyimi sunmak.

## Teknoloji
- **React Native + Expo** (managed workflow, `expo: ~54`)
- **react-native-webview** — uygulama içi Google OAuth (YouTube readonly scope); dış tarayıcı/deep-link köprüsü kullanılmıyor
- **@react-navigation/stack** — ekranlar arası navigasyon
- **@react-native-async-storage/async-storage** — segmentler ve OAuth token kalıcılığı
- **react-native-youtube-iframe** — YouTube oynatıcı (eski WebView embed yerine)

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
│       ├── SignInScreen.js             # Uygulama içi WebView OAuth + sessiz oto-yeniden giriş
│       ├── HomeScreen.js               # Segment listesi (boş durumlu) + ⋯/uzun bas → düzenle/sil
│       ├── CreateSegmentScreen.js      # Segment oluştur VE düzenle (isim + keyword chip'leri)
│       ├── SegmentFeedScreen.js        # Segment için filtrelenmiş video listesi
│       └── VideoPlayerScreen.js        # react-native-youtube-iframe oynatıcı
└── docs/
    ├── PROJECT.md                      # (bu dosya)
    ├── TASKS.md                        # açık / yapılacak işler
    └── TASKS_DONE.md                   # tamamlananlar (changelog)
```

## Veri Akışı

1. **Giriş** — `SignInScreen` uygulama içi WebView'de Google OAuth (implicit flow) ile **access token** alır, `storage.saveToken` ile `expiresAt` damgalı saklar ve `storage.setHasSignedIn` bayrağını kaydeder. Sonraki açılışlarda gizli bir WebView `prompt=none` ile token'ı sessizce yeniler.
2. **Segment oluşturma / düzenleme** — `CreateSegmentScreen` isim + keyword listesi alır; `route.params.segment` varsa düzenleme modunda `storage.updateSegment`, yoksa `storage.addSegment` çağırır. `HomeScreen`'de ⋯ menüsü / uzun basma ile düzenleme veya `storage.deleteSegment` tetiklenir.
3. **Feed yükleme** — `SegmentFeedScreen` çalıştığında:
   - `subscriptions` → kullanıcının abone olduğu kanalları getir (en fazla `MAX_CHANNELS_SCANNED`)
   - `channels?part=contentDetails` → her kanalın `uploads` playlist ID'sini al
   - `playlistItems` → her playlist'in son `VIDEOS_PER_CHANNEL` videosunu al
   - `videos?part=contentDetails,snippet` → süre + meta verileri al
   - **Filtre**: süresi `SHORT_MAX_SECONDS` (varsayılan 60s) altındakileri at (Shorts)
   - **Filtre**: başlık/açıklamada en az bir keyword içerenleri tut
   - `publishedAt` desc sırala
4. **Oynatma** — `VideoPlayerScreen` `react-native-youtube-iframe` ile videoyu oynatır; ilgili videolar paneli kapalı tutulur (filtrelenmemiş içerik sızmasın diye).

## Token Yönetimi
- **Implicit flow** kullanılıyor — access token ~1 saat geçerli, refresh token yok.
- **Sessiz yeniden giriş:** ilk başarılı girişten sonra `focusview_signed_in` bayrağı saklanır. Her açılışta token süresi dolmuşsa `SignInScreen` gizli bir WebView'de `prompt=none` ile yeni token alır — kullanıcı hiçbir şey görmez. WebView `incognito` **değildir**, böylece Google oturum çerezi açılışlar arası korunur.
- Sessiz deneme başarısız olursa (oturum yok / etkileşim gerek) ~12 sn'lik timeout sonrası sessizce giriş butonuna düşülür.
- Token süresi dolarsa `youtube.js` `AuthError` fırlatır; `SegmentFeedScreen` `clearToken` çağırıp `SignIn`'e yönlendirir.
- Sonsuz geçerli oturum için PKCE/code flow + refresh token gerekir (TASKS.md'de mevcut).

## Kota Notu
YouTube Data API v3 günlük varsayılan kota: **10,000 birim/gün**.
- 100 kanal taraması: ~100 birim
- Tüm videoların detayları: ~kanal_sayısı × 1 birim
- Bir tarama yaklaşık **200-300 birim** tüketir → günde rahatlıkla 30+ feed yenileme yapılabilir.

Limitler `src/config.js` üzerinden ayarlanabilir.

## Konfigürasyon — ÇALIŞTIRMADAN ÖNCE
1. [src/config.js](../src/config.js) içine **Google Cloud Console**'dan alınan değerleri yapıştır:
   - `GOOGLE_WEB_CLIENT_ID` — OAuth Web client ID
   - `OAUTH_HTTPS_REDIRECT` — redirect URI; Google Cloud Console'da **yetkili redirect URI** olarak kayıtlı olmalı (uygulama içi WebView token'ı bu URL'in fragment'ından okur)
2. Aynı Google Cloud projesinde **YouTube Data API v3** etkin olmalı.
3. `npx expo start -c` → telefonda Expo Go ile QR okut.

## Renk Paleti (`src/theme.js`)
- Arkaplan: `#0F0F0F` (YouTube koyu temasına yakın)
- Yüzey: `#1A1A1A`
- Vurgu: `#FF4757` (canlı kırmızı CTA)
- Metin: `#FFFFFF` / ikincil `#888888`
