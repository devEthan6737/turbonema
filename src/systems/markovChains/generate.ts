import { loadChain } from "./manager";

export const generate = async (guildId: string, startWord: string, limit: number = 10): Promise<string> => {
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

        result.push(next);
        current = next;
    }

    return result.join(' ');
};