import { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { CreateBookingInput, Booking } from '../types';

export function useBookings() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createBooking = async (input: CreateBookingInput): Promise<Booking | null> => {
        try {
            setLoading(true);
            setError(null);

            // First, verify the time slot is still available
            const { data: slotData, error: slotError } = await supabase
                .from('time_slots')
                .select('is_available, current_bookings, max_bookings')
                .eq('id', input.time_slot_id)
                .single();

            if (slotError) throw slotError;

            if (!slotData?.is_available) {
                throw new Error('This time slot is no longer available. Please select another.');
            }

            if (slotData.current_bookings >= slotData.max_bookings) {
                throw new Error('This time slot is fully booked. Please select another.');
            }

            // Create the booking
            const { data, error: bookingError } = await supabase
                .from('bookings')
                .insert({
                    time_slot_id: input.time_slot_id,
                    service_id: input.service_id,
                    customer_name: input.customer_name,
                    customer_email: input.customer_email,
                    customer_phone: input.customer_phone || null,
                    notes: input.notes || null,
                    status: 'confirmed',
                })
                .select()
                .single();

            if (bookingError) throw bookingError;

            return data;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to create booking';
            setError(message);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const cancelBooking = async (bookingId: string): Promise<boolean> => {
        try {
            setLoading(true);
            setError(null);

            const { error } = await supabase
                .from('bookings')
                .update({ status: 'cancelled' })
                .eq('id', bookingId);

            if (error) throw error;
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to cancel booking');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const getBookingByReference = async (reference: string): Promise<Booking | null> => {
        try {
            setLoading(true);
            setError(null);

            const { data, error } = await supabase
                .from('bookings')
                .select(`
          *,
          time_slot:time_slots(
            *,
            date_availability:date_availability(*)
          ),
          service:services(*)
        `)
                .eq('reference_number', reference.toUpperCase())
                .single();

            if (error) throw error;
            return data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Booking not found');
            return null;
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        error,
        createBooking,
        cancelBooking,
        getBookingByReference,
        clearError: () => setError(null),
    };
}
