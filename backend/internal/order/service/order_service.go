package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	dto "agro_konnect/internal/order/dto"
	model "agro_konnect/internal/order/model"
	"agro_konnect/internal/order/repository"
	"agro_konnect/internal/order/utils"
	productModel "agro_konnect/internal/product/model"
	productRepo "agro_konnect/internal/product/repository"

	"github.com/google/uuid"
)

var (
	ErrOrderNotFound      = errors.New("order not found")
	ErrInvalidOrderData   = errors.New("invalid order data")
	ErrInsufficientStock  = errors.New("insufficient stock")
	ErrUnauthorizedAccess = errors.New("unauthorized access to order")
	ErrInvalidOrderStatus = errors.New("invalid order status transition")
	ErrPaymentRequired    = errors.New("payment required")
	ErrOrderAlreadyPaid   = errors.New("order already paid")
	ErrInvalidPayment     = errors.New("invalid payment")
)

type OrderService interface {
	CreateOrder(ctx context.Context, buyerID uuid.UUID, req *dto.CreateOrderRequest) (*model.Order, error)
	GetOrderByID(ctx context.Context, orderID uuid.UUID, userID uuid.UUID, userRole string) (*dto.OrderResponse, error)
	GetOrderByNumber(ctx context.Context, orderNumber string, userID uuid.UUID, userRole string) (*dto.OrderResponse, error)
	GetBuyerOrders(ctx context.Context, buyerID uuid.UUID, page, pageSize int) (*dto.OrderListResponse, error)
	GetFarmerOrders(ctx context.Context, farmerID uuid.UUID, page, pageSize int) (*dto.OrderListResponse, error)
	UpdateOrderStatus(ctx context.Context, orderID uuid.UUID, userID uuid.UUID, userRole string, req *dto.UpdateOrderStatusRequest) error
	AssignTransporter(ctx context.Context, orderID uuid.UUID, farmerID uuid.UUID, req *dto.AssignTransporterRequest) error
	ProcessPayment(ctx context.Context, orderID uuid.UUID, buyerID uuid.UUID, req *dto.PaymentRequest) error
	CancelOrder(ctx context.Context, orderID uuid.UUID, userID uuid.UUID, userRole string) error
	GetOrderSummary(ctx context.Context, userID uuid.UUID, userType string) (*dto.OrderSummaryResponse, error)
	GetTrackingHistory(ctx context.Context, orderID uuid.UUID, userID uuid.UUID, userRole string) ([]*dto.TrackingResponse, error)
	AddTrackingEvent(ctx context.Context, orderID uuid.UUID, userID uuid.UUID, userRole string, status model.OrderStatus, description string) error
}

type orderService struct {
	orderRepo   repository.OrderRepository
	productRepo productRepo.ProductRepository
}

func NewOrderService(orderRepo repository.OrderRepository, productRepo productRepo.ProductRepository) OrderService {
	return &orderService{
		orderRepo:   orderRepo,
		productRepo: productRepo,
	}
}

