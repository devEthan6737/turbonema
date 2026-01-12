import { Declare, Options, Command, type CommandContext, IgnoreCommand, createBooleanOption, createIntegerOption } from 'seyfert';
import Database from '../../systems/Database/database';

@Declare({
    name: "train",
    description: "Configura el entrenamiento del algoritmo de turboñema",
    ignore: IgnoreCommand.Slash
})

@Options({
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
})

export default class TrainCommand extends Command {
    async run(ctx: CommandContext) {
    }
}
