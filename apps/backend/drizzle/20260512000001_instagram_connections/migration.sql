CREATE TABLE "instagram_connections" (
	"id" text PRIMARY KEY,
	"orgId" varchar(64) NOT NULL UNIQUE,
	"pageAccessToken" text NOT NULL,
	"instagramAccountId" text NOT NULL,
	"username" text,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "ig_connections_org_idx" ON "instagram_connections" ("orgId");
