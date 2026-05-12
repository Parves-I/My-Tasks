import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Calendar, BarChart3, Settings as SettingsIcon, CheckSquare, Plus } from 'lucide-react';
import './Layout.css';
import useTaskStore from '../../store/taskStore';
import SettingsModal from '../Settings/SettingsModal';
import PendingTasksWidget from './PendingTasksWidget';
import TaskModal from '../Tasks/TaskModal';

const Layout = ({ children }) => {
  const tasks = useTaskStore((state) => state.tasks);
  const pendingTasks = tasks.filter(t => t.status !== 'done').length;
  
  const searchQuery = useTaskStore((state) => state.searchQuery);
  const setSearchQuery = useTaskStore((state) => state.setSearchQuery);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  React.useEffect(() => {
    const handleOpenModal = (event) => {
      const task = event?.detail?.task || null;
      const date = event?.detail?.date || new Date();
      setEditingTask(task);
      setSelectedDate(task ? new Date(task.startDate) : date);
      setIsTaskModalOpen(true);
    };
    window.addEventListener('open-task-modal', handleOpenModal);
    return () => window.removeEventListener('open-task-modal', handleOpenModal);
  }, []);

  return (
    <div className="layout-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar glass-panel">
        <div className="sidebar-brand">
          <CheckSquare size={22} className="text-success" />
          <h2>NotesApp</h2>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/calendar" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <Calendar size={17} />
            <span>Calendar</span>
          </NavLink>
          
          <NavLink to="/dashboard" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <BarChart3 size={17} />
            <span>Dashboard</span>
          </NavLink>

          <div className="nav-divider"></div>

          <button className="nav-item" onClick={() => setIsSettingsOpen(true)}>
            <SettingsIcon size={17} />
            <span>Settings</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="stats-mini">
            <div className="stat-label">Pending Tasks</div>
            <div className="stat-value">{pendingTasks}</div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="top-header glass-panel">
          <div className="header-search">
            <input 
              type="text" 
              placeholder="Search tasks, categories..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="header-actions">
            <button className="btn-primary" onClick={() => window.dispatchEvent(new CustomEvent('open-task-modal'))}>
              <Plus size={15} />
              <span>New Task</span>
            </button>
          </div>
        </header>

        <div className="page-content">
          {children}
        </div>
      </main>

      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
      
      {isTaskModalOpen && (
        <TaskModal 
          onClose={() => setIsTaskModalOpen(false)} 
          initialDate={selectedDate}
          task={editingTask}
        />
      )}

      <PendingTasksWidget />
    </div>
  );
};

export default Layout;
