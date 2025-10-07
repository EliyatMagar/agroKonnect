-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create buyers table
CREATE TABLE buyers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE,
    
    -- Business Information
    business_name VARCHAR(255) NOT NULL,
    business_type VARCHAR(50) NOT NULL,
    business_scale VARCHAR(20) NOT NULL,
    description TEXT,
    
    -- Location
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    zip_code VARCHAR(20),
    
    -- Contact Information
    contact_person VARCHAR(255) NOT NULL,
    designation VARCHAR(100),
    alternate_phone VARCHAR(20),
    website VARCHAR(255),
    
    -- Business Details
    business_license VARCHAR(255) NOT NULL,
    tax_id VARCHAR(100),
    year_established INTEGER,
    employee_count INTEGER DEFAULT 0,
    
    -- Purchase Requirements
    monthly_volume DECIMAL(10,2) DEFAULT 0,
    preferred_products TEXT[],
    quality_standards TEXT[],
    
    -- Status
    is_verified BOOLEAN DEFAULT FALSE,
    is_premium BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3,2) DEFAULT 0,
    
    -- Financial
    credit_limit DECIMAL(10,2) DEFAULT 0,
    current_balance DECIMAL(10,2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    CONSTRAINT fk_buyer_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_buyers_user_id ON buyers(user_id);
CREATE INDEX idx_buyers_business_type ON buyers(business_type);
CREATE INDEX idx_buyers_city ON buyers(city);
CREATE INDEX idx_buyers_state ON buyers(state);
CREATE INDEX idx_buyers_is_verified ON buyers(is_verified);
CREATE INDEX idx_buyers_created_at ON buyers(created_at);

-- Create purchase_history table
CREATE TABLE purchase_histories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID NOT NULL,
    farmer_id UUID NOT NULL,
    product_id UUID NOT NULL,
    order_id UUID NOT NULL,
    
    product_name VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    purchase_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    delivery_rating INTEGER CHECK (delivery_rating >= 1 AND delivery_rating <= 5),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_purchase_buyer FOREIGN KEY (buyer_id) REFERENCES buyers(id) ON DELETE CASCADE,
    CONSTRAINT fk_purchase_farmer FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE SET NULL,
    CONSTRAINT fk_purchase_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Create indexes for purchase_histories
CREATE INDEX idx_purchase_histories_buyer_id ON purchase_histories(buyer_id);
CREATE INDEX idx_purchase_histories_farmer_id ON purchase_histories(farmer_id);
CREATE INDEX idx_purchase_histories_purchase_date ON purchase_histories(purchase_date);