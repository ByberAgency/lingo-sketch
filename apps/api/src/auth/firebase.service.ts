import { Injectable, UnauthorizedException } from "@nestjs/common"
import * as admin from "firebase-admin"
import { readFileSync } from "node:fs"
import env from "../lib/env"

function loadServiceAccount(): admin.ServiceAccount {
    if (env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        return JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON) as admin.ServiceAccount
    }

    if (env.FIREBASE_SERVICE_ACCOUNT_PATH) {
        return JSON.parse(
            readFileSync(env.FIREBASE_SERVICE_ACCOUNT_PATH, "utf8"),
        ) as admin.ServiceAccount
    }

    throw new UnauthorizedException("Firebase credentials are not configured")
}

@Injectable()
export class FirebaseService {
    private ensureInitialized() {
        if (admin.apps.length > 0) {
            return
        }

        if (!env.FIREBASE_PROJECT_ID) {
            throw new UnauthorizedException(
                "Firebase is not configured on the server",
            )
        }

        admin.initializeApp({
            credential: admin.credential.cert(loadServiceAccount()),
            projectId: env.FIREBASE_PROJECT_ID,
        })
    }

    async verifyIdToken(token: string) {
        this.ensureInitialized()
        return admin.auth().verifyIdToken(token)
    }
}
