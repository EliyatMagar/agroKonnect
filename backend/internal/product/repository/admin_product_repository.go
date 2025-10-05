package repository

import (
	"context"
	"fmt"
	"time"

	model "agro_konnect/internal/product/model"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AdminProductRepository interface {
	GetAllProducts(ctx context.Context, page, pageSize int, search, status, category string) ([]*model.Product, int64, error)
	GetProductByID(ctx context.Context, id uuid.UUID) (*model.Product, error)
	UpdateProductStatus(ctx context.Context, productID uuid.UUID, status model.ProductStatus) error
	BulkUpdateProductStatus(ctx context.Context, productIDs []uuid.UUID, status model.ProductStatus) error
	DeleteProduct(ctx context.Context, productID uuid.UUID) error
	BulkDeleteProducts(ctx context.Context, productIDs []uuid.UUID) error
	GetProductStats(ctx context.Context) (*ProductStats, error)
	GetProductsByStatus(ctx context.Context, status model.ProductStatus, page, pageSize int) ([]*model.Product, int64, error)
	UpdateProductFeaturedStatus(ctx context.Context, productID uuid.UUID, isFeatured bool) error
	GetExpiringProducts(ctx context.Context, days int) ([]*model.Product, error)
	GetLowStockProducts(ctx context.Context, threshold float64) ([]*model.Product, error)
}

type adminProductRepository struct {
	db *gorm.DB
}

func NewAdminProductRepository(db *gorm.DB) AdminProductRepository {
	return &adminProductRepository{db: db}
}

type ProductStats struct {
	TotalProducts     int64   `json:"total_products"`
	ActiveProducts    int64   `json:"active_products"`
	DraftProducts     int64   `json:"draft_products"`
	InactiveProducts  int64   `json:"inactive_products"`
	SoldOutProducts   int64   `json:"sold_out_products"`
	ExpiredProducts   int64   `json:"expired_products"`
	FeaturedProducts  int64   `json:"featured_products"`
	OrganicProducts   int64   `json:"organic_products"`
	CertifiedProducts int64   `json:"certified_products"`
	AverageRating     float64 `json:"average_rating"`
	TotalStock        float64 `json:"total_stock"`
}

func (r *adminProductRepository) GetAllProducts(ctx context.Context, page, pageSize int, search, status, category string) ([]*model.Product, int64, error) {
	query := r.db.WithContext(ctx).Model(&model.Product{})

	// Apply filters
	if search != "" {
		searchTerm := fmt.Sprintf("%%%s%%", search)
		query = query.Where("name ILIKE ? OR description ILIKE ?", searchTerm, searchTerm)
	}

	if status != "" {
		query = query.Where("status = ?", status)
	}

	if category != "" {
		query = query.Where("category = ?", category)
	}

	// Get total count
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply pagination
	offset := (page - 1) * pageSize
	query = query.Offset(offset).Limit(pageSize).Order("created_at DESC")

	var products []*model.Product
	err := query.Find(&products).Error
	if err != nil {
		return nil, 0, err
	}

	return products, total, nil
}

func (r *adminProductRepository) GetProductByID(ctx context.Context, id uuid.UUID) (*model.Product, error) {
	var product model.Product
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&product).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &product, nil
}

func (r *adminProductRepository) UpdateProductStatus(ctx context.Context, productID uuid.UUID, status model.ProductStatus) error {
	return r.db.WithContext(ctx).Model(&model.Product{}).
		Where("id = ?", productID).
		Updates(map[string]interface{}{
			"status":     status,
			"updated_at": time.Now(),
		}).Error
}

func (r *adminProductRepository) BulkUpdateProductStatus(ctx context.Context, productIDs []uuid.UUID, status model.ProductStatus) error {
	return r.db.WithContext(ctx).Model(&model.Product{}).
		Where("id IN ?", productIDs).
		Updates(map[string]interface{}{
			"status":     status,
			"updated_at": time.Now(),
		}).Error
}

func (r *adminProductRepository) DeleteProduct(ctx context.Context, productID uuid.UUID) error {
	return r.db.WithContext(ctx).Where("id = ?", productID).Delete(&model.Product{}).Error
}

