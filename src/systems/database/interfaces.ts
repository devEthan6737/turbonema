export interface Guild {
    id: string;
    turboñema: {
        enabled: boolean;
        integrationType: 'channel' | 'category' | 'global';
        replyChance: 'idleuser' | 'ocassionally' | 'frequently' | 'always';
        channelId: string | undefined;
        messageLimit: number;
        train: {
            min: number;
            max: number;
            enabled: boolean;
        }
    }
}