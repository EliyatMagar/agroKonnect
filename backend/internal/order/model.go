package order

import (
	"time"

	"github.com/google/uuid"
)

type OrderStatus string

const (
	OrderStatusPending    OrderStatus = "pending"
	OrderStatusConfirmed  OrderStatus = "confirmed"
	OrderStatusProcessing OrderStatus = "processing"
	OrderStatusShipped    OrderStatus = "shipped"
	OrderStatusInTransit  OrderStatus = "in_transit"
	OrderStatusDelivered  OrderStatus = "delivered"
	OrderStatusCancelled  OrderStatus = "cancelled"
	OrderStatusRefunded   OrderStatus = "refunded"
)

type PaymentStatus string

const (
	PaymentStatusPending  PaymentStatus = "pending"
	PaymentStatusPaid     PaymentStatus = "paid"
	PaymentStatusFailed   PaymentStatus = "failed"
	PaymentStatusRefunded PaymentStatus = "refunded"
)

type PaymentMethod string

const (
	PaymentMethodBankTransfer   PaymentMethod = "bank_transfer"
	PaymentMethodCreditCard     PaymentMethod = "credit_card"
	PaymentMethodDigitalWallet  PaymentMethod = "digital_wallet"
	PaymentMethodUPI            PaymentMethod = "upi"
	PaymentMethodCashOnDelivery PaymentMethod = "cash_on_delivery"
)

type Order struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	OrderNumber string    `gorm:"uniqueIndex;not null" json:"order_number"`

	// Parties involved
	BuyerID       uuid.UUID `gorm:"not null" json:"buyer_id"`
	FarmerID      uuid.UUID `gorm:"not null" json:"farmer_id"`
	TransporterID uuid.UUID `json:"transporter_id"`

	// Order Details
	TotalAmount    float64 `gorm:"type:decimal(10,2);not null" json:"total_amount"`
	SubTotal       float64 `gorm:"type:decimal(10,2);not null" json:"sub_total"`
	TaxAmount      float64 `gorm:"type:decimal(10,2);default:0" json:"tax_amount"`
	ShippingCost   float64 `gorm:"type:decimal(10,2);default:0" json:"shipping_cost"`
	DiscountAmount float64 `gorm:"type:decimal(10,2);default:0" json:"discount_amount"`

	// Status
	Status        OrderStatus   `gorm:"type:varchar(20);default:'pending'" json:"status"`
	PaymentStatus PaymentStatus `gorm:"type:varchar(20);default:'pending'" json:"payment_status"`

	// Payment Information
	PaymentMethod PaymentMethod `gorm:"type:varchar(30)" json:"payment_method"`
	PaymentID     string        `json:"payment_id"`
	PaidAt        *time.Time    `json:"paid_at"`

	// Shipping Information
	ShippingAddress string `gorm:"not null" json:"shipping_address"`
	ShippingCity    string `gorm:"not null" json:"shipping_city"`
	ShippingState   string `gorm:"not null" json:"shipping_state"`
	ShippingZipCode string `json:"shipping_zip_code"`
	ShippingNotes   string `json:"shipping_notes"`

	// Delivery Information
	EstimatedDelivery time.Time  `json:"estimated_delivery"`
	ActualDelivery    *time.Time `json:"actual_delivery"`

	// Tracking
	TrackingNumber string `json:"tracking_number"`
	TrackingURL    string `json:"tracking_url"`

	// Timestamps
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	CancelledAt *time.Time `json:"cancelled_at"`

	// Relationships
	OrderItems []OrderItem `gorm:"foreignKey:OrderID" json:"order_items"`
}

type OrderItem struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	OrderID   uuid.UUID `gorm:"not null" json:"order_id"`
	ProductID uuid.UUID `gorm:"not null" json:"product_id"`

	ProductName  string  `gorm:"not null" json:"product_name"`
	ProductImage string  `json:"product_image"`
	UnitPrice    float64 `gorm:"type:decimal(10,2);not null" json:"unit_price"`
	Quantity     float64 `gorm:"type:decimal(10,2);not null" json:"quantity"`
	Unit         string  `gorm:"not null" json:"unit"`
	TotalPrice   float64 `gorm:"type:decimal(10,2);not null" json:"total_price"`

	// Product details at time of order
	QualityGrade string    `json:"quality_grade"`
	Organic      bool      `json:"organic"`
	HarvestDate  time.Time `json:"harvest_date"`
}

type OrderTracking struct {
	ID          uuid.UUID   `gorm:"type:uuid;primary_key" json:"id"`
	OrderID     uuid.UUID   `gorm:"not null" json:"order_id"`
	Status      OrderStatus `gorm:"type:varchar(20);not null" json:"status"`
	Location    string      `json:"location"`
	Description string      `json:"description"`
	Notes       string      `json:"notes"`
	CreatedAt   time.Time   `json:"created_at"`
}
