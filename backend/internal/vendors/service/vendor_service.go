package service

import (
	"context"
	"fmt"
	"log"
	"math"
	"strings"
	"time"

	dto "agro_konnect/internal/vendors/dto"
	model "agro_konnect/internal/vendors/model"
	"agro_konnect/internal/vendors/repository"
	"errors"

	"github.com/google/uuid"
)

var (
	ErrVendorNotFound      = errors.New("vendor not found")
	ErrVendorAlreadyExists = errors.New("vendor profile already exists for this user")
	ErrInvalidVendorData   = errors.New("invalid vendor data")
	ErrUnauthorized        = errors.New("unauthorized")
	ErrInvalidLocation     = errors.New("invalid location coordinates")
)

type VendorService interface {
	CreateVendor(ctx context.Context, userID uuid.UUID, req *dto.CreateVendorRequest) (*model.Vendor, error)
	GetVendorByID(ctx context.Context, id uuid.UUID) (*dto.VendorResponse, error)
	GetVendorByUserID(ctx context.Context, userID uuid.UUID) (*dto.VendorResponse, error)
	UpdateVendor(ctx context.Context, userID uuid.UUID, req *dto.UpdateVendorRequest) (*dto.VendorResponse, error)
	DeleteVendor(ctx context.Context, userID uuid.UUID) error
	GetAllVendors(ctx context.Context, filters dto.VendorFilterRequest) (*dto.VendorListResponse, error)
	GetVendorStats(ctx context.Context, vendorID uuid.UUID) (*dto.VendorStatsResponse, error)
	VerifyVendor(ctx context.Context, vendorID uuid.UUID) error
	GetNearbyVendors(ctx context.Context, lat, lng, radius float64) ([]*dto.VendorResponse, error)
	SearchVendors(ctx context.Context, query string, page, pageSize int) (*dto.VendorListResponse, error)
}

type vendorService struct {
	vendorRepo        repository.VendorRepository
	vendorProductRepo repository.VendorProductRepository
}

func NewVendorService(vendorRepo repository.VendorRepository, vendorProductRepo repository.VendorProductRepository) VendorService {
	return &vendorService{
		vendorRepo:        vendorRepo,
		vendorProductRepo: vendorProductRepo,
	}
}

func (s *vendorService) CreateVendor(ctx context.Context, userID uuid.UUID, req *dto.CreateVendorRequest) (*model.Vendor, error) {
	log.Printf("Creating vendor profile for user: %s", userID)

	// Check if vendor already exists for this user
	exists, err := s.vendorRepo.ExistsByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrVendorAlreadyExists
	}

	// Validate year established
	if req.YearEstablished > time.Now().Year() {
		return nil, errors.New("year established cannot be in the future")
	}

	vendor := &model.Vendor{
		ID:              uuid.New(),
		UserID:          userID,
		CompanyName:     strings.TrimSpace(req.CompanyName),
		BrandName:       strings.TrimSpace(req.BrandName),
		Description:     strings.TrimSpace(req.Description),
		VendorType:      req.VendorType,
		BusinessType:    strings.TrimSpace(req.BusinessType),
		Address:         strings.TrimSpace(req.Address),
		City:            strings.TrimSpace(req.City),
		State:           strings.TrimSpace(req.State),
		Country:         strings.TrimSpace(req.Country),
		ZipCode:         strings.TrimSpace(req.ZipCode),
		ContactPerson:   strings.TrimSpace(req.ContactPerson),
		Designation:     strings.TrimSpace(req.Designation),
		AlternatePhone:  req.AlternatePhone,
		Website:         req.Website,
		BusinessLicense: strings.TrimSpace(req.BusinessLicense),
		TaxID:           strings.TrimSpace(req.TaxID),
		YearEstablished: req.YearEstablished,
		EmployeeCount:   req.EmployeeCount,
		IsVerified:      false,
		IsPremium:       false,
		Rating:          0,
		ReviewCount:     0,
		CreditLimit:     0,
		CurrentBalance:  0,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	if err := s.vendorRepo.Create(ctx, vendor); err != nil {
		log.Printf("Error creating vendor: %v", err)
		return nil, err
	}

	log.Printf("Successfully created vendor profile with ID: %s", vendor.ID)
	return vendor, nil
}

