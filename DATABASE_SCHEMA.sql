-- =========================================================================
-- TurfSync: Comprehensive PostgreSQL Database Schema
-- Version: 1.0.0
-- Supports: Multi-Sport, 4 Slot Tiers, Dynamic Pricing, bKash/Bank Payments,
--           Partial Advance vs Full Payment, Invoices, and Multi-Agent Audit Log.
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For geospatial nearby turf queries

-- -------------------------------------------------------------------------
-- 1. ENUMS
-- -------------------------------------------------------------------------
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'PLATFORM_AGENT', 'TURF_OWNER', 'TURF_MANAGER', 'COUNTER_STAFF', 'CUSTOMER');
CREATE TYPE sport_type AS ENUM ('FOOTBALL', 'CRICKET', 'BADMINTON');
CREATE TYPE football_format AS ENUM ('FOUR_V_FOUR', 'FIVE_V_FIVE', 'SIX_V_SIX', 'SEVEN_V_SEVEN', 'OTHER');
CREATE TYPE cricket_format AS ENUM ('FULL_PITCH', 'SHORT_PITCH', 'BOX_CRICKET');
CREATE TYPE slot_tier AS ENUM ('MORNING', 'AFTERNOON', 'EVENING', 'NIGHT');
CREATE TYPE slot_status AS ENUM ('AVAILABLE', 'LOCKED', 'BOOKED', 'MAINTENANCE', 'CANCELLED');
CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');
CREATE TYPE payment_status AS ENUM ('UNPAID', 'PARTIALLY_PAID', 'FULLY_PAID', 'REFUNDED');
CREATE TYPE payment_method AS ENUM ('BKASH_GATEWAY', 'BANK_TRANSFER', 'CASH_AT_COUNTER');
CREATE TYPE bank_account_type AS ENUM ('BKASH_MERCHANT', 'BKASH_PERSONAL', 'NAGAD_MERCHANT', 'BANK_CURRENT', 'BANK_SAVINGS');

-- -------------------------------------------------------------------------
-- 2. USERS & ORGANIZATIONS
-- -------------------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(120) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'CUSTOMER',
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trade_license_no VARCHAR(100),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------------------
-- 3. TURFS & COURTS (GROUNDS)
-- -------------------------------------------------------------------------
CREATE TABLE turfs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(180) UNIQUE NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    whatsapp_number VARCHAR(20) NOT NULL,
    contact_email VARCHAR(120),
    address TEXT NOT NULL,
    city VARCHAR(80) NOT NULL,
    area VARCHAR(80) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    location GEOGRAPHY(Point, 4326),
    description TEXT,
    has_lockers BOOLEAN DEFAULT FALSE,
    has_changing_room BOOLEAN DEFAULT FALSE,
    has_floodlights BOOLEAN DEFAULT TRUE,
    has_restaurant BOOLEAN DEFAULT FALSE,
    has_wifi BOOLEAN DEFAULT FALSE,
    has_parking BOOLEAN DEFAULT FALSE,
    has_first_aid BOOLEAN DEFAULT TRUE,
    deposit_percentage DECIMAL(5, 2) NOT NULL DEFAULT 40.00, -- Custom deposit % required by turf (e.g. 30%, 40%, 50%)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE turf_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    turf_id UUID NOT NULL REFERENCES turfs(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_cover BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0
);

CREATE TABLE courts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    turf_id UUID NOT NULL REFERENCES turfs(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g., "Ground A", "Ground B", "Badminton Court 1"
    sport_category sport_type NOT NULL DEFAULT 'FOOTBALL', -- FOOTBALL, CRICKET, BADMINTON, OTHER
    format VARCHAR(50) NOT NULL, -- e.g., '5v5', '7v7', 'Full Pitch', 'Singles/Doubles'
    capacity_players INT NOT NULL DEFAULT 10, -- Player capacity (e.g., 10 players for 5v5, 14 for 7v7, 4 for Badminton)
    court_type VARCHAR(50) DEFAULT 'OUTDOOR', -- INDOOR / OUTDOOR / COVERED
    surface_material VARCHAR(80), -- e.g., 'Artificial Grass 50mm', 'Rubber Mat', 'Wooden'
    dimensions VARCHAR(50), -- e.g., "120ft x 80ft"
    
    -- Fixed Base Pricing scaled by Duration
    price_1h DECIMAL(10, 2) NOT NULL DEFAULT 2000.00,    -- 1.0 Hour (60 mins)
    price_1_5h DECIMAL(10, 2) NOT NULL DEFAULT 2800.00,  -- 1.5 Hours (90 mins)
    price_2h DECIMAL(10, 2) NOT NULL DEFAULT 3600.00,    -- 2.0 Hours (120 mins)
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sport configurations supported on this court
CREATE TABLE court_sport_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    court_id UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
    sport sport_type NOT NULL,
    football_format football_format,
    cricket_format cricket_format,
    has_cricket_carpet BOOLEAN DEFAULT FALSE,
    has_cricket_pads BOOLEAN DEFAULT FALSE,
    supports_badminton BOOLEAN DEFAULT FALSE,
    notes TEXT
);

