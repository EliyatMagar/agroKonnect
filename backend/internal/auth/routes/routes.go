package routes

import (
	"agro_konnect/internal/auth/handler"
	"agro_konnect/internal/auth/middleware"
	"agro_konnect/internal/auth/model"
	"agro_konnect/internal/auth/repository"
	"agro_konnect/internal/auth/service"
	"agro_konnect/internal/auth/utils"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func UserRoutes(r *gin.Engine, db *gorm.DB) {
	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	verificationRepo := repository.NewVerificationRepository(db)

	// Initialize JWT manager
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "your-default-jwt-secret-key-change-in-production"
	}
	tokenDuration := 24 * time.Hour // Token valid for 24 hours
	jwtManager := utils.NewJWTManager(jwtSecret, tokenDuration)

	// Initialize email service
	emailService := service.NewMockEmailService()

	// Initialize services
	authService := service.NewAuthService(userRepo, verificationRepo, jwtManager, emailService)

	// Initialize handlers
	authHandler := handler.NewAuthHandler(authService)
	adminHandler := handler.NewAdminHandler(authService, userRepo, jwtManager)

	// Initialize middleware
	authMiddleware := middleware.NewAuthMiddleware(jwtManager)

	// Public routes
	api := r.Group("/api")
	{
		// Health check
		api.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{"status": "ok", "service": "auth"})
		})

		// Auth routes
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/verify-email", authHandler.VerifyEmail)
			auth.POST("/forgot-password", authHandler.ForgotPassword)
			auth.POST("/reset-password", authHandler.ResetPassword)
			auth.POST("/refresh-token", authHandler.RefreshToken)
		}
	}

	// Protected routes (require authentication)
	protected := api.Group("/")
	protected.Use(authMiddleware.Authenticate())
	{
		// User profile routes
		protected.GET("/profile", authHandler.GetProfile)
		protected.PUT("/change-password", authHandler.ChangePassword)

		// Admin routes (require admin role)
		admin := protected.Group("/admin")
		admin.Use(authMiddleware.RequireRole(model.RoleAdmin))
		{
			admin.GET("/users", adminHandler.GetUsers)
			admin.GET("/users/:id", adminHandler.GetUserByID)
			admin.PUT("/users/:id", adminHandler.UpdateUser)
			admin.DELETE("/users/:id", adminHandler.DeleteUser)
			admin.POST("/users/:id/activate", adminHandler.ActivateUser)
			admin.POST("/users/:id/deactivate", adminHandler.DeactivateUser)
			admin.GET("/stats/users", adminHandler.GetUserStats)
			admin.POST("/users/:id/impersonate", adminHandler.ImpersonateUser)
		}

		// Role-based routes
		farmer := protected.Group("/farmer")
		farmer.Use(authMiddleware.RequireRole(model.RoleFarmer, model.RoleAdmin))
		{
			farmer.GET("/dashboard", func(c *gin.Context) {
				c.JSON(200, gin.H{"message": "Farmer dashboard"})
			})
		}

		vendor := protected.Group("/vendor")
		vendor.Use(authMiddleware.RequireRole(model.RoleVendor, model.RoleAdmin))
		{
			vendor.GET("/dashboard", func(c *gin.Context) {
				c.JSON(200, gin.H{"message": "Vendor dashboard"})
			})
		}

		transporter := protected.Group("/transporter")
		transporter.Use(authMiddleware.RequireRole(model.RoleTransporter, model.RoleAdmin))
		{
			transporter.GET("/dashboard", func(c *gin.Context) {
				c.JSON(200, gin.H{"message": "Transporter dashboard"})
			})
		}

		buyer := protected.Group("/buyer")
		buyer.Use(authMiddleware.RequireRole(model.RoleBuyer, model.RoleAdmin))
		{
			buyer.GET("/dashboard", func(c *gin.Context) {
				c.JSON(200, gin.H{"message": "Buyer dashboard"})
			})
		}
	}

	// Debug routes (remove in production)
	if gin.Mode() != gin.ReleaseMode {
		debug := api.Group("/debug")
		{
			debug.GET("/users", func(c *gin.Context) {
				users, _, err := userRepo.FindAllWithFilters(10, 0, "", "")
				if err != nil {
					c.JSON(500, gin.H{"error": err.Error()})
					return
				}
				c.JSON(200, gin.H{"users": users})
			})
		}
	}
}
