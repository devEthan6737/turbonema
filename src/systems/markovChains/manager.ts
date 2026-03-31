import Database from '../database/megadb_adapter';

export interface ChainData {
    [key: string]: { [nextWord: string]: number };
}

export async function loadChain(guildId: string): Promise<ChainData> {
    const chains = Database.getInstance(guildId);

    if (!chains.has(guildId)) return {};

    return await chains.get(guildId);
};

export function writeChain (guildId: string, data: Record<string, Record<string, number>>) {
    const chains = Database.getInstance(guildId);

    chains.set(guildId, data);
}