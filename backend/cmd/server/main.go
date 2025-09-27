package main

import (
	"agro_konnect/config"
	"agro_konnect/pkg/routes"
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		log.Fatal("FRONTEND_URL not set in .env")
	}

	// Load config - this already includes DB connection
	cfg := config.LoadConfig()
	db := cfg.DB

	// Verify DB connection
	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("❌ Failed to get database instance: %v", err)
	}
	defer sqlDB.Close()

	// Test the connection
	if err := sqlDB.Ping(); err != nil {
		log.Fatalf("❌ Database connection failed: %v", err)
	}

	router := gin.Default()

	// Add CORS middleware since you have FRONTEND_URL
	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", frontendURL)
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	routes.RegisterRoutes(router, db)

	// Start server
	log.Println("🚀 Server running at http://localhost:8080")
	log.Printf("🌐 Frontend URL: %s", frontendURL)
	if err := router.Run(":8080"); err != nil {
		log.Fatalf("❌ Failed to start server: %v", err)
	}
}
