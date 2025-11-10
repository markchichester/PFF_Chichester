export interface Player {
  pff_id: string;
  name: string;
  big_board_rank: string;
  analysis: string;
  School: string;
  Position: string;
  '2025 PFF WAA': string;
  '2025 PFF Grade': string;
  'Player profile': string;
}

export type SortField = keyof Player | '';
export type SortDirection = 'asc' | 'desc' | '';

