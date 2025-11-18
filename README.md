# CampusHire

AI-powered recruitment and placement platform with Veda AI assistant.

## Quick Start

### Prerequisites
- Node.js >= 18.0.0
- MongoDB Atlas account (or local MongoDB)

### Installation

```bash
npm run install:all
```

### Environment Setup

1. Copy environment example files:
   ```bash
   cp frontend/env.example frontend/.env
   cp backend/env.example backend/.env
   ```

2. Configure environment variables in `.env` files

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

### Production Start

```bash
# Backend
cd backend && npm start

# Frontend (serve dist folder with a static server)
```

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express.js, TypeScript, MongoDB, Mongoose
- **AI**: Google Gemini / OpenAI / Claude API

## License

Proprietary - All rights reserved
