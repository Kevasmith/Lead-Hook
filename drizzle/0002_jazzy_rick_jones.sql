CREATE TABLE "settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"twilio_account_sid" text,
	"twilio_auth_token" text,
	"twilio_from_number" text,
	"resend_api_key" text,
	"openai_api_key" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
