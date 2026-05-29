import { Controller, Get, Req, UseGuards } from "@nestjs/common"
import { Request } from "express"
import { AuthUser } from "./auth.types"
import { AuthService } from "./auth.service"
import { FirebaseAuthGuard } from "./firebase-auth.guard"

type AuthenticatedRequest = Request & {
    user: AuthUser
}

@Controller("auth")
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Get("me")
    @UseGuards(FirebaseAuthGuard)
    async me(@Req() request: AuthenticatedRequest) {
        const user = await this.authService.getOrCreateUser(request.user)

        return {
            uid: user.firebaseUid,
            email: user.email,
            displayName: user.displayName,
            photoUrl: user.photoUrl,
        }
    }
}
