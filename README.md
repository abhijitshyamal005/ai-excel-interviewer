# AI-Powered Excel Mock Interviewer

An automated system designed to assess candidates' Microsoft Excel proficiency through structured, conversational interviews. This system addresses hiring pipeline bottlenecks by providing consistent, scalable technical screening for Finance, Operations, and Data Analytics positions.

## Features

- **Structured Interview Flow**: AI-driven conversational interviews with natural progression
- **Intelligent Evaluation**: Advanced AI assessment of Excel knowledge across skill levels
- **Real-time Communication**: WebSocket-based interface for seamless interaction
- **Comprehensive Reporting**: Detailed performance analysis and hiring recommendations
- **Adaptive Questioning**: Dynamic difficulty adjustment based on candidate performance
- **Learning System**: Continuous improvement through interview data analysis

## Technology Stack

- **Frontend**: Next.js 15 + React 18 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes + Prisma ORM
- **Database**: PostgreSQL
- **Cache/Sessions**: Redis
- **AI Services**: OpenAI GPT-4 / Google Gemini Pro
- **Real-time**: Socket.IO
- **Authentication**: JWT + bcrypt

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Redis server
- OpenAI API key or Google AI API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ai-excel-interviewer
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Set up the database:
```bash
npm run db:generate
npm run db:push
npm run db:seed
```

5. Start the development server:
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.


## Core Services

### Interview Orchestrator
Manages the complete interview lifecycle, conversation flow, and state management.

### Evaluation Engine
AI-powered assessment of candidate responses with partial credit and detailed feedback.

### Question Engine
Adaptive question selection based on skill level and performance progression.

### Report Service
Comprehensive performance analysis and hiring recommendation generation.

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/candidate` - Candidate session creation

### Interviews
- `POST /api/interviews/start` - Start new interview
- `POST /api/interviews/[id]/response` - Submit response
- `GET /api/interviews/[id]/status` - Get interview status
- `POST /api/interviews/[id]/complete` - Complete interview

### Reports
- `GET /api/reports/[sessionId]` - Get interview report
- `POST /api/reports/[sessionId]/export` - Export report

## Development

### Running Tests
```bash
npm test                # Run tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

### Database Operations
```bash
npm run db:studio       # Open Prisma Studio
npm run db:migrate      # Run migrations
npm run db:seed         # Seed database
```

### Code Quality
```bash
npm run lint           # ESLint
npm run type-check     # TypeScript check
```

## Deployment

The application is designed for deployment on:
- **Frontend**: Vercel (recommended)
- **Database**: Railway, Supabase, or AWS RDS
- **Redis**: Railway, Redis Cloud, or AWS ElastiCache

### Environment Variables

Required environment variables for production:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `OPENAI_API_KEY` - OpenAI API key
- `JWT_SECRET` - JWT signing secret
- `NEXTAUTH_SECRET` - NextAuth secret
- `NEXTAUTH_URL` - Application URL
