import * as fs from 'fs';

export interface ChainData {
    [key: string]: { [nextWord: string]: number };
}

export const loadChain = (): ChainData => {
    if (!fs.existsSync('brain.json')) return {};
    return JSON.parse(fs.readFileSync('brain.json', 'utf-8'));
};