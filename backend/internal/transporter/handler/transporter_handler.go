package handler

import (
	"net/http"

	dto "agro_konnect/internal/transporter/dto"
	"agro_konnect/internal/transporter/service"
	"agro_konnect/internal/transporter/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type TransporterHandler struct {
	transporterService service.TransporterService
	vehicleService     service.VehicleService
}

func NewTransporterHandler(
	transporterService service.TransporterService,
	vehicleService service.VehicleService,
) *TransporterHandler {
	return &TransporterHandler{
		transporterService: transporterService,
		vehicleService:     vehicleService,
	}
}

// CreateTransporter creates a new transporter profile
// @Summary Create transporter profile
// @Description Create a new transporter profile for the authenticated user
// @Tags transporters
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body dto.CreateTransporterRequest true "Transporter creation data"
// @Success 201 {object} utils.SuccessResponse{data=model.Transporter} "Transporter profile created successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid input data"
// @Failure 401 {object} utils.ErrorResponse "Unauthorized"
// @Failure 409 {object} utils.ErrorResponse "Transporter profile already exists"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /transporters [post]
func (h *TransporterHandler) CreateTransporter(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil {
		utils.RespondWithError(c, http.StatusUnauthorized, err.Error())
		return
	}

	var req dto.CreateTransporterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid input data: "+err.Error())
		return
	}

	// Validate using custom validator
	if err := utils.ValidateStruct(req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, err.Error())
		return
	}

	transporter, err := h.transporterService.CreateTransporter(c.Request.Context(), userID, &req)
	if err != nil {
		switch err {
		case service.ErrTransporterAlreadyExists:
			utils.RespondWithError(c, http.StatusConflict, err.Error())
		case service.ErrInvalidCapacity:
			utils.RespondWithError(c, http.StatusBadRequest, err.Error())
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to create transporter profile")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusCreated, "Transporter profile created successfully", transporter)
}

// GetTransporterByID gets a transporter by ID
// @Summary Get transporter by ID
// @Description Get a transporter profile by its ID
// @Tags transporters
// @Produce json
// @Param id path string true "Transporter ID"
// @Success 200 {object} utils.SuccessResponse{data=dto.TransporterResponse} "Transporter profile retrieved successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid transporter ID"
// @Failure 404 {object} utils.ErrorResponse "Transporter not found"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /transporters/{id} [get]
func (h *TransporterHandler) GetTransporterByID(c *gin.Context) {
	transporterID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid transporter ID")
		return
	}

	transporter, err := h.transporterService.GetTransporterByID(c.Request.Context(), transporterID)
	if err != nil {
		switch err {
		case service.ErrTransporterNotFound:
			utils.RespondWithError(c, http.StatusNotFound, err.Error())
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to retrieve transporter profile")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Transporter profile retrieved successfully", transporter)
}

// GetMyTransporterProfile gets the current user's transporter profile
// @Summary Get my transporter profile
// @Description Get the transporter profile for the authenticated user
// @Tags transporters
// @Produce json
// @Security BearerAuth
// @Success 200 {object} utils.SuccessResponse{data=dto.TransporterResponse} "Transporter profile retrieved successfully"
// @Failure 401 {object} utils.ErrorResponse "Unauthorized"
// @Failure 404 {object} utils.ErrorResponse "Transporter profile not found"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /transporters/me [get]
func (h *TransporterHandler) GetMyTransporterProfile(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil {
		utils.RespondWithError(c, http.StatusUnauthorized, err.Error())
		return
	}

	transporter, err := h.transporterService.GetTransporterByUserID(c.Request.Context(), userID)
	if err != nil {
		switch err {
		case service.ErrTransporterNotFound:
			utils.RespondWithError(c, http.StatusNotFound, "Transporter profile not found")
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to retrieve transporter profile")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Transporter profile retrieved successfully", transporter)
}

// UpdateTransporter updates a transporter profile
// @Summary Update transporter profile
// @Description Update a transporter profile for the authenticated user
// @Tags transporters
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Transporter ID"
// @Param request body dto.CreateTransporterRequest true "Transporter update data"
// @Success 200 {object} utils.SuccessResponse{data=dto.TransporterResponse} "Transporter profile updated successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid input data"
// @Failure 401 {object} utils.ErrorResponse "Unauthorized"
// @Failure 403 {object} utils.ErrorResponse "Forbidden"
// @Failure 404 {object} utils.ErrorResponse "Transporter not found"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /transporters/{id} [put]
func (h *TransporterHandler) UpdateTransporter(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil {
		utils.RespondWithError(c, http.StatusUnauthorized, err.Error())
		return
	}

	transporterID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid transporter ID")
		return
	}

	var req dto.CreateTransporterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid input data: "+err.Error())
		return
	}

	// Validate using custom validator
	if err := utils.ValidateStruct(req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, err.Error())
		return
	}

	transporter, err := h.transporterService.UpdateTransporter(c.Request.Context(), transporterID, userID, &req)
	if err != nil {
		switch err {
		case service.ErrTransporterNotFound:
			utils.RespondWithError(c, http.StatusNotFound, err.Error())
		case service.ErrUnauthorizedAccess:
			utils.RespondWithError(c, http.StatusForbidden, err.Error())
		case service.ErrInvalidCapacity:
			utils.RespondWithError(c, http.StatusBadRequest, err.Error())
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to update transporter profile")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Transporter profile updated successfully", transporter)
}

