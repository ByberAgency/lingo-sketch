import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core"

export const groupInvites = pgTable("group_invites", {
    id: serial("id").primaryKey(),
    roomId: text("room_id").notNull(),
    roomCode: text("room_code").notNull(),
    email: text("email").notNull(),
    invitedByUid: text("invited_by_uid").notNull(),
    groupName: text("group_name"),
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
})
