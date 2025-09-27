package dto

import (
	"agro_konnect/internal/auth/model"
	"time"

	"github.com/google/uuid"
)

// Request DTOs
type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
}

type RegisterRequest struct {
	Email    string         `json:"email" validate:"required,email"`
	Phone    string         `json:"phone" validate:"required"`
	Password string         `json:"password" validate:"required,min=6"`
	Role     model.UserRole `json:"role" validate:"required,oneof=farmer vendor transporter buyer"`
}

type VerifyEmailRequest struct {
	Email string `json:"email" validate:"required,email"`
	Code  string `json:"code" validate:"required"`
}

type ForgotPasswordRequest struct {
	Email string `json:"email" validate:"required,email"`
}

type ResetPasswordRequest struct {
	Token       string `json:"token" validate:"required"`
	NewPassword string `json:"new_password" validate:"required,min=6"`
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" validate:"required"`
	NewPassword     string `json:"new_password" validate:"required,min=6"`
}

// Response DTOs
type AuthResponse struct {
	User         model.User `json:"user"`
	AccessToken  string     `json:"access_token"`
	RefreshToken string     `json:"refresh_token,omitempty"`
	ExpiresAt    time.Time  `json:"expires_at"`
}

type UserResponse struct {
	ID         uuid.UUID      `json:"id"`
	Email      string         `json:"email"`
	Phone      string         `json:"phone"`
	Role       model.UserRole `json:"role"`
	IsVerified bool           `json:"is_verified"`
	IsActive   bool           `json:"is_active"`
	CreatedAt  time.Time      `json:"created_at"`
}
