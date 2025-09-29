package product

import (
	"time"

	"github.com/google/uuid"
)

type ProductCategory string

const (
	CategoryFruits     ProductCategory = "fruits"
	CategoryVegetables ProductCategory = "vegetables"
	CategoryGrains     ProductCategory = "grains"
	CategoryDairy      ProductCategory = "dairy"
	CategoryPoultry    ProductCategory = "poultry"
	CategoryLivestock  ProductCategory = "livestock"
	CategorySpices     ProductCategory = "spices"
	CategoryHerbs      ProductCategory = "herbs"
)

type ProductStatus string

const (
	StatusDraft    ProductStatus = "draft"
	StatusActive   ProductStatus = "active"
	StatusInactive ProductStatus = "inactive"
	StatusSoldOut  ProductStatus = "sold_out"
	StatusExpired  ProductStatus = "expired"
)

type QualityGrade string

const (
	GradePremium  QualityGrade = "premium"
	GradeStandard QualityGrade = "standard"
	GradeEconomy  QualityGrade = "economy"
)

type Product struct {
	ID       uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	FarmerID uuid.UUID `gorm:"not null" json:"farmer_id"`

	// Basic Information
	Name        string          `gorm:"not null" json:"name"`
	Category    ProductCategory `gorm:"type:varchar(50);not null" json:"category"`
	Subcategory string          `json:"subcategory"`
	Description string          `json:"description"`
	Images      []string        `gorm:"type:text[]" json:"images"`

	// Pricing & Quantity
	PricePerUnit   float64 `gorm:"type:decimal(10,2);not null" json:"price_per_unit"`
	Unit           string  `gorm:"not null" json:"unit"` // kg, piece, dozen, etc.
	AvailableStock float64 `gorm:"type:decimal(10,2);not null" json:"available_stock"`
	MinOrder       float64 `gorm:"type:decimal(10,2);default:1" json:"min_order"`
	MaxOrder       float64 `gorm:"type:decimal(10,2)" json:"max_order"`

	// Quality Information
	QualityGrade         QualityGrade `gorm:"type:varchar(20)" json:"quality_grade"`
	Organic              bool         `gorm:"default:false" json:"organic"`
	Certified            bool         `gorm:"default:false" json:"certified"`
	CertificationDetails string       `json:"certification_details"`

	// Harvest Information
	HarvestDate time.Time `json:"harvest_date"`
	ShelfLife   int       `json:"shelf_life"` // in days
	StorageTips string    `json:"storage_tips"`

	// Product Specifications
	WeightRange string `json:"weight_range"`
	Color       string `json:"color"`
	Size        string `json:"size"`
	Variety     string `json:"variety"`

	// Status
	Status      ProductStatus `gorm:"type:varchar(20);default:'draft'" json:"status"`
	IsFeatured  bool          `gorm:"default:false" json:"is_featured"`
	Rating      float64       `gorm:"default:0" json:"rating"`
	ReviewCount int           `gorm:"default:0" json:"review_count"`

	// Location
	FarmLocation string  `json:"farm_location"`
	Latitude     float64 `json:"latitude"`
	Longitude    float64 `json:"longitude"`

	// Timestamps
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
	ExpiryDate time.Time `json:"expiry_date"`
}

type ProductReview struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	ProductID uuid.UUID `gorm:"not null" json:"product_id"`
	BuyerID   uuid.UUID `gorm:"not null" json:"buyer_id"`
	OrderID   uuid.UUID `gorm:"not null" json:"order_id"`

	Rating  int      `gorm:"not null" json:"rating" validate:"min=1,max=5"`
	Title   string   `json:"title"`
	Comment string   `json:"comment"`
	Images  []string `gorm:"type:text[]" json:"images"`

	QualityRating int `json:"quality_rating"`
	ValueRating   int `json:"value_rating"`

	IsVerified bool `gorm:"default:false" json:"is_verified"` // from actual purchase
	Helpful    int  `gorm:"default:0" json:"helpful"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
