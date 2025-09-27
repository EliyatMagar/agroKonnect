package service

import "fmt"

type EmailService interface {
	SendVerificationEmail(email, token string) error
	SendPasswordResetEmail(email, token string) error
}

type mockEmailService struct{}

func NewMockEmailService() EmailService {
	return &mockEmailService{}
}

func (s *mockEmailService) SendVerificationEmail(email, token string) error {
	// Mock implementation - integrate with your email service
	fmt.Printf("Verification email sent to %s with code: %s\n", email, token)
	return nil
}

func (s *mockEmailService) SendPasswordResetEmail(email, token string) error {
	// Mock implementation - integrate with your email service
	fmt.Printf("Password reset email sent to %s with code: %s\n", email, token)
	return nil
}
