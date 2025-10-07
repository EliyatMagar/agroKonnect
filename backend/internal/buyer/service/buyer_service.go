package service

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	dto "agro_konnect/internal/buyer/dto"
	model "agro_konnect/internal/buyer/model"
	"agro_konnect/internal/buyer/repository"
	"errors"

	"github.com/google/uuid"
	"gorm.io/datatypes"
)

var (
	ErrBuyerNotFound       = errors.New("buyer not found")
	ErrBuyerAlreadyExists  = errors.New("buyer profile already exists for this user")
	ErrInvalidBusinessData = errors.New("invalid business data")
	ErrUnauthorizedAccess  = errors.New("unauthorized access to buyer profile")
)

type BuyerService interface {
	CreateBuyer(ctx context.Context, userID uuid.UUID, req *dto.CreateBuyerRequest) (*model.Buyer, error)
	GetBuyerByID(ctx context.Context, id uuid.UUID) (*dto.BuyerResponse, error)
	GetBuyerByUserID(ctx context.Context, userID uuid.UUID) (*dto.BuyerResponse, error)
	UpdateBuyer(ctx context.Context, buyerID uuid.UUID, userID uuid.UUID, req *dto.CreateBuyerRequest) (*dto.BuyerResponse, error)
	DeleteBuyer(ctx context.Context, buyerID uuid.UUID, userID uuid.UUID) error
	GetAllBuyers(ctx context.Context, filters dto.BuyerFilterRequest) (*dto.BuyerListResponse, error)
	VerifyBuyer(ctx context.Context, buyerID uuid.UUID) error
	UpdatePremiumStatus(ctx context.Context, buyerID uuid.UUID, premium bool) error
	UpdateBuyerRating(ctx context.Context, buyerID uuid.UUID, rating float64) error
	UpdateCreditLimit(ctx context.Context, buyerID uuid.UUID, creditLimit float64) error
	GetBuyerStats(ctx context.Context, buyerID uuid.UUID) (*dto.BuyerStatsResponse, error)
}

type buyerService struct {
	buyerRepo repository.BuyerRepository
}

func NewBuyerService(buyerRepo repository.BuyerRepository) BuyerService {
	return &buyerService{
		buyerRepo: buyerRepo,
	}
}

func (s *buyerService) CreateBuyer(ctx context.Context, userID uuid.UUID, req *dto.CreateBuyerRequest) (*model.Buyer, error) {
	// Check if buyer already exists for this user
	existingBuyer, err := s.buyerRepo.FindByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if existingBuyer != nil {
		return nil, ErrBuyerAlreadyExists
	}

	// Validate business data
	if err := s.validateBusinessData(req); err != nil {
		return nil, err
	}

	// Convert arrays to JSON
	preferredProductsJSON, err := json.Marshal(req.PreferredProducts)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal preferred products: %w", err)
	}

	qualityStandardsJSON, err := json.Marshal(req.QualityStandards)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal quality standards: %w", err)
	}

	buyer := &model.Buyer{
		ID:            uuid.New(),
		UserID:        userID,
		BusinessName:  req.BusinessName,
		BusinessType:  req.BusinessType,
		BusinessScale: req.BusinessScale,
		Description:   req.Description,

		Address: req.Address,
		City:    req.City,
		State:   req.State,
		Country: req.Country,
		ZipCode: req.ZipCode,

		ContactPerson:  req.ContactPerson,
		Designation:    req.Designation,
		AlternatePhone: req.AlternatePhone,
		Website:        req.Website,

		BusinessLicense: req.BusinessLicense,
		TaxID:           req.TaxID,
		YearEstablished: req.YearEstablished,
		EmployeeCount:   req.EmployeeCount,

		MonthlyVolume:     req.MonthlyVolume,
		PreferredProducts: datatypes.JSON(preferredProductsJSON),
		QualityStandards:  datatypes.JSON(qualityStandardsJSON),

		IsVerified:     false,
		IsPremium:      false,
		Rating:         0,
		CreditLimit:    0,
		CurrentBalance: 0,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	if err := s.buyerRepo.Create(ctx, buyer); err != nil {
		return nil, fmt.Errorf("failed to create buyer: %w", err)
	}

	return buyer, nil
}
func (s *buyerService) GetBuyerByID(ctx context.Context, id uuid.UUID) (*dto.BuyerResponse, error) {
	buyer, err := s.buyerRepo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if buyer == nil {
		return nil, ErrBuyerNotFound
	}

	return s.toBuyerResponse(buyer), nil
}

