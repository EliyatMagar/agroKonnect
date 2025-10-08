-- Migration: 001_create_orders_table.up.sql
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(100) UNIQUE NOT NULL,
    
    -- Parties involved
    buyer_id UUID NOT NULL,
    farmer_id UUID NOT NULL,
    vendor_id UUID NOT NULL,
    transporter_id UUID,
    
    -- Order Details
    total_amount DECIMAL(10,2) NOT NULL,
    sub_total DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending',
    payment_status VARCHAR(20) DEFAULT 'pending',
    
    -- Payment Information
    payment_method VARCHAR(30),
    payment_id VARCHAR(255),
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- Shipping Information
    shipping_address TEXT NOT NULL,
    shipping_city VARCHAR(100) NOT NULL,
    shipping_state VARCHAR(100) NOT NULL,
    shipping_zip_code VARCHAR(20),
    shipping_notes TEXT,
    
    -- Delivery Information
    estimated_delivery TIMESTAMP WITH TIME ZONE,
    actual_delivery TIMESTAMP WITH TIME ZONE,
    
    -- Tracking
    tracking_number VARCHAR(100),
    tracking_url TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    -- Foreign key constraints (adjust table names as per your schema)
    CONSTRAINT fk_orders_buyer FOREIGN KEY (buyer_id) REFERENCES buyers(id) ON DELETE CASCADE,
    CONSTRAINT fk_orders_farmer FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE,
    CONSTRAINT fk_orders_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
    CONSTRAINT fk_orders_transporter FOREIGN KEY (transporter_id) REFERENCES transporters(id) ON DELETE SET NULL
);

-- Indexes for better performance
CREATE INDEX idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX idx_orders_farmer_id ON orders(farmer_id);
CREATE INDEX idx_orders_transporter_id ON orders(transporter_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_order_number ON orders(order_number);

-- Add check constraints for status values
ALTER TABLE orders ADD CONSTRAINT chk_orders_status 
CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'in_transit', 'delivered', 'cancelled'));

ALTER TABLE orders ADD CONSTRAINT chk_orders_payment_status 
CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));

ALTER TABLE orders ADD CONSTRAINT chk_orders_payment_method 
CHECK (payment_method IN ('bank_transfer', 'credit_card', 'digital_wallet', 'upi', 'cash_on_delivery'));




//-- Migration: 002_create_order_items_table.up.sql
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    product_id UUID NOT NULL,
    
    product_name VARCHAR(255) NOT NULL,
    product_image TEXT,
    unit_price DECIMAL(10,2) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    
    -- Product details at time of order
    quality_grade VARCHAR(20),
    organic BOOLEAN DEFAULT FALSE,
    harvest_date TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

-- Indexes for better performance
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_order_items_created_at ON order_items(created_at);

-- Add check constraint for quality grade
ALTER TABLE order_items ADD CONSTRAINT chk_order_items_quality_grade 
CHECK (quality_grade IN ('premium', 'standard', 'economy'));



-- Migration: 003_create_order_tracking_table.up.sql
CREATE TABLE order_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL,
    location VARCHAR(255),
    description TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    CONSTRAINT fk_order_tracking_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX idx_order_tracking_order_id ON order_tracking(order_id);
CREATE INDEX idx_order_tracking_status ON order_tracking(status);
CREATE INDEX idx_order_tracking_created_at ON order_tracking(created_at);

-- Add check constraint for status values
ALTER TABLE order_tracking ADD CONSTRAINT chk_order_tracking_status 
CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'in_transit', 'delivered', 'cancelled'));


-- Migration: 003_create_order_tracking_table.down.sql
DROP TABLE IF EXISTS order_tracking;

-- Migration: 002_create_order_items_table.down.sql
DROP TABLE IF EXISTS order_items;

-- Migration: 001_create_orders_table.down.sql
DROP TABLE IF EXISTS orders;



