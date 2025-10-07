import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProducts, useProductReviews } from '../hooks/useProducts';
import type { ProductResponse } from '../types/productTypes';
import { formatPrice, getCategoryIcon } from '../utils/productUtils';

const ProductDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getProduct, loading, error } = useProducts();
  const { getReviews, addReview } = useProductReviews();
  
  const [product, setProduct] = useState<ProductResponse | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (id) {
      loadProduct();
      loadReviews();
    }
  }, [id]);

  const loadProduct = async () => {
    const productData = await getProduct(id!);
    setProduct(productData);
  };

  const loadReviews = async () => {
    if (id) {
      const reviewsData = await getReviews(id);
      setReviews(reviewsData);
    }
  };

  const handleAddToCart = () => {
    // Implement cart functionality
    console.log('Added to cart:', { productId: id, quantity });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
          <Link to="/products" className="text-green-600 hover:text-green-700">
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2">
          <li>
            <Link to="/products" className="text-gray-500 hover:text-gray-700">
              Products
            </Link>
          </li>
          <li className="flex items-center">
            <span className="text-gray-400 mx-2">/</span>
            <span className="text-gray-900">{product.name}</span>
          </li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Product Images */}
        <div>
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
            <img
              src={product.images?.[activeImage] || '/placeholder-image.jpg'}
              alt={product.name}
              className="w-full h-96 object-cover"
            />
          </div>
          
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImage(index)}
                  className={`border-2 rounded-lg overflow-hidden ${
                    activeImage === index ? 'border-green-600' : 'border-transparent'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-20 object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <div className="mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 mb-2">
              {getCategoryIcon(product.category)} {product.category}
            </span>
            {product.organic && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 ml-2">
                Organic
              </span>
            )}
            {product.certified && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 ml-2">
                Certified
              </span>
            )}
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
          
          <div className="flex items-center mb-4">
            <div className="flex items-center">
              <span className="text-yellow-400 text-xl">★</span>
              <span className="ml-1 text-gray-700 font-medium">
                {product.rating || 'No ratings'}
              </span>
              <span className="mx-2 text-gray-300">•</span>
              <span className="text-gray-600">{product.review_count} reviews</span>
            </div>
          </div>

          <div className="mb-6">
            <span className="text-3xl font-bold text-green-600">
              {formatPrice(product.price_per_unit)}/{product.unit}
            </span>
          </div>

          <p className="text-gray-700 mb-6 leading-relaxed">{product.description}</p>

          {/* Product Details */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="font-semibold text-gray-900">Farm</h3>
              <p className="text-gray-600">{product.farm_name}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Location</h3>
              <p className="text-gray-600">{product.farm_location}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Harvest Date</h3>
              <p className="text-gray-600">
                {new Date(product.harvest_date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Quality Grade</h3>
              <p className="text-gray-600 capitalize">{product.quality_grade}</p>
            </div>
          </div>

          {/* Storage Tips */}
          {product.storage_tips && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Storage Tips</h3>
              <p className="text-gray-600">{product.storage_tips}</p>
            </div>
          )}

          {/* Purchase Section */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-700">Available Stock:</span>
              <span className="font-semibold">{product.available_stock} {product.unit}</span>
            </div>

            <div className="flex items-center space-x-4 mb-4">
              <label htmlFor="quantity" className="text-gray-700">Quantity:</label>
              <input
                type="number"
                id="quantity"
                min={product.min_order}
                max={Math.min(product.available_stock, product.max_order || product.available_stock)}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              />
              <span className="text-gray-600 text-sm">
                Min: {product.min_order} {product.unit}
              </span>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={product.available_stock === 0 || quantity < product.min_order}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {product.available_stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>

            {product.available_stock > 0 && (
              <p className="text-center text-sm text-gray-600 mt-2">
                Total: {formatPrice(product.price_per_unit * quantity)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <ProductReviews productId={product.id} reviews={reviews} />
    </div>
  );
};

// Reviews Component
const ProductReviews: React.FC<{ productId: string; reviews: any[] }> = ({ productId, reviews }) => {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const { addReview, loading } = useProductReviews();

  const handleSubmitReview = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const reviewData = {
      rating: Number(formData.get('rating')),
      title: formData.get('title') as string,
      comment: formData.get('comment') as string,
      quality_rating: Number(formData.get('quality_rating')),
      value_rating: Number(formData.get('value_rating')),
      images: [] // Handle image upload separately
    };

    await addReview(productId, reviewData);
    setShowReviewForm(false);
  };

  return (
    <div className="border-t pt-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
        <button
          onClick={() => setShowReviewForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Write a Review
        </button>
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Overall Rating
                </label>
                <select
                  name="rating"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select Rating</option>
                  {[5, 4, 3, 2, 1].map(rating => (
                    <option key={rating} value={rating}>
                      {rating} Star{rating !== 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quality Rating
                </label>
                <select
                  name="quality_rating"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select Quality Rating</option>
                  {[5, 4, 3, 2, 1].map(rating => (
                    <option key={rating} value={rating}>{rating}</option>
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
                name="title"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                placeholder="Summarize your experience"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Comment
              </label>
              <textarea
                name="comment"
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                placeholder="Share your experience with this product..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowReviewForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No reviews yet. Be the first to review this product!
          </div>
        ) : (
          reviews.map(review => (
            <div key={review.id} className="bg-white border rounded-lg p-6">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">{review.buyer_name}</h4>
                  <div className="flex items-center mt-1">
                    <div className="flex text-yellow-400">
                      {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </div>
                    <span className="ml-2 text-sm text-gray-600">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {review.is_verified && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Verified Purchase
                  </span>
                )}
              </div>

              <h5 className="font-medium text-gray-900 mb-2">{review.title}</h5>
              <p className="text-gray-700 mb-4">{review.comment}</p>

              <div className="flex space-x-4 text-sm text-gray-600">
                <span>Quality: {review.quality_rating}/5</span>
                <span>Value: {review.value_rating}/5</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductDetailsPage;