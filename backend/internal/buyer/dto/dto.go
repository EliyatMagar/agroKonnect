package buyer

import (
	model "agro_konnect/internal/buyer/model"
	"time"

	"github.com/google/uuid"
)

// Request DTOs
type CreateBuyerRequest struct {
	BusinessName  string              `json:"business_name" validate:"required"`
	BusinessType  model.BuyerType     `json:"business_type" validate:"required,oneof=retailer wholesaler exporter processor restaurant supermarket"`
	BusinessScale model.BusinessScale `json:"business_scale" validate:"required,oneof=small medium large enterprise"`
	Description   string              `json:"description"`

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

	MonthlyVolume     float64  `json:"monthly_volume" validate:"min=0"`
	PreferredProducts []string `json:"preferred_products"`
	QualityStandards  []string `json:"quality_standards"`
}

type BuyerFilterRequest struct {
	BusinessType     model.BuyerType     `query:"business_type"`
	BusinessScale    model.BusinessScale `query:"business_scale"`
	City             string              `query:"city"`
	State            string              `query:"state"`
	MinMonthlyVolume float64             `query:"min_monthly_volume"`
	PreferredProduct string              `query:"preferred_product"`
	Page             int                 `query:"page" validate:"min=1"`
	PageSize         int                 `query:"page_size" validate:"min=1,max=100"`
}

// Response DTOs
type BuyerResponse struct {
	ID            uuid.UUID           `json:"id"`
	UserID        uuid.UUID           `json:"user_id"`
	BusinessName  string              `json:"business_name"`
	BusinessType  model.BuyerType     `json:"business_type"`
	BusinessScale model.BusinessScale `json:"business_scale"`
	Description   string              `json:"description"`

	Address string `json:"address"`
	City    string `json:"city"`
	State   string `json:"state"`
	Country string `json:"country"`

	ContactPerson string `json:"contact_person"`
	Website       string `json:"website"`

	IsVerified bool    `json:"is_verified"`
	IsPremium  bool    `json:"is_premium"`
	Rating     float64 `json:"rating"`

	MonthlyVolume     float64  `json:"monthly_volume"`
	PreferredProducts []string `json:"preferred_products"`

	YearEstablished int `json:"year_established"`
	EmployeeCount   int `json:"employee_count"`

	CreatedAt time.Time `json:"created_at"`
}

type BuyerStatsResponse struct {
	TotalOrders     int     `json:"total_orders"`
	CompletedOrders int     `json:"completed_orders"`
	TotalSpent      float64 `json:"total_spent"`
	FavoriteFarmers int     `json:"favorite_farmers"`
	AverageRating   float64 `json:"average_rating"`
}
