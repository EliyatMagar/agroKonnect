package repository

import (
	"context"
	"time"

	model "agro_konnect/internal/vendors/model"
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type VendorProductRepository interface {
	Create(ctx context.Context, product *model.VendorProduct) error
	FindByID(ctx context.Context, id uuid.UUID) (*model.VendorProduct, error)
	FindByVendorID(ctx context.Context, vendorID uuid.UUID) ([]*model.VendorProduct, error)
	Update(ctx context.Context, product *model.VendorProduct) error
	Delete(ctx context.Context, id uuid.UUID) error
	UpdateStock(ctx context.Context, productID uuid.UUID, stock int) error
	UpdateStatus(ctx context.Context, productID uuid.UUID, isActive bool) error
	FindActiveByVendorID(ctx context.Context, vendorID uuid.UUID) ([]*model.VendorProduct, error)
	FindByCategory(ctx context.Context, vendorID uuid.UUID, category string) ([]*model.VendorProduct, error)
}

type vendorProductRepository struct {
	db *gorm.DB
}

func NewVendorProductRepository(db *gorm.DB) VendorProductRepository {
	return &vendorProductRepository{db: db}
}

func (r *vendorProductRepository) Create(ctx context.Context, product *model.VendorProduct) error {
	return r.db.WithContext(ctx).Create(product).Error
}

func (r *vendorProductRepository) FindByID(ctx context.Context, id uuid.UUID) (*model.VendorProduct, error) {
	var product model.VendorProduct
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&product).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &product, err
}

func (r *vendorProductRepository) FindByVendorID(ctx context.Context, vendorID uuid.UUID) ([]*model.VendorProduct, error) {
	var products []*model.VendorProduct
	err := r.db.WithContext(ctx).Where("vendor_id = ?", vendorID).Find(&products).Error
	return products, err
}

func (r *vendorProductRepository) Update(ctx context.Context, product *model.VendorProduct) error {
	return r.db.WithContext(ctx).Save(product).Error
}

func (r *vendorProductRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&model.VendorProduct{}).Error
}

func (r *vendorProductRepository) UpdateStock(ctx context.Context, productID uuid.UUID, stock int) error {
	return r.db.WithContext(ctx).Model(&model.VendorProduct{}).
		Where("id = ?", productID).
		Updates(map[string]interface{}{
			"stock":      stock,
			"updated_at": time.Now(),
		}).Error
}

func (r *vendorProductRepository) UpdateStatus(ctx context.Context, productID uuid.UUID, isActive bool) error {
	return r.db.WithContext(ctx).Model(&model.VendorProduct{}).
		Where("id = ?", productID).
		Updates(map[string]interface{}{
			"is_active":  isActive,
			"updated_at": time.Now(),
		}).Error
}

func (r *vendorProductRepository) FindActiveByVendorID(ctx context.Context, vendorID uuid.UUID) ([]*model.VendorProduct, error) {
	var products []*model.VendorProduct
	err := r.db.WithContext(ctx).
		Where("vendor_id = ? AND is_active = ?", vendorID, true).
		Find(&products).Error
	return products, err
}

func (r *vendorProductRepository) FindByCategory(ctx context.Context, vendorID uuid.UUID, category string) ([]*model.VendorProduct, error) {
	var products []*model.VendorProduct
	err := r.db.WithContext(ctx).
		Where("vendor_id = ? AND category = ? AND is_active = ?", vendorID, category, true).
		Find(&products).Error
	return products, err
}
