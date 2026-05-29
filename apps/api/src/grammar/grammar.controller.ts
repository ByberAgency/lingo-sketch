import { Body, Controller, Post, UseGuards } from "@nestjs/common"
import { FirebaseAuthGuard } from "../auth/firebase-auth.guard"
import { GrammarService } from "./grammar.service"

@Controller("grammar")
export class GrammarController {
    constructor(private readonly grammarService: GrammarService) {}

    @Post("check")
    @UseGuards(FirebaseAuthGuard)
    async check(@Body() body: { text: string }) {
        return this.grammarService.check(body.text ?? "")
    }
}
