package repository

import (
	"context"
	"fmt"
	"time"

	dto "agro_konnect/internal/farmer/dto"
	model "agro_konnect/internal/farmer/model"
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type FarmerRepository interface {
	Create(ctx context.Context, farmer *model.Farmer) error
	FindByID(ctx context.Context, id uuid.UUID) (*model.Farmer, error)
	FindByUserID(ctx context.Context, userID uuid.UUID) (*model.Farmer, error)
	Update(ctx context.Context, farmer *model.Farmer) error
	Delete(ctx context.Context, id uuid.UUID) error
	FindAllWithFilters(ctx context.Context, filters dto.FarmerFilterRequest) ([]*model.Farmer, int64, error)
	UpdateStats(ctx context.Context, farmerID uuid.UUID, stats map[string]interface{}) error
	FindNearby(ctx context.Context, lat, lng, radius float64) ([]*model.Farmer, error)
	GetProductCount(ctx context.Context, farmerID uuid.UUID) (int, error)
	GetActiveListingsCount(ctx context.Context, farmerID uuid.UUID) (int, error)
	ExistsByUserID(ctx context.Context, userID uuid.UUID) (bool, error)
	BulkUpdateRatings(ctx context.Context, farmerRatings map[uuid.UUID]float64) error
}

type farmerRepository struct {
	db *gorm.DB
}

func NewFarmerRepository(db *gorm.DB) FarmerRepository {
	return &farmerRepository{db: db}
}

func (r *farmerRepository) Create(ctx context.Context, farmer *model.Farmer) error {
	return r.db.WithContext(ctx).Create(farmer).Error
}

func (r *farmerRepository) FindByID(ctx context.Context, id uuid.UUID) (*model.Farmer, error) {
	var farmer model.Farmer
	err := r.db.WithContext(ctx).Preload("Products").Where("id = ?", id).First(&farmer).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &farmer, err
}

func (r *farmerRepository) FindByUserID(ctx context.Context, userID uuid.UUID) (*model.Farmer, error) {
	var farmer model.Farmer
	err := r.db.WithContext(ctx).Preload("Products").Where("user_id = ?", userID).First(&farmer).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &farmer, err
}

func (r *farmerRepository) Update(ctx context.Context, farmer *model.Farmer) error {
	return r.db.WithContext(ctx).Save(farmer).Error
}

func (r *farmerRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&model.Farmer{}).Error
}

func (r *farmerRepository) FindAllWithFilters(ctx context.Context, filters dto.FarmerFilterRequest) ([]*model.Farmer, int64, error) {
	query := r.db.WithContext(ctx).Model(&model.Farmer{})

	// Apply filters
	query = r.applyFilters(query, filters)

	// Get total count
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply pagination and sorting
	query = r.applyPaginationAndSorting(query, filters)

	var farmers []*model.Farmer
	err := query.Find(&farmers).Error
	if err != nil {
		return nil, 0, err
	}

	return farmers, total, nil
}

func (r *farmerRepository) applyFilters(query *gorm.DB, filters dto.FarmerFilterRequest) *gorm.DB {
	if filters.FarmType != "" {
		query = query.Where("farm_type = ?", filters.FarmType)
	}

	if filters.Certification != "" {
		// Use JSON_SEARCH for MySQL or other database-specific functions
		query = query.Where("JSON_SEARCH(certifications, 'one', ?) IS NOT NULL", filters.Certification)
	}

	if filters.City != "" {
		query = query.Where("city LIKE ?", fmt.Sprintf("%%%s%%", filters.City))
	}

	if filters.State != "" {
		query = query.Where("state LIKE ?", fmt.Sprintf("%%%s%%", filters.State))
	}

	if filters.Country != "" {
		query = query.Where("country LIKE ?", fmt.Sprintf("%%%s%%", filters.Country))
	}

	if filters.MinRating > 0 {
		query = query.Where("rating >= ?", filters.MinRating)
	}

	if filters.MaxRating > 0 {
		query = query.Where("rating <= ?", filters.MaxRating)
	}

	if filters.MinExperience > 0 {
		query = query.Where("experience_years >= ?", filters.MinExperience)
	}

	if filters.IsVerified != nil {
		query = query.Where("is_verified = ?", *filters.IsVerified)
	}

	if filters.IsPremium != nil {
		query = query.Where("is_premium = ?", *filters.IsPremium)
	}

	if filters.Search != "" {
		searchTerm := fmt.Sprintf("%%%s%%", filters.Search)
		query = query.Where(
			"farm_name LIKE ? OR full_name LIKE ? OR city LIKE ? OR state LIKE ?",
			searchTerm, searchTerm, searchTerm, searchTerm,
		)
	}

	return query
}

