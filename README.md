# JAMB CBT Practice App

A modern, AI-powered Computer-Based Test (CBT) practice platform designed specifically for Nigerian students preparing for JAMB UTME examinations.

![JAMB CBT Dashboard](attached_assets/screenshot-1765116198520.png)

## Features

### Core Features
- **Study Mode** - Learn at your own pace without time pressure
- **Practice Mode** - Quick timed practice sessions for individual subjects
- **Full Exam Mode** - Simulate real JAMB exam conditions with 4 subjects and timer
- **Progress Tracking** - Monitor your performance with detailed analytics

### AI-Powered Learning
- **Multi-Model AI Assistant** - Choose from multiple AI providers:
  - Google Gemini (2.0 Flash, 2.5 Flash, 2.5 Pro, 1.5 Flash, 1.5 Pro)
  - Poe AI (Claude 3, GPT-4o Mini)
  - Grok AI (xAI models)
  - Cerebras AI (Ultra-fast Llama models)
- **Question Explanations** - Get detailed step-by-step explanations for any question
- **Image Analysis** - Upload diagrams, graphs, or question images for AI analysis
- **Personalized Study Tips** - Receive subject-specific study strategies
- **Conversation Memory** - AI remembers previous conversations for better assistance

### Study Tools
- **Flashcards** - AI-generated flashcards for any topic
- **Dictionary** - Quick word lookup and definitions
- **Calculator** - Built-in scientific calculator for math and science subjects
- **Bookmarks** - Save important questions for later review
- **Voice Reader** - Text-to-speech for accessibility

### Subjects Covered
- English Language
- Mathematics
- Physics
- Chemistry
- Biology
- Literature in English
- Government
- Commerce
- Accounting
- Economics
- Christian Religious Studies (CRK)
- Islamic Religious Studies (IRK)
- Geography
- Agricultural Science
- History

## Technology Stack

- **Frontend**: React 19 with Vite
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Charts**: Recharts
- **AI Integration**: Google Generative AI SDK

## Getting Started

### Prerequisites
- Node.js 18+ or Bun
- A Gemini API key (required for AI features)
- Optional: Poe, Grok, or Cerebras API keys for additional AI providers

### Installation

1. Clone the repository
2. Navigate to the cbt-app directory:
   ```bash
   cd cbt-app
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Set up environment variables (see below)
5. Start the development server:
   ```bash
   npm run dev
   ```

### Environment Variables

Create a `.env` file in the root directory with the following:

```env
GEMINI_API_KEY=your_gemini_api_key
VITE_POE_API_KEY=your_poe_api_key (optional)
VITE_GROK_API_KEY=your_grok_api_key (optional)
VITE_CEREBRAS_API_KEY=your_cerebras_api_key (optional)
```

## Screenshots

### Dashboard
The main dashboard provides quick access to all features including Study Mode, Practice, Full Exam simulation, and the AI Tutor.

### AI Model Selection
![Settings Page](attached_assets/generated_images/jamb_cbt_app_icon.png)

Configure your preferred AI model from the Settings page. Choose between multiple providers and models based on your needs.

### Features Overview
| Feature | Description |
|---------|-------------|
| Study Mode | Self-paced learning with instant answer reveals |
| Practice | Timed practice sessions for individual subjects |
| Full Exam | Complete JAMB simulation with 4 subjects |
| AI Tutor | Intelligent assistant for explanations and tips |
| Flashcards | AI-generated study cards |
| Analytics | Detailed performance tracking |

## Offline Support

The app includes Progressive Web App (PWA) features:
- Works offline after initial load
- Cached questions and responses
- Local storage for progress and settings

## License

This project is for educational purposes.

## Support

For issues and feature requests, please use the GitHub Issues page.

---

Built with love for Nigerian students preparing for JAMB UTME examinations.
