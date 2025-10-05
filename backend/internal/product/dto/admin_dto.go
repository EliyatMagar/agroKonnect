package dto

import (
	model "agro_konnect/internal/product/model"
	"time"

	"github.com/google/uuid"
)

// Admin Request DTOs
type AdminProductFilterRequest struct {
	Page     int    `query:"page" validate:"min=1"`
	PageSize int    `query:"page_size" validate:"min=1,max=100"`
	Search   string `query:"search"`
	Status   string `query:"status"`
	Category string `query:"category"`
}

type UpdateProductStatusRequest struct {
	Status string `json:"status" validate:"required,oneof=draft active inactive sold_out expired"`
}

type BulkUpdateStatusRequest struct {
	ProductIDs []uuid.UUID         `json:"product_ids" validate:"required,min=1"`
	Status     model.ProductStatus `json:"status" validate:"required,oneof=draft active inactive sold_out expired"`
}

type BulkDeleteRequest struct {
	ProductIDs []uuid.UUID `json:"product_ids" validate:"required,min=1"`
}

type UpdateFeaturedRequest struct {
	IsFeatured bool `json:"is_featured" validate:"required"`
}

// Admin Response DTOs
type AdminProductResponse struct {
	ID                   uuid.UUID             `json:"id"`
	FarmerID             uuid.UUID             `json:"farmer_id"`
	FarmerName           string                `json:"farmer_name"`
	FarmName             string                `json:"farm_name"`
	Name                 string                `json:"name"`
	Category             model.ProductCategory `json:"category"`
	Subcategory          string                `json:"subcategory"`
	Description          string                `json:"description"`
	Images               []string              `json:"images"`
	PricePerUnit         float64               `json:"price_per_unit"`
	Unit                 string                `json:"unit"`
	AvailableStock       float64               `json:"available_stock"`
	MinOrder             float64               `json:"min_order"`
	MaxOrder             float64               `json:"max_order"`
	QualityGrade         model.QualityGrade    `json:"quality_grade"`
	Organic              bool                  `json:"organic"`
	Certified            bool                  `json:"certified"`
	CertificationDetails string                `json:"certification_details"`
	HarvestDate          time.Time             `json:"harvest_date"`
	ShelfLife            int                   `json:"shelf_life"`
	StorageTips          string                `json:"storage_tips"`
	Status               model.ProductStatus   `json:"status"`
	IsFeatured           bool                  `json:"is_featured"`
	Rating               float64               `json:"rating"`
	ReviewCount          int                   `json:"review_count"`
	FarmLocation         string                `json:"farm_location"`
	Latitude             float64               `json:"latitude"`
	Longitude            float64               `json:"longitude"`
	CreatedAt            time.Time             `json:"created_at"`
	UpdatedAt            time.Time             `json:"updated_at"`
	ExpiryDate           time.Time             `json:"expiry_date"`
	DaysUntilExpiry      int                   `json:"days_until_expiry"`
	IsLowStock           bool                  `json:"is_low_stock"`
}

type AdminProductListResponse struct {
	Products []*AdminProductResponse `json:"products"`
	Total    int64                   `json:"total"`
	Page     int                     `json:"page"`
	Pages    int                     `json:"pages"`
	HasMore  bool                    `json:"has_more"`
}

type ProductStatsResponse struct {
	TotalProducts     int64   `json:"total_products"`
	ActiveProducts    int64   `json:"active_products"`
	DraftProducts     int64   `json:"draft_products"`
	InactiveProducts  int64   `json:"inactive_products"`
	SoldOutProducts   int64   `json:"sold_out_products"`
	ExpiredProducts   int64   `json:"expired_products"`
	FeaturedProducts  int64   `json:"featured_products"`
	OrganicProducts   int64   `json:"organic_products"`
	CertifiedProducts int64   `json:"certified_products"`
	AverageRating     float64 `json:"average_rating"`
	TotalStock        float64 `json:"total_stock"`
}
