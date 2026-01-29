'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import { useTranslation } from '@/lib/hooks/useTranslation';
import type { TranslationKey } from '@/lib/i18n/translations';
import { useSearchParams } from 'next/navigation';
import { Plus, BookOpen, FileText, CheckCircle2, Circle, PartyPopper, Trash2, CheckSquare, Clock } from 'lucide-react';
import { Button } from '@/components/ui/mq/button';
import { Badge } from '@/components/ui/mq/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { MagicCard } from '@/components/ui/MagicCard';
import { cn } from '@/lib/utils';
import { useDeadlinesStore } from '@/lib/store/deadlinesStore';
import { useUnitsStore } from '@/lib/store/unitsStore';
import { useEventsStore } from '@/lib/store/eventsStore';
import { useTodosStore } from '@/lib/store/todosStore';
import { PRIORITY_COLORS } from '@/lib/constants';
import dayjs from 'dayjs';
import { Deadline, Event, Unit } from '@/lib/types';
import ItemActionButtons from '@/components/calendar/ItemActionButtons';
import { formatLocalizedDate } from '@/lib/utils/locale';

interface CalendarWidgetsProps {
    onAddAssignment: () => void;
    onEditAssignment: (assignment: Deadline) => void;
    onOpenAssignmentDetail: (assignment: Deadline) => void;
    onAddExam: () => void;
    onEditExam: (exam: Deadline) => void;
    onOpenExamDetail: (exam: Deadline) => void;
    onAddUnit: () => void;
    onEditUnit: (unit: Unit) => void;
    onOpenUnitDetail: (unit: Unit) => void;
    onDeleteUnit: (unit: Unit) => void;
    onAddEvent: () => void;
    onEditEvent: (event: Event) => void;
    onOpenEventDetail: (event: Event) => void;
    onDeleteEvent: (event: Event) => void;
    onDeleteAssignment: (assignment: Deadline) => void;
    onDeleteExam: (exam: Deadline) => void;
}

