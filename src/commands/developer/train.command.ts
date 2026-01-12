import { Declare, Options, Middlewares, Command, type CommandContext, IgnoreCommand, createBooleanOption, createIntegerOption } from 'seyfert';
import Database from '../../systems/Database/database';
import { Guild } from '../../systems/Database/interfaces';

const options = {
    enable: createBooleanOption({
        description: "activar o desactivar entrenamiento de turboñema",
        required: true
    }),
    max: createIntegerOption({
        description: 'Máximo máximo de entrenamientos',
        required: true,
    }),
    min: createIntegerOption({
        description: 'Número mínimo de entrenamientos',
        required: true
    })
} as const;

@Declare({
    name: "train",
    description: "Configura el entrenamiento del algoritmo de turboñema",
    ignore: IgnoreCommand.Slash
})

@Options(options)

@Middlewares([ 'staff' ])

export default class TrainCommand extends Command {
    async run(ctx: CommandContext<typeof options>) {
        const guilds = Database.getInstance('guilds');
        
        let guild: Guild;
        if (!await guilds.has(ctx.guildId ?? '')) {
            guild = {
                id: ctx.guildId ?? '',
                turboñema: {
                    enabled: false,
                    integrationType: 'global',
                    replyChance: 'always',
                    channelId: undefined,
                    messageLimit: 10,
                    train: {
                        min: 100,
                        max: 1000,
                        enabled: false
                    }
                }
            };

            await guilds.set(ctx.guildId ?? '', guild);
        } else guild = await guilds.get(ctx.guildId ?? '');

        guild.turboñema.train.enabled = ctx.options.enable;
        guild.turboñema.train.max = ctx.options.max;
        guild.turboñema.train.min = ctx.options.min;
        await guilds.set(ctx.guildId ?? '', guild);

        ctx.write({
            content: `\`\`\`json\n${JSON.stringify(guild, null, 2)}\`\`\``
        });
    }
}
