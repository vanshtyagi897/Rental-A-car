-- ==========================================================
-- Schema for K&K Car Rentals (PostgreSQL Relational Database)
-- ==========================================================

-- 1. Fleet Vehicles Table
CREATE TABLE IF NOT EXISTS cars (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'Standard Vehicle',
    image_url TEXT DEFAULT '#',
    price_12hr NUMERIC(10, 2) NOT NULL DEFAULT 0,
    price_24hr NUMERIC(10, 2) NOT NULL DEFAULT 0,
    overage_rate_per_hr NUMERIC(10, 2) NOT NULL DEFAULT 0,
    transmission VARCHAR(100) DEFAULT 'Manual / Petrol',
    seating VARCHAR(50) DEFAULT '5 Seater',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users & Staff Accounts Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE,
    email VARCHAR(255),
    phone VARCHAR(50),
    password_hash TEXT NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'customer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Rental Booking Requests Table
CREATE TABLE IF NOT EXISTS requests (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    car_id VARCHAR(64) REFERENCES cars(id) ON DELETE CASCADE,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    customer_email VARCHAR(255),
    car_name VARCHAR(255),
    requested_duration VARCHAR(50) NOT NULL,
    expected_duration_note TEXT DEFAULT '',
    requested_start_time VARCHAR(100) NOT NULL,
    estimated_base_price NUMERIC(10, 2) DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending Confirmation',
    admin_notes TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for optimized querying
CREATE INDEX IF NOT EXISTS idx_requests_user_id ON requests(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_car_id ON requests(car_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
