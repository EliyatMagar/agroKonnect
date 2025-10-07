package routes

import (
	"agro_konnect/internal/auth/middleware"
	"agro_konnect/internal/transporter/handler"
	"agro_konnect/internal/transporter/repository"
	"agro_konnect/internal/transporter/service"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func SetupTransporterRoutes(router *gin.RouterGroup, db *gorm.DB, authMiddleware *middleware.AuthMiddleware) {
	// Initialize transporter dependencies
	transporterRepo := repository.NewTransporterRepository(db)
	vehicleRepo := repository.NewVehicleRepository(db)
	transporterService := service.NewTransporterService(transporterRepo, vehicleRepo)
	vehicleService := service.NewVehicleService(vehicleRepo, transporterRepo)
	transporterHandler := handler.NewTransporterHandler(transporterService, vehicleService)

	// Public routes
	transporterRoutes := router.Group("/transporters")
	{
		transporterRoutes.GET("", transporterHandler.GetAllTransporters)
		transporterRoutes.GET("/vehicles/available", transporterHandler.GetAvailableVehicles)
		transporterRoutes.GET("/:id/vehicles", transporterHandler.GetVehiclesByTransporter)
		transporterRoutes.GET("/:id", transporterHandler.GetTransporterByID)
	}

	// Protected routes (authenticated users)
	protected := router.Group("/transporters")
	protected.Use(authMiddleware.Authenticate())
	{
		protected.POST("", transporterHandler.CreateTransporter)
		protected.GET("/me", transporterHandler.GetMyTransporterProfile)
		protected.PUT("/:id", transporterHandler.UpdateTransporter)
		protected.DELETE("/:id", transporterHandler.DeleteTransporter)
		protected.GET("/:id/stats", transporterHandler.GetTransporterStats)

		// Vehicle routes
		protected.POST("/vehicles", transporterHandler.AddVehicle)
		protected.GET("/vehicles/my-vehicles", transporterHandler.GetMyVehicles)
		protected.PUT("/vehicles/:id", transporterHandler.UpdateVehicle)
		protected.PUT("/vehicles/:id/availability", transporterHandler.UpdateVehicleAvailability)
		protected.PUT("/vehicles/:id/location", transporterHandler.UpdateVehicleLocation)
		protected.DELETE("/vehicles/:id", transporterHandler.DeleteVehicle)
	}

	// Admin only routes
	admin := router.Group("/transporters")
	admin.Use(authMiddleware.Authenticate(), authMiddleware.RequireRole("admin"))
	{
		admin.PUT("/:id/verify", transporterHandler.VerifyTransporter)
		admin.PUT("/:id/premium", transporterHandler.UpdatePremiumStatus)
	}
}
