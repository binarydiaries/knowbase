## Architecture

src/
│
├── agent/
│   └── graph.ts          ← entry point only (langgraph.json points here)
│                            thin file — just imports and exports the compiled graph
│
├── graph/
│   ├── index.ts          ← assembles + compiles the parent graph
│   ├── state.ts          ← InputSchema, OutputSchema, OverallStateSchema + domain types
│   ├── config.ts         ← GraphConfigSchema (Zod, for Studio configurable panel)
│   │
│   ├── nodes/            ← one file per node, named after what it does
│   │   ├── load-agent.ts
│   │   ├── extract-entities.ts
│   │   ├── detect-intent.ts
│   │   ├── rewrite-query.ts
│   │   ├── vector-search.ts
│   │   ├── generate-response.ts
│   │   ├── load-workflow.ts
│   │   ├── check-requirements.ts
│   │   ├── execute-actions.ts
│   │   └── persist-turn.ts
│   │
│   ├── subgraphs/        ← each subgraph is one file (builds + compiles)
│   │   ├── rag.ts
│   │   ├── workflow.ts
│   │   └── data-collection.ts
│   │
│   └── edges.ts          ← all routing/conditional edge functions in one place
│
├── actions/              ← action executors (one per type)
│   ├── index.ts          ← dispatch table: actionType → executor fn
│   ├── save-lead.ts
│   ├── api-trigger.ts
│   └── calendar-booking.ts
│
├── rag/
│   ├── retrieval.ts      ← pgvector similarity search
│   └── embeddings.ts     ← embed query helper
│
├── db/
│   ├── index.ts          ← Drizzle client
│   └── schema.ts         ← table definitions (only tables the graph needs)
│
├── integrations/
│   └── llm.ts            ← LLM factory (OpenAI default, Anthropic/Gemini later)
│
└── utils/
├── messages.ts       ← getLastUserMessage, extractText helpers
└── template.ts       ← {{variable}} resolver used by api-trigger