package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

var jwtKey = []byte("nisakey") 

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. Header'dan token'ı al (Authorization: Bearer <token>)
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Yetkisiz erişim! Biletiniz yok."})
			c.Abort() // İsteği durdur, kontrolcüye gönderme
			return
		}

		// 2. "Bearer " kısmını ayıkla
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		// 3. Token'ı doğrula
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return jwtKey, nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Geçersiz veya süresi dolmuş bilet!"})
			c.Abort()
			return
		}

		// Her şey yolundaysa devam et!
		c.Next()
	}
}
