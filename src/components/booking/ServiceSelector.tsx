import { Package, Clock, DollarSign, Check } from 'lucide-react';
import type { Service } from '../../types';
import './ServiceSelector.css';

interface ServiceSelectorProps {
    services: Service[];
    selectedService: Service | null;
    onSelect: (service: Service) => void;
    loading?: boolean;
}

export function ServiceSelector({
    services,
    selectedService,
    onSelect,
    loading
}: ServiceSelectorProps) {
    if (loading) {
        return (
            <div className="service-selector loading">
                <span className="spinner"></span>
                <span>Loading services...</span>
            </div>
        );
    }

    if (services.length === 0) {
        return (
            <div className="service-selector empty">
                <Package size={48} />
                <h3>No Services Available</h3>
                <p>No services are available for the selected date. Please choose another date.</p>
            </div>
        );
    }

    // Group services by category
    const groupedServices = services.reduce((groups, service) => {
        const category = service.category || 'Other';
        if (!groups[category]) {
            groups[category] = [];
        }
        groups[category].push(service);
        return groups;
    }, {} as Record<string, Service[]>);

    return (
        <div className="service-selector">
            <div className="service-selector-header">
                <h3>
                    <Package size={20} />
                    Select a Service
                </h3>
                <p>{services.length} services available</p>
            </div>

            <div className="service-groups">
                {Object.entries(groupedServices).map(([category, categoryServices]) => (
                    <div key={category} className="service-group">
                        <h4 className="group-title">{category}</h4>
                        <div className="service-list">
                            {categoryServices.map(service => (
                                <button
                                    key={service.id}
                                    className={`service-card ${selectedService?.id === service.id ? 'selected' : ''}`}
                                    onClick={() => onSelect(service)}
                                >
                                    <div className="service-card-content">
                                        <div className="service-name">{service.name}</div>
                                        {service.description && (
                                            <p className="service-description">{service.description}</p>
                                        )}
                                        <div className="service-meta">
                                            <span className="meta-item">
                                                <Clock size={14} />
                                                {service.duration_minutes} min
                                            </span>
                                            <span className="meta-item price">
                                                <DollarSign size={14} />
                                                {service.price.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    {selectedService?.id === service.id && (
                                        <div className="selected-indicator">
                                            <Check size={20} />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
