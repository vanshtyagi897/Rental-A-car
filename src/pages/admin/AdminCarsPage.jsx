import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import CarImage from '../../components/common/CarImage';
import Modal from '../../components/common/Modal';

export default function AdminCarsPage() {
  const { cars, addCar, updateCar, deleteCar } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCar, setEditingCar] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'Compact SUV',
    imageUrl: '#',
    price12Hr: 2000,
    price24Hr: 3500,
    overageRatePerHr: 250,
    transmission: 'Automatic / Petrol',
    seating: '5 Seater'
  });

  const [feedback, setFeedback] = useState('');

  const openAddModal = () => {
    setFormData({
      name: '',
      category: 'Compact SUV',
      imageUrl: '#',
      price12Hr: 2000,
      price24Hr: 3500,
      overageRatePerHr: 250,
      transmission: 'Automatic / Petrol',
      seating: '5 Seater'
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (car) => {
    setEditingCar(car);
    setFormData({
      name: car.name,
      category: car.category || 'Standard Vehicle',
      imageUrl: car.imageUrl || '#',
      price12Hr: car.price12Hr,
      price24Hr: car.price24Hr,
      overageRatePerHr: car.overageRatePerHr,
      transmission: car.transmission || 'Manual / Petrol',
      seating: car.seating || '5 Seater'
    });
  };

  const handleSaveCar = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      if (editingCar) {
        await updateCar(editingCar.id, formData);
        setFeedback(`Successfully updated ${formData.name}. New rates are active immediately across the platform.`);
        setEditingCar(null);
      } else {
        await addCar(formData);
        setFeedback(`Successfully added ${formData.name} to the fleet.`);
        setIsAddModalOpen(false);
      }
    } catch (err) {
      setFeedback(`Error: ${err.message || 'Failed to save vehicle details.'}`);
    }

    setTimeout(() => setFeedback(''), 4500);
  };

  const handleDelete = async (car) => {
    if (window.confirm(`Are you sure you want to remove "${car.name}" from the active fleet catalog?`)) {
      try {
        await deleteCar(car.id);
        setFeedback(`Removed ${car.name} from fleet.`);
      } catch (err) {
        setFeedback(`Error: ${err.message || 'Failed to remove vehicle.'}`);
      }
      setTimeout(() => setFeedback(''), 4500);
    }
  };

  return (
    <div className="container-wide">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1>Fleet & Pricing Control</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            Edit 12-hour flat prices, 24-hour flat prices, and hourly overage penalty rates. All updates reflect instantly on the public user portal.
          </p>
        </div>

        <button type="button" onClick={openAddModal} className="btn btn-primary">
          + Add New Vehicle Model
        </button>
      </div>

      {feedback && (
        <div className="notice-box notice-box-info" style={{ marginBottom: '1.5rem' }}>
          {feedback}
        </div>
      )}

      {/* Fleet Table */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '80px' }}>Preview</th>
              <th>Vehicle Name</th>
              <th>Category / Specs</th>
              <th>Image URL</th>
              <th>12-Hr Price</th>
              <th>24-Hr Price</th>
              <th>Overage / Hr</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {cars.map(car => (
              <tr key={car.id}>
                <td>
                  <div style={{ width: '64px', height: '44px', background: 'var(--color-bg-input)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                    <CarImage imageUrl={car.imageUrl} alt={car.name} />
                  </div>
                </td>
                <td>
                  <strong style={{ color: 'var(--color-text-bright)', fontSize: '1rem' }}>{car.name}</strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>ID: {car.id}</div>
                </td>
                <td>
                  <div style={{ color: 'var(--color-text-bright)' }}>{car.category}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    {car.seating} • {car.transmission}
                  </div>
                </td>
                <td>
                  <code style={{ fontSize: '0.8rem', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', padding: '0.2rem 0.4rem', borderRadius: '3px', color: 'var(--color-text-muted)' }}>
                    {car.imageUrl}
                  </code>
                </td>
                <td>
                  <strong style={{ color: 'var(--color-accent-mint)' }}>₹{car.price12Hr.toLocaleString('en-IN')}</strong>
                </td>
                <td>
                  <strong style={{ color: 'var(--color-accent-mint)' }}>₹{car.price24Hr.toLocaleString('en-IN')}</strong>
                </td>
                <td>
                  <span style={{ color: 'var(--color-accent-gold)', fontWeight: 600 }}>₹{car.overageRatePerHr}/hr</span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => openEditModal(car)}
                      className="btn btn-outline btn-sm"
                    >
                      Edit Rates
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(car)}
                      className="btn btn-danger-outline btn-sm"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Vehicle Modal */}
      {(isAddModalOpen || editingCar) && (
        <Modal
          isOpen={isAddModalOpen || !!editingCar}
          onClose={() => { setIsAddModalOpen(false); setEditingCar(null); }}
          title={editingCar ? `Edit Vehicle & Pricing: ${editingCar.name}` : 'Add New Vehicle Model'}
          maxWidth="640px"
        >
          <form onSubmit={handleSaveCar}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Car Model Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Innova Hycross"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g. Premium MPV / Full SUV"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Image Link / URL
                <span className="form-label-optional"> (Use # as placeholder if real photo URL is not yet ready)</span>
              </label>
              <input
                type="text"
                className="form-control"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="#"
                required
              />
            </div>

            {/* Pricing Section */}
            <div style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
              <h4 style={{ marginBottom: '1rem', fontSize: '0.95rem', color: 'var(--color-heading)' }}>Fixed Rate &amp; Overage Configuration</h4>
              
              <div className="form-row">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">12-Hour Slot Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    className="form-control"
                    value={formData.price12Hr}
                    onChange={(e) => setFormData({ ...formData, price12Hr: e.target.value })}
                    required
                  />
                  <div className="form-hint">Flat price for 12 hours</div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">24-Hour Slot Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    className="form-control"
                    value={formData.price24Hr}
                    onChange={(e) => setFormData({ ...formData, price24Hr: e.target.value })}
                    required
                  />
                  <div className="form-hint">Flat price for standard day</div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Overage Rate / Hr (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    className="form-control"
                    value={formData.overageRatePerHr}
                    onChange={(e) => setFormData({ ...formData, overageRatePerHr: e.target.value })}
                    required
                  />
                  <div className="form-hint">Charged if late without notice</div>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Transmission / Fuel</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.transmission}
                  onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
                  placeholder="e.g. Automatic / Diesel"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Seating Capacity</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.seating}
                  onChange={(e) => setFormData({ ...formData, seating: e.target.value })}
                  placeholder="e.g. 5 Seater / 7 Seater"
                />
              </div>
            </div>

            <div className="modal-footer" style={{ margin: '1.5rem -1.75rem -1.75rem', padding: '1.25rem 1.75rem' }}>
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => { setIsAddModalOpen(false); setEditingCar(null); }}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editingCar ? 'Update Vehicle & Pricing' : 'Add Vehicle to Fleet'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
