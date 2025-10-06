-- Create vendor_products table
CREATE TABLE vendor_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL,
    
    -- Product Information
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    brand VARCHAR(100),
    price DECIMAL(15, 2) NOT NULL CHECK (price >= 0),
    unit VARCHAR(50) NOT NULL,
    stock INTEGER DEFAULT 0 CHECK (stock >= 0),
    min_order INTEGER DEFAULT 1 CHECK (min_order >= 1),
    
    -- Images (stored as JSON array)
    images JSONB DEFAULT '[]'::jsonb,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    CONSTRAINT fk_vendor_products_vendors FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
);

-- Create indexes for vendor_products
CREATE INDEX idx_vendor_products_vendor_id ON vendor_products(vendor_id);
CREATE INDEX idx_vendor_products_category ON vendor_products(category);
CREATE INDEX idx_vendor_products_brand ON vendor_products(brand);
CREATE INDEX idx_vendor_products_price ON vendor_products(price);
CREATE INDEX idx_vendor_products_stock ON vendor_products(stock);
CREATE INDEX idx_vendor_products_is_active ON vendor_products(is_active);
CREATE INDEX idx_vendor_products_created_at ON vendor_products(created_at);

-- Index for JSONB images field (if you need to query specific images)
CREATE INDEX idx_vendor_products_images ON vendor_products USING GIN (images);