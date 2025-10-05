package service

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"time"

	dto "agro_konnect/internal/farmer/dto"
	model "agro_konnect/internal/farmer/model"
	"agro_konnect/internal/farmer/repository"
	"errors"
	"strings"

	"github.com/google/uuid"
	"gorm.io/datatypes"
)

var (
	ErrFarmerNotFound      = errors.New("farmer not found")
	ErrFarmerAlreadyExists = errors.New("farmer profile already exists for this user")
	ErrInvalidFarmData     = errors.New("invalid farm data")
	ErrUnauthorized        = errors.New("unauthorized")
	ErrInvalidLocation     = errors.New("invalid location coordinates")
	ErrInvalidDate         = errors.New("invalid date format")
)

type FarmerService interface {
	CreateFarmer(ctx context.Context, userID uuid.UUID, req *dto.CreateFarmerRequest) (*model.Farmer, error)
	GetFarmerByID(ctx context.Context, id uuid.UUID) (*dto.FarmerResponse, error)
	GetFarmerByUserID(ctx context.Context, userID uuid.UUID) (*dto.FarmerResponse, error)
	UpdateFarmer(ctx context.Context, userID uuid.UUID, req *dto.UpdateFarmerRequest) (*dto.FarmerResponse, error)
	DeleteFarmer(ctx context.Context, userID uuid.UUID) error
	GetAllFarmers(ctx context.Context, filters dto.FarmerFilterRequest) (*dto.FarmerListResponse, error)
	GetFarmerStats(ctx context.Context, farmerID uuid.UUID) (*dto.FarmerStatsResponse, error)
	VerifyFarmer(ctx context.Context, farmerID uuid.UUID) error
	GetNearbyFarmers(ctx context.Context, lat, lng, radius float64) ([]*dto.FarmerResponse, error)
	SearchFarmers(ctx context.Context, query string, page, pageSize int) (*dto.FarmerListResponse, error)
	BulkUpdateRatings(ctx context.Context, farmerRatings map[uuid.UUID]float64) error
}

type farmerService struct {
	farmerRepo repository.FarmerRepository
}

func NewFarmerService(farmerRepo repository.FarmerRepository) FarmerService {
	return &farmerService{
		farmerRepo: farmerRepo,
	}
}

func (s *farmerService) CreateFarmer(ctx context.Context, userID uuid.UUID, req *dto.CreateFarmerRequest) (*model.Farmer, error) {
	log.Printf("Creating farmer profile for user: %s", userID)

	// Check if farmer already exists for this user
	exists, err := s.farmerRepo.ExistsByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrFarmerAlreadyExists
	}

	// Validate location coordinates
	if err := s.validateCoordinates(req.Latitude, req.Longitude); err != nil {
		return nil, err
	}

	// Parse date of birth
	dob, err := time.Parse("2006-01-02", req.DateOfBirth)
	if err != nil {
		return nil, ErrInvalidDate
	}

	// Validate date of birth (must be at least 18 years old)
	if !s.isValidDateOfBirth(dob) {
		return nil, errors.New("farmer must be at least 18 years old")
	}

	// Convert certifications to JSON
	certificationsJSON, err := s.certificationsToJSON(req.Certifications)
	if err != nil {
		return nil, fmt.Errorf("failed to serialize certifications: %v", err)
	}

	farmer := &model.Farmer{
		ID:              uuid.New(),
		UserID:          userID,
		FullName:        strings.TrimSpace(req.FullName),
		ProfilePicture:  req.ProfilePicture,
		DateOfBirth:     dob,
		ExperienceYears: req.ExperienceYears,
		FarmName:        strings.TrimSpace(req.FarmName),
		FarmDescription: strings.TrimSpace(req.FarmDescription),
		FarmType:        req.FarmType,
		Certifications:  certificationsJSON,
		Address:         strings.TrimSpace(req.Address),
		City:            strings.TrimSpace(req.City),
		State:           strings.TrimSpace(req.State),
		Country:         strings.TrimSpace(req.Country),
		ZipCode:         strings.TrimSpace(req.ZipCode),
		Latitude:        req.Latitude,
		Longitude:       req.Longitude,
		AlternatePhone:  req.AlternatePhone,
		Website:         req.Website,
		TotalLandArea:   req.TotalLandArea,
		EmployeeCount:   req.EmployeeCount,
		IsVerified:      false,
		IsPremium:       false,
		Rating:          0,
		ReviewCount:     0,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	if err := s.farmerRepo.Create(ctx, farmer); err != nil {
		log.Printf("Error creating farmer: %v", err)
		return nil, err
	}

	log.Printf("Successfully created farmer profile with ID: %s", farmer.ID)
	return farmer, nil
}

func (s *farmerService) GetFarmerByID(ctx context.Context, id uuid.UUID) (*dto.FarmerResponse, error) {
	farmer, err := s.farmerRepo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if farmer == nil {
		return nil, ErrFarmerNotFound
	}

	return s.toFarmerResponse(ctx, farmer), nil
}

