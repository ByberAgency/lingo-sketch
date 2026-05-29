import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from "@nestjs/common"
import { and, eq } from "drizzle-orm"
import { randomBytes } from "node:crypto"
import type { Server } from "socket.io"
import { AuthService } from "../auth/auth.service"
import { db } from "../db/db"
import { groupInvites } from "../db/schema"
import { GrammarService } from "../grammar/grammar.service"
import {
    answerYesNo,
    isCorrectGuess,
    isYesNoQuestion,
    pickWordSuggestions,
} from "./words"
import type {
    ChatMessage,
    GroupInviteRecord,
    Room,
    RoomMode,
    RoomPlayer,
    RoomStatePayload,
    Stroke,
} from "./game.types"
import { GROUP_MAX_PLAYERS, GROUP_MIN_PLAYERS } from "./game.types"

const GUESS_TIMER_SECONDS = 90
const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

@Injectable()
export class GameService {
    private readonly rooms = new Map<string, Room>()
    private readonly codeToRoomId = new Map<string, string>()
    private server: Server | null = null

    constructor(
        private readonly grammarService: GrammarService,
        private readonly authService: AuthService,
    ) {}

    setServer(server: Server) {
        this.server = server
    }

    createRoom(
        uid: string,
        displayName: string,
        email: string,
        mode: RoomMode = "1v1",
        groupName?: string,
    ) {
        const roomId = randomBytes(8).toString("hex")
        let code = this.generateCode()
        while (this.codeToRoomId.has(code)) {
            code = this.generateCode()
        }

        const player: RoomPlayer = {
            uid,
            displayName,
            email: email.toLowerCase(),
            socketId: null,
        }

        const room: Room = {
            id: roomId,
            code,
            mode,
            groupName: mode === "group" ? groupName?.trim() || "My group" : null,
            maxPlayers: mode === "group" ? GROUP_MAX_PLAYERS : 2,
            hostUid: uid,
            players: [player],
            invitedEmails: [],
            drawerIndex: 0,
            phase: "waiting",
            wordSuggestions: [],
            selectedWord: null,
            strokes: [],
            messages: [],
            messageId: 0,
            guessEndsAt: null,
            solvedBy: null,
            timerHandle: null,
        }

        this.rooms.set(roomId, room)
        this.codeToRoomId.set(code, roomId)

        return { roomId, code, mode, groupName: room.groupName }
    }

    async inviteToRoom(roomId: string, hostUid: string, emails: string[]) {
        const room = this.getRoom(roomId)
        if (room.mode !== "group") {
            throw new BadRequestException("Invites are only for group games")
        }
        if (room.hostUid !== hostUid) {
            throw new ForbiddenException("Only the host can invite players")
        }
        if (room.phase !== "waiting") {
            throw new BadRequestException("Game already started")
        }

        const unique = [...new Set(emails.map(e => e.trim().toLowerCase()).filter(Boolean))]
        if (unique.length === 0) {
            throw new BadRequestException("Add at least one email")
        }

        const found = await this.authService.findUsersByEmails(unique)
        const foundEmails = new Set(found.map(u => u.email.toLowerCase()))
        const missing = unique.filter(e => !foundEmails.has(e))
        if (missing.length > 0) {
            throw new BadRequestException(
                `No registered user for: ${missing.join(", ")}`,
            )
        }

        const hostEmail = room.players.find(p => p.uid === hostUid)?.email
        const invited: string[] = []

        for (const user of found) {
            const email = user.email.toLowerCase()
            if (email === hostEmail) continue
            if (room.invitedEmails.includes(email)) continue
            if (room.players.some(p => p.email === email)) continue

            room.invitedEmails.push(email)
            invited.push(email)

            await db.insert(groupInvites).values({
                roomId: room.id,
                roomCode: room.code,
                email,
                invitedByUid: hostUid,
                groupName: room.groupName,
                status: "pending",
            })
        }

        this.broadcastState(room)

        return {
            invited,
            invitedEmails: room.invitedEmails,
            players: room.players.map(p => ({
                uid: p.uid,
                displayName: p.displayName,
            })),
        }
    }

