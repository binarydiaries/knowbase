ALTER TABLE "org_subscriptions" DROP COLUMN "scheduledPlan";--> statement-breakpoint
ALTER TABLE "org_subscriptions" DROP COLUMN "scheduledPlanAt";--> statement-breakpoint
ALTER TABLE "org_subscriptions" DROP COLUMN "scheduledProviderSubscriptionId";--> statement-breakpoint
ALTER TABLE "org_subscriptions" ADD COLUMN "lastPaymentId" text;
