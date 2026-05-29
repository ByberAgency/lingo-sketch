import { Module } from "@nestjs/common"
import { AuthController } from "./auth.controller"
import { AuthService } from "./auth.service"
import { FirebaseAuthGuard } from "./firebase-auth.guard"
import { FirebaseService } from "./firebase.service"

@Module({
    controllers: [AuthController],
    providers: [FirebaseService, FirebaseAuthGuard, AuthService],
    exports: [FirebaseService, FirebaseAuthGuard, AuthService],
})
export class AuthModule {}
