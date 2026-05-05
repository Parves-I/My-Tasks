import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from 'recharts';
import { format, subDays, startOfDay, isSameDay, isWithinInterval, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import useTaskStore from '../../store/taskStore';
import './Dashboard.css';
import { CheckCircle, Clock, Target, Flame, Calendar as CalendarIcon } from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const ProductivityDashboard = () => {
  const tasks = useTaskStore(state => state.tasks);
  const [timeRange, setTimeRange] = useState('7days'); // '7days', 'month', 'year'

  const today = startOfDay(new Date());

  // Filter tasks based on selected range
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const taskDate = new Date(t.dueDate);
      if (timeRange === '7days') {
        return isWithinInterval(taskDate, { start: subDays(today, 6), end: new Date(today.getTime() + 86400000 - 1) });
      } else if (timeRange === 'month') {
        return isWithinInterval(taskDate, { start: startOfMonth(today), end: endOfMonth(today) });
      } else if (timeRange === 'year') {
        return isWithinInterval(taskDate, { start: startOfYear(today), end: endOfYear(today) });
      }
      return true;
    });
  }, [tasks, timeRange, today]);

  // Compute metrics
  const totalTasks = filteredTasks.length;
  const completedTasks = filteredTasks.filter(t => t.status === 'done').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  // Category distribution
  const categoryData = useMemo(() => {
    const counts = {};
    filteredTasks.forEach(t => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    return Object.keys(counts).map((key, index) => ({
      name: key,
      value: counts[key],
      color: COLORS[index % COLORS.length]
    }));
  }, [filteredTasks]);

  // Dynamic Activity Line Chart Data
  const chartData = useMemo(() => {
    const data = [];
    if (timeRange === '7days') {
      for (let i = 6; i >= 0; i--) {
        const date = subDays(today, i);
        const periodTasks = tasks.filter(t => isSameDay(new Date(t.dueDate), date));
        data.push({
          name: format(date, 'EEE'),
          completed: periodTasks.filter(t => t.status === 'done').length,
          added: periodTasks.length
        });
      }
    } else if (timeRange === 'month') {
      const daysInMonth = endOfMonth(today).getDate();
      for(let i=1; i<=daysInMonth; i+=3) { // Group every 3 days to avoid too many points
        const date = new Date(today.getFullYear(), today.getMonth(), i);
        const periodTasks = tasks.filter(t => {
           const d = new Date(t.dueDate);
           return d.getMonth() === today.getMonth() && d.getDate() >= i && d.getDate() < i + 3;
        });
        data.push({
          name: format(date, 'd MMM'),
          completed: periodTasks.filter(t => t.status === 'done').length,
          added: periodTasks.length
        });
      }
    } else if (timeRange === 'year') {
      for(let i=0; i<12; i++) {
        const date = new Date(today.getFullYear(), i, 1);
        const periodTasks = tasks.filter(t => {
           const d = new Date(t.dueDate);
           return d.getMonth() === i && d.getFullYear() === today.getFullYear();
        });
        data.push({
          name: format(date, 'MMM'),
          completed: periodTasks.filter(t => t.status === 'done').length,
          added: periodTasks.length
        });
      }
    }
    return data;
  }, [tasks, timeRange, today]);

  const rangeLabel = timeRange === '7days' ? 'Last 7 Days' : timeRange === 'month' ? 'This Month' : 'This Year';

  return (
    <div className="dashboard-container">
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Productivity Overview</h2>
        
        <div className="dashboard-filter" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--glass-bg)', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
          <CalendarIcon size={18} style={{ color: 'var(--text-muted)' }} />
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer', fontSize: '0.95rem' }}
          >
            <option value="7days">Last 7 Days</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

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
            <h3>Tasks Completed</h3>
            <div className="stat-value">{completedTasks}</div>
            <p className="text-muted">In {rangeLabel.toLowerCase()}</p>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{background: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-warning)'}}>
            <Flame size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Scheduled</h3>
            <div className="stat-value">{totalTasks}</div>
            <p className="text-muted">In {rangeLabel.toLowerCase()}</p>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        {/* Activity Line Chart */}
        <div className="chart-card glass-panel">
          <h3>Activity Trend ({rangeLabel})</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" />
                <YAxis stroke="var(--text-muted)" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--glass-border)', borderRadius: '8px' }}
                />
                <Line type="monotone" dataKey="completed" name="Completed" stroke="var(--accent-success)" strokeWidth={3} dot={{r: 4}} />
                <Line type="monotone" dataKey="added" name="Added/Scheduled" stroke="var(--accent-primary)" strokeWidth={3} dot={{r: 4}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Pie Chart */}
        <div className="chart-card glass-panel">
          <h3>Categories ({rangeLabel})</h3>
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
              <div className="empty-chart">No tasks available in this period</div>
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
