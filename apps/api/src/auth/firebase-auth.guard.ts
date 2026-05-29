import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from "@nestjs/common"
import { Request } from "express"
import { AuthUser } from "./auth.types"
import { FirebaseService } from "./firebase.service"

type AuthenticatedRequest = Request & {
    user?: AuthUser
}

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
    constructor(private readonly firebase: FirebaseService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
        const authHeader = request.headers.authorization
        const [type, token] = authHeader?.split(" ") ?? []

        if (type !== "Bearer" || !token) {
            throw new UnauthorizedException("Authentication is required")
        }

        try {
            const decoded = await this.firebase.verifyIdToken(token)
            request.user = {
                uid: decoded.uid,
                email: decoded.email ?? "",
                displayName: decoded.name ?? null,
                photoUrl: decoded.picture ?? null,
            }
            return true
        } catch {
            throw new UnauthorizedException("Invalid or expired token")
        }
    }
}
