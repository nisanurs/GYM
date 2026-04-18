**1.Yeni Sporcu Kaydı**

   **API Metodu:** `POST /auth/register`

   **Açıklama:** Kullanıcıların GymBuddy ekosistemine dahil olmasını sağlar. İsim, email ve güvenli şifre bilgilerini toplayarak veritabanında yeni bir sporcu profili oluşturur. Kayıt sonrası kullanıcı kendi antrenmanlarını yönetmeye hazır hale gelir.


**2.Sporcu Girişi**

   **API Metodu:** `POST /auth/login`

   **Açıklama:** Kayıtlı kullanıcıların sisteme güvenli bir şekilde erişim sağlamasını kontrol eder. Kullanıcının email ve şifre bilgilerini doğrulayarak, oturumun devamlılığı için benzersiz bir JWT (JSON Web Token) üretir. Bu token sayesinde sporcu, kendi özel antrenman verilerine ve vücut ölçümlerine erişim yetkisi kazanır.


**3.Antrenman Kaydı Oluşturma**

   **API Metodu:** `POST /workouts`

   **Açıklama:** Kullanıcının yaptığı egzersizleri (örneğin Bench Press, Squat) set, tekrar ve ağırlık verileriyle birlikte sisteme kaydetmesini sağlar. Her kayıt, o günkü performansın dijital günlüğe işlenmesidir.


**4.Geçmiş Antrenmanları Listeleme**

   **API Metodu:** `GET /workouts`

   **Açıklama:** Kullanıcının bugüne kadar yaptığı tüm antrenman geçmişini kronolojik olarak listeler. Sporcunun hangi gün ne kadar ağırlık kaldırdığını ve gelişim trendini görmesine olanak tanır.


**5.Egzersiz Verisi Güncelleme**

   **API Metodu:** `PUT /workouts/{workoutId}`

   **Açıklama:** Kullanıcının yanlış girdiği set veya ağırlık verilerini düzeltmesini sağlar. Örneğin, 60 kg yerine sehven 600 kg girilen bir kaydı, doğru değerle güncelleyerek istatistiklerin bozulmasını önler.


**6.Hatalı Antrenman Kaydı Silme**

   **API Metodu:** `DELETE /workouts/{workoutId}`

   **Açıklama:** Kullanıcının tamamen yanlış oluşturduğu veya artık sistemde görmek istemediği bir antrenman kaydını kalıcı olarak silmesini sağlar. Bu işlem geri alınamaz ve ilgili veri MongoDB'den temizlenir.


**7.Vücut Ölçüsü Ekleme**

   **API Metodu:** `POST /measurements`

   **Açıklama:** Kullanıcının periyodik olarak kilo, yağ oranı gibi fiziksel değişim verilerini sisteme girmesini sağlar. Bu veriler, gelişim grafiklerinin oluşturulması için temel teşkil eder.


**8.Gelişim İstatistiklerini Görüntüleme**

   **API Metodu:** `GET /measurements`

   **Açıklama:** Kullanıcının fiziksel ölçümlerini (kilo kaybı, kas kazanımı vb.) analiz ederek anlamlı grafik verileri olarak sunar. Sporcunun hedefine ne kadar yaklaştığını görselleştirir.


 **9. Fitness Hedeflerini Güncelleme**

   **API Metodu:** `PUT /goals`

   **Açıklama:** Kullanıcının sistemdeki hedef kilo veya antrenman sıklığı gibi kişisel hedeflerini değiştirmesine olanak tanır. Motivasyonun korunması için hedeflerin dinamik olarak güncellenmesini sağlar.


 **10. Hatalı Ölçüm Verisini Silme**

   **API Metodu:** `DELETE /measurements/{id}`

   **Açıklama:** Yanlış girilen bir kilo veya vücut ölçüsü kaydının silinmesini sağlar. İstatistiklerin doğruluğunu korumak için kullanıcının hatalı veri girişlerini temizlemesine imkan tanır.


+.  **Yapay Zeka Antrenman Önerisi Alma**

   **API Metodu:** `GET /ai/recommend`

   **Açıklama:** Sistemin en yenilikçi özelliğidir. Kullanıcının son antrenman verilerini analiz ederek, bir sonraki spor gününde hangi kas grubuna odaklanması gerektiğine dair akıllı öneriler sunar.