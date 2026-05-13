import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from 'recharts';
import { format, subDays, startOfDay, isBefore, isSameDay, isWithinInterval, startOfMonth, endOfMonth, startOfYear, endOfYear, differenceInDays, isAfter } from 'date-fns';
import useTaskStore from '../../store/taskStore';
import './Dashboard.css';
import { CheckCircle, Clock, Target, Flame, Calendar as CalendarIcon, AlertCircle, TrendingUp, ListChecks, Timer, Zap } from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const ProductivityDashboard = () => {
  const tasks = useTaskStore(state => state.tasks);
  const [timeRange, setTimeRange] = useState('7days');
  const [customFrom, setCustomFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [customTo, setCustomTo] = useState(format(new Date(), 'yyyy-MM-dd'));

  const today = startOfDay(new Date());

  // Filter tasks based on selected range
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const taskDue = startOfDay(new Date(t.dueDate));
      const taskStart = startOfDay(new Date(t.startDate));
      if (timeRange === '7days') {
        const rangeStart = subDays(today, 6);
        return (isSameDay(taskDue, rangeStart) || isAfter(taskDue, rangeStart)) && (isSameDay(taskDue, today) || isBefore(taskDue, today));
      } else if (timeRange === 'month') {
        return isWithinInterval(taskDue, { start: startOfMonth(today), end: endOfMonth(today) });
      } else if (timeRange === 'year') {
        return isWithinInterval(taskDue, { start: startOfYear(today), end: endOfYear(today) });
      } else if (timeRange === 'alltime') {
        return isSameDay(taskDue, today) || isBefore(taskDue, today);
      } else if (timeRange === 'custom') {
        const from = startOfDay(new Date(customFrom));
        const to = startOfDay(new Date(customTo + 'T23:59:59'));
        return isWithinInterval(taskDue, { start: from, end: to });
      }
      return true;
    });
  }, [tasks, timeRange, today, customFrom, customTo]);

  // === CORE METRICS ===
  const totalTasks = filteredTasks.length;
  const completedTasks = filteredTasks.filter(t => t.status === 'done').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  // Delayed = not done AND (overdue: dueDate is before today, OR carry-forwarded with delayedDays > 0)
  const delayedTasks = filteredTasks.filter(t => {
    if (t.status === 'done') return false;
    const due = startOfDay(new Date(t.dueDate));
    return isBefore(due, today) || t.delayedDays > 0;
  });
  
  // Pending = not done + NOT delayed
  const pendingTasks = filteredTasks.filter(t => {
    if (t.status === 'done') return false;
    const due = startOfDay(new Date(t.dueDate));
    const isDelayed = isBefore(due, today) || t.delayedDays > 0;
    return !isDelayed;
  });

  const inProgressTasks = filteredTasks.filter(t => t.status === 'partially-completed').length;

  // === CATEGORY DISTRIBUTION ===
  const categoryData = useMemo(() => {
    const counts = {};
    filteredTasks.forEach(t => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    return Object.keys(counts).map((key, index) => ({
      name: key, value: counts[key], color: COLORS[index % COLORS.length]
    }));
  }, [filteredTasks]);

  // === CATEGORY COMPLETION TABLE ===
  const categoryTableData = useMemo(() => {
    const map = {};
    filteredTasks.forEach(t => {
      if (!map[t.category]) map[t.category] = { total: 0, completed: 0, delayed: 0, pending: 0 };
      map[t.category].total++;
      if (t.status === 'done') map[t.category].completed++;
      else if (isBefore(startOfDay(new Date(t.dueDate)), today) || t.delayedDays > 0) map[t.category].delayed++;
      else map[t.category].pending++;
    });
    return Object.keys(map).map(cat => ({
      name: cat,
      ...map[cat],
      rate: map[cat].total > 0 ? Math.round((map[cat].completed / map[cat].total) * 100) : 0
    })).sort((a, b) => b.total - a.total);
  }, [filteredTasks]);

  // === PRIORITY BREAKDOWN ===
  const priorityData = useMemo(() => {
    const priorities = ['low', 'medium', 'high', 'urgent'];
    return priorities.map(p => {
      const all = filteredTasks.filter(t => t.priority === p);
      return {
        name: p.charAt(0).toUpperCase() + p.slice(1),
        completed: all.filter(t => t.status === 'done').length,
        incomplete: all.filter(t => t.status !== 'done').length
      };
    });
  }, [filteredTasks]);

  // === TIMELINESS ===
  const timelinessData = useMemo(() => {
    let onTime = 0, late = 0;
    filteredTasks.forEach(t => {
      if (t.status === 'done') {
        if (t.delayedDays > 0) late++;
        else {
          const due = startOfDay(new Date(t.dueDate));
          const completed = t.completedAt ? startOfDay(new Date(t.completedAt)) : today;
          if (isAfter(completed, due)) late++;
          else onTime++;
        }
      }
    });
    return [
      { name: 'On Time', value: onTime, color: '#10b981' },
      { name: 'Late/Delayed', value: late, color: '#ef4444' }
    ];
  }, [filteredTasks]);

  // === CATEGORY DELAY ===
  // Only counts tasks that are actually delayed:
  // 1. Completed late (done after due date)
  // 2. Still overdue (not done, past due date)
  const categoryDelayData = useMemo(() => {
    const delayMap = {};
    filteredTasks.forEach(t => {
      const due = startOfDay(new Date(t.dueDate));
      let delayDays = 0;
      let isDelayed = false;

      if (t.status === 'done') {
        // Completed late: check completedAt vs dueDate, or use delayedDays
        if (t.completedAt) {
          const completed = startOfDay(new Date(t.completedAt));
          if (isAfter(completed, due)) {
            delayDays = differenceInDays(completed, due);
            isDelayed = true;
          }
        } else if (t.delayedDays > 0) {
          delayDays = t.delayedDays;
          isDelayed = true;
        }
      } else {
        // Still open & overdue
        if (isBefore(due, today)) {
          delayDays = differenceInDays(today, due);
          isDelayed = true;
        } else if (t.delayedDays > 0) {
          delayDays = t.delayedDays;
          isDelayed = true;
        }
      }

      if (isDelayed && delayDays > 0) {
        if (!delayMap[t.category]) delayMap[t.category] = { totalDelay: 0, count: 0 };
        delayMap[t.category].count++;
        delayMap[t.category].totalDelay += delayDays;
      }
    });
    return Object.keys(delayMap).map(cat => ({
      name: cat,
      avgDelay: delayMap[cat].count > 0 ? Number((delayMap[cat].totalDelay / delayMap[cat].count).toFixed(1)) : 0
    })).sort((a, b) => b.avgDelay - a.avgDelay);
  }, [filteredTasks, today]);

  // === ACTIVITY LINE CHART ===
  const chartData = useMemo(() => {
    const data = [];
    if (timeRange === '7days') {
      for (let i = 6; i >= 0; i--) {
        const date = subDays(today, i);
        const dayTasks = tasks.filter(t => isSameDay(new Date(t.dueDate), date));
        data.push({ name: format(date, 'EEE'), completed: dayTasks.filter(t => t.status === 'done').length, added: dayTasks.length });
      }
    } else if (timeRange === 'month') {
      const daysInMonth = endOfMonth(today).getDate();
      for (let i = 1; i <= daysInMonth; i += 3) {
        const date = new Date(today.getFullYear(), today.getMonth(), i);
        const dayTasks = tasks.filter(t => { const d = new Date(t.dueDate); return d.getMonth() === today.getMonth() && d.getDate() >= i && d.getDate() < i + 3; });
        data.push({ name: format(date, 'd MMM'), completed: dayTasks.filter(t => t.status === 'done').length, added: dayTasks.length });
      }
    } else if (timeRange === 'year') {
      for (let i = 0; i < 12; i++) {
        const date = new Date(today.getFullYear(), i, 1);
        const monthTasks = tasks.filter(t => { const d = new Date(t.dueDate); return d.getMonth() === i && d.getFullYear() === today.getFullYear(); });
        data.push({ name: format(date, 'MMM'), completed: monthTasks.filter(t => t.status === 'done').length, added: monthTasks.length });
      }
    } else if (timeRange === 'alltime' || timeRange === 'custom') {
      const from = timeRange === 'custom' ? startOfDay(new Date(customFrom)) : (tasks.length > 0 ? startOfDay(new Date(Math.min(...tasks.map(t => new Date(t.dueDate).getTime())))) : subDays(today, 30));
      const to = timeRange === 'custom' ? startOfDay(new Date(customTo)) : today;
      const totalDays = differenceInDays(to, from) + 1;
      const step = Math.max(1, Math.floor(totalDays / 15));
      for (let i = 0; i < totalDays; i += step) {
        const date = new Date(from.getTime() + i * 86400000);
        const endDate = new Date(from.getTime() + Math.min(i + step, totalDays) * 86400000);
        const periodTasks = tasks.filter(t => { const d = new Date(t.dueDate); return d >= date && d < endDate; });
        data.push({ name: format(date, totalDays > 60 ? 'MMM d' : 'd MMM'), completed: periodTasks.filter(t => t.status === 'done').length, added: periodTasks.length });
      }
    }
    return data;
  }, [tasks, timeRange, today, customFrom, customTo]);

  // === PRODUCTIVITY SCORE ===
  const productivityScore = useMemo(() => {
    if (totalTasks === 0) return { score: 0, completionPts: 0, timelinePts: 0, delayPenalty: 0 };
    const completionPts = Math.round(completionRate * 0.6);
    const onTimeCount = timelinessData[0]?.value || 0;
    const lateCount = timelinessData[1]?.value || 0;
    const timelinePts = completedTasks > 0 ? Math.round((onTimeCount / completedTasks) * 30) : 0;
    const delayPenalty = Math.min(10, Math.round((delayedTasks.length / totalTasks) * 30));
    const score = Math.max(0, Math.min(100, completionPts + timelinePts - delayPenalty));
    return { score, completionPts, timelinePts, delayPenalty };
  }, [totalTasks, completionRate, timelinessData, completedTasks, delayedTasks]);

  // === DAILY AVERAGE ===
  const dailyAverage = useMemo(() => {
    if (completedTasks === 0) return 0;
    let rangeDays = 7;
    if (timeRange === 'month') rangeDays = endOfMonth(today).getDate();
    else if (timeRange === 'year') rangeDays = 365;
    else if (timeRange === 'alltime') rangeDays = Math.max(1, differenceInDays(today, tasks.length > 0 ? new Date(Math.min(...tasks.map(t => new Date(t.createdAt || t.dueDate).getTime()))) : today) + 1);
    else if (timeRange === 'custom') rangeDays = Math.max(1, differenceInDays(new Date(customTo), new Date(customFrom)) + 1);
    return (completedTasks / rangeDays).toFixed(1);
  }, [completedTasks, timeRange, today, tasks, customFrom, customTo]);

  const scoreClass = productivityScore.score >= 80 ? 'score-excellent' : productivityScore.score >= 60 ? 'score-good' : productivityScore.score >= 40 ? 'score-average' : 'score-poor';

  const rangeLabel = timeRange === '7days' ? 'Last 7 Days' : timeRange === 'month' ? 'This Month' : timeRange === 'year' ? 'This Year' : timeRange === 'alltime' ? 'All Time' : `${customFrom} to ${customTo}`;

  return (
    <div className="dashboard-container">
      {/* Filter Bar */}
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h2 style={{ fontSize: '1.1rem' }}>Productivity Overview</h2>
        <div className="dashboard-filter-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--glass-bg)', padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
            <CalendarIcon size={14} style={{ color: 'var(--text-muted)' }} />
            <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}
              style={{ border: 'none', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer', fontSize: '0.82rem' }}>
              <option value="7days">Last 7 Days</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="alltime">All Time (Till Today)</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          {timeRange === 'custom' && (
            <div className="custom-date-range">
              <label>From</label>
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} />
              <label>To</label>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} />
            </div>
          )}
        </div>
      </div>

      {/* Status Summary */}
      <div className="stats-grid">
        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)'}}>
            <ListChecks size={18} />
          </div>
          <div className="stat-content">
            <h3>Total Tasks</h3>
            <div className="stat-value">{totalTasks}</div>
            <p className="text-muted">{rangeLabel}</p>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-success)'}}>
            <CheckCircle size={18} />
          </div>
          <div className="stat-content">
            <h3>Completed</h3>
            <div className="stat-value">{completedTasks}</div>
            <p className="text-muted">{completionRate}% rate</p>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{background: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-warning)'}}>
            <Clock size={18} />
          </div>
          <div className="stat-content">
            <h3>Pending</h3>
            <div className="stat-value">{pendingTasks.length}</div>
            <p className="text-muted">Awaiting completion</p>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-danger)'}}>
            <AlertCircle size={18} />
          </div>
          <div className="stat-content">
            <h3>Delayed</h3>
            <div className="stat-value">{delayedTasks.length}</div>
            <p className="text-muted">Overdue / Delayed</p>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6'}}>
            <Zap size={18} />
          </div>
          <div className="stat-content">
            <h3>Daily Avg</h3>
            <div className="stat-value">{dailyAverage}</div>
            <p className="text-muted">Tasks/day</p>
          </div>
        </div>
      </div>

      {/* Delayed Tasks Detail (if any) */}
      {delayedTasks.length > 0 && (
        <div className="chart-card glass-panel">
          <h3 style={{ color: 'var(--accent-danger)' }}>⚠ Delayed / Overdue Tasks ({delayedTasks.length})</h3>
          <div className="category-table-wrapper">
            <table className="category-table">
              <thead>
                <tr><th>Task</th><th>Category</th><th>Priority</th><th>Delayed By</th></tr>
              </thead>
              <tbody>
                {delayedTasks.map(t => {
                  const overdueDays = t.delayedDays > 0 ? t.delayedDays : Math.max(1, differenceInDays(today, startOfDay(new Date(t.dueDate))));
                  return (
                    <tr key={t.id}>
                      <td>{t.title}</td>
                      <td>{t.category}</td>
                      <td style={{ textTransform: 'capitalize' }}>{t.priority}</td>
                      <td className="rate-bad">{overdueDays} {overdueDays === 1 ? 'day' : 'days'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Productivity Score + Category Table Row */}
      <div className="charts-grid">
        <div className="chart-card glass-panel">
          <h3>Productivity Score</h3>
          <div className="productivity-score-section">
            <div className={`score-circle ${scoreClass}`}>
              {productivityScore.score}
              <span className="score-label">Score</span>
            </div>
            <div className="score-breakdown">
              <div className="score-detail"><span>Completion (60%)</span><span>+{productivityScore.completionPts}</span></div>
              <div className="score-detail"><span>On-Time (30%)</span><span>+{productivityScore.timelinePts}</span></div>
              <div className="score-detail"><span>Delay Penalty</span><span style={{color: 'var(--accent-danger)'}}>-{productivityScore.delayPenalty}</span></div>
              <div className="score-detail" style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '0.3rem', marginTop: '0.2rem' }}>
                <span style={{ fontWeight: 600 }}>Final Score</span>
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>{productivityScore.score}/100</span>
              </div>
            </div>
            <div className="score-stats-grid">
              <div className="score-stat-item">
                <span className="score-stat-value">{totalTasks}</span>
                <span className="score-stat-label">Total</span>
              </div>
              <div className="score-stat-item">
                <span className="score-stat-value" style={{color: 'var(--accent-success)'}}>{completedTasks}</span>
                <span className="score-stat-label">Completed</span>
              </div>
              <div className="score-stat-item">
                <span className="score-stat-value" style={{color: '#10b981'}}>{timelinessData[0]?.value || 0}</span>
                <span className="score-stat-label">On-Time</span>
              </div>
              <div className="score-stat-item">
                <span className="score-stat-value" style={{color: 'var(--accent-danger)'}}>{timelinessData[1]?.value || 0}</span>
                <span className="score-stat-label">Late</span>
              </div>
              <div className="score-stat-item">
                <span className="score-stat-value" style={{color: 'var(--accent-warning)'}}>{pendingTasks.length}</span>
                <span className="score-stat-label">Pending</span>
              </div>
              <div className="score-stat-item">
                <span className="score-stat-value" style={{color: '#ef4444'}}>{delayedTasks.length}</span>
                <span className="score-stat-label">Delayed</span>
              </div>
            </div>
          </div>
        </div>

        <div className="chart-card glass-panel">
          <h3>Category Completion</h3>
          <div className="category-table-wrapper">
            <table className="category-table">
              <thead>
                <tr><th>Category</th><th>Total</th><th>Done</th><th>Pending</th><th>Delayed</th><th>Rate</th></tr>
              </thead>
              <tbody>
                {categoryTableData.map(c => (
                  <tr key={c.name}>
                    <td>{c.name}</td>
                    <td>{c.total}</td>
                    <td style={{color: 'var(--accent-success)'}}>{c.completed}</td>
                    <td style={{color: 'var(--accent-warning)'}}>{c.pending}</td>
                    <td style={{color: 'var(--accent-danger)'}}>{c.delayed}</td>
                    <td className={`rate-cell ${c.rate >= 70 ? 'rate-good' : c.rate >= 40 ? 'rate-ok' : 'rate-bad'}`}>{c.rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        {/* Activity Trend */}
        <div className="chart-card glass-panel full-width">
          <h3>Activity Trend ({rangeLabel})</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" tick={{fontSize: 11}} />
                <YAxis stroke="var(--text-muted)" tick={{fontSize: 11}} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--glass-border)', borderRadius: '8px', fontSize: '0.8rem' }} />
                <Line type="monotone" dataKey="completed" name="Completed" stroke="var(--accent-success)" strokeWidth={2} dot={{r: 3}} />
                <Line type="monotone" dataKey="added" name="Scheduled" stroke="var(--accent-primary)" strokeWidth={2} dot={{r: 3}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="chart-card glass-panel">
          <h3>Priority Breakdown</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" tick={{fontSize: 11}} />
                <YAxis stroke="var(--text-muted)" tick={{fontSize: 11}} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--glass-border)', borderRadius: '8px', fontSize: '0.8rem' }} />
                <Bar dataKey="completed" name="Completed" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                <Bar dataKey="incomplete" name="Incomplete" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Pie */}
        <div className="chart-card glass-panel">
          <h3>Categories ({rangeLabel})</h3>
          <div className="chart-wrapper">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                    {categoryData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--glass-border)', borderRadius: '8px', fontSize: '0.8rem' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (<div className="empty-chart">No tasks in this period</div>)}
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

        {/* Timeliness */}
        <div className="chart-card glass-panel">
          <h3>Completion Timeliness</h3>
          <div className="chart-wrapper">
            {timelinessData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={timelinessData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                    {timelinessData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--glass-border)', borderRadius: '8px', fontSize: '0.8rem' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (<div className="empty-chart">No completed tasks</div>)}
            <div className="chart-legend">
              {timelinessData.map(c => (
                <div key={c.name} className="legend-item">
                  <span className="legend-color" style={{backgroundColor: c.color}}></span>
                  <span className="legend-label">{c.name} ({c.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Avg Delay by Category */}
        <div className="chart-card glass-panel">
          <h3>Avg Delay by Category (Days)</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryDelayData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" stroke="var(--text-muted)" tick={{fontSize: 11}} />
                <YAxis dataKey="name" type="category" stroke="var(--text-muted)" width={70} tick={{fontSize: 11}} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--glass-border)', borderRadius: '8px', fontSize: '0.8rem' }} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                <Bar dataKey="avgDelay" name="Avg Delay" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductivityDashboard;