// DeleteTransporter deletes a transporter profile
// @Summary Delete transporter profile
// @Description Delete a transporter profile for the authenticated user
// @Tags transporters
// @Produce json
// @Security BearerAuth
// @Param id path string true "Transporter ID"
// @Success 200 {object} utils.SuccessResponse "Transporter profile deleted successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid transporter ID"
// @Failure 401 {object} utils.ErrorResponse "Unauthorized"
// @Failure 403 {object} utils.ErrorResponse "Forbidden"
// @Failure 404 {object} utils.ErrorResponse "Transporter not found"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /transporters/{id} [delete]
func (h *TransporterHandler) DeleteTransporter(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil {
		utils.RespondWithError(c, http.StatusUnauthorized, err.Error())
		return
	}

	transporterID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid transporter ID")
		return
	}

	if err := h.transporterService.DeleteTransporter(c.Request.Context(), transporterID, userID); err != nil {
		switch err {
		case service.ErrTransporterNotFound:
			utils.RespondWithError(c, http.StatusNotFound, err.Error())
		case service.ErrUnauthorizedAccess:
			utils.RespondWithError(c, http.StatusForbidden, err.Error())
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to delete transporter profile")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Transporter profile deleted successfully", nil)
}

// GetAllTransporters gets all transporters with optional filtering and pagination
// @Summary Get all transporters
// @Description Get a list of transporters with filtering and pagination
// @Tags transporters
// @Produce json
// @Param city query string false "City filter"
// @Param state query string false "State filter"
// @Param service_area query string false "Service area filter"
// @Param vehicle_type query string false "Vehicle type filter"
// @Param min_capacity query number false "Minimum capacity filter"
// @Param max_capacity query number false "Maximum capacity filter"
// @Param is_verified query boolean false "Verified status filter"
// @Param is_premium query boolean false "Premium status filter"
// @Param min_rating query number false "Minimum rating filter"
// @Param specialization query string false "Specialization filter"
// @Param page query integer false "Page number" default(1)
// @Param page_size query integer false "Page size" default(10)
// @Success 200 {object} utils.SuccessResponse{data=dto.TransporterListResponse} "Transporters retrieved successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid query parameters"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /transporters [get]
func (h *TransporterHandler) GetAllTransporters(c *gin.Context) {
	var filters dto.TransporterFilterRequest

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

	response, err := h.transporterService.GetAllTransporters(c.Request.Context(), filters)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to retrieve transporters")
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Transporters retrieved successfully", response)
}

// GetTransporterStats gets transporter statistics
// @Summary Get transporter statistics
// @Description Get statistics for a transporter
// @Tags transporters
// @Produce json
// @Security BearerAuth
// @Param id path string true "Transporter ID"
// @Success 200 {object} utils.SuccessResponse{data=dto.TransporterStatsResponse} "Transporter statistics retrieved successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid transporter ID"
// @Failure 401 {object} utils.ErrorResponse "Unauthorized"
// @Failure 404 {object} utils.ErrorResponse "Transporter not found"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /transporters/{id}/stats [get]
func (h *TransporterHandler) GetTransporterStats(c *gin.Context) {
	transporterID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid transporter ID")
		return
	}

	stats, err := h.transporterService.GetTransporterStats(c.Request.Context(), transporterID)
	if err != nil {
		switch err {
		case service.ErrTransporterNotFound:
			utils.RespondWithError(c, http.StatusNotFound, err.Error())
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to retrieve transporter statistics")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Transporter statistics retrieved successfully", stats)
}

