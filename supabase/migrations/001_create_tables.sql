-- =============================================
-- Custom Booking System Database Schema
-- =============================================

-- 1. Services Table
-- Stores all available services that can be booked
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    category VARCHAR(100),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Date Availability Table
-- Controls which dates are open/closed for booking
CREATE TABLE IF NOT EXISTS date_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    is_open BOOLEAN DEFAULT false,
    start_time TIME,
    end_time TIME,
    max_bookings_per_day INTEGER DEFAULT NULL,
    is_override BOOLEAN DEFAULT false,
    override_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster date lookups
CREATE INDEX IF NOT EXISTS idx_date_availability_date ON date_availability(date);
CREATE INDEX IF NOT EXISTS idx_date_availability_is_open ON date_availability(is_open);

-- 3. Time Slots Table
-- Individual time slots within a date
CREATE TABLE IF NOT EXISTS time_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date_availability_id UUID NOT NULL REFERENCES date_availability(id) ON DELETE CASCADE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_bookings INTEGER DEFAULT 1,
    current_bookings INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

CREATE INDEX IF NOT EXISTS idx_time_slots_date_availability ON time_slots(date_availability_id);

-- 4. Service Date Availability Table
-- Junction table: which services are available on which dates
CREATE TABLE IF NOT EXISTS service_date_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    date_availability_id UUID NOT NULL REFERENCES date_availability(id) ON DELETE CASCADE,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(service_id, date_availability_id)
);

CREATE INDEX IF NOT EXISTS idx_service_date_service ON service_date_availability(service_id);
CREATE INDEX IF NOT EXISTS idx_service_date_availability ON service_date_availability(date_availability_id);

-- 5. Bookings Table
-- Customer bookings
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    time_slot_id UUID NOT NULL REFERENCES time_slots(id) ON DELETE RESTRICT,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    notes TEXT,
    status VARCHAR(50) DEFAULT 'confirmed',
    reference_number VARCHAR(20) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_time_slot ON bookings(time_slot_id);
CREATE INDEX IF NOT EXISTS idx_bookings_service ON bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON bookings(reference_number);

-- 6. Admin Users Table (optional, can use Supabase auth)
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- Functions and Triggers
-- =============================================

-- Function to generate booking reference number
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS TRIGGER AS $$
BEGIN
    NEW.reference_number := 'BK' || TO_CHAR(NOW(), 'YYMMDD') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate reference number
DROP TRIGGER IF EXISTS booking_reference_trigger ON bookings;
CREATE TRIGGER booking_reference_trigger
    BEFORE INSERT ON bookings
    FOR EACH ROW
    WHEN (NEW.reference_number IS NULL)
    EXECUTE FUNCTION generate_booking_reference();

-- Function to update current_bookings count
CREATE OR REPLACE FUNCTION update_slot_booking_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE time_slots 
        SET current_bookings = current_bookings + 1,
            is_available = CASE 
                WHEN current_bookings + 1 >= max_bookings THEN false 
                ELSE true 
            END
        WHERE id = NEW.time_slot_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE time_slots 
        SET current_bookings = GREATEST(0, current_bookings - 1),
            is_available = true
        WHERE id = OLD.time_slot_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers for booking count
DROP TRIGGER IF EXISTS booking_count_insert ON bookings;
CREATE TRIGGER booking_count_insert
    AFTER INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_slot_booking_count();

DROP TRIGGER IF EXISTS booking_count_delete ON bookings;
CREATE TRIGGER booking_count_delete
    AFTER DELETE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_slot_booking_count();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_date_availability_updated_at ON date_availability;
CREATE TRIGGER update_date_availability_updated_at
    BEFORE UPDATE ON date_availability
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- =============================================
-- Sample Data (optional, remove in production)
-- =============================================

-- Insert sample services
INSERT INTO services (name, description, duration_minutes, price, category, active) VALUES
    ('IV Drip Therapy', 'Vitamin-infused IV therapy for hydration and wellness', 60, 150.00, 'Wellness', true),
    ('Tirzepatide Injection', 'Weight management treatment injection', 30, 200.00, 'Weight Management', true),
    ('Glutathione Treatment', 'Antioxidant treatment for skin brightening', 45, 120.00, 'Skin Care', true),
    ('Vitamin B12 Shot', 'Energy boosting vitamin injection', 15, 50.00, 'Wellness', true),
    ('NAD+ Therapy', 'Cellular regeneration therapy', 90, 300.00, 'Anti-Aging', true)
ON CONFLICT DO NOTHING;
