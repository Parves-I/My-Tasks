import React from 'react';
import { NavLink } from 'react-router-dom';
import { Calendar, BarChart3, Settings, CheckSquare, Plus } from 'lucide-react';
import './Layout.css';
import useTaskStore from '../../store/taskStore';

const Layout = ({ children }) => {
  const tasks = useTaskStore((state) => state.tasks);
  const pendingTasks = tasks.filter(t => t.status !== 'done').length;

  return (
    <div className="layout-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar glass-panel">
        <div className="sidebar-brand">
          <CheckSquare size={28} className="text-success" />
          <h2>NotesApp</h2>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/calendar" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <Calendar size={20} />
            <span>Calendar</span>
          </NavLink>
          
          <NavLink to="/dashboard" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <BarChart3 size={20} />
            <span>Dashboard</span>
          </NavLink>

          <div className="nav-divider"></div>

          <button className="nav-item">
            <Settings size={20} />
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
            <input type="text" placeholder="Search tasks, categories..." />
          </div>
          <div className="header-actions">
            <button className="btn-primary" onClick={() => window.dispatchEvent(new CustomEvent('open-task-modal'))}>
              <Plus size={18} />
              <span>New Task</span>
            </button>
          </div>
        </header>

        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