// VerifyTransporter verifies a transporter (admin only)
// @Summary Verify transporter
// @Description Verify a transporter profile (admin only)
// @Tags transporters
// @Produce json
// @Security BearerAuth
// @Param id path string true "Transporter ID"
// @Success 200 {object} utils.SuccessResponse "Transporter verified successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid transporter ID"
// @Failure 404 {object} utils.ErrorResponse "Transporter not found"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /transporters/{id}/verify [put]
func (h *TransporterHandler) VerifyTransporter(c *gin.Context) {
	transporterID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid transporter ID")
		return
	}

	if err := h.transporterService.VerifyTransporter(c.Request.Context(), transporterID); err != nil {
		switch err {
		case service.ErrTransporterNotFound:
			utils.RespondWithError(c, http.StatusNotFound, err.Error())
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to verify transporter")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Transporter verified successfully", nil)
}

// UpdatePremiumStatus updates transporter premium status (admin only)
// @Summary Update premium status
// @Description Update premium status of a transporter (admin only)
// @Tags transporters
// @Produce json
// @Security BearerAuth
// @Param id path string true "Transporter ID"
// @Param premium query boolean true "Premium status"
// @Success 200 {object} utils.SuccessResponse "Premium status updated successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid transporter ID"
// @Failure 404 {object} utils.ErrorResponse "Transporter not found"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /transporters/{id}/premium [put]
func (h *TransporterHandler) UpdatePremiumStatus(c *gin.Context) {
	transporterID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid transporter ID")
		return
	}

	premium := c.Query("premium") == "true"

	if err := h.transporterService.UpdatePremiumStatus(c.Request.Context(), transporterID, premium); err != nil {
		switch err {
		case service.ErrTransporterNotFound:
			utils.RespondWithError(c, http.StatusNotFound, err.Error())
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to update premium status")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Premium status updated successfully", nil)
}

// AddVehicle adds a new vehicle to transporter's fleet
// @Summary Add vehicle
// @Description Add a new vehicle to transporter's fleet
// @Tags vehicles
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body dto.AddVehicleRequest true "Vehicle data"
// @Success 201 {object} utils.SuccessResponse{data=model.Vehicle} "Vehicle added successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid input data"
// @Failure 401 {object} utils.ErrorResponse "Unauthorized"
// @Failure 409 {object} utils.ErrorResponse "Vehicle already exists"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /transporters/vehicles [post]
func (h *TransporterHandler) AddVehicle(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil {
		utils.RespondWithError(c, http.StatusUnauthorized, err.Error())
		return
	}

	// Get transporter ID from user ID
	transporter, err := h.transporterService.GetTransporterByUserID(c.Request.Context(), userID)
	if err != nil {
		utils.RespondWithError(c, http.StatusNotFound, "Transporter profile not found")
		return
	}

	var req dto.AddVehicleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid input data: "+err.Error())
		return
	}

	// Validate using custom validator
	if err := utils.ValidateStruct(req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, err.Error())
		return
	}

	vehicle, err := h.vehicleService.AddVehicle(c.Request.Context(), transporter.ID, &req)
	if err != nil {
		switch err {
		case service.ErrVehicleAlreadyExists:
			utils.RespondWithError(c, http.StatusConflict, err.Error())
		case service.ErrInvalidVehicleData:
			utils.RespondWithError(c, http.StatusBadRequest, err.Error())
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to add vehicle")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusCreated, "Vehicle added successfully", vehicle)
}

// GetVehiclesByTransporter gets all vehicles for a transporter
// @Summary Get transporter vehicles
// @Description Get all vehicles for a transporter
// @Tags vehicles
// @Produce json
// @Param transporter_id path string true "Transporter ID"
// @Success 200 {object} utils.SuccessResponse{data=[]dto.VehicleResponse} "Vehicles retrieved successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid transporter ID"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /transporters/{transporter_id}/vehicles [get]
func (h *TransporterHandler) GetVehiclesByTransporter(c *gin.Context) {
	transporterID, err := uuid.Parse(c.Param("transporter_id"))
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid transporter ID")
		return
	}

	vehicles, err := h.vehicleService.GetVehiclesByTransporter(c.Request.Context(), transporterID)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to retrieve vehicles")
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Vehicles retrieved successfully", vehicles)
}

