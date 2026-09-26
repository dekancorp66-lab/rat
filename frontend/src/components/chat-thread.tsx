import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUp, LoaderCircle } from "lucide-react";
import { askJenga } from "@/lib/ai";
import { useSimpleAuth } from "@/lib/simple-auth/context";
import { briefFromText } from "@/lib/construction/estimate";
import { useJenga } from "@/lib/store";
import { Button } from "./ui/button";
import { cn } from "@/lib/cn";
import { useLanguage } from "@/contexts/language-context";

export function ChatThread({
  compact = false,
  seed,
  conversationId,
  onConversationId,
  onConversationChanged,
}: {
  compact?: boolean;
  seed?: string;
  conversationId?: string;
  onConversationId?: (id: string) => void;
  onConversationChanged?: () => void;
}) {
  const { messages, addMessage, upsertProjectFromBrief, chatRevision } =
    useJenga();

  const { token } = useSimpleAuth();
  const { language } = useLanguage();

  const [text, setText] = useState(seed ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({
      top: scroller.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, busy]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();

    const content = text.trim();

    if (!content || busy) return;

    setText("");
    setError(null);

    const brief = briefFromText(
      content,
      useJenga.getState().project?.brief
    );

    addMessage({
      role: "user",
      content,
    });

    upsertProjectFromBrief(brief);

    setBusy(true);

    try {
      const history = [
        ...useJenga.getState().messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      ].slice(-10);

      const res = await askJenga({
        data: {
          messages: history,
          token: token ?? undefined,
          conversationId,
        },
      });

      if (res.ok) {
        onConversationId?.(res.conversation_id);

        addMessage({
          role: "assistant",
          content: res.text,
        });

        onConversationChanged?.();
      } else {
        addMessage({
          role: "assistant",
          content:
            "Hapa kuna makadirio ya haraka kutoka kwa kikokotoo chetu. Andika tena kama unataka maelezo zaidi.",
        });

        setError(res.error);
      }
    } catch {
      addMessage({
        role: "assistant",
        content:
          "Makadirio ya haraka yako hapa. Mtandao wa AI haujibu — jaribu tena baadaye.",
      });
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    setText("");
    setError(null);
  }, [chatRevision]);

  /*
   * Reusable prompt form.
   * This lets us place the same input:
   * - next to the heading when there are no messages
   * - at the bottom after chatting has started
   */
  const promptForm = (
    <form
      onSubmit={onSubmit}
      className={cn(
        "flex w-full items-center gap-2 rounded-[28px]",
        "border border-white/80 bg-white/60 p-2",
        "shadow-[0_8px_24px_rgba(64,88,114,0.08)]",
        "backdrop-blur-sm"
      )}
    >
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={
          language === "sw"
            ? "Eleza nyumba unayotaka kujenga…"
            : "Describe the home you want to build…"
        }
        className="
          h-12
          min-w-0
          flex-1
          rounded-full
          border-0
          bg-transparent
          px-6
          text-[15px]
          text-[#1b2430]
          outline-none
          placeholder:text-[#5a6472]
        "
      />

      <Button
        type="submit"
        size="icon"
        disabled={busy || !text.trim()}
        aria-label="Tuma"
        className="
          h-11
          w-11
          shrink-0
          shadow-none
          disabled:cursor-not-allowed
          disabled:opacity-50
        "
      >
        <ArrowUp className="size-4" />
      </Button>
    </form>
  );

  return (
    <div
      className={cn(
        "flex flex-col",
        compact
          ? "h-[min(540px,65vh)] min-h-[360px] sm:min-h-[420px]"
          : "h-full min-h-0"
      )}
    >
      {/* CHAT AREA */}
      <div
        ref={scroller}
        className="min-h-0 flex-1 overflow-y-auto px-1 py-1"
      >
        {messages.length === 0 ? (
          /* EMPTY STATE */
          <div
            className="
              flex
              h-full
              min-h-[360px]
              flex-col
              items-center
              justify-start
              px-6
              pt-8
              text-center
            "
          >
            <h2
              className="
                mb-5
                text-4xl
                font-medium
                tracking-[-0.04em]
                text-[#1b2430]
                md:text-5xl
              "
            >
              {language === "sw"
                ? "Sasa ni zamu yako"
                : "Now it is your turn"}
            </h2>

            {/* PROMPT NEXT TO HEADING */}
            <div className="w-full max-w-[900px]">
              {promptForm}
            </div>
          </div>
        ) : (
          /* MESSAGES */
          <>
            <div className="flex flex-col gap-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "flex",
                    m.role === "user"
                      ? "justify-end"
                      : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[92%] rounded-[24px] px-4 py-3",
                      "text-[13px] leading-relaxed shadow-sm sm:text-sm",
                      m.role === "user"
                        ? "bg-[#0c3f6e] text-white"
                        : "border border-[#d7d0c8] bg-white/65 text-[#1b2430]"
                    )}
                  >
                    <p className="prose-jenga whitespace-pre-wrap">
                      {m.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* LOADING */}
            {busy ? (
              <div className="flex items-center gap-2 px-2 py-2 text-sm text-[#3b4a5a]">
                <LoaderCircle className="size-4 animate-spin text-[#0c3f6e]" />

                {language === "sw"
                  ? "Inachakata makadirio…"
                  : "Processing your request…"}
              </div>
            ) : null}

            {/* ERROR */}
            {error ? (
              <p className="px-2 text-xs text-[#0c3f6e]">
                {error}
              </p>
            ) : null}
          </>
        )}
      </div>

      {/* BOTTOM PROMPT - ONLY AFTER CHAT STARTS */}
      {messages.length > 0 ? (
        <div className="pt-3">
          {promptForm}
        </div>
      ) : null}
    </div>
  );
}