func (r *adminProductRepository) BulkDeleteProducts(ctx context.Context, productIDs []uuid.UUID) error {
	return r.db.WithContext(ctx).Where("id IN ?", productIDs).Delete(&model.Product{}).Error
}

func (r *adminProductRepository) GetProductStats(ctx context.Context) (*ProductStats, error) {
	var stats ProductStats

	// Total products
	if err := r.db.WithContext(ctx).Model(&model.Product{}).Count(&stats.TotalProducts).Error; err != nil {
		return nil, err
	}

	// Products by status
	if err := r.db.WithContext(ctx).Model(&model.Product{}).Where("status = ?", model.StatusActive).Count(&stats.ActiveProducts).Error; err != nil {
		return nil, err
	}
	if err := r.db.WithContext(ctx).Model(&model.Product{}).Where("status = ?", model.StatusDraft).Count(&stats.DraftProducts).Error; err != nil {
		return nil, err
	}
	if err := r.db.WithContext(ctx).Model(&model.Product{}).Where("status = ?", model.StatusInactive).Count(&stats.InactiveProducts).Error; err != nil {
		return nil, err
	}
	if err := r.db.WithContext(ctx).Model(&model.Product{}).Where("status = ?", model.StatusSoldOut).Count(&stats.SoldOutProducts).Error; err != nil {
		return nil, err
	}
	if err := r.db.WithContext(ctx).Model(&model.Product{}).Where("status = ?", model.StatusExpired).Count(&stats.ExpiredProducts).Error; err != nil {
		return nil, err
	}

	// Featured products
	if err := r.db.WithContext(ctx).Model(&model.Product{}).Where("is_featured = ?", true).Count(&stats.FeaturedProducts).Error; err != nil {
		return nil, err
	}

	// Organic and certified products
	if err := r.db.WithContext(ctx).Model(&model.Product{}).Where("organic = ?", true).Count(&stats.OrganicProducts).Error; err != nil {
		return nil, err
	}
	if err := r.db.WithContext(ctx).Model(&model.Product{}).Where("certified = ?", true).Count(&stats.CertifiedProducts).Error; err != nil {
		return nil, err
	}

	// Average rating
	if err := r.db.WithContext(ctx).Model(&model.Product{}).Select("COALESCE(AVG(rating), 0)").Row().Scan(&stats.AverageRating); err != nil {
		return nil, err
	}

	// Total stock
	if err := r.db.WithContext(ctx).Model(&model.Product{}).Select("COALESCE(SUM(available_stock), 0)").Row().Scan(&stats.TotalStock); err != nil {
		return nil, err
	}

	return &stats, nil
}

func (r *adminProductRepository) GetProductsByStatus(ctx context.Context, status model.ProductStatus, page, pageSize int) ([]*model.Product, int64, error) {
	query := r.db.WithContext(ctx).Model(&model.Product{}).Where("status = ?", status)

	// Get total count
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply pagination
	offset := (page - 1) * pageSize
	query = query.Offset(offset).Limit(pageSize).Order("created_at DESC")

	var products []*model.Product
	err := query.Find(&products).Error
	if err != nil {
		return nil, 0, err
	}

	return products, total, nil
}

func (r *adminProductRepository) UpdateProductFeaturedStatus(ctx context.Context, productID uuid.UUID, isFeatured bool) error {
	return r.db.WithContext(ctx).Model(&model.Product{}).
		Where("id = ?", productID).
		Updates(map[string]interface{}{
			"is_featured": isFeatured,
			"updated_at":  time.Now(),
		}).Error
}

func (r *adminProductRepository) GetExpiringProducts(ctx context.Context, days int) ([]*model.Product, error) {
	expiryDate := time.Now().AddDate(0, 0, days)

	var products []*model.Product
	err := r.db.WithContext(ctx).
		Where("expiry_date <= ? AND expiry_date > ? AND status = ?",
			expiryDate, time.Now(), model.StatusActive).
		Order("expiry_date ASC").
		Find(&products).Error

	return products, err
}

func (r *adminProductRepository) GetLowStockProducts(ctx context.Context, threshold float64) ([]*model.Product, error) {
	var products []*model.Product
	err := r.db.WithContext(ctx).
		Where("available_stock <= ? AND status = ?", threshold, model.StatusActive).
		Order("available_stock ASC").
		Find(&products).Error

	return products, err
}
