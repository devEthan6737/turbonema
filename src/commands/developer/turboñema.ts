import { Declare, Options, Command, type CommandContext, IgnoreCommand, createBooleanOption, createStringOption, createIntegerOption } from 'seyfert';
import Database from '../../systems/Database/database';

@Declare({
    name: "turboñema",
    description: "Configura el algoritmo de turboñema",
    ignore: IgnoreCommand.Slash
})

@Options({
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
    })
})

export default class TurboñemaCommand extends Command {
    async run(ctx: CommandContext) {
    }
}
