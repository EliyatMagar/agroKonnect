package utils

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

type SuccessResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

type ErrorResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Error   interface{} `json:"error,omitempty"`
}

type PaginationMeta struct {
	Page    int   `json:"page"`
	Size    int   `json:"size"`
	Total   int64 `json:"total"`
	Pages   int   `json:"pages"`
	HasMore bool  `json:"has_more"`
}

func RespondWithSuccess(c *gin.Context, statusCode int, message string, data interface{}) {
	c.JSON(statusCode, SuccessResponse{
		Success: true,
		Message: message,
		Data:    data,
	})
}

func RespondWithError(c *gin.Context, statusCode int, message string) {
	c.JSON(statusCode, ErrorResponse{
		Success: false,
		Message: message,
	})
}

func RespondWithValidationError(c *gin.Context, err error) {
	var errors []string
	if validationErrors, ok := err.(validator.ValidationErrors); ok {
		for _, fieldError := range validationErrors {
			errors = append(errors, fieldError.Error())
		}
	} else {
		errors = append(errors, err.Error())
	}

	c.JSON(http.StatusBadRequest, ErrorResponse{
		Success: false,
		Message: "Validation failed",
		Error:   errors,
	})
}

// ValidateStruct validates a struct using go-playground/validator
func ValidateStruct(s interface{}) error {
	validate := validator.New()
	return validate.Struct(s)
}
