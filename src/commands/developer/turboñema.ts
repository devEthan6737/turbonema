import { Declare, Options, Middlewares, Command, type CommandContext, IgnoreCommand, createBooleanOption, createStringOption, createIntegerOption } from 'seyfert';
import Database from '../../systems/Database/database';
import { Guild } from '../../systems/Database/interfaces';

const options = {
    enable: createBooleanOption({
        description: "activar o desactivar turboñema",
        required: true
    }),
    integration: createStringOption({
        description: 'El tipo de integración',
        required: true,
        choices: [
            {
                name: 'channel',
                value: 'channel'
            },
            {
                name: 'category',
                value: 'category'
            },
            {
                name: 'global',
                value: 'global'
            }
        ]
    }),
    channelid: createStringOption({
        description: 'Id del canal o categoría / undefined',
        required: true
    }),
    messagelimit: createIntegerOption({
        description: 'Número de palabras máximos para turboñema',
        required: true
    }),
    replychance: createStringOption({
        description: 'Probabilidad de respuesta',
        required: true,
        choices: [
            {
                name: 'ocassionally',
                value: 'ocassionally'
            },
            {
                name: 'frequently',
                value: 'frequently'
            },
            {
                name: 'always',
                value: 'always'
            }
        ]
    })
} as const;

@Declare({
    name: "turboñema",
    description: "Configura el algoritmo de turboñema",
    ignore: IgnoreCommand.Slash
})

@Options(options)

@Middlewares([ 'staff' ])

export default class TurboñemaCommand extends Command {
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

        guild.turboñema.enabled = ctx.options.enable;
        guild.turboñema.integrationType = ctx.options.integration as Guild['turboñema']['integrationType'];
        guild.turboñema.replyChance = ctx.options.replychance as Guild['turboñema']['replyChance'];
        guild.turboñema.channelId = ctx.options.channelid == 'undefined'? undefined : ctx.options.channelid;
        guild.turboñema.messageLimit = ctx.options.messagelimit;

        await guilds.set(ctx.guildId ?? '', guild);

        ctx.write({
            content: `\`\`\`json\n${JSON.stringify(guild, null, 2)}\`\`\``
        });
    }
}
