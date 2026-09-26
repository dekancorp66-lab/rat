/**
 * Thin fetch wrapper around the FastAPI backend's `/auth/*` endpoints.
 *
 * This is deliberately separate from `@/lib/ai.ts` (which runs server-side,
 * inside a TanStack `createServerFn`): login/register happen in the browser,
 * so they call the backend directly over `VITE_BACKEND_URL` (CORS-enabled in
 * `main.py`).
 */

const API_BASE = import.meta.env.VITE_BACKEND_URL ?? "http://127.0.0.1:8000";

export type AuthUser = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  is_premium: boolean;
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
  user: AuthUser;
};

export type ConversationSummary = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type Conversation = ConversationSummary & {
  messages: Array<{ id: string; role: "user" | "assistant"; content: string; created_at: string }>;
};

export class AuthApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function post<T>(path: string, body: unknown, token?: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail =
      typeof data?.detail === "string"
        ? data.detail
        : Array.isArray(data?.detail)
          ? data.detail.map((d: { msg?: string }) => d.msg).join(", ")
          : "Hitilafu isiyotarajiwa. Jaribu tena.";
    throw new AuthApiError(detail, res.status);
  }
  return data as T;
}

export const authApi = {
  register: (data: { full_name: string; email: string; phone: string; password: string }) =>
    post<AuthResponse>("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    post<AuthResponse>("/auth/login", data),
  me: async (token: string): Promise<AuthUser> => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new AuthApiError("Session imeisha muda wake", res.status);
    return res.json();
  },
  conversations: async (token: string): Promise<ConversationSummary[]> =>
    get<ConversationSummary[]>("/api/chat/conversations", token),
  createConversation: async (token: string, title?: string): Promise<ConversationSummary> =>
    post<ConversationSummary>("/api/chat/conversations", { title: title ?? "New conversation" }, token),
  conversation: async (token: string, id: string): Promise<Conversation> =>
    get<Conversation>(`/api/chat/conversations/${id}`, token),
};

async function get<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new AuthApiError(typeof data?.detail === "string" ? data.detail : "Request failed", res.status);
  return data as T;
}