-- -------------------------------------------------------------------------
-- 4. TURF PAYMENT ACCOUNTS (bKash & Multiple Banks)
-- -------------------------------------------------------------------------
CREATE TABLE turf_payment_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    turf_id UUID NOT NULL REFERENCES turfs(id) ON DELETE CASCADE,
    account_type bank_account_type NOT NULL,
    provider_name VARCHAR(100) NOT NULL, -- e.g., "BRAC Bank", "bKash Merchant", "Dutch-Bangla Bank"
    account_title VARCHAR(150) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    branch_name VARCHAR(100),
    routing_number VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------------------
-- 4.1 TURF GALLERY MEDIA (8 Photos Max: PNG/JPEG | 2 Videos Max: <= 30s)
-- -------------------------------------------------------------------------
CREATE TYPE media_type AS ENUM ('PHOTO', 'VIDEO');
CREATE TYPE photo_format AS ENUM ('PNG', 'JPEG');
CREATE TYPE video_format AS ENUM ('MP4', 'WEBM');

CREATE TABLE turf_gallery_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    turf_id UUID NOT NULL REFERENCES turfs(id) ON DELETE CASCADE,
    media_type media_type NOT NULL,
    media_url TEXT NOT NULL,
    title_or_caption VARCHAR(200),
    
    -- Photo constraints (PNG, JPEG, max 8 per turf)
    photo_format photo_format,
    is_cover_photo BOOLEAN DEFAULT FALSE,
    file_size_kb INT,
    
    -- Video constraints (MP4, WEBM, max 2 per turf, max 30 seconds)
    video_format video_format,
    duration_seconds INT CHECK (duration_seconds IS NULL OR duration_seconds <= 30),
    
    display_order INT DEFAULT 0,
    uploaded_by_user_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------------------
-- 5. SLOT TEMPLATES & DYNAMIC PRICING ENGINE
-- -------------------------------------------------------------------------
-- Default weekly template by day and tier
CREATE TABLE slot_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    court_id UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun, 5=Fri, 6=Sat
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    tier slot_tier NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL,
    min_advance_amount DECIMAL(10, 2) NOT NULL DEFAULT 500.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Realized slots for specific calendar dates
CREATE TABLE daily_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    court_id UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    tier slot_tier NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL,
    min_advance_amount DECIMAL(10, 2) NOT NULL DEFAULT 500.00,
    status slot_status NOT NULL DEFAULT 'AVAILABLE',
    is_holiday_pricing BOOLEAN DEFAULT FALSE,
    
    -- Temporary lock for concurrency during checkout (Anti-Clash engine)
    locked_by_user_id UUID REFERENCES users(id),
    locked_at TIMESTAMP WITH TIME ZONE,
    locked_until TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_court_slot UNIQUE (court_id, slot_date, start_time)
);

