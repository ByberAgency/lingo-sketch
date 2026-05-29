import * as dotenv from "dotenv"
import * as path from "path"
import { z } from "zod"

dotenv.config({ path: path.resolve(process.cwd(), "../../.env") })
// Shell/CI vars (e.g. db:migrate:local) must win over .env files.
dotenv.config({ path: path.resolve(process.cwd(), ".env") })

const envSchema = z.object({
    NODE_ENV: z.string().optional(),
    PORT: z.string().default("3000"),
    DATABASE_URL: z.string().min(1),
    DATABASE_SSL: z.enum(["true", "false"]).default("true"),
    DASHBOARD_URL: z.string().default("http://localhost:5173"),
    ALLOWED_ORIGINS: z.string().optional(),
    FIREBASE_PROJECT_ID: z.string().default(""),
    FIREBASE_SERVICE_ACCOUNT_PATH: z.string().default(""),
    /** Raw JSON for Cloud Run / Secret Manager (preferred in production) */
    FIREBASE_SERVICE_ACCOUNT_JSON: z.string().optional(),
    GEMINI_API_KEY: z.string().default(""),
    GEMINI_MODEL: z.string().default("gemini-2.0-flash"),
})

export default envSchema.parse(process.env)
