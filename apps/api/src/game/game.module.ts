import { Module } from "@nestjs/common"
import { AuthModule } from "../auth/auth.module"
import { GrammarModule } from "../grammar/grammar.module"
import { GameController } from "./game.controller"
import { GameGateway } from "./game.gateway"
import { GameService } from "./game.service"

@Module({
    imports: [AuthModule, GrammarModule],
    controllers: [GameController],
    providers: [GameService, GameGateway],
})
export class GameModule {}
