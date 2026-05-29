import postgres from "postgres"
import env from "../lib/env"

function shouldUseSsl(connectionString: string) {
    return (
        env.DATABASE_SSL === "true" ||
        connectionString.includes("sslmode=require")
    )
}

export function createPostgresClient(max: number) {
    const ssl = shouldUseSsl(env.DATABASE_URL) ? ("require" as const) : undefined

    return postgres(env.DATABASE_URL, {
        prepare: false,
        max,
        ssl,
        connect_timeout: 30,
        idle_timeout: 30,
    })
}