    async listMyInvites(email: string): Promise<GroupInviteRecord[]> {
        const normalized = email.trim().toLowerCase()
        const rows = await db.query.groupInvites.findMany({
            where: and(
                eq(groupInvites.email, normalized),
                eq(groupInvites.status, "pending"),
            ),
        })

        return rows
            .filter(row => {
                const room = this.rooms.get(row.roomId)
                return room && room.phase === "waiting"
            })
            .map(row => ({
                id: row.id,
                roomId: row.roomId,
                roomCode: row.roomCode,
                email: row.email,
                groupName: row.groupName,
                invitedByUid: row.invitedByUid,
                status: row.status,
                createdAt: row.createdAt,
            }))
    }

    async joinRoom(code: string, uid: string, displayName: string, email: string) {
        const roomId = this.codeToRoomId.get(code.toUpperCase())
        if (!roomId) throw new NotFoundException("Room not found")

        const room = this.rooms.get(roomId)
        if (!room) throw new NotFoundException("Room not found")
        if (room.phase !== "waiting") {
            throw new BadRequestException("Game already in progress")
        }

        const normalizedEmail = email.toLowerCase()
        const existing = room.players.find(p => p.uid === uid)
        if (existing) {
            return {
                roomId,
                code: room.code,
                mode: room.mode,
                groupName: room.groupName,
                playerIndex: room.players.indexOf(existing),
            }
        }

        if (room.players.length >= room.maxPlayers) {
            throw new BadRequestException("Room is full")
        }

        if (room.mode === "group" && uid !== room.hostUid) {
            const invited =
                room.invitedEmails.includes(normalizedEmail) ||
                (await this.hasPendingInvite(room.id, normalizedEmail))
            if (!invited) {
                throw new ForbiddenException(
                    "You need an email invite to join this group",
                )
            }
        }

        room.players.push({
            uid,
            displayName,
            email: normalizedEmail,
            socketId: null,
        })

        void this.markInviteAccepted(room.id, normalizedEmail)

        if (room.mode === "1v1" && room.players.length === 2) {
            this.startGame(room)
        }

        this.broadcastState(room)

        return {
            roomId,
            code: room.code,
            mode: room.mode,
            groupName: room.groupName,
            playerIndex: room.players.length - 1,
        }
    }

    startGroupGame(roomId: string, hostUid: string) {
        const room = this.getRoom(roomId)
        if (room.mode !== "group") {
            throw new BadRequestException("Not a group room")
        }
        if (room.hostUid !== hostUid) {
            throw new ForbiddenException("Only the host can start the game")
        }
        if (room.phase !== "waiting") {
            throw new BadRequestException("Game already started")
        }
        if (room.players.length < GROUP_MIN_PLAYERS) {
            throw new BadRequestException(
                `Need at least ${GROUP_MIN_PLAYERS} players to start`,
            )
        }

        this.startGame(room)
        return { started: true }
    }

    getRoom(roomId: string) {
        const room = this.rooms.get(roomId)
        if (!room) throw new NotFoundException("Room not found")
        return room
    }

    attachSocket(roomId: string, uid: string, socketId: string) {
        const room = this.getRoom(roomId)
        const player = room.players.find(p => p.uid === uid)
        if (!player) throw new BadRequestException("You are not in this room")

        player.socketId = socketId
        this.broadcastState(room)
    }

    detachSocket(uid: string, socketId: string) {
        for (const room of this.rooms.values()) {
            const player = room.players.find(p => p?.uid === uid && p.socketId === socketId)
            if (!player) continue

            player.socketId = null
            this.pushSystemMessage(room, `${player.displayName} disconnected`)
            this.broadcastState(room)
            return room.id
        }
        return null
    }

