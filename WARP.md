# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Prerequisites
- Set up required API keys in `.env` file (copy from `.env.example`)
- Required keys: `GROQ_API_KEY`, `OPENAI_API_KEY`, `SERPER_API`, `BRAVE_SEARCH_API_KEY`

### Primary Development
```bash
# Install dependencies
npm install
# or
bun install

# Run development server (Next.js app on port 3000)
npm run dev
# or 
bun run dev

# Build production version
npm run build

# Start production server
npm run start

# Code formatting
npm run format
npm run format:check

# Linting
npm run lint
```

### Express API Backend
```bash
# Navigate to express-api directory
cd express-api

# Install dependencies
npm install
# or
bun install

# Start server (port 3005)
npm start
```

### Docker Development
```bash
# Build and run with Docker (edit docker-compose.yml first with API keys)
docker compose up -d  # for v2
# or
docker-compose up -d  # for v1
```

### Testing Individual Components
- Run specific component tests by importing and testing in browser at `localhost:3000`
- No dedicated test runner configured - relies on manual testing and TypeScript type checking

## Architecture Overview

### Core Application Structure
This is a **Perplexity-inspired LLM Answer Engine** built with Next.js 14, featuring:

- **Frontend**: React with Server Components and streaming UI
- **Backend**: Next.js API routes with server actions
- **AI Integration**: Multiple LLM providers (Groq, OpenAI, Ollama) with function calling
- **Search Integration**: Brave Search, Serper API, Google Search
- **RAG Pipeline**: LangChain.js for document processing and vector search
- **Caching**: Semantic caching with Upstash Redis
- **Rate Limiting**: Upstash Redis-based rate limiting

### Key Architectural Patterns

#### Streaming Architecture
- Uses Vercel AI SDK's `createStreamableValue` for real-time response streaming
- Server actions in `app/action.tsx` coordinate the entire pipeline
- UI updates progressively as data streams in (search results → LLM response → follow-ups)

#### Function Calling System
- Conditional UI rendering based on query content (maps, shopping, stocks, music)
- Tools defined in `app/tools/` directory for different capabilities
- Mention system (@tool) for invoking specific functionalities

#### RAG Pipeline Flow
1. **Search Phase**: Query multiple search providers simultaneously
2. **Content Processing**: Scrape and vectorize top search results
3. **LLM Generation**: Stream response using retrieved context
4. **Enhancement**: Generate follow-up questions and cache results

### Configuration System
Primary configuration in `app/config.tsx`:
- Model selection (Groq, OpenAI, Ollama)
- Search provider configuration
- RAG parameters (chunk size, overlap, similarity results)
- Feature toggles (function calling, caching, rate limiting)

### Component Architecture
- **Main UI**: `app/page.tsx` - Central chat interface
- **Answer Components**: `components/answer/` - Specialized renderers for different content types
- **Tools**: `app/tools/` - Backend processing utilities
- **UI Components**: Shadcn/ui components in `components/ui/`

### Key Dependencies
- **AI/LLM**: `ai` (Vercel SDK), `openai`, `langchain`, `@langchain/openai`
- **Search**: Custom integrations with Brave, Serper, Google APIs
- **Processing**: `cheerio` for HTML parsing, vector embeddings
- **UI**: `next-themes`, `radix-ui` components, `tailwindcss`
- **Optional**: `@upstash/redis`, `@upstash/semantic-cache`, `@upstash/ratelimit`

### Dual Architecture
The project includes both:
1. **Next.js Full-Stack App** (main): Complete web interface with streaming UI
2. **Express API** (`express-api/`): Headless API-only version for backend integration

## Development Guidelines

### Making Configuration Changes
Edit `app/config.tsx` to modify:
- LLM models and providers
- Search behavior and sources  
- RAG processing parameters
- Feature enablement (caching, rate limiting, function calling)

### Adding New Function Calling Tools
1. Create tool handler in `app/tools/mentionTools.tsx`
2. Add tool configuration in `app/tools/mentionToolConfig.tsx`
3. Create UI component in `components/answer/`
4. Update UI rendering logic in `app/page.tsx`

### Working with Environment Variables
- Copy `.env.example` to `.env` and fill in required API keys
- Optional services: Ollama, Upstash Redis, Spotify, AWS Bedrock, FAL.AI
- Docker: Edit `docker-compose.yml` environment section

### Styling and Components
- Uses Tailwind CSS with custom configuration in `tailwind.config.ts`
- Shadcn/ui component library configured in `components.json`
- Custom color scheme with dark mode support
- Component styling guidelines in `style.md`

### Search Provider Integration
- Primary: Serper API (default)
- Alternatives: Brave Search, Google Search
- Configure in `app/config.tsx` searchProvider field
- Implementations in `app/tools/searchProviders.tsx`

### Ollama Integration Notes
- Set `useOllamaInference` and/or `useOllamaEmbeddings` to true in config
- Requires Ollama running locally (default: `http://localhost:11434/v1`)
- Reduce RAG parameters for better performance with local models
- Follow-up questions not supported with Ollama models

### Performance Considerations
- Semantic caching reduces repeated API calls for similar queries
- Rate limiting prevents API abuse
- Adjust `textChunkSize`, `numberOfPagesToScan` for faster responses
- Consider using Ollama for local inference to reduce API costs

## Common Development Patterns

### Adding New Search Results Types
1. Extend interfaces in `app/page.tsx`
2. Add processing logic in `app/action.tsx`
3. Create display component in `components/answer/`
4. Update rendering logic in main page component

### Debugging Streaming Issues
- Check browser dev tools Network tab for streaming responses
- Add logging in `app/action.tsx` server action
- Verify API keys and rate limits
- Test with simple queries first

### Customizing LLM Behavior
- Modify prompts in `app/tools/streamingChatCompletion.tsx`
- Adjust context window and token limits in config
- Test with different model configurations for optimal performance