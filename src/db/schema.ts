import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  source: text("source").notNull(),
  status: text("status", { enum: ["new", "contacted", "replied", "closed"] })
    .notNull()
    .default("new"),
  notes: text("notes"),
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
  twilioAccountSid: text("twilio_account_sid"),
  twilioAuthToken: text("twilio_auth_token"),
  twilioFromNumber: text("twilio_from_number"),
  resendApiKey: text("resend_api_key"),
  resendFromEmail: text("resend_from_email"),
  openaiApiKey: text("openai_api_key"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export type Settings = typeof settings.$inferSelect
export type Lead = typeof leads.$inferSelect
export type NewLead = typeof leads.$inferInsert
export type Activity = typeof activities.$inferSelect
export type NewActivity = typeof activities.$inferInsert
