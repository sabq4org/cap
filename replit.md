# Replit.md - كبسولة (Capsule)

## Project Status: ✅ COMPLETE & READY FOR DEPLOYMENT

**Last Updated**: February 5, 2026

### Implementation Status

All core features have been successfully implemented and tested:

✅ **Authentication System**
- Replit Auth (OIDC) integration complete
- Session management with PostgreSQL storage
- Protected routes middleware
- Critical bug fix: isAuthenticated middleware now returns proper 401 JSON responses

✅ **AI Health Assistant**
- OpenAI GPT-5 integration via Replit AI Integrations
- Arabic-language medical system prompts
- Chat sessions and message history
- Citation support for medical sources
- Tested end-to-end with successful responses

✅ **Health Profile & Trackers**
- Personal health profile management
- Vital signs tracking (blood pressure, blood sugar, weight, heart rate, etc.)
- Display of latest measurements
- Symptom checker component
- All connected to backend APIs

✅ **Nutrition Tracking**
- Meal logging interface
- Nutritional data entry
- Calorie and macronutrient tracking
- Tested successfully with meal creation

✅ **Medical Content Hub**
- Article management system with seeding
- 3 sample medical articles (duplicate prevention implemented)
- Search and filtering functionality
- Category-based navigation
- Medical review information display

✅ **Frontend & UX**
- Full RTL support for Arabic
- IBM Plex Sans Arabic typography
- Responsive design (mobile and desktop)
- Green health-focused theme
- Dark mode support
- Landing page with proper contrast (accessibility verified)
- All pages tested and working

✅ **Testing**
- Comprehensive end-to-end testing with Playwright
- All user flows verified: auth, chat, profile, nutrition, articles, logout
- No critical issues remaining

### Known Minor Issues
- Occasional transient OpenAI API errors (messages persist correctly)
- OIDC test claims require ASCII names due to cookie limitations (production uses real OIDC)

---

## Overview

كبسولة is an Arabic-language healthcare platform that provides intelligent health assistance, nutrition tracking, and medical content. The platform aims to be a comprehensive health portal offering personalized health recommendations, vital sign tracking, and AI-powered health consultations - all in Arabic with full RTL (Right-to-Left) support.

The application combines modern web technologies with AI capabilities to deliver:
- An intelligent health assistant powered by LLM with RAG (Retrieval-Augmented Generation)
- Personal health profiles with vital sign tracking (blood pressure, blood sugar, weight, etc.)
- Nutrition logging and analysis
- Medical content hub with physician-reviewed articles
- Symptom checking and health recommendations

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with Vite as the build tool
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom theme supporting both light and dark modes
- **Typography**: IBM Plex Sans Arabic (primary) and Inter (secondary) for optimal Arabic readability
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **RTL Support**: Full right-to-left layout with Arabic-first design

**Design Philosophy**: Healthcare-focused design inspired by Headspace and Linear, emphasizing clarity, warmth, and medical trust. Custom color system with semantic tokens for consistent theming.

### Backend Architecture

**Server Framework**: Express.js running on Node.js
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful endpoints with JSON responses
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Session Management**: Express sessions with PostgreSQL storage (connect-pg-simple)

**Microservices-Ready Structure**: The codebase is organized to support future microservices migration with separated concerns:
- Authentication service (Replit Auth integration)
- Health profile management
- AI assistant and chat functionality
- Nutrition tracking
- Content management (articles)
- Analytics and tracking

### Authentication & Authorization

**Provider**: Replit Auth (OpenID Connect)
- OAuth2/JWT-based authentication flow
- Passport.js strategy for session management
- Secure session storage in PostgreSQL
- User profile syncing with OIDC claims

**Security Features**:
- HTTP-only secure cookies
- Session TTL of 7 days
- CSRF protection through session secrets
- Authenticated route middleware (`isAuthenticated`)

### Data Architecture

**Database**: PostgreSQL (via Neon serverless driver)
- **Schema Management**: Drizzle Kit for migrations
- **Connection**: WebSocket-based serverless connection pooling
- **Tables**:
  - `users` - User accounts and profiles
  - `sessions` - Express session storage
  - `health_profiles` - Personal health data (height, weight, conditions, medications, allergies, goals)
  - `trackers` - Time-series health metrics (blood pressure, blood sugar, heart rate, etc.)
  - `nutrition_entries` - Meal logging with nutritional data
  - `articles` - Medical content with review status and sources
  - `chat_sessions` - Conversation grouping for AI assistant
  - `chat_messages` - Individual messages with role (user/assistant)

