1. Sporcu Kayıt (Üye Olma) Servisi
API Endpoint: POST /api/auth/register

Görev: Mobil uygulamada yeni sporcu kaydını gerçekleştiren servis entegrasyonu.

İşlevler:

Sporcu bilgilerini (ad, email, şifre) form üzerinden toplama.

Form validasyonu (Şifre uzunluğu ve email formatı kontrolü).

API'ye POST isteği göndererek veritabanında kullanıcı oluşturma.

Başarılı kayıt sonrası kullanıcıyı antrenman paneline yönlendirme.

Hata durumlarını (Örn: Bu email zaten kayıtlı - 409) kullanıcıya bildirme.

Teknik Detaylar:

HTTP Client kullanımı (Axios / Fetch API).

İstek ve Yanıt (Request/Response) için model sınıflarının oluşturulması.

Yükleme durumu (Loading state) yönetimi.

2. Antrenman Geçmişi Görüntüleme Servisi
API Endpoint: GET /api/workouts

Görev: Kullanıcının geçmiş antrenmanlarını API'den çekip mobil listede gösterme.

İşlevler:

JWT (Bearer Token) ile güvenli kimlik doğrulama.

Kullanıcıya özel antrenman listesini (tarih, egzersiz adı, ağırlık) getirme.

Gelen JSON verisini parse edip mobil arayüzde (FlatList/Scrollview) gösterme.

İnternet yoksa eski verileri önbellekten (Cache) gösterme.

Teknik Detaylar:

Authentication header (Authorization: Bearer <token>) yönetimi.

LocalStorage veya AsyncStorage kullanarak veri saklama.

Hata yakalama (401 Unauthorized durumunda login ekranına yönlendirme).

3. Egzersiz Verisi Güncelleme Servisi
API Endpoint: PUT /api/workouts/{workoutId}

Görev: Mobil cihaz üzerinden hatalı girilen set/tekrar bilgilerini güncelleme.

İşlevler:

Düzenleme ekranından gelen yeni set/tekrar verilerini toplama.

API'ye PUT isteği göndererek ilgili antrenman kaydını güncelleme.

Güncelleme sonrası ana ekrandaki antrenman listesini otomatik yenileme.

Teknik Detaylar:

Dinamik URL parametresi (workoutId) kullanımı.

Sadece değişen alanların (partial update) gönderilmesi.

"Optimistic UI Update" ile veri güncellenirken kullanıcıya anlık bildirim.

4. Kayıtlı Antrenman/Ölçüm Silme Servisi
API Endpoint: DELETE /api/workouts/{workoutId} veya /api/measurements/{id}

Görev: Kullanıcının istediği kaydı sistemden kalıcı olarak temizleme.

İşlevler:

Silme işlemi öncesi kullanıcıya "Emin misiniz?" onay kutusu (Alert Dialog) gösterme.

API'ye DELETE isteği göndererek veriyi MongoDB'den temizleme.

Başarılı silme sonrası ilgili satırı mobil arayüzden anında kaldırma.

Teknik Detaylar:

Destructive action (Yıkıcı eylem) için onay mekanizması.

Backend senkronizasyonu sonrası UI state güncellemesi.

Error handling (404 Not Found durumunda uyarı gösterme).
