import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from 'recharts';
import { format, subDays, startOfDay, isSameDay } from 'date-fns';
import useTaskStore from '../../store/taskStore';
import './Dashboard.css';
import { CheckCircle, Clock, Target, Flame } from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const ProductivityDashboard = () => {
  const tasks = useTaskStore(state => state.tasks);

  // Compute metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  // Tasks completed today
  const today = startOfDay(new Date());
  const completedToday = tasks.filter(t => t.status === 'done' && isSameDay(new Date(t.dueDate), today)).length;
  
  // Category distribution
  const categoryData = useMemo(() => {
    const counts = {};
    tasks.forEach(t => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    return Object.keys(counts).map((key, index) => ({
      name: key,
      value: counts[key],
      color: COLORS[index % COLORS.length]
    }));
  }, [tasks]);

  // Last 7 days activity
  const weeklyData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dayTasks = tasks.filter(t => isSameDay(new Date(t.dueDate), date));
      data.push({
        name: format(date, 'EEE'),
        completed: dayTasks.filter(t => t.status === 'done').length,
        added: dayTasks.length
      });
    }
    return data;
  }, [tasks, today]);

  return (
    <div className="dashboard-container">
      {/* Stats row */}
      <div className="stats-grid">
        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-success)'}}>
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>Completion Rate</h3>
            <div className="stat-value">{completionRate}%</div>
            <p className="text-muted">{completedTasks} of {totalTasks} tasks done</p>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)'}}>
            <Target size={24} />
          </div>
          <div className="stat-content">
            <h3>Completed Today</h3>
            <div className="stat-value">{completedToday}</div>
            <p className="text-muted">Great job staying on track!</p>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{background: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-warning)'}}>
            <Flame size={24} />
          </div>
          <div className="stat-content">
            <h3>Current Streak</h3>
            <div className="stat-value">3 Days</div>
            <p className="text-muted">Keep the momentum going</p>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        {/* Weekly Activity Line Chart */}
        <div className="chart-card glass-panel">
          <h3>Weekly Activity</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" />
                <YAxis stroke="var(--text-muted)" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--glass-border)', borderRadius: '8px' }}
                />
                <Line type="monotone" dataKey="completed" name="Completed" stroke="var(--accent-success)" strokeWidth={3} dot={{r: 4}} />
                <Line type="monotone" dataKey="added" name="Added" stroke="var(--accent-primary)" strokeWidth={3} dot={{r: 4}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Pie Chart */}
        <div className="chart-card glass-panel">
          <h3>Tasks by Category</h3>
          <div className="chart-wrapper">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--glass-border)', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart">No tasks available</div>
            )}
            
            <div className="chart-legend">
              {categoryData.map(c => (
                <div key={c.name} className="legend-item">
                  <span className="legend-color" style={{backgroundColor: c.color}}></span>
                  <span className="legend-label">{c.name} ({c.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductivityDashboard;
