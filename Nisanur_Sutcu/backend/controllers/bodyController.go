package controllers

import (
	"context"
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

	// 1. Postman'den gelen JSON verisini modele bağla
	if err := c.ShouldBindJSON(&measure); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Veri formatı hatalı: " + err.Error()})
		return
	}

	// 2. KRİTİK NOKTA: AuthMiddleware'den gelen kullanıcı ID'sini al
	// Eğer kullanıcı giriş yapmadıysa burası çalışmaz
	userID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Lütfen önce giriş yapın!"})
		return
	}

	// 3. SIFIRLARI YOK EDEN SATIR:
	// Veritabanına kaydetmeden önce "bu ölçü Nisanur'undur" diyoruz.
	measure.UserID = userID.(primitive.ObjectID)

	// 4. Veritabanı işlemleri için zaman aşımı (context) ayarla
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// 5. Veritabanına kaydet
	collection := database.GetCollection("measures")
	_, err := collection.InsertOne(ctx, measure)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ölçü kaydedilemedi!"})
		return
	}

	// 6. Başarı mesajı
	c.JSON(http.StatusCreated, gin.H{
		"message": "Vücut ölçülerin başarıyla kaydedildi! 📏✨",
		"data":    measure,
	})
}

// UpdateBodyMeasure: Kayıtlı vücut ölçüsünü günceller (PUT)
func UpdateBodyMeasure(c *gin.Context) {
	// 1. URL'den hangi kaydın güncelleneceğini (ID) al
	id := c.Param("id")
	objID, _ := primitive.ObjectIDFromHex(id)

	// 2. Yeni verileri 'updateData' içine oku
	var updateData models.BodyMeasure
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Geçersiz veri formatı!"})
		return
	}

	collection := database.GetCollection("measures")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// 3. MongoDB'ye "Şu ID'li kaydı bul ve bu yeni bilgilerle güncelle" de

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

	_, err := collection.UpdateOne(ctx, bson.M{"_id": objID}, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Güncelleme başarısız!"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Vücut ölçülerin güncellendi! 🔄"})
}

// GetBodyStats: Kullanıcının gelişimini tarih sırasına göre getirir
func GetBodyStats(c *gin.Context) {
	collection := database.GetCollection("measures")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	findOptions := options.Find().SetSort(bson.D{{Key: "date", Value: 1}})

	cursor, err := collection.Find(ctx, bson.M{}, findOptions)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Veriler getirilemedi"})
		return
	}

	var stats []models.BodyMeasure
	if err = cursor.All(ctx, &stats); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Dönüştürme hatası"})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// DeleteBodyMeasure: Belirli bir ölçü kaydını siler (DELETE)
func DeleteBodyMeasure(c *gin.Context) {
	// 1. URL'den ID'yi al
	id := c.Param("id")
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Geçersiz ölçü ID formatı!"})
		return
	}

	// 2. Token'dan kullanıcı ID'sini al (Güvenlik için: Sadece kendi ölçünü sil)
	userID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Yetkisiz erişim!"})
		return
	}

	collection := database.GetCollection("measures")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// 3. Silme filtresi: Hem ölçü ID'si hem kullanıcı ID'si tutmalı
	filter := bson.M{
		"_id":     objID,
		"user_id": userID.(primitive.ObjectID),
	}

	result, err := collection.DeleteOne(ctx, filter)
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
