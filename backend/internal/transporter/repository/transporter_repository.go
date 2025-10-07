package repository

import (
	"context"
	"fmt"
	"strings"
	"time"

	model "agro_konnect/internal/transporter/model"
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type TransporterRepository interface {
	Create(ctx context.Context, transporter *model.Transporter) error
	FindByID(ctx context.Context, id uuid.UUID) (*model.Transporter, error)
	FindByUserID(ctx context.Context, userID uuid.UUID) (*model.Transporter, error)
	Update(ctx context.Context, transporter *model.Transporter) error
	Delete(ctx context.Context, id uuid.UUID) error
	FindAllWithFilters(ctx context.Context, filters TransporterFilter) ([]*model.Transporter, int64, error)
	UpdateVerificationStatus(ctx context.Context, transporterID uuid.UUID, verified bool) error
	UpdatePremiumStatus(ctx context.Context, transporterID uuid.UUID, premium bool) error
	UpdateRating(ctx context.Context, transporterID uuid.UUID, rating float64, reviewCount int) error
	FindByServiceArea(ctx context.Context, location string) ([]*model.Transporter, error)
	GetTransporterStats(ctx context.Context, transporterID uuid.UUID) (*TransporterStats, error)
}

type VehicleRepository interface {
	Create(ctx context.Context, vehicle *model.Vehicle) error
	FindByID(ctx context.Context, id uuid.UUID) (*model.Vehicle, error)
	FindByTransporterID(ctx context.Context, transporterID uuid.UUID) ([]*model.Vehicle, error)
	FindByVehicleNumber(ctx context.Context, vehicleNumber string) (*model.Vehicle, error)
	Update(ctx context.Context, vehicle *model.Vehicle) error
	Delete(ctx context.Context, id uuid.UUID) error
	UpdateAvailability(ctx context.Context, vehicleID uuid.UUID, available bool) error
	UpdateLocation(ctx context.Context, vehicleID uuid.UUID, location string) error
	FindAvailableVehicles(ctx context.Context, filters VehicleFilter) ([]*model.Vehicle, error)
}

type TransporterFilter struct {
	City           string
	State          string
	ServiceArea    string
	VehicleType    model.VehicleType
	MinCapacity    float64
	MaxCapacity    float64
	IsVerified     *bool
	IsPremium      *bool
	MinRating      float64
	Specialization string
	Page           int
	PageSize       int
}

type VehicleFilter struct {
	TransporterID uuid.UUID
	VehicleType   model.VehicleType
	IsAvailable   *bool
	MinCapacity   float64
	MaxCapacity   float64
	Location      string
	Page          int
	PageSize      int
}

type TransporterStats struct {
	TotalVehicles      int
	AvailableVehicles  int
	TotalOrders        int
	CompletedOrders    int
	ActiveOrders       int
	TotalEarnings      float64
	AverageRating      float64
	OnTimeDeliveryRate float64
}

type transporterRepository struct {
	db *gorm.DB
}

type vehicleRepository struct {
	db *gorm.DB
}

func NewTransporterRepository(db *gorm.DB) TransporterRepository {
	return &transporterRepository{db: db}
}

func NewVehicleRepository(db *gorm.DB) VehicleRepository {
	return &vehicleRepository{db: db}
}

func (r *transporterRepository) Create(ctx context.Context, transporter *model.Transporter) error {
	// Convert arrays to JSON
	if transporter.ServiceAreas == nil {
		transporter.ServiceAreas = []byte("[]")
	}
	if transporter.VehicleTypes == nil {
		transporter.VehicleTypes = []byte("[]")
	}
	if transporter.Specializations == nil {
		transporter.Specializations = []byte("[]")
	}

	return r.db.WithContext(ctx).Create(transporter).Error
}

func (r *transporterRepository) FindByID(ctx context.Context, id uuid.UUID) (*model.Transporter, error) {
	var transporter model.Transporter
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&transporter).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &transporter, err
}

func (r *transporterRepository) FindByUserID(ctx context.Context, userID uuid.UUID) (*model.Transporter, error) {
	var transporter model.Transporter
	err := r.db.WithContext(ctx).Where("user_id = ?", userID).First(&transporter).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &transporter, err
}

