# Railier

**Visual drag-and-drop guardrail builder for LLMs** - _Scratch for AI Governance_

![Railier](https://img.shields.io/badge/Railier-v0.1.0-6366f1?style=flat-square)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)

[**🚀 Live Demo**](https://railier.netlify.app) • [**📺 Watch Demo Video**](https://youtu.be/a2d6wdC7e7s)

## Overview

Railier is a no-code platform where anyone can visually design compliance rules, safety policies, and operational guardrails for AI systems. Think **Scratch for AI governance**.

## Features

- 🧩 **Visual Block Builder** - Drag-and-drop blocks to create guardrail logic
- 🤖 **AI-Powered Generation** - Describe guardrails in natural language (demo mode - no backend required)
- 📄 **Policy Import** - Extract rules from PDF/TXT/DOCX documents
- 🧪 **Test Runner** - Simulate and visualize guardrail execution
- ⚡ **Real-time Evaluation** - <100ms evaluation time
- 💾 **Local Storage** - All data stored in your browser

> **Note on Deployment**: The deployed frontend may not work as expected for AI features because Ollama is being used locally. Without a connection to the local backend/Ollama, AI generation will use fallback demo modes.

## Tech Stack

- **Frontend**: React 19, Vite, React Flow, TailwindCSS, Zustand
- **Storage**: Browser localStorage (no backend required!)
- **Monorepo**: Turborepo, pnpm

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 9+

### 1. Clone and Install Dependencies

```bash
# Install pnpm if needed
npm install -g pnpm

# Install JavaScript dependencies
pnpm install
```

### 2. Run the Application

```bash
# From project root - runs the frontend only
pnpm dev --filter web

# OR run everything (backend will show a message and exit)
pnpm dev
```

This will start:

- **Frontend** (React): http://localhost:3000

**That's it!** No database or backend needed - everything works in your browser!

## Project Structure

```
railier/
├── apps/
│   ├── web/                # React frontend
│   │   ├── src/
│   │   │   ├── components/ # UI components
│   │   │   ├── store/      # Zustand state
│   │   │   └── lib/        # Utilities
│   │   └── ...
│   └── api/                # FastAPI backend
│       └── app/
│           ├── api/routes/ # API endpoints
│           ├── models/     # SQLAlchemy models
│           ├── schemas/    # Pydantic schemas
│           └── core/       # Config & database
├── packages/
│   └── shared/             # Shared TypeScript types
├── turbo.json              # Turborepo config
└── pnpm-workspace.yaml     # pnpm workspace
```

## Block Types

| Type          | Description           | Examples                                   |
| ------------- | --------------------- | ------------------------------------------ |
| **Input**     | Capture incoming data | User Message, Context Data                 |
| **Condition** | Boolean checks        | Contains Keywords, Check Role, Regex Match |
| **Logic**     | Combine conditions    | AND, OR, NOT gates                         |
| **Action**    | Take action           | Block, Allow, Warn, Require Approval       |
| **Data**      | Access data           | Policy Lookup, User Context                |
| **LLM**       | AI evaluation         | AI Evaluate, AI Classify                   |
| **Output**    | Final decision        | Decision Output                            |

## API Endpoints

| Method   | Endpoint                        | Description               |
| -------- | ------------------------------- | ------------------------- |
| `GET`    | `/api/guardrails`               | List all guardrails       |
| `POST`   | `/api/guardrails`               | Create guardrail          |
| `GET`    | `/api/guardrails/{id}`          | Get guardrail             |
| `PUT`    | `/api/guardrails/{id}`          | Update guardrail          |
| `DELETE` | `/api/guardrails/{id}`          | Delete guardrail          |
| `POST`   | `/api/guardrails/{id}/evaluate` | Evaluate input            |
| `POST`   | `/api/ai/generate-blocks`       | Generate blocks from text |
| `POST`   | `/api/ai/import-document`       | Import policy document    |

## Demo: Salary Protection Guardrail

1. Open Railier at http://localhost:3000
2. Click the **Sparkles** icon to open AI Assistant
3. Type: "Block salary questions"
4. Watch blocks appear on canvas
5. The blocks will automatically connect to create the guardrail
6. Click **Test** and try: "What is John's salary?"
7. See the guardrail block salary-related requests

## Data Storage

All guardrails are stored in your browser's localStorage:

- ✅ No backend or database required
- ✅ Works completely offline
- ✅ Fast and instant
- ✅ AI generation works in demo mode (pattern-based)
- ⚠️ Data is local to your browser
- ⚠️ Clearing browser data will delete guardrails

To export/import guardrails:

```javascript
// Export
const data = localStorage.getItem("railier_guardrails");
console.log(data);

// Import
localStorage.setItem("railier_guardrails", yourDataString);
```

## License

MIT
