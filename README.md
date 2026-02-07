# Cricket Tournament Organizer

A full-stack web application for scheduling and organizing cricket tournaments with support for multiple tournament formats.

![Next.js](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-Latest-009688?logo=fastapi)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)

## Features

- **Multiple Tournament Formats**
  - **Round Robin** - Each team plays every other team once
  - **League** - Each team plays every other team twice (home & away)
  - **Knockout** - Single elimination bracket tournament

- **Smart Scheduling**
  - Automatic match scheduling with conflict avoidance
  - Configurable rest days between matches
  - Venue balancing and distribution
  - Blackout date support
  - Priority match scheduling

- **Interactive Bracket View**
  - Visual knockout bracket using React Flow
  - Real-time bracket updates
  - Winner selection and progression

- **Advanced Constraints**
  - Maximum matches per day
  - Maximum matches per team per day
  - Minimum gap between same team matches
  - Venue rest gap configuration
  - Even match distribution

## Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Zustand** - State management
- **React Flow** - Interactive bracket visualization
- **Axios** - HTTP client

### Backend
- **FastAPI** - Python web framework
- **Uvicorn** - ASGI server
- **Pydantic** - Data validation

## Project Structure

```
├── backend/
│   ├── main.py           # FastAPI application & routes
│   ├── models.py         # Pydantic data models
│   ├── scheduler.py      # Tournament scheduling logic
│   └── requirements.txt  # Python dependencies
│
├── frontend/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   │   ├── TournamentForm.tsx
│   │   ├── TournamentCard.tsx
│   │   ├── KnockoutFlow.tsx
│   │   ├── LeagueCard.tsx
│   │   └── RoundRobinCard.tsx
│   ├── lib/api/          # API client utilities
│   ├── store/            # Zustand state management
│   └── types/            # TypeScript type definitions
```

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.9+

### Backend Setup

```bash
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

The application will be available at `http://localhost:3000`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/schedule` | Generate tournament schedule |
| POST | `/knockout-bracket` | Generate knockout bracket |
| POST | `/knockout-next-round` | Generate next round from results |

## Usage

1. **Select Tournament Format** - Choose between Round Robin, League, or Knockout
2. **Add Teams** - Enter team names (minimum 2 teams required)
3. **Add Venues** - Enter venue names for matches
4. **Configure Time Slots** - Set available time slots (Morning, Evening, etc.)
5. **Set Start Date** - Choose tournament start date
6. **Configure Constraints** (Optional) - Adjust scheduling rules
7. **Generate Schedule** - Click to create the tournament schedule

## Screenshots

The application features a modern dark-themed UI with:
- Interactive form for tournament configuration
- Visual bracket display for knockout tournaments
- Match cards with team, venue, and time information
- Real-time schedule generation feedback

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Author

**Adeel Atta** - [GitHub](https://github.com/AdeelAtta)
