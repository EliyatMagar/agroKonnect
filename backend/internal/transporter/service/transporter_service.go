package service

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	dto "agro_konnect/internal/transporter/dto"
	model "agro_konnect/internal/transporter/model"
	"agro_konnect/internal/transporter/repository"
	"errors"

	"github.com/google/uuid"
	"gorm.io/datatypes"
)

var (
	ErrTransporterNotFound      = errors.New("transporter not found")
	ErrTransporterAlreadyExists = errors.New("transporter profile already exists for this user")
	ErrVehicleNotFound          = errors.New("vehicle not found")
	ErrVehicleAlreadyExists     = errors.New("vehicle with this number already exists")
	ErrInvalidVehicleData       = errors.New("invalid vehicle data")
	ErrUnauthorizedAccess       = errors.New("unauthorized access to transporter profile")
	ErrInvalidCapacity          = errors.New("invalid capacity data")
)

type TransporterService interface {
	CreateTransporter(ctx context.Context, userID uuid.UUID, req *dto.CreateTransporterRequest) (*model.Transporter, error)
	GetTransporterByID(ctx context.Context, id uuid.UUID) (*dto.TransporterResponse, error)
	GetTransporterByUserID(ctx context.Context, userID uuid.UUID) (*dto.TransporterResponse, error)
	UpdateTransporter(ctx context.Context, transporterID uuid.UUID, userID uuid.UUID, req *dto.CreateTransporterRequest) (*dto.TransporterResponse, error)
	DeleteTransporter(ctx context.Context, transporterID uuid.UUID, userID uuid.UUID) error
	GetAllTransporters(ctx context.Context, filters dto.TransporterFilterRequest) (*dto.TransporterListResponse, error)
	VerifyTransporter(ctx context.Context, transporterID uuid.UUID) error
	UpdatePremiumStatus(ctx context.Context, transporterID uuid.UUID, premium bool) error
	UpdateTransporterRating(ctx context.Context, transporterID uuid.UUID, rating float64, reviewCount int) error
	GetTransporterStats(ctx context.Context, transporterID uuid.UUID) (*dto.TransporterStatsResponse, error)
	FindTransportersByServiceArea(ctx context.Context, location string) ([]*dto.TransporterResponse, error)
}

type VehicleService interface {
	AddVehicle(ctx context.Context, transporterID uuid.UUID, req *dto.AddVehicleRequest) (*model.Vehicle, error)
	GetVehicleByID(ctx context.Context, id uuid.UUID) (*dto.VehicleResponse, error)
	GetVehiclesByTransporter(ctx context.Context, transporterID uuid.UUID) ([]*dto.VehicleResponse, error)
	UpdateVehicle(ctx context.Context, vehicleID uuid.UUID, transporterID uuid.UUID, req *dto.AddVehicleRequest) (*dto.VehicleResponse, error)
	DeleteVehicle(ctx context.Context, vehicleID uuid.UUID, transporterID uuid.UUID) error
	UpdateVehicleAvailability(ctx context.Context, vehicleID uuid.UUID, transporterID uuid.UUID, available bool) error
	UpdateVehicleLocation(ctx context.Context, vehicleID uuid.UUID, transporterID uuid.UUID, location string) error
	GetAvailableVehicles(ctx context.Context, filters dto.VehicleFilterRequest) ([]*dto.VehicleResponse, error)
}

type transporterService struct {
	transporterRepo repository.TransporterRepository
	vehicleRepo     repository.VehicleRepository
}

type vehicleService struct {
	vehicleRepo     repository.VehicleRepository
	transporterRepo repository.TransporterRepository
}

func NewTransporterService(
	transporterRepo repository.TransporterRepository,
	vehicleRepo repository.VehicleRepository,
) TransporterService {
	return &transporterService{
		transporterRepo: transporterRepo,
		vehicleRepo:     vehicleRepo,
	}
}

