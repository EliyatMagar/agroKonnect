package buyer

import (
	"time"

	"github.com/google/uuid"
)

type BuyerType string

const (
	BuyerTypeRetailer    BuyerType = "retailer"
	BuyerTypeWholesaler  BuyerType = "wholesaler"
	BuyerTypeExporter    BuyerType = "exporter"
	BuyerTypeProcessor   BuyerType = "processor"
	BuyerTypeRestaurant  BuyerType = "restaurant"
	BuyerTypeSupermarket BuyerType = "supermarket"
)

type BusinessScale string

const (
	ScaleSmall      BusinessScale = "small"
	ScaleMedium     BusinessScale = "medium"
	ScaleLarge      BusinessScale = "large"
	ScaleEnterprise BusinessScale = "enterprise"
)

type Buyer struct {
	ID     uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	UserID uuid.UUID `gorm:"uniqueIndex;not null" json:"user_id"`

	// Business Information
	BusinessName  string        `gorm:"not null" json:"business_name"`
	BusinessType  BuyerType     `gorm:"type:varchar(50)" json:"business_type"`
	BusinessScale BusinessScale `gorm:"type:varchar(20)" json:"business_scale"`
	Description   string        `json:"description"`

	// Location
	Address string `gorm:"not null" json:"address"`
	City    string `gorm:"not null" json:"city"`
	State   string `gorm:"not null" json:"state"`
	Country string `gorm:"not null" json:"country"`
	ZipCode string `json:"zip_code"`

	// Contact Information
	ContactPerson  string `gorm:"not null" json:"contact_person"`
	Designation    string `json:"designation"`
	AlternatePhone string `json:"alternate_phone"`
	Website        string `json:"website"`

	// Business Details
	BusinessLicense string `gorm:"not null" json:"business_license"`
	TaxID           string `json:"tax_id"`
	YearEstablished int    `json:"year_established"`
	EmployeeCount   int    `json:"employee_count"`

	// Purchase Requirements
	MonthlyVolume     float64  `json:"monthly_volume"` // in kg/units
	PreferredProducts []string `gorm:"type:text[]" json:"preferred_products"`
	QualityStandards  []string `gorm:"type:text[]" json:"quality_standards"`

	// Status
	IsVerified bool    `gorm:"default:false" json:"is_verified"`
	IsPremium  bool    `gorm:"default:false" json:"is_premium"`
	Rating     float64 `gorm:"default:0" json:"rating"`

	// Financial
	CreditLimit    float64 `gorm:"default:0" json:"credit_limit"`
	CurrentBalance float64 `gorm:"default:0" json:"current_balance"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type PurchaseHistory struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	BuyerID   uuid.UUID `gorm:"not null" json:"buyer_id"`
	FarmerID  uuid.UUID `gorm:"not null" json:"farmer_id"`
	ProductID uuid.UUID `gorm:"not null" json:"product_id"`
	OrderID   uuid.UUID `gorm:"not null" json:"order_id"`

	ProductName    string    `gorm:"not null" json:"product_name"`
	Quantity       float64   `gorm:"not null" json:"quantity"`
	UnitPrice      float64   `gorm:"not null" json:"unit_price"`
	TotalAmount    float64   `gorm:"not null" json:"total_amount"`
	PurchaseDate   time.Time `gorm:"not null" json:"purchase_date"`
	QualityRating  int       `json:"quality_rating"`  // 1-5
	DeliveryRating int       `json:"delivery_rating"` // 1-5
}
