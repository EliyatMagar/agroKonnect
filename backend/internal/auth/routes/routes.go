package routes

import (
	"agro_konnect/internal/auth/handler"
	"agro_konnect/internal/auth/middleware"
	"agro_konnect/internal/auth/model"
	"agro_konnect/internal/auth/repository"
	"agro_konnect/internal/auth/service"
	"agro_konnect/internal/auth/utils"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
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
		// ✅ FIXED: Test endpoint to verify authentication is working
		protected.GET("/test-auth", func(c *gin.Context) {
			userID, exists := c.Get(middleware.UserContextKey)
			if !exists {
				c.JSON(http.StatusUnauthorized, gin.H{
					"error": "user ID not found in context",
					"debug": "middleware might not be working for this route",
				})
				return
			}

			userRole, exists := c.Get(middleware.UserRoleContextKey)
			if !exists {
				c.JSON(http.StatusUnauthorized, gin.H{
					"error": "user role not found in context",
					"debug": "middleware might not be working for this route",
				})
				return
			}

			c.JSON(http.StatusOK, gin.H{
				"message":   "Authentication is working!",
				"user_id":   userID,
				"user_role": userRole,
				"debug":     "Middleware is functioning correctly for this route",
			})
		})

		// ✅ FIXED: User profile routes with enhanced debugging
		protected.GET("/profile", func(c *gin.Context) {
			// Debug middleware context
			userID, userIDExists := c.Get(middleware.UserContextKey)
			userRole, userRoleExists := c.Get(middleware.UserRoleContextKey)

			fmt.Printf("🔧 /profile endpoint - UserID exists: %v, UserRole exists: %v\n", userIDExists, userRoleExists)
			fmt.Printf("🔧 /profile endpoint - UserID: %v, UserRole: %v\n", userID, userRole)

			if !userIDExists {
				c.JSON(http.StatusUnauthorized, gin.H{
					"error": "user ID not found in context",
					"debug": gin.H{
						"middleware_working": false,
						"user_id_exists":     userIDExists,
						"user_role_exists":   userRoleExists,
						"route":              "/api/profile",
					},
				})
				return
			}

			// Convert userID to UUID
			userUUID, ok := userID.(uuid.UUID)
			if !ok {
				c.JSON(http.StatusInternalServerError, gin.H{
					"error": "invalid user ID format in context",
					"debug": gin.H{
						"user_id_type":  fmt.Sprintf("%T", userID),
						"user_id_value": userID,
						"route":         "/api/profile",
					},
				})
				return
			}

			// Get user from database
			user, err := authService.GetUserByID(c.Request.Context(), userUUID)
			if err != nil {
				c.JSON(http.StatusNotFound, gin.H{
					"error": "user not found in database",
					"debug": gin.H{
						"user_id": userUUID.String(),
						"error":   err.Error(),
					},
				})
				return
			}

			c.JSON(http.StatusOK, gin.H{
				"user": user,
				"debug": gin.H{
					"middleware_working": true,
					"user_id":            userID,
					"user_role":          userRole,
					"route":              "/api/profile",
				},
			})
		})

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
				userID, _ := c.Get(middleware.UserContextKey)
				userRole, _ := c.Get(middleware.UserRoleContextKey)

				c.JSON(200, gin.H{
					"message": "Farmer dashboard",
					"debug": gin.H{
						"user_id":   userID,
						"user_role": userRole,
					},
				})
			})
		}

		vendor := protected.Group("/vendor")
		vendor.Use(authMiddleware.RequireRole(model.RoleVendor, model.RoleAdmin))
		{
			vendor.GET("/dashboard", func(c *gin.Context) {
				userID, _ := c.Get(middleware.UserContextKey)
				userRole, _ := c.Get(middleware.UserRoleContextKey)

				c.JSON(200, gin.H{
					"message": "Vendor dashboard",
					"debug": gin.H{
						"user_id":   userID,
						"user_role": userRole,
					},
				})
			})
		}

		transporter := protected.Group("/transporter")
		transporter.Use(authMiddleware.RequireRole(model.RoleTransporter, model.RoleAdmin))
		{
			transporter.GET("/dashboard", func(c *gin.Context) {
				userID, _ := c.Get(middleware.UserContextKey)
				userRole, _ := c.Get(middleware.UserRoleContextKey)

				c.JSON(200, gin.H{
					"message": "Transporter dashboard",
					"debug": gin.H{
						"user_id":   userID,
						"user_role": userRole,
					},
				})
			})
		}

		buyer := protected.Group("/buyer")
		buyer.Use(authMiddleware.RequireRole(model.RoleBuyer, model.RoleAdmin))
		{
			buyer.GET("/dashboard", func(c *gin.Context) {
				userID, _ := c.Get(middleware.UserContextKey)
				userRole, _ := c.Get(middleware.UserRoleContextKey)

				c.JSON(200, gin.H{
					"message": "Buyer dashboard",
					"debug": gin.H{
						"user_id":   userID,
						"user_role": userRole,
					},
				})
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

			// Debug middleware test
			debug.GET("/middleware-test", authMiddleware.Authenticate(), func(c *gin.Context) {
				userID, _ := c.Get(middleware.UserContextKey)
				userRole, _ := c.Get(middleware.UserRoleContextKey)

				c.JSON(200, gin.H{
					"message":   "Middleware test successful",
					"user_id":   userID,
					"user_role": userRole,
				})
			})
		}
	}
}
