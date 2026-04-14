package main

// KENDİM İCİN NOTLAR ALIYORUM
//projenin calismaya baslayacagı yeri gosterir

import (
	"gymbuddy/database"
	"net/http" // durum kodlarını kullanabilmek icin

	"github.com/gin-gonic/gin"
)

func main() {
	database.DBConnect()
	r := gin.Default()

	// Test endpoint'i
	r.GET("/v1/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "Selam Nisa, GymBuddy backend çalışıyor! 🚀",
		})
		//gin.H: Bu Gin'e özel kısa bir yoldur. Bir map (anahtar-değer çifti) oluşturur. message anahtarına karşılık yazdırılmak istenen mesajı yerleştirir.
	})

	r.Run(":5000")
}
