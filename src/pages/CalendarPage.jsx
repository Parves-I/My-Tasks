import React from 'react';
import CalendarView from '../components/Calendar/CalendarView';

const CalendarPage = () => {
  return (
    <div className="page glass-panel" style={{ height: '100%', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
      <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>Calendar</h1>
          <p className="text-muted">Manage your daily and multi-day tasks.</p>
        </div>
      </header>
      
      <div style={{ flex: 1, minHeight: 0 }}>
        <CalendarView />
      </div>
    </div>
  );
};

export default CalendarPage;
