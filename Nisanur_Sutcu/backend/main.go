package main

// KENDİM İCİN NOTLAR ALIYORUM
//projenin calismaya baslayacagı yeri gosterir

import (
	"gymbuddy/controllers"
	"gymbuddy/database"
	"gymbuddy/middleware"
	"net/http" // durum kodlarını kullanabilmek icin
	"os"

	"github.com/gin-gonic/gin"
)

func main() {
	router := gin.Default()
	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})
	database.DBConnect()
	r := gin.Default()

	// Test endpoint'i
	r.GET("/v1/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "Selam Nisa, GymBuddy backend çalışıyor! 🚀",
		})
		//gin.H: Bu Gin'e özel kısa bir yoldur. Bir map (anahtar-değer çifti) oluşturur. message anahtarına karşılık yazdırılmak istenen mesajı yerleştirir.
	})

	r.POST("/auth/register", controllers.RegisterUser)
	r.POST("/auth/login", controllers.LoginUser)

	protected := r.Group("/v1/api")
	protected.Use(middleware.AuthMiddleware())
	{

		protected.GET("/secure-data", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"message": "Tebrikler Nisa! Token onaylandı, gizli verilere eriştin. 🕵️‍♀️",
			})
		})
		protected.POST("/workouts", controllers.CreateWorkout)
		protected.GET("/workouts", controllers.GetWorkouts)
		protected.DELETE("/workouts/:id", controllers.DeleteWorkout)
		protected.PUT("/workouts/:id", controllers.UpdateWorkout)
		protected.POST("/measures", controllers.AddBodyMeasure)
		protected.PUT("/measures/:id", controllers.UpdateBodyMeasure)
		protected.GET("/stats/body", controllers.GetBodyStats)
		protected.PUT("/user/target", controllers.UpdateTargetWeight)
		protected.GET("/ai/recommend", controllers.GetAIRecommendation)
		protected.DELETE("/measures/:id", controllers.DeleteBodyMeasure)
	}
	port := os.Getenv("PORT")
	if port == "" {
		port = "5000" // Eğer Render'dan gelmezse yerelde 5000 kullan
	}
	router.Run(":" + port)
}
