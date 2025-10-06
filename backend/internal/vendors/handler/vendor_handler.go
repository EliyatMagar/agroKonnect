package handler

import (
	"net/http"
	"strconv"
	"strings"

	dto "agro_konnect/internal/vendors/dto"
	"agro_konnect/internal/vendors/service"
	"agro_konnect/internal/vendors/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type VendorHandler struct {
	vendorService service.VendorService
}

func NewVendorHandler(vendorService service.VendorService) *VendorHandler {
	return &VendorHandler{
		vendorService: vendorService,
	}
}

// CreateVendor creates a new vendor profile
// @Summary Create vendor profile
// @Description Create a new vendor profile for the authenticated user
// @Tags vendors
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body dto.CreateVendorRequest true "Vendor creation data"
// @Success 201 {object} utils.SuccessResponse{data=model.Vendor} "Vendor profile created successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid input data"
// @Failure 401 {object} utils.ErrorResponse "Unauthorized"
// @Failure 409 {object} utils.ErrorResponse "Vendor profile already exists"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /vendors [post]
func (h *VendorHandler) CreateVendor(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil {
		utils.RespondWithError(c, http.StatusUnauthorized, err.Error())
		return
	}

	var req dto.CreateVendorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid input data: "+err.Error())
		return
	}

	// Validate using custom validator
	if err := utils.ValidateStruct(req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, err.Error())
		return
	}

	vendor, err := h.vendorService.CreateVendor(c.Request.Context(), userID, &req)
	if err != nil {
		switch err {
		case service.ErrVendorAlreadyExists:
			utils.RespondWithError(c, http.StatusConflict, err.Error())
		case service.ErrInvalidVendorData:
			utils.RespondWithError(c, http.StatusBadRequest, err.Error())
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to create vendor profile")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusCreated, "Vendor profile created successfully", vendor)
}

// GetMyProfile gets the current user's vendor profile
// @Summary Get my vendor profile
// @Description Get the vendor profile of the authenticated user
// @Tags vendors
// @Produce json
// @Security BearerAuth
// @Success 200 {object} utils.SuccessResponse{data=dto.VendorResponse} "Vendor profile retrieved successfully"
// @Failure 401 {object} utils.ErrorResponse "Unauthorized"
// @Failure 404 {object} utils.ErrorResponse "Vendor profile not found"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /vendors/me/profile [get]
func (h *VendorHandler) GetMyProfile(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil {
		utils.RespondWithError(c, http.StatusUnauthorized, err.Error())
		return
	}

	vendor, err := h.vendorService.GetVendorByUserID(c.Request.Context(), userID)
	if err != nil {
		switch err {
		case service.ErrVendorNotFound:
			utils.RespondWithError(c, http.StatusNotFound, err.Error())
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to retrieve vendor profile")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Vendor profile retrieved successfully", vendor)
}

// GetVendorByID gets a vendor profile by ID
// @Summary Get vendor by ID
// @Description Get a vendor profile by its ID
// @Tags vendors
// @Produce json
// @Param id path string true "Vendor ID"
// @Success 200 {object} utils.SuccessResponse{data=dto.VendorResponse} "Vendor profile retrieved successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid vendor ID"
// @Failure 404 {object} utils.ErrorResponse "Vendor not found"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /vendors/{id} [get]
func (h *VendorHandler) GetVendorByID(c *gin.Context) {
	vendorID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid vendor ID")
		return
	}

	vendor, err := h.vendorService.GetVendorByID(c.Request.Context(), vendorID)
	if err != nil {
		switch err {
		case service.ErrVendorNotFound:
			utils.RespondWithError(c, http.StatusNotFound, err.Error())
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to retrieve vendor profile")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Vendor profile retrieved successfully", vendor)
}

// UpdateVendor updates the current user's vendor profile
// @Summary Update vendor profile
// @Description Update the vendor profile of the authenticated user
// @Tags vendors
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body dto.UpdateVendorRequest true "Vendor update data"
// @Success 200 {object} utils.SuccessResponse{data=dto.VendorResponse} "Vendor profile updated successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid input data"
// @Failure 401 {object} utils.ErrorResponse "Unauthorized"
// @Failure 404 {object} utils.ErrorResponse "Vendor profile not found"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /vendors/me [put]
func (h *VendorHandler) UpdateVendor(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil {
		utils.RespondWithError(c, http.StatusUnauthorized, err.Error())
		return
	}

	var req dto.UpdateVendorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid input data: "+err.Error())
		return
	}

	// Validate using custom validator
	if err := utils.ValidateStruct(req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, err.Error())
		return
	}

	vendor, err := h.vendorService.UpdateVendor(c.Request.Context(), userID, &req)
	if err != nil {
		switch err {
		case service.ErrVendorNotFound:
			utils.RespondWithError(c, http.StatusNotFound, err.Error())
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to update vendor profile")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Vendor profile updated successfully", vendor)
}

// DeleteVendor deletes the current user's vendor profile
// @Summary Delete vendor profile
// @Description Delete the vendor profile of the authenticated user
// @Tags vendors
// @Produce json
// @Security BearerAuth
// @Success 200 {object} utils.SuccessResponse "Vendor profile deleted successfully"
// @Failure 401 {object} utils.ErrorResponse "Unauthorized"
// @Failure 404 {object} utils.ErrorResponse "Vendor profile not found"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /vendors/me [delete]
func (h *VendorHandler) DeleteVendor(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil {
		utils.RespondWithError(c, http.StatusUnauthorized, err.Error())
		return
	}

	if err := h.vendorService.DeleteVendor(c.Request.Context(), userID); err != nil {
		switch err {
		case service.ErrVendorNotFound:
			utils.RespondWithError(c, http.StatusNotFound, err.Error())
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to delete vendor profile")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Vendor profile deleted successfully", nil)
}

// GetAllVendors gets all vendors with optional filtering and pagination
// @Summary Get all vendors
// @Description Get a list of vendors with filtering and pagination
// @Tags vendors
// @Produce json
// @Param vendor_type query string false "Vendor type filter"
// @Param business_type query string false "Business type filter"
// @Param city query string false "City filter"
// @Param state query string false "State filter"
// @Param country query string false "Country filter"
// @Param min_rating query number false "Minimum rating filter"
// @Param max_rating query number false "Maximum rating filter"
// @Param is_verified query boolean false "Verified status filter"
// @Param is_premium query boolean false "Premium status filter"
// @Param search query string false "Search term"
// @Param sort_by query string false "Sort field" Enums(rating, created_at, company_name)
// @Param sort_order query string false "Sort order" Enums(asc, desc)
// @Param page query integer false "Page number" default(1)
// @Param page_size query integer false "Page size" default(10)
// @Success 200 {object} utils.SuccessResponse{data=dto.VendorListResponse} "Vendors retrieved successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid query parameters"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /vendors [get]
func (h *VendorHandler) GetAllVendors(c *gin.Context) {
	var filters dto.VendorFilterRequest

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

	response, err := h.vendorService.GetAllVendors(c.Request.Context(), filters)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to retrieve vendors")
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Vendors retrieved successfully", response)
}

// GetVendorStats gets statistics for the current user's vendor profile
// @Summary Get vendor statistics
// @Description Get business statistics for the authenticated vendor
// @Tags vendors
// @Produce json
// @Security BearerAuth
// @Success 200 {object} utils.SuccessResponse{data=dto.VendorStatsResponse} "Vendor statistics retrieved successfully"
// @Failure 401 {object} utils.ErrorResponse "Unauthorized"
// @Failure 404 {object} utils.ErrorResponse "Vendor profile not found"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /vendors/me/stats [get]
func (h *VendorHandler) GetVendorStats(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil {
		utils.RespondWithError(c, http.StatusUnauthorized, err.Error())
		return
	}

	vendor, err := h.vendorService.GetVendorByUserID(c.Request.Context(), userID)
	if err != nil {
		switch err {
		case service.ErrVendorNotFound:
			utils.RespondWithError(c, http.StatusNotFound, err.Error())
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to retrieve vendor profile")
		}
		return
	}

	stats, err := h.vendorService.GetVendorStats(c.Request.Context(), vendor.ID)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to retrieve vendor statistics")
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Vendor statistics retrieved successfully", stats)
}

// GetNearbyVendors gets vendors near a specific location
// @Summary Get nearby vendors
// @Description Get vendors within a specified radius of a location
// @Tags vendors
// @Produce json
// @Param lat query number true "Latitude"
// @Param lng query number true "Longitude"
// @Param radius query number false "Radius in kilometers" default(10)
// @Success 200 {object} utils.SuccessResponse{data=[]dto.VendorResponse} "Nearby vendors retrieved successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid location parameters"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /vendors/nearby [get]
func (h *VendorHandler) GetNearbyVendors(c *gin.Context) {
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

	vendors, err := h.vendorService.GetNearbyVendors(c.Request.Context(), lat, lng, radius)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to retrieve nearby vendors")
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Nearby vendors retrieved successfully", vendors)
}

// VerifyVendor verifies a vendor profile (admin only)
// @Summary Verify vendor
// @Description Verify a vendor profile (admin only)
// @Tags vendors
// @Produce json
// @Security BearerAuth
// @Param id path string true "Vendor ID"
// @Success 200 {object} utils.SuccessResponse "Vendor verified successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid vendor ID"
// @Failure 401 {object} utils.ErrorResponse "Unauthorized"
// @Failure 403 {object} utils.ErrorResponse "Forbidden"
// @Failure 404 {object} utils.ErrorResponse "Vendor not found"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /vendors/{id}/verify [put]
func (h *VendorHandler) VerifyVendor(c *gin.Context) {
	vendorID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid vendor ID")
		return
	}

	if err := h.vendorService.VerifyVendor(c.Request.Context(), vendorID); err != nil {
		switch err {
		case service.ErrVendorNotFound:
			utils.RespondWithError(c, http.StatusNotFound, err.Error())
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to verify vendor")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Vendor verified successfully", nil)
}

// SearchVendors searches vendors by query string
// @Summary Search vendors
// @Description Search vendors by company name, brand name, or location
// @Tags vendors
// @Produce json
// @Param q query string true "Search query"
// @Param page query integer false "Page number" default(1)
// @Param size query integer false "Page size" default(10)
// @Success 200 {object} utils.SuccessResponse{data=dto.VendorListResponse} "Vendors retrieved successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid query parameters"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /vendors/search [get]
func (h *VendorHandler) SearchVendors(c *gin.Context) {
	query := strings.TrimSpace(c.Query("q"))
	if query == "" {
		utils.RespondWithError(c, http.StatusBadRequest, "Search query is required")
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "10"))

	response, err := h.vendorService.SearchVendors(c.Request.Context(), query, page, size)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to search vendors")
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Vendors retrieved successfully", response)
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
