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

func GetAIRecommendation(c *gin.Context) {
	// 1. Kullanıcı ID'sini al ve kontrol et
	userID := c.Param("id")
	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Geçersiz ID formatı!"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// 2. Kullanıcıyı bul
	var user models.User
	userCollection := database.GetCollection("users")
	err = userCollection.FindOne(ctx, bson.M{"_id": objID}).Decode(&user)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Kullanıcı bulunamadı!"})
		return
	}

	// 3. Son antrenmanları çek
	workoutCollection := database.GetCollection("workouts")
	filter := bson.M{"user_id": objID} // Buradaki user_id'nin veritabanındakiyle aynı olduğundan emin ol
	findOptions := options.Find().SetLimit(1).SetSort(bson.D{{Key: "date", Value: -1}})

	cursor, err := workoutCollection.Find(ctx, filter, findOptions)
	var lastWorkouts []models.Workout
	if err == nil {
		cursor.All(ctx, &lastWorkouts)
	}

	// 4. KRİTİK KONTROL: Eğer liste boşsa 500 hatası verme, mesaj ver!
	var recommendation string
	var lastWorkoutType string

	if len(lastWorkouts) > 0 {
		// Liste doluysa normal akış
		lastWorkoutType = lastWorkouts[0].Type
		recommendation = fmt.Sprintf("Harikasın %s! Son antrenmanında %s çalıştın. Amacın %s olduğu için bugün Omuz ve Kol çalışmanı öneririm! 🔥", user.Name, lastWorkoutType, user.Goal)
	} else {
		// Liste boşsa (length 0 ise) bu güvenli mesajı ver
		lastWorkoutType = "Kayıt bulunamadı"
		recommendation = fmt.Sprintf("Selam %s! Henüz bir antrenman kaydın yok. Amacın %s olduğu için bugün hafif bir yürüyüşle başlayabiliriz! 🏃‍♀️", user.Name, user.Goal)
	}

	c.JSON(http.StatusOK, gin.H{
		"user_name":      user.Name,
		"user_goal":      user.Goal,
		"last_workout":   lastWorkoutType,
		"recommendation": recommendation,
	})
}
