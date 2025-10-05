package dto

import (
	model "agro_konnect/internal/product/model"
	"time"

	"github.com/google/uuid"
)

// Request DTOs
type CreateProductRequest struct {
	Name        string                `json:"name" validate:"required"`
	Category    model.ProductCategory `json:"category" validate:"required,oneof=fruits vegetables grains dairy poultry livestock spices herbs"`
	Subcategory string                `json:"subcategory"`
	Description string                `json:"description"`
	Images      []string              `json:"images"`

	PricePerUnit   float64 `json:"price_per_unit" validate:"min=0"`
	Unit           string  `json:"unit" validate:"required"`
	AvailableStock float64 `json:"available_stock" validate:"min=0"`
	MinOrder       float64 `json:"min_order" validate:"min=0"`
	MaxOrder       float64 `json:"max_order" validate:"min=0"`

	QualityGrade         model.QualityGrade `json:"quality_grade" validate:"oneof=premium standard economy"`
	Organic              bool               `json:"organic"`
	Certified            bool               `json:"certified"`
	CertificationDetails string             `json:"certification_details"`

	HarvestDate string `json:"harvest_date"`
	ShelfLife   int    `json:"shelf_life" validate:"min=1"`
	StorageTips string `json:"storage_tips"`

	WeightRange string `json:"weight_range"`
	Color       string `json:"color"`
	Size        string `json:"size"`
	Variety     string `json:"variety"`

	FarmLocation string  `json:"farm_location"`
	Latitude     float64 `json:"latitude"`
	Longitude    float64 `json:"longitude"`
}

type UpdateProductRequest struct {
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Images      []string `json:"images"`

	PricePerUnit   float64 `json:"price_per_unit" validate:"min=0"`
	AvailableStock float64 `json:"available_stock" validate:"min=0"`
	MinOrder       float64 `json:"min_order" validate:"min=0"`
	MaxOrder       float64 `json:"max_order" validate:"min=0"`

	StorageTips string              `json:"storage_tips"`
	Status      model.ProductStatus `json:"status" validate:"oneof=draft active inactive sold_out expired"`
}

type ProductFilterRequest struct {
	Category     model.ProductCategory `query:"category"`
	FarmerID     uuid.UUID             `query:"farmer_id"`
	MinPrice     float64               `query:"min_price" validate:"min=0"`
	MaxPrice     float64               `query:"max_price" validate:"min=0"`
	Organic      bool                  `query:"organic"`
	Certified    bool                  `query:"certified"`
	QualityGrade model.QualityGrade    `query:"quality_grade"`
	City         string                `query:"city"`
	State        string                `query:"state"`
	MinRating    float64               `query:"min_rating" validate:"min=0,max=5"`
	Page         int                   `query:"page" validate:"min=1"`
	PageSize     int                   `query:"page_size" validate:"min=1,max=100"`
}

type AddReviewRequest struct {
	Rating        int      `json:"rating" validate:"required,min=1,max=5"`
	Title         string   `json:"title"`
	Comment       string   `json:"comment"`
	Images        []string `json:"images"`
	QualityRating int      `json:"quality_rating" validate:"min=1,max=5"`
	ValueRating   int      `json:"value_rating" validate:"min=1,max=5"`
}

// Response DTOs
type ProductResponse struct {
	ID         uuid.UUID `json:"id"`
	FarmerID   uuid.UUID `json:"farmer_id"`
	FarmerName string    `json:"farmer_name"`
	FarmName   string    `json:"farm_name"`

	Name        string                `json:"name"`
	Category    model.ProductCategory `json:"category"`
	Subcategory string                `json:"subcategory"`
	Description string                `json:"description"`
	Images      []string              `json:"images"`

	PricePerUnit   float64 `json:"price_per_unit"`
	Unit           string  `json:"unit"`
	AvailableStock float64 `json:"available_stock"`
	MinOrder       float64 `json:"min_order"`
	MaxOrder       float64 `json:"max_order"`

	QualityGrade         model.QualityGrade `json:"quality_grade"`
	Organic              bool               `json:"organic"`
	Certified            bool               `json:"certified"`
	CertificationDetails string             `json:"certification_details"`

	HarvestDate time.Time `json:"harvest_date"`
	ShelfLife   int       `json:"shelf_life"`
	StorageTips string    `json:"storage_tips"`

	Status      model.ProductStatus `json:"status"`
	IsFeatured  bool                `json:"is_featured"`
	Rating      float64             `json:"rating"`
	ReviewCount int                 `json:"review_count"`

	FarmLocation string  `json:"farm_location"`
	Distance     float64 `json:"distance,omitempty"` // from search location

	CreatedAt time.Time `json:"created_at"`
}

type ProductReviewResponse struct {
	ID        uuid.UUID `json:"id"`
	ProductID uuid.UUID `json:"product_id"`
	BuyerID   uuid.UUID `json:"buyer_id"`
	BuyerName string    `json:"buyer_name"`
	OrderID   uuid.UUID `json:"order_id"`

	Rating  int      `json:"rating"`
	Title   string   `json:"title"`
	Comment string   `json:"comment"`
	Images  []string `json:"images"`

	QualityRating int `json:"quality_rating"`
	ValueRating   int `json:"value_rating"`

	IsVerified bool `json:"is_verified"`
	Helpful    int  `json:"helpful"`

	CreatedAt time.Time `json:"created_at"`
}

type UpdateStockRequest struct {
	Quantity float64 `json:"quantity" validate:"required,min=0"`
}

type UpdateStatusRequest struct {
	Status string `json:"status" validate:"required,oneof=draft active inactive sold_out expired"`
}

type ProductListResponse struct {
	Products []*ProductResponse `json:"products"`
	Total    int64              `json:"total"`
	Page     int                `json:"page"`
	Pages    int                `json:"pages"`
	HasMore  bool               `json:"has_more"`
}
