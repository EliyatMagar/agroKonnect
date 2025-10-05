package transporter

import (
	model "agro_konnect/internal/transporter/model"
	"time"

	"github.com/google/uuid"
)

// Request DTOs
type CreateTransporterRequest struct {
	CompanyName   string `json:"company_name" validate:"required"`
	ContactPerson string `json:"contact_person" validate:"required"`
	Description   string `json:"description"`

	Address      string   `json:"address" validate:"required"`
	City         string   `json:"city" validate:"required"`
	State        string   `json:"state" validate:"required"`
	Country      string   `json:"country" validate:"required"`
	ServiceAreas []string `json:"service_areas"`

	AlternatePhone string `json:"alternate_phone"`
	Website        string `json:"website"`

	LicenseNumber   string `json:"license_number" validate:"required"`
	InsuranceNumber string `json:"insurance_number" validate:"required"`
	YearEstablished int    `json:"year_established" validate:"min=1900"`

	FleetSize       int                     `json:"fleet_size" validate:"min=0"`
	VehicleTypes    []model.VehicleType     `json:"vehicle_types" validate:"required"`
	MaxCapacity     model.TransportCapacity `json:"max_capacity" validate:"required"`
	Specializations []string                `json:"specializations"`
}

type AddVehicleRequest struct {
	VehicleNumber string            `json:"vehicle_number" validate:"required"`
	VehicleType   model.VehicleType `json:"vehicle_type" validate:"required,oneof=truck refrigerated_truck pickup van tractor"`
	Make          string            `json:"make" validate:"required"`
	Model         string            `json:"model" validate:"required"`
	Year          int               `json:"year" validate:"min=1900"`
	Color         string            `json:"color"`

	Capacity model.TransportCapacity `json:"capacity" validate:"required"`

	RCNumber        string `json:"rc_number" validate:"required"`
	InsuranceNumber string `json:"insurance_number"`
	InsuranceExpiry string `json:"insurance_expiry"`
	FitnessExpiry   string `json:"fitness_expiry"`
}

// Response DTOs
type TransporterResponse struct {
	ID            uuid.UUID `json:"id"`
	UserID        uuid.UUID `json:"user_id"`
	CompanyName   string    `json:"company_name"`
	ContactPerson string    `json:"contact_person"`
	Description   string    `json:"description"`

	Address      string   `json:"address"`
	City         string   `json:"city"`
	State        string   `json:"state"`
	Country      string   `json:"country"`
	ServiceAreas []string `json:"service_areas"`

	IsVerified  bool    `json:"is_verified"`
	IsPremium   bool    `json:"is_premium"`
	Rating      float64 `json:"rating"`
	ReviewCount int     `json:"review_count"`

	FleetSize    int                     `json:"fleet_size"`
	VehicleTypes []model.VehicleType     `json:"vehicle_types"`
	MaxCapacity  model.TransportCapacity `json:"max_capacity"`

	CreatedAt time.Time `json:"created_at"`
}

type VehicleResponse struct {
	ID            uuid.UUID         `json:"id"`
	TransporterID uuid.UUID         `json:"transporter_id"`
	VehicleNumber string            `json:"vehicle_number"`
	VehicleType   model.VehicleType `json:"vehicle_type"`
	Make          string            `json:"make"`
	Model         string            `json:"model"`
	Year          int               `json:"year"`
	Color         string            `json:"color"`

	Capacity model.TransportCapacity `json:"capacity"`

	IsActive        bool   `json:"is_active"`
	IsAvailable     bool   `json:"is_available"`
	CurrentLocation string `json:"current_location"`

	CreatedAt time.Time `json:"created_at"`
}
