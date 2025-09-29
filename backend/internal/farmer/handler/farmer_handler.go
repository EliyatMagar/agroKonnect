package handler

import (
	"net/http"
	"strconv"
	"strings"

	dto "agro_konnect/internal/farmer/dto"
	"agro_konnect/internal/farmer/service"
	"agro_konnect/internal/farmer/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type FarmerHandler struct {
	farmerService service.FarmerService
}

func NewFarmerHandler(farmerService service.FarmerService) *FarmerHandler {
	return &FarmerHandler{
		farmerService: farmerService,
	}
}

// CreateFarmer creates a new farmer profile
// @Summary Create farmer profile
// @Description Create a new farmer profile for the authenticated user
// @Tags farmers
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body dto.CreateFarmerRequest true "Farmer creation data"
// @Success 201 {object} utils.SuccessResponse{data=model.Farmer} "Farmer profile created successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid input data"
// @Failure 401 {object} utils.ErrorResponse "Unauthorized"
// @Failure 409 {object} utils.ErrorResponse "Farmer profile already exists"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /farmers [post]
func (h *FarmerHandler) CreateFarmer(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil {
		utils.RespondWithError(c, http.StatusUnauthorized, err.Error())
		return
	}

	var req dto.CreateFarmerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid input data: "+err.Error())
		return
	}

	// Sanitize input
	req.Sanitize()

	// Validate using custom validator if needed
	if err := utils.ValidateStruct(req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, err.Error())
		return
	}

	farmer, err := h.farmerService.CreateFarmer(c.Request.Context(), userID, &req)
	if err != nil {
		switch err {
		case service.ErrFarmerAlreadyExists:
			utils.RespondWithError(c, http.StatusConflict, err.Error())
		case service.ErrInvalidFarmData, service.ErrInvalidDate:
			utils.RespondWithError(c, http.StatusBadRequest, err.Error())
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to create farmer profile")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusCreated, "Farmer profile created successfully", farmer)
}

// GetMyProfile gets the current user's farmer profile
// @Summary Get my farmer profile
// @Description Get the farmer profile of the authenticated user
// @Tags farmers
// @Produce json
// @Security BearerAuth
// @Success 200 {object} utils.SuccessResponse{data=dto.FarmerResponse} "Farmer profile retrieved successfully"
// @Failure 401 {object} utils.ErrorResponse "Unauthorized"
// @Failure 404 {object} utils.ErrorResponse "Farmer profile not found"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /farmers/me/profile [get]
func (h *FarmerHandler) GetMyProfile(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil {
		utils.RespondWithError(c, http.StatusUnauthorized, err.Error())
		return
	}

	farmer, err := h.farmerService.GetFarmerByUserID(c.Request.Context(), userID)
	if err != nil {
		switch err {
		case service.ErrFarmerNotFound:
			utils.RespondWithError(c, http.StatusNotFound, err.Error())
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to retrieve farmer profile")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Farmer profile retrieved successfully", farmer)
}

// GetFarmerByID gets a farmer profile by ID
// @Summary Get farmer by ID
// @Description Get a farmer profile by its ID
// @Tags farmers
// @Produce json
// @Param id path string true "Farmer ID"
// @Success 200 {object} utils.SuccessResponse{data=dto.FarmerResponse} "Farmer profile retrieved successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid farmer ID"
// @Failure 404 {object} utils.ErrorResponse "Farmer not found"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /farmers/{id} [get]
func (h *FarmerHandler) GetFarmerByID(c *gin.Context) {
	farmerID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid farmer ID")
		return
	}

	farmer, err := h.farmerService.GetFarmerByID(c.Request.Context(), farmerID)
	if err != nil {
		switch err {
		case service.ErrFarmerNotFound:
			utils.RespondWithError(c, http.StatusNotFound, err.Error())
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to retrieve farmer profile")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Farmer profile retrieved successfully", farmer)
}

// UpdateFarmer updates the current user's farmer profile
// @Summary Update farmer profile
// @Description Update the farmer profile of the authenticated user
// @Tags farmers
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body dto.UpdateFarmerRequest true "Farmer update data"
// @Success 200 {object} utils.SuccessResponse{data=dto.FarmerResponse} "Farmer profile updated successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid input data"
// @Failure 401 {object} utils.ErrorResponse "Unauthorized"
// @Failure 404 {object} utils.ErrorResponse "Farmer profile not found"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /farmers/me [put]
func (h *FarmerHandler) UpdateFarmer(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil {
		utils.RespondWithError(c, http.StatusUnauthorized, err.Error())
		return
	}

	var req dto.UpdateFarmerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid input data: "+err.Error())
		return
	}

	// Sanitize input
	req.Sanitize()

	// Validate using custom validator if needed
	if err := utils.ValidateStruct(req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, err.Error())
		return
	}

	farmer, err := h.farmerService.UpdateFarmer(c.Request.Context(), userID, &req)
	if err != nil {
		switch err {
		case service.ErrFarmerNotFound:
			utils.RespondWithError(c, http.StatusNotFound, err.Error())
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to update farmer profile")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Farmer profile updated successfully", farmer)
}

// DeleteFarmer deletes the current user's farmer profile
// @Summary Delete farmer profile
// @Description Delete the farmer profile of the authenticated user
// @Tags farmers
// @Produce json
// @Security BearerAuth
// @Success 200 {object} utils.SuccessResponse "Farmer profile deleted successfully"
// @Failure 401 {object} utils.ErrorResponse "Unauthorized"
// @Failure 404 {object} utils.ErrorResponse "Farmer profile not found"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /farmers/me [delete]
func (h *FarmerHandler) DeleteFarmer(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil {
		utils.RespondWithError(c, http.StatusUnauthorized, err.Error())
		return
	}

	if err := h.farmerService.DeleteFarmer(c.Request.Context(), userID); err != nil {
		switch err {
		case service.ErrFarmerNotFound:
			utils.RespondWithError(c, http.StatusNotFound, err.Error())
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to delete farmer profile")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Farmer profile deleted successfully", nil)
}

// GetAllFarmers gets all farmers with optional filtering and pagination
// @Summary Get all farmers
// @Description Get a list of farmers with filtering and pagination
// @Tags farmers
// @Produce json
// @Param farm_type query string false "Farm type filter"
// @Param certification query string false "Certification filter"
// @Param city query string false "City filter"
// @Param state query string false "State filter"
// @Param country query string false "Country filter"
// @Param min_rating query number false "Minimum rating filter"
// @Param max_rating query number false "Maximum rating filter"
// @Param min_experience query integer false "Minimum experience filter"
// @Param is_verified query boolean false "Verified status filter"
// @Param is_premium query boolean false "Premium status filter"
// @Param search query string false "Search term"
// @Param sort_by query string false "Sort field" Enums(rating, experience_years, created_at, farm_name)
// @Param sort_order query string false "Sort order" Enums(asc, desc)
// @Param page query integer false "Page number" default(1)
// @Param page_size query integer false "Page size" default(10)
// @Success 200 {object} utils.SuccessResponse{data=dto.FarmerListResponse} "Farmers retrieved successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid query parameters"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /farmers [get]
func (h *FarmerHandler) GetAllFarmers(c *gin.Context) {
	var filters dto.FarmerFilterRequest

	// Bind query parameters
	if err := c.ShouldBindQuery(&filters); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid query parameters: "+err.Error())
		return
	}

	// Parse boolean parameters
	if c.Query("is_verified") != "" {
		isVerified, err := strconv.ParseBool(c.Query("is_verified"))
		if err != nil {
			utils.RespondWithError(c, http.StatusBadRequest, "Invalid is_verified parameter")
			return
		}
		filters.IsVerified = &isVerified
	}

	if c.Query("is_premium") != "" {
		isPremium, err := strconv.ParseBool(c.Query("is_premium"))
		if err != nil {
			utils.RespondWithError(c, http.StatusBadRequest, "Invalid is_premium parameter")
			return
		}
		filters.IsPremium = &isPremium
	}

	response, err := h.farmerService.GetAllFarmers(c.Request.Context(), filters)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to retrieve farmers")
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Farmers retrieved successfully", response)
}

// GetFarmerStats gets statistics for the current user's farmer profile
// @Summary Get farmer statistics
// @Description Get business statistics for the authenticated farmer
// @Tags farmers
// @Produce json
// @Security BearerAuth
// @Success 200 {object} utils.SuccessResponse{data=dto.FarmerStatsResponse} "Farmer statistics retrieved successfully"
// @Failure 401 {object} utils.ErrorResponse "Unauthorized"
// @Failure 404 {object} utils.ErrorResponse "Farmer profile not found"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /farmers/me/stats [get]
func (h *FarmerHandler) GetFarmerStats(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil {
		utils.RespondWithError(c, http.StatusUnauthorized, err.Error())
		return
	}

	farmer, err := h.farmerService.GetFarmerByUserID(c.Request.Context(), userID)
	if err != nil {
		switch err {
		case service.ErrFarmerNotFound:
			utils.RespondWithError(c, http.StatusNotFound, err.Error())
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to retrieve farmer profile")
		}
		return
	}

	stats, err := h.farmerService.GetFarmerStats(c.Request.Context(), farmer.ID)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to retrieve farmer statistics")
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Farmer statistics retrieved successfully", stats)
}

// GetNearbyFarmers gets farmers near a specific location
// @Summary Get nearby farmers
// @Description Get farmers within a specified radius of a location
// @Tags farmers
// @Produce json
// @Param lat query number true "Latitude"
// @Param lng query number true "Longitude"
// @Param radius query number false "Radius in kilometers" default(10)
// @Success 200 {object} utils.SuccessResponse{data=[]dto.FarmerResponse} "Nearby farmers retrieved successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid location parameters"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /farmers/nearby [get]
func (h *FarmerHandler) GetNearbyFarmers(c *gin.Context) {
	lat, err := strconv.ParseFloat(c.Query("lat"), 64)
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid latitude parameter")
		return
	}

	lng, err := strconv.ParseFloat(c.Query("lng"), 64)
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid longitude parameter")
		return
	}

	radius, _ := strconv.ParseFloat(c.DefaultQuery("radius", "10"), 64)

	if lat == 0 || lng == 0 {
		utils.RespondWithError(c, http.StatusBadRequest, "Latitude and longitude are required")
		return
	}

	farmers, err := h.farmerService.GetNearbyFarmers(c.Request.Context(), lat, lng, radius)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to retrieve nearby farmers")
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Nearby farmers retrieved successfully", farmers)
}

