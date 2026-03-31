import { Declare, Options, Middlewares, Command, type CommandContext, IgnoreCommand, createStringOption } from 'seyfert';
import MegadbAdapter from '../../systems/database/megadb_adapter';

const options = {
    action: createStringOption({
        description: 'acción a realizar',
        required: true,
        choices: [
            {
                name: 'reset',
                value: 'reset'
            },
            {
                name: 'amount',
                value: 'amount'
            }
        ]
    })
} as const;

@Declare({
    name: "chains",
    description: "Gestiona las cadenas del algoritmo de turboñema",
    ignore: IgnoreCommand.Slash
})

@Options(options)

@Middlewares([ 'staff' ])

export default class ChainsCommand extends Command {
    async run(ctx: CommandContext<typeof options>) {
        const guildId = ctx.guildId ?? '';
        const emojiChainId = `${guildId}:emojis`;
        const chains = MegadbAdapter.getInstance(guildId);
        const emojiChains = MegadbAdapter.getInstance(emojiChainId);
        const chainsLenght = (chains.has(guildId) ? Object.keys(chains.get(guildId)).length : 0) + (emojiChains.has(emojiChainId) ? Object.keys(emojiChains.get(emojiChainId)).length : 0);

        if (ctx.options.action === 'reset') {
            chains.delete(guildId);
            emojiChains.delete(emojiChainId);

            ctx.write({
                content: `**CHAINS RESET**\nSe han eliminado ${chainsLenght} cadenas de entrenamiento.`
            });
        } else if (ctx.options.action === 'amount') {
            ctx.write({
                content: `**CHAINS AMOUNT**\nExisten ${chainsLenght} cadenas de entrenamiento.`
            });
        }
    }
}
