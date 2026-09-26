CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "messages" ADD COLUMN "conversation_id" TEXT;

INSERT INTO "conversations" ("id", "user_id", "title", "created_at", "updated_at")
SELECT 'legacy-' || "user_id", "user_id", 'Previous conversation', MIN("created_at"), MAX("created_at")
FROM "messages"
GROUP BY "user_id";

UPDATE "messages" SET "conversation_id" = 'legacy-' || "user_id";

ALTER TABLE "messages" ALTER COLUMN "conversation_id" SET NOT NULL;
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "conversations_user_id_updated_at_idx" ON "conversations"("user_id", "updated_at");