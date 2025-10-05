package handler

import (
	"net/http"
	"strconv"

	dto "agro_konnect/internal/product/dto"
	model "agro_konnect/internal/product/model"
	"agro_konnect/internal/product/service"
	"agro_konnect/internal/product/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AdminProductHandler struct {
	adminService service.AdminProductService
}

func NewAdminProductHandler(adminService service.AdminProductService) *AdminProductHandler {
	return &AdminProductHandler{
		adminService: adminService,
	}
}

// GetProductsAdmin gets all products with admin filters
// @Summary Get all products (Admin)
// @Description Get all products with advanced filtering and pagination for admin
// @Tags admin-products
// @Produce json
// @Security BearerAuth
// @Param page query integer false "Page number" default(1)
// @Param page_size query integer false "Page size" default(20)
// @Param search query string false "Search term"
// @Param status query string false "Status filter"
// @Param category query string false "Category filter"
// @Success 200 {object} utils.SuccessResponse{data=dto.AdminProductListResponse} "Products retrieved successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid query parameters"
// @Failure 401 {object} utils.ErrorResponse "Unauthorized"
// @Failure 403 {object} utils.ErrorResponse "Forbidden"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /admin/products [get]
func (h *AdminProductHandler) GetProductsAdmin(c *gin.Context) {
	var req dto.AdminProductFilterRequest

	// Bind query parameters
	if err := c.ShouldBindQuery(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid query parameters: "+err.Error())
		return
	}

	response, err := h.adminService.GetAllProducts(c.Request.Context(), &req)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to retrieve products")
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Products retrieved successfully", response)
}

// GetProductAdmin gets a product by ID for admin
// @Summary Get product by ID (Admin)
// @Description Get a product by its ID with admin details
// @Tags admin-products
// @Produce json
// @Security BearerAuth
// @Param id path string true "Product ID"
// @Success 200 {object} utils.SuccessResponse{data=dto.AdminProductResponse} "Product retrieved successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid product ID"
// @Failure 401 {object} utils.ErrorResponse "Unauthorized"
// @Failure 403 {object} utils.ErrorResponse "Forbidden"
// @Failure 404 {object} utils.ErrorResponse "Product not found"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /admin/products/{id} [get]
func (h *AdminProductHandler) GetProductAdmin(c *gin.Context) {
	productID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid product ID")
		return
	}

	product, err := h.adminService.GetProductByID(c.Request.Context(), productID)
	if err != nil {
		switch err {
		case service.ErrProductNotFound:
			utils.RespondWithError(c, http.StatusNotFound, err.Error())
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to retrieve product")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Product retrieved successfully", product)
}

// UpdateProductStatus updates product status (admin only)
// @Summary Update product status (Admin)
// @Description Update product status (admin only)
// @Tags admin-products
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Product ID"
// @Param request body dto.UpdateProductStatusRequest true "Status update data"
// @Success 200 {object} utils.SuccessResponse "Product status updated successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid input data"
// @Failure 401 {object} utils.ErrorResponse "Unauthorized"
// @Failure 403 {object} utils.ErrorResponse "Forbidden"
// @Failure 404 {object} utils.ErrorResponse "Product not found"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /admin/products/{id}/status [put]
func (h *AdminProductHandler) UpdateProductStatus(c *gin.Context) {
	productID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid product ID")
		return
	}

	var req dto.UpdateProductStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid input data: "+err.Error())
		return
	}

	status := model.ProductStatus(req.Status)
	if err := h.adminService.UpdateProductStatus(c.Request.Context(), productID, status); err != nil {
		switch err {
		case service.ErrProductNotFound:
			utils.RespondWithError(c, http.StatusNotFound, err.Error())
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to update product status")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Product status updated successfully", nil)
}

// BulkUpdateProductStatus bulk updates product status
// @Summary Bulk update product status (Admin)
// @Description Bulk update product status for multiple products
// @Tags admin-products
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body dto.BulkUpdateStatusRequest true "Bulk status update data"
// @Success 200 {object} utils.SuccessResponse "Product statuses updated successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid input data"
// @Failure 401 {object} utils.ErrorResponse "Unauthorized"
// @Failure 403 {object} utils.ErrorResponse "Forbidden"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /admin/products/bulk-status [put]
func (h *AdminProductHandler) BulkUpdateProductStatus(c *gin.Context) {
	var req dto.BulkUpdateStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid input data: "+err.Error())
		return
	}

	if err := h.adminService.BulkUpdateProductStatus(c.Request.Context(), &req); err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to update product statuses")
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Product statuses updated successfully", nil)
}

// DeleteProduct deletes a product (admin only)
// @Summary Delete product (Admin)
// @Description Delete a product (admin only)
// @Tags admin-products
// @Produce json
// @Security BearerAuth
// @Param id path string true "Product ID"
// @Success 200 {object} utils.SuccessResponse "Product deleted successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid product ID"
// @Failure 401 {object} utils.ErrorResponse "Unauthorized"
// @Failure 403 {object} utils.ErrorResponse "Forbidden"
// @Failure 404 {object} utils.ErrorResponse "Product not found"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /admin/products/{id} [delete]
func (h *AdminProductHandler) DeleteProduct(c *gin.Context) {
	productID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid product ID")
		return
	}

	if err := h.adminService.DeleteProduct(c.Request.Context(), productID); err != nil {
		switch err {
		case service.ErrProductNotFound:
			utils.RespondWithError(c, http.StatusNotFound, err.Error())
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to delete product")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Product deleted successfully", nil)
}

