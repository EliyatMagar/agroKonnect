package repository

import (
	"context"
	"fmt"
	"time"

	dto "agro_konnect/internal/product/dto"
	model "agro_konnect/internal/product/model"
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ProductRepository interface {
	Create(ctx context.Context, product *model.Product) error
	FindByID(ctx context.Context, id uuid.UUID) (*model.Product, error)
	FindByFarmerID(ctx context.Context, farmerID uuid.UUID) ([]*model.Product, error)
	Update(ctx context.Context, product *model.Product) error
	Delete(ctx context.Context, id uuid.UUID) error
	FindAllWithFilters(ctx context.Context, filters dto.ProductFilterRequest) ([]*model.Product, int64, error)
	UpdateStock(ctx context.Context, productID uuid.UUID, quantity float64) error
	UpdateStatus(ctx context.Context, productID uuid.UUID, status model.ProductStatus) error
	FindFeaturedProducts(ctx context.Context, limit int) ([]*model.Product, error)
	FindByCategory(ctx context.Context, category model.ProductCategory, page, pageSize int) ([]*model.Product, int64, error)
	BulkUpdateStatus(ctx context.Context, productIDs []uuid.UUID, status model.ProductStatus) error
	GetExpiredProducts(ctx context.Context) ([]*model.Product, error)
	UpdateRating(ctx context.Context, productID uuid.UUID, rating float64, reviewCount int) error
}

type productRepository struct {
	db *gorm.DB
}

func NewProductRepository(db *gorm.DB) ProductRepository {
	return &productRepository{db: db}
}

func (r *productRepository) Create(ctx context.Context, product *model.Product) error {
	return r.db.WithContext(ctx).Create(product).Error
}

func (r *productRepository) FindByID(ctx context.Context, id uuid.UUID) (*model.Product, error) {
	var product model.Product
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&product).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &product, err
}

func (r *productRepository) FindByFarmerID(ctx context.Context, farmerID uuid.UUID) ([]*model.Product, error) {
	var products []*model.Product
	err := r.db.WithContext(ctx).Where("farmer_id = ?", farmerID).Find(&products).Error
	return products, err
}

func (r *productRepository) Update(ctx context.Context, product *model.Product) error {
	return r.db.WithContext(ctx).Save(product).Error
}

func (r *productRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&model.Product{}).Error
}

func (r *productRepository) FindAllWithFilters(ctx context.Context, filters dto.ProductFilterRequest) ([]*model.Product, int64, error) {
	query := r.db.WithContext(ctx).Model(&model.Product{}).Where("status = ?", model.StatusActive)

	// Apply filters
	query = r.applyFilters(query, filters)

	// Get total count
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply pagination and sorting
	query = r.applyPaginationAndSorting(query, filters)

	var products []*model.Product
	err := query.Find(&products).Error
	if err != nil {
		return nil, 0, err
	}

	return products, total, nil
}

func (r *productRepository) applyFilters(query *gorm.DB, filters dto.ProductFilterRequest) *gorm.DB {
	if filters.Category != "" {
		query = query.Where("category = ?", filters.Category)
	}

	if filters.FarmerID != uuid.Nil {
		query = query.Where("farmer_id = ?", filters.FarmerID)
	}

	if filters.MinPrice > 0 {
		query = query.Where("price_per_unit >= ?", filters.MinPrice)
	}

	if filters.MaxPrice > 0 {
		query = query.Where("price_per_unit <= ?", filters.MaxPrice)
	}

	if filters.Organic {
		query = query.Where("organic = ?", true)
	}

	if filters.Certified {
		query = query.Where("certified = ?", true)
	}

	if filters.QualityGrade != "" {
		query = query.Where("quality_grade = ?", filters.QualityGrade)
	}

	if filters.MinRating > 0 {
		query = query.Where("rating >= ?", filters.MinRating)
	}

	// For location-based filtering, you would need to join with farmer table
	if filters.City != "" || filters.State != "" {
		query = query.Joins("JOIN farmers ON farmers.id = products.farmer_id")
		if filters.City != "" {
			query = query.Where("farmers.city LIKE ?", fmt.Sprintf("%%%s%%", filters.City))
		}
		if filters.State != "" {
			query = query.Where("farmers.state LIKE ?", fmt.Sprintf("%%%s%%", filters.State))
		}
	}

	return query
}

func (r *productRepository) applyPaginationAndSorting(query *gorm.DB, filters dto.ProductFilterRequest) *gorm.DB {
	// Apply sorting
	sortField := "created_at"
	sortOrder := "desc"

	if filters.PageSize == 0 {
		filters.PageSize = 10
	}
	if filters.Page == 0 {
		filters.Page = 1
	}

	query = query.Order(fmt.Sprintf("%s %s", sortField, sortOrder))

	// Apply pagination
	offset := (filters.Page - 1) * filters.PageSize
	return query.Offset(offset).Limit(filters.PageSize)
}

func (r *productRepository) UpdateStock(ctx context.Context, productID uuid.UUID, quantity float64) error {
	return r.db.WithContext(ctx).Model(&model.Product{}).
		Where("id = ?", productID).
		Updates(map[string]interface{}{
			"available_stock": quantity,
			"updated_at":      time.Now(),
		}).Error
}

func (r *productRepository) UpdateStatus(ctx context.Context, productID uuid.UUID, status model.ProductStatus) error {
	return r.db.WithContext(ctx).Model(&model.Product{}).
		Where("id = ?", productID).
		Updates(map[string]interface{}{
			"status":     status,
			"updated_at": time.Now(),
		}).Error
}

func (r *productRepository) FindFeaturedProducts(ctx context.Context, limit int) ([]*model.Product, error) {
	var products []*model.Product
	err := r.db.WithContext(ctx).
		Where("is_featured = ? AND status = ?", true, model.StatusActive).
		Order("rating DESC").
		Limit(limit).
		Find(&products).Error
	return products, err
}

func (r *productRepository) FindByCategory(ctx context.Context, category model.ProductCategory, page, pageSize int) ([]*model.Product, int64, error) {
	var products []*model.Product
	var total int64

	query := r.db.WithContext(ctx).Where("category = ? AND status = ?", category, model.StatusActive)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	err := query.Offset(offset).Limit(pageSize).Order("created_at DESC").Find(&products).Error
	return products, total, err
}

func (r *productRepository) BulkUpdateStatus(ctx context.Context, productIDs []uuid.UUID, status model.ProductStatus) error {
	return r.db.WithContext(ctx).Model(&model.Product{}).
		Where("id IN ?", productIDs).
		Updates(map[string]interface{}{
			"status":     status,
			"updated_at": time.Now(),
		}).Error
}

func (r *productRepository) GetExpiredProducts(ctx context.Context) ([]*model.Product, error) {
	var products []*model.Product
	err := r.db.WithContext(ctx).
		Where("expiry_date <= ? AND status != ?", time.Now(), model.StatusExpired).
		Find(&products).Error
	return products, err
}

func (r *productRepository) UpdateRating(ctx context.Context, productID uuid.UUID, rating float64, reviewCount int) error {
	return r.db.WithContext(ctx).Model(&model.Product{}).
		Where("id = ?", productID).
		Updates(map[string]interface{}{
			"rating":       rating,
			"review_count": reviewCount,
			"updated_at":   time.Now(),
		}).Error
}
