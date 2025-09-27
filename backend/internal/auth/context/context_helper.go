package context

import (
	"agro_konnect/internal/auth/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func GetUserIDFromContext(c *gin.Context) (uuid.UUID, error) {
	userID, exists := c.Get("user")
	if !exists {
		return uuid.Nil, service.ErrUnauthorized
	}

	return userID.(uuid.UUID), nil
}
