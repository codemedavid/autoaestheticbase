import { useState } from 'react';
import { User, Mail, Phone, FileText, Send } from 'lucide-react';
import type { Service, TimeSlot } from '../../types';
import './BookingForm.css';

export interface BookingFormData {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    notes: string;
}

interface BookingFormProps {
    service: Service;
    timeSlot: TimeSlot;
    dateString: string;
    onSubmit: (data: BookingFormData) => void;
    loading?: boolean;
}

export function BookingForm({
    service,
    timeSlot,
    dateString,
    onSubmit,
    loading
}: BookingFormProps) {
    const [formData, setFormData] = useState<BookingFormData>({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        notes: '',
    });
    const [errors, setErrors] = useState<Partial<BookingFormData>>({});

    const formatTime = (time: string) => {
        const [hours, minutes] = time.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
    };

    const formatDate = (date: string) => {
        return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const validate = (): boolean => {
        const newErrors: Partial<BookingFormData> = {};

        if (!formData.customerName.trim()) {
            newErrors.customerName = 'Name is required';
        }

        if (!formData.customerEmail.trim()) {
            newErrors.customerEmail = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) {
            newErrors.customerEmail = 'Invalid email address';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSubmit(formData);
        }
    };

    return (
        <div className="booking-form">
            <div className="booking-form-header">
                <h3>
                    <User size={20} />
                    Your Details
                </h3>
            </div>

            {/* Booking Summary */}
            <div className="booking-summary">
                <h4>Booking Summary</h4>
                <div className="summary-item">
                    <span className="summary-label">Service</span>
                    <span className="summary-value">{service.name}</span>
                </div>
                <div className="summary-item">
                    <span className="summary-label">Date</span>
                    <span className="summary-value">{formatDate(dateString)}</span>
                </div>
                <div className="summary-item">
                    <span className="summary-label">Time</span>
                    <span className="summary-value">
                        {formatTime(timeSlot.start_time)} - {formatTime(timeSlot.end_time)}
                    </span>
                </div>
                <div className="summary-item">
                    <span className="summary-label">Duration</span>
                    <span className="summary-value">{service.duration_minutes} minutes</span>
                </div>
                <div className="summary-item total">
                    <span className="summary-label">Total</span>
                    <span className="summary-value">${service.price.toFixed(2)}</span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="form-fields">
                <div className="form-group">
                    <label className="form-label" htmlFor="customerName">
                        Full Name *
                    </label>
                    <div className="input-with-icon">
                        <User size={18} className="input-icon" />
                        <input
                            id="customerName"
                            type="text"
                            className={`form-input ${errors.customerName ? 'error' : ''}`}
                            placeholder="John Doe"
                            value={formData.customerName}
                            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                        />
                    </div>
                    {errors.customerName && <span className="form-error">{errors.customerName}</span>}
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="customerEmail">
                        Email Address *
                    </label>
                    <div className="input-with-icon">
                        <Mail size={18} className="input-icon" />
                        <input
                            id="customerEmail"
                            type="email"
                            className={`form-input ${errors.customerEmail ? 'error' : ''}`}
                            placeholder="john@example.com"
                            value={formData.customerEmail}
                            onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                        />
                    </div>
                    {errors.customerEmail && <span className="form-error">{errors.customerEmail}</span>}
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="customerPhone">
                        Phone Number (Optional)
                    </label>
                    <div className="input-with-icon">
                        <Phone size={18} className="input-icon" />
                        <input
                            id="customerPhone"
                            type="tel"
                            className="form-input"
                            placeholder="+1 234 567 8900"
                            value={formData.customerPhone}
                            onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="notes">
                        Notes (Optional)
                    </label>
                    <div className="input-with-icon textarea">
                        <FileText size={18} className="input-icon" />
                        <textarea
                            id="notes"
                            className="form-textarea"
                            placeholder="Any special requests or information..."
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className="btn btn-primary btn-lg w-full"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <span className="spinner" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <Send size={18} />
                            Confirm Booking
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
