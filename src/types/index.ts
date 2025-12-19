// =============================================
// Type Definitions for Booking System
// =============================================

export interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  category: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DateAvailability {
  id: string;
  date: string;
  is_open: boolean;
  start_time: string | null;
  end_time: string | null;
  max_bookings_per_day: number | null;
  is_override: boolean;
  override_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimeSlot {
  id: string;
  date_availability_id: string;
  start_time: string;
  end_time: string;
  max_bookings: number;
  current_bookings: number;
  is_available: boolean;
  created_at: string;
}

export interface ServiceDateAvailability {
  id: string;
  service_id: string;
  date_availability_id: string;
  is_available: boolean;
  created_at: string;
}

export interface Booking {
  id: string;
  time_slot_id: string;
  service_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  notes: string | null;
  status: BookingStatus;
  reference_number: string;
  created_at: string;
  updated_at: string;
}

export type BookingStatus = 'confirmed' | 'cancelled' | 'completed' | 'no_show';

export interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  role: 'admin' | 'superadmin';
  created_at: string;
}

// =============================================
// Extended Types with Relations
// =============================================

export interface TimeSlotWithDate extends TimeSlot {
  date_availability: DateAvailability;
}

export interface BookingWithDetails extends Booking {
  time_slot: TimeSlotWithDate;
  service: Service;
}

export interface DateWithSlots extends DateAvailability {
  time_slots: TimeSlot[];
  available_services: ServiceDateAvailability[];
}

// =============================================
// Form/Input Types
// =============================================

export interface CreateServiceInput {
  name: string;
  description?: string;
  duration_minutes: number;
  price: number;
  category?: string;
  active?: boolean;
}

export interface UpdateServiceInput extends Partial<CreateServiceInput> {
  id: string;
}

export interface CreateDateAvailabilityInput {
  date: string;
  is_open: boolean;
  start_time?: string;
  end_time?: string;
  max_bookings_per_day?: number;
}

export interface UpdateDateAvailabilityInput extends Partial<CreateDateAvailabilityInput> {
  id: string;
  is_override?: boolean;
  override_reason?: string;
}

export interface CreateTimeSlotInput {
  date_availability_id: string;
  start_time: string;
  end_time: string;
  max_bookings?: number;
}

export interface CreateBookingInput {
  time_slot_id: string;
  service_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  notes?: string;
}

// =============================================
// UI State Types
// =============================================

export interface CalendarDay {
  date: Date;
  dateString: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  availability: DateAvailability | null;
  bookingsCount: number;
}

export interface BookingStep {
  step: 1 | 2 | 3 | 4 | 5;
  title: string;
  completed: boolean;
}

export interface BookingFormData {
  selectedDate: string | null;
  selectedService: Service | null;
  selectedTimeSlot: TimeSlot | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes: string;
}

// =============================================
// API Response Types
// =============================================

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface AvailabilityData {
  date: DateAvailability;
  timeSlots: TimeSlot[];
  services: Service[];
}