// internal/order/service/order_service.go
func (s *orderService) CreateOrder(ctx context.Context, buyerID uuid.UUID, req *dto.CreateOrderRequest) (*model.Order, error) {
	// Generate order number
	orderNumber, err := utils.GenerateOrderNumber()
	if err != nil {
		return nil, fmt.Errorf("failed to generate order number: %w", err)
	}

	// Validate and process order items
	var orderItems []model.OrderItem
	var subTotal float64
	var farmerID uuid.UUID
	var vendorID uuid.UUID

	for _, itemReq := range req.Items {
		// Get product details
		product, err := s.productRepo.FindByID(ctx, itemReq.ProductID)
		if err != nil {
			return nil, fmt.Errorf("failed to get product: %w", err)
		}
		if product == nil {
			return nil, fmt.Errorf("product not found: %s", itemReq.ProductID)
		}
		if product.Status != productModel.StatusActive {
			return nil, fmt.Errorf("product is not available for purchase: %s", product.Name)
		}
		if product.AvailableStock < itemReq.Quantity {
			return nil, fmt.Errorf("insufficient stock for product %s. Available: %.2f, Requested: %.2f",
				product.Name, product.AvailableStock, itemReq.Quantity)
		}

		// For first item, set farmer and vendor IDs
		if farmerID == uuid.Nil {
			farmerID = product.FarmerID
			// In real scenario, vendor ID might come from farmer-vendor relationship
			vendorID = s.getVendorForFarmer(ctx, product.FarmerID)
		}

		// Check if all products are from the same farmer
		if product.FarmerID != farmerID {
			return nil, errors.New("all products in order must be from the same farmer")
		}

		// Calculate item total
		itemTotal := product.PricePerUnit * itemReq.Quantity

		orderItem := model.OrderItem{
			ID:           uuid.New(),
			ProductID:    product.ID,
			ProductName:  product.Name,
			ProductImage: getFirstImage(product.Images),
			UnitPrice:    product.PricePerUnit,
			Quantity:     itemReq.Quantity,
			Unit:         product.Unit,
			TotalPrice:   itemTotal,
			QualityGrade: string(product.QualityGrade),
			Organic:      product.Organic,
			HarvestDate:  product.HarvestDate,
		}

		orderItems = append(orderItems, orderItem)
		subTotal += itemTotal

		// Update product stock (in real scenario, this should be in transaction)
		newStock := product.AvailableStock - itemReq.Quantity
		if err := s.productRepo.UpdateStock(ctx, product.ID, newStock); err != nil {
			return nil, fmt.Errorf("failed to update stock for product %s: %w", product.Name, err)
		}
	}

	// Calculate totals
	taxAmount := subTotal * 0.1 // 10% tax
	shippingCost := s.calculateShippingCost(req.ShippingCity, subTotal)
	discountAmount := 0.0 // No discount for now
	totalAmount := subTotal + taxAmount + shippingCost - discountAmount

	// Calculate estimated delivery (3-7 days from now)
	estimatedDelivery := s.calculateEstimatedDelivery()

	// Create order
	order := &model.Order{
		ID:          uuid.New(),
		OrderNumber: orderNumber,
		BuyerID:     buyerID,
		FarmerID:    farmerID,
		VendorID:    vendorID,

		TotalAmount:    totalAmount,
		SubTotal:       subTotal,
		TaxAmount:      taxAmount,
		ShippingCost:   shippingCost,
		DiscountAmount: discountAmount,

		Status:        model.OrderStatusPending,
		PaymentStatus: model.PaymentStatusPending,
		PaymentMethod: req.PaymentMethod,

		ShippingAddress: req.ShippingAddress,
		ShippingCity:    req.ShippingCity,
		ShippingState:   req.ShippingState,
		ShippingZipCode: req.ShippingZipCode,
		ShippingNotes:   req.ShippingNotes,

		EstimatedDelivery: estimatedDelivery,
		OrderItems:        orderItems,
		CreatedAt:         time.Now(),
		UpdatedAt:         time.Now(),
	}

	// Save order
	if err := s.orderRepo.Create(ctx, order); err != nil {
		return nil, fmt.Errorf("failed to create order: %w", err)
	}

	// Add initial tracking event
	tracking := &model.OrderTracking{
		ID:          uuid.New(),
		OrderID:     order.ID,
		Status:      model.OrderStatusPending,
		Location:    "Order created",
		Description: "Order has been placed successfully",
		CreatedAt:   time.Now(),
	}
	if err := s.orderRepo.AddTrackingEvent(ctx, tracking); err != nil {
		// Log error but don't fail the order creation
		fmt.Printf("Failed to add tracking event: %v\n", err)
	}

	return order, nil
}

// Helper function to get vendor for farmer
func (s *orderService) getVendorForFarmer(ctx context.Context, farmerID uuid.UUID) uuid.UUID {
	// In real implementation, this would query farmer-vendor relationship table
	// For now, return a default vendor ID or implement your logic
	return uuid.New() // Replace with actual logic
}

