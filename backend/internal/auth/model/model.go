package model

import (
	"time"

	"github.com/google/uuid"
)

type UserRole string

const (
	RoleFarmer      UserRole = "farmer"
	RoleVendor      UserRole = "vendor"
	RoleTransporter UserRole = "transporter"
	RoleBuyer       UserRole = "buyer"
	RoleAdmin       UserRole = "admin"
)

type User struct {
	ID           uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	Email        string    `gorm:"uniqueIndex;not null" json:"email"`
	Phone        string    `gorm:"uniqueIndex;not null" json:"phone"`
	PasswordHash string    `gorm:"not null" json:"-"`
	Role         UserRole  `gorm:"type:varchar(20);not null" json:"role"`
	IsVerified   bool      `gorm:"default:false" json:"is_verified"`
	IsActive     bool      `gorm:"default:true" json:"is_active"`

	// Profile references
	FarmerID      *uuid.UUID `gorm:"type:uuid" json:"farmer_id,omitempty"`
	VendorID      *uuid.UUID `gorm:"type:uuid" json:"vendor_id,omitempty"`
	TransporterID *uuid.UUID `gorm:"type:uuid" json:"transporter_id,omitempty"`
	BuyerID       *uuid.UUID `gorm:"type:uuid" json:"buyer_id,omitempty"`

	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	LastLoginAt *time.Time `json:"last_login_at,omitempty"`
}

type VerificationCode struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	Code      string    `gorm:"not null;size:6" json:"code"`
	Type      string    `gorm:"not null" json:"type"` // "email_verification", "password_reset"
	ExpiresAt time.Time `gorm:"not null" json:"expires_at"`
	Used      bool      `gorm:"default:false" json:"used"`
	CreatedAt time.Time `json:"created_at"`
}

type UserStats struct {
	TotalUsers    int64              `json:"total_users"`
	ActiveUsers   int64              `json:"active_users"`
	VerifiedUsers int64              `json:"verified_users"`
	UsersByRole   map[UserRole]int64 `json:"users_by_role"`
	NewUsersToday int64              `json:"new_users_today"`
}
