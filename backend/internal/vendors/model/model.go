package model

import (
	"time"

	"github.com/google/uuid"
)

type VendorType string

const (
	VendorTypeSeedSupplier VendorType = "seed_supplier"
	VendorTypeFertilizer   VendorType = "fertilizer_supplier"
	VendorTypeEquipment    VendorType = "equipment_supplier"
	VendorTypePesticide    VendorType = "pesticide_supplier"
	VendorTypeIrrigation   VendorType = "irrigation_supplier"
)

type Vendor struct {
	ID     uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	UserID uuid.UUID `gorm:"uniqueIndex;not null" json:"user_id"`

	// Company Information
	CompanyName  string     `gorm:"not null" json:"company_name"`
	BrandName    string     `json:"brand_name"`
	Description  string     `json:"description"`
	VendorType   VendorType `gorm:"type:varchar(50)" json:"vendor_type"`
	BusinessType string     `json:"business_type"` // wholesale, retail, manufacturer

	// Location
	Address   string  `gorm:"not null" json:"address"`
	City      string  `gorm:"not null" json:"city"`
	State     string  `gorm:"not null" json:"state"`
	Country   string  `gorm:"not null" json:"country"`
	ZipCode   string  `json:"zip_code"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`

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

	// Status
	IsVerified  bool    `gorm:"default:false" json:"is_verified"`
	IsPremium   bool    `gorm:"default:false" json:"is_premium"`
	Rating      float64 `gorm:"default:0" json:"rating"`
	ReviewCount int     `gorm:"default:0" json:"review_count"`

	// Financial
	CreditLimit    float64 `gorm:"default:0" json:"credit_limit"`
	CurrentBalance float64 `gorm:"default:0" json:"current_balance"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type VendorProduct struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	VendorID    uuid.UUID `gorm:"not null" json:"vendor_id"`
	Name        string    `gorm:"not null" json:"name"`
	Category    string    `gorm:"not null" json:"category"`
	Description string    `json:"description"`
	Brand       string    `json:"brand"`
	Price       float64   `gorm:"not null" json:"price"`
	Unit        string    `gorm:"not null" json:"unit"` // kg, liter, piece, etc.
	Stock       int       `gorm:"default:0" json:"stock"`
	MinOrder    int       `gorm:"default:1" json:"min_order"`
	Images      []string  `gorm:"type:text[]" json:"images"`
	IsActive    bool      `gorm:"default:true" json:"is_active"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
