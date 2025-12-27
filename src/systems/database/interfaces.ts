import { Level } from "../levels";

export type rarities = 'very_common' | 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythical' | 'exotic' | 'ungenerable' | 'cursed';

export const raritiesArray: rarities[] = [ 'very_common', 'common', 'uncommon', 'rare', 'epic', 'legendary', 'mythical', 'exotic', 'ungenerable', 'cursed' ] as const;

export const RarityMap: Record<rarities, { translation: string, emoji: string }> = {
    'very_common': {
        translation: 'Muy común',
        emoji: '⚪'
    },
    'common': {
        translation: 'Común',
        emoji: '⚪'
    },
    'uncommon': {
        translation: 'Poco común',
        emoji: '🔵'
    },
    'rare': {
        translation: 'Raro',
        emoji: '🔵'
    },
    'epic': {
        translation: 'Épico',
        emoji: '🟣'
    },
    'legendary': {
        translation: 'Legendario',
        emoji: '🟡'
    },
    'mythical': {
        translation: 'Mítico',
        emoji: '🟠'
    },
    'exotic': {
        translation: 'Exótico',
        emoji: '🔴'
    },
    'ungenerable': {
        translation: 'Inconseguible',
        emoji: '🔴'
    },
    'cursed': {
        translation: 'Cursed',
        emoji: '⬛'
    }
} as const;

export const rarityOrder: Record<rarities, number> = {
    very_common: 0,
    common: 1,
    uncommon: 2,
    rare: 3,
    epic: 4,
    legendary: 5,
    mythical: 6,
    exotic: 7,
    cursed: 8,
    ungenerable: 9
} as const;

export interface Brainrot {
    id: string;
    name: string;
    message: string;
    base64Image: string;
    audioFileName: string;
    rarity: rarities;
    buyPrice: number;
    scrapValue: number;
    xpReward: number;
    levelRequeried: number;
}

export interface BrainrotInventory {
    id: Brainrot['id'];
    amount: number;
}

interface FarmConfig {
    available: number;
    used: number;
    restart: number;
}

export interface Profile {
    id: string;
    brainrots: BrainrotInventory[];
    level: Level;
    money: number;
    farm: FarmConfig;
}