import React, { useState } from 'react';
import { format, addDays, addMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import useTaskStore from '../../store/taskStore';
import DayColumn from './DayColumn';
import MonthGrid from './MonthGrid';
import DayDetailModal from './DayDetailModal';
import BulkActionsBar from '../Tasks/BulkActionsBar';
import TaskModal from '../Tasks/TaskModal';
import './Calendar.css';

const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week'); // 'week' | 'month'
  const [detailedDate, setDetailedDate] = useState(null);
  
  const tasks = useTaskStore((state) => state.tasks);
  const selectedTasks = useTaskStore((state) => state.selectedTasks);
  const searchQuery = useTaskStore((state) => state.searchQuery);

  // Filter tasks based on search query
  const filteredTasks = tasks.filter(task => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    return (
      (task.title && task.title.toLowerCase().includes(lowerQuery)) ||
      (task.description && task.description.toLowerCase().includes(lowerQuery)) ||
      (task.category && task.category.toLowerCase().includes(lowerQuery))
    );
  });

  // Generate days based on view mode
  const getDays = () => {
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    } else {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const start = startOfWeek(monthStart, { weekStartsOn: 1 });
      const end = endOfWeek(monthEnd, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    }
  };
  const days = getDays();

  const nextPeriod = () => setCurrentDate(viewMode === 'week' ? addDays(currentDate, 7) : addMonths(currentDate, 1));
  const prevPeriod = () => setCurrentDate(viewMode === 'week' ? addDays(currentDate, -7) : addMonths(currentDate, -1));
  const today = () => setCurrentDate(new Date());

  const openTaskModal = (date = new Date(), task = null) => {
    window.dispatchEvent(new CustomEvent('open-task-modal', { detail: { date, task } }));
  };

  return (
    <div className="calendar-view">
      <div className="calendar-header">
        <div className="calendar-nav">
          <button className="btn-secondary" onClick={prevPeriod}>&larr; Prev</button>
          <button className="btn-secondary" onClick={today}>Today</button>
          <button className="btn-secondary" onClick={nextPeriod}>Next &rarr;</button>
          
          <input 
            type="date" 
            className="calendar-date-picker btn-secondary"
            value={format(currentDate, 'yyyy-MM-dd')}
            onChange={(e) => {
              if (e.target.value) {
                // Parse date properly to avoid timezone shifts
                const [year, month, day] = e.target.value.split('-');
                setCurrentDate(new Date(year, month - 1, day));
              }
            }}
            title="Jump to date"
          />
        </div>
        
        <div className="calendar-title-group">
          <h2 className="current-month">{format(currentDate, viewMode === 'month' ? 'MMMM yyyy' : 'MMM d, yyyy')}</h2>
          
          <div className="view-toggle">
            <button 
              className={viewMode === 'week' ? 'active' : ''} 
              onClick={() => setViewMode('week')}
            >
              Week
            </button>
            <button 
              className={viewMode === 'month' ? 'active' : ''} 
              onClick={() => setViewMode('month')}
            >
              Month
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'week' ? (
        <div className="calendar-grid">
          {days.map((day) => {
            const dayTasks = filteredTasks.filter(task => {
              const startDate = new Date(task.startDate);
              const dueDate = new Date(task.dueDate);
              startDate.setHours(0,0,0,0);
              dueDate.setHours(23,59,59,999);
              return day >= startDate && day <= dueDate;
            });

            return (
              <DayColumn 
                key={day.toString()} 
                date={day} 
                tasks={dayTasks} 
                onAddTask={() => openTaskModal(day)}
                onEditTask={(task) => openTaskModal(new Date(task.startDate), task)}
              />
            );
          })}
        </div>
      ) : (
        <MonthGrid 
          days={days} 
          tasks={filteredTasks} 
          currentDate={currentDate}
          onEditTask={(task) => openTaskModal(new Date(task.startDate), task)}
          onDayClick={(date) => setDetailedDate(date)}
        />
      )}

      {selectedTasks.length > 0 && <BulkActionsBar />}
      
      {detailedDate && (
        <DayDetailModal 
          date={detailedDate}
          tasks={filteredTasks.filter(task => {
            const startDate = new Date(task.startDate);
            const dueDate = new Date(task.dueDate);
            startDate.setHours(0,0,0,0);
            dueDate.setHours(23,59,59,999);
            return detailedDate >= startDate && detailedDate <= dueDate;
          })}
          onClose={() => setDetailedDate(null)}
          onAddTask={(date) => {
            setDetailedDate(null);
            openTaskModal(date);
          }}
          onEditTask={(task) => {
            // Keep detail modal open behind task modal, or close it. Let's keep it open or close it. 
            // It's probably better to close it or just let the overlay stack. We'll let overlay stack.
            openTaskModal(new Date(task.startDate), task);
          }}
        />
      )}

    </div>
  );
};

export default CalendarView;
