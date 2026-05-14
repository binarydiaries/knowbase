CREATE TABLE "feature_flag_definitions" (
  "id" text PRIMARY KEY NOT NULL,
  "flag" varchar(128) NOT NULL,
  "description" text,
  "globalEnabled" boolean NOT NULL DEFAULT false,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX "ffd_flag_unique" ON "feature_flag_definitions" ("flag");

CREATE TABLE "org_feature_flags" (
  "id" text PRIMARY KEY NOT NULL,
  "flag" varchar(128) NOT NULL,
  "orgId" varchar(64) NOT NULL,
  "enabled" boolean NOT NULL,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX "off_flag_org_unique" ON "org_feature_flags" ("flag", "orgId");
CREATE INDEX "off_flag_idx" ON "org_feature_flags" ("flag");
CREATE INDEX "off_org_idx" ON "org_feature_flags" ("orgId");
