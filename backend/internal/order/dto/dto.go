package order

import (
	model "agro_konnect/internal/order/model"
	"time"

	"github.com/google/uuid"
)

// Request DTOs
type CreateOrderRequest struct {
	ShippingAddress string              `json:"shipping_address" validate:"required"`
	ShippingCity    string              `json:"shipping_city" validate:"required"`
	ShippingState   string              `json:"shipping_state" validate:"required"`
	ShippingZipCode string              `json:"shipping_zip_code"`
	ShippingNotes   string              `json:"shipping_notes"`
	PaymentMethod   model.PaymentMethod `json:"payment_method" validate:"required,oneof=bank_transfer credit_card digital_wallet upi cash_on_delivery"`
	Items           []OrderItemRequest  `json:"items" validate:"required,min=1"`
}

type OrderItemRequest struct {
	ProductID uuid.UUID `json:"product_id" validate:"required"`
	Quantity  float64   `json:"quantity" validate:"min=0.1"`
}

type UpdateOrderStatusRequest struct {
	Status model.OrderStatus `json:"status" validate:"required,oneof=pending confirmed processing shipped in_transit delivered cancelled"`
	Notes  string            `json:"notes"`
}

type AssignTransporterRequest struct {
	TransporterID     uuid.UUID `json:"transporter_id" validate:"required"`
	VehicleID         uuid.UUID `json:"vehicle_id"`
	EstimatedDelivery string    `json:"estimated_delivery" validate:"required"`
}

type PaymentRequest struct {
	OrderID        uuid.UUID           `json:"order_id" validate:"required"`
	PaymentMethod  model.PaymentMethod `json:"payment_method" validate:"required"`
	PaymentDetails interface{}         `json:"payment_details"` // Could be card details, UPI, etc.
}

// Response DTOs
type OrderResponse struct {
	ID          uuid.UUID `json:"id"`
	OrderNumber string    `json:"order_number"`

	BuyerID         uuid.UUID `json:"buyer_id"`
	BuyerName       string    `json:"buyer_name"`
	FarmerID        uuid.UUID `json:"farmer_id"`
	FarmerName      string    `json:"farmer_name"`
	TransporterID   uuid.UUID `json:"transporter_id,omitempty"`
	TransporterName string    `json:"transporter_name,omitempty"`
	VendorName      string    `json:"vendor_name"`
	VendorID        uuid.UUID `json:"vendor_id,omitempty"`

	TotalAmount    float64 `json:"total_amount"`
	SubTotal       float64 `json:"sub_total"`
	TaxAmount      float64 `json:"tax_amount"`
	ShippingCost   float64 `json:"shipping_cost"`
	DiscountAmount float64 `json:"discount_amount"`

	Status        model.OrderStatus   `json:"status"`
	PaymentStatus model.PaymentStatus `json:"payment_status"`
	PaymentMethod model.PaymentMethod `json:"payment_method"`

	ShippingAddress string `json:"shipping_address"`
	ShippingCity    string `json:"shipping_city"`
	ShippingState   string `json:"shipping_state"`
	ShippingZipCode string `json:"shipping_zip_code"`

	EstimatedDelivery time.Time  `json:"estimated_delivery"`
	ActualDelivery    *time.Time `json:"actual_delivery,omitempty"`

	TrackingNumber string `json:"tracking_number,omitempty"`
	TrackingURL    string `json:"tracking_url,omitempty"`

	OrderItems      []OrderItemResponse `json:"order_items"`
	TrackingHistory []TrackingResponse  `json:"tracking_history,omitempty"`

	CreatedAt time.Time `json:"created_at"`
}

type OrderItemResponse struct {
	ID           uuid.UUID `json:"id"`
	ProductID    uuid.UUID `json:"product_id"`
	ProductName  string    `json:"product_name"`
	ProductImage string    `json:"product_image"`
	UnitPrice    float64   `json:"unit_price"`
	Quantity     float64   `json:"quantity"`
	Unit         string    `json:"unit"`
	TotalPrice   float64   `json:"total_price"`
	QualityGrade string    `json:"quality_grade"`
	Organic      bool      `json:"organic"`
}

type TrackingResponse struct {
	Status      model.OrderStatus `json:"status"`
	Location    string            `json:"location"`
	Description string            `json:"description"`
	Notes       string            `json:"notes"`
	Timestamp   time.Time         `json:"timestamp"`
}

type OrderSummaryResponse struct {
	TotalOrders       int     `json:"total_orders"`
	PendingOrders     int     `json:"pending_orders"`
	CompletedOrders   int     `json:"completed_orders"`
	CancelledOrders   int     `json:"cancelled_orders"`
	TotalRevenue      float64 `json:"total_revenue"`
	AverageOrderValue float64 `json:"average_order_value"`
}

type OrderListResponse struct {
	Orders  []*OrderResponse `json:"orders"`
	Total   int64            `json:"total"`
	Page    int              `json:"page"`
	Pages   int              `json:"pages"`
	HasMore bool             `json:"has_more"`
}
