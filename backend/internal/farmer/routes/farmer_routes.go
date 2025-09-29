package routes

import (
	"agro_konnect/internal/auth/middleware"
	"agro_konnect/internal/auth/model"
	"agro_konnect/internal/farmer/handler"
	"agro_konnect/internal/farmer/repository"
	"agro_konnect/internal/farmer/service"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func SetupFarmerRoutes(router *gin.RouterGroup, db *gorm.DB, authMiddleware *middleware.AuthMiddleware) {
	// Initialize farmer dependencies
	farmerRepo := repository.NewFarmerRepository(db)
	farmerService := service.NewFarmerService(farmerRepo)
	farmerHandler := handler.NewFarmerHandler(farmerService)

	farmerRoutes := router.Group("/farmers")
	{
		// Public routes
		farmerRoutes.GET("", farmerHandler.GetAllFarmers)
		farmerRoutes.GET("/search", farmerHandler.SearchFarmers)
		farmerRoutes.GET("/nearby", farmerHandler.GetNearbyFarmers)
		farmerRoutes.GET("/:id", farmerHandler.GetFarmerByID)

		// Protected routes - requires authentication
		authRequired := farmerRoutes.Use(authMiddleware.Authenticate())
		{
			authRequired.POST("", farmerHandler.CreateFarmer)
			authRequired.GET("/me/profile", farmerHandler.GetMyProfile)
			authRequired.GET("/me/stats", farmerHandler.GetFarmerStats)
			authRequired.PUT("/me", farmerHandler.UpdateFarmer)
			authRequired.DELETE("/me", farmerHandler.DeleteFarmer)
		}

		// Admin only routes
		adminRoutes := farmerRoutes.Use(authMiddleware.Authenticate(), authMiddleware.RequireRole(model.RoleAdmin))
		{
			adminRoutes.PUT("/:id/verify", farmerHandler.VerifyFarmer)
		}
	}
}
