package handler

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"agro_konnect/internal/product/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ImageHandler struct {
	uploadDir string
}

func NewImageHandler(uploadDir string) *ImageHandler {
	// Create upload directory if it doesn't exist
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		panic(fmt.Sprintf("Failed to create upload directory: %v", err))
	}

	return &ImageHandler{
		uploadDir: uploadDir,
	}
}

// UploadProductImage handles product image upload
// @Summary Upload product image
// @Description Upload an image for a product
// @Tags products
// @Accept multipart/form-data
// @Produce json
// @Security BearerAuth
// @Param file formData file true "Image file"
// @Success 200 {object} utils.SuccessResponse{data=string} "Image uploaded successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid file"
// @Failure 500 {object} utils.ErrorResponse "Failed to upload image"
// @Router /products/images/upload [post]
func (h *ImageHandler) UploadProductImage(c *gin.Context) {
	// Get the file from the form data
	file, err := c.FormFile("file")
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Failed to get file from form data")
		return
	}

	// Validate file size (max 5MB)
	if file.Size > 5<<20 {
		utils.RespondWithError(c, http.StatusBadRequest, "File size too large. Maximum size is 5MB")
		return
	}

	// Validate file type
	allowedTypes := map[string]bool{
		"image/jpeg": true,
		"image/jpg":  true,
		"image/png":  true,
		"image/webp": true,
	}

	fileHeader, err := file.Open()
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Failed to open file")
		return
	}
	defer fileHeader.Close()

	// Read first 512 bytes to detect content type
	buffer := make([]byte, 512)
	_, err = fileHeader.Read(buffer)
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Failed to read file")
		return
	}

	contentType := http.DetectContentType(buffer)
	if !allowedTypes[contentType] {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid file type. Only JPEG, PNG, and WebP are allowed")
		return
	}

	// Generate unique filename
	fileExt := filepath.Ext(file.Filename)
	if fileExt == "" {
		// Determine extension from content type
		switch contentType {
		case "image/jpeg", "image/jpg":
			fileExt = ".jpg"
		case "image/png":
			fileExt = ".png"
		case "image/webp":
			fileExt = ".webp"
		default:
			fileExt = ".jpg"
		}
	}

	filename := fmt.Sprintf("%s%s", uuid.New().String(), strings.ToLower(fileExt))
	filePath := filepath.Join(h.uploadDir, filename)

	// Save the file
	if err := c.SaveUploadedFile(file, filePath); err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to save file")
		return
	}

	// Return the file path or URL
	imageURL := fmt.Sprintf("/api/v1/products/images/%s", filename)
	utils.RespondWithSuccess(c, http.StatusOK, "Image uploaded successfully", imageURL)
}

// ServeProductImage serves uploaded product images
// @Summary Serve product image
// @Description Serve uploaded product images
// @Tags products
// @Produce image/*
// @Param filename path string true "Image filename"
// @Success 200 {file} file "Image file"
// @Failure 404 {object} utils.ErrorResponse "Image not found"
// @Router /products/images/{filename} [get]
func (h *ImageHandler) ServeProductImage(c *gin.Context) {
	filename := c.Param("filename")
	if filename == "" {
		utils.RespondWithError(c, http.StatusBadRequest, "Filename is required")
		return
	}

	// Security check: prevent directory traversal
	if strings.Contains(filename, "..") || strings.Contains(filename, "/") {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid filename")
		return
	}

	filePath := filepath.Join(h.uploadDir, filename)

	// Check if file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		utils.RespondWithError(c, http.StatusNotFound, "Image not found")
		return
	}

	// Set appropriate content type based on file extension
	ext := strings.ToLower(filepath.Ext(filename))
	switch ext {
	case ".jpg", ".jpeg":
		c.Header("Content-Type", "image/jpeg")
	case ".png":
		c.Header("Content-Type", "image/png")
	case ".webp":
		c.Header("Content-Type", "image/webp")
	default:
		c.Header("Content-Type", "application/octet-stream")
	}

	c.File(filePath)
}

// DeleteProductImage deletes a product image
// @Summary Delete product image
// @Description Delete an uploaded product image
// @Tags products
// @Produce json
// @Security BearerAuth
// @Param filename path string true "Image filename"
// @Success 200 {object} utils.SuccessResponse "Image deleted successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid filename"
// @Failure 404 {object} utils.ErrorResponse "Image not found"
// @Failure 500 {object} utils.ErrorResponse "Failed to delete image"
// @Router /products/images/{filename} [delete]
func (h *ImageHandler) DeleteProductImage(c *gin.Context) {
	filename := c.Param("filename")
	if filename == "" {
		utils.RespondWithError(c, http.StatusBadRequest, "Filename is required")
		return
	}

	// Security check: prevent directory traversal
	if strings.Contains(filename, "..") || strings.Contains(filename, "/") {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid filename")
		return
	}

	filePath := filepath.Join(h.uploadDir, filename)

	// Check if file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		utils.RespondWithError(c, http.StatusNotFound, "Image not found")
		return
	}

	// Delete the file
	if err := os.Remove(filePath); err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to delete image")
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Image deleted successfully", nil)
}

// UploadMultipleProductImages handles multiple product image uploads
// @Summary Upload multiple product images
// @Description Upload multiple images for a product
// @Tags products
// @Accept multipart/form-data
// @Produce json
// @Security BearerAuth
// @Param files formData file true "Image files" collectionFormat(multi)
// @Success 200 {object} utils.SuccessResponse{data=[]string} "Images uploaded successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid files"
// @Failure 500 {object} utils.ErrorResponse "Failed to upload images"
// @Router /products/images/upload-multiple [post]
func (h *ImageHandler) UploadMultipleProductImages(c *gin.Context) {
	form, err := c.MultipartForm()
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Failed to parse form data")
		return
	}

	files := form.File["files"]
	if len(files) == 0 {
		utils.RespondWithError(c, http.StatusBadRequest, "No files provided")
		return
	}

	// Limit number of files
	if len(files) > 5 {
		utils.RespondWithError(c, http.StatusBadRequest, "Maximum 5 files allowed")
		return
	}

	var uploadedURLs []string

	for _, file := range files {
		// Validate file size (max 5MB)
		if file.Size > 5<<20 {
			utils.RespondWithError(c, http.StatusBadRequest, fmt.Sprintf("File %s is too large. Maximum size is 5MB", file.Filename))
			return
		}

		// Generate unique filename
		fileExt := filepath.Ext(file.Filename)
		if fileExt == "" {
			fileExt = ".jpg"
		}

		filename := fmt.Sprintf("%s%s", uuid.New().String(), strings.ToLower(fileExt))
		filePath := filepath.Join(h.uploadDir, filename)

		// Save the file
		if err := c.SaveUploadedFile(file, filePath); err != nil {
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to save files")
			return
		}

		imageURL := fmt.Sprintf("/api/v1/products/images/%s", filename)
		uploadedURLs = append(uploadedURLs, imageURL)
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Images uploaded successfully", uploadedURLs)
}
