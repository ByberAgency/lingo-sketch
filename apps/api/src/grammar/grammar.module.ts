import { Module } from "@nestjs/common"
import { AuthModule } from "../auth/auth.module"
import { GeminiService } from "./gemini.service"
import { GrammarController } from "./grammar.controller"
import { GrammarService } from "./grammar.service"

@Module({
    imports: [AuthModule],
    controllers: [GrammarController],
    providers: [GeminiService, GrammarService],
    exports: [GrammarService],
})
export class GrammarModule {}
