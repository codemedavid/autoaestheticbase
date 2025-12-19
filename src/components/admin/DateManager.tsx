import { useState, useEffect } from 'react';
import {
    X,
    Save,
    Clock,
    Calendar,
    ToggleLeft,
    ToggleRight,
    AlertTriangle,
    Trash2,
    Sparkles,
    Package
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import {
    useAdminDates,
    useAdminTimeSlots,
    useAdminServices,
    useAdminServiceAvailability
} from '../../hooks/useAdmin';
import type { DateAvailability } from '../../types';
import './DateManager.css';

interface DateManagerProps {
    date: string;
    initialAvailability: DateAvailability | null;
    onClose: () => void;
    onSave: () => void;
}

export function DateManager({ date, initialAvailability, onClose, onSave }: DateManagerProps) {
    const { createOrUpdateDate, setOverride } = useAdminDates();
    const {
        timeSlots,
        fetchTimeSlots,
        deleteTimeSlot,
        generateTimeSlots
    } = useAdminTimeSlots();
    const { services, fetchServices } = useAdminServices();
    const {
        serviceAvailability,
        fetchServiceAvailability,
        bulkSetServicesForDate
    } = useAdminServiceAvailability();

    // Form state
    const [isOpen, setIsOpen] = useState(initialAvailability?.is_open ?? false);
    const [startTime, setStartTime] = useState(initialAvailability?.start_time?.slice(0, 5) ?? '09:00');
    const [endTime, setEndTime] = useState(initialAvailability?.end_time?.slice(0, 5) ?? '17:00');
    const [maxBookings, setMaxBookings] = useState(initialAvailability?.max_bookings_per_day ?? 10);
    const [isOverride, setIsOverride] = useState(initialAvailability?.is_override ?? false);
    const [overrideReason, setOverrideReason] = useState(initialAvailability?.override_reason ?? '');

    // Time slot generation
    const [slotInterval, setSlotInterval] = useState(60);
    const [slotsPerInterval, setSlotsPerInterval] = useState(1);

    // Selected services
    const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());

    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'general' | 'slots' | 'services'>('general');

    // Load initial data
    useEffect(() => {
        fetchServices();
        if (initialAvailability) {
            fetchTimeSlots(initialAvailability.id);
            fetchServiceAvailability(initialAvailability.id);
        }
    }, [initialAvailability, fetchServices, fetchTimeSlots, fetchServiceAvailability]);

    // Update selected services from fetched data
    useEffect(() => {
        const available = new Set(
            serviceAvailability
                .filter(sa => sa.is_available)
                .map(sa => sa.service_id)
        );
        setSelectedServices(available);
    }, [serviceAvailability]);

    const handleSave = async () => {
        setSaving(true);
        try {
            // Save date availability
            const dateResult = await createOrUpdateDate({
                date,
                is_open: isOpen && !isOverride,
                start_time: startTime + ':00',
                end_time: endTime + ':00',
                max_bookings_per_day: maxBookings,
            });

            if (!dateResult) {
                throw new Error('Failed to save date');
            }

            // If override, set it
            if (isOverride) {
                await setOverride(dateResult.id, true, overrideReason);
            }

            // Save service availability
            await bulkSetServicesForDate(
                dateResult.id,
                services.map(s => ({
                    serviceId: s.id,
                    isAvailable: selectedServices.has(s.id),
                }))
            );

            onSave();
            onClose();
        } catch (err) {
            console.error('Failed to save:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleGenerateSlots = async () => {
        if (!initialAvailability) {
            // Need to save date first
            const dateResult = await createOrUpdateDate({
                date,
                is_open: isOpen,
                start_time: startTime + ':00',
                end_time: endTime + ':00',
                max_bookings_per_day: maxBookings,
            });

            if (dateResult) {
                await generateTimeSlots(
                    dateResult.id,
                    startTime,
                    endTime,
                    slotInterval,
                    slotsPerInterval
                );
                fetchTimeSlots(dateResult.id);
            }
        } else {
            await generateTimeSlots(
                initialAvailability.id,
                startTime,
                endTime,
                slotInterval,
                slotsPerInterval
            );
            fetchTimeSlots(initialAvailability.id);
        }
    };

    const handleDeleteSlot = async (slotId: string) => {
        await deleteTimeSlot(slotId);
        if (initialAvailability) {
            fetchTimeSlots(initialAvailability.id);
        }
    };

    const toggleService = (serviceId: string) => {
        setSelectedServices(prev => {
            const next = new Set(prev);
            if (next.has(serviceId)) {
                next.delete(serviceId);
            } else {
                next.add(serviceId);
            }
            return next;
        });
    };

    const formattedDate = format(parseISO(date), 'EEEE, MMMM d, yyyy');

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="date-manager" onClick={e => e.stopPropagation()}>
                <div className="date-manager-header">
                    <div className="date-manager-title">
                        <Calendar size={20} />
                        <div>
                            <h2>Manage Date</h2>
                            <p>{formattedDate}</p>
                        </div>
                    </div>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="date-manager-tabs">
                    <button
                        className={`tab ${activeTab === 'general' ? 'active' : ''}`}
                        onClick={() => setActiveTab('general')}
                    >
                        <ToggleRight size={16} />
                        General
                    </button>
                    <button
                        className={`tab ${activeTab === 'slots' ? 'active' : ''}`}
                        onClick={() => setActiveTab('slots')}
                    >
                        <Clock size={16} />
                        Time Slots
                    </button>
                    <button
                        className={`tab ${activeTab === 'services' ? 'active' : ''}`}
                        onClick={() => setActiveTab('services')}
                    >
                        <Package size={16} />
                        Services
                    </button>
                </div>

                <div className="date-manager-body">
                    {activeTab === 'general' && (
                        <div className="tab-content">
                            {/* Open/Closed Toggle */}
                            <div className="setting-row">
                                <div className="setting-info">
                                    <span className="setting-label">Date Status</span>
                                    <span className="setting-description">
                                        {isOpen ? 'This date is open for bookings' : 'This date is closed'}
                                    </span>
                                </div>
                                <button
                                    className={`toggle-button ${isOpen ? 'on' : 'off'}`}
                                    onClick={() => setIsOpen(!isOpen)}
                                    disabled={isOverride}
                                >
                                    {isOpen ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                    <span>{isOpen ? 'Open' : 'Closed'}</span>
                                </button>
                            </div>

                            {/* Working Hours */}
                            <div className="setting-section">
                                <h3><Clock size={16} /> Working Hours</h3>
                                <div className="time-inputs">
                                    <div className="form-group">
                                        <label className="form-label">Start Time</label>
                                        <input
                                            type="time"
                                            className="form-input"
                                            value={startTime}
                                            onChange={e => setStartTime(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">End Time</label>
                                        <input
                                            type="time"
                                            className="form-input"
                                            value={endTime}
                                            onChange={e => setEndTime(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Max Bookings */}
                            <div className="form-group">
                                <label className="form-label">Maximum Bookings Per Day</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={maxBookings}
                                    onChange={e => setMaxBookings(Number(e.target.value))}
                                    min={1}
                                />
                            </div>

                            {/* Override Section */}
                            <div className="setting-section override-section">
                                <div className="setting-row">
                                    <div className="setting-info">
                                        <span className="setting-label">
                                            <AlertTriangle size={16} />
                                            Emergency Override
                                        </span>
                                        <span className="setting-description">
                                            Force close this date regardless of normal settings
                                        </span>
                                    </div>
                                    <button
                                        className={`toggle-button ${isOverride ? 'on warning' : 'off'}`}
                                        onClick={() => setIsOverride(!isOverride)}
                                    >
                                        {isOverride ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                        <span>{isOverride ? 'Active' : 'Off'}</span>
                                    </button>
                                </div>

                                {isOverride && (
                                    <div className="form-group">
                                        <label className="form-label">Override Reason (Optional)</label>
                                        <textarea
                                            className="form-textarea"
                                            placeholder="e.g., Staff unavailable, Emergency maintenance..."
                                            value={overrideReason}
                                            onChange={e => setOverrideReason(e.target.value)}
                                            rows={2}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'slots' && (
                        <div className="tab-content">
                            {/* Auto Generate Slots */}
                            <div className="setting-section">
                                <h3><Sparkles size={16} /> Auto-Generate Time Slots</h3>
                                <p className="section-description">
                                    Automatically create time slots based on your working hours
                                </p>

                                <div className="generate-options">
                                    <div className="form-group">
                                        <label className="form-label">Slot Duration (minutes)</label>
                                        <select
                                            className="form-select"
                                            value={slotInterval}
                                            onChange={e => setSlotInterval(Number(e.target.value))}
                                        >
                                            <option value={15}>15 minutes</option>
                                            <option value={30}>30 minutes</option>
                                            <option value={45}>45 minutes</option>
                                            <option value={60}>1 hour</option>
                                            <option value={90}>1.5 hours</option>
                                            <option value={120}>2 hours</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Bookings Per Slot</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={slotsPerInterval}
                                            onChange={e => setSlotsPerInterval(Number(e.target.value))}
                                            min={1}
                                            max={10}
                                        />
                                    </div>
                                </div>

                                <button
                                    className="btn btn-secondary"
                                    onClick={handleGenerateSlots}
                                >
                                    <Sparkles size={16} />
                                    Generate Slots ({startTime} - {endTime})
                                </button>
                            </div>

                            {/* Current Time Slots */}
                            <div className="setting-section">
                                <h3><Clock size={16} /> Current Time Slots</h3>

                                {timeSlots.length === 0 ? (
                                    <div className="empty-slots">
                                        <Clock size={32} />
                                        <p>No time slots configured</p>
                                        <span>Use auto-generate or add slots manually</span>
                                    </div>
                                ) : (
                                    <div className="slots-list">
                                        {timeSlots.map(slot => (
                                            <div key={slot.id} className="slot-item">
                                                <div className="slot-time">
                                                    <Clock size={14} />
                                                    <span>
                                                        {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                                                    </span>
                                                </div>
                                                <div className="slot-info">
                                                    <span className={`slot-bookings ${slot.current_bookings >= slot.max_bookings ? 'full' : ''}`}>
                                                        {slot.current_bookings}/{slot.max_bookings} booked
                                                    </span>
                                                    {!slot.is_available && (
                                                        <span className="badge badge-error">Full</span>
                                                    )}
                                                </div>
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    onClick={() => handleDeleteSlot(slot.id)}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'services' && (
                        <div className="tab-content">
                            <div className="setting-section">
                                <h3><Package size={16} /> Available Services</h3>
                                <p className="section-description">
                                    Select which services can be booked on this date
                                </p>

                                {services.length === 0 ? (
                                    <div className="empty-services">
                                        <Package size={32} />
                                        <p>No services configured</p>
                                        <span>Add services in the Services tab</span>
                                    </div>
                                ) : (
                                    <div className="services-list">
                                        {services.map(service => (
                                            <button
                                                key={service.id}
                                                className={`service-toggle ${selectedServices.has(service.id) ? 'selected' : ''}`}
                                                onClick={() => toggleService(service.id)}
                                            >
                                                <div className="service-checkbox">
                                                    {selectedServices.has(service.id) && <span className="checkmark">✓</span>}
                                                </div>
                                                <div className="service-info">
                                                    <span className="service-name">{service.name}</span>
                                                    <span className="service-meta">
                                                        {service.duration_minutes} min • ${service.price}
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <div className="selected-count">
                                    {selectedServices.size} of {services.length} services selected
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="date-manager-footer">
                    <button className="btn btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <>
                                <span className="spinner" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={16} />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
