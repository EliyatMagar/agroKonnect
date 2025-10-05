package middleware

import (
	"agro_konnect/internal/auth/model"
	"agro_konnect/internal/auth/service"
	"agro_konnect/internal/auth/utils"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const (
	AuthorizationHeader = "Authorization"
	UserContextKey      = "userID"   // unified key for userID
	UserRoleContextKey  = "userRole" // unified key for role
)

type AuthMiddleware struct {
	jwtManager *utils.JWTManager
}

func NewAuthMiddleware(jwtManager *utils.JWTManager) *AuthMiddleware {
	return &AuthMiddleware{jwtManager: jwtManager}
}

// Authenticate verifies JWT and injects user info into context
func (m *AuthMiddleware) Authenticate() gin.HandlerFunc {
	return func(c *gin.Context) {
		token := extractToken(c.Request)
		if token == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "authorization token required"})
			c.Abort()
			return
		}

		claims, err := m.jwtManager.ValidateToken(token)
		if err != nil {
			if err == utils.ErrTokenExpired {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "token expired"})
			} else {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			}
			c.Abort()
			return
		}

		// ✅ Use claims.UserID directly
		userID := claims.UserID

		c.Set(UserContextKey, userID)
		c.Set(UserRoleContextKey, claims.Role)
		c.Next()
	}
}

// RequireRole checks if user has one of the required roles
func (m *AuthMiddleware) RequireRole(roles ...model.UserRole) gin.HandlerFunc {
	return func(c *gin.Context) {
		_, exists := c.Get(UserContextKey)
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "authentication required"})
			c.Abort()
			return
		}

		userRole, exists := c.Get(UserRoleContextKey)
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "user role not found"})
			c.Abort()
			return
		}

		hasRequiredRole := false
		for _, role := range roles {
			if userRole == role {
				hasRequiredRole = true
				break
			}
		}

		if !hasRequiredRole {
			c.JSON(http.StatusForbidden, gin.H{"error": "insufficient permissions"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// Helper to extract bearer token
func extractToken(r *http.Request) string {
	bearerToken := r.Header.Get(AuthorizationHeader)
	if strings.HasPrefix(bearerToken, "Bearer ") {
		return strings.TrimPrefix(bearerToken, "Bearer ")
	}
	return ""
}

// Helper to get user ID from context
func GetUserIDFromContext(c *gin.Context) (uuid.UUID, error) {
	userID, exists := c.Get(UserContextKey)
	if !exists {
		return uuid.Nil, service.ErrUnauthorized
	}
	return userID.(uuid.UUID), nil
}
