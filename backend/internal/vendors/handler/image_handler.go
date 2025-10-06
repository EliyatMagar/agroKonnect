package handler

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	vendorUtils "agro_konnect/internal/vendors/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type VendorImageHandler struct {
	uploadDir string
}

func NewVendorImageHandler(uploadDir string) *VendorImageHandler {
	// Create upload directory if it doesn't exist
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		panic(fmt.Sprintf("Failed to create upload directory: %v", err))
	}

	return &VendorImageHandler{
		uploadDir: uploadDir,
	}
}

// UploadVendorProductImage handles vendor product image upload
// @Summary Upload vendor product image
// @Description Upload an image for a vendor product
// @Tags vendor-products
// @Accept multipart/form-data
// @Produce json
// @Security BearerAuth
// @Param file formData file true "Image file"
// @Success 200 {object} vendorUtils.SuccessResponse{data=string} "Image uploaded successfully"
// @Failure 400 {object} vendorUtils.ErrorResponse "Invalid file"
// @Failure 500 {object} vendorUtils.ErrorResponse "Failed to upload image"
// @Router /vendors/products/images/upload [post]
func (h *VendorImageHandler) UploadVendorProductImage(c *gin.Context) {
	// Get the file from the form data
	file, err := c.FormFile("file")
	if err != nil {
		vendorUtils.RespondWithError(c, http.StatusBadRequest, "Failed to get file from form data")
		return
	}

	// Validate file size (max 5MB)
	if file.Size > 5<<20 {
		vendorUtils.RespondWithError(c, http.StatusBadRequest, "File size too large. Maximum size is 5MB")
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
		vendorUtils.RespondWithError(c, http.StatusBadRequest, "Failed to open file")
		return
	}
	defer fileHeader.Close()

	// Read first 512 bytes to detect content type
	buffer := make([]byte, 512)
	_, err = fileHeader.Read(buffer)
	if err != nil {
		vendorUtils.RespondWithError(c, http.StatusBadRequest, "Failed to read file")
		return
	}

	contentType := http.DetectContentType(buffer)
	if !allowedTypes[contentType] {
		vendorUtils.RespondWithError(c, http.StatusBadRequest, "Invalid file type. Only JPEG, PNG, and WebP are allowed")
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
		vendorUtils.RespondWithError(c, http.StatusInternalServerError, "Failed to save file")
		return
	}

	// Return the file path or URL
	imageURL := fmt.Sprintf("/api/vendors/products/images/%s", filename)
	vendorUtils.RespondWithSuccess(c, http.StatusOK, "Image uploaded successfully", imageURL)
}

// ServeVendorProductImage serves uploaded vendor product images
// @Summary Serve vendor product image
// @Description Serve uploaded vendor product images
// @Tags vendor-products
// @Produce image/*
// @Param filename path string true "Image filename"
// @Success 200 {file} file "Image file"
// @Failure 404 {object} vendorUtils.ErrorResponse "Image not found"
// @Router /vendors/products/images/{filename} [get]
func (h *VendorImageHandler) ServeVendorProductImage(c *gin.Context) {
	filename := c.Param("filename")
	if filename == "" {
		vendorUtils.RespondWithError(c, http.StatusBadRequest, "Filename is required")
		return
	}

	// Security check: prevent directory traversal
	if strings.Contains(filename, "..") || strings.Contains(filename, "/") {
		vendorUtils.RespondWithError(c, http.StatusBadRequest, "Invalid filename")
		return
	}

	filePath := filepath.Join(h.uploadDir, filename)

	// Check if file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		vendorUtils.RespondWithError(c, http.StatusNotFound, "Image not found")
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

// DeleteVendorProductImage deletes a vendor product image
// @Summary Delete vendor product image
// @Description Delete an uploaded vendor product image
// @Tags vendor-products
// @Produce json
// @Security BearerAuth
// @Param filename path string true "Image filename"
// @Success 200 {object} vendorUtils.SuccessResponse "Image deleted successfully"
// @Failure 400 {object} vendorUtils.ErrorResponse "Invalid filename"
// @Failure 404 {object} vendorUtils.ErrorResponse "Image not found"
// @Failure 500 {object} vendorUtils.ErrorResponse "Failed to delete image"
// @Router /vendors/products/images/{filename} [delete]
func (h *VendorImageHandler) DeleteVendorProductImage(c *gin.Context) {
	filename := c.Param("filename")
	if filename == "" {
		vendorUtils.RespondWithError(c, http.StatusBadRequest, "Filename is required")
		return
	}

	// Security check: prevent directory traversal
	if strings.Contains(filename, "..") || strings.Contains(filename, "/") {
		vendorUtils.RespondWithError(c, http.StatusBadRequest, "Invalid filename")
		return
	}

	filePath := filepath.Join(h.uploadDir, filename)

	// Check if file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		vendorUtils.RespondWithError(c, http.StatusNotFound, "Image not found")
		return
	}

	// Delete the file
	if err := os.Remove(filePath); err != nil {
		vendorUtils.RespondWithError(c, http.StatusInternalServerError, "Failed to delete image")
		return
	}

	vendorUtils.RespondWithSuccess(c, http.StatusOK, "Image deleted successfully", nil)
}

