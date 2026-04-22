ALTER TABLE "settings" ADD COLUMN "onboarding_completed" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "workspace_type" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "business_name" text;