func (s *buyerService) GetBuyerByUserID(ctx context.Context, userID uuid.UUID) (*dto.BuyerResponse, error) {
	buyer, err := s.buyerRepo.FindByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if buyer == nil {
		return nil, ErrBuyerNotFound
	}

	return s.toBuyerResponse(buyer), nil
}

func (s *buyerService) UpdateBuyer(ctx context.Context, buyerID uuid.UUID, userID uuid.UUID, req *dto.CreateBuyerRequest) (*dto.BuyerResponse, error) {
	buyer, err := s.buyerRepo.FindByID(ctx, buyerID)
	if err != nil {
		return nil, err
	}
	if buyer == nil {
		return nil, ErrBuyerNotFound
	}

	// Check if the user owns this buyer profile
	if buyer.UserID != userID {
		return nil, ErrUnauthorizedAccess
	}

	// Validate business data
	if err := s.validateBusinessData(req); err != nil {
		return nil, err
	}

	// Convert arrays to JSON
	preferredProductsJSON, err := json.Marshal(req.PreferredProducts)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal preferred products: %w", err)
	}

	qualityStandardsJSON, err := json.Marshal(req.QualityStandards)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal quality standards: %w", err)
	}

	// Update fields
	buyer.BusinessName = req.BusinessName
	buyer.BusinessType = req.BusinessType
	buyer.BusinessScale = req.BusinessScale
	buyer.Description = req.Description

	buyer.Address = req.Address
	buyer.City = req.City
	buyer.State = req.State
	buyer.Country = req.Country
	buyer.ZipCode = req.ZipCode

	buyer.ContactPerson = req.ContactPerson
	buyer.Designation = req.Designation
	buyer.AlternatePhone = req.AlternatePhone
	buyer.Website = req.Website

	buyer.BusinessLicense = req.BusinessLicense
	buyer.TaxID = req.TaxID
	buyer.YearEstablished = req.YearEstablished
	buyer.EmployeeCount = req.EmployeeCount

	buyer.MonthlyVolume = req.MonthlyVolume
	buyer.PreferredProducts = datatypes.JSON(preferredProductsJSON)
	buyer.QualityStandards = datatypes.JSON(qualityStandardsJSON)

	buyer.UpdatedAt = time.Now()

	if err := s.buyerRepo.Update(ctx, buyer); err != nil {
		return nil, err
	}

	return s.toBuyerResponse(buyer), nil
}

func (s *buyerService) DeleteBuyer(ctx context.Context, buyerID uuid.UUID, userID uuid.UUID) error {
	buyer, err := s.buyerRepo.FindByID(ctx, buyerID)
	if err != nil {
		return err
	}
	if buyer == nil {
		return ErrBuyerNotFound
	}

	// Check if the user owns this buyer profile
	if buyer.UserID != userID {
		return ErrUnauthorizedAccess
	}

	return s.buyerRepo.Delete(ctx, buyerID)
}

