import React from 'react';
import { format, isToday } from 'date-fns';
import { Plus } from 'lucide-react';
import TaskItem from '../Tasks/TaskItem';

const DayColumn = ({ date, tasks, onAddTask, onEditTask }) => {
  const today = isToday(date);

  return (
    <div className={`day-column ${today ? 'is-today' : ''}`}>
      <div className="day-header">
        <div className="day-name">{format(date, 'EEE')}</div>
        <div className="day-number">{format(date, 'd')}</div>
      </div>
      
      <div className="day-tasks-container">
        {tasks.sort((a,b) => new Date(a.startDate) - new Date(b.startDate)).map((task) => (
          <TaskItem key={task.id} task={task} onEdit={() => onEditTask(task)} currentDate={date} />
        ))}
        
        <button className="add-task-btn" onClick={onAddTask}>
          <Plus size={16} />
          <span>Add Task</span>
        </button>
      </div>
    </div>
  );
};

export default DayColumn;
