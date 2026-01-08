import { AutocompleteInteraction, CommandContext, Interaction } from "seyfert";
import { Profile } from "./interfaces";
import Database from "./database";
import ms from "ms";
import { CollectorInteraction } from "seyfert/lib/components/handler";

export async function createProfile(ctx: CommandContext | AutocompleteInteraction | Interaction | CollectorInteraction ): Promise<Profile> {
    const userId = 'author' in ctx? ctx.author.id : ctx.user.id;
    const profiles = Database.getInstance('profiles');
    const profile: Profile = {
        id: userId,
        brainrots: [],
        level: {
            level: 1,
            xp: 0,
            max: 100
        },
        money: 0,
        credits: 0,
        farm: {
            available: 20,
            used: 0,
            restart: Date.now() + ms('30m')
        },
        nextSteal: undefined,
        createdAt: Date.now(),
        onSale: [],
        decks: []
    };

    await profiles.set(userId, profile);

    return profile;
}