func (r *farmerRepository) applyPaginationAndSorting(query *gorm.DB, filters dto.FarmerFilterRequest) *gorm.DB {
	// Apply sorting
	sortField := filters.SortBy
	if sortField == "" {
		sortField = "created_at"
	}
	sortOrder := filters.SortOrder
	if sortOrder == "" {
		sortOrder = "desc"
	}
	query = query.Order(fmt.Sprintf("%s %s", sortField, sortOrder))

	// Apply pagination
	offset := (filters.Page - 1) * filters.PageSize
	return query.Offset(offset).Limit(filters.PageSize)
}

func (r *farmerRepository) UpdateStats(ctx context.Context, farmerID uuid.UUID, stats map[string]interface{}) error {
	stats["updated_at"] = time.Now()
	return r.db.WithContext(ctx).Model(&model.Farmer{}).Where("id = ?", farmerID).Updates(stats).Error
}

func (r *farmerRepository) FindNearby(ctx context.Context, lat, lng, radius float64) ([]*model.Farmer, error) {
	// Simple bounding box query for compatibility
	// In production, use PostGIS or database-specific spatial functions
	latRange := radius / 111.0              // approx km per degree latitude
	lngRange := radius / (111.0 * COS(lat)) // approx km per degree longitude

	var farmers []*model.Farmer
	err := r.db.WithContext(ctx).
		Where("latitude BETWEEN ? AND ?", lat-latRange, lat+latRange).
		Where("longitude BETWEEN ? AND ?", lng-lngRange, lng+lngRange).
		Find(&farmers).Error
	return farmers, err
}

// COS calculates cosine (simplified for the example)
func COS(deg float64) float64 {
	rad := deg * 0.017453292519943295
	return (1 - rad*rad/2 + rad*rad*rad*rad/24 - rad*rad*rad*rad*rad*rad/720)
}

func (r *farmerRepository) GetProductCount(ctx context.Context, farmerID uuid.UUID) (int, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&model.Farmer{}).Where("id = ?", farmerID).
		Joins("LEFT JOIN products ON products.farmer_id = farmers.id").
		Count(&count).Error
	return int(count), err
}

func (r *farmerRepository) GetActiveListingsCount(ctx context.Context, farmerID uuid.UUID) (int, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&model.Farmer{}).Where("farmers.id = ?", farmerID).
		Joins("LEFT JOIN products ON products.farmer_id = farmers.id AND products.status = 'active' AND products.available_stock > 0").
		Count(&count).Error
	return int(count), err
}

func (r *farmerRepository) ExistsByUserID(ctx context.Context, userID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&model.Farmer{}).Where("user_id = ?", userID).Count(&count).Error
	return count > 0, err
}

func (r *farmerRepository) BulkUpdateRatings(ctx context.Context, farmerRatings map[uuid.UUID]float64) error {
	if len(farmerRatings) == 0 {
		return nil
	}

	// Use batch updates instead of individual updates in transaction
	for farmerID, rating := range farmerRatings {
		if err := r.db.WithContext(ctx).Model(&model.Farmer{}).Where("id = ?", farmerID).
			Updates(map[string]interface{}{
				"rating":     rating,
				"updated_at": time.Now(),
			}).Error; err != nil {
			return err
		}
	}
	return nil
}