func (s *buyerService) GetAllBuyers(ctx context.Context, filters dto.BuyerFilterRequest) (*dto.BuyerListResponse, error) {
	repoFilters := repository.BuyerFilter{
		BusinessType:     filters.BusinessType,
		BusinessScale:    filters.BusinessScale,
		City:             filters.City,
		State:            filters.State,
		MinMonthlyVolume: filters.MinMonthlyVolume,
		PreferredProduct: filters.PreferredProduct,
		Page:             filters.Page,
		PageSize:         filters.PageSize,
	}

	buyers, total, err := s.buyerRepo.FindAllWithFilters(ctx, repoFilters)
	if err != nil {
		return nil, err
	}

	responses := make([]*dto.BuyerResponse, len(buyers))
	for i, buyer := range buyers {
		responses[i] = s.toBuyerResponse(buyer)
	}

	pages := int((total + int64(filters.PageSize) - 1) / int64(filters.PageSize))
	hasMore := filters.Page < pages

	return &dto.BuyerListResponse{
		Buyers:  responses,
		Total:   total,
		Page:    filters.Page,
		Pages:   pages,
		HasMore: hasMore,
	}, nil
}

func (s *buyerService) VerifyBuyer(ctx context.Context, buyerID uuid.UUID) error {
	return s.buyerRepo.UpdateVerificationStatus(ctx, buyerID, true)
}

func (s *buyerService) UpdatePremiumStatus(ctx context.Context, buyerID uuid.UUID, premium bool) error {
	return s.buyerRepo.UpdatePremiumStatus(ctx, buyerID, premium)
}

func (s *buyerService) UpdateBuyerRating(ctx context.Context, buyerID uuid.UUID, rating float64) error {
	if rating < 0 || rating > 5 {
		return errors.New("rating must be between 0 and 5")
	}
	return s.buyerRepo.UpdateRating(ctx, buyerID, rating)
}

func (s *buyerService) UpdateCreditLimit(ctx context.Context, buyerID uuid.UUID, creditLimit float64) error {
	if creditLimit < 0 {
		return errors.New("credit limit cannot be negative")
	}
	return s.buyerRepo.UpdateCreditLimit(ctx, buyerID, creditLimit)
}

func (s *buyerService) GetBuyerStats(ctx context.Context, buyerID uuid.UUID) (*dto.BuyerStatsResponse, error) {
	stats, err := s.buyerRepo.GetBuyerStats(ctx, buyerID)
	if err != nil {
		return nil, err
	}

	return &dto.BuyerStatsResponse{
		TotalOrders:     stats.TotalOrders,
		CompletedOrders: stats.CompletedOrders,
		TotalSpent:      stats.TotalSpent,
		FavoriteFarmers: stats.FavoriteFarmers,
		AverageRating:   stats.AverageRating,
	}, nil
}

// Helper methods
func (s *buyerService) toBuyerResponse(buyer *model.Buyer) *dto.BuyerResponse {
	// Convert JSON arrays back to string slices
	var preferredProducts []string
	if len(buyer.PreferredProducts) > 0 {
		json.Unmarshal(buyer.PreferredProducts, &preferredProducts)
	}

	return &dto.BuyerResponse{
		ID:            buyer.ID,
		UserID:        buyer.UserID,
		BusinessName:  buyer.BusinessName,
		BusinessType:  buyer.BusinessType,
		BusinessScale: buyer.BusinessScale,
		Description:   buyer.Description,

		Address: buyer.Address,
		City:    buyer.City,
		State:   buyer.State,
		Country: buyer.Country,

		ContactPerson: buyer.ContactPerson,
		Website:       buyer.Website,

		IsVerified: buyer.IsVerified,
		IsPremium:  buyer.IsPremium,
		Rating:     buyer.Rating,

		MonthlyVolume:     buyer.MonthlyVolume,
		PreferredProducts: preferredProducts, // Now converted from JSON

		YearEstablished: buyer.YearEstablished,
		EmployeeCount:   buyer.EmployeeCount,

		CreatedAt: buyer.CreatedAt,
	}
}

func (s *buyerService) validateBusinessData(req *dto.CreateBuyerRequest) error {
	if req.YearEstablished > time.Now().Year() {
		return errors.New("year established cannot be in the future")
	}

	if req.EmployeeCount < 0 {
		return errors.New("employee count cannot be negative")
	}

	if req.MonthlyVolume < 0 {
		return errors.New("monthly volume cannot be negative")
	}

	return nil
}
