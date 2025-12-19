import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type {
    DateAvailability,
    TimeSlot,
    Service,
} from '../types';
import { format, startOfMonth, endOfMonth, addMonths } from 'date-fns';

export function useAvailability() {
    const [availableDates, setAvailableDates] = useState<DateAvailability[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAvailableDates = useCallback(async (startDate: Date, endDate: Date) => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('date_availability')
                .select('*')
                .gte('date', format(startDate, 'yyyy-MM-dd'))
                .lte('date', format(endDate, 'yyyy-MM-dd'))
                .eq('is_open', true)
                .order('date');

            if (error) throw error;
            setAvailableDates(data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch dates');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchMonthAvailability = useCallback(async (date: Date) => {
        const start = startOfMonth(date);
        const end = endOfMonth(addMonths(date, 2)); // Fetch 3 months ahead
        await fetchAvailableDates(start, end);
    }, [fetchAvailableDates]);

    // Subscribe to real-time updates
    useEffect(() => {
        const channel = supabase
            .channel('availability-updates')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'date_availability' },
                () => {
                    fetchMonthAvailability(new Date());
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchMonthAvailability]);

    return {
        availableDates,
        loading,
        error,
        fetchMonthAvailability,
        refetch: () => fetchMonthAvailability(new Date()),
    };
}

export function useDateDetails(dateString: string | null) {
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [dateAvailability, setDateAvailability] = useState<DateAvailability | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchDateDetails = useCallback(async (date: string) => {
        try {
            setLoading(true);
            setError(null);

            // Fetch date availability
            const { data: dateData, error: dateError } = await supabase
                .from('date_availability')
                .select('*')
                .eq('date', date)
                .eq('is_open', true)
                .single();

            if (dateError) {
                if (dateError.code === 'PGRST116') {
                    // No data found - date not available
                    setDateAvailability(null);
                    setTimeSlots([]);
                    setServices([]);
                    return;
                }
                throw dateError;
            }

            setDateAvailability(dateData);

            // Fetch time slots for this date
            const { data: slotsData, error: slotsError } = await supabase
                .from('time_slots')
                .select('*')
                .eq('date_availability_id', dateData.id)
                .eq('is_available', true)
                .order('start_time');

            if (slotsError) throw slotsError;
            setTimeSlots(slotsData || []);

            // Fetch available services for this date
            const { data: serviceAvailData, error: serviceAvailError } = await supabase
                .from('service_date_availability')
                .select('service_id')
                .eq('date_availability_id', dateData.id)
                .eq('is_available', true);

            if (serviceAvailError) throw serviceAvailError;

            if (serviceAvailData && serviceAvailData.length > 0) {
                const serviceIds = serviceAvailData.map(s => s.service_id);
                const { data: servicesData, error: servicesError } = await supabase
                    .from('services')
                    .select('*')
                    .in('id', serviceIds)
                    .eq('active', true)
                    .order('name');

                if (servicesError) throw servicesError;
                setServices(servicesData || []);
            } else {
                setServices([]);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch date details');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (dateString) {
            fetchDateDetails(dateString);
        } else {
            setDateAvailability(null);
            setTimeSlots([]);
            setServices([]);
        }
    }, [dateString, fetchDateDetails]);

    // Subscribe to real-time updates for this date
    useEffect(() => {
        if (!dateString) return;

        const channel = supabase
            .channel(`date-${dateString}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'time_slots' },
                () => fetchDateDetails(dateString)
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'service_date_availability' },
                () => fetchDateDetails(dateString)
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [dateString, fetchDateDetails]);

    return {
        dateAvailability,
        timeSlots,
        services,
        loading,
        error,
        refetch: () => dateString && fetchDateDetails(dateString),
    };
}

export function useAllServices() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchServices = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('services')
                .select('*')
                .eq('active', true)
                .order('name');

            if (error) throw error;
            setServices(data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch services');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchServices();
    }, [fetchServices]);

    return {
        services,
        loading,
        error,
        refetch: fetchServices,
    };
}
