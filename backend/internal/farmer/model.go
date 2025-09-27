package farmer

import (
	"agro_konnect/internal/product"
	"time"

	"github.com/google/uuid"
)

type FarmType string

const (
	FarmTypeOrganic      FarmType = "organic"
	FarmTypeConventional FarmType = "conventional"
	FarmTypeHydroponic   FarmType = "hydroponic"
	FarmTypeAquaponic    FarmType = "aquaponic"
)

type Certification string

const (
	CertificationUSDAOrganic Certification = "usda_organic"
	CertificationEUOrganic   Certification = "eu_organic"
	CertificationGlobalGAP   Certification = "global_gap"
	CertificationFairTrade   Certification = "fair_trade"
)

type Farmer struct {
	ID     uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	UserID uuid.UUID `gorm:"uniqueIndex;not null" json:"user_id"`

	// Personal Information
	FullName        string    `gorm:"not null" json:"full_name"`
	ProfilePicture  string    `json:"profile_picture"`
	DateOfBirth     time.Time `json:"date_of_birth"`
	ExperienceYears int       `json:"experience_years"`

	// Farm Information
	FarmName        string          `gorm:"not null" json:"farm_name"`
	FarmDescription string          `json:"farm_description"`
	FarmType        FarmType        `gorm:"type:varchar(50)" json:"farm_type"`
	Certifications  []Certification `gorm:"type:varchar(50)[]" json:"certifications"`

	// Location
	Address   string  `gorm:"not null" json:"address"`
	City      string  `gorm:"not null" json:"city"`
	State     string  `gorm:"not null" json:"state"`
	Country   string  `gorm:"not null" json:"country"`
	ZipCode   string  `json:"zip_code"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`

	// Contact Information
	AlternatePhone string `json:"alternate_phone"`
	Website        string `json:"website"`

	// Business Information
	TotalLandArea float64 `json:"total_land_area"` // in acres/hectares
	AnnualRevenue float64 `json:"annual_revenue"`
	EmployeeCount int     `json:"employee_count"`

	// Status
	IsVerified  bool    `gorm:"default:false" json:"is_verified"`
	IsPremium   bool    `gorm:"default:false" json:"is_premium"`
	Rating      float64 `gorm:"default:0" json:"rating"`
	ReviewCount int     `gorm:"default:0" json:"review_count"`

	// Relationships
	Products []product.Product `gorm:"foreignKey:FarmerID" json:"products,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type FarmerDocument struct {
	ID           uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	FarmerID     uuid.UUID `gorm:"not null" json:"farmer_id"`
	DocumentType string    `gorm:"not null" json:"document_type"` // license, certification, etc.
	DocumentURL  string    `gorm:"not null" json:"document_url"`
	Verified     bool      `gorm:"default:false" json:"verified"`
	UploadedAt   time.Time `json:"uploaded_at"`
}
