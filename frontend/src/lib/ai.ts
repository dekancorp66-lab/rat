import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// NOTE: the system prompt, region/price data, and model call all live in the
// FastAPI backend. This file is now
// just a thin proxy: same validator, same input/output shape as before, so
// chat-thread.tsx and every other caller of askJenga() needs ZERO changes.

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const InputSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(12),
  // Bearer token from the browser's session (see src/lib/simple-auth). Optional:
  // the backend still answers without it, it just can't save history.
  token: z.string().optional(),
  conversationId: z.string().optional(),
});

// Set BACKEND_URL in your Node app's env (.env / hosting dashboard) to point
// at wherever the FastAPI service runs, e.g. http://localhost:8000 in dev,
// or https://api.yourdomain.com in production.
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

export const askJenga = createServerFn({ method: "POST" })
  .validator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(data.token ? { Authorization: `Bearer ${data.token}` } : {}),
        },
        body: JSON.stringify({ messages: data.messages, conversation_id: data.conversationId }),
      });

      // FastAPI always replies 200 with { ok, ... } for this endpoint (see
      // app/routers/chat.py), matching the old createServerFn handler's
      // behavior exactly - but guard anyway in case the service is down,
      // behind a proxy that 502s, etc.
      if (!res.ok) {
        return { ok: false as const, error: "Samahani, sijaweza kujibu sasa. Jaribu tena." };
      }

      const body = (await res.json()) as
        | { ok: true; text: string; conversation_id: string }
        | { ok: false; error: string };

      return body;
    } catch {
      // Backend unreachable (network error, DNS, connection refused, etc.)
      return { ok: false as const, error: "AI haipatikani kwa sasa. Tumia vikokotoo vilivyo kushoto." };
    }
  });
