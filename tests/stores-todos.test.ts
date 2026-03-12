/**
 * Todos Store Tests
 * Tests the todosStore CRUD operations, filtering, sorting, and edge cases
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTodosStore } from '@/lib/store/todosStore';
import { Todo } from '@/lib/types';

vi.mock('@/lib/utils/api', () => ({
  apiRequest: vi.fn().mockRejectedValue(new Error('401: authentication required')),
}));

vi.mock('@/lib/supabase/client', () => ({
  isSupabaseConfigured: () => false,
  createBrowserClient: () => ({}),
}));

vi.mock('@/lib/supabase/browserSession', () => ({
  getBrowserAuthSnapshot: vi.fn().mockResolvedValue({ user: null }),
}));

vi.mock('@/lib/utils/errorHandling', () => ({
  errorHandler: {
    logError: vi.fn(),
  },
}));

const makeTodo = (overrides: Partial<Todo> = {}): Omit<Todo, 'id' | 'createdAt' | 'completed'> => ({
  title: 'Test Todo',
  priority: 'Medium' as const,
  ...overrides,
});

describe('todosStore', () => {
  beforeEach(() => {
    useTodosStore.setState({
      todos: [],
      isLoading: false,
      hasLoaded: false,
    });
  });

  it('should initialize with empty state', () => {
    const state = useTodosStore.getState();
    expect(state.todos).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.hasLoaded).toBe(false);
  });

  it('should add a todo locally', async () => {
    const { addTodo } = useTodosStore.getState();
    const result = await addTodo(makeTodo({ title: 'Buy groceries' }));

    expect(result).not.toBeNull();
    expect(result!.title).toBe('Buy groceries');
    expect(result!.completed).toBe(false);

    const { todos } = useTodosStore.getState();
    expect(todos).toHaveLength(1);
    expect(todos[0].id).toBeDefined();
  });

  it('should remove a todo', async () => {
    const { addTodo } = useTodosStore.getState();
    const todo = await addTodo(makeTodo());

    expect(useTodosStore.getState().todos).toHaveLength(1);

    await useTodosStore.getState().removeTodo(todo!.id);
    expect(useTodosStore.getState().todos).toHaveLength(0);
  });

  it('should remove a todo with invalid UUID locally', async () => {
    const fakeTodo: Todo = {
      id: 'not-a-uuid',
      title: 'Fake',
      priority: 'Low',
      completed: false,
      createdAt: new Date(),
    };
    useTodosStore.setState({ todos: [fakeTodo] });

    await useTodosStore.getState().removeTodo('not-a-uuid');
    expect(useTodosStore.getState().todos).toHaveLength(0);
  });

  it('should update a todo', async () => {
    const { addTodo } = useTodosStore.getState();
    const todo = await addTodo(makeTodo());

    const updated = await useTodosStore.getState().updateTodo(todo!.id, { title: 'Updated' });
    expect(updated).not.toBeNull();
    expect(updated!.title).toBe('Updated');

    const { todos } = useTodosStore.getState();
    expect(todos[0].title).toBe('Updated');
  });

  it('should return null when updating non-existent todo', async () => {
    const result = await useTodosStore.getState().updateTodo('nonexistent-id', { title: 'X' });
    expect(result).toBeNull();
  });

  it('should update a non-UUID todo locally', async () => {
    const fakeTodo: Todo = {
      id: 'local-only',
      title: 'Local',
      priority: 'Low',
      completed: false,
      createdAt: new Date(),
    };
    useTodosStore.setState({ todos: [fakeTodo] });

    const result = await useTodosStore
      .getState()
      .updateTodo('local-only', { title: 'Updated Local' });
    expect(result).not.toBeNull();
    expect(result!.title).toBe('Updated Local');
  });

  it('should toggle completion', async () => {
    const { addTodo } = useTodosStore.getState();
    const todo = await addTodo(makeTodo());
    expect(todo!.completed).toBe(false);

    await useTodosStore.getState().toggleComplete(todo!.id);
    const toggled = useTodosStore.getState().todos[0];
    expect(toggled.completed).toBe(true);
    expect(toggled.completedAt).toBeDefined();
  });

  it('should toggle notification', async () => {
    const { addTodo } = useTodosStore.getState();
    const todo = await addTodo(makeTodo());

    await useTodosStore.getState().toggleNotification(todo!.id);
    expect(useTodosStore.getState().todos[0].notificationEnabled).toBe(true);
  });

  it('should reorder todos', async () => {
    const todo1: Todo = {
      id: '1',
      title: 'A',
      priority: 'Low',
      completed: false,
      createdAt: new Date(),
    };
    const todo2: Todo = {
      id: '2',
      title: 'B',
      priority: 'High',
      completed: false,
      createdAt: new Date(),
    };
    useTodosStore.setState({ todos: [todo1, todo2] });

    useTodosStore.getState().reorderTodos([todo2, todo1]);
    const { todos } = useTodosStore.getState();
    expect(todos[0].id).toBe('2');
    expect(todos[1].id).toBe('1');
  });

  it('should get completed today', async () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const completedToday: Todo = {
      id: '1',
      title: 'Done today',
      priority: 'Low',
      completed: true,
      completedAt: today,
      createdAt: new Date(),
    };
    const completedYesterday: Todo = {
      id: '2',
      title: 'Done yesterday',
      priority: 'Low',
      completed: true,
      completedAt: yesterday,
      createdAt: new Date(),
    };
    const notCompleted: Todo = {
      id: '3',
      title: 'Not done',
      priority: 'Low',
      completed: false,
      createdAt: new Date(),
    };

    useTodosStore.setState({ todos: [completedToday, completedYesterday, notCompleted] });

    const result = useTodosStore.getState().getCompletedToday();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('should get pending todos sorted by overdue, due date, priority, created', () => {
    const now = new Date();
    const pastDate = new Date(now.getTime() - 86400000);
    const futureDate = new Date(now.getTime() + 86400000 * 2);
    const farFuture = new Date(now.getTime() + 86400000 * 5);

    const overdue: Todo = {
      id: '1',
      title: 'Overdue',
      priority: 'Low',
      completed: false,
      dueDate: pastDate,
      createdAt: new Date(),
    };
    const soonHigh: Todo = {
      id: '2',
      title: 'Soon High',
      priority: 'High',
      completed: false,
      dueDate: futureDate,
      createdAt: new Date(),
    };
    const laterMed: Todo = {
      id: '3',
      title: 'Later Med',
      priority: 'Medium',
      completed: false,
      dueDate: farFuture,
      createdAt: new Date(),
    };
    const noDueHigh: Todo = {
      id: '4',
      title: 'No due high',
      priority: 'High',
      completed: false,
      createdAt: new Date(),
    };
    const completed: Todo = {
      id: '5',
      title: 'Done',
      priority: 'High',
      completed: true,
      dueDate: pastDate,
      createdAt: new Date(),
    };

    useTodosStore.setState({ todos: [laterMed, completed, noDueHigh, overdue, soonHigh] });

    const pending = useTodosStore.getState().getPendingTodos();
    expect(pending).toHaveLength(4); // excludes completed
    expect(pending[0].id).toBe('1'); // overdue first
  });

  it('should clear todos', () => {
    useTodosStore.setState({
      todos: [{ id: '1', title: 'X', priority: 'Low', completed: false, createdAt: new Date() }],
      hasLoaded: true,
    });

    useTodosStore.getState().clearTodos();
    const state = useTodosStore.getState();
    expect(state.todos).toHaveLength(0);
    expect(state.hasLoaded).toBe(false);
  });

  it('should reset store', () => {
    useTodosStore.setState({
      todos: [{ id: '1', title: 'X', priority: 'Low', completed: false, createdAt: new Date() }],
      hasLoaded: true,
      isLoading: true,
    });

    useTodosStore.getState().reset();
    const state = useTodosStore.getState();
    expect(state.todos).toHaveLength(0);
    expect(state.hasLoaded).toBe(false);
    expect(state.isLoading).toBe(false);
  });

  it('toggleComplete does nothing for non-existent id', async () => {
    await useTodosStore.getState().toggleComplete('nonexistent');
    expect(useTodosStore.getState().todos).toHaveLength(0);
  });

  it('toggleNotification does nothing for non-existent id', async () => {
    await useTodosStore.getState().toggleNotification('nonexistent');
    expect(useTodosStore.getState().todos).toHaveLength(0);
  });
});
