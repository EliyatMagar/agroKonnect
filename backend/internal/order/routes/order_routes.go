package routes

import (
	"agro_konnect/internal/auth/middleware"
	"agro_konnect/internal/auth/model"
	farmerRepo "agro_konnect/internal/farmer/repository"
	"agro_konnect/internal/order/handler"
	"agro_konnect/internal/order/repository"
	"agro_konnect/internal/order/service"
	productRepo "agro_konnect/internal/product/repository"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func SetupOrderRoutes(router *gin.RouterGroup, db *gorm.DB, authMiddleware *middleware.AuthMiddleware) {
	// Initialize order dependencies
	orderRepo := repository.NewOrderRepository(db)
	productRepo := productRepo.NewProductRepository(db)
	farmerRepo := farmerRepo.NewFarmerRepository(db)
	orderService := service.NewOrderService(orderRepo, productRepo)
	orderHandler := handler.NewOrderHandler(orderService, farmerRepo)

	orderRoutes := router.Group("/orders")
	{
		// Public routes
		orderRoutes.GET("/track/:orderNumber", orderHandler.GetOrderByNumber)

		// Protected routes - requires authentication (same pattern as product routes)
		authRequired := orderRoutes.Use(authMiddleware.Authenticate())
		{
			// Routes for all authenticated users
			authRequired.POST("", orderHandler.CreateOrder)
			authRequired.GET("/me", orderHandler.GetMyOrders)
			authRequired.GET("/summary", orderHandler.GetOrderSummary)
			authRequired.GET("/:id", orderHandler.GetOrderByID)
			authRequired.POST("/:id/cancel", orderHandler.CancelOrder)
			authRequired.GET("/:id/tracking", orderHandler.GetTrackingHistory)
			authRequired.POST("/:id/payment", orderHandler.ProcessPayment)

			// Farmer-only routes - apply role middleware directly to specific routes
			authRequired.PUT("/:id/status", authMiddleware.RequireRole(model.RoleFarmer), orderHandler.UpdateOrderStatus)
			authRequired.PUT("/:id/assign-transporter", authMiddleware.RequireRole(model.RoleFarmer), orderHandler.AssignTransporter)
		}
	}
}
