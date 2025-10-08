package routes

import (
	"agro_konnect/internal/auth/middleware"
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
	farmerRepo := farmerRepo.NewFarmerRepository(db) // Add this
	orderService := service.NewOrderService(orderRepo, productRepo)
	orderHandler := handler.NewOrderHandler(orderService, farmerRepo)

	orderRoutes := router.Group("/orders")
	{
		// Protected routes - requires authentication
		authRequired := orderRoutes.Use(authMiddleware.Authenticate())
		{
			// Order management
			authRequired.POST("", orderHandler.CreateOrder)
			authRequired.GET("/me", orderHandler.GetMyOrders)
			authRequired.GET("/summary", orderHandler.GetOrderSummary)

			// Specific order operations
			authRequired.GET("/:id", orderHandler.GetOrderByID)
			authRequired.PUT("/:id/status", orderHandler.UpdateOrderStatus)
			authRequired.POST("/:id/cancel", orderHandler.CancelOrder)
			authRequired.GET("/:id/tracking", orderHandler.GetTrackingHistory)

			// Payment
			authRequired.POST("/:id/payment", orderHandler.ProcessPayment)

			// Farmer specific routes
			authRequired.PUT("/:id/assign-transporter", orderHandler.AssignTransporter)
		}

		// Public routes (with order number)
		orderRoutes.GET("/track/:orderNumber", orderHandler.GetOrderByNumber)
	}
}
