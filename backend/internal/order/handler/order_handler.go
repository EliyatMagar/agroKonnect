package handler

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"

	farmerRepo "agro_konnect/internal/farmer/repository"

	dto "agro_konnect/internal/order/dto"
	"agro_konnect/internal/order/service"
	"agro_konnect/internal/order/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type OrderHandler struct {
	orderService service.OrderService
	farmerRepo   farmerRepo.FarmerRepository
}

func NewOrderHandler(orderService service.OrderService, farmerRepo farmerRepo.FarmerRepository) *OrderHandler {
	return &OrderHandler{
		orderService: orderService,
		farmerRepo:   farmerRepo,
	}
}

// CreateOrder creates a new order
func (h *OrderHandler) CreateOrder(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil {
		utils.RespondWithError(c, http.StatusUnauthorized, err.Error())
		return
	}

	var req dto.CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid input data: "+err.Error())
		return
	}

	// Validate using custom validator
	if err := utils.ValidateStruct(req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, err.Error())
		return
	}

	order, err := h.orderService.CreateOrder(c.Request.Context(), userID, &req)
	if err != nil {
		switch err {
		case service.ErrInvalidOrderData, service.ErrInsufficientStock:
			utils.RespondWithError(c, http.StatusBadRequest, err.Error())
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to create order")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusCreated, "Order created successfully", order)
}

// GetOrderByID gets an order by ID
func (h *OrderHandler) GetOrderByID(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil {
		utils.RespondWithError(c, http.StatusUnauthorized, err.Error())
		return
	}

	userRole := c.GetString("userRole")

	orderID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid order ID")
		return
	}

	order, err := h.orderService.GetOrderByID(c.Request.Context(), orderID, userID, userRole)
	if err != nil {
		switch err {
		case service.ErrOrderNotFound:
			utils.RespondWithError(c, http.StatusNotFound, err.Error())
		case service.ErrUnauthorizedAccess:
			utils.RespondWithError(c, http.StatusForbidden, err.Error())
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to retrieve order")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Order retrieved successfully", order)
}

// GetOrderByNumber gets an order by order number
func (h *OrderHandler) GetOrderByNumber(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil {
		utils.RespondWithError(c, http.StatusUnauthorized, err.Error())
		return
	}

	userRole := c.GetString("userRole")
	orderNumber := c.Param("orderNumber")

	order, err := h.orderService.GetOrderByNumber(c.Request.Context(), orderNumber, userID, userRole)
	if err != nil {
		switch err {
		case service.ErrOrderNotFound:
			utils.RespondWithError(c, http.StatusNotFound, err.Error())
		case service.ErrUnauthorizedAccess:
			utils.RespondWithError(c, http.StatusForbidden, err.Error())
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to retrieve order")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Order retrieved successfully", order)
}

// GetMyOrders gets the current user's orders
// GetMyOrders gets the current user's orders
func (h *OrderHandler) GetMyOrders(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil {
		utils.RespondWithError(c, http.StatusUnauthorized, err.Error())
		return
	}

	// Get user role from context
	userRole, exists := c.Get("userRole")
	if !exists {
		utils.RespondWithError(c, http.StatusForbidden, "User role not found in context")
		return
	}

	// Convert role to string
	userRoleStr := fmt.Sprintf("%v", userRole)

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	var response *dto.OrderListResponse

	switch userRoleStr {
	case "buyer":
		response, err = h.orderService.GetBuyerOrders(c.Request.Context(), userID, page, pageSize)
	case "farmer":
		// For farmers, we need to get the farmer ID from the user ID
		farmer, err := h.farmerRepo.FindByUserID(c.Request.Context(), userID)
		if err != nil || farmer == nil {
			utils.RespondWithError(c, http.StatusNotFound, "Farmer profile not found")
			return
		}
		fmt.Printf("DEBUG: UserID=%s, FarmerID=%s\n", userID, farmer.ID)
		response, err = h.orderService.GetFarmerOrders(c.Request.Context(), farmer.ID, page, pageSize)
	case "transporter":
		utils.RespondWithError(c, http.StatusForbidden, "Transporters cannot access orders via this endpoint")
		return
	case "vendor":
		utils.RespondWithError(c, http.StatusForbidden, "Vendors cannot access orders via this endpoint")
		return
	default:
		utils.RespondWithError(c, http.StatusForbidden, "Access denied for user role: "+userRoleStr)
		return
	}

	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to retrieve orders")
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Orders retrieved successfully", response)
}

// UpdateOrderStatus updates order status
func (h *OrderHandler) UpdateOrderStatus(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil {
		utils.RespondWithError(c, http.StatusUnauthorized, err.Error())
		return
	}

	userRole := c.GetString("userRole")

	orderID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid order ID")
		return
	}

	var req dto.UpdateOrderStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid input data: "+err.Error())
		return
	}

	if err := utils.ValidateStruct(req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.orderService.UpdateOrderStatus(c.Request.Context(), orderID, userID, userRole, &req); err != nil {
		switch err {
		case service.ErrOrderNotFound:
			utils.RespondWithError(c, http.StatusNotFound, err.Error())
		case service.ErrUnauthorizedAccess:
			utils.RespondWithError(c, http.StatusForbidden, err.Error())
		case service.ErrInvalidOrderStatus:
			utils.RespondWithError(c, http.StatusBadRequest, err.Error())
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to update order status")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Order status updated successfully", nil)
}

// AssignTransporter assigns a transporter to an order
func (h *OrderHandler) AssignTransporter(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil {
		utils.RespondWithError(c, http.StatusUnauthorized, err.Error())
		return
	}

	orderID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid order ID")
		return
	}

	var req dto.AssignTransporterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid input data: "+err.Error())
		return
	}

	if err := utils.ValidateStruct(req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.orderService.AssignTransporter(c.Request.Context(), orderID, userID, &req); err != nil {
		switch err {
		case service.ErrOrderNotFound:
			utils.RespondWithError(c, http.StatusNotFound, err.Error())
		case service.ErrUnauthorizedAccess:
			utils.RespondWithError(c, http.StatusForbidden, err.Error())
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to assign transporter")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Transporter assigned successfully", nil)
}

// ProcessPayment processes order payment
func (h *OrderHandler) ProcessPayment(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil {
		utils.RespondWithError(c, http.StatusUnauthorized, err.Error())
		return
	}

	orderID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid order ID")
		return
	}

	var req dto.PaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid input data: "+err.Error())
		return
	}

	if err := utils.ValidateStruct(req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.orderService.ProcessPayment(c.Request.Context(), orderID, userID, &req); err != nil {
		switch err {
		case service.ErrOrderNotFound:
			utils.RespondWithError(c, http.StatusNotFound, err.Error())
		case service.ErrUnauthorizedAccess:
			utils.RespondWithError(c, http.StatusForbidden, err.Error())
		case service.ErrOrderAlreadyPaid, service.ErrInvalidPayment:
			utils.RespondWithError(c, http.StatusBadRequest, err.Error())
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to process payment")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Payment processed successfully", nil)
}

// CancelOrder cancels an order
func (h *OrderHandler) CancelOrder(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil {
		utils.RespondWithError(c, http.StatusUnauthorized, err.Error())
		return
	}

	userRole := c.GetString("userRole")

	orderID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid order ID")
		return
	}

	if err := h.orderService.CancelOrder(c.Request.Context(), orderID, userID, userRole); err != nil {
		switch err {
		case service.ErrOrderNotFound:
			utils.RespondWithError(c, http.StatusNotFound, err.Error())
		case service.ErrUnauthorizedAccess:
			utils.RespondWithError(c, http.StatusForbidden, err.Error())
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to cancel order")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Order cancelled successfully", nil)
}

// GetOrderSummary gets order summary for the user
func (h *OrderHandler) GetOrderSummary(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil {
		utils.RespondWithError(c, http.StatusUnauthorized, err.Error())
		return
	}

	userRole := c.GetString("userRole")

	summary, err := h.orderService.GetOrderSummary(c.Request.Context(), userID, userRole)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to get order summary")
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Order summary retrieved successfully", summary)
}

// GetTrackingHistory gets order tracking history
func (h *OrderHandler) GetTrackingHistory(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil {
		utils.RespondWithError(c, http.StatusUnauthorized, err.Error())
		return
	}

	userRole := c.GetString("userRole")

	orderID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid order ID")
		return
	}

	tracking, err := h.orderService.GetTrackingHistory(c.Request.Context(), orderID, userID, userRole)
	if err != nil {
		switch err {
		case service.ErrOrderNotFound:
			utils.RespondWithError(c, http.StatusNotFound, err.Error())
		case service.ErrUnauthorizedAccess:
			utils.RespondWithError(c, http.StatusForbidden, err.Error())
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to get tracking history")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Tracking history retrieved successfully", tracking)
}

// GetUserIDFromContext extracts user ID from Gin context
func GetUserIDFromContext(c *gin.Context) (uuid.UUID, error) {
	userID, exists := c.Get("userID")
	if !exists {
		return uuid.Nil, errors.New("user ID not found in context")
	}

	switch v := userID.(type) {
	case uuid.UUID:
		return v, nil
	case string:
		parsedUUID, err := uuid.Parse(v)
		if err != nil {
			return uuid.Nil, fmt.Errorf("invalid user ID format: %w", err)
		}
		return parsedUUID, nil
	default:
		return uuid.Nil, errors.New("invalid user ID type in context")
	}
}