func (s *orderService) GetOrderByID(ctx context.Context, orderID uuid.UUID, userID uuid.UUID, userRole string) (*dto.OrderResponse, error) {
	order, err := s.orderRepo.FindByID(ctx, orderID)
	if err != nil {
		return nil, err
	}
	if order == nil {
		return nil, ErrOrderNotFound
	}

	// Check authorization
	if !s.canAccessOrder(order, userID, userRole) {
		return nil, ErrUnauthorizedAccess
	}

	return s.toOrderResponse(order), nil
}

func (s *orderService) GetOrderByNumber(ctx context.Context, orderNumber string, userID uuid.UUID, userRole string) (*dto.OrderResponse, error) {
	order, err := s.orderRepo.FindByOrderNumber(ctx, orderNumber)
	if err != nil {
		return nil, err
	}
	if order == nil {
		return nil, ErrOrderNotFound
	}

	// Check authorization
	if !s.canAccessOrder(order, userID, userRole) {
		return nil, ErrUnauthorizedAccess
	}

	return s.toOrderResponse(order), nil
}

func (s *orderService) GetBuyerOrders(ctx context.Context, buyerID uuid.UUID, page, pageSize int) (*dto.OrderListResponse, error) {
	if page == 0 {
		page = 1
	}
	if pageSize == 0 {
		pageSize = 10
	}

	orders, total, err := s.orderRepo.FindByBuyerID(ctx, buyerID, page, pageSize)
	if err != nil {
		return nil, err
	}

	responses := make([]*dto.OrderResponse, len(orders))
	for i, order := range orders {
		responses[i] = s.toOrderResponse(order)
	}

	pages := int((total + int64(pageSize) - 1) / int64(pageSize))
	hasMore := page < pages

	return &dto.OrderListResponse{
		Orders:  responses,
		Total:   total,
		Page:    page,
		Pages:   pages,
		HasMore: hasMore,
	}, nil
}

func (s *orderService) GetFarmerOrders(ctx context.Context, farmerID uuid.UUID, page, pageSize int) (*dto.OrderListResponse, error) {
	fmt.Printf("DEBUG GetFarmerOrders: farmerID=%s, page=%d, pageSize=%d\n", farmerID, page, pageSize)

	if page == 0 {
		page = 1
	}
	if pageSize == 0 {
		pageSize = 10
	}

	orders, total, err := s.orderRepo.FindByFarmerID(ctx, farmerID, page, pageSize)
	if err != nil {
		return nil, err
	}

	fmt.Printf("DEBUG GetFarmerOrders: found %d orders, total=%d\n", len(orders), total)

	responses := make([]*dto.OrderResponse, len(orders))
	for i, order := range orders {
		responses[i] = s.toOrderResponse(order)
		fmt.Printf("DEBUG Order %d: ID=%s, FarmerID=%s, BuyerID=%s\n", i, order.ID, order.FarmerID, order.BuyerID)
	}

	pages := int((total + int64(pageSize) - 1) / int64(pageSize))
	hasMore := page < pages

	return &dto.OrderListResponse{
		Orders:  responses,
		Total:   total,
		Page:    page,
		Pages:   pages,
		HasMore: hasMore,
	}, nil
}

func (s *orderService) UpdateOrderStatus(ctx context.Context, orderID uuid.UUID, userID uuid.UUID, userRole string, req *dto.UpdateOrderStatusRequest) error {
	order, err := s.orderRepo.FindByID(ctx, orderID)
	if err != nil {
		return err
	}
	if order == nil {
		return ErrOrderNotFound
	}

	fmt.Printf("DEBUG UpdateOrderStatus: userID=%s , userRole=%s, orderFarmerID=%s, orderBuyerID=%s\n", userID, userRole, order.FarmerID, order.BuyerID)

	// Check authorization
	if !s.canModifyOrder(order, userID, userRole) {
		fmt.Printf("DEBUG Authorization failed: canModifyOrder returned false\n")
		return ErrUnauthorizedAccess
	}

	// Validate status transition
	if !s.isValidStatusTransition(order.Status, req.Status) {
		return ErrInvalidOrderStatus
	}

	// Update order status
	if err := s.orderRepo.UpdateStatus(ctx, orderID, req.Status); err != nil {
		return err
	}

	// Add tracking event
	tracking := &model.OrderTracking{
		ID:          uuid.New(),
		OrderID:     orderID,
		Status:      req.Status,
		Description: fmt.Sprintf("Order status updated to %s", req.Status),
		Notes:       req.Notes,
		CreatedAt:   time.Now(),
	}
	return s.orderRepo.AddTrackingEvent(ctx, tracking)
}

