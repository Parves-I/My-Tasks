import React, { useState } from 'react';
import { X, Trash2, Plus, AlertTriangle } from 'lucide-react';
import useTaskStore from '../../store/taskStore';

const SettingsModal = ({ onClose }) => {
  const categories = useTaskStore(state => state.categories);
  const addCategory = useTaskStore(state => state.addCategory);
  const removeCategory = useTaskStore(state => state.removeCategory);
  const clearAllTasks = useTaskStore(state => state.clearAllTasks);

  const [newCat, setNewCat] = useState('');
  const [activeTab, setActiveTab] = useState('categories'); // 'categories' or 'data'
  const [showConfirm, setShowConfirm] = useState(false);

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (newCat.trim()) {
      addCategory(newCat.trim());
      setNewCat('');
    }
  };

  const handleClearData = async () => {
    await clearAllTasks();
    setShowConfirm(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h2>Settings</h2>
          <button className="icon-btn" onClick={onClose}><X size={24} /></button>
        </div>

        <div className="settings-tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
          <button 
            style={{ background: 'none', border: 'none', color: activeTab === 'categories' ? 'var(--accent-primary)' : 'var(--text-muted)', paddingBottom: '0.5rem', cursor: 'pointer', borderBottom: activeTab === 'categories' ? '2px solid var(--accent-primary)' : 'none', fontWeight: 500 }}
            onClick={() => setActiveTab('categories')}
          >
            Categories
          </button>
          <button 
            style={{ background: 'none', border: 'none', color: activeTab === 'data' ? 'var(--accent-primary)' : 'var(--text-muted)', paddingBottom: '0.5rem', cursor: 'pointer', borderBottom: activeTab === 'data' ? '2px solid var(--accent-primary)' : 'none', fontWeight: 500 }}
            onClick={() => setActiveTab('data')}
          >
            Data Management
          </button>
        </div>

        {activeTab === 'categories' && (
          <div className="settings-section">
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-secondary)' }}>Manage Categories</h3>
            
            <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <input 
                type="text" 
                value={newCat} 
                onChange={(e) => setNewCat(e.target.value)} 
                placeholder="New Category Name" 
                style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.1)', color: 'white' }}
              />
              <button type="submit" className="btn-primary"><Plus size={18} /> Add</button>
            </form>

            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {categories.map(cat => (
                <li key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '4px' }}>
                  <span>{cat}</span>
                  <button onClick={() => removeCategory(cat)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="settings-section">
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-secondary)' }}>Danger Zone</h3>
            
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '1rem', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-danger)', marginBottom: '0.5rem', fontWeight: 600 }}>
                <AlertTriangle size={20} />
                Clear All Data
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                This will permanently delete all tasks and actions from your local storage and the database. This action cannot be undone.
              </p>
              
              {!showConfirm ? (
                <button className="btn-danger" onClick={() => setShowConfirm(true)}>Clear Data</button>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn-danger" onClick={handleClearData}>Yes, Delete Everything</button>
                  <button className="btn-secondary" onClick={() => setShowConfirm(false)}>Cancel</button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SettingsModal;
