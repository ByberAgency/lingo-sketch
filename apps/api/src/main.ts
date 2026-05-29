import { NestFactory } from "@nestjs/core"
import { AppModule } from "./app.module"
import env from "./lib/env"
import { pool } from "./db/db"

async function bootstrap() {
    const app = await NestFactory.create(AppModule)

    const allowedOrigins = env.ALLOWED_ORIGINS
        ? env.ALLOWED_ORIGINS.split(",").map(origin => origin.trim())
        : [env.DASHBOARD_URL]

    app.enableCors({
        origin: allowedOrigins,
        credentials: true,
    })

    await app.listen(Number(env.PORT), "0.0.0.0")
    console.log(`API listening on ${await app.getUrl()}`)

    for (const signal of ["SIGINT", "SIGTERM"]) {
        process.on(signal, async () => {
            await pool.end()
            process.exit(0)
        })
    }
}

bootstrap()
