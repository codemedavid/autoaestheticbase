import { useState, useEffect, useMemo } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Check,
    X,
    AlertTriangle,
    Clock,
    Users
} from 'lucide-react';
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    isToday,
    isPast,
    startOfWeek,
    endOfWeek
} from 'date-fns';
import { useAdminDates } from '../../hooks/useAdmin';
import type { DateAvailability } from '../../types';
import './AdminCalendar.css';

interface AdminCalendarProps {
    onDateSelect: (date: string, availability: DateAvailability | null) => void;
    selectedDate?: string | null;
}

export function AdminCalendar({ onDateSelect, selectedDate }: AdminCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const { dates, loading, fetchDates } = useAdminDates();

    // Fetch dates when month changes
    useEffect(() => {
        const start = startOfMonth(subMonths(currentMonth, 1));
        const end = endOfMonth(addMonths(currentMonth, 1));
        fetchDates(start, end);
    }, [currentMonth, fetchDates]);

    // Create a map of dates for quick lookup
    const dateMap = useMemo(() => {
        const map = new Map<string, DateAvailability>();
        dates.forEach(d => map.set(d.date, d));
        return map;
    }, [dates]);

    // Generate calendar days
    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
        const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

        return eachDayOfInterval({ start: calendarStart, end: calendarEnd }).map(date => {
            const dateString = format(date, 'yyyy-MM-dd');
            const availability = dateMap.get(dateString) || null;

            return {
                date,
                dateString,
                isCurrentMonth: isSameMonth(date, currentMonth),
                isToday: isToday(date),
                isPast: isPast(date) && !isToday(date),
                isSelected: selectedDate === dateString,
                availability,
            };
        });
    }, [currentMonth, dateMap, selectedDate]);

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const handlePrevMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
    const handleNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));

    const getDayStatus = (day: typeof calendarDays[0]) => {
        if (!day.availability) return 'unconfigured';
        if (day.availability.is_override) return 'override';
        if (day.availability.is_open) return 'open';
        return 'closed';
    };

    return (
        <div className="admin-calendar">
            <div className="admin-calendar-header">
                <button
                    className="btn btn-ghost btn-icon"
                    onClick={handlePrevMonth}
                    aria-label="Previous month"
                >
                    <ChevronLeft size={20} />
                </button>

                <div className="admin-calendar-title">
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

            <div className="admin-calendar-legend">
                <div className="legend-item">
                    <span className="legend-dot legend-open"></span>
                    <span>Open</span>
                </div>
                <div className="legend-item">
                    <span className="legend-dot legend-closed"></span>
                    <span>Closed</span>
                </div>
                <div className="legend-item">
                    <span className="legend-dot legend-override"></span>
                    <span>Override</span>
                </div>
                <div className="legend-item">
                    <span className="legend-dot legend-unconfigured"></span>
                    <span>Not Set</span>
                </div>
            </div>

            <div className="admin-calendar-grid">
                {weekDays.map(day => (
                    <div key={day} className="admin-calendar-weekday">
                        {day}
                    </div>
                ))}

                {calendarDays.map(day => {
                    const status = getDayStatus(day);

                    return (
                        <button
                            key={day.dateString}
                            className={`admin-calendar-day ${status} ${day.isCurrentMonth ? '' : 'other-month'} ${day.isToday ? 'today' : ''} ${day.isSelected ? 'selected' : ''} ${day.isPast ? 'past' : ''}`}
                            onClick={() => onDateSelect(day.dateString, day.availability)}
                            disabled={loading}
                        >
                            <span className="day-number">{format(day.date, 'd')}</span>

                            {day.availability && (
                                <div className="day-indicators">
                                    {day.availability.is_open && !day.availability.is_override && (
                                        <Check size={12} className="indicator-icon open" />
                                    )}
                                    {!day.availability.is_open && !day.availability.is_override && (
                                        <X size={12} className="indicator-icon closed" />
                                    )}
                                    {day.availability.is_override && (
                                        <AlertTriangle size={12} className="indicator-icon override" />
                                    )}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {loading && (
                <div className="admin-calendar-loading">
                    <span className="spinner"></span>
                    <span>Loading...</span>
                </div>
            )}
        </div>
    );
}
