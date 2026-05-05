import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import useTaskStore from '../../store/taskStore';
import { format } from 'date-fns';
import './Tasks.css';

const TaskModal = ({ onClose, initialDate, task = null }) => {
  const addTask = useTaskStore(state => state.addTask);
  const updateTask = useTaskStore(state => state.updateTask);
  const deleteTask = useTaskStore(state => state.deleteTask);
  const categories = useTaskStore(state => state.categories);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    category: categories[0] || 'Work',
    startDate: initialDate ? format(initialDate, "yyyy-MM-dd'T'HH:mm") : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    dueDate: initialDate ? format(initialDate, "yyyy-MM-dd'T'HH:mm") : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    isMultiDay: false,
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
      });
    }
  }, [task]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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
              rows="3"
            ></textarea>
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
