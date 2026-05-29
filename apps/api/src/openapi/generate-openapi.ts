import {
    OpenAPIRegistry,
    OpenApiGeneratorV31,
    extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi"
import { writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { z } from "zod"

extendZodWithOpenApi(z)

const registry = new OpenAPIRegistry()

const HealthResponse = registry.register(
    "HealthResponse",
    z.object({
        status: z.literal("ok"),
    })
)

const AuthMeResponse = registry.register(
    "AuthMeResponse",
    z.object({
        uid: z.string(),
        email: z.string().email(),
        displayName: z.string().nullable(),
        photoUrl: z.string().nullable(),
    })
)

registry.registerPath({
    method: "get",
    path: "/health",
    operationId: "getHealth",
    summary: "Health check",
    responses: {
        200: {
            description: "OK",
            content: {
                "application/json": {
                    schema: HealthResponse,
                },
            },
        },
    },
})

registry.registerPath({
    method: "get",
    path: "/auth/me",
    operationId: "getAuthMe",
    summary: "Get the authenticated user",
    security: [{ bearerAuth: [] }],
    responses: {
        200: {
            description: "Authenticated user profile",
            content: {
                "application/json": {
                    schema: AuthMeResponse,
                },
            },
        },
        401: {
            description: "Unauthorized",
        },
    },
})

const CreateRoomRequest = registry.register(
    "CreateRoomRequest",
    z.object({
        mode: z.enum(["1v1", "group"]).optional(),
        groupName: z.string().min(1).max(80).optional(),
    }),
)

const CreateRoomResponse = registry.register(
    "CreateRoomResponse",
    z.object({
        roomId: z.string(),
        code: z.string(),
        mode: z.enum(["1v1", "group"]),
        groupName: z.string().nullable().optional(),
    }),
)

const JoinRoomRequest = registry.register(
    "JoinRoomRequest",
    z.object({
        code: z.string().min(4).max(8),
    }),
)

const JoinRoomResponse = registry.register(
    "JoinRoomResponse",
    z.object({
        roomId: z.string(),
        code: z.string(),
        mode: z.enum(["1v1", "group"]),
        groupName: z.string().nullable().optional(),
        playerIndex: z.number().int().min(0).max(7),
    }),
)

const InviteToRoomRequest = registry.register(
    "InviteToRoomRequest",
    z.object({
        emails: z.array(z.string().email()).min(1),
    }),
)

const InviteToRoomResponse = registry.register(
    "InviteToRoomResponse",
    z.object({
        invited: z.array(z.string().email()),
        invitedEmails: z.array(z.string().email()),
        players: z.array(
            z.object({
                uid: z.string(),
                displayName: z.string(),
            }),
        ),
    }),
)

const StartGroupGameResponse = registry.register(
    "StartGroupGameResponse",
    z.object({
        started: z.boolean(),
    }),
)

const GroupInvite = registry.register(
    "GroupInvite",
    z.object({
        id: z.number().int(),
        roomId: z.string(),
        roomCode: z.string(),
        email: z.string().email(),
        groupName: z.string().nullable(),
        invitedByUid: z.string(),
        status: z.string(),
        createdAt: z.string().datetime(),
    }),
)

registry.registerPath({
    method: "post",
    path: "/games/rooms",
    operationId: "createGameRoom",
    summary: "Create a game room",
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: {
                "application/json": {
                    schema: CreateRoomRequest,
                },
            },
        },
    },
    responses: {
        201: {
            description: "Room created",
            content: {
                "application/json": {
                    schema: CreateRoomResponse,
                },
            },
        },
        401: {
            description: "Unauthorized",
        },
    },
})

registry.registerPath({
    method: "post",
    path: "/games/rooms/join",
    operationId: "joinGameRoom",
    summary: "Join a 1:1 game room by code",
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: {
                "application/json": {
                    schema: JoinRoomRequest,
                },
            },
        },
    },
    responses: {
        200: {
            description: "Joined room",
            content: {
                "application/json": {
                    schema: JoinRoomResponse,
                },
            },
        },
        401: {
            description: "Unauthorized",
        },
        404: {
            description: "Room not found",
        },
    },
})

registry.registerPath({
    method: "post",
    path: "/games/rooms/{roomId}/invites",
    operationId: "inviteToGameRoom",
    summary: "Invite registered users to a group game by email",
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({ roomId: z.string() }),
        body: {
            content: {
                "application/json": {
                    schema: InviteToRoomRequest,
                },
            },
        },
    },
    responses: {
        200: {
            description: "Invites sent",
            content: {
                "application/json": {
                    schema: InviteToRoomResponse,
                },
            },
        },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
    },
})

registry.registerPath({
    method: "post",
    path: "/games/rooms/{roomId}/start",
    operationId: "startGroupGame",
    summary: "Host starts a group game",
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({ roomId: z.string() }),
    },
    responses: {
        200: {
            description: "Game started",
            content: {
                "application/json": {
                    schema: StartGroupGameResponse,
                },
            },
        },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
    },
})

registry.registerPath({
    method: "get",
    path: "/games/invites/mine",
    operationId: "listMyGroupInvites",
    summary: "List pending group game invites for the current user",
    security: [{ bearerAuth: [] }],
    responses: {
        200: {
            description: "Pending invites",
            content: {
                "application/json": {
                    schema: z.array(GroupInvite),
                },
            },
        },
        401: { description: "Unauthorized" },
    },
})

const GrammarError = registry.register(
    "GrammarError",
    z.object({
        start: z.number().int(),
        end: z.number().int(),
        bad: z.string(),
        message: z.string(),
        type: z.string(),
    }),
)

const GrammarCheckRequest = registry.register(
    "GrammarCheckRequest",
    z.object({
        text: z.string(),
    }),
)

const GrammarCheckResponse = registry.register(
    "GrammarCheckResponse",
    z.object({
        ok: z.boolean(),
        corrected: z.string(),
        errors: z.array(GrammarError),
    }),
)

registry.registerPath({
    method: "post",
    path: "/grammar/check",
    operationId: "checkGrammar",
    summary: "Check and correct English grammar",
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: {
                "application/json": {
                    schema: GrammarCheckRequest,
                },
            },
        },
    },
    responses: {
        200: {
            description: "Grammar check result",
            content: {
                "application/json": {
                    schema: GrammarCheckResponse,
                },
            },
        },
        401: {
            description: "Unauthorized",
        },
    },
})

const generator = new OpenApiGeneratorV31(registry.definitions)
const document = generator.generateDocument({
    openapi: "3.1.0",
    info: {
        title: "Lingo Sketch API",
        version: "0.0.1",
    },
    servers: [{ url: "http://localhost:3000" }],
})

document.components = {
    ...(document.components || {}),
    securitySchemes: {
        bearerAuth: {
            type: "http",
            scheme: "bearer",
        },
    },
}

writeFileSync(
    resolve(process.cwd(), "openapi.json"),
    `${JSON.stringify(document, null, 2)}\n`
)
