import { boolean, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { user } from "./auth-schema"

export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  source: text("source").notNull(),
  status: text("status", { enum: ["new", "contacted", "replied", "closed"] })
    .notNull()
    .default("new"),
  notes: text("notes"),
  qualityScore: integer("quality_score").default(50),
  isSpam: boolean("is_spam").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastContactedAt: timestamp("last_contacted_at", { withTimezone: true }),
})

export const activities = pgTable("activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["sms", "email", "call"] }).notNull(),
  direction: text("direction", { enum: ["outbound", "inbound"] }).notNull().default("outbound"),
  message: text("message"),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
  outcome: text("outcome", { enum: ["sent", "replied", "failed"] }).notNull(),
})

export const settings = pgTable("settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  twilioAccountSid: text("twilio_account_sid"),
  twilioAuthToken: text("twilio_auth_token"),
  twilioFromNumber: text("twilio_from_number"),
  resendApiKey: text("resend_api_key"),
  resendFromEmail: text("resend_from_email"),
  openaiApiKey: text("openai_api_key"),
  logoUrl: text("logo_url"),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  workspaceType: text("workspace_type", { enum: ["business", "personal"] }),
  businessName: text("business_name"),
  alertPhone: text("alert_phone"),
  alertEmail: text("alert_email"),
  alertSmsEnabled: boolean("alert_sms_enabled").default(false),
  alertEmailEnabled: boolean("alert_email_enabled").default(false),
  bookingLink: text("booking_link"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const templates = pgTable("templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  channel: text("channel", { enum: ["sms", "email"] }).notNull(),
  subject: text("subject"),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().unique().references(() => user.id, { onDelete: "cascade" }),
  jobTitle: text("job_title"),
  phone: text("phone"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export type Settings = typeof settings.$inferSelect
export type Lead = typeof leads.$inferSelect
export type NewLead = typeof leads.$inferInsert
export type Activity = typeof activities.$inferSelect
export type NewActivity = typeof activities.$inferInsert
export type Template = typeof templates.$inferSelect
export type NewTemplate = typeof templates.$inferInsert
export type Profile = typeof profiles.$inferSelect
