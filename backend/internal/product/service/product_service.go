package service

import (
	"context"
	"log"
	"math"
	"strings"
	"time"

	dto "agro_konnect/internal/product/dto"
	model "agro_konnect/internal/product/model"
	"agro_konnect/internal/product/repository"
	"errors"

	"github.com/google/uuid"
)

var (
	ErrProductNotFound    = errors.New("product not found")
	ErrInvalidProductData = errors.New("invalid product data")
	ErrInsufficientStock  = errors.New("insufficient stock")
	ErrUnauthorizedAccess = errors.New("unauthorized access to product")
	ErrInvalidHarvestDate = errors.New("invalid harvest date")
	ErrProductNotActive   = errors.New("product is not active")
)

type ProductService interface {
	CreateProduct(ctx context.Context, farmerID uuid.UUID, req *dto.CreateProductRequest) (*model.Product, error)
	GetProductByID(ctx context.Context, id uuid.UUID) (*dto.ProductResponse, error)
	GetProductsByFarmer(ctx context.Context, farmerID uuid.UUID) ([]*dto.ProductResponse, error)
	UpdateProduct(ctx context.Context, productID uuid.UUID, farmerID uuid.UUID, req *dto.UpdateProductRequest) (*dto.ProductResponse, error)
	DeleteProduct(ctx context.Context, productID uuid.UUID, farmerID uuid.UUID) error
	GetAllProducts(ctx context.Context, filters dto.ProductFilterRequest) (*dto.ProductListResponse, error)
	UpdateStock(ctx context.Context, productID uuid.UUID, farmerID uuid.UUID, quantity float64) error
	UpdateProductStatus(ctx context.Context, productID uuid.UUID, farmerID uuid.UUID, status model.ProductStatus) error
	GetFeaturedProducts(ctx context.Context, limit int) ([]*dto.ProductResponse, error)
	GetProductsByCategory(ctx context.Context, category model.ProductCategory, page, pageSize int) (*dto.ProductListResponse, error)
	SearchProducts(ctx context.Context, query string, page, pageSize int) (*dto.ProductListResponse, error)
	BulkUpdateExpiredProducts(ctx context.Context) error
}

type productService struct {
	productRepo repository.ProductRepository
}

func NewProductService(productRepo repository.ProductRepository) ProductService {
	return &productService{
		productRepo: productRepo,
	}
}

func (s *productService) CreateProduct(ctx context.Context, farmerID uuid.UUID, req *dto.CreateProductRequest) (*model.Product, error) {
	log.Printf("Creating product for farmer: %s", farmerID)

	// Validate harvest date
	harvestDate, err := time.Parse("2006-01-02", req.HarvestDate)
	if err != nil {
		return nil, ErrInvalidHarvestDate
	}

	// Calculate expiry date
	expiryDate := harvestDate.Add(time.Duration(req.ShelfLife) * 24 * time.Hour)

	// Validate expiry date is not in the past
	if expiryDate.Before(time.Now()) {
		return nil, errors.New("product expiry date cannot be in the past")
	}

	// Validate stock and pricing
	if req.AvailableStock < 0 {
		return nil, errors.New("available stock cannot be negative")
	}
	if req.PricePerUnit < 0 {
		return nil, errors.New("price per unit cannot be negative")
	}
	if req.MinOrder < 0 {
		return nil, errors.New("minimum order cannot be negative")
	}
	if req.MaxOrder < 0 || (req.MaxOrder > 0 && req.MaxOrder < req.MinOrder) {
		return nil, errors.New("maximum order must be greater than minimum order")
	}

	product := &model.Product{
		ID:                   uuid.New(),
		FarmerID:             farmerID,
		Name:                 strings.TrimSpace(req.Name),
		Category:             req.Category,
		Subcategory:          strings.TrimSpace(req.Subcategory),
		Description:          strings.TrimSpace(req.Description),
		Images:               req.Images,
		PricePerUnit:         req.PricePerUnit,
		Unit:                 strings.TrimSpace(req.Unit),
		AvailableStock:       req.AvailableStock,
		MinOrder:             req.MinOrder,
		MaxOrder:             req.MaxOrder,
		QualityGrade:         req.QualityGrade,
		Organic:              req.Organic,
		Certified:            req.Certified,
		CertificationDetails: strings.TrimSpace(req.CertificationDetails),
		HarvestDate:          harvestDate,
		ShelfLife:            req.ShelfLife,
		StorageTips:          strings.TrimSpace(req.StorageTips),
		WeightRange:          strings.TrimSpace(req.WeightRange),
		Color:                strings.TrimSpace(req.Color),
		Size:                 strings.TrimSpace(req.Size),
		Variety:              strings.TrimSpace(req.Variety),
		FarmLocation:         strings.TrimSpace(req.FarmLocation),
		Latitude:             req.Latitude,
		Longitude:            req.Longitude,
		Status:               model.StatusDraft,
		IsFeatured:           false,
		Rating:               0,
		ReviewCount:          0,
		CreatedAt:            time.Now(),
		UpdatedAt:            time.Now(),
		ExpiryDate:           expiryDate,
	}

	if err := s.productRepo.Create(ctx, product); err != nil {
		log.Printf("Error creating product: %v", err)
		return nil, err
	}

	log.Printf("Successfully created product with ID: %s", product.ID)
	return product, nil
}

