# JAMB CBT Practice Application

## Overview
A modern Computer-Based Test (CBT) practice platform designed for Nigerian students preparing for JAMB UTME examinations. Features AI-powered learning assistance, offline functionality, and real exam simulation.

## Project Architecture

### Frontend (Vite + React)
- **Port**: 5000
- **Framework**: React 19 with Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand with persistence
- **Routing**: React Router v7
- **Animations**: Framer Motion

### Backend (Node.js + Express)
- **Port**: 3001
- **Database**: PostgreSQL (Supabase) with file-based fallback
- **AI Integration**: Google Gemini API for question generation
- **Question Source**: ALOC API for official JAMB questions

### Key Features
1. **Practice Mode**: Single subject practice with timer
2. **Full Exam Mode**: Multi-subject JAMB simulation (4 subjects, 180 questions)
3. **Study Mode**: Learn at your pace with instant answer reveals
4. **AI Tutor**: Get explanations for difficult questions
5. **Offline Support**: IndexedDB caching + Service Worker
6. **Voice Reader**: Text-to-speech for accessibility
7. **Calculator**: Built-in calculator for calculation subjects
8. **Flashcards**: Create and review flashcards
9. **Analytics**: Track performance across subjects

### Directory Structure
```
cbt-app/
├── public/           # Static assets, PWA files
├── server/           # Express backend
│   ├── data/         # Cached question JSON files
│   ├── db.js         # PostgreSQL database layer
│   └── index.js      # API endpoints
├── src/
│   ├── components/   # Reusable UI components
│   ├── pages/        # Route pages
│   ├── services/     # API and offline services
│   └── store/        # Zustand state management
├── package.json
└── vite.config.js
```

### Environment Variables
- `SUPABASE_DATABASE_URL` - PostgreSQL connection string (Session pooler recommended)
- `GEMINI_API_KEY` - Google AI API key for question generation
- `ALOC_ACCESS_TOKEN` - ALOC API access token for official questions

### Workflows
- **Frontend**: `npm run dev:frontend` (port 5000)
- **Backend**: `node server/index.js` (port 3001)

### Offline Functionality
- Service Worker caches static assets and API responses
- IndexedDB stores questions for offline access
- Questions are automatically synced when online

### Deployment
- **Build**: `npm run build` in cbt-app directory
- **Production Server**: Uses vite preview + backend server
- The app gracefully handles database connection failures using file-based storage

## Recent Changes
- Configured for Replit environment
- Added Supabase PostgreSQL support with standard pg driver
- Enhanced offline storage capabilities
- PWA support for mobile installation

## User Preferences
- Dark theme by default
- Timer enabled for exams
- Calculator enabled for math subjects
