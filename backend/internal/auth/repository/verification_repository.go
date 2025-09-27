package repository

import (
	model "agro_konnect/internal/auth/model"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type VerificationRepository interface {
	Create(code *model.VerificationCode) error
	FindValidCode(userID uuid.UUID, code string, codeType string) (*model.VerificationCode, error)
	FindValidCodeByCode(code string, codeType string) (*model.VerificationCode, error) // NEW METHOD
	MarkAsUsed(id uuid.UUID) error
	DeleteExpiredCodes() error
}

type verificationRepository struct {
	db *gorm.DB
}

func NewVerificationRepository(db *gorm.DB) VerificationRepository {
	return &verificationRepository{db: db}
}

func (r *verificationRepository) Create(code *model.VerificationCode) error {
	return r.db.Create(code).Error
}

func (r *verificationRepository) FindValidCode(userID uuid.UUID, code string, codeType string) (*model.VerificationCode, error) {
	var verificationCode model.VerificationCode
	err := r.db.Where("user_id = ? AND code = ? AND type = ? AND used = ? AND expires_at > ?",
		userID, code, codeType, false, time.Now()).First(&verificationCode).Error
	return &verificationCode, err
}

// NEW METHOD: Find verification code by code value (for password reset)
func (r *verificationRepository) FindValidCodeByCode(code string, codeType string) (*model.VerificationCode, error) {
	var verificationCode model.VerificationCode
	err := r.db.Where("code = ? AND type = ? AND used = ? AND expires_at > ?",
		code, codeType, false, time.Now()).First(&verificationCode).Error
	return &verificationCode, err
}

func (r *verificationRepository) MarkAsUsed(id uuid.UUID) error {
	return r.db.Model(&model.VerificationCode{}).Where("id = ?", id).Update("used", true).Error
}

func (r *verificationRepository) DeleteExpiredCodes() error {
	return r.db.Where("expires_at < ?", time.Now()).Delete(&model.VerificationCode{}).Error
}
