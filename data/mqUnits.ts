// data/mqUnits.ts
// Macquarie University Units Database for 2026
// This file contains all MQ units for use in the unit search/dropdown feature

export interface MQUnit {
  code: string;           // Unit code e.g., "COMP1170"
  title: string;          // Unit title e.g., "3D Modelling and Animation"
  creditPoints: number;   // Credit points (usually 10)
  level: number;          // Unit level (1000, 2000, 3000, etc.)
  school: string;         // Faculty/School offering the unit
  unitType: string;       // Unit type (Undergraduate, Postgraduate, etc.)
  description: string;    // Unit description
  sessions: string;       // Available sessions (Session 1, Session 2, etc.)
  locations: string;      // Campus locations
  deliveryMode: string;   // Delivery mode (In person, Online, etc.)
  prerequisites: string;  // Prerequisites
  handbookUrl: string;    // Link to handbook page
}

// Import the MQ unit data
import { mqUnitsData } from './mqUnitsData';

// Export the MQ units data
export const mqUnits: MQUnit[] = mqUnitsData;

// Search function for MQ units - matches code, title, and description
export function searchMQUnits(query: string, limit: number = 20): MQUnit[] {
  if (!query || query.trim() === '') {
    return mqUnits.slice(0, limit);
  }

  const normalizedQuery = query.trim().toLowerCase();
  const queryWords = normalizedQuery.split(/\s+/);

  const matches: { unit: MQUnit; score: number }[] = [];

  mqUnits.forEach((unit) => {
    let score = 0;
    const codeNorm = unit.code.toLowerCase();
    const titleNorm = unit.title.toLowerCase();

    // Exact code match - highest priority
    if (codeNorm === normalizedQuery) {
      score = 100;
    }
    // Code starts with query
    else if (codeNorm.startsWith(normalizedQuery)) {
      score = 90;
    }
    // Code contains query
    else if (codeNorm.includes(normalizedQuery)) {
      score = 80;
    }
    // Title starts with query
    else if (titleNorm.startsWith(normalizedQuery)) {
      score = 70;
    }
    // Title contains query
    else if (titleNorm.includes(normalizedQuery)) {
      score = 60;
    }
    // All query words appear in code + title combined
    else {
      const combined = `${codeNorm} ${titleNorm}`;
      const allWordsMatch = queryWords.every(word => combined.includes(word));
      if (allWordsMatch) {
        score = 50;
      }
    }

    if (score > 0) {
      matches.push({ unit, score });
    }
  });

  // Sort by score descending, then by code alphabetically
  matches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.unit.code.localeCompare(b.unit.code);
  });

  return matches.slice(0, limit).map((m) => m.unit);
}

// Get unit by code
export function getMQUnitByCode(code: string): MQUnit | undefined {
  const normalizedCode = code.trim().toUpperCase();
  return mqUnits.find((unit) => unit.code.toUpperCase() === normalizedCode);
}

// Get all units for a specific level
export function getMQUnitsByLevel(level: number): MQUnit[] {
  return mqUnits.filter((unit) => unit.level === level);
}

// Get all units for a specific school
export function getMQUnitsBySchool(school: string): MQUnit[] {
  const normalizedSchool = school.toLowerCase();
  return mqUnits.filter((unit) => unit.school.toLowerCase().includes(normalizedSchool));
}

