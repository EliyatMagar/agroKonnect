package dto

import (
	"time"

	vendorModel "agro_konnect/internal/vendors/model"

	"github.com/google/uuid"
)

// Request DTOs
type CreateVendorRequest struct {
	CompanyName  string                 `json:"company_name" validate:"required"`
	BrandName    string                 `json:"brand_name"`
	Description  string                 `json:"description"`
	VendorType   vendorModel.VendorType `json:"vendor_type" validate:"required,oneof=seed_supplier fertilizer_supplier equipment_supplier pesticide_supplier irrigation_supplier"`
	BusinessType string                 `json:"business_type" validate:"required"`

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
	ID           uuid.UUID              `json:"id"`
	UserID       uuid.UUID              `json:"user_id"`
	CompanyName  string                 `json:"company_name"`
	BrandName    string                 `json:"brand_name"`
	Description  string                 `json:"description"`
	VendorType   vendorModel.VendorType `json:"vendor_type"`
	BusinessType string                 `json:"business_type"`

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

// Request DTOs
type UpdateVendorRequest struct {
	CompanyName    string `json:"company_name" validate:"omitempty,min=2,max=200"`
	BrandName      string `json:"brand_name" validate:"omitempty,max=100"`
	Description    string `json:"description" validate:"omitempty,max=1000"`
	Address        string `json:"address" validate:"omitempty,min=5,max=255"`
	City           string `json:"city" validate:"omitempty,min=2,max=100"`
	State          string `json:"state" validate:"omitempty,min=2,max=100"`
	ZipCode        string `json:"zip_code" validate:"omitempty,min=3,max=20"`
	ContactPerson  string `json:"contact_person" validate:"omitempty,min=2,max=100"`
	Designation    string `json:"designation" validate:"omitempty,max=100"`
	AlternatePhone string `json:"alternate_phone" validate:"omitempty,e164"`
	Website        string `json:"website" validate:"omitempty,url"`
	TaxID          string `json:"tax_id" validate:"omitempty,max=50"`
	EmployeeCount  int    `json:"employee_count" validate:"omitempty,min=0,max=10000"`
}

type UpdateVendorProductRequest struct {
	Name        string   `json:"name" validate:"omitempty,min=2,max=200"`
	Category    string   `json:"category" validate:"omitempty,max=100"`
	Description string   `json:"description" validate:"omitempty,max=1000"`
	Brand       string   `json:"brand" validate:"omitempty,max=100"`
	Price       float64  `json:"price" validate:"omitempty,min=0"`
	Unit        string   `json:"unit" validate:"omitempty,max=20"`
	Stock       int      `json:"stock" validate:"omitempty,min=0"`
	MinOrder    int      `json:"min_order" validate:"omitempty,min=1"`
	Images      []string `json:"images"`
}

type VendorFilterRequest struct {
	VendorType   vendorModel.VendorType `query:"vendor_type"`
	BusinessType string                 `query:"business_type"`
	City         string                 `query:"city"`
	State        string                 `query:"state"`
	Country      string                 `query:"country"`
	MinRating    float64                `query:"min_rating" validate:"min=0,max=5"`
	MaxRating    float64                `query:"max_rating" validate:"min=0,max=5"`
	IsVerified   *bool                  `query:"is_verified"`
	IsPremium    *bool                  `query:"is_premium"`
	Search       string                 `query:"search"`
	SortBy       string                 `query:"sort_by" validate:"omitempty,oneof=rating created_at company_name"`
	SortOrder    string                 `query:"sort_order" validate:"omitempty,oneof=asc desc"`
	Page         int                    `query:"page" validate:"min=1"`
	PageSize     int                    `query:"page_size" validate:"min=1,max=100"`
}

// Response DTOs
type VendorStatsResponse struct {
	TotalProducts    int     `json:"total_products"`
	ActiveProducts   int     `json:"active_products"`
	TotalOrders      int     `json:"total_orders"`
	CompletedOrders  int     `json:"completed_orders"`
	PendingOrders    int     `json:"pending_orders"`
	TotalRevenue     float64 `json:"total_revenue"`
	AverageRating    float64 `json:"average_rating"`
	CustomerCount    int     `json:"customer_count"`
	ThisMonthRevenue float64 `json:"this_month_revenue"`
}

type VendorListResponse struct {
	Vendors []*VendorResponse `json:"vendors"`
	Total   int64             `json:"total"`
	Page    int               `json:"page"`
	Pages   int               `json:"pages"`
	HasMore bool              `json:"has_more"`
}

// Helper methods for request validation
func (r *VendorFilterRequest) Sanitize() {
	if r.Page == 0 {
		r.Page = 1
	}
	if r.PageSize == 0 {
		r.PageSize = 10
	}
	if r.SortBy == "" {
		r.SortBy = "created_at"
	}
	if r.SortOrder == "" {
		r.SortOrder = "desc"
	}
}
