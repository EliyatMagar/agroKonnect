package service

import (
	"context"
	"log"
	"strings"
	"time"

	dto "agro_konnect/internal/vendors/dto"
	model "agro_konnect/internal/vendors/model"
	"agro_konnect/internal/vendors/repository"
	"errors"

	"github.com/google/uuid"
)

var (
	ErrVendorProductNotFound = errors.New("vendor product not found")
	ErrInsufficientStock     = errors.New("insufficient stock")
)

type VendorProductService interface {
	AddProduct(ctx context.Context, userID uuid.UUID, req *dto.AddVendorProductRequest) (*model.VendorProduct, error)
	GetProductByID(ctx context.Context, id uuid.UUID) (*dto.VendorProductResponse, error)
	GetProductsByVendor(ctx context.Context, userID uuid.UUID) ([]*dto.VendorProductResponse, error)
	UpdateProduct(ctx context.Context, productID uuid.UUID, userID uuid.UUID, req *dto.UpdateVendorProductRequest) (*dto.VendorProductResponse, error)
	DeleteProduct(ctx context.Context, productID uuid.UUID, userID uuid.UUID) error
	UpdateStock(ctx context.Context, productID uuid.UUID, userID uuid.UUID, stock int) error
	UpdateProductStatus(ctx context.Context, productID uuid.UUID, userID uuid.UUID, isActive bool) error
	GetActiveProductsByVendor(ctx context.Context, vendorID uuid.UUID) ([]*dto.VendorProductResponse, error)
}

type vendorProductService struct {
	vendorRepo        repository.VendorRepository
	vendorProductRepo repository.VendorProductRepository
}

func NewVendorProductService(vendorRepo repository.VendorRepository, vendorProductRepo repository.VendorProductRepository) VendorProductService {
	return &vendorProductService{
		vendorRepo:        vendorRepo,
		vendorProductRepo: vendorProductRepo,
	}
}

