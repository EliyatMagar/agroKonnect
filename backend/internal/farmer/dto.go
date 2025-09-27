package farmer

import (
	"time"

	"github.com/google/uuid"
)

// Request DTOs
type CreateFarmerRequest struct {
	FullName        string `json:"full_name" validate:"required"`
	ProfilePicture  string `json:"profile_picture"`
	DateOfBirth     string `json:"date_of_birth" validate:"required"`
	ExperienceYears int    `json:"experience_years" validate:"min=0"`

	FarmName        string          `json:"farm_name" validate:"required"`
	FarmDescription string          `json:"farm_description"`
	FarmType        FarmType        `json:"farm_type" validate:"required,oneof=organic conventional hydroponic aquaponic"`
	Certifications  []Certification `json:"certifications"`

	Address   string  `json:"address" validate:"required"`
	City      string  `json:"city" validate:"required"`
	State     string  `json:"state" validate:"required"`
	Country   string  `json:"country" validate:"required"`
	ZipCode   string  `json:"zip_code"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`

	AlternatePhone string `json:"alternate_phone"`
	Website        string `json:"website"`

	TotalLandArea float64 `json:"total_land_area" validate:"min=0"`
	EmployeeCount int     `json:"employee_count" validate:"min=0"`
}

type UpdateFarmerRequest struct {
	FullName        string          `json:"full_name"`
	ProfilePicture  string          `json:"profile_picture"`
	FarmDescription string          `json:"farm_description"`
	Certifications  []Certification `json:"certifications"`
	Address         string          `json:"address"`
	City            string          `json:"city"`
	State           string          `json:"state"`
	ZipCode         string          `json:"zip_code"`
	AlternatePhone  string          `json:"alternate_phone"`
	Website         string          `json:"website"`
	TotalLandArea   float64         `json:"total_land_area" validate:"min=0"`
	EmployeeCount   int             `json:"employee_count" validate:"min=0"`
}

type FarmerFilterRequest struct {
	FarmType      FarmType      `query:"farm_type"`
	Certification Certification `query:"certification"`
	City          string        `query:"city"`
	State         string        `query:"state"`
	MinRating     float64       `query:"min_rating" validate:"min=0,max=5"`
	MinExperience int           `query:"min_experience" validate:"min=0"`
	Page          int           `query:"page" validate:"min=1"`
	PageSize      int           `query:"page_size" validate:"min=1,max=100"`
}

// Response DTOs
type FarmerResponse struct {
	ID              uuid.UUID `json:"id"`
	UserID          uuid.UUID `json:"user_id"`
	FullName        string    `json:"full_name"`
	ProfilePicture  string    `json:"profile_picture"`
	ExperienceYears int       `json:"experience_years"`

	FarmName        string          `json:"farm_name"`
	FarmDescription string          `json:"farm_description"`
	FarmType        FarmType        `json:"farm_type"`
	Certifications  []Certification `json:"certifications"`

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
}

type FarmerStatsResponse struct {
	TotalProducts   int     `json:"total_products"`
	ActiveListings  int     `json:"active_listings"`
	TotalOrders     int     `json:"total_orders"`
	CompletedOrders int     `json:"completed_orders"`
	TotalRevenue    float64 `json:"total_revenue"`
	AverageRating   float64 `json:"average_rating"`
	CustomerCount   int     `json:"customer_count"`
}
