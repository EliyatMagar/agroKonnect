package routes

import (
	"agro_konnect/internal/auth/middleware"
	"agro_konnect/internal/buyer/handler"
	"agro_konnect/internal/buyer/repository"
	"agro_konnect/internal/buyer/service"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func SetupBuyerRoutes(router *gin.RouterGroup, db *gorm.DB, authMiddleware *middleware.AuthMiddleware) {
	// Initialize buyer dependencies
	buyerRepo := repository.NewBuyerRepository(db)
	buyerService := service.NewBuyerService(buyerRepo)
	buyerHandler := handler.NewBuyerHandler(buyerService)

	buyerRoutes := router.Group("/buyers")
	{
		// Public routes
		buyerRoutes.GET("", buyerHandler.GetAllBuyers)
		buyerRoutes.GET("/:id", buyerHandler.GetBuyerByID)

		// Protected routes - requires authentication
		authRequired := buyerRoutes.Use(authMiddleware.Authenticate())
		{
			authRequired.POST("", buyerHandler.CreateBuyer)
			authRequired.GET("/me", buyerHandler.GetMyBuyerProfile)
			authRequired.PUT("/:id", buyerHandler.UpdateBuyer)
			authRequired.DELETE("/:id", buyerHandler.DeleteBuyer)
			authRequired.GET("/:id/stats", buyerHandler.GetBuyerStats)

			// Admin routes
			adminRequired := authRequired.Use(authMiddleware.RequireRole("admin"))
			{
				adminRequired.PUT("/:id/verify", buyerHandler.VerifyBuyer)
			}
		}
	}
}
