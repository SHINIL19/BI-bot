# Change Log
All notable changes to this project will be documented in this file.

- UTC timestamp: 2026-03-03T11:15:00Z
- Files modified: `package.json`, `src/app/api/chat/route.ts`, `src/lib/use-custom-chat.ts`, `src/app/page.tsx`, `tests/chat.spec.ts`
- Summary: Successfully integrated Gemini 2.5 Flash via Vercel AI SDK. Added tool calling and Live API Trace visualization directly in the Dashboard UI. Configured mock mode toggling to respect live AI fetches. Created playwright E2E tests for mock and live chat. Disabled Turbopack during dev to solve globals.css node evaluation errors. 
- Prompt or reason: User request to switch provider to Gemini and complete Phase 3/4 tasks for live data fetches. 
- Commit reference: N/A

- UTC timestamp: 2026-03-03T11:25:00Z
- Files modified: `package.json`, `package-lock.json`, `src/app/api/chat/route.ts`
- Summary: Upgraded `@ai-sdk/google` to latest and `ai` to `4.1.66`. Removed `await` from `streamText` and added a TypeScript bypass for the `LanguageModelV1` / `LanguageModelV3` internal typing difference. This resolves a Zod parsing bug when Gemini-2.5-flash returns empty `parts` arrays.
- Prompt or reason: User reported a Zod "invalid_type" exception missing the "parts" array during live data queries.
- Commit reference: pending
