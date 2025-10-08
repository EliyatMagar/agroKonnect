package routes

import (
	"agro_konnect/internal/auth/middleware"
	authroutes "agro_konnect/internal/auth/routes"
	"agro_konnect/internal/auth/utils"
	buyerroutes "agro_konnect/internal/buyer/routes"
	farmerroutes "agro_konnect/internal/farmer/routes"
	orderroutes "agro_konnect/internal/order/routes"
	productroutes "agro_konnect/internal/product/routes"
	transporterroutes "agro_konnect/internal/transporter/routes"
	vendorroutes "agro_konnect/internal/vendors/routes"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RegisterRoutes(r *gin.Engine, db *gorm.DB) {
	// Initialize JWT manager for middleware
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "your-default-jwt-secret-key-change-in-production"
	}
	tokenDuration := 24 * time.Hour
	jwtManager := utils.NewJWTManager(jwtSecret, tokenDuration)

	// Initialize auth middleware
	authMiddleware := middleware.NewAuthMiddleware(jwtManager)

	// Create API router group
	api := r.Group("/api")

	// Register routes
	authroutes.UserRoutes(r, db)                            // This already sets up its own routes
	farmerroutes.SetupFarmerRoutes(api, db, authMiddleware) // Fixed: added missing parameters

	vendorroutes.SetupVendorRoutes(api, db, authMiddleware) // Fixed: added missing parameters

	buyerroutes.SetupBuyerRoutes(api, db, authMiddleware)

	transporterroutes.SetupTransporterRoutes(api, db, authMiddleware)

	orderroutes.SetupOrderRoutes(api, db, authMiddleware)

	// Register product routes with upload directory
	productUploadDir := "./uploads/products"
	productroutes.SetupProductRoutes(api, db, authMiddleware, productUploadDir)
}