// GetMyVehicles gets all vehicles for the current user's transporter profile
// @Summary Get my vehicles
// @Description Get all vehicles for the authenticated user's transporter profile
// @Tags vehicles
// @Produce json
// @Security BearerAuth
// @Success 200 {object} utils.SuccessResponse{data=[]dto.VehicleResponse} "Vehicles retrieved successfully"
// @Failure 401 {object} utils.ErrorResponse "Unauthorized"
// @Failure 404 {object} utils.ErrorResponse "Transporter profile not found"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /transporters/vehicles/my-vehicles [get]
func (h *TransporterHandler) GetMyVehicles(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil {
		utils.RespondWithError(c, http.StatusUnauthorized, err.Error())
		return
	}

	// Get transporter ID from user ID
	transporter, err := h.transporterService.GetTransporterByUserID(c.Request.Context(), userID)
	if err != nil {
		utils.RespondWithError(c, http.StatusNotFound, "Transporter profile not found")
		return
	}

	vehicles, err := h.vehicleService.GetVehiclesByTransporter(c.Request.Context(), transporter.ID)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to retrieve vehicles")
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Vehicles retrieved successfully", vehicles)
}

// UpdateVehicle updates a vehicle
// @Summary Update vehicle
// @Description Update a vehicle in transporter's fleet
// @Tags vehicles
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Vehicle ID"
// @Param request body dto.AddVehicleRequest true "Vehicle update data"
// @Success 200 {object} utils.SuccessResponse{data=dto.VehicleResponse} "Vehicle updated successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid input data"
// @Failure 401 {object} utils.ErrorResponse "Unauthorized"
// @Failure 403 {object} utils.ErrorResponse "Forbidden"
// @Failure 404 {object} utils.ErrorResponse "Vehicle not found"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /transporters/vehicles/{id} [put]
func (h *TransporterHandler) UpdateVehicle(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil {
		utils.RespondWithError(c, http.StatusUnauthorized, err.Error())
		return
	}

	vehicleID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid vehicle ID")
		return
	}

	// Get transporter ID from user ID
	transporter, err := h.transporterService.GetTransporterByUserID(c.Request.Context(), userID)
	if err != nil {
		utils.RespondWithError(c, http.StatusNotFound, "Transporter profile not found")
		return
	}

	var req dto.AddVehicleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid input data: "+err.Error())
		return
	}

	// Validate using custom validator
	if err := utils.ValidateStruct(req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, err.Error())
		return
	}

	vehicle, err := h.vehicleService.UpdateVehicle(c.Request.Context(), vehicleID, transporter.ID, &req)
	if err != nil {
		switch err {
		case service.ErrVehicleNotFound:
			utils.RespondWithError(c, http.StatusNotFound, err.Error())
		case service.ErrUnauthorizedAccess:
			utils.RespondWithError(c, http.StatusForbidden, err.Error())
		case service.ErrInvalidVehicleData:
			utils.RespondWithError(c, http.StatusBadRequest, err.Error())
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to update vehicle")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Vehicle updated successfully", vehicle)
}

// UpdateVehicleAvailability updates vehicle availability
// @Summary Update vehicle availability
// @Description Update availability status of a vehicle
// @Tags vehicles
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Vehicle ID"
// @Param available query boolean true "Availability status"
// @Success 200 {object} utils.SuccessResponse "Vehicle availability updated successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid input"
// @Failure 401 {object} utils.ErrorResponse "Unauthorized"
// @Failure 404 {object} utils.ErrorResponse "Vehicle not found"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /transporters/vehicles/{id}/availability [put]
func (h *TransporterHandler) UpdateVehicleAvailability(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil {
		utils.RespondWithError(c, http.StatusUnauthorized, err.Error())
		return
	}

	vehicleID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid vehicle ID")
		return
	}

	available := c.Query("available") == "true"

	// Get transporter ID from user ID
	transporter, err := h.transporterService.GetTransporterByUserID(c.Request.Context(), userID)
	if err != nil {
		utils.RespondWithError(c, http.StatusNotFound, "Transporter profile not found")
		return
	}

	if err := h.vehicleService.UpdateVehicleAvailability(c.Request.Context(), vehicleID, transporter.ID, available); err != nil {
		switch err {
		case service.ErrVehicleNotFound:
			utils.RespondWithError(c, http.StatusNotFound, err.Error())
		case service.ErrUnauthorizedAccess:
			utils.RespondWithError(c, http.StatusForbidden, err.Error())
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to update vehicle availability")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Vehicle availability updated successfully", nil)
}

