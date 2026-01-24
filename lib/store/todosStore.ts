import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Todo } from '@/lib/types';
import { apiRequest } from '@/lib/utils/api';
import { errorHandler } from '@/lib/utils/errorHandling';
import { isSupabaseConfigured } from '@/lib/supabase/client';

interface TodosState {
  todos: Todo[];
  isLoading: boolean;
  hasLoaded: boolean;
  loadTodos: () => Promise<void>;
  addTodo: (todo: Omit<Todo, 'id' | 'createdAt' | 'completed'>) => Promise<Todo | null>;
  removeTodo: (id: string) => Promise<void>;
  updateTodo: (id: string, todo: Partial<Todo>) => Promise<Todo | null>;
  toggleComplete: (id: string) => Promise<void>;
  reorderTodos: (todos: Todo[]) => void;
  getCompletedToday: () => Todo[];
  getPendingTodos: () => Todo[];
  clearTodos: () => void;
}

const normalizeTodo = (todo: Todo): Todo => ({
  ...todo,
  createdAt: todo.createdAt instanceof Date ? todo.createdAt : new Date(todo.createdAt),
  dueDate: todo.dueDate
    ? todo.dueDate instanceof Date
      ? todo.dueDate
      : new Date(todo.dueDate)
    : undefined,
  completedAt: todo.completedAt
    ? todo.completedAt instanceof Date
      ? todo.completedAt
      : new Date(todo.completedAt)
    : undefined,
});

// Helper to validate UUIDs
const isValidUUID = (id: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

const shouldSyncTodos = async (): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;
  try {
    const data = await apiRequest<{ user?: { id?: string } }>('/api/auth/user', { noRetry: true });
    return Boolean(data?.user?.id);
  } catch {
    return false;
  }
};

