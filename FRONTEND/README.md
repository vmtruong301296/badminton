# Badminton Court Management - Frontend

React application for managing badminton court bills, players, and related data.

## Tech Stack

- React 19
- Vite
- React Router DOM
- Axios
- Tailwind CSS
- date-fns

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

The app will run on `http://localhost:3000`

## API Configuration

The app is configured to proxy API requests to `http://localhost:8000/api` (Laravel backend).

You can modify this in `vite.config.js`:

```js
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true,
  },
}
```

## Features

- **Dashboard**: List all bills with filters
- **Create Bill**: Complex form with real-time calculation preview
- **Bill Detail**: View bill details and mark payments
- **Players Management**: CRUD for players
- **Ratios Management**: Manage weight/ratio settings
- **Menus Management**: CRUD for drink menus
- **Shuttles Management**: CRUD for shuttlecock types

## Project Structure

```
src/
├── components/
│   ├── common/          # Reusable components (CurrencyInput, NumberInput, DatePicker)
│   ├── bill/            # Bill-related components (PlayerSelector, ShuttleRow, etc.)
│   └── Layout.jsx       # Main layout with navigation
├── screens/
│   ├── dashboard/       # Dashboard/Bills list
│   ├── bills/          # Create Bill, Bill Detail
│   ├── players/        # Players management
│   ├── ratios/         # Ratios management
│   ├── menus/          # Menus management
│   └── shuttles/       # Shuttles management
├── services/
│   └── api.js          # API service layer
└── utils/
    └── formatters.js   # Utility functions (formatCurrency, calculateBillPreview, etc.)
```

## Build

```bash
npm run build
```

## Notes

- All currency values are in VND (Vietnamese Dong)
- Date format: YYYY-MM-DD
- The bill calculation preview is client-side only; backend is the source of truth
- Rounding differences are shown in the preview but handled by backend