func (s *orderService) AssignTransporter(ctx context.Context, orderID uuid.UUID, farmerID uuid.UUID, req *dto.AssignTransporterRequest) error {
	order, err := s.orderRepo.FindByID(ctx, orderID)
	if err != nil {
		return err
	}
	if order == nil {
		return ErrOrderNotFound
	}

	// Only farmer can assign transporter
	if order.FarmerID != farmerID {
		return ErrUnauthorizedAccess
	}

	// Parse estimated delivery
	estimatedDelivery, err := time.Parse(time.RFC3339, req.EstimatedDelivery)
	if err != nil {
		return errors.New("invalid estimated delivery format")
	}

	// Update order with transporter info
	order.TransporterID = req.TransporterID
	order.EstimatedDelivery = estimatedDelivery
	order.UpdatedAt = time.Now()

	if err := s.orderRepo.Update(ctx, order); err != nil {
		return err
	}

	// Add tracking event
	tracking := &model.OrderTracking{
		ID:          uuid.New(),
		OrderID:     orderID,
		Status:      model.OrderStatusProcessing,
		Description: "Transporter assigned to order",
		Notes:       fmt.Sprintf("Vehicle ID: %s", req.VehicleID),
		CreatedAt:   time.Now(),
	}
	return s.orderRepo.AddTrackingEvent(ctx, tracking)
}

func (s *orderService) ProcessPayment(ctx context.Context, orderID uuid.UUID, buyerID uuid.UUID, req *dto.PaymentRequest) error {
	order, err := s.orderRepo.FindByID(ctx, orderID)
	if err != nil {
		return err
	}
	if order == nil {
		return ErrOrderNotFound
	}

	// Only buyer can pay for their order
	if order.BuyerID != buyerID {
		return ErrUnauthorizedAccess
	}

	// Check if order is already paid
	if order.PaymentStatus == model.PaymentStatusPaid {
		return ErrOrderAlreadyPaid
	}

	// Process payment (integrate with payment gateway in real implementation)
	paymentID, err := s.processPaymentGateway(req)
	if err != nil {
		// Update payment status to failed
		s.orderRepo.UpdatePaymentStatus(ctx, orderID, model.PaymentStatusFailed, "")
		return ErrInvalidPayment
	}

	// Update payment status to paid
	if err := s.orderRepo.UpdatePaymentStatus(ctx, orderID, model.PaymentStatusPaid, paymentID); err != nil {
		return err
	}

	// Update order status to confirmed
	if err := s.orderRepo.UpdateStatus(ctx, orderID, model.OrderStatusConfirmed); err != nil {
		return err
	}

	// Add tracking event
	tracking := &model.OrderTracking{
		ID:          uuid.New(),
		OrderID:     orderID,
		Status:      model.OrderStatusConfirmed,
		Description: "Payment processed successfully",
		Notes:       fmt.Sprintf("Payment method: %s", req.PaymentMethod),
		CreatedAt:   time.Now(),
	}
	return s.orderRepo.AddTrackingEvent(ctx, tracking)
}

