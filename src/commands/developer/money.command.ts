import { Declare, Options, Command, type CommandContext, IgnoreCommand, createStringOption, Middlewares, createIntegerOption } from 'seyfert';
import { Profile } from '../../systems/Database/interfaces';
import Database from '../../systems/Database/database';

const options = {
    action: createStringOption({
        description: 'Selecciona una acción para gestionar el dinero',
        choices: [
            {
                name: 'add',
                value: 'add'
            },
            {
                name: 'remove',
                value: 'remove'
            }
        ],
        required: true
    }),
    userId: createStringOption({
        description: 'La ID del usuario al que gestionar',
        required: true
    }),
    amount: createIntegerOption({
        description: 'La cantidad de dinero',
        required: true
    })
} as const;

@Declare({
    name: "money",
    description: "Gestiona el dinero de un usuario",
    ignore: IgnoreCommand.Slash
})

@Options(options)

@Middlewares([ 'staff' ])

export default class MoneyCommand extends Command {
    async run(ctx: CommandContext<typeof options>) {

        if (ctx.options.action === 'add') {
            const profiles = Database.getInstance('profiles');

            if (!await profiles.has(ctx.options.userId)) return ctx.write({ content: 'El usuario no tiene perfil.' });

            const profile: Profile = await profiles.get(ctx.options.userId);

            profile.money += ctx.options.amount;
            await profiles.set(profile.id, profile);

            ctx.write({
                content: `Le he agregado **${ctx.options.amount} BrainCoins** al usuario **<@${ctx.options.userId}>**`
            });

        } else if (ctx.options.action === 'remove') {
            const profiles = Database.getInstance('profiles');

            if (!await profiles.has(ctx.options.userId)) return ctx.write({ content: 'El usuario no tiene perfil.' });

            const profile: Profile = await profiles.get(ctx.options.userId);

            profile.money -= ctx.options.amount;
            await profiles.set(profile.id, profile);

            ctx.write({
                content: `Le he eliminado **${ctx.options.amount} BrainCoins** al usuario **<@${ctx.options.userId}>**`
            });
        }
    }
}