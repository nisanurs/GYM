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

	if err := c.ShouldBindJSON(&measure); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Veri formatı hatalı!"})
		return
	}

	collection := database.GetCollection("measures")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// InsertOne bize sonucu (result) döner, içinde ID de vardır.
	result, err := collection.InsertOne(ctx, measure)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ölçü kaydedilemedi!"})
		return
	}

	// Yanıtın içine InsertedID'yi ekliyoruz
	c.JSON(http.StatusCreated, gin.H{
		"message": "Vücut ölçülerin başarıyla kaydedildi! 📏",
		"id":      result.InsertedID, // İŞTE BURADA ID'Yİ VERİYORUZ
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
