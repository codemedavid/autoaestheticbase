import { useState, useEffect } from 'react';
import {
    ClipboardList,
    Search,
    Filter,
    Calendar,
    Clock,
    User,
    Mail,
    Phone,
    FileText,
    CheckCircle,
    XCircle,
    AlertCircle,
    MoreVertical,
    Eye
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useAdminBookings, useAdminServices } from '../../hooks/useAdmin';
import type { BookingStatus } from '../../types';
import './BookingsManager.css';

export function BookingsManager() {
    const {
        bookings,
        loading,
        error,
        fetchBookings,
        updateBookingStatus,
        deleteBooking,
        clearError
    } = useAdminBookings();
    const { services, fetchServices } = useAdminServices();

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedBooking, setSelectedBooking] = useState<any | null>(null);

    useEffect(() => {
        fetchBookings();
        fetchServices(true);
    }, [fetchBookings, fetchServices]);

    const filteredBookings = bookings.filter(booking => {
        const matchesSearch =
            booking.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            booking.customer_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            booking.reference_number?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const getStatusIcon = (status: BookingStatus) => {
        switch (status) {
            case 'confirmed': return <CheckCircle size={14} />;
            case 'cancelled': return <XCircle size={14} />;
            case 'completed': return <CheckCircle size={14} />;
            case 'no_show': return <AlertCircle size={14} />;
            default: return null;
        }
    };

    const getStatusClass = (status: BookingStatus) => {
        switch (status) {
            case 'confirmed': return 'status-confirmed';
            case 'cancelled': return 'status-cancelled';
            case 'completed': return 'status-completed';
            case 'no_show': return 'status-noshow';
            default: return '';
        }
    };

    const handleStatusChange = async (bookingId: string, newStatus: BookingStatus) => {
        await updateBookingStatus(bookingId, newStatus);
        fetchBookings();
        if (selectedBooking?.id === bookingId) {
            setSelectedBooking(null);
        }
    };

    const handleDelete = async (bookingId: string) => {
        if (confirm('Are you sure you want to delete this booking?')) {
            await deleteBooking(bookingId);
            fetchBookings();
            if (selectedBooking?.id === bookingId) {
                setSelectedBooking(null);
            }
        }
    };

    const getServiceName = (serviceId: string) => {
        return services.find(s => s.id === serviceId)?.name || 'Unknown Service';
    };

    return (
        <div className="bookings-manager">
            <div className="bookings-header">
                <div className="header-left">
                    <h2>
                        <ClipboardList size={24} />
                        Bookings
                    </h2>
                    <p>{bookings.length} total bookings</p>
                </div>
            </div>

            {error && (
                <div className="error-banner">
                    <span>{error}</span>
                    <button onClick={clearError}>×</button>
                </div>
            )}

            {/* Filters */}
            <div className="bookings-filters">
                <div className="search-bar">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search by name, email, or reference..."
                        className="form-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="filter-group">
                    <Filter size={16} />
                    <select
                        className="form-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="no_show">No Show</option>
                    </select>
                </div>
            </div>

            {/* Bookings List */}
            {loading && bookings.length === 0 ? (
                <div className="loading-state">
                    <span className="spinner"></span>
                    <span>Loading bookings...</span>
                </div>
            ) : filteredBookings.length === 0 ? (
                <div className="empty-state">
                    <ClipboardList size={48} />
                    <h3>No bookings found</h3>
                    <p>
                        {searchQuery || statusFilter !== 'all'
                            ? 'Try adjusting your filters'
                            : 'Bookings will appear here when customers book'
                        }
                    </p>
                </div>
            ) : (
                <div className="bookings-list">
                    {filteredBookings.map(booking => (
                        <div key={booking.id} className="booking-card">
                            <div className="booking-card-header">
                                <div className="booking-reference">
                                    <span className="ref-label">Ref:</span>
                                    <span className="ref-number">{booking.reference_number}</span>
                                </div>
                                <span className={`booking-status ${getStatusClass(booking.status)}`}>
                                    {getStatusIcon(booking.status)}
                                    {booking.status}
                                </span>
                            </div>

                            <div className="booking-card-body">
                                <div className="booking-info-row">
                                    <User size={14} />
                                    <span>{booking.customer_name}</span>
                                </div>
                                <div className="booking-info-row">
                                    <Mail size={14} />
                                    <span>{booking.customer_email}</span>
                                </div>
                                {booking.customer_phone && (
                                    <div className="booking-info-row">
                                        <Phone size={14} />
                                        <span>{booking.customer_phone}</span>
                                    </div>
                                )}
                                <div className="booking-info-row">
                                    <FileText size={14} />
                                    <span>{getServiceName(booking.service_id)}</span>
                                </div>
                                {booking.time_slot?.date_availability?.date && (
                                    <div className="booking-info-row">
                                        <Calendar size={14} />
                                        <span>
                                            {format(parseISO(booking.time_slot.date_availability.date), 'MMM d, yyyy')}
                                        </span>
                                    </div>
                                )}
                                {booking.time_slot && (
                                    <div className="booking-info-row">
                                        <Clock size={14} />
                                        <span>
                                            {booking.time_slot.start_time?.slice(0, 5)} - {booking.time_slot.end_time?.slice(0, 5)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="booking-card-footer">
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => setSelectedBooking(booking)}
                                >
                                    <Eye size={14} />
                                    View
                                </button>

                                {booking.status === 'confirmed' && (
                                    <>
                                        <button
                                            className="btn btn-success btn-sm"
                                            onClick={() => handleStatusChange(booking.id, 'completed')}
                                        >
                                            <CheckCircle size={14} />
                                            Complete
                                        </button>
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => handleStatusChange(booking.id, 'cancelled')}
                                        >
                                            <XCircle size={14} />
                                            Cancel
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Booking Details Modal */}
            {selectedBooking && (
                <div className="modal-overlay" onClick={() => setSelectedBooking(null)}>
                    <div className="booking-detail-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Booking Details</h3>
                            <button
                                className="btn btn-ghost btn-icon"
                                onClick={() => setSelectedBooking(null)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="detail-section">
                                <h4>Reference</h4>
                                <p className="detail-reference">{selectedBooking.reference_number}</p>
                            </div>

                            <div className="detail-section">
                                <h4>Status</h4>
                                <span className={`booking-status large ${getStatusClass(selectedBooking.status)}`}>
                                    {getStatusIcon(selectedBooking.status)}
                                    {selectedBooking.status}
                                </span>
                            </div>

                            <div className="detail-section">
                                <h4>Customer</h4>
                                <p>{selectedBooking.customer_name}</p>
                                <p>{selectedBooking.customer_email}</p>
                                {selectedBooking.customer_phone && <p>{selectedBooking.customer_phone}</p>}
                            </div>

                            <div className="detail-section">
                                <h4>Service</h4>
                                <p>{getServiceName(selectedBooking.service_id)}</p>
                            </div>

                            {selectedBooking.time_slot && (
                                <div className="detail-section">
                                    <h4>Appointment</h4>
                                    <p>
                                        {selectedBooking.time_slot.date_availability?.date &&
                                            format(parseISO(selectedBooking.time_slot.date_availability.date), 'EEEE, MMMM d, yyyy')
                                        }
                                    </p>
                                    <p>
                                        {selectedBooking.time_slot.start_time?.slice(0, 5)} - {selectedBooking.time_slot.end_time?.slice(0, 5)}
                                    </p>
                                </div>
                            )}

                            {selectedBooking.notes && (
                                <div className="detail-section">
                                    <h4>Notes</h4>
                                    <p>{selectedBooking.notes}</p>
                                </div>
                            )}

                            <div className="detail-section">
                                <h4>Booked On</h4>
                                <p>{format(parseISO(selectedBooking.created_at), 'MMM d, yyyy h:mm a')}</p>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setSelectedBooking(null)}
                            >
                                Close
                            </button>

                            {selectedBooking.status === 'confirmed' && (
                                <>
                                    <button
                                        className="btn btn-success"
                                        onClick={() => handleStatusChange(selectedBooking.id, 'completed')}
                                    >
                                        <CheckCircle size={16} />
                                        Mark Completed
                                    </button>
                                    <button
                                        className="btn btn-warning"
                                        onClick={() => handleStatusChange(selectedBooking.id, 'no_show')}
                                    >
                                        <AlertCircle size={16} />
                                        No Show
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
