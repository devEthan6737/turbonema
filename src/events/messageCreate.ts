import { createEvent } from "seyfert";
import Database from "../systems/database/database";
import MegadbAdapter from '../systems/database/megadb_adapter';
import { Guild } from "../systems/database/interfaces";
import { train, trainGIF } from "../systems/markovChains/train";
import { generate, getRandomStartToken, pickBestSeed, seedHasData } from "../systems/markovChains/generate";

const DISCORD_EMOJI_REGEX = /<a?:\w+:\d+>/g;
const GIF_REGEX = /https?:\/\/(?:www\.)?(?:tenor\.com\/view\/\S+|media\.tenor\.com\/\S+\.(?:gif|webp))/gi;


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

const containsGIF = (text: string): boolean => {
    return text.match(GIF_REGEX) !== null;
}

const getFirstGif = (text: string): string | null => {
    const matches = text.match(GIF_REGEX);
    return matches?.[0] ?? null;
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
        const gif = getFirstGif(ctx.content);
        const hasGif = containsGIF(ctx.content);

        if (
            guild.turboñema.train.enabled &&
            chainsLenght <= guild.turboñema.train.max &&
            !ctx.content.includes('@everyone') &&
            !ctx.content.includes('@here')
        ) {
            if (emojiOnly && emojis.length > 0) {
                train(emojiChainId, emojis.join(' '));
            } else {
                if (hasGif && gif) {
                    const cleanText = ctx.content.replace(gif, '').trim();

                    if (cleanText.length > 0) trainGIF(guildId, cleanText, gif);

                    ctx.content = cleanText;
                }


                if (
                    ctx.content.split(' ').length > 1 &&
                    ctx.content.split(' ').length <= 30
                ) {
                    train(guildId, ctx.content);
                }
            }
        }

        if (guild.turboñema.enabled) {
            const messages = MegadbAdapter.getInstance('messagesIA');
            if (!messages.has('msgs')) messages.set('msgs', []);
            const msgs = messages.get('msgs'); // entrenamiento de la ia
            msgs.push({
                user: ctx.content,
                turboñema: await generate(guildId, await pickBestSeed(guildId, ctx.content.split(' ')))
            });
            messages.set('msgs', msgs);

            let channelId = '';
            if (guild.turboñema.integrationType === 'channel') channelId = guild.turboñema.channelId ?? '';
            else if (guild.turboñema.integrationType === 'global') channelId = ctx.channelId;
            else if (guild.turboñema.integrationType === 'category') {
                const channel = await ctx.client.channels.fetch(ctx.channelId);

                if (channel.is(['GuildText']) && channel.parentId === guild.turboñema.channelId) channelId = ctx.channelId;
            }

            if (channelId === ctx.channelId || ctx.mentions.users.some(u => u.id === ctx.client.botId) || ctx.referencedMessage?.author.id === ctx.client.botId) {
                const chance = Math.floor(Math.random() * 101);

                if ((guild.turboñema.replyChance === 'idleuser' && chance >= 99) || (guild.turboñema.replyChance === 'ocassionally' && chance >= 96) || (guild.turboñema.replyChance === 'frequently' && chance >= 88) || guild.turboñema.replyChance === 'always') {
                    let random = Math.floor(Math.random() * 101);
                    const limit: number = 
                        random > 65?
                            Math.round(guild.turboñema.messageLimit / 2)
                        : random > 40?
                            Math.round(guild.turboñema.messageLimit)
                        : Math.floor(Math.random() * 3);

                    random = Math.floor(Math.random() * 101);
                    // const seed: string = random > 40? ctx.content.split(' ')[0] : getRandomStartToken(chains.get(guildId));
                    const seed: string = random > 40? await pickBestSeed(guildId, ctx.content.split(' ')) : getRandomStartToken(chains.get(guildId));
                    const emojiData = emojiChains.has(emojiChainId)? emojiChains.get(emojiChainId) : null;

                    random = Math.floor(Math.random() * 101);

                    if (random < 2 && await seedHasData(`${guildId}:gifs`, seed)) {
                        const gifResponse = await generate(`${guildId}:gifs`, seed, 1);

                        random = Math.floor(Math.random() * 101);
                        return ctx.write({
                            content: random > 50 ? `${gifResponse} ${await generate(guildId, seed, limit)}` : gifResponse
                        });
                    }

                    if (random > 95 && emojiData) return ctx.react(getRandomStartToken(emojiData));
                    else if (random > 85 && emojiData) ctx.react(getRandomStartToken(emojiData));

                    const response = await generate(guildId, seed, limit);

                    ctx.write({
                        content:
                            random > 68 && emojiData?
                                `${response} ${getRandomStartToken(emojiData)}`
                            : response,
                        allowed_mentions: {
                            parse: [ 'users' ],
                            roles: []
                        }
                    });
                }
            }
        }
    }
});
