# Services Directory

This directory contains the core business logic services for the AI Excel Interviewer:

## Service Structure

- `interview/` - Interview orchestration and management
- `evaluation/` - AI-powered response evaluation
- `questions/` - Question bank and selection logic
- `reports/` - Report generation and analytics
- `ai/` - AI service integrations (OpenAI, Google AI)
- `websocket/` - Real-time communication handling

## Service Interfaces

Each service implements interfaces defined in `/src/lib/types.ts` to ensure consistency and testability.

## Error Handling

All services use consistent error handling patterns and recovery mechanisms as defined in the design document.