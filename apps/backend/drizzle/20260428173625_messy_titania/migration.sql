CREATE TABLE "org_subscriptions" (
	"id" text PRIMARY KEY,
	"orgId" varchar(64) NOT NULL,
	"plan" text DEFAULT 'free' NOT NULL,
	"razorpaySubscriptionId" text,
	"razorpayCustomerId" text,
	"status" text DEFAULT 'free' NOT NULL,
	"currentPeriodEnd" timestamp with time zone,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "org_subscriptions_org_unique" ON "org_subscriptions" ("orgId");--> statement-breakpoint
CREATE UNIQUE INDEX "org_subscriptions_razorpay_sub_unique" ON "org_subscriptions" ("razorpaySubscriptionId");--> statement-breakpoint
CREATE INDEX "org_subscriptions_org_idx" ON "org_subscriptions" ("orgId");