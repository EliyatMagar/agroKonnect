package handler

import (
	"net/http"

	dto "agro_konnect/internal/buyer/dto"
	"agro_konnect/internal/buyer/service"
	"agro_konnect/internal/buyer/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type BuyerHandler struct {
	buyerService service.BuyerService
}

func NewBuyerHandler(buyerService service.BuyerService) *BuyerHandler {
	return &BuyerHandler{
		buyerService: buyerService,
	}
}

// CreateBuyer creates a new buyer profile
// @Summary Create buyer profile
// @Description Create a new buyer profile for the authenticated user
// @Tags buyers
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body dto.CreateBuyerRequest true "Buyer creation data"
// @Success 201 {object} utils.SuccessResponse{data=model.Buyer} "Buyer profile created successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid input data"
// @Failure 401 {object} utils.ErrorResponse "Unauthorized"
// @Failure 409 {object} utils.ErrorResponse "Buyer profile already exists"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /buyers [post]
func (h *BuyerHandler) CreateBuyer(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil {
		utils.RespondWithError(c, http.StatusUnauthorized, err.Error())
		return
	}

	var req dto.CreateBuyerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid input data: "+err.Error())
		return
	}

	// Validate using custom validator
	if err := utils.ValidateStruct(req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, err.Error())
		return
	}

	buyer, err := h.buyerService.CreateBuyer(c.Request.Context(), userID, &req)
	if err != nil {
		switch err {
		case service.ErrBuyerAlreadyExists:
			utils.RespondWithError(c, http.StatusConflict, err.Error())
		case service.ErrInvalidBusinessData:
			utils.RespondWithError(c, http.StatusBadRequest, err.Error())
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to create buyer profile")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusCreated, "Buyer profile created successfully", buyer)
}

// GetBuyerByID gets a buyer by ID
// @Summary Get buyer by ID
// @Description Get a buyer profile by its ID
// @Tags buyers
// @Produce json
// @Param id path string true "Buyer ID"
// @Success 200 {object} utils.SuccessResponse{data=dto.BuyerResponse} "Buyer profile retrieved successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid buyer ID"
// @Failure 404 {object} utils.ErrorResponse "Buyer not found"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /buyers/{id} [get]
func (h *BuyerHandler) GetBuyerByID(c *gin.Context) {
	buyerID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid buyer ID")
		return
	}

	buyer, err := h.buyerService.GetBuyerByID(c.Request.Context(), buyerID)
	if err != nil {
		switch err {
		case service.ErrBuyerNotFound:
			utils.RespondWithError(c, http.StatusNotFound, err.Error())
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to retrieve buyer profile")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Buyer profile retrieved successfully", buyer)
}

// GetMyBuyerProfile gets the current user's buyer profile
// @Summary Get my buyer profile
// @Description Get the buyer profile for the authenticated user
// @Tags buyers
// @Produce json
// @Security BearerAuth
// @Success 200 {object} utils.SuccessResponse{data=dto.BuyerResponse} "Buyer profile retrieved successfully"
// @Failure 401 {object} utils.ErrorResponse "Unauthorized"
// @Failure 404 {object} utils.ErrorResponse "Buyer profile not found"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /buyers/me [get]
func (h *BuyerHandler) GetMyBuyerProfile(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil {
		utils.RespondWithError(c, http.StatusUnauthorized, err.Error())
		return
	}

	buyer, err := h.buyerService.GetBuyerByUserID(c.Request.Context(), userID)
	if err != nil {
		switch err {
		case service.ErrBuyerNotFound:
			utils.RespondWithError(c, http.StatusNotFound, "Buyer profile not found")
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to retrieve buyer profile")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Buyer profile retrieved successfully", buyer)
}

// UpdateBuyer updates a buyer profile
// @Summary Update buyer profile
// @Description Update a buyer profile for the authenticated user
// @Tags buyers
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Buyer ID"
// @Param request body dto.CreateBuyerRequest true "Buyer update data"
// @Success 200 {object} utils.SuccessResponse{data=dto.BuyerResponse} "Buyer profile updated successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid input data"
// @Failure 401 {object} utils.ErrorResponse "Unauthorized"
// @Failure 403 {object} utils.ErrorResponse "Forbidden"
// @Failure 404 {object} utils.ErrorResponse "Buyer not found"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /buyers/{id} [put]
func (h *BuyerHandler) UpdateBuyer(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil {
		utils.RespondWithError(c, http.StatusUnauthorized, err.Error())
		return
	}

	buyerID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid buyer ID")
		return
	}

	var req dto.CreateBuyerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid input data: "+err.Error())
		return
	}

	// Validate using custom validator
	if err := utils.ValidateStruct(req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, err.Error())
		return
	}

	buyer, err := h.buyerService.UpdateBuyer(c.Request.Context(), buyerID, userID, &req)
	if err != nil {
		switch err {
		case service.ErrBuyerNotFound:
			utils.RespondWithError(c, http.StatusNotFound, err.Error())
		case service.ErrUnauthorizedAccess:
			utils.RespondWithError(c, http.StatusForbidden, err.Error())
		case service.ErrInvalidBusinessData:
			utils.RespondWithError(c, http.StatusBadRequest, err.Error())
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to update buyer profile")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Buyer profile updated successfully", buyer)
}