func (s *farmerService) GetFarmerByUserID(ctx context.Context, userID uuid.UUID) (*dto.FarmerResponse, error) {
	farmer, err := s.farmerRepo.FindByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if farmer == nil {
		return nil, ErrFarmerNotFound
	}

	return s.toFarmerResponse(ctx, farmer), nil
}

func (s *farmerService) UpdateFarmer(ctx context.Context, userID uuid.UUID, req *dto.UpdateFarmerRequest) (*dto.FarmerResponse, error) {
	farmer, err := s.farmerRepo.FindByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if farmer == nil {
		return nil, ErrFarmerNotFound
	}

	// Update fields if provided
	if req.FullName != "" {
		farmer.FullName = strings.TrimSpace(req.FullName)
	}
	if req.ProfilePicture != "" {
		farmer.ProfilePicture = req.ProfilePicture
	}
	if req.FarmDescription != "" {
		farmer.FarmDescription = strings.TrimSpace(req.FarmDescription)
	}
	if req.Certifications != nil {
		certificationsJSON, err := s.certificationsToJSON(req.Certifications)
		if err != nil {
			return nil, fmt.Errorf("failed to serialize certifications: %v", err)
		}
		farmer.Certifications = certificationsJSON
	}
	if req.Address != "" {
		farmer.Address = strings.TrimSpace(req.Address)
	}
	if req.City != "" {
		farmer.City = strings.TrimSpace(req.City)
	}
	if req.State != "" {
		farmer.State = strings.TrimSpace(req.State)
	}
	if req.ZipCode != "" {
		farmer.ZipCode = strings.TrimSpace(req.ZipCode)
	}
	if req.AlternatePhone != "" {
		farmer.AlternatePhone = req.AlternatePhone
	}
	if req.Website != "" {
		farmer.Website = req.Website
	}
	if req.TotalLandArea > 0 {
		farmer.TotalLandArea = req.TotalLandArea
	}
	if req.EmployeeCount > 0 {
		farmer.EmployeeCount = req.EmployeeCount
	}

	farmer.UpdatedAt = time.Now()

	if err := s.farmerRepo.Update(ctx, farmer); err != nil {
		return nil, err
	}

	return s.toFarmerResponse(ctx, farmer), nil
}

func (s *farmerService) DeleteFarmer(ctx context.Context, userID uuid.UUID) error {
	farmer, err := s.farmerRepo.FindByUserID(ctx, userID)
	if err != nil {
		return err
	}
	if farmer == nil {
		return ErrFarmerNotFound
	}

	return s.farmerRepo.Delete(ctx, farmer.ID)
}

func (s *farmerService) GetAllFarmers(ctx context.Context, filters dto.FarmerFilterRequest) (*dto.FarmerListResponse, error) {
	// Sanitize filters
	filters.Sanitize()

	farmers, total, err := s.farmerRepo.FindAllWithFilters(ctx, filters)
	if err != nil {
		return nil, err
	}

	responses := make([]*dto.FarmerResponse, len(farmers))
	for i, farmer := range farmers {
		responses[i] = s.toFarmerResponse(ctx, farmer)
	}

	pages := int(math.Ceil(float64(total) / float64(filters.PageSize)))
	hasMore := filters.Page < pages

	return &dto.FarmerListResponse{
		Farmers: responses,
		Total:   total,
		Page:    filters.Page,
		Pages:   pages,
		HasMore: hasMore,
	}, nil
}

func (s *farmerService) GetFarmerStats(ctx context.Context, farmerID uuid.UUID) (*dto.FarmerStatsResponse, error) {
	farmer, err := s.farmerRepo.FindByID(ctx, farmerID)
	if err != nil {
		return nil, err
	}
	if farmer == nil {
		return nil, ErrFarmerNotFound
	}

	// Get product statistics
	productCount, err := s.farmerRepo.GetProductCount(ctx, farmerID)
	if err != nil {
		log.Printf("Error getting product count: %v", err)
	}

	activeListings, err := s.farmerRepo.GetActiveListingsCount(ctx, farmerID)
	if err != nil {
		log.Printf("Error getting active listings count: %v", err)
	}

	// Note: Order-related stats would come from an order service
	stats := &dto.FarmerStatsResponse{
		TotalProducts:    productCount,
		ActiveListings:   activeListings,
		TotalOrders:      0, // Would come from order service
		CompletedOrders:  0, // Would come from order service
		PendingOrders:    0, // Would come from order service
		TotalRevenue:     0, // Would come from order service
		AverageRating:    farmer.Rating,
		CustomerCount:    0, // Would come from order service
		ThisMonthRevenue: 0, // Would come from order service
	}

	return stats, nil
}

func (s *farmerService) VerifyFarmer(ctx context.Context, farmerID uuid.UUID) error {
	farmer, err := s.farmerRepo.FindByID(ctx, farmerID)
	if err != nil {
		return err
	}
	if farmer == nil {
		return ErrFarmerNotFound
	}

	farmer.IsVerified = true
	farmer.UpdatedAt = time.Now()

	return s.farmerRepo.Update(ctx, farmer)
}

func (s *farmerService) GetNearbyFarmers(ctx context.Context, lat, lng, radius float64) ([]*dto.FarmerResponse, error) {
	// Validate coordinates
	if err := s.validateCoordinates(lat, lng); err != nil {
		return nil, err
	}

	// Validate radius
	if radius <= 0 || radius > 1000 {
		return nil, errors.New("radius must be between 1 and 1000 km")
	}

	farmers, err := s.farmerRepo.FindNearby(ctx, lat, lng, radius)
	if err != nil {
		return nil, err
	}

	responses := make([]*dto.FarmerResponse, len(farmers))
	for i, farmer := range farmers {
		responses[i] = s.toFarmerResponse(ctx, farmer)
	}

	return responses, nil
}

func (s *farmerService) SearchFarmers(ctx context.Context, query string, page, pageSize int) (*dto.FarmerListResponse, error) {
	filters := dto.FarmerFilterRequest{
		Search:    strings.TrimSpace(query),
		Page:      page,
		PageSize:  pageSize,
		SortBy:    "rating",
		SortOrder: "desc",
	}

	return s.GetAllFarmers(ctx, filters)
}

func (s *farmerService) BulkUpdateRatings(ctx context.Context, farmerRatings map[uuid.UUID]float64) error {
	return s.farmerRepo.BulkUpdateRatings(ctx, farmerRatings)
}

// Helper methods
func (s *farmerService) toFarmerResponse(ctx context.Context, farmer *model.Farmer) *dto.FarmerResponse {
	productCount, activeListings := s.getProductStats(ctx, farmer.ID)

	// Convert JSON certifications back to slice
	certifications, err := s.jsonToCertifications(farmer.Certifications)
	if err != nil {
		log.Printf("Error parsing certifications for farmer %s: %v", farmer.ID, err)
		certifications = []model.Certification{}
	}

	return &dto.FarmerResponse{
		ID:              farmer.ID,
		UserID:          farmer.UserID,
		FullName:        farmer.FullName,
		ProfilePicture:  farmer.ProfilePicture,
		ExperienceYears: farmer.ExperienceYears,
		FarmName:        farmer.FarmName,
		FarmDescription: farmer.FarmDescription,
		FarmType:        farmer.FarmType,
		Certifications:  certifications,
		Address:         farmer.Address,
		City:            farmer.City,
		State:           farmer.State,
		Country:         farmer.Country,
		Latitude:        farmer.Latitude,
		Longitude:       farmer.Longitude,
		IsVerified:      farmer.IsVerified,
		IsPremium:       farmer.IsPremium,
		Rating:          farmer.Rating,
		ReviewCount:     farmer.ReviewCount,
		ProductCount:    productCount,
		ActiveListings:  activeListings,
		CreatedAt:       farmer.CreatedAt,
		UpdatedAt:       farmer.UpdatedAt,
	}
}

func (s *farmerService) getProductStats(ctx context.Context, farmerID uuid.UUID) (int, int) {
	productCount, err := s.farmerRepo.GetProductCount(ctx, farmerID)
	if err != nil {
		log.Printf("Error getting product count for farmer %s: %v", farmerID, err)
		return 0, 0
	}

	activeListings, err := s.farmerRepo.GetActiveListingsCount(ctx, farmerID)
	if err != nil {
		log.Printf("Error getting active listings count for farmer %s: %v", farmerID, err)
		return productCount, 0
	}

	return productCount, activeListings
}

func (s *farmerService) validateCoordinates(lat, lng float64) error {
	if lat < -90 || lat > 90 {
		return fmt.Errorf("latitude must be between -90 and 90, got: %f", lat)
	}
	if lng < -180 || lng > 180 {
		return fmt.Errorf("longitude must be between -180 and 180, got: %f", lng)
	}
	return nil
}

func (s *farmerService) isValidDateOfBirth(dob time.Time) bool {
	age := time.Since(dob).Hours() / 24 / 365.25
	return age >= 18
}

// Helper functions for JSON serialization
func (s *farmerService) certificationsToJSON(certifications []model.Certification) (datatypes.JSON, error) {
	if len(certifications) == 0 {
		return datatypes.JSON("[]"), nil
	}

	// Convert to string array for JSON serialization
	strCerts := make([]string, len(certifications))
	for i, cert := range certifications {
		strCerts[i] = string(cert)
	}

	jsonData, err := json.Marshal(strCerts)
	if err != nil {
		return datatypes.JSON("[]"), err
	}

	return datatypes.JSON(jsonData), nil
}

func (s *farmerService) jsonToCertifications(jsonData datatypes.JSON) ([]model.Certification, error) {
	if len(jsonData) == 0 {
		return []model.Certification{}, nil
	}

	var strCerts []string
	if err := json.Unmarshal(jsonData, &strCerts); err != nil {
		return nil, err
	}

	certifications := make([]model.Certification, len(strCerts))
	for i, strCert := range strCerts {
		certifications[i] = model.Certification(strCert)
	}

	return certifications, nil
}
