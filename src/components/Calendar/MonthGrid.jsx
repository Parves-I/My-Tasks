import React from 'react';
import { format, isSameMonth, isSameDay } from 'date-fns';
import './Calendar.css';

const MonthGrid = ({ days, tasks, currentDate, onEditTask, onDayClick }) => {
  return (
    <div className="month-grid">
      <div className="month-grid-header">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
          <div key={d} className="month-header-cell">{d}</div>
        ))}
      </div>
      <div className="month-grid-body">
        {days.map((day) => {
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());
          
          const dayTasks = tasks.filter(task => {
            const startDate = new Date(task.startDate);
            const dueDate = new Date(task.dueDate);
            startDate.setHours(0,0,0,0);
            dueDate.setHours(23,59,59,999);
            return day >= startDate && day <= dueDate;
          });

          return (
            <div 
              key={day.toString()} 
              className={`month-day-cell ${!isCurrentMonth ? 'different-month' : ''} ${isToday ? 'is-today' : ''}`}
              onClick={(e) => {
                if(e.target.classList.contains('month-day-cell') || e.target.classList.contains('month-day-number') || e.target.classList.contains('month-tasks-container') || e.target.classList.contains('month-task-more')) {
                  onDayClick(day);
                }
              }}
            >
              <div className="month-day-number">{format(day, 'd')}</div>
              <div className="month-tasks-container">
                {dayTasks.slice(0, 4).map(task => (
                  <div 
                    key={task.id} 
                    className={`month-task-pill priority-${task.priority} ${task.status === 'done' ? 'is-done' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditTask(task);
                    }}
                    title={task.title}
                  >
                    {task.title}
                  </div>
                ))}
                {dayTasks.length > 4 && (
                  <div className="month-task-more">+{dayTasks.length - 4} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthGrid;
