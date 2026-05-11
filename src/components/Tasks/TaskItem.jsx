import React from 'react';
import { format, isBefore, startOfDay } from 'date-fns';
import { CheckCircle2, Circle, AlertCircle, CalendarDays, CheckCircle } from 'lucide-react';
import useTaskStore from '../../store/taskStore';
import './Tasks.css';

const TaskItem = ({ task, onEdit, currentDate }) => {
  const toggleSelection = useTaskStore(state => state.toggleSelection || state.toggleTaskSelection);
  const selectedTasks = useTaskStore(state => state.selectedTasks);
  const toggleTaskDayStatus = useTaskStore(state => state.toggleTaskDayStatus);
  const updateTask = useTaskStore(state => state.updateTask);
  
  const isSelected = selectedTasks.includes(task.id);
  const isMultiDay = task.isMultiDay || new Date(task.startDate).toDateString() !== new Date(task.dueDate).toDateString();
  const today = startOfDay(new Date());
  const dueDate = new Date(task.dueDate);
  const isOverdue = task.status !== 'done' && isBefore(dueDate, today);
  const overdueDays = isOverdue ? Math.floor((today - startOfDay(dueDate)) / (1000 * 60 * 60 * 24)) : 0;

  const toggleStatus = (e) => {
    e.stopPropagation();
    if (toggleTaskDayStatus && currentDate) {
      toggleTaskDayStatus(task.id, currentDate);
    } else {
      updateTask(task.id, { status: task.status === 'done' ? 'todo' : 'done' });
    }
  };

  const handleSelect = (e) => {
    e.stopPropagation();
    toggleSelection(task.id);
  };

  const currentDateStr = currentDate ? format(currentDate, 'yyyy-MM-dd') : null;
  const isCompletedToday = isMultiDay 
    ? task.status === 'done' || (task.completedDates || []).includes(currentDateStr)
    : task.status === 'done';

  const isPartiallyCompleted = task.status === 'partially-completed';

  return (
    <div 
      className={`task-item ${task.status === 'done' ? 'is-done' : ''} ${isSelected ? 'is-selected' : ''}`}
      onClick={onEdit}
    >
      <div className="task-priority-indicator" data-priority={task.priority}></div>
      
      <div className="task-content">
        <div className="task-header">
          <button className="task-checkbox" onClick={toggleStatus}>
            {isCompletedToday ? <CheckCircle2 className="text-success" size={20} /> : 
             isPartiallyCompleted ? <CheckCircle className="text-warning" style={{ opacity: 0.6 }} size={20} /> :
             <Circle size={20} />}
          </button>
          <span className="task-title">{task.title}</span>
          
          <div className="task-select-wrapper" onClick={handleSelect}>
            <input type="checkbox" checked={isSelected} readOnly />
          </div>
        </div>

        <div className="task-meta">
          {task.category && <span className="task-category">{task.category}</span>}
          
          {isOverdue && (
            <span className="task-badge danger">
              <AlertCircle size={12} /> Overdue by {overdueDays} {overdueDays === 1 ? 'day' : 'days'}
            </span>
          )}
          
          {task.delayedDays > 0 ? (
            <span className="task-badge danger">
              Delayed by {task.delayedDays} {task.delayedDays === 1 ? 'day' : 'days'}
            </span>
          ) : task.wasCarriedForward && (
            <span className="task-badge warning">
              Carried Forward
            </span>
          )}

          {isMultiDay && (
            <span className="task-badge primary">
              <CalendarDays size={12} /> 
              {format(new Date(task.startDate), 'MMM d')} - {format(new Date(task.dueDate), 'MMM d')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskItem;
