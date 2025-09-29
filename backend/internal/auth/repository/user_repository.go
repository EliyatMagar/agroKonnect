package repository

import (
	model "agro_konnect/internal/auth/model"
	"errors"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserRepository interface {
	Create(user *model.User) error
	FindByID(id uuid.UUID) (*model.User, error)
	FindByEmail(email string) (*model.User, error)
	FindByPhone(phone string) (*model.User, error)
	Update(user *model.User) error
	Delete(id uuid.UUID) error
	UpdateLastLogin(id uuid.UUID) error
	FindAllWithFilters(limit, offset int, role, search string) ([]*model.User, int64, error)
	GetUserStatistics() (*model.UserStats, error)
}

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) Create(user *model.User) error {
	return r.db.Create(user).Error
}

func (r *userRepository) FindByID(id uuid.UUID) (*model.User, error) {
	var user model.User
	err := r.db.Where("id = ?", id).First(&user).Error
	return &user, err
}

func (r *userRepository) FindByEmail(email string) (*model.User, error) {
	var user model.User
	err := r.db.Where("email = ?", email).First(&user).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil // Not found → safe for registration
	}
	if err != nil {
		return nil, err // Some other DB error
	}
	return &user, err
}

func (r *userRepository) FindByPhone(phone string) (*model.User, error) {
	var user model.User
	err := r.db.Where("phone = ?", phone).First(&user).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return &user, err
}

func (r *userRepository) Update(user *model.User) error {
	return r.db.Save(user).Error
}

func (r *userRepository) Delete(id uuid.UUID) error {
	return r.db.Where("id = ?", id).Delete(&model.User{}).Error
}

func (r *userRepository) UpdateLastLogin(id uuid.UUID) error {
	return r.db.Model(&model.User{}).Where("id = ?", id).Update("last_login_at", time.Now()).Error
}

func (r *userRepository) FindAllWithFilters(limit, offset int, role, search string) ([]*model.User, int64, error) {
	query := r.db.Model(&model.User{})

	if role != "" {
		query = query.Where("role = ?", role)
	}

	if search != "" {
		searchTerm := "%" + search + "%"
		query = query.Where("email ILIKE ? OR phone ILIKE ?", searchTerm, searchTerm)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var users []*model.User
	err := query.Offset(offset).Limit(limit).Order("created_at DESC").Find(&users).Error
	if err != nil {
		return nil, 0, err
	}

	return users, total, nil
}

func (r *userRepository) GetUserStatistics() (*model.UserStats, error) {
	var stats model.UserStats

	// Total users
	if err := r.db.Model(&model.User{}).Count(&stats.TotalUsers).Error; err != nil {
		return nil, err
	}

	// Active users
	if err := r.db.Model(&model.User{}).Where("is_active = ?", true).Count(&stats.ActiveUsers).Error; err != nil {
		return nil, err
	}

	// Verified users
	if err := r.db.Model(&model.User{}).Where("is_verified = ?", true).Count(&stats.VerifiedUsers).Error; err != nil {
		return nil, err
	}

	// Users by role
	var roleCounts []struct {
		Role  model.UserRole
		Count int64
	}

	if err := r.db.Model(&model.User{}).
		Select("role, count(*) as count").
		Group("role").
		Scan(&roleCounts).Error; err != nil {
		return nil, err
	}

	stats.UsersByRole = make(map[model.UserRole]int64)
	for _, rc := range roleCounts {
		stats.UsersByRole[rc.Role] = rc.Count
	}

	// New users today
	today := time.Now().Truncate(24 * time.Hour)
	if err := r.db.Model(&model.User{}).
		Where("created_at >= ?", today).
		Count(&stats.NewUsersToday).Error; err != nil {
		return nil, err
	}

	return &stats, nil
}
