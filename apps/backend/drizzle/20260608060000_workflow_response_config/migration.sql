ALTER TABLE "workflows" DROP COLUMN "successMessage";
ALTER TABLE "workflows" ADD COLUMN "responseConfig" jsonb;
