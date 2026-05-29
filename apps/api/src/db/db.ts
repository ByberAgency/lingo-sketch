import { drizzle } from "drizzle-orm/postgres-js"
import env from "../lib/env"
import * as schema from "./schema"
import { createPostgresClient } from "./postgres-client"

export const pool = createPostgresClient(10)

export const db = drizzle(pool, { schema, logger: false })

export type DB = typeof db
