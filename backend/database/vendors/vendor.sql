-- Create vendors table
CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    
    -- Company Information
    company_name VARCHAR(255) NOT NULL,
    brand_name VARCHAR(255),
    description TEXT,
    vendor_type VARCHAR(50) NOT NULL CHECK (vendor_type IN (
        'seed_supplier', 
        'fertilizer_supplier', 
        'equipment_supplier', 
        'pesticide_supplier', 
        'irrigation_supplier'
    )),
    business_type VARCHAR(100) NOT NULL,
    
    -- Location
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    zip_code VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Contact Information
    contact_person VARCHAR(255) NOT NULL,
    designation VARCHAR(100),
    alternate_phone VARCHAR(20),
    website VARCHAR(255),
    
    -- Business Details
    business_license VARCHAR(255) NOT NULL,
    tax_id VARCHAR(100),
    year_established INTEGER CHECK (year_established >= 1900 AND year_established <= EXTRACT(YEAR FROM CURRENT_DATE)),
    employee_count INTEGER DEFAULT 0 CHECK (employee_count >= 0),
    
    -- Status
    is_verified BOOLEAN DEFAULT FALSE,
    is_premium BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3, 2) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
    review_count INTEGER DEFAULT 0 CHECK (review_count >= 0),
    
    -- Financial
    credit_limit DECIMAL(15, 2) DEFAULT 0.0 CHECK (credit_limit >= 0),
    current_balance DECIMAL(15, 2) DEFAULT 0.0 CHECK (current_balance >= 0),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    CONSTRAINT fk_vendors_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_vendors_user_id ON vendors(user_id);
CREATE INDEX idx_vendors_vendor_type ON vendors(vendor_type);
CREATE INDEX idx_vendors_business_type ON vendors(business_type);
CREATE INDEX idx_vendors_city ON vendors(city);
CREATE INDEX idx_vendors_state ON vendors(state);
CREATE INDEX idx_vendors_country ON vendors(country);
CREATE INDEX idx_vendors_rating ON vendors(rating);
CREATE INDEX idx_vendors_is_verified ON vendors(is_verified);
CREATE INDEX idx_vendors_is_premium ON vendors(is_premium);
CREATE INDEX idx_vendors_created_at ON vendors(created_at);

-- Create spatial index for location-based queries (if using PostGIS)
-- CREATE INDEX idx_vendors_location ON vendors USING GIST (point(longitude, latitude));