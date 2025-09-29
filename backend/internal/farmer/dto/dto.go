package dto

import (
	model "agro_konnect/internal/farmer/model"
	"strings"
	"time"

	"github.com/google/uuid"
)

// Request DTOs
type CreateFarmerRequest struct {
	FullName        string `json:"full_name" validate:"required,min=2,max=100"`
	ProfilePicture  string `json:"profile_picture" validate:"omitempty,url"`
	DateOfBirth     string `json:"date_of_birth" validate:"required,datetime=2006-01-02"`
	ExperienceYears int    `json:"experience_years" validate:"min=0,max=80"`

	FarmName        string                `json:"farm_name" validate:"required,min=2,max=200"`
	FarmDescription string                `json:"farm_description" validate:"max=1000"`
	FarmType        model.FarmType        `json:"farm_type" validate:"required,oneof=organic conventional hydroponic aquaponic"`
	Certifications  []model.Certification `json:"certifications" validate:"dive,oneof=usda_organic eu_organic global_gap fair_trade"`

	Address   string  `json:"address" validate:"required,min=5,max=255"`
	City      string  `json:"city" validate:"required,min=2,max=100"`
	State     string  `json:"state" validate:"required,min=2,max=100"`
	Country   string  `json:"country" validate:"required,min=2,max=100"`
	ZipCode   string  `json:"zip_code" validate:"min=3,max=20"`
	Latitude  float64 `json:"latitude" validate:"latitude"`
	Longitude float64 `json:"longitude" validate:"longitude"`

	AlternatePhone string `json:"alternate_phone" validate:"omitempty,e164"`
	Website        string `json:"website" validate:"omitempty,url"`

	TotalLandArea float64 `json:"total_land_area" validate:"min=0,max=100000"`
	EmployeeCount int     `json:"employee_count" validate:"min=0,max=10000"`
}

type UpdateFarmerRequest struct {
	FullName        string                `json:"full_name" validate:"omitempty,min=2,max=100"`
	ProfilePicture  string                `json:"profile_picture" validate:"omitempty,url"`
	FarmDescription string                `json:"farm_description" validate:"omitempty,max=1000"`
	Certifications  []model.Certification `json:"certifications" validate:"omitempty,dive,oneof=usda_organic eu_organic global_gap fair_trade"`
	Address         string                `json:"address" validate:"omitempty,min=5,max=255"`
	City            string                `json:"city" validate:"omitempty,min=2,max=100"`
	State           string                `json:"state" validate:"omitempty,min=2,max=100"`
	ZipCode         string                `json:"zip_code" validate:"omitempty,min=3,max=20"`
	AlternatePhone  string                `json:"alternate_phone" validate:"omitempty,e164"`
	Website         string                `json:"website" validate:"omitempty,url"`
	TotalLandArea   float64               `json:"total_land_area" validate:"omitempty,min=0,max=100000"`
	EmployeeCount   int                   `json:"employee_count" validate:"omitempty,min=0,max=10000"`
}

type FarmerFilterRequest struct {
	FarmType      model.FarmType      `query:"farm_type"`
	Certification model.Certification `query:"certification"`
	City          string              `query:"city"`
	State         string              `query:"state"`
	Country       string              `query:"country"`
	MinRating     float64             `query:"min_rating" validate:"min=0,max=5"`
	MaxRating     float64             `query:"max_rating" validate:"min=0,max=5"`
	MinExperience int                 `query:"min_experience" validate:"min=0"`
	IsVerified    *bool               `query:"is_verified"`
	IsPremium     *bool               `query:"is_premium"`
	Search        string              `query:"search"`
	SortBy        string              `query:"sort_by" validate:"omitempty,oneof=rating experience_years created_at farm_name"`
	SortOrder     string              `query:"sort_order" validate:"omitempty,oneof=asc desc"`
	Page          int                 `query:"page" validate:"min=1"`
	PageSize      int                 `query:"page_size" validate:"min=1,max=100"`
}

// Response DTOs
type FarmerResponse struct {
	ID              uuid.UUID `json:"id"`
	UserID          uuid.UUID `json:"user_id"`
	FullName        string    `json:"full_name"`
	ProfilePicture  string    `json:"profile_picture"`
	ExperienceYears int       `json:"experience_years"`

	FarmName        string                `json:"farm_name"`
	FarmDescription string                `json:"farm_description"`
	FarmType        model.FarmType        `json:"farm_type"`
	Certifications  []model.Certification `json:"certifications"`

	Address   string  `json:"address"`
	City      string  `json:"city"`
	State     string  `json:"state"`
	Country   string  `json:"country"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`

	IsVerified  bool    `json:"is_verified"`
	IsPremium   bool    `json:"is_premium"`
	Rating      float64 `json:"rating"`
	ReviewCount int     `json:"review_count"`

	ProductCount   int `json:"product_count"`
	ActiveListings int `json:"active_listings"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type FarmerStatsResponse struct {
	TotalProducts    int     `json:"total_products"`
	ActiveListings   int     `json:"active_listings"`
	TotalOrders      int     `json:"total_orders"`
	CompletedOrders  int     `json:"completed_orders"`
	PendingOrders    int     `json:"pending_orders"`
	TotalRevenue     float64 `json:"total_revenue"`
	AverageRating    float64 `json:"average_rating"`
	CustomerCount    int     `json:"customer_count"`
	ThisMonthRevenue float64 `json:"this_month_revenue"`
}

type FarmerListResponse struct {
	Farmers []*FarmerResponse `json:"farmers"`
	Total   int64             `json:"total"`
	Page    int               `json:"page"`
	Pages   int               `json:"pages"`
	HasMore bool              `json:"has_more"`
}

// Helper methods for request validation
func (r *FarmerFilterRequest) Sanitize() {
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

func (r *CreateFarmerRequest) Sanitize() {
	// Trim whitespace from string fields
	r.FullName = sanitizeString(r.FullName)
	r.FarmName = sanitizeString(r.FarmName)
	r.FarmDescription = sanitizeString(r.FarmDescription)
	r.Address = sanitizeString(r.Address)
	r.City = sanitizeString(r.City)
	r.State = sanitizeString(r.State)
	r.Country = sanitizeString(r.Country)
	r.ZipCode = sanitizeString(r.ZipCode)
}

func (r *UpdateFarmerRequest) Sanitize() {
	r.FullName = sanitizeString(r.FullName)
	r.FarmDescription = sanitizeString(r.FarmDescription)
	r.Address = sanitizeString(r.Address)
	r.City = sanitizeString(r.City)
	r.State = sanitizeString(r.State)
	r.ZipCode = sanitizeString(r.ZipCode)
}

func sanitizeString(s string) string {
	// Basic whitespace trimming - extend as needed
	return strings.TrimSpace(s)
}
