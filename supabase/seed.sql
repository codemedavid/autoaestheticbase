-- ============================================================================
-- RUN THIS IN YOUR SUPABASE SQL EDITOR
-- This script fixes permissions for the "Admin123@" login and adds sample data
-- ============================================================================

-- 1. Update Policies to allow the "Simplified Login" to work
-- (Since we aren't using real Supabase Auth accounts for admin, we need open policies)

-- Date Availability
DROP POLICY IF EXISTS "Admins can manage date availability" ON date_availability;
CREATE POLICY "Public can manage date availability" ON date_availability FOR ALL USING (true) WITH CHECK (true);

-- Services
DROP POLICY IF EXISTS "Admins can manage services" ON services;
CREATE POLICY "Public can manage services" ON services FOR ALL USING (true) WITH CHECK (true);

-- Time Slots
DROP POLICY IF EXISTS "Admins can manage time slots" ON time_slots;
CREATE POLICY "Public can manage time slots" ON time_slots FOR ALL USING (true) WITH CHECK (true);

-- Service Availability
DROP POLICY IF EXISTS "Admins can manage service date availability" ON service_date_availability;
CREATE POLICY "Public can manage service date availability" ON service_date_availability FOR ALL USING (true) WITH CHECK (true);

-- Bookings
DROP POLICY IF EXISTS "Admins can manage bookings" ON bookings;
CREATE POLICY "Public can manage bookings" ON bookings FOR ALL USING (true) WITH CHECK (true);

-- 2. Insert Sample Data for December 20, 2025
INSERT INTO date_availability (date, is_open, start_time, end_time, max_bookings_per_day)
VALUES ('2025-12-20', true, '09:00', '17:00', 5)
ON CONFLICT (date) DO UPDATE 
SET is_open = true, 
    start_time = '09:00', 
    end_time = '17:00';

-- 3. Insert Sample Data for December 21, 2025 (Closed)
INSERT INTO date_availability (date, is_open)
VALUES ('2025-12-21', false)
ON CONFLICT (date) DO UPDATE SET is_open = false;
