package controllers

import (
	"context"
	"gymbuddy/database"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// UpdateTargetWeight: Kullanıcının sadece hedef kilo bilgisini günceller (8. Madde)
func UpdateTargetWeight(c *gin.Context) {
	// 1. URL'den hangi kullanıcının güncelleneceğini alıyoruz (:id)
	id := c.Param("id")
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Geçersiz kullanıcı ID formatı!"})
		return
	}

	// 2. Sadece hedef kiloyu almak için geçici bir yapı (struct) tanımlıyoruz
	var input struct {
		TargetWeight float64 `json:"target_weight" binding:"required"`
	}

	// Postman'den gelen veriyi bu yapıya bağlıyoruz
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Lütfen geçerli bir hedef kilo giriniz!"})
		return
	}

	// 3. Veritabanı bağlantısı ve zaman aşımı ayarı
	collection := database.GetCollection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// 4. MongoDB'de '$set' operatörü ile sadece target_weight alanını değiştiriyoruz
	update := bson.M{
		"$set": bson.M{
			"target_weight": input.TargetWeight,
		},
	}

	_, err = collection.UpdateOne(ctx, bson.M{"_id": objID}, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Hedef güncellenirken bir hata oluştu!"})
		return
	}

	// 5. Başarı mesajı gönderiyoruz
	c.JSON(http.StatusOK, gin.H{
		"message":    "Hedef kilon başarıyla güncellendi! 🎯",
		"new_target": input.TargetWeight,
	})
}
