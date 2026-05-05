import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
// We'll create these pages soon
import CalendarPage from './pages/CalendarPage';
import DashboardPage from './pages/DashboardPage';
import useTaskStore from './store/taskStore';
import { useEffect } from 'react';

function App() {
  const carryForwardTasks = useTaskStore((state) => state.carryForwardTasks);
  const initFirebase = useTaskStore((state) => state.initFirebase);

  useEffect(() => {
    initFirebase();
    // Automatically carry forward past incomplete tasks to today when app loads
    carryForwardTasks();
  }, [carryForwardTasks, initFirebase]);

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="*" element={<Navigate to="/calendar" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
