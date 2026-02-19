#!/usr/bin/env node
/**
 * Script to convert MQ Units CSV to TypeScript data
 * Usage: node tools/convert-mq-units.js
 *
 * Reads: data/mqUnits2026.csv
 * Outputs: data/mqUnitsData.ts
 */

const fs = require('fs');
const path = require('path');

// CSV parsing utility that handles quoted fields with commas
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Read CSV file
const csvPath = path.join(__dirname, '..', 'data', 'mqUnits2026.csv');
const outputPath = path.join(__dirname, '..', 'data', 'mqUnitsData.ts');

if (!fs.existsSync(csvPath)) {
  console.error('CSV file not found:', csvPath);
  process.exit(1);
}

const csvContent = fs.readFileSync(csvPath, 'utf-8');
const lines = csvContent.split('\n').filter((line) => line.trim());

if (lines.length < 2) {
  console.error('CSV file appears to be empty or has no data rows');
  process.exit(1);
}

// Parse header
const header = parseCSVLine(lines[0]);
console.log('CSV Headers:', header);

// Find column indices
const colIndex = {
  year: header.indexOf('year'),
  code: header.indexOf('code'),
  title: header.indexOf('title'),
  creditPoints: header.indexOf('credit_points'),
  level: header.indexOf('level'),
  school: header.indexOf('school'),
  unitType: header.indexOf('special_unit_type'),
  description: header.indexOf('description'),
  sessions: header.indexOf('sessions'),
  locations: header.indexOf('locations'),
  deliveryMode: header.indexOf('delivery_mode'),
  prerequisites: header.indexOf('prerequisites'),
  handbookUrl: header.indexOf('handbook_url'),
};

// Parse data rows
const units = [];
for (let i = 1; i < lines.length; i++) {
  const row = parseCSVLine(lines[i]);
  if (row.length < 5) continue; // Skip malformed rows

  const code = (row[colIndex.code] || '').trim();
  if (!code) continue;

  // Parse unit type from JSON-like string
  let unitType = 'Undergraduate';
  const unitTypeRaw = row[colIndex.unitType] || '';
  if (unitTypeRaw.includes('postgrad')) {
    unitType = 'Postgraduate';
  } else if (unitTypeRaw.includes('pathway')) {
    unitType = 'Pathway';
  } else if (unitTypeRaw.includes('research_master')) {
    unitType = 'Research Master';
  }

  units.push({
    code: code,
    title: (row[colIndex.title] || '').trim(),
    creditPoints: parseInt(row[colIndex.creditPoints]) || 10,
    level: parseInt(row[colIndex.level]) || 1000,
    school: (row[colIndex.school] || '').trim(),
    unitType: unitType,
    description: (row[colIndex.description] || '').trim().substring(0, 500), // Limit description length
    sessions: (row[colIndex.sessions] || '').trim(),
    locations: (row[colIndex.locations] || '').trim(),
    deliveryMode: (row[colIndex.deliveryMode] || '').trim(),
    prerequisites: (row[colIndex.prerequisites] || '').trim(),
    handbookUrl: (row[colIndex.handbookUrl] || '').trim(),
  });
}

console.log(`Parsed ${units.length} units from CSV`);

// Generate TypeScript file
const tsContent = `// data/mqUnitsData.ts
// Auto-generated from mqUnits2026.csv - DO NOT EDIT MANUALLY
// Generated on: ${new Date().toISOString()}
// Total units: ${units.length}

import { MQUnit } from './mqUnits';

export const mqUnitsData: MQUnit[] = ${JSON.stringify(units, null, 2)};
`;

fs.writeFileSync(outputPath, tsContent, 'utf-8');
console.log(`Generated TypeScript file: ${outputPath}`);
