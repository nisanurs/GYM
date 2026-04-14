package controllers

import (
	"context"
	"gymbuddy/database"
	"gymbuddy/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt" // Şifreleme kütüphanesi
)

var jwtKey = []byte("nisakey")

func RegisterUser(c *gin.Context) {
	var user models.User

	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Geçersiz veri formatı!"})
		return
	}

	// Şifreleme işlemleri 
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	user.Password = string(hashedPassword)

	userCollection := database.GetCollection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	
	result, err := userCollection.InsertOne(ctx, user) // InsertOne sonucunu 'result' değişkenine alıyoruz
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Kullanıcı kaydedilemedi!"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Hoş geldin " + user.Name + "! Şifren güvenle saklandı. 💪",
		"id":      result.InsertedID, // İşte MongoDB'nin verdiği o meşhur ID!
	})
}

// LoginUser kullanıcı girişini kontrol eder
func LoginUser(c *gin.Context) {
	var input struct {
		Email    string `json:"email" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	// 1. Gelen JSON'ı oku
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Lütfen e-posta ve şifrenizi girin!"})
		return
	}

	// 2. Veritabanında bu e-postaya sahip kullanıcıyı bul
	userCollection := database.GetCollection("users")
	var user models.User
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	err := userCollection.FindOne(ctx, map[string]string{"email": input.Email}).Decode(&user)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "E-posta veya şifre hatalı!"})
		return
	}

	// 3. Şifreleri karşılaştır (Hashed vs Plain)
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "E-posta veya şifre hatalı!"})
		return
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID.Hex(),
		"exp":     time.Now().Add(time.Hour * 168).Unix(), // 1 hafta gecerli geçerli
	})

	tokenString, err := token.SignedString(jwtKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Token üretilemedi!"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Giriş başarılı! 🏋️‍♀️",
		"token":   tokenString, // Kullanıcıya bu uzun karmaşık kodu veriyoruz
	})
}
