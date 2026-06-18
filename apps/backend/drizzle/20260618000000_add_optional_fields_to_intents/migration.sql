ALTER TABLE "intents" ADD COLUMN IF NOT EXISTS "optionalFields" text[] NOT NULL DEFAULT '{}';
