# Success - Engineering Manager Tool

This is Success, a tool designed for engineering managers to help with people management, project tracking, and link organization, with AI integration capabilities.

## Project Overview

**Success** is a full-stack web application that helps engineering managers effectively manage their teams and projects. It's particularly useful for larger organizations (n > 30).

### Architecture
- **Backend**: Django with GraphQL API (Strawberry)
- **Frontend**: Remix + React with Material-UI
- **Database**: PostgreSQL
- **AI Integration**: OpenAI/LangChain for assistant features

## Development Setup

### Starting the Development Environment
```bash
docker compose up
```

This starts all services: frontend (React/Remix), backend (Django), and database (PostgreSQL).

### Key Services
- Frontend: http://localhost:3000 (Remix/React)
- Backend: Django with GraphQL endpoint
- Database: PostgreSQL

### Database Management
After making model changes, run migrations:
```bash
docker compose run backend python manage.py migrate
```

## Project Structure

```
├── backend/           # Django backend
│   ├── success/       # Main Django app
│   │   ├── models.py  # Database models
│   │   ├── schema.py  # GraphQL schema
│   │   └── ...
├── frontend/          # Remix + React frontend
│   ├── app/
│   │   ├── routes/    # Remix routes
│   │   ├── components/ # React components
│   │   └── ...
├── docs/              # Documentation
└── examples/          # Docker compose examples
```

## Core Features

1. **People Management**: Track team members, progress, and notes
2. **Project Management**: Organize projects and track deliverables (in progress)
3. **Link Management**: Save and organize relevant resources with click tracking
4. **AI Assistant**: Basic AI integration for management insights (expanding)

## Key Models & Concepts

- **Person**: Team member management with logging
- **Project**: Project tracking and organization
- **Link**: Resource management with click analytics
- **SearchIndex**: Full-text search functionality
- **AssistantAnswer**: AI-generated responses and templates

## Common Development Tasks

### Adding New Features
- Backend: Add models in `models.py`, update GraphQL schema in `schema.py`
- Frontend: Create routes in `app/routes/`, components in `app/components/`
- Database: Always run migrations after model changes

### Working with AI Features
- AI capabilities are in `assistant.py`
- Uses OpenAI API and LangChain
- Templates stored in `PromptTemplate` model

## Environment Variables
Required environment variables (set in docker-compose.yaml):
- `SECRET_KEY`: Django secret key
- `OPENAI_API_KEY`: For AI features
- Database credentials for PostgreSQL

## Notes for Claude
- No test suite currently exists
- No linting/typecheck commands configured
- Project is in alpha stage and evolving rapidly
- Focus on people management, project tracking, and AI-enhanced workflows
- Single tenant architecture designed for small to medium data loads