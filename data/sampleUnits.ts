// data/sampleUnits.ts
import { Unit, Deadline } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export const sampleUnits: Unit[] = [
    {
        id: uuidv4(),
        code: 'COMP2310',
        name: 'Networking',
        color: '#A6192E',
        location: {
            building: 'C5C',
            room: '204',
        },
        schedule: [
            {
                id: uuidv4(),
                day: 'Monday',
                startTime: '09:00',
                endTime: '11:00',
            },
            {
                id: uuidv4(),
                day: 'Thursday',
                startTime: '14:00',
                endTime: '16:00',
            },
        ],
        createdAt: new Date(),
    },
    {
        id: uuidv4(),
        code: 'COMP3300',
        name: 'Data Privacy',
        color: '#002A45',
        location: {
            building: 'W6A',
            room: '105',
        },
        schedule: [
            {
                id: uuidv4(),
                day: 'Wednesday',
                startTime: '14:00',
                endTime: '16:00',
            },
        ],
        createdAt: new Date(),
    },
    {
        id: uuidv4(),
        code: 'ENGL100',
        name: 'Academic Writing',
        color: '#FFB81C',
        location: {
            building: 'E7A',
            room: '301',
        },
        schedule: [
            {
                id: uuidv4(),
                day: 'Friday',
                startTime: '10:00',
                endTime: '12:00',
            },
        ],
        createdAt: new Date(),
    },
];

export const sampleDeadlines: Deadline[] = [
    {
        id: uuidv4(),
        title: 'Assignment 1',
        unitCode: 'COMP2310',
        dueDate: new Date('2025-04-16T23:59:00'),
        priority: 'Urgent',
        type: 'Assignment',
        completed: false,
        createdAt: new Date(),
    },
    {
        id: uuidv4(),
        title: 'Quiz Week 4',
        unitCode: 'COMP3300',
        dueDate: new Date('2025-04-18T14:00:00'),
        priority: 'High',
        type: 'Quiz',
        completed: false,
        createdAt: new Date(),
    },
    {
        id: uuidv4(),
        title: 'Presentation',
        unitCode: 'ENGL100',
        dueDate: new Date('2025-04-24T09:00:00'),
        priority: 'Medium',
        type: 'Presentation',
        completed: false,
        createdAt: new Date(),
    },
];
