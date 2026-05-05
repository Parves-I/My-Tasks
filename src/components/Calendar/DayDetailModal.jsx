import React from 'react';
import { X, Plus } from 'lucide-react';
import { format } from 'date-fns';
import TaskItem from '../Tasks/TaskItem';
import './Calendar.css';

const DayDetailModal = ({ date, tasks, onClose, onAddTask, onEditTask }) => {
  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
        <div className="modal-header">
          <h2>{format(date, 'MMMM d, yyyy')}</h2>
          <button className="icon-btn" onClick={onClose}><X size={24} /></button>
        </div>

        <div className="day-detail-tasks" style={{ maxHeight: '60vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem', paddingRight: '0.5rem' }}>
          {tasks.length === 0 ? (
            <div className="no-tasks text-muted" style={{ textAlign: 'center', padding: '2rem 0', fontStyle: 'italic' }}>
              No tasks scheduled for this day.
            </div>
          ) : (
            tasks.map(task => (
              <TaskItem 
                key={task.id} 
                task={task} 
                onEdit={() => onEditTask(task)} 
                currentDate={date} 
              />
            ))
          )}
        </div>

        <div className="modal-footer" style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', marginTop: 'auto' }}>
          <button className="btn-primary" onClick={() => onAddTask(date)} style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}>
            <Plus size={18} /> Add New Task
          </button>
        </div>
      </div>
    </div>
  );
};

export default DayDetailModal;
