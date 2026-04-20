ALTER TABLE "activities" ADD COLUMN "direction" text DEFAULT 'outbound' NOT NULL;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "message" text;