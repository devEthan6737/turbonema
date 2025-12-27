import { CommandContext } from "seyfert";
import { Profile } from "./interfaces";
import Database from "./database";
import ms from "ms";

export async function createProfile(ctx: CommandContext): Promise<Profile> {
    const profiles = Database.getInstance('profiles');
    const profile: Profile = {
        id: ctx.author.id,
        brainrots: [],
        level: {
            level: 1,
            xp: 0,
            max: 100
        },
        money: 0,
        farm: {
            available: 20,
            used: 0,
            restart: Date.now() + ms('30m')
        }
    };

    await profiles.set(ctx.author.id, profile);

    return profile;
}