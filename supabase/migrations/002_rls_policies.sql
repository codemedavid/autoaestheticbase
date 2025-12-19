-- =============================================
-- Row Level Security Policies
-- =============================================

-- Enable RLS on all tables
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE date_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_date_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- =============================================
-- Helper function to check if user is admin
-- =============================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_users 
        WHERE user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Services Policies
-- =============================================

-- Public can read active services
CREATE POLICY "Public can view active services"
    ON services FOR SELECT
    USING (active = true);

-- Admins can do everything with services
CREATE POLICY "Admins can manage services"
    ON services FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- =============================================
-- Date Availability Policies
-- =============================================

-- Public can only view open dates
CREATE POLICY "Public can view open dates"
    ON date_availability FOR SELECT
    USING (is_open = true AND date >= CURRENT_DATE);

-- Admins can manage all date availability
CREATE POLICY "Admins can manage date availability"
    ON date_availability FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- =============================================
-- Time Slots Policies
-- =============================================

-- Public can view available time slots for open dates
CREATE POLICY "Public can view available time slots"
    ON time_slots FOR SELECT
    USING (
        is_available = true 
        AND EXISTS (
            SELECT 1 FROM date_availability da 
            WHERE da.id = time_slots.date_availability_id 
            AND da.is_open = true 
            AND da.date >= CURRENT_DATE
        )
    );

-- Admins can manage all time slots
CREATE POLICY "Admins can manage time slots"
    ON time_slots FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- =============================================
-- Service Date Availability Policies
-- =============================================

-- Public can view available services for dates
CREATE POLICY "Public can view service availability"
    ON service_date_availability FOR SELECT
    USING (
        is_available = true 
        AND EXISTS (
            SELECT 1 FROM date_availability da 
            WHERE da.id = service_date_availability.date_availability_id 
            AND da.is_open = true
        )
    );

-- Admins can manage service date availability
CREATE POLICY "Admins can manage service date availability"
    ON service_date_availability FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- =============================================
-- Bookings Policies
-- =============================================

-- Anyone can create a booking (for available slots)
CREATE POLICY "Public can create bookings"
    ON bookings FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM time_slots ts
            WHERE ts.id = time_slot_id
            AND ts.is_available = true
        )
    );

-- Customers can view their own bookings by email
CREATE POLICY "Customers can view their bookings"
    ON bookings FOR SELECT
    USING (
        customer_email = current_setting('request.jwt.claims', true)::json->>'email'
        OR is_admin()
    );

-- Admins can manage all bookings
CREATE POLICY "Admins can manage bookings"
    ON bookings FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- =============================================
-- Admin Users Policies
-- =============================================

-- Only authenticated users can see if they're admin
CREATE POLICY "Users can check their admin status"
    ON admin_users FOR SELECT
    USING (user_id = auth.uid());

-- Only existing admins can add new admins
CREATE POLICY "Admins can manage admin users"
    ON admin_users FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- =============================================
-- Create first admin (run this manually)
-- Replace with your actual Supabase auth user ID
-- =============================================
-- INSERT INTO admin_users (user_id, email, role)
-- VALUES ('your-auth-user-uuid', 'admin@example.com', 'superadmin');
