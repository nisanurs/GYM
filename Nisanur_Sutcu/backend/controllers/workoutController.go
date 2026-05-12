package controllers

import (
	"context"
	"encoding/json"
	"fmt"
	"gymbuddy/cache"
	"gymbuddy/database"
	"gymbuddy/models"
	"gymbuddy/queue"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func CreateWorkout(c *gin.Context) {
	var workout models.Workout

	// 1. Gelen JSON verisini workout modeline bağla
	if err := c.ShouldBindJSON(&workout); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Veri formatı hatalı: " + err.Error()})
		return
	}

	// 2. Middleware üzerinden gelen kullanıcı ID'sini al
	userID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Kullanıcı kimliği bulunamadı!"})
		return
	}
	userObjID := userID.(primitive.ObjectID)
	workout.UserID = userObjID

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// 3. Veritabanına (MongoDB) Kaydet
	collection := database.GetCollection("workouts")
	result, err := collection.InsertOne(ctx, workout)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Veritabanına kaydedilemedi!"})
		return
	}

	// --- REDIS CACHE TEMİZLEME (ÖNEMLİ) ---
	// Yeni antrenman eklendiği için eski listeyi (cache) siliyoruz.
	// Böylece GetWorkouts çağrıldığında yeni veriyle beraber güncel liste gelir.
	redisKey := "workouts:" + userObjID.Hex()
	cache.RedisClient.Del(context.Background(), redisKey)
	// --------------------------------------

	// 4. Başarılı yanıtını gönder
	c.JSON(http.StatusCreated, gin.H{
		"message": "Antrenman başarıyla kaydedildi! 💪",
		"id":      result.InsertedID,
	})

	// --- RABBITMQ MESAJ GÖNDERİMİ ---
	// Yeni oluşan ID'yi alıp mesajı arka planda (goroutine) fırlatıyoruz.
	newID := result.InsertedID.(primitive.ObjectID).Hex()
	go func(id string) {
		msg := "Yeni antrenman eklendi! ID: " + id
		queue.PublishWorkoutEvent(msg)
	}(newID)
	// --------------------------------
}

func GetWorkouts(c *gin.Context) {
	userID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Yetkisiz!"})
		return
	}

	userObjID := userID.(primitive.ObjectID)
	redisKey := "workouts:" + userObjID.Hex() // Her kullanıcıya özel bir anahtar

	// 1. ADIM: Önce Redis'e bakalım
	// cache.RedisClient üzerinden veriyi çekmeye çalışıyoruz
	cachedData, err := cache.RedisClient.Get(context.Background(), redisKey).Result()
	if err == nil {
		// Eğer hata yoksa veri Redis'te var demektir!
		fmt.Println("⚡ Veriler Redis üzerinden getirildi!")
		var workouts []models.Workout
		json.Unmarshal([]byte(cachedData), &workouts) // JSON'u Go objesine çevir
		c.JSON(http.StatusOK, workouts)
		return
	}

	// 2. ADIM: Redis'te yoksa MongoDB'ye git
	fmt.Println("💾 Veriler MongoDB'den alınıyor...")
	collection := database.GetCollection("workouts")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	findOptions := options.Find().SetSort(bson.D{{Key: "date", Value: -1}})
	cursor, err := collection.Find(ctx, bson.M{"user_id": userObjID}, findOptions)

	var workouts []models.Workout
	cursor.All(ctx, &workouts)

	// 3. ADIM: MongoDB'den aldığımız veriyi Redis'e yaz (Bir dahaki sefere hızlı gelsin)
	jsonData, _ := json.Marshal(workouts)
	cache.RedisClient.Set(context.Background(), redisKey, jsonData, 10*time.Minute) // 10 dakika sakla

	c.JSON(http.StatusOK, workouts)
}

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
