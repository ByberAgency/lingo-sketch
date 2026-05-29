export interface AuthUser {
    uid: string
    email: string
    displayName: string | null
    photoUrl: string | null
}

export interface AuthenticatedRequest {
    user: AuthUser
}
