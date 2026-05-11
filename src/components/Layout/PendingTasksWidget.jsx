import React, { useState, useRef, useEffect } from 'react';
import useTaskStore from '../../store/taskStore';
import { format, isToday, isTomorrow, isBefore, startOfDay } from 'date-fns';
import { ListTodo, X, Circle } from 'lucide-react';
import './PendingTasksWidget.css';

const PendingTasksWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const tasks = useTaskStore(state => state.tasks);
  const updateTask = useTaskStore(state => state.updateTask);
  const widgetRef = useRef(null);

  const pendingTasks = tasks.filter(t => t.status !== 'done');

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggleTask = (e, taskId) => {
    e.stopPropagation();
    updateTask(taskId, { status: 'done' });
  };

  const handleOpenTask = (task) => {
    window.dispatchEvent(new CustomEvent('open-task-modal', { detail: { task, date: new Date(task.startDate) } }));
    setIsOpen(false); // Optionally close the widget
  };

  const groupTasks = () => {
    const grouped = {};
    const today = startOfDay(new Date());

    pendingTasks.forEach(task => {
      const dueDate = new Date(task.dueDate);
      
      let dayLabel = '';
      if (isBefore(startOfDay(dueDate), today)) {
        dayLabel = 'Past Due';
      } else if (isToday(dueDate)) {
        dayLabel = 'Today';
      } else if (isTomorrow(dueDate)) {
        dayLabel = 'Tomorrow';
      } else {
        dayLabel = format(dueDate, 'MMM d, yyyy');
      }

      // Preserve date for sorting
      const sortDate = isBefore(startOfDay(dueDate), today) 
        ? new Date(0).toISOString() // Past due goes first
        : format(dueDate, 'yyyy-MM-dd');

      const key = `${sortDate}|${dayLabel}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(task);
    });

    const sortedKeys = Object.keys(grouped).sort();
    
    const result = [];
    sortedKeys.forEach(key => {
      const label = key.split('|')[1];
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      
      const sortedTasks = grouped[key].sort((a, b) => 
        priorityOrder[a.priority] - priorityOrder[b.priority]
      );
      
      result.push({ label, tasks: sortedTasks });
    });

    return result;
  };

  const groupedTasks = groupTasks();

  if (pendingTasks.length === 0) return null;

  return (
    <div className="pending-tasks-widget" ref={widgetRef}>
      <button 
        className="pending-fab" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Pending Tasks"
      >
        <ListTodo size={20} />
        <span className="pending-badge">{pendingTasks.length}</span>
      </button>

      {isOpen && (
        <div className="pending-drawer">
          <div className="drawer-header">
            <h3>Pending Tasks</h3>
            <button className="close-btn" onClick={() => setIsOpen(false)}>
              <X size={18} />
            </button>
          </div>
          <div className="drawer-content">
            {groupedTasks.length === 0 ? (
              <div className="no-tasks">All caught up!</div>
            ) : (
              groupedTasks.map(group => (
                <div key={group.label} className="day-group">
                  <div className="day-header">{group.label}</div>
                  <div className="day-tasks">
                    {group.tasks.map(task => (
                      <div 
                        key={task.id} 
                        className="mini-task-item"
                        onClick={() => handleOpenTask(task)}
                        style={{ cursor: 'pointer' }}
                      >
                        <button 
                          className="mini-task-checkbox" 
                          onClick={(e) => handleToggleTask(e, task.id)}
                          title="Mark as done"
                        >
                          <Circle size={16} />
                        </button>
                        <div 
                          className="mini-task-priority" 
                          data-priority={task.priority}
                          title={`Priority: ${task.priority}`}
                        />
                        <div className="mini-task-title">{task.title}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingTasksWidget;
