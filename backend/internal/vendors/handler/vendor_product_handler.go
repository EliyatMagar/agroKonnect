package handler

import (
	"net/http"

	dto "agro_konnect/internal/vendors/dto"
	"agro_konnect/internal/vendors/service"
	"agro_konnect/internal/vendors/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type VendorProductHandler struct {
	vendorProductService service.VendorProductService
}

func NewVendorProductHandler(vendorProductService service.VendorProductService) *VendorProductHandler {
	return &VendorProductHandler{
		vendorProductService: vendorProductService,
	}
}

// AddProduct adds a new product to vendor's catalog
// @Summary Add vendor product
// @Description Add a new product to the authenticated vendor's catalog
// @Tags vendor-products
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body dto.AddVendorProductRequest true "Product data"
// @Success 201 {object} utils.SuccessResponse{data=model.VendorProduct} "Product added successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid input data"
// @Failure 401 {object} utils.ErrorResponse "Unauthorized"
// @Failure 404 {object} utils.ErrorResponse "Vendor profile not found"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /vendors/products [post]
func (h *VendorProductHandler) AddProduct(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil {
		utils.RespondWithError(c, http.StatusUnauthorized, err.Error())
		return
	}

	var req dto.AddVendorProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid input data: "+err.Error())
		return
	}

	// Validate using custom validator
	if err := utils.ValidateStruct(req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, err.Error())
		return
	}

	product, err := h.vendorProductService.AddProduct(c.Request.Context(), userID, &req)
	if err != nil {
		switch err {
		case service.ErrVendorNotFound:
			utils.RespondWithError(c, http.StatusNotFound, "Vendor profile not found")
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to add product")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusCreated, "Product added successfully", product)
}

// GetMyProducts gets the current vendor's products
// @Summary Get my products
// @Description Get all products for the authenticated vendor
// @Tags vendor-products
// @Produce json
// @Security BearerAuth
// @Success 200 {object} utils.SuccessResponse{data=[]dto.VendorProductResponse} "Products retrieved successfully"
// @Failure 401 {object} utils.ErrorResponse "Unauthorized"
// @Failure 404 {object} utils.ErrorResponse "Vendor profile not found"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /vendors/me/products [get]
func (h *VendorProductHandler) GetMyProducts(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil {
		utils.RespondWithError(c, http.StatusUnauthorized, err.Error())
		return
	}

	products, err := h.vendorProductService.GetProductsByVendor(c.Request.Context(), userID)
	if err != nil {
		switch err {
		case service.ErrVendorNotFound:
			utils.RespondWithError(c, http.StatusNotFound, "Vendor profile not found")
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to retrieve products")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Products retrieved successfully", products)
}

// UpdateProduct updates a vendor product
// @Summary Update vendor product
// @Description Update a product in the authenticated vendor's catalog
// @Tags vendor-products
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Product ID"
// @Param request body dto.UpdateVendorProductRequest true "Product update data"
// @Success 200 {object} utils.SuccessResponse{data=dto.VendorProductResponse} "Product updated successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid input data"
// @Failure 401 {object} utils.ErrorResponse "Unauthorized"
// @Failure 403 {object} utils.ErrorResponse "Forbidden"
// @Failure 404 {object} utils.ErrorResponse "Product not found"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /vendors/products/{id} [put]
func (h *VendorProductHandler) UpdateProduct(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil {
		utils.RespondWithError(c, http.StatusUnauthorized, err.Error())
		return
	}

	productID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid product ID")
		return
	}

	var req dto.UpdateVendorProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid input data: "+err.Error())
		return
	}

	// Validate using custom validator
	if err := utils.ValidateStruct(req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, err.Error())
		return
	}

	product, err := h.vendorProductService.UpdateProduct(c.Request.Context(), productID, userID, &req)
	if err != nil {
		switch err {
		case service.ErrVendorProductNotFound:
			utils.RespondWithError(c, http.StatusNotFound, err.Error())
		case service.ErrUnauthorized:
			utils.RespondWithError(c, http.StatusForbidden, err.Error())
		case service.ErrVendorNotFound:
			utils.RespondWithError(c, http.StatusNotFound, "Vendor profile not found")
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to update product")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Product updated successfully", product)
}