**Data Modeling Strategy**:
- JSONB columns for flexible arrays (conditions, medications, tags, sources)
- Timestamp tracking for all records (createdAt, updatedAt)
- Cascade deletes for user-related data
- Indexing on session expiry for performance

### AI Integration

**Provider**: OpenAI-compatible API (via Replit AI Integrations)
- **Model Access**: GPT-series models without requiring personal API keys
- **Use Cases**:
  1. Health assistant conversations with medical context
  2. Symptom analysis and recommendations
  3. Nutrition analysis and meal suggestions

**AI Architecture**:
- System prompts in Arabic for culturally appropriate responses
- Structured JSON responses for citations and summaries
- Conversation history tracking for context-aware responses
- Safety prompts emphasizing general information vs. medical diagnosis

**RAG Approach** (Planned):
- Vector embeddings of medical articles for retrieval
- Citation system linking responses to verified medical content
- Future integration with vector stores (PGVector/Weaviate mentioned in design docs)

### Content Management

**Article System**:
- Markdown-based content storage
- Review workflow with status tracking (draft/published)
- Medical reviewer attribution
- Source citation with URLs
- Category and tag taxonomy
- Read time estimation
- SEO-friendly slugs

### Development & Deployment

**Build System**:
- Vite for frontend bundling with React Fast Refresh
- esbuild for server-side bundling
- TypeScript compilation checking without emit
- Path aliases (@/, @shared/, @assets/)

**Environment Configuration**:
- Development: `NODE_ENV=development` with hot reload
- Production: Optimized builds with static asset serving
- Database URL configuration for different environments

**Development Tools**:
- Replit-specific plugins (cartographer, dev banner, runtime error overlay)
- Vite middleware mode for integrated dev server
- Express logging middleware for API monitoring

### File Structure Philosophy

```
client/          - React frontend application
  src/
    components/  - Reusable UI components
    pages/       - Route-level page components
    hooks/       - Custom React hooks
    lib/         - Utilities and configurations
server/          - Express backend application
  routes.ts      - API endpoint definitions
  storage.ts     - Database abstraction layer
  openai.ts      - AI service integration
  replitAuth.ts  - Authentication setup
shared/          - Code shared between client and server
  schema.ts      - Database schema and types
```

**Design Decision**: Monorepo structure with shared TypeScript types ensures type safety across the full stack while maintaining clear separation of concerns.

## External Dependencies

### Core Infrastructure

- **Database**: PostgreSQL (Neon Serverless)
  - Serverless connection pooling via WebSockets
  - Automatic scaling and connection management
  
- **Authentication**: Replit Auth (OpenID Connect)
  - OAuth2 flow with JWT tokens
  - User profile management
  
- **AI Services**: Replit AI Integrations (OpenAI-compatible)
  - GPT model access without personal API keys
  - Conversation and completion endpoints

### Key Third-Party Libraries

**Frontend**:
- `@tanstack/react-query` - Server state management and caching
- `@radix-ui/*` - Accessible component primitives (20+ packages)
- `tailwindcss` - Utility-first CSS framework
- `wouter` - Lightweight routing
- `react-hook-form` + `@hookform/resolvers` - Form management
- `zod` - Runtime schema validation
- `lucide-react` - Icon library
- `date-fns` - Date manipulation

**Backend**:
- `express` - Web server framework
- `drizzle-orm` + `drizzle-kit` - Database ORM and migrations
- `@neondatabase/serverless` - PostgreSQL driver
- `passport` + `openid-client` - Authentication
- `express-session` + `connect-pg-simple` - Session management
- `openai` - AI API client

**Development**:
- `vite` + `@vitejs/plugin-react` - Build tooling
- `typescript` + `tsx` - Type safety and runtime
- `tailwindcss` + `autoprefixer` - Styling
- `esbuild` - Server bundling

### Design Assets

- **Fonts**: Google Fonts CDN
  - IBM Plex Sans Arabic (Arabic text)
  - Inter (English text, data display)
  
- **Images**: Stored in `attached_assets/` directory
  - Hero images and generated graphics
  - Favicon and branding assets

### Future Integration Points

Based on design documentation:
- Message broker (Kafka/RabbitMQ) for event-driven architecture
- Vector database (PGVector/Weaviate) for RAG implementation
- Object storage (S3-compatible) for media files
- Monitoring stack (Prometheus/Grafana)
- Logging aggregation (ELK stack)
- CI/CD pipeline (GitHub Actions)
- Infrastructure as Code (Terraform)