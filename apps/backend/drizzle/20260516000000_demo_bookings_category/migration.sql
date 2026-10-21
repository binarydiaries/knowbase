-- Bootstrap this table for fresh databases; legacy deployments already created it.
CREATE TABLE IF NOT EXISTS "demo_bookings" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"company" text NOT NULL,
	"phone" text,
	"message" text,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "demo_bookings_email_idx" ON "demo_bookings" ("email");

--> statement-breakpoint
ALTER TABLE "demo_bookings" ADD COLUMN IF NOT EXISTS "category" text;
