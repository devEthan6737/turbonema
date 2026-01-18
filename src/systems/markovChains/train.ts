import { loadChain, writeChain } from './manager';

export async function train (guildId: string, text: string) {
    const data = await loadChain(guildId);
    const words = text.toLowerCase().split(/\s+/);

    for (let i = 0; i < words.length - 1; i++) {
        const current = words[i];
        const next = words[i + 1];

        if (!data[current]) data[current] = {};
        data[current][next] = (data[current][next] || 0) + 1;
    }

    writeChain(guildId, data);
};

export async function trainGIF (guildId: string, context: string, gifUrl: string) {
    const words = context.toLowerCase().split(/\s+/);
    const gifData = await loadChain(guildId + ':gifs');

    for (const word of words) {
        if (!gifData[word]) gifData[word] = {};
        gifData[word][gifUrl] = (gifData[word][gifUrl] || 0) + 1;
    }

    writeChain(`${guildId}:gifs`, gifData);
}