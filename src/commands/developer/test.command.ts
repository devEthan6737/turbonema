import { Declare, Middlewares, Command, type CommandContext, IgnoreCommand } from 'seyfert';

@Declare({
    name: "test",
    description: "Obtén la velocidad del bot",
    ignore: IgnoreCommand.Slash
})

@Middlewares([ 'staff' ])

export default class TestCommand extends Command {
    async run(ctx: CommandContext) {
        ctx.write({
            content: 'eres admin del bot'
        });
    }
}
