import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MoreVertical, X } from "lucide-react";

import { ChatThread } from "@/components/chat-thread";
import { ChatHistory } from "@/components/chat-history";
import { useJenga } from "@/lib/store";
import { useLanguage } from "@/contexts/language-context";
import {
  authApi,
  type ConversationSummary,
} from "@/lib/simple-auth/client";
import { useSimpleAuth } from "@/lib/simple-auth/context";

export const Route = createFileRoute("/anza/")({
  component: ChatPage,
});

function ChatPage() {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string>();
  const [historyRevision, setHistoryRevision] = useState(0);

  const { t } = useLanguage();
  const { token } = useSimpleAuth();

  const clearChat = useJenga((s) => s.clearChat);

  /*
   * Start a new conversation
   */
  const startNewChat = () => {
    clearChat();
    setConversationId(undefined);
    setHistoryOpen(false);
  };

  /*
   * Open an existing conversation
   */
  const openConversation = async (
    conversation: ConversationSummary
  ) => {
    if (!token) return;

    try {
      const data = await authApi.conversation(
        token,
        conversation.id
      );

      useJenga.getState().setMessages(
        data.messages.map((message) => ({
          id: message.id,
          role: message.role,
          content: message.content,
          createdAt: new Date(
            message.created_at
          ).getTime(),
        }))
      );

      setConversationId(data.id);
      setHistoryOpen(false);
    } catch {
      // Chat history provides a retry path on refresh.
    }
  };

  /*
   * History panel
   */
  const historyPanel = (
    <ChatHistory
      activeId={conversationId}
      refreshKey={historyRevision}
      onNew={startNewChat}
      onSelect={openConversation}
    />
  );

  return (
    <div
      className="
        flex
        h-full
        w-full
        flex-1
        overflow-hidden
        bg-[#f5e2d4]
      "
      >
    
      {/* =========================================================
          MAIN AREA
      ========================================================= */}
      <section
        className="
          flex
          min-w-0
          flex-1
          flex-col
          bg-[#f5e2d4]
          p-3
          sm:p-5
        "
      >
        {/* =======================================================
            HISTORY BUTTON (three dots — opens chat history)
        ======================================================= */}
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            aria-label={t.ai.history}
            title={t.ai.history}
            className="
              grid
              size-9
              place-items-center
              rounded-full
              border
              border-[#e8d3c4]
              bg-[#fffdf9]
              text-[#4a0101]
              shadow-sm
              transition
              hover:bg-white
            "
          >
            <MoreVertical className="size-4" />
          </button>
        </div>

        {/* =======================================================
            MAIN CHAT CARD
        ======================================================= */}
        <div
          className="
            min-h-0
            flex-1
            rounded-[30px]
            border
            border-white/80
            bg-[#f9ede2]
            p-3
            shadow-[0_12px_35px_rgba(74,1,1,0.05)]
            sm:p-5
          "
        >
          <ChatThread
            conversationId={conversationId}
            onConversationId={setConversationId}
            onConversationChanged={() =>
              setHistoryRevision((value) => value + 1)
            }
          />
        </div>
      </section>

      {/* =========================================================
          HISTORY DRAWER
      ========================================================= */}
      {historyOpen ? (
        <div className="fixed inset-0 z-50">
          {/* Overlay */}
          <button
            type="button"
            className="
              absolute
              inset-0
              bg-[#4a0101]/25
              backdrop-blur-[2px]
            "
            aria-label="Funga history"
            onClick={() => setHistoryOpen(false)}
          />

          {/* Drawer */}
          <aside
            className="
              absolute
              inset-y-0
              left-0
              flex
              w-[min(18rem,85vw)]
              flex-col
              border-r
              border-[#ead2c2]
              bg-[#fffaf5]
              shadow-2xl
            "
          >
            {/* Drawer header */}
            <div
              className="
                flex
                items-center
                justify-between
                border-b
                border-[#ead2c2]
                px-4
                py-3
              "
            >
              <span
                className="
                  font-semibold
                  text-[#4a0101]
                "
              >
                {t.ai.history}
              </span>

              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                className="
                  grid
                  size-9
                  place-items-center
                  rounded-full
                  text-[#4a0101]
                  transition
                  hover:bg-[#f5e2d4]
                "
                aria-label="Funga history"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Drawer content */}
            <div className="min-h-0 flex-1">
              {historyPanel}
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}