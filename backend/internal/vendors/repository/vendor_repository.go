package repository

import (
	"context"
	"fmt"
	"time"

	dto "agro_konnect/internal/vendors/dto"
	model "agro_konnect/internal/vendors/model"
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type VendorRepository interface {
	Create(ctx context.Context, vendor *model.Vendor) error
	FindByID(ctx context.Context, id uuid.UUID) (*model.Vendor, error)
	FindByUserID(ctx context.Context, userID uuid.UUID) (*model.Vendor, error)
	Update(ctx context.Context, vendor *model.Vendor) error
	Delete(ctx context.Context, id uuid.UUID) error
	FindAllWithFilters(ctx context.Context, filters dto.VendorFilterRequest) ([]*model.Vendor, int64, error)
	UpdateStats(ctx context.Context, vendorID uuid.UUID, stats map[string]interface{}) error
	FindNearby(ctx context.Context, lat, lng, radius float64) ([]*model.Vendor, error)
	GetProductCount(ctx context.Context, vendorID uuid.UUID) (int, error)
	ExistsByUserID(ctx context.Context, userID uuid.UUID) (bool, error)
	BulkUpdateRatings(ctx context.Context, vendorRatings map[uuid.UUID]float64) error
}

type vendorRepository struct {
	db *gorm.DB
}

func NewVendorRepository(db *gorm.DB) VendorRepository {
	return &vendorRepository{db: db}
}

func (r *vendorRepository) Create(ctx context.Context, vendor *model.Vendor) error {
	return r.db.WithContext(ctx).Create(vendor).Error
}

func (r *vendorRepository) FindByID(ctx context.Context, id uuid.UUID) (*model.Vendor, error) {
	var vendor model.Vendor
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&vendor).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &vendor, err
}

func (r *vendorRepository) FindByUserID(ctx context.Context, userID uuid.UUID) (*model.Vendor, error) {
	var vendor model.Vendor
	err := r.db.WithContext(ctx).Where("user_id = ?", userID).First(&vendor).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &vendor, err
}

func (r *vendorRepository) Update(ctx context.Context, vendor *model.Vendor) error {
	return r.db.WithContext(ctx).Save(vendor).Error
}

func (r *vendorRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&model.Vendor{}).Error
}

func (r *vendorRepository) FindAllWithFilters(ctx context.Context, filters dto.VendorFilterRequest) ([]*model.Vendor, int64, error) {
	query := r.db.WithContext(ctx).Model(&model.Vendor{})

	// Apply filters
	query = r.applyFilters(query, filters)

	// Get total count
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply pagination and sorting
	query = r.applyPaginationAndSorting(query, filters)

	var vendors []*model.Vendor
	err := query.Find(&vendors).Error
	if err != nil {
		return nil, 0, err
	}

	return vendors, total, nil
}

func (r *vendorRepository) applyFilters(query *gorm.DB, filters dto.VendorFilterRequest) *gorm.DB {
	if filters.VendorType != "" {
		query = query.Where("vendor_type = ?", filters.VendorType)
	}

	if filters.BusinessType != "" {
		query = query.Where("business_type = ?", filters.BusinessType)
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

	if filters.IsVerified != nil {
		query = query.Where("is_verified = ?", *filters.IsVerified)
	}

	if filters.IsPremium != nil {
		query = query.Where("is_premium = ?", *filters.IsPremium)
	}

	if filters.Search != "" {
		searchTerm := fmt.Sprintf("%%%s%%", filters.Search)
		query = query.Where(
			"company_name LIKE ? OR brand_name LIKE ? OR contact_person LIKE ? OR city LIKE ? OR state LIKE ?",
			searchTerm, searchTerm, searchTerm, searchTerm, searchTerm,
		)
	}

	return query
}

func (r *vendorRepository) applyPaginationAndSorting(query *gorm.DB, filters dto.VendorFilterRequest) *gorm.DB {
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

func (r *vendorRepository) UpdateStats(ctx context.Context, vendorID uuid.UUID, stats map[string]interface{}) error {
	stats["updated_at"] = time.Now()
	return r.db.WithContext(ctx).Model(&model.Vendor{}).Where("id = ?", vendorID).Updates(stats).Error
}

func (r *vendorRepository) FindNearby(ctx context.Context, lat, lng, radius float64) ([]*model.Vendor, error) {
	// Simple bounding box query for compatibility
	latRange := radius / 111.0              // approx km per degree latitude
	lngRange := radius / (111.0 * cos(lat)) // approx km per degree longitude

	var vendors []*model.Vendor
	err := r.db.WithContext(ctx).
		Where("latitude BETWEEN ? AND ?", lat-latRange, lat+latRange).
		Where("longitude BETWEEN ? AND ?", lng-lngRange, lng+lngRange).
		Find(&vendors).Error
	return vendors, err
}

// cos calculates cosine (simplified for the example)
func cos(deg float64) float64 {
	rad := deg * 0.017453292519943295
	return (1 - rad*rad/2 + rad*rad*rad*rad/24 - rad*rad*rad*rad*rad*rad/720)
}

func (r *vendorRepository) GetProductCount(ctx context.Context, vendorID uuid.UUID) (int, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&model.VendorProduct{}).
		Where("vendor_id = ? AND is_active = ?", vendorID, true).
		Count(&count).Error
	return int(count), err
}

func (r *vendorRepository) ExistsByUserID(ctx context.Context, userID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&model.Vendor{}).Where("user_id = ?", userID).Count(&count).Error
	return count > 0, err
}

func (r *vendorRepository) BulkUpdateRatings(ctx context.Context, vendorRatings map[uuid.UUID]float64) error {
	if len(vendorRatings) == 0 {
		return nil
	}

	for vendorID, rating := range vendorRatings {
		if err := r.db.WithContext(ctx).Model(&model.Vendor{}).Where("id = ?", vendorID).
			Updates(map[string]interface{}{
				"rating":     rating,
				"updated_at": time.Now(),
			}).Error; err != nil {
			return err
		}
	}
	return nil
}
