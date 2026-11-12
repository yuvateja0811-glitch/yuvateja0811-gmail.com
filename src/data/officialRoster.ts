import { RosterStudent } from '../types';

export const CSE2_START_ROLL = 122;
export const CSE2_END_ROLL = 214;
export const CSE2_TOTAL_COUNT = 93;

/**
 * Validates whether a roll number belongs to the official GVP CSE-2 range (26UECSE0122 - 26UECSE0214)
 */
export function isValidCse2Id(id: string): boolean {
  if (!id) return false;
  const clean = id.trim().toUpperCase();
  const match = clean.match(/^26UECSE0?(\d+)$/i);
  if (!match) return false;
  const num = parseInt(match[1], 10);
  return num >= CSE2_START_ROLL && num <= CSE2_END_ROLL;
}

/**
 * Normalizes input roll number to canonical uppercase format (e.g. 26UECSE0145)
 */
export function normalizeStudentId(id: string): string {
  const clean = id.trim().toUpperCase();
  const match = clean.match(/^26UECSE0?(\d+)$/i);
  if (match) {
    const num = parseInt(match[1], 10);
    // Pad to 4 digits after 26UECSE e.g. 0122
    const padded = num.toString().padStart(4, '0');
    return `26UECSE${padded}`;
  }
  return clean;
}

/**
 * Generates the official baseline 93-student roster for CSE-2
 */
export function generateDefaultRoster(): RosterStudent[] {
  const roster: RosterStudent[] = [];
  for (let i = CSE2_START_ROLL; i <= CSE2_END_ROLL; i++) {
    const padded = i.toString().padStart(4, '0');
    const studentId = `26UECSE${padded}`;
    roster.push({
      studentId,
      name: '', // Empty until registered or imported to strictly respect "Do not invent student names"
      section: 'CSE-2',
      registered: false,
    });
  }
  return roster;
}

/**
 * Parses user-provided CSV or pasted text for roster imports
 * Accepts formats:
 * - 26UECSE0122, Name
 * - 26UECSE0122 \t Name
 * - ID; Name
 */
export function parseRosterCsv(text: string): { studentId: string; name: string }[] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const parsed: { studentId: string; name: string }[] = [];

  for (const line of lines) {
    // Skip common header lines
    if (/^(roll|student\s*id|reg\s*no|s\.?no|name)/i.test(line)) {
      continue;
    }

    let id = '';
    let name = '';

    if (line.includes('\t')) {
      const parts = line.split('\t').map(s => s.trim());
      id = parts[0];
      name = parts.slice(1).join(' ');
    } else if (line.includes(',')) {
      const parts = line.split(',').map(s => s.trim());
      id = parts[0];
      name = parts.slice(1).join(' ');
    } else if (line.includes(';')) {
      const parts = line.split(';').map(s => s.trim());
      id = parts[0];
      name = parts.slice(1).join(' ');
    } else {
      // Space separated if starts with roll number
      const match = line.match(/^(26UECSE\d+)\s+(.+)$/i);
      if (match) {
        id = match[1];
        name = match[2];
      } else {
        id = line;
      }
    }

    if (id && isValidCse2Id(id)) {
      parsed.push({
        studentId: normalizeStudentId(id),
        name: name.replace(/^["']|["']$/g, '').trim(),
      });
    }
  }

  return parsed;
}
