package controllers

import (
	"context"
	"gymbuddy/database"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
)

func UpdateTargetWeight(c *gin.Context) {
	// 1. ÖNEMLİ: ID'yi URL parametresinden DEĞİL, Token'dan (Middleware) alıyoruz
	userID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Kullanıcı kimliği bulunamadı, lütfen tekrar giriş yap!"})
		return
	}

	// 2. Gelen JSON verisini oku
	var input struct {
		TargetWeight float64 `json:"target_weight"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Veri formatı hatalı!"})
		return
	}

	// 3. Veritabanında güncelleme yap
	collection := database.GetCollection("users")

	// userID zaten AuthMiddleware'de primitive.ObjectID'ye çevrilmişti
	filter := bson.M{"_id": userID}
	update := bson.M{"$set": bson.M{"target_weight": input.TargetWeight}}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := collection.UpdateOne(ctx, filter, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Veritabanı güncelleme hatası!"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Hedef kilonuz başarıyla güncellendi! 🎯"})
}
