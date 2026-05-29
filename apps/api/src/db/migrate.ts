import config from "../../drizzle.config"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import { drizzle } from "drizzle-orm/postgres-js"
import { createPostgresClient } from "./postgres-client"

const pool = createPostgresClient(1)

const db = drizzle(pool)

async function main() {
    try {
        await migrate(db, {
            migrationsFolder: config.out!,
        })
        console.log("Migrations applied successfully.")
    } catch (error) {
        if (
            error instanceof Error &&
            (error.message.includes("CONNECT_TIMEOUT") ||
                error.message.includes("ECONNREFUSED") ||
                error.message.includes("ETIMEDOUT"))
        ) {
            console.error(
                "\nCould not reach the database. Cloud SQL public IP often blocks unknown IPs.\n" +
                    "  • GCP: SQL → lingo-sketch → Connections → add your IP to Authorized networks\n" +
                    "  • Or use local Postgres: pnpm db:migrate:local\n",
            )
        }
        throw error
    }
}

main()
    .catch(error => {
        console.error(error)
        process.exit(1)
    })
    .finally(async () => {
        await pool.end()
    })