func (s *productService) GetProductByID(ctx context.Context, id uuid.UUID) (*dto.ProductResponse, error) {
	product, err := s.productRepo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if product == nil {
		return nil, ErrProductNotFound
	}

	return s.toProductResponse(product), nil
}

func (s *productService) GetProductsByFarmer(ctx context.Context, farmerID uuid.UUID) ([]*dto.ProductResponse, error) {
	products, err := s.productRepo.FindByFarmerID(ctx, farmerID)
	if err != nil {
		return nil, err
	}

	responses := make([]*dto.ProductResponse, len(products))
	for i, product := range products {
		responses[i] = s.toProductResponse(product)
	}

	return responses, nil
}

func (s *productService) UpdateProduct(ctx context.Context, productID uuid.UUID, farmerID uuid.UUID, req *dto.UpdateProductRequest) (*dto.ProductResponse, error) {
	product, err := s.productRepo.FindByID(ctx, productID)
	if err != nil {
		return nil, err
	}
	if product == nil {
		return nil, ErrProductNotFound
	}

	// Check if the farmer owns this product
	if product.FarmerID != farmerID {
		return nil, ErrUnauthorizedAccess
	}

	// Update fields if provided
	if req.Name != "" {
		product.Name = strings.TrimSpace(req.Name)
	}
	if req.Description != "" {
		product.Description = strings.TrimSpace(req.Description)
	}
	if req.Images != nil {
		product.Images = req.Images
	}
	if req.PricePerUnit > 0 {
		product.PricePerUnit = req.PricePerUnit
	}
	if req.AvailableStock >= 0 {
		product.AvailableStock = req.AvailableStock
	}
	if req.MinOrder > 0 {
		product.MinOrder = req.MinOrder
	}
	if req.MaxOrder > 0 {
		product.MaxOrder = req.MaxOrder
	}
	if req.StorageTips != "" {
		product.StorageTips = strings.TrimSpace(req.StorageTips)
	}
	if req.Status != "" {
		product.Status = req.Status
	}

	product.UpdatedAt = time.Now()

	if err := s.productRepo.Update(ctx, product); err != nil {
		return nil, err
	}

	return s.toProductResponse(product), nil
}

func (s *productService) DeleteProduct(ctx context.Context, productID uuid.UUID, farmerID uuid.UUID) error {
	product, err := s.productRepo.FindByID(ctx, productID)
	if err != nil {
		return err
	}
	if product == nil {
		return ErrProductNotFound
	}

	// Check if the farmer owns this product
	if product.FarmerID != farmerID {
		return ErrUnauthorizedAccess
	}

	return s.productRepo.Delete(ctx, productID)
}

