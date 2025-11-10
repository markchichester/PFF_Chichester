# NFL Draft Big Board 2026

A modern, interactive web application for managing your 2026 NFL Draft Big Board. Drag and drop players from the pool to build your custom board, filter by any data field, and keep your rankings organized.

## Features

- **Two-Panel Interface**: Big Board on the left, Player Pool on the right
- **Drag & Drop**: Reorder players on your Big Board with smooth animations
- **Google Sheets Integration**: Sync player data directly from Google Sheets
- **Advanced Filtering**: Search by name, school, position, or PFF Grade
- **Sortable Columns**: Click column headers to sort the player pool
- **Persistent Storage**: Your Big Board is saved to localStorage
- **Modern UI**: Beautiful design with Archivo font and custom color scheme

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Google Sheets Setup

### Option 1: Public Sheet (No API Key Required)

1. Make your Google Sheet publicly viewable
2. Copy the Sheet ID from the URL: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`
3. Paste the Sheet ID in the Config section
4. Click "Sync from Google Sheet"

### Option 2: Private Sheet (API Key Required)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Sheets API
4. Create credentials (API Key)
5. Restrict the API key to Google Sheets API (optional but recommended)
6. Paste both the Sheet ID and API Key in the Config section
7. Click "Sync from Google Sheet"

### Required Columns

Your Google Sheet should have the following columns:
- `pff_id`
- `name`
- `big_board_rank`
- `analysis`
- `School`
- `Position`
- `2025 PFF WAA`
- `2025 PFF Grade`
- `Player profile`

## Usage

1. **Sync Players**: Enter your Google Sheet ID and click "Sync from Google Sheet"
2. **Add Players**: Click or drag players from the Player Pool to your Big Board
3. **Reorder**: Drag players up or down on your Big Board to reorder them
4. **Remove Players**: Click the X button on any player in your Big Board
5. **Search**: Use the search bar to filter players by any field
6. **Sort**: Click column headers in the Player Pool to sort

## Tech Stack

- React 18
- TypeScript
- Vite
- TailwindCSS
- Framer Motion
- @dnd-kit
- Lucide React Icons

## License

MIT

