package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

var validate = validator.New()

type ErrorResponse struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

func ValidateRequest(schema interface{}) gin.HandlerFunc {
	return func(c *gin.Context) {
		if err := c.ShouldBindJSON(schema); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Invalid request body",
				"details": err.Error(),
			})
			c.Abort()
			return
		}

		if err := validate.Struct(schema); err != nil {
			var errors []ErrorResponse
			for _, err := range err.(validator.ValidationErrors) {
				errors = append(errors, ErrorResponse{
					Field:   err.Field(),
					Message: getValidationMessage(err),
				})
			}
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Validation failed",
				"details": errors,
			})
			c.Abort()
			return
		}

		c.Set("validatedBody", schema)
		c.Next()
	}
}

func getValidationMessage(err validator.FieldError) string {
	switch err.Tag() {
	case "required":
		return "This field is required"
	case "email":
		return "Invalid email format"
	case "min":
		return "Value is too short"
	case "max":
		return "Value is too long"
	case "oneof":
		return "Value must be one of: " + err.Param()
	default:
		return "Invalid value"
	}
}