func (s *orderService) CancelOrder(ctx context.Context, orderID uuid.UUID, userID uuid.UUID, userRole string) error {
	order, err := s.orderRepo.FindByID(ctx, orderID)
	if err != nil {
		return err
	}
	if order == nil {
		return ErrOrderNotFound
	}

	// Check authorization
	if !s.canModifyOrder(order, userID, userRole) {
		return ErrUnauthorizedAccess
	}

	// Check if order can be cancelled
	if !s.canCancelOrder(order.Status) {
		return errors.New("order cannot be cancelled in current status")
	}

	// Update order status to cancelled
	if err := s.orderRepo.UpdateStatus(ctx, orderID, model.OrderStatusCancelled); err != nil {
		return err
	}

	// Update payment status to refunded if paid
	if order.PaymentStatus == model.PaymentStatusPaid {
		s.orderRepo.UpdatePaymentStatus(ctx, orderID, model.PaymentStatusRefunded, "")
	}

	// Add tracking event
	now := time.Now()
	tracking := &model.OrderTracking{
		ID:          uuid.New(),
		OrderID:     orderID,
		Status:      model.OrderStatusCancelled,
		Description: "Order has been cancelled",
		CreatedAt:   now,
	}

	if err := s.orderRepo.AddTrackingEvent(ctx, tracking); err != nil {
		return err
	}

	// Update cancelled_at timestamp
	order.CancelledAt = &now
	return s.orderRepo.Update(ctx, order)
}

func (s *orderService) GetOrderSummary(ctx context.Context, userID uuid.UUID, userType string) (*dto.OrderSummaryResponse, error) {
	summary, err := s.orderRepo.GetOrderSummary(ctx, userID, userType)
	if err != nil {
		return nil, err
	}

	return &dto.OrderSummaryResponse{
		TotalOrders:       int(summary.TotalOrders),
		PendingOrders:     int(summary.PendingOrders),
		CompletedOrders:   int(summary.CompletedOrders),
		CancelledOrders:   int(summary.CancelledOrders),
		TotalRevenue:      summary.TotalRevenue,
		AverageOrderValue: summary.AverageOrderValue,
	}, nil
}

func (s *orderService) GetTrackingHistory(ctx context.Context, orderID uuid.UUID, userID uuid.UUID, userRole string) ([]*dto.TrackingResponse, error) {
	order, err := s.orderRepo.FindByID(ctx, orderID)
	if err != nil {
		return nil, err
	}
	if order == nil {
		return nil, ErrOrderNotFound
	}

	// Check authorization
	if !s.canAccessOrder(order, userID, userRole) {
		return nil, ErrUnauthorizedAccess
	}

	tracking, err := s.orderRepo.GetTrackingHistory(ctx, orderID)
	if err != nil {
		return nil, err
	}

	responses := make([]*dto.TrackingResponse, len(tracking))
	for i, track := range tracking {
		responses[i] = &dto.TrackingResponse{
			Status:      track.Status,
			Location:    track.Location,
			Description: track.Description,
			Notes:       track.Notes,
			Timestamp:   track.CreatedAt,
		}
	}

	return responses, nil
}

func (s *orderService) AddTrackingEvent(ctx context.Context, orderID uuid.UUID, userID uuid.UUID, userRole string, status model.OrderStatus, description string) error {
	order, err := s.orderRepo.FindByID(ctx, orderID)
	if err != nil {
		return err
	}
	if order == nil {
		return ErrOrderNotFound
	}

	// Only farmer or transporter can add tracking events
	if userRole != "farmer" && userRole != "transporter" {
		return ErrUnauthorizedAccess
	}

	tracking := &model.OrderTracking{
		ID:          uuid.New(),
		OrderID:     orderID,
		Status:      status,
		Description: description,
		CreatedAt:   time.Now(),
	}

	return s.orderRepo.AddTrackingEvent(ctx, tracking)
}

// Helper methods
func (s *orderService) canAccessOrder(order *model.Order, userID uuid.UUID, userRole string) bool {
	switch userRole {
	case "buyer":
		return order.BuyerID == userID
	case "farmer":
		return order.FarmerID == userID
	case "transporter":
		return order.TransporterID == userID
	case "admin":
		return true
	default:
		return false
	}
}

func (s *orderService) canModifyOrder(order *model.Order, userID uuid.UUID, userRole string) bool {
	switch userRole {
	case "buyer":
		return order.BuyerID == userID && order.Status == model.OrderStatusPending
	case "farmer":
		return order.FarmerID == userID
	case "admin":
		return true
	default:
		return false
	}
}

