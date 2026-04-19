package controllers

import (
	"context"
	"gymbuddy/database"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
)

// (c *gin.Context) Kuryemizdir. Telefondan (uygulamadan) gelen veriler onun çantasındadır ve cevapları da o götürecektir.
func UpdateTargetWeight(c *gin.Context) {

	// 1. KİMLİK KONTROLÜ
	// Gin'in çantasından (Context) giriş yapmış kullanıcının "userId"sini çıkarmaya çalışıyoruz.
	userID, exists := c.Get("userId")
	if !exists {
		// Eğer kuryenin çantasında bir kimlik yoksa (kullanıcı giriş yapmamışsa veya token süresi dolmuşsa), 401 hatası verip kapıdan çeviriyoruz.
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Kullanıcı kimliği bulunamadı!"})
		return
	}

	// 2. GELEN VERİYİ KARŞILAMA (STRUCT)
	// Telefondan gelecek olan JSON verisinin kalıbını hazırlıyoruz. Kullanıcı hem kilosunu hem de hedefini gönderebilir.
	var input struct {
		TargetWeight float64 `json:"target_weight"`
		Goal         string  `json:"goal"` // fat_loss / muscle_gain / maintenance
	}

	// c.ShouldBindJSON ile telefondan gelen JSON verisini alıp yukarıdaki kalıbın (input) içine dökmeye çalışıyoruz.
	if err := c.ShouldBindJSON(&input); err != nil {
		// Eğer veri tipi yanlış gelirse (örneğin kiloya rakam yerine "seksen" yazılmışsa) sistem çökmesin diye 400 hatası fırlatıyoruz.
		c.JSON(http.StatusBadRequest, gin.H{"error": "Veri formatı hatalı!"})
		return
	}

	// 3. DİNAMİK GÜNCELLEME ALANLARINI HAZIRLAMA (BU KODUN EN GÜZEL KISMI)
	// Boş bir BSON (MongoDB dili) haritası oluşturuyoruz. İçine sadece değişmesi gerekenleri koyacağız.
	updateFields := bson.M{}

	// Eğer kullanıcı kilosunu göndermişse (0'dan büyükse), güncellenecekler listesine ekle.
	if input.TargetWeight > 0 {
		updateFields["target_weight"] = input.TargetWeight
	}

	// Eğer kullanıcı bir hedef göndermişse (boş metin değilse), güncellenecekler listesine ekle.
	if input.Goal != "" {
		updateFields["goal"] = input.Goal
	}

	// Kullanıcı "Güncelle" butonuna basıp hiçbir şey yazmadan göndermiş olabilir. Eğer sepet boşsa işlemi durdur.
	if len(updateFields) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Güncellenecek alan bulunamadı!"})
		return
	}

	// 4. VERİTABANI İŞLEMLERİ
	// MongoDB'deki "users" (kullanıcılar) dolabını açıyoruz.
	collection := database.GetCollection("users")

	// filter: Hangi kullanıcıyı güncelleyeceğiz? Kimlik kontrolünde bulduğumuz userID'ye sahip olanı.
	filter := bson.M{"_id": userID}

	// update: Kullanıcının verilerinde neyi değiştireceğiz? Yukarıda özenle hazırladığımız "updateFields" sepetindekileri ($set komutu ile).
	update := bson.M{"$set": updateFields}

	// İnternet koparsa veya veritabanı yanıt vermezse Go sonsuza kadar beklemesin diye 10 saniyelik bir zamanlayıcı (timeout) kuruyoruz.
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel() // İşlem bitince zamanlayıcıyı kapat.

	// Nihayet güncellemeyi yapıyoruz.
	_, err := collection.UpdateOne(ctx, filter, update)
	if err != nil {
		// Veritabanında bir sorun çıkarsa (örneğin veritabanı kapalıysa) 500 hatası veriyoruz.
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Güncelleme hatası!"})
		return
	}

	// 5. BAŞARILI YANIT
	// Her şey sorunsuz çalıştıysa, kurye aracılığıyla 200 (OK) koduyla birlikte başarı mesajımızı telefona gönderiyoruz.
	c.JSON(http.StatusOK, gin.H{"message": "Hedefler başarıyla güncellendi! 🎯"})
}