    pickWord(roomId: string, uid: string, word: string) {
        const room = this.getRoom(roomId)
        this.assertDrawer(room, uid)
        if (room.phase !== "wordPick") {
            throw new BadRequestException("Not in word pick phase")
        }

        const entry = room.wordSuggestions.find(w => w.word === word)
        if (!entry) throw new BadRequestException("Invalid word choice")

        room.selectedWord = entry
        room.strokes = []
        room.phase = "drawing"
        const guesserLabel = room.mode === "group" ? "guessers" : "guesser"
        this.pushSystemMessage(room, `Drawing started! The ${guesserLabel} can see your strokes.`)
        this.broadcastState(room)
    }

    addStroke(roomId: string, uid: string, stroke: Stroke) {
        const room = this.getRoom(roomId)
        this.assertDrawer(room, uid)
        if (room.phase !== "drawing") return

        room.strokes.push(stroke)
        this.emitToRoom(room, "draw:stroke", { stroke })
    }

    finishDrawing(roomId: string, uid: string) {
        const room = this.getRoom(roomId)
        this.assertDrawer(room, uid)
        if (room.phase !== "drawing") return

        room.phase = "guessing"
        room.guessEndsAt = Date.now() + GUESS_TIMER_SECONDS * 1000
        this.clearTimer(room)
        room.timerHandle = setInterval(() => this.tickTimer(room), 1000)
        this.pushSystemMessage(
            room,
            "Drawing done! Ask yes/no questions or guess the word.",
        )
        this.broadcastState(room)
    }

    async sendChat(roomId: string, uid: string, text: string) {
        const room = this.getRoom(roomId)
        const playerIndex = this.playerIndex(room, uid)
        if (playerIndex < 0) throw new BadRequestException("You are not in this room")
        if (room.phase !== "guessing" || !room.selectedWord) return

        if (playerIndex === room.drawerIndex) return

        const trimmed = text.trim()
        if (!trimmed) return

        const grammar = await this.grammarService.check(trimmed)
        const displayText = grammar.corrected
        const question = isYesNoQuestion(displayText)
        const player = room.players[playerIndex]

        this.pushMessage(room, {
            kind: question ? "question" : "guess",
            text: displayText,
            authorUid: uid,
            authorName: player.displayName,
            originalText: trimmed,
            corrected: grammar.ok ? null : grammar.corrected,
            errors: grammar.errors,
            grammarOk: grammar.ok,
        })

        if (!grammar.ok) {
            this.pushMessage(room, {
                kind: "guard",
                text: grammar.corrected,
                corrected: grammar.corrected,
                message: grammar.errors[0]?.message,
                authorName: "Gus",
            })
        }

        if (question) {
            this.pushMessage(room, {
                kind: "answer",
                text: answerYesNo(displayText, room.selectedWord.word),
                authorName: room.players[room.drawerIndex]?.displayName ?? "Drawer",
            })
        } else if (isCorrectGuess(displayText, room.selectedWord.word)) {
            this.resolveRound(room, player.displayName)
        } else {
            this.broadcastState(room)
        }
    }

    private startGame(room: Room) {
        room.drawerIndex = Math.floor(Math.random() * room.players.length)
        room.phase = "wordPick"
        room.wordSuggestions = pickWordSuggestions(3)
        room.selectedWord = null
        room.strokes = []
        room.messages = []
        room.messageId = 0
        room.guessEndsAt = null
        room.solvedBy = null
        this.clearTimer(room)

        const drawer = room.players[room.drawerIndex]
        this.pushSystemMessage(
            room,
            `${drawer?.displayName ?? "Someone"} will draw first. Pick a word to draw!`,
        )
        this.broadcastState(room)
    }

    private async markInviteAccepted(roomId: string, email: string) {
        await db
            .update(groupInvites)
            .set({ status: "accepted" })
            .where(
                and(
                    eq(groupInvites.roomId, roomId),
                    eq(groupInvites.email, email),
                    eq(groupInvites.status, "pending"),
                ),
            )
    }

