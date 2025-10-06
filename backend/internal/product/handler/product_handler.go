package handler

import (
	"net/http"
	"strconv"
	"strings"

	dto "agro_konnect/internal/product/dto"
	model "agro_konnect/internal/product/model"
	"agro_konnect/internal/product/service"
	"agro_konnect/internal/product/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ProductHandler struct {
	productService service.ProductService
}

func NewProductHandler(productService service.ProductService) *ProductHandler {
	return &ProductHandler{
		productService: productService,
	}
}

// CreateProduct creates a new product
// @Summary Create product
// @Description Create a new product for the authenticated farmer
// @Tags products
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body dto.CreateProductRequest true "Product creation data"
// @Success 201 {object} utils.SuccessResponse{data=model.Product} "Product created successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid input data"
// @Failure 401 {object} utils.ErrorResponse "Unauthorized"
// @Failure 404 {object} utils.ErrorResponse "Farmer profile not found"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /products [post]
func (h *ProductHandler) CreateProduct(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil {
		utils.RespondWithError(c, http.StatusUnauthorized, err.Error())
		return
	}

	var req dto.CreateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid input data: "+err.Error())
		return
	}

	// Validate using custom validator
	if err := utils.ValidateStruct(req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, err.Error())
		return
	}

	product, err := h.productService.CreateProduct(c.Request.Context(), userID, &req)
	if err != nil {
		switch err {
		case service.ErrInvalidProductData, service.ErrInvalidHarvestDate:
			utils.RespondWithError(c, http.StatusBadRequest, err.Error())
		case service.ErrFarmerNotFound:
			utils.RespondWithError(c, http.StatusNotFound, "Farmer profile not found. Please create a farmer profile first")
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to create product")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusCreated, "Product created successfully", product)
}

// GetProductByID gets a product by ID
// @Summary Get product by ID
// @Description Get a product by its ID
// @Tags products
// @Produce json
// @Param id path string true "Product ID"
// @Success 200 {object} utils.SuccessResponse{data=dto.ProductResponse} "Product retrieved successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid product ID"
// @Failure 404 {object} utils.ErrorResponse "Product not found"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /products/{id} [get]
func (h *ProductHandler) GetProductByID(c *gin.Context) {
	productID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid product ID")
		return
	}

	product, err := h.productService.GetProductByID(c.Request.Context(), productID)
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

// GetMyProducts gets the current farmer's products
// @Summary Get my products
// @Description Get all products for the authenticated farmer
// @Tags products
// @Produce json
// @Security BearerAuth
// @Success 200 {object} utils.SuccessResponse{data=[]dto.ProductResponse} "Products retrieved successfully"
// @Failure 401 {object} utils.ErrorResponse "Unauthorized"
// @Failure 404 {object} utils.ErrorResponse "Farmer profile not found"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /products/me [get]
func (h *ProductHandler) GetMyProducts(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil {
		utils.RespondWithError(c, http.StatusUnauthorized, err.Error())
		return
	}

	products, err := h.productService.GetProductsByFarmer(c.Request.Context(), userID)
	if err != nil {
		switch err {
		case service.ErrFarmerNotFound:
			utils.RespondWithError(c, http.StatusNotFound, "Farmer profile not found")
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to retrieve products")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Products retrieved successfully", products)
}

// UpdateProduct updates a product
// @Summary Update product
// @Description Update a product for the authenticated farmer
// @Tags products
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Product ID"
// @Param request body dto.UpdateProductRequest true "Product update data"
// @Success 200 {object} utils.SuccessResponse{data=dto.ProductResponse} "Product updated successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid input data"
// @Failure 401 {object} utils.ErrorResponse "Unauthorized"
// @Failure 403 {object} utils.ErrorResponse "Forbidden"
// @Failure 404 {object} utils.ErrorResponse "Product not found"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /products/{id} [put]
func (h *ProductHandler) UpdateProduct(c *gin.Context) {
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

	var req dto.UpdateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid input data: "+err.Error())
		return
	}

	// Validate using custom validator
	if err := utils.ValidateStruct(req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, err.Error())
		return
	}

	product, err := h.productService.UpdateProduct(c.Request.Context(), productID, userID, &req)
	if err != nil {
		switch err {
		case service.ErrProductNotFound:
			utils.RespondWithError(c, http.StatusNotFound, err.Error())
		case service.ErrUnauthorizedAccess:
			utils.RespondWithError(c, http.StatusForbidden, err.Error())
		case service.ErrFarmerNotFound:
			utils.RespondWithError(c, http.StatusNotFound, "Farmer profile not found")
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to update product")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Product updated successfully", product)
}

// DeleteProduct deletes a product
// @Summary Delete product
// @Description Delete a product for the authenticated farmer
// @Tags products
// @Produce json
// @Security BearerAuth
// @Param id path string true "Product ID"
// @Success 200 {object} utils.SuccessResponse "Product deleted successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid product ID"
// @Failure 401 {object} utils.ErrorResponse "Unauthorized"
// @Failure 403 {object} utils.ErrorResponse "Forbidden"
// @Failure 404 {object} utils.ErrorResponse "Product not found"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /products/{id} [delete]
func (h *ProductHandler) DeleteProduct(c *gin.Context) {
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

	if err := h.productService.DeleteProduct(c.Request.Context(), productID, userID); err != nil {
		switch err {
		case service.ErrProductNotFound:
			utils.RespondWithError(c, http.StatusNotFound, err.Error())
		case service.ErrUnauthorizedAccess:
			utils.RespondWithError(c, http.StatusForbidden, err.Error())
		case service.ErrFarmerNotFound:
			utils.RespondWithError(c, http.StatusNotFound, "Farmer profile not found")
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to delete product")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Product deleted successfully", nil)
}

// GetAllProducts gets all products with optional filtering and pagination
// @Summary Get all products
// @Description Get a list of products with filtering and pagination
// @Tags products
// @Produce json
// @Param category query string false "Category filter"
// @Param farmer_id query string false "Farmer ID filter"
// @Param min_price query number false "Minimum price filter"
// @Param max_price query number false "Maximum price filter"
// @Param organic query boolean false "Organic filter"
// @Param certified query boolean false "Certified filter"
// @Param quality_grade query string false "Quality grade filter"
// @Param city query string false "City filter"
// @Param state query string false "State filter"
// @Param min_rating query number false "Minimum rating filter"
// @Param page query integer false "Page number" default(1)
// @Param page_size query integer false "Page size" default(10)
// @Success 200 {object} utils.SuccessResponse{data=dto.ProductListResponse} "Products retrieved successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid query parameters"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /products [get]
func (h *ProductHandler) GetAllProducts(c *gin.Context) {
	var filters dto.ProductFilterRequest

	// Bind query parameters
	if err := c.ShouldBindQuery(&filters); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid query parameters: "+err.Error())
		return
	}

	// Parse UUID parameters
	if c.Query("farmer_id") != "" {
		farmerID, err := uuid.Parse(c.Query("farmer_id"))
		if err != nil {
			utils.RespondWithError(c, http.StatusBadRequest, "Invalid farmer_id parameter")
			return
		}
		filters.FarmerID = farmerID
	}

	// Parse boolean parameters
	if c.Query("organic") != "" {
		organic, err := strconv.ParseBool(c.Query("organic"))
		if err != nil {
			utils.RespondWithError(c, http.StatusBadRequest, "Invalid organic parameter")
			return
		}
		filters.Organic = organic
	}

	if c.Query("certified") != "" {
		certified, err := strconv.ParseBool(c.Query("certified"))
		if err != nil {
			utils.RespondWithError(c, http.StatusBadRequest, "Invalid certified parameter")
			return
		}
		filters.Certified = certified
	}

	response, err := h.productService.GetAllProducts(c.Request.Context(), filters)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to retrieve products")
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Products retrieved successfully", response)
}

// UpdateStock updates product stock
// @Summary Update product stock
// @Description Update stock quantity for a product
// @Tags products
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Product ID"
// @Param request body dto.UpdateStockRequest true "Stock update data"
// @Success 200 {object} utils.SuccessResponse "Stock updated successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid input data"
// @Failure 401 {object} utils.ErrorResponse "Unauthorized"
// @Failure 403 {object} utils.ErrorResponse "Forbidden"
// @Failure 404 {object} utils.ErrorResponse "Product not found"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /products/{id}/stock [put]
func (h *ProductHandler) UpdateStock(c *gin.Context) {
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
		Quantity float64 `json:"quantity" validate:"required,min=0"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid input data: "+err.Error())
		return
	}

	if err := h.productService.UpdateStock(c.Request.Context(), productID, userID, req.Quantity); err != nil {
		switch err {
		case service.ErrProductNotFound:
			utils.RespondWithError(c, http.StatusNotFound, err.Error())
		case service.ErrUnauthorizedAccess:
			utils.RespondWithError(c, http.StatusForbidden, err.Error())
		case service.ErrFarmerNotFound:
			utils.RespondWithError(c, http.StatusNotFound, "Farmer profile not found")
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to update stock")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Stock updated successfully", nil)
}

// UpdateStatus updates product status
// @Summary Update product status
// @Description Update status for a product
// @Tags products
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Product ID"
// @Param request body dto.UpdateStatusRequest true "Status update data"
// @Success 200 {object} utils.SuccessResponse "Status updated successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid input data"
// @Failure 401 {object} utils.ErrorResponse "Unauthorized"
// @Failure 403 {object} utils.ErrorResponse "Forbidden"
// @Failure 404 {object} utils.ErrorResponse "Product not found"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /products/{id}/status [put]
func (h *ProductHandler) UpdateStatus(c *gin.Context) {
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
		Status string `json:"status" validate:"required,oneof=draft active inactive sold_out expired"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid input data: "+err.Error())
		return
	}

	status := model.ProductStatus(req.Status)
	if err := h.productService.UpdateProductStatus(c.Request.Context(), productID, userID, status); err != nil {
		switch err {
		case service.ErrProductNotFound:
			utils.RespondWithError(c, http.StatusNotFound, err.Error())
		case service.ErrUnauthorizedAccess:
			utils.RespondWithError(c, http.StatusForbidden, err.Error())
		case service.ErrFarmerNotFound:
			utils.RespondWithError(c, http.StatusNotFound, "Farmer profile not found")
		default:
			utils.RespondWithError(c, http.StatusInternalServerError, "Failed to update status")
		}
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Status updated successfully", nil)
}

// GetFeaturedProducts gets featured products
// @Summary Get featured products
// @Description Get featured products
// @Tags products
// @Produce json
// @Param limit query integer false "Limit" default(10)
// @Success 200 {object} utils.SuccessResponse{data=[]dto.ProductResponse} "Featured products retrieved successfully"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /products/featured [get]
func (h *ProductHandler) GetFeaturedProducts(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	products, err := h.productService.GetFeaturedProducts(c.Request.Context(), limit)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to retrieve featured products")
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Featured products retrieved successfully", products)
}

// GetProductsByCategory gets products by category
// @Summary Get products by category
// @Description Get products by category with pagination
// @Tags products
// @Produce json
// @Param category path string true "Product category"
// @Param page query integer false "Page number" default(1)
// @Param page_size query integer false "Page size" default(10)
// @Success 200 {object} utils.SuccessResponse{data=dto.ProductListResponse} "Products retrieved successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid category"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /products/category/{category} [get]
func (h *ProductHandler) GetProductsByCategory(c *gin.Context) {
	category := c.Param("category")

	// Validate category
	validCategories := map[string]bool{
		"fruits": true, "vegetables": true, "grains": true, "dairy": true,
		"poultry": true, "livestock": true, "spices": true, "herbs": true,
	}

	if !validCategories[category] {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid category")
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	response, err := h.productService.GetProductsByCategory(c.Request.Context(), model.ProductCategory(category), page, pageSize)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to retrieve products")
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Products retrieved successfully", response)
}

// SearchProducts searches products by query string
// @Summary Search products
// @Description Search products by name, description, or category
// @Tags products
// @Produce json
// @Param q query string true "Search query"
// @Param page query integer false "Page number" default(1)
// @Param size query integer false "Page size" default(10)
// @Success 200 {object} utils.SuccessResponse{data=dto.ProductListResponse} "Products retrieved successfully"
// @Failure 400 {object} utils.ErrorResponse "Invalid query parameters"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /products/search [get]
func (h *ProductHandler) SearchProducts(c *gin.Context) {
	query := strings.TrimSpace(c.Query("q"))
	if query == "" {
		utils.RespondWithError(c, http.StatusBadRequest, "Search query is required")
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "10"))

	response, err := h.productService.SearchProducts(c.Request.Context(), query, page, size)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to search products")
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Products retrieved successfully", response)
}

// GetUserIDFromContext extracts user ID from Gin context
func GetUserIDFromContext(c *gin.Context) (uuid.UUID, error) {
	userID, exists := c.Get("userID")
	if !exists {
		return uuid.Nil, service.ErrUnauthorizedAccess
	}

	switch v := userID.(type) {
	case uuid.UUID:
		return v, nil
	case string:
		parsedUUID, err := uuid.Parse(v)
		if err != nil {
			return uuid.Nil, service.ErrUnauthorizedAccess
		}
		return parsedUUID, nil
	default:
		return uuid.Nil, service.ErrUnauthorizedAccess
	}
}
