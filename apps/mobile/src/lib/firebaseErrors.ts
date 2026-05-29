export function formatFirebaseAuthError(err: unknown): string {
    const code =
        typeof err === "object" &&
        err &&
        "code" in err &&
        typeof (err as { code: unknown }).code === "string"
            ? (err as { code: string }).code
            : ""

    if (code.includes("configuration-not-found")) {
        return [
            "Firebase Authentication is not enabled yet.",
            "Open Firebase Console → Authentication → Get started,",
            "then enable Email/Password under Sign-in method.",
        ].join(" ")
    }

    if (code.includes("email-already-in-use")) {
        return "An account with this email already exists. Try signing in instead."
    }

    if (code.includes("weak-password")) {
        return "Password should be at least 6 characters."
    }

    if (code.includes("invalid-email")) {
        return "Please enter a valid email address."
    }

    if (code.includes("wrong-password") || code.includes("invalid-credential")) {
        return "Incorrect email or password."
    }

    if (code.includes("user-not-found")) {
        return "No account found for this email. Create an account first."
    }

    if (err instanceof Error) {
        return err.message.replace(/^Firebase: Error \(auth\/[^)]+\)\.\s*/i, "")
    }

    return "Authentication failed"
}