// UploadMultipleVendorProductImages handles multiple vendor product image uploads
// @Summary Upload multiple vendor product images
// @Description Upload multiple images for a vendor product
// @Tags vendor-products
// @Accept multipart/form-data
// @Produce json
// @Security BearerAuth
// @Param files formData file true "Image files" collectionFormat(multi)
// @Success 200 {object} vendorUtils.SuccessResponse{data=[]string} "Images uploaded successfully"
// @Failure 400 {object} vendorUtils.ErrorResponse "Invalid files"
// @Failure 500 {object} vendorUtils.ErrorResponse "Failed to upload images"
// @Router /vendors/products/images/upload-multiple [post]
func (h *VendorImageHandler) UploadMultipleVendorProductImages(c *gin.Context) {
	form, err := c.MultipartForm()
	if err != nil {
		vendorUtils.RespondWithError(c, http.StatusBadRequest, "Failed to parse form data")
		return
	}

	files := form.File["files"]
	if len(files) == 0 {
		vendorUtils.RespondWithError(c, http.StatusBadRequest, "No files provided")
		return
	}

	// Limit number of files
	if len(files) > 5 {
		vendorUtils.RespondWithError(c, http.StatusBadRequest, "Maximum 5 files allowed")
		return
	}

	var uploadedURLs []string

	for _, file := range files {
		// Validate file size (max 5MB)
		if file.Size > 5<<20 {
			vendorUtils.RespondWithError(c, http.StatusBadRequest, fmt.Sprintf("File %s is too large. Maximum size is 5MB", file.Filename))
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
			vendorUtils.RespondWithError(c, http.StatusInternalServerError, "Failed to save files")
			return
		}

		imageURL := fmt.Sprintf("/api/vendors/products/images/%s", filename)
		uploadedURLs = append(uploadedURLs, imageURL)
	}

	vendorUtils.RespondWithSuccess(c, http.StatusOK, "Images uploaded successfully", uploadedURLs)
}

// UploadVendorLogo handles vendor logo upload
// @Summary Upload vendor logo
// @Description Upload a logo for a vendor profile
// @Tags vendors
// @Accept multipart/form-data
// @Produce json
// @Security BearerAuth
// @Param file formData file true "Logo file"
// @Success 200 {object} vendorUtils.SuccessResponse{data=string} "Logo uploaded successfully"
// @Failure 400 {object} vendorUtils.ErrorResponse "Invalid file"
// @Failure 500 {object} vendorUtils.ErrorResponse "Failed to upload logo"
// @Router /vendors/logo/upload [post]
func (h *VendorImageHandler) UploadVendorLogo(c *gin.Context) {
	// Get the file from the form data
	file, err := c.FormFile("file")
	if err != nil {
		vendorUtils.RespondWithError(c, http.StatusBadRequest, "Failed to get file from form data")
		return
	}

	// Validate file size (max 2MB for logos)
	if file.Size > 2<<20 {
		vendorUtils.RespondWithError(c, http.StatusBadRequest, "File size too large. Maximum size is 2MB")
		return
	}

	// Validate file type
	allowedTypes := map[string]bool{
		"image/jpeg":    true,
		"image/jpg":     true,
		"image/png":     true,
		"image/webp":    true,
		"image/svg+xml": true,
	}

	fileHeader, err := file.Open()
	if err != nil {
		vendorUtils.RespondWithError(c, http.StatusBadRequest, "Failed to open file")
		return
	}
	defer fileHeader.Close()

	// Read first 512 bytes to detect content type
	buffer := make([]byte, 512)
	_, err = fileHeader.Read(buffer)
	if err != nil {
		vendorUtils.RespondWithError(c, http.StatusBadRequest, "Failed to read file")
		return
	}

	contentType := http.DetectContentType(buffer)
	if !allowedTypes[contentType] {
		vendorUtils.RespondWithError(c, http.StatusBadRequest, "Invalid file type. Only JPEG, PNG, WebP, and SVG are allowed")
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
		case "image/svg+xml":
			fileExt = ".svg"
		default:
			fileExt = ".png"
		}
	}

	filename := fmt.Sprintf("logo_%s%s", uuid.New().String(), strings.ToLower(fileExt))
	filePath := filepath.Join(h.uploadDir, "logos", filename)

	// Create logos subdirectory if it doesn't exist
	if err := os.MkdirAll(filepath.Dir(filePath), 0755); err != nil {
		vendorUtils.RespondWithError(c, http.StatusInternalServerError, "Failed to create directory")
		return
	}

	// Save the file
	if err := c.SaveUploadedFile(file, filePath); err != nil {
		vendorUtils.RespondWithError(c, http.StatusInternalServerError, "Failed to save file")
		return
	}

	// Return the file path or URL
	logoURL := fmt.Sprintf("/api/vendors/logos/%s", filename)
	vendorUtils.RespondWithSuccess(c, http.StatusOK, "Logo uploaded successfully", logoURL)
}

// ServeVendorLogo serves uploaded vendor logos
// @Summary Serve vendor logo
// @Description Serve uploaded vendor logos
// @Tags vendors
// @Produce image/*
// @Param filename path string true "Logo filename"
// @Success 200 {file} file "Logo file"
// @Failure 404 {object} vendorUtils.ErrorResponse "Logo not found"
// @Router /vendors/logos/{filename} [get]
func (h *VendorImageHandler) ServeVendorLogo(c *gin.Context) {
	filename := c.Param("filename")
	if filename == "" {
		vendorUtils.RespondWithError(c, http.StatusBadRequest, "Filename is required")
		return
	}

	// Security check: prevent directory traversal
	if strings.Contains(filename, "..") || strings.Contains(filename, "/") {
		vendorUtils.RespondWithError(c, http.StatusBadRequest, "Invalid filename")
		return
	}

	filePath := filepath.Join(h.uploadDir, "logos", filename)

	// Check if file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		vendorUtils.RespondWithError(c, http.StatusNotFound, "Logo not found")
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
	case ".svg":
		c.Header("Content-Type", "image/svg+xml")
	default:
		c.Header("Content-Type", "application/octet-stream")
	}

	c.File(filePath)
}
