ALTER TABLE "org_subscriptions" RENAME COLUMN "razorpaySubscriptionId" TO "providerSubscriptionId";--> statement-breakpoint
ALTER TABLE "org_subscriptions" RENAME COLUMN "razorpayCustomerId" TO "providerCustomerId";--> statement-breakpoint
ALTER TABLE "org_subscriptions" ADD COLUMN "provider" text DEFAULT 'razorpay' NOT NULL;--> statement-breakpoint
DROP INDEX "org_subscriptions_razorpay_sub_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "org_subscriptions_provider_sub_unique" ON "org_subscriptions" ("providerSubscriptionId");