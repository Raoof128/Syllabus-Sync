# API Reference

## Overview

This project currently exposes no external API. The primary interfaces are TypeScript types and Zustand store methods used by client components.

## Routes

Pages are defined under `app/` and follow Next.js App Router conventions:

- `/home`
- `/map`
- `/calendar`
- `/feed`
- `/settings`

## Types

Defined in `lib/types/index.ts`:

- Unit
- ClassTime
- Deadline
- Event
- StressLevel

## Stores

### unitsStore (`lib/store/unitsStore.ts`)

- addUnit(unit: Unit): void
- removeUnit(id: string): void
- updateUnit(id: string, unit: Partial<Unit>): void
- getUnitByCode(code: string): Unit | undefined
- getTodayClasses(): (Unit & ClassTime)[]

### deadlinesStore (`lib/store/deadlinesStore.ts`)

- addDeadline(deadline: Deadline): void
- removeDeadline(id: string): void
- updateDeadline(id: string, deadline: Partial<Deadline>): void
- toggleComplete(id: string): void
- getUpcoming(limit?: number): Deadline[]
- getStressLevel(): StressLevel

## Usage Example

```ts
import { useUnitsStore } from '@/lib/store/unitsStore';

const addUnit = useUnitsStore((state) => state.addUnit);
addUnit({
  id: 'unit-1',
  code: 'COMP1000',
  name: 'Intro to CS',
  color: '#A6192E',
  location: { building: 'C5C', room: '101' },
  schedule: [],
  createdAt: new Date(),
});
```
