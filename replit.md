# JAMB CBT Practice App

## Overview
A modern Computer-Based Test (CBT) practice application for JAMB UTME preparation. Built with React + Vite, featuring multi-AI powered learning assistance with support for Google Gemini, Poe AI, Grok, and Cerebras.

## Current State
Version 2.1.0 - Multi-AI powered release with the following major features:
- Multiple AI provider support (Gemini, Poe, Grok, Cerebras)
- Persistent conversation memory for AI assistant
- Offline question storage via IndexedDB
- AI-generated flashcards based on JAMB syllabus
- Dynamic novel analysis generation for Literature
- Advanced model selection UI

## Tech Stack
- Frontend: React 19 with Vite 7
- State Management: Zustand
- Styling: Tailwind CSS 4
- Animations: Framer Motion
- AI: Multiple providers (Gemini, Poe, Grok, Cerebras)
- Offline Storage: IndexedDB
- Questions API: ALOC API

## Project Structure
```
cbt-app/
├── src/
│   ├── components/
│   │   ├── AIAssistant.jsx  # Multi-AI chat interface with model selection
│   │   ├── Flashcards.jsx   # AI-generated flashcard system
│   │   ├── Dictionary.jsx   # Word lookup component
│   │   └── ...
│   ├── pages/
│   │   ├── Dashboard.jsx    # Main dashboard
│   │   ├── NovelPage.jsx    # Literature study with AI generation
│   │   ├── Settings.jsx     # App and AI model settings
│   │   └── ...
│   ├── services/
│   │   ├── aiService.js     # Multi-provider AI integration
│   │   ├── api.js           # ALOC API for questions
│   │   └── offlineStorage.js
│   ├── data/
│   │   └── jambSyllabus.js  # JAMB syllabus topics
│   └── store/
│       └── useStore.js      # Zustand state management
└── vite.config.js
```

## Key Features

### AI Assistant (Ilom)
- Multiple AI providers: Gemini, Poe AI, Grok, Cerebras
- Gemini models: 2.5 Flash, 2.5 Pro, 2.0 Flash, 1.5 Flash, 1.5 Pro
- Poe models: Claude 3 Haiku, Claude 3 Sonnet, GPT-4o Mini
- Grok models: Grok Beta, Grok 2
- Cerebras models: Llama 3.3 70B, Llama 3.1 8B
- Image upload for diagram analysis (Gemini only)
- Persistent conversation history
- Subject-specific study tips

### Offline Support
- Questions cached to IndexedDB
- Works offline with cached questions
- Flashcards stored locally
- Novel analyses saved for offline access

### Study Features
- Study Mode: Self-paced learning
- Practice Mode: Timed single-subject practice
- Full Exam Mode: Complete JAMB simulation
- Flashcards: AI-generated study cards
- Analytics: Performance tracking

## Environment Variables
- `GEMINI_API_KEY` - Google Gemini API key (required)
- `VITE_POE_API_KEY` - Poe API key (optional)
- `VITE_GROK_API_KEY` - Grok API key (optional)
- `VITE_CEREBRAS_API_KEY` - Cerebras API key (optional)

## JAMB Subjects
English, Mathematics, Physics, Chemistry, Biology, Literature, Government, Commerce, Accounting, Economics, CRK, IRK, Geography, Agricultural Science, History

## Recent Changes (December 2025)
- Added multi-AI provider support
- Fixed Gemini model names (using 2.0-flash as default)
- Added advanced model selection UI in AI Assistant and Settings
- Cleaned up unnecessary Laravel/PHP directories
- Updated to React 19 and Vite 7
- Created professional README with screenshots

## Development
Run `npm run dev` in the cbt-app directory to start the development server on port 5000.

## User Preferences
- Dark theme by default
- No code comments in production code
- Clean, professional UI
- Multi-AI support for flexibility