func (s *vendorService) GetVendorByID(ctx context.Context, id uuid.UUID) (*dto.VendorResponse, error) {
	vendor, err := s.vendorRepo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if vendor == nil {
		return nil, ErrVendorNotFound
	}

	return s.toVendorResponse(ctx, vendor), nil
}

func (s *vendorService) GetVendorByUserID(ctx context.Context, userID uuid.UUID) (*dto.VendorResponse, error) {
	vendor, err := s.vendorRepo.FindByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if vendor == nil {
		return nil, ErrVendorNotFound
	}

	return s.toVendorResponse(ctx, vendor), nil
}

func (s *vendorService) UpdateVendor(ctx context.Context, userID uuid.UUID, req *dto.UpdateVendorRequest) (*dto.VendorResponse, error) {
	vendor, err := s.vendorRepo.FindByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if vendor == nil {
		return nil, ErrVendorNotFound
	}

	// Update fields if provided
	if req.CompanyName != "" {
		vendor.CompanyName = strings.TrimSpace(req.CompanyName)
	}
	if req.BrandName != "" {
		vendor.BrandName = strings.TrimSpace(req.BrandName)
	}
	if req.Description != "" {
		vendor.Description = strings.TrimSpace(req.Description)
	}
	if req.Address != "" {
		vendor.Address = strings.TrimSpace(req.Address)
	}
	if req.City != "" {
		vendor.City = strings.TrimSpace(req.City)
	}
	if req.State != "" {
		vendor.State = strings.TrimSpace(req.State)
	}
	if req.ZipCode != "" {
		vendor.ZipCode = strings.TrimSpace(req.ZipCode)
	}
	if req.ContactPerson != "" {
		vendor.ContactPerson = strings.TrimSpace(req.ContactPerson)
	}
	if req.Designation != "" {
		vendor.Designation = strings.TrimSpace(req.Designation)
	}
	if req.AlternatePhone != "" {
		vendor.AlternatePhone = req.AlternatePhone
	}
	if req.Website != "" {
		vendor.Website = req.Website
	}
	if req.TaxID != "" {
		vendor.TaxID = strings.TrimSpace(req.TaxID)
	}
	if req.EmployeeCount > 0 {
		vendor.EmployeeCount = req.EmployeeCount
	}

	vendor.UpdatedAt = time.Now()

	if err := s.vendorRepo.Update(ctx, vendor); err != nil {
		return nil, err
	}

	return s.toVendorResponse(ctx, vendor), nil
}

func (s *vendorService) DeleteVendor(ctx context.Context, userID uuid.UUID) error {
	vendor, err := s.vendorRepo.FindByUserID(ctx, userID)
	if err != nil {
		return err
	}
	if vendor == nil {
		return ErrVendorNotFound
	}

	return s.vendorRepo.Delete(ctx, vendor.ID)
}

func (s *vendorService) GetAllVendors(ctx context.Context, filters dto.VendorFilterRequest) (*dto.VendorListResponse, error) {
	// Sanitize filters
	filters.Sanitize()

	vendors, total, err := s.vendorRepo.FindAllWithFilters(ctx, filters)
	if err != nil {
		return nil, err
	}

	responses := make([]*dto.VendorResponse, len(vendors))
	for i, vendor := range vendors {
		responses[i] = s.toVendorResponse(ctx, vendor)
	}

	pages := int(math.Ceil(float64(total) / float64(filters.PageSize)))
	hasMore := filters.Page < pages

	return &dto.VendorListResponse{
		Vendors: responses,
		Total:   total,
		Page:    filters.Page,
		Pages:   pages,
		HasMore: hasMore,
	}, nil
}

