import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { BookingCalendar } from '../components/booking/BookingCalendar';
import { ServiceSelector } from '../components/booking/ServiceSelector';
import { TimeSlotPicker } from '../components/booking/TimeSlotPicker';
import { BookingForm, type BookingFormData } from '../components/booking/BookingForm';
import { BookingConfirmation } from '../components/booking/BookingConfirmation';
import { useDateDetails } from '../hooks/useAvailability';
import { useBookings } from '../hooks/useBookings';
import type { Service, TimeSlot, Booking } from '../types';
import './BookingPage.css';

type BookingStep = 'date' | 'service' | 'time' | 'details' | 'confirmation';

export function BookingPage() {
    const [currentStep, setCurrentStep] = useState<BookingStep>('date');
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
    const [completedBooking, setCompletedBooking] = useState<Booking | null>(null);

    const {
        timeSlots,
        services,
        loading: dateLoading
    } = useDateDetails(selectedDate);

    const {
        createBooking,
        loading: bookingLoading,
        error: bookingError
    } = useBookings();

    const steps = [
        { id: 'date', label: 'Date', number: 1 },
        { id: 'service', label: 'Service', number: 2 },
        { id: 'time', label: 'Time', number: 3 },
        { id: 'details', label: 'Details', number: 4 },
    ];

    const currentStepIndex = steps.findIndex(s => s.id === currentStep);

    const handleDateSelect = (date: string) => {
        setSelectedDate(date);
        setSelectedService(null);
        setSelectedTimeSlot(null);
        setCurrentStep('service');
    };

    const handleServiceSelect = (service: Service) => {
        setSelectedService(service);
        setCurrentStep('time');
    };

    const handleTimeSlotSelect = (slot: TimeSlot) => {
        setSelectedTimeSlot(slot);
        setCurrentStep('details');
    };

    const handleBookingSubmit = async (formData: BookingFormData) => {
        if (!selectedTimeSlot || !selectedService) return;

        const booking = await createBooking({
            time_slot_id: selectedTimeSlot.id,
            service_id: selectedService.id,
            customer_name: formData.customerName,
            customer_email: formData.customerEmail,
            customer_phone: formData.customerPhone || undefined,
            notes: formData.notes || undefined,
        });

        if (booking) {
            setCompletedBooking(booking);
            setCurrentStep('confirmation');
        }
    };

    const handleNewBooking = () => {
        setSelectedDate(null);
        setSelectedService(null);
        setSelectedTimeSlot(null);
        setCompletedBooking(null);
        setCurrentStep('date');
    };

    const handleBack = () => {
        switch (currentStep) {
            case 'service':
                setCurrentStep('date');
                break;
            case 'time':
                setCurrentStep('service');
                break;
            case 'details':
                setCurrentStep('time');
                break;
        }
    };

    const canGoBack = currentStep !== 'date' && currentStep !== 'confirmation';

    return (
        <div className="booking-page">
            {/* Header */}
            <header className="booking-header">
                <div className="container">
                    <div className="brand">
                        <img src="/logo.jpeg" alt="AutoAesthetic" className="brand-logo" />
                        <span>AutoAesthetic</span>
                    </div>

                </div>
            </header>

            {/* Progress Steps */}
            {currentStep !== 'confirmation' && (
                <div className="progress-container">
                    <div className="container">
                        <div className="progress-steps">
                            {steps.map((step, index) => (
                                <div
                                    key={step.id}
                                    className={`progress-step 
                    ${index < currentStepIndex ? 'completed' : ''} 
                    ${index === currentStepIndex ? 'active' : ''}
                  `}
                                >
                                    <div className="step-number">{step.number}</div>
                                    <span className="step-label">{step.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="booking-main">
                <div className="container">
                    {/* Back Button */}
                    {canGoBack && (
                        <button className="back-button btn btn-ghost" onClick={handleBack}>
                            <ArrowLeft size={18} />
                            Back
                        </button>
                    )}

                    {/* Step Content */}
                    <div className="step-content">
                        {currentStep === 'date' && (
                            <div className="step-container">
                                <div className="step-header">
                                    <h1>Book Your Appointment</h1>
                                    <p>Select an available date to get started</p>
                                </div>
                                <BookingCalendar
                                    onDateSelect={handleDateSelect}
                                    selectedDate={selectedDate}
                                />
                            </div>
                        )}

                        {currentStep === 'service' && selectedDate && (
                            <div className="step-container">
                                <div className="step-header">
                                    <h1>Choose a Service</h1>
                                    <p>Select the service you'd like to book</p>
                                </div>
                                <ServiceSelector
                                    services={services}
                                    selectedService={selectedService}
                                    onSelect={handleServiceSelect}
                                    loading={dateLoading}
                                />
                            </div>
                        )}

                        {currentStep === 'time' && selectedDate && (
                            <div className="step-container">
                                <div className="step-header">
                                    <h1>Select a Time</h1>
                                    <p>Choose your preferred time slot</p>
                                </div>
                                <TimeSlotPicker
                                    timeSlots={timeSlots}
                                    selectedSlot={selectedTimeSlot}
                                    onSelect={handleTimeSlotSelect}
                                    loading={dateLoading}
                                />
                            </div>
                        )}

                        {currentStep === 'details' && selectedDate && selectedService && selectedTimeSlot && (
                            <div className="step-container">
                                <div className="step-header">
                                    <h1>Complete Your Booking</h1>
                                    <p>Enter your details to confirm</p>
                                </div>
                                {bookingError && (
                                    <div className="error-banner">
                                        <span>{bookingError}</span>
                                    </div>
                                )}
                                <BookingForm
                                    service={selectedService}
                                    timeSlot={selectedTimeSlot}
                                    dateString={selectedDate}
                                    onSubmit={handleBookingSubmit}
                                    loading={bookingLoading}
                                />
                            </div>
                        )}

                        {currentStep === 'confirmation' && completedBooking && selectedService && selectedTimeSlot && selectedDate && (
                            <BookingConfirmation
                                booking={completedBooking}
                                service={selectedService}
                                timeSlot={selectedTimeSlot}
                                dateString={selectedDate}
                                onNewBooking={handleNewBooking}
                            />
                        )}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="booking-footer">
                <div className="container">
                    <p>&copy; {new Date().getFullYear()} AutoAesthetic. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
