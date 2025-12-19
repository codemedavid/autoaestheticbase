import { Clock, Check } from 'lucide-react';
import type { TimeSlot } from '../../types';
import './TimeSlotPicker.css';

interface TimeSlotPickerProps {
    timeSlots: TimeSlot[];
    selectedSlot: TimeSlot | null;
    onSelect: (slot: TimeSlot) => void;
    loading?: boolean;
}

export function TimeSlotPicker({
    timeSlots,
    selectedSlot,
    onSelect,
    loading
}: TimeSlotPickerProps) {
    // Format time for display
    const formatTime = (time: string) => {
        const [hours, minutes] = time.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
    };

    if (loading) {
        return (
            <div className="time-slot-picker loading">
                <span className="spinner"></span>
                <span>Loading available times...</span>
            </div>
        );
    }

    const availableSlots = timeSlots.filter(slot => slot.is_available);

    if (availableSlots.length === 0) {
        return (
            <div className="time-slot-picker empty">
                <Clock size={48} />
                <h3>No Times Available</h3>
                <p>All time slots are fully booked. Please choose another date.</p>
            </div>
        );
    }

    return (
        <div className="time-slot-picker">
            <div className="time-slot-header">
                <h3>
                    <Clock size={20} />
                    Select a Time
                </h3>
                <p>{availableSlots.length} slots available</p>
            </div>

            <div className="time-slots-grid">
                {availableSlots.map(slot => (
                    <button
                        key={slot.id}
                        className={`time-slot ${selectedSlot?.id === slot.id ? 'selected' : ''}`}
                        onClick={() => onSelect(slot)}
                    >
                        <span className="time-range">
                            {formatTime(slot.start_time)}
                        </span>
                        <span className="time-to">to</span>
                        <span className="time-range">
                            {formatTime(slot.end_time)}
                        </span>

                        {selectedSlot?.id === slot.id && (
                            <span className="slot-check">
                                <Check size={16} />
                            </span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
