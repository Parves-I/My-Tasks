import React from 'react';
import ProductivityDashboard from '../components/Dashboard/ProductivityDashboard';

const DashboardPage = () => {
  return (
    <div className="page glass-panel" style={{ height: '100%', padding: '1.5rem', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.3rem', marginBottom: '0.2rem' }}>Productivity Dashboard</h1>
        <p className="text-muted">Analyze your performance and task completion.</p>
      </header>
      
      <ProductivityDashboard />
    </div>
  );
};

export default DashboardPage;
