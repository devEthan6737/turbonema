import { loadChain } from './load';
import { writeChain } from './write';

export const train = (text: string) => {
    const data = loadChain();
    const words = text.toLowerCase().split(/\s+/);

    for (let i = 0; i < words.length - 1; i++) {
        const current = words[i];
        const next = words[i + 1];

        if (!data[current]) data[current] = {};
        data[current][next] = (data[current][next] || 0) + 1;
    }

    writeChain(data);
};