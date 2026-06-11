
# 🏋️‍♂️ Nisanur Sütçü - GymBuddy REST API Metotları
**API Test Videosu:** Link buraya eklenecek

## 1. Yeni Sporcu Kaydı
-**Endpoint:** `POST /api/auth/register`

-**Request Body:**
```json
{
"name": "Nisa",
"email": "nisa@example.com",
"password": "GymBuddy123!"
}
````
-**Response:** `201 Created` - Kullanıcı başarıyla oluşturuldu.

## 2. Antrenman Kaydı Oluşturma
-**Endpoint:** `POST /api/workouts`

-**Authentication:** Bearer Token gerekli

-**Request Body:**
```json
{
"exerciseName": "Bench Press",
"reps": 12,
"weight": 60,
"date": "2026-04-08"
}
```

-**Response:** `201 Created` - Egzersiz başarıyla kaydedildi.

## 3. Geçmiş Antrenmanları Listeleme
-**Endpoint:** `GET /api/workouts`

-**Authentication:** Bearer Token gerekli

-**Response:** `200 OK` - Antrenman geçmişi başarıyla getirildi.

## 4. Egzersiz Verisini Güncelleme
-**Endpoint:** `PUT /api/workouts/{workoutId}`

-**Path Parameters:** workoutId (string, required)

-**Authentication:** Bearer Token gerekli

-**Request Body:** 
```json
{
"reps": 15,
"weight": 65
}
```
-**Response:** `200 OK` - Kayıt başarıyla güncellendi.

## 5. Antrenman Kaydı Silme
-**Endpoint:** `DELETE /api/workouts/{workoutId}`

-**Path Parameters:** workoutId (string, required)

-**Authentication:** Bearer Token gerekli

-**Response:** `204 No Content` - Kayıt başarıyla silindi.

## 6. Vücut Ölçüsü Ekleme
-**Endpoint:** `POST /api/measurements`

-**Authentication:** Bearer Token gerekli

-**Request Body:**
```json
{
"weight": 65.5,
"bodyFat": 18.2
}
```
-**Response:** `201 Created` - Ölçüm verisi başarıyla eklendi.

## 7. Gelişim İstatistiklerini Görüntüleme
-**Endpoint:** `GET /api/measurements`

-**Authentication:** Bearer Token gerekli

-**Response:** `200 OK` - Gelişim verileri başarıyla getirildi.

## 8. Fitness Hedefi Güncelleme
-**Endpoint:** `PUT /api/goals`

-**Authentication:** Bearer Token gerekli

-**Request Body:**
```json
{
"targetWeight": 60.0
}
```
-**Response:** `200 OK` - Hedef başarıyla güncellendi.

## 9. Hatalı Ölçüm Verisini Silme
-**Endpoint:** `DELETE /api/measurements/{id}`

-**Path Parameters:** id (string, required)

-**Authentication:** Bearer Token gerekli

-**Response:** `204 No Content` - Ölçüm kaydı başarıyla silindi.

## 10. Yapay Zeka Antrenman Önerisi Alma
-**Endpoint:** `GET /api/ai/recommend`

-**Authentication:** Bearer Token gerekli

-**Response:** `200 OK` - AI önerisi başarıyla üretildi.

Örnek Response:

JSON
{
  "recommendation": "Son antrenman verilerine göre bugün 'Leg Day' yapman önerilir."
}
