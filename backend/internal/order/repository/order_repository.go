package repository

import (
	"context"
	"time"

	model "agro_konnect/internal/order/model"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type OrderRepository interface {
	Create(ctx context.Context, order *model.Order) error
	FindByID(ctx context.Context, id uuid.UUID) (*model.Order, error)
	FindByOrderNumber(ctx context.Context, orderNumber string) (*model.Order, error)
	FindByBuyerID(ctx context.Context, buyerID uuid.UUID, page, pageSize int) ([]*model.Order, int64, error)
	FindByFarmerID(ctx context.Context, farmerID uuid.UUID, page, pageSize int) ([]*model.Order, int64, error)
	FindByTransporterID(ctx context.Context, transporterID uuid.UUID, page, pageSize int) ([]*model.Order, int64, error)
	Update(ctx context.Context, order *model.Order) error
	UpdateStatus(ctx context.Context, orderID uuid.UUID, status model.OrderStatus) error
	UpdatePaymentStatus(ctx context.Context, orderID uuid.UUID, paymentStatus model.PaymentStatus, paymentID string) error
	AddTrackingEvent(ctx context.Context, tracking *model.OrderTracking) error
	GetTrackingHistory(ctx context.Context, orderID uuid.UUID) ([]*model.OrderTracking, error)
	GetOrderSummary(ctx context.Context, userID uuid.UUID, userType string) (*model.OrderSummary, error)
	FindOrdersWithFilters(ctx context.Context, filters OrderFilter) ([]*model.Order, int64, error)
}

type OrderFilter struct {
	Status        model.OrderStatus
	PaymentStatus model.PaymentStatus
	BuyerID       uuid.UUID
	FarmerID      uuid.UUID
	StartDate     time.Time
	EndDate       time.Time
	Page          int
	PageSize      int
}

type orderRepository struct {
	db *gorm.DB
}

func NewOrderRepository(db *gorm.DB) OrderRepository {
	return &orderRepository{db: db}
}

func (r *orderRepository) Create(ctx context.Context, order *model.Order) error {
	return r.db.WithContext(ctx).Create(order).Error
}

func (r *orderRepository) FindByID(ctx context.Context, id uuid.UUID) (*model.Order, error) {
	var order model.Order
	err := r.db.WithContext(ctx).
		Preload("OrderItems").
		Where("id = ?", id).
		First(&order).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	return &order, err
}

func (r *orderRepository) FindByOrderNumber(ctx context.Context, orderNumber string) (*model.Order, error) {
	var order model.Order
	err := r.db.WithContext(ctx).
		Preload("OrderItems").
		Where("order_number = ?", orderNumber).
		First(&order).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	return &order, err
}

func (r *orderRepository) FindByBuyerID(ctx context.Context, buyerID uuid.UUID, page, pageSize int) ([]*model.Order, int64, error) {
	var orders []*model.Order
	var total int64

	query := r.db.WithContext(ctx).Where("buyer_id = ?", buyerID)

	if err := query.Model(&model.Order{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	err := query.Preload("OrderItems").
		Order("created_at DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&orders).Error

	return orders, total, err
}

func (r *orderRepository) FindByFarmerID(ctx context.Context, farmerID uuid.UUID, page, pageSize int) ([]*model.Order, int64, error) {
	var orders []*model.Order
	var total int64

	query := r.db.WithContext(ctx).Where("farmer_id = ?", farmerID)

	if err := query.Model(&model.Order{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	err := query.Preload("OrderItems").
		Order("created_at DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&orders).Error

	return orders, total, err
}

func (r *orderRepository) FindByTransporterID(ctx context.Context, transporterID uuid.UUID, page, pageSize int) ([]*model.Order, int64, error) {
	var orders []*model.Order
	var total int64

	query := r.db.WithContext(ctx).Where("transporter_id = ?", transporterID)

	if err := query.Model(&model.Order{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	err := query.Preload("OrderItems").
		Order("created_at DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&orders).Error

	return orders, total, err
}

func (r *orderRepository) Update(ctx context.Context, order *model.Order) error {
	return r.db.WithContext(ctx).Save(order).Error
}

func (r *orderRepository) UpdateStatus(ctx context.Context, orderID uuid.UUID, status model.OrderStatus) error {
	return r.db.WithContext(ctx).Model(&model.Order{}).
		Where("id = ?", orderID).
		Updates(map[string]interface{}{
			"status":     status,
			"updated_at": time.Now(),
		}).Error
}

func (r *orderRepository) UpdatePaymentStatus(ctx context.Context, orderID uuid.UUID, paymentStatus model.PaymentStatus, paymentID string) error {
	updates := map[string]interface{}{
		"payment_status": paymentStatus,
		"updated_at":     time.Now(),
	}

	if paymentStatus == model.PaymentStatusPaid {
		now := time.Now()
		updates["paid_at"] = &now
	}

	if paymentID != "" {
		updates["payment_id"] = paymentID
	}

	return r.db.WithContext(ctx).Model(&model.Order{}).
		Where("id = ?", orderID).
		Updates(updates).Error
}

func (r *orderRepository) AddTrackingEvent(ctx context.Context, tracking *model.OrderTracking) error {
	return r.db.WithContext(ctx).Create(tracking).Error
}

func (r *orderRepository) GetTrackingHistory(ctx context.Context, orderID uuid.UUID) ([]*model.OrderTracking, error) {
	var tracking []*model.OrderTracking
	err := r.db.WithContext(ctx).
		Where("order_id = ?", orderID).
		Order("created_at ASC").
		Find(&tracking).Error
	return tracking, err
}

func (r *orderRepository) GetOrderSummary(ctx context.Context, userID uuid.UUID, userType string) (*model.OrderSummary, error) {
	var summary model.OrderSummary
	query := r.db.WithContext(ctx).Model(&model.Order{})

	switch userType {
	case "buyer":
		query = query.Where("buyer_id = ?", userID)
	case "farmer":
		query = query.Where("farmer_id = ?", userID)
	case "transporter":
		query = query.Where("transporter_id = ?", userID)
	}

	err := query.Select(
		"COUNT(*) as total_orders",
		"COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders",
		"COUNT(CASE WHEN status = 'delivered' THEN 1 END) as completed_orders",
		"COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders",
		"COALESCE(SUM(total_amount), 0) as total_revenue",
	).Scan(&summary).Error

	if err != nil {
		return nil, err
	}

	if summary.TotalOrders > 0 {
		summary.AverageOrderValue = summary.TotalRevenue / float64(summary.TotalOrders)
	}

	return &summary, nil
}

func (r *orderRepository) FindOrdersWithFilters(ctx context.Context, filters OrderFilter) ([]*model.Order, int64, error) {
	var orders []*model.Order
	var total int64

	query := r.db.WithContext(ctx).Model(&model.Order{})

	if filters.Status != "" {
		query = query.Where("status = ?", filters.Status)
	}
	if filters.PaymentStatus != "" {
		query = query.Where("payment_status = ?", filters.PaymentStatus)
	}
	if filters.BuyerID != uuid.Nil {
		query = query.Where("buyer_id = ?", filters.BuyerID)
	}
	if filters.FarmerID != uuid.Nil {
		query = query.Where("farmer_id = ?", filters.FarmerID)
	}
	if !filters.StartDate.IsZero() {
		query = query.Where("created_at >= ?", filters.StartDate)
	}
	if !filters.EndDate.IsZero() {
		query = query.Where("created_at <= ?", filters.EndDate)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (filters.Page - 1) * filters.PageSize
	err := query.Preload("OrderItems").
		Order("created_at DESC").
		Offset(offset).
		Limit(filters.PageSize).
		Find(&orders).Error

	return orders, total, err
}
