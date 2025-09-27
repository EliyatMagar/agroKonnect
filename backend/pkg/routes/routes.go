package routes

import (
	authroutes "agro_konnect/internal/auth/routes" // Renamed import for clarity

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RegisterRoutes(r *gin.Engine, db *gorm.DB) {
	authroutes.UserRoutes(r, db)
}