// BulkDeleteProducts bulk deletes products
// @Summary Bulk delete products (Admin)
// @Description Bulk delete multiple products
// @Tags admin-products
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body dto.BulkDeleteRequest true "Bulk delete data"
// @Success 200 {object} utils.SuccessResponse "Products deleted successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid input data"
// @Failure 401 {object} utils.ErrorResponse "Unauthorized"
// @Failure 403 {object} utils.ErrorResponse "Forbidden"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /admin/products/bulk-delete [delete]
func (h *AdminProductHandler) BulkDeleteProducts(c *gin.Context) {
	var req dto.BulkDeleteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid input data: "+err.Error())
		return
	}

	if err := h.adminService.BulkDeleteProducts(c.Request.Context(), req.ProductIDs); err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to delete products")
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Products deleted successfully", nil)
}

// GetProductStats gets product statistics
// @Summary Get product statistics (Admin)
// @Description Get comprehensive product statistics for admin dashboard
// @Tags admin-products
// @Produce json
// @Security BearerAuth
// @Success 200 {object} utils.SuccessResponse{data=dto.ProductStatsResponse} "Product statistics retrieved successfully"
// @Failure 401 {object} utils.ErrorResponse "Unauthorized"
// @Failure 403 {object} utils.ErrorResponse "Forbidden"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /admin/products/stats [get]
func (h *AdminProductHandler) GetProductStats(c *gin.Context) {
	stats, err := h.adminService.GetProductStats(c.Request.Context())
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to retrieve product statistics")
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Product statistics retrieved successfully", stats)
}

// GetProductsByStatus gets products by status
// @Summary Get products by status (Admin)
// @Description Get products filtered by specific status
// @Tags admin-products
// @Produce json
// @Security BearerAuth
// @Param status path string true "Product status"
// @Param page query integer false "Page number" default(1)
// @Param page_size query integer false "Page size" default(20)
// @Success 200 {object} utils.SuccessResponse{data=dto.AdminProductListResponse} "Products retrieved successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid status"
// @Failure 401 {object} utils.ErrorResponse "Unauthorized"
// @Failure 403 {object} utils.ErrorResponse "Forbidden"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /admin/products/status/{status} [get]
func (h *AdminProductHandler) GetProductsByStatus(c *gin.Context) {
	status := c.Param("status")

	// Validate status
	validStatuses := map[string]bool{
		"draft":    true,
		"active":   true,
		"inactive": true,
		"sold_out": true,
		"expired":  true,
	}

	if !validStatuses[status] {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid status")
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	response, err := h.adminService.GetProductsByStatus(c.Request.Context(), model.ProductStatus(status), page, pageSize)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to retrieve products")
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Products retrieved successfully", response)
}

// UpdateProductFeaturedStatus updates product featured status
// @Summary Update product featured status (Admin)
// @Description Update product featured status
// @Tags admin-products
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Product ID"
// @Param request body dto.UpdateFeaturedRequest true "Featured status update data"
// @Success 200 {object} utils.SuccessResponse "Product featured status updated successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid input data"
// @Failure 401 {object} utils.ErrorResponse "Unauthorized"
// @Failure 403 {object} utils.ErrorResponse "Forbidden"
// @Failure 404 {object} utils.ErrorResponse "Product not found"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /admin/products/{id}/featured [put]
func (h *AdminProductHandler) UpdateProductFeaturedStatus(c *gin.Context) {
	productID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid product ID")
		return
	}

	var req dto.UpdateFeaturedRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid input data: "+err.Error())
		return
	}

	if err := h.adminService.UpdateProductFeaturedStatus(c.Request.Context(), productID, req.IsFeatured); err != nil {
		switch err {
		case service.ErrProductNotFound:
			utils.RespondWithError(c, http.StatusNotFound, err.Error())
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to update product featured status")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Product featured status updated successfully", nil)
}

// GetExpiringProducts gets expiring products
// @Summary Get expiring products (Admin)
// @Description Get products that are expiring soon
// @Tags admin-products
// @Produce json
// @Security BearerAuth
// @Param days query integer false "Days until expiry" default(7)
// @Success 200 {object} utils.SuccessResponse{data=[]dto.AdminProductResponse} "Expiring products retrieved successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid days parameter"
// @Failure 401 {object} utils.ErrorResponse "Unauthorized"
// @Failure 403 {object} utils.ErrorResponse "Forbidden"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /admin/products/alerts/expiring [get]
func (h *AdminProductHandler) GetExpiringProducts(c *gin.Context) {
	days, _ := strconv.Atoi(c.DefaultQuery("days", "7"))

	products, err := h.adminService.GetExpiringProducts(c.Request.Context(), days)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to retrieve expiring products")
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Expiring products retrieved successfully", products)
}

// GetLowStockProducts gets low stock products
// @Summary Get low stock products (Admin)
// @Description Get products with low stock
// @Tags admin-products
// @Produce json
// @Security BearerAuth
// @Param threshold query number false "Stock threshold" default(10)
// @Success 200 {object} utils.SuccessResponse{data=[]dto.AdminProductResponse} "Low stock products retrieved successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid threshold parameter"
// @Failure 401 {object} utils.ErrorResponse "Unauthorized"
// @Failure 403 {object} utils.ErrorResponse "Forbidden"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /admin/products/alerts/low-stock [get]
func (h *AdminProductHandler) GetLowStockProducts(c *gin.Context) {
	threshold, _ := strconv.ParseFloat(c.DefaultQuery("threshold", "10"), 64)

	products, err := h.adminService.GetLowStockProducts(c.Request.Context(), threshold)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to retrieve low stock products")
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Low stock products retrieved successfully", products)
}
