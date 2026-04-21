import { defineConfig } from "drizzle-kit"
import { config } from "dotenv"

// Load .env.local for local dev — no-op if file doesn't exist (e.g. Railway)
config({ path: ".env.local", override: false })

const url = process.env.DATABASE_URL
if (!url) throw new Error("DATABASE_URL is not set")

export default defineConfig({
  schema: ["./src/db/schema.ts", "./src/db/auth-schema.ts"],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
})
