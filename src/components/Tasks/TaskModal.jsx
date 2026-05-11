import React, { useState, useEffect } from 'react';
import { X, Trash2, Send, Clock } from 'lucide-react';
import useTaskStore from '../../store/taskStore';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import './Tasks.css';

const TaskModal = ({ onClose, initialDate, task = null }) => {
  const addTask = useTaskStore(state => state.addTask);
  const updateTask = useTaskStore(state => state.updateTask);
  const deleteTask = useTaskStore(state => state.deleteTask);
  const categories = useTaskStore(state => state.categories);

  const [newActionText, setNewActionText] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    category: categories[0] || 'Work',
    startDate: initialDate ? format(initialDate, "yyyy-MM-dd'T'HH:mm") : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    dueDate: initialDate ? format(initialDate, "yyyy-MM-dd'T'HH:mm") : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    isMultiDay: false,
    actions: []
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        category: task.category,
        startDate: format(new Date(task.startDate), "yyyy-MM-dd'T'HH:mm"),
        dueDate: format(new Date(task.dueDate), "yyyy-MM-dd'T'HH:mm"),
        isMultiDay: task.isMultiDay,
        actions: task.actions || []
      });
    }
  }, [task]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => {
      const updated = { ...prev, [name]: newValue };
      
      if (name === 'startDate' || name === 'dueDate') {
        const start = new Date(updated.startDate);
        const due = new Date(updated.dueDate);
        if (start > due) {
          updated.dueDate = updated.startDate;
        }
      }
      
      return updated;
    });
  };

  const handleAddAction = (e) => {
    e.preventDefault();
    if (!newActionText.trim()) return;

    const newAction = {
      id: uuidv4(),
      text: newActionText.trim(),
      timestamp: new Date().toISOString()
    };

    setFormData(prev => ({
      ...prev,
      actions: [...prev.actions, newAction]
    }));
    setNewActionText('');
  };

  const handleRemoveAction = (actionId) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.filter(a => a.id !== actionId)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title) return;

    if (task) {
      updateTask(task.id, formData);
    } else {
      addTask(formData);
    }
    onClose();
  };

  const handleDelete = () => {
    if (task) {
      deleteTask(task.id);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{task ? 'Edit Task' : 'New Task'}</h2>
          <button className="icon-btn" onClick={onClose}><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Title</label>
            <input 
              type="text" 
              name="title" 
              value={formData.title} 
              onChange={handleChange} 
              placeholder="What needs to be done?" 
              autoFocus 
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select name="category" value={formData.category} onChange={handleChange}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            
            <div className="form-group">
              <label>Priority</label>
              <select name="priority" value={formData.priority} onChange={handleChange}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start Date</label>
              <input type="datetime-local" name="startDate" value={formData.startDate} onChange={handleChange} />
            </div>
            
            <div className="form-group">
              <label>Due Date</label>
              <input type="datetime-local" name="dueDate" value={formData.dueDate} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input type="checkbox" name="isMultiDay" checked={formData.isMultiDay} onChange={handleChange} />
              <span>Multi-day Task</span>
            </label>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              placeholder="Add details..."
              rows="2"
            ></textarea>
          </div>

          {/* Action Log Section */}
          <div className="form-group actions-log-section">
            <label>Action Log</label>
            
            <div className="actions-list">
              {formData.actions.length === 0 ? (
                <div className="no-actions">No actions recorded yet.</div>
              ) : (
                formData.actions.map(action => (
                  <div key={action.id} className="action-item">
                    <div className="action-header">
                      <div className="action-time">
                        <Clock size={12} />
                        {format(new Date(action.timestamp), "MMM d, h:mm a")}
                      </div>
                      <button 
                        type="button" 
                        className="delete-action-btn"
                        onClick={() => handleRemoveAction(action.id)}
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div className="action-text">{action.text}</div>
                  </div>
                ))
              )}
            </div>

            <div className="add-action-form">
              <input 
                type="text" 
                value={newActionText}
                onChange={(e) => setNewActionText(e.target.value)}
                placeholder="What action did you take?"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddAction(e);
                  }
                }}
              />
              <button type="button" className="btn-secondary add-action-btn" onClick={handleAddAction}>
                <Send size={16} />
              </button>
            </div>
          </div>

          <div className="modal-footer">
            {task && (
              <button type="button" className="btn-danger" onClick={handleDelete}>
                <Trash2 size={18} /> Delete
              </button>
            )}
            <div style={{ flex: 1 }}></div>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Save Task</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
