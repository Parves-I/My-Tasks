import React, { useState } from 'react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import useTaskStore from '../../store/taskStore';
import DayColumn from './DayColumn';
import BulkActionsBar from '../Tasks/BulkActionsBar';
import TaskModal from '../Tasks/TaskModal';
import './Calendar.css';

const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  
  const tasks = useTaskStore((state) => state.tasks);
  const selectedTasks = useTaskStore((state) => state.selectedTasks);

  // Generate week days
  const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
  const end = endOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });

  const nextWeek = () => setCurrentDate(addDays(currentDate, 7));
  const prevWeek = () => setCurrentDate(addDays(currentDate, -7));
  const today = () => setCurrentDate(new Date());

  // Listen to custom event from layout header
  React.useEffect(() => {
    const handleOpenModal = () => {
      setEditingTask(null);
      setSelectedDate(new Date());
      setIsModalOpen(true);
    };
    window.addEventListener('open-task-modal', handleOpenModal);
    return () => window.removeEventListener('open-task-modal', handleOpenModal);
  }, []);

  const openTaskModal = (date = new Date(), task = null) => {
    setEditingTask(task);
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  return (
    <div className="calendar-view">
      <div className="calendar-header">
        <div className="calendar-nav">
          <button className="btn-secondary" onClick={prevWeek}>&larr; Prev</button>
          <button className="btn-secondary" onClick={today}>Today</button>
          <button className="btn-secondary" onClick={nextWeek}>Next &rarr;</button>
        </div>
        <h2 className="current-month">{format(currentDate, 'MMMM yyyy')}</h2>
      </div>

      <div className="calendar-grid">
        {days.map((day) => {
          // Filter tasks for this day. Support multi-day by checking if day is between start and due date
          const dayTasks = tasks.filter(task => {
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

      {selectedTasks.length > 0 && <BulkActionsBar />}
      
      {isModalOpen && (
        <TaskModal 
          onClose={() => setIsModalOpen(false)} 
          initialDate={selectedDate}
          task={editingTask}
        />
      )}
    </div>
  );
};

export default CalendarView;
