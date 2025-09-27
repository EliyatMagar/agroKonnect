package config

import (
	"agro_konnect/internal/auth/model"
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type Config struct {
	DB        *gorm.DB
	JWTSecret string
}

func LoadConfig() *Config {
	// Use individual environment variables for better clarity
	dbHost := getEnv("DB_HOST", "localhost")
	dbPort := getEnv("DB_PORT", "5432")
	dbUser := getEnv("DB_USER", "postgres")
	dbPassword := getEnv("DB_PASSWORD", "your_password_here") // CHANGE THIS
	dbName := getEnv("DB_NAME", "agroKonnect")
	dbSSLMode := getEnv("DB_SSLMODE", "disable")

	// Construct DSN string
	dsn := "host=" + dbHost +
		" user=" + dbUser +
		" password=" + dbPassword +
		" dbname=" + dbName +
		" port=" + dbPort +
		" sslmode=" + dbSSLMode

	jwtSecret := getEnv("JWT_SECRET", "supersecretkey")

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect database:", err)
	}

	// AutoMigrate database tables
	if err := autoMigrate(db); err != nil {
		log.Fatal("Failed to auto-migrate database:", err)
	}

	return &Config{
		DB:        db,
		JWTSecret: jwtSecret,
	}
}

func autoMigrate(db *gorm.DB) error {
	// Migrate all your models here
	err := db.AutoMigrate(
		&model.User{},
		&model.VerificationCode{},
		// Add other models as needed
	)

	if err != nil {
		return err
	}

	log.Println("✅ Database tables migrated successfully")
	return nil
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

// Optional: Separate function for manual migration control
func MigrateDB(db *gorm.DB) error {
	return autoMigrate(db)
}
