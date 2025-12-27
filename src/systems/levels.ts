import { fixNumber, formatNumber, formatNumberWithDots } from "./utils";

export interface Level {
    level: number;
    xp: number;
    max?: number;
}

export interface FormattedLevel {
    level: string,
    xp: string
}

export function getNextLevelXP(level: Level['level']) {
    return level * (13 * (level + 1.5));
}

export function isLevelPassed(level: Level): boolean {
    return level.xp > getNextLevelXP(level.level);
}

export function canUpLevel(level: Level): boolean {
    return (level.max && level.level < level.max && isLevelPassed(level)) || (!level.max && isLevelPassed(level));
}

export function upLevel(level: Level): Level {
    level.xp = fixNumber(level.xp - getNextLevelXP(level.level));
    level.level++;

    if (canUpLevel(level)) return upLevel(level);

    return level;
}

export function addXP(level: Level, xp: number): Level {
    level.xp = fixNumber(level.xp + xp);

    if (canUpLevel(level)) return upLevel(level);

    return level;
}

export function removeXP(level: Level, xp: number): Level {
    level.xp = fixNumber(level.xp - xp);

    while (level.xp < 0 && level.level > 1) {
        level.level--;

        level.xp = fixNumber((getNextLevelXP(level.level)) + level.xp);
    }

    if (level.xp < 0 && level.level === 1) level.xp = 0;

    return level;
}

export function getFormattedLevel(number: Level['level'] | Level['xp'], get: 'level' | 'xp'): FormattedLevel['level'] | FormattedLevel['xp'] {
    switch (get) {
        case 'level':
            if (number > 999999) return formatNumber(number);
            else if (number > 999) return formatNumberWithDots(number);
            else return number.toString();

        case 'xp':
            if (number > 999999) return formatNumber(number);
            else if (number > 999) return formatNumberWithDots(number);
            else return number.toString();
    }
}

const Levels: { names: string[], tiers: number[] } = {
    names: [
        "Novato",
        "NPC",
        "Normie",
        "TikTokizado",
        "Memero Básico",
        "Fanático",
        "Overstimulado",
        "Entusiasta de brainrots",
        "Scrollero",
        "Scrollero máximo",
        "Amante de brainrots",
        "GOOD BOY",
        "EPIC USER",
        "GOD USER",
        "Brainrot Supremo",
        "∞ Brainrot Eterno"
    ],
    tiers: [
        5,    // 0
        10,   // 1
        15,   // 2
        20,   // 3
        30,   // 4
        40,   // 5
        50,   // 6
        60,   // 7
        70,   // 8
        80,   // 9
        90,   // 10
        95,   // 11
        98,   // 12
        100,  // 13
        Infinity // 14
    ]
};

export function getLevelName(level: number): string {
    if (level < 1) return Levels.names[0];

    for (let i = 0; i < Levels.tiers.length; i++) {
        if (level <= Levels.tiers[i]) return Levels.names[i];
    }

    return Levels.names[Levels.names.length - 1];
}
