# Corp Law AI

Live URL: https://corp-law-ai.vercel.app/

A jurisdiction-aware corporate law assistant built with Next.js, Gemini 2.5 Flash, and PostgreSQL. Users type a legal question, and the app streams a structured response broken into section cards — each with a topic, summary, bullet-point analysis, legal term tooltips, confidence score, and cited references.

---

## Features

- **Streaming structured responses** via Vercel AI SDK's `streamObject`, so cards appear progressively as Gemini generates them
- **Accordion card UI** — each response section is a collapsible card; clicking a collapsed card expands it while others shrink to labelled tabs
- **Legal term tooltips** — specialized terms in the response text are underlined and show plain-English definitions on hover
- **Jurisdiction selector** — stored in `localStorage`, passed to the system prompt to tailor answers to a specific country
- **Guest + authenticated sessions** — unauthenticated users get a 90-day cookie-based guest ID; Google OAuth via NextAuth upgrades them to a named account
- **Sticky note aesthetic** — messages and input are styled as physical sticky notes with alternating yellow/navy/blue themes

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| AI | Gemini 2.5 Flash via `@ai-sdk/google` |
| Streaming | Vercel AI SDK `streamObject` |
| Auth | NextAuth v4 with Google OAuth |
| Database | PostgreSQL via Prisma 7 + `@prisma/adapter-pg` |
| Styling | Tailwind CSS v4 |
| UI Primitives | Radix UI (tooltip) |

---

## Getting Started

### Prerequisites

- Node.js 20+
- A PostgreSQL database (e.g. Neon, Supabase, or local)
- A Google Cloud project with OAuth 2.0 credentials
- A Google AI Studio API key for Gemini

### Environment Variables

Create a `.env.local` file in the project root:

```env
DATABASE_URL=postgresql://...
GEMINI_API_KEY=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```

### Install & Run

```bash
npm install
npx prisma migrate deploy   # applies migrations to your database
npm run dev
```

The build script runs `prisma generate` automatically before `next build`.

---

## Project Structure

```
/
├── app/
│   ├── layout.tsx                  # Root layout — fonts, AuthProvider wrapper
│   ├── page.tsx                    # Landing page with hero cards and chat input
│   ├── globals.css                 # Tailwind import + scrollbar utilities
│   ├── chat/
│   │   ├── page.tsx                # Static /chat route (stub layout)
│   │   └── [sessionId]/page.tsx   # Active chat page — streaming, message state
│   └── api/
│       ├── auth/[...nextauth]/route.ts   # NextAuth catch-all handler
│       ├── chat/route.ts                 # POST — streams Gemini response
│       └── sessions/
│           ├── route.ts                  # GET (list) / POST (create) sessions
│           └── [id]/route.ts             # GET (fetch) / DELETE session by ID
│
├── components/
│   ├── Header.tsx          # Jurisdiction selector, app title, auth controls
│   ├── Sidebar.tsx         # Session list with create/delete actions
│   ├── ChatInput.tsx       # Sticky-note input widget with modal overlay
│   ├── MessageBubble.tsx   # Collapsed note card + expanded modal with all sections
│   ├── SectionCard.tsx     # Individual section card with tooltip rendering
│   ├── ReferencesList.tsx  # Legal references list with external links
│   ├── HeroCards.tsx       # Landing page capability cards
│   ├── ChatLayout.tsx      # Static demo layout (not used in production flow)
│   ├── AuthProvider.tsx    # Thin wrapper around NextAuth SessionProvider
│   └── ui/
│       └── tooltip.tsx     # Radix-based tooltip component
│
├── lib/
│   ├── prompts.ts          # System prompt builder — the core AI instruction set
│   ├── auth.ts             # NextAuth config + manual Prisma adapter
│   ├── prisma.ts           # Prisma client singleton with pg pool
│   ├── theme.ts            # Sticky note colour theme definitions
│   ├── guest.ts            # Guest ID cookie helper (create/read)
│   └── gemini.ts           # Direct Gemini SDK helper (legacy, not used by chat route)
│
├── prisma/
│   ├── schema.prisma       # Database schema — ChatSession, Message, User, auth tables
│   └── migrations/         # SQL migration history
│
├── prisma.config.ts        # Prisma CLI config (points to schema, loads .env.local)
├── next.config.ts          # Next.js config — remote image domains
├── tsconfig.json           # TypeScript config
├── postcss.config.mjs      # PostCSS config for Tailwind v4
└── package.json            # Dependencies and scripts
```

