package routes

import (
	"agro_konnect/internal/auth/middleware"
	"agro_konnect/internal/auth/model"
	"agro_konnect/internal/product/handler"
	"agro_konnect/internal/product/repository"
	"agro_konnect/internal/product/service"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func SetupAdminProductRoutes(router *gin.RouterGroup, db *gorm.DB, authMiddleware *middleware.AuthMiddleware) {
	// Initialize admin product dependencies
	adminRepo := repository.NewAdminProductRepository(db)
	adminService := service.NewAdminProductService(adminRepo)
	adminHandler := handler.NewAdminProductHandler(adminService)

	adminRoutes := router.Group("/admin/products")
	adminRoutes.Use(authMiddleware.Authenticate(), authMiddleware.RequireRole(model.RoleAdmin))
	{
		// Product management
		adminRoutes.GET("", adminHandler.GetProductsAdmin)
		adminRoutes.GET("/stats", adminHandler.GetProductStats)
		adminRoutes.GET("/status/:status", adminHandler.GetProductsByStatus)
		adminRoutes.GET("/:id", adminHandler.GetProductAdmin)

		// Status management
		adminRoutes.PUT("/:id/status", adminHandler.UpdateProductStatus)
		adminRoutes.PUT("/bulk-status", adminHandler.BulkUpdateProductStatus)

		// Featured management
		adminRoutes.PUT("/:id/featured", adminHandler.UpdateProductFeaturedStatus)

		// Delete operations
		adminRoutes.DELETE("/:id", adminHandler.DeleteProduct)
		adminRoutes.DELETE("/bulk-delete", adminHandler.BulkDeleteProducts)

		// Alerts and monitoring
		adminRoutes.GET("/alerts/expiring", adminHandler.GetExpiringProducts)
		adminRoutes.GET("/alerts/low-stock", adminHandler.GetLowStockProducts)
	}
}
