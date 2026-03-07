import { useState, useCallback } from 'react';
import { Deadline, Event, Unit, Todo } from '@/lib/types';
import dayjs from 'dayjs';

export function useCalendarDialogs() {
  // Dialog states
  const [deadlineDialogOpen, setDeadlineDialogOpen] = useState(false);
  const [editDeadline, setEditDeadline] = useState<Deadline | null>(null);

  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [editAssignment, setEditAssignment] = useState<Deadline | null>(null);

  const [examDialogOpen, setExamDialogOpen] = useState(false);
  const [editExam, setEditExam] = useState<Deadline | null>(null);

  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<Event | null>(null);

  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

  // Todo dialog state
  const [todoDialogOpen, setTodoDialogOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [editTodoTitle, setEditTodoTitle] = useState('');
  const [editTodoPriority, setEditTodoPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [editTodoDueDate, setEditTodoDueDate] = useState('');
  const [editTodoDueTime, setEditTodoDueTime] = useState('');
  const [editTodoColor, setEditTodoColor] = useState<string>('#10b981');

  // Detail panel states
  const [unitDetailOpen, setUnitDetailOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

  const [assignmentDetailOpen, setAssignmentDetailOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Deadline | null>(null);

  const [examDetailOpen, setExamDetailOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Deadline | null>(null);

  const [eventDetailOpen, setEventDetailOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const [todoDetailOpen, setTodoDetailOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);

  // Delete confirmation states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState<Unit | null>(null);

  const [assignmentDeleteConfirmOpen, setAssignmentDeleteConfirmOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<Deadline | null>(null);

  const [examDeleteConfirmOpen, setExamDeleteConfirmOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState<Deadline | null>(null);

  const [deadlineDeleteConfirmOpen, setDeadlineDeleteConfirmOpen] = useState(false);
  const [deadlineToDelete, setDeadlineToDelete] = useState<Deadline | null>(null);

  const [eventDeleteConfirmOpen, setEventDeleteConfirmOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);

  const [todoDeleteConfirmOpen, setTodoDeleteConfirmOpen] = useState(false);
  const [todoToDelete, setTodoToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  // Actions — memoized to prevent effect re-triggers in consumers
  const openEditDeadline = useCallback((deadline: Deadline) => {
    setEditDeadline(deadline);
    setDeadlineDialogOpen(true);
  }, []);

  const openAddAssignment = useCallback(() => {
    setEditAssignment(null);
    setAssignmentDialogOpen(true);
  }, []);

  const openEditAssignment = useCallback((assignment: Deadline) => {
    setEditAssignment(assignment);
    setAssignmentDialogOpen(true);
  }, []);

  const openAssignmentDetail = useCallback((assignment: Deadline) => {
    setSelectedAssignment(assignment);
    setAssignmentDetailOpen(true);
  }, []);

  const openAddExam = useCallback(() => {
    setEditExam(null);
    setExamDialogOpen(true);
  }, []);

  const openEditExam = useCallback((exam: Deadline) => {
    setEditExam(exam);
    setExamDialogOpen(true);
  }, []);

  const openAddEvent = useCallback(() => {
    setEditEvent(null);
    setEventDialogOpen(true);
  }, []);

  const handleEventClick = useCallback((event: Event) => {
    setSelectedEvent(event);
    setEventDetailOpen(true);
  }, []);

  const openEditEvent = useCallback((event: Event) => {
    setEditEvent(event);
    setEventDialogOpen(true);
  }, []);

  const openAddTodo = useCallback(() => {
    setEditingTodo(null);
    setEditTodoTitle('');
    setEditTodoPriority('Medium');
    setEditTodoDueDate('');
    setEditTodoDueTime('');
    setEditTodoColor('#10b981');
    setTodoDialogOpen(true);
  }, []);

  const openEditTodo = useCallback((todo: Todo) => {
    setEditingTodo(todo);
    setEditTodoTitle(todo.title);
    setEditTodoPriority(todo.priority);
    setEditTodoColor(todo.color || '#10b981');
    if (todo.dueDate) {
      const date = new Date(todo.dueDate);
      setEditTodoDueDate(dayjs(date).format('YYYY-MM-DD'));
      setEditTodoDueTime(dayjs(date).format('HH:mm'));
    } else {
      setEditTodoDueDate('');
      setEditTodoDueTime('');
    }
    setTodoDialogOpen(true);
  }, []);

  const openAddUnit = useCallback(() => {
    setEditingUnit(null);
    setUnitDialogOpen(true);
  }, []);

  const openEditUnit = useCallback((unit: Unit) => {
    setEditingUnit(unit);
    setUnitDialogOpen(true);
  }, []);

  const handleDeleteUnit = useCallback((unit: Unit) => {
    setUnitToDelete(unit);
    setDeleteConfirmOpen(true);
  }, []);

  return {
    // Dialog states & setters
    deadlineDialogOpen,
    setDeadlineDialogOpen,
    editDeadline,
    setEditDeadline,
    assignmentDialogOpen,
    setAssignmentDialogOpen,
    editAssignment,
    setEditAssignment,
    examDialogOpen,
    setExamDialogOpen,
    editExam,
    setEditExam,
    eventDialogOpen,
    setEventDialogOpen,
    editEvent,
    setEditEvent,
    unitDialogOpen,
    setUnitDialogOpen,
    editingUnit,
    setEditingUnit,
    todoDialogOpen,
    setTodoDialogOpen,
    editingTodo,
    setEditingTodo,
    editTodoTitle,
    setEditTodoTitle,
    editTodoPriority,
    setEditTodoPriority,
    editTodoDueDate,
    setEditTodoDueDate,
    editTodoDueTime,
    setEditTodoDueTime,
    editTodoColor,
    setEditTodoColor,

    // Detail panel states & setters
    unitDetailOpen,
    setUnitDetailOpen,
    selectedUnit,
    setSelectedUnit,
    assignmentDetailOpen,
    setAssignmentDetailOpen,
    selectedAssignment,
    setSelectedAssignment,
    examDetailOpen,
    setExamDetailOpen,
    selectedExam,
    setSelectedExam,
    eventDetailOpen,
    setEventDetailOpen,
    selectedEvent,
    setSelectedEvent,
    todoDetailOpen,
    setTodoDetailOpen,
    selectedTodo,
    setSelectedTodo,

    // Delete confirm states & setters
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    unitToDelete,
    setUnitToDelete,
    assignmentDeleteConfirmOpen,
    setAssignmentDeleteConfirmOpen,
    assignmentToDelete,
    setAssignmentToDelete,
    examDeleteConfirmOpen,
    setExamDeleteConfirmOpen,
    examToDelete,
    setExamToDelete,
    deadlineDeleteConfirmOpen,
    setDeadlineDeleteConfirmOpen,
    deadlineToDelete,
    setDeadlineToDelete,
    eventDeleteConfirmOpen,
    setEventDeleteConfirmOpen,
    eventToDelete,
    setEventToDelete,
    todoDeleteConfirmOpen,
    setTodoDeleteConfirmOpen,
    todoToDelete,
    setTodoToDelete,

    // Actions
    openEditDeadline,
    openAddAssignment,
    openEditAssignment,
    openAssignmentDetail,
    openAddExam,
    openEditExam,
    openAddEvent,
    handleEventClick,
    openEditEvent,
    openAddTodo,
    openEditTodo,
    openAddUnit,
    openEditUnit,
    handleDeleteUnit,
  };
}
