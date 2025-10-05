package service

import (
	"context"
	"log"
	"time"

	dto "agro_konnect/internal/product/dto"
	model "agro_konnect/internal/product/model"
	"agro_konnect/internal/product/repository"
	"errors"

	"github.com/google/uuid"
)

type AdminProductService interface {
	GetAllProducts(ctx context.Context, req *dto.AdminProductFilterRequest) (*dto.AdminProductListResponse, error)
	GetProductByID(ctx context.Context, productID uuid.UUID) (*dto.AdminProductResponse, error)
	UpdateProductStatus(ctx context.Context, productID uuid.UUID, status model.ProductStatus) error
	BulkUpdateProductStatus(ctx context.Context, req *dto.BulkUpdateStatusRequest) error
	DeleteProduct(ctx context.Context, productID uuid.UUID) error
	BulkDeleteProducts(ctx context.Context, productIDs []uuid.UUID) error
	GetProductStats(ctx context.Context) (*dto.ProductStatsResponse, error)
	GetProductsByStatus(ctx context.Context, status model.ProductStatus, page, pageSize int) (*dto.AdminProductListResponse, error)
	UpdateProductFeaturedStatus(ctx context.Context, productID uuid.UUID, isFeatured bool) error
	GetExpiringProducts(ctx context.Context, days int) ([]*dto.AdminProductResponse, error)
	GetLowStockProducts(ctx context.Context, threshold float64) ([]*dto.AdminProductResponse, error)
}

type adminProductService struct {
	adminRepo repository.AdminProductRepository
}

func NewAdminProductService(adminRepo repository.AdminProductRepository) AdminProductService {
	return &adminProductService{
		adminRepo: adminRepo,
	}
}

func (s *adminProductService) GetAllProducts(ctx context.Context, req *dto.AdminProductFilterRequest) (*dto.AdminProductListResponse, error) {
	if req.Page == 0 {
		req.Page = 1
	}
	if req.PageSize == 0 {
		req.PageSize = 20
	}

	products, total, err := s.adminRepo.GetAllProducts(ctx, req.Page, req.PageSize, req.Search, req.Status, req.Category)
	if err != nil {
		return nil, err
	}

	responses := make([]*dto.AdminProductResponse, len(products))
	for i, product := range products {
		responses[i] = s.toAdminProductResponse(product)
	}

	pages := (total + int64(req.PageSize) - 1) / int64(req.PageSize)
	hasMore := int64(req.Page) < pages

	return &dto.AdminProductListResponse{
		Products: responses,
		Total:    total,
		Page:     req.Page,
		Pages:    int(pages),
		HasMore:  hasMore,
	}, nil
}

func (s *adminProductService) GetProductByID(ctx context.Context, productID uuid.UUID) (*dto.AdminProductResponse, error) {
	product, err := s.adminRepo.GetProductByID(ctx, productID)
	if err != nil {
		return nil, err
	}
	if product == nil {
		return nil, ErrProductNotFound
	}

	return s.toAdminProductResponse(product), nil
}

func (s *adminProductService) UpdateProductStatus(ctx context.Context, productID uuid.UUID, status model.ProductStatus) error {
	// Validate status
	validStatuses := map[model.ProductStatus]bool{
		model.StatusDraft:    true,
		model.StatusActive:   true,
		model.StatusInactive: true,
		model.StatusSoldOut:  true,
		model.StatusExpired:  true,
	}

	if !validStatuses[status] {
		return errors.New("invalid product status")
	}

	return s.adminRepo.UpdateProductStatus(ctx, productID, status)
}

func (s *adminProductService) BulkUpdateProductStatus(ctx context.Context, req *dto.BulkUpdateStatusRequest) error {
	if len(req.ProductIDs) == 0 {
		return errors.New("no product IDs provided")
	}

	// Validate status
	validStatuses := map[model.ProductStatus]bool{
		model.StatusDraft:    true,
		model.StatusActive:   true,
		model.StatusInactive: true,
		model.StatusSoldOut:  true,
		model.StatusExpired:  true,
	}

	if !validStatuses[req.Status] {
		return errors.New("invalid product status")
	}

	return s.adminRepo.BulkUpdateProductStatus(ctx, req.ProductIDs, req.Status)
}

func (s *adminProductService) DeleteProduct(ctx context.Context, productID uuid.UUID) error {
	// Check if product exists
	product, err := s.adminRepo.GetProductByID(ctx, productID)
	if err != nil {
		return err
	}
	if product == nil {
		return ErrProductNotFound
	}

	return s.adminRepo.DeleteProduct(ctx, productID)
}

func (s *adminProductService) BulkDeleteProducts(ctx context.Context, productIDs []uuid.UUID) error {
	if len(productIDs) == 0 {
		return errors.New("no product IDs provided")
	}

	return s.adminRepo.BulkDeleteProducts(ctx, productIDs)
}

