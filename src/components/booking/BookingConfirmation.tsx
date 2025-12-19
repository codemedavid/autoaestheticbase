import { CheckCircle, Calendar, Clock, Package, Copy, Check, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import type { Booking, Service, TimeSlot } from '../../types';
import './BookingConfirmation.css';

interface BookingConfirmationProps {
    booking: Booking;
    service: Service;
    timeSlot: TimeSlot;
    dateString: string;
    onNewBooking: () => void;
}

export function BookingConfirmation({
    booking,
    service,
    timeSlot,
    dateString,
    onNewBooking,
}: BookingConfirmationProps) {
    const [messengerCopied, setMessengerCopied] = useState(false);
    const [referenceCopied, setReferenceCopied] = useState(false);

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

    const handleCopyReference = async () => {
        try {
            await navigator.clipboard.writeText(booking.reference_number);
            setReferenceCopied(true);
            setTimeout(() => setReferenceCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const addToCalendarUrl = () => {
        const startDate = new Date(`${dateString}T${timeSlot.start_time}`);
        const endDate = new Date(`${dateString}T${timeSlot.end_time}`);

        const formatGoogleDate = (date: Date) => {
            return date.toISOString().replace(/-|:|\.\d+/g, '');
        };

        const googleUrl = new URL('https://calendar.google.com/calendar/render');
        googleUrl.searchParams.set('action', 'TEMPLATE');
        googleUrl.searchParams.set('text', service.name);
        googleUrl.searchParams.set('dates', `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`);
        googleUrl.searchParams.set('details', `Booking Reference: ${booking.reference_number}`);

        return googleUrl.toString();
    };

    const handleMessengerRedirect = async () => {
        const message = `Hello, I would like to confirm my booking details:
        
Reference: ${booking.reference_number}
Name: ${booking.customer_name}
Service: ${service.name}
Date: ${formatDate(dateString)}
Time: ${formatTime(timeSlot.start_time)} - ${formatTime(timeSlot.end_time)}

Please let me know if there is anything else I need to do.`;

        // Copy logic with feedback
        try {
            await navigator.clipboard.writeText(message);
            setMessengerCopied(true);
            // Reset state after a short delay, though user likely navigated away
            setTimeout(() => setMessengerCopied(false), 3000);
        } catch (err) {
            console.error('Failed to copy to clipboard', err);
        }

        // Slight delay to let user see "Copied!" before redirecting
        setTimeout(() => {
            window.open(`https://www.facebook.com/messages/t/61585250916082`, '_blank');
        }, 800);
    };

    return (
        <div className="booking-confirmation">
            <div className="confirmation-header">
                <div className="success-icon">
                    <CheckCircle size={48} />
                </div>
                <h2>Booking Confirmed!</h2>
                <p>Your appointment has been successfully scheduled.</p>
            </div>

            <div className="reference-card">
                <span className="reference-label">Booking Reference</span>
                <div className="reference-number">
                    <span>{booking.reference_number}</span>
                    <button
                        className="btn btn-ghost btn-icon"
                        onClick={handleCopyReference}
                        title="Copy reference"
                    >
                        {referenceCopied ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                </div>
                <span className="reference-hint">Save this reference for your records</span>
            </div>

            <div className="confirmation-details">
                <div className="detail-item">
                    <Package size={20} className="detail-icon" />
                    <div>
                        <span className="detail-label">Service</span>
                        <span className="detail-value">{service.name}</span>
                    </div>
                </div>

                <div className="detail-item">
                    <Calendar size={20} className="detail-icon" />
                    <div>
                        <span className="detail-label">Date</span>
                        <span className="detail-value">{formatDate(dateString)}</span>
                    </div>
                </div>

                <div className="detail-item">
                    <Clock size={20} className="detail-icon" />
                    <div>
                        <span className="detail-label">Time</span>
                        <span className="detail-value">
                            {formatTime(timeSlot.start_time)} - {formatTime(timeSlot.end_time)}
                        </span>
                    </div>
                </div>
            </div>

            <div className="confirmation-actions">
                <button
                    className="btn btn-primary"
                    onClick={handleMessengerRedirect}
                    style={{
                        backgroundColor: messengerCopied ? '#22c55e' : '#0084FF',
                        borderColor: messengerCopied ? '#22c55e' : '#0084FF',
                        color: '#fff',
                        transition: 'all 0.3s ease'
                    }}
                >
                    {messengerCopied ? <Check size={18} /> : <MessageCircle size={18} />}
                    {messengerCopied ? 'Copied! Opening...' : 'Connect on Messenger'}
                </button>


                <a
                    href={addToCalendarUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                >
                    <Calendar size={18} />
                    Add to Calendar
                </a>
                <button className="btn btn-ghost" onClick={onNewBooking}>
                    Book Another
                </button>
            </div>

            <p className="confirmation-note">
                A confirmation email has been sent to <strong>{booking.customer_email}</strong>
            </p>
        </div>
    );
}
