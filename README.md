# BI-bot

BI-bot is a Founder-Level AI Assistant designed to provide dynamic, real-time insights into company operations, work orders, and deals by directly querying live Monday.com boards. 

## Features

- **Live Data Integration**: Connects securely to Monday.com via GraphQL to fetch the latest schemas and items. 
- **Agentic AI**: Built with the Vercel AI SDK and Google's Gemini 1.5 Flash model. The agent is capable of autonomous tool calling to find board IDs, fetch schemas, investigate records, and perform granular searches.
- **Advanced Data Tools**: Includes specialized tools for searching items by column value (e.g., "Emergency" priority), filtering results, sorting by metrics, and calculating sums/averages across datasets.
- **Strict Data Governance**: Incorporates robust data validation context (handling messy dates, missing values, and unformatted currencies) right into the system prompt.
- **Glassmorphism UI**: A sleek, modern dashboard built with Next.js 15, Tailwind CSS, and shadcn/ui.
- **Live Action Trace**: Provides full backend visibility, showing the user exactly what tools the AI is executing under the hood.

## Architecture

- **Frontend**: Next.js (App Router), React, TailwindCSS, Framer Motion
- **Backend/AI**: Vercel AI SDK (`ai`, `@ai-sdk/google`)
- **Data Source**: Monday.com GraphQL API (`api.monday.com/v2`)

## Getting Started

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Configure Environment Variables in `.env.local`:
```env
GEMINI_API_KEY=your_gemini_api_key
MONDAY_API_TOKEN=your_monday_api_token
```

3. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
