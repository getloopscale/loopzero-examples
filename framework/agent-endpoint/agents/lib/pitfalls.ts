/**
 * The two things that stop a correct-looking call from working.
 *
 * This file lives in `agents/lib/` on purpose, and that is the first lesson about the directory:
 * a `.ts` under `agents/` becomes a route, so `agents/pitfalls.ts` would have been served at
 * `POST /api/agents/pitfalls`. Thirteen names are reserved as composition concerns —
 * `tools skills prompts lib hooks channels connections subagents schedules sandbox workflows evals
 * memory` — and a file under one of them is never a route.
 */

// #region lesson:pitfall-csrf-header
/**
 * A state-changing route is CSRF-protected by default, and nobody switched that on.
 *
 *   WRONG — a plain fetch, and the reply is not the agent's:
 *     await fetch("/api/agents/chat", { method: "POST", body })
 *     // 403 {"error":{"code":"CSRF_FAILED","message":"Missing X-LoopZero-Action header"}}
 *
 * The typed client and `useAgent` send the header for you, so this only bites callers that build
 * the request by hand — a curl, a test, another service. It reads as "my agent is broken" and is
 * really "the request never reached the agent".
 */
export const AGENT_REQUEST_HEADERS = {
  "content-type": "application/json",
  "X-LoopZero-Action": "1",
} as const;
// #endregion

// #region lesson:pitfall-provider-registry
/**
 * The framework routes to FEWER providers than the SDK lists, and the difference is not documented
 * in the model id you write.
 *
 * `@getloopscale/loopzero-sdk` ships a catalog of 43. `@getloopscale/loopzero-agents` keeps its own registry, and a model id
 * whose prefix is not in it is refused before any request leaves the process:
 *
 *   Model "lmstudio/…" declares provider "lmstudio", which is not registered.
 *   Registered providers: openrouter, openai, anthropic, ollama.
 *
 * That text is written to the SERVER LOG. The HTTP response carries only a 500 saying the agent has
 * no usable provider credential, so read the log when a request fails this way.
 *
 * So a provider that works in a plain `Agent.create` script can fail inside a loopzero app. The
 * message names the fix — `registerProvider({ name: 'lmstudio', … })` — and the registered four
 * are what a `.model(...)` may use without it.
 */
export const FRAMEWORK_REGISTERED_PROVIDERS = ["openrouter", "openai", "anthropic", "ollama"] as const;
// #endregion
