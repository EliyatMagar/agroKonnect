package buyer

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
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
	ID     uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`
	UserID uuid.UUID `gorm:"type:uuid;not null;uniqueIndex" json:"user_id"`

	// Business Information
	BusinessName  string        `gorm:"type:varchar(255);not null" json:"business_name"`
	BusinessType  BuyerType     `gorm:"type:varchar(50);not null" json:"business_type"`
	BusinessScale BusinessScale `gorm:"type:varchar(20);not null" json:"business_scale"`
	Description   string        `gorm:"type:text" json:"description"`

	// Location
	Address string `gorm:"type:varchar(500);not null" json:"address"`
	City    string `gorm:"type:varchar(100);not null" json:"city"`
	State   string `gorm:"type:varchar(100);not null" json:"state"`
	Country string `gorm:"type:varchar(100);not null" json:"country"`
	ZipCode string `gorm:"type:varchar(20)" json:"zip_code"`

	// Contact Information
	ContactPerson  string `gorm:"type:varchar(255);not null" json:"contact_person"`
	Designation    string `gorm:"type:varchar(100)" json:"designation"`
	AlternatePhone string `gorm:"type:varchar(20)" json:"alternate_phone"`
	Website        string `gorm:"type:varchar(255)" json:"website"`

	// Business Details
	BusinessLicense string `gorm:"type:varchar(255);not null" json:"business_license"`
	TaxID           string `gorm:"type:varchar(100)" json:"tax_id"`
	YearEstablished int    `json:"year_established"`
	EmployeeCount   int    `json:"employee_count"`

	// Purchase Requirements - Use JSONB for arrays for better compatibility
	MonthlyVolume     float64        `gorm:"type:decimal(10,2)" json:"monthly_volume"`
	PreferredProducts datatypes.JSON `gorm:"type:jsonb" json:"preferred_products"`
	QualityStandards  datatypes.JSON `gorm:"type:jsonb" json:"quality_standards"`

	// Status
	IsVerified bool    `gorm:"default:false" json:"is_verified"`
	IsPremium  bool    `gorm:"default:false" json:"is_premium"`
	Rating     float64 `gorm:"type:decimal(3,2);default:0" json:"rating"`

	// Financial
	CreditLimit    float64 `gorm:"type:decimal(10,2);default:0" json:"credit_limit"`
	CurrentBalance float64 `gorm:"type:decimal(10,2);default:0" json:"current_balance"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Helper methods to handle JSON arrays
func (b *Buyer) SetPreferredProducts(products []string) error {
	jsonData, err := json.Marshal(products)
	if err != nil {
		return err
	}
	b.PreferredProducts = datatypes.JSON(jsonData)
	return nil
}

func (b *Buyer) GetPreferredProducts() ([]string, error) {
	var products []string
	if len(b.PreferredProducts) == 0 {
		return products, nil
	}
	err := json.Unmarshal(b.PreferredProducts, &products)
	return products, err
}

func (b *Buyer) SetQualityStandards(standards []string) error {
	jsonData, err := json.Marshal(standards)
	if err != nil {
		return err
	}
	b.QualityStandards = datatypes.JSON(jsonData)
	return nil
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
