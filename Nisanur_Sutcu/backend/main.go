package main

import (
	"gymbuddy/controllers"
	"gymbuddy/database"
	"gymbuddy/middleware"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

func main() {

	r := gin.Default()

	// CORS Middleware
	r.Use(func(c *gin.Context) {
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

	// Test endpoint'i
	r.GET("/v1/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": " GymBuddy backend çalışıyor",
		})
	})

	// Auth Rotaları
	r.POST("/auth/register", controllers.RegisterUser)// Register endpoint'ine POST isteği geldiğinde RegisterUser fonksiyonunu çağır
	r.POST("/auth/login", controllers.LoginUser)// Login endpoint'ine POST isteği geldiğinde LoginUser fonksiyonunu çağır


	// Korumalı Rotalar
	protected := r.Group("/v1/api")// "/v1/api" ile başlayan rotalar için bir grup oluşturuyoruz
	protected.Use(middleware.AuthMiddleware())
	{
		protected.GET("/secure-data", func(c *gin.Context) {// "/v1/api/secure-data" endpoint'ine GET isteği geldiğinde bu fonksiyonu çalıştır
			c.JSON(http.StatusOK, gin.H{
				"message": " Token onayland️ı",
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

	r.POST("/workouts", controllers.CreateWorkout)
	r.GET("/workouts", controllers.GetWorkouts)
	r.DELETE("/workouts/:id", controllers.DeleteWorkout)
	r.PUT("/workouts/:id", controllers.UpdateWorkout)
	r.POST("/measures", controllers.AddBodyMeasure)
	r.PUT("/measures/:id", controllers.UpdateBodyMeasure)
	r.GET("/stats/body", controllers.GetBodyStats)
	r.PUT("/user/target", controllers.UpdateTargetWeight)
	r.GET("/ai/recommend", controllers.GetAIRecommendation)
	r.DELETE("/measures/:id", controllers.DeleteBodyMeasure)

	port := os.Getenv("PORT")
	if port == "" {
		port = "5000"
	}

	r.Run(":" + port)
}
