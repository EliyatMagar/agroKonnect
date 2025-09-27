package service

import (
	"agro_konnect/internal/auth/dto"
	"agro_konnect/internal/auth/model"
	"agro_konnect/internal/auth/repository"
	"agro_konnect/internal/auth/utils"
	"crypto/rand"
	"errors"
	"fmt"
	"math/big"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrUserNotFound        = errors.New("user not found")
	ErrInvalidCredentials  = errors.New("invalid credentials")
	ErrUserAlreadyExists   = errors.New("user already exists")
	ErrInvalidToken        = errors.New("invalid token")
	ErrTokenExpired        = errors.New("token expired")
	ErrUnauthorized        = errors.New("unauthorized")
	ErrVerificationExpired = errors.New("verification code expired")
)

type AuthService interface {
	Register(req *dto.RegisterRequest) (*model.User, error)
	Login(req *dto.LoginRequest) (*dto.AuthResponse, error)
	VerifyEmail(req *dto.VerifyEmailRequest) error
	ForgotPassword(req *dto.ForgotPasswordRequest) error
	ResetPassword(req *dto.ResetPasswordRequest) error
	ChangePassword(userID uuid.UUID, req *dto.ChangePasswordRequest) error
	RefreshToken(refreshToken string) (*dto.AuthResponse, error)
	GetUserProfile(userID uuid.UUID) (*dto.UserResponse, error)
	GenerateVerificationCode(userID uuid.UUID, codeType string) (*model.VerificationCode, error)
}

type authService struct {
	userRepo         repository.UserRepository
	verificationRepo repository.VerificationRepository
	jwtManager       *utils.JWTManager
	emailService     EmailService
}

func NewAuthService(
	userRepo repository.UserRepository,
	verificationRepo repository.VerificationRepository,
	jwtManager *utils.JWTManager,
	emailService EmailService,
) AuthService {
	return &authService{
		userRepo:         userRepo,
		verificationRepo: verificationRepo,
		jwtManager:       jwtManager,
		emailService:     emailService,
	}
}

func (s *authService) Register(req *dto.RegisterRequest) (*model.User, error) {
	// Check if email already exists
	existingUser, _ := s.userRepo.FindByEmail(req.Email)
	if existingUser != nil {
		return nil, ErrUserAlreadyExists
	}

	// Check if phone already exists
	existingUser, _ = s.userRepo.FindByPhone(req.Phone)
	if existingUser != nil {
		return nil, errors.New("phone number already registered")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &model.User{
		ID:           uuid.New(),
		Email:        req.Email,
		Phone:        req.Phone,
		PasswordHash: string(hashedPassword),
		Role:         req.Role,
		IsVerified:   false,
		IsActive:     true,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, err
	}

	// Generate and send verification code
	verificationCode, err := s.GenerateVerificationCode(user.ID, "email_verification")
	if err != nil {
		return user, nil // Return user even if email fails
	}

	go s.emailService.SendVerificationEmail(user.Email, verificationCode.Code)

	return user, nil
}

func (s *authService) Login(req *dto.LoginRequest) (*dto.AuthResponse, error) {
	user, err := s.userRepo.FindByEmail(req.Email)
	if err != nil {
		return nil, ErrInvalidCredentials
	}

	if !user.IsActive {
		return nil, errors.New("account is deactivated")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, ErrInvalidCredentials
	}

	if err := s.userRepo.UpdateLastLogin(user.ID); err != nil {
		// Log error but don't fail login
		fmt.Printf("Failed to update last login: %v\n", err)
	}

	accessToken, expiresAt, err := s.jwtManager.GenerateAccessToken(user)
	if err != nil {
		return nil, err
	}

	refreshToken, err := s.jwtManager.GenerateRefreshToken(user.ID)
	if err != nil {
		return nil, err
	}

	response := &dto.AuthResponse{
		User:         *user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresAt:    expiresAt,
	}

	return response, nil
}

func (s *authService) VerifyEmail(req *dto.VerifyEmailRequest) error {
	user, err := s.userRepo.FindByEmail(req.Email)
	if err != nil {
		return ErrUserNotFound
	}

	if user.IsVerified {
		return errors.New("email already verified")
	}

	verificationCode, err := s.verificationRepo.FindValidCode(user.ID, req.Code, "email_verification")
	if err != nil {
		return ErrInvalidToken
	}

	if time.Now().After(verificationCode.ExpiresAt) {
		return ErrVerificationExpired
	}

	user.IsVerified = true
	user.UpdatedAt = time.Now()

	if err := s.userRepo.Update(user); err != nil {
		return err
	}

	return s.verificationRepo.MarkAsUsed(verificationCode.ID)
}

func (s *authService) ForgotPassword(req *dto.ForgotPasswordRequest) error {
	user, err := s.userRepo.FindByEmail(req.Email)
	if err != nil {
		return nil // Don't reveal if email exists or not
	}

	verificationCode, err := s.GenerateVerificationCode(user.ID, "password_reset")
	if err != nil {
		return err
	}

	go s.emailService.SendPasswordResetEmail(user.Email, verificationCode.Code)

	return nil
}

func (s *authService) ResetPassword(req *dto.ResetPasswordRequest) error {
	// Check if it's a 6-digit code (verification code)
	if len(req.Token) == 6 {
		return s.resetPasswordWithCode(req.Token, req.NewPassword)
	}

	// Otherwise, treat it as JWT token
	claims, err := s.jwtManager.ValidateToken(req.Token)
	if err != nil {
		return ErrInvalidToken
	}

	userID, err := uuid.Parse(claims.Subject)
	if err != nil {
		return ErrInvalidToken
	}

	return s.updateUserPassword(userID, req.NewPassword)
}

func (s *authService) resetPasswordWithCode(code, newPassword string) error {
	verificationCode, err := s.verificationRepo.FindValidCodeByCode(code, "password_reset")
	if err != nil {
		return ErrInvalidToken
	}

	if time.Now().After(verificationCode.ExpiresAt) {
		return ErrVerificationExpired
	}

	// Update password
	if err := s.updateUserPassword(verificationCode.UserID, newPassword); err != nil {
		return err
	}

	// Mark code as used
	return s.verificationRepo.MarkAsUsed(verificationCode.ID)
}

func (s *authService) ChangePassword(userID uuid.UUID, req *dto.ChangePasswordRequest) error {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return ErrUserNotFound
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.CurrentPassword)); err != nil {
		return ErrInvalidCredentials
	}

	return s.updateUserPassword(userID, req.NewPassword)
}

