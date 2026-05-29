import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from "@nestjs/websockets"
import { Logger, UnauthorizedException } from "@nestjs/common"
import { Server, Socket } from "socket.io"
import { FirebaseService } from "../auth/firebase.service"
import { GameService } from "./game.service"
import type { Stroke } from "./game.types"

type AuthedSocket = Socket & {
    uid?: string
    displayName?: string
}

@WebSocketGateway({
    cors: { origin: true, credentials: true },
    namespace: "/game",
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
    private readonly logger = new Logger(GameGateway.name)

    @WebSocketServer()
    server!: Server

    constructor(
        private readonly gameService: GameService,
        private readonly firebase: FirebaseService,
    ) {}

    afterInit() {
        this.gameService.setServer(this.server)
    }

    async handleConnection(client: AuthedSocket) {
        try {
            const token = client.handshake.auth?.token as string | undefined
            if (!token) throw new UnauthorizedException()

            const decoded = await this.firebase.verifyIdToken(token)
            client.uid = decoded.uid
            client.displayName = decoded.name ?? decoded.email ?? "Player"
            this.logger.log(`Client connected: ${client.uid}`)
        } catch {
            client.disconnect(true)
        }
    }

    handleDisconnect(client: AuthedSocket) {
        if (!client.uid) return
        this.gameService.detachSocket(client.uid, client.id)
        this.logger.log(`Client disconnected: ${client.uid}`)
    }

    @SubscribeMessage("room:enter")
    handleEnter(
        @ConnectedSocket() client: AuthedSocket,
        @MessageBody() body: { roomId: string },
    ) {
        if (!client.uid) return
        this.gameService.attachSocket(body.roomId, client.uid, client.id)
        const room = this.gameService.getRoom(body.roomId)
        client.emit("room:state", this.gameService.buildState(room, client.uid))
    }

    @SubscribeMessage("word:pick")
    handleWordPick(
        @ConnectedSocket() client: AuthedSocket,
        @MessageBody() body: { roomId: string; word: string },
    ) {
        if (!client.uid) return
        try {
            this.gameService.pickWord(body.roomId, client.uid, body.word)
        } catch (err) {
            client.emit("error", { message: err instanceof Error ? err.message : "Error" })
        }
    }

    @SubscribeMessage("draw:stroke")
    handleStroke(
        @ConnectedSocket() client: AuthedSocket,
        @MessageBody() body: { roomId: string; stroke: Stroke },
    ) {
        if (!client.uid) return
        try {
            this.gameService.addStroke(body.roomId, client.uid, body.stroke)
        } catch {
            // ignore invalid strokes
        }
    }

    @SubscribeMessage("draw:done")
    handleDrawDone(
        @ConnectedSocket() client: AuthedSocket,
        @MessageBody() body: { roomId: string },
    ) {
        if (!client.uid) return
        try {
            this.gameService.finishDrawing(body.roomId, client.uid)
        } catch (err) {
            client.emit("error", { message: err instanceof Error ? err.message : "Error" })
        }
    }

    @SubscribeMessage("chat:send")
    async handleChat(
        @ConnectedSocket() client: AuthedSocket,
        @MessageBody() body: { roomId: string; text: string },
    ) {
        if (!client.uid) return
        try {
            await this.gameService.sendChat(body.roomId, client.uid, body.text)
        } catch (err) {
            client.emit("error", { message: err instanceof Error ? err.message : "Error" })
        }
    }
}