func (r *transporterRepository) Update(ctx context.Context, transporter *model.Transporter) error {
	transporter.UpdatedAt = time.Now()
	return r.db.WithContext(ctx).Save(transporter).Error
}

func (r *transporterRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&model.Transporter{}).Error
}

func (r *transporterRepository) FindAllWithFilters(ctx context.Context, filters TransporterFilter) ([]*model.Transporter, int64, error) {
	query := r.db.WithContext(ctx).Model(&model.Transporter{})

	// Apply filters
	if filters.City != "" {
		query = query.Where("LOWER(city) LIKE ?", fmt.Sprintf("%%%s%%", strings.ToLower(filters.City)))
	}

	if filters.State != "" {
		query = query.Where("LOWER(state) LIKE ?", fmt.Sprintf("%%%s%%", strings.ToLower(filters.State)))
	}

	if filters.ServiceArea != "" {
		query = query.Where("service_areas::text LIKE ?", fmt.Sprintf("%%%s%%", filters.ServiceArea))
	}

	if filters.VehicleType != "" {
		query = query.Where("vehicle_types::text LIKE ?", fmt.Sprintf("%%%s%%", filters.VehicleType))
	}

	if filters.MinCapacity > 0 {
		query = query.Where("max_capacity_weight >= ? OR max_capacity_volume >= ?", filters.MinCapacity, filters.MinCapacity)
	}

	if filters.MaxCapacity > 0 {
		query = query.Where("max_capacity_weight <= ? AND max_capacity_volume <= ?", filters.MaxCapacity, filters.MaxCapacity)
	}

	if filters.IsVerified != nil {
		query = query.Where("is_verified = ?", *filters.IsVerified)
	}

	if filters.IsPremium != nil {
		query = query.Where("is_premium = ?", *filters.IsPremium)
	}

	if filters.MinRating > 0 {
		query = query.Where("rating >= ?", filters.MinRating)
	}

	if filters.Specialization != "" {
		query = query.Where("specializations::text LIKE ?", fmt.Sprintf("%%%s%%", filters.Specialization))
	}

	// Get total count
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply pagination
	if filters.PageSize == 0 {
		filters.PageSize = 10
	}
	if filters.Page == 0 {
		filters.Page = 1
	}

	offset := (filters.Page - 1) * filters.PageSize
	query = query.Offset(offset).Limit(filters.PageSize).Order("created_at DESC")

	var transporters []*model.Transporter
	err := query.Find(&transporters).Error
	if err != nil {
		return nil, 0, err
	}

	return transporters, total, nil
}

func (r *transporterRepository) UpdateVerificationStatus(ctx context.Context, transporterID uuid.UUID, verified bool) error {
	return r.db.WithContext(ctx).Model(&model.Transporter{}).
		Where("id = ?", transporterID).
		Updates(map[string]interface{}{
			"is_verified": verified,
			"updated_at":  time.Now(),
		}).Error
}

func (r *transporterRepository) UpdatePremiumStatus(ctx context.Context, transporterID uuid.UUID, premium bool) error {
	return r.db.WithContext(ctx).Model(&model.Transporter{}).
		Where("id = ?", transporterID).
		Updates(map[string]interface{}{
			"is_premium": premium,
			"updated_at": time.Now(),
		}).Error
}

func (r *transporterRepository) UpdateRating(ctx context.Context, transporterID uuid.UUID, rating float64, reviewCount int) error {
	return r.db.WithContext(ctx).Model(&model.Transporter{}).
		Where("id = ?", transporterID).
		Updates(map[string]interface{}{
			"rating":       rating,
			"review_count": reviewCount,
			"updated_at":   time.Now(),
		}).Error
}

func (r *transporterRepository) FindByServiceArea(ctx context.Context, location string) ([]*model.Transporter, error) {
	var transporters []*model.Transporter
	err := r.db.WithContext(ctx).
		Where("service_areas @> ?", fmt.Sprintf(`{"%s"}`, location)).
		Where("is_verified = ?", true).
		Find(&transporters).Error
	return transporters, err
}