export const useTodosStore = create<TodosState>()(
  persist(
    (set, get) => ({
      todos: [],
      isLoading: false,
      hasLoaded: false,

      loadTodos: async () => {
        if (get().hasLoaded) return;
        set({ isLoading: true });
        try {
          const data = await apiRequest<Todo[]>('/api/todos', { noRetry: true });
          const validData = data.map(normalizeTodo).filter((t) => {
            if (!isValidUUID(t.id)) {
              console.warn(`Filtered out invalid todo ID from API: ${t.id}`);
              return false;
            }
            return true;
          });

          set({ todos: validData, hasLoaded: true });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          const isAuthError =
            errorMessage.includes('401') ||
            errorMessage.includes('authentication') ||
            errorMessage.includes('Unauthorized');

          const isTableMissing =
            errorMessage.includes('schema cache') ||
            errorMessage.includes('todos table') ||
            errorMessage.includes('42P01');

          if (isAuthError) {
            // Auth failure: clear persisted data to prevent showing stale user data
            set({ todos: [], hasLoaded: true });
          } else if (isTableMissing) {
            // Table missing: log helpful message but continue with local data
            console.warn(
              'Todos table not found in database. To enable cloud sync, run: npx supabase db push'
            );
            set({ hasLoaded: true });
          } else {
            console.warn('Failed to load todos from API:', error);
            set({ hasLoaded: true });
          }
        } finally {
          set({ isLoading: false });
        }
      },

      addTodo: async (todoData) => {
        const todo: Todo = {
          ...todoData,
          id: uuidv4(),
          completed: false,
          createdAt: new Date(),
        };

        const normalized = normalizeTodo(todo);
        set((state) => ({
          todos: [normalized, ...state.todos], // New todos at top
        }));

        try {
          const canSync = await shouldSyncTodos();
          if (!canSync) {
            return normalized;
          }

          const created = await apiRequest<Todo>('/api/todos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(normalized),
          });
          const serverNormalized = normalizeTodo(created);
          set((state) => ({
            todos: state.todos.map((t) => (t.id === normalized.id ? serverNormalized : t)),
          }));
          return serverNormalized;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          // Silently handle auth errors, CSRF errors, network issues, and missing table - local-first approach
          const isExpectedError =
            errorMessage.includes('authentication') ||
            errorMessage.includes('unauthorized') ||
            errorMessage.includes('CSRF') ||
            errorMessage.includes('403') ||
            errorMessage.includes('401') ||
            errorMessage.includes('NetworkError') ||
            errorMessage.includes('Failed to fetch') ||
            errorMessage.includes('schema cache') ||
            errorMessage.includes('table') ||
            errorMessage.includes('500');

          if (!isExpectedError) {
            errorHandler.logError(
              error instanceof Error ? error : new Error('Failed to add todo'),
              'TodosStore.addTodo',
              'medium',
            );
          }
          // Return the local todo - it's already saved locally
          return normalized;
        }
      },

      removeTodo: async (id) => {
        if (!isValidUUID(id)) {
          console.warn(`Removing invalid ID locally only: ${id}`);
          set((state) => ({
            todos: state.todos.filter((t) => t.id !== id),
          }));
          return;
        }

        const todoToRemove = get().todos.find((t) => t.id === id);
        set((state) => ({
          todos: state.todos.filter((t) => t.id !== id),
        }));

        try {
          const canSync = await shouldSyncTodos();
          if (!canSync) {
            return;
          }

          await apiRequest<{ id: string }>(`/api/todos/${id}`, { method: 'DELETE' });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          // Silently handle auth errors, CSRF errors, network issues, and missing table - local-first approach
          const isExpectedError =
            errorMessage.includes('authentication') ||
            errorMessage.includes('unauthorized') ||
            errorMessage.includes('CSRF') ||
            errorMessage.includes('403') ||
            errorMessage.includes('401') ||
            errorMessage.includes('404') || // Already deleted on server
            errorMessage.includes('NetworkError') ||
            errorMessage.includes('Failed to fetch') ||
            errorMessage.includes('schema cache') ||
            errorMessage.includes('table') ||
            errorMessage.includes('500');

          if (!isExpectedError) {
            // Only restore if it's an unexpected error
            if (todoToRemove) {
              set((state) => ({ todos: [...state.todos, todoToRemove] }));
            }
            errorHandler.logError(
              error instanceof Error ? error : new Error(`Failed to remove todo ${id}`),
              'TodosStore.removeTodo',
              'high',
            );
          }
          // For expected errors (CSRF, auth, etc.), keep the local deletion
        }
      },

      updateTodo: async (id, updatedTodo) => {
        const currentTodo = get().todos.find((t) => t.id === id);
        if (!currentTodo) return null;

        if (!isValidUUID(id)) {
          console.warn(`Updating non-UUID todo locally only: ${id}`);
          const localUpdate = { ...currentTodo, ...updatedTodo };
          set((state) => ({
            todos: state.todos.map((t) => (t.id === id ? localUpdate : t)),
          }));
          return localUpdate;
        }

        const optimisticUpdate = { ...currentTodo, ...updatedTodo };
        set((state) => ({
          todos: state.todos.map((t) => (t.id === id ? optimisticUpdate : t)),
        }));

        try {
          const canSync = await shouldSyncTodos();
          if (!canSync) {
            return optimisticUpdate;
          }

          const updated = await apiRequest<Todo>(`/api/todos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedTodo),
          });
          const normalized = normalizeTodo(updated);
          set((state) => ({
            todos: state.todos.map((t) => (t.id === id ? normalized : t)),
          }));
          return normalized;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);

          if (errorMessage.includes('404') || errorMessage.includes('not found')) {
            console.warn(`Todo ${id} not found on server, attempting to create it...`);
            const fullTodo = { ...currentTodo, ...updatedTodo };
            return get().addTodo(fullTodo);
          }

          // Silently handle auth errors, CSRF errors, network issues, and missing table - local-first approach
          const isExpectedError =
            errorMessage.includes('authentication') ||
            errorMessage.includes('unauthorized') ||
            errorMessage.includes('CSRF') ||
            errorMessage.includes('403') ||
            errorMessage.includes('401') ||
            errorMessage.includes('NetworkError') ||
            errorMessage.includes('Failed to fetch') ||
            errorMessage.includes('schema cache') ||
            errorMessage.includes('table') ||
            errorMessage.includes('500');

          if (!isExpectedError) {
            set((state) => ({
              todos: state.todos.map((t) => (t.id === id ? currentTodo : t)),
            }));
            errorHandler.logError(
              error instanceof Error ? error : new Error(`Failed to update todo ${id}`),
              'TodosStore.updateTodo',
              'high',
            );
            return null;
          }

          // For expected errors (CSRF, auth, etc.), keep the local update
          return optimisticUpdate;
        }
      },

      toggleComplete: async (id) => {
        const existing = get().todos.find((todo) => todo.id === id);
        if (!existing) return;
        await get().updateTodo(id, {
          completed: !existing.completed,
          completedAt: !existing.completed ? new Date() : undefined,
        });
      },

      reorderTodos: (todos) => {
        set({ todos });
      },

      getCompletedToday: () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return get().todos.filter((t) => {
          if (!t.completed || !t.completedAt) return false;
          const completedDate = new Date(t.completedAt);
          completedDate.setHours(0, 0, 0, 0);
          return completedDate.getTime() === today.getTime();
        });
      },

      getPendingTodos: () => {
        return get()
          .todos.filter((t) => !t.completed)
          .sort((a, b) => {
            // Sort by priority, then by creation date
            const priorityOrder = { High: 0, Medium: 1, Low: 2 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
              return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          });
      },

      clearTodos: () => {
        set({ todos: [], hasLoaded: false, isLoading: false });
      },
    }),
    {
      name: 'todos-storage',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
