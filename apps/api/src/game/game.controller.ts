import { Body, Controller, Get, HttpCode, Param, Post, Req, UseGuards } from "@nestjs/common"
import { Request } from "express"
import { AuthUser } from "../auth/auth.types"
import { AuthService } from "../auth/auth.service"
import { FirebaseAuthGuard } from "../auth/firebase-auth.guard"
import { GameService } from "./game.service"
import type { RoomMode } from "./game.types"

type AuthenticatedRequest = Request & {
    user: AuthUser
}

@Controller("games")
export class GameController {
    constructor(
        private readonly gameService: GameService,
        private readonly authService: AuthService,
    ) {}

    @Post("rooms")
    @HttpCode(201)
    @UseGuards(FirebaseAuthGuard)
    async createRoom(
        @Req() request: AuthenticatedRequest,
        @Body() body: { mode?: RoomMode; groupName?: string },
    ) {
        const user = await this.authService.getOrCreateUser(request.user)
        const displayName = user.displayName ?? user.email.split("@")[0] ?? "Player"
        const mode = body.mode === "group" ? "group" : "1v1"
        return this.gameService.createRoom(
            user.firebaseUid,
            displayName,
            user.email,
            mode,
            body.groupName,
        )
    }

    @Post("rooms/join")
    @UseGuards(FirebaseAuthGuard)
    async joinRoom(
        @Req() request: AuthenticatedRequest,
        @Body() body: { code: string },
    ) {
        const user = await this.authService.getOrCreateUser(request.user)
        const displayName = user.displayName ?? user.email.split("@")[0] ?? "Player"
        return this.gameService.joinRoom(
            body.code,
            user.firebaseUid,
            displayName,
            user.email,
        )
    }

    @Post("rooms/:roomId/invites")
    @UseGuards(FirebaseAuthGuard)
    async inviteToRoom(
        @Req() request: AuthenticatedRequest,
        @Param("roomId") roomId: string,
        @Body() body: { emails: string[] },
    ) {
        const user = await this.authService.getOrCreateUser(request.user)
        return this.gameService.inviteToRoom(roomId, user.firebaseUid, body.emails ?? [])
    }

    @Post("rooms/:roomId/start")
    @UseGuards(FirebaseAuthGuard)
    async startGroupGame(
        @Req() request: AuthenticatedRequest,
        @Param("roomId") roomId: string,
    ) {
        const user = await this.authService.getOrCreateUser(request.user)
        return this.gameService.startGroupGame(roomId, user.firebaseUid)
    }

    @Get("invites/mine")
    @UseGuards(FirebaseAuthGuard)
    async myInvites(@Req() request: AuthenticatedRequest) {
        const user = await this.authService.getOrCreateUser(request.user)
        return this.gameService.listMyInvites(user.email)
    }
}
