package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

var jwtKey = []byte("nisakey")

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. Header'dan token'ı al
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Yetkisiz erişim! Biletiniz yok."})
			c.Abort()
			return
		}

		// 2. "Bearer " kısmını ayıkla
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		// 3. Token'ı doğrula ve içindeki bilgileri (claims) al
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return jwtKey, nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Geçersiz veya süresi dolmuş bilet!"})
			c.Abort()
			return
		}

		//  Token içindeki Kullanıcı ID'sini çıkar ve Sakla
		if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid { // Token geçerliyse claims'leri al
			// Login olurken "id" olarak kaydettiğimiz string'i alıyoruz
			userIDStr, ok := claims["user_id"].(string)

			if !ok {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Token içinde user_id bulunamadı!"})
				c.Abort()
				return
			}
			// String ID'yi MongoDB'nin sevdiği ObjectID formatına çeviriyoruz
			objID, err := primitive.ObjectIDFromHex(userIDStr)
			if err != nil {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Kullanıcı ID formatı bozuk!"})
				c.Abort()
				return
			}

			// Controller'larda c.Get("userId") diyerek alabilmek için Set ediyoruz
			c.Set("userId", objID)
		}

		// Her şey yolundaysa sıradaki işleme (Controller'a) geç
		c.Next()
	}
}
