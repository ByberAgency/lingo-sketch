import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core"

export * from "./group-invites"
import { groupInvites } from "./group-invites"

export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    firebaseUid: text("firebase_uid").notNull().unique(),
    email: text("email").notNull(),
    displayName: text("display_name"),
    photoUrl: text("photo_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
})
