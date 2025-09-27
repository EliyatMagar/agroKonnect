package common

import (
	"time"

	"github.com/google/uuid"
)

// Base model for all entities
type BaseModel struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Address model for reusable address information
type Address struct {
	Street    string  `json:"street"`
	City      string  `json:"city"`
	State     string  `json:"state"`
	Country   string  `json:"country"`
	ZipCode   string  `json:"zip_code"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

// File attachment model
type FileAttachment struct {
	ID         uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	EntityType string    `gorm:"not null" json:"entity_type"` // user, farmer, product, etc.
	EntityID   uuid.UUID `gorm:"not null" json:"entity_id"`
	FileName   string    `gorm:"not null" json:"file_name"`
	FileURL    string    `gorm:"not null" json:"file_url"`
	FileType   string    `gorm:"not null" json:"file_type"`
	FileSize   int64     `json:"file_size"`
	UploadedBy uuid.UUID `gorm:"not null" json:"uploaded_by"`
	CreatedAt  time.Time `json:"created_at"`
}

// Notification model
type Notification struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	UserID    uuid.UUID `gorm:"not null" json:"user_id"`
	Title     string    `gorm:"not null" json:"title"`
	Message   string    `gorm:"not null" json:"message"`
	Type      string    `gorm:"not null" json:"type"` // order, system, promotion, etc.
	IsRead    bool      `gorm:"default:false" json:"is_read"`
	ActionURL string    `json:"action_url"`
	CreatedAt time.Time `json:"created_at"`
}
