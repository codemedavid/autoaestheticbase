import { useState } from 'react';
import {
    Calendar,
    Package,
    ClipboardList,
    LogOut,
    Menu,
    X,
    Home
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { AdminCalendar } from './AdminCalendar';
import { DateManager } from './DateManager';
import { ServiceManager } from './ServiceManager';
import { BookingsManager } from './BookingsManager';
import type { DateAvailability } from '../../types';
import './AdminDashboard.css';

type AdminTab = 'calendar' | 'services' | 'bookings' | 'settings';

export function AdminDashboard() {
    const { user, signOut } = useAuth();
    const [activeTab, setActiveTab] = useState<AdminTab>('calendar');
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedAvailability, setSelectedAvailability] = useState<DateAvailability | null>(null);
    const [showDateManager, setShowDateManager] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleDateSelect = (date: string, availability: DateAvailability | null) => {
        setSelectedDate(date);
        setSelectedAvailability(availability);
        setShowDateManager(true);
    };

    const handleDateManagerClose = () => {
        setShowDateManager(false);
        setSelectedDate(null);
        setSelectedAvailability(null);
    };

    const handleDateManagerSave = () => {
        // Refresh will happen through the hook
    };

    const handleSignOut = async () => {
        await signOut();
    };

    const tabs = [
        { id: 'calendar' as AdminTab, label: 'Calendar', icon: Calendar },
        { id: 'services' as AdminTab, label: 'Services', icon: Package },
        { id: 'bookings' as AdminTab, label: 'Bookings', icon: ClipboardList },
    ];

    return (
        <div className="admin-dashboard">
            {/* Sidebar */}
            <aside className={`admin-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <img src="/logo.jpeg" alt="AutoAesthetic" className="sidebar-logo-img" />
                        <span>AutoAesthetic</span>
                    </div>
                    <button
                        className="mobile-close btn btn-ghost btn-icon"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => {
                                setActiveTab(tab.id);
                                setMobileMenuOpen(false);
                            }}
                        >
                            <tab.icon size={20} />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-avatar">
                            {user?.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-details">
                            <span className="user-email">{user?.email}</span>
                            <span className="user-role">Administrator</span>
                        </div>
                    </div>
                    <button className="btn btn-ghost w-full" onClick={handleSignOut}>
                        <LogOut size={18} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Mobile overlay */}
            {mobileMenuOpen && (
                <div
                    className="mobile-overlay"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Main content */}
            <main className="admin-main">
                {/* Mobile header */}
                <header className="admin-header">
                    <button
                        className="mobile-menu-btn btn btn-ghost btn-icon"
                        onClick={() => setMobileMenuOpen(true)}
                    >
                        <Menu size={24} />
                    </button>
                    <h1>
                        {tabs.find(t => t.id === activeTab)?.label || 'Dashboard'}
                    </h1>
                    <a href="/" className="btn btn-ghost btn-icon" title="View Site">
                        <Home size={20} />
                    </a>
                </header>

                {/* Tab content */}
                <div className="admin-content">
                    {activeTab === 'calendar' && (
                        <div className="calendar-view">
                            <AdminCalendar
                                onDateSelect={handleDateSelect}
                                selectedDate={selectedDate}
                            />

                            <div className="calendar-instructions">
                                <h3>Quick Guide</h3>
                                <ul>
                                    <li><span className="dot open"></span> <strong>Green:</strong> Date is open for bookings</li>
                                    <li><span className="dot closed"></span> <strong>Red:</strong> Date is closed</li>
                                    <li><span className="dot override"></span> <strong>Yellow:</strong> Emergency override active</li>
                                    <li><span className="dot unconfigured"></span> <strong>Gray:</strong> Not configured</li>
                                </ul>
                                <p>Click on any date to manage its availability, time slots, and services.</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'services' && <ServiceManager />}
                    {activeTab === 'bookings' && <BookingsManager />}
                </div>
            </main>

            {/* Date Manager Modal */}
            {showDateManager && selectedDate && (
                <DateManager
                    date={selectedDate}
                    initialAvailability={selectedAvailability}
                    onClose={handleDateManagerClose}
                    onSave={handleDateManagerSave}
                />
            )}
        </div>
    );
}