func (s *orderService) isValidStatusTransition(current, new model.OrderStatus) bool {
	validTransitions := map[model.OrderStatus][]model.OrderStatus{
		model.OrderStatusPending:    {model.OrderStatusConfirmed, model.OrderStatusCancelled},
		model.OrderStatusConfirmed:  {model.OrderStatusProcessing, model.OrderStatusCancelled},
		model.OrderStatusProcessing: {model.OrderStatusShipped, model.OrderStatusCancelled},
		model.OrderStatusShipped:    {model.OrderStatusInTransit, model.OrderStatusCancelled},
		model.OrderStatusInTransit:  {model.OrderStatusDelivered, model.OrderStatusCancelled},
	}

	allowed, exists := validTransitions[current]
	if !exists {
		return false
	}

	for _, status := range allowed {
		if status == new {
			return true
		}
	}
	return false
}

func (s *orderService) canCancelOrder(status model.OrderStatus) bool {
	cancellableStatuses := []model.OrderStatus{
		model.OrderStatusPending,
		model.OrderStatusConfirmed,
		model.OrderStatusProcessing,
	}

	for _, s := range cancellableStatuses {
		if s == status {
			return true
		}
	}
	return false
}

func (s *orderService) processPaymentGateway(req *dto.PaymentRequest) (string, error) {
	// Integrate with actual payment gateway (Stripe, Razorpay, etc.)
	// For now, simulate successful payment
	return fmt.Sprintf("pay_%s", uuid.New().String()), nil
}

func (s *orderService) calculateShippingCost(city string, orderAmount float64) float64 {
	// Simple shipping cost calculation
	// In real implementation, integrate with shipping service
	baseCost := 50.0

	// Free shipping for orders above 1000
	if orderAmount > 1000 {
		return 0.0
	}

	// Additional cost for remote areas
	remoteCities := []string{"remote", "rural", "mountain"}
	cityLower := strings.ToLower(city)
	for _, remote := range remoteCities {
		if strings.Contains(cityLower, remote) {
			return baseCost + 25.0
		}
	}

	return baseCost
}

func (s *orderService) calculateEstimatedDelivery() time.Time {
	// Calculate estimated delivery (3-7 business days from now)
	now := time.Now()
	deliveryDays := 5 // Average 5 days
	return now.AddDate(0, 0, deliveryDays)
}

func (s *orderService) toOrderResponse(order *model.Order) *dto.OrderResponse {
	orderItems := make([]dto.OrderItemResponse, len(order.OrderItems))
	for i, item := range order.OrderItems {
		orderItems[i] = dto.OrderItemResponse{
			ID:           item.ID,
			ProductID:    item.ProductID,
			ProductName:  item.ProductName,
			ProductImage: item.ProductImage,
			UnitPrice:    item.UnitPrice,
			Quantity:     item.Quantity,
			Unit:         item.Unit,
			TotalPrice:   item.TotalPrice,
			QualityGrade: item.QualityGrade,
			Organic:      item.Organic,
		}
	}

	return &dto.OrderResponse{
		ID:          order.ID,
		OrderNumber: order.OrderNumber,

		BuyerID:       order.BuyerID,
		FarmerID:      order.FarmerID,
		VendorID:      order.VendorID,
		TransporterID: order.TransporterID,

		TotalAmount:    order.TotalAmount,
		SubTotal:       order.SubTotal,
		TaxAmount:      order.TaxAmount,
		ShippingCost:   order.ShippingCost,
		DiscountAmount: order.DiscountAmount,

		Status:        order.Status,
		PaymentStatus: order.PaymentStatus,
		PaymentMethod: order.PaymentMethod,

		ShippingAddress: order.ShippingAddress,
		ShippingCity:    order.ShippingCity,
		ShippingState:   order.ShippingState,
		ShippingZipCode: order.ShippingZipCode,

		EstimatedDelivery: order.EstimatedDelivery,
		ActualDelivery:    order.ActualDelivery,

		TrackingNumber: order.TrackingNumber,
		TrackingURL:    order.TrackingURL,

		OrderItems: orderItems,

		CreatedAt: order.CreatedAt,
	}
}

func getFirstImage(images productModel.JSONSlice) string {
	if len(images) > 0 {
		return images[0]
	}
	return ""
}
