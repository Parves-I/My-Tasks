import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { isBefore, startOfDay, isSameDay, eachDayOfInterval, format } from 'date-fns';
import { db } from '../firebase';
import { doc, setDoc, deleteDoc, updateDoc, collection, writeBatch, onSnapshot } from 'firebase/firestore';

const useTaskStore = create(
  persist(
    (set, get) => ({
      tasks: [],
      categories: ['Work', 'Personal', 'Health', 'Learning', 'Errands'],
      selectedTasks: [], // For bulk operations
      searchQuery: '',
      isFirebaseInitialized: false,

      setSearchQuery: (query) => set({ searchQuery: query }),

      initFirebase: () => {
        if (get().isFirebaseInitialized) return;
        const tasksCol = collection(db, 'tasks');
        onSnapshot(tasksCol, (snapshot) => {
          const tasksData = snapshot.docs.map(doc => doc.data());
          set({ tasks: tasksData, isFirebaseInitialized: true });
        }, (error) => {
          console.error("Firebase sync error:", error);
        });
      },

      // Core Actions
      addTask: async (taskData) => {
        const newTask = {
          id: uuidv4(),
          title: taskData.title || 'New Task',
          description: taskData.description || '',
          status: taskData.status || 'todo',
          priority: taskData.priority || 'medium',
          category: taskData.category || 'Personal',
          tags: taskData.tags || [],
          startDate: taskData.startDate || new Date().toISOString(),
          dueDate: taskData.dueDate || new Date().toISOString(),
          estimatedMinutes: taskData.estimatedMinutes || 30,
          subtasks: taskData.subtasks || [],
          createdAt: new Date().toISOString(),
          isMultiDay: taskData.isMultiDay || false,
          completedDates: taskData.completedDates || [],
          completedAt: taskData.status === 'done' ? new Date().toISOString() : null,
          delayedDays: 0,
          actions: taskData.actions || [],
        };
        
        
        if (isBefore(new Date(newTask.dueDate), new Date(newTask.startDate))) {
          newTask.dueDate = newTask.startDate;
        }

        // Optimistic UI update
        set((state) => ({ tasks: [...state.tasks, newTask] }));
        
        try {
          await setDoc(doc(db, 'tasks', newTask.id), newTask);
        } catch (e) {
          console.error("Failed to sync new task to Firebase", e);
        }
      },

      updateTask: async (id, updates) => {
        if (updates.startDate || updates.dueDate) {
          const task = get().tasks.find(t => t.id === id);
          if (task) {
            const start = updates.startDate || task.startDate;
            const due = updates.dueDate || task.dueDate;
            if (isBefore(new Date(due), new Date(start))) {
              updates.dueDate = start;
            }
          }
        }

        if (updates.status !== undefined) {
          if (updates.status === 'done') {
            updates.completedAt = new Date().toISOString();
          } else {
            updates.completedAt = null;
          }
        }

        set((state) => ({
          tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
        }));

        try {
          await updateDoc(doc(db, 'tasks', id), updates);
        } catch (e) {
          console.error("Failed to sync task update to Firebase", e);
        }
      },

      addTaskAction: async (taskId, text) => {
        const task = get().tasks.find(t => t.id === taskId);
        if (!task) return;

        const newAction = {
          id: uuidv4(),
          text,
          timestamp: new Date().toISOString()
        };

        const updatedActions = [...(task.actions || []), newAction];
        
        set((state) => ({
          tasks: state.tasks.map(t => t.id === taskId ? { ...t, actions: updatedActions } : t)
        }));

        try {
          await updateDoc(doc(db, 'tasks', taskId), { actions: updatedActions });
        } catch (e) {
          console.error("Failed to add task action to Firebase", e);
        }
      },

      deleteTaskAction: async (taskId, actionId) => {
        const task = get().tasks.find(t => t.id === taskId);
        if (!task) return;

        const updatedActions = (task.actions || []).filter(a => a.id !== actionId);
        
        set((state) => ({
          tasks: state.tasks.map(t => t.id === taskId ? { ...t, actions: updatedActions } : t)
        }));

        try {
          await updateDoc(doc(db, 'tasks', taskId), { actions: updatedActions });
        } catch (e) {
          console.error("Failed to delete task action from Firebase", e);
        }
      },
      
      toggleTaskDayStatus: async (taskId, date) => {
        const task = get().tasks.find(t => t.id === taskId);
        if (!task) return;

        const dateStr = format(date, 'yyyy-MM-dd');
        let newStatus = task.status;
        let newCompletedDates = [...(task.completedDates || [])];

        const isMultiDay = task.isMultiDay || new Date(task.startDate).toDateString() !== new Date(task.dueDate).toDateString();

        if (!isMultiDay) {
          // Single day task
          newStatus = task.status === 'done' ? 'todo' : 'done';
        } else {
          // Multi day task
          const isFinalDay = isSameDay(date, new Date(task.dueDate));
          
          if (isFinalDay && task.status !== 'done' && !newCompletedDates.includes(dateStr)) {
            // Marking on final day auto-completes all days
            const allDays = eachDayOfInterval({ start: new Date(task.startDate), end: new Date(task.dueDate) })
              .map(d => format(d, 'yyyy-MM-dd'));
            newCompletedDates = allDays;
            newStatus = 'done';
          } else {
            // Toggle specific day (or uncheck final day if it was done)
            if (newCompletedDates.includes(dateStr) || (isFinalDay && task.status === 'done')) {
              newCompletedDates = newCompletedDates.filter(d => d !== dateStr);
            } else {
              newCompletedDates.push(dateStr);
            }
            
            if (newCompletedDates.length > 0) {
              newStatus = 'partially-completed';
            } else {
              newStatus = 'todo';
            }
          }
        }

        const updates = { status: newStatus, completedDates: newCompletedDates };
        
        if (newStatus === 'done') {
          updates.completedAt = new Date().toISOString();
        } else {
          updates.completedAt = null;
        }
        
        // Optimistic UI update
        set((state) => ({
          tasks: state.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
        }));

        try {
          await updateDoc(doc(db, 'tasks', taskId), updates);
        } catch (e) {
          console.error("Failed to sync task toggle to Firebase", e);
        }
      },

      deleteTask: async (id) => {
        set((state) => ({
          tasks: state.tasks.filter(t => t.id !== id),
          selectedTasks: state.selectedTasks.filter(tid => tid !== id)
        }));

        try {
          await deleteDoc(doc(db, 'tasks', id));
        } catch (e) {
          console.error("Failed to delete task from Firebase", e);
        }
      },

      // Bulk Operations
      toggleTaskSelection: (id) => set((state) => ({
        selectedTasks: state.selectedTasks.includes(id) 
          ? state.selectedTasks.filter(tid => tid !== id)
          : [...state.selectedTasks, id]
      })),

      clearSelection: () => set({ selectedTasks: [] }),

      bulkDelete: async () => {
        const selected = get().selectedTasks;
        set((state) => ({
          tasks: state.tasks.filter(t => !state.selectedTasks.includes(t.id)),
          selectedTasks: []
        }));

        try {
          const batch = writeBatch(db);
          selected.forEach(id => {
            batch.delete(doc(db, 'tasks', id));
          });
          await batch.commit();
        } catch (e) {
          console.error("Failed to bulk delete from Firebase", e);
        }
      },

      bulkUpdate: async (updates) => {
        const selected = get().selectedTasks;
        set((state) => ({
          tasks: state.tasks.map(t => state.selectedTasks.includes(t.id) ? { ...t, ...updates } : t),
          selectedTasks: []
        }));

        try {
          const batch = writeBatch(db);
          selected.forEach(id => {
            batch.update(doc(db, 'tasks', id), updates);
          });
          await batch.commit();
        } catch (e) {
          console.error("Failed to bulk update in Firebase", e);
        }
      },

      // Carry Forward Logic
      carryForwardTasks: async () => {
        const now = new Date();
        const today = startOfDay(now).toISOString();
        const sixAMToday = new Date(now);
        sixAMToday.setHours(6, 0, 0, 0);

        // Only process carry forward if current time is past 6 AM
        if (isBefore(now, sixAMToday)) {
            return; // Not 6AM yet, do nothing
        }

        const tasksToUpdate = [];
        
        const updatedTasks = get().tasks.map(task => {
          if (task.status !== 'done' && isBefore(new Date(task.dueDate), new Date(today))) {
            const currentDelayedDays = task.delayedDays || 0;
            const updatedTask = {
              ...task,
              dueDate: today,
              delayedDays: currentDelayedDays + 1,
              wasCarriedForward: true
            };
            tasksToUpdate.push(updatedTask);
            return updatedTask;
          }
          return task;
        });

        set({ tasks: updatedTasks });

        try {
          if (tasksToUpdate.length > 0) {
            const batch = writeBatch(db);
            tasksToUpdate.forEach(t => {
              batch.update(doc(db, 'tasks', t.id), {
                dueDate: t.dueDate,
                delayedDays: t.delayedDays,
                wasCarriedForward: t.wasCarriedForward
              });
            });
            await batch.commit();
          }
        } catch (e) {
          console.error("Failed to carry forward tasks in Firebase", e);
        }
      },

      // Category Management
      addCategory: (cat) => set((state) => {
        if(!state.categories.includes(cat)) {
          return { categories: [...state.categories, cat] };
        }
        return state;
      }),
      
      removeCategory: (cat) => set((state) => ({
        categories: state.categories.filter(c => c !== cat)
      })),

      // Data Management
      clearAllTasks: async () => {
        const tasks = get().tasks;
        set({ tasks: [], selectedTasks: [] });

        try {
          const batch = writeBatch(db);
          tasks.forEach(t => {
            batch.delete(doc(db, 'tasks', t.id));
          });
          await batch.commit();
        } catch (e) {
          console.error("Failed to clear tasks from Firebase", e);
        }
      }
    }),
    {
      name: 'task-storage', // Save state to localStorage
      partialize: (state) => ({ categories: state.categories }), // we only want to persist categories locally, tasks come from Firebase
    }
  )
);

export default useTaskStore;
