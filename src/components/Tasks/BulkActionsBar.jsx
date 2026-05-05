import React from 'react';
import { Trash2, CheckCircle, XCircle } from 'lucide-react';
import useTaskStore from '../../store/taskStore';
import './Tasks.css';

const BulkActionsBar = () => {
  const selectedTasks = useTaskStore(state => state.selectedTasks);
  const clearSelection = useTaskStore(state => state.clearSelection);
  const bulkDelete = useTaskStore(state => state.bulkDelete);
  const bulkUpdate = useTaskStore(state => state.bulkUpdate);

  if (selectedTasks.length === 0) return null;

  return (
    <div className="bulk-actions-bar glass-panel">
      <div className="selection-info">
        <span className="selection-count">{selectedTasks.length}</span> tasks selected
      </div>
      
      <div className="bulk-actions">
        <button className="btn-secondary" onClick={() => bulkUpdate({ status: 'done' })}>
          <CheckCircle size={16} /> Mark Done
        </button>
        <button className="btn-danger" onClick={bulkDelete}>
          <Trash2 size={16} /> Delete
        </button>
      </div>
      
      <button className="close-bulk-btn" onClick={clearSelection}>
        <XCircle size={20} />
      </button>
    </div>
  );
};

export default BulkActionsBar;
