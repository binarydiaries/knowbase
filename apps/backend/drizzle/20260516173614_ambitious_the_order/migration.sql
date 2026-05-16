ALTER TYPE "type" ADD VALUE 'slack';--> statement-breakpoint
CREATE TABLE "demo_bookings" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"company" text NOT NULL,
	"phone" text,
	"message" text,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_flag_definitions" (
	"id" text PRIMARY KEY,
	"flag" varchar(128) NOT NULL,
	"description" text,
	"globalEnabled" boolean DEFAULT false NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "org_feature_flags" (
	"id" text PRIMARY KEY,
	"flag" varchar(128) NOT NULL,
	"orgId" varchar(64) NOT NULL,
	"enabled" boolean NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "slack_connections" (
	"id" text PRIMARY KEY,
	"orgId" varchar(64) NOT NULL UNIQUE,
	"botToken" text NOT NULL,
	"teamId" varchar(64) NOT NULL,
	"teamName" text NOT NULL,
	"botUserId" text NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "org_subscriptions" ADD COLUMN "currentPeriodStart" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "org_subscriptions" ADD COLUMN "lastPaymentId" text;--> statement-breakpoint
ALTER TABLE "org_subscriptions" DROP COLUMN "scheduledPlan";--> statement-breakpoint
ALTER TABLE "org_subscriptions" DROP COLUMN "scheduledPlanAt";--> statement-breakpoint
ALTER TABLE "org_subscriptions" DROP COLUMN "scheduledProviderSubscriptionId";--> statement-breakpoint
CREATE INDEX "demo_bookings_email_idx" ON "demo_bookings" ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "ffd_flag_unique" ON "feature_flag_definitions" ("flag");--> statement-breakpoint
CREATE UNIQUE INDEX "off_flag_org_unique" ON "org_feature_flags" ("flag","orgId");--> statement-breakpoint
CREATE INDEX "off_flag_idx" ON "org_feature_flags" ("flag");--> statement-breakpoint
CREATE INDEX "off_org_idx" ON "org_feature_flags" ("orgId");--> statement-breakpoint
CREATE INDEX "slack_connections_org_idx" ON "slack_connections" ("orgId");