func (s *vendorService) GetVendorStats(ctx context.Context, vendorID uuid.UUID) (*dto.VendorStatsResponse, error) {
	vendor, err := s.vendorRepo.FindByID(ctx, vendorID)
	if err != nil {
		return nil, err
	}
	if vendor == nil {
		return nil, ErrVendorNotFound
	}

	// Get product statistics
	productCount, err := s.vendorRepo.GetProductCount(ctx, vendorID)
	if err != nil {
		log.Printf("Error getting product count: %v", err)
	}

	// Note: Order-related stats would come from an order service
	stats := &dto.VendorStatsResponse{
		TotalProducts:    productCount,
		ActiveProducts:   productCount, // Assuming all are active for simplicity
		TotalOrders:      0,            // Would come from order service
		CompletedOrders:  0,            // Would come from order service
		PendingOrders:    0,            // Would come from order service
		TotalRevenue:     0,            // Would come from order service
		AverageRating:    vendor.Rating,
		CustomerCount:    0, // Would come from order service
		ThisMonthRevenue: 0, // Would come from order service
	}

	return stats, nil
}

func (s *vendorService) VerifyVendor(ctx context.Context, vendorID uuid.UUID) error {
	vendor, err := s.vendorRepo.FindByID(ctx, vendorID)
	if err != nil {
		return err
	}
	if vendor == nil {
		return ErrVendorNotFound
	}

	vendor.IsVerified = true
	vendor.UpdatedAt = time.Now()

	return s.vendorRepo.Update(ctx, vendor)
}

func (s *vendorService) GetNearbyVendors(ctx context.Context, lat, lng, radius float64) ([]*dto.VendorResponse, error) {
	// Validate coordinates
	if err := s.validateCoordinates(lat, lng); err != nil {
		return nil, err
	}

	// Validate radius
	if radius <= 0 || radius > 1000 {
		return nil, errors.New("radius must be between 1 and 1000 km")
	}

	vendors, err := s.vendorRepo.FindNearby(ctx, lat, lng, radius)
	if err != nil {
		return nil, err
	}

	responses := make([]*dto.VendorResponse, len(vendors))
	for i, vendor := range vendors {
		responses[i] = s.toVendorResponse(ctx, vendor)
	}

	return responses, nil
}

func (s *vendorService) SearchVendors(ctx context.Context, query string, page, pageSize int) (*dto.VendorListResponse, error) {
	filters := dto.VendorFilterRequest{
		Search:    strings.TrimSpace(query),
		Page:      page,
		PageSize:  pageSize,
		SortBy:    "rating",
		SortOrder: "desc",
	}

	return s.GetAllVendors(ctx, filters)
}

// Helper methods
func (s *vendorService) toVendorResponse(ctx context.Context, vendor *model.Vendor) *dto.VendorResponse {
	productCount, _ := s.vendorRepo.GetProductCount(ctx, vendor.ID)

	return &dto.VendorResponse{
		ID:              vendor.ID,
		UserID:          vendor.UserID,
		CompanyName:     vendor.CompanyName,
		BrandName:       vendor.BrandName,
		Description:     vendor.Description,
		VendorType:      vendor.VendorType,
		BusinessType:    vendor.BusinessType,
		Address:         vendor.Address,
		City:            vendor.City,
		State:           vendor.State,
		Country:         vendor.Country,
		ContactPerson:   vendor.ContactPerson,
		Website:         vendor.Website,
		IsVerified:      vendor.IsVerified,
		IsPremium:       vendor.IsPremium,
		Rating:          vendor.Rating,
		ReviewCount:     vendor.ReviewCount,
		ProductCount:    productCount,
		YearEstablished: vendor.YearEstablished,
		CreatedAt:       vendor.CreatedAt,
	}
}

func (s *vendorService) validateCoordinates(lat, lng float64) error {
	if lat < -90 || lat > 90 {
		return fmt.Errorf("latitude must be between -90 and 90, got: %f", lat)
	}
	if lng < -180 || lng > 180 {
		return fmt.Errorf("longitude must be between -180 and 180, got: %f", lng)
	}
	return nil
}