export default function CalendarWidgets({
    onAddAssignment,
    onEditAssignment,
    onOpenAssignmentDetail,
    onAddExam,
    onEditExam,
    onOpenExamDetail,
    onAddUnit,
    onEditUnit,
    onOpenUnitDetail,
    onDeleteUnit,
    onAddEvent,
    onEditEvent,
    onOpenEventDetail,
    onDeleteEvent,
    onDeleteAssignment,
    onDeleteExam,
}: CalendarWidgetsProps) {
    const { t, language } = useTranslation();
    const searchParams = useSearchParams();

    // Stores
    const deadlines = useDeadlinesStore((state) => state.deadlines);
    const toggleComplete = useDeadlinesStore((state) => state.toggleComplete);
    const units = useUnitsStore((state) => state.units);
    const events = useEventsStore((state) => state.events);

    // Todo Store
    const todos = useTodosStore((state) => state.todos);
    const toggleTodoComplete = useTodosStore((state) => state.toggleComplete);
    const deleteTodo = useTodosStore((state) => state.removeTodo);

    // Compute pending todos locally to avoid infinite loop from selector returning new references
    const pendingTodos = useMemo(() => {
        return todos
            .filter((t) => !t.completed)
            .sort((a, b) => {
                // Sort overdue items first
                const now = new Date();
                const aOverdue = a.dueDate && new Date(a.dueDate) < now;
                const bOverdue = b.dueDate && new Date(b.dueDate) < now;

                if (aOverdue && !bOverdue) return -1;
                if (!aOverdue && bOverdue) return 1;

                // Then sort by due date (items with due dates first, earlier dates first)
                if (a.dueDate && !b.dueDate) return -1;
                if (!a.dueDate && b.dueDate) return 1;
                if (a.dueDate && b.dueDate) {
                    const dateDiff = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                    if (dateDiff !== 0) return dateDiff;
                }

                // Then sort by priority
                const priorityOrder = { High: 0, Medium: 1, Low: 2 };
                // @ts-ignore - priority string key access
                const pA = priorityOrder[a.priority] ?? 3;
                // @ts-ignore
                const pB = priorityOrder[b.priority] ?? 3;
                if (pA !== pB) return pA - pB;

                // Finally sort by creation date
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            });
    }, [todos]);

    // Derived Data
    const assignments = deadlines.filter((d) => d.type === 'Assignment');
    const exams = deadlines.filter((d) => d.type === 'Exam' || d.type === 'Quiz');

    // Highlight Refs
    const unitsWidgetRef = useRef<HTMLDivElement>(null);
    const assignmentsWidgetRef = useRef<HTMLDivElement>(null);

    // URL Highlights
    const highlightedDeadlineId = searchParams.get('highlightDeadline');
    const highlightedUnitId = searchParams.get('highlightUnit');
    const highlightedWidget = searchParams.get('highlightWidget');
    const deadlineHighlightActive = Boolean(highlightedDeadlineId);

    // Scroll Effects
    useEffect(() => {
        if (highlightedDeadlineId && assignmentsWidgetRef.current) {
            setTimeout(() => {
                assignmentsWidgetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }, [highlightedDeadlineId]);

    useEffect(() => {
        if ((highlightedUnitId || highlightedWidget === 'units') && unitsWidgetRef.current) {
            setTimeout(() => {
                unitsWidgetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }, [highlightedUnitId, highlightedWidget]);

    // Format Helpers
    const formatMonthDayTime = (date: Date) =>
        formatLocalizedDate(date, language, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

    // Get building info for a deadline
    const getDeadlineBuilding = (deadline: Deadline): string | undefined => {
        if (deadline.building) return deadline.building;
        const unit = units.find((u) => u.code === deadline.unitCode);
        return unit?.location?.building;
    };

    return (
        <div className="space-y-6">
            {/* Assignments Widget */}
            <MagicCard
                isLiquidEnhanced
                className={
                    highlightedDeadlineId &&
                        deadlines.find((d) => d.id === highlightedDeadlineId)?.type === 'Assignment'
                        ? 'ring-2 ring-mq-primary ring-offset-2 ring-offset-mq-background transition-all'
                        : ''
                }
            >
                <div
                    className="mq-magic-card-content p-0 bg-mq-card-background border border-mq-border"
                    ref={assignmentsWidgetRef}
                >
                    <Card className="border border-mq-border shadow-sm bg-mq-card-background">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-sm font-semibold">
                                    <FileText className="h-4 w-4" />
                                    {t('assignments')}
                                </span>
                                <div className="flex items-center gap-2">
                                    <Badge variant="neutral" className="text-[10px] h-5 px-1.5">
                                        {assignments.filter((a) => !a.completed).length} {t('pending')}
                                    </Badge>
                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onAddAssignment} aria-label={t('addAssignment')}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            {assignments.length === 0 ? (
                                <div className="text-center py-6 text-mq-content-tertiary">
                                    <p className="text-xs">{t('noAssignmentsYet')}</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                                    {assignments
                                        .sort((a, b) => dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf())
                                        .map((assignment) => {
                                            const due = dayjs(assignment.dueDate);
                                            const isOverdue = !assignment.completed && due.isBefore(dayjs());
                                            const isHighlighted = deadlineHighlightActive && highlightedDeadlineId === assignment.id;
                                            return (
                                                <div
                                                    key={assignment.id}
                                                    className={cn(
                                                        'group flex items-center gap-3 p-2 rounded-md border border-mq-border transition-all cursor-pointer w-full bg-mq-background-secondary hover:bg-mq-surface',
                                                        assignment.completed && 'opacity-60',
                                                        isOverdue && 'bg-red-500/5 border-red-500/20',
                                                        isHighlighted && 'ring-2 ring-mq-primary ring-offset-1 animate-pulse'
                                                    )}
                                                    onClick={() => onOpenAssignmentDetail(assignment)}
                                                >
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); toggleComplete(assignment.id); }}
                                                        className="text-mq-content-secondary hover:text-mq-primary transition-colors"
                                                    >
                                                        {assignment.completed ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Circle className="h-4 w-4" />}
                                                    </button>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between">
                                                            <h4 className={cn('font-medium text-xs truncate', assignment.completed && 'line-through decoration-mq-content-tertiary')}>
                                                                {assignment.title}
                                                            </h4>
                                                            <Badge className={cn(PRIORITY_COLORS[assignment.priority], 'ml-2 text-[10px] h-4 px-1')} variant="neutral">
                                                                {t(`priority_${assignment.priority}` as TranslationKey)}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-[10px] text-mq-content-secondary truncate mt-0.5">
                                                            {assignment.unitCode} • {formatMonthDayTime(due.toDate())}
                                                        </p>
                                                    </div>
                                                    <ItemActionButtons
                                                        itemType="assignment"
                                                        itemId={assignment.id}
                                                        itemTitle={assignment.title}
                                                        building={getDeadlineBuilding(assignment)}
                                                        room={assignment.room}
                                                        unitCode={assignment.unitCode}
                                                        dateTime={assignment.dueDate}
                                                        onEdit={() => onEditAssignment(assignment)}
                                                        onDelete={() => onDeleteAssignment(assignment)}
                                                        variant="compact"
                                                        stopPropagation
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                    />
                                                </div>
                                            );
                                        })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </MagicCard>

            {/* Exams Widget */}
            <MagicCard isLiquidEnhanced>
                <div className="mq-magic-card-content p-0 bg-mq-card-background border border-mq-border">
                    <Card className="border border-mq-border shadow-sm bg-mq-card-background">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-sm font-semibold">
                                    <BookOpen className="h-4 w-4" />
                                    {t('exams')}
                                </span>
                                <div className="flex items-center gap-2">
                                    <Badge variant="neutral" className="text-[10px] h-5 px-1.5">
                                        {exams.filter((e) => !e.completed).length} {t('upcoming')}
                                    </Badge>
                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onAddExam} aria-label={t('addExam')}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            {exams.length === 0 ? (
                                <div className="text-center py-6 text-mq-content-tertiary">
                                    <p className="text-xs">{t('noExamsYet')}</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                                    {exams.sort((a, b) => dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf()).map((exam) => {
                                        const due = dayjs(exam.dueDate);
                                        const isOverdue = !exam.completed && due.isBefore(dayjs());
                                        return (
                                            <div
                                                key={exam.id}
                                                className={cn(
                                                    'group flex items-center gap-3 p-2 rounded-md border border-mq-border transition-all cursor-pointer w-full bg-mq-background-secondary hover:bg-mq-surface',
                                                    exam.completed && 'opacity-60',
                                                    isOverdue && 'bg-red-500/5 border-red-500/20'
                                                )}
                                                onClick={() => onOpenExamDetail(exam)}
                                            >
                                                <button onClick={(e) => { e.stopPropagation(); toggleComplete(exam.id) }} className="text-mq-content-secondary hover:text-mq-primary">
                                                    {exam.completed ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Circle className="h-4 w-4" />}
                                                </button>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className={cn('font-medium text-xs truncate', exam.completed && 'line-through decoration-mq-content-tertiary')}>
                                                        {exam.title}
                                                    </h4>
                                                    <p className="text-[10px] text-mq-content-secondary truncate mt-0.5">
                                                        {exam.unitCode} • {formatMonthDayTime(due.toDate())}
                                                    </p>
                                                </div>
                                                <ItemActionButtons
                                                    itemType="exam"
                                                    itemId={exam.id}
                                                    itemTitle={exam.title}
                                                    building={getDeadlineBuilding(exam)}
                                                    room={exam.room}
                                                    unitCode={exam.unitCode}
                                                    dateTime={exam.dueDate}
                                                    onEdit={() => onEditExam(exam)}
                                                    onDelete={() => onDeleteExam(exam)}
                                                    variant="compact"
                                                    stopPropagation
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </MagicCard>

            {/* Units Widget */}
            <MagicCard
                isLiquidEnhanced
                className={highlightedWidget === 'units' ? 'ring-2 ring-mq-primary ring-offset-2 ring-offset-mq-background transition-all' : ''}
            >
                <div className="mq-magic-card-content p-0 bg-mq-card-background border border-mq-border" ref={unitsWidgetRef}>
                    <Card variant="glass" className="border border-mq-border shadow-none calendar-glass-solid bg-mq-card-background">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-sm font-semibold">
                                    <BookOpen className="h-4 w-4" />
                                    {t('myUnits')}
                                </span>
                                <div className="flex items-center gap-2">
                                    <Badge variant="neutral" className="text-[10px] h-5 px-1.5">{units.length}</Badge>
                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onAddUnit} aria-label={t('addUnit')}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            {units.length === 0 ? (
                                <div className="text-center py-6 text-mq-content-tertiary">
                                    <p className="text-xs">{t('noUnitsYet')}</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                                    {units.map((unit) => (
                                        <div
                                            key={unit.id}
                                            className={cn(
                                                'group flex items-center gap-3 p-2 rounded-md border border-mq-border bg-mq-background-secondary transition-all cursor-pointer hover:bg-mq-surface',
                                                highlightedUnitId === unit.id && 'border-mq-primary bg-mq-primary/5'
                                            )}
                                            onClick={() => onOpenUnitDetail(unit)}
                                        >
                                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: unit.color }} />
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-xs truncate">{unit.code}</h4>
                                                <p className="text-[10px] text-mq-content-secondary truncate">{unit.name}</p>
                                            </div>
                                            <ItemActionButtons
                                                itemType="unit"
                                                itemId={unit.id}
                                                itemTitle={unit.code}
                                                building={unit.location?.building}
                                                room={unit.location?.room}
                                                unitCode={unit.code}
                                                onEdit={() => onEditUnit(unit)}
                                                onDelete={() => onDeleteUnit(unit)}
                                                variant="compact"
                                                stopPropagation
                                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </MagicCard>

            {/* Events Widget */}
            <MagicCard isLiquidEnhanced>
                <div className="mq-magic-card-content p-0 bg-mq-card-background border border-mq-border">
                    <Card variant="glass" className="border border-mq-border shadow-none calendar-glass-solid bg-mq-card-background">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-sm font-semibold">
                                    <PartyPopper className="h-4 w-4" />
                                    {t('events')}
                                </span>
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onAddEvent()} aria-label={t('addEvent')}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                                {events.slice(0, 5).map((event) => (
                                    <div
                                        key={event.id}
                                        className="group flex items-center gap-3 p-2 rounded-md border border-mq-border bg-mq-background-secondary transition-all cursor-pointer hover:bg-mq-surface"
                                        onClick={() => onOpenEventDetail(event)}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-xs truncate">{event.title}</h4>
                                            <p className="text-[10px] text-mq-content-secondary truncate">{event.time} • {event.location}</p>
                                        </div>
                                        <ItemActionButtons
                                            itemType="event"
                                            itemId={event.id}
                                            itemTitle={event.title}
                                            dateTime={event.startAt || event.date}
                                            onEdit={() => onEditEvent(event)}
                                            onDelete={() => onDeleteEvent(event)}
                                            variant="compact"
                                            stopPropagation
                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                        />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </MagicCard>

            {/* Todos Widget */}
            <MagicCard isLiquidEnhanced>
                <div className="mq-magic-card-content p-0 bg-mq-card-background border border-mq-border">
                    <Card variant="glass" className="border border-mq-border shadow-none calendar-glass-solid bg-mq-card-background">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-sm font-semibold">
                                    <CheckSquare className="h-4 w-4" />
                                    {t('todos' as TranslationKey)}
                                </span>
                                <Badge variant="neutral" className="text-[10px] h-5 px-1.5">{pendingTodos.length}</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                                {pendingTodos.length === 0 ? (
                                    <div className="text-center py-6 text-mq-content-tertiary">
                                        <p className="text-xs">{t('noTodos' as TranslationKey)}</p>
                                    </div>
                                ) : (
                                    pendingTodos.map((todo) => (
                                        <div
                                            key={todo.id}
                                            className="group flex items-center gap-3 p-2 rounded-md border border-mq-border bg-mq-background-secondary transition-all hover:bg-mq-surface"
                                        >
                                            <button
                                                onClick={(e) => { e.stopPropagation(); toggleTodoComplete(todo.id); }}
                                                className="text-mq-content-secondary hover:text-mq-primary transition-colors flex-shrink-0"
                                            >
                                                <Circle className="h-4 w-4" />
                                            </button>
                                            <div className="flex-1 min-w-0">
                                                <h4 className={cn('font-medium text-xs break-words', todo.completed && 'line-through decoration-mq-content-tertiary')}>
                                                    {todo.title}
                                                </h4>
                                                {todo.dueDate && (
                                                    <p className="text-[10px] text-mq-content-secondary flex items-center gap-1 mt-0.5">
                                                        <Clock className="h-3 w-3" />
                                                        {formatMonthDayTime(new Date(todo.dueDate))}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => deleteTodo(todo.id)} className="p-1 hover:text-red-500 text-mq-content-secondary">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    )))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </MagicCard>
        </div>
    );
}
