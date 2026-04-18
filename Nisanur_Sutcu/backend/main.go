package main

import (
	"gymbuddy/controllers"
	"gymbuddy/database"

	//"gymbuddy/middleware"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

func main() {

	r := gin.Default()

	// CORS Ayarları
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
			"message": "Selam Nisa, GymBuddy backend çalışıyor! 🚀",
		})
	})

	// Auth Rotaları
	r.POST("/auth/register", controllers.RegisterUser)
	r.POST("/auth/login", controllers.LoginUser)
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