func (s *adminProductService) GetProductStats(ctx context.Context) (*dto.ProductStatsResponse, error) {
	stats, err := s.adminRepo.GetProductStats(ctx)
	if err != nil {
		log.Printf("Error getting product stats: %v", err)
		return nil, err
	}

	return &dto.ProductStatsResponse{
		TotalProducts:     stats.TotalProducts,
		ActiveProducts:    stats.ActiveProducts,
		DraftProducts:     stats.DraftProducts,
		InactiveProducts:  stats.InactiveProducts,
		SoldOutProducts:   stats.SoldOutProducts,
		ExpiredProducts:   stats.ExpiredProducts,
		FeaturedProducts:  stats.FeaturedProducts,
		OrganicProducts:   stats.OrganicProducts,
		CertifiedProducts: stats.CertifiedProducts,
		AverageRating:     stats.AverageRating,
		TotalStock:        stats.TotalStock,
	}, nil
}

func (s *adminProductService) GetProductsByStatus(ctx context.Context, status model.ProductStatus, page, pageSize int) (*dto.AdminProductListResponse, error) {
	if page == 0 {
		page = 1
	}
	if pageSize == 0 {
		pageSize = 20
	}

	products, total, err := s.adminRepo.GetProductsByStatus(ctx, status, page, pageSize)
	if err != nil {
		return nil, err
	}

	responses := make([]*dto.AdminProductResponse, len(products))
	for i, product := range products {
		responses[i] = s.toAdminProductResponse(product)
	}

	pages := (total + int64(pageSize) - 1) / int64(pageSize)
	hasMore := int64(page) < pages

	return &dto.AdminProductListResponse{
		Products: responses,
		Total:    total,
		Page:     page,
		Pages:    int(pages),
		HasMore:  hasMore,
	}, nil
}

func (s *adminProductService) UpdateProductFeaturedStatus(ctx context.Context, productID uuid.UUID, isFeatured bool) error {
	// Check if product exists
	product, err := s.adminRepo.GetProductByID(ctx, productID)
	if err != nil {
		return err
	}
	if product == nil {
		return ErrProductNotFound
	}

	return s.adminRepo.UpdateProductFeaturedStatus(ctx, productID, isFeatured)
}

func (s *adminProductService) GetExpiringProducts(ctx context.Context, days int) ([]*dto.AdminProductResponse, error) {
	if days <= 0 {
		days = 7 // Default to 7 days
	}

	products, err := s.adminRepo.GetExpiringProducts(ctx, days)
	if err != nil {
		return nil, err
	}

	responses := make([]*dto.AdminProductResponse, len(products))
	for i, product := range products {
		responses[i] = s.toAdminProductResponse(product)
	}

	return responses, nil
}

func (s *adminProductService) GetLowStockProducts(ctx context.Context, threshold float64) ([]*dto.AdminProductResponse, error) {
	if threshold <= 0 {
		threshold = 10 // Default threshold
	}

	products, err := s.adminRepo.GetLowStockProducts(ctx, threshold)
	if err != nil {
		return nil, err
	}

	responses := make([]*dto.AdminProductResponse, len(products))
	for i, product := range products {
		responses[i] = s.toAdminProductResponse(product)
	}

	return responses, nil
}

// Helper methods
func (s *adminProductService) toAdminProductResponse(product *model.Product) *dto.AdminProductResponse {
	// Fixed: Using time.Until instead of product.ExpiryDate.Sub(time.Now())
	daysUntilExpiry := int(time.Until(product.ExpiryDate).Hours() / 24)
	if daysUntilExpiry < 0 {
		daysUntilExpiry = 0
	}

	return &dto.AdminProductResponse{
		ID:                   product.ID,
		FarmerID:             product.FarmerID,
		FarmerName:           "", // Would come from farmer service
		FarmName:             "", // Would come from farmer service
		Name:                 product.Name,
		Category:             product.Category,
		Subcategory:          product.Subcategory,
		Description:          product.Description,
		Images:               product.Images,
		PricePerUnit:         product.PricePerUnit,
		Unit:                 product.Unit,
		AvailableStock:       product.AvailableStock,
		MinOrder:             product.MinOrder,
		MaxOrder:             product.MaxOrder,
		QualityGrade:         product.QualityGrade,
		Organic:              product.Organic,
		Certified:            product.Certified,
		CertificationDetails: product.CertificationDetails,
		HarvestDate:          product.HarvestDate,
		ShelfLife:            product.ShelfLife,
		StorageTips:          product.StorageTips,
		Status:               product.Status,
		IsFeatured:           product.IsFeatured,
		Rating:               product.Rating,
		ReviewCount:          product.ReviewCount,
		FarmLocation:         product.FarmLocation,
		Latitude:             product.Latitude,
		Longitude:            product.Longitude,
		CreatedAt:            product.CreatedAt,
		UpdatedAt:            product.UpdatedAt,
		ExpiryDate:           product.ExpiryDate,
		DaysUntilExpiry:      daysUntilExpiry,
		IsLowStock:           product.AvailableStock <= 10, // Example threshold
	}
}
