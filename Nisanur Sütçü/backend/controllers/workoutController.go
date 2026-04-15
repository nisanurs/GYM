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
	"go.mongodb.org/mongo-driver/mongo/options" // Sıralama (Sort) için bu lazım
)

// 1. Antrenman Ekle (POST)
func CreateWorkout(c *gin.Context) {
	var workout models.Workout

	// 1. Gelen JSON'ı bir kez ve tam oku
	if err := c.ShouldBindJSON(&workout); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Veri formatı hatalı: " + err.Error()})
		return
	}

	// 2. Middleware'den gelen kullanıcı ID'sini al
	userID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Kullanıcı kimliği bulunamadı!"})
		return
	}

	// 3. Antrenmana ID'yi bas
	workout.UserID = userID.(primitive.ObjectID)

	// 4. Veritabanı işlemleri için context ayarla
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// 5. Veritabanına kaydet
	collection := database.GetCollection("workouts")
	_, err := collection.InsertOne(ctx, workout)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Veritabanına kaydedilemedi!"})
		return
	}

	// 6. Başarı mesajı
	c.JSON(http.StatusCreated, gin.H{"message": "Antrenman başarıyla kaydedildi! 💪"})
}

// 2. Geçmiş Egzersizleri Listeleme (GET) - Tarih Sırasına Göre
func GetWorkouts(c *gin.Context) {
	collection := database.GetCollection("workouts")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Tarihe göre azalan (en yeni en üstte) sıralama ekledik
	findOptions := options.Find().SetSort(bson.D{{Key: "date", Value: -1}})

	cursor, err := collection.Find(ctx, bson.M{}, findOptions)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Veriler çekilemedi"})
		return
	}

	var workouts []models.Workout
	if err = cursor.All(ctx, &workouts); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Veri dönüştürme hatası!"})
		return
	}

	c.JSON(http.StatusOK, workouts)
}

// 3. Egzersiz Verisini Güncelleme (PUT)
func UpdateWorkout(c *gin.Context) {
	id := c.Param("id")
	objID, _ := primitive.ObjectIDFromHex(id)

	var updateData models.Workout
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Geçersiz veri formatı!"})
		return
	}

	collection := database.GetCollection("workouts")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Sadece değişen alanları güncellemek için $set kullanıyoruz
	update := bson.M{
		"$set": bson.M{
			"type":     updateData.Type,
			"duration": updateData.Duration,
			"calories": updateData.Calories,
			"date":     updateData.Date,
		},
	}

	_, err := collection.UpdateOne(ctx, bson.M{"_id": objID}, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Güncelleme başarısız!"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Egzersiz başarıyla güncellendi! 🔄"})
}

// 4. Antrenman Sil (DELETE)
func DeleteWorkout(c *gin.Context) {
	id := c.Param("id")
	objID, _ := primitive.ObjectIDFromHex(id)

	collection := database.GetCollection("workouts")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := collection.DeleteOne(ctx, bson.M{"_id": objID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Silinemedi"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Antrenman silindi 🗑️"})
}
