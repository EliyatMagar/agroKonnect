package transporter

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
)

type VehicleType string

const (
	VehicleTypeTruck        VehicleType = "truck"
	VehicleTypeRefrigerated VehicleType = "refrigerated_truck"
	VehicleTypePickup       VehicleType = "pickup"
	VehicleTypeVan          VehicleType = "van"
	VehicleTypeTractor      VehicleType = "tractor"
)

type TransportCapacity struct {
	Weight float64 `gorm:"type:decimal(10,2)" json:"weight"` // in tons
	Volume float64 `gorm:"type:decimal(10,2)" json:"volume"` // in cubic meters
}

type Transporter struct {
	ID     uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	UserID uuid.UUID `gorm:"uniqueIndex;not null" json:"user_id"`

	// Company Information
	CompanyName   string `gorm:"not null" json:"company_name"`
	ContactPerson string `gorm:"not null" json:"contact_person"`
	Description   string `json:"description"`

	// Location & Coverage
	Address      string         `gorm:"not null" json:"address"`
	City         string         `gorm:"not null" json:"city"`
	State        string         `gorm:"not null" json:"state"`
	Country      string         `gorm:"not null" json:"country"`
	ServiceAreas datatypes.JSON `gorm:"type:jsonb" json:"service_areas"` // Store as JSON array

	// Contact Information
	AlternatePhone string `json:"alternate_phone"`
	Website        string `json:"website"`

	// Business Details
	LicenseNumber   string `gorm:"not null" json:"license_number"`
	InsuranceNumber string `gorm:"not null" json:"insurance_number"`
	YearEstablished int    `json:"year_established"`

	// Status
	IsVerified  bool    `gorm:"default:false" json:"is_verified"`
	IsPremium   bool    `gorm:"default:false" json:"is_premium"`
	Rating      float64 `gorm:"default:0" json:"rating"`
	ReviewCount int     `gorm:"default:0" json:"review_count"`

	// Fleet Information
	FleetSize    int               `gorm:"default:0" json:"fleet_size"`
	VehicleTypes datatypes.JSON    `gorm:"type:jsonb" json:"vehicle_types"` // Store as JSON array
	MaxCapacity  TransportCapacity `gorm:"embedded" json:"max_capacity"`

	// Specializations
	Specializations datatypes.JSON `gorm:"type:jsonb" json:"specializations"` // Store as JSON array

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Vehicle struct {
	ID            uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	TransporterID uuid.UUID `gorm:"not null" json:"transporter_id"`

	// Vehicle Details
	VehicleNumber string      `gorm:"uniqueIndex;not null" json:"vehicle_number"`
	VehicleType   VehicleType `gorm:"type:varchar(50)" json:"vehicle_type"`
	Make          string      `gorm:"not null" json:"make"`
	Model         string      `gorm:"not null" json:"model"`
	Year          int         `json:"year"`
	Color         string      `json:"color"`

	// Capacity
	Capacity TransportCapacity `gorm:"embedded" json:"capacity"`

	// Documents
	RCNumber        string    `gorm:"not null" json:"rc_number"`
	InsuranceNumber string    `json:"insurance_number"`
	InsuranceExpiry time.Time `json:"insurance_expiry"`
	FitnessExpiry   time.Time `json:"fitness_expiry"`

	// Status
	IsActive        bool   `gorm:"default:true" json:"is_active"`
	IsAvailable     bool   `gorm:"default:true" json:"is_available"`
	CurrentLocation string `json:"current_location"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