// VerifyFarmer verifies a farmer profile (admin only)
// @Summary Verify farmer
// @Description Verify a farmer profile (admin only)
// @Tags farmers
// @Produce json
// @Security BearerAuth
// @Param id path string true "Farmer ID"
// @Success 200 {object} utils.SuccessResponse "Farmer verified successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid farmer ID"
// @Failure 401 {object} utils.ErrorResponse "Unauthorized"
// @Failure 403 {object} utils.ErrorResponse "Forbidden"
// @Failure 404 {object} utils.ErrorResponse "Farmer not found"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /farmers/{id}/verify [put]
func (h *FarmerHandler) VerifyFarmer(c *gin.Context) {
	farmerID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid farmer ID")
		return
	}

	if err := h.farmerService.VerifyFarmer(c.Request.Context(), farmerID); err != nil {
		switch err {
		case service.ErrFarmerNotFound:
			utils.RespondWithError(c, http.StatusNotFound, err.Error())
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to verify farmer")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Farmer verified successfully", nil)
}

// SearchFarmers searches farmers by query string
// @Summary Search farmers
// @Description Search farmers by name, farm name, or location
// @Tags farmers
// @Produce json
// @Param q query string true "Search query"
// @Param page query integer false "Page number" default(1)
// @Param size query integer false "Page size" default(10)
// @Success 200 {object} utils.SuccessResponse{data=dto.FarmerListResponse} "Farmers retrieved successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid query parameters"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /farmers/search [get]
func (h *FarmerHandler) SearchFarmers(c *gin.Context) {
	query := strings.TrimSpace(c.Query("q"))
	if query == "" {
		utils.RespondWithError(c, http.StatusBadRequest, "Search query is required")
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "10"))

	response, err := h.farmerService.SearchFarmers(c.Request.Context(), query, page, size)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to search farmers")
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Farmers retrieved successfully", response)
}

// GetUserIDFromContext extracts user ID from Gin context
func GetUserIDFromContext(c *gin.Context) (uuid.UUID, error) {
	userID, exists := c.Get("userID")
	if !exists {
		return uuid.Nil, service.ErrUnauthorized
	}

	switch v := userID.(type) {
	case uuid.UUID:
		return v, nil
	case string:
		parsedUUID, err := uuid.Parse(v)
		if err != nil {
			return uuid.Nil, service.ErrUnauthorized
		}
		return parsedUUID, nil
	default:
		return uuid.Nil, service.ErrUnauthorized
	}
}
