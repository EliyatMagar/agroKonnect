package vendor

import (
	"time"

	"github.com/google/uuid"
)

// Request DTOs
type CreateVendorRequest struct {
	CompanyName  string     `json:"company_name" validate:"required"`
	BrandName    string     `json:"brand_name"`
	Description  string     `json:"description"`
	VendorType   VendorType `json:"vendor_type" validate:"required,oneof=seed_supplier fertilizer_supplier equipment_supplier pesticide_supplier irrigation_supplier"`
	BusinessType string     `json:"business_type" validate:"required"`

	Address string `json:"address" validate:"required"`
	City    string `json:"city" validate:"required"`
	State   string `json:"state" validate:"required"`
	Country string `json:"country" validate:"required"`
	ZipCode string `json:"zip_code"`

	ContactPerson  string `json:"contact_person" validate:"required"`
	Designation    string `json:"designation"`
	AlternatePhone string `json:"alternate_phone"`
	Website        string `json:"website"`

	BusinessLicense string `json:"business_license" validate:"required"`
	TaxID           string `json:"tax_id"`
	YearEstablished int    `json:"year_established" validate:"min=1900"`
	EmployeeCount   int    `json:"employee_count" validate:"min=0"`
}

type AddVendorProductRequest struct {
	Name        string   `json:"name" validate:"required"`
	Category    string   `json:"category" validate:"required"`
	Description string   `json:"description"`
	Brand       string   `json:"brand"`
	Price       float64  `json:"price" validate:"min=0"`
	Unit        string   `json:"unit" validate:"required"`
	Stock       int      `json:"stock" validate:"min=0"`
	MinOrder    int      `json:"min_order" validate:"min=1"`
	Images      []string `json:"images"`
}

// Response DTOs
type VendorResponse struct {
	ID           uuid.UUID  `json:"id"`
	UserID       uuid.UUID  `json:"user_id"`
	CompanyName  string     `json:"company_name"`
	BrandName    string     `json:"brand_name"`
	Description  string     `json:"description"`
	VendorType   VendorType `json:"vendor_type"`
	BusinessType string     `json:"business_type"`

	Address string `json:"address"`
	City    string `json:"city"`
	State   string `json:"state"`
	Country string `json:"country"`

	ContactPerson string `json:"contact_person"`
	Website       string `json:"website"`

	IsVerified  bool    `json:"is_verified"`
	IsPremium   bool    `json:"is_premium"`
	Rating      float64 `json:"rating"`
	ReviewCount int     `json:"review_count"`

	ProductCount    int `json:"product_count"`
	YearEstablished int `json:"year_established"`

	CreatedAt time.Time `json:"created_at"`
}

type VendorProductResponse struct {
	ID          uuid.UUID `json:"id"`
	VendorID    uuid.UUID `json:"vendor_id"`
	Name        string    `json:"name"`
	Category    string    `json:"category"`
	Description string    `json:"description"`
	Brand       string    `json:"brand"`
	Price       float64   `json:"price"`
	Unit        string    `json:"unit"`
	Stock       int       `json:"stock"`
	MinOrder    int       `json:"min_order"`
	Images      []string  `json:"images"`
	IsActive    bool      `json:"is_active"`
	CreatedAt   time.Time `json:"created_at"`
}
