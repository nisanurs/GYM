package main

// KENDİM İCİN NOTLAR ALIYORUM
//projenin calismaya baslayacagı yeri gosterir

import (
	"gymbuddy/controllers"
	"gymbuddy/database"
	"gymbuddy/middleware"
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
		protected.PUT("/user/target/:id", controllers.UpdateTargetWeight)
		protected.GET("/ai/recommend/:id", controllers.GetAIRecommendation)
	}
	r.Run(":5000")
}