// DeleteBuyer deletes a buyer profile
// @Summary Delete buyer profile
// @Description Delete a buyer profile for the authenticated user
// @Tags buyers
// @Produce json
// @Security BearerAuth
// @Param id path string true "Buyer ID"
// @Success 200 {object} utils.SuccessResponse "Buyer profile deleted successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid buyer ID"
// @Failure 401 {object} utils.ErrorResponse "Unauthorized"
// @Failure 403 {object} utils.ErrorResponse "Forbidden"
// @Failure 404 {object} utils.ErrorResponse "Buyer not found"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /buyers/{id} [delete]
func (h *BuyerHandler) DeleteBuyer(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil {
		utils.RespondWithError(c, http.StatusUnauthorized, err.Error())
		return
	}

	buyerID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid buyer ID")
		return
	}

	if err := h.buyerService.DeleteBuyer(c.Request.Context(), buyerID, userID); err != nil {
		switch err {
		case service.ErrBuyerNotFound:
			utils.RespondWithError(c, http.StatusNotFound, err.Error())
		case service.ErrUnauthorizedAccess:
			utils.RespondWithError(c, http.StatusForbidden, err.Error())
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to delete buyer profile")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Buyer profile deleted successfully", nil)
}

// GetAllBuyers gets all buyers with optional filtering and pagination
// @Summary Get all buyers
// @Description Get a list of buyers with filtering and pagination
// @Tags buyers
// @Produce json
// @Param business_type query string false "Business type filter"
// @Param business_scale query string false "Business scale filter"
// @Param city query string false "City filter"
// @Param state query string false "State filter"
// @Param min_monthly_volume query number false "Minimum monthly volume filter"
// @Param preferred_product query string false "Preferred product filter"
// @Param page query integer false "Page number" default(1)
// @Param page_size query integer false "Page size" default(10)
// @Success 200 {object} utils.SuccessResponse{data=dto.BuyerListResponse} "Buyers retrieved successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid query parameters"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /buyers [get]
func (h *BuyerHandler) GetAllBuyers(c *gin.Context) {
	var filters dto.BuyerFilterRequest

	// Bind query parameters
	if err := c.ShouldBindQuery(&filters); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid query parameters: "+err.Error())
		return
	}

	// Set default values
	if filters.Page == 0 {
		filters.Page = 1
	}
	if filters.PageSize == 0 {
		filters.PageSize = 10
	}

	response, err := h.buyerService.GetAllBuyers(c.Request.Context(), filters)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to retrieve buyers")
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Buyers retrieved successfully", response)
}

// GetBuyerStats gets buyer statistics
// @Summary Get buyer statistics
// @Description Get statistics for a buyer
// @Tags buyers
// @Produce json
// @Security BearerAuth
// @Param id path string true "Buyer ID"
// @Success 200 {object} utils.SuccessResponse{data=dto.BuyerStatsResponse} "Buyer statistics retrieved successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid buyer ID"
// @Failure 401 {object} utils.ErrorResponse "Unauthorized"
// @Failure 404 {object} utils.ErrorResponse "Buyer not found"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /buyers/{id}/stats [get]
func (h *BuyerHandler) GetBuyerStats(c *gin.Context) {
	buyerID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid buyer ID")
		return
	}

	stats, err := h.buyerService.GetBuyerStats(c.Request.Context(), buyerID)
	if err != nil {
		switch err {
		case service.ErrBuyerNotFound:
			utils.RespondWithError(c, http.StatusNotFound, err.Error())
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to retrieve buyer statistics")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Buyer statistics retrieved successfully", stats)
}

// VerifyBuyer verifies a buyer (admin only)
// @Summary Verify buyer
// @Description Verify a buyer profile (admin only)
// @Tags buyers
// @Produce json
// @Security BearerAuth
// @Param id path string true "Buyer ID"
// @Success 200 {object} utils.SuccessResponse "Buyer verified successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid buyer ID"
// @Failure 404 {object} utils.ErrorResponse "Buyer not found"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /buyers/{id}/verify [put]
func (h *BuyerHandler) VerifyBuyer(c *gin.Context) {
	buyerID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid buyer ID")
		return
	}

	if err := h.buyerService.VerifyBuyer(c.Request.Context(), buyerID); err != nil {
		switch err {
		case service.ErrBuyerNotFound:
			utils.RespondWithError(c, http.StatusNotFound, err.Error())
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to verify buyer")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Buyer verified successfully", nil)
}

// GetUserIDFromContext extracts user ID from Gin context
func GetUserIDFromContext(c *gin.Context) (uuid.UUID, error) {
	userID, exists := c.Get("userID")
	if !exists {
		return uuid.Nil, service.ErrUnauthorizedAccess
	}

	switch v := userID.(type) {
	case uuid.UUID:
		return v, nil
	case string:
		parsedUUID, err := uuid.Parse(v)
		if err != nil {
			return uuid.Nil, service.ErrUnauthorizedAccess
		}
		return parsedUUID, nil
	default:
		return uuid.Nil, service.ErrUnauthorizedAccess
	}
}
