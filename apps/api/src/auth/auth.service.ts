import { Injectable } from "@nestjs/common"
import { eq, inArray, sql } from "drizzle-orm"
import { db } from "../db/db"
import { users } from "../db/schema"
import { AuthUser } from "./auth.types"

@Injectable()
export class AuthService {
    async getOrCreateUser(authUser: AuthUser) {
        const existing = await db.query.users.findFirst({
            where: eq(users.firebaseUid, authUser.uid),
        })

        if (existing) {
            const [updated] = await db
                .update(users)
                .set({
                    email: authUser.email,
                    displayName: authUser.displayName,
                    photoUrl: authUser.photoUrl,
                    updatedAt: new Date(),
                })
                .where(eq(users.firebaseUid, authUser.uid))
                .returning()

            return updated ?? existing
        }

        const [created] = await db
            .insert(users)
            .values({
                firebaseUid: authUser.uid,
                email: authUser.email,
                displayName: authUser.displayName,
                photoUrl: authUser.photoUrl,
            })
            .returning()

        return created
    }

    async findUserByEmail(email: string) {
        const normalized = email.trim().toLowerCase()
        return (
            (await db.query.users.findFirst({
                where: sql`lower(${users.email}) = ${normalized}`,
            })) ?? null
        )
    }

    async findUsersByEmails(emails: string[]) {
        const normalized = [...new Set(emails.map(e => e.trim().toLowerCase()).filter(Boolean))]
        if (normalized.length === 0) return []

        return db
            .select()
            .from(users)
            .where(
                inArray(
                    sql<string>`lower(${users.email})`,
                    normalized,
                ),
            )
    }
}