func (r *transporterRepository) GetTransporterStats(ctx context.Context, transporterID uuid.UUID) (*TransporterStats, error) {
	var stats TransporterStats

	// This is a simplified implementation - you would need to join with orders and vehicles tables
	// For now, returning placeholder stats
	stats.TotalVehicles = 0
	stats.AvailableVehicles = 0
	stats.TotalOrders = 0
	stats.CompletedOrders = 0
	stats.ActiveOrders = 0
	stats.TotalEarnings = 0
	stats.AverageRating = 0
	stats.OnTimeDeliveryRate = 0

	return &stats, nil
}

// Vehicle Repository Methods
func (r *vehicleRepository) Create(ctx context.Context, vehicle *model.Vehicle) error {
	return r.db.WithContext(ctx).Create(vehicle).Error
}

func (r *vehicleRepository) FindByID(ctx context.Context, id uuid.UUID) (*model.Vehicle, error) {
	var vehicle model.Vehicle
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&vehicle).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &vehicle, err
}

func (r *vehicleRepository) FindByTransporterID(ctx context.Context, transporterID uuid.UUID) ([]*model.Vehicle, error) {
	var vehicles []*model.Vehicle
	err := r.db.WithContext(ctx).Where("transporter_id = ?", transporterID).Find(&vehicles).Error
	return vehicles, err
}

func (r *vehicleRepository) FindByVehicleNumber(ctx context.Context, vehicleNumber string) (*model.Vehicle, error) {
	var vehicle model.Vehicle
	err := r.db.WithContext(ctx).Where("vehicle_number = ?", vehicleNumber).First(&vehicle).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &vehicle, err
}

func (r *vehicleRepository) Update(ctx context.Context, vehicle *model.Vehicle) error {
	vehicle.UpdatedAt = time.Now()
	return r.db.WithContext(ctx).Save(vehicle).Error
}

func (r *vehicleRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&model.Vehicle{}).Error
}

func (r *vehicleRepository) UpdateAvailability(ctx context.Context, vehicleID uuid.UUID, available bool) error {
	return r.db.WithContext(ctx).Model(&model.Vehicle{}).
		Where("id = ?", vehicleID).
		Updates(map[string]interface{}{
			"is_available": available,
			"updated_at":   time.Now(),
		}).Error
}

func (r *vehicleRepository) UpdateLocation(ctx context.Context, vehicleID uuid.UUID, location string) error {
	return r.db.WithContext(ctx).Model(&model.Vehicle{}).
		Where("id = ?", vehicleID).
		Updates(map[string]interface{}{
			"current_location": location,
			"updated_at":       time.Now(),
		}).Error
}

func (r *vehicleRepository) FindAvailableVehicles(ctx context.Context, filters VehicleFilter) ([]*model.Vehicle, error) {
	query := r.db.WithContext(ctx).Model(&model.Vehicle{}).Where("is_active = ?", true)

	if filters.TransporterID != uuid.Nil {
		query = query.Where("transporter_id = ?", filters.TransporterID)
	}

	if filters.VehicleType != "" {
		query = query.Where("vehicle_type = ?", filters.VehicleType)
	}

	if filters.IsAvailable != nil {
		query = query.Where("is_available = ?", *filters.IsAvailable)
	}

	if filters.MinCapacity > 0 {
		query = query.Where("capacity_weight >= ? OR capacity_volume >= ?", filters.MinCapacity, filters.MinCapacity)
	}

	if filters.MaxCapacity > 0 {
		query = query.Where("capacity_weight <= ? AND capacity_volume <= ?", filters.MaxCapacity, filters.MaxCapacity)
	}

	if filters.Location != "" {
		query = query.Where("LOWER(current_location) LIKE ?", fmt.Sprintf("%%%s%%", strings.ToLower(filters.Location)))
	}

	// Apply pagination
	if filters.PageSize > 0 {
		offset := (filters.Page - 1) * filters.PageSize
		query = query.Offset(offset).Limit(filters.PageSize)
	}

	query = query.Order("created_at DESC")

	var vehicles []*model.Vehicle
	err := query.Find(&vehicles).Error
	return vehicles, err
}
