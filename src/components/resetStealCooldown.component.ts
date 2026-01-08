import { CommandContext, ComponentCommand, type ComponentContext } from 'seyfert';
import { MessageFlags } from 'seyfert/lib/types';
import Database from '../systems/Database/database';
import { Profile } from '../systems/Database/interfaces';
import { createProfile } from '../systems/Database/createProfile';

export default class HelloWorldButton extends ComponentCommand {
    componentType = 'Button' as const;

    filter(ctx: ComponentContext<typeof this.componentType>) {
        return ctx.customId === 'resetstealcooldown';
    }

    async run(ctx: ComponentContext<typeof this.componentType>) {
        const profiles = Database.getInstance('profiles');
        let profile: Profile = await profiles.get(ctx.author.id);

        if (!await profiles.has(ctx.author.id)) {
            profile = await createProfile(ctx as unknown as CommandContext);
            await profiles.set(ctx.author.id, profile);
        } else profile = await profiles.get(ctx.author.id);

        if (profile.nextSteal && profile.nextSteal > Date.now()) return ctx.write({
            content: 'No puedes resetear el cooldown de robo si no tienes un robo en cooldown.',
        });

        if (profile.credits < 100) return ctx.write({
            content: '¡No tienes **100**<:auracoin:1454515337503576114>!'
        });

        profile.credits -= 100;
        profile.nextSteal = undefined;
        await profiles.set(profile.id, profile);

        ctx.write({
            content: '¡Has reseteado el cooldown de robo por **100**<:auracoin:1454515337503576114>!',
            flags: MessageFlags.Ephemeral
        });
    }
}