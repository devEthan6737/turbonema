import { loadChain } from "./manager";

export async function generate (guildId: string, startWord: string, limit: number = 10): Promise<string> {
    const data = await loadChain(guildId);
    let current = startWord.toLowerCase();
    let result = [current];

    for (let i = 0; i < limit; i++) {
        const nextWords = data[current];
        if (!nextWords) break;

        const options = Object.keys(nextWords);
        const totalWeight = options.reduce((sum, word) => sum + nextWords[word], 0);

        let random = Math.random() * totalWeight;
        let next = "";

        for (const word of options) {
            random -= nextWords[word];
            if (random <= 0) {
                next = word;
                break;
            }
        }

        if (!next) break;

        const last = result[result.length - 1];
        let repeatCount = 0;
        
        if (next === last) repeatCount++;
        else repeatCount = 0;

        if (repeatCount >= 3) break;

        result.push(next);
        current = next;
    }

    return result.join(' ');
};

export function getRandomStartToken(data: Record<string, Record<string, number>>): string {
    const tokens = Object.keys(data);
    if (tokens.length === 0) return "";

    const weights = tokens.map(token => {
        const nexts = data[token];
        const total = Object.values(nexts).reduce((a, b) => a + b, 0);

        return Math.sqrt(total);
    });

    const sum = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * sum;

    for (let i = 0; i < tokens.length; i++) {
        r -= weights[i];
        if (r <= 0) return tokens[i];
    }

    return tokens[tokens.length - 1];
}

export function getEmojiSeed(emojis: string[], emojiChain: any): string {
    if (emojis.length > 0 && Math.random() < 0.6) return emojis[0];

    return getRandomStartToken(emojiChain);
}

export async function pickBestSeed(guildId: string, words: string[]): Promise<string> {
    const data = await loadChain(guildId);

    let best = words[0];
    let bestScore = 0;

    for (const w of words) {
        const nexts = data[w];
        if (!nexts) continue;

        const score = Object.values(nexts).reduce((a,b)=>a + b,0);

        if (score > bestScore) {
            best = w;
            bestScore = score;
        }
    }

    return best;
}

export async function seedHasData(guildId: string, seed: string): Promise<boolean> {
    const data = await loadChain(guildId);
    return seed in data;
}