// DeleteProduct deletes a vendor product
// @Summary Delete vendor product
// @Description Delete a product from the authenticated vendor's catalog
// @Tags vendor-products
// @Produce json
// @Security BearerAuth
// @Param id path string true "Product ID"
// @Success 200 {object} utils.SuccessResponse "Product deleted successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid product ID"
// @Failure 401 {object} utils.ErrorResponse "Unauthorized"
// @Failure 403 {object} utils.ErrorResponse "Forbidden"
// @Failure 404 {object} utils.ErrorResponse "Product not found"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /vendors/products/{id} [delete]
func (h *VendorProductHandler) DeleteProduct(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil {
		utils.RespondWithError(c, http.StatusUnauthorized, err.Error())
		return
	}

	productID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid product ID")
		return
	}

	if err := h.vendorProductService.DeleteProduct(c.Request.Context(), productID, userID); err != nil {
		switch err {
		case service.ErrVendorProductNotFound:
			utils.RespondWithError(c, http.StatusNotFound, err.Error())
		case service.ErrUnauthorized:
			utils.RespondWithError(c, http.StatusForbidden, err.Error())
		case service.ErrVendorNotFound:
			utils.RespondWithError(c, http.StatusNotFound, "Vendor profile not found")
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to delete product")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Product deleted successfully", nil)
}

// UpdateStock updates vendor product stock
// @Summary Update vendor product stock
// @Description Update stock quantity for a vendor product
// @Tags vendor-products
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Product ID"
// @Param request body dto.UpdateVendorStockRequest true "Stock update data"
// @Success 200 {object} utils.SuccessResponse "Stock updated successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid input data"
// @Failure 401 {object} utils.ErrorResponse "Unauthorized"
// @Failure 403 {object} utils.ErrorResponse "Forbidden"
// @Failure 404 {object} utils.ErrorResponse "Product not found"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /vendors/products/{id}/stock [put]
func (h *VendorProductHandler) UpdateStock(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil {
		utils.RespondWithError(c, http.StatusUnauthorized, err.Error())
		return
	}

	productID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid product ID")
		return
	}

	var req struct {
		Stock int `json:"stock" validate:"required,min=0"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid input data: "+err.Error())
		return
	}

	if err := h.vendorProductService.UpdateStock(c.Request.Context(), productID, userID, req.Stock); err != nil {
		switch err {
		case service.ErrVendorProductNotFound:
			utils.RespondWithError(c, http.StatusNotFound, err.Error())
		case service.ErrUnauthorized:
			utils.RespondWithError(c, http.StatusForbidden, err.Error())
		case service.ErrVendorNotFound:
			utils.RespondWithError(c, http.StatusNotFound, "Vendor profile not found")
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to update stock")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Stock updated successfully", nil)
}

// UpdateProductStatus updates vendor product status
// @Summary Update vendor product status
// @Description Update active status for a vendor product
// @Tags vendor-products
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Product ID"
// @Param request body dto.UpdateVendorProductStatusRequest true "Status update data"
// @Success 200 {object} utils.SuccessResponse "Status updated successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid input data"
// @Failure 401 {object} utils.ErrorResponse "Unauthorized"
// @Failure 403 {object} utils.ErrorResponse "Forbidden"
// @Failure 404 {object} utils.ErrorResponse "Product not found"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /vendors/products/{id}/status [put]
func (h *VendorProductHandler) UpdateProductStatus(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil {
		utils.RespondWithError(c, http.StatusUnauthorized, err.Error())
		return
	}

	productID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid product ID")
		return
	}

	var req struct {
		IsActive bool `json:"is_active" validate:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid input data: "+err.Error())
		return
	}

	if err := h.vendorProductService.UpdateProductStatus(c.Request.Context(), productID, userID, req.IsActive); err != nil {
		switch err {
		case service.ErrVendorProductNotFound:
			utils.RespondWithError(c, http.StatusNotFound, err.Error())
		case service.ErrUnauthorized:
			utils.RespondWithError(c, http.StatusForbidden, err.Error())
		case service.ErrVendorNotFound:
			utils.RespondWithError(c, http.StatusNotFound, "Vendor profile not found")
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to update status")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Status updated successfully", nil)
}

// GetVendorProducts gets products by vendor ID
// @Summary Get vendor products
// @Description Get all active products for a specific vendor
// @Tags vendor-products
// @Produce json
// @Param vendor_id path string true "Vendor ID"
// @Success 200 {object} utils.SuccessResponse{data=[]dto.VendorProductResponse} "Products retrieved successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid vendor ID"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /vendors/{vendor_id}/products [get]
// GetVendorProducts gets products by vendor ID
// @Summary Get vendor products
// @Description Get all active products for a specific vendor
// @Tags vendor-products
// @Produce json
// @Param id path string true "Vendor ID"
// @Success 200 {object} utils.SuccessResponse{data=[]dto.VendorProductResponse} "Products retrieved successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid vendor ID"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /vendors/{id}/products [get]
func (h *VendorProductHandler) GetVendorProducts(c *gin.Context) {
	vendorID, err := uuid.Parse(c.Param("id")) // Changed from "vendor_id" to "id"
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid vendor ID")
		return
	}

	products, err := h.vendorProductService.GetActiveProductsByVendor(c.Request.Context(), vendorID)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to retrieve products")
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Products retrieved successfully", products)
}