func (s *productService) GetAllProducts(ctx context.Context, filters dto.ProductFilterRequest) (*dto.ProductListResponse, error) {
	// Set default values
	if filters.Page == 0 {
		filters.Page = 1
	}
	if filters.PageSize == 0 {
		filters.PageSize = 10
	}

	products, total, err := s.productRepo.FindAllWithFilters(ctx, filters)
	if err != nil {
		return nil, err
	}

	responses := make([]*dto.ProductResponse, len(products))
	for i, product := range products {
		responses[i] = s.toProductResponse(product)
	}

	pages := int(math.Ceil(float64(total) / float64(filters.PageSize)))
	hasMore := filters.Page < pages

	return &dto.ProductListResponse{
		Products: responses,
		Total:    total,
		Page:     filters.Page,
		Pages:    pages,
		HasMore:  hasMore,
	}, nil
}

func (s *productService) UpdateStock(ctx context.Context, productID uuid.UUID, farmerID uuid.UUID, quantity float64) error {
	product, err := s.productRepo.FindByID(ctx, productID)
	if err != nil {
		return err
	}
	if product == nil {
		return ErrProductNotFound
	}

	// Check if the farmer owns this product
	if product.FarmerID != farmerID {
		return ErrUnauthorizedAccess
	}

	if quantity < 0 {
		return errors.New("stock quantity cannot be negative")
	}

	return s.productRepo.UpdateStock(ctx, productID, quantity)
}

func (s *productService) UpdateProductStatus(ctx context.Context, productID uuid.UUID, farmerID uuid.UUID, status model.ProductStatus) error {
	product, err := s.productRepo.FindByID(ctx, productID)
	if err != nil {
		return err
	}
	if product == nil {
		return ErrProductNotFound
	}

	// Check if the farmer owns this product
	if product.FarmerID != farmerID {
		return ErrUnauthorizedAccess
	}

	return s.productRepo.UpdateStatus(ctx, productID, status)
}

func (s *productService) GetFeaturedProducts(ctx context.Context, limit int) ([]*dto.ProductResponse, error) {
	if limit == 0 {
		limit = 10
	}

	products, err := s.productRepo.FindFeaturedProducts(ctx, limit)
	if err != nil {
		return nil, err
	}

	responses := make([]*dto.ProductResponse, len(products))
	for i, product := range products {
		responses[i] = s.toProductResponse(product)
	}

	return responses, nil
}

func (s *productService) GetProductsByCategory(ctx context.Context, category model.ProductCategory, page, pageSize int) (*dto.ProductListResponse, error) {
	if page == 0 {
		page = 1
	}
	if pageSize == 0 {
		pageSize = 10
	}

	products, total, err := s.productRepo.FindByCategory(ctx, category, page, pageSize)
	if err != nil {
		return nil, err
	}

	responses := make([]*dto.ProductResponse, len(products))
	for i, product := range products {
		responses[i] = s.toProductResponse(product)
	}

	pages := int(math.Ceil(float64(total) / float64(pageSize)))
	hasMore := page < pages

	return &dto.ProductListResponse{
		Products: responses,
		Total:    total,
		Page:     page,
		Pages:    pages,
		HasMore:  hasMore,
	}, nil
}

func (s *productService) SearchProducts(ctx context.Context, query string, page, pageSize int) (*dto.ProductListResponse, error) {
	// For now, use GetAllProducts with search filter
	// In a real implementation, you'd have a dedicated search method
	filters := dto.ProductFilterRequest{
		Page:     page,
		PageSize: pageSize,
	}

	return s.GetAllProducts(ctx, filters)
}

func (s *productService) BulkUpdateExpiredProducts(ctx context.Context) error {
	expiredProducts, err := s.productRepo.GetExpiredProducts(ctx)
	if err != nil {
		return err
	}

	if len(expiredProducts) == 0 {
		return nil
	}

	var productIDs []uuid.UUID
	for _, product := range expiredProducts {
		productIDs = append(productIDs, product.ID)
	}

	return s.productRepo.BulkUpdateStatus(ctx, productIDs, model.StatusExpired)
}

// Helper methods
func (s *productService) toProductResponse(product *model.Product) *dto.ProductResponse {
	return &dto.ProductResponse{
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
		CreatedAt:            product.CreatedAt,
	}
}
