package handler

import (
	"agro_konnect/internal/auth/dto"
	"agro_konnect/internal/auth/model"
	"agro_konnect/internal/auth/repository"
	"agro_konnect/internal/auth/service"
	"agro_konnect/internal/auth/utils"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AdminHandler struct {
	authService service.AuthService
	userRepo    repository.UserRepository
	jwtManager  *utils.JWTManager
}

func NewAdminHandler(authService service.AuthService, userRepo repository.UserRepository, jwtManager *utils.JWTManager) *AdminHandler {
	return &AdminHandler{
		authService: authService,
		userRepo:    userRepo,
		jwtManager:  jwtManager,
	}
}

// GetUsers returns paginated list of users with optional filters
func (h *AdminHandler) GetUsers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	role := c.Query("role")
	search := c.Query("search")

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	offset := (page - 1) * limit

	users, total, err := h.userRepo.FindAllWithFilters(limit, offset, role, search)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}

	userResponses := make([]*dto.UserResponse, len(users))
	for i, user := range users {
		userResponses[i] = &dto.UserResponse{
			ID:         user.ID,
			Email:      user.Email,
			Phone:      user.Phone,
			Role:       user.Role,
			IsVerified: user.IsVerified,
			IsActive:   user.IsActive,
			CreatedAt:  user.CreatedAt,
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"users": userResponses,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": total,
			"pages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// GetUserByID returns a specific user by ID
func (h *AdminHandler) GetUserByID(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	user, err := h.userRepo.FindByID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	userResponse := &dto.UserResponse{
		ID:         user.ID,
		Email:      user.Email,
		Phone:      user.Phone,
		Role:       user.Role,
		IsVerified: user.IsVerified,
		IsActive:   user.IsActive,
		CreatedAt:  user.CreatedAt,
	}

	c.JSON(http.StatusOK, userResponse)
}

// UpdateUser updates user information
func (h *AdminHandler) UpdateUser(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	var req struct {
		Email    *string         `json:"email,omitempty"`
		Phone    *string         `json:"phone,omitempty"`
		Role     *model.UserRole `json:"role,omitempty"`
		IsActive *bool           `json:"is_active,omitempty"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.userRepo.FindByID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	// Update fields if provided
	if req.Email != nil {
		// Check if email is already taken by another user
		existingUser, _ := h.userRepo.FindByEmail(*req.Email)
		if existingUser != nil && existingUser.ID != user.ID {
			c.JSON(http.StatusConflict, gin.H{"error": "email already taken"})
			return
		}
		user.Email = *req.Email
	}

	if req.Phone != nil {
		// Check if phone is already taken by another user
		existingUser, _ := h.userRepo.FindByPhone(*req.Phone)
		if existingUser != nil && existingUser.ID != user.ID {
			c.JSON(http.StatusConflict, gin.H{"error": "phone number already taken"})
			return
		}
		user.Phone = *req.Phone
	}

	if req.Role != nil {
		user.Role = *req.Role
	}

	if req.IsActive != nil {
		user.IsActive = *req.IsActive
	}

	user.UpdatedAt = time.Now()

	if err := h.userRepo.Update(user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "user updated successfully"})
}

// DeleteUser soft deletes a user
func (h *AdminHandler) DeleteUser(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	// Prevent admin from deleting themselves
	currentUserID, _ := GetUserIDFromContext(c)
	if currentUserID == userID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cannot delete your own account"})
		return
	}

	if err := h.userRepo.Delete(userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "user deleted successfully"})
}

// ActivateUser activates a user account
func (h *AdminHandler) ActivateUser(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	user, err := h.userRepo.FindByID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	user.IsActive = true
	user.UpdatedAt = time.Now()

	if err := h.userRepo.Update(user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to activate user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "user activated successfully"})
}

// DeactivateUser deactivates a user account
func (h *AdminHandler) DeactivateUser(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	// Prevent admin from deactivating themselves
	currentUserID, _ := GetUserIDFromContext(c)
	if currentUserID == userID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cannot deactivate your own account"})
		return
	}

	user, err := h.userRepo.FindByID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	user.IsActive = false
	user.UpdatedAt = time.Now()

	if err := h.userRepo.Update(user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to deactivate user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "user deactivated successfully"})
}

// GetUserStats returns statistics about users
func (h *AdminHandler) GetUserStats(c *gin.Context) {
	stats, err := h.userRepo.GetUserStatistics()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user statistics"})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// ImpersonateUser allows admin to get access token for another user (for support purposes)
func (h *AdminHandler) ImpersonateUser(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	user, err := h.userRepo.FindByID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	// Generate token for the target user
	accessToken, expiresAt, err := h.jwtManager.GenerateAccessToken(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"access_token": accessToken,
		"expires_at":   expiresAt,
		"user": &dto.UserResponse{
			ID:         user.ID,
			Email:      user.Email,
			Phone:      user.Phone,
			Role:       user.Role,
			IsVerified: user.IsVerified,
			IsActive:   user.IsActive,
			CreatedAt:  user.CreatedAt,
		},
		"impersonated": true,
		"message":      "Use this token to act on behalf of the user",
	})
}

// Helper function to get user ID from context
func GetUserIDFromContext(c *gin.Context) (uuid.UUID, error) {
	userID, exists := c.Get("user")
	if !exists {
		return uuid.Nil, service.ErrUnauthorized
	}

	return userID.(uuid.UUID), nil
}
