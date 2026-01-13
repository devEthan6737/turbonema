import { createEvent } from "seyfert";
import Database from "../systems/Database/database";
import MegadbAdapter from '../systems/Database/megadb_adapter';
import { Guild } from "../systems/Database/interfaces";
import { train } from "../systems/markovChains/train";
import { generate } from "../systems/markovChains/generate";

export default createEvent({
    data: { name: 'messageCreate' },
    async run(ctx): Promise<any> {
        if (ctx.author.bot || !ctx.content) return;
        const guilds = Database.getInstance('guilds');
        const guildId = ctx.guildId ?? '';

        if (!await guilds.has(guildId)) return;

        const guild: Guild = await guilds.get(ctx.guildId ?? '');
        const chains = MegadbAdapter.getInstance(guildId);
        const chainsLenght = chains.has(guildId) ? Object.keys(chains.get(guildId)).length : 0;


        if (guild.turboñema.train.enabled) {
            if (chainsLenght >= guild.turboñema.train.max) return;

            train(guildId, ctx.content);
        }

        if (guild.turboñema.enabled) {
            let channelId = '';
            if (guild.turboñema.integrationType === 'channel') channelId = guild.turboñema.channelId ?? '';
            else if (guild.turboñema.integrationType === 'global') channelId = ctx.channelId;
            else if (guild.turboñema.integrationType === 'category') {
                const channel = await ctx.client.channels.fetch(ctx.channelId);

                if (channel.is(['GuildText']) && channel.parentId === guild.turboñema.channelId) channelId = ctx.channelId;
            }

            if (channelId === ctx.channelId) {
                const chance = Math.floor(Math.random() * 101);

                if ((guild.turboñema.replyChance === 'ocassionally' && chance >= 50) || (guild.turboñema.replyChance === 'frequently' && chance >= 70) || guild.turboñema.replyChance === 'always') {
                    if (chainsLenght < guild.turboñema.train.min) return ctx.write({
                        content: `\`TRAIN REMAINING: ${guild.turboñema.train.min - chainsLenght}\``
                    });

                    ctx.write({
                        content: await generate(guildId, ctx.content.split(' ')[0], guild.turboñema.messageLimit)
                    });
                }
            }
        }
    }
});