func (s *authService) updateUserPassword(userID uuid.UUID, newPassword string) error {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return ErrUserNotFound
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	user.PasswordHash = string(hashedPassword)
	user.UpdatedAt = time.Now()

	return s.userRepo.Update(user)
}

func (s *authService) RefreshToken(refreshToken string) (*dto.AuthResponse, error) {
	claims, err := s.jwtManager.ValidateToken(refreshToken)
	if err != nil {
		return nil, ErrInvalidToken
	}

	userID, err := uuid.Parse(claims.Subject)
	if err != nil {
		return nil, ErrInvalidToken
	}

	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, ErrUserNotFound
	}

	accessToken, expiresAt, err := s.jwtManager.GenerateAccessToken(user)
	if err != nil {
		return nil, err
	}

	// Generate new refresh token
	newRefreshToken, err := s.jwtManager.GenerateRefreshToken(user.ID)
	if err != nil {
		return nil, err
	}

	response := &dto.AuthResponse{
		User:         *user,
		AccessToken:  accessToken,
		RefreshToken: newRefreshToken,
		ExpiresAt:    expiresAt,
	}

	return response, nil
}

func (s *authService) GetUserProfile(userID uuid.UUID) (*dto.UserResponse, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, ErrUserNotFound
	}

	return &dto.UserResponse{
		ID:         user.ID,
		Email:      user.Email,
		Phone:      user.Phone,
		Role:       user.Role,
		IsVerified: user.IsVerified,
		IsActive:   user.IsActive,
		CreatedAt:  user.CreatedAt,
	}, nil
}

func (s *authService) GenerateVerificationCode(userID uuid.UUID, codeType string) (*model.VerificationCode, error) {
	code := generateRandomCode(6)

	verificationCode := &model.VerificationCode{
		ID:        uuid.New(),
		UserID:    userID,
		Code:      code,
		Type:      codeType,
		ExpiresAt: time.Now().Add(24 * time.Hour), // 24 hours expiration
		Used:      false,
		CreatedAt: time.Now(),
	}

	if err := s.verificationRepo.Create(verificationCode); err != nil {
		return nil, err
	}

	return verificationCode, nil
}

// Helper function to generate random numeric code
func generateRandomCode(length int) string {
	const digits = "0123456789"
	code := make([]byte, length)

	for i := range code {
		num, _ := rand.Int(rand.Reader, big.NewInt(int64(len(digits))))
		code[i] = digits[num.Int64()]
	}

	return string(code)
}
