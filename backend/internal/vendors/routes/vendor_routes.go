package routes

import (
	"agro_konnect/internal/auth/middleware"
	"agro_konnect/internal/vendors/handler"
	"agro_konnect/internal/vendors/repository"
	"agro_konnect/internal/vendors/service"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func SetupVendorRoutes(router *gin.RouterGroup, db *gorm.DB, authMiddleware *middleware.AuthMiddleware) {
	// Initialize vendor dependencies
	vendorRepo := repository.NewVendorRepository(db)
	vendorProductRepo := repository.NewVendorProductRepository(db)
	vendorService := service.NewVendorService(vendorRepo, vendorProductRepo)
	vendorProductService := service.NewVendorProductService(vendorRepo, vendorProductRepo)

	vendorHandler := handler.NewVendorHandler(vendorService)
	vendorProductHandler := handler.NewVendorProductHandler(vendorProductService)

	// Initialize image handler
	vendorUploadDir := "./uploads/vendors"
	imageHandler := handler.NewVendorImageHandler(vendorUploadDir)

	vendorRoutes := router.Group("/vendors")
	{
		// Public routes
		vendorRoutes.GET("", vendorHandler.GetAllVendors)
		vendorRoutes.GET("/search", vendorHandler.SearchVendors)
		vendorRoutes.GET("/nearby", vendorHandler.GetNearbyVendors)
		vendorRoutes.GET("/:id", vendorHandler.GetVendorByID)
		vendorRoutes.GET("/:id/products", vendorProductHandler.GetVendorProducts)

		// Image serving (public)
		vendorRoutes.GET("/products/images/:filename", imageHandler.ServeVendorProductImage)
		vendorRoutes.GET("/logos/:filename", imageHandler.ServeVendorLogo)

		// Protected routes - requires authentication
		authRequired := vendorRoutes.Use(authMiddleware.Authenticate())
		{
			// Vendor profile routes
			authRequired.POST("", vendorHandler.CreateVendor)
			authRequired.GET("/me/profile", vendorHandler.GetMyProfile)
			authRequired.GET("/me/stats", vendorHandler.GetVendorStats)
			authRequired.PUT("/me", vendorHandler.UpdateVendor)
			authRequired.DELETE("/me", vendorHandler.DeleteVendor)

			// Vendor product routes
			authRequired.POST("/products", vendorProductHandler.AddProduct)
			authRequired.GET("/me/products", vendorProductHandler.GetMyProducts)
			authRequired.PUT("/products/:id", vendorProductHandler.UpdateProduct)
			authRequired.DELETE("/products/:id", vendorProductHandler.DeleteProduct)
			authRequired.PUT("/products/:id/stock", vendorProductHandler.UpdateStock)
			authRequired.PUT("/products/:id/status", vendorProductHandler.UpdateProductStatus)

			// Image upload routes
			authRequired.POST("/products/images/upload", imageHandler.UploadVendorProductImage)
			authRequired.POST("/products/images/upload-multiple", imageHandler.UploadMultipleVendorProductImages)
			authRequired.DELETE("/products/images/:filename", imageHandler.DeleteVendorProductImage)
			authRequired.POST("/logo/upload", imageHandler.UploadVendorLogo)
		}

		// Admin routes
		adminRoutes := vendorRoutes.Group("")
		adminRoutes.Use(authMiddleware.Authenticate(), authMiddleware.RequireRole("admin"))
		{
			adminRoutes.PUT("/:id/verify", vendorHandler.VerifyVendor)
		}
	}
}