func (s *vendorProductService) AddProduct(ctx context.Context, userID uuid.UUID, req *dto.AddVendorProductRequest) (*model.VendorProduct, error) {
	// Get vendor for this user
	vendor, err := s.vendorRepo.FindByUserID(ctx, userID)
	if err != nil || vendor == nil {
		return nil, ErrVendorNotFound
	}

	product := &model.VendorProduct{
		ID:          uuid.New(),
		VendorID:    vendor.ID,
		Name:        strings.TrimSpace(req.Name),
		Category:    strings.TrimSpace(req.Category),
		Description: strings.TrimSpace(req.Description),
		Brand:       strings.TrimSpace(req.Brand),
		Price:       req.Price,
		Unit:        strings.TrimSpace(req.Unit),
		Stock:       req.Stock,
		MinOrder:    req.MinOrder,
		Images:      req.Images,
		IsActive:    true,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := s.vendorProductRepo.Create(ctx, product); err != nil {
		log.Printf("Error creating vendor product: %v", err)
		return nil, err
	}

	log.Printf("Successfully created vendor product with ID: %s for vendor: %s", product.ID, vendor.ID)
	return product, nil
}

func (s *vendorProductService) GetProductByID(ctx context.Context, id uuid.UUID) (*dto.VendorProductResponse, error) {
	product, err := s.vendorProductRepo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if product == nil {
		return nil, ErrVendorProductNotFound
	}

	return s.toVendorProductResponse(product), nil
}

func (s *vendorProductService) GetProductsByVendor(ctx context.Context, userID uuid.UUID) ([]*dto.VendorProductResponse, error) {
	// Get vendor for this user
	vendor, err := s.vendorRepo.FindByUserID(ctx, userID)
	if err != nil || vendor == nil {
		return nil, ErrVendorNotFound
	}

	products, err := s.vendorProductRepo.FindByVendorID(ctx, vendor.ID)
	if err != nil {
		return nil, err
	}

	responses := make([]*dto.VendorProductResponse, len(products))
	for i, product := range products {
		responses[i] = s.toVendorProductResponse(product)
	}

	return responses, nil
}

func (s *vendorProductService) UpdateProduct(ctx context.Context, productID uuid.UUID, userID uuid.UUID, req *dto.UpdateVendorProductRequest) (*dto.VendorProductResponse, error) {
	// Get vendor for this user
	vendor, err := s.vendorRepo.FindByUserID(ctx, userID)
	if err != nil || vendor == nil {
		return nil, ErrVendorNotFound
	}

	product, err := s.vendorProductRepo.FindByID(ctx, productID)
	if err != nil {
		return nil, err
	}
	if product == nil {
		return nil, ErrVendorProductNotFound
	}

	// Check if the vendor owns this product
	if product.VendorID != vendor.ID {
		return nil, ErrUnauthorized
	}

	// Update fields if provided
	if req.Name != "" {
		product.Name = strings.TrimSpace(req.Name)
	}
	if req.Category != "" {
		product.Category = strings.TrimSpace(req.Category)
	}
	if req.Description != "" {
		product.Description = strings.TrimSpace(req.Description)
	}
	if req.Brand != "" {
		product.Brand = strings.TrimSpace(req.Brand)
	}
	if req.Price > 0 {
		product.Price = req.Price
	}
	if req.Unit != "" {
		product.Unit = strings.TrimSpace(req.Unit)
	}
	if req.Stock >= 0 {
		product.Stock = req.Stock
	}
	if req.MinOrder > 0 {
		product.MinOrder = req.MinOrder
	}
	if req.Images != nil {
		product.Images = req.Images
	}

	product.UpdatedAt = time.Now()

	if err := s.vendorProductRepo.Update(ctx, product); err != nil {
		return nil, err
	}

	return s.toVendorProductResponse(product), nil
}

func (s *vendorProductService) DeleteProduct(ctx context.Context, productID uuid.UUID, userID uuid.UUID) error {
	// Get vendor for this user
	vendor, err := s.vendorRepo.FindByUserID(ctx, userID)
	if err != nil || vendor == nil {
		return ErrVendorNotFound
	}

	product, err := s.vendorProductRepo.FindByID(ctx, productID)
	if err != nil {
		return err
	}
	if product == nil {
		return ErrVendorProductNotFound
	}

	// Check if the vendor owns this product
	if product.VendorID != vendor.ID {
		return ErrUnauthorized
	}

	return s.vendorProductRepo.Delete(ctx, productID)
}

func (s *vendorProductService) UpdateStock(ctx context.Context, productID uuid.UUID, userID uuid.UUID, stock int) error {
	// Get vendor for this user
	vendor, err := s.vendorRepo.FindByUserID(ctx, userID)
	if err != nil || vendor == nil {
		return ErrVendorNotFound
	}

	product, err := s.vendorProductRepo.FindByID(ctx, productID)
	if err != nil {
		return err
	}
	if product == nil {
		return ErrVendorProductNotFound
	}

	// Check if the vendor owns this product
	if product.VendorID != vendor.ID {
		return ErrUnauthorized
	}

	if stock < 0 {
		return errors.New("stock quantity cannot be negative")
	}

	return s.vendorProductRepo.UpdateStock(ctx, productID, stock)
}

func (s *vendorProductService) UpdateProductStatus(ctx context.Context, productID uuid.UUID, userID uuid.UUID, isActive bool) error {
	// Get vendor for this user
	vendor, err := s.vendorRepo.FindByUserID(ctx, userID)
	if err != nil || vendor == nil {
		return ErrVendorNotFound
	}

	product, err := s.vendorProductRepo.FindByID(ctx, productID)
	if err != nil {
		return err
	}
	if product == nil {
		return ErrVendorProductNotFound
	}

	// Check if the vendor owns this product
	if product.VendorID != vendor.ID {
		return ErrUnauthorized
	}

	return s.vendorProductRepo.UpdateStatus(ctx, productID, isActive)
}

func (s *vendorProductService) GetActiveProductsByVendor(ctx context.Context, vendorID uuid.UUID) ([]*dto.VendorProductResponse, error) {
	products, err := s.vendorProductRepo.FindActiveByVendorID(ctx, vendorID)
	if err != nil {
		return nil, err
	}

	responses := make([]*dto.VendorProductResponse, len(products))
	for i, product := range products {
		responses[i] = s.toVendorProductResponse(product)
	}

	return responses, nil
}

// Helper methods
func (s *vendorProductService) toVendorProductResponse(product *model.VendorProduct) *dto.VendorProductResponse {
	return &dto.VendorProductResponse{
		ID:          product.ID,
		VendorID:    product.VendorID,
		Name:        product.Name,
		Category:    product.Category,
		Description: product.Description,
		Brand:       product.Brand,
		Price:       product.Price,
		Unit:        product.Unit,
		Stock:       product.Stock,
		MinOrder:    product.MinOrder,
		Images:      product.Images,
		IsActive:    product.IsActive,
		CreatedAt:   product.CreatedAt,
	}
}
