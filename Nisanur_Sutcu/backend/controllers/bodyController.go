package controllers

import (
	"context"
	"fmt"
	"gymbuddy/database"
	"gymbuddy/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func AddBodyMeasure(c *gin.Context) {
	var measure models.BodyMeasure

	if err := c.ShouldBindJSON(&measure); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Veri formatı hatalı: " + err.Error()})
		return
	}

	userID, exists := c.Get("userId")
	//Bu komut, Gin'in Context'inden "userId" anahtarına sahip bir değerin olup olmadığını kontrol eder. Eğer yoksa, kullanıcı kimliği bulunamadığı için 401 (Unauthorized) hatası döneriz. Bu durum genellikle kullanıcının giriş yapmadığı veya geçersiz bir token kullandığı anlamına gelir.

	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Lütfen önce giriş yapın!"})
		return
	}

	measure.UserID = userID.(primitive.ObjectID)
	//Token'dan gelen userId'yi measure yapısına atarız. Böylece bu ölçünün hangi kullanıcıya ait olduğunu veritabanında saklayabiliriz.

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	collection := database.GetCollection("measures")
	//MongoDB'deki "measures" (ölçüler) dolabını açar. Çünkü yeni ölçüyü bu koleksiyona kaydedeceğiz.

	_, err := collection.InsertOne(ctx, measure)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ölçü kaydedilemedi!"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Vücut ölçülerin başarıyla kaydedildi! 📏✨",
		"data":    measure,
	})
}

func UpdateBodyMeasure(c *gin.Context) {
	id := c.Param("id")
	objID, _ := primitive.ObjectIDFromHex(id)
	//Bu komut, URL'deki "id" parametresini alır ve MongoDB'nin anlayacağı ObjectID formatına çevirir. Eğer id geçersiz bir formatta ise, sistem çökmesin diye hata kontrolü yaparız.

	var updateData models.BodyMeasure
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Geçersiz veri formatı!"})
		return
	}

	userID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Yetkisiz erişim!"})
		return
	}

	collection := database.GetCollection("measures")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	filter := bson.M{
		"_id":     objID,
		"user_id": userID.(primitive.ObjectID),
	}
	//Bu filtre, MongoDB'ye "Sadece _id'si objID'ye eşit olan ve user_id'si şu kullanıcıya ait olan kaydı bul" der. Böylece kullanıcı sadece kendi ölçülerini güncelleyebilir, başkasının ölçüsünü değil.

	update := bson.M{
		"$set": bson.M{
			"weight":   updateData.Weight,
			"height":   updateData.Height,
			"arm":      updateData.Arm,
			"waist":    updateData.Waist,
			"neck":     updateData.Neck,
			"leg":      updateData.Leg,
			"hip":      updateData.Hip,
			"shoulder": updateData.Shoulder,
			"fat_rate": updateData.FatRate,
			"date":     updateData.Date,
		},
	}
	//Bu komut, MongoDB'ye "Bulduğun kaydın şu alanlarını şu yeni değerlerle güncelle" der. $set operatörü, sadece belirtilen alanları günceller, diğer alanlara dokunmaz.

	result, err := collection.UpdateOne(ctx, filter, update)
	//Bu komut, MongoDB'ye "Filtreye uyan tek bir kaydı güncelle" der. Eğer böyle bir kayıt bulunamazsa veya başka bir hata oluşursa, result.MatchedCount sıfır olur ve uygun hatayı döneriz.
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Güncelleme başarısız!"})
		return
	}
	if result.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Kayıt bulunamadı veya yetkiniz yok!"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Vücut ölçülerin güncellendi! 🔄"})
}

func GetBodyStats(c *gin.Context) {
	userID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Yetkisiz erişim!"})
		return
	}

	collection := database.GetCollection("measures")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	findOptions := options.Find().SetSort(bson.D{{Key: "date", Value: 1}})
	//Bu komut, MongoDB'ye "Bulduğun tüm kayıtları tarihe göre sırala (en eski en başta)" der. Böylece kullanıcı ölçülerini zaman içinde artan sırayla görebilir.

	filter := bson.M{"user_id": userID.(primitive.ObjectID)} //Bu filtre, MongoDB'ye "Sadece user_id'si şu kullanıcıya ait olan kayıtları bul" der. Böylece kullanıcı sadece kendi ölçülerini görebilir, başkasının ölçüsünü değil.

	cursor, err := collection.Find(ctx, filter, findOptions) //Bu komut, MongoDB'ye "Filtreye uyan tüm kayıtları bul ve sırala" der. Eğer hiçbir kayıt bulunamazsa, cursor boş olur ama hata olmaz. Başka bir hata oluşursa, uygun hatayı döneriz.
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Veriler getirilemedi"})
		return
	}

	var stats []models.BodyMeasure
	if err = cursor.All(ctx, &stats); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Dönüştürme hatası"})
		return
	}

	n := len(stats)
	response := gin.H{
		"stats_list":  stats,
		"summary":     "Henüz kıyaslama yapacak kadar veri yok.",
		"differences": nil,
	}
	//Bu yapı, telefona göndereceğimiz JSON verisini temsil eder. "stats_list" alanı, kullanıcının tüm ölçülerini içeren bir liste tutar. "summary" alanı, kıyaslama yapacak kadar veri yoksa gösterilecek bir mesaj içerir. "differences" alanı ise son iki ölçüm arasındaki farkları tutar (eğer kıyaslama yapılabiliyorsa).

	if n >= 2 {
		last := stats[n-1]
		prev := stats[n-2]

		diffs := gin.H{
			"weight":   last.Weight - prev.Weight,
			"height":   last.Height - prev.Height,
			"arm":      last.Arm - prev.Arm,
			"waist":    last.Waist - prev.Waist,
			"neck":     last.Neck - prev.Neck,
			"leg":      last.Leg - prev.Leg,
			"hip":      last.Hip - prev.Hip,
			"shoulder": last.Shoulder - prev.Shoulder,
			"fat_rate": last.FatRate - prev.FatRate,
		}

		response["differences"] = diffs
		response["summary"] = fmt.Sprintf(
			"Son ölçümün başarıyla kıyaslandı! %d farklı bölgede değişim saptandı. 🔥", len(diffs))
	}

	c.JSON(http.StatusOK, response)
}

func DeleteBodyMeasure(c *gin.Context) {
	id := c.Param("id")
	objID, err := primitive.ObjectIDFromHex(id)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Geçersiz ölçü ID formatı!"})
		return
	}

	userID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Yetkisiz erişim!"})
		return
	}

	collection := database.GetCollection("measures")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	filter := bson.M{
		"_id":     objID,
		"user_id": userID.(primitive.ObjectID),
	}

	result, err := collection.DeleteOne(ctx, filter)
	//Bu komut, MongoDB'ye "Filtreye uyan tek bir kaydı sil" der. Eğer böyle bir kayıt bulunamazsa veya başka bir hata oluşursa, result.DeletedCount sıfır olur ve uygun hatayı döneriz.
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Silme işlemi başarısız!"})
		return
	}

	if result.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Kayıt bulunamadı veya silme yetkiniz yok!"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Vücut ölçüsü başarıyla silindi 🗑️"})
}
