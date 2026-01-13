import { createEvent } from "seyfert";
import Database from "../systems/Database/database";
import MegadbAdapter from '../systems/Database/megadb_adapter';
import { Guild } from "../systems/Database/interfaces";
import { train } from "../systems/markovChains/train";
import { generate, getRandomStartToken } from "../systems/markovChains/generate";

const DISCORD_EMOJI_REGEX = /<a?:\w+:\d+>/g;

const extractEmojis = (text: string): string[] => {
    const unicode = text.match(/\p{Extended_Pictographic}/gu) ?? [];
    const custom = text.match(DISCORD_EMOJI_REGEX) ?? [];
    return [...unicode, ...custom];
};

const isEmojiOnly = (text: string): boolean => {
    return text
        .replace(/\p{Extended_Pictographic}/gu, '')
        .replace(DISCORD_EMOJI_REGEX, '')
        .trim().length === 0;
};



export default createEvent({
    data: { name: 'messageCreate' },
    async run(ctx): Promise<any> {
        if (ctx.author.bot || !ctx.content) return;
        const guilds = Database.getInstance('guilds');
        const guildId = ctx.guildId ?? '';
        const emojiChainId = `${guildId}:emojis`;

        if (!await guilds.has(guildId)) return;

        const guild: Guild = await guilds.get(guildId);
        const chains = MegadbAdapter.getInstance(guildId);
        const emojiChains = MegadbAdapter.getInstance(emojiChainId);
        const chainsLenght = (chains.has(guildId) ? Object.keys(chains.get(guildId)).length : 0) + (emojiChains.has(emojiChainId) ? Object.keys(emojiChains.get(emojiChainId)).length : 0);

        const emojis = extractEmojis(ctx.content);
        const emojiOnly = isEmojiOnly(ctx.content);

        if (
            guild.turboñema.train.enabled &&
            chainsLenght <= guild.turboñema.train.max &&
            !ctx.content.includes('@everyone') &&
            !ctx.content.includes('@here')
        ) {
            if (emojiOnly && emojis.length > 0) {
                train(emojiChainId, emojis.join(' '));
            } else if (
                ctx.content.split(' ').length > 1 &&
                ctx.content.split(' ').length <= 30
            ) {
                train(guildId, ctx.content);
            }
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

                    let random = Math.floor(Math.random() * 101);
                    const limit: number = 
                        random > 65?
                            Math.round(guild.turboñema.messageLimit / 2)
                        : random > 40?
                            Math.round(guild.turboñema.messageLimit)
                        : Math.floor(Math.random() * 3);

                    random = Math.floor(Math.random() * 101);
                    const seed: string = random > 40? ctx.content.split(' ')[0] : getRandomStartToken(chains.get(guildId));
                    const emojiData = emojiChains.has(emojiChainId)? emojiChains.get(emojiChainId) : null;

                    random = Math.floor(Math.random() * 101);

                    if (random > 95 && emojiData) return ctx.react(getRandomStartToken(emojiData));
                    else if (random > 85 && emojiData) ctx.react(getRandomStartToken(emojiData));

                    const response = await generate(guildId, seed, limit);

                    ctx.write({
                        content:
                            random > 68 && emojiData?
                                `${response} ${getRandomStartToken(emojiData)}`
                            : response
                    });
                }
            }
        }
    }
});