// UpdateVehicleLocation updates vehicle location
// @Summary Update vehicle location
// @Description Update current location of a vehicle
// @Tags vehicles
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Vehicle ID"
// @Param location query string true "New location"
// @Success 200 {object} utils.SuccessResponse "Vehicle location updated successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid input"
// @Failure 401 {object} utils.ErrorResponse "Unauthorized"
// @Failure 404 {object} utils.ErrorResponse "Vehicle not found"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /transporters/vehicles/{id}/location [put]
func (h *TransporterHandler) UpdateVehicleLocation(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil {
		utils.RespondWithError(c, http.StatusUnauthorized, err.Error())
		return
	}

	vehicleID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid vehicle ID")
		return
	}

	location := c.Query("location")
	if location == "" {
		utils.RespondWithError(c, http.StatusBadRequest, "Location is required")
		return
	}

	// Get transporter ID from user ID
	transporter, err := h.transporterService.GetTransporterByUserID(c.Request.Context(), userID)
	if err != nil {
		utils.RespondWithError(c, http.StatusNotFound, "Transporter profile not found")
		return
	}

	if err := h.vehicleService.UpdateVehicleLocation(c.Request.Context(), vehicleID, transporter.ID, location); err != nil {
		switch err {
		case service.ErrVehicleNotFound:
			utils.RespondWithError(c, http.StatusNotFound, err.Error())
		case service.ErrUnauthorizedAccess:
			utils.RespondWithError(c, http.StatusForbidden, err.Error())
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to update vehicle location")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Vehicle location updated successfully", nil)
}

// DeleteVehicle deletes a vehicle
// @Summary Delete vehicle
// @Description Delete a vehicle from transporter's fleet
// @Tags vehicles
// @Produce json
// @Security BearerAuth
// @Param id path string true "Vehicle ID"
// @Success 200 {object} utils.SuccessResponse "Vehicle deleted successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid vehicle ID"
// @Failure 401 {object} utils.ErrorResponse "Unauthorized"
// @Failure 403 {object} utils.ErrorResponse "Forbidden"
// @Failure 404 {object} utils.ErrorResponse "Vehicle not found"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /transporters/vehicles/{id} [delete]
func (h *TransporterHandler) DeleteVehicle(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil {
		utils.RespondWithError(c, http.StatusUnauthorized, err.Error())
		return
	}

	vehicleID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid vehicle ID")
		return
	}

	// Get transporter ID from user ID
	transporter, err := h.transporterService.GetTransporterByUserID(c.Request.Context(), userID)
	if err != nil {
		utils.RespondWithError(c, http.StatusNotFound, "Transporter profile not found")
		return
	}

	if err := h.vehicleService.DeleteVehicle(c.Request.Context(), vehicleID, transporter.ID); err != nil {
		switch err {
		case service.ErrVehicleNotFound:
			utils.RespondWithError(c, http.StatusNotFound, err.Error())
		case service.ErrUnauthorizedAccess:
			utils.RespondWithError(c, http.StatusForbidden, err.Error())
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to delete vehicle")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Vehicle deleted successfully", nil)
}

// GetAvailableVehicles gets available vehicles with filtering
// @Summary Get available vehicles
// @Description Get available vehicles with filtering options
// @Tags vehicles
// @Produce json
// @Param transporter_id query string false "Transporter ID filter"
// @Param vehicle_type query string false "Vehicle type filter"
// @Param is_available query boolean false "Availability filter"
// @Param min_capacity query number false "Minimum capacity filter"
// @Param max_capacity query number false "Maximum capacity filter"
// @Param location query string false "Location filter"
// @Param page query integer false "Page number" default(1)
// @Param page_size query integer false "Page size" default(10)
// @Success 200 {object} utils.SuccessResponse{data=[]dto.VehicleResponse} "Vehicles retrieved successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid query parameters"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /transporters/vehicles/available [get]
func (h *TransporterHandler) GetAvailableVehicles(c *gin.Context) {
	var filters dto.VehicleFilterRequest

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

	vehicles, err := h.vehicleService.GetAvailableVehicles(c.Request.Context(), filters)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to retrieve available vehicles")
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Available vehicles retrieved successfully", vehicles)
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
