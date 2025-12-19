import { useState, useEffect } from 'react';
import {
    Plus,
    Edit2,
    Trash2,
    Package,
    DollarSign,
    Clock,
    X,
    Save,
    Search
} from 'lucide-react';
import { useAdminServices } from '../../hooks/useAdmin';
import type { Service } from '../../types';
import './ServiceManager.css';

export function ServiceManager() {
    const {
        services,
        loading,
        error,
        fetchServices,
        createService,
        updateService,
        deleteService,
        clearError
    } = useAdminServices();

    const [searchQuery, setSearchQuery] = useState('');
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        duration_minutes: 60,
        price: 0,
        category: '',
        active: true,
    });

    useEffect(() => {
        fetchServices(true);
    }, [fetchServices]);

    const filteredServices = services.filter(service =>
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            duration_minutes: 60,
            price: 0,
            category: '',
            active: true,
        });
        setEditingService(null);
        setIsCreating(false);
    };

    const handleEdit = (service: Service) => {
        setEditingService(service);
        setFormData({
            name: service.name,
            description: service.description || '',
            duration_minutes: service.duration_minutes,
            price: service.price,
            category: service.category || '',
            active: service.active,
        });
        setIsCreating(false);
    };

    const handleCreate = () => {
        resetForm();
        setIsCreating(true);
    };

    const handleSave = async () => {
        if (editingService) {
            const success = await updateService(editingService.id, formData);
            if (success) {
                resetForm();
                fetchServices(true);
            }
        } else if (isCreating) {
            const result = await createService(formData);
            if (result) {
                resetForm();
                fetchServices(true);
            }
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this service?')) {
            const success = await deleteService(id);
            if (success) {
                fetchServices(true);
            }
        }
    };

    const handleToggleActive = async (service: Service) => {
        await updateService(service.id, { active: !service.active });
        fetchServices(true);
    };

    return (
        <div className="service-manager">
            <div className="service-manager-header">
                <div className="header-left">
                    <h2>
                        <Package size={24} />
                        Services
                    </h2>
                    <p>{services.length} total services</p>
                </div>
                <button className="btn btn-primary" onClick={handleCreate}>
                    <Plus size={18} />
                    Add Service
                </button>
            </div>

            {error && (
                <div className="error-banner">
                    <span>{error}</span>
                    <button onClick={clearError}>
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Search */}
            <div className="service-search">
                <Search size={18} className="search-icon" />
                <input
                    type="text"
                    placeholder="Search services..."
                    className="form-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Service Form Modal */}
            {(isCreating || editingService) && (
                <div className="modal-overlay" onClick={resetForm}>
                    <div className="service-form-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingService ? 'Edit Service' : 'Create Service'}</h3>
                            <button className="btn btn-ghost btn-icon" onClick={resetForm}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Service Name *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g., IV Drip Therapy"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea
                                    className="form-textarea"
                                    placeholder="Describe the service..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Duration (minutes) *</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={formData.duration_minutes}
                                        onChange={(e) => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
                                        min={5}
                                        step={5}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Price ($) *</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                        min={0}
                                        step={0.01}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Category</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g., Wellness, Skin Care"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={formData.active}
                                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                    />
                                    <span>Service is active</span>
                                </label>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={resetForm}>
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleSave}
                                disabled={!formData.name || loading}
                            >
                                <Save size={16} />
                                {editingService ? 'Update' : 'Create'} Service
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Services List */}
            {loading && services.length === 0 ? (
                <div className="loading-state">
                    <span className="spinner"></span>
                    <span>Loading services...</span>
                </div>
            ) : filteredServices.length === 0 ? (
                <div className="empty-state">
                    <Package size={48} />
                    <h3>No services found</h3>
                    <p>
                        {searchQuery
                            ? 'Try adjusting your search'
                            : 'Add your first service to get started'
                        }
                    </p>
                    {!searchQuery && (
                        <button className="btn btn-primary" onClick={handleCreate}>
                            <Plus size={18} />
                            Add Service
                        </button>
                    )}
                </div>
            ) : (
                <div className="services-grid">
                    {filteredServices.map(service => (
                        <div
                            key={service.id}
                            className={`service-card ${!service.active ? 'inactive' : ''}`}
                        >
                            <div className="service-card-header">
                                <div className="service-card-title">
                                    <h3>{service.name}</h3>
                                    {service.category && (
                                        <span className="badge badge-info">{service.category}</span>
                                    )}
                                </div>
                                <div className="service-card-actions">
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => handleEdit(service)}
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => handleDelete(service.id)}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            {service.description && (
                                <p className="service-description">{service.description}</p>
                            )}

                            <div className="service-card-meta">
                                <div className="meta-item">
                                    <Clock size={14} />
                                    <span>{service.duration_minutes} min</span>
                                </div>
                                <div className="meta-item">
                                    <DollarSign size={14} />
                                    <span>${service.price.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="service-card-footer">
                                <button
                                    className={`status-toggle ${service.active ? 'active' : ''}`}
                                    onClick={() => handleToggleActive(service)}
                                >
                                    <span className="status-dot"></span>
                                    {service.active ? 'Active' : 'Inactive'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