-- -------------------------------------------------------------------------
-- 6. PLATFORM FEE CONFIGURATIONS & SETTLEMENTS (WEBSITE MANAGEMENT)
-- -------------------------------------------------------------------------
CREATE TABLE platform_fee_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL DEFAULT 'Standard Booking Convenience Fee',
    fee_type VARCHAR(20) NOT NULL DEFAULT 'TIERED', -- 'TIERED', 'FLAT', 'PERCENTAGE'
    base_slot_amount DECIMAL(10, 2) NOT NULL DEFAULT 200.00, -- 200 Taka for 1 single slot
    extra_slot_amount DECIMAL(10, 2) NOT NULL DEFAULT 50.00, -- +50 Taka for every slot beyond 1 (e.g. 2 slots=250, 3 slots=300)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_code VARCHAR(30) UNIQUE NOT NULL, -- e.g., "TRF-202610-1092"
    turf_id UUID NOT NULL REFERENCES turfs(id),
    court_id UUID NOT NULL REFERENCES courts(id),
    daily_slot_id UUID NOT NULL REFERENCES daily_slots(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES users(id),
    
    sport sport_type NOT NULL,
    sport_notes VARCHAR(150), -- e.g., "Football 7v7 (14 Players Capacity)"
    slot_count INT NOT NULL DEFAULT 1,             -- Number of slots booked (1, 2, 3...)
    slot_duration_minutes INT NOT NULL DEFAULT 90, -- Standardized 90 minutes (1.5 Hours per slot)
    
    -- Price breakdown & Platform Convenience Fee
    gross_slot_fee DECIMAL(10, 2) NOT NULL,        -- Fixed rate for chosen ground & duration
    add_on_fee DECIMAL(10, 2) DEFAULT 0.00,        -- Equipment/Carpet
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,   -- Online promo code or turf manager forced discount
    discount_type VARCHAR(50) DEFAULT 'NONE',      -- 'PROMO_CODE', 'MANAGER_COUNTER_DISCOUNT', 'NONE'
    net_turf_fee DECIMAL(10, 2) NOT NULL,          -- (gross_slot_fee + add_on_fee - discount_amount)
    
    platform_fee DECIMAL(10, 2) NOT NULL DEFAULT 200.00, -- ৳200 for 1 slot, ৳250 for 2, ৳300 for 3 (200 + (N-1)*50)
    total_amount DECIMAL(10, 2) NOT NULL,          -- Total Quote = net_turf_fee + platform_fee
    
    turf_deposit_percent DECIMAL(5, 2) NOT NULL DEFAULT 40.00, -- Required deposit % (e.g., 30%, 40%, 50%)
    advance_amount_paid DECIMAL(10, 2) DEFAULT 0.00, -- Paid online upfront (includes 200 Taka platform fee)
    due_amount DECIMAL(10, 2) NOT NULL,            -- Remaining balance payable at counter to turf
    
    booking_status booking_status NOT NULL DEFAULT 'PENDING',
    payment_status payment_status NOT NULL DEFAULT 'UNPAID',
    
    booked_by_agent_id UUID REFERENCES users(id), -- Null if booked online by customer
    discount_authorized_by UUID REFERENCES users(id), -- Shift manager who applied forced discount
    cancellation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES users(id),
    turf_payment_account_id UUID REFERENCES turf_payment_accounts(id),
    
    method payment_method NOT NULL,
    transaction_id VARCHAR(100), -- bKash trxID or Bank deposit slip ref
    amount DECIMAL(10, 2) NOT NULL,
    is_advance BOOLEAN NOT NULL DEFAULT TRUE,
    
    gateway_response JSONB,
    status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED', -- PENDING, COMPLETED, FAILED
    verified_by_agent_id UUID REFERENCES users(id), -- For counter cash or manual bank check
    paid_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(40) UNIQUE NOT NULL, -- e.g., "INV-2026-000841"
    booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    
    -- Itemized invoice breakdown
    slot_duration_minutes INT NOT NULL DEFAULT 60,
    gross_turf_amount DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    net_turf_amount DECIMAL(10, 2) NOT NULL,
    platform_fee DECIMAL(10, 2) NOT NULL DEFAULT 200.00, -- Fixed 200 Taka
    total_amount DECIMAL(10, 2) NOT NULL,          -- Grand Total Quoted
    advance_paid DECIMAL(10, 2) NOT NULL,          -- Advance paid via bKash/Bank
    due_amount DECIMAL(10, 2) NOT NULL,            -- Balance due at turf counter
    
    has_paid_seal BOOLEAN NOT NULL DEFAULT FALSE,
    qr_verification_code TEXT NOT NULL,
    pdf_url TEXT,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payouts and Settlements between Platform & Turf Owners
CREATE TABLE turf_settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    turf_id UUID NOT NULL REFERENCES turfs(id),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_bookings_count INT NOT NULL DEFAULT 0,
    total_turf_gross DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    total_platform_fees DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    online_collected_by_platform DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    counter_collected_by_turf DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    net_payout_to_turf DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    payout_status VARCHAR(30) DEFAULT 'PENDING', -- PENDING, SETTLED, DISPUTED
    settled_at TIMESTAMP WITH TIME ZONE
);

-- -------------------------------------------------------------------------
-- 7. COMMUNICATION (LIVE CHAT & INQUIRIES)
-- -------------------------------------------------------------------------
CREATE TABLE chat_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    turf_id UUID NOT NULL REFERENCES turfs(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    message_text TEXT NOT NULL,
    attachment_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------------------
-- 8. MULTI-AGENT AUDIT LOG (CHANGE TRACKING)
-- -------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    turf_id UUID REFERENCES turfs(id) ON DELETE SET NULL,
    actor_id UUID NOT NULL REFERENCES users(id),
    actor_name VARCHAR(150) NOT NULL,
    actor_role user_role NOT NULL,
    
    action VARCHAR(80) NOT NULL,     -- 'SLOT_PRICE_UPDATED', 'SLOT_BLOCKED', 'COUNTER_CASH_COLLECTED', etc.
    category VARCHAR(50) NOT NULL,   -- 'PRICING', 'SLOT', 'BOOKING', 'PAYMENT', 'BANK_ACCOUNT', 'SYSTEM'
    
    target_table VARCHAR(80) NOT NULL,
    target_id VARCHAR(100) NOT NULL,
    
    before_state JSONB,
    after_state JSONB,
    diff JSONB,
    
    reason TEXT,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- -------------------------------------------------------------------------
-- 9. PERFORMANCE INDEXES
-- -------------------------------------------------------------------------
CREATE INDEX idx_turfs_city_area ON turfs(city, area);
CREATE INDEX idx_daily_slots_lookup ON daily_slots(court_id, slot_date, status);
CREATE INDEX idx_daily_slots_lock ON daily_slots(locked_until) WHERE status = 'LOCKED';
CREATE INDEX idx_bookings_user ON bookings(customer_id);
CREATE INDEX idx_bookings_date ON bookings(daily_slot_id, booking_status);
CREATE INDEX idx_audit_logs_search ON audit_logs(turf_id, actor_id, created_at DESC);
