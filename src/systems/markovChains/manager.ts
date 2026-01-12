import Database from '../Database/megadb_adapter';

export interface ChainData {
    [key: string]: { [nextWord: string]: number };
}


export const loadChain = async (guildId: string): Promise<ChainData> => {
    const chains = Database.getInstance(guildId);

    if (!chains.has(guildId)) return {};

    return await chains.get(guildId);
};

export function writeChain (guildId: string, data: Record<string, Record<string, number>>) {
    const chains = Database.getInstance(guildId);

    chains.set(guildId, data);
}