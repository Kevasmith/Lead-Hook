ALTER TABLE "leads" ADD COLUMN "quality_score" integer DEFAULT 50;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "is_spam" boolean DEFAULT false;