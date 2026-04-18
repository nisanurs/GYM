package controllers

import (
	"context"
	"gymbuddy/database"
	"gymbuddy/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func GetAIRecommendation(c *gin.Context) {
	userID, _ := c.Get("userId")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Veritabanından verilerini çekelim (Hata vermesin diye)
	var user models.User
	var lastMeasure models.BodyMeasure
	database.GetCollection("users").FindOne(ctx, bson.M{"_id": userID}).Decode(&user)
	opts := options.FindOne().SetSort(bson.D{{Key: "date", Value: -1}})
	database.GetCollection("measures").FindOne(ctx, bson.M{"user_id": userID}, opts).Decode(&lastMeasure)

	// AI'yı şimdilik simüle ediyoruz
	c.JSON(http.StatusOK, gin.H{
		"user":      user.Name,
		"ai_advice": "Verilerin başarıyla analiz ediliyor. Bugün harika bir gün, antrenmanını aksatma! (AI servisi şu an bakımda, yakında burada olacak) ✨",
		"status":    "mock_active",
	})
}
