import { useState, useEffect, useMemo } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon
} from 'lucide-react';
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    addMonths,
    subMonths,
    isToday,
    startOfWeek,
    endOfWeek,
    isBefore,
    startOfDay
} from 'date-fns';
import { useAvailability } from '../../hooks/useAvailability';
import './BookingCalendar.css';

interface BookingCalendarProps {
    onDateSelect: (date: string) => void;
    selectedDate: string | null;
}

export function BookingCalendar({ onDateSelect, selectedDate }: BookingCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const { availableDates, loading, fetchMonthAvailability } = useAvailability();

    // Fetch availability when month changes
    useEffect(() => {
        fetchMonthAvailability(currentMonth);
    }, [currentMonth, fetchMonthAvailability]);

    // Create a set of available dates for quick lookup
    const availableDateSet = useMemo(() => {
        return new Set(availableDates.map(d => d.date));
    }, [availableDates]);

    // Generate calendar days
    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
        const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
        const today = startOfDay(new Date());

        return eachDayOfInterval({ start: calendarStart, end: calendarEnd }).map(date => {
            const dateString = format(date, 'yyyy-MM-dd');
            const isPastDate = isBefore(date, today);
            const isAvailable = availableDateSet.has(dateString) && !isPastDate;

            return {
                date,
                dateString,
                isCurrentMonth: isSameMonth(date, currentMonth),
                isToday: isToday(date),
                isPast: isPastDate,
                isAvailable,
                isSelected: selectedDate === dateString,
            };
        });
    }, [currentMonth, availableDateSet, selectedDate]);

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const handlePrevMonth = () => {
        const prevMonth = subMonths(currentMonth, 1);
        // Don't go before current month
        if (!isBefore(startOfMonth(prevMonth), startOfMonth(new Date()))) {
            setCurrentMonth(prevMonth);
        }
    };

    const handleNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));

    const canGoPrev = !isBefore(
        startOfMonth(subMonths(currentMonth, 1)),
        startOfMonth(new Date())
    );

    return (
        <div className="booking-calendar">
            <div className="booking-calendar-header">
                <button
                    className="btn btn-ghost btn-icon"
                    onClick={handlePrevMonth}
                    disabled={!canGoPrev}
                    aria-label="Previous month"
                >
                    <ChevronLeft size={20} />
                </button>

                <div className="booking-calendar-title">
                    <CalendarIcon size={20} />
                    <h2>{format(currentMonth, 'MMMM yyyy')}</h2>
                </div>

                <button
                    className="btn btn-ghost btn-icon"
                    onClick={handleNextMonth}
                    aria-label="Next month"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            <div className="booking-calendar-grid">
                {weekDays.map(day => (
                    <div key={day} className="booking-calendar-weekday">
                        {day}
                    </div>
                ))}

                {calendarDays.map(day => (
                    <button
                        key={day.dateString}
                        className={`booking-calendar-day 
              ${day.isCurrentMonth ? '' : 'other-month'} 
              ${day.isToday ? 'today' : ''} 
              ${day.isSelected ? 'selected' : ''} 
              ${day.isAvailable ? 'available' : 'unavailable'}
            `}
                        onClick={() => day.isAvailable && onDateSelect(day.dateString)}
                        disabled={!day.isAvailable || loading}
                    >
                        <span className="day-number">{format(day.date, 'd')}</span>
                        {day.isAvailable && (
                            <span className="availability-dot"></span>
                        )}
                    </button>
                ))}
            </div>

            {loading && (
                <div className="booking-calendar-loading">
                    <span className="spinner"></span>
                </div>
            )}

            <p className="booking-calendar-hint">
                Select an available date to continue
            </p>
        </div>
    );
}
