CREATE TABLE "org_subscriptions" (
	"id" text PRIMARY KEY,
	"orgId" varchar(64) NOT NULL,
	"plan" text DEFAULT 'free' NOT NULL,
	"provider" text DEFAULT 'razorpay' NOT NULL,
	"providerSubscriptionId" text,
	"providerCustomerId" text,
	"status" text DEFAULT 'free' NOT NULL,
	"currentPeriodEnd" timestamp with time zone,
	"scheduledPlan" text,
	"scheduledPlanAt" timestamp with time zone,
	"scheduledProviderSubscriptionId" text,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "org_subscriptions_org_unique" ON "org_subscriptions" ("orgId");--> statement-breakpoint
CREATE UNIQUE INDEX "org_subscriptions_provider_sub_unique" ON "org_subscriptions" ("providerSubscriptionId");--> statement-breakpoint
CREATE INDEX "org_subscriptions_org_idx" ON "org_subscriptions" ("orgId");