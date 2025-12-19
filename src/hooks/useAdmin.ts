import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type {
    DateAvailability,
    TimeSlot,
    Service,
    ServiceDateAvailability,
    Booking,
    CreateDateAvailabilityInput,
    CreateTimeSlotInput,
    UpdateDateAvailabilityInput
} from '../types';
import { format } from 'date-fns';

// =============================================
// Admin Date Management Hook
// =============================================

export function useAdminDates() {
    const [dates, setDates] = useState<DateAvailability[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchDates = useCallback(async (startDate: Date, endDate: Date) => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('date_availability')
                .select('*')
                .gte('date', format(startDate, 'yyyy-MM-dd'))
                .lte('date', format(endDate, 'yyyy-MM-dd'))
                .order('date');

            if (error) throw error;
            setDates(data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch dates');
        } finally {
            setLoading(false);
        }
    }, []);

    const createOrUpdateDate = async (input: CreateDateAvailabilityInput): Promise<DateAvailability | null> => {
        try {
            setError(null);

            // Check if date exists
            const { data: existing } = await supabase
                .from('date_availability')
                .select('id')
                .eq('date', input.date)
                .single();

            if (existing) {
                // Update existing
                const { data, error } = await supabase
                    .from('date_availability')
                    .update({
                        is_open: input.is_open,
                        start_time: input.start_time || null,
                        end_time: input.end_time || null,
                        max_bookings_per_day: input.max_bookings_per_day || null,
                    })
                    .eq('id', existing.id)
                    .select()
                    .single();

                if (error) throw error;
                return data;
            } else {
                // Create new
                const { data, error } = await supabase
                    .from('date_availability')
                    .insert({
                        date: input.date,
                        is_open: input.is_open,
                        start_time: input.start_time || null,
                        end_time: input.end_time || null,
                        max_bookings_per_day: input.max_bookings_per_day || null,
                    })
                    .select()
                    .single();

                if (error) throw error;
                return data;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save date');
            return null;
        }
    };

    const toggleDateOpen = async (dateId: string, isOpen: boolean): Promise<boolean> => {
        try {
            setError(null);
            const { error } = await supabase
                .from('date_availability')
                .update({ is_open: isOpen })
                .eq('id', dateId);

            if (error) throw error;
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to toggle date');
            return false;
        }
    };

    const setOverride = async (
        dateId: string,
        isOverride: boolean,
        reason?: string
    ): Promise<boolean> => {
        try {
            setError(null);
            const { error } = await supabase
                .from('date_availability')
                .update({
                    is_override: isOverride,
                    override_reason: reason || null,
                    is_open: isOverride ? false : undefined, // Close if override is active
                })
                .eq('id', dateId);

            if (error) throw error;
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to set override');
            return false;
        }
    };

    const deleteDate = async (dateId: string): Promise<boolean> => {
        try {
            setError(null);
            const { error } = await supabase
                .from('date_availability')
                .delete()
                .eq('id', dateId);

            if (error) throw error;
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete date');
            return false;
        }
    };

    return {
        dates,
        loading,
        error,
        fetchDates,
        createOrUpdateDate,
        toggleDateOpen,
        setOverride,
        deleteDate,
        clearError: () => setError(null),
    };
}

// =============================================
// Admin Time Slots Hook
// =============================================

export function useAdminTimeSlots() {
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTimeSlots = useCallback(async (dateAvailabilityId: string) => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('time_slots')
                .select('*')
                .eq('date_availability_id', dateAvailabilityId)
                .order('start_time');

            if (error) throw error;
            setTimeSlots(data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch time slots');
        } finally {
            setLoading(false);
        }
    }, []);

    const createTimeSlot = async (input: CreateTimeSlotInput): Promise<TimeSlot | null> => {
        try {
            setError(null);
            const { data, error } = await supabase
                .from('time_slots')
                .insert({
                    date_availability_id: input.date_availability_id,
                    start_time: input.start_time,
                    end_time: input.end_time,
                    max_bookings: input.max_bookings || 1,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create time slot');
            return null;
        }
    };

    const updateTimeSlot = async (
        slotId: string,
        updates: Partial<TimeSlot>
    ): Promise<boolean> => {
        try {
            setError(null);
            const { error } = await supabase
                .from('time_slots')
                .update(updates)
                .eq('id', slotId);

            if (error) throw error;
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update time slot');
            return false;
        }
    };

    const deleteTimeSlot = async (slotId: string): Promise<boolean> => {
        try {
            setError(null);
            const { error } = await supabase
                .from('time_slots')
                .delete()
                .eq('id', slotId);

            if (error) throw error;
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete time slot');
            return false;
        }
    };

    const generateTimeSlots = async (
        dateAvailabilityId: string,
        startTime: string,
        endTime: string,
        intervalMinutes: number,
        maxBookingsPerSlot: number = 1
    ): Promise<TimeSlot[]> => {
        try {
            setError(null);

            // Parse times and generate slots
            const slots: CreateTimeSlotInput[] = [];
            const [startHour, startMin] = startTime.split(':').map(Number);
            const [endHour, endMin] = endTime.split(':').map(Number);

            let currentMinutes = startHour * 60 + startMin;
            const endMinutes = endHour * 60 + endMin;

            while (currentMinutes + intervalMinutes <= endMinutes) {
                const slotStart = `${String(Math.floor(currentMinutes / 60)).padStart(2, '0')}:${String(currentMinutes % 60).padStart(2, '0')}:00`;
                const slotEndMinutes = currentMinutes + intervalMinutes;
                const slotEnd = `${String(Math.floor(slotEndMinutes / 60)).padStart(2, '0')}:${String(slotEndMinutes % 60).padStart(2, '0')}:00`;

                slots.push({
                    date_availability_id: dateAvailabilityId,
                    start_time: slotStart,
                    end_time: slotEnd,
                    max_bookings: maxBookingsPerSlot,
                });

                currentMinutes = slotEndMinutes;
            }

            if (slots.length === 0) {
                throw new Error('No time slots could be generated with the given parameters');
            }

            const { data, error } = await supabase
                .from('time_slots')
                .insert(slots)
                .select();

            if (error) throw error;
            return data || [];
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate time slots');
            return [];
        }
    };

    return {
        timeSlots,
        loading,
        error,
        fetchTimeSlots,
        createTimeSlot,
        updateTimeSlot,
        deleteTimeSlot,
        generateTimeSlots,
        clearError: () => setError(null),
    };
}

// =============================================
// Admin Services Hook
// =============================================

export function useAdminServices() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchServices = useCallback(async (includeInactive = true) => {
        try {
            setLoading(true);
            let query = supabase.from('services').select('*').order('name');

            if (!includeInactive) {
                query = query.eq('active', true);
            }

            const { data, error } = await query;

            if (error) throw error;
            setServices(data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch services');
        } finally {
            setLoading(false);
        }
    }, []);

    const createService = async (input: Omit<Service, 'id' | 'created_at' | 'updated_at'>): Promise<Service | null> => {
        try {
            setError(null);
            const { data, error } = await supabase
                .from('services')
                .insert(input)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create service');
            return null;
        }
    };

    const updateService = async (id: string, updates: Partial<Service>): Promise<boolean> => {
        try {
            setError(null);
            const { error } = await supabase
                .from('services')
                .update(updates)
                .eq('id', id);

            if (error) throw error;
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update service');
            return false;
        }
    };

    const deleteService = async (id: string): Promise<boolean> => {
        try {
            setError(null);
            const { error } = await supabase
                .from('services')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete service');
            return false;
        }
    };

    return {
        services,
        loading,
        error,
        fetchServices,
        createService,
        updateService,
        deleteService,
        clearError: () => setError(null),
    };
}

// =============================================
// Admin Service Date Availability Hook
// =============================================

export function useAdminServiceAvailability() {
    const [serviceAvailability, setServiceAvailability] = useState<ServiceDateAvailability[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchServiceAvailability = useCallback(async (dateAvailabilityId: string) => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('service_date_availability')
                .select('*')
                .eq('date_availability_id', dateAvailabilityId);

            if (error) throw error;
            setServiceAvailability(data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch service availability');
        } finally {
            setLoading(false);
        }
    }, []);

    const setServiceForDate = async (
        serviceId: string,
        dateAvailabilityId: string,
        isAvailable: boolean
    ): Promise<boolean> => {
        try {
            setError(null);

            // Check if record exists
            const { data: existing } = await supabase
                .from('service_date_availability')
                .select('id')
                .eq('service_id', serviceId)
                .eq('date_availability_id', dateAvailabilityId)
                .single();

            if (existing) {
                // Update
                const { error } = await supabase
                    .from('service_date_availability')
                    .update({ is_available: isAvailable })
                    .eq('id', existing.id);

                if (error) throw error;
            } else {
                // Insert
                const { error } = await supabase
                    .from('service_date_availability')
                    .insert({
                        service_id: serviceId,
                        date_availability_id: dateAvailabilityId,
                        is_available: isAvailable,
                    });

                if (error) throw error;
            }

            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to set service availability');
            return false;
        }
    };

    const bulkSetServicesForDate = async (
        dateAvailabilityId: string,
        serviceSettings: { serviceId: string; isAvailable: boolean }[]
    ): Promise<boolean> => {
        try {
            setError(null);

            // Delete existing entries for this date
            await supabase
                .from('service_date_availability')
                .delete()
                .eq('date_availability_id', dateAvailabilityId);

            // Insert new entries
            const inserts = serviceSettings
                .filter(s => s.isAvailable)
                .map(s => ({
                    service_id: s.serviceId,
                    date_availability_id: dateAvailabilityId,
                    is_available: true,
                }));

            if (inserts.length > 0) {
                const { error } = await supabase
                    .from('service_date_availability')
                    .insert(inserts);

                if (error) throw error;
            }

            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update services');
            return false;
        }
    };

    return {
        serviceAvailability,
        loading,
        error,
        fetchServiceAvailability,
        setServiceForDate,
        bulkSetServicesForDate,
        clearError: () => setError(null),
    };
}

// =============================================
// Admin Bookings Hook
// =============================================

export function useAdminBookings() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchBookings = useCallback(async (filters?: {
        date?: string;
        status?: string;
        serviceId?: string;
    }) => {
        try {
            setLoading(true);
            let query = supabase
                .from('bookings')
                .select(`
          *,
          time_slot:time_slots(
            *,
            date_availability:date_availability(*)
          ),
          service:services(*)
        `)
                .order('created_at', { ascending: false });

            if (filters?.status) {
                query = query.eq('status', filters.status);
            }

            if (filters?.serviceId) {
                query = query.eq('service_id', filters.serviceId);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Filter by date if provided (need to do this client-side due to nested relation)
            let filteredData = data || [];
            if (filters?.date) {
                filteredData = filteredData.filter(
                    (b: any) => b.time_slot?.date_availability?.date === filters.date
                );
            }

            setBookings(filteredData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
        } finally {
            setLoading(false);
        }
    }, []);

    const updateBookingStatus = async (
        bookingId: string,
        status: 'confirmed' | 'cancelled' | 'completed' | 'no_show'
    ): Promise<boolean> => {
        try {
            setError(null);
            const { error } = await supabase
                .from('bookings')
                .update({ status })
                .eq('id', bookingId);

            if (error) throw error;
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update booking');
            return false;
        }
    };

    const deleteBooking = async (bookingId: string): Promise<boolean> => {
        try {
            setError(null);
            const { error } = await supabase
                .from('bookings')
                .delete()
                .eq('id', bookingId);

            if (error) throw error;
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete booking');
            return false;
        }
    };

    return {
        bookings,
        loading,
        error,
        fetchBookings,
        updateBookingStatus,
        deleteBooking,
        clearError: () => setError(null),
    };
}