    private async hasPendingInvite(roomId: string, email: string) {
        const row = await db.query.groupInvites.findFirst({
            where: and(
                eq(groupInvites.roomId, roomId),
                eq(groupInvites.email, email),
                eq(groupInvites.status, "pending"),
            ),
        })
        return row != null
    }

    private tickTimer(room: Room) {
        if (room.phase !== "guessing") {
            this.clearTimer(room)
            return
        }

        const left = this.secondsLeft(room)
        if (left != null && left <= 0) {
            this.clearTimer(room)
            room.phase = "solved"
            room.solvedBy = null
            this.pushSystemMessage(
                room,
                `Time's up! The word was "${room.selectedWord?.word ?? "?"}".`,
            )
        }

        this.broadcastState(room)
    }

    private resolveRound(room: Room, winnerName: string) {
        this.clearTimer(room)
        room.phase = "solved"
        room.solvedBy = winnerName
        this.pushSystemMessage(room, `${winnerName} guessed it!`)
        this.broadcastState(room)
    }

    private pushSystemMessage(room: Room, text: string) {
        this.pushMessage(room, { kind: "system", text })
    }

    private pushMessage(room: Room, partial: Omit<ChatMessage, "id">) {
        room.messages.push({ id: ++room.messageId, ...partial })
    }

    private clearTimer(room: Room) {
        if (room.timerHandle) {
            clearInterval(room.timerHandle)
            room.timerHandle = null
        }
    }

    private playerIndex(room: Room, uid: string) {
        return room.players.findIndex(p => p.uid === uid)
    }

    private assertDrawer(room: Room, uid: string) {
        const index = this.playerIndex(room, uid)
        if (index !== room.drawerIndex) {
            throw new BadRequestException("Only the drawer can do that")
        }
    }

    private secondsLeft(room: Room): number | null {
        if (room.guessEndsAt == null) return null
        return Math.max(0, Math.ceil((room.guessEndsAt - Date.now()) / 1000))
    }

    buildState(room: Room, uid: string): RoomStatePayload {
        const index = this.playerIndex(room, uid)
        const isDrawer = index === room.drawerIndex
        const isHost = uid === room.hostUid
        const players: RoomStatePayload["players"] = room.players.map(p => ({
            uid: p.uid,
            displayName: p.displayName,
            connected: p.socketId != null,
        }))

        return {
            roomId: room.id,
            code: room.code,
            mode: room.mode,
            groupName: room.groupName,
            maxPlayers: room.maxPlayers,
            minPlayers: room.mode === "group" ? GROUP_MIN_PLAYERS : 2,
            phase: room.phase,
            players,
            invitedEmails: room.invitedEmails,
            yourRole:
                index < 0 ? "spectator" : isDrawer ? "drawer" : "guesser",
            isHost,
            canStart:
                room.mode === "group" &&
                isHost &&
                room.phase === "waiting" &&
                room.players.length >= GROUP_MIN_PLAYERS,
            drawerUid: room.players[room.drawerIndex]?.uid ?? null,
            hint: room.selectedWord && !isDrawer ? room.selectedWord.hint : null,
            word: room.selectedWord && isDrawer ? room.selectedWord.word : null,
            wordSuggestions: isDrawer && room.phase === "wordPick" ? room.wordSuggestions : null,
            strokes: room.strokes,
            messages: room.messages,
            secondsLeft: this.secondsLeft(room),
            solvedBy: room.solvedBy,
            solvedWord: room.phase === "solved" ? room.selectedWord?.word ?? null : null,
        }
    }

    broadcastState(room: Room) {
        if (!this.server) return

        for (const player of room.players) {
            if (!player.socketId) continue
            const state = this.buildState(room, player.uid)
            this.server.to(player.socketId).emit("room:state", state)
        }
    }

    private emitToRoom(room: Room, event: string, payload: unknown) {
        if (!this.server) return
        for (const player of room.players) {
            if (player.socketId) {
                this.server.to(player.socketId).emit(event, payload)
            }
        }
    }

    private generateCode() {
        let code = ""
        for (let i = 0; i < 5; i++) {
            code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)]
        }
        return code
    }
}