---

## How a Request Flows

1. User types a question into `ChatInput` and submits.
2. `app/page.tsx` POSTs to `/api/sessions` to create a new `ChatSession`, then redirects to `/chat/[sessionId]?initialMessage=...`.
3. `app/chat/[sessionId]/page.tsx` detects the `initialMessage` query param and calls `handleSendMessage`, which invokes the Vercel AI SDK `useObject` hook against `/api/chat`.
4. `/api/chat/route.ts` loads conversation history from Postgres, saves the user message, then calls `streamObject` with the Gemini model and the schema-validated response shape. The system prompt in `lib/prompts.ts` instructs Gemini to return raw JSON matching that schema.
5. Partial objects stream back to the client. `MessageBubble` renders the growing `partialObject` live — each section card appears as Gemini finishes it.
6. On stream completion, `onFinish` saves the full JSON response as an `ASSISTANT` message in Postgres.

---

## Key Design Decisions

**Manual Prisma adapter for NextAuth** — `lib/auth.ts` implements the adapter interface by hand because the Prisma client is generated to a custom output path (`prisma/generated`), which breaks the auto-detection in `@auth/prisma-adapter`.

**`useObject` not `useChat`** — the AI response is a structured object (sections, legalTerms, references, confidence), not a plain string stream. `experimental_useObject` from `@ai-sdk/react` streams and validates it against the Zod schema as it arrives.

**Memoized layout chrome** — `Header` and `Sidebar` are wrapped in `memo()` in the chat page to prevent auth re-renders from clearing the `isStreaming` state mid-stream.

**Guest sessions** — `ChatSession.userId` is nullable. Unauthenticated users are identified by a `corplaw_guest_id` httpOnly cookie (90-day TTL). The same access-control helper (`canAccess` in `/api/sessions/[id]/route.ts`) handles both authenticated and guest ownership checks.

---

## Codebase Navigation Guide

### Read these files to understand the codebase

| File | Why it matters |
|---|---|
| `lib/prompts.ts` | Defines the entire AI response structure and all model instructions — changing anything here changes every response |
| `app/api/chat/route.ts` | The main backend endpoint; shows how history is loaded, how streaming works, and how responses are persisted |
| `app/chat/[sessionId]/page.tsx` | The main frontend; owns all streaming state, message grouping, and optimistic rendering |
| `components/MessageBubble.tsx` | The most complex component; handles both the collapsed note view and the full-screen modal with accordion sections |
| `components/SectionCard.tsx` | Renders a single section card; contains the legal term tooltip injection logic |
| `prisma/schema.prisma` | Defines every table and relation in the database |
| `lib/auth.ts` | Google OAuth setup plus the manual NextAuth adapter — explains the custom Prisma path workaround |
| `lib/prisma.ts` | Shows how the Prisma client is wired to the pg pool adapter for edge-compatible connections |
| `lib/theme.ts` | All sticky-note colour tokens used across `ChatInput`, `MessageBubble`, and the chat page |

### Ignore these — generated, compiled, or non-essential

| Path | Why you can skip it |
|---|---|
| `prisma/generated/` | Auto-generated Prisma client — rebuilt by `prisma generate` on every build; never edit by hand |
| `.next/` | Next.js build output |
| `node_modules/` | Third-party dependencies |
| `prisma/migrations/migration_lock.toml` | Lock file managed by the Prisma CLI |
| `temp_prisma/` | Throwaway scaffold directory left over from project initialisation; not wired into the application |
| `components/ChatLayout.tsx` | Static demo component with hardcoded placeholder messages; not used in the live application flow |
| `lib/gemini.ts` | Legacy direct-SDK helper predating the AI SDK integration; not called by any current route |
| `next-env.d.ts` | Auto-generated Next.js TypeScript declarations |
| `*.tsbuildinfo` | TypeScript incremental build cache |
| `.vercel/` | Vercel deployment metadata |

---

## Database Schema Overview

```
User ──< Account          (OAuth provider accounts)
User ──< AuthSession      (NextAuth JWT sessions)
User ──< ChatSession      (chat history, nullable — guest sessions have no User)
ChatSession ──< Message   (USER and ASSISTANT turns, stored as raw JSON for ASSISTANT)
VerificationToken         (email magic-link tokens, required by NextAuth)
```

`Message.content` for `ASSISTANT` rows is the full JSON object stringified — the same shape defined in `lib/prompts.ts` and validated by the Zod schema in the chat route.
