// data/sampleUnits.ts
import { Unit, Deadline } from '@/lib/types';

// Use stable IDs to prevent hydration issues
// Note: Sample units removed to prevent them from being auto-added on password reset
// Users should add their own units manually
export const sampleUnits: Unit[] = [];

// Note: Sample deadlines removed along with sample units
// to prevent orphan data from being auto-added on password reset
export const sampleDeadlines: Deadline[] = [];
