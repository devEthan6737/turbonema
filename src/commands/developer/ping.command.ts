import { Declare, Command, type CommandContext, IgnoreCommand } from 'seyfert';
import Database from '../../systems/db/database';

@Declare({
    name: "ping",
    description: "Obtén la velocidad del bot",
    ignore: IgnoreCommand.Slash
})

export default class PingCommand extends Command {
    async run(ctx: CommandContext) {
        const profiles = await Database.getInstance('profiles');
        const dbPing = Math.abs(Date.now() - (await profiles.get(ctx.author.id), Date.now()));
        const wsPing = Math.floor(ctx.client.gateway.latency);
        const clientPing = Math.floor(Date.now() - (ctx.message ?? ctx.interaction)!.createdTimestamp);
        const shardPing = Math.floor((await ctx.client.gateway.get(ctx.shardId)?.ping()) ?? 0);

        ctx.write({ content: `Database: \`${dbPing}ms\`\nAPI: \`${wsPing}ms\`\nMessages: \`${clientPing}ms\`\nShard: \`${shardPing}ms\`` });
    }
}
