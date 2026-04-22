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
        await sendEmail(user.email, "Reset your Lead Hook password", html, user.id)
      } catch (err) {
        console.error("[password-reset] Failed to send email:", err)
        console.warn("[password-reset] Reset URL:", url)
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
        await sendEmail(user.email, "Verify your Lead Hook email", html, user.id)
      } catch (err) {
        console.error("[email-verification] Failed to send email:", err)
        console.warn("[email-verification] Verify URL:", url)
      }
    },
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
})

export type Session = typeof auth.$Infer.Session
