import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "@/db"
import * as authSchema from "@/db/auth-schema"
import { sendEmail } from "./resend"

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: authSchema,
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      const html = `
        <p>Hi ${user.name ?? user.email},</p>
        <p>Click the link below to reset your Lead Hook password. This link expires in 1 hour.</p>
        <p><a href="${url}">Reset my password →</a></p>
        <p style="color:#999;font-size:12px;">If you didn't request a password reset, you can safely ignore this email.</p>
      `
      try {
        await sendEmail(user.email, "Reset your Lead Hook password", html)
      } catch {
        console.warn("[password-reset] Resend not configured — reset URL:", url)
      }
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      const html = `
        <p>Hi ${user.name ?? user.email},</p>
        <p>Click the link below to verify your Lead Hook account:</p>
        <p><a href="${url}">Verify my email →</a></p>
        <p style="color:#999;font-size:12px;">If you didn't sign up for Lead Hook, you can ignore this email.</p>
      `
      try {
        await sendEmail(user.email, "Verify your Lead Hook email", html)
      } catch {
        // Log URL to console so dev environments without Resend still work
        console.warn("[email-verification] Resend not configured — verify URL:", url)
      }
    },
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
})

export type Session = typeof auth.$Infer.Session
