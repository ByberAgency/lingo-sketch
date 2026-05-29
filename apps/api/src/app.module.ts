import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { AuthModule } from "./auth/auth.module"
import { GameModule } from "./game/game.module"
import { GrammarModule } from "./grammar/grammar.module"
import { HealthModule } from "./health/health.module"

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        AuthModule,
        HealthModule,
        GameModule,
        GrammarModule,
    ],
})
export class AppModule {}
