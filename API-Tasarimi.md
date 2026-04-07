openapi: 3.0.3
info:
  title: GymBuddy API
  description: |
    Sporcuların antrenman ve gelişim süreçlerini takip eden asistan uygulaması API'sı.
    
    ## Temel Özellikler
    - Kullanıcı Kaydı ve Girişi
    - Antrenman (Egzersiz, Set, Ağırlık) Takibi
    - Vücut Ölçümleri ve Gelişim İstatistikleri
    - Yapay Zeka Destekli Antrenman Önerileri
  version: 1.0.0
  contact:
    name: Nisanur Sütçü
    email: niisanur.st@gmail.com
    
```yaml
servers:
  - url: http://localhost:5000/v1
    description: Geliştirme Sunucusu

tags:
  - name: auth
    description: Kimlik doğrulama işlemleri
  - name: workouts
    description: Antrenman ve egzersiz kayıtları
  - name: measurements
    description: Vücut ölçümleri ve istatistikler
  - name: ai
    description: Yapay zeka servisleri

paths:
  /auth/register:
    post:
      tags:
        - auth
      summary: Yeni sporcu kaydı
      description: Sisteme yeni bir kullanıcı kaydeder.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                name: { type: string, example: "Nisanur" }
                email: { type: string, format: email, example: "nisa@example.com" }
                password: { type: string, format: password, example: "Gym123!" }
      responses:
        '201':
          description: Kayıt başarılı.

  /workouts:
    get:
      tags:
        - workouts
      summary: Antrenman geçmişini listele
      responses:
        '200':
          description: Başarılı liste döndü.
    post:
      tags:
        - workouts
      summary: Yeni egzersiz kaydı ekle
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                title: { type: string, example: "Squat" }
                reps: { type: integer, example: 12 }
                load: { type: number, example: 60.5 }
      responses:
        '201':
          description: Kayıt oluşturuldu.

  /workouts/{workoutId}:
    put:
      tags:
        - workouts
      summary: Egzersiz verisini güncelle
      parameters:
        - name: workoutId
          in: path
          required: true
          schema: { type: string }
      responses:
        '200':
          description: Güncelleme başarılı.
    delete:
      tags:
        - workouts
      summary: Egzersiz kaydını sil
      parameters:
        - name: workoutId
          in: path
          required: true
          schema: { type: string }
      responses:
        '204':
          description: Kayıt silindi.

  /measurements:
    get:
      tags:
        - measurements
      summary: Gelişim istatistiklerini getir
      responses:
        '200':
          description: İstatistikler listelendi.
    post:
      tags:
        - measurements
      summary: Vücut ölçüsü ekle
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                weight: { type: number, example: 65 }
                bodyFat: { type: number, example: 18.5 }
      responses:
        '201':
          description: Ölçüm kaydedildi.

  /goals:
    put:
      tags:
        - measurements
      summary: Hedef kilo güncelle
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                targetWeight: { type: number, example: 60 }
      responses:
        '200':
          description: Hedef güncellendi.

  /measurements/{id}:
    delete:
      tags:
        - measurements
      summary: Hatalı ölçümü sil
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string }
      responses:
        '204':
          description: Ölçüm silindi.

  /ai/recommend:
    get:
      tags:
        - ai
      summary: Yapay zeka ile antrenman önerisi al
      description: Son 3 antrenman verisini analiz ederek sıradaki kas grubunu önerir.
      responses:
        '200':
          description: Öneriler başarıyla üretildi.
          content:
            application/json:
              schema:
                type: object
                properties:
                  recommendation: { type: string, example: "Bugün Pull (Çekiş) günü yapmalısın." }
