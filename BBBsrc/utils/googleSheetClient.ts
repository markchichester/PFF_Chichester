import { Player } from '../types';

/**
 * Fetches player data from a Google Sheet
 * For public sheets, you can use: https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:csv
 * For private sheets, you'll need OAuth or API key authentication
 */
export async function fetchPlayersFromGoogleSheet(sheetId: string, apiKey?: string): Promise<Player[]> {
  try {
    // Option 1: Public sheet (CSV export)
    if (!apiKey) {
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;
      const response = await fetch(csvUrl);
      const csvText = await response.text();
      return parseCSV(csvText);
    }

    // Option 2: Google Sheets API (requires API key)
    const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1?key=${apiKey}`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    if (!data.values || data.values.length === 0) {
      return [];
    }

    // First row is headers
    const headers = data.values[0] as string[];
    const rows = data.values.slice(1);

    return rows.map((row: string[]) => {
      const player: any = {};
      headers.forEach((header, index) => {
        player[header] = row[index] || '';
      });
      return player as Player;
    });
  } catch (error) {
    console.error('Error fetching from Google Sheet:', error);
    throw error;
  }
}

function parseCSV(csvText: string): Player[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  // Parse headers
  const headers = parseCSVLine(lines[0]);
  const players: Player[] = [];

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const player: any = {};
    
    headers.forEach((header, index) => {
      player[header] = values[index] || '';
    });
    
    players.push(player as Player);
  }

  return players;
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current.trim());
  return values;
}

