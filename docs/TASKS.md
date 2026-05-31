# focusview — Görev Takibi

> Son güncelleme: 2026-05-31
> Sadece **açık / yapılmakta olan** işler burada. Biten işler → **[TASKS_DONE.md](TASKS_DONE.md)**.

## ⚠️ Sen Yapacaksın — Çalıştırmadan Önce

> Detaylı adımlar → **[docs/SETUP_OAUTH.md](SETUP_OAUTH.md)**.

- [ ] **Web OAuth Client'a redirect URI kayıtlı olmalı**: `https://ilkan234.github.io/focusview/oauth.html` — Google Console'da yetkili redirect URI olarak ekli olmalı. (Uygulama içi WebView token'ı bu URL'in fragment'ından okuyor; sayfanın içeriği artık önemli değil, sadece URI eşleşmesi gerekiyor.)
- [ ] **Gerçek cihazda smoke test**:
  - [ ] Sign-in akışı → token kaydı doğru mu
  - [ ] Uygulamayı kapatıp tekrar aç → sessiz yeniden giriş çalışıyor mu (Google ekranı gelmeden Home)
  - [ ] Bir segment oluştur → feed gerçekten dolu mu
  - [ ] Segment düzenle / sil → ⋯ menüsü doğru çalışıyor mu
  - [ ] Bir videoya tıkla → oynatıcı açılıyor mu
  - [ ] Pull-to-refresh çalışıyor mu

---

## Bilinen Sınırlamalar — İleride Yapılacaklar

### Auth
- [ ] **Refresh token desteği** — kalıcı çözüm için PKCE/code flow'a geçip refresh token saklamak. (Sessiz yeniden giriş çoğu durumu kapatıyor; düşük öncelik.)
- [ ] **Home'da "Sign out" butonu** — şu an çıkış yapmanın UI yolu yok; sadece `AuthError`'da otomatik clear oluyor. (Not: `focusview_signed_in` bayrağı da temizlenmeli.)

### Feed
- [ ] **Sayfalama** — şu an her segment için ilk N kanalın son 10 videosu, daha fazlasına "Load more" eklenebilir.
- [ ] **Önbellek (cache)** — her açılışta API'ye gitmek yerine son sonuçları `AsyncStorage`'da saklayıp arka planda yenileme (TTL ~10dk).
- [ ] **Shorts eşiği** — şu an 60s. YouTube'un güncel 180s sınırına çekmek istenirse `SHORT_MAX_SECONDS = 180` ([src/config.js](../src/config.js)).
- [ ] **Keyword eşleştirme** — şu an basit `substring` arama (case-insensitive). Tag'ler, kategoriler, fuzzy matching eklenebilir.
- [ ] **Açıklama uzunluğu** — uzun `description` yüzünden keyword yanlış bağlamda eşleşebiliyor; sadece başlıkta arama opsiyonu eklenebilir.

### Home / Segment Yönetimi
- [ ] **Segment sıralama / sürükle-bırak**.

### Oynatıcı
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
