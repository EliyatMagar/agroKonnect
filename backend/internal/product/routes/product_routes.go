package routes

import (
	"agro_konnect/internal/auth/middleware"
	"agro_konnect/internal/product/handler"
	"agro_konnect/internal/product/repository"
	"agro_konnect/internal/product/service"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func SetupProductRoutes(router *gin.RouterGroup, db *gorm.DB, authMiddleware *middleware.AuthMiddleware, uploadDir string) {
	// Initialize product dependencies
	productRepo := repository.NewProductRepository(db)
	productService := service.NewProductService(productRepo)
	productHandler := handler.NewProductHandler(productService)

	// Initialize image handler
	imageHandler := handler.NewImageHandler(uploadDir)

	productRoutes := router.Group("/products")
	{
		// Public routes
		productRoutes.GET("", productHandler.GetAllProducts)
		productRoutes.GET("/search", productHandler.SearchProducts)
		productRoutes.GET("/featured", productHandler.GetFeaturedProducts)
		productRoutes.GET("/category/:category", productHandler.GetProductsByCategory)
		productRoutes.GET("/:id", productHandler.GetProductByID)

		// Image serving (public)
		productRoutes.GET("/images/:filename", imageHandler.ServeProductImage)

		// Protected routes - requires authentication
		authRequired := productRoutes.Use(authMiddleware.Authenticate())
		{
			authRequired.POST("", productHandler.CreateProduct)
			authRequired.GET("/me", productHandler.GetMyProducts)
			authRequired.PUT("/:id", productHandler.UpdateProduct)
			authRequired.DELETE("/:id", productHandler.DeleteProduct)
			authRequired.PUT("/:id/stock", productHandler.UpdateStock)
			authRequired.PUT("/:id/status", productHandler.UpdateStatus)

			// Image upload routes
			authRequired.POST("/images/upload", imageHandler.UploadProductImage)
			authRequired.POST("/images/upload-multiple", imageHandler.UploadMultipleProductImages)
			authRequired.DELETE("/images/:filename", imageHandler.DeleteProductImage)
		}
	}

	// Setup admin routes
	SetupAdminProductRoutes(router, db, authMiddleware)
}
