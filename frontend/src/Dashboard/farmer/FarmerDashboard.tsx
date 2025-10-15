// components/products/ProductDetails.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProductDetails } from '../../features/product/hooks/useProductDetails';
import { useProductReviews } from '../../features/product/hooks/useProductDetails';
import { formatPrice, getCategoryIcon, calculateExpiryDate, isProductExpired } from '../../features/product/utils/productUtils';
import type { 
  ProductDetailsResponse, 
  ProductResponse, 
  AddReviewRequest,
  ProductReviewResponse 
} from '../../features/product/types/productTypes';

export const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProductDetails, trackProductView, loading, error } = useProductDetails();
  const { getReviews, addReview, loading: reviewsLoading } = useProductReviews();
  
  const [productDetails, setProductDetails] = useState<ProductDetailsResponse | null>(null);
  const [reviews, setReviews] = useState<ProductReviewResponse[]>([]);
  const [activeTab, setActiveTab] = useState<'details' | 'reviews' | 'farmer'>('details');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (id) {
      loadProductDetails();
      loadReviews();
      
      // Track view but don't let it break the component
      trackProductView(id).catch(error => {
        console.warn('View tracking failed:', error);
        // Continue loading the page even if view tracking fails
      });
    }
  }, [id]);

  const loadProductDetails = async () => {
    if (!id) return;
    const details = await getProductDetails(id);
    setProductDetails(details);
  };

  const loadReviews = async () => {
    if (!id) return;
    const productReviews = await getReviews(id);
    setReviews(productReviews);
  };

  const handleAddToCart = () => {
    if (!productDetails?.product) return;
    
    // Add to cart logic here
    console.log('Adding to cart:', {
      productId: id,
      quantity,
      product: productDetails.product
    });
  };

  const handleBuyNow = () => {
    if (!productDetails?.product) return;
    
    // Direct purchase logic here
    console.log('Buying now:', {
      productId: id,
      quantity,
      product: productDetails.product
    });
  };

  const handleReviewSubmit = async (reviewData: AddReviewRequest) => {
    if (!id) return;
    
    const result = await addReview(id, reviewData);
    if (result) {
      setShowReviewForm(false);
      loadReviews();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !productDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Product Not Found</h3>
          <p className="text-gray-500 mb-4">{error || 'The product you are looking for does not exist.'}</p>
          <button
            onClick={() => navigate('/products')}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  const { product, farmer, relatedProducts } = productDetails;
  const expiryDate = calculateExpiryDate(product.harvest_date, product.shelf_life);
  const expired = isProductExpired(expiryDate.toISOString());

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <Link to="/" className="text-gray-400 hover:text-gray-500">
                Home
              </Link>
            </li>
            <li>
              <span className="text-gray-300">/</span>
              <Link to="/products" className="ml-4 text-gray-400 hover:text-gray-500">
                Products
              </Link>
            </li>
            <li>
              <span className="text-gray-300">/</span>
              <span className="ml-4 text-gray-600">{product.name}</span>
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-96 object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-6xl">{getCategoryIcon(product.category)}</span>
                </div>
              )}
            </div>
            
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.slice(1).map((image: string, index: number) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${product.name} ${index + 2}`}
                    className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-75"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                  <div className="flex items-center space-x-4 mb-3">
                    <span className="text-sm text-gray-500 capitalize">
                      {getCategoryIcon(product.category)} {product.category}
                    </span>
                    {product.variety && (
                      <span className="text-sm text-gray-500">• {product.variety}</span>
                    )}
                  </div>
                </div>
                
                {/* Status Badges */}
                <div className="flex flex-col space-y-2">
                  {expired && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Expired
                    </span>
                  )}
                  {product.organic && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Organic
                    </span>
                  )}
                  {product.certified && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Certified
                    </span>
                  )}
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-lg ${
                        star <= Math.floor(product.rating)
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  {product.rating.toFixed(1)} ({product.review_count} reviews)
                </span>
              </div>

              {/* Price */}
              <div className="mb-6">
                <p className="text-3xl font-bold text-green-600">
                  {formatPrice(product.price_per_unit)}
                  <span className="text-sm text-gray-500 font-normal"> / {product.unit}</span>
                </p>
              </div>

              {/* Stock & Order Info */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Available Stock:</span>
                  <span className={`font-medium ${
                    product.available_stock > 10 ? 'text-green-600' : 
                    product.available_stock > 0 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {product.available_stock} {product.unit}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Minimum Order:</span>
                  <span className="font-medium">{product.min_order} {product.unit}</span>
                </div>
                
                {product.max_order > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Maximum Order:</span>
                    <span className="font-medium">{product.max_order} {product.unit}</span>
                  </div>
                )}
              </div>

              {/* Quantity Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setQuantity(prev => Math.max(product.min_order, prev - 1))}
                    disabled={quantity <= product.min_order}
                    className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    -
                  </button>
                  <span className="text-lg font-medium w-12 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(prev => 
                      product.max_order > 0 ? Math.min(product.max_order, prev + 1) : prev + 1
                    )}
                    disabled={product.max_order > 0 && quantity >= product.max_order}
                    className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                  <span className="text-sm text-gray-500 ml-2">
                    {product.unit}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={handleAddToCart}
                  disabled={product.available_stock === 0 || expired}
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {product.available_stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={product.available_stock === 0 || expired}
                  className="flex-1 bg-orange-600 text-white py-3 px-6 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Buy Now
                </button>
              </div>

              {/* Quick Info */}
              <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <span className="mr-2">📅</span>
                  Harvested: {new Date(product.harvest_date).toLocaleDateString()}
                </div>
                <div className="flex items-center">
                  <span className="mr-2">⏰</span>
                  Expires: {expiryDate.toLocaleDateString()}
                </div>
                <div className="flex items-center">
                  <span className="mr-2">🏷️</span>
                  Grade: {product.quality_grade}
                </div>
                <div className="flex items-center">
                  <span className="mr-2">📍</span>
                  {product.farm_location}
                </div>
              </div>
            </div>

            {/* Farmer Info Card */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Sold By</h3>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold">
                    {farmer.name?.charAt(0) || 'F'}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{farmer.farm_name}</h4>
                  <p className="text-sm text-gray-600">Farmer since {new Date(farmer.joined_date).getFullYear()}</p>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-sm text-gray-500">
                      ⭐ {farmer.rating} Rating
                    </span>
                    <span className="text-sm text-gray-500">
                      📦 {farmer.total_products} Products
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('farmer')}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  View Profile
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="bg-white rounded-lg shadow-sm border">
          {/* Tab Headers */}
          <div className="border-b">
            <nav className="flex -mb-px">
              {[
                { id: 'details' as const, name: 'Product Details' },
                { id: 'reviews' as const, name: `Reviews (${reviews.length})` },
                { id: 'farmer' as const, name: 'Farmer Information' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-6 font-medium text-sm border-b-2 ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'details' && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-gray-700">{product.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Product Specifications</h4>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Category</dt>
                        <dd className="font-medium capitalize">{product.category}</dd>
                      </div>
                      {product.variety && (
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Variety</dt>
                          <dd className="font-medium">{product.variety}</dd>
                        </div>
                      )}
                      {product.size && (
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Size</dt>
                          <dd className="font-medium">{product.size}</dd>
                        </div>
                      )}
                      {product.color && (
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Color</dt>
                          <dd className="font-medium">{product.color}</dd>
                        </div>
                      )}
                      {product.weight_range && (
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Weight Range</dt>
                          <dd className="font-medium">{product.weight_range}</dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Quality Information</h4>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Quality Grade</dt>
                        <dd className="font-medium capitalize">{product.quality_grade}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Organic</dt>
                        <dd className="font-medium">{product.organic ? 'Yes' : 'No'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Certified</dt>
                        <dd className="font-medium">{product.certified ? 'Yes' : 'No'}</dd>
                      </div>
                      {product.certification_details && (
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Certification</dt>
                          <dd className="font-medium">{product.certification_details}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>

                {product.storage_tips && (
                  <div>
                    <h4 className="font-semibold mb-2">Storage Tips</h4>
                    <p className="text-gray-700">{product.storage_tips}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold">Customer Reviews</h4>
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                  >
                    Write a Review
                  </button>
                </div>

                {reviewsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No reviews yet. Be the first to review this product!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review: ProductReviewResponse) => (
                      <div key={review.id} className="border-b pb-4 last:border-b-0">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h5 className="font-medium">{review.buyer_name}</h5>
                            <div className="flex items-center space-x-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                  key={star}
                                  className={`text-sm ${
                                    star <= review.rating ? 'text-yellow-400' : 'text-gray-300'
                                  }`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {review.title && (
                          <h6 className="font-semibold mb-1">{review.title}</h6>
                        )}
                        <p className="text-gray-700">{review.comment}</p>
                        
                        {/* Quality and Value Ratings */}
                        <div className="flex space-x-4 mt-2 text-sm text-gray-600">
                          <span>Quality: {review.quality_rating}/5</span>
                          <span>Value: {review.value_rating}/5</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'farmer' && (
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-xl font-semibold">
                      {farmer.name?.charAt(0) || 'F'}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold">{farmer.farm_name}</h4>
                    <p className="text-gray-600">Managed by {farmer.name}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{farmer.rating}</div>
                    <div className="text-sm text-gray-600">Average Rating</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{farmer.total_products}</div>
                    <div className="text-sm text-gray-600">Products Listed</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {new Date().getFullYear() - new Date(farmer.joined_date).getFullYear()}
                    </div>
                    <div className="text-sm text-gray-600">Years Farming</div>
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold mb-3">Farm Location</h5>
                  <p className="text-gray-700">{product.farm_location}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mt-12">
            <h3 className="text-2xl font-bold mb-6">Related Products</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct: ProductResponse) => (
                <Link
                  key={relatedProduct.id}
                  to={`/products/${relatedProduct.id}`}
                  className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
                >
                  {relatedProduct.images && relatedProduct.images.length > 0 ? (
                    <img
                      src={relatedProduct.images[0]}
                      alt={relatedProduct.name}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 rounded-t-lg flex items-center justify-center">
                      <span className="text-4xl">{getCategoryIcon(relatedProduct.category)}</span>
                    </div>
                  )}
                  <div className="p-4">
                    <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {relatedProduct.name}
                    </h4>
                    <p className="text-green-600 font-bold mb-2">
                      {formatPrice(relatedProduct.price_per_unit)}/{relatedProduct.unit}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{getCategoryIcon(relatedProduct.category)} {relatedProduct.category}</span>
                      <span>⭐ {relatedProduct.rating}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Review Form Modal */}
      {showReviewForm && (
        <ReviewForm
          onSubmit={handleReviewSubmit}
          onCancel={() => setShowReviewForm(false)}
          loading={reviewsLoading}
        />
      )}
    </div>
  );
};

// Review Form Component
interface ReviewFormProps {
  onSubmit: (data: AddReviewRequest) => void;
  onCancel: () => void;
  loading: boolean;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState<AddReviewRequest>({
    rating: 5,
    title: '',
    comment: '',
    quality_rating: 5,
    value_rating: 5,
    images: [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rating Inputs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Overall Rating
            </label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                  className="text-2xl focus:outline-none"
                >
                  <span className={star <= formData.rating ? 'text-yellow-400' : 'text-gray-300'}>
                    ★
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quality Rating
              </label>
              <select
                value={formData.quality_rating}
                onChange={(e) => setFormData(prev => ({ ...prev, quality_rating: parseInt(e.target.value) }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                {[1, 2, 3, 4, 5].map((num) => (
                  <option key={num} value={num}>
                    {num} Star{num !== 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Value Rating
              </label>
              <select
                value={formData.value_rating}
                onChange={(e) => setFormData(prev => ({ ...prev, value_rating: parseInt(e.target.value) }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                {[1, 2, 3, 4, 5].map((num) => (
                  <option key={num} value={num}>
                    {num} Star{num !== 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Summarize your experience"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review Comment
            </label>
            <textarea
              value={formData.comment}
              onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
              rows={4}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Share your experience with this product..."
              required
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductDetails;