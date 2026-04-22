ALTER TABLE "settings" ADD COLUMN "alert_phone" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "alert_email" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "alert_sms_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "alert_email_enabled" boolean DEFAULT false;