-- Migration: 004_add_additional_indexes.up.sql
-- Composite indexes for common query patterns
CREATE INDEX idx_orders_buyer_status ON orders(buyer_id, status);
CREATE INDEX idx_orders_farmer_status ON orders(farmer_id, status);
CREATE INDEX idx_orders_created_status ON orders(created_at, status);
CREATE INDEX idx_orders_payment_status_method ON orders(payment_status, payment_method);

-- Partial indexes for better performance
CREATE INDEX idx_orders_active ON orders(status) 
WHERE status IN ('pending', 'confirmed', 'processing', 'shipped', 'in_transit');

CREATE INDEX idx_orders_completed ON orders(status) 
WHERE status IN ('delivered', 'cancelled');

-- Index for order items with order and product
CREATE INDEX idx_order_items_order_product ON order_items(order_id, product_id);

-- Index for tracking with order and timestamp
CREATE INDEX idx_order_tracking_order_created ON order_tracking(order_id, created_at);



-- Migration: 005_add_updated_at_trigger.up.sql
-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for tables that have updated_at
CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_items_updated_at 
    BEFORE UPDATE ON order_items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();



-- Migration: 006_insert_sample_data.up.sql
-- Insert sample orders (adjust IDs to match your existing data)
INSERT INTO orders (
    id, order_number, buyer_id, farmer_id, vendor_id, 
    total_amount, sub_total, tax_amount, shipping_cost,
    status, payment_status, payment_method,
    shipping_address, shipping_city, shipping_state, shipping_zip_code,
    estimated_delivery
) VALUES 
(
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 
    'ORD-20231215143045-abc123de',
    'b1u2y3e4-r5i6-7890-dent-ifier123456',
    'f1a2r3m4-e5r6-7890-idab-cdef12345678',
    'v1e2n3d4-o5r6-7890-idve-ndor1234567',
    1250.50, 1100.00, 110.00, 40.50,
    'pending', 'pending', 'upi',
    '123 Main Street', 'Bangalore', 'Karnataka', '560001',
    CURRENT_TIMESTAMP + INTERVAL '5 days'
),
(
    'b2c3d4e5-f6g7-8901-bcde-f23456789012', 
    'ORD-20231215153030-def456gh',
    'c2d3e4f5-g6h7-8901-uyer-buyer2345678',
    'g2h3i4j5-k6l7-8901-rmer-farmer3456789',
    'w2x3y4z5-a6b7-8901-dorv-endor4567890',
    890.75, 800.00, 80.00, 10.75,
    'confirmed', 'paid', 'credit_card',
    '456 Oak Avenue', 'Mumbai', 'Maharashtra', '400001',
    CURRENT_TIMESTAMP + INTERVAL '7 days'
);

-- Insert sample order items
INSERT INTO order_items (
    id, order_id, product_id, product_name, product_image,
    unit_price, quantity, unit, total_price,
    quality_grade, organic, harvest_date
) VALUES 
(
    'i1t2e3m4-i5d6-7890-item-0987654321',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'p1r2o3d4-u5c6-7890-tidp-roduct123456',
    'Organic Tomatoes',
    'https://example.com/images/tomatoes.jpg',
    200.00, 2.5, 'kg', 500.00,
    'premium', true, CURRENT_TIMESTAMP - INTERVAL '2 days'
),
(
    'i2t3e4m5-i6d7-8901-item-1098765432',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'p2r3o4d5-u6c7-8901-tidp-roduct234567',
    'Fresh Potatoes',
    'https://example.com/images/potatoes.jpg',
    60.00, 10.0, 'kg', 600.00,
    'standard', false, CURRENT_TIMESTAMP - INTERVAL '5 days'
);

-- Insert sample tracking events
INSERT INTO order_tracking (
    id, order_id, status, location, description, notes
) VALUES 
(
    't1r2a3c4-k5i6-7890-king-track1234567',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'pending',
    'Order created',
    'Order has been placed successfully',
    'Waiting for payment confirmation'
),
(
    't2r3a4c5-k6i7-8901-king-track2345678',
    'b2c3d4e5-f6g7-8901-bcde-f23456789012',
    'confirmed',
    'Farm location',
    'Order confirmed and ready for processing',
    'Payment received, preparing for shipment'
);