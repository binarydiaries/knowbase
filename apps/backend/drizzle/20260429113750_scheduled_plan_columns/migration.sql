ALTER TABLE "org_subscriptions" ADD COLUMN "scheduledPlan" text;--> statement-breakpoint
ALTER TABLE "org_subscriptions" ADD COLUMN "scheduledPlanAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "org_subscriptions" ADD COLUMN "scheduledProviderSubscriptionId" text;