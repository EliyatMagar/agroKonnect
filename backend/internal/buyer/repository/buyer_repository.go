package repository

import (
	"context"
	"fmt"
	"strings"
	"time"

	model "agro_konnect/internal/buyer/model"
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type BuyerRepository interface {
	Create(ctx context.Context, buyer *model.Buyer) error
	FindByID(ctx context.Context, id uuid.UUID) (*model.Buyer, error)
	FindByUserID(ctx context.Context, userID uuid.UUID) (*model.Buyer, error)
	Update(ctx context.Context, buyer *model.Buyer) error
	Delete(ctx context.Context, id uuid.UUID) error
	FindAllWithFilters(ctx context.Context, filters BuyerFilter) ([]*model.Buyer, int64, error)
	UpdateVerificationStatus(ctx context.Context, buyerID uuid.UUID, verified bool) error
	UpdatePremiumStatus(ctx context.Context, buyerID uuid.UUID, premium bool) error
	UpdateRating(ctx context.Context, buyerID uuid.UUID, rating float64) error
	UpdateCreditLimit(ctx context.Context, buyerID uuid.UUID, creditLimit float64) error
	GetBuyerStats(ctx context.Context, buyerID uuid.UUID) (*BuyerStats, error)
}

type BuyerFilter struct {
	BusinessType     model.BuyerType
	BusinessScale    model.BusinessScale
	City             string
	State            string
	MinMonthlyVolume float64
	PreferredProduct string
	IsVerified       *bool
	IsPremium        *bool
	Page             int
	PageSize         int
}

type BuyerStats struct {
	TotalOrders     int
	CompletedOrders int
	TotalSpent      float64
	FavoriteFarmers int
	AverageRating   float64
}

type buyerRepository struct {
	db *gorm.DB
}

func NewBuyerRepository(db *gorm.DB) BuyerRepository {
	return &buyerRepository{db: db}
}

func (r *buyerRepository) Create(ctx context.Context, buyer *model.Buyer) error {
	return r.db.WithContext(ctx).Create(buyer).Error
}

func (r *buyerRepository) FindByID(ctx context.Context, id uuid.UUID) (*model.Buyer, error) {
	var buyer model.Buyer
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&buyer).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &buyer, err
}

func (r *buyerRepository) FindByUserID(ctx context.Context, userID uuid.UUID) (*model.Buyer, error) {
	var buyer model.Buyer
	err := r.db.WithContext(ctx).Where("user_id = ?", userID).First(&buyer).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &buyer, err
}

func (r *buyerRepository) Update(ctx context.Context, buyer *model.Buyer) error {
	buyer.UpdatedAt = time.Now()
	return r.db.WithContext(ctx).Save(buyer).Error
}

func (r *buyerRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&model.Buyer{}).Error
}

func (r *buyerRepository) FindAllWithFilters(ctx context.Context, filters BuyerFilter) ([]*model.Buyer, int64, error) {
	query := r.db.WithContext(ctx).Model(&model.Buyer{})

	// Apply filters
	if filters.BusinessType != "" {
		query = query.Where("business_type = ?", filters.BusinessType)
	}

	if filters.BusinessScale != "" {
		query = query.Where("business_scale = ?", filters.BusinessScale)
	}

	if filters.City != "" {
		query = query.Where("LOWER(city) LIKE ?", fmt.Sprintf("%%%s%%", strings.ToLower(filters.City)))
	}

	if filters.State != "" {
		query = query.Where("LOWER(state) LIKE ?", fmt.Sprintf("%%%s%%", strings.ToLower(filters.State)))
	}

	if filters.MinMonthlyVolume > 0 {
		query = query.Where("monthly_volume >= ?", filters.MinMonthlyVolume)
	}

	if filters.PreferredProduct != "" {
		query = query.Where("preferred_products @> ?", fmt.Sprintf(`{"%s"}`, filters.PreferredProduct))
	}

	if filters.IsVerified != nil {
		query = query.Where("is_verified = ?", *filters.IsVerified)
	}

	if filters.IsPremium != nil {
		query = query.Where("is_premium = ?", *filters.IsPremium)
	}

	// Get total count
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply pagination
	if filters.PageSize == 0 {
		filters.PageSize = 10
	}
	if filters.Page == 0 {
		filters.Page = 1
	}

	offset := (filters.Page - 1) * filters.PageSize
	query = query.Offset(offset).Limit(filters.PageSize).Order("created_at DESC")

	var buyers []*model.Buyer
	err := query.Find(&buyers).Error
	if err != nil {
		return nil, 0, err
	}

	return buyers, total, nil
}

func (r *buyerRepository) UpdateVerificationStatus(ctx context.Context, buyerID uuid.UUID, verified bool) error {
	return r.db.WithContext(ctx).Model(&model.Buyer{}).
		Where("id = ?", buyerID).
		Updates(map[string]interface{}{
			"is_verified": verified,
			"updated_at":  time.Now(),
		}).Error
}

func (r *buyerRepository) UpdatePremiumStatus(ctx context.Context, buyerID uuid.UUID, premium bool) error {
	return r.db.WithContext(ctx).Model(&model.Buyer{}).
		Where("id = ?", buyerID).
		Updates(map[string]interface{}{
			"is_premium": premium,
			"updated_at": time.Now(),
		}).Error
}

func (r *buyerRepository) UpdateRating(ctx context.Context, buyerID uuid.UUID, rating float64) error {
	return r.db.WithContext(ctx).Model(&model.Buyer{}).
		Where("id = ?", buyerID).
		Updates(map[string]interface{}{
			"rating":     rating,
			"updated_at": time.Now(),
		}).Error
}

func (r *buyerRepository) UpdateCreditLimit(ctx context.Context, buyerID uuid.UUID, creditLimit float64) error {
	return r.db.WithContext(ctx).Model(&model.Buyer{}).
		Where("id = ?", buyerID).
		Updates(map[string]interface{}{
			"credit_limit": creditLimit,
			"updated_at":   time.Now(),
		}).Error
}

func (r *buyerRepository) GetBuyerStats(ctx context.Context, buyerID uuid.UUID) (*BuyerStats, error) {
	var stats BuyerStats

	// This is a simplified implementation - you would need to join with orders table
	// For now, returning placeholder stats
	stats.TotalOrders = 0
	stats.CompletedOrders = 0
	stats.TotalSpent = 0
	stats.FavoriteFarmers = 0
	stats.AverageRating = 0

	return &stats, nil
}
