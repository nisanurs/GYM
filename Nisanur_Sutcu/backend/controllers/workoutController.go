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

// 1. Antrenman Ekle (POST)
func CreateWorkout(c *gin.Context) {
	var workout models.Workout

	if err := c.ShouldBindJSON(&workout); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Veri formatı hatalı: " + err.Error()})
		return
	}

	userID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Kullanıcı kimliği bulunamadı!"})
		return
	}

	workout.UserID = userID.(primitive.ObjectID)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	collection := database.GetCollection("workouts")
	result, err := collection.InsertOne(ctx, workout)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Veritabanına kaydedilemedi!"})
		return
	}

	// Kaydedilen ID'yi de dön, frontend'de silme için lazım
	c.JSON(http.StatusCreated, gin.H{
		"message": "Antrenman başarıyla kaydedildi! 💪",
		"id":      result.InsertedID,
	})
}

// 2. Geçmiş Egzersizleri Listeleme (GET)
func GetWorkouts(c *gin.Context) {
	// Sadece giriş yapan kullanıcının antrenmanlarını getir
	userID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Kullanıcı kimliği bulunamadı!"})
		return
	}

	collection := database.GetCollection("workouts")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	findOptions := options.Find().SetSort(bson.D{{Key: "date", Value: -1}})
	// Sadece bu kullanıcının kayıtları
	filter := bson.M{"user_id": userID.(primitive.ObjectID)}

	cursor, err := collection.Find(ctx, filter, findOptions)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Veriler çekilemedi"})
		return
	}

	var workouts []models.Workout
	if err = cursor.All(ctx, &workouts); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Veri dönüştürme hatası!"})
		return
	}

	// nil yerine boş dizi dön (frontend'de crash olmaz)
	if workouts == nil {
		workouts = []models.Workout{}
	}

	c.JSON(http.StatusOK, workouts)
}

// 3. Egzersiz Verisini Güncelleme (PUT)
func UpdateWorkout(c *gin.Context) {
	id := c.Param("id")
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Geçersiz ID formatı!"})
		return
	}

	var updateData models.Workout
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Geçersiz veri formatı!"})
		return
	}

	userID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Yetkisiz erişim!"})
		return
	}

	collection := database.GetCollection("workouts")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Hem ID hem userID filtresi: başkasının kaydını güncelleyemesin
	filter := bson.M{
		"_id":     objID,
		"user_id": userID.(primitive.ObjectID),
	}

	update := bson.M{
		"$set": bson.M{
			"exercise": updateData.Exercise,
			"sets":     updateData.Sets,
			"reps":     updateData.Reps,
			"weight":   updateData.Weight,
			"date":     updateData.Date,
		},
	}

	result, err := collection.UpdateOne(ctx, filter, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Güncelleme başarısız!"})
		return
	}

	if result.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Kayıt bulunamadı veya yetkiniz yok!"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Egzersiz başarıyla güncellendi! 🔄"})
}

// 4. Antrenman Sil (DELETE)
func DeleteWorkout(c *gin.Context) {
	id := c.Param("id")
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Geçersiz ID formatı!"})
		return
	}

	userID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Yetkisiz erişim!"})
		return
	}

	collection := database.GetCollection("workouts")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Güvenlik: sadece kendi kaydını silebilsin
	filter := bson.M{
		"_id":     objID,
		"user_id": userID.(primitive.ObjectID),
	}

	result, err := collection.DeleteOne(ctx, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Silinemedi"})
		return
	}

	if result.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Kayıt bulunamadı veya yetkiniz yok!"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Antrenman silindi 🗑️"})
}
