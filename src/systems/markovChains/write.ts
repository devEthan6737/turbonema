import fs from 'fs';

export function writeChain (data: Record<string, Record<string, number>>) {
    fs.writeFileSync('brain.json', JSON.stringify(data, null, 2));
}