func NewVehicleService(
	vehicleRepo repository.VehicleRepository,
	transporterRepo repository.TransporterRepository,
) VehicleService {
	return &vehicleService{
		vehicleRepo:     vehicleRepo,
		transporterRepo: transporterRepo,
	}
}

// Transporter Service Methods
func (s *transporterService) CreateTransporter(ctx context.Context, userID uuid.UUID, req *dto.CreateTransporterRequest) (*model.Transporter, error) {
	// Check if transporter already exists for this user
	existingTransporter, err := s.transporterRepo.FindByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if existingTransporter != nil {
		return nil, ErrTransporterAlreadyExists
	}

	// Validate transporter data
	if err := s.validateTransporterData(req); err != nil {
		return nil, err
	}

	// Convert arrays to JSON
	serviceAreasJSON, _ := json.Marshal(req.ServiceAreas)
	vehicleTypesJSON, _ := json.Marshal(req.VehicleTypes)
	specializationsJSON, _ := json.Marshal(req.Specializations)

	transporter := &model.Transporter{
		ID:            uuid.New(),
		UserID:        userID,
		CompanyName:   req.CompanyName,
		ContactPerson: req.ContactPerson,
		Description:   req.Description,

		Address:      req.Address,
		City:         req.City,
		State:        req.State,
		Country:      req.Country,
		ServiceAreas: datatypes.JSON(serviceAreasJSON),

		AlternatePhone: req.AlternatePhone,
		Website:        req.Website,

		LicenseNumber:   req.LicenseNumber,
		InsuranceNumber: req.InsuranceNumber,
		YearEstablished: req.YearEstablished,

		IsVerified:  false,
		IsPremium:   false,
		Rating:      0,
		ReviewCount: 0,

		FleetSize:       req.FleetSize,
		VehicleTypes:    datatypes.JSON(vehicleTypesJSON),
		MaxCapacity:     req.MaxCapacity,
		Specializations: datatypes.JSON(specializationsJSON),

		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := s.transporterRepo.Create(ctx, transporter); err != nil {
		return nil, fmt.Errorf("failed to create transporter: %w", err)
	}

	return transporter, nil
}

func (s *transporterService) GetTransporterByID(ctx context.Context, id uuid.UUID) (*dto.TransporterResponse, error) {
	transporter, err := s.transporterRepo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if transporter == nil {
		return nil, ErrTransporterNotFound
	}

	return s.toTransporterResponse(transporter), nil
}

func (s *transporterService) GetTransporterByUserID(ctx context.Context, userID uuid.UUID) (*dto.TransporterResponse, error) {
	transporter, err := s.transporterRepo.FindByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if transporter == nil {
		return nil, ErrTransporterNotFound
	}

	return s.toTransporterResponse(transporter), nil
}

func (s *transporterService) UpdateTransporter(ctx context.Context, transporterID uuid.UUID, userID uuid.UUID, req *dto.CreateTransporterRequest) (*dto.TransporterResponse, error) {
	transporter, err := s.transporterRepo.FindByID(ctx, transporterID)
	if err != nil {
		return nil, err
	}
	if transporter == nil {
		return nil, ErrTransporterNotFound
	}

	// Check if the user owns this transporter profile
	if transporter.UserID != userID {
		return nil, ErrUnauthorizedAccess
	}

	// Validate transporter data
	if err := s.validateTransporterData(req); err != nil {
		return nil, err
	}

	// Convert arrays to JSON for update
	serviceAreasJSON, _ := json.Marshal(req.ServiceAreas)
	vehicleTypesJSON, _ := json.Marshal(req.VehicleTypes)
	specializationsJSON, _ := json.Marshal(req.Specializations)

	// Update fields
	transporter.CompanyName = req.CompanyName
	transporter.ContactPerson = req.ContactPerson
	transporter.Description = req.Description

	transporter.Address = req.Address
	transporter.City = req.City
	transporter.State = req.State
	transporter.Country = req.Country
	transporter.ServiceAreas = datatypes.JSON(serviceAreasJSON)

	transporter.AlternatePhone = req.AlternatePhone
	transporter.Website = req.Website

	transporter.LicenseNumber = req.LicenseNumber
	transporter.InsuranceNumber = req.InsuranceNumber
	transporter.YearEstablished = req.YearEstablished

	transporter.FleetSize = req.FleetSize
	transporter.VehicleTypes = datatypes.JSON(vehicleTypesJSON)
	transporter.MaxCapacity = req.MaxCapacity
	transporter.Specializations = datatypes.JSON(specializationsJSON)

	transporter.UpdatedAt = time.Now()

	if err := s.transporterRepo.Update(ctx, transporter); err != nil {
		return nil, err
	}

	return s.toTransporterResponse(transporter), nil
}

func (s *transporterService) DeleteTransporter(ctx context.Context, transporterID uuid.UUID, userID uuid.UUID) error {
	transporter, err := s.transporterRepo.FindByID(ctx, transporterID)
	if err != nil {
		return err
	}
	if transporter == nil {
		return ErrTransporterNotFound
	}

	// Check if the user owns this transporter profile
	if transporter.UserID != userID {
		return ErrUnauthorizedAccess
	}

	return s.transporterRepo.Delete(ctx, transporterID)
}

func (s *transporterService) GetAllTransporters(ctx context.Context, filters dto.TransporterFilterRequest) (*dto.TransporterListResponse, error) {
	repoFilters := repository.TransporterFilter{
		City:           filters.City,
		State:          filters.State,
		ServiceArea:    filters.ServiceArea,
		VehicleType:    filters.VehicleType,
		MinCapacity:    filters.MinCapacity,
		MaxCapacity:    filters.MaxCapacity,
		IsVerified:     filters.IsVerified,
		IsPremium:      filters.IsPremium,
		MinRating:      filters.MinRating,
		Specialization: filters.Specialization,
		Page:           filters.Page,
		PageSize:       filters.PageSize,
	}

	transporters, total, err := s.transporterRepo.FindAllWithFilters(ctx, repoFilters)
	if err != nil {
		return nil, err
	}

	responses := make([]*dto.TransporterResponse, len(transporters))
	for i, transporter := range transporters {
		responses[i] = s.toTransporterResponse(transporter)
	}

	pages := int((total + int64(filters.PageSize) - 1) / int64(filters.PageSize))
	hasMore := filters.Page < pages

	return &dto.TransporterListResponse{
		Transporters: responses,
		Total:        total,
		Page:         filters.Page,
		Pages:        pages,
		HasMore:      hasMore,
	}, nil
}

func (s *transporterService) VerifyTransporter(ctx context.Context, transporterID uuid.UUID) error {
	return s.transporterRepo.UpdateVerificationStatus(ctx, transporterID, true)
}

func (s *transporterService) UpdatePremiumStatus(ctx context.Context, transporterID uuid.UUID, premium bool) error {
	// Check if transporter exists
	transporter, err := s.transporterRepo.FindByID(ctx, transporterID)
	if err != nil {
		return err
	}
	if transporter == nil {
		return ErrTransporterNotFound
	}

	return s.transporterRepo.UpdatePremiumStatus(ctx, transporterID, premium)
}

func (s *transporterService) UpdateTransporterRating(ctx context.Context, transporterID uuid.UUID, rating float64, reviewCount int) error {
	if rating < 0 || rating > 5 {
		return errors.New("rating must be between 0 and 5")
	}
	return s.transporterRepo.UpdateRating(ctx, transporterID, rating, reviewCount)
}

func (s *transporterService) GetTransporterStats(ctx context.Context, transporterID uuid.UUID) (*dto.TransporterStatsResponse, error) {
	stats, err := s.transporterRepo.GetTransporterStats(ctx, transporterID)
	if err != nil {
		return nil, err
	}

	return &dto.TransporterStatsResponse{
		TotalVehicles:      stats.TotalVehicles,
		AvailableVehicles:  stats.AvailableVehicles,
		TotalOrders:        stats.TotalOrders,
		CompletedOrders:    stats.CompletedOrders,
		ActiveOrders:       stats.ActiveOrders,
		TotalEarnings:      stats.TotalEarnings,
		AverageRating:      stats.AverageRating,
		OnTimeDeliveryRate: stats.OnTimeDeliveryRate,
	}, nil
}

func (s *transporterService) FindTransportersByServiceArea(ctx context.Context, location string) ([]*dto.TransporterResponse, error) {
	transporters, err := s.transporterRepo.FindByServiceArea(ctx, location)
	if err != nil {
		return nil, err
	}

	responses := make([]*dto.TransporterResponse, len(transporters))
	for i, transporter := range transporters {
		responses[i] = s.toTransporterResponse(transporter)
	}

	return responses, nil
}

// Vehicle Service Methods
func (s *vehicleService) AddVehicle(ctx context.Context, transporterID uuid.UUID, req *dto.AddVehicleRequest) (*model.Vehicle, error) {
	// Check if vehicle with this number already exists
	existingVehicle, err := s.vehicleRepo.FindByVehicleNumber(ctx, req.VehicleNumber)
	if err != nil {
		return nil, err
	}
	if existingVehicle != nil {
		return nil, ErrVehicleAlreadyExists
	}

	// Validate vehicle data
	if err := s.validateVehicleData(req); err != nil {
		return nil, err
	}

	// Parse dates
	var insuranceExpiry, fitnessExpiry time.Time
	var err1, err2 error

	if req.InsuranceExpiry != "" {
		insuranceExpiry, err1 = time.Parse(time.RFC3339, req.InsuranceExpiry)
		if err1 != nil {
			return nil, errors.New("invalid insurance expiry date format")
		}
	}

	if req.FitnessExpiry != "" {
		fitnessExpiry, err2 = time.Parse(time.RFC3339, req.FitnessExpiry)
		if err2 != nil {
			return nil, errors.New("invalid fitness expiry date format")
		}
	}

	vehicle := &model.Vehicle{
		ID:            uuid.New(),
		TransporterID: transporterID,
		VehicleNumber: req.VehicleNumber,
		VehicleType:   req.VehicleType,
		Make:          req.Make,
		Model:         req.Model,
		Year:          req.Year,
		Color:         req.Color,

		Capacity: req.Capacity,

		RCNumber:        req.RCNumber,
		InsuranceNumber: req.InsuranceNumber,
		InsuranceExpiry: insuranceExpiry,
		FitnessExpiry:   fitnessExpiry,

		IsActive:        true,
		IsAvailable:     true,
		CurrentLocation: "",

		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := s.vehicleRepo.Create(ctx, vehicle); err != nil {
		return nil, fmt.Errorf("failed to add vehicle: %w", err)
	}

	return vehicle, nil
}

func (s *vehicleService) GetVehicleByID(ctx context.Context, id uuid.UUID) (*dto.VehicleResponse, error) {
	vehicle, err := s.vehicleRepo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if vehicle == nil {
		return nil, ErrVehicleNotFound
	}

	return s.toVehicleResponse(vehicle), nil
}

func (s *vehicleService) GetVehiclesByTransporter(ctx context.Context, transporterID uuid.UUID) ([]*dto.VehicleResponse, error) {
	vehicles, err := s.vehicleRepo.FindByTransporterID(ctx, transporterID)
	if err != nil {
		return nil, err
	}

	responses := make([]*dto.VehicleResponse, len(vehicles))
	for i, vehicle := range vehicles {
		responses[i] = s.toVehicleResponse(vehicle)
	}

	return responses, nil
}

func (s *vehicleService) UpdateVehicle(ctx context.Context, vehicleID uuid.UUID, transporterID uuid.UUID, req *dto.AddVehicleRequest) (*dto.VehicleResponse, error) {
	vehicle, err := s.vehicleRepo.FindByID(ctx, vehicleID)
	if err != nil {
		return nil, err
	}
	if vehicle == nil {
		return nil, ErrVehicleNotFound
	}

	// Check if the vehicle belongs to the transporter
	if vehicle.TransporterID != transporterID {
		return nil, ErrUnauthorizedAccess
	}

	// Validate vehicle data
	if err := s.validateVehicleData(req); err != nil {
		return nil, err
	}

	// Parse dates
	var insuranceExpiry, fitnessExpiry time.Time
	var err1, err2 error

	if req.InsuranceExpiry != "" {
		insuranceExpiry, err1 = time.Parse(time.RFC3339, req.InsuranceExpiry)
		if err1 != nil {
			return nil, errors.New("invalid insurance expiry date format")
		}
	} else {
		insuranceExpiry = vehicle.InsuranceExpiry // Keep existing if not provided
	}

	if req.FitnessExpiry != "" {
		fitnessExpiry, err2 = time.Parse(time.RFC3339, req.FitnessExpiry)
		if err2 != nil {
			return nil, errors.New("invalid fitness expiry date format")
		}
	} else {
		fitnessExpiry = vehicle.FitnessExpiry // Keep existing if not provided
	}

	// Update fields
	vehicle.VehicleNumber = req.VehicleNumber
	vehicle.VehicleType = req.VehicleType
	vehicle.Make = req.Make
	vehicle.Model = req.Model
	vehicle.Year = req.Year
	vehicle.Color = req.Color

	vehicle.Capacity = req.Capacity

	vehicle.RCNumber = req.RCNumber
	vehicle.InsuranceNumber = req.InsuranceNumber
	vehicle.InsuranceExpiry = insuranceExpiry
	vehicle.FitnessExpiry = fitnessExpiry

	vehicle.UpdatedAt = time.Now()

	if err := s.vehicleRepo.Update(ctx, vehicle); err != nil {
		return nil, err
	}

	return s.toVehicleResponse(vehicle), nil
}

func (s *vehicleService) DeleteVehicle(ctx context.Context, vehicleID uuid.UUID, transporterID uuid.UUID) error {
	vehicle, err := s.vehicleRepo.FindByID(ctx, vehicleID)
	if err != nil {
		return err
	}
	if vehicle == nil {
		return ErrVehicleNotFound
	}

	// Check if the vehicle belongs to the transporter
	if vehicle.TransporterID != transporterID {
		return ErrUnauthorizedAccess
	}

	return s.vehicleRepo.Delete(ctx, vehicleID)
}

func (s *vehicleService) UpdateVehicleAvailability(ctx context.Context, vehicleID uuid.UUID, transporterID uuid.UUID, available bool) error {
	vehicle, err := s.vehicleRepo.FindByID(ctx, vehicleID)
	if err != nil {
		return err
	}
	if vehicle == nil {
		return ErrVehicleNotFound
	}

	// Check if the vehicle belongs to the transporter
	if vehicle.TransporterID != transporterID {
		return ErrUnauthorizedAccess
	}

	return s.vehicleRepo.UpdateAvailability(ctx, vehicleID, available)
}

func (s *vehicleService) UpdateVehicleLocation(ctx context.Context, vehicleID uuid.UUID, transporterID uuid.UUID, location string) error {
	vehicle, err := s.vehicleRepo.FindByID(ctx, vehicleID)
	if err != nil {
		return err
	}
	if vehicle == nil {
		return ErrVehicleNotFound
	}

	// Check if the vehicle belongs to the transporter
	if vehicle.TransporterID != transporterID {
		return ErrUnauthorizedAccess
	}

	return s.vehicleRepo.UpdateLocation(ctx, vehicleID, location)
}

func (s *vehicleService) GetAvailableVehicles(ctx context.Context, filters dto.VehicleFilterRequest) ([]*dto.VehicleResponse, error) {
	repoFilters := repository.VehicleFilter{
		TransporterID: filters.TransporterID,
		VehicleType:   filters.VehicleType,
		IsAvailable:   filters.IsAvailable,
		MinCapacity:   filters.MinCapacity,
		MaxCapacity:   filters.MaxCapacity,
		Location:      filters.Location,
		Page:          filters.Page,
		PageSize:      filters.PageSize,
	}

	vehicles, err := s.vehicleRepo.FindAvailableVehicles(ctx, repoFilters)
	if err != nil {
		return nil, err
	}

	responses := make([]*dto.VehicleResponse, len(vehicles))
	for i, vehicle := range vehicles {
		responses[i] = s.toVehicleResponse(vehicle)
	}

	return responses, nil
}

// Helper methods
func (s *transporterService) toTransporterResponse(transporter *model.Transporter) *dto.TransporterResponse {
	var serviceAreas []string
	var vehicleTypes []model.VehicleType
	var specializations []string

	// Parse JSON arrays back to slices
	if transporter.ServiceAreas != nil {
		json.Unmarshal(transporter.ServiceAreas, &serviceAreas)
	}
	if transporter.VehicleTypes != nil {
		json.Unmarshal(transporter.VehicleTypes, &vehicleTypes)
	}
	if transporter.Specializations != nil {
		json.Unmarshal(transporter.Specializations, &specializations)
	}

	return &dto.TransporterResponse{
		ID:            transporter.ID,
		UserID:        transporter.UserID,
		CompanyName:   transporter.CompanyName,
		ContactPerson: transporter.ContactPerson,
		Description:   transporter.Description,

		Address:      transporter.Address,
		City:         transporter.City,
		State:        transporter.State,
		Country:      transporter.Country,
		ServiceAreas: serviceAreas,

		IsVerified:  transporter.IsVerified,
		IsPremium:   transporter.IsPremium,
		Rating:      transporter.Rating,
		ReviewCount: transporter.ReviewCount,

		FleetSize:    transporter.FleetSize,
		VehicleTypes: vehicleTypes,
		MaxCapacity:  transporter.MaxCapacity,

		CreatedAt: transporter.CreatedAt,
	}
}

func (s *vehicleService) toVehicleResponse(vehicle *model.Vehicle) *dto.VehicleResponse {
	return &dto.VehicleResponse{
		ID:            vehicle.ID,
		TransporterID: vehicle.TransporterID,
		VehicleNumber: vehicle.VehicleNumber,
		VehicleType:   vehicle.VehicleType,
		Make:          vehicle.Make,
		Model:         vehicle.Model,
		Year:          vehicle.Year,
		Color:         vehicle.Color,

		Capacity: vehicle.Capacity,

		IsActive:        vehicle.IsActive,
		IsAvailable:     vehicle.IsAvailable,
		CurrentLocation: vehicle.CurrentLocation,

		CreatedAt: vehicle.CreatedAt,
	}
}

func (s *transporterService) validateTransporterData(req *dto.CreateTransporterRequest) error {
	if req.YearEstablished > time.Now().Year() {
		return errors.New("year established cannot be in the future")
	}

	if req.FleetSize < 0 {
		return errors.New("fleet size cannot be negative")
	}

	if req.MaxCapacity.Weight < 0 || req.MaxCapacity.Volume < 0 {
		return ErrInvalidCapacity
	}

	return nil
}

func (s *vehicleService) validateVehicleData(req *dto.AddVehicleRequest) error {
	if req.Year > time.Now().Year() {
		return errors.New("vehicle year cannot be in the future")
	}

	if req.Capacity.Weight < 0 || req.Capacity.Volume < 0 {
		return ErrInvalidCapacity
	}

	// Validate dates if provided
	if req.InsuranceExpiry != "" {
		if _, err := time.Parse(time.RFC3339, req.InsuranceExpiry); err != nil {
			return errors.New("invalid insurance expiry date format")
		}
	}

	if req.FitnessExpiry != "" {
		if _, err := time.Parse(time.RFC3339, req.FitnessExpiry); err != nil {
			return errors.New("invalid fitness expiry date format")
		}
	}

	return nil
}
