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

export const rarityColors: Record<string, string> = {
    'very_common': '#7f8c8d',
    'common': '#95a5a6',
    'uncommon': '#2ecc71',
    'rare': '#3498db',
    'epic': '#9b59b6',
    'legendary': '#f1c40f',
    'mythical': '#e67e22',
    'exotic': '#1abc9c',
    'ungenerable': '#34495e',
    'cursed': '#e74c3c'
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

export interface Deck {
    id: string;
    name: string;
    cardIds: Brainrot['id'][];
    rarity: Brainrot['rarity'];
    reward: {
        money?: Profile['money'];
        credits?: Profile['credits'];
        exclusiveCardId?: Brainrot['id'];
        xp?: Profile['level']['xp'];
    };
}

export interface BrainrotInventory {
    id: Brainrot['id'];
    amount: number;
    protectedUntil: number | undefined;
}

interface FarmConfig {
    available: number;
    used: number;
    restart: number; // date
}

interface DeckInventory {
    id: Deck['id'],
    collectedCards: Brainrot['id'][],
    claimed?: boolean
}

export interface Profile {
    id: string;
    brainrots: BrainrotInventory[];
    level: Level;
    money: number;
    credits: number;
    farm: FarmConfig;
    nextSteal: number | undefined;
    createdAt: number;
    onSale: Brainrot['id'][];
    decks: DeckInventory[];
}

export interface Shop {
    authorId: Profile['id'],
    brainrotId: Brainrot['id'],
    postDate: number, // date